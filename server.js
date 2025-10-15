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

//directs app to use/initialize the session
// session secret should come from environment in production. Provide a safe dev fallback.
const sessionSecret = process.env.SESSION_SECRET || 'dev-local-session-secret-change-me';
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

// If db module already initialized (dev environment), attach middleware
if (db.isInitialized()) {
    attachDbMiddleware({ host, user, password, port, database });
}

//directing the app where to look for the views, and also instructing it that the content is EJS (embedded javascript)
//EJS allows us to use dynamic values we pass in the render() calls to our otherwise static HTML files
app.set('views', './app/views');
app.set('view engine', 'ejs');

//gives app access to the public folder from root
app.use(express.static(path.join(__dirname, '/public')));
app.use('/public', express.static('public'));

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
    if (user === 'doadmin' || user === 'sai_eng' || user === 'sai_eng_admin') {
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
            return res.redirect('/home');
        }
        // First, verify the credentials by attempting a short test connection.
        // Use mysql2 to test connection using promise-based API
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
        db.init(connInfo);
        attachDbMiddleware(connInfo);
        req.session.loggedIn = true;
        req.session.dbConn = { host: connInfo.host, port: connInfo.port, database: connInfo.database, user: connInfo.user };
        res.redirect('/home');
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
    if (req.path === '/login' || req.path.startsWith('/public') || req.path === '/favicon.ico') return next();
    if (req.session && req.session.loggedIn) return next();
    return res.redirect('/login');
}

// Apply auth middleware before route registration
app.use(requireLogin);

//routes used for different components of the app - split up to make it easier to work with
//look at the app/routes folder for where to be directed to next
require('./app/routes/main.js')(app); //Main Router
require('./app/routes/pdfDxfBinBom.js')(app); //PDF DXF BIN BOM Router
require('./app/routes/submittal.js')(app); //Submittal Router
require('./app/routes/mbom.js')(app); //MBOM router
require('./app/routes/slimVAC.js')(app); //SlimVAC Router
require('./app/routes/partComparison.js')(app); //partComparison Router
require('./app/routes/rename.js')(app); //Rename Router

// Logout route - destroys session and redirects to login
app.get('/logout', function(req, res) {
    if (req.session) {
        req.session.destroy(function(err) {
            res.clearCookie && res.clearCookie('connect.sid');
            return res.redirect('/login');
        });
    } else {
        return res.redirect('/login');
    }
});

//starts up app and sets up listening on port 3000
app.listen(3000, function(err) {
    if (!err)
        console.log("App is live at localhost:3000/");
    else console.log(err)
});

