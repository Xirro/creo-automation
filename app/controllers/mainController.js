//exports
exports = {};
module.exports = exports;


//IN ANY OF THESE FUNCTIONS IF YOU WANT TO DEBUG OR ANALYZE THE BEHAVIOR
//THE BEST THING TO DO IS console.log WHATEVER VARIABLE, OBJECT, ARRAY, PROPERTY, ETC. THAT YOU ARE TRYING TO STUDY

const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');
const dbConfig = require('../config/database.js');
// Nodemailer usage temporarily disabled so account-request creation does not send emails.
// Uncomment the following line to re-enable email notifications and ensure SMTP env vars are configured.
// const nodemailer = require('nodemailer');

//landingPage function
exports.landingPage = function(req, res) {
    //render the landingPage (does not require any additional data to be sent)
    res.locals = {title: 'CREO Automation'};
    res.render('Main/landingPage');
};

// Render the request account form
exports.requestAccountForm = function(req, res) {
    res.render('Main/requestAccount', { error: null, email: '', username: '' });
};

// Render the reset-password form (public)
exports.renderResetPasswordForm = function(req, res) {
    // allow pre-filling username via query string
    const username = (req.query.username || '').trim();
    res.render('Main/resetPassword', { error: null, username: username });
};

// Handle reset-password submission (public)
exports.submitResetPassword = async function(req, res) {
    try {
        const username = (req.body.username || '').trim();
        const oldPassword = req.body.oldPassword || '';
        const newPassword = req.body.newPassword || '';
        const confirm = req.body.confirm || '';

        if (!username || !oldPassword || !newPassword || !confirm) {
            return res.render('Main/resetPassword', { error: 'All fields are required.', username });
        }

        if (newPassword !== confirm) {
            return res.render('Main/resetPassword', { error: 'New password and confirmation do not match.', username });
        }

        // Use same minimal policy as account request: at least 8 characters
        if (newPassword.length < 8) {
            return res.render('Main/resetPassword', { error: 'New password must be at least 8 characters.', username });
        }

        // Create a short-lived connection using the minimally-privileged app_guest account.
        // Note: express-myconnection is only mounted for /request-account, so don't rely on req.getConnection here.
        const guestOptions = {
            host: process.env.DB_HOST || (dbConfig.connection && dbConfig.connection.host) || '127.0.0.1',
            port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : (dbConfig.connection && dbConfig.connection.port) || 3306,
            user: 'app_guest',
            password: process.env.DB_GUEST_PASSWORD || (dbConfig.connection && dbConfig.connection.password) || '',
            database: process.env.DB_NAME || (dbConfig.connection && dbConfig.connection.database) || 'saidb'
        };

        let conn;
        try {
            conn = await mysql.createConnection(guestOptions);

            // Query user by username (exact match) and check locked flag first
            const [rows] = await conn.execute('SELECT id, password, locked FROM users WHERE username = ? LIMIT 1', [username]);
            if (!rows || rows.length === 0) {
                await conn.end().catch(()=>{});
                return res.render('Main/resetPassword', { error: 'Unknown username.', username });
            }

            const user = rows[0];
            if (user.locked) {
                await conn.end().catch(()=>{});
                return res.render('Main/resetPassword', { error: 'Account is locked. Contact your administrator to unlock the account.', username });
            }

            const match = await bcrypt.compare(oldPassword, user.password || '');
            if (!match) {
                await conn.end().catch(()=>{});
                return res.render('Main/resetPassword', { error: 'Old password does not match.', username });
            }

            // Hash new password and update user record; reset failed attempts and clear lock
            const newHash = await bcrypt.hash(newPassword, 10);
            const now = new Date();
            await conn.execute('UPDATE users SET password = ?, failed_login_attempts = 0, updatedAt = ? WHERE id = ?', [newHash, now, user.id]);

            // Optionally write an audit row if admin_actions exists (best-effort)
            try {
                await conn.execute('INSERT INTO admin_actions (admin_user, action, target_email, target_user_id, details, created_at) VALUES (?, ?, ?, ?, ?, ?)', [
                    null,
                    'user_reset_password',
                    username,
                    user.id,
                    null,
                    now
                ]);
            } catch (aErr) {
                console.warn('Reset password: failed to write audit row (non-fatal):', aErr && aErr.message ? aErr.message : aErr);
            }

            await conn.end().catch(()=>{});
            return res.render('Main/resetSuccess', { message: 'Password updated. You may now login with your new password.' });
        } catch (dbErr) {
            console.error('Reset password: DB error:', dbErr);
            try { if (conn) await conn.end().catch(()=>{}); } catch (e) {}
            return res.render('Main/resetPassword', { error: 'Server error. Try again later.', username });
        }

    } catch (ex) {
        console.error('Reset password: handler error:', ex);
        return res.render('Main/resetPassword', { error: 'Server error. Try again later.', username: (req.body && req.body.username) ? req.body.username : '' });
    }
};

// Handle form submission for account requests
exports.submitRequestAccount = async function(req, res) {
    try {
        const username = (req.body.username || '').trim();
        const email = (req.body.email || '').trim();
        const password = req.body.password || '';
        const confirm = req.body.confirm || '';
        // requested_role removed from schema; validate required fields
        if (!username || !email || !password || !confirm) {
            return res.render('Main/requestAccount', { error: 'All fields are required.', email, username });
        }
        if (password !== confirm) {
            return res.render('Main/requestAccount', { error: 'Password and confirmation do not match.', email });
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.render('Main/requestAccount', { error: 'Invalid email address.', email, username });
        }
        if (!/^[A-Za-z0-9_.-]{3,64}$/.test(username)) {
            return res.render('Main/requestAccount', { error: 'Username must be 3-64 chars and contain only letters, numbers, dot, underscore or dash.', email, username });
        }

        const token = crypto.randomBytes(20).toString('hex');
        const password_hash = await bcrypt.hash(password, 10);
        const now = new Date();

            // Insert into accountRequests using express-myconnection (req.getConnection)
            req.getConnection(function(err, conn) {
                if (err) {
                    console.error('DB connection error inserting pending request:', err);
                    return res.render('Main/requestAccount', { error: 'Server error. Try again later.', email });
                }

                // First, ensure the email or username is not already pending or an existing user.
                conn.query('SELECT id FROM accountRequests WHERE email = ? LIMIT 1', [email], function(checkErr, checkRows) {
                    if (checkErr) {
                        console.error('Failed to query accountRequests for existing email:', checkErr);
                        return res.render('Main/requestAccount', { error: 'Server error. Try again later.', email, username });
                    }
                    if (checkRows && checkRows.length > 0) {
                        return res.render('Main/requestAccount', { error: 'An account request with this email already exists.', email, username });
                    }

                    // If a username was provided, check pending requests for that username (best-effort; may fail if schema lacks column)
                    if (username) {
                        conn.query('SELECT id FROM accountRequests WHERE username = ? LIMIT 1', [username], function(uErr, uRows) {
                            if (uErr) {
                                // If the column doesn't exist, ignore and continue; otherwise log.
                                if (String(uErr.message || '').toLowerCase().includes('unknown column')) {
                                    console.warn('accountRequests.username column not present; skipping pending-username check.');
                                } else {
                                    console.warn('Failed to query accountRequests for username:', uErr);
                                }
                            } else if (uRows && uRows.length > 0) {
                                return res.render('Main/requestAccount', { error: 'This username is already requested by someone else.', email, username });
                            }

                            // Now check users table for collisions (email or username)
                            conn.query('SELECT id FROM users WHERE email = ? OR username = ? LIMIT 1', [email, username], function(userErr, userRows) {
                                if (userErr) {
                                    console.warn('Could not check users table for existing email/username. Ensure SELECT privilege on saidb.users for the app guest DB user if you want this check to run. Error:', userErr && userErr.message ? userErr.message : userErr);
                                } else if (userRows && userRows.length > 0) {
                                    return res.render('Main/requestAccount', { error: 'This username or email already exists.', email, username });
                                }

                                // Try inserting including username column; if that fails because the column is missing, fall back to prior insert without username
                                const insertWithUsername = 'INSERT INTO accountRequests (username, email, password_hash, token, status, created_at) VALUES (?, ?, ?, ?, ?, ?)';
                                conn.query(insertWithUsername, [username, email, password_hash, token, 'pending', now], function(insErr) {
                                    if (insErr) {
                                        if (String(insErr.message || '').toLowerCase().includes('unknown column')) {
                                            console.warn('accountRequests.username column not present; falling back to insert without username.');
                                            const insertWithoutUsername = 'INSERT INTO accountRequests (email, password_hash, token, status, created_at) VALUES (?, ?, ?, ?, ?)';
                                            conn.query(insertWithoutUsername, [email, password_hash, token, 'pending', now], function(err2) {
                                                if (err2) {
                                                    console.error('Failed to insert pending request (fallback):', err2);
                                                    return res.render('Main/requestAccount', { error: 'Server error. Try again later.', email, username });
                                                }
                                                console.info('Account request saved (fallback); email notifications are currently disabled.');
                                                return res.render('Main/requestSent');
                                            });
                                            return;
                                        }
                                        console.error('Failed to insert pending request:', insErr);
                                        return res.render('Main/requestAccount', { error: 'Server error. Try again later.', email, username });
                                    }

                                    console.info('Account request saved; email notifications are currently disabled.');
                                    return res.render('Main/requestSent');
                                });
                            });
                        });
                    } else {
                        // No username provided (shouldn't happen due to earlier validation), but keep previous behavior
                        conn.query('SELECT id FROM users WHERE email = ? LIMIT 1', [email], function(userErr, userRows) {
                            if (userErr) {
                                console.warn('Could not check users table for existing email. Ensure SELECT privilege on saidb.users for the app guest DB user if you want this check to run. Error:', userErr && userErr.message ? userErr.message : userErr);
                            } else if (userRows && userRows.length > 0) {
                                return res.render('Main/requestAccount', { error: 'This email already exists.', email });
                            }

                            const sql = 'INSERT INTO accountRequests (email, password_hash, token, status, created_at) VALUES (?, ?, ?, ?, ?)';
                            conn.query(sql, [email, password_hash, token, 'pending', now], function(err2) {
                                if (err2) {
                                    console.error('Failed to insert pending request:', err2);
                                    return res.render('Main/requestAccount', { error: 'Server error. Try again later.', email });
                                }

                                console.info('Account request saved; email notifications are currently disabled.');
                                return res.render('Main/requestSent');
                            });
                        });
                    }
                });
            });
    } catch (ex) {
        console.error('Error handling account request:', ex);
        return res.render('Main/requestAccount', { error: 'Server error. Try again later.', email: '' });
    }
};