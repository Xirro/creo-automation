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


connection.query('DROP SCHEMA IF EXISTS ' + dbConfig.database, function(err,rows) { if(err) throw err; }); // DROPS RESIDUAL DATABASE/TABLES

connection.query('CREATE DATABASE ' + dbConfig.database, function(err,rows) { if(err) throw err; }); // CREATES SAI_db SCHEMA

connection.query('USE ' + database, function(err,rows) { if(err) throw err; });


//!**************************************!//
//!******** PRODUCT PART NUMBERS ********!//
//!**************************************!//

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


//!**************************************!//
//!**** SLIMVAC SECTION PART NUMBERS ****!//
//!**************************************!//

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
    "('SV', '15kV SLIMVAC'); ", function (err, result) { if(err) throw err; });

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
    "('4', '40kA'), " +
    "('X', 'N/A'); ", function (err, result) { if(err) throw err; });

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
    "('XX', 'N/A'); ", function (err, result) { if(err) throw err; });

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
    "('V', 'VT (BUS CONNECTED)'), " +
    "('L', 'VT (LUG CONNECTED)'), " +
    "('P', 'CPT (BUS CONNECTED)'), " +
    "('R', 'CPT (LUG CONNECTED)'), " +
    "('A', 'AUXILIARY COMPARTMENT'), " +
    "('T', 'BUS TRANSITION FOR TIE'), " +
    "('B', 'BUS TRANSITION FOR TIE W/ VT'); ", function (err, result) { if(err) throw err; });

//upperCompAcc_secSV
connection.query('\
CREATE TABLE IF NOT EXISTS ' + database + '.' + dbConfig.secSV_upperCompAcc_table + ' ( \
    idUpperCompAcc INT NOT NULL AUTO_INCREMENT, \
    code VARCHAR(2) NOT NULL, \
    description VARCHAR(100) NOT NULL, \
    PRIMARY KEY (idUpperCompAcc), \
    UNIQUE INDEX idUpperCompAcc_UNIQUE (idUpperCompAcc ASC))\
    ENGINE = InnoDB;', function(err,rows) { if(err) throw err; });

connection.query("INSERT INTO "+database+"."+dbConfig.secSV_upperCompAcc_table+" (code, description) VALUES " +
    "('A', 'BREAKER, CT (BUS)'), " +
    "('B', 'BREAKER, CT (LUG)'), " +
    "('D', 'BREAKER, CT (BUS & LUG)'), " +
    "('E', 'BREAKER, CT (BUS), LA (BUS)'), " +
    "('F', 'BREAKER, CT (BUS), LA (LUG)'), " +
    "('G', 'BREAKER, CT (LUG), LA (BUS)'), " +
    "('H', 'BREAKER, CT (LUG), LA (LUG)'), " +
    "('I', 'BREAKER, CT (BUS & LUG), LA (BUS)'), " +
    "('J', 'BREAKER, CT (BUS & LUG), LA (LUG)'), " +
    "('K', 'BREAKER, BUS TIE 2 RACKS'), " +
    "('L', 'BREAKER, BUS TIE 2 RACKS, CT BOTH'), " +
    "('M', 'BREAKER, BUS TIE 2 RACKS, CT UPPER'), " +
    "('N', 'BREAKER, BUS TIE 2 RACKS, CT LOWER'), " +
    "('O', 'BREAKER, BUS TIE 2 RACKS, LA UPPER'), " +
    "('P', 'BREAKER, BUS TIE 2 RACKS, CT UPPER, LA UPPER'), " +
    "('Q', 'BREAKER, BUS TIE 2 RACKS, CT LOWER, LA UPPER'), " +
    "('R', 'BREAKER, BUS TIE 2 RACKS, CT BOTH, LA UPPER'), " +
    "('S', 'BREAKER, BUS TIE 2 RACKS, LA LOWER'), " +
    "('T', 'BREAKER, BUS TIE 2 RACKS, CT UPPER, LA LOWER'), " +
    "('U', 'BREAKER, BUS TIE 2 RACKS, CT LOWER, LA LOWER'), " +
    "('V', 'BREAKER, BUS TIE 2 RACKS, CT BOTH, LA LOWER'), " +
    "('X', 'N/A'); ", function (err, result) { if(err) throw err; });


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
    "('V', 'VT (BUS CONNECTED)'), " +
    "('L', 'VT (LUG CONNECTED)'), " +
    "('P', 'CPT (BUS CONNECTED)'), " +
    "('R', 'CPT (LUG CONNECTED)'), " +
    "('A', 'AUXILIARY COMPARTMENT'), " +
    "('T', 'BUS TRANSITION FOR TIE'), " +
    "('B', 'BUS TRANSITION FOR TIE W/ VT'); ", function (err, result) { if(err) throw err; });

//lowerCompAcc_secSV
connection.query('\
CREATE TABLE IF NOT EXISTS ' + database + '.' + dbConfig.secSV_lowerCompAcc_table + ' ( \
    idLowerCompAcc INT NOT NULL AUTO_INCREMENT, \
    code VARCHAR(2) NOT NULL, \
    description VARCHAR(100) NOT NULL, \
    PRIMARY KEY (idLowerCompAcc), \
    UNIQUE INDEX idLowerCompAcc_UNIQUE (idLowerCompAcc ASC))\
    ENGINE = InnoDB;', function(err,rows) { if(err) throw err; });

connection.query("INSERT INTO "+database+"."+dbConfig.secSV_lowerCompAcc_table+" (code, description) VALUES " +
    "('A', 'BREAKER, CT (BUS)'), " +
    "('B', 'BREAKER, CT (LUG)'), " +
    "('D', 'BREAKER, CT (BUS & LUG)'), " +
    "('E', 'BREAKER, CT (BUS), LA (BUS)'), " +
    "('F', 'BREAKER, CT (BUS), LA (LUG)'), " +
    "('G', 'BREAKER, CT (LUG), LA (BUS)'), " +
    "('H', 'BREAKER, CT (LUG), LA (LUG)'), " +
    "('I', 'BREAKER, CT (BUS & LUG), LA (BUS)'), " +
    "('J', 'BREAKER, CT (BUS & LUG), LA (LUG)'), " +
    "('K', 'BREAKER, BUS TIE 2 RACKS'), " +
    "('L', 'BREAKER, BUS TIE 2 RACKS, CT BOTH'), " +
    "('M', 'BREAKER, BUS TIE 2 RACKS, CT UPPER'), " +
    "('N', 'BREAKER, BUS TIE 2 RACKS, CT LOWER'), " +
    "('O', 'BREAKER, BUS TIE 2 RACKS, LA UPPER'), " +
    "('P', 'BREAKER, BUS TIE 2 RACKS, CT UPPER, LA UPPER'), " +
    "('Q', 'BREAKER, BUS TIE 2 RACKS, CT LOWER, LA UPPER'), " +
    "('R', 'BREAKER, BUS TIE 2 RACKS, CT BOTH, LA UPPER'), " +
    "('S', 'BREAKER, BUS TIE 2 RACKS, LA LOWER'), " +
    "('T', 'BREAKER, BUS TIE 2 RACKS, CT UPPER, LA LOWER'), " +
    "('U', 'BREAKER, BUS TIE 2 RACKS, CT LOWER, LA LOWER'), " +
    "('V', 'BREAKER, BUS TIE 2 RACKS, CT BOTH, LA LOWER'), " +
    "('X', 'N/A'); ", function (err, result) { if(err) throw err; });

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
    "('W', 'NEMA 3R WALK-IN'), " +
    "('C', 'CUSTOM'); ", function (err, result) { if(err) throw err; });

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
    "('26', '26 IN.'), " +
    "('30', '30 IN.'), " +
    "('36', '36 IN.'), " +
    "('XX', 'CUSTOM'); ", function (err, result) { if(err) throw err; });


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
    "('S', 'SPLIT TOP/BOTTOM'), " +
    "('T', 'TOP'), " +
    "('B', 'BOTTOM'), " +
    "('X', 'N/A'); ", function (err, result) { if(err) throw err; });



// ********************************************************************************** //
// *********************** MECHANICAL ENGINEERING TABLES **************************** //
// ********************************************************************************** //

// layoutSum
connection.query('\
CREATE TABLE IF NOT EXISTS ' + database + '.' + dbConfig.layout_summary_table + ' ( \
    layoutID INT UNSIGNED NOT NULL AUTO_INCREMENT, \
    jobNum VARCHAR(6) NULL, \
    releaseNum VARCHAR(10) NULL, \
    jobName VARCHAR(100) NULL, \
    customer VARCHAR(100) NULL, \
    layoutName VARCHAR(100) NULL, \
    drawnBy VARCHAR(5) NULL, \
    drawnDate DATE NULL, \
    checkedBy VARCHAR(5) NULL, \
    checkedDate DATE NULL, \
    PRIMARY KEY (layoutID), \
    UNIQUE INDEX layoutID_UNIQUE (layoutID ASC))\
    ENGINE = InnoDB;', function(err,rows) { if(err) throw err; });

// layoutRevSum
connection.query('\
CREATE TABLE IF NOT EXISTS ' + database + '.' + dbConfig.layout_rev_table + ' ( \
    revID INT UNSIGNED NOT NULL AUTO_INCREMENT, \
    layoutID INT UNSIGNED NOT NULL, \
    revNum VARCHAR(3) NULL, \
    revNote VARCHAR(100) NULL, \
    PRIMARY KEY (revID), \
    CONSTRAINT fk_jobID \
    FOREIGN KEY (layoutID) \
        REFERENCES layoutSum(layoutID) \
        ON DELETE CASCADE \
        ON UPDATE CASCADE, \
    UNIQUE INDEX revID_UNIQUE (revID ASC)) \
    ENGINE = InnoDB;', function(err,rows) { if(err) throw err; });

// layoutDetail
connection.query('\
CREATE TABLE IF NOT EXISTS ' + database + '.' + dbConfig.layout_detail_table + ' ( \
    layoutID INT UNSIGNED NOT NULL, \
    layoutCatalogPN VARCHAR(100) NULL, \
    productFamily VARCHAR(100) NULL, \
    productLine VARCHAR(100) NULL, \
    systemVolt VARCHAR(100) NULL, \
    currentRating VARCHAR(100) NULL, \
    interruptingRating VARCHAR(100) NULL, \
    enclosure VARCHAR(100) NULL, \
    finish VARCHAR(100) NULL,\
    accessibility VARCHAR(100) NULL, \
    controlVolt VARCHAR(100) NULL, \
    numSections INT NOT NULL, \
    PRIMARY KEY (layoutID), \
    CONSTRAINT fk_layoutSubID \
    FOREIGN KEY (layoutID) \
        REFERENCES layoutSum(layoutID) \
        ON DELETE CASCADE \
        ON UPDATE CASCADE, \
    UNIQUE INDEX layoutID_UNIQUE (layoutID ASC)) \
    ENGINE = InnoDB;', function(err,rows) { if(err) throw err; });

// sectionDetail
connection.query('\
CREATE TABLE IF NOT EXISTS ' + database + '.' + dbConfig.section_detail_table + ' ( \
    secID INT UNSIGNED NOT NULL AUTO_INCREMENT, \
    layoutID INT UNSIGNED NULL, \
    sectionNum INT UNSIGNED NULL, \
    sectionCatalogPN VARCHAR(100) NULL, \
    productFamily VARCHAR(100) NULL, \
    brkMfg VARCHAR(100) NULL, \
    kaRating VARCHAR(100) NULL, \
    mainBusRating VARCHAR(100) NULL, \
    upperComp VARCHAR(100) NULL, \
    upperCompAcc VARCHAR(100) NULL, \
    lowerComp VARCHAR(100) NULL, \
    lowerCompAcc VARCHAR(100) NULL, \
    enclosureWidth VARCHAR(100) NULL, \
    enclosureType VARCHAR(100) NULL, \
    cableEntry VARCHAR(100) NULL, \
    PRIMARY KEY (secID), \
    CONSTRAINT fk_layoutID \
    FOREIGN KEY (layoutID) \
        REFERENCES layoutDetail(layoutID) \
        ON DELETE CASCADE \
        ON UPDATE CASCADE, \
    UNIQUE INDEX secID_UNIQUE (secID ASC))\
    ENGINE = InnoDB;', function(err) { if(err) throw err; });


console.log("newPnSchema successful");

connection.end();
