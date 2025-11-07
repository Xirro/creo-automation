//exports
exports = {};
module.exports = exports;


//IN ANY OF THESE FUNCTIONS IF YOU WANT TO DEBUG OR ANALYZE THE BEHAVIOR
//THE BEST THING TO DO IS console.log WHATEVER VARIABLE, OBJECT, ARRAY, PROPERTY, ETC. THAT YOU ARE TRYING TO STUDY

const crypto = require('crypto');
const bcrypt = require('bcryptjs');
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
    res.render('Main/requestAccount', { error: null, email: '' });
};

// Handle form submission for account requests
exports.submitRequestAccount = async function(req, res) {
    try {
        const email = (req.body.email || '').trim();
        const password = req.body.password || '';
        const confirm = req.body.confirm || '';
        // requested_role removed from schema; validate required fields
        if (!email || !password || !confirm) {
            return res.render('Main/requestAccount', { error: 'All fields are required.', email });
        }
        if (password !== confirm) {
            return res.render('Main/requestAccount', { error: 'Password and confirmation do not match.', email });
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.render('Main/requestAccount', { error: 'Invalid email address.', email });
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

                // First, ensure the email is not already pending or an existing user.
                conn.query('SELECT id FROM accountRequests WHERE email = ? LIMIT 1', [email], function(checkErr, checkRows) {
                    if (checkErr) {
                        console.error('Failed to query accountRequests for existing email:', checkErr);
                        return res.render('Main/requestAccount', { error: 'Server error. Try again later.', email });
                    }
                    if (checkRows && checkRows.length > 0) {
                        return res.render('Main/requestAccount', { error: 'This username already exists.', email });
                    }

                    // Check users table. Note: the DB guest user may need SELECT on the users table.
                    conn.query('SELECT id FROM users WHERE email = ? LIMIT 1', [email], function(userErr, userRows) {
                        if (userErr) {
                            // Don't fail the request if we lack privileges to read users; log a helpful warning.
                            console.warn('Could not check users table for existing email. Ensure SELECT privilege on saidb.users for the app guest DB user if you want this check to run. Error:', userErr && userErr.message ? userErr.message : userErr);
                        } else if (userRows && userRows.length > 0) {
                            return res.render('Main/requestAccount', { error: 'This username already exists.', email });
                        }

                        const sql = 'INSERT INTO accountRequests (email, password_hash, token, status, created_at) VALUES (?, ?, ?, ?, ?)';
                        conn.query(sql, [email, password_hash, token, 'pending', now], function(err2) {
                            if (err2) {
                                console.error('Failed to insert pending request:', err2);
                                return res.render('Main/requestAccount', { error: 'Server error. Try again later.', email });
                            }

                            // Email notifications are disabled for now. The request has been saved to the DB.
                            console.info('Account request saved; email notifications are currently disabled.');
                            // Render a confirmation page that tells the user their request was sent
                            return res.render('Main/requestSent');
                        });
                    });
                });
            });
    } catch (ex) {
        console.error('Error handling account request:', ex);
        return res.render('Main/requestAccount', { error: 'Server error. Try again later.', email: '' });
    }
};