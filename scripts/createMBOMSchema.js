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
CREATE TABLE IF NOT EXISTS ' + dbConfig.database + '.' + dbConfig.MBOM_new_section_sum + ' ( \
    secID INT UNSIGNED NOT NULL AUTO_INCREMENT, \
    sectionNum VARCHAR(100) NULL, \
    mbomID VARCHAR(100) NULL, \
    PRIMARY KEY (secID), \
    UNIQUE INDEX secID_UNIQUE (secID ASC))\
    ENGINE = InnoDB;', function(err,rows) { if(err) throw err; });

connection.query('\
ALTER TABLE ' + dbConfig.database + '.' + dbConfig.MBOM_breaker_table + ' \
    ADD COLUMN secID INT UNSIGNED NULL AFTER mbomID;', function(err,rows) { if(err) throw err; });

connection.query('\
ALTER TABLE ' + dbConfig.database + '.' + dbConfig.MBOM_item_table + ' \
    ADD COLUMN secID INT UNSIGNED NULL AFTER mbomID; ', function(err,rows) { if(err) throw err; });

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
        console.log("Error inserting : %s ", err)
});


console.log('Success: Schema Created!');
