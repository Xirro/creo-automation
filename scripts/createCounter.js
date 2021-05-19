let mysql = require('mysql');
let dbConfig = require('../app/config/database');
let host = dbConfig.connection.host;
let user = dbConfig.connection.user;
let password = dbConfig.connection.password;
let database = dbConfig.connection.database;
let port = dbConfig.connection.port;

let connection = mysql.createConnection({
    host: host,
    user: user,
    password: password,
    port : port,
    multipleStatements: true,
});


//connection.query('DROP SCHEMA IF EXISTS ' + database, function(err,rows) { if(err) throw err; }); // DROPS RESIDUAL DATABASE/TABLES

//connection.query('CREATE DATABASE ' + database, function(err,rows) { if(err) throw err; }); // CREATES creoDB SCHEMA

connection.query('USE ' + database, function(err,rows) { if(err) throw err; });


//scriptCounter
connection.query('\
CREATE TABLE IF NOT EXISTS ' + database + '.' + dbConfig.script_counter_table + ' ( \
    idCounter INT NOT NULL AUTO_INCREMENT, \
    mbomCount INT NOT NULL, \
    binBomCount INT NOT NULL, \
    submittalCount INT NOT NULL, \
    partComparisonCount INT NOT NULL, \
    renameCount INT NOT NULL, \
    PRIMARY KEY (idCounter), \
    UNIQUE INDEX idCounter_UNIQUE (idCounter ASC))\
    ENGINE = InnoDB;', function(err,rows) { if(err) throw err; });


connection.query("INSERT INTO "+database+"."+dbConfig.script_counter_table+" (mbomCount, binBomCount, submittalCount, partComparisonCount, renameCount) VALUES " +
    "(236, 200, 7, 0, 0); ", function (err, result) { if(err) throw err; });


console.log("createCounter successful");

connection.end();