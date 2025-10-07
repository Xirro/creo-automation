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
app.use(session({ secret: 'saiapsportal',resave: true, saveUninitialized:true})); //session secret

//database dependencies
let mysql = require('mysql');
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
    if (user === 'doadmin') {
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
        // Developer test hook: if username is 'simulateSlow', wait ~6s so the client spinner can be observed.
        if (user === 'simulateSlow') {
            await new Promise((r) => setTimeout(r, 6000));
        }
        // First, verify the credentials by attempting a short test connection.
        await new Promise((resolve, reject) => {
            const testConn = mysql.createConnection({
                host: connInfo.host,
                port: connInfo.port,
                user: connInfo.user,
                password: connInfo.password,
                database: connInfo.database,
                connectTimeout: 7000
            });
            testConn.connect(function(err) {
                if (err) {
                    try { testConn.end(); } catch (e) {}
                    return reject(err);
                }
                testConn.end(function(endErr) {
                    if (endErr) return reject(endErr);
                    return resolve();
                });
            });
        });

        // If test connection succeeded, initialize app DB helpers and middleware
        db.init(connInfo);
        attachDbMiddleware(connInfo);
        req.session.loggedIn = true;
        req.session.dbConn = { host: connInfo.host, port: connInfo.port, database: connInfo.database, user: connInfo.user };
        res.redirect('/home');
    } catch (e) {
        // On failure, log the error and use PRG to avoid form resubmission on refresh.
        console.error('Login DB init/test failed:', e && e.message ? e.message : e);
        if (req.session) {
            req.session.loginError = 'Username or password are incorrect.';
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

