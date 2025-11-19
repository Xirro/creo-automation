//core imports - installed by npm via npm install and package.json file. use the require() statement to make use of installed packages
//express - a web framework for node.js => makes working with node.js easier
const express = require('express');
//express() creates the express application => we bind this to a variable app for easy access
const app = express();
console.log('Starting server.js, cwd=' + process.cwd() + ', node=' + process.version);
// Global error handlers to capture unexpected errors and rejections during startup/runtime.
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception (will not exit):', err && err.stack ? err.stack : err);
});
process.on('unhandledRejection', (reason, p) => {
    console.error('Unhandled Rejection at:', p, 'reason:', reason && reason.stack ? reason.stack : reason);
});
//creates a session middleware - used for a ton of things like storing cookie and session data in the request obj (req)
const session = require('express-session');
//bodyParser allows us to parse the incoming request bodies in a middleware
const bodyParser = require('body-parser');
//cookieParser allows us to parse and populate cookies
const cookieParser = require('cookie-parser');
//path helps us interact with file paths easily
const path = require('path');

//directs app to use bodyParser, and passes some options as an object
app.use(bodyParser.urlencoded({
    extended: true,
    limit: '200mb',
    parameterLimit: 50000
}));

//special options for JSON objects
app.use(bodyParser.json({
    extended: true,
    limit: '200mb'
}));

//directs app to use cookieParser
app.use(cookieParser());

// Track active requests to support graceful shutdown coordination
let activeRequests = 0;
app.use((req, res, next) => {
    // don't count internal endpoints used for health/shutdown polling
    if (req.path && req.path.startsWith('/__')) return next();
    activeRequests++;
    res.on('finish', () => {
        try { activeRequests = Math.max(0, activeRequests - 1); } catch (e) { activeRequests = 0; }
    });
    next();
});

//directs app to use/initialize the session
// session secret should come from environment in production. Provide a safe dev fallback.
const sessionSecret = process.env.SESSION_SECRET || 'some_session_secret_for_development_only';
app.use(session({ secret: sessionSecret, resave: true, saveUninitialized: true }));

//database dependencies
let mysql = require('mysql2');
let myConnection = require('express-myconnection');
let dbConfig = require('./app/config/database.js');
let database = dbConfig.connection.database;
let host = dbConfig.connection.host;
let user = dbConfig.connection.user;
let password = dbConfig.connection.password;
let port = dbConfig.connection.port;
let dbOptions = {
    host: host,
    user: user,
    password: password,
    port: port,
    database: database
};

// Database helper module (supports runtime init)
const db = require('./app/config/db.js');
// Helper to open short-lived role-based DB connections (reads SAI_* env vars)
const withRoleConn = require('./app/config/roleConn');

// Helper to initialize express-myconnection using current db pool config
function attachDbMiddleware(connOptions) {
    const options = {
        host: connOptions.host,
        user: connOptions.user,
        password: connOptions.password,
        port: connOptions.port,
        database: connOptions.database
    };
    app.use(myConnection(mysql, options, 'pool'));
}

// Update users.last_login helper. Use ONLY the short-lived sai_user connection via withRoleConn('user').
async function updateLastLogin(req, username) {
    if (!username) return;
    const usersTable = (require('./app/config/database.js').users_table || 'users');
    const now = new Date();

    if (typeof withRoleConn !== 'function') {
        // Not configured; log and skip. This helper is intentionally limited to sai_user.
        console.warn('updateLastLogin skipped: withRoleConn not configured');
        return;
    }

    try {
        await withRoleConn('user', async (conn) => {
            try {
                await conn.query('UPDATE ' + usersTable + ' SET last_login = ? WHERE username = ?', [now, username]);
            } catch (e) {
                // Log but do not throw to avoid breaking login flow
                console.warn('updateLastLogin: query failed via withRoleConn:', e && e.message ? e.message : e);
            }
        });
    } catch (e) {
        console.warn('updateLastLogin via withRoleConn failed:', e && e.message ? e.message : e);
    }
}

// Reset failed_login_attempts to 0 for a username. Prefer sai_user short-lived connection,
async function resetFailedAttempts(username) {
    if (!username) return;
    const usersTable = (require('./app/config/database.js').users_table || 'users');

    // Prefer sai_user short-lived connection
    try {
        if (typeof withRoleConn === 'function') {
            await withRoleConn('user', async (conn) => {
                try {
                    await conn.query('UPDATE ' + usersTable + ' SET failed_login_attempts = 0 WHERE username = ?', [username]);
                } catch (e) {
                    console.warn('resetFailedAttempts query failed via withRoleConn:', e && e.message ? e.message : e);
                }
            });
            return;
        }
    } catch (e) {
        console.warn('resetFailedAttempts via withRoleConn failed:', e && e.message ? e.message : e);
    }
}

// Helper: read account lock status and failed attempt count (best-effort)
async function getAccountStatus(username) {
    if (!username) return null;
    const usersTable = (require('./app/config/database.js').users_table || 'users');

    // Use the minimally-privileged guest connection (guestDbOptions) to read account status.
    try {
        const mysql2 = require('mysql2/promise');
        const conn = await mysql2.createConnection({
            host: guestDbOptions.host,
            port: guestDbOptions.port,
            user: guestDbOptions.user,
            password: guestDbOptions.password,
            database: guestDbOptions.database,
            connectTimeout: 7000,
            ssl: guestDbOptions.ssl ? { rejectUnauthorized: false } : undefined
        });
        try {
            const [rows] = await conn.query('SELECT locked, failed_login_attempts FROM ' + usersTable + ' WHERE username = ? LIMIT 1', [username]);
            if (rows && rows.length > 0) return { locked: !!rows[0].locked, attempts: rows[0].failed_login_attempts || 0 };
        } finally {
            try { await conn.end(); } catch (e) { /* ignore */ }
        }
    } catch (e) {
        console.warn('getAccountStatus via guestDbOptions failed:', e && e.message ? e.message : e);
    }

    // Could not determine status
    return null;
}

// Helper: increment failed_login_attempts and lock account at threshold (best-effort).
async function recordFailedLogin(username) {
    if (!username) return null;
    const usersTable = (require('./app/config/database.js').users_table || 'users');
    // Use the minimally-privileged guest connection (guestDbOptions) to record failed attempts.
    try {
        const mysql2 = require('mysql2/promise');
        const conn = await mysql2.createConnection({
            host: guestDbOptions.host,
            port: guestDbOptions.port,
            user: guestDbOptions.user,
            password: guestDbOptions.password,
            database: guestDbOptions.database,
            connectTimeout: 7000,
            ssl: guestDbOptions.ssl ? { rejectUnauthorized: false } : undefined
        });
        try {
            // Only increment failed_login_attempts here. The DB trigger will set `locked`.
            await conn.query('UPDATE ' + usersTable + ' SET failed_login_attempts = COALESCE(failed_login_attempts,0) + 1 WHERE username = ?', [username]);
            return true;
        } finally {
            // Ensure the DB connection is always closed even if the query throws.
            try { await conn.end(); } catch (e) { /* ignore errors during close */ }
        }
    } catch (e) {
        console.warn('recordFailedLogin via guestDbOptions failed:', e && e.message ? e.message : e);
        return null;
    }
}

// If db module already initialized (dev environment), attach middleware
if (db.isInitialized()) {
    attachDbMiddleware({ host, user, password, port, database });
}

// --- Public route DB middleware (guest) ---
// Mount a restricted DB connection only for the public /request-account path.
// Configure via environment variables to avoid storing secrets in repo.
// Env vars: PENDING_DB_HOST, PENDING_DB_PORT, PENDING_DB_USER, PENDING_DB_PASS, PENDING_DB_NAME
// For development we require explicit env vars for the public guest DB connection.
// Do NOT silently fall back to repo defaults here; fail fast if missing in non-production.
const guestDbOptions = {
    host: process.env.DB_HOST || undefined,
    user: 'app_guest',
    password: process.env.DB_GUEST_PASSWORD || undefined,
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : undefined,
    database: process.env.DB_NAME || undefined,
    ssl: process.env.DB_SSL === 'true' || false
};

// Determine if we're running a packaging/build step for Electron. Packaging tools often set
// lifecycle env vars (npm_lifecycle_event) or electron-builder specific env vars. If we're
// packaging, treat it like a strict environment (require required env vars) so builds fail fast.
const lifecycle = (process.env.npm_lifecycle_event || '').toLowerCase();
const isPackaging = !!(
    process.env.ELECTRON_BUILD === 'true' ||
    process.env.ELECTRON_BUILDER === 'true' ||
    process.env.ELECTRON_BUILDER_BIN ||
    lifecycle.includes('dist') || lifecycle.includes('pack') || lifecycle.includes('electron') || lifecycle.includes('build')
);

// Fallback: load a local env file (if present) placed next to the EXE or next to server.js.
// This allows installers to drop a `creo-automation.env` file into the application folder
// so end-users can supply the required environment variables without embedding them
// into the binary. File format is simple KEY=VALUE per line, '#' starts a comment.
try {
    const fs = require('fs');
    const envFileName = 'creo-automation.env';
    const candidates = [];
    try {
        if (process && process.execPath) candidates.push(path.join(path.dirname(process.execPath), envFileName));
    } catch (e) { /* ignore */ }
    // Also accept a file next to the server.js (useful for dev or unpacked layouts)
    candidates.push(path.join(__dirname, envFileName));

    for (const p of candidates) {
        try {
            if (fs.existsSync(p)) {
                const data = fs.readFileSync(p, 'utf8');
                data.split(/\r?\n/).forEach(line => {
                    let l = (line || '').trim();
                    if (!l || l.startsWith('#')) return;
                    const idx = l.indexOf('=');
                    if (idx === -1) return;
                    const key = l.substring(0, idx).trim();
                    let val = l.substring(idx + 1).trim();
                    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
                        val = val.substring(1, val.length - 1);
                    }
                    if (key && (typeof process.env[key] === 'undefined' || process.env[key] === '')) {
                        process.env[key] = val;
                    }
                });
                console.log('Loaded local env file:', p);
                break;
            }
        } catch (e) { /* ignore per-file errors */ }
    }
} catch (e) { /* ignore loading errors */ }

// In development (non-production) or during packaging require explicit DB env vars to be set
// so developers and CI builds don't rely on hidden defaults.
if ((process.env.NODE_ENV || 'development') !== 'production' || isPackaging) {
    const required = [
        'DB_GUEST_PASSWORD',
        'DB_HOST',
        'DB_NAME',
        'DB_PORT',
        'SAI_ADMIN_DB_USER',
        'SAI_ADMIN_DB_PASS',
        'SAI_ENG_DB_USER',
        'SAI_ENG_DB_PASS',
        'SAI_USER_DB_USER',
        'SAI_USER_DB_PASS'
    ];
    const missing = required.filter(k => !process.env[k]);
    if (missing.length > 0) {
        console.error('Startup abort: missing required environment variables:');
        missing.forEach(m => console.error(' - ' + m));
        console.error('Set these environment variables before starting or packaging the app. Example (PowerShell):');
        console.error("$env:DB_HOST='127.0.0.1'; $env:DB_PORT='3306'; $env:DB_GUEST_PASSWORD='guestpass'; $env:DB_NAME='saidb';");
        console.error("$env:SAI_ADMIN_DB_USER='sai_admin'; $env:SAI_ADMIN_DB_PASS='adminpass'; $env:SAI_ENG_DB_USER='sai_eng'; $env:SAI_ENG_DB_PASS='engpass';");
        console.error("$env:SAI_USER_DB_USER='sai_user'; $env:SAI_USER_DB_PASS='userpass'; node server.js");
        if (isPackaging) {
            console.error('Packaging detected (npm lifecycle: ' + lifecycle + '). Aborting packaging to avoid creating a build with missing secrets.');
        }
        // Terminate initialization to avoid surprising behavior with implicit defaults
        process.exit(1);
    }
}

// Attach express-myconnection middleware only for the public request page so anonymous
// visitors can INSERT into the requests table using a minimally-privileged DB user.
app.use('/request-account', myConnection(mysql, guestDbOptions, 'pool'));

// directing the app where to look for the views, and instructing it that the content is EJS
// Use absolute paths based on __dirname so this works when running inside ASAR (packaged)
const viewsPath = path.join(__dirname, 'app', 'views');
app.set('views', viewsPath);
app.set('view engine', 'ejs');

// give app access to the public folder from root; use absolute paths for packaged runs
const publicPath = path.join(__dirname, 'public');
app.use(express.static(publicPath));
app.use('/public', express.static(publicPath));

//initial route => executed when someone goes to localhost:3000/
app.get('/', function(req, res) {
    res.redirect('/home');
});

// --- Authentication: simple session-based login ---
// Render login page
app.get('/login', function(req, res) {
    // If a login error was stored in session (from a previous POST), render it once then clear it.
    const err = req.session && req.session.loginError ? req.session.loginError : null;
    if (req.session) delete req.session.loginError;
    res.render('Main/login', { error: err });
});

// Handle login POST; expects host, port, database, user, password from form
app.post('/login', async function(req, res) {
    const { user, password } = req.body;
    if (!user || !password) {
        return res.render('Main/login', { error: 'User and password are required.' });
    }

    // Map username to the corresponding DB configuration
    // e.g. 'doadmin' -> production, 'root' -> development
    const cfg = require('./app/config/config.json');
    let connInfo = null;
    if (user === 'doadmin' || user === 'sai_eng' || user === 'sai_admin') {
        connInfo = {
            host: cfg.production.host,
            port: cfg.production.port || 3306,
            database: cfg.production.database || 'saidb',
            user: user,
            password: password,
            ssl: true
        };
    } else if (user === 'root') {
        connInfo = {
            host: cfg.development.host || 'localhost',
            port: cfg.development.port || 3306,
            database: cfg.development.database || 'sai_test',
            user: user,
            password: password,
            ssl: false
        };
    } else {
        // Generic mapping: if the username matches the production user in config, map to production
        if (user === cfg.production.username) {
            connInfo = {
                host: cfg.production.host,
                port: cfg.production.port || 3306,
                database: cfg.production.database || 'saidb',
                user: user,
                password: password,
                ssl: true
            };
        } else {
            // Default to development mapping for unknown users
            connInfo = {
                host: cfg.development.host || 'localhost',
                port: cfg.development.port || 3306,
                database: cfg.development.database || 'sai_test',
                user: user,
                password: password,
                ssl: false
            };
        }
    }

    try {
        // Developer test hooks:
        // - 'simulateSlow' keeps the DB test path but delays ~6s so the client spinner can be observed.
        // - 'developer' allows a dev to log in locally without any DB connection (development-only bypass).
        if (user === 'simulateSlow') {
            await new Promise((r) => setTimeout(r, 6000));
        }

        if (user === 'developer') {
            // Require matching dev bypass password (from env) to reduce accidental use in shared dev environments.
            const devPass = process.env.DEV_BYPASS_PASSWORD || 'development';
            if (!password || password !== devPass) {
                if (req.session) req.session.loginError = 'Invalid development bypass password.';
                return res.redirect('/login');
            }

            // Bypass DB init for local development/testing. Mark session as dev bypass.
            req.session.loggedIn = true;
            req.session.devBypass = true;
            req.session.dbConn = { host: 'local-bypass', database: '', user: user };
            if (req.session && typeof req.session.regenerate === 'function') {
                return req.session.regenerate(function(err) {
                    if (err) console.warn('session.regenerate error (developer bypass):', err);
                    req.session.loggedIn = true;
                    req.session.devBypass = true;
                    req.session.dbConn = { host: 'local-bypass', database: '', user: user };
                    try { /* session after regenerate (developer bypass) logging removed */ } catch (e) {}
                    return req.session.save(function(err2) { if (err2) console.warn('session.save error (developer bypass):', err2); return res.redirect('/home'); });
                });
            }
            if (req.session && typeof req.session.save === 'function') {
                return req.session.save(function(err) { if (err) console.warn('session.save error (developer bypass fallback):', err); return res.redirect('/home'); });
            }
            return res.redirect('/home');
        }
        // If the username is one of the special DB users (doadmin/root/etc), keep the existing
        // behavior of attempting a DB connection using the provided credentials.
        const isSpecialDbUser = (user === 'doadmin' || user === cfg.production.username);

        // Helper to initialize DB pool and middleware after successful authentication
        const finalizeLogin = (connInfoToUse, sessionUser, isAdminFlag, sessionUserId, sessionRole) => {
            try {
                db.init(connInfoToUse);
                attachDbMiddleware(connInfoToUse);
            } catch (e) {
                console.warn('Failed to init DB pool after login:', e && e.message ? e.message : e);
            }
            req.session.loggedIn = true;
            req.session.username = sessionUser;
            req.session.isAdmin = !!isAdminFlag;
            // Cache user id and role for faster access in view middleware and controllers
            req.session.userId = (typeof sessionUserId !== 'undefined') ? sessionUserId : (req.session && req.session.userId ? req.session.userId : null);
            req.session.role = (typeof sessionRole !== 'undefined') ? sessionRole : (req.session && req.session.role ? req.session.role : null);
            req.session.dbConn = { host: connInfoToUse.host, port: connInfoToUse.port, database: connInfoToUse.database, user: connInfoToUse.user };
            try {
                // finalizeLogin informational logging removed
            } catch (e) { /* ignore logging errors */ }
        };

        // If this is a special DB user, attempt the original DB connection test using provided credentials.
        if (isSpecialDbUser) {
            await (async () => {
                const mysql2 = require('mysql2/promise');
                const conn = await mysql2.createConnection({
                    host: connInfo.host,
                    port: connInfo.port,
                    user: connInfo.user,
                    password: connInfo.password,
                    database: connInfo.database,
                    connectTimeout: 7000,
                    ssl: connInfo.ssl ? { rejectUnauthorized: false } : undefined
                });
                await conn.end();
            })();

            // If test connection succeeded, initialize app DB helpers and middleware
            // For special DB users we don't have an app users.row id; cache role as 'admin' when applicable
            finalizeLogin(connInfo, user, (user === 'doadmin'), null, (user === 'doadmin') ? 'admin' : null);
            // Regenerate the session to ensure a clean, persisted session state then save
            if (req.session && typeof req.session.regenerate === 'function') {
                return req.session.regenerate(function(err) {
                    if (err) console.warn('session.regenerate error (special DB user):', err);
                    req.session.loggedIn = true;
                    req.session.username = user;
                    req.session.isAdmin = (user === 'doadmin');
                    req.session.dbConn = { host: connInfo.host, port: connInfo.port, database: connInfo.database, user: connInfo.user };
                    try { /* session after regenerate (special DB user) logging removed */ } catch (e) {}
                    return req.session.save(function(err2) { if (err2) console.warn('session.save error (special DB user):', err2); return res.redirect('/home'); });
                });
            }
            if (req.session && typeof req.session.save === 'function') {
                return req.session.save(function(err) { if (err) console.warn('session.save error (special DB user fallback):', err); return res.redirect('/home'); });
            }
            return res.redirect('/home');
        }

        // Otherwise, try to authenticate against the application's `users` table.
        // Prefer using the existing pool if already initialized; otherwise use the repo config connection.
        const bcrypt = require('bcryptjs');
        const appDbConfig = require('./app/config/database.js').connection || {};
        let userRow = null;

        try {
            // Always use the minimally-privileged app_guest short-lived connection to read the users table for authentication.
            // This ensures authentication does not depend on any existing app pool.
            const mysql2 = require('mysql2/promise');
            const conn = await mysql2.createConnection({
                host: guestDbOptions.host,
                port: guestDbOptions.port,
                user: guestDbOptions.user,
                password: guestDbOptions.password,
                database: guestDbOptions.database,
                connectTimeout: 7000,
                ssl: guestDbOptions.ssl ? { rejectUnauthorized: false } : undefined
            });
                try {
                // Note: intentionally do NOT select `role` here because the minimal 'app_guest'
                // account may not have SELECT privileges for that column. The authoritative
                // role will be re-read later using a short-lived sai_user connection when available.
                const [rows] = await conn.query('SELECT id, username, password, email FROM ' + (require('./app/config/database.js').users_table || 'users') + ' WHERE username = ? LIMIT 1', [user]);
                if (rows && rows.length > 0) userRow = rows[0];
            } finally {
                try { await conn.end(); } catch (e) { /* ignore */ }
            }
        } catch (guestErr) {
            // If the app_guest read fails, treat as authentication failure; do NOT fall back to an existing pool.
            console.warn('Guest DB read failed for users-table auth; authentication cannot proceed using existing pools:', guestErr && guestErr.message ? guestErr.message : guestErr);
            userRow = null;
        }

        if (userRow) {
                // Before attempting password verification, check if account is locked (best-effort)
            try {
                const status = await getAccountStatus(userRow.username || user);
                if (status && status.locked) {
                    if (req.session) req.session.loginError = 'Your account has been locked due to repeated failed login attempts. Contact your administrator to unlock and reset your password.';
                    return res.redirect('/login');
                }
            } catch (e) {
                console.warn('Failed to check account lock status before authenticate:', e && e.message ? e.message : e);
            }

            // Compare provided password with stored hash
            const match = await bcrypt.compare(password, userRow.password || userRow.password_hash || '');
            if (match) {
                // Successful auth against users table. We do NOT rely on the guest read for the
                // user's role (the guest account may not have SELECT permission on the role
                // column). Start with an empty role and then attempt to re-read the authoritative
                // role using a short-lived sai_user connection if available.
                let roleLower = '';
                // User authenticated informational logging removed

                // Try to re-query the role under a short-lived sai_user connection so role-based pool
                // initialization/upgrades use the value obtained by the sai_user service account.
                try {
                    await withRoleConn('user', async (conn) => {
                        try {
                            const [rrows] = await conn.query('SELECT role FROM ' + (require('./app/config/database.js').users_table || 'users') + ' WHERE username = ? LIMIT 1', [userRow.username || user]);
                            if (rrows && rrows.length > 0) {
                                roleLower = String(rrows[0].role || '').toLowerCase();
                            }
                        } catch (qerr) {
                            // Query error inside role-conn: log and continue using guest-provided role
                            console.warn('sai_user role read query failed:', qerr && qerr.message ? qerr.message : qerr);
                        }
                    });
                    // Role re-read informational logging removed
                } catch (e) {
                    // If withRoleConn fails (e.g., env not configured), continue using the guest-provided role
                    console.warn('Failed to re-read role using sai_user short-lived connection; continuing with guest role:', e && e.message ? e.message : e);
                }

                // Build base connection info values (host/port/database).
                // Prefer explicit environment overrides (DB_HOST/DB_PORT/DB_NAME), then app config, then development cfg, then guestDbOptions.
                const baseHost = process.env.DB_HOST || (appDbConfig && appDbConfig.host) || (cfg.development && cfg.development.host) || guestDbOptions.host || '127.0.0.1';
                const basePort = process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : ((appDbConfig && appDbConfig.port) || (cfg.development && cfg.development.port) || guestDbOptions.port || 3306);
                const baseDatabase = process.env.DB_NAME || (appDbConfig && appDbConfig.database) || (cfg.development && cfg.development.database) || guestDbOptions.database || 'saidb';

                // Helper to build connInfo objects
                function makeConnInfo(u, p) {
                    return { host: baseHost, port: basePort, database: baseDatabase, user: u, password: p, ssl: (appDbConfig && appDbConfig.ssl) || false };
                }

                // Preferred: initialize the pool under a minimally-privileged 'sai_user' service account if configured.
                const saiUserEnvUser = process.env.SAI_USER_DB_USER;
                const saiUserEnvPass = process.env.SAI_USER_DB_PASS;

                // Role-based upgrade credentials
                const saiEngUser = process.env.SAI_ENG_DB_USER;
                const saiEngPass = process.env.SAI_ENG_DB_PASS;
                const saiAdminUser = process.env.SAI_ADMIN_DB_USER;
                const saiAdminPass = process.env.SAI_ADMIN_DB_PASS;

                // Regenerate session to avoid fixation and persist a clean session state after pool init(s)
                if (req.session && typeof req.session.regenerate === 'function') {
                    return req.session.regenerate(async function(err) {
                        if (err) console.warn('session.regenerate error (users-table flow):', err);

                        // Default session fields
                        req.session.loggedIn = true;
                        req.session.username = userRow.username || user;
                        req.session.isAdmin = (roleLower === 'admin' || roleLower === 'administrator');
                        // Cache user id and role for faster access in view middleware
                        req.session.userId = userRow.id || null;
                        req.session.role = roleLower || null;

                        try {
                            // Initialize pool with sai_user if available
                            if (saiUserEnvUser && saiUserEnvPass) {
                                try {
                                    const connInfo = makeConnInfo(saiUserEnvUser, saiUserEnvPass);
                                    db.init(connInfo);
                                    attachDbMiddleware(connInfo);
                                    req.session.dbConn = { host: connInfo.host, port: connInfo.port, database: connInfo.database, user: connInfo.user };
                                    // Initialized pool with sai_user logging removed
                                } catch (e) {
                                    console.warn('Failed to init pool with sai_user credentials:', e && e.message ? e.message : e);
                                }
                            }

                            // Upgrade to role-specific service account if configured
                            if (roleLower === 'engineer' && saiEngUser && saiEngPass) {
                                try {
                                    const connInfo = makeConnInfo(saiEngUser, saiEngPass);
                                    db.init(connInfo);
                                    attachDbMiddleware(connInfo);
                                    req.session.dbConn = { host: connInfo.host, port: connInfo.port, database: connInfo.database, user: connInfo.user };
                                    // Upgraded pool to sai_eng logging removed
                                } catch (e) {
                                    console.warn('Failed to upgrade pool to sai_eng:', e && e.message ? e.message : e);
                                }
                            } else if ((roleLower === 'admin' || roleLower === 'administrator') && saiAdminUser && saiAdminPass) {
                                try {
                                    const connInfo = makeConnInfo(saiAdminUser, saiAdminPass);
                                    db.init(connInfo);
                                    attachDbMiddleware(connInfo);
                                    req.session.dbConn = { host: connInfo.host, port: connInfo.port, database: connInfo.database, user: connInfo.user };
                                    // Upgraded pool to sai_admin logging removed
                                } catch (e) {
                                    console.warn('Failed to upgrade pool to sai_admin:', e && e.message ? e.message : e);
                                }
                            }
                        } catch (flowErr) {
                            console.warn('Error during users-table post-auth pool init/upgrade:', flowErr && flowErr.message ? flowErr.message : flowErr);
                        }

                        // Best-effort: update last_login now that pools (possibly) initialized
                        try {
                            await updateLastLogin(req, req.session.username);
                        } catch (e) {
                            console.warn('updateLastLogin failed (users-table regenerate):', e && e.message ? e.message : e);
                        }

                        // Reset failed login attempts on successful login
                        try {
                            await resetFailedAttempts(req.session.username);
                        } catch (e) {
                            console.warn('resetFailedAttempts failed (users-table regenerate):', e && e.message ? e.message : e);
                        }

                        // Persist session and redirect
                        try { /* session after regenerate (users-table) logging removed */ } catch (e) {}
                        return req.session.save(function(err2) {
                            if (err2) console.warn('session.save error (users-table final):', err2);
                            return res.redirect('/home');
                        });
                    });
                }

                // Fallback if regenerate not available: set session fields and attempt pool init synchronously
                req.session = req.session || {};
                req.session.loggedIn = true;
                req.session.username = userRow.username || user;
                req.session.isAdmin = (roleLower === 'admin' || roleLower === 'administrator');
                // Cache user id and role
                req.session.userId = userRow.id || null;
                req.session.role = roleLower || null;
                try {
                    if (saiUserEnvUser && saiUserEnvPass) {
                        const connInfo = makeConnInfo(saiUserEnvUser, saiUserEnvPass);
                        db.init(connInfo);
                        attachDbMiddleware(connInfo);
                        req.session.dbConn = { host: connInfo.host, port: connInfo.port, database: connInfo.database, user: connInfo.user };
                    }
                    if (roleLower === 'engineer' && saiEngUser && saiEngPass) {
                        const connInfo = makeConnInfo(saiEngUser, saiEngPass);
                        db.init(connInfo);
                        attachDbMiddleware(connInfo);
                        req.session.dbConn = { host: connInfo.host, port: connInfo.port, database: connInfo.database, user: connInfo.user };
                    } else if ((roleLower === 'admin' || roleLower === 'administrator') && saiAdminUser && saiAdminPass) {
                        const connInfo = makeConnInfo(saiAdminUser, saiAdminPass);
                        db.init(connInfo);
                        attachDbMiddleware(connInfo);
                        req.session.dbConn = { host: connInfo.host, port: connInfo.port, database: connInfo.database, user: connInfo.user };
                    }
                } catch (e) {
                    console.warn('Fallback users-table pool init failed:', e && e.message ? e.message : e);
                }

                // Best-effort update last_login before saving session
                try {
                    await updateLastLogin(req, req.session.username);
                } catch (e) {
                    console.warn('updateLastLogin failed (users-table fallback):', e && e.message ? e.message : e);
                }

                // Reset failed login attempts on successful login (fallback path)
                try {
                    await resetFailedAttempts(req.session.username);
                } catch (e) {
                    console.warn('resetFailedAttempts failed (users-table fallback):', e && e.message ? e.message : e);
                }

                // Final save/redirect
                try { /* session before save (users-table fallback) logging removed */ } catch (e) {}
                if (req.session && typeof req.session.save === 'function') {
                    return req.session.save(function(err) { if (err) console.warn('session.save error (users-table fallback):', err); return res.redirect('/home'); });
                }
                return res.redirect('/home');
            }
            // Password mismatch: increment failed count and possibly lock the account
            console.warn('Authentication failed: password mismatch for user', user);
            try {
                await recordFailedLogin(user);
                // Check lock status (read-only) using guest account
                try {
                    const status = await getAccountStatus(user);
                    if (status && status.locked) {
                        if (req.session) req.session.loginError = 'Your account has been locked after too many failed login attempts. Contact admin to unlock and reset your password.';
                    } else {
                        if (req.session) req.session.loginError = 'Username or password are incorrect.';
                    }
                } catch (e2) {
                    console.warn('Failed to read account status after failed login:', e2 && e2.message ? e2.message : e2);
                    if (req.session) req.session.loginError = 'Username or password are incorrect.';
                }
            } catch (e) {
                console.warn('recordFailedLogin failed:', e && e.message ? e.message : e);
                if (req.session) req.session.loginError = 'Username or password are incorrect.';
            }
            return res.redirect('/login');
        }

        // If users-table auth didn't succeed, fall back to original behavior: attempt to connect to DB using provided credentials
        await (async () => {
            const mysql2 = require('mysql2/promise');
            const conn = await mysql2.createConnection({
                host: connInfo.host,
                port: connInfo.port,
                user: connInfo.user,
                password: connInfo.password,
                database: connInfo.database,
                connectTimeout: 7000,
                ssl: connInfo.ssl ? { rejectUnauthorized: false } : undefined
            });
            await conn.end();
        })();

        // If test connection succeeded, initialize app DB helpers and middleware
        // For DB-authenticated users we don't have an app users.row id here; cache role for doadmin
        finalizeLogin(connInfo, user, (user === 'doadmin'), null, (user === 'doadmin') ? 'admin' : null);
        // Regenerate session and persist auth fields so the store contains loggedIn=true
        if (req.session && typeof req.session.regenerate === 'function') {
            return req.session.regenerate(function(err) {
                if (err) console.warn('session.regenerate error (finalizeLogin fallback):', err);
                req.session.loggedIn = true;
                req.session.username = user;
                req.session.isAdmin = (user === 'doadmin');
                req.session.dbConn = { host: connInfo.host, port: connInfo.port, database: connInfo.database, user: connInfo.user };
                try { /* session after regenerate (finalizeLogin fallback) logging removed */ } catch (e) {}
                return req.session.save(function(err2) { if (err2) console.warn('session.save error (finalizeLogin fallback):', err2); return res.redirect('/home'); });
            });
        }
        if (req.session && typeof req.session.save === 'function') {
            try { /* session before save (finalizeLogin fallback) logging removed */ } catch (e) {}
            return req.session.save(function(err) { try { /* session after save (finalizeLogin fallback) logging removed */ } catch (e) {} return res.redirect('/home'); });
        }
        return res.redirect('/home');
    } catch (e) {
        // On failure, log the error server-side and set a friendly, non-sensitive message for the UI.
        console.error('Login DB init/test failed:', e && e.stack ? e.stack : e);

        // Map common error messages to clearer user-facing strings without leaking details
        let friendlyMsg = 'Unable to login. Please check your username and password.';
        const msg = (e && e.message) ? e.message.toLowerCase() : '';

        if (msg.includes('access denied') || msg.includes('authentication')) {
            friendlyMsg = 'Username or password are incorrect.';
        } else if (msg.includes('getaddrinfo') || msg.includes('enotfound') || msg.includes('econnrefused') || msg.includes('connecttimeout')) {
            friendlyMsg = 'Unable to reach the database host. Please check network and server settings.';
        } else if (msg.includes('timedout') || msg.includes('connecttimeout')) {
            friendlyMsg = 'Connection timed out while contacting the database. Try again or check network connectivity.';
        }

        if (req.session) {
            req.session.loginError = friendlyMsg;
        }
        return res.redirect('/login');
    }
});

// Middleware to require login for all subsequent routes
function requireLogin(req, res, next) {
    // Allow health, login and static asset routes
    // Allow internal launcher endpoints that begin with /__ (status/shutdown) without auth
    if (req.path === '/login' || req.path.startsWith('/public') || req.path === '/favicon.ico' || req.path.startsWith('/__')) return next();
    // Allow public pages that must be reachable without authentication:
    // - login page
    // - static assets under /public
    // - favicon
    // - internal endpoints starting with /__
    // - account request page (/request-account) so new users can request accounts
    if (
        req.path === '/login' ||
        req.path.startsWith('/public') ||
        req.path === '/favicon.ico' ||
        req.path.startsWith('/__') ||
        req.path === '/reset-password' ||
        req.path.startsWith('/reset-password') ||
        req.path === '/request-account' ||
        req.path.startsWith('/request-account')
    ) return next();
        if (req.session && req.session.loggedIn) {
            return next();
        }
        // Debug logging: show when a request is rejected due to missing session
        try {
            const s = req.session || {};
            // requireLogin informational logging removed
            // Also attempt to read the session directly from the session store for the given sessionID
            try {
                if (req.sessionID && req.sessionStore && typeof req.sessionStore.get === 'function') {
                    req.sessionStore.get(req.sessionID, function(storeErr, storeData) {
                        if (storeErr) console.warn('requireLogin: sessionStore.get error:', storeErr);
                        // requireLogin sessionStore.get informational logging removed
                    });
                }
            } catch (se) { /* ignore */ }
        } catch (e) { /* ignore logging errors */ }
        return res.redirect('/login');
}

// Apply auth middleware before route registration
app.use(requireLogin);

// Expose session info to views (so EJS can show/hide admin links)
app.use(async function(req, res, next) {
    res.locals.loggedIn = req.session && req.session.loggedIn ? true : false;
    res.locals.currentUser = req.session && req.session.username ? req.session.username : null;
    res.locals.isAdmin = false;
    res.locals.DEBUG_HEADER = process && process.env && process.env.DEBUG_HEADER === 'true';

    // Expose a concise user object to views for convenience
    res.locals.user = {
        id: (req.session && typeof req.session.userId !== 'undefined') ? req.session.userId : null,
        username: res.locals.currentUser,
        role: (req.session && typeof req.session.role !== 'undefined') ? req.session.role : null
    };

    try {

        // Fast path: session-level isAdmin (set at login for doadmin)
        if (req.session && req.session.isAdmin) {
            res.locals.isAdmin = true;
            // ensure view user role reflects admin flag if explicit role not cached
            if (!res.locals.user.role) res.locals.user.role = 'admin';
            return next();
        }

        // If role cached in session, use it (avoids per-request DB lookup)
        if (req.session && req.session.role) {
            const roleLowerCached = String(req.session.role || '').toLowerCase();
            if (roleLowerCached === 'admin' || roleLowerCached === 'administrator') {
                res.locals.isAdmin = true;
            }
            // reflect cached role in res.locals.user
            res.locals.user.role = roleLowerCached || res.locals.user.role;
            return next();
        }

        // If we have a logged-in username, attempt to check users.role in the DB.
        const username = req.session && req.session.username ? req.session.username : null;
        if (!username) return next();

        // Helper to run a single query using a short-lived sai_user connection when available,
        // otherwise fall back to req.getConnection or the app-level pool.
        async function queryRole() {
            // Prefer an authoritative read using the sai_user short-lived connection if configured.
            try {
                // Attempt to use withRoleConn('user') which will read SAI_USER_* env vars if present.
                if (typeof withRoleConn === 'function') {
                    try {
                        const rows = await withRoleConn('user', async (conn) => {
                            const [r] = await conn.query('SELECT role FROM ' + (require('./app/config/database.js').users_table || 'users') + ' WHERE username = ? LIMIT 1', [username]);
                            return r;
                        });
                        if (rows && rows.length > 0) return rows;
                    } catch (wcErr) {
                        // If withRoleConn failed (not configured or connection error), log and continue to fallback paths
                        console.warn('withRoleConn(sai_user) failed while querying role:', wcErr && wcErr.message ? wcErr.message : wcErr);
                    }
                }
            } catch (e) {
                // Continue to fallback logic
                console.warn('Unexpected error attempting sai_user role read:', e && e.message ? e.message : e);
            }

            // Use express-myconnection if present on the request
            if (typeof req.getConnection === 'function') {
                return await new Promise((resolve, reject) => {
                    req.getConnection(function(err, conn) {
                        if (err) return reject(err);
                        conn.query('SELECT role FROM users WHERE username = ? LIMIT 1', [username], function(qErr, rows) {
                            if (qErr) return reject(qErr);
                            resolve(rows);
                        });
                    });
                });
            }

            // Fallback to app-level pool if initialized
            if (db.isInitialized()) {
                return await db.querySql('SELECT role FROM users WHERE username = ? LIMIT 1', [username]);
            }

            // No DB available
            return null;
        }

        const rows = await queryRole();
        if (rows && rows.length > 0) {
            const role = rows[0].role || '';
            // update locals with authoritative role
            res.locals.user.role = role || res.locals.user.role;
            if (role === 'admin') res.locals.isAdmin = true;
        }
    } catch (ex) {
        // Non-fatal: if role check fails, don't break page render — just keep isAdmin false
        console.warn('Failed to determine admin role for user in view middleware:', ex && ex.message ? ex.message : ex);
    }

    if (process && process.env && process.env.DEBUG_HEADER === 'true') {
        try {
            // view-middleware session logging removed
        } catch (e) { /* ignore logging errors */ }
    }

    return next();
});

//routes used for different components of the app - split up to make it easier to work with
//look at the app/routes folder for where to be directed to next
require('./app/routes/main.js')(app); //Main Router
require('./app/routes/admin.js')(app); // Admin Router (RBAC)
require('./app/routes/pdfDxfBinBom.js')(app); //PDF DXF BIN BOM Router
require('./app/routes/submittal.js')(app); //Submittal Router
require('./app/routes/mbom.js')(app); //MBOM router
require('./app/routes/slimVAC.js')(app); //SlimVAC Router
require('./app/routes/partComparison.js')(app); //partComparison Router
require('./app/routes/rename.js')(app); //Rename Router

// Profile routes (user-facing)
try {
    const profileController = require('./app/controllers/profileController');
    if (profileController && typeof profileController.routes === 'function') {
        profileController.routes(app);
    }
} catch (e) {
    console.warn('Failed to mount profileController routes:', e && e.message ? e.message : e);
}

// Logout route - destroys session and redirects to login
app.get('/logout', function(req, res) {
    if (req.session) {
        req.session.destroy(function(err) {
            res.clearCookie && res.clearCookie('connect.sid');
            try {
                // Reset DB pool on logout so next login re-initializes connection options
                const db = require('./app/config/db');
                if (db && typeof db.close === 'function') {
                    db.close().catch(function(e) { /* ignore close errors */ });
                }
            } catch (e) {
                // ignore
            }
            return res.redirect('/login');
        });
    } else {
        return res.redirect('/login');
    }
});

//starts up app and sets up listening on port 3000
// Expose a private shutdown endpoint (only accessible from localhost) to allow graceful shutdown from the launcher
app.post('/__shutdown', function(req, res) {
    // Ensure the request originates from localhost
    const remote = req.ip || req.connection.remoteAddress || '';
    if (!(remote === '127.0.0.1' || remote === '::1' || remote === '::ffff:127.0.0.1')) {
        res.status(403).send('Forbidden');
        return;
    }

    if (!validateLauncherSecret(req)) {
        res.status(403).send('Forbidden - invalid launcher secret');
        return;
    }

    res.send({ status: 'shutting down', activeRequests: activeRequests });
    // Close the server gracefully then exit
    if (server) {
        server.close(() => {
            console.log('Server closed via /__shutdown');
            process.exit(0);
        });
        // Force exit if it doesn't close in reasonable time
        setTimeout(() => {
            console.log('Force exiting after shutdown timeout');
            process.exit(0);
        }, 5000);
    } else {
        process.exit(0);
    }
});

// Status endpoint used by launcher to determine if server is idle
app.get('/__status', function(req, res) {
    const remote = req.ip || req.connection.remoteAddress || '';
    if (!(remote === '127.0.0.1' || remote === '::1' || remote === '::ffff:127.0.0.1')) {
        res.status(403).send('Forbidden');
        return;
    }
    res.send({ activeRequests: activeRequests });
});

// Debug session inspector (local-only). Returns the current req.session and the store entry for troubleshooting.
app.get('/__debug_session', function(req, res) {
    const remote = req.ip || req.connection.remoteAddress || '';
    if (!(remote === '127.0.0.1' || remote === '::1' || remote === '::ffff:127.0.0.1')) {
        res.status(403).send('Forbidden');
        return;
    }
    const info = {
        sessionID: req.sessionID || null,
        reqSession: req.session || null,
        storeData: null,
        storeType: req.sessionStore && req.sessionStore.constructor ? req.sessionStore.constructor.name : null
    };
    try {
        if (req.sessionID && req.sessionStore && typeof req.sessionStore.get === 'function') {
            req.sessionStore.get(req.sessionID, function(err, data) {
                if (err) {
                    info.storeData = { error: String(err) };
                    return res.json(info);
                }
                info.storeData = data || null;
                return res.json(info);
            });
            return;
        }
    } catch (e) {
        info.storeData = { error: String(e) };
        return res.json(info);
    }
    return res.json(info);
});

// In-memory one-time token store for cross-browser login. Keys are tokens, values hold session info.
// Launcher secret (optional). If set, launcher must send X-Launcher-Secret header matching this value.
// Support embedding the secret into package.json at build time (electron-builder extraMetadata)
const fs = require('fs');
let LAUNCHER_SECRET = process.env.LAUNCHER_SECRET || null;
if (!LAUNCHER_SECRET) {
    try {
        // Attempt to read from package.json (packaged apps will include this)
        const pkgPath = path.join(__dirname, 'package.json');
        if (fs.existsSync(pkgPath)) {
            const pkg = require(pkgPath);
            LAUNCHER_SECRET = pkg.launcherSecret || (pkg.build && pkg.build.launcherSecret) || null;
        }
    } catch (e) {
        // ignore
        LAUNCHER_SECRET = LAUNCHER_SECRET || null;
    }
}
// Load runtime env overrides from package.json extraMetadata (runtimeEnv) when process.env lacks them.
// This allows CI to inject required DB values at build time so the packaged app can start.
try {
    const pkgPath2 = path.join(__dirname, 'package.json');
    if (fs.existsSync(pkgPath2)) {
        const pkg2 = require(pkgPath2);
        const runtimeEnv = pkg2.runtimeEnv || (pkg2.build && pkg2.build.runtimeEnv) || null;
        if (runtimeEnv && typeof runtimeEnv === 'object') {
            Object.keys(runtimeEnv).forEach(k => {
                try {
                    if ((!process.env[k] || process.env[k] === '') && runtimeEnv[k] != null) {
                        process.env[k] = String(runtimeEnv[k]);
                    }
                } catch (e) { /* ignore per-key errors */ }
            });
        }
    }
} catch (e) { /* ignore */ }
let warnedNoLauncherSecret = false;

function validateLauncherSecret(req) {
    if (!LAUNCHER_SECRET) {
        if (!warnedNoLauncherSecret) {
            console.warn('LAUNCHER_SECRET not set: launcher-secret header not enforced. Set LAUNCHER_SECRET in env for stricter security.');
            warnedNoLauncherSecret = true;
        }
        return true;
    }
    const header = req.get('X-Launcher-Secret') || req.get('x-launcher-secret') || '';
    return header === LAUNCHER_SECRET;
}

const oneTimeTokens = new Map();

// Create a one-time login token tied to the current session. Launcher will POST to this endpoint
// while including the session cookie so the server can map the token to the logged-in session.
// Token is single-use and expires shortly.
app.post('/__create_token', function(req, res) {
    const remote = req.ip || req.connection.remoteAddress || '';
    if (!(remote === '127.0.0.1' || remote === '::1' || remote === '::ffff:127.0.0.1')) {
        res.status(403).send('Forbidden');
        return;
    }

    if (!validateLauncherSecret(req)) {
        res.status(403).send('Forbidden - invalid launcher secret');
        return;
    }

    if (!req.session || !req.session.loggedIn) {
        return res.status(400).send({ error: 'Not logged in' });
    }

    const crypto = require('crypto');
    const token = crypto.randomBytes(24).toString('hex');
    // Store minimal session state needed to rehydrate in external browser.
    const payload = {
        dbConn: req.session.dbConn || null,
        loggedIn: true
    };
    oneTimeTokens.set(token, payload);
    // Auto-expire after 30s
    setTimeout(() => oneTimeTokens.delete(token), 30000);

    res.send({ token });
});

// Consume a one-time token and establish a session for the requesting browser, then redirect.
app.get('/__login_with_token', function(req, res) {
    const token = req.query && req.query.token ? String(req.query.token) : null;
    const dest = req.query && req.query.dest ? String(req.query.dest) : '/home';

    if (!token) return res.status(400).send('Missing token');

    const payload = oneTimeTokens.get(token);
    if (!payload) return res.status(400).send('Invalid or expired token');

    // Delete the token immediately to enforce single-use
    oneTimeTokens.delete(token);

    // Rehydrate session for this browser
    req.session.loggedIn = !!payload.loggedIn;
    if (payload.dbConn) req.session.dbConn = payload.dbConn;

    return res.redirect(dest);
});

// Start the HTTP server through Node's http module so we can call server.close() later for graceful shutdown
const http = require('http');
const server = http.createServer(app);
// Bind explicitly to 127.0.0.1 (loopback) to avoid listening on all interfaces
const LISTEN_HOST = process.env.LISTEN_HOST || '127.0.0.1';
const LISTEN_PORT = process.env.LISTEN_PORT || 3000;
server.listen(LISTEN_PORT, LISTEN_HOST, function(err) {
    if (!err)
        console.log(`App is live at http://${LISTEN_HOST}:${LISTEN_PORT}/`);
    else console.log(err)
});

