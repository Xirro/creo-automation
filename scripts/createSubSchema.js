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

connection.query('CREATE DATABASE ' + dbConfig.database, function(err,rows) { if(err) throw err; }); // CREATES mechSubDB SCHEMA

connection.query('USE ' + database, function(err,rows) { if(err) throw err; });

// ********************************************************************************** //
// ******************** PRE-LOADED STATIC TABLES (SHARED B/W APPS) ****************** //
// ********************************************************************************** //
// layoutParamTypes
connection.query('\
CREATE TABLE IF NOT EXISTS ' + database + '.' + dbConfig.layout_paramTypes_table + ' ( \
    dropdownID INT UNSIGNED NOT NULL AUTO_INCREMENT,\
    dropdownType VARCHAR(100) NULL,\
    dropdownValue VARCHAR(100) NULL,\
    PRIMARY KEY (dropdownID), \
    UNIQUE INDEX dropdownID_UNIQUE (dropdownID ASC)) \
    ENGINE = InnoDB;', function(err,rows) { if(err) throw err; });

connection.query("INSERT INTO "+database+"."+dbConfig.layout_paramTypes_table+" (dropdownType, dropdownValue) VALUES " +
    //productFamily
    "('productFamily', 'SERIES 1 SWITCHBOARD'), " +
    "('productFamily', 'SERIES 2 SWITCHBOARD'), " +
    "('productFamily', 'SERIES 3 SWITCHBOARD'), " +
    "('productFamily', 'SERIES 1 SWITCHGEAR'), " +
    "('productFamily', 'POWER DISTRIBUTION UNIT'), " +
    "('productFamily', 'SUBSTATION'), " +
    "('productFamily', 'ANSI STD. SWITCHGEAR CLASS'), " +
    "('productFamily', '15kV SLIMVAC'), " +
    "('productFamily', '15kV SLIMVAC AR'), " +

    //productLine
    "('productLine', 'SIEMENS'), " +
    "('productLine', 'SQUARE D'), " +
    "('productLine', 'ABB'), " +
    "('productLine', 'EATON'), " +
    "('productLine', 'LSIS'), " +
    "('productLine', 'GENERAL ELECTRIC'), " +

    //ulListing
    "('ulListing', 'UL891'), " +
    "('ulListing', 'UL1558'), " +
    "('ulListing', 'UL/ANSI'), " +

    //systemType
    "('systemType', '208Y/120VAC - 3PH, 4W'), " +
    "('systemType', '240VAC - 3PH, 3W'), " +
    "('systemType', '380Y/220VAC - 3PH, 4W'), " +
    "('systemType', '400Y/230VAC - 3PH, 4W'), " +
    "('systemType', '415Y/240VAC - 3PH, 4W'), " +
    "('systemType', '480VAC - 3PH, 3W'), " +
    "('systemType', '480Y/277VAC - 3PH, 4W'), " +
    "('systemType', '600VAC - 3PH, 3W'), " +
    "('systemType', '600Y/347VAC - 3PH, 4W'), " +
    "('systemType', '125VDC - 2W'), " +
    "('systemType', '250VDC - 2W'), " +
    "('systemType', '500VDC - 2W'), " +
    "('systemType', '600VDC - 2W'), " +
    "('systemType', '5kV - 3PH, 3W'), " +
    "('systemType', '7.5kV - 3PH, 3W'), " +
    "('systemType', '12kV - 3PH, 3W'), " +
    "('systemType', '15kV - 3PH, 3W'), " +
    "('systemType', '27kV - 3PH, 3W'), " +
    "('systemType', '33kV - 3PH, 3W'), " +
    "('systemType', '38kV - 3PH, 3W'), " +

    //enclosure
    "('enclosure', 'NEMA 1 INDOOR'), " +
    "('enclosure', 'NEMA 3R OUTDOOR'), " +
    "('enclosure', 'OUTDOOR WALK-IN'), " +
    "('enclosure', 'CUSTOM ENCLOSURE'), " +

    //accessibility
    "('accessibility', 'FRONT AND REAR'), " +
    "('accessibility', 'FRONT AND SIDE'), " +
    "('accessibility', 'FRONT ONLY'), " +

    //cableAccess
    "('cableAccess', 'TOP'), " +
    "('cableAccess', 'BOTTOM'), " +
    "('cableAccess', 'TOP OR BOTTOM'), " +
    "('cableAccess', 'N/A'), " +

    //paint
    "('paint', 'ANSI 49 GRAY - 039/70200 (ASA 49)'), " +
    "('paint', 'ANSI 61 GRAY - T3-GY19'), " +
    "('paint', 'BLACK - HBT2-30015-HC'), " +
    "('paint', 'RAVEN BLACK - HBT2-30015-HC'), " +
    "('paint', 'TOSHIBA BLACK - H1-BK(AM105-6)-R'), " +
    "('paint', 'P.O. BLUE - PPL87314'), " +
    "('paint', 'RED BARON - PPL94334'), " +
    "('paint', 'GRAPHITE GRAY - PRPL97024'), " +
    "('paint', 'SKY WHITE - T9-WH1'), " +
    "('paint', 'PILLER BLUE TEXTURED - RAL 5012(89/40940)'), " +
    "('paint', 'SE WHITE 3 - HWS8-01703'), " +
    "('paint', 'MITSUBISHI BEIGE - PAS3-60022'), " +
    "('paint', 'SILCON GRAY - HAT2-30232'), " +
    "('paint', 'CPN BEIGE - T2-BG2'), " +
    "('paint', 'LIGHT GRAY/OFF WHITE - RAL 7035'), " +
    "('paint', 'BLACK - RAL 9011'), " +
    "('paint', 'NO PAINT - NONE'), " +

    //systemAmp
    "('systemAmp', '800A'), " +
    "('systemAmp', '1200A'), " +
    "('systemAmp', '1600A'), " +
    "('systemAmp', '2000A'), " +
    "('systemAmp', '2500A'), " +
    "('systemAmp', '3000A'), " +
    "('systemAmp', '3200A'), " +
    "('systemAmp', '4000A'), " +
    "('systemAmp', '5000A'), " +
    "('systemAmp', '6000A'), " +
    "('systemAmp', '10000A'), " +

    //mainBusAmp
    "('mainBusAmp', '800A'), " +
    "('mainBusAmp', '1200A'), " +
    "('mainBusAmp', '1600A'), " +
    "('mainBusAmp', '2000A'), " +
    "('mainBusAmp', '2500A'), " +
    "('mainBusAmp', '3000A'), " +
    "('mainBusAmp', '3200A'), " +
    "('mainBusAmp', '4000A'), " +
    "('mainBusAmp', '5000A'), " +
    "('mainBusAmp', '6000A'), " +
    "('mainBusAmp', '10000A'), " +

    //Bus Bracing
    "('busBracing', '65kA'), " +
    "('busBracing', '100kA'), " +
    "('busBracing', '31.5kA'), " +

    //interruptRating
    "('interruptRating', '35kA'), " +
    "('interruptRating', '42kA'), " +
    "('interruptRating', '65kA'), " +
    "('interruptRating', '85kA'), " +
    "('interruptRating', '100kA'), " +
    "('interruptRating', '150kA'), " +
    "('interruptRating', '200kA'), " +
    "('interruptRating', '31.5kA'), " +
    "('interruptRating', '40kA'), " +
    "('interruptRating', '50kA'), " +
    "('interruptRating', '63kA'), " +

    //busType
    "('busType', 'SILVER PLATED COPPER'), " +
    "('busType', 'TIN PLATED COPPER'), " +

    //iccbPlatform
    "('iccbPlatform', 'SQUARE D MASTERPACT NW'), " +
    "('iccbPlatform', 'SIEMENS WL'), " +
    "('iccbPlatform', 'EATON MAGNUM DS'), " +
    "('iccbPlatform', 'EATON MAGNUM SB'), " +
    "('iccbPlatform', 'EATON NRX'), " +
    "('iccbPlatform', 'ABB EMAX2'), " +
    "('iccbPlatform', 'LSIS SUSOL'), " +

    //mccbPlatform
    "('mccbPlatform', 'SQUARE D POWERPACT'), " +
    "('mccbPlatform', 'SIEMENS VL'), " +
    "('mccbPlatform', 'EATON POWER DEFENSE'), " +
    "('mccbPlatform', 'ABB TMAX'), " +
    "('mccbPlatform', 'LSIS SUSOL'), " +

    //vcbPlatform
    "('vcbPlatform', 'ABB VD4'), " +

    //keyInterlocks
    "('keyInterlocks', 'SCHEME 29'), " +
    "('keyInterlocks', 'SCHEME 39'), " +
    "('keyInterlocks', 'SCHEME 29/39'), " +
    "('keyInterlocks', 'SCHEME 40'), " +
    "('keyInterlocks', 'OTHER'), " +
    "('keyInterlocks', 'N/A'); ", function (err, result) { if(err) throw err; });


// layoutParamRestrictions
connection.query('\
CREATE TABLE IF NOT EXISTS ' + database + '.' + dbConfig.layout_paramType_restrictions + ' ( \
    dropdownID INT UNSIGNED NOT NULL AUTO_INCREMENT,\
    dropdownType VARCHAR(100) NULL,\
    dropdownValue VARCHAR(100) NULL,\
    dropdownRestrictions JSON NULL,\
    PRIMARY KEY (dropdownID), \
    UNIQUE INDEX dropdownID_UNIQUE (dropdownID ASC)) \
    ENGINE = InnoDB;', function(err,rows) { if(err) throw err; });
connection.query("INSERT INTO "+database+"."+dbConfig.layout_paramType_restrictions+" (dropdownType, dropdownValue, dropdownRestrictions) VALUES " +

    //Restrictions due to 891 UL Listing
    "('ulListing', 'UL891', '{" +
        "\"systemType\": [\"208Y/120VAC - 3PH, 4W\", \"240VAC - 3PH, 3W\", \"380Y/220VAC - 3PH, 4W\", " +
            "\"400Y/230VAC - 3PH, 4W\", \"415Y/240VAC - 3PH, 4W\", \"480VAC - 3PH, 3W\", \"480Y/277VAC - 3PH, 4W\", " +
            "\"600VAC - 3PH, 3W\", \"600Y/347VAC - 3PH, 4W\", \"125VDC - 2W\", \"250VDC - 2W\", \"500VDC - 2W\", \"600VDC - 2W\"], " +
        "\"systemAmp\": [\"800A\", \"1200A\", \"1600A\", \"2000A\", \"2500A\", \"3000A\", \"3200A\", \"4000A\", \"5000A\", \"6000A\", \"10000A\"], " +
        "\"mainBusAmp\": [\"800A\", \"1200A\", \"1600A\", \"2000A\", \"2500A\", \"3000A\", \"3200A\", \"4000A\", \"5000A\", \"6000A\", \"10000A\"], " +
        "\"busBracing\": [\"65kA\", \"100kA\"], " +
        "\"interruptRating\": [\"42kAIC\", \"65kAIC\", \"85kAIC\", \"100kAIC\"], " +
        "\"enclosure\": [\"NEMA 1 INDOOR\", \"NEMA 3R OUTDOOR\", \"OUTDOOR WALK-IN\", \"CUSTOM ENCLOSURE\"], " +
        "\"accessibility\": [\"FRONT AND REAR\", \"FRONT AND SIDE\", \"FRONT ONLY\"], " +
        "\"cableEntry\": [\"TOP\", \"BOTTOM\", \"TOP OR BOTTOM\"], " +
        "\"iccbPlatform\": [\"SQUARE D MASTERPACT NW\", \"SIEMENS WL\", \"EATON MAGNUM DS\", \"EATON MAGNUM SB\", \"EATON NRX\", \"ABB EMAX2\", \"LSIS SUSOL\"], " +
        "\"mccbPlatform\": [\"SQUARE D POWERPACT\", \"SIEMENS VL\", \"EATON POWER DEFENSE\", \"ABB TMAX\", \"LSIS SUSOL\"], " +
        "\"vcbPlatform\": [] " +
    "}'), " +

    //Restrictions due to 1558 UL Listing
    "('ulListing', 'UL1558', '{" +
        "\"systemType\": [\"208Y/120VAC - 3PH, 4W\", \"240VAC - 3PH, 3W\", \"380Y/220VAC - 3PH, 4W\", " +
            "\"400Y/230VAC - 3PH, 4W\", \"415Y/240VAC - 3PH, 4W\", \"480VAC - 3PH, 3W\", \"480Y/277VAC - 3PH, 4W\", " +
            "\"600VAC - 3PH, 3W\", \"600Y/347VAC - 3PH, 4W\", \"125VDC - 2W\", \"250VDC - 2W\", \"500VDC - 2W\", \"600VDC - 2W\"], " +
        "\"systemAmp\": [\"800A\", \"1200A\", \"1600A\", \"2000A\", \"2500A\", \"3000A\", \"3200A\", \"4000A\", \"5000A\", \"6000A\", \"10000A\"], " +
        "\"mainBusAmp\": [\"800A\", \"1200A\", \"1600A\", \"2000A\", \"2500A\", \"3000A\", \"3200A\", \"4000A\", \"5000A\", \"6000A\", \"10000A\"], " +
        "\"busBracing\": [\"65kA\", \"100kA\"], " +
        "\"interruptRating\": [\"42kAIC\", \"65kAIC\", \"85kAIC\", \"100kAIC\"], " +
        "\"enclosure\": [\"NEMA 1 INDOOR\"], " +
        "\"accessibility\": [\"FRONT AND REAR\"], " +
        "\"cableEntry\": [\"TOP\", \"BOTTOM\", \"TOP OR BOTTOM\"], " +
        "\"iccbPlatform\": [\"SQUARE D MASTERPACT NW\", \"SIEMENS WL\", \"EATON MAGNUM DS\", \"ABB EMAX2\", \"LSIS SUSOL\"], " +
        "\"mccbPlatform\": [], " +
        "\"vcbPlatform\": [] " +
    "}'), " +


    //Restrictions due to UL/ANSI (MV) UL Listing
    "('ulListing', 'UL/ANSI', '{" +
        "\"systemType\": [\"4160VAC - 3PH, 3W\", \"12470VAC - 3PH, 3W\", \"13200VAC - 3PH, 3W\", \"13800VAC - 3PH, 3W\"], " +
        "\"systemAmp\": [\"1200A\", \"2000A\"], " +
        "\"mainBusAmp\": [\"1200A\", \"2000A\"], " +
        "\"busBracing\": [\"31.5kA\"], " +
        "\"interruptRating\": [\"31.5kAIC\"], " +
        "\"enclosure\": [\"NEMA 1 INDOOR\"], " +
        "\"accessibility\": [\"FRONT AND REAR\"], " +
        "\"cableEntry\": [\"TOP\", \"BOTTOM\"], " +
        "\"iccbPlatform\": [], " +
        "\"mccbPlatform\": [], " +
        "\"vcbPlatform\": [\"ABB VD4\"] " +
    "}'), " +



    //Restrictions due to NEMA 3R Enclosure (only in UL891)
    "('enclosure', 'NEMA 1 INDOOR', '{" +
        "\"systemAmp\": [\"800A\", \"1200A\", \"1600A\", \"2000A\", \"2500A\", \"3000A\", \"3200A\", \"4000A\", \"5000A\", \"6000A\", \"10000A\"], " +
        "\"mainBusAmp\": [\"800A\", \"1200A\", \"1600A\", \"2000A\", \"2500A\", \"3000A\", \"3200A\", \"4000A\", \"5000A\", \"6000A\", \"10000A\"] " +
    "}'), " +
    "('enclosure', 'NEMA 3R OUTDOOR', '{" +
        "\"systemAmp\": [\"800A\", \"1200A\", \"1600A\", \"2000A\", \"2500A\", \"3000A\", \"3200A\", \"4000A\"], " +
        "\"mainBusAmp\": [\"800A\", \"1200A\", \"1600A\", \"2000A\", \"2500A\", \"3000A\", \"3200A\", \"4000A\"] " +
    "}') "


    , function (err, result) {
        if (err)
            console.log("Error inserting : %s ", err);
    }
);



// sectionType
connection.query('\
CREATE TABLE IF NOT EXISTS ' + database + '.' + dbConfig.secType_table + ' ( \
    secTypeID INT UNSIGNED NOT NULL AUTO_INCREMENT, \
    type VARCHAR(100) NULL, \
    PRIMARY KEY (secTypeID), \
    UNIQUE INDEX secTypeID_UNIQUE (secTypeID ASC))\
    ENGINE = InnoDB;', function(err) { if(err) throw err; });


connection.query("INSERT INTO "+database+"."+dbConfig.secType_table+" (type) VALUES " +
    "('SWITCHGEAR - UL1558'), " +
    "('SWITCHBOARD - UL891'), " +
    "('PANELBOARD - MAIN LUG (T)'), " +
    "('PANELBOARD - MAIN LUG (B)'), " +
    "('PANELBOARD - NO MAIN LUG'), " +
    "('CONTROL'), " +
    "('PASSTHROUGH'), " +
    "('XFMR'), " +
    "('BOLTSWITCH'), " +
    "('DC DISCONNECT'), " +
    "('UTILITY METERING'); ", function (err, result) { if(err) throw err; });


// brkType
connection.query('\
CREATE TABLE IF NOT EXISTS ' + database + '.' + dbConfig.brkType_table + ' ( \
    brkTypeID INT UNSIGNED NOT NULL AUTO_INCREMENT, \
    type VARCHAR(100) NULL, \
    PRIMARY KEY (brkTypeID), \
    UNIQUE INDEX brkTypeID_UNIQUE (brkTypeID ASC))\
    ENGINE = InnoDB;', function(err) { if(err) throw err; });


connection.query("INSERT INTO "+database+"."+dbConfig.brkType_table+" (type) VALUES " +
    "('MASTERPACT NW (SQUARE D) - FIXED'), " +
    "('MASTERPACT NW (SQUARE D) - DRAWOUT'), " +
    "('POWERPACT (SQUARE D)'), " +
    "('TMAX (ABB)'); ", function (err, result) { if(err) throw err; });



// brkAccOptions
connection.query('\
CREATE TABLE IF NOT EXISTS ' + database + '.' + dbConfig.brkAcc_options_table + ' (\
        brkAccDropdownID INT UNSIGNED NOT NULL AUTO_INCREMENT, \
        brkAcc VARCHAR(100) NULL, \
        brkAccName VARCHAR(100) NULL, \
        brkAccOpt VARCHAR(100) NULL, \
        brkAccNameCode VARCHAR(100) NULL, \
        brkAccOptCode VARCHAR(100) NULL, \
        PRIMARY KEY (brkAccDropdownID), \
        UNIQUE INDEX brkAccDropdownID_UNIQUE (brkAccDropdownID ASC))\
        ENGINE = InnoDB;', function(err){ if(err) throw err; });

let quoteBrkAccData = [
    {brkAcc: "shuntTrip", brkAccName: "Shunt Trip", brkAccOpt: ["110-127VAC/DC 100% DUTY", "24VDC 100% DUTY", "48VDC 100% DUTY"], brkAccNameCode: "ST", brkAccOptCode: ["120VAC/DC", "24VDC", "48VDC"]},
    {brkAcc: "motor", brkAccName: "Spring Charge Motor",  brkAccOpt: ["110-125VAC 3s" , "110-125VDC 3s" , "24VDC 3s" , "48VDC 3s"], brkAccNameCode: "SCM", brkAccOptCode: ["120VAC", "120VDC", "24VDC", "48VDC"]},
    {brkAcc: "springReleaseDevice", brkAccName: "Closing Coil",  brkAccOpt: ["110-127VAC/DC" , "24VDC" , "48VDC"], brkAccNameCode: "CC", brkAccOptCode: ["120VAC/DC", "24VDC", "48VDC"]},
    {brkAcc: "undervoltageTrip", brkAccName: "UV Trip",  brkAccOpt: ["110-127VAC/DC 100% DUTY", "24VDC 100% DUTY", "48VDC 100% DUTY"], brkAccNameCode: "UVR", brkAccOptCode: ["120VAC/DC", "24VDC", "48VDC"]},
    {brkAcc: "secondShuntTrip", brkAccName: "2nd Shunt Trip",  brkAccOpt: ["110-127VAC/DC 100% DUTY", "24VDC 100% DUTY", "48VDC 100% DUTY"], brkAccNameCode: "SST", brkAccOptCode: ["120VAC/DC", "24VDC", "48VDC"]},
    {brkAcc: "auxSwitch", brkAccName: "Aux Switch",  brkAccOpt: ["1", "2" , "4" , "6" , "8" , "10" , "12"], brkAccNameCode: "AUX", brkAccOptCode: ["1", "2", "4", "6", "8", "10", "12"]},
    {brkAcc: "cradleContacts", brkAccName: "Cradle Contacts",  brkAccOpt: ["3C,3T,3D" , "6C,3T,0D" , "9C,0T,0D" , "3C,0T,6D"], brkAccNameCode: "CRC", brkAccOptCode: ["3C,3T,3D" , "6C,3T,0D" , "9C,0T,0D" , "3C,0T,6D"]},
    {brkAcc: "bellAlarm", brkAccName: "Bell Alarm",  brkAccOpt: [], brkAccNameCode: "BA", brkAccOptCode: []},
    {brkAcc: "padlock", brkAccName: "Padlock Provision",  brkAccOpt: [], brkAccNameCode: "PD", brkAccOptCode: []},
    {brkAcc: "comms", brkAccName: "Communications",  brkAccOpt: [], brkAccNameCode: "COM", brkAccOptCode: []},
    {brkAcc: "maintenanceMode", brkAccName: "Maintenance Mode", brkAccOpt: [], brkAccNameCode: "MM", brkAccOptCode: []},
    {brkAcc: "kirkKeyProvisions", brkAccName: "Kirk Key Provision",  brkAccOpt: [], brkAccNameCode: "KK", brkAccOptCode: []},
    {brkAcc: "safetyShutters", brkAccName: "Safety Shutters",  brkAccOpt: [], brkAccNameCode: "SS", brkAccOptCode: []},
    {brkAcc: "pushButtonCover", brkAccName: "Push-button Cover",  brkAccOpt: [], brkAccNameCode: "PB", brkAccOptCode: []},
    {brkAcc: "operationsCounter", brkAccName: "Operations Counter",  brkAccOpt: [], brkAccNameCode: "OC", brkAccOptCode: []},
    {brkAcc: "mechTripIndicator", brkAccName: "Mechanical Trip Indicator",  brkAccOpt: [], brkAccNameCode: "MTI", brkAccOptCode: []},
    {brkAcc: "mechInterlock", brkAccName: "Mechanical Interlock",  brkAccOpt: [], brkAccNameCode: "MI", brkAccOptCode: []},
    {brkAcc: "remoteReset", brkAccName: "Remote Reset",  brkAccOpt: [], brkAccNameCode: "RR", brkAccOptCode: []},
    {brkAcc: "breakerReadyToClose", brkAccName: "Ready to Close",  brkAccOpt: [], brkAccNameCode: "RC", brkAccOptCode: []},
    {brkAcc: "meteringForTripUnit", brkAccName: "Trip Unit Metering",  brkAccOpt: [], brkAccNameCode: "TUM", brkAccOptCode: []},
    {brkAcc: "latchCheck", brkAccName: "Latch Check Switch",  brkAccOpt: [], brkAccNameCode: "LCS", brkAccOptCode: []},
    {brkAcc: "secondaryTerminalBlocks", brkAccName: "Secondary Terminal Blocks",  brkAccOpt: [], brkAccNameCode: "STB", brkAccOptCode: []}
];

for (let i = 0; i < quoteBrkAccData.length; i++) {
    if (quoteBrkAccData[i].brkAccOpt.length != 0) {
        for (let j = 0; j < quoteBrkAccData[i].brkAccOpt.length; j++) {
            connection.query("INSERT INTO " + database + '.' + dbConfig.brkAcc_options_table + " (brkAcc, brkAccName, brkAccOpt, brkAccNameCode, brkAccOptCode) VALUES (?,?,?,?,?)", [quoteBrkAccData[i].brkAcc, quoteBrkAccData[i].brkAccName, quoteBrkAccData[i].brkAccOpt[j], quoteBrkAccData[i].brkAccNameCode, quoteBrkAccData[i].brkAccOptCode[j]]);
        }
    } else {
        connection.query("INSERT INTO " + database + '.' + dbConfig.brkAcc_options_table + " (brkAcc, brkAccName, brkAccOpt, brkAccNameCode, brkAccOptCode) VALUES (?,?,?,?,?)", [quoteBrkAccData[i].brkAcc, quoteBrkAccData[i].brkAccName, null, quoteBrkAccData[i].brkAccNameCode, null]);
    }
}


//controlAsmSum
connection.query('\
CREATE TABLE IF NOT EXISTS ' + database + '.' + dbConfig.control_assemblies_table + ' ( \
    cktID INT UNSIGNED NOT NULL AUTO_INCREMENT, \
    cktName VARCHAR(100) NULL, \
    extCost DOUBLE NULL, \
    hrsEE DOUBLE NULL, \
    hrsTEST DOUBLE NULL, \
    hrsPROG DOUBLE NULL, \
    numWires INT NULL, \
    PRIMARY KEY (cktID), \
    UNIQUE INDEX cktID_UNIQUE (cktID ASC))\
    ENGINE = InnoDB;', function(err) { if(err) throw err; });


//controlItemSum
connection.query('\
CREATE TABLE IF NOT EXISTS ' + database + '.' + dbConfig.control_items_table + ' ( \
    ctlItemID INT UNSIGNED NOT NULL AUTO_INCREMENT, \
    cktID INT UNSIGNED NULL, \
    itemDesc VARCHAR(100) NULL, \
    itemPN VARCHAR(100) NULL, \
    unitCost DOUBLE UNSIGNED NULL, \
    qty INT UNSIGNED NULL,\
    catCode VARCHAR(100), \
    PRIMARY KEY (ctlItemID), \
    CONSTRAINT fk_controlAsmItem \
    FOREIGN KEY (cktID) \
        REFERENCES controlAsmSum(cktID) \
        ON DELETE CASCADE \
        ON UPDATE CASCADE, \
    CONSTRAINT fk_controlItemCatCode \
    UNIQUE INDEX ctlItemID_UNIQUE (ctlItemID ASC))\
    ENGINE = InnoDB;', function(err) { if(err) throw err; });


// ********************************************************************************** //
// ****************** MECHANICAL ENGINEERING SUBMITTAL TABLES *********************** //
// ********************************************************************************** //

// submittalSum
connection.query('\
CREATE TABLE IF NOT EXISTS ' + database + '.' + dbConfig.submittal_summary_table + ' ( \
    subID INT UNSIGNED NOT NULL AUTO_INCREMENT, \
    jobNum VARCHAR(6) NULL, \
    releaseNum VARCHAR(10) NULL, \
    jobName VARCHAR(100) NULL, \
    customer VARCHAR(100) NULL, \
    layoutName VARCHAR(100) NULL, \
    drawnBy VARCHAR(5) NULL, \
    drawnDate DATE NULL, \
    checkedBy VARCHAR(5) NULL, \
    checkedDate DATE NULL, \
    PRIMARY KEY (subID), \
    UNIQUE INDEX subID_UNIQUE (subID ASC))\
    ENGINE = InnoDB;', function(err,rows) { if(err) throw err; });

// submittalRevSum
connection.query('\
CREATE TABLE IF NOT EXISTS ' + database + '.' + dbConfig.submittal_rev_table + ' ( \
    revID INT UNSIGNED NOT NULL AUTO_INCREMENT, \
    subID INT UNSIGNED NOT NULL, \
    revNum VARCHAR(3) NULL, \
    revNote VARCHAR(100) NULL, \
    PRIMARY KEY (revID), \
    CONSTRAINT fk_subID \
    FOREIGN KEY (subID) \
        REFERENCES submittalSum(subID) \
        ON DELETE CASCADE \
        ON UPDATE CASCADE, \
    UNIQUE INDEX revID_UNIQUE (revID ASC)) \
    ENGINE = InnoDB;', function(err,rows) { if(err) throw err; });

// submittalLayoutSum
connection.query('\
CREATE TABLE IF NOT EXISTS ' + database + '.' + dbConfig.submittal_layout_table + ' ( \
    layoutID INT UNSIGNED NOT NULL AUTO_INCREMENT, \
    subID INT UNSIGNED NOT NULL, \
    layoutName VARCHAR(100) NULL, \
    layoutCatalogPN VARCHAR(100) NULL, \
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
    PRIMARY KEY (layoutID), \
    CONSTRAINT fk_layoutSubID \
    FOREIGN KEY (subID) \
        REFERENCES submittalSum(subID) \
        ON DELETE CASCADE \
        ON UPDATE CASCADE, \
    UNIQUE INDEX layoutID_UNIQUE (layoutID ASC)) \
    ENGINE = InnoDB;', function(err,rows) { if(err) throw err; });

// submittalSectionSum
connection.query('\
CREATE TABLE IF NOT EXISTS ' + database + '.' + dbConfig.submittal_sections_table + ' ( \
    secID INT UNSIGNED NOT NULL AUTO_INCREMENT, \
    layoutID INT UNSIGNED NULL, \
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
    CONSTRAINT fk_layoutID \
    FOREIGN KEY (layoutID) \
        REFERENCES submittalLayoutSum(layoutID) \
        ON DELETE CASCADE \
        ON UPDATE CASCADE, \
    UNIQUE INDEX secID_UNIQUE (secID ASC))\
    ENGINE = InnoDB;', function(err) { if(err) throw err; });

// submittalBrkSum
connection.query('\
CREATE TABLE IF NOT EXISTS ' + database + '.' + dbConfig.submittal_breaker_table + ' ( \
    devID INT UNSIGNED NOT NULL AUTO_INCREMENT, \
    layoutID INT UNSIGNED NOT NULL, \
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
    CONSTRAINT fk_layoutID_1 \
    FOREIGN KEY (layoutID) \
        REFERENCES submittalLayoutSum(layoutID) \
        ON DELETE CASCADE \
        ON UPDATE CASCADE, \
    CONSTRAINT fk_secID_1 \
    FOREIGN KEY (secID) \
        REFERENCES submittalSectionSum(secID) \
        ON DELETE SET NULL \
        ON UPDATE CASCADE, \
    UNIQUE INDEX devID_UNIQUE (devID ASC))\
    ENGINE = InnoDB;', function(err) { if(err) throw err; });

// submittalBrkAccSum
connection.query('\
CREATE TABLE IF NOT EXISTS ' + database + '.' + dbConfig.submittal_brkAcc_table + ' ( \
    brkAccID INT UNSIGNED NOT NULL AUTO_INCREMENT, \
    brkAccDropdownID INT UNSIGNED NULL,\
    devID INT UNSIGNED NULL,\
    PRIMARY KEY (brkAccID), \
    CONSTRAINT fk_devID_1 \
    FOREIGN KEY (devID) \
        REFERENCES submittalBrkSum(devID) \
        ON DELETE CASCADE \
        ON UPDATE CASCADE, \
    CONSTRAINT fk_brkAccDropdownID \
    FOREIGN KEY (brkAccDropdownID) \
        REFERENCES brkAccOptions(brkAccDropdownID) \
        ON DELETE CASCADE \
        ON UPDATE CASCADE, \
    UNIQUE INDEX brkAccID_UNIQUE (brkAccID ASC))\
    ENGINE = InnoDB;', function(err) { if(err) throw err; });



//submittalPanelBrkSum
connection.query('\
CREATE TABLE IF NOT EXISTS ' + database + '.' + dbConfig.submittal_panel_breakers + ' ( \
    panelBrkID INT UNSIGNED NOT NULL AUTO_INCREMENT, \
    secID INT UNSIGNED NULL, \
    devID INT UNSIGNED NULL, \
    panelRow INT UNSIGNED NULL, \
    configuration VARCHAR(100) NULL, \
    mounting VARCHAR(100) NULL, \
    frame VARCHAR(100) NULL, \
    PRIMARY KEY (panelBrkID), \
    CONSTRAINT fk_secID_2 \
    FOREIGN KEY (secID) \
        REFERENCES submittalSectionSum(secID) \
        ON DELETE CASCADE \
        ON UPDATE CASCADE, \
    CONSTRAINT fk_devID_2 \
    FOREIGN KEY (devID) \
        REFERENCES submittalBrkSum(devID) \
        ON DELETE SET NULL \
        ON UPDATE CASCADE, \
    UNIQUE INDEX panelBrkID_UNIQUE (panelBrkID ASC))\
    ENGINE = InnoDB;', function(err) { if(err) throw err; });


console.log("createSubSchema successful");

connection.end();
