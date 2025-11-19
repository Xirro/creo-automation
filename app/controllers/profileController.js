const bcrypt = require('bcryptjs');
const withRoleConn = require('../config/roleConn');
const db = require('../config/db');

// ProfileController
// - Show profile
// - Update username
// - Change password
//
// This is a template controller. It prefers to use a short-lived minimally-privileged
// connection via `withRoleConn('user')` when available. If that helper throws (credentials
// not configured), it falls back to the app DB pool via `db.getSqlConnection()`.

// Helper: runQueryWithUserRole(fn)
// Executes the provided async function with a connection object that supports
// promise-based `query`/`execute`. The connection is closed automatically.
async function runQueryWithUserRole(fn) {
    try {
        return await withRoleConn('user', fn);
    } catch (e) {
        // Fallback to app-level pool connection if available
        if (db && typeof db.getSqlConnection === 'function' && db.isInitialized()) {
            const conn = await db.getSqlConnection();
            try {
                return await fn(conn);
            } finally {
                try { await conn.release(); } catch (er) { /* ignore */ }
            }
        }
        throw e;
    }
}

// Render the profile page for the current user
exports.showProfile = async function(req, res) {
    const username = req.session && req.session.username ? req.session.username : null;
    if (!username) return res.redirect('/login');

    try {
        const rows = await runQueryWithUserRole(async (conn) => {
            const [r] = await conn.query('SELECT id, username, email, role, createdAt FROM users WHERE username = ? LIMIT 1', [username]);
            return r;
        });
        if (!rows || rows.length === 0) return res.status(404).send('User not found');
        const user = rows[0];
        res.locals.title = 'Profile';
        return res.render('Main/profile', { user: user, error: null, message: null });
    } catch (err) {
        console.error('profile.showProfile: DB error', err);
        return res.status(500).send('Server error');
    }
};

// Update username (POST)
exports.updateUsername = async function(req, res) {
    const newUsername = (req.body.username || '').trim();
    const currentUsername = req.session && req.session.username ? req.session.username : null;
    if (!currentUsername) return res.redirect('/login');

    if (!newUsername || !/^[A-Za-z0-9_.-]{3,64}$/.test(newUsername)) {
        res.locals.title = 'Profile';
        return res.render('Main/profile', { user: { username: currentUsername }, error: 'Invalid username. 3-64 chars; letters, numbers, dot, underscore or dash allowed.', message: null });
    }

    // helper to fetch full user row (id, username, email, role, createdAt)
    async function fetchUserRow(uname) {
        try {
            const rows = await runQueryWithUserRole(async (conn) => {
                const [r] = await conn.query('SELECT id, username, email, role, createdAt FROM users WHERE username = ? LIMIT 1', [uname]);
                return r;
            });
            return (rows && rows.length > 0) ? rows[0] : null;
        } catch (e) {
            console.warn('fetchUserRow error for', uname, e && e.message ? e.message : e);
            return null;
        }
    }

    try {
        // Fetch current user id (to allow renaming to same username owned by this user)
        const currentRows = await runQueryWithUserRole(async (conn) => {
            const [r] = await conn.query('SELECT id FROM users WHERE username = ? LIMIT 1', [currentUsername]);
            return r;
        });
        const currentUserId = (currentRows && currentRows.length > 0) ? currentRows[0].id : null;

        // Ensure username is not taken by *another* user
        const existing = await runQueryWithUserRole(async (conn) => {
            const [r] = await conn.query('SELECT id FROM users WHERE username = ? LIMIT 1', [newUsername]);
            return r;
        });
        if (existing && existing.length > 0 && existing[0].id !== currentUserId) {
            const userRow = await fetchUserRow(currentUsername) || { username: currentUsername };
            res.locals.title = 'Profile';
            return res.render('Main/profile', { user: userRow, error: 'Username already in use.', message: null });
        }

        // If the username is unchanged, simply render success without performing DB update
        if (newUsername === currentUsername) {
            const userRow = await fetchUserRow(currentUsername) || { username: currentUsername };
            res.locals.title = 'Profile';
            return res.render('Main/profile', { user: userRow, error: null, message: 'Username unchanged.' });
        }

        // Perform update under user role (short-lived conn)
        await runQueryWithUserRole(async (conn) => {
            const now = new Date();
            await conn.query('UPDATE users SET username = ?, updatedAt = ? WHERE username = ?', [newUsername, now, currentUsername]);
            // Best-effort audit
            try { await conn.query('INSERT INTO admin_actions (admin_user, action, target_email, target_user_id, details, created_at) VALUES (?, ?, ?, ?, ?, ?)', [currentUsername, 'change_username', newUsername, null, null, now]); } catch (e) { /* non-fatal */ }
        });

        // Update session username so the user stays logged in under new name
        if (req.session) req.session.username = newUsername;
        const updated = await fetchUserRow(newUsername) || { username: newUsername };
        res.locals.title = 'Profile';
        return res.render('Main/profile', { user: updated, error: null, message: 'Username updated.' });
    } catch (err) {
        console.error('profile.updateUsername: DB error', err);
        const userRow = await fetchUserRow(currentUsername) || { username: currentUsername };
        res.locals.title = 'Profile';
        return res.render('Main/profile', { user: userRow, error: 'Server error. Try again later.', message: null });
    }
};

// Render change password page
exports.renderChangePassword = function(req, res) {
    if (!req.session || !req.session.username) return res.redirect('/login');
    res.locals.title = 'Change Password';
    return res.render('Main/changePassword', { error: null, message: null });
};

// Handle change password POST: requires current password, new password, confirm
exports.submitChangePassword = async function(req, res) {
    const username = req.session && req.session.username ? req.session.username : null;
    if (!username) return res.redirect('/login');

    const current = req.body.currentPassword || '';
    const nw = req.body.newPassword || '';
    const confirm = req.body.confirm || '';

    if (!current || !nw || !confirm) { res.locals.title = 'Change Password'; return res.render('Main/changePassword', { error: 'All fields are required.', message: null }); }
    if (nw !== confirm) { res.locals.title = 'Change Password'; return res.render('Main/changePassword', { error: 'New password and confirmation do not match.', message: null }); }
    if (nw.length < 8) { res.locals.title = 'Change Password'; return res.render('Main/changePassword', { error: 'New password must be at least 8 characters.', message: null }); }

    try {
        // Verify current password and update
        await runQueryWithUserRole(async (conn) => {
            const [rows] = await conn.query('SELECT id, password FROM users WHERE username = ? LIMIT 1', [username]);
            if (!rows || rows.length === 0) throw new Error('User not found');
            const user = rows[0];
            const ok = await bcrypt.compare(current, user.password || '');
            if (!ok) throw new Error('invalid_current_password');

            const newHash = await bcrypt.hash(nw, 10);
            const now = new Date();
            await conn.query('UPDATE users SET password = ?, failed_login_attempts = 0, locked = 0, updatedAt = ? WHERE id = ?', [newHash, now, user.id]);
            // Best-effort audit
            try { await conn.query('INSERT INTO admin_actions (admin_user, action, target_email, target_user_id, details, created_at) VALUES (?, ?, ?, ?, ?, ?)', [username, 'user_change_password', username, user.id, null, now]); } catch (e) { /* non-fatal */ }
        });

        res.locals.title = 'Change Password';
        return res.render('Main/changePassword', { error: null, message: 'Password changed successfully.' });
    } catch (err) {
        if (String(err.message || '').toLowerCase() === 'invalid_current_password') {
            res.locals.title = 'Change Password';
            return res.render('Main/changePassword', { error: 'Current password is incorrect.', message: null });
        }
        console.error('profile.submitChangePassword: DB error', err);
        res.locals.title = 'Change Password';
        return res.render('Main/changePassword', { error: 'Server error. Try again later.', message: null });
    }
};

// Export a small helper to be used by routes setup if desired
exports.routes = function(app) {
    app.get('/profile', exports.showProfile);
    app.post('/profile/username', exports.updateUsername);
    app.get('/profile/change-password', exports.renderChangePassword);
    app.post('/profile/change-password', exports.submitChangePassword);
};
