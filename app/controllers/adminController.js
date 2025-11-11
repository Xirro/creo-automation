const bcrypt = require('bcryptjs');
const db = require('../config/db');

// Helper to obtain a connection with promise-friendly queryAsync and release
async function getConn(req) {
    if (typeof req.getConnection === 'function') {
        return await new Promise((resolve, reject) => {
            req.getConnection(function(err, conn) {
                if (err) return reject(err);
                conn.queryAsync = function(sql, params) {
                    return new Promise((resolveQ, rejectQ) => {
                        conn.query(sql, params, function(qErr, rows) {
                            if (qErr) return rejectQ(qErr);
                            resolveQ(rows);
                        });
                    });
                };
                conn._release = function() { try { if (typeof conn.release === 'function') conn.release(); } catch (e) {} };
                resolve(conn);
            });
        });
    }

    if (!db.isInitialized()) throw new Error('DB not initialized');
    const conn = await db.getSqlConnection();
    conn.queryAsync = async function(sql, params) {
        const [rows] = await conn.query(sql, params);
        return rows;
    };
    conn._release = async function() { try { conn.release(); } catch (e) {} };
    return conn;
}

// List pending account requests
exports.listPending = async function(req, res) {
    let conn;
    try {
        conn = await getConn(req);
        // Try to select username as well if present; fall back to email-only if column missing
        let rows;
        try {
            rows = await conn.queryAsync("SELECT id, username, email, token, status, created_at FROM accountRequests WHERE status = 'pending' ORDER BY created_at DESC");
        } catch (selErr) {
            if (String(selErr.message || '').toLowerCase().includes('unknown column')) {
                console.warn('accountRequests.username column not present; fetching pending requests without username.');
                rows = await conn.queryAsync("SELECT id, email, token, status, created_at FROM accountRequests WHERE status = 'pending' ORDER BY created_at DESC");
            } else {
                throw selErr;
            }
        }
    return res.render('Admin/adminRequests', { requests: rows });
    } catch (err) {
        console.error('Admin: DB connection error listing pending requests:', err);
        return res.status(500).send('Server error');
    } finally {
        try { if (conn) await conn._release(); } catch (e) {}
    }
};

// List admin audit actions
exports.listAudit = async function(req, res) {
    let conn;
    try {
        conn = await getConn(req);
        // Limit to recent 500 rows; adjust as needed
        const rows = await conn.queryAsync('SELECT id, admin_user, action, target_email, target_user_id, target_request_id, details, created_at FROM admin_actions ORDER BY created_at DESC LIMIT 500');
    return res.render('Admin/adminAudit', { audits: rows });
    } catch (err) {
        console.error('Admin audit: DB connection error listing audit rows:', err);
        return res.status(500).send('Server error');
    } finally {
        try { if (conn) await conn._release(); } catch (e) {}
    }
};

// Approve a pending request: create user, mark approved
exports.approveRequest = async function(req, res) {
    const id = req.params.id;
    const assignedRole = (req.body.role || 'user').trim();
    let conn;
    try {
        conn = await getConn(req);
        const rows = await conn.queryAsync('SELECT * FROM accountRequests WHERE id = ? LIMIT 1', [id]);
        if (!rows || rows.length === 0) {
            return res.status(404).send('Not found');
        }
        const reqRow = rows[0];
        // Insert into users table using email as username
        const username = reqRow.username || reqRow.email;
        const password_hash = reqRow.password_hash; // already hashed when requested
        const email = reqRow.email;
        const now = new Date();
        const insertSql = 'INSERT INTO users (username, email, password, role, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)';
        let newUserId = null;
        try {
           const insertResult = await conn.queryAsync(insertSql, [username, email, password_hash, assignedRole, now, now]);
            // insertResult may be an object with insertId depending on driver
            if (insertResult && typeof insertResult.insertId !== 'undefined') newUserId = insertResult.insertId;
        } catch (insErr) {
            console.error('Admin approve: failed to create user:', insErr);
            return res.status(500).send('Failed to create user');
        }
        // Delete the original account request now that it's been approved
        try {
            await conn.queryAsync('DELETE FROM accountRequests WHERE id = ?', [id]);
        } catch (delErr) {
            console.warn('Admin approve: failed to delete accountRequests row:', delErr);
        }

        // Write audit row (non-blocking on failure)
        try {
            await conn.queryAsync('INSERT INTO admin_actions (admin_user, action, target_email, target_user_id, target_request_id, details, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)', [
                req.session.username || null,
                'approve_request',
                email,
                newUserId,
                id,
                `role=${assignedRole}`,
                now
            ]);
        } catch (auditErr) {
            console.warn('Admin approve: failed to write audit row:', auditErr && auditErr.message ? auditErr.message : auditErr);
        }

        console.info('Admin approved account request', email, 'by', req.session.username);
        return res.redirect('/admin/requests');
    } catch (err) {
        console.error('Admin approve: DB connection error:', err);
        return res.status(500).send('Server error');
    } finally {
        try { if (conn) await conn._release(); } catch (e) {}
    }
};

// Deny a pending request
exports.denyRequest = async function(req, res) {
    const id = req.params.id;
    const reason = req.body.reason || null;
    let conn;
    try {
        conn = await getConn(req);
        const now = new Date();
            // Fetch the email for audit purposes
            let reqEmail = null;
            try {
                const reqRows = await conn.queryAsync('SELECT email FROM accountRequests WHERE id = ? LIMIT 1', [id]);
                if (reqRows && reqRows.length > 0) reqEmail = reqRows[0].email;
            } catch (fetchErr) {
                // ignore
            }

            // Delete the request row since it was denied
            try {
                await conn.queryAsync('DELETE FROM accountRequests WHERE id = ?', [id]);
            } catch (delErr) {
                console.warn('Admin deny: failed to delete accountRequests row:', delErr);
            }

            // Write audit row
            try {
                await conn.queryAsync('INSERT INTO admin_actions (admin_user, action, target_email, target_request_id, details, created_at) VALUES (?, ?, ?, ?, ?, ?)', [
                    req.session.username || null,
                    'deny_request',
                    reqEmail,
                    id,
                    reason || null,
                    now
                ]);
            } catch (auditErr) {
                console.warn('Admin deny: failed to write audit row:', auditErr && auditErr.message ? auditErr.message : auditErr);
            }

        console.info('Admin denied account request id', id, 'by', req.session.username);
        return res.redirect('/admin/requests');
    } catch (err) {
        console.error('Admin deny: DB connection error:', err);
        return res.status(500).send('Server error');
    } finally {
        try { if (conn) await conn._release(); } catch (e) {}
    }
};

// Reset a user's password (admin action)
exports.resetPassword = async function(req, res) {
    const userId = req.params.id;
    const newPassword = req.body.newPassword || null;
    if (!newPassword) return res.status(400).send('New password required');
    const hash = await bcrypt.hash(newPassword, 10);
    let conn;
    try {
        conn = await getConn(req);
    await conn.queryAsync('UPDATE users SET password = ? WHERE id = ?', [hash, userId]);

        // Fetch target user info for audit
        let targetEmail = null;
        try {
            const urows = await conn.queryAsync('SELECT email, username FROM users WHERE id = ? LIMIT 1', [userId]);
            if (urows && urows.length > 0) targetEmail = urows[0].email || urows[0].username || null;
        } catch (fetchErr) {
            // ignore
        }

        // Write audit row
        try {
            const now = new Date();
            await conn.queryAsync('INSERT INTO admin_actions (admin_user, action, target_email, target_user_id, details, created_at) VALUES (?, ?, ?, ?, ?, ?)', [
                req.session.username || null,
                'reset_password',
                targetEmail,
                userId,
                null,
                now
            ]);
        } catch (auditErr) {
            console.warn('Admin reset: failed to write audit row:', auditErr && auditErr.message ? auditErr.message : auditErr);
        }

    console.info('Admin reset password for user id', userId, 'by', req.session.username);
    // After resetting a user's password, redirect back to the users list for convenience
    return res.redirect('/admin/users');
    } catch (err) {
        console.error('Admin reset: DB connection error:', err);
        return res.status(500).send('Server error');
    } finally {
        try { if (conn) await conn._release(); } catch (e) {}
    }
};

// List users (with optional search)
exports.listUsers = async function(req, res) {
    const q = (req.query.q || '').trim();
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const pageSize = Math.max(1, Math.min(100, parseInt(req.query.pageSize, 10) || 25));
    let conn;
    try {
        conn = await getConn(req);

        // Build WHERE clause and params for optional search
        let where = '';
        const params = [];
        if (q) {
            where = ' WHERE username LIKE ? OR email LIKE ?';
            params.push('%' + q + '%', '%' + q + '%');
        }

        // Get total count for pagination
        const countSql = 'SELECT COUNT(*) as cnt FROM users' + where;
        const countRows = await conn.queryAsync(countSql, params);
        const totalCount = (countRows && countRows[0] && (countRows[0].cnt || countRows[0].cnt === 0)) ? Number(countRows[0].cnt) : 0;
        const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

    // Sorting: whitelist allowed sort columns to avoid SQL injection
    const allowedSort = { username: 'username', email: 'email', role: 'role', createdAt: 'createdAt', id: 'id' };
    let sort = (req.query.sort || 'createdAt');
    if (!allowedSort[sort]) sort = 'createdAt';
    let dir = (req.query.dir || 'DESC').toUpperCase();
    if (dir !== 'ASC' && dir !== 'DESC') dir = 'DESC';

    // Fetch paginated rows with ORDER BY using validated column and direction
    const offset = (page - 1) * pageSize;
    const sortCol = allowedSort[sort];
    const listSql = 'SELECT id, username, email, role, createdAt FROM users' + where + ` ORDER BY ${sortCol} ${dir} LIMIT ? OFFSET ?`;
    const listParams = params.concat([pageSize, offset]);
    const rows = await conn.queryAsync(listSql, listParams);

    return res.render('Admin/adminUsers', { users: rows, q: q, page: page, pageSize: pageSize, totalCount: totalCount, totalPages: totalPages, sort: sort, dir: dir });
    } catch (err) {
        console.error('Admin list users: DB connection error listing users:', err);
        return res.status(500).send('Server error');
    } finally {
        try { if (conn) await conn._release(); } catch (e) {}
    }
};

// Update a user's username/email
exports.updateUser = async function(req, res) {
    const userId = req.params.id;
    const username = req.body.username ? req.body.username.trim() : null;
    const email = req.body.email ? req.body.email.trim() : null;
        const role = req.body.role ? req.body.role.trim() : null;
        if (!username || !email) return res.status(400).send('Username and email required');
        // Accept role as provided (trimmed). If missing, default to 'user'. Limit length for safety.
        const newRole = (role && role.length <= 100) ? role : 'user';
    let conn;
    try {
        conn = await getConn(req);
        const now = new Date();
        await conn.queryAsync('UPDATE users SET username = ?, email = ?, role = ?, updatedAt = ? WHERE id = ?', [username, email, newRole, now, userId]);

        // Write audit row
        try {
            await conn.queryAsync('INSERT INTO admin_actions (admin_user, action, target_email, target_user_id, details, created_at) VALUES (?, ?, ?, ?, ?, ?)', [
                req.session.username || null,
                'update_user',
                email,
                userId,
                `username=${username};role=${newRole}`,
                now
            ]);
        } catch (auditErr) {
            console.warn('Admin updateUser: failed to write audit row:', auditErr && auditErr.message ? auditErr.message : auditErr);
        }

        return res.redirect('/admin/users');
    } catch (err) {
        console.error('Admin update user: DB connection error:', err);
        return res.status(500).send('Server error');
    } finally {
        try { if (conn) await conn._release(); } catch (e) {}
    }
};

// Delete a user
exports.deleteUser = async function(req, res) {
    const userId = req.params.id;
    let conn;
    try {
        conn = await getConn(req);

        // Get target email/username for audit
        let targetEmail = null;
        try {
            const urows = await conn.queryAsync('SELECT email, username FROM users WHERE id = ? LIMIT 1', [userId]);
            if (urows && urows.length > 0) targetEmail = urows[0].email || urows[0].username || null;
        } catch (fetchErr) {
            // ignore
        }

        await conn.queryAsync('DELETE FROM users WHERE id = ?', [userId]);

        // Write audit row
        try {
            const now = new Date();
            await conn.queryAsync('INSERT INTO admin_actions (admin_user, action, target_email, target_user_id, details, created_at) VALUES (?, ?, ?, ?, ?, ?)', [
                req.session.username || null,
                'delete_user',
                targetEmail,
                userId,
                null,
                now
            ]);
        } catch (auditErr) {
            console.warn('Admin deleteUser: failed to write audit row:', auditErr && auditErr.message ? auditErr.message : auditErr);
        }

        return res.redirect('/admin/users');
    } catch (err) {
        console.error('Admin delete user: DB connection error:', err);
        return res.status(500).send('Server error');
    } finally {
        try { if (conn) await conn._release(); } catch (e) {}
    }
};
