//core imports - installed by npm via npm install and package.json file. use the require() statement to make use of installed packages
//express - a web framework for node.js => makes working with node.js easier
const express = require('express');
//express() creates the express application => we bind this to a variable app for easy access
const app = express();
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

//passes the mysql db connection to the app
app.use(myConnection(mysql, dbOptions, 'pool'));

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

//routes used for different components of the app - split up to make it easier to work with
//look at the app/routes folder for where to be directed to next
require('./app/routes/main.js')(app); //Main Router
require('./app/routes/pdfDxfBinBom.js')(app); //PDF DXF BIN BOM Router
require('./app/routes/submittal.js')(app); //Submittal Router
require('./app/routes/mbom.js')(app); //MBOM router
// require('./app/routes/slimVAC.js')(app); //SlimVAC Router
require('./app/routes/partComparison.js')(app); //partComparison Router
require('./app/routes/rename.js')(app); //Rename Router

//starts up app and sets up listening on port 3000
app.listen(3000, function(err) {
    if (!err)
        console.log("App is live at localhost:3000/");
    else console.log(err)
});

