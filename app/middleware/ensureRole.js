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
                // Respond with JSON for XHR clients, otherwise render an Access Denied page
                if (req.xhr || (req.get && req.get('Accept') && req.get('Accept').includes('application/json'))) {
                    return res.status(403).json({ error: 'Access denied' });
                }
                return res.status(403).render('Main/accessDenied', { message: 'Access denied' });
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
                    if (req.xhr || (req.get && req.get('Accept') && req.get('Accept').includes('application/json'))) {
                        return res.status(403).json({ error: 'Access denied' });
                    }
                    return res.status(403).render('Main/accessDenied', { message: 'Access denied' });
                }
                const role = rows[0].role || '';
                if (role === requiredRole) return next();
                if (req.xhr || (req.get && req.get('Accept') && req.get('Accept').includes('application/json'))) {
                    return res.status(403).json({ error: 'Access denied' });
                }
                return res.status(403).render('Main/accessDenied', { message: 'Access denied' });
            } finally {
                try { await conn._release(); } catch (e) {}
            }
        } catch (ex) {
            console.error('RBAC middleware error:', ex && ex.stack ? ex.stack : ex);
            // If the underlying error is a DB permission/auth error, return Access denied
            const msg = (ex && ex.message) ? ex.message.toLowerCase() : '';
            if (ex && (ex.code === 'ER_DBACCESS_DENIED_ERROR' || ex.code === 'ER_TABLEACCESS_DENIED_ERROR' || msg.includes('access denied') || msg.includes('permission'))) {
                return res.status(403).send('Access denied');
            }
            return res.status(500).send('Server error');
        }
    };
};
