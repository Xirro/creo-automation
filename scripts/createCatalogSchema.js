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



//**************************************//
//******** PRODUCT PART NUMBERS ********//
//**************************************//

//productFamily_prod
connection.query('\
CREATE TABLE IF NOT EXISTS ' + database + '.' + dbConfig.prod_productFamily_table + ' ( \
    idFamily INT NOT NULL AUTO_INCREMENT, \
    code VARCHAR(2) NOT NULL, \
    description VARCHAR(100) NOT NULL, \
    PRIMARY KEY (idFamily), \
    UNIQUE INDEX idFamily_UNIQUE (idFamily ASC))\
    ENGINE = InnoDB;', function(err,rows) { if(err) throw err; });

connection.query("INSERT INTO "+database+"."+dbConfig.prod_productFamily_table+" (code, description) VALUES " +
    "('S1', 'SERIES 1 SWITCHBOARD'), " +
    "('S2', 'SERIES 2 SWITCHBOARD'), " +
    "('S3', 'SERIES 3 SWITCHBOARD'), " +
    "('SG', 'SERIES 1 SWITCHGEAR'), " +
    "('PD', 'POWER DISTRIBUTION UNIT'), " +
    "('SS', 'SUBSTATION'), " +
    "('AS', 'ANSI STD. SWITCHGEAR CLASS'), " +
    "('SV', '15kV SLIMVAC'), " +
    "('SA', '15kV SLIMVAC AR'); ", function (err, result) { if(err) throw err; });

//productLine_prod
connection.query('\
CREATE TABLE IF NOT EXISTS ' + database + '.' + dbConfig.prod_productLine_table + ' ( \
    idProdLine INT NOT NULL AUTO_INCREMENT, \
    code VARCHAR(2) NOT NULL, \
    description VARCHAR(100) NOT NULL, \
    PRIMARY KEY (idProdLine), \
    UNIQUE INDEX idProdLine_UNIQUE (idProdLine ASC))\
    ENGINE = InnoDB;', function(err,rows) { if(err) throw err; });

connection.query("INSERT INTO "+database+"."+dbConfig.prod_productLine_table+" (code, description) VALUES " +
    "('I', 'SIEMENS'), " +
    "('S', 'SCHNEIDER ELECTRIC'), " +
    "('A', 'ABB'), " +
    "('E', 'EATON'), " +
    "('L', 'LSIS'), " +
    "('G', 'GENERAL ELECTRIC'); ", function (err, result) { if(err) throw err; });

//systemVoltageLV_prod
connection.query('\
CREATE TABLE IF NOT EXISTS ' + database + '.' + dbConfig.prod_systemVoltage_LV_table + ' ( \
    idSystem INT NOT NULL AUTO_INCREMENT, \
    code VARCHAR(2) NOT NULL, \
    description VARCHAR(100) NOT NULL, \
    PRIMARY KEY (idSystem), \
    UNIQUE INDEX idSystem_UNIQUE (idSystem ASC))\
    ENGINE = InnoDB;', function(err,rows) { if(err) throw err; });

connection.query("INSERT INTO "+database+"."+dbConfig.prod_systemVoltage_LV_table+" (code, description) VALUES " +
    "('12', '208Y/120VAC - 3PH, 4W'), " +
    "('24', '240VAC - 3PH, 3W'), " +
    "('27', '480Y/277VAC - 3PH, 4W'), " +
    "('34', '600Y/347VAC - 3PH, 4W'), " +
    "('48', '480VAC - 3PH, 3W'), " +
    "('60', '600VAC - 3PH, 3W'), " +
    "('D1', '125VDC - 2W'), " +
    "('D2', '250VDC - 2W'), " +
    "('D5', '500VDC - 2W'), " +
    "('D6', '600VDC - 2W'), " +
    "('XX', 'OTHER'); ", function (err, result) { if(err) throw err; });


//systemVoltageMV_prod
connection.query('\
CREATE TABLE IF NOT EXISTS ' + database + '.' + dbConfig.prod_systemVoltage_MV_table + ' ( \
    idSystem INT NOT NULL AUTO_INCREMENT, \
    code VARCHAR(2) NOT NULL, \
    description VARCHAR(100) NOT NULL, \
    PRIMARY KEY (idSystem), \
    UNIQUE INDEX idSystem_UNIQUE (idSystem ASC))\
    ENGINE = InnoDB;', function(err,rows) { if(err) throw err; });

connection.query("INSERT INTO " + database + "." + dbConfig.prod_systemVoltage_MV_table + " (code, description) VALUES " +
    "('05', '5kV RANGE'), " +
    "('08', '7.5kV RANGE'), " +
    "('15', '12-15kV RANGE'), " +
    "('27', '27kV RANGE'), " +
    "('38', '33-38kV RANGE'); ", function (err, result) { if(err) throw err; });

//currentRating_prod
connection.query('\
CREATE TABLE IF NOT EXISTS ' + database + '.' + dbConfig.prod_currentRating_table + ' ( \
    idCurrent INT NOT NULL AUTO_INCREMENT, \
    code VARCHAR(2) NOT NULL, \
    description VARCHAR(100) NOT NULL, \
    PRIMARY KEY (idCurrent), \
    UNIQUE INDEX idCurrent_UNIQUE (idCurrent ASC))\
    ENGINE = InnoDB;', function(err,rows) { if(err) throw err; });

connection.query("INSERT INTO "+database+"."+dbConfig.prod_currentRating_table+" (code, description) VALUES " +
    "('02', '250A AND BELOW'), " +
    "('04', '400-600A'), " +
    "('08', '800A'), " +
    "('12', '1000-1200A'), " +
    "('16', '1600A'), " +
    "('20', '2000A'), " +
    "('25', '2500A'), " +
    "('32', '3000-3200A'), " +
    "('40', '4000A'), " +
    "('50', '5000A'), " +
    "('60', '6000A'), " +
    "('80', '8000A'), " +
    "('99', '10000A'); ", function (err, result) { if(err) throw err; });

//interruptingRatingLV_prod
connection.query('\
CREATE TABLE IF NOT EXISTS ' + database + '.' + dbConfig.prod_interruptingRating_LV_table + ' ( \
    idKAIC INT NOT NULL AUTO_INCREMENT, \
    code VARCHAR(2) NOT NULL, \
    description VARCHAR(100) NOT NULL, \
    PRIMARY KEY (idKAIC), \
    UNIQUE INDEX idKAIC_UNIQUE (idKAIC ASC))\
    ENGINE = InnoDB;', function(err,rows) { if(err) throw err; });

connection.query("INSERT INTO "+database+"."+dbConfig.prod_interruptingRating_LV_table+" (code, description) VALUES " +
    "('L', '35kA AND BELOW'), " +
    "('M', '42-65kA'), " +
    "('H', '85-100kA'), " +
    "('V', '150-200kA'); ", function (err, result) { if(err) throw err; });

//interruptingRatingMV_prod
connection.query('\
CREATE TABLE IF NOT EXISTS ' + database + '.' + dbConfig.prod_interruptingRating_MV_table + ' ( \
    idKAIC INT NOT NULL AUTO_INCREMENT, \
    code VARCHAR(2) NOT NULL, \
    description VARCHAR(100) NOT NULL, \
    PRIMARY KEY (idKAIC), \
    UNIQUE INDEX idKAIC_UNIQUE (idKAIC ASC))\
    ENGINE = InnoDB;', function(err,rows) { if(err) throw err; });

connection.query("INSERT INTO "+database+"."+dbConfig.prod_interruptingRating_MV_table+" (code, description) VALUES " +
    "('L', '31.5kA AND BELOW'), " +
    "('M', '40kA'), " +
    "('H', '50kA'), " +
    "('V', '63kA'); ", function (err, result) { if(err) throw err; });


//enclosure_prod
connection.query('\
CREATE TABLE IF NOT EXISTS ' + database + '.' + dbConfig.prod_enclosure_table + ' ( \
    idEnc INT NOT NULL AUTO_INCREMENT, \
    code VARCHAR(2) NOT NULL, \
    description VARCHAR(100) NOT NULL, \
    PRIMARY KEY (idEnc), \
    UNIQUE INDEX idEnc (idEnc ASC))\
    ENGINE = InnoDB;', function(err,rows) { if(err) throw err; });

connection.query("INSERT INTO "+database+"."+dbConfig.prod_enclosure_table+" (code, description) VALUES " +
    "('1', 'NEMA 1 INDOOR'), " +
    "('3', 'NEMA 3R OUTDOOR'), " +
    "('W', 'OUTDOOR WALK-IN'), " +
    "('C', 'CUSTOM'); ", function (err, result) { if(err) throw err; });


//finish_prod
connection.query('\
CREATE TABLE IF NOT EXISTS ' + database + '.' + dbConfig.prod_finish_table + ' ( \
    idFinish INT NOT NULL AUTO_INCREMENT, \
    code VARCHAR(2) NOT NULL, \
    description VARCHAR(100) NOT NULL, \
    PRIMARY KEY (idFinish), \
    UNIQUE INDEX idFinish_UNIQUE (idFinish ASC))\
    ENGINE = InnoDB;', function(err,rows) { if(err) throw err; });

connection.query("INSERT INTO "+database+"."+dbConfig.prod_finish_table+" (code, description) VALUES " +
    "('A', 'ANSI 61 GRAY'), " +
    "('B', 'ANSI 49 GRAY'), " +
    "('C', 'CUSTOM FINISH'), " +
    "('D', 'SE WHITE HIGH GLOSS'), " +
    "('E', 'RED BARON PPL94334'), " +
    "('F', 'GRAPHITE GRAY PRPL97024'), " +
    "('G', 'POST OFFICE BLUE PPL87314'), " +
    "('H', 'RAL9003 (GVM WHITE)'), " +
    "('I', 'SKY WHITE T9-WH1'), " +
    "('J', 'RAL5012 (PILLER BLUE)'), " +
    "('K', 'RAVEN BLACK'), " +
    "('L', 'SLIMVAC AR MV BEIGE'), " +
    "('X', 'NO PAINT'); ", function (err, result) { if(err) throw err; });

//accessibility_prod
connection.query('\
CREATE TABLE IF NOT EXISTS ' + database + '.' + dbConfig.prod_accessibility_table + ' ( \
    idAccess INT NOT NULL AUTO_INCREMENT, \
    code VARCHAR(2) NOT NULL, \
    description VARCHAR(100) NOT NULL, \
    PRIMARY KEY (idAccess), \
    UNIQUE INDEX idAccess_UNIQUE (idAccess ASC))\
    ENGINE = InnoDB;', function(err,rows) { if(err) throw err; });

connection.query("INSERT INTO "+database+"."+dbConfig.prod_accessibility_table+" (code, description) VALUES " +
    "('F', 'FRONT ONLY'), " +
    "('R', 'FRONT AND REAR'), " +
    "('S', 'FRONT AND SIDE'); ", function (err, result) { if(err) throw err; });


//controlVoltage_prod
connection.query('\
CREATE TABLE IF NOT EXISTS ' + database + '.' + dbConfig.prod_controlVoltage_table + ' ( \
    idCtrlVolt INT NOT NULL AUTO_INCREMENT, \
    code VARCHAR(2) NOT NULL, \
    description VARCHAR(100) NOT NULL, \
    PRIMARY KEY (idCtrlVolt), \
    UNIQUE INDEX idCtrlVolt_UNIQUE (idCtrlVolt ASC))\
    ENGINE = InnoDB;', function(err,rows) { if(err) throw err; });

connection.query("INSERT INTO "+database+"."+dbConfig.prod_controlVoltage_table+" (code, description) VALUES " +
    "('X', 'NO CONTROL'), " +
    "('A', '120VAC'), " +
    "('B', 'ALT. AC RATING'), " +
    "('D', '125VDC'), " +
    "('E', 'ALT. DC RATING'); ", function (err, result) { if(err) throw err; });


//**************************************//
//**** SLIMVAC SECTION PART NUMBERS ****//
//**************************************//

//productLine_secSV
connection.query('\
CREATE TABLE IF NOT EXISTS ' + database + '.' + dbConfig.secSV_productLine_table + ' ( \
    idProdLine INT NOT NULL AUTO_INCREMENT, \
    code VARCHAR(2) NOT NULL, \
    description VARCHAR(100) NOT NULL, \
    PRIMARY KEY (idProdLine), \
    UNIQUE INDEX idProdLine_UNIQUE (idProdLine ASC))\
    ENGINE = InnoDB;', function(err,rows) { if(err) throw err; });

connection.query("INSERT INTO "+database+"."+dbConfig.secSV_productLine_table+" (code, description) VALUES " +
    "('SV', 'SLIMVAC'); ", function (err, result) { if(err) throw err; });

//sectionType_secSV
connection.query('\
CREATE TABLE IF NOT EXISTS ' + database + '.' + dbConfig.secSV_sectionType_table + ' ( \
    idSecType INT NOT NULL AUTO_INCREMENT, \
    code VARCHAR(2) NOT NULL, \
    description VARCHAR(100) NOT NULL, \
    PRIMARY KEY (idSecType), \
    UNIQUE INDEX idSecType_UNIQUE (idSecType ASC))\
    ENGINE = InnoDB;', function(err,rows) { if(err) throw err; });

connection.query("INSERT INTO "+database+"."+dbConfig.secSV_sectionType_table+" (code, description) VALUES " +
    "('M', 'MAIN'), " +
    "('T', 'TIE'), " +
    "('F', 'FEEDER'), " +
    "('A', 'AUXILIARY'), " +
    "('C', 'CONTROL CABINET'), " +
    "('U', 'UTILITY METERING CABINET'); ", function (err, result) { if(err) throw err; });

//brkMfg_secSV
connection.query('\
CREATE TABLE IF NOT EXISTS ' + database + '.' + dbConfig.secSV_brkMfg_table + ' ( \
    idBrkMfg INT NOT NULL AUTO_INCREMENT, \
    code VARCHAR(2) NOT NULL, \
    description VARCHAR(100) NOT NULL, \
    PRIMARY KEY (idBrkMfg), \
    UNIQUE INDEX idBrkMfg_UNIQUE (idBrkMfg ASC))\
    ENGINE = InnoDB;', function(err,rows) { if(err) throw err; });

connection.query("INSERT INTO "+database+"."+dbConfig.secSV_brkMfg_table+" (code, description) VALUES " +
    "('A', 'ABB'); ", function (err, result) { if(err) throw err; });

//upperComp_secSV
connection.query('\
CREATE TABLE IF NOT EXISTS ' + database + '.' + dbConfig.secSV_upperComp_table + ' ( \
    idUpperComp INT NOT NULL AUTO_INCREMENT, \
    code VARCHAR(2) NOT NULL, \
    description VARCHAR(100) NOT NULL, \
    PRIMARY KEY (idUpperComp), \
    UNIQUE INDEX idUpperComp_UNIQUE (idUpperComp ASC))\
    ENGINE = InnoDB;', function(err,rows) { if(err) throw err; });

connection.query("INSERT INTO "+database+"."+dbConfig.secSV_upperComp_table+" (code, description) VALUES " +
    "('1', '1200A BRK'), " +
    "('2', '2000A BRK'), " +
    "('V', 'VT (BUS)'), " +
    "('L', 'VT (LUG)'), " +
    "('P', 'CPT (BUS)'), " +
    "('R', 'CPT (LUG)'), " +
    "('A', 'AUXILIARY COMPARTMENT'), " +
    "('T', 'BUS TRANSITION FOR TIE'); ", function (err, result) { if(err) throw err; });

//lowerComp_secSV
connection.query('\
CREATE TABLE IF NOT EXISTS ' + database + '.' + dbConfig.secSV_lowerComp_table + ' ( \
    idLowerComp INT NOT NULL AUTO_INCREMENT, \
    code VARCHAR(2) NOT NULL, \
    description VARCHAR(100) NOT NULL, \
    PRIMARY KEY (idLowerComp), \
    UNIQUE INDEX idLowerComp_UNIQUE (idLowerComp ASC))\
    ENGINE = InnoDB;', function(err,rows) { if(err) throw err; });

connection.query("INSERT INTO "+database+"."+dbConfig.secSV_lowerComp_table+" (code, description) VALUES " +
    "('1', '1200A BRK'), " +
    "('2', '2000A BRK'), " +
    "('V', 'VT (BUS)'), " +
    "('L', 'VT (LUG)'), " +
    "('P', 'CPT (BUS)'), " +
    "('R', 'CPT (LUG)'), " +
    "('A', 'AUXILIARY COMPARTMENT'), " +
    "('T', 'BUS TRANSITION FOR TIE'); ", function (err, result) { if(err) throw err; });

//kaRating_secSV
connection.query('\
CREATE TABLE IF NOT EXISTS ' + database + '.' + dbConfig.secSV_kaRating_table + ' ( \
    idKaRating INT NOT NULL AUTO_INCREMENT, \
    code VARCHAR(2) NOT NULL, \
    description VARCHAR(100) NOT NULL, \
    PRIMARY KEY (idKaRating), \
    UNIQUE INDEX idKaRating_UNIQUE (idKaRating ASC))\
    ENGINE = InnoDB;', function(err,rows) { if(err) throw err; });

connection.query("INSERT INTO "+database+"."+dbConfig.secSV_kaRating_table+" (code, description) VALUES " +
    "('3', '31.5kA OR BELOW'), " +
    "('4', '40kA'); ", function (err, result) { if(err) throw err; });

//mainBusRating_secSV
connection.query('\
CREATE TABLE IF NOT EXISTS ' + database + '.' + dbConfig.secSV_mainBusRating_table + ' ( \
    idMainBusRating INT NOT NULL AUTO_INCREMENT, \
    code VARCHAR(2) NOT NULL, \
    description VARCHAR(100) NOT NULL, \
    PRIMARY KEY (idMainBusRating), \
    UNIQUE INDEX idMainBusRating_UNIQUE (idMainBusRating ASC))\
    ENGINE = InnoDB;', function(err,rows) { if(err) throw err; });

connection.query("INSERT INTO "+database+"."+dbConfig.secSV_mainBusRating_table+" (code, description) VALUES " +
    "('12', '1200A'), " +
    "('20', '2000A'), " +
    "('NA', 'NO MAIN BUS'); ", function (err, result) { if(err) throw err; });

//enclosureWidth_secSV
connection.query('\
CREATE TABLE IF NOT EXISTS ' + database + '.' + dbConfig.secSV_enclosureWidth_table + ' ( \
    idEncWidth INT NOT NULL AUTO_INCREMENT, \
    code VARCHAR(2) NOT NULL, \
    description VARCHAR(100) NOT NULL, \
    PRIMARY KEY (idEncWidth), \
    UNIQUE INDEX idEncWidth_UNIQUE (idEncWidth ASC))\
    ENGINE = InnoDB;', function(err,rows) { if(err) throw err; });

connection.query("INSERT INTO "+database+"."+dbConfig.secSV_enclosureWidth_table+" (code, description) VALUES " +
    "('26', '26 IN. CABINET'), " +
    "('30', '30 IN. CABINET'), " +
    "('36', '36 IN. CABINET'), " +
    "('XX', 'CUSTOM'); ", function (err, result) { if(err) throw err; });

//enclosureType_secSV
connection.query('\
CREATE TABLE IF NOT EXISTS ' + database + '.' + dbConfig.secSV_enclosureType_table + ' ( \
    idEncType INT NOT NULL AUTO_INCREMENT, \
    code VARCHAR(2) NOT NULL, \
    description VARCHAR(100) NOT NULL, \
    PRIMARY KEY (idEncType), \
    UNIQUE INDEX idEncType_UNIQUE (idEncType ASC))\
    ENGINE = InnoDB;', function(err,rows) { if(err) throw err; });

connection.query("INSERT INTO "+database+"."+dbConfig.secSV_enclosureType_table+" (code, description) VALUES " +
    "('1', 'NEMA 1 INDOOR'), " +
    "('3', 'NEMA 3R OUTDOOR'), " +
    "('W', 'OUTDOOR WALK-IN'), " +
    "('C', 'CUSTOM'); ", function (err, result) { if(err) throw err; });


//cableEntry_secSV
connection.query('\
CREATE TABLE IF NOT EXISTS ' + database + '.' + dbConfig.secSV_cableEntry_table + ' ( \
    idCabEntry INT NOT NULL AUTO_INCREMENT, \
    code VARCHAR(2) NOT NULL, \
    description VARCHAR(100) NOT NULL, \
    PRIMARY KEY (idCabEntry), \
    UNIQUE INDEX idCabEntry_UNIQUE (idCabEntry ASC))\
    ENGINE = InnoDB;', function(err,rows) { if(err) throw err; });

connection.query("INSERT INTO "+database+"."+dbConfig.secSV_cableEntry_table+" (code, description) VALUES " +
    "('S', 'SINGLE TOP'), " +
    "('B', 'SINGLE BOTTOM'), " +
    "('T', 'DUAL TOP'), " +
    "('D', 'DUAL BOTTOM'), " +
    "('S', 'SPLIT TOP/BOTTOM'), " +
    "('N', 'NONE'); ", function (err, result) { if(err) throw err; });

//*****************************************//
//**** SLIMVAC AR SECTION PART NUMBERS ****//
//*****************************************//

//productLine_secSVAR
connection.query('\
CREATE TABLE IF NOT EXISTS ' + database + '.' + dbConfig.secSVAR_productLine_table + ' ( \
    idProdLine INT NOT NULL AUTO_INCREMENT, \
    code VARCHAR(2) NOT NULL, \
    description VARCHAR(100) NOT NULL, \
    PRIMARY KEY (idProdLine), \
    UNIQUE INDEX idProdLine_UNIQUE (idProdLine ASC))\
    ENGINE = InnoDB;', function(err,rows) { if(err) throw err; });

connection.query("INSERT INTO "+database+"."+dbConfig.secSVAR_productLine_table+" (code, description) VALUES " +
    "('SA', 'SLIMVAC AR'); ", function (err, result) { if(err) throw err; });

//sectionType_secSVAR
connection.query('\
CREATE TABLE IF NOT EXISTS ' + database + '.' + dbConfig.secSVAR_sectionType_table + ' ( \
    idSecType INT NOT NULL AUTO_INCREMENT, \
    code VARCHAR(2) NOT NULL, \
    description VARCHAR(100) NOT NULL, \
    PRIMARY KEY (idSecType), \
    UNIQUE INDEX idSecType_UNIQUE (idSecType ASC))\
    ENGINE = InnoDB;', function(err,rows) { if(err) throw err; });

connection.query("INSERT INTO "+database+"."+dbConfig.secSVAR_sectionType_table+" (code, description) VALUES " +
    "('M', 'MAIN'), " +
    "('T', 'TIE'), " +
    "('F', 'FEEDER'), " +
    "('A', 'AUXILIARY'), " +
    "('C', 'CONTROL CABINET'), " +
    "('U', 'UTILITY METERING CABINET'); ", function (err, result) { if(err) throw err; });

//brkMfg_secSVAR
connection.query('\
CREATE TABLE IF NOT EXISTS ' + database + '.' + dbConfig.secSVAR_brkMfg_table + ' ( \
    idBrkMfg INT NOT NULL AUTO_INCREMENT, \
    code VARCHAR(2) NOT NULL, \
    description VARCHAR(100) NOT NULL, \
    PRIMARY KEY (idBrkMfg), \
    UNIQUE INDEX idBrkMfg_UNIQUE (idBrkMfg ASC))\
    ENGINE = InnoDB;', function(err,rows) { if(err) throw err; });

connection.query("INSERT INTO "+database+"."+dbConfig.secSVAR_brkMfg_table+" (code, description) VALUES " +
    "('L', 'LSIS'); ", function (err, result) { if(err) throw err; });

//upperComp_secSVAR
connection.query('\
CREATE TABLE IF NOT EXISTS ' + database + '.' + dbConfig.secSVAR_upperComp_table + ' ( \
    idUpperComp INT NOT NULL AUTO_INCREMENT, \
    code VARCHAR(2) NOT NULL, \
    description VARCHAR(100) NOT NULL, \
    PRIMARY KEY (idUpperComp), \
    UNIQUE INDEX idUpperComp_UNIQUE (idUpperComp ASC))\
    ENGINE = InnoDB;', function(err,rows) { if(err) throw err; });

connection.query("INSERT INTO "+database+"."+dbConfig.secSVAR_upperComp_table+" (code, description) VALUES " +
    "('1', '1200A BRK'), " +
    "('2', '2000A BRK'), " +
    "('V', 'VT (BUS)'), " +
    "('L', 'VT (LUG)'), " +
    "('P', 'CPT (BUS)'), " +
    "('R', 'CPT (LUG)'), " +
    "('A', 'AUXILIARY COMPARTMENT'), " +
    "('F', 'FRONT ACCESS COMPARTMENT'); ", function (err, result) { if(err) throw err; });

//lowerComp_secSVAR
connection.query('\
CREATE TABLE IF NOT EXISTS ' + database + '.' + dbConfig.secSVAR_lowerComp_table + ' ( \
    idLowerComp INT NOT NULL AUTO_INCREMENT, \
    code VARCHAR(2) NOT NULL, \
    description VARCHAR(100) NOT NULL, \
    PRIMARY KEY (idLowerComp), \
    UNIQUE INDEX idLowerComp_UNIQUE (idLowerComp ASC))\
    ENGINE = InnoDB;', function(err,rows) { if(err) throw err; });

connection.query("INSERT INTO "+database+"."+dbConfig.secSVAR_lowerComp_table+" (code, description) VALUES " +
    "('F', 'FRONT ACCESS COMPARTMENT'), " +
    "('V', 'VT (BUS)'), " +
    "('L', 'VT (LUG)'), " +
    "('P', 'CPT (BUS)'), " +
    "('R', 'CPT (LUG)'), " +
    "('A', 'AUXILIARY COMPARTMENT'); ", function (err, result) { if(err) throw err; });

//kaRating_secSVAR
connection.query('\
CREATE TABLE IF NOT EXISTS ' + database + '.' + dbConfig.secSVAR_kaRating_table + ' ( \
    idKaRating INT NOT NULL AUTO_INCREMENT, \
    code VARCHAR(2) NOT NULL, \
    description VARCHAR(100) NOT NULL, \
    PRIMARY KEY (idKaRating), \
    UNIQUE INDEX idKaRating_UNIQUE (idKaRating ASC))\
    ENGINE = InnoDB;', function(err,rows) { if(err) throw err; });

connection.query("INSERT INTO "+database+"."+dbConfig.secSVAR_kaRating_table+" (code, description) VALUES " +
    "('3', '31.5kA OR BELOW'); ", function (err, result) { if(err) throw err; });

//mainBusRating_secSVAR
connection.query('\
CREATE TABLE IF NOT EXISTS ' + database + '.' + dbConfig.secSVAR_mainBusRating_table + ' ( \
    idMainBusRating INT NOT NULL AUTO_INCREMENT, \
    code VARCHAR(2) NOT NULL, \
    description VARCHAR(100) NOT NULL, \
    PRIMARY KEY (idMainBusRating), \
    UNIQUE INDEX idMainBusRating_UNIQUE (idMainBusRating ASC))\
    ENGINE = InnoDB;', function(err,rows) { if(err) throw err; });

connection.query("INSERT INTO "+database+"."+dbConfig.secSVAR_mainBusRating_table+" (code, description) VALUES " +
    "('12', '1200A'), " +
    "('20', '2000A'), " +
    "('NA', 'NO MAIN BUS'); ", function (err, result) { if(err) throw err; });

//enclosureWidth_secSVAR
connection.query('\
CREATE TABLE IF NOT EXISTS ' + database + '.' + dbConfig.secSVAR_enclosureWidth_table + ' ( \
    idEncWidth INT NOT NULL AUTO_INCREMENT, \
    code VARCHAR(2) NOT NULL, \
    description VARCHAR(100) NOT NULL, \
    PRIMARY KEY (idEncWidth), \
    UNIQUE INDEX idEncWidth_UNIQUE (idEncWidth ASC))\
    ENGINE = InnoDB;', function(err,rows) { if(err) throw err; });

connection.query("INSERT INTO "+database+"."+dbConfig.secSVAR_enclosureWidth_table+" (code, description) VALUES " +
    "('26', '26 IN. CABINET'), " +
    "('30', '30 IN. CABINET'), " +
    "('XX', 'ALTERNATE SIZE'); ", function (err, result) { if(err) throw err; });

//enclosureType_secSVAR
connection.query('\
CREATE TABLE IF NOT EXISTS ' + database + '.' + dbConfig.secSVAR_enclosureType_table + ' ( \
    idEncType INT NOT NULL AUTO_INCREMENT, \
    code VARCHAR(2) NOT NULL, \
    description VARCHAR(100) NOT NULL, \
    PRIMARY KEY (idEncType), \
    UNIQUE INDEX idEncType_UNIQUE (idEncType ASC))\
    ENGINE = InnoDB;', function(err,rows) { if(err) throw err; });

connection.query("INSERT INTO "+database+"."+dbConfig.secSVAR_enclosureType_table+" (code, description) VALUES " +
    "('1', 'NEMA 1 INDOOR'); ", function (err, result) { if(err) throw err; });

//cableEntry_secSVAR
connection.query('\
CREATE TABLE IF NOT EXISTS ' + database + '.' + dbConfig.secSVAR_cableEntry_table + ' ( \
    idCabEntry INT NOT NULL AUTO_INCREMENT, \
    code VARCHAR(2) NOT NULL, \
    description VARCHAR(100) NOT NULL, \
    PRIMARY KEY (idCabEntry), \
    UNIQUE INDEX idCabEntry_UNIQUE (idCabEntry ASC))\
    ENGINE = InnoDB;', function(err,rows) { if(err) throw err; });

connection.query("INSERT INTO "+database+"."+dbConfig.secSVAR_cableEntry_table+" (code, description) VALUES " +
    "('T', 'DUAL TOP'), " +
    "('B', 'DUAL BOTTOM'); ", function (err, result) { if(err) throw err; });

//*****************************************//
//***** SERIES 1 SECTION PART NUMBERS *****//
//*****************************************//

//productLine_secS1
connection.query('\
CREATE TABLE IF NOT EXISTS ' + database + '.' + dbConfig.secS1_productLine_table + ' ( \
    idProdLine INT NOT NULL AUTO_INCREMENT, \
    code VARCHAR(2) NOT NULL, \
    description VARCHAR(100) NOT NULL, \
    PRIMARY KEY (idProdLine), \
    UNIQUE INDEX idProdLine_UNIQUE (idProdLine ASC))\
    ENGINE = InnoDB;', function(err,rows) { if(err) throw err; });

connection.query("INSERT INTO "+database+"."+dbConfig.secS1_productLine_table+" (code, description) VALUES " +
    "('S1', 'SERIES 1 SWITCHBOARD'); ", function (err, result) { if(err) throw err; });

//brkMfg_secS1
connection.query('\
CREATE TABLE IF NOT EXISTS ' + database + '.' + dbConfig.secS1_brkMfg_table + ' ( \
    idBrkMfg INT NOT NULL AUTO_INCREMENT, \
    code VARCHAR(2) NOT NULL, \
    description VARCHAR(100) NOT NULL, \
    PRIMARY KEY (idBrkMfg), \
    UNIQUE INDEX idBrkMfg_UNIQUE (idBrkMfg ASC))\
    ENGINE = InnoDB;', function(err,rows) { if(err) throw err; });

connection.query("INSERT INTO "+database+"."+dbConfig.secS1_brkMfg_table+" (code, description) VALUES " +
    "('I', 'SIEMENS'), " +
    "('S', 'SQUARE D'), " +
    "('A', 'ABB'), " +
    "('E', 'EATON'), " +
    "('L', 'LSIS'), " +
    "('G', 'GENERAL ELECTRIC'), " +
    "('X', 'NO BREAKERS'); ", function (err, result) { if(err) throw err; });

//busLams_secS1
connection.query('\
CREATE TABLE IF NOT EXISTS ' + database + '.' + dbConfig.secS1_busLams_table + ' ( \
    idBusLam INT NOT NULL AUTO_INCREMENT, \
    code VARCHAR(2) NOT NULL, \
    description VARCHAR(100) NOT NULL, \
    PRIMARY KEY (idBusLam), \
    UNIQUE INDEX idBusLam_UNIQUE (idBusLam ASC))\
    ENGINE = InnoDB;', function(err,rows) { if(err) throw err; });

connection.query("INSERT INTO "+database+"."+dbConfig.secS1_busLams_table+" (code, description) VALUES " +
    "('1', '600A AND BELOW'), " +
    "('2', '800-1200A (1600-2500A CENTER TAPPED)'), " +
    "('3', '1600-2000A (3000-4000A CENTER TAPPED)'), " +
    "('X', 'NO BUS'); ", function (err, result) { if(err) throw err; });

//chassisType_secS1
connection.query('\
CREATE TABLE IF NOT EXISTS ' + database + '.' + dbConfig.secS1_chassisType_table + ' ( \
    idChassis INT NOT NULL AUTO_INCREMENT, \
    code VARCHAR(2) NOT NULL, \
    description VARCHAR(100) NOT NULL, \
    PRIMARY KEY (idChassis), \
    UNIQUE INDEX idChassis_UNIQUE (idChassis ASC))\
    ENGINE = InnoDB;', function(err,rows) { if(err) throw err; });

connection.query("INSERT INTO "+database+"."+dbConfig.secS1_chassisType_table+" (code, description) VALUES " +
    "('3', '3P3W, 3P4W EXT. N'), " +
    "('4', '3P4W W/ SWITCHED N'); ", function (err, result) { if(err) throw err; });

//tieRacks_secS1
connection.query('\
CREATE TABLE IF NOT EXISTS ' + database + '.' + dbConfig.secS1_tieRacks_table + ' ( \
    idTieRack INT NOT NULL AUTO_INCREMENT, \
    code VARCHAR(2) NOT NULL, \
    description VARCHAR(100) NOT NULL, \
    PRIMARY KEY (idTieRack), \
    UNIQUE INDEX idTieRack_UNIQUE (idTieRack ASC))\
    ENGINE = InnoDB;', function(err,rows) { if(err) throw err; });

connection.query("INSERT INTO "+database+"."+dbConfig.secS1_tieRacks_table+" (code, description) VALUES " +
    "('T', 'YES'), " +
    "('X', 'NO'); ", function (err, result) { if(err) throw err; });

//mainBusRating_secS1
connection.query('\
CREATE TABLE IF NOT EXISTS ' + database + '.' + dbConfig.secS1_mainBusRating_table + ' ( \
    idMainBus INT NOT NULL AUTO_INCREMENT, \
    code VARCHAR(2) NOT NULL, \
    description VARCHAR(100) NOT NULL, \
    PRIMARY KEY (idMainBus), \
    UNIQUE INDEX idMainBus_UNIQUE (idMainBus ASC))\
    ENGINE = InnoDB;', function(err,rows) { if(err) throw err; });

connection.query("INSERT INTO "+database+"."+dbConfig.secS1_mainBusRating_table+" (code, description) VALUES " +
    "('08', '800A'), " +
    "('10', '1000A'), " +
    "('12', '1200A'), " +
    "('16', '1600A'), " +
    "('20', '2000A'), " +
    "('25', '2500A'), " +
    "('30', '3000A'), " +
    "('32', '3200A'), " +
    "('40', '4000A'), " +
    "('50', '5000A'), " +
    "('60', '6000A'); ", function (err, result) { if(err) throw err; });

//interiorHeight_secS1
connection.query('\
CREATE TABLE IF NOT EXISTS ' + database + '.' + dbConfig.secS1_interiorHeight_table + ' ( \
    idInteriorHeight INT NOT NULL AUTO_INCREMENT, \
    code VARCHAR(2) NOT NULL, \
    description VARCHAR(100) NOT NULL, \
    PRIMARY KEY (idInteriorHeight), \
    UNIQUE INDEX idInteriorHeight_UNIQUE (idInteriorHeight ASC))\
    ENGINE = InnoDB;', function(err,rows) { if(err) throw err; });

connection.query("INSERT INTO "+database+"."+dbConfig.secS1_interiorHeight_table+" (code, description) VALUES " +
    "('1', '24X SPACE'), " +
    "('2', '30X SPACE'), " +
    "('3', '36X SPACE'), " +
    "('4', '42X SPACE'), " +
    "('5', '48X SPACE'); ", function (err, result) { if(err) throw err; });

//enclosureType_secS1
connection.query('\
CREATE TABLE IF NOT EXISTS ' + database + '.' + dbConfig.secS1_enclosureType_table + ' ( \
    idEncType INT NOT NULL AUTO_INCREMENT, \
    code VARCHAR(2) NOT NULL, \
    description VARCHAR(100) NOT NULL, \
    PRIMARY KEY (idEncType), \
    UNIQUE INDEX idEncType_UNIQUE (idEncType ASC))\
    ENGINE = InnoDB;', function(err,rows) { if(err) throw err; });

connection.query("INSERT INTO "+database+"."+dbConfig.secS1_enclosureType_table+" (code, description) VALUES " +
    "('1', 'NEMA 1 INDOOR'), " +
    "('3', 'NEMA 3R OUTDOOR'), " +
    "('C', 'CUSTOM'); ", function (err, result) { if(err) throw err; });

//accessibility_secS1
connection.query('\
CREATE TABLE IF NOT EXISTS ' + database + '.' + dbConfig.secS1_accessibility_table + ' ( \
    idAccess INT NOT NULL AUTO_INCREMENT, \
    code VARCHAR(2) NOT NULL, \
    description VARCHAR(100) NOT NULL, \
    PRIMARY KEY (idAccess), \
    UNIQUE INDEX idAccess_UNIQUE (idAccess ASC))\
    ENGINE = InnoDB;', function(err,rows) { if(err) throw err; });

connection.query("INSERT INTO "+database+"."+dbConfig.secS1_accessibility_table+" (code, description) VALUES " +
    "('F', 'FRONT ONLY'), " +
    "('R', 'FRONT AND REAR'), " +
    "('S', 'FRONT AND SIDE'); ", function (err, result) { if(err) throw err; });

//cabHeight_secS1
connection.query('\
CREATE TABLE IF NOT EXISTS ' + database + '.' + dbConfig.secS1_cabHeight_table + ' ( \
    idCabHeight INT NOT NULL AUTO_INCREMENT, \
    code VARCHAR(2) NOT NULL, \
    description VARCHAR(100) NOT NULL, \
    PRIMARY KEY (idCabHeight), \
    UNIQUE INDEX idCabHeight_UNIQUE (idCabHeight ASC))\
    ENGINE = InnoDB;', function(err,rows) { if(err) throw err; });

connection.query("INSERT INTO "+database+"."+dbConfig.secS1_cabHeight_table+" (code, description) VALUES " +
    "('1', '58 IN.'), " +
    "('2', '60 IN.'), " +
    "('3', '78 IN.'), " +
    "('4', '90 IN.'), " +
    "('5', '93 IN.'), " +
    "('C', 'CUSTOM'); ", function (err, result) { if(err) throw err; });

//cabWidth_secS1
connection.query('\
CREATE TABLE IF NOT EXISTS ' + database + '.' + dbConfig.secS1_cabWidth_table + ' ( \
    idCabWidth INT NOT NULL AUTO_INCREMENT, \
    code VARCHAR(2) NOT NULL, \
    description VARCHAR(100) NOT NULL, \
    PRIMARY KEY (idCabWidth), \
    UNIQUE INDEX idCabWidth_UNIQUE (idCabWidth ASC))\
    ENGINE = InnoDB;', function(err,rows) { if(err) throw err; });

connection.query("INSERT INTO "+database+"."+dbConfig.secS1_cabWidth_table+" (code, description) VALUES " +
    "('1', '16 IN.'), " +
    "('2', '32 IN.'), " +
    "('3', '38 IN.'), " +
    "('4', '42 IN.'), " +
    "('C', 'CUSTOM'); ", function (err, result) { if(err) throw err; });

//cabDepth_secS1
connection.query('\
CREATE TABLE IF NOT EXISTS ' + database + '.' + dbConfig.secS1_cabDepth_table + ' ( \
    idCabDepth INT NOT NULL AUTO_INCREMENT, \
    code VARCHAR(2) NOT NULL, \
    description VARCHAR(100) NOT NULL, \
    PRIMARY KEY (idCabDepth), \
    UNIQUE INDEX idCabDepth_UNIQUE (idCabDepth ASC))\
    ENGINE = InnoDB;', function(err,rows) { if(err) throw err; });

connection.query("INSERT INTO "+database+"."+dbConfig.secS1_cabDepth_table+" (code, description) VALUES " +
    "('1', '16 IN.'), " +
    "('2', '30 IN.'), " +
    "('3', '33 IN.'), " +
    "('4', '42 IN.'), " +
    "('5', '60 IN.'), " +
    "('C', 'CUSTOM'); ", function (err, result) { if(err) throw err; });

//ctrlBoxSize_secS1
connection.query('\
CREATE TABLE IF NOT EXISTS ' + database + '.' + dbConfig.secS1_ctrlBoxSize_table + ' ( \
    idCtrlSize INT NOT NULL AUTO_INCREMENT, \
    code VARCHAR(2) NOT NULL, \
    description VARCHAR(100) NOT NULL, \
    PRIMARY KEY (idCtrlSize), \
    UNIQUE INDEX idCtrlSize_UNIQUE (idCtrlSize ASC))\
    ENGINE = InnoDB;', function(err,rows) { if(err) throw err; });

connection.query("INSERT INTO "+database+"."+dbConfig.secS1_ctrlBoxSize_table+" (code, description) VALUES " +
    "('1', '8X'), " +
    "('2', '12X'), " +
    "('3', '18X'), " +
    "('C', 'CUSTOM'), " +
    "('X', 'NO CONTROL BOX'); ", function (err, result) { if(err) throw err; });

//cableEntry_secS1
connection.query('\
CREATE TABLE IF NOT EXISTS ' + database + '.' + dbConfig.secS1_cableEntry_table + ' ( \
    idCabEntry INT NOT NULL AUTO_INCREMENT, \
    code VARCHAR(2) NOT NULL, \
    description VARCHAR(100) NOT NULL, \
    PRIMARY KEY (idCabEntry), \
    UNIQUE INDEX idCabEntry_UNIQUE (idCabEntry ASC))\
    ENGINE = InnoDB;', function(err,rows) { if(err) throw err; });

connection.query("INSERT INTO "+database+"."+dbConfig.secS1_cableEntry_table+" (code, description) VALUES " +
    "('T', 'TOP'), " +
    "('B', 'BOTTOM'), " +
    "('D', 'DUAL/UNKNOWN'); ", function (err, result) { if(err) throw err; });

//*****************************************//
//***** SERIES 2 SECTION PART NUMBERS *****//
//*****************************************//

//productLine_secS2
connection.query('\
CREATE TABLE IF NOT EXISTS ' + database + '.' + dbConfig.secS2_productLine_table + ' ( \
    idProdLine INT NOT NULL AUTO_INCREMENT, \
    code VARCHAR(2) NOT NULL, \
    description VARCHAR(100) NOT NULL, \
    PRIMARY KEY (idProdLine), \
    UNIQUE INDEX idProdLine_UNIQUE (idProdLine ASC))\
    ENGINE = InnoDB;', function(err,rows) { if(err) throw err; });

connection.query("INSERT INTO "+database+"."+dbConfig.secS2_productLine_table+" (code, description) VALUES " +
    "('S2', 'SERIES 2 SWITCHBOARD'); ", function (err, result) { if(err) throw err; });

//brkMfg_secS2
connection.query('\
CREATE TABLE IF NOT EXISTS ' + database + '.' + dbConfig.secS2_brkMfg_table + ' ( \
    idBrkMfg INT NOT NULL AUTO_INCREMENT, \
    code VARCHAR(2) NOT NULL, \
    description VARCHAR(100) NOT NULL, \
    PRIMARY KEY (idBrkMfg), \
    UNIQUE INDEX idBrkMfg_UNIQUE (idBrkMfg ASC))\
    ENGINE = InnoDB;', function(err,rows) { if(err) throw err; });

connection.query("INSERT INTO "+database+"."+dbConfig.secS2_brkMfg_table+" (code, description) VALUES " +
    "('I', 'SIEMENS'), " +
    "('S', 'SQUARE D'), " +
    "('A', 'ABB'), " +
    "('E', 'EATON'), " +
    "('L', 'LSIS'), " +
    "('G', 'GENERAL ELECTRIC'), " +
    "('X', 'NO BREAKERS'); ", function (err, result) { if(err) throw err; });

//secBusRating_secS2
connection.query('\
CREATE TABLE IF NOT EXISTS ' + database + '.' + dbConfig.secS2_secBusRating_table + ' ( \
    idSecBus INT NOT NULL AUTO_INCREMENT, \
    code VARCHAR(2) NOT NULL, \
    description VARCHAR(100) NOT NULL, \
    PRIMARY KEY (idSecBus), \
    UNIQUE INDEX idSecBus_UNIQUE (idSecBus ASC))\
    ENGINE = InnoDB;', function(err,rows) { if(err) throw err; });

connection.query("INSERT INTO "+database+"."+dbConfig.secS2_secBusRating_table+" (code, description) VALUES " +
    "('02', '250A AND BELOW'), " +
    "('04', '400A'), " +
    "('06', '600A'), " +
    "('08', '800A'), " +
    "('10', '1000A'), " +
    "('12', '1200A'), " +
    "('16', '1600A'), " +
    "('20', '2000A'), " +
    "('25', '2500A'), " +
    "('30', '3000A'), " +
    "('32', '3200A'), " +
    "('40', '4000A'), " +
    "('50', '5000A'), " +
    "('60', '6000A'); ", function (err, result) { if(err) throw err; });

//mainBusRating_secS2
connection.query('\
CREATE TABLE IF NOT EXISTS ' + database + '.' + dbConfig.secS2_mainBusRating_table + ' ( \
    idMainBus INT NOT NULL AUTO_INCREMENT, \
    code VARCHAR(2) NOT NULL, \
    description VARCHAR(100) NOT NULL, \
    PRIMARY KEY (idMainBus), \
    UNIQUE INDEX idMainBus_UNIQUE (idMainBus ASC))\
    ENGINE = InnoDB;', function(err,rows) { if(err) throw err; });

connection.query("INSERT INTO "+database+"."+dbConfig.secS2_mainBusRating_table+" (code, description) VALUES " +
    "('08', '800A'), " +
    "('10', '1000A'), " +
    "('12', '1200A'), " +
    "('16', '1600A'), " +
    "('20', '2000A'), " +
    "('25', '2500A'), " +
    "('30', '3000A'), " +
    "('32', '3200A'), " +
    "('40', '4000A'), " +
    "('50', '5000A'), " +
    "('60', '6000A'); ", function (err, result) { if(err) throw err; });

//enclosureType_secS2
connection.query('\
CREATE TABLE IF NOT EXISTS ' + database + '.' + dbConfig.secS2_enclosureType_table + ' ( \
    idEncType INT NOT NULL AUTO_INCREMENT, \
    code VARCHAR(2) NOT NULL, \
    description VARCHAR(100) NOT NULL, \
    PRIMARY KEY (idEncType), \
    UNIQUE INDEX idEncType_UNIQUE (idEncType ASC))\
    ENGINE = InnoDB;', function(err,rows) { if(err) throw err; });

connection.query("INSERT INTO "+database+"."+dbConfig.secS2_enclosureType_table+" (code, description) VALUES " +
    "('1', 'NEMA 1 INDOOR'), " +
    "('3', 'NEMA 3R OUTDOOR'), " +
    "('C', 'CUSTOM'); ", function (err, result) { if(err) throw err; });

//accessibility_secS2
connection.query('\
CREATE TABLE IF NOT EXISTS ' + database + '.' + dbConfig.secS2_accessibility_table + ' ( \
    idAccess INT NOT NULL AUTO_INCREMENT, \
    code VARCHAR(2) NOT NULL, \
    description VARCHAR(100) NOT NULL, \
    PRIMARY KEY (idAccess), \
    UNIQUE INDEX idAccess_UNIQUE (idAccess ASC))\
    ENGINE = InnoDB;', function(err,rows) { if(err) throw err; });

connection.query("INSERT INTO "+database+"."+dbConfig.secS2_accessibility_table+" (code, description) VALUES " +
    "('F', 'FRONT ONLY'), " +
    "('R', 'FRONT AND REAR'), " +
    "('S', 'FRONT AND SIDE'); ", function (err, result) { if(err) throw err; });

//cabHeight_secS2
connection.query('\
CREATE TABLE IF NOT EXISTS ' + database + '.' + dbConfig.secS2_cabHeight_table + ' ( \
    idCabHeight INT NOT NULL AUTO_INCREMENT, \
    code VARCHAR(2) NOT NULL, \
    description VARCHAR(100) NOT NULL, \
    PRIMARY KEY (idCabHeight), \
    UNIQUE INDEX idCabHeight_UNIQUE (idCabHeight ASC))\
    ENGINE = InnoDB;', function(err,rows) { if(err) throw err; });

connection.query("INSERT INTO "+database+"."+dbConfig.secS2_cabHeight_table+" (code, description) VALUES " +
    "('1', '58 IN.'), " +
    "('2', '60 IN.'), " +
    "('3', '78 IN.'), " +
    "('4', '90 IN.'), " +
    "('5', '93 IN.'), " +
    "('C', 'CUSTOM'); ", function (err, result) { if(err) throw err; });

//cabWidth_secS2
connection.query('\
CREATE TABLE IF NOT EXISTS ' + database + '.' + dbConfig.secS2_cabWidth_table + ' ( \
    idCabWidth INT NOT NULL AUTO_INCREMENT, \
    code VARCHAR(2) NOT NULL, \
    description VARCHAR(100) NOT NULL, \
    PRIMARY KEY (idCabWidth), \
    UNIQUE INDEX idCabWidth_UNIQUE (idCabWidth ASC))\
    ENGINE = InnoDB;', function(err,rows) { if(err) throw err; });

connection.query("INSERT INTO "+database+"."+dbConfig.secS2_cabWidth_table+" (code, description) VALUES " +
    "('1', '16 IN.'), " +
    "('2', '30 IN.'), " +
    "('3', '32 IN.'), " +
    "('4', '34 IN.'), " +
    "('5', '38 IN.'), " +
    "('6', '40 IN.'), " +
    "('7', '42 IN.'), " +
    "('8', '44 IN.'), " +
    "('C', 'CUSTOM'); ", function (err, result) { if(err) throw err; });

//cabDepth_secS2
connection.query('\
CREATE TABLE IF NOT EXISTS ' + database + '.' + dbConfig.secS2_cabDepth_table + ' ( \
    idCabDepth INT NOT NULL AUTO_INCREMENT, \
    code VARCHAR(2) NOT NULL, \
    description VARCHAR(100) NOT NULL, \
    PRIMARY KEY (idCabDepth), \
    UNIQUE INDEX idCabDepth_UNIQUE (idCabDepth ASC))\
    ENGINE = InnoDB;', function(err,rows) { if(err) throw err; });

connection.query("INSERT INTO "+database+"."+dbConfig.secS2_cabDepth_table+" (code, description) VALUES " +
    "('1', '16 IN.'), " +
    "('2', '30 IN.'), " +
    "('3', '33 IN.'), " +
    "('4', '42 IN.'), " +
    "('5', '60 IN.'), " +
    "('6', '72 IN.'), " +
    "('7', '84 IN.'), " +
    "('C', 'CUSTOM'); ", function (err, result) { if(err) throw err; });

//cableEntry_secS2
connection.query('\
CREATE TABLE IF NOT EXISTS ' + database + '.' + dbConfig.secS2_cableEntry_table + ' ( \
    idCabEntry INT NOT NULL AUTO_INCREMENT, \
    code VARCHAR(2) NOT NULL, \
    description VARCHAR(100) NOT NULL, \
    PRIMARY KEY (idCabEntry), \
    UNIQUE INDEX idCabEntry_UNIQUE (idCabEntry ASC))\
    ENGINE = InnoDB;', function(err,rows) { if(err) throw err; });

connection.query("INSERT INTO "+database+"."+dbConfig.secS2_cableEntry_table+" (code, description) VALUES " +
    "('T', 'TOP'), " +
    "('B', 'BOTTOM'), " +
    "('D', 'DUAL/UNKNOWN'); ", function (err, result) { if(err) throw err; });

//*****************************************//
//***** SERIES 3 SECTION PART NUMBERS *****//
//*****************************************//

//productLine_secS3
connection.query('\
CREATE TABLE IF NOT EXISTS ' + database + '.' + dbConfig.secS3_productLine_table + ' ( \
    idProdLine INT NOT NULL AUTO_INCREMENT, \
    code VARCHAR(2) NOT NULL, \
    description VARCHAR(100) NOT NULL, \
    PRIMARY KEY (idProdLine), \
    UNIQUE INDEX idProdLine_UNIQUE (idProdLine ASC))\
    ENGINE = InnoDB;', function(err,rows) { if(err) throw err; });

connection.query("INSERT INTO "+database+"."+dbConfig.secS3_productLine_table+" (code, description) VALUES " +
    "('S3', 'SERIES 3 SWITCHBOARD'), " +
    "('SG', 'SERIES 1 SWITCHGEAR'); ", function (err, result) { if(err) throw err; });

//brkMfg_secS3
connection.query('\
CREATE TABLE IF NOT EXISTS ' + database + '.' + dbConfig.secS3_brkMfg_table + ' ( \
    idBrkMfg INT NOT NULL AUTO_INCREMENT, \
    code VARCHAR(2) NOT NULL, \
    description VARCHAR(100) NOT NULL, \
    PRIMARY KEY (idBrkMfg), \
    UNIQUE INDEX idBrkMfg_UNIQUE (idBrkMfg ASC))\
    ENGINE = InnoDB;', function(err,rows) { if(err) throw err; });

connection.query("INSERT INTO "+database+"."+dbConfig.secS3_brkMfg_table+" (code, description) VALUES " +
    "('I', 'SIEMENS'), " +
    "('S', 'SQUARE D'), " +
    "('A', 'ABB'), " +
    "('E', 'EATON'), " +
    "('L', 'LSIS'), " +
    "('G', 'GENERAL ELECTRIC'), " +
    "('X', 'NO BREAKERS'); ", function (err, result) { if(err) throw err; });

//secBusRating_secS3
connection.query('\
CREATE TABLE IF NOT EXISTS ' + database + '.' + dbConfig.secS3_secBusRating_table + ' ( \
    idSecBus INT NOT NULL AUTO_INCREMENT, \
    code VARCHAR(2) NOT NULL, \
    description VARCHAR(100) NOT NULL, \
    PRIMARY KEY (idSecBus), \
    UNIQUE INDEX idSecBus_UNIQUE (idSecBus ASC))\
    ENGINE = InnoDB;', function(err,rows) { if(err) throw err; });

connection.query("INSERT INTO "+database+"."+dbConfig.secS3_secBusRating_table+" (code, description) VALUES " +
    "('02', '250A AND BELOW'), " +
    "('04', '400A'), " +
    "('06', '600A'), " +
    "('08', '800A'), " +
    "('10', '1000A'), " +
    "('12', '1200A'), " +
    "('16', '1600A'), " +
    "('20', '2000A'), " +
    "('25', '2500A'), " +
    "('30', '3000A'), " +
    "('32', '3200A'), " +
    "('40', '4000A'), " +
    "('50', '5000A'), " +
    "('60', '6000A'); ", function (err, result) { if(err) throw err; });

//mainBusRating_secS3
connection.query('\
CREATE TABLE IF NOT EXISTS ' + database + '.' + dbConfig.secS3_mainBusRating_table + ' ( \
    idMainBus INT NOT NULL AUTO_INCREMENT, \
    code VARCHAR(2) NOT NULL, \
    description VARCHAR(100) NOT NULL, \
    PRIMARY KEY (idMainBus), \
    UNIQUE INDEX idMainBus_UNIQUE (idMainBus ASC))\
    ENGINE = InnoDB;', function(err,rows) { if(err) throw err; });

connection.query("INSERT INTO "+database+"."+dbConfig.secS3_mainBusRating_table+" (code, description) VALUES " +
    "('1', '800A'), " +
    "('2', '1000A'), " +
    "('3', '1200A'), " +
    "('4', '1600A'), " +
    "('5', '2000A'), " +
    "('6', '2500A'), " +
    "('7', '3000A'), " +
    "('8', '3200A'), " +
    "('9', '4000A'), " +
    "('0', '5000A'), " +
    "('A', '6000A'), " +
    "('B', '8000A'), " +
    "('C', '10000A'); ", function (err, result) { if(err) throw err; });

//enclosureType_secS3
connection.query('\
CREATE TABLE IF NOT EXISTS ' + database + '.' + dbConfig.secS3_enclosureType_table + ' ( \
    idEncType INT NOT NULL AUTO_INCREMENT, \
    code VARCHAR(2) NOT NULL, \
    description VARCHAR(100) NOT NULL, \
    PRIMARY KEY (idEncType), \
    UNIQUE INDEX idEncType_UNIQUE (idEncType ASC))\
    ENGINE = InnoDB;', function(err,rows) { if(err) throw err; });

connection.query("INSERT INTO "+database+"."+dbConfig.secS3_enclosureType_table+" (code, description) VALUES " +
    "('1', 'NEMA 1 INDOOR'), " +
    "('3', 'NEMA 3R OUTDOOR'), " +
    "('C', 'CUSTOM'); ", function (err, result) { if(err) throw err; });

//accessibility_secS3
connection.query('\
CREATE TABLE IF NOT EXISTS ' + database + '.' + dbConfig.secS3_accessibility_table + ' ( \
    idAccess INT NOT NULL AUTO_INCREMENT, \
    code VARCHAR(2) NOT NULL, \
    description VARCHAR(100) NOT NULL, \
    PRIMARY KEY (idAccess), \
    UNIQUE INDEX idAccess_UNIQUE (idAccess ASC))\
    ENGINE = InnoDB;', function(err,rows) { if(err) throw err; });

connection.query("INSERT INTO "+database+"."+dbConfig.secS3_accessibility_table+" (code, description) VALUES " +
    "('F', 'FRONT ONLY'), " +
    "('R', 'FRONT AND REAR'), " +
    "('S', 'FRONT AND SIDE'); ", function (err, result) { if(err) throw err; });

//cabHeight_secS3
connection.query('\
CREATE TABLE IF NOT EXISTS ' + database + '.' + dbConfig.secS3_cabHeight_table + ' ( \
    idCabHeight INT NOT NULL AUTO_INCREMENT, \
    code VARCHAR(2) NOT NULL, \
    description VARCHAR(100) NOT NULL, \
    PRIMARY KEY (idCabHeight), \
    UNIQUE INDEX idCabHeight_UNIQUE (idCabHeight ASC))\
    ENGINE = InnoDB;', function(err,rows) { if(err) throw err; });

connection.query("INSERT INTO "+database+"."+dbConfig.secS3_cabHeight_table+" (code, description) VALUES " +
    "('1', '80 IN.'), " +
    "('2', '90 IN.'), " +
    "('3', '93 IN.'), " +
    "('C', 'CUSTOM'); ", function (err, result) { if(err) throw err; });

//cabWidth_secS3
connection.query('\
CREATE TABLE IF NOT EXISTS ' + database + '.' + dbConfig.secS3_cabWidth_table + ' ( \
    idCabWidth INT NOT NULL AUTO_INCREMENT, \
    code VARCHAR(2) NOT NULL, \
    description VARCHAR(100) NOT NULL, \
    PRIMARY KEY (idCabWidth), \
    UNIQUE INDEX idCabWidth_UNIQUE (idCabWidth ASC))\
    ENGINE = InnoDB;', function(err,rows) { if(err) throw err; });

connection.query("INSERT INTO "+database+"."+dbConfig.secS3_cabWidth_table+" (code, description) VALUES " +
    "('1', '24 IN.'), " +
    "('2', '30 IN.'), " +
    "('3', '32 IN.'), " +
    "('4', '34 IN.'), " +
    "('5', '38 IN.'), " +
    "('6', '40 IN.'), " +
    "('7', '42 IN.'), " +
    "('8', '44 IN.'), " +
    "('C', 'CUSTOM'); ", function (err, result) { if(err) throw err; });

//cabDepth_secS3
connection.query('\
CREATE TABLE IF NOT EXISTS ' + database + '.' + dbConfig.secS3_cabDepth_table + ' ( \
    idCabDepth INT NOT NULL AUTO_INCREMENT, \
    code VARCHAR(2) NOT NULL, \
    description VARCHAR(100) NOT NULL, \
    PRIMARY KEY (idCabDepth), \
    UNIQUE INDEX idCabDepth_UNIQUE (idCabDepth ASC))\
    ENGINE = InnoDB;', function(err,rows) { if(err) throw err; });

connection.query("INSERT INTO "+database+"."+dbConfig.secS3_cabDepth_table+" (code, description) VALUES " +
    "('1', '48 IN.'), " +
    "('2', '60 IN.'), " +
    "('3', '72 IN.'), " +
    "('4', '84 IN.'), " +
    "('C', 'CUSTOM'); ", function (err, result) { if(err) throw err; });

//cableEntry_secS3
connection.query('\
CREATE TABLE IF NOT EXISTS ' + database + '.' + dbConfig.secS3_cableEntry_table + ' ( \
    idCabEntry INT NOT NULL AUTO_INCREMENT, \
    code VARCHAR(2) NOT NULL, \
    description VARCHAR(100) NOT NULL, \
    PRIMARY KEY (idCabEntry), \
    UNIQUE INDEX idCabEntry_UNIQUE (idCabEntry ASC))\
    ENGINE = InnoDB;', function(err,rows) { if(err) throw err; });

connection.query("INSERT INTO "+database+"."+dbConfig.secS3_cableEntry_table+" (code, description) VALUES " +
    "('T', 'TOP'), " +
    "('B', 'BOTTOM'), " +
    "('D', 'DUAL/UNKNOWN'); ", function (err, result) { if(err) throw err; });

//compA_secS3
connection.query('\
CREATE TABLE IF NOT EXISTS ' + database + '.' + dbConfig.secS3_compA_table + ' ( \
    idCompA INT NOT NULL AUTO_INCREMENT, \
    code VARCHAR(2) NOT NULL, \
    description VARCHAR(100) NOT NULL, \
    PRIMARY KEY (idCompA), \
    UNIQUE INDEX idCompA_UNIQUE (idCompA ASC))\
    ENGINE = InnoDB;', function(err,rows) { if(err) throw err; });

connection.query("INSERT INTO "+database+"."+dbConfig.secS3_compA_table+" (code, description) VALUES " +
    "('1', 'BREAKER'), " +
    "('2', 'BLANK'), " +
    "('3', 'CONTROL/OTHER'), " +
    "('4', 'UTILIZED W/ OTHER COMPARTMENT'); ", function (err, result) { if(err) throw err; });

//compB_secS3
connection.query('\
CREATE TABLE IF NOT EXISTS ' + database + '.' + dbConfig.secS3_compB_table + ' ( \
    idCompA INT NOT NULL AUTO_INCREMENT, \
    code VARCHAR(2) NOT NULL, \
    description VARCHAR(100) NOT NULL, \
    PRIMARY KEY (idCompA), \
    UNIQUE INDEX idCompA_UNIQUE (idCompA ASC))\
    ENGINE = InnoDB;', function(err,rows) { if(err) throw err; });

connection.query("INSERT INTO "+database+"."+dbConfig.secS3_compB_table+" (code, description) VALUES " +
    "('1', 'BREAKER'), " +
    "('2', 'BLANK'), " +
    "('3', 'CONTROL/OTHER'), " +
    "('4', 'UTILIZED W/ OTHER COMPARTMENT'); ", function (err, result) { if(err) throw err; });

//compC_secS3
connection.query('\
CREATE TABLE IF NOT EXISTS ' + database + '.' + dbConfig.secS3_compC_table + ' ( \
    idCompA INT NOT NULL AUTO_INCREMENT, \
    code VARCHAR(2) NOT NULL, \
    description VARCHAR(100) NOT NULL, \
    PRIMARY KEY (idCompA), \
    UNIQUE INDEX idCompA_UNIQUE (idCompA ASC))\
    ENGINE = InnoDB;', function(err,rows) { if(err) throw err; });

connection.query("INSERT INTO "+database+"."+dbConfig.secS3_compC_table+" (code, description) VALUES " +
    "('1', 'BREAKER'), " +
    "('2', 'BLANK'), " +
    "('3', 'CONTROL/OTHER'), " +
    "('4', 'UTILIZED W/ OTHER COMPARTMENT'); ", function (err, result) { if(err) throw err; });

//compD_secS3
connection.query('\
CREATE TABLE IF NOT EXISTS ' + database + '.' + dbConfig.secS3_compD_table + ' ( \
    idCompA INT NOT NULL AUTO_INCREMENT, \
    code VARCHAR(2) NOT NULL, \
    description VARCHAR(100) NOT NULL, \
    PRIMARY KEY (idCompA), \
    UNIQUE INDEX idCompA_UNIQUE (idCompA ASC))\
    ENGINE = InnoDB;', function(err,rows) { if(err) throw err; });

connection.query("INSERT INTO "+database+"."+dbConfig.secS3_compD_table+" (code, description) VALUES " +
    "('1', 'BREAKER'), " +
    "('2', 'BLANK'), " +
    "('3', 'CONTROL/OTHER'), " +
    "('4', 'UTILIZED W/ OTHER COMPARTMENT'); ", function (err, result) { if(err) throw err; });

//****************************************//
//**** ANSI STD. SECTION PART NUMBERS ****//
//****************************************//

//productLine_secANSI
connection.query('\
CREATE TABLE IF NOT EXISTS ' + database + '.' + dbConfig.secANSI_productLine_table + ' ( \
    idProdLine INT NOT NULL AUTO_INCREMENT, \
    code VARCHAR(2) NOT NULL, \
    description VARCHAR(100) NOT NULL, \
    PRIMARY KEY (idProdLine), \
    UNIQUE INDEX idProdLine_UNIQUE (idProdLine ASC))\
    ENGINE = InnoDB;', function(err,rows) { if(err) throw err; });

connection.query("INSERT INTO "+database+"."+dbConfig.secANSI_productLine_table+" (code, description) VALUES " +
    "('AS', 'ANSI STD. SWITCHGEAR CLASS'); ", function (err, result) { if(err) throw err; });

//sectionType_secANSI
connection.query('\
CREATE TABLE IF NOT EXISTS ' + database + '.' + dbConfig.secANSI_sectionType_table + ' ( \
    idSecType INT NOT NULL AUTO_INCREMENT, \
    code VARCHAR(2) NOT NULL, \
    description VARCHAR(100) NOT NULL, \
    PRIMARY KEY (idSecType), \
    UNIQUE INDEX idSecType_UNIQUE (idSecType ASC))\
    ENGINE = InnoDB;', function(err,rows) { if(err) throw err; });

connection.query("INSERT INTO "+database+"."+dbConfig.secANSI_sectionType_table+" (code, description) VALUES " +
    "('M', 'MAIN'), " +
    "('T', 'TIE'), " +
    "('F', 'FEEDER'), " +
    "('A', 'AUXILIARY'), " +
    "('C', 'CONTROL CABINET'), " +
    "('U', 'UTILITY METERING CABINET'); ", function (err, result) { if(err) throw err; });

//brkMfg_secANSI
connection.query('\
CREATE TABLE IF NOT EXISTS ' + database + '.' + dbConfig.secANSI_brkMfg_table + ' ( \
    idBrkMfg INT NOT NULL AUTO_INCREMENT, \
    code VARCHAR(2) NOT NULL, \
    description VARCHAR(100) NOT NULL, \
    PRIMARY KEY (idBrkMfg), \
    UNIQUE INDEX idBrkMfg_UNIQUE (idBrkMfg ASC))\
    ENGINE = InnoDB;', function(err,rows) { if(err) throw err; });

connection.query("INSERT INTO "+database+"."+dbConfig.secANSI_brkMfg_table+" (code, description) VALUES " +
    "('I', 'SIEMENS'), " +
    "('S', 'SQUARE D'), " +
    "('A', 'ABB'), " +
    "('E', 'EATON'), " +
    "('L', 'LSIS'), " +
    "('X', 'NO BREAKERS'); ", function (err, result) { if(err) throw err; });

//upperComp_secANSI
connection.query('\
CREATE TABLE IF NOT EXISTS ' + database + '.' + dbConfig.secANSI_upperComp_table + ' ( \
    idUpperComp INT NOT NULL AUTO_INCREMENT, \
    code VARCHAR(2) NOT NULL, \
    description VARCHAR(100) NOT NULL, \
    PRIMARY KEY (idUpperComp), \
    UNIQUE INDEX idUpperComp_UNIQUE (idUpperComp ASC))\
    ENGINE = InnoDB;', function(err,rows) { if(err) throw err; });

connection.query("INSERT INTO "+database+"."+dbConfig.secANSI_upperComp_table+" (code, description) VALUES " +
    "('1', '1200A BRK'), " +
    "('2', '2000A BRK'), " +
    "('3', '3000A BRK'), " +
    "('V', 'VT (BUS)'), " +
    "('L', 'VT (LUG)'), " +
    "('P', 'CPT (BUS)'), " +
    "('R', 'CPT (LUG)'), " +
    "('A', 'AUXILIARY COMPARTMENT'), " +
    "('T', 'BUS TRANSITION FOR TIE'); ", function (err, result) { if(err) throw err; });

//lowerComp_secANSI
connection.query('\
CREATE TABLE IF NOT EXISTS ' + database + '.' + dbConfig.secANSI_lowerComp_table + ' ( \
    idLowerComp INT NOT NULL AUTO_INCREMENT, \
    code VARCHAR(2) NOT NULL, \
    description VARCHAR(100) NOT NULL, \
    PRIMARY KEY (idLowerComp), \
    UNIQUE INDEX idLowerComp_UNIQUE (idLowerComp ASC))\
    ENGINE = InnoDB;', function(err,rows) { if(err) throw err; });

connection.query("INSERT INTO "+database+"."+dbConfig.secANSI_lowerComp_table+" (code, description) VALUES " +
    "('1', '1200A BRK'), " +
    "('2', '2000A BRK'), " +
    "('3', '3000A BRK'), " +
    "('V', 'VT (BUS)'), " +
    "('L', 'VT (LUG)'), " +
    "('P', 'CPT (BUS)'), " +
    "('R', 'CPT (LUG)'), " +
    "('A', 'AUXILIARY COMPARTMENT'), " +
    "('T', 'BUS TRANSITION FOR TIE'); ", function (err, result) { if(err) throw err; });

//systemVolt_secANSI
connection.query('\
CREATE TABLE IF NOT EXISTS ' + database + '.' + dbConfig.secANSI_systemVolt_table + ' ( \
    idSystemVolt INT NOT NULL AUTO_INCREMENT, \
    code VARCHAR(2) NOT NULL, \
    description VARCHAR(100) NOT NULL, \
    PRIMARY KEY (idSystemVolt), \
    UNIQUE INDEX idSystemVolt_UNIQUE (idSystemVolt ASC))\
    ENGINE = InnoDB;', function(err,rows) { if(err) throw err; });

connection.query("INSERT INTO "+database+"."+dbConfig.secANSI_systemVolt_table+" (code, description) VALUES " +
    "('05', '5kV RANGE'), " +
    "('08', '7.5kV RANGE'), " +
    "('15', '12-15kV RANGE'), " +
    "('27', '27kV RANGE'), " +
    "('38', '33-38kV RANGE'); ", function (err, result) { if(err) throw err; });

//kaRating_secANSI
connection.query('\
CREATE TABLE IF NOT EXISTS ' + database + '.' + dbConfig.secANSI_kaRating_table + ' ( \
    idKaRating INT NOT NULL AUTO_INCREMENT, \
    code VARCHAR(2) NOT NULL, \
    description VARCHAR(100) NOT NULL, \
    PRIMARY KEY (idKaRating), \
    UNIQUE INDEX idKaRating_UNIQUE (idKaRating ASC))\
    ENGINE = InnoDB;', function(err,rows) { if(err) throw err; });

connection.query("INSERT INTO "+database+"."+dbConfig.secANSI_kaRating_table+" (code, description) VALUES " +
    "('2', '25kA'), " +
    "('3', '31.5kA'), " +
    "('4', '40kA'), " +
    "('5', '50kA'), " +
    "('6', '63kA'); ", function (err, result) { if(err) throw err; });

//mainBusRating_secANSI
connection.query('\
CREATE TABLE IF NOT EXISTS ' + database + '.' + dbConfig.secANSI_mainBusRating_table + ' ( \
    idMainBusRating INT NOT NULL AUTO_INCREMENT, \
    code VARCHAR(2) NOT NULL, \
    description VARCHAR(100) NOT NULL, \
    PRIMARY KEY (idMainBusRating), \
    UNIQUE INDEX idMainBusRating_UNIQUE (idMainBusRating ASC))\
    ENGINE = InnoDB;', function(err,rows) { if(err) throw err; });

connection.query("INSERT INTO "+database+"."+dbConfig.secANSI_mainBusRating_table+" (code, description) VALUES " +
    "('12', '1200A'), " +
    "('20', '2000A'), " +
    "('30', '3000A'), " +
    "('40', '4000A'), " +
    "('NA', 'NO MAIN BUS'); ", function (err, result) { if(err) throw err; });

//enclosureWidth_secANSI
connection.query('\
CREATE TABLE IF NOT EXISTS ' + database + '.' + dbConfig.secANSI_enclosureWidth_table + ' ( \
    idEncWidth INT NOT NULL AUTO_INCREMENT, \
    code VARCHAR(2) NOT NULL, \
    description VARCHAR(100) NOT NULL, \
    PRIMARY KEY (idEncWidth), \
    UNIQUE INDEX idEncWidth_UNIQUE (idEncWidth ASC))\
    ENGINE = InnoDB;', function(err,rows) { if(err) throw err; });

connection.query("INSERT INTO "+database+"."+dbConfig.secANSI_enclosureWidth_table+" (code, description) VALUES " +
    "('30', '30 IN. CABINET'), " +
    "('36', '36 IN. CABINET'), " +
    "('42', '42 IN. CABINET'), " +
    "('48', '48 IN. CABINET'), " +
    "('XX', 'CUSTOM'); ", function (err, result) { if(err) throw err; });

//enclosureType_secANSI
connection.query('\
CREATE TABLE IF NOT EXISTS ' + database + '.' + dbConfig.secANSI_enclosureType_table + ' ( \
    idEncType INT NOT NULL AUTO_INCREMENT, \
    code VARCHAR(2) NOT NULL, \
    description VARCHAR(100) NOT NULL, \
    PRIMARY KEY (idEncType), \
    UNIQUE INDEX idEncType_UNIQUE (idEncType ASC))\
    ENGINE = InnoDB;', function(err,rows) { if(err) throw err; });

connection.query("INSERT INTO "+database+"."+dbConfig.secANSI_enclosureType_table+" (code, description) VALUES " +
    "('1', 'NEMA 1 INDOOR'), " +
    "('3', 'NEMA 3R OUTDOOR'), " +
    "('W', 'OUTDOOR WALK-IN'), " +
    "('C', 'CUSTOM'); ", function (err, result) { if(err) throw err; });


//cableEntry_secANSI
connection.query('\
CREATE TABLE IF NOT EXISTS ' + database + '.' + dbConfig.secANSI_cableEntry_table + ' ( \
    idCabEntry INT NOT NULL AUTO_INCREMENT, \
    code VARCHAR(2) NOT NULL, \
    description VARCHAR(100) NOT NULL, \
    PRIMARY KEY (idCabEntry), \
    UNIQUE INDEX idCabEntry_UNIQUE (idCabEntry ASC))\
    ENGINE = InnoDB;', function(err,rows) { if(err) throw err; });

connection.query("INSERT INTO "+database+"."+dbConfig.secANSI_cableEntry_table+" (code, description) VALUES " +
    "('S', 'SINGLE TOP'), " +
    "('B', 'SINGLE BOTTOM'), " +
    "('T', 'DUAL TOP'), " +
    "('D', 'DUAL BOTTOM'), " +
    "('S', 'SPLIT TOP/BOTTOM'), " +
    "('N', 'NONE'); ", function (err, result) { if(err) throw err; });

console.log("createCatalogSchema successful");

connection.end();
