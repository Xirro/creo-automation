var mysql = require('mysql');
var dbConfig = require('../app/config/database');

var connection = mysql.createConnection(dbConfig.connection);

connection.query('DROP SCHEMA IF EXISTS ' + dbConfig.database, function(err,rows) { if(err) throw err; }); // DROPS RESIDUAL DATABASE/TABLES

connection.query('CREATE DATABASE ' + dbConfig.database, function(err,rows) { if(err) throw err; }); // CREATES SAI_db SCHEMA

connection.query('USE ' + dbConfig.database, function(err,rows) { if(err) throw err; });

//JOBSCOPE TABLES
connection.query('\
CREATE TABLE IF NOT EXISTS ' + dbConfig.database + '.' + dbConfig.jobscope_codes_table + ' ( \
    idCode INT UNSIGNED NOT NULL AUTO_INCREMENT, \
    catCode VARCHAR(100) NOT NULL, \
    PRIMARY KEY (idCode), \
    UNIQUE INDEX idCode_UNIQUE (idCode ASC))\
    ENGINE = InnoDB;', function(err,rows) { if(err) throw err; });

connection.query("INSERT INTO "+dbConfig.database+"."+dbConfig.jobscope_codes_table+" (catCode) VALUES " +
    "('01-STEEL'), " +
    "('02-COPPER'), " +
    "('06-WIRE'), " +
    "('12-ACC'), " +
    "('25-TRN CON'), " +
    "('26-METER'), " +
    "('27-FUSE'), " +
    "('28-KIRK'), " +
    "('30-LUGS'), " +
    "('31-GEN CON'), " +
    "('33-PLC'), " +
    "('34-INS TRN'), " +
    "('35-POW TRN'), " +
    "('36-CB MC'), " +
    "('37-CB IC'), " +
    "('38-DISC SW'), " +
    "('39-MV GEAR'), " +
    "('40-PANEL'), " +
    "('41-TVSS'), " +
    "('42-PROT RLY'), " +
    "('43-COMP HW'), " +
    "('44-COMP SW'), " +
    "('84-MISC'), " +
    "('92-BUYOUT'), " +
    "('96-OUTSVC'), " +
    "('98-ENGOUT') ", function (err, result) {
    if (err)
        console.log("Error inserting : %s ", err);
});

//APPLICATION ENGINEERING TABLES
connection.query('\
CREATE TABLE IF NOT EXISTS ' + dbConfig.database + '.' + dbConfig.quote_summary_table + ' ( \
    quoteID INT UNSIGNED NOT NULL AUTO_INCREMENT, \
    quoteNum VARCHAR(100) NULL, \
    revNum VARCHAR(2) DEFAULT "00",\
    projName VARCHAR(100) NULL, \
    customer VARCHAR(100) NULL, \
    rep VARCHAR(100) NULL, \
    quoteNotes VARCHAR(1000) NULL, \
    createdBy VARCHAR(100) NULL, \
    PRIMARY KEY (quoteID), \
    UNIQUE INDEX quoteID_UNIQUE (quoteID ASC))\
    ENGINE = InnoDB;', function(err,rows) { if(err) throw err; });

connection.query('\
CREATE TABLE IF NOT EXISTS ' + dbConfig.database + '.' + dbConfig.quote_layout_table + ' ( \
    layoutID INT UNSIGNED NOT NULL AUTO_INCREMENT, \
    quoteID INT UNSIGNED NULL, \
    layoutNum INT UNSIGNED NULL, \
    layoutName VARCHAR(100) NULL, \
    numSections INT NULL, \
    layoutType VARCHAR(100) NULL, \
    layoutUL VARCHAR(100) NULL, \
    layoutEnclosure VARCHAR(100) NULL, \
    layoutAccess VARCHAR(100) NULL, \
    layoutBusType VARCHAR(100) NULL, \
    layoutPaint VARCHAR(100) NULL,\
    layoutCabEntry VARCHAR(100) NULL, \
    layoutSystem VARCHAR(100) NULL, \
    systemAmp VARCHAR(100) NULL, \
    mainBusAmp VARCHAR(100) NULL, \
    busBracing VARCHAR(100) NULL, \
    interuptRating VARCHAR(100) NULL, \
    seismicCheck ENUM("Y","N") NOT NULL, \
    mimicCheck ENUM("Y","N") NOT NULL, \
    IRCheck ENUM("Y","N") NOT NULL, \
    wirewayCheck ENUM("Y","N") NOT NULL, \
    trolleyCheck ENUM("Y","N") NOT NULL, \
    PRIMARY KEY (layoutID), \
    UNIQUE INDEX layoutID_UNIQUE (layoutID ASC)) \
    ENGINE = InnoDB;', function(err,rows) { if(err) throw err; });

connection.query('\
CREATE TABLE IF NOT EXISTS ' +  dbConfig.database + '.' + dbConfig.quote_section_type + ' (\
    secTypeID INT UNSIGNED NOT NULL AUTO_INCREMENT, \
    secType VARCHAR(100) NULL, \
    PRIMARY KEY (secTypeID), \
    UNIQUE INDEX secTypeID_UNIQUE (secTypeID ASC)) \
    ENGINE = InnoDB;', function(err,rows) { if(err) throw err; });

connection.query("INSERT INTO "+dbConfig.database+"."+dbConfig.quote_section_type+" (secType) VALUES " +
    "('BOLTSWITCH'), " +
    "('CONTROL'), " +
    "('DC DISCONNECT'), " +
    "('PANELBOARD'), " +
    "('PASSTHROUGH'), " +
    "('SWITCHBOARD/ SWITCHGEAR'), " +
    "('UTILITY METERING'), " +
    "('XFMR')"

    , function (err, result) {
        if (err)
            console.log("Error inserting : %s ", err);
    }
);

connection.query('\
CREATE TABLE IF NOT EXISTS ' + dbConfig.database + '.' + dbConfig.quote_layout_dropdown + ' ( \
    dropdownID INT UNSIGNED NOT NULL AUTO_INCREMENT,\
    dropdownType VARCHAR(100) NULL,\
    dropdownValue VARCHAR(100) NULL,\
    PRIMARY KEY (dropdownID), \
    UNIQUE INDEX dropdownID_UNIQUE (dropdownID ASC)) \
    ENGINE = InnoDB;', function(err,rows) { if(err) throw err; });

connection.query("INSERT INTO "+dbConfig.database+"."+dbConfig.quote_layout_dropdown+" (dropdownType, dropdownValue) VALUES " +
    //ulListing
    "('ulListing', 'UL891'), " +
    "('ulListing', 'UL1558'), " +

    //systemType
    "('systemType', '480V - 3PH 3W'), " +
    "('systemType', '480Y/277V - 3PH 4W'), " +
    "('systemType', '600V - 3PH 3W'), " +
    "('systemType', '208Y/120V - 3PH 4W'), " +
    "('systemType', '120V - 3PH 3W'), " +

    //enclosure
    "('enclosure', 'NEMA 1'), " +
    "('enclosure', 'NEMA 3R'), " +
    "('enclosure', 'NEMA 4X'), " +
    "('enclosure', 'NEMA 12'), " +

    //accessibility
    "('accessibility', 'FRONT AND REAR ACCESS'), " +
    "('accessibility', 'FRONT AND SIDE ACCESS'), " +
    "('accessibility', 'FRONT ACCESS ONLY'), " +

    //cableAccess
    "('cableAccess', 'TOP'), " +
    "('cableAccess', 'BOTTOM'), " +
    "('cableAccess', 'TOP OR BOTTOM'), " +
    "('cableAccess', 'N/A'), " +

    //paint
    "('paint', 'ANSI 61'), " +
    "('paint', 'RAL 7035'), " +

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
    "('Bus Bracing', '85kA'), " +
    "('Bus Bracing', '100kA'), " +
    "('Bus Bracing', '150kA'), " +

    //interruptRating
    "('interruptRating', '42kAIC'), " +
    "('interruptRating', '65kAIC'), " +
    "('interruptRating', '85kAIC'), " +
    "('interruptRating', '100kAIC'), " +
    "('interruptRating', '130kAIC'), " +
    "('interruptRating', '150kAIC'), " +
    "('interruptRating', '200kAIC'), " +

    //busType
    "('busType', 'SILVER PLATED COPPER'), " +
    "('busType', 'TIN PLATED COPPER'), "

    , function (err, result) {
        if (err)
            console.log("Error inserting : %s ", err);
    }
);

//parts and labor
connection.query('\
CREATE TABLE IF NOT EXISTS ' + dbConfig.database + '.' + dbConfig.quote_parts_labor_table + ' ( \
    partsLaborID INT UNSIGNED NOT NULL AUTO_INCREMENT, \
    quoteID INT UNSIGNED NULL, \
    title VARCHAR(100) NULL, \
    partsLaborNum INT UNSIGNED NULL,\
    PRIMARY KEY (partsLaborID), \
        UNIQUE INDEX partsLaborID_UNIQUE (partsLaborID ASC)) \
        ENGINE = InnoDB;', function(err,rows) { if(err) throw err; });

//field service
connection.query('\
CREATE TABLE IF NOT EXISTS ' + dbConfig.database + '.' + dbConfig.quote_field_service_table + ' ( \
    fieldServiceID INT UNSIGNED NOT NULL AUTO_INCREMENT, \
    quoteID INT UNSIGNED NULL, \
    title VARCHAR(100) NULL, \
    fieldServiceNum INT NULL,\
    technicians DOUBLE NULL, \
    numberOfTrips DOUBLE NULL, \
    travelLaborDays DOUBLE NULL, \
    regularTimeDays DOUBLE NULL, \
    overTimeDays DOUBLE NULL, \
    holidaysTimeDays DOUBLE NULL, \
    mealExpense DOUBLE NULL, \
    hotelExpense DOUBLE NULL, \
    flying VARCHAR(100) NULL, \
    airfare DOUBLE NULL, \
    parkingExpense DOUBLE NULL, \
    rentalCarExpense DOUBLE NULL, \
    driving VARCHAR(100) NULL, \
    numberOfMiles DOUBLE NULL, \
    carMileageCost DOUBLE NULL, \
    remarks VARCHAR(250) NULL, \
    total DOUBLE NULL, \
    PRIMARY KEY (fieldServiceID), \
        UNIQUE INDEX fieldServiceID_UNIQUE (fieldServiceID ASC)) \
        ENGINE = InnoDB;', function(err,rows) { if(err) throw err; });

//freight
connection.query('\
CREATE TABLE IF NOT EXISTS ' + dbConfig.database + '.' + dbConfig.quote_freight_table + ' ( \
    freightID INT UNSIGNED NOT NULL AUTO_INCREMENT, \
    quoteID INT UNSIGNED NULL, \
    title VARCHAR(100) NULL, \
    freightNum INT UNSIGNED NULL, \
    standardTruck VARCHAR(100) NULL, \
    flatbedTruck VARCHAR(100) NULL, \
    stepDeckTruck VARCHAR(100) NULL, \
    height DOUBLE UNSIGNED NULL, \
    width DOUBLE UNSIGNED NULL, \
    depth DOUBLE UNSIGNED NULL, \
    weight DOUBLE UNSIGNED NULL, \
    surroundingStates VARCHAR(100) NULL, \
    eastCoast VARCHAR(100) NULL, \
    westCoast VARCHAR(100) NULL, \
    truckCost DOUBLE UNSIGNED NULL,\
    truckCostOverride VARCHAR(100) NULL,\
    numOfTrucks DOUBLE UNSIGNED NULL,\
    remarks VARCHAR(250),\
    total DOUBLE UNSIGNED NULL,\
    totalOverride VARCHAR(100) NULL, \
    PRIMARY KEY (freightID), \
    UNIQUE INDEX freightID_UNIQUE (freightID ASC))\
    ENGINE = InnoDB;', function(err,rows) { if(err) throw err; });

//warranty
connection.query('\
CREATE TABLE IF NOT EXISTS ' + dbConfig.database + '.' + dbConfig.quote_warranty_table + ' ( \
    warrantyID INT UNSIGNED NOT NULL AUTO_INCREMENT, \
    quoteID INT UNSIGNED NULL, \
    title VARCHAR(100) NULL, \
    warrantyNum INT UNSIGNED NULL, \
    PRIMARY KEY (warrantyID), \
    UNIQUE INDEX warrantyID_UNIQUE (warrantyID ASC))\
    ENGINE = InnoDB;', function(err,rows) { if(err) throw err; });

connection.query('\
CREATE TABLE IF NOT EXISTS ' + dbConfig.database + '.' + dbConfig.quote_breaker_table + ' ( \
    devID INT UNSIGNED NOT NULL AUTO_INCREMENT, \
    quoteID INT UNSIGNED NULL, \
    layoutNum INT UNSIGNED NULL, \
    devDesignation VARCHAR(100) NULL, \
    devApp VARCHAR(100) NULL, \
    unitOfIssue VARCHAR(100) NULL, \
    catCode VARCHAR(100) NULL, \
    brkPN VARCHAR(100) NULL, \
    cradlePN VARCHAR(100) NULL, \
    devProduct VARCHAR(100) NULL, \
    devMfg VARCHAR(100) NULL, \
    devProdLine VARCHAR(100) NULL, \
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
    devAcc VARCHAR(100) NULL, \
    PRIMARY KEY (devID), \
    UNIQUE INDEX idDev_UNIQUE (devID ASC))\
    ENGINE = InnoDB;', function(err,rows) { if(err) throw err; });

connection.query('\
CREATE TABLE IF NOT EXISTS ' + dbConfig.database + '.' + dbConfig.quote_brkAcc_table + ' ( \
    brkAccID INT UNSIGNED NOT NULL AUTO_INCREMENT, \
    quoteID INT NULL,\
    layoutNum INT NULL, \
    devID INT NULL,\
    productLine VARCHAR(100) NULL,\
    brkAccOpt JSON NULL, \
    PRIMARY KEY (brkAccID), \
        UNIQUE INDEX brkAccID_UNIQUE (brkAccID ASC))\
        ENGINE = InnoDB;', function(err) { if(err) throw err; });

connection.query('\
CREATE TABLE IF NOT EXISTS ' + dbConfig.database + '.' + dbConfig.quote_brkAcc_dropdown + ' (\
        brkAccDropdownID INT UNSIGNED NOT NULL AUTO_INCREMENT, \
        mfg VARCHAR(100) NULL, \
        productLine VARCHAR(100) NULL, \
        brkAccOpt JSON NULL, \
        PRIMARY KEY (brkAccDropdownID), \
        UNIQUE INDEX brkAccDropdownID_UNIQUE (brkAccDropdownID ASC))\
        ENGINE = InnoDB;', function(err){ if(err) throw err; });

connection.query("INSERT INTO " + dbConfig.database + '.' + dbConfig.quote_brkAcc_dropdown + " (mfg, productLine, brkAccOpt) VALUES " +
    "(" +
    "'Eaton', " +
    "'Magnum DS (ICCB)', " +
    "'{" +
    "\"shuntTrip\": [\"None\", \"110-127vac/dc 100% duty\", \"24vdc 100% duty\", \"48vdc 100% duty\"], " +
    "\"motor\": [\"None\", \"110-125vac 3 sec\", \"110-125vdc 3 sec\", \"24vdc 3 sec\", \"48vdc 3 sec\"], " +
    "\"springReleaseDevice\": [\"None\", \"110-127vac/dc\", \"24vdc\", \"48vdc\"], " +
    "\"undervoltageTrip\": [\"None\", \"110-125vac\", \"110-125vdc\", \"208-277vac\", \"24vdc\", \"48vdc\"], " +
    "\"secondShuntTrip\": [\"None\", \"110-127vac/dc 100% duty\", \"24vdc 100% duty\", \"48vdc 100% duty\"], " +
    "\"auxSwitch\": [\"2\", \"4\", \"6\", \"8\", \"10\", \"12\"], " +
    "\"bellAlarm\": [\"1\", \"2\"], " +
    "\"mechTripIndicator\": [\"Yes\"], " +
    "\"mechInterlock\": [\"Yes\"], " +
    "\"remoteReset\": " + null + ", " +
    "\"padlock\": [\"None\", \"Metal\", \"Plastic\"], " +
    "\"operationsCounter\": [\"Yes\", \"No\"], " +
    "\"kirkKeyProvisions\": [\"Yes\", \"No\"], " +
    "\"breakerReadyToClose\": " + null + ", " +
    "\"meteringForTripUnit\": " + null + ", " +
    "\"coms\": " + null + ", " +
    "\"pushButtonCover\": " + null + ", " +
    "\"latchCheck\": " + null + ", " +
    "\"secondaryTerminalBlocks\": " + null +
    "}'" +
    "), " +
    "(" +
    "'Eaton', " +
    "'Magnum SB (ICCB or MCCB)', " +
    "'{" +
    "\"shuntTrip\": [\"None\", \"110-127vac/dc 100% duty\", \"24vdc 100% duty\", \"48vdc 100% duty\"], " +
    "\"motor\": [\"None\", \"110-125vac 3 sec\", \"110-125vdc 3 sec\", \"24vdc 3 sec\", \"48vdc 3 sec\"], " +
    "\"springReleaseDevice\": [\"None\", \"110-127vac/dc\", \"24vdc\", \"48vdc\"], " +
    "\"undervoltageTrip\": [\"None\", \"110-125vac\", \"110-125vdc\", \"208-277vac\", \"24vdc\", \"48vdc\"], " +
    "\"secondShuntTrip\": [\"None\", \"110-127vac/dc 100% duty\", \"24vdc 100% duty\", \"48vdc 100% duty\"], " +
    "\"auxSwitch\": [\"2\", \"4\", \"6\"], " +
    "\"bellAlarm\": [\"2\"], " +
    "\"mechTripIndicator\": [\"Yes\"], " +
    "\"mechInterlock\": [\"Yes\"], " +
    "\"remoteReset\": " + null + ", " +
    "\"padlock\": [\"None\", \"Metal\", \"Plastic\"], " +
    "\"operationsCounter\": [\"Yes\", \"No\"], " +
    "\"kirkKeyProvisions\": [\"Yes\", \"No\"], " +
    "\"breakerReadyToClose\": " + null + ", " +
    "\"meteringForTripUnit\": [\"Upper Terms\", \"Lower Terms\"], " +
    "\"coms\": " + null + ", " +
    "\"pushButtonCover\": " + null + ", " +
    "\"latchCheck\": [\"None\", \"LCS Wired to SRD\"], " +
    "\"secondaryTerminalBlocks\": " + null +
    "}'" +
    "), " +
    "(" +
    "'Eaton', " +
    "'NRX NF (ICCB or MCCB)', " +
    "'{" +
    "\"shuntTrip\": [\"None\", \"110-127vac/dc\", \"24vdc\", \"48vdc\"], " +
    "\"motor\": [\"None\", \"110-125vac\", \"110-125vdc\", \"24vdc\", \"48vdc\"], " +
    "\"springReleaseDevice\": [\"None\", \"110-127vac/dc\", \"24vdc\", \"48vdc\"], " +
    "\"undervoltageTrip\": [\"None\", \"110-125vac/dc\", \"208-250vac/dc\", \"24vdc\", \"48vdc\"], " +
    "\"secondShuntTrip\": [\"None\", \"110-127vac/dc\", \"24vdc\", \"48vdc\"], " +
    "\"auxSwitch\": [\"2\", \"4\"], " +
    "\"bellAlarm\": [\"2\"], " +
    "\"mechTripIndicator\": [\"interlock trip\"], " +
    "\"mechInterlock\": " + null + ", " +
    "\"remoteReset\": " + null + ", " +
    "\"padlock\": [\"None\", \"Metal\", \"Plastic\"], " +
    "\"operationsCounter\": [\"Yes\", \"No\"], " +
    "\"kirkKeyProvisions\": [\"Yes\", \"No\"], " +
    "\"breakerReadyToClose\":" + null + ", " +
    "\"meteringForTripUnit\": " + null + ", " +
    "\"coms\": " + null + ", " +
    "\"pushButtonCover\": " + null + ", " +
    "\"latchCheck\": [\"None\", \"LCS Wired to SRD\"], " +
    "\"secondaryTerminalBlocks\": [\"Per Breaker Options\", \"Full Complement\"] " +
    "}'" +
    "), " +
    "(" +
    "'Eaton', " +
    "'NRX RF (ICCB or MCCB)', " +
    "'{" +
    "\"shuntTrip\": [\"None\", \"110-127vac/dc\", \"24vdc\", \"48vdc\"], " +
    "\"motor\": [\"None\", \"110-125vac\", \"24vdc\", \"48vdc\"], " +
    "\"springReleaseDevice\": [\"None\", \"110-127vac/dc\", \"24vdc\", \"48vdc\"], " +
    "\"undervoltageTrip\": [\"None\", \"110-125vac/dc\", \"208-250vac/dc\", \"24vdc\", \"48vdc\"], " +
    "\"secondShuntTrip\": [\"None\", \"110-127vac/dc\", \"24vdc\", \"48vdc\"], " +
    "\"auxSwitch\": [\"2\", \"6\", \"8\", \"10\", \"12\"], " +
    "\"bellAlarm\": [\"1\", \"2\"], " +
    "\"mechTripIndicator\": " + null + ", " +
    "\"mechInterlock\": [\"interlock trip\"], " +
    "\"remoteReset\": " + null + ", " +
    "\"padlock\": [\"None\", \"Metal\", \"Plastic\"], " +
    "\"operationsCounter\": [\"Yes\", \"No\"], " +
    "\"kirkKeyProvisions\": [\"Yes\", \"No\"], " +
    "\"breakerReadyToClose\": " + null + ", " +
    "\"meteringForTripUnit\": " + null + ", " +
    "\"coms\": " + null + ", " +
    "\"pushButtonCover\": " + null + ", " +
    "\"latchCheck\": [\"None\", \"LCS Wired to SRD\"], " +
    "\"secondaryTerminalBlocks\": [\"Per Breaker Options\", \"Full Complement\"] " +
    "}'" +
    "), " +
    "(" +
    "'Siemens', " +
    "'WL (ICCB)', " +
    "'{" +
    "\"shuntTrip\": [\"None\", \"24vdc\", \"48vdc\", \"125vdc\", \"120vac\"], " +
    "\"motor\": [\"None\", \"24vdc\", \"48vdc\", \"125vdc\", \"120vac\"], " +
    "\"springReleaseDevice\": [\"None\", \"24vdc\", \"48vdc\", \"125vdc\", \"120vac\"], " +
    "\"undervoltageTrip\": [\"None\", \"24vdc\", \"48vdc\", \"125vdc\", \"120vac\", \"240vac\", \"24vdc delay\", \"48vdc delay\", \"125vdc delay\", \"120vac delay\"], " +
    "\"secondShuntTrip\": [\"None\", \"24vdc\", \"48vdc\", \"125vdc\", \"120vac\"], " +
    "\"auxSwitch\": [\"2\", \"4\"], " +
    "\"bellAlarm\": [\"Yes\"], " +
    "\"mechTripIndicator\": " + null + ", " +
    "\"mechInterlock\": " + null + ", " +
    "\"remoteReset\": " + null + ", " +
    "\"padlock\": " + null + ", " +
    "\"operationsCounter\": [\"Yes\", \"No\"], " +
    "\"kirkKeyProvisions\": [\"Yes\", \"No\"], " +
    "\"breakerReadyToClose\": [\"Yes\", \"No\"], " +
    "\"meteringForTripUnit\": [\"Yes\", \"No\"], " +
    "\"coms\": [\"None\", \"Modbus\"], " +
    "\"pushButtonCover\": " + null + ", " +
    "\"latchCheck\": " + null + ", " +
    "\"secondaryTerminalBlocks\": " + null +
    "}'" +
    "), " +
    "(" +
    "'ABB', " +
    "'EMAX 2 (ICCB)', " +
    "'{" +
    "\"shuntTrip\": [\"None\", \"24vac/dc\", \"30vac/dc\", \"48vac/dc\", \"110-120vac/dc\", \"120-127vac/dc\"], " +
    "\"motor\": [\"None\", \"24-30vac/dc\", \"48-60vac/dc\", \"100-130vac/dc\"], " +
    "\"springReleaseDevice\": [\"None\", \"24vac/dc\", \"30vac/dc\", \"48vac/dc\", \"110-120vac/dc\", \"120-127vac/dc\"], " +
    "\"undervoltageTrip\": [\"None\", \"24vac/dc\", \"30vac/dc\", \"48vac/dc\", \"110-120vac/dc\", \"120-127vac/dc\", \"277vac\"], " +
    "\"secondShuntTrip\": [\"None\", \"24vac/dc\", \"30vac/dc\", \"48vac/dc\", \"110-120vac/dc\", \"120-127vac/dc\"], " +
    "\"auxSwitch\": [\"4\"], " +
    "\"bellAlarm\": [\"Yes\"], " +
    "\"mechTripIndicator\": " + null + ", " +
    "\"mechInterlock\": " + null + ", " +
    "\"remoteReset\": " + null + ", " +
    "\"padlock\": [\"None\", \"Yes\"], " +
    "\"operationsCounter\": [\"Yes\", \"No\"], " +
    "\"kirkKeyProvisions\": [\"Yes\", \"No\"], " +
    "\"breakerReadyToClose\": [\"None\", \"250vac/dc\"], " +
    "\"meteringForTripUnit\": " + null + ", " +
    "\"coms\": [\"None\", \"Mod rs 485\", \"Mod tcp\"], " +
    "\"pushButtonCover\": [\"Yes\", \"No\"], " +
    "\"latchCheck\": " + null + ", " +
    "\"secondaryTerminalBlocks\": " + null +
    "}'" +
    "), " +
    "(" +
    "'Schneider/ Square D', " +
    "'Masterpact NW (ICCB)', " +
    "'{" +
    "\"shuntTrip\": [\"None\", \"24-30vac/dc\", \"48-60vac/dc\", \"100-130vac/dc\"], " +
    "\"motor\": [\"None\", \"24-30vac/dc\", \"48-60vac/dc\", \"100-130vac/dc\"], " +
    "\"springReleaseDevice\": [\"None\", \"24-30vac/dc\", \"48-60vac/dc\", \"100-130vac/dc\"], " +
    "\"undervoltageTrip\": [\"None\", \"24-30vac/dc\", \"48-60vac/dc\", \"100-130vac/dc\", \"220-240vac/dc\", \"24-30vac/dc delay\", \"48-60vac/dc delay\", \"100-130vac/dc delay\", \"220-240vac/dc delay\"], " +
    "\"secondShuntTrip\": [\"None\", \"24-30vac/dc\", \"48-60vac/dc\", \"100-130vac/dc\"], " +
    "\"auxSwitch\": [\"4\", \"8\", \"12\"], " +
    "\"bellAlarm\": [\"1\", \"2\"], " +
    "\"mechTripIndicator\": " + null + ", " +
    "\"mechInterlock\": " + null + ", " +
    "\"remoteReset\": " + null + ", " +
    "\"padlock\": [\"Yes\", \"No\"], " +
    "\"operationsCounter\": [\"Yes\", \"No\"], " +
    "\"kirkKeyProvisions\": [\"Yes\", \"No\"], " +
    "\"breakerReadyToClose\": [\"Yes\", \"No\"], " +
    "\"meteringForTripUnit\": " + null + ", " +
    "\"coms\": [\"None\", \"Modbus\"], " +
    "\"pushButtonCover\": [\"Yes\", \"No\"], " +
    "\"latchCheck\": " + null + ", " +
    "\"secondaryTerminalBlocks\": " + null +
    "}'" +
    "), " +
    "(" +
    "'Schneider/ Square D', " +
    "'Powerpact (MCCB)', " +
    "'{}'" +
    "), " +
    "(" +
    "'Eaton', " +
    "'Power Defense (MCCB)', " +
    "'{}'" +
    "), " +
    "(" +
    "'Eaton', " +
    "'Series C (MCCB)', " +
    "'{}'" +
    "), " +
    "(" +
    "'ABB', " +
    "'Tmax (MCCB)', " +
    "'{}'" +
    "), " +
    "(" +
    "'Siemens', " +
    "'VL (MCCB)', " +
    "'{}'" +
    "), " +
    "(" +
    "'LSIS', " +
    "'Susol (ICCB)', " +
    "'{}'" +
    "), " +
    "(" +
    "'LSIS', " +
    "'Susol (MCCB)', " +
    "'{}'" +
    ") "
    , function (err) {
        if (err)
            console.log("Error inserting : %s ", err);
    }
);

connection.query('\
CREATE TABLE IF NOT EXISTS ' + dbConfig.database + '.' + dbConfig.quote_common_items + ' ( \
    comItemID INT UNSIGNED NOT NULL AUTO_INCREMENT, \
    itemType VARCHAR(100) NULL, \
    itemMfg VARCHAR(100) NULL, \
    itemDesc VARCHAR(100) NULL, \
    itemPN VARCHAR(100) NULL, \
    unitOfIssue VARCHAR(100) NULL, \
    catCode VARCHAR(100) NULL, \
    price DECIMAL(12,2) NULL, \
    lastUpdatedPrice DATE NULL, \
    hrsEE DECIMAL(5,2) NULL, \
    hrsME DECIMAL(5,2) NULL, \
    hrsTEST DECIMAL(5,2) NULL, \
    hrsFAB DECIMAL(5,2) NULL, \
    hrsASSY DECIMAL(5,2) NULL, \
    hrsWIRE DECIMAL(5,2) NULL, \
    PRIMARY KEY (comItemID), \
    UNIQUE INDEX itemID_UNIQUE (comItemID ASC))\
    ENGINE = InnoDB;', function(err) { if(err) throw err; });

connection.query('\
CREATE TABLE IF NOT EXISTS ' + dbConfig.database + '.' + dbConfig.quote_user_items + ' ( \
    userItemID INT UNSIGNED NOT NULL AUTO_INCREMENT, \
    quoteID INT UNSIGNED NULL, \
    itemType VARCHAR(100) NULL, \
    itemMfg VARCHAR(100) NULL, \
    itemDesc VARCHAR(100) NULL, \
    itemPN VARCHAR(100) NULL, \
    unitOfIssue VARCHAR(100) NULL, \
    catCode VARCHAR(100) NULL, \
    price DECIMAL(12,2) NULL, \
    hrsEE DECIMAL(5,2) NULL, \
    hrsME DECIMAL(5,2) NULL, \
    hrsTEST DECIMAL(5,2) NULL, \
    hrsFAB DECIMAL(5,2) NULL, \
    hrsASSY DECIMAL(5,2) NULL, \
    hrsWIRE DECIMAL(5,2) NULL, \
    PRIMARY KEY (userItemID), \
    UNIQUE INDEX itemID_UNIQUE (userItemID ASC))\
    ENGINE = InnoDB;', function(err) { if(err) throw err; });

connection.query('\
CREATE TABLE IF NOT EXISTS ' + dbConfig.database + '.' + dbConfig.quote_item_table + ' ( \
    itemSumID INT UNSIGNED NOT NULL AUTO_INCREMENT,\
    quoteID VARCHAR(100) NULL, \
    layoutNum INT UNSIGNED NULL, \
    comItemID VARCHAR(100) NULL,\
    userItemID VARCHAR(100) NULL,\
    itemQty INT UNSIGNED NULL, \
    comp VARCHAR(100) NULL,\
    secID VARCHAR(100) NULL,\
    PRIMARY KEY (itemSumID), \
    UNIQUE INDEX itemSumID_UNIQUE (itemSumID ASC))\
    ENGINE = InnoDB;', function(err) { if(err) throw err; });

connection.query('\
CREATE TABLE IF NOT EXISTS ' + dbConfig.database + '.' + dbConfig.quote_control_sum + ' ( \
    ctlSumID INT UNSIGNED NOT NULL AUTO_INCREMENT, \
    quoteID INT UNSIGNED NULL, \
    layoutNum INT UNSIGNED NULL, \
    qty INT UNSIGNED NULL, \
    FK_cktID INT UNSIGNED NULL, \
    comp VARCHAR(100), \
    secID INT UNSIGNED NULL, \
    PRIMARY KEY (ctlSumID), \
    UNIQUE INDEX ctlSumID_UNIQUE (ctlSumID ASC))\
    ENGINE = InnoDB;', function(err) { if(err) throw err; });

connection.query('\
CREATE TABLE IF NOT EXISTS ' + dbConfig.database + '.' + dbConfig.control_assemblies_table + ' ( \
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


connection.query('\
CREATE TABLE IF NOT EXISTS ' + dbConfig.database + '.' + dbConfig.control_items_table + ' ( \
    ctlItemID INT UNSIGNED NOT NULL AUTO_INCREMENT, \
    FK_cktID INT UNSIGNED NULL, \
    itemDesc VARCHAR(100) NULL, \
    itemPN VARCHAR(100) NULL, \
    unitCost DOUBLE UNSIGNED NULL, \
    qty INT UNSIGNED NULL,\
    catCode VARCHAR(100), \
    PRIMARY KEY (ctlItemID), \
    UNIQUE INDEX ctlItemID_UNIQUE (ctlItemID ASC))\
    ENGINE = InnoDB;', function(err) { if(err) throw err; });

connection.query('\
CREATE TABLE IF NOT EXISTS ' + dbConfig.database + '.' + dbConfig.quote_section_table + ' ( \
    secID INT UNSIGNED NOT NULL AUTO_INCREMENT, \
    quoteID INT UNSIGNED NULL, \
    layoutNum INT UNSIGNED NULL, \
    sectionNum VARCHAR(100) NULL, \
    compType JSON NULL, \
    controlAsmID VARCHAR(100) NULL, \
    secType VARCHAR(100) NULL, \
    secHeight INT NULL, \
    secWidth INT NULL, \
    secDepth INT NULL, \
    PRIMARY KEY (secID), \
    UNIQUE INDEX secID_UNIQUE (secID ASC))\
    ENGINE = InnoDB;', function(err) { if(err) throw err; });

connection.query('\
CREATE TABLE IF NOT EXISTS ' + dbConfig.database + '.' + dbConfig.panelboard_amp_type + '( \
    panelboardAmpTypeID INT UNSIGNED NOT NULL AUTO_INCREMENT, \
    type INT NULL, \
    min INT NULL, \
    max INT NULL, \
    PRIMARY KEY (panelboardAmpTypeID), \
    UNIQUE INDEX panelboardAmpTypeID_UNIQUE (panelboardAmpTypeID ASC))\
    ENGINE = InnoDB;', function(err) { if(err) throw err; });

connection.query("INSERT INTO " + dbConfig.database + '.' + dbConfig.panelboard_amp_type + " (type, min, max) VALUES " +
    "(" +
    "1, " +
    "0, " +
    "600" +
    "), " +
    "(" +
    "2, " +
    "601, " +
    "1200" +
    "), " +
    "(" +
    "3, " +
    "1201, " +
    "1800" +
    ")"
    , function (err) {
        if (err)
            console.log("Error inserting : %s ", err);
    }
);

connection.query('\
CREATE TABLE IF NOT EXISTS ' + dbConfig.database + '.' + dbConfig.base_panel_copper_3W + '( \
    copper3WID INT UNSIGNED NOT NULL AUTO_INCREMENT, \
    intXSize INT NULL, \
    intIN DECIMAL(5,2) NULL, \
    type1 INT NULL, \
    type2 INT NULL, \
    type3 INT NULL, \
    PRIMARY KEY (copper3WID), \
    UNIQUE INDEX copper3WID_UNIQUE (copper3WID ASC))\
    ENGINE = InnoDB;', function(err) { if(err) throw err; });

connection.query("INSERT INTO " + dbConfig.database + '.' + dbConfig.base_panel_copper_3W + " (intXSize, intIN, type1, type2, type3) VALUES " +
    "(" +
    "12, " +
    "16.5, " +
    "11, " +
    "21, " +
    "31 " +
    "), " +
    "(" +
    "24, " +
    "33, " +
    "21, " +
    "42, " +
    "62" +
    "), " +
    "(" +
    "30, " +
    "41.25, " +
    "26, " +
    "52, " +
    "78" +
    "), " +
    "(" +
    "36, " +
    "49.5, " +
    "31, " +
    "62, " +
    "93 " +
    "), " +
    "(" +
    "42, " +
    "57.75, " +
    "37, " +
    "73, " +
    "109" +
    "), " +
    "(" +
    "48, " +
    "66, " +
    "42, " +
    "83, " +
    "124" +
    ")"
    , function (err) {
        if (err)
            console.log("Error inserting : %s ", err);
    }
);

connection.query('\
CREATE TABLE IF NOT EXISTS ' + dbConfig.database + '.' + dbConfig.base_panel_copper_4W + '( \
    copper4WID INT UNSIGNED NOT NULL AUTO_INCREMENT, \
    intXSize INT NULL, \
    intIN DECIMAL(5,2) NULL, \
    type1 INT NULL, \
    type2 INT NULL, \
    type3 INT NULL, \
    PRIMARY KEY (copper4WID), \
    UNIQUE INDEX copper4WID_UNIQUE (copper4WID ASC))\
    ENGINE = InnoDB;', function(err) { if(err) throw err; });

connection.query("INSERT INTO " + dbConfig.database + '.' + dbConfig.base_panel_copper_4W + " (intXSize, intIN, type1, type2, type3) VALUES " +
    "(" +
    "12, " +
    "16.5, " +
    "14, " +
    "28, " +
    "42" +
    "), " +
    "(" +
    "24, " +
    "33, " +
    "28, " +
    "55, " +
    "83" +
    "), " +
    "(" +
    "30, " +
    "41.25, " +
    "35, " +
    "69, " +
    "104" +
    "), " +
    "(" +
    "36, " +
    "49.5, " +
    "42, " +
    "83, " +
    "124" +
    "), " +
    "(" +
    "42, " +
    "57.75, " +
    "49, " +
    "97, " +
    "145" +
    "), " +
    "(" +
    "48, " +
    "66, " +
    "55, " +
    "110, " +
    "165" +
    ")"
    , function (err) {
        if (err)
            console.log("Error inserting : %s ", err);
    }
);

connection.query('\
CREATE TABLE IF NOT EXISTS ' + dbConfig.database + '.' + dbConfig.add_Copper_Per_Panel_3WType + '( \
    addCopper3WID INT UNSIGNED NOT NULL AUTO_INCREMENT, \
    tieSpace VARCHAR(100) NULL, \
    type1 INT NULL, \
    type2 INT NULL, \
    type3 INT NULL, \
    PRIMARY KEY (addCopper3WID), \
    UNIQUE INDEX addCopper3WID_UNIQUE (addCopper3WID ASC))\
    ENGINE = InnoDB;', function(err) { if(err) throw err; });

connection.query("INSERT INTO " + dbConfig.database + '.' + dbConfig.add_Copper_Per_Panel_3WType + " (tieSpace, type1, type2, type3) VALUES " +
    "(" +
    "'4X', " +
    "4, " +
    "7, " +
    "11 " +
    "), " +
    "(" +
    "'5X', " +
    "5, " +
    "9, " +
    "13" +
    "), " +
    "(" +
    "'7X', " +
    "7, " +
    "13, " +
    "19" +
    ")"
    , function (err) {
        if (err)
            console.log("Error inserting : %s ", err);
    }
);

connection.query('\
CREATE TABLE IF NOT EXISTS ' + dbConfig.database + '.' + dbConfig.add_Copper_Per_Panel_4WType + '( \
    addCopper4WID INT UNSIGNED NOT NULL AUTO_INCREMENT, \
    tieSpace VARCHAR(100) NULL, \
    type1 INT NULL, \
    type2 INT NULL, \
    type3 INT NULL, \
    PRIMARY KEY (addCopper4WID), \
    UNIQUE INDEX addCopper4WID_UNIQUE (addCopper4WID ASC))\
    ENGINE = InnoDB;', function(err) { if(err) throw err; });

connection.query("INSERT INTO " + dbConfig.database + '.' + dbConfig.add_Copper_Per_Panel_4WType + " (tieSpace, type1, type2, type3) VALUES " +
    "(" +
    "'6X', " +
    "7, " +
    "14, " +
    "21" +
    "), " +
    "(" +
    "'9X', " +
    "11, " +
    "21, " +
    "31" +
    ")"
    , function (err) {
        if (err)
            console.log("Error inserting : %s ", err);
    }
);

connection.query('\
CREATE TABLE IF NOT EXISTS ' + dbConfig.database + '.' + dbConfig.quote_system_type + ' ( \
    systemTypeID INT UNSIGNED NOT NULL AUTO_INCREMENT, \
    systemType JSON NULL, \
    PRIMARY KEY (systemTypeID), \
    UNIQUE INDEX systemTypeID_UNIQUE (systemTypeID ASC))\
    ENGINE = InnoDB;', function(err) { if(err) throw err; });

connection.query("INSERT INTO " + dbConfig.database + '.' + dbConfig.quote_system_type + " (systemType) VALUES " +
    "(" +
    "'{" +
    "\"3W\": [\"250A 3W\", \"600A 3W\", \"800A 3W\", \"1200A 3W\", \"1600A 3W\"], " +
    "\"4W\": [\"250A 4W\", \"600A 4W\", \"800A 4W\", \"1200A 4W\", \"1600A 4W\"]" +
    "}'" +
    ")"
    , function (err) {
        if (err)
            console.log("Error inserting : %s ", err);
    }
);

connection.query('\
CREATE TABLE IF NOT EXISTS ' + dbConfig.database + '.' + dbConfig.panelboard_width_3W + ' ( \
    panelboardWidth3WID INT UNSIGNED NOT NULL AUTO_INCREMENT, \
    systemType VARCHAR(100) NULL, \
    ENCL_W VARCHAR(100) NULL, \
    maxBrk VARCHAR(100) NULL, \
    PRIMARY KEY (panelboardWidth3WID), \
    UNIQUE INDEX panelboardWidth3WID_UNIQUE (panelboardWidth3WID ASC))\
    ENGINE = InnoDB;', function(err) { if(err) throw err; });

connection.query("INSERT INTO " + dbConfig.database + '.' + dbConfig.panelboard_width_3W + " (systemType, ENCL_W, maxBrk) VALUES " +
    "(" +
    "'250A 3W', " +
    "'32\"*', " +
    "'L FRAME(400A) single'" +
    "), " +
    "(" +
    "'250A 3W', " +
    "'38\"', " +
    "'L FRAME(600A) single'" +
    "), " +
    "(" +
    "'800A 3W', " +
    "'38\"', " +
    "'P FRAME(800A)'" +
    "), " +
    "(" +
    "'1200A 3W', " +
    "'42\"', " +
    "'P FRAME(1200A)'" +
    "), " +
    "(" +
    "'1600A 3W', " +
    "'42\"', " +
    "'P FRAME(1200A)'" +
    ")"
    , function (err) {
        if (err)
            console.log("Error inserting : %s ", err);
    }
);

connection.query('\
CREATE TABLE IF NOT EXISTS ' + dbConfig.database + '.' + dbConfig.panelboard_width_4W + ' ( \
    panelboardWidth4WID INT UNSIGNED NOT NULL AUTO_INCREMENT, \
    systemType VARCHAR(100) NULL, \
    ENCL_W VARCHAR(100) NULL, \
    maxBrk VARCHAR(100) NULL, \
    PRIMARY KEY (panelboardWidth4WID), \
    UNIQUE INDEX panelboardWidth4WID_UNIQUE (panelboardWidth4WID ASC))\
    ENGINE = InnoDB;', function(err) { if(err) throw err; });

connection.query("INSERT INTO " + dbConfig.database + '.' + dbConfig.panelboard_width_4W + " (systemType, ENCL_W, maxBrk) VALUES " +
    "(" +
    "'250A 4W', " +
    "'32\"*', " +
    "'J FRAME'" +
    "), " +
    "(" +
    "'250A 4W', " +
    "'38\"', " +
    "'L FRAME(400A) double'" +
    "), " +
    "(" +
    "'800A 4W', " +
    "'38\"', " +
    "'P FRAME(800A)'" +
    "), " +
    "(" +
    "'1200A 4W', " +
    "'42\"', " +
    "'P FRAME(1200A)'" +
    "), " +
    "(" +
    "'1600A 4W', " +
    "'42\"', " +
    "'P FRAME(1200A)'" +
    ")"
    , function (err) {
        if (err)
            console.log("Error inserting : %s ", err);
    }
);

connection.query('\
CREATE TABLE IF NOT EXISTS ' + dbConfig.database + '.' + dbConfig.panelboard_sum + ' ( \
    panelboardSumID INT UNSIGNED NOT NULL AUTO_INCREMENT, \
    secID INT UNSIGNED NULL, \
    quoteID INT UNSIGNED NULL, \
    layoutNum INT UNSIGNED NULL, \
    lugQty INT UNSIGNED NULL, \
    systemType VARCHAR(100) NULL, \
    tieQty INT UNSIGNED NULL, \
    ctrlDev VARCHAR(100) NULL, \
    ctrlDevDim VARCHAR(100) NULL, \
    PRIMARY KEY (panelboardSumID), \
    UNIQUE INDEX panelboardSumID_UNIQUE (panelboardSumID ASC))\
    ENGINE = InnoDB;', function(err) { if(err) throw err; });

// MECHANICAL ENGINEERING TABLES
connection.query('\
CREATE TABLE IF NOT EXISTS ' + dbConfig.database + '.' + dbConfig.MBOM_summary_table + ' ( \
    mbomID INT UNSIGNED NOT NULL AUTO_INCREMENT, \
    jobNum VARCHAR(6) NULL, \
    releaseNum VARCHAR(10) NULL, \
    jobName VARCHAR(100) NULL, \
    customer VARCHAR(100) NULL, \
    boardDesignation VARCHAR(100) NULL, \
    numSections INT NOT NULL, \
    PRIMARY KEY (mbomID), \
    UNIQUE INDEX mbomID_UNIQUE (mbomID ASC))\
    ENGINE = InnoDB;', function(err,rows) { if(err) throw err; });

connection.query('\
CREATE TABLE IF NOT EXISTS ' + dbConfig.database + '.' + dbConfig.MBOM_common_items + ' ( \
    comItemID INT UNSIGNED NOT NULL AUTO_INCREMENT, \
    itemType VARCHAR(100) NULL, \
    itemMfg VARCHAR(100) NULL, \
    itemDesc VARCHAR(100) NULL, \
    itemPN VARCHAR(100) NULL, \
    unitOfIssue VARCHAR(100) NULL, \
    catCode VARCHAR(100) NULL, \
    status VARCHAR(100) NULL, \
    PRIMARY KEY (comItemID), \
    UNIQUE INDEX itemID_UNIQUE (comItemID ASC))\
    ENGINE = InnoDB;', function(err,rows) { if(err) throw err; });


connection.query("INSERT INTO "+dbConfig.database+"."+dbConfig.MBOM_common_items+" (itemType, itemMfg, itemDesc, itemPN, unitOfIssue, catCode) VALUES " +
    // OVERHEAD LIFT DEVICE COMMON PARTS
    "('OVERHEAD LIFTING DEVICE', 'SIEMENS', 'LIFTING YOKE/OVERHEAD LIFT', 'GOVHDLD', 'EA', '12-ACC'), " +
    // GASKETING COMMON PARTS
    "('GASKETING', 'EMKA', 'EDGE GASKETING', '1011-05', 'FT', '84-MISC'), " +
    // IR WINDOW COMMON PARTS
    "('IR WINDOW', 'IRISS', '3 IN. DIAMETER IR WINDOW', 'VPT-075', 'EA', '12-ACC'), " +
    "('IR WINDOW', 'IRISS', '4 IN. DIAMETER IR WINDOW', 'VPT-100', 'EA', '12-ACC'), " +
    // PHASE BARRIER COMMON PARTS
    "('PHASE BARRIER', 'ABB', 'PHASE BARRIER, EMAX 2.2/4.2/6.2, 2 PCS, FIXED 3P', 'ZEBPBF', 'EA', '12-ACC'), " +
    "('PHASE BARRIER', 'ABB', 'PHASE BARRIER, EMAX 2.2/4.2/6.2, 3 PCS, FIXED 4P', 'ZEBPBF-4', 'EA', '12-ACC'), " +
    "('PHASE BARRIER', 'ABB', 'PHASE BARRIER, EMAX 2.2/4.2/6.2, 2 PCS, D.O. 3P', 'ZEBPBW', 'EA', '12-ACC'), " +
    "('PHASE BARRIER', 'ABB', 'PHASE BARRIER, EMAX 2.2/4.2/6.2, 3 PCS, D.O. 4P', 'ZEBPBW-4', 'EA', '12-ACC'), " +
    // MV COMMON PARTS
    "('MV CT BUSHING', 'ZELISKO', '2000A CT BUSHINGS (MV)', 'CT BUSHING-2000', 'EA', '39-MV GEAR'), " +
    "('MV CT BUSHING', 'ZELISKO', '1200A CT BUSHINGS (MV)', 'CT BUSHING-1200', 'EA', '39-MV GEAR'), " +
    "('MV CT BUSHING', 'EATON', 'MV CT BUSHINGS', '69C7790G01', 'EA', '39-MV GEAR'), " +
    "('MV WALL BUSHING', 'LSIS', 'MV WALL BUSHINGS', '45963177005', 'EA', '39-MV GEAR'), " +
    "('MV SURGE ARRESTOR', 'ABB', '(1/3) - 15KV MV SURGE ARRESTOR', 'D0xxSA0xxADXYAA0', 'EA', '39-MV GEAR'), " +
    "('MV SURGE ARRESTOR', 'SOUTHWIRE', '(2/3) - 2AWG CABLE (PER FOOT)', '569424', 'FT', '06-WIRE'), " +
    "('MV SURGE ARRESTOR', 'PANDUIT', '(3/3) - LUG, 2AWG 0 DEGREE', 'LCA2-12-Q', 'EA', '30-LUGS'), " +
    "('MV SURGE ARRESTOR', 'PANDUIT', '(3/3) - LUG, 2AWG 90 DEGREE', 'LCA2-12F-Q', 'EA', '30-LUGS'), " +
    "('MV PT', 'LSIS', '(1/5) - VT INSULATOR', '45963177006', 'EA', '39-MV GEAR'), " +
    "('MV PT', 'LSIS', '(2/5) - MV PT TRUCK', '72313177402', 'EA', '39-MV GEAR'), " +
    "('MV PT', 'LSIS', '(3/5) - MV PT CRADLE', '84053177601', 'EA', '39-MV GEAR'), " +
    "('MV PT', 'LSIS', '(4/5) - 3 PHASE VT', 'DPExxxxxx', 'EA', '39-MV GEAR'), " +
    "('MV PT', 'EATON', '(5/5) - 5KV, 1.5A FUSE (NEED 3)', '5.5CAVHxxxE', 'EA', '27-FUSE'), " +
    "('MV PT', 'EATON', '(5/5) - 15KV, 0.5A FUSE (NEED 3)', '15.5CAVH0.5E', 'EA', '27-FUSE'), " +
    "('MV INSULATOR', 'MARBAL', 'MV INSULATOR', '6600-S104X2', 'EA', '39-MV GEAR'), " +
    // KIRK KEY COMMON PARTS
    "('KIRK KEY', 'SCHNEIDER', 'KIRK KEY PROVISION, NW', 'S48565', 'EA', '28-KIRK'), " +
    "('KIRK KEY', 'KIRK', 'SKRU - 120VAC SOLENOID', 'SKPM1-S', 'EA', '28-KIRK'), " +
    "('KIRK KEY', 'KIRK', 'SKRU - 24VDC SOLENOID', 'SKPM2-S', 'EA', '28-KIRK'), " +
    "('KIRK KEY', 'KIRK', 'CN22 KIRK KEY (NW ICCB), KEYED/STAMPED', 'KC40---105', 'EA', '28-KIRK'), " +
    "('KIRK KEY', 'KIRK', 'C900301 KIRK KEY (WL ICCB), KEYED/STAMPED', 'C900301', 'EA', '28-KIRK'), " +
    "('KIRK KEY', 'KIRK', 'END MOUNTED KIRK KEY (H/J/L FRAME), KEYED/STAMPED', 'KFN020010S', 'EA', '28-KIRK'), " +
    "('KIRK KEY', 'KIRK', 'FLAT MOUNTED KIRK KEY (P FRAME), KEYED/STAMPED', 'KFL003710S', 'EA', '28-KIRK'), " +
    // CONNECTOR KIT COMMON PARTS
    "('CONNECTOR KIT', 'ABB', 'T7 STRAP KIT (SINGLE)', 'KT7S1.38', 'EA', '02-COPPER'), " +
    "('CONNECTOR KIT', 'ABB', 'T6 STRAP KIT (SINGLE)', 'KT6S1.38', 'EA', '02-COPPER'), " +
    "('CONNECTOR KIT', 'ABB', 'T5 STRAP KIT (SINGLE)', 'KT5S1.38', 'EA', '02-COPPER'), " +
    "('CONNECTOR KIT', 'ABB', 'XT4 STRAP KIT (DUAL)', 'KX4D1.38', 'EA', '02-COPPER'), " +
    "('CONNECTOR KIT', 'ABB', 'XT3 STRAP KIT (DUAL)', 'KX3D1.38', 'EA', '02-COPPER'), " +
    "('CONNECTOR KIT', 'ABB', 'XT2 STRAP KIT (DUAL)', 'KX2D1.38', 'EA', '02-COPPER'), " +
    "('CONNECTOR KIT', 'ABB', 'XT1 STRAP KIT (DUAL)', 'KX1D1.38', 'EA', '02-COPPER'), " +
    // I LINE COVER COMMON PARTS
    "('I LINE COVER', 'SCHNEIDER', '4.5 IN. SPACE', 'HNM4BL', 'EA', '40-PANEL'), " +
    "('I LINE COVER', 'SCHNEIDER', '1.5 IN. SPACE', 'HNM1BL', 'EA', '40-PANEL'), " +
    "('I LINE COVER', 'SCHNEIDER', 'H, J-FRAME COVER LSIG LEFT', 'HLW4EBL', 'EA', '40-PANEL'), " +
    "('I LINE COVER', 'SCHNEIDER', '1.5 IN. SPACE COVER LEFT', 'HLW1BL', 'EA', '40-PANEL'), " +
    "('I LINE COVER', 'SCHNEIDER', '4.5 IN. SPACE/J-FRAME TM COVER LEFT', 'HLW4BL', 'EA', '40-PANEL'), " +
    "('I LINE COVER', 'SCHNEIDER', 'H, J-FRAME COVER LSIG RIGHT', 'HLN4EBL', 'EA', '40-PANEL'), " +
    "('I LINE COVER', 'SCHNEIDER', '1.5 IN. SPACE COVER RIGHT', 'HLN1BL', 'EA', '40-PANEL'), " +
    "('I LINE COVER', 'SCHNEIDER', '4.5 IN. SPACE/J-FRAME TM COVER RIGHT', 'HLN4BL', 'EA', '40-PANEL'), "+
    // CTS COMMON PARTS
    "('CTS', 'GE', 'CT, ITI562, 2000:5, 5 IN. WINDOW', '562-202', 'EA', '34-INS TRN'), " +
    "('CTS', 'GE', 'CT, ITI562, 2500:5, 5 IN. WINDOW', '562-252', 'EA', '34-INS TRN'), " +
    "('CTS', 'GE', 'CT, ITI562, 3000:5, 5 IN. WINDOW', '562-302', 'EA', '34-INS TRN'), " +
    "('CTS', 'GE', 'CT, ITI562, 3200:5, 5 IN. WINDOW', '562-322', 'EA', '34-INS TRN'), " +
    "('CTS', 'GE', 'CT, ITI562, 4000:5, 5 IN. WINDOW', '562-402', 'EA', '34-INS TRN'), " +
    "('CTS', 'GE', 'CT, ITI568TL, 800:5, 6 IN. WINDOW, MAIN BUS', '568TL-801', 'EA', '34-INS TRN'), " +
    "('CTS', 'GE', 'CT, ITI568TL, 1000:5, 6 IN. WINDOW, MAIN BUS', '568TL-102', 'EA', '34-INS TRN'), " +
    "('CTS', 'GE', 'CT, ITI568TL, 1200:5, 6 IN. WINDOW, MAIN BUS', '568TL-122', 'EA', '34-INS TRN'), " +
    "('CTS', 'GE', 'CT, ITI568TL, 1600:5, 6 IN. WINDOW, MAIN BUS', '568TL-162', 'EA', '34-INS TRN'), " +
    "('CTS', 'GE', 'CT, ITI568TL, 2000:5, 6 IN. WINDOW, MAIN BUS', '568TL-202', 'EA', '34-INS TRN'), " +
    "('CTS', 'GE', 'CT, ITI568TL, 2500:5, 6 IN. WINDOW, MAIN BUS', '568TL-252', 'EA', '34-INS TRN'), " +
    "('CTS', 'GE', 'CT, ITI568TL, 3000:5, 6 IN. WINDOW, MAIN BUS', '568TL-302', 'EA', '34-INS TRN'), " +
    "('CTS', 'GE', 'CT, ITI568TL, 3200:5, 6 IN. WINDOW, MAIN BUS', '568TL-322', 'EA', '34-INS TRN'), " +
    "('CTS', 'GE', 'CT, ITI568TL, 4000:5, 6 IN. WINDOW, MAIN BUS', '568TL-402', 'EA', '34-INS TRN'), " +
    "('CTS', 'GE', 'CT, ITI568TL, 5000:5, 6 IN. WINDOW, MAIN BUS', '568TL-502', 'EA', '34-INS TRN'), " +
    "('CTS', 'GE', 'CT, ITI568TS, 400:5, 6 IN. WINDOW, RUNBACKS', '568TS-401', 'EA', '34-INS TRN'), " +
    "('CTS', 'GE', 'CT, ITI568TS, 600:5, 6 IN. WINDOW, RUNBACKS', '568TS-601', 'EA', '34-INS TRN'), " +
    "('CTS', 'GE', 'CT, ITI568TS, 800:5, 6 IN. WINDOW, RUNBACKS', '568TS-801', 'EA', '34-INS TRN'), " +
    "('CTS', 'GE', 'CT, ITI568TS, 1000:5, 6 IN. WINDOW, RUNBACKS', '568TS-102', 'EA', '34-INS TRN'), " +
    "('CTS', 'GE', 'CT, ITI568TS, 1200:5, 6 IN. WINDOW, RUNBACKS', '568TS-122', 'EA', '34-INS TRN'), " +
    "('CTS', 'GE', 'CT, ITI568TS, 1600:5, 6 IN. WINDOW, RUNBACKS', '568TS-162', 'EA', '34-INS TRN'), " +
    "('CTS', 'GE', 'CT, ITI568TS, 2000:5, 6 IN. WINDOW, RUNBACKS', '568TS-202', 'EA', '34-INS TRN'), " +
    "('CTS', 'GE', 'CT, ITI568TS, 2500:5, 6 IN. WINDOW, RUNBACKS', '568TS-252', 'EA', '34-INS TRN'), " +
    "('CTS', 'GE', 'CT, ITI568TS, 3000:5, 6 IN. WINDOW, RUNBACKS', '568TS-302', 'EA', '34-INS TRN'), " +
    "('CTS', 'GE', 'CT, ITI568TS, 3200:5, 6 IN. WINDOW, RUNBACKS', '568TS-322', 'EA', '34-INS TRN'), " +
    "('CTS', 'GE', 'CT, ITI568TS, 4000:5, 6 IN. WINDOW, RUNBACKS', '568TS-402', 'EA', '34-INS TRN'), " +
    "('CTS', 'GE', 'CT, ITI568TS, 5000:5, 6 IN. WINDOW, RUNBACKS', '568TS-502', 'EA', '34-INS TRN'), " +
    "('CTS', 'GE', 'CT, ITI563, 2000:5, 5 IN. WINDOW, RELAY CLASS C50', '563-202', 'EA', '34-INS TRN'), " +
    "('CTS', 'GE', 'CT, ITI563, 2500:5, 5 IN. WINDOW, RELAY CLASS C50', '563-252', 'EA', '34-INS TRN'), " +
    "('CTS', 'GE', 'CT, ITI563, 3000:5, 5 IN. WINDOW, RELAY CLASS C20', '563-302', 'EA', '34-INS TRN'), " +
    "('CTS', 'GE', 'CT, ITI563, 3200:5, 5 IN. WINDOW, RELAY CLASS C20', '563-322', 'EA', '34-INS TRN'), " +
    "('CTS', 'GE', 'CT, ITI563, 4000:5, 5 IN. WINDOW, RELAY CLASS C20', '563-402', 'EA', '34-INS TRN'), " +
    //NCT's COMMON PARTS
    "('NCTS', 'SCHNEIDER', 'NCT, POWERPACT H, 60-100A', 'S429521', 'EA', '34-INS TRN'), " +
    "('NCTS', 'SCHNEIDER', 'NCT, POWERPACT H, 150A', 'S430562', 'EA', '34-INS TRN'), " +
    "('NCTS', 'SCHNEIDER', 'NCT, POWERPACT J, 250A', 'S430563', 'EA', '34-INS TRN'), " +
    "('NCTS', 'SCHNEIDER', 'NCT, POWERPACT L, 125-600A', 'S432575', 'EA', '34-INS TRN'), " +
    "('NCTS', 'SCHNEIDER', 'NCT LUG KIT, POWERPACT H, 8-2/0 AWG', 'AL150HD', 'EA', '30-LUGS'), " +
    "('NCTS', 'SCHNEIDER', 'NCT LUG KIT, POWERPACT, 4-4/0 AWG', 'AL175JD', 'EA', '30-LUGS'), " +
    "('NCTS', 'SCHNEIDER', 'NCT LUG KIT, POWERPACT J, 3/0 AWG-350 KCMIL', 'AL250JD', 'EA', '30-LUGS'), " +
    "('NCTS', 'SCHNEIDER', 'NCT LUG KIT, POWERPACT L, (2) 1 AWG-350 KCMIL', 'AL600LI35', 'EA', '30-LUGS'), " +
    "('NCTS', 'SCHNEIDER', 'NCT LUG KIT, POWERPACT L, (2) 4/0 AWG-500 KCMIL', 'AL600LI5', 'EA', '30-LUGS'), " +
    "('NCTS', 'SCHNEIDER', 'NCT, POWERPACT P, 250A', 'S33575', 'EA', '34-INS TRN'), " +
    "('NCTS', 'SCHNEIDER', 'NCT, POWERPACT P, 400-1600A', 'S33576', 'EA', '34-INS TRN'), " +
    "('NCTS', 'SCHNEIDER', 'NCT, MASTERPACT NW-W, 100-250A', 'S48916', 'EA', '34-INS TRN'), " +
    "('NCTS', 'SCHNEIDER', 'NCT, MASTERPACT NW-W, 400-1600A', 'S34036', 'EA', '34-INS TRN'), " +
    "('NCTS', 'SCHNEIDER', 'NCT, MASTERPACT NW-W, 2000A', 'S48896', 'EA', '34-INS TRN'), " +
    "('NCTS', 'SCHNEIDER', 'NCT, MASTERPACT NW-W, 2500-4000A', 'S48182', 'EA', '34-INS TRN'), " +
    "('NCTS', 'SCHNEIDER', 'NCT, MASTERPACT NW-Y, 2000-6000A', 'S48897', 'EA', '34-INS TRN') "
    , function (err, result) {
    if (err)
        console.log("Error inserting : %s ", err);
});

connection.query('\
CREATE TABLE IF NOT EXISTS ' + dbConfig.database + '.' + dbConfig.MBOM_user_items + ' ( \
    userItemID INT UNSIGNED NOT NULL AUTO_INCREMENT, \
    mbomID VARCHAR(100) NULL, \
    itemType VARCHAR(100) NULL, \
    itemMfg VARCHAR(100) NULL, \
    itemDesc VARCHAR(160) NULL, \
    itemPN VARCHAR(100) NULL, \
    unitOfIssue VARCHAR(100) NULL, \
    catCode VARCHAR(100) NULL, \
    PRIMARY KEY (userItemID), \
    UNIQUE INDEX itemID_UNIQUE (userItemID ASC))\
    ENGINE = InnoDB;', function(err,rows) { if(err) throw err; });

connection.query('\
CREATE TABLE IF NOT EXISTS ' + dbConfig.database + '.' + dbConfig.MBOM_item_table + ' ( \
    itemSumID INT UNSIGNED NOT NULL AUTO_INCREMENT,\
    comItemID VARCHAR(100) NULL,\
    userItemID VARCHAR(100) NULL,\
    mbomID VARCHAR(100) NULL, \
    itemQty INT UNSIGNED NULL, \
    shipLoose VARCHAR(1) NULL, \
    PRIMARY KEY (itemSumID), \
    UNIQUE INDEX itemSumID_UNIQUE (itemSumID ASC))\
    ENGINE = InnoDB;', function(err,rows) { if(err) throw err; });

connection.query('\
CREATE TABLE IF NOT EXISTS ' + dbConfig.database + '.' + dbConfig.MBOM_breaker_table + ' ( \
    idDev INT UNSIGNED NOT NULL AUTO_INCREMENT, \
    mbomID VARCHAR(100) NULL, \
    devLayout VARCHAR(100) NULL, \
    devDesignation VARCHAR(160) NULL, \
    unitOfIssue VARCHAR(100) NULL, \
    catCode VARCHAR(100) NULL, \
    brkPN VARCHAR(100) NULL, \
    cradlePN VARCHAR(100) NULL, \
    devProduct VARCHAR(100) NULL, \
    devMfg VARCHAR(100) NULL, \
    devProdLine VARCHAR(100) NULL, \
    devMount VARCHAR(100) NULL, \
    devUL VARCHAR(100) NULL, \
    devOperation VARCHAR(100) NULL, \
    devCtrlVolt VARCHAR(100) NULL, \
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
    devAcc VARCHAR(100) NULL, \
    PRIMARY KEY (idDev), \
    UNIQUE INDEX idDev_UNIQUE (idDev ASC))\
    ENGINE = InnoDB;', function(err,rows) { if(err) throw err; });

connection.query('\
CREATE TABLE IF NOT EXISTS ' + dbConfig.database + '.' + dbConfig.MBOM_brkAcc_table + ' ( \
    brkAccID INT UNSIGNED NOT NULL AUTO_INCREMENT, \
    mbomID INT NULL,\
    idDev INT NULL,\
    brkAccQty INT NULL,\
    brkAccType VARCHAR(100) NULL,\
    brkAccMfg VARCHAR(100) NULL,\
    brkAccDesc VARCHAR(160) NULL,\
    brkAccPN VARCHAR(100) NULL,\
    PRIMARY KEY (brkAccID), \
        UNIQUE INDEX brkAccID_UNIQUE (brkAccID ASC))\
        ENGINE = InnoDB;', function(err,rows) { if(err) throw err; });

connection.query('\
CREATE TABLE IF NOT EXISTS ' + dbConfig.database + '.' + dbConfig.MBOM_section_sum + ' ( \
    secID INT UNSIGNED NOT NULL AUTO_INCREMENT, \
    sectionNum VARCHAR(100) NULL, \
    mbomID VARCHAR(100) NULL, \
    idDev VARCHAR(100) NULL, \
    itemSumID VARCHAR(100) NULL, \
    PRIMARY KEY (secID), \
    UNIQUE INDEX secID_UNIQUE (secID ASC))\
    ENGINE = InnoDB;', function(err,rows) { if(err) throw err; });

connection.query('\
CREATE TABLE IF NOT EXISTS ' + dbConfig.database + '.' + dbConfig.solution_log + ' ( \
    solutionLogID INT UNSIGNED NOT NULL AUTO_INCREMENT, \
    fileName VARCHAR(100) NULL, \
    lastUpdated DATE NULL,\
    PRIMARY KEY (solutionLogID), \
    UNIQUE INDEX solutionLogID_UNIQUE (solutionLogID ASC))\
    ENGINE = InnoDB;', function(err,rows) { if(err) throw err; });

connection.query("INSERT INTO "+dbConfig.database+"."+dbConfig.solution_log+" (fileName) VALUES " +
    "('catMeme.jpg') "
    , function (err, result) {
        if (err)
            console.log("Error inserting : %s ", err);
});


console.log('Success: Schema Created!');

connection.end();
