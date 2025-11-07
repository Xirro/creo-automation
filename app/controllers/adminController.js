const bcrypt = require('bcryptjs');

// List pending account requests
exports.listPending = function(req, res) {
    req.getConnection(function(err, conn) {
        if (err) {
            console.error('Admin: DB connection error listing pending requests:', err);
            return res.status(500).send('Server error');
        }
        const sql = "SELECT id, email, token, status, created_at FROM accountRequests WHERE status = 'pending' ORDER BY created_at DESC";
        conn.query(sql, function(qErr, rows) {
            if (qErr) {
                console.error('Admin: Failed to query pending requests:', qErr);
                return res.status(500).send('Server error');
            }
            return res.render('Main/adminRequests', { requests: rows });
        });
    });
};

// Approve a pending request: create user, mark approved
exports.approveRequest = function(req, res) {
    const id = req.params.id;
    const assignedRole = (req.body.role || 'user').trim();
    req.getConnection(function(err, conn) {
        if (err) {
            console.error('Admin approve: DB connection error:', err);
            return res.status(500).send('Server error');
        }
        conn.query('SELECT * FROM accountRequests WHERE id = ? LIMIT 1', [id], function(qErr, rows) {
            if (qErr || !rows || rows.length === 0) {
                console.error('Admin approve: failed to read request:', qErr);
                return res.status(404).send('Not found');
            }
            const reqRow = rows[0];
            // Insert into users table using email as username
            const username = reqRow.email;
            const password_hash = reqRow.password_hash; // already hashed when requested
            const email = reqRow.email;
            const now = new Date();
            const insertSql = 'INSERT INTO users (username, email, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?)';
            conn.query(insertSql, [username, email, password_hash, assignedRole, now], function(insErr) {
                if (insErr) {
                    console.error('Admin approve: failed to create user:', insErr);
                    // If user already exists, return conflict
                    return res.status(500).send('Failed to create user');
                }
                // Mark request approved
                conn.query('UPDATE accountRequests SET status = ?, approved_by = ?, approved_at = ? WHERE id = ?', ['approved', req.session.username || null, now, id], function(upErr) {
                    if (upErr) console.warn('Admin approve: failed to update accountRequests status:', upErr);
                    console.info('Admin approved account request', email, 'by', req.session.username);
                    return res.redirect('/admin/requests');
                });
            });
        });
    });
};

// Deny a pending request
exports.denyRequest = function(req, res) {
    const id = req.params.id;
    const reason = req.body.reason || null;
    req.getConnection(function(err, conn) {
        if (err) {
            console.error('Admin deny: DB connection error:', err);
            return res.status(500).send('Server error');
        }
        const now = new Date();
        conn.query('UPDATE accountRequests SET status = ?, denied_by = ?, denied_at = ?, deny_reason = ? WHERE id = ?', ['denied', req.session.username || null, now, reason, id], function(upErr) {
            if (upErr) {
                console.error('Admin deny: failed to update request status:', upErr);
                return res.status(500).send('Server error');
            }
            console.info('Admin denied account request id', id, 'by', req.session.username);
            return res.redirect('/admin/requests');
        });
    });
};

// Reset a user's password (admin action)
exports.resetPassword = async function(req, res) {
    const userId = req.params.id;
    const newPassword = req.body.newPassword || null;
    if (!newPassword) return res.status(400).send('New password required');
    const hash = await bcrypt.hash(newPassword, 10);
    req.getConnection(function(err, conn) {
        if (err) {
            console.error('Admin reset: DB connection error:', err);
            return res.status(500).send('Server error');
        }
        conn.query('UPDATE users SET password_hash = ? WHERE id = ?', [hash, userId], function(upErr) {
            if (upErr) {
                console.error('Admin reset: failed to update password:', upErr);
                return res.status(500).send('Server error');
            }
            console.info('Admin reset password for user id', userId, 'by', req.session.username);
            return res.redirect('/admin/requests');
        });
    });
};
