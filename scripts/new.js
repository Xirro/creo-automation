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


connection.query('USE ' + database, function(err,rows) { if(err) throw err; });


connection.query('\
CREATE TABLE IF NOT EXISTS ' + dbConfig.database + '.' + dbConfig.jobscope_classCodes_table + ' ( \
    idCode INT UNSIGNED NOT NULL AUTO_INCREMENT, \
    classCode VARCHAR(6) NULL, \
    PRIMARY KEY (idCode), \
    UNIQUE INDEX idClassCode_UNIQUE (idCode ASC))\
    ENGINE = InnoDB;', function(err,rows) { if(err) throw err; });

connection.query("INSERT INTO "+dbConfig.database+"."+dbConfig.jobscope_classCodes_table+" (classCode) VALUES " +
    "('STEEL'), " +
    "('ALUM'), " +
    "('GLAST'), " +
    "('WIRE'), " +
    "('PAINT'), " +
    "('INSUL'), " +
    "('COPPER'), " +
    "('MCCB'), " +
    "('ICCB'), " +
    "('SWITCH'), " +
    "('MVGEAR'), " +
    "('BUYOUT'), " +
    "('ELEC'), " +
    "('MECH') ", function (err, result) {
    if (err)
        console.log("Error inserting : %s ", err)
});


console.log('Success: Schema Created!');
