// Middleware: ensureRole(role)
// Usage: const ensureRole = require('../middleware/ensureRole'); router.use('/admin', ensureRole('admin'));
module.exports = function(requiredRole) {
    return function(req, res, next) {
        // If session indicates the user is the DB admin (e.g., 'doadmin'), allow.
        if (req.session && req.session.isAdmin) return next();

        // If username is not available, deny.
        if (!req.session || !req.session.username) {
            return res.status(403).send('Forbidden');
        }

        // Try to read role from the app users table. This requires the app DB connection to be available.
        // If the query fails (missing privileges), deny access and log a helpful message.
        try {
            // Use req.getConnection (express-myconnection) to query the current DB.
            req.getConnection(function(err, conn) {
                if (err) {
                    console.error('RBAC: DB connection not available for role check:', err);
                    return res.status(500).send('Server error');
                }
                const sql = 'SELECT role FROM users WHERE username = ? LIMIT 1';
                conn.query(sql, [req.session.username], function(qErr, rows) {
                    if (qErr) {
                        console.warn('RBAC: Unable to query users table for role. Ensure SELECT privilege on saidb.users for the app DB user. Error:', qErr && qErr.message ? qErr.message : qErr);
                        return res.status(403).send('Forbidden');
                    }
                    if (!rows || rows.length === 0) {
                        return res.status(403).send('Forbidden');
                    }
                    const role = rows[0].role || '';
                    if (role === requiredRole) return next();
                    return res.status(403).send('Forbidden');
                });
            });
        } catch (ex) {
            console.error('RBAC middleware error:', ex);
            return res.status(500).send('Server error');
        }
    };
};
