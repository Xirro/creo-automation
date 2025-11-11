// Middleware: ensureRole(role)
// Usage: const ensureRole = require('../middleware/ensureRole'); router.use('/admin', ensureRole('admin'));
const db = require('../config/db');

module.exports = function(requiredRole) {
    // Returns async middleware
    return async function(req, res, next) {
        try {
            // If session indicates the user is the DB admin (e.g., 'doadmin'), allow.
            if (req.session && req.session.isAdmin) return next();

            // If username is not available, deny.
            if (!req.session || !req.session.username) {
                return res.status(403).send('Forbidden');
            }

            const username = req.session.username;

            // Helper to obtain a promise-friendly connection with queryAsync and release
            async function getConn() {
                if (typeof req.getConnection === 'function') {
                    return await new Promise((resolve, reject) => {
                        req.getConnection(function(err, conn) {
                            if (err) return reject(err);
                            // provide a queryAsync wrapper returning rows for compatibility
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

                // Fallback to promise pool
                if (!db.isInitialized()) throw new Error('DB not initialized');
                const conn = await db.getSqlConnection();
                // mysql2 promise connection: query returns [rows, fields]
                conn.queryAsync = async function(sql, params) {
                    const [rows] = await conn.query(sql, params);
                    return rows;
                };
                conn._release = async function() { try { conn.release(); } catch (e) {} };
                return conn;
            }

            const conn = await getConn();
            try {
                const rows = await conn.queryAsync('SELECT role FROM users WHERE username = ? LIMIT 1', [username]);
                if (!rows || rows.length === 0) {
                    return res.status(403).send('Forbidden');
                }
                const role = rows[0].role || '';
                if (role === requiredRole) return next();
                return res.status(403).send('Forbidden');
            } finally {
                try { await conn._release(); } catch (e) {}
            }
        } catch (ex) {
            console.error('RBAC middleware error:', ex && ex.stack ? ex.stack : ex);
            return res.status(500).send('Server error');
        }
    };
};
