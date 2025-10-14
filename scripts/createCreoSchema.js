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

//breakerDropdownOptions
connection.query('\
CREATE TABLE IF NOT EXISTS ' + database + '.' + dbConfig.breakerDropdown_options_table + ' ( \
    idOpt INT NOT NULL AUTO_INCREMENT, \
    platform VARCHAR(100) NOT NULL, \
    type VARCHAR(100) NOT NULL, \
    value VARCHAR(100) NULL, \
    PRIMARY KEY (idOpt), \
    UNIQUE INDEX idOpt_UNIQUE (idOpt ASC))\
    ENGINE = InnoDB;', function(err,rows) { if(err) throw err; });

// baseFrames
connection.query('\
CREATE TABLE IF NOT EXISTS ' + database + '.' + dbConfig.baseFrame_table + ' ( \
    idFrame INT NOT NULL AUTO_INCREMENT, \
    frameType VARCHAR(100) NOT NULL, \
    frameWidth INT NOT NULL, \
    frameDepth INT NOT NULL, \
    asmCsys VARCHAR(100) NOT NULL, \
    auxAsmCsys VARCHAR(100) NOT NULL, \
    partFrontRear VARCHAR(100) NOT NULL, \
    partSide VARCHAR(100) NOT NULL, \
    frameAsm VARCHAR(100) NOT NULL, \
    PRIMARY KEY (idFrame), \
    UNIQUE INDEX idFrame_UNIQUE (idFrame ASC))\
    ENGINE = InnoDB;', function(err,rows) { if(err) throw err; });


// cornerPosts
connection.query('\
CREATE TABLE IF NOT EXISTS ' + database + '.' + dbConfig.cornerPost_table + ' ( \
    idCPost INT NOT NULL AUTO_INCREMENT, \
    CPostType VARCHAR(100) NOT NULL, \
    CPostHeight DOUBLE NOT NULL, \
    CPostDepth DOUBLE NOT NULL, \
    gndCutout VARCHAR(1) NOT NULL, \
    wireCutout VARCHAR(1) NOT NULL, \
    asmCsys VARCHAR(100) NOT NULL, \
    partGeneric VARCHAR(100) NOT NULL, \
    partInstance VARCHAR(100) NOT NULL, \
    PRIMARY KEY (idCPost), \
    UNIQUE INDEX idCPost_UNIQUE (idCPost ASC))\
    ENGINE = InnoDB;', function(err,rows) { if(err) throw err; });

// brkCompartments_NW
connection.query('\
CREATE TABLE IF NOT EXISTS ' + database + '.' + dbConfig.brkCompartment_NW_table + ' ( \
    idCompICCB INT NOT NULL AUTO_INCREMENT, \
    iccbType VARCHAR(100) NOT NULL, \
    mounting VARCHAR(100) NOT NULL, \
    poles INT NOT NULL, \
    frame VARCHAR(100) NOT NULL, \
    maxAmps INT NOT NULL, \
    ul489 VARCHAR(1) NOT NULL, \
    ul1066 VARCHAR(1) NOT NULL, \
    position VARCHAR(100) NOT NULL, \
    compHeight DOUBLE NOT NULL, \
    secWidth INT NOT NULL, \
    iccbAsmPN VARCHAR(100) NOT NULL, \
    cbMountPN VARCHAR(100) NULL, \
    rabbetPN VARCHAR(100) NULL, \
    backsheetPN VARCHAR(100) NULL, \
    asmCsys VARCHAR(100) NOT NULL, \
    doorGenericPN VARCHAR(100) NULL, \
    doorInstancePN VARCHAR(100) NULL, \
    PRIMARY KEY (idCompICCB), \
    UNIQUE INDEX idCompICCB_UNIQUE (idCompICCB ASC))\
    ENGINE = InnoDB;', function(err,rows) { if(err) throw err; });



// brkCompartments_Emax2
connection.query('\
CREATE TABLE IF NOT EXISTS ' + database + '.' + dbConfig.brkCompartment_Emax2_table + ' ( \
    idCompICCB INT NOT NULL AUTO_INCREMENT, \
    iccbType VARCHAR(100) NOT NULL, \
    mounting VARCHAR(100) NOT NULL, \
    poles INT NOT NULL, \
    frame VARCHAR(100) NOT NULL, \
    maxAmps INT NOT NULL, \
    ul489 VARCHAR(1) NOT NULL, \
    ul1066 VARCHAR(1) NOT NULL, \
    position VARCHAR(100) NOT NULL, \
    compHeight DOUBLE NOT NULL, \
    secWidth INT NOT NULL, \
    iccbAsmPN VARCHAR(100) NULL, \
    cbMountPN VARCHAR(100) NULL, \
    rabbetPN VARCHAR(100) NULL, \
    backsheetPN VARCHAR(100) NULL, \
    asmCsys VARCHAR(100) NOT NULL, \
    doorGenericPN VARCHAR(100) NULL, \
    doorInstancePN VARCHAR(100) NULL, \
    PRIMARY KEY (idCompICCB), \
    UNIQUE INDEX idCompICCB_UNIQUE (idCompICCB ASC))\
    ENGINE = InnoDB;', function(err,rows) { if(err) throw err; });


// brkLugLandings
connection.query('\
CREATE TABLE IF NOT EXISTS ' + database + '.' + dbConfig.brk_lugLanding_table + ' ( \
    lugID INT NOT NULL AUTO_INCREMENT, \
    devType VARCHAR(100) NOT NULL, \
    devMfg VARCHAR(100) NOT NULL, \
    devFrame VARCHAR(100) NOT NULL, \
    frameAmp INT NOT NULL, \
    lugQty INT NOT NULL, \
    lugType VARCHAR(100) NOT NULL, \
    lugSize VARCHAR(100) NOT NULL, \
    PRIMARY KEY (lugID), \
    UNIQUE INDEX lugID_UNIQUE (lugID ASC))\
    ENGINE = InnoDB;', function(err,rows) { if(err) throw err; });


// iccbNW
connection.query('\
CREATE TABLE IF NOT EXISTS ' + database + '.' + dbConfig.brk_NW_table + ' ( \
    idICCB INT NOT NULL AUTO_INCREMENT, \
    iccbType VARCHAR(100) NOT NULL, \
    mounting VARCHAR(100) NOT NULL, \
    poles INT NOT NULL, \
    frame VARCHAR(100) NOT NULL, \
    ul489 VARCHAR(1) NOT NULL, \
    ul1066 VARCHAR(1) NOT NULL, \
    maxAmps INT NOT NULL, \
    provision VARCHAR(1) NOT NULL, \
    asmPN VARCHAR(100) NOT NULL, \
    iccbGenericPN VARCHAR(100) NOT NULL, \
    iccbInstancePN VARCHAR(100) NOT NULL, \
    compD VARCHAR(1) NOT NULL, \
    compBC VARCHAR(1) NOT NULL, \
    compC VARCHAR(1) NOT NULL, \
    compB VARCHAR(1) NOT NULL, \
    compA VARCHAR(1) NOT NULL, \
    asmCsys VARCHAR(100) NOT NULL, \
    PRIMARY KEY (idICCB), \
    UNIQUE INDEX idICCB_UNIQUE (idICCB ASC))\
    ENGINE = InnoDB;', function(err,rows) { if(err) throw err; });

// iccbEmax2
connection.query('\
CREATE TABLE IF NOT EXISTS ' + database + '.' + dbConfig.brk_Emax2_table + ' ( \
    idICCB INT NOT NULL AUTO_INCREMENT, \
    iccbType VARCHAR(100) NOT NULL, \
    mounting VARCHAR(100) NOT NULL, \
    poles INT NOT NULL, \
    frame VARCHAR(100) NOT NULL, \
    ul489 VARCHAR(1) NOT NULL, \
    ul1066 VARCHAR(1) NOT NULL, \
    maxAmps INT NOT NULL, \
    provision VARCHAR(1) NOT NULL, \
    asmPN VARCHAR(100) NOT NULL, \
    iccbGenericPN VARCHAR(100) NOT NULL, \
    iccbInstancePN VARCHAR(100) NOT NULL, \
    compD VARCHAR(1) NOT NULL, \
    compBC VARCHAR(1) NOT NULL, \
    compC VARCHAR(1) NOT NULL, \
    compB VARCHAR(1) NOT NULL, \
    compA VARCHAR(1) NOT NULL, \
    asmCsys VARCHAR(100) NOT NULL, \
    PRIMARY KEY (idICCB), \
    UNIQUE INDEX idICCB_UNIQUE (idICCB ASC))\
    ENGINE = InnoDB;', function(err,rows) { if(err) throw err; });

// mccbPowerpact
connection.query('\
CREATE TABLE IF NOT EXISTS ' + database + '.' + dbConfig.brk_powerpact_table + ' ( \
    idMCCB INT NOT NULL AUTO_INCREMENT, \
    mfgProductLine VARCHAR(100) NOT NULL, \
    cnxnType VARCHAR(100) NOT NULL, \
    cbRightFrame VARCHAR(100) NULL, \
    cbRightMaxAmps INT NULL, \
    cbLeftFrame VARCHAR(100) NULL, \
    cbLeftMaxAmps INT NULL, \
    poles INT NOT NULL, \
    panelWires INT NOT NULL, \
    unitSpaceQty INT NOT NULL, \
    unitSpace DOUBLE NOT NULL, \
    mount VARCHAR(100) NOT NULL, \
    genericAsm VARCHAR(100) NOT NULL, \
    instanceAsm VARCHAR(100) NOT NULL, \
    asmCsys VARCHAR(100) NOT NULL, \
    PRIMARY KEY (idMCCB), \
    UNIQUE INDEX idMCCB_UNIQUE (idMCCB ASC))\
    ENGINE = InnoDB;', function(err,rows) { if(err) throw err; });

// mccbTmax
connection.query('\
CREATE TABLE IF NOT EXISTS ' + database + '.' + dbConfig.brk_tmax_table + ' ( \
    idMCCB INT NOT NULL AUTO_INCREMENT, \
    mfgProductLine VARCHAR(100) NOT NULL, \
    cnxnType VARCHAR(100) NOT NULL, \
    cbRightFrame VARCHAR(100) NULL, \
    cbRightMaxAmps INT NULL, \
    cbLeftFrame VARCHAR(100) NULL, \
    cbLeftMaxAmps INT NULL, \
    poles INT NOT NULL, \
    panelWires INT NOT NULL, \
    unitSpaceQty INT NOT NULL, \
    unitSpace DOUBLE NOT NULL, \
    mount VARCHAR(100) NOT NULL, \
    genericAsm VARCHAR(100) NOT NULL, \
    instanceAsm VARCHAR(100) NOT NULL, \
    asmCsys VARCHAR(100) NOT NULL, \
    PRIMARY KEY (idMCCB), \
    UNIQUE INDEX idMCCB_UNIQUE (idMCCB ASC))\
    ENGINE = InnoDB;', function(err,rows) { if(err) throw err; });

//oneLineParts
connection.query('\
CREATE TABLE IF NOT EXISTS ' + database + '.' + dbConfig.oneLineParts_table + ' ( \
    idOneLine INT NOT NULL AUTO_INCREMENT, \
    description VARCHAR(100) NOT NULL, \
    secType VARCHAR(100) NOT NULL, \
    PN VARCHAR(100) NOT NULL, \
    asmCsys VARCHAR(100) NOT NULL, \
    devSum VARCHAR(1) NOT NULL, \
    PRIMARY KEY (idOneLine), \
    UNIQUE INDEX idOneLine_UNIQUE (idOneLine ASC))\
    ENGINE = InnoDB;', function(err,rows) { if(err) throw err; });

//standardPanels
connection.query('\
CREATE TABLE IF NOT EXISTS ' + database + '.' + dbConfig.standardPanel_table + ' ( \
    idPanel INT NOT NULL AUTO_INCREMENT, \
    unitSpacing DOUBLE NOT NULL, \
    panelType VARCHAR(100) NOT NULL, \
    poles INT NOT NULL, \
    maxAmpFull INT NOT NULL, \
    maxAmpSplit INT NOT NULL, \
    totalUnitSpace INT NOT NULL, \
    panelHeight DOUBLE NOT NULL, \
    panelFrame VARCHAR(100) NOT NULL, \
    busLam_1 VARCHAR(100) NULL, \
    busLam_2 VARCHAR(100) NULL, \
    busLam_3 VARCHAR(100) NULL, \
    panelAsm VARCHAR(100) NOT NULL, \
    PRIMARY KEY (idPanel), \
    UNIQUE INDEX idPanel_UNIQUE (idPanel ASC))\
    ENGINE = InnoDB;', function(err,rows) { if(err) throw err; });

//fillerRails
connection.query('\
CREATE TABLE IF NOT EXISTS ' + database + '.' + dbConfig.filler_rails_table + ' ( \
    idRail INT NOT NULL AUTO_INCREMENT, \
    unitSpacing DOUBLE NOT NULL, \
    secHeight DOUBLE NOT NULL, \
    sec32width VARCHAR(1) NOT NULL, \
    railAsm VARCHAR(100) NOT NULL, \
    PRIMARY KEY (idRail), \
    UNIQUE INDEX idRail_UNIQUE (idRail ASC))\
    ENGINE = InnoDB;', function(err,rows) { if(err) throw err; });

//panelFillers
connection.query('\
CREATE TABLE IF NOT EXISTS ' + database + '.' + dbConfig.panel_fillers_table + ' ( \
    idFiller INT NOT NULL AUTO_INCREMENT, \
    mfgProductLine VARCHAR(100) NOT NULL, \
    frame VARCHAR(100) NOT NULL, \
    poles INT NOT NULL, \
    panelWires INT NULL, \
    mccbRight VARCHAR(1) NOT NULL, \
    mccbLeft VARCHAR(1) NOT NULL, \
    mccbCenterRight VARCHAR(1) NOT NULL, \
    mccbCenterLeft VARCHAR(1) NOT NULL, \
    skru VARCHAR(1) NOT NULL, \
    mimicLevel INT NOT NULL, \
    fillerAsm VARCHAR(100) NOT NULL, \
    csys VARCHAR(100) NOT NULL, \
    PRIMARY KEY (idFiller), \
    UNIQUE INDEX idFiller_UNIQUE (idFiller ASC))\
    ENGINE = InnoDB;', function(err,rows) { if(err) throw err; });

//panelSupportRails
connection.query('\
CREATE TABLE IF NOT EXISTS ' + database + '.' + dbConfig.panelSupport_rails_table + ' ( \
    idSupport INT NOT NULL AUTO_INCREMENT, \
    secWidth INT NOT NULL, \
    supportAsm VARCHAR(100) NOT NULL, \
    PRIMARY KEY (idSupport), \
    UNIQUE INDEX idSupport_UNIQUE (idSupport ASC))\
    ENGINE = InnoDB;', function(err,rows) { if(err) throw err; });

//enclosureRules
connection.query('\
CREATE TABLE IF NOT EXISTS ' + database + '.' + dbConfig.panel_enclosureRules_table + ' ( \
    id INT NOT NULL AUTO_INCREMENT, \
    panelType VARCHAR(100) NOT NULL, \
    branch VARCHAR(100) NOT NULL, \
    breakerFrame VARCHAR(100) NOT NULL, \
    breakerAmp INT NOT NULL, \
    minWidth INT NOT NULL, \
    PRIMARY KEY (id), \
    UNIQUE INDEX id_UNIQUE (id ASC))\
    ENGINE = InnoDB;', function(err,rows) { if(err) throw err; });


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


console.log("createCreoSchema successful");

connection.end();
