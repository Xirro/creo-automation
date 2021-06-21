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

//SF_quotes
connection.query('\
CREATE TABLE IF NOT EXISTS ' + database + '.' + dbConfig.salesforce_quote_table + ' ( \
    quoteID INT UNSIGNED NOT NULL AUTO_INCREMENT, \
    quoteNum VARCHAR(100) NULL, \
    jobName VARCHAR(100) NULL, \
    customer VARCHAR(100) NULL, \
    PRIMARY KEY (quoteID), \
    UNIQUE INDEX quoteID_UNIQUE (quoteID ASC))\
    ENGINE = InnoDB;', function(err,rows) { if(err) throw err; });

//SF_products
connection.query('\
CREATE TABLE IF NOT EXISTS ' + database + '.' + dbConfig.salesforce_product_table + ' ( \
    productID INT UNSIGNED NOT NULL AUTO_INCREMENT, \
    quoteID INT UNSIGNED NOT NULL, \
    productName VARCHAR(100) NULL, \
    productCatalogPN VARCHAR(100) NULL, \
    productFamily VARCHAR(100) NULL, \
    productLine VARCHAR(100) NULL, \
    ulListing VARCHAR(100) NULL, \
    systemType VARCHAR(100) NULL, \
    systemAmp VARCHAR(100) NULL, \
    mainBusAmp VARCHAR(100) NULL, \
    enclosure VARCHAR(100) NULL, \
    accessibility VARCHAR(100) NULL, \
    cableAccess VARCHAR(100) NULL, \
    paint VARCHAR(100) NULL,\
    interruptRating VARCHAR(100) NULL, \
    busBracing VARCHAR(100) NULL, \
    busType VARCHAR(100) NULL, \
    insulatedBus VARCHAR(1) NOT NULL, \
    boots VARCHAR(1) NOT NULL, \
    keyInterlocks VARCHAR(100) NULL, \
    seismic VARCHAR(1) NOT NULL, \
    mimic VARCHAR(1) NOT NULL, \
    ir VARCHAR(1) NOT NULL, \
    wireway VARCHAR(1) NOT NULL, \
    trolley VARCHAR(1) NOT NULL, \
    numSections INT NOT NULL, \
    PRIMARY KEY (productID), \
    CONSTRAINT fk_productQuoteID \
    FOREIGN KEY (quoteID) \
        REFERENCES SF_quotes(quoteID) \
        ON DELETE CASCADE \
        ON UPDATE CASCADE, \
    UNIQUE INDEX productID_UNIQUE (productID ASC)) \
    ENGINE = InnoDB;', function(err,rows) { if(err) throw err; });

//SF_sections
connection.query('\
CREATE TABLE IF NOT EXISTS ' + database + '.' + dbConfig.salesforce_section_table + ' ( \
    secID INT UNSIGNED NOT NULL AUTO_INCREMENT, \
    productID INT UNSIGNED NULL, \
    sectionNum VARCHAR(100) NULL, \
    sectionCatalogPN VARCHAR(100) NULL, \
    compType JSON NULL, \
    controlAsmID VARCHAR(100) NULL, \
    secType VARCHAR(100) NULL, \
    brkType VARCHAR(100) NULL, \
    secAmp VARCHAR(100) NULL, \
    secPoles INT NULL, \
    secHeight INT NULL, \
    secWidth INT NULL, \
    secDepth INT NULL, \
    PRIMARY KEY (secID), \
    CONSTRAINT fk_sectionProductID \
    FOREIGN KEY (productID) \
        REFERENCES SF_products(productID) \
        ON DELETE CASCADE \
        ON UPDATE CASCADE, \
    UNIQUE INDEX secID_UNIQUE (secID ASC))\
    ENGINE = InnoDB;', function(err) { if(err) throw err; });

//SF_breakers
connection.query('\
CREATE TABLE IF NOT EXISTS ' + database + '.' + dbConfig.salesforce_breaker_table + ' ( \
    devID INT UNSIGNED NOT NULL AUTO_INCREMENT, \
    productID INT UNSIGNED NOT NULL, \
    secID INT UNSIGNED NULL,\
    comp VARCHAR(100) NULL, \
    devDesignation VARCHAR(100) NULL, \
    devFunction VARCHAR(100) NOT NULL, \
    unitOfIssue VARCHAR(2)  DEFAULT "EA", \
    catCode VARCHAR(100) NULL, \
    platform VARCHAR(100) NULL, \
    brkPN VARCHAR(100) NULL, \
    cradlePN VARCHAR(100) NULL, \
    devMount VARCHAR(100) NULL, \
    rearAdaptType VARCHAR(100) NULL, \
    devUL VARCHAR(100) NULL, \
    devLevel VARCHAR(100) NULL, \
    devOperation VARCHAR(100) NULL, \
    devCtrlVolt VARCHAR(100) NULL, \
    devMaxVolt VARCHAR(100) NULL, \
    devKAIC VARCHAR(100) NULL, \
    devFrameSet VARCHAR(100) NULL, \
    devSensorSet VARCHAR(100) NULL, \
    devTripSet VARCHAR(100) NULL, \
    devTripUnit VARCHAR(100) NULL, \
    devTripParam VARCHAR(100) NULL, \
    devPoles VARCHAR(100) NULL,  \
    devLugQty VARCHAR(100) NULL,  \
    devLugType VARCHAR(100) NULL, \
    devLugSize VARCHAR(100) NULL, \
    PRIMARY KEY (devID), \
    CONSTRAINT fk_breakerProductID \
    FOREIGN KEY (productID) \
        REFERENCES SF_products(productID) \
        ON DELETE CASCADE \
        ON UPDATE CASCADE, \
    CONSTRAINT fk_breakerSecID \
    FOREIGN KEY (secID) \
        REFERENCES SF_sections(secID) \
        ON DELETE SET NULL \
        ON UPDATE CASCADE, \
    UNIQUE INDEX devID_UNIQUE (devID ASC))\
    ENGINE = InnoDB;', function(err) { if(err) throw err; });

//SF_controls

console.log("salesforceSchema successful");

connection.end();