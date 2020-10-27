const express = require('express');
const app = express();
const session = require('express-session');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const path = require('path');
const flash = require('req-flash');

//For BodyParser
app.use(bodyParser.urlencoded({
    extended: true,
    limit: '200mb',
    parameterLimit: 50000
}));
app.use(bodyParser.json({
    extended: true,
    limit: '200mb'
}));
app.use(cookieParser());

// For Passport
app.use(session({ secret: 'saiapsportal',resave: true, saveUninitialized:true})); // session secret


//Database dependencies
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

//Connection to DB
app.use(myConnection(mysql, dbOptions, 'pool'));


// Setting up the views
app.set('views', './app/views');
app.set('view engine', 'ejs');


// Access public folder from root
app.use(express.static(path.join(__dirname, '/public')));
app.use('/public', express.static('public'));



app.get('/', function(req, res) {
    res.redirect('/home');
});


app.use(flash());

//Routes
require('./app/routes/main.js')(app); //Main Router
//require('./app/routes/creoson.js')(app); //creoSON Router
require('./app/routes/pdfDxfBinBom.js')(app); //PDF DXF BIN BOM Router
require('./app/routes/submittal.js')(app); //Submittal Router
require('./app/routes/mbom.js')(app); //MBOM router



//Start app
app.listen(3000, function(err) {
    if (!err)
        console.log("App is live at localhost:3000/");
    else console.log(err)
});

