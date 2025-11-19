const path = require('path');
const url = require('url');
const queryString = require('query-string');
const moment = require('moment');

//Excel Connection
const Excel = require('exceljs');

//DATABASE INFORMATION (TABLE NAMES)
const dbConfig = require('../config/database.js');
const database = dbConfig.database;

//Database interaction function (querySql)
//querySql takes 2 arguments, query (the sql string to be passed)
//and params (if there are ?'s in the query, these values will be inserted in their place)
//second argument params is optional, you only need to include it if you need to insert values into the string
//querySql returns the result of the sql query
const DB = require('../config/db.js');
const querySql = DB.querySql;
const Promise = require('bluebird');


// Creoson Connection (axios)
const axios = require('axios');
let creoHttp = 'http://localhost:9056/creoson';
let sessionId;
if (process.env.CREOSON_ENABLED === 'true') {
    axios.post(creoHttp, { command: 'connection', function: 'connect' })
        .then(resp => {
            sessionId = resp.data && resp.data.sessionId;
            axios.post(creoHttp, { sessionId: sessionId, command: 'creo', function: 'set_creo_version', data: { version: '3' } });
        })
        .catch(err => {
            if (err.code === 'ECONNREFUSED') console.log('> Error in slimVACController.js: Creoson server not reachable');
            else console.log('> There was an error in slimVACController.js:', err);
        });
} else {
    console.log('Creoson disabled via CREOSON_ENABLED; skipping Creoson init in slimVACController.js');
}


//IN ANY OF THESE FUNCTIONS IF YOU WANT TO DEBUG OR ANALYZE THE BEHAVIOR
//THE BEST THING TO DO IS console.log WHATEVER VARIABLE, OBJECT, ARRAY, PROPERTY, ETC. THAT YOU ARE TRYING TO STUDY


function creo(sessionId, functionData) {
    const payload = { sessionId: sessionId, command: functionData.command, function: functionData.function };
    if (functionData.data && functionData.data.length !== undefined && functionData.data.length !== 0) payload.data = functionData.data;
    return axios.post(creoHttp, payload).then(r => r.data);
}

async function regenAndSave(sessionId, filename) {
    if (filename.length != 0) {
        await creo(sessionId, {
            command: "file",
            function: "regenerate",
            data: {
                file: filename
            }
        });
        await creo(sessionId, {
            command: "file",
            function: "save",
            data: {
                file: filename
            }
        });
    }
    return null
}

async function regenSaveAndClose(sessionId, filename) {
    if (filename.length != 0) {
        await creo(sessionId, {
            command: "file",
            function: "regenerate",
            data: {
                file: filename
            }
        });
        await creo(sessionId, {
            command: "file",
            function: "save",
            data: {
                file: filename
            }
        });
        await creo(sessionId, {
            command: "file",
            function: "close_window",
            data: {
                file: filename
            }
        });
    }
    return null
}

exports = {};
module.exports = exports;

let creoWorkingDir, creoStandardLib;

async function layoutLookup(layoutData, lookupArray) {
    let layouts;
    if (lookupArray.length == 0) {
        layouts = await querySql("SELECT * FROM " + database + "." + dbConfig.layout_summary_table);
    } else {
        if (lookupArray[0] != null && lookupArray[1] != null) {
            layouts =  await querySql("SELECT * FROM " + database + "." + dbConfig.layout_summary_table+" WHERE jobNum = ? AND releaseNum = ?",[lookupArray[0], lookupArray[1]]);
        } else if (lookupArray[2] != null) {
            layouts =  await querySql("SELECT * FROM " + database + "." + dbConfig.layout_summary_table+" WHERE layoutID = ?", lookupArray[2]);
        }
    }

    for (let layout of layouts) {
        let drawnDate = moment(layout.drawnDate).utc().format("YYYY-MM-DD");
        let checkedDate = moment(layout.checkedDate).utc().format("YYYY-MM-DD");
        await layoutData.push({
            layoutID: layout.layoutID,
            jobNum: layout.jobNum,
            releaseNum: layout.releaseNum,
            jobName: layout.jobName,
            customer: layout.customer,
            layoutName: layout.layoutName,
            drawnBy: layout.drawnBy,
            drawnDate: drawnDate,
            checkedBy: layout.checkedBy,
            checkedDate: checkedDate
        });
    }
    return null
}

async function getCreoData(layoutData, creoData) {
    let jobNum = layoutData[0].jobNum;
    let releaseNum = layoutData[0].releaseNum;
    let layoutName = layoutData[0].layoutName;

    let layoutNum = releaseNum.toLowerCase().charCodeAt(0) - 96;
    let dir = await creo(sessionId, {
        command: "creo",
        function: "pwd",
        data: {}
    });
    if (dir.data == undefined) {
        await creo(sessionId, {
            command: "creo",
            function: "cd",
            data: {
                "dirname": creoWorkingDir
            }
        });
    } else {
        if (dir.data.dirname != creoWorkingDir) {
            await creo(sessionId, {
                command: "creo",
                function: "cd",
                data: {
                    "dirname": creoWorkingDir
                }
            });
        }
    }

    let creoLayoutAsm;
    let creoLayoutDrw;
    let creoOneLineAsm;
    let creoOutputDir = null;
    let creoOutputPDF;
    if (layoutNum < 10) {
        creoLayoutAsm = jobNum+'-'+'0000'+'-'+'00'+layoutNum+'.asm';
        creoOneLineAsm = jobNum+'-'+'0001'+'-'+'00'+layoutNum+'.asm';
    } else if (layoutNum < 100) {
        creoLayoutAsm = jobNum+'-'+'0000'+'-'+'0'+layoutNum+'.asm';
        creoOneLineAsm = jobNum+'-'+'0001'+'-'+'0'+layoutNum+'.asm';
    }
    creoLayoutDrw = creoLayoutAsm.slice(0,15)+'.drw';
    creoOutputPDF = creoLayoutAsm.slice(0,15)+'-'+layoutName+'.pdf';
    creoData.push({
        workingDir: creoWorkingDir,
        layoutAsm: creoLayoutAsm,
        layoutDrw: creoLayoutDrw,
        oneLineAsm: creoOneLineAsm,
        standardLib: creoStandardLib,
        outputDir: creoOutputDir,
        outputPDF: creoOutputPDF
    });

    return null
}

async function getLayoutData(layoutData, layoutDetail) {
    const layouts = await querySql("SELECT * FROM " + database + "." + dbConfig.layout_detail_table + " WHERE layoutID = ?", layoutData[0].layoutID);

    if (layouts.length != 0) {
        for (let layout of layouts) {
            layoutDetail.push({
                layoutID: layout.layoutID,
                layoutCatalogPN: layout.layoutCatalogPN,
                productFamily: layout.productFamily,
                productLine : layout.productLine,
                systemVolt: layout.systemVolt,
                currentRating: layout.currentRating,
                interruptingRating: layout.interruptingRating,
                enclosure: layout.enclosure,
                finish: layout.finish,
                accessibility: layout.accessibility,
                controlVolt: layout.controlVolt,
                numSections: layout.numSections
            });
        }
    }
    return null
}

async function getSectionData(layoutData, sectionDetail) {
    const sections = await querySql("SELECT * FROM " + database + "." + dbConfig.section_detail_table + " WHERE layoutID = ?", layoutData[0].layoutID);

    if (sections.length != 0) {
        for (let section of sections) {
            sectionDetail.push({
                secID: section.secID,
                layoutID: section.layoutID,
                sectionNum: section.sectionNum,
                sectionCatalogPN: section.sectionCatalogPN,
                productFamily: section.productFamily,
                brkMfg: section.brkMfg,
                kaRating: section.kaRating,
                mainBusRating: section.mainBusRating,
                upperComp: section.upperComp,
                upperCompAcc: section.upperCompAcc,
                lowerComp: section.lowerComp,
                lowerCompAcc: section.lowerCompAcc,
                enclosureType: section.enclosureType,
                enclosureWidth: section.enclosureWidth,
                cableEntry: section.cableEntry
            });
        }
    }
    return null
}

async function getProductPnData(productPnData) {
    const prodFamilies = await querySql("SELECT * FROM " + database + "." + dbConfig.prod_productFamily_table);
    const prodLines = await querySql("SELECT * FROM " + database + "." + dbConfig.prod_productLine_table);
    const systemVolts = await querySql("SELECT * FROM " + database + "." + dbConfig.prod_systemVoltage_MV_table);
    const currentRatings = await querySql("SELECT * FROM " + database + "." + dbConfig.prod_currentRating_table);
    const interruptRatings = await querySql("SELECT * FROM " + database + "." + dbConfig.prod_interruptingRating_MV_table);
    const enclosures = await querySql("SELECT * FROM " + database + "." + dbConfig.prod_enclosure_table);
    const finishes = await querySql("SELECT * FROM " + database + "." + dbConfig.prod_finish_table);
    const accessibilities = await querySql("SELECT * FROM " + database + "." + dbConfig.prod_accessibility_table);
    const controlVolts = await querySql("SELECT * FROM " + database + "." + dbConfig.prod_controlVoltage_table);

    productPnData.push({
        family: prodFamilies,
        prodLine: prodLines,
        systemVolt: systemVolts,
        currentRating: currentRatings,
        interruptingRating: interruptRatings,
        enclosure: enclosures,
        finish: finishes,
        accessibility: accessibilities,
        controlVolt: controlVolts
    });

    return null
}

async function assembleLayoutPN(layoutDetail) {
    const prodFamily = await querySql("SELECT code FROM " + database + "." + dbConfig.prod_productFamily_table + " WHERE description = ?", layoutDetail.productFamily);
    const prodLine = await querySql("SELECT code FROM " + database + "." + dbConfig.prod_productLine_table + " WHERE description = ?", layoutDetail.productLine);
    const systemVolt = await querySql("SELECT code FROM " + database + "." + dbConfig.prod_systemVoltage_MV_table + " WHERE description = ?", layoutDetail.systemVolt);
    const currentRating = await querySql("SELECT code FROM " + database + "." + dbConfig.prod_currentRating_table + " WHERE description = ?", layoutDetail.currentRating);
    const interruptRating = await querySql("SELECT code FROM " + database + "." + dbConfig.prod_interruptingRating_MV_table + " WHERE description = ?", layoutDetail.interruptingRating);
    const enclosure = await querySql("SELECT code FROM " + database + "." + dbConfig.prod_enclosure_table + " WHERE description = ?", layoutDetail.enclosure);
    const finish = await querySql("SELECT code FROM " + database + "." + dbConfig.prod_finish_table + " WHERE description = ?", layoutDetail.finish);
    const accessibility = await querySql("SELECT code FROM " + database + "." + dbConfig.prod_accessibility_table + " WHERE description = ?", layoutDetail.accessibility);
    const controlVolt = await querySql("SELECT code FROM " + database + "." + dbConfig.prod_controlVoltage_table + " WHERE description = ?", layoutDetail.controlVolt);

    return 'P'+prodFamily[0].code + prodLine[0].code + systemVolt[0].code +currentRating[0].code + interruptRating[0].code + enclosure[0].code + finish[0].code + accessibility[0].code + controlVolt[0].code;
}

async function disassembleLayoutPN(layoutCatalogPN) {
    let prodFamilyCode = layoutCatalogPN.slice(1,3);
    let prodLineCode = layoutCatalogPN.slice(3,4);
    let systemVoltCode = layoutCatalogPN.slice(4,6);
    let currentRatingCode = layoutCatalogPN.slice(6,8);
    let interruptingRatingCode = layoutCatalogPN.slice(8,9);
    let enclosureCode = layoutCatalogPN.slice(9,10);
    let finishCode = layoutCatalogPN.slice(10,11);
    let accessibilityCode = layoutCatalogPN.slice(11,12);
    let controlVoltCode = layoutCatalogPN.slice(12,13);


    const prodFamily = await querySql("SELECT description FROM " + database + "." + dbConfig.prod_productFamily_table + " WHERE code = ?", prodFamilyCode);
    const prodLine = await querySql("SELECT description FROM " + database + "." + dbConfig.prod_productLine_table + " WHERE code = ?", prodLineCode);
    const systemVolt = await querySql("SELECT description FROM " + database + "." + dbConfig.prod_systemVoltage_MV_table + " WHERE code = ?", systemVoltCode);
    const currentRating = await querySql("SELECT description FROM " + database + "." + dbConfig.prod_currentRating_table + " WHERE code = ?", currentRatingCode);
    const interruptRating = await querySql("SELECT description FROM " + database + "." + dbConfig.prod_interruptingRating_MV_table + " WHERE code = ?", interruptingRatingCode);
    const enclosure = await querySql("SELECT description FROM " + database + "." + dbConfig.prod_enclosure_table + " WHERE code = ?", enclosureCode);
    const finish = await querySql("SELECT description FROM " + database + "." + dbConfig.prod_finish_table + " WHERE code = ?", finishCode);
    const accessibility = await querySql("SELECT description FROM " + database + "." + dbConfig.prod_accessibility_table + " WHERE code = ?", accessibilityCode);
    const controlVolt = await querySql("SELECT description FROM " + database + "." + dbConfig.prod_controlVoltage_table + " WHERE code = ?", controlVoltCode);

    return {
        layoutCatalogPN: layoutCatalogPN,
        productFamily: prodFamily[0].description,
        productLine : prodLine[0].description,
        systemVolt: systemVolt[0].description,
        currentRating: currentRating[0].description,
        interruptingRating: interruptRating[0].description,
        enclosure: enclosure[0].description,
        finish: finish[0].description,
        accessibility: accessibility[0].description,
        controlVolt: controlVolt[0].description
    }

}

async function getSlimvacSectionPnData(slimvacSecPnData) {
    const secFamilies = await querySql("SELECT * FROM " + database + "." + dbConfig.secSV_productLine_table);
    const secBrkMfgs = await querySql("SELECT * FROM " + database + "." + dbConfig.secSV_brkMfg_table);
    const secKaRatings = await querySql("SELECT * FROM " + database + "." + dbConfig.secSV_kaRating_table);
    const secMainBusRatings = await querySql("SELECT * FROM " + database + "." + dbConfig.secSV_mainBusRating_table);
    const secUpperComps = await querySql("SELECT * FROM " + database + "." + dbConfig.secSV_upperComp_table);
    const secUpperCompAccs = await querySql("SELECT * FROM " + database + "." + dbConfig.secSV_upperCompAcc_table);
    const secLowerComps = await querySql("SELECT * FROM " + database + "." + dbConfig.secSV_lowerComp_table);
    const secLowerCompAccs = await querySql("SELECT * FROM " + database + "." + dbConfig.secSV_lowerCompAcc_table);
    const secEnclosureWidths = await querySql("SELECT * FROM " + database + "." + dbConfig.secSV_enclosureWidth_table);
    const secEnclosureTypes = await querySql("SELECT * FROM " + database + "." + dbConfig.secSV_enclosureType_table);
    const secCableEntries = await querySql("SELECT * FROM " + database + "." + dbConfig.secSV_cableEntry_table);

    slimvacSecPnData.push({
        family: secFamilies,
        brkMfg: secBrkMfgs,
        kaRating: secKaRatings,
        mainBusRating: secMainBusRatings,
        upperComp: secUpperComps,
        upperCompAcc: secUpperCompAccs,
        lowerComp: secLowerComps,
        lowerCompAcc: secLowerCompAccs,
        enclosureWidth: secEnclosureWidths,
        enclosureType: secEnclosureTypes,
        cableEntry: secCableEntries
    });

    return null;

}

async function assembleSectionPN(sectionDetail) {
    const prodFamily = await querySql("SELECT code FROM " + database + "." + dbConfig.secSV_productLine_table + " WHERE description = ?", sectionDetail.productFamily);
    const brkMfg = await querySql("SELECT code FROM " + database + "." + dbConfig.secSV_brkMfg_table + " WHERE description = ?", sectionDetail.brkMfg);
    const kaRating = await querySql("SELECT code FROM " + database + "." + dbConfig.secSV_kaRating_table + " WHERE description = ?", sectionDetail.kaRating);
    const mainBusRating = await querySql("SELECT code FROM " + database + "." + dbConfig.secSV_mainBusRating_table + " WHERE description = ?", sectionDetail.mainBusRating);
    const upperComp = await querySql("SELECT code FROM " + database + "." + dbConfig.secSV_upperComp_table + " WHERE description = ?", sectionDetail.upperComp);
    const upperCompAcc = await querySql("SELECT code FROM " + database + "." + dbConfig.secSV_upperCompAcc_table + " WHERE description = ?", sectionDetail.upperCompAcc);
    const lowerComp = await querySql("SELECT code FROM " + database + "." + dbConfig.secSV_lowerComp_table + " WHERE description = ?", sectionDetail.lowerComp);
    const lowerCompAcc = await querySql("SELECT code FROM " + database + "." + dbConfig.secSV_lowerCompAcc_table + " WHERE description = ?", sectionDetail.lowerCompAcc);
    const enclosureType = await querySql("SELECT code FROM " + database + "." + dbConfig.secSV_enclosureType_table + " WHERE description = ?", sectionDetail.enclosureType);
    const enclosureWidth = await querySql("SELECT code FROM " + database + "." + dbConfig.secSV_enclosureWidth_table + " WHERE description = ?", sectionDetail.enclosureWidth);
    const cableEntry = await querySql("SELECT code FROM " + database + "." + dbConfig.secSV_cableEntry_table + " WHERE description = ?", sectionDetail.cableEntry);


    return 'S'+prodFamily[0].code + brkMfg[0].code + kaRating[0].code +mainBusRating[0].code + upperComp[0].code + upperCompAcc[0].code + lowerComp[0].code + lowerCompAcc[0].code + enclosureType[0].code + enclosureWidth[0].code + cableEntry[0].code;

}

async function disassembleSectionPN(sectionCatalogPN) {
    let productFamilyCode = sectionCatalogPN.slice(1,3);
    let brkMfgCode = sectionCatalogPN.slice(3,4);
    let kaRatingCode = sectionCatalogPN.slice(4,5);
    let mainBusRatingCode = sectionCatalogPN.slice(5,7);
    let upperCompCode = sectionCatalogPN.slice(7,8);
    let upperCompAccCode = sectionCatalogPN.slice(8,9);
    let lowerCompCode = sectionCatalogPN.slice(9,10);
    let lowerCompAccCode = sectionCatalogPN.slice(10,11);
    let enclosureTypeCode = sectionCatalogPN.slice(11,12);
    let enclosureWidthCode = sectionCatalogPN.slice(12,14);
    let cableEntryCode = sectionCatalogPN.slice(14,15);

    const productFamily = await querySql("SELECT description FROM " + database + "." + dbConfig.secSV_productLine_table + " WHERE code = ?", productFamilyCode);
    const brkMfg = await querySql("SELECT description FROM " + database + "." + dbConfig.secSV_brkMfg_table + " WHERE code = ?", brkMfgCode);
    const kaRating = await querySql("SELECT description FROM " + database + "." + dbConfig.secSV_kaRating_table + " WHERE code = ?", kaRatingCode);
    const mainBusRating = await querySql("SELECT description FROM " + database + "." + dbConfig.secSV_mainBusRating_table + " WHERE code = ?", mainBusRatingCode);
    const upperComp = await querySql("SELECT description FROM " + database + "." + dbConfig.secSV_upperComp_table + " WHERE code = ?", upperCompCode);
    const upperCompAcc = await querySql("SELECT description FROM " + database + "." + dbConfig.secSV_upperCompAcc_table + " WHERE code = ?", upperCompAccCode);
    const lowerComp = await querySql("SELECT description FROM " + database + "." + dbConfig.secSV_lowerComp_table + " WHERE code = ?", lowerCompCode);
    const lowerCompAcc = await querySql("SELECT description FROM " + database + "." + dbConfig.secSV_lowerCompAcc_table + " WHERE code = ?", lowerCompAccCode);
    const enclosureType = await querySql("SELECT description FROM " + database + "." + dbConfig.secSV_enclosureType_table + " WHERE code = ?", enclosureTypeCode);
    const enclosureWidth = await querySql("SELECT description FROM " + database + "." + dbConfig.secSV_enclosureWidth_table + " WHERE code = ?", enclosureWidthCode);
    const cableEntry = await querySql("SELECT description FROM " + database + "." + dbConfig.secSV_cableEntry_table + " WHERE code = ?", cableEntryCode);

    return {
        sectionCatalogPN: sectionCatalogPN,
        productFamily: productFamily[0].description,
        brkMfg: brkMfg[0].description,
        kaRating: kaRating[0].description,
        mainBusRating: mainBusRating[0].description,
        upperComp: upperComp[0].description,
        upperCompAcc: upperCompAcc[0].description,
        lowerComp: lowerComp[0].description,
        lowerCompAcc: lowerCompAcc[0].description,
        enclosureType: enclosureType[0].description,
        enclosureWidth: enclosureWidth[0].description,
        cableEntry: cableEntry[0].description,

    }

}

exports.slimVAC = function(req, res) {
    let layoutData = [];
    querySql("SELECT * FROM " + database + "." + dbConfig.layout_summary_table)
        .then(async function(layouts) {
            for (let layout of layouts) {
                let drawnDate = moment(layout.drawnDate).utc().format("YYYY-MM-DD");
                let checkedDate = moment(layout.checkedDate).utc().format("YYYY-MM-DD");
                await layoutData.push({
                    layoutID: layout.layoutID,
                    jobNum: layout.jobNum,
                    releaseNum: layout.releaseNum,
                    jobName: layout.jobName,
                    customer: layout.customer,
                    layoutName: layout.layoutName,
                    drawnBy: layout.drawnBy,
                    drawnDate: drawnDate,
                    checkedBy: layout.checkedBy,
                    checkedDate: checkedDate
                });
            }
            return null
        })
        .then(() => {
            res.locals.title = 'SlimVAC';
            res.render('SlimVAC/slimVAC', {
                message: null,
                newLayoutData: null,
                layoutData: layoutData
            });
        })
        .catch(err => {
            console.log(err);
        });
};

exports.createLayout = function(req, res) {
    let layoutDataMain = [];
    let layoutData = [];
    let newLayoutData = {
        jobNum: req.body.jobNum,
        releaseNum: req.body.releaseNum,
        jobName: req.body.jobName,
        customer: req.body.customer,
        layoutName: req.body.layoutName,
        drawnBy: req.body.drawnBy,
        drawnDate: req.body.drawnDate,
        checkedBy: req.body.checkedBy,
        checkedDate: req.body.checkedDate
    };

    async function createLayout(layoutData) {
        return await querySql("INSERT INTO " + database + "." + dbConfig.layout_summary_table + " SET ?", layoutData);
    }
    async function createRev(revData) {
        return await querySql("INSERT INTO " + database + "." + dbConfig.layout_rev_table + " SET ?", revData);
    }

    layoutLookup(layoutData,[])
        .then(async function() {
            let existingLayoutID = null;
            for (let layout of layoutData) {
                layoutDataMain.push({
                    layoutID: layout.layoutID,
                    jobNum: layout.jobNum,
                    releaseNum: layout.releaseNum,
                    jobName: layout.jobName,
                    customer: layout.customer,
                    layoutName: layout.layoutName,
                    drawnBy: layout.drawnBy,
                    drawnDate: layout.drawnDate,
                    checkedBy: layout.checkedBy,
                    checkedDate: layout.checkedDate
                });
                if (layout.jobNum == newLayoutData.jobNum && layout.releaseNum == newLayoutData.releaseNum) {
                    existingLayoutID = layout.subID;
                }
            }
            if (existingLayoutID != null) {
                res.locals.title = 'SlimVAC';
                res.render('SlimVAC/slimVAC', {
                    message: "Layout already exists for "+newLayoutData.jobNum+newLayoutData.releaseNum,
                    newLayoutData: newLayoutData,
                    layoutData: layoutDataMain
                });
            } else {
                await createLayout(newLayoutData);
                let layouts = [];
                await layoutLookup(layouts,[newLayoutData.jobNum, newLayoutData.releaseNum, null]);
                let layoutID = layouts[0].layoutID;
               /* let newRevData = {
                    layoutID: layoutID,
                    revNum: 'S00',
                    revNote: req.body.revNote
                };
                await createRev(newRevData);*/
                res.locals.title = 'SlimVAC';
                res.redirect('../searchLayout/?layoutID='+newLayoutData.jobNum+newLayoutData.releaseNum+"_"+layoutID);
            }
        })
        .catch(err => {
            console.log(err);
        })
};

//Set Working Directory POST request
exports.setWD = function(req, res) {
    let urlObj = url.parse(req.originalUrl);
    urlObj.protocol = req.protocol;
    urlObj.host = req.get('host');
    let qs = queryString.parse(urlObj.search);
    let jobRelease = qs.layoutID.split('_')[0];
    let layoutID = qs.layoutID.split('_')[1];
    //let message = null;
    let layoutAsm = req.body.layoutAsm;
    let oneLineAsm = req.body.oneLineAsm;
    let layoutDrw = req.body.layoutDrw;
    let outputPDF = req.body.outputPDF;

    creoWorkingDir = req.body.workingDir;
    //let outputDir = workingDir + '/_outputDir';
    creoStandardLib = req.body.standardLib;

    async function cdAndCreateOutputDir() {
        let dir = await creo(sessionId, {
            command: "creo",
            function: "pwd",
            data: {}
        });

        if (dir.data != undefined) {
            if (dir.data.dirname != creoWorkingDir) {
                await creo(sessionId, {
                    command: "creo",
                    function: "cd",
                    data: {
                        "dirname": creoWorkingDir
                    }
                });
            }
        }
        return null
    }

    cdAndCreateOutputDir()
        .then(() => {
            res.locals.title = 'SlimVAC';
            res.redirect('../searchLayout/?layoutID='+jobRelease+"_"+layoutID);
            return null;
        })
        .catch(err => {
            return Promise.reject(err);
        });
};

exports.searchLayout = function(req, res) {
    let urlObj = url.parse(req.originalUrl);
    urlObj.protocol = req.protocol;
    urlObj.host = req.get('host');
    let qs = queryString.parse(urlObj.search);
    let layoutID = qs.layoutID.split('_')[1];
    let layoutData = [];
    //let revData = [];
    let creoData = [];
    let layoutDetail = [];
    let sectionDetail = [];
    let productPnOpts = [];
    let slimvacSecPnOpts = [];
    layoutLookup(layoutData, [null, null, layoutID])
        .then(async function() {
            await getCreoData(layoutData, creoData);
            await getLayoutData(layoutData, layoutDetail);
            await getSectionData(layoutData, sectionDetail);
            await getProductPnData(productPnOpts);
            await getSlimvacSectionPnData(slimvacSecPnOpts);
            return null
        })
        .then(() => {
            res.locals.title = 'SlimVAC';
            res.render('SlimVAC/searchLayout', {
                message: null,
                layoutData: layoutData,
                creoData: creoData,
                layoutDetail: layoutDetail,
                sectionDetail: sectionDetail,
                productPnOpts: productPnOpts[0],
                slimvacSecPnOpts: slimvacSecPnOpts[0],
                reverseEngineerLayoutDetail: [],
                reverseEngineerSectionDetail: [],
                editSecData: [],
                currentSlide: 1
            })
        })
        .catch((err) => {
            return Promise.reject(err);
        });

};

exports.editLayoutData = function(req, res) {
    let urlObj = url.parse(req.originalUrl);
    urlObj.protocol = req.protocol;
    urlObj.host = req.get('host');
    let qs = queryString.parse(urlObj.search);
    let jobNumReleaseNum = qs.layoutID.split('_')[0];
    let layoutID = qs.layoutID.split('_')[1];

    let newLayoutData = {
        jobName: req.body.jobName,
        customer: req.body.customer,
        layoutName: req.body.layoutName,
        drawnBy: req.body.drawnBy,
        drawnDate: req.body.drawnDate,
        checkedBy: req.body.checkedBy,
        checkedDate: req.body.checkedDate
    };

    async function editLayout(layoutData) {
        return await querySql("UPDATE " + database + "." + dbConfig.layout_summary_table + " SET ? WHERE layoutID = ?", [layoutData, layoutID]);
    }

    editLayout(newLayoutData)
        .then(() => {
            res.redirect('../searchLayout/?layoutID='+jobNumReleaseNum+"_"+layoutID);
        })
        .catch(err => {
            console.log(err);
        });
};

exports.reverseEngineerLayoutDetail = function(req, res) {
    let urlObj = url.parse(req.originalUrl);
    urlObj.protocol = req.protocol;
    urlObj.host = req.get('host');
    let qs = queryString.parse(urlObj.search);
    let jobNumReleaseNum = qs.layoutID.split('_')[0];
    let layoutID = qs.layoutID.split('_')[1];
    let layoutData = [];
    //let revData = [];
    let creoData = [];
    let layoutDetail = [];
    let sectionDetail = [];
    let productPnOpts = [];
    let slimvacSecPnOpts = [];
    let reverseEngineerLayoutDetail = [];
    let layoutCatalogPN = req.body.layoutCatalogPN;

    disassembleLayoutPN(layoutCatalogPN)
        .then((revEngineerLayout) => {
            reverseEngineerLayoutDetail.push(revEngineerLayout);
        })
        .then(async function () {
            await layoutLookup(layoutData, [null, null, layoutID]);
            await getCreoData(layoutData, creoData);
            await getLayoutData(layoutData, layoutDetail);
            await getSectionData(layoutData, sectionDetail);
            await getProductPnData(productPnOpts);
            await getSlimvacSectionPnData(slimvacSecPnOpts);
            return null
        })
        .then(() => {
            res.locals.title = 'SlimVAC';
            res.render('SlimVAC/searchLayout', {
                message: null,
                layoutData: layoutData,
                creoData: creoData,
                layoutDetail: layoutDetail,
                sectionDetail: sectionDetail,
                productPnOpts: productPnOpts[0],
                slimvacSecPnOpts: slimvacSecPnOpts[0],
                reverseEngineerLayoutDetail: reverseEngineerLayoutDetail,
                reverseEngineerSectionDetail: [],
                editSecData: [],
                currentSlide: 1
            })
        })
        .catch((err) => {
            return Promise.reject(err);
        });

};

exports.addLayoutDetail = function(req, res) {
    let urlObj = url.parse(req.originalUrl);
    urlObj.protocol = req.protocol;
    urlObj.host = req.get('host');
    let qs = queryString.parse(urlObj.search);
    let jobNumReleaseNum = qs.layoutID.split('_')[0];
    let layoutID = qs.layoutID.split('_')[1];

    let layoutDetailForm = {
        productFamily: req.body.productFamily,
        productLine : req.body.productLine,
        systemVolt: req.body.systemVolt,
        currentRating: req.body.currentRating,
        interruptingRating: req.body.interruptingRating,
        enclosure: req.body.enclosure,
        finish: req.body.finish,
        accessibility: req.body.accessibility,
        controlVolt: req.body.controlVolt
    };

    assembleLayoutPN(layoutDetailForm)
        .then(async function(layoutCatalogPN) {
            let layoutDetail = {
                layoutID: layoutID,
                layoutCatalogPN: layoutCatalogPN,
                productFamily: layoutDetailForm.productFamily,
                productLine: layoutDetailForm.productLine,
                systemVolt: layoutDetailForm.systemVolt,
                currentRating: layoutDetailForm.currentRating,
                interruptingRating: layoutDetailForm.interruptingRating,
                enclosure: layoutDetailForm.enclosure,
                finish: layoutDetailForm.finish,
                accessibility: layoutDetailForm.accessibility,
                controlVolt: layoutDetailForm.controlVolt,
                numSections: 0
            };
            await querySql("INSERT INTO " + database + "." + dbConfig.layout_detail_table + " SET ?", layoutDetail);
            return null
        })
        .then(() => {
            res.locals.title = 'SlimVAC';
            res.redirect('../searchLayout/?layoutID='+jobNumReleaseNum+"_"+layoutID);
        })
        .catch((err) => {
            return Promise.reject(err);
        });
};

exports.editLayoutDetail = function(req, res) {
    let urlObj = url.parse(req.originalUrl);
    urlObj.protocol = req.protocol;
    urlObj.host = req.get('host');
    let qs = queryString.parse(urlObj.search);
    let jobNumReleaseNum = qs.layoutID.split('_')[0];
    let layoutID = qs.layoutID.split('_')[1];

    let editLayoutDetailForm = {
        productFamily: req.body.productFamily,
        productLine : req.body.productLine,
        systemVolt: req.body.systemVolt,
        currentRating: req.body.currentRating,
        interruptingRating: req.body.interruptingRating,
        enclosure: req.body.enclosure,
        finish: req.body.finish,
        accessibility: req.body.accessibility,
        controlVolt: req.body.controlVolt
    };

    assembleLayoutPN(editLayoutDetailForm)
        .then(async function(layoutCatalogPN) {
            let editLayoutDetail = {
                layoutCatalogPN: layoutCatalogPN,
                productFamily: editLayoutDetailForm.productFamily,
                productLine: editLayoutDetailForm.productLine,
                systemVolt: editLayoutDetailForm.systemVolt,
                currentRating: editLayoutDetailForm.currentRating,
                interruptingRating: editLayoutDetailForm.interruptingRating,
                enclosure: editLayoutDetailForm.enclosure,
                finish: editLayoutDetailForm.finish,
                accessibility: editLayoutDetailForm.accessibility,
                controlVolt: editLayoutDetailForm.controlVolt,
            };
            await querySql("UPDATE " + database + "." + dbConfig.layout_detail_table + " SET ?", editLayoutDetail);
            return null
        })
        .then(() => {
            res.locals.title = 'SlimVAC';
            res.redirect('../searchLayout/?layoutID='+jobNumReleaseNum+"_"+layoutID);
        })
        .catch((err) => {
            return Promise.reject(err);
        });

};

exports.reverseEngineerSectionDetail = function(req, res) {
    let urlObj = url.parse(req.originalUrl);
    urlObj.protocol = req.protocol;
    urlObj.host = req.get('host');
    let qs = queryString.parse(urlObj.search);
    let jobNumReleaseNum = qs.layoutID.split('_')[0];
    let layoutID = qs.layoutID.split('_')[1];
    let layoutData = [];
    //let revData = [];
    let creoData = [];
    let layoutDetail = [];
    let sectionDetail = [];
    let productPnOpts = [];
    let slimvacSecPnOpts = [];
    let reverseEngineerSectionDetail = [];
    let sectionCatalogPN = req.body.sectionCatalogPN;

    disassembleSectionPN(sectionCatalogPN)
        .then((revEngineerSection) => {
           reverseEngineerSectionDetail.push(revEngineerSection)
        })
        .then(async function () {
            await layoutLookup(layoutData, [null, null, layoutID]);
            await getCreoData(layoutData, creoData);
            await getLayoutData(layoutData, layoutDetail);
            await getSectionData(layoutData, sectionDetail);
            await getProductPnData(productPnOpts);
            await getSlimvacSectionPnData(slimvacSecPnOpts);
            return null
        })
        .then(() => {
            res.locals.title = 'SlimVAC';
            res.render('SlimVAC/searchLayout', {
                message: null,
                layoutData: layoutData,
                creoData: creoData,
                layoutDetail: layoutDetail,
                sectionDetail: sectionDetail,
                productPnOpts: productPnOpts[0],
                slimvacSecPnOpts: slimvacSecPnOpts[0],
                reverseEngineerLayoutDetail: [],
                reverseEngineerSectionDetail: reverseEngineerSectionDetail,
                editSecData: [],
                currentSlide: 1
            })
        })
        .catch((err) => {
            return Promise.reject(err);
        });
};

exports.addSectionDetail = function(req, res) {
    let urlObj = url.parse(req.originalUrl);
    urlObj.protocol = req.protocol;
    urlObj.host = req.get('host');
    let qs = queryString.parse(urlObj.search);
    let jobNumReleaseNum = qs.layoutID.split('_')[0];
    let layoutID = qs.layoutID.split('_')[1];
    let secData = [];
    let layoutData = [];

    let sectionDetailForm = {
        productFamily: req.body.productFamily_sec,
        brkMfg: req.body.brkMfg,
        kaRating: req.body.kaRating,
        mainBusRating: req.body.mainBusRating,
        upperComp: req.body.upperComp,
        upperCompAcc: req.body.upperCompAcc,
        lowerComp: req.body.lowerComp,
        lowerCompAcc: req.body.lowerCompAcc,
        enclosureWidth: req.body.enclosureWidth,
        enclosureType: req.body.enclosureType,
        cableEntry: req.body.cableEntry
    };

    layoutLookup(layoutData, [null, null, layoutID])
        .then(async function() {
            await getSectionData(layoutData, secData);
            return await assembleSectionPN(sectionDetailForm);
        })
        .then(async function(sectionCatalogPN) {
            let sectionDetail = {
                layoutID: layoutID,
                sectionNum: secData.length + 1,
                sectionCatalogPN: sectionCatalogPN,
                productFamily: sectionDetailForm.productFamily,
                brkMfg: sectionDetailForm.brkMfg,
                kaRating: sectionDetailForm.kaRating,
                mainBusRating: sectionDetailForm.mainBusRating,
                upperComp: sectionDetailForm.upperComp,
                upperCompAcc: sectionDetailForm.upperCompAcc,
                lowerComp: sectionDetailForm.lowerComp,
                lowerCompAcc: sectionDetailForm.lowerCompAcc,
                enclosureWidth: sectionDetailForm.enclosureWidth,
                enclosureType: sectionDetailForm.enclosureType,
                cableEntry: sectionDetailForm.cableEntry
            };
            await querySql("INSERT INTO " + database + "." + dbConfig.section_detail_table + " SET ?", sectionDetail);
            return null
        })
        .then(async function() {
            const layoutDetail = await querySql("SELECT * FROM " + database + "." + dbConfig.layout_detail_table + " WHERE layoutID = ?", layoutID);
            return layoutDetail[0].numSections + 1;
        })
        .then(async function(newNumSections) {
            await querySql("UPDATE " + database + "." + dbConfig.layout_detail_table + " SET numSections = ? WHERE layoutID = ?",[newNumSections, layoutID]);
            return null
        })
        .then(() => {
            res.locals.title = 'SlimVAC';
            res.redirect('../searchLayout/?layoutID='+jobNumReleaseNum+"_"+layoutID);
        })
        .catch((err) => {
            return Promise.reject(err);
        });
};

exports.editSectionDetail = function(req, res) {
    let urlObj = url.parse(req.originalUrl);
    urlObj.protocol = req.protocol;
    urlObj.host = req.get('host');
    let qs = queryString.parse(urlObj.search);
    let jobNumReleaseNum = qs.layoutID.split('_')[0];
    let layoutID = qs.layoutID.split('_')[1];
    let secID = qs.secID;
    let creoData = [];
    let secData = [];
    let editSecData = [];
    let layoutData = [];
    let layoutDetail = [];
    let productPnOpts = [];
    let slimvacSecPnOpts = [];

    layoutLookup(layoutData, [null, null, layoutID])
        .then(async function() {
            await getCreoData(layoutData,creoData);
            await getLayoutData(layoutData,layoutDetail);
            await getSectionData(layoutData, secData);
            await getProductPnData(productPnOpts);
            await getSlimvacSectionPnData(slimvacSecPnOpts);
            return null
        })
        .then(async function() {
            for(let section of secData) {
                if (section.secID == secID) {
                    editSecData.push(section);
                }
            }
            return null
        })
        .then(() => {
            res.locals.title = 'Submittal';
            res.render('SlimVAC/searchLayout', {
                message: null,
                layoutData: layoutData,
                creoData: creoData,
                layoutDetail: layoutDetail,
                sectionDetail: secData,
                productPnOpts: productPnOpts[0],
                slimvacSecPnOpts: slimvacSecPnOpts[0],
                reverseEngineerLayoutDetail: [],
                reverseEngineerSectionDetail: [],
                editSecData: editSecData,
                currentSlide: 1
            })
        })
        .catch((err) => {
            return Promise.reject(err);
        });
};

exports.saveSectionDetail = function(req, res) {
    let urlObj = url.parse(req.originalUrl);
    urlObj.protocol = req.protocol;
    urlObj.host = req.get('host');
    let qs = queryString.parse(urlObj.search);
    let jobNumReleaseNum = qs.layoutID.split('_')[0];
    let layoutID = qs.layoutID.split('_')[1];
    let secID = qs.secID;

    let sectionDetailForm = {
        productFamily: req.body.productFamily_sec,
        brkMfg: req.body.brkMfg,
        kaRating: req.body.kaRating,
        mainBusRating: req.body.mainBusRating,
        upperComp: req.body.upperComp,
        upperCompAcc: req.body.upperCompAcc,
        lowerComp: req.body.lowerComp,
        lowerCompAcc: req.body.lowerCompAcc,
        enclosureWidth: req.body.enclosureWidth,
        enclosureType: req.body.enclosureType,
        cableEntry: req.body.cableEntry
    };

    assembleSectionPN(sectionDetailForm)
        .then(async function(sectionCatalogPN) {
            let sectionDetail = {
                sectionCatalogPN: sectionCatalogPN,
                productFamily: sectionDetailForm.productFamily,
                brkMfg: sectionDetailForm.brkMfg,
                kaRating: sectionDetailForm.kaRating,
                mainBusRating: sectionDetailForm.mainBusRating,
                upperComp: sectionDetailForm.upperComp,
                upperCompAcc: sectionDetailForm.upperCompAcc,
                lowerComp: sectionDetailForm.lowerComp,
                lowerCompAcc: sectionDetailForm.lowerCompAcc,
                enclosureWidth: sectionDetailForm.enclosureWidth,
                enclosureType: sectionDetailForm.enclosureType,
                cableEntry: sectionDetailForm.cableEntry
            };
            await querySql("UPDATE " + database + "." + dbConfig.section_detail_table + " SET ? WHERE secID = ?", [sectionDetail, secID]);
            return null
        })
        .then(() => {
            res.locals.title = 'SlimVAC';
            res.redirect('../searchLayout/?layoutID='+jobNumReleaseNum+"_"+layoutID);
        })
        .catch((err) => {
            return Promise.reject(err);
        });


};

exports.deleteSectionDetail = function(req, res) {
    let urlObj = url.parse(req.originalUrl);
    urlObj.protocol = req.protocol;
    urlObj.host = req.get('host');
    let qs = queryString.parse(urlObj.search);
    let jobNumReleaseNum = qs.layoutID.split('_')[0];
    let layoutID = qs.layoutID.split('_')[1];
    let secID = qs.secID;

    let secData = [];
    let layoutData = [];
    let layoutDetail = [];

    layoutLookup(layoutData, [null, null, layoutID])
        .then(async function() {
            await getLayoutData(layoutData,layoutDetail);
            await getSectionData(layoutData, secData);
            return null
        })
        .then(async function() {
            let deletedSectionNum;

            for (let section of secData) {
                if (section.secID == secID) {
                    deletedSectionNum = section.sectionNum;
                    await querySql("DELETE FROM " + database + "." + dbConfig.section_detail_table + " WHERE secID = ?", secID);
                }
            }

            for (let section of secData) {
                if (section.sectionNum > deletedSectionNum) {
                    await querySql("UPDATE " + database + "." + dbConfig.section_detail_table + " SET sectionNum = ? WHERE secID = ?",[section.sectionNum - 1, section.secID]);
                }
            }

            await querySql("UPDATE " + database + "." + dbConfig.layout_detail_table + " SET numSections = ? WHERE layoutID = ?",[layoutDetail[0].numSections - 1, layoutID]);
            return null
        })
        .then(() => {
            res.locals.title = 'SlimVAC';
            res.redirect('../searchLayout/?layoutID='+jobNumReleaseNum+"_"+layoutID);
        })
        .catch((err) => {
            return Promise.reject(err);
        });


};

exports.generateLayout = function(req, res) {
    req.setTimeout(0); //no timeout
    let urlObj = url.parse(req.originalUrl);
    urlObj.protocol = req.protocol;
    urlObj.host = req.get('host');
    let qs = queryString.parse(urlObj.search);
    let jobRelease = qs.layoutID.split('_')[0];
    let layoutID = qs.layoutID.split('_')[1];
    let creoData = [];
    let layoutData = [];
    let layoutDetail = [];
    let sectionDetail = [];
    let productPnOpts = [];
    let slimvacSecPnOpts = [];
    let sectionNames = [];
    const fs = require('fs');
    const cpFile = require('cp-file');




    layoutLookup(layoutData, [null, null, layoutID])
        .then(async function() {
            await getCreoData(layoutData, creoData);
            await getLayoutData(layoutData, layoutDetail);
            await getSectionData(layoutData, sectionDetail);
            await getProductPnData(productPnOpts);
            await getSlimvacSectionPnData(slimvacSecPnOpts);
            return null
        })
        .then(() => {
            console.log(creoData);
            for (let section of sectionDetail) {
                if (section.sectionNum < 10) {
                    sectionNames.push('10' + section.sectionNum + "-" + section.sectionCatalogPN);
                } else if (section.sectionNum >= 10) {
                    sectionNames.push('1' + section.sectionNum + "-" + section.sectionCatalogPN);
                }
            }
        })
        .then(async function() {
            let sourceDir = "C:\\Users\\james.africh\\Desktop\\SlimvacWD";
            let targetDir = "C:\\Users\\james.africh\\Desktop\\targetDir";
            for (let i = 0; i < sectionDetail.length; i++) {
                let oldPath = sourceDir+"\\"+sectionDetail[i].sectionCatalogPN.toLowerCase()+".asm";
                let newPath = targetDir+"\\"+sectionDetail[i].sectionCatalogPN+".asm";
                await cpFile(oldPath, newPath);
                console.log('The file has been moved');

            }

            return null
        })



        /*.then(async function() {
            for (let i = 0; i < sectionDetail.length; i++) {
                await creo(sessionId, {
                    command: "file",
                    function: "open",
                    data: {
                        file: sectionDetail[i].sectionCatalogPN+".asm",
                        dirname: creoData[0].standardLib,
                        display: true,
                        activate: true,
                        new_window: true
                    }
                });

                await creo(sessionId, {
                    command: "file",
                    function: "regenerate",
                    data: {
                        file: sectionDetail[i].sectionCatalogPN+".asm"
                    }
                });

                await creo(sessionId, {
                    command: "file",
                    function: "regenerate",
                    data: {
                        file: sectionDetail[i].sectionCatalogPN+".asm"
                    }
                });

                await creo(sessionId, {
                    command: "interface",
                    function: "mapkey",
                    data: {
                        script: "~ Close `main_dlg_cur` `appl_casc`;" +
                            "~ Command `ProCmdModelSaveAs` ;" +
                            "~ LButtonArm `file_saveas` `tb_EMBED_BROWSER_TB_SAB_LAYOUT` 3 471 14 0;" +
                            "~ LButtonDisarm `file_saveas` `tb_EMBED_BROWSER_TB_SAB_LAYOUT` 3 471 14 0;" +
                            "~ LButtonActivate `file_saveas` `tb_EMBED_BROWSER_TB_SAB_LAYOUT` 3 471 14 0;" +
                            "~ Input `file_saveas` `opt_EMBED_BROWSER_TB_SAB_LAYOUT` " + "`" + creoData[0].workingDir + "`;" +
                            "~ Update `file_saveas` `opt_EMBED_BROWSER_TB_SAB_LAYOUT` " + "`" + creoData[0].workingDir + "`;" +
                            "~ FocusOut `file_saveas` `opt_EMBED_BROWSER_TB_SAB_LAYOUT`;" +
                            "~ Update `file_saveas` `Inputname` " + "`" + sectionNames[i] + "`;" +
                            "~ Activate `file_saveas` `OK`;~ Activate `assyrename` `OpenBtn`;"
                    }
                });

                await creo(sessionId, {
                    command: "file",
                    function: "close_window",
                    data: {
                        file: sectionDetail[i].sectionCatalogPN+".asm"
                    }
                });

            }
            return null
        })
        .then(async function () {
            for (let j = 0; j < sectionDetail.length; j++) {
                await creo(sessionId, {
                    command: "file",
                    function: "open",
                    data: {
                        file: sectionNames[j]+".asm",
                        dirname: creoData[0].workingDir,
                        display: true,
                        activate: true,
                        new_window: true
                    }
                });
                if (sectionDetail[j].sectionNum == 1) {
                    await creo(sessionId, {
                        command: "feature",
                        function: "resume",
                        data: {
                            file: sectionNames[j]+".asm",
                            names: ["777600-0196-051*","777600-0196-052*"]
                        }
                    });
                } else if (sectionDetail[j].sectionNum == layoutDetail[0].numSections) {
                    await creo(sessionId, {
                        command: "feature",
                        function: "resume",
                        data: {
                            file: sectionNames[j]+".asm",
                            names: ["777600-0196-053*","777600-0196-054*"]
                        }
                    });
                    await creo(sessionId, {
                        command: "familytable",
                        function: "replace",
                        data: {
                            file: sectionNames[j]+".asm",
                            cur_model: '777600-0050-380.asm',
                            cur_inst: '777600-0050-381',
                            new_inst: '777600-0050-383'
                        }
                    });
                }
                await regenSaveAndClose(sessionId,sectionNames[j]+".asm");
            }
            return null
        })*/
        .then(() => {
            res.locals.title = 'SlimVAC';
            res.redirect('../searchLayout/?layoutID='+jobRelease+"_"+layoutID);
        })
        .catch((err) => {
            return Promise.reject(err);
        });
};