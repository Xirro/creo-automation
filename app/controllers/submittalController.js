//imports from npm
const url = require('url');
const queryString = require('query-string');
const moment = require('moment');

//Database information (table names)
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
            if (err.code === 'ECONNREFUSED') console.log('> Error in submittalController.js: Creoson server not reachable');
            else console.log('> There was an error in submittalController.js:', err);
        });
} else {
    console.log('Creoson disabled via CREOSON_ENABLED; skipping Creoson init in submittalController.js');
}

//IN ANY OF THESE FUNCTIONS IF YOU WANT TO DEBUG OR ANALYZE THE BEHAVIOR
//THE BEST THING TO DO IS console.log WHATEVER VARIABLE, OBJECT, ARRAY, PROPERTY, ETC. THAT YOU ARE TRYING TO STUDY



//creo function (used to remove some of the boilerplate thats involved with creoson http calls)
//Inputs: creoson sessionId provided from above, and function data JSON object
//Outputs: a POST request, formatted in Creoson JSON syntax in the form of a promise
function creo(sessionId, functionData) {
    const payload = { sessionId: sessionId, command: functionData.command, function: functionData.function };
    if (functionData.data && functionData.data.length !== undefined && functionData.data.length !== 0) payload.data = functionData.data;
    return axios.post(creoHttp, payload).then(r => r.data);
}

//regenAndSave "helper" function for creoson
async function regenAndSave(sessionId, filename) {
    //takes the filename provided and if it is not empty
    if (filename.length != 0) {
        //regen the file
        await creo(sessionId, {
            command: "file",
            function: "regenerate",
            data: {
                file: filename
            }
        });
        //save the file
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

//regenSaveAndClose "helper" function for creoson
async function regenSaveAndClose(sessionId, filename) {
    //takes the filename provided and if it is not empty
    if (filename.length != 0) {
        //regen the file
        await creo(sessionId, {
            command: "file",
            function: "regenerate",
            data: {
                file: filename
            }
        });
        //save the file
        await creo(sessionId, {
            command: "file",
            function: "save",
            data: {
                file: filename
            }
        });
        //close the window
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
//Initialize creoWorkingDir and creoStandardLib variables
let creoWorkingDir, creoStandardLib;

//submittalLookup "helper" function for db querys
//takes in a subData empty array to fill and a lookupArray - a (3) element array which resembles the following ["220XXX", "A", 24]
//use element 1 & 2 when you know the job num and release but not the subID, and use element 3 if you know the subID
async function submittalLookup(subData, lookupArray) {
    //Initialize submittals
    let submittals;
    //if provided an empty lookupArray [], simply lookup the entire submittalSum table
    if (lookupArray.length == 0) {
        submittals = await querySql("SELECT * FROM " + database + "." + dbConfig.submittal_summary_table);
    } else {
        //if job num and release exists
        if (lookupArray[0] != null && lookupArray[1] != null) {
            //select the row from submittalSum referenced by the jobNum and releaseNum
            submittals =  await querySql("SELECT * FROM " + database + "." + dbConfig.submittal_summary_table+" WHERE jobNum = ? AND releaseNum = ?",[lookupArray[0], lookupArray[1]]);
        } else if (lookupArray[2] != null) {
        //if the subID exists
            //select the row from submittalSum referened by the subID
            submittals =  await querySql("SELECT * FROM " + database + "." + dbConfig.submittal_summary_table+" WHERE subID = ?", lookupArray[2]);
        }
    }

    //for each submittal
    for (let submittal of submittals) {
        //re-format the date using moment and utc()
        let drawnDate = moment(submittal.drawnDate).utc().format("YYYY-MM-DD");
        let checkedDate = moment(submittal.checkedDate).utc().format("YYYY-MM-DD");
        //push to subData
        await subData.push({
            subID: submittal.subID,
            jobNum: submittal.jobNum,
            releaseNum: submittal.releaseNum,
            jobName: submittal.jobName,
            customer: submittal.customer,
            layoutName: submittal.layoutName,
            drawnBy: submittal.drawnBy,
            drawnDate: drawnDate,
            checkedBy: submittal.checkedBy,
            checkedDate: checkedDate
        });
    }

    return null
}

//revLookup "helper" function for db querys
async function revLookup(revData, lookupArray) {
    //initialize revs variable
    let revs;
    //if provided an empty lookupArray [], simply lookup the entire submittalRevSum table
    if (lookupArray.length == 0) {
        revs = await querySql("SELECT * FROM " + database + "." + dbConfig.submittal_rev_table);
    } else {
    //if provided a subID in lookupArray, then lookup the submittalRevSum row referenced by the subID
        revs =  await querySql("SELECT * FROM " + database + "." + dbConfig.submittal_rev_table + " WHERE subID = ?", lookupArray[0]);
    }
    //for each rev
    for (let rev of revs) {
        //push to rev data
        await revData.push({
            revID: rev.revID,
            subID: rev.subID,
            revNum: rev.revNum,
            revNote: rev.revNote
        })
    }

    return null
}

//getCreoData "helper" function for db querys
//takes in subData and revData arrays. Also provided an empty array creoData to fill
async function getCreoData(subData, revData, creoData) {
    //Initialize/set variables based on subData and revData values
    let jobNum = subData[0].jobNum;
    let releaseNum = subData[0].releaseNum;
    let layoutName = subData[0].layoutName;
    let latestRevNum = revData[revData.length - 1].revNum;

    //this line converts a letter to a number (i.e. A -> 1, B -> 2, ....) we use this for the layout assembly number 0000-00X
    let layoutNum = releaseNum.toLowerCase().charCodeAt(0) - 96;
    //look up the current wd and write it to dir
    let dir = await creo(sessionId, {
        command: "creo",
        function: "pwd",
        data: {}
    });
    //if no current wd
    if (dir.data == undefined) {
        //set wd to the creoWorkingDir
        await creo(sessionId, {
            command: "creo",
            function: "cd",
            data: {
                "dirname": creoWorkingDir
            }
        });
    } else {
    // if current dir but it doesnt match creoWorkingDir
        if (dir.data.dirname != creoWorkingDir) {
            //set the wd to the creoWorkingDir
            await creo(sessionId, {
                command: "creo",
                function: "cd",
                data: {
                    "dirname": creoWorkingDir
                }
            });
        }
    }

    //Initialize variables
    let creoLayoutAsm;
    let creoLayoutDrw;
    let creoOneLineAsm;
    let creoOutputDir = null;
    let creoOutputPDF;
    //auto-generate drawing names based on jobNum and layoutNum
    if (layoutNum < 10) {
        creoLayoutAsm = jobNum+'-'+'0000'+'-'+'00'+layoutNum+'.asm';
        creoOneLineAsm = jobNum+'-'+'0001'+'-'+'00'+layoutNum+'.asm';
    } else if (layoutNum < 100) {
        creoLayoutAsm = jobNum+'-'+'0000'+'-'+'0'+layoutNum+'.asm';
        creoOneLineAsm = jobNum+'-'+'0001'+'-'+'0'+layoutNum+'.asm';
    }
    creoLayoutDrw = creoLayoutAsm.slice(0,15)+'-S.drw';
    creoOutputPDF = creoLayoutAsm.slice(0,15)+'-'+latestRevNum+'_'+layoutName+'.pdf';

    //push to creoData
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

//getLayoutData "helper" function for db querys
//takes in subData. also provided an empty array layoutData to fill
async function getLayoutData(subData, layoutData) {
    //lookup the submittalLayoutSum row referenced by subID
    const layouts = await querySql("SELECT * FROM " + database + "." + dbConfig.submittal_layout_table + " WHERE subID = ?", subData[0].subID);

    //if layouts exist
    if (layouts.length != 0) {
        //for each layout
        for (let layout of layouts) {
            //push to layoutData
            layoutData.push({
                subID: layout.subID,
                layoutID: layout.layoutID,
                layoutName: layout.layoutName,
                ulListing: layout.ulListing,
                systemType: layout.systemType,
                systemAmp: layout.systemAmp,
                mainBusAmp: layout.mainBusAmp,
                enclosure: layout.enclosure,
                accessibility: layout.accessibility,
                cableAccess: layout.cableAccess,
                paint: layout.paint,
                interruptRating: layout.interruptRating,
                busBracing: layout.busBracing,
                busType: layout.busType,
                insulatedBus: layout.insulatedBus,
                boots: layout.boots,
                iccbPlatform: layout.iccbPlatform,
                mccbPlatform: layout.mccbPlatform,
                vcbPlatform: layout.vcbPlatform,
                keyInterlocks: layout.keyInterlocks,
                seismic: layout.seismic,
                mimic: layout.mimic,
                ir: layout.ir,
                wireway: layout.wireway,
                trolley: layout.trolley,
                numSections: layout.numSections
            });
        }
    }
    return null
}

//getBreakerData "helper" function for db querys
//takes in layoutData. also provided an empty array deviceData to fill
async function getBreakerData(layoutData, deviceData) {
    //initialize breakers
    let breakers;
    //if layoutData exists
    if (layoutData.length != 0) {
        //write to layoutID, then update breakers with the value returned from submittalBrkSum row referenced by layoutID
        let layoutID = layoutData[0].layoutID;
        breakers = await querySql("SELECT * FROM " + database + "." + dbConfig.submittal_breaker_table + " WHERE layoutID = ?", layoutID);
    } else {
        //if no layoutData, then assume no breakers
        breakers = [];
    }
    //for each breaker
    for (let breaker of breakers) {
        //push to deviceData
        deviceData.push({
            devID: breaker.devID,
            layoutID: breaker.layoutID,
            secID: breaker.secID,
            comp: breaker.comp,
            devDesignation: breaker.devDesignation,
            devFunction: breaker.devFunction,
            unitOfIssue: breaker.unitOfIssue,
            catCode: breaker.catCode,
            platform: breaker.platform,
            brkPN: breaker.brkPN,
            cradlePN: breaker.cradlePN,
            devMount: breaker.devMount,
            rearAdaptType: breaker.rearAdaptType,
            devUL: breaker.devUL,
            devLevel: breaker.devLevel,
            devOperation: breaker.devOperation,
            devCtrlVolt: breaker.devCtrlVolt,
            devMaxVolt: breaker.devMaxVolt,
            devKAIC: breaker.devKAIC,
            devFrameSet: breaker.devFrameSet,
            devSensorSet: breaker.devSensorSet,
            devTripSet: breaker.devTripSet,
            devTripUnit: breaker.devTripUnit,
            devTripParam: breaker.devTripParam,
            devPoles: breaker.devPoles,
            devLugQty: breaker.devLugQty,
            devLugType: breaker.devLugType,
            devLugSize: breaker.devLugSize
        });
    }
    return null
}

//getBreakerAccData "helper" function for db querys
//takes in deviceData. also provided an empty array brkAccData to fill
async function getBreakerAccData(deviceData, brkAccData) {
    //for each breaker
    for (let data of deviceData) {
        //lookup breaker accessories rows referenced by devID
        const devAccs = await querySql("SELECT * FROM " + database + "." + dbConfig.submittal_brkAcc_table + " WHERE devID = ?", data.devID);
        //lookup all options in brkAccOptions table
        const devAccOptions = await querySql("SELECT * FROM " + database + "." + dbConfig.brkAcc_options_table);
        //for each breaker accessory
        for (let devAcc of devAccs) {
            //for each accessory option
            for  (let devAccOpt of devAccOptions) {
                //if the brkAccDropdownID's match, then push to brkAccData
                if (devAcc.brkAccDropdownID == devAccOpt.brkAccDropdownID) {
                    brkAccData.push({
                        brkAccID: devAcc.brkAccID,
                        brkAccDropdownID: devAcc.brkAccDropdownID,
                        name: devAccOpt.brkAccName,
                        opt: devAccOpt.brkAccOpt,
                        devID: devAcc.devID
                    });
                }
            }
        }
    }

    return null
}

//getLayoutAndBrkAccDropdownData "helper" function for db querys
//takes in empty layoutDropdownData and brkAccDropdownData arrays to fill
async function getLayoutAndBrkAccDropdownData(layoutDropdownData, brkAccDropdownData) {
    //lookup everything from layoutParamTypes table and write it to layoutDropdowns
    const layoutDropdowns = await querySql("SELECT * FROM " + database + "." + dbConfig.layout_paramTypes_table);
    //lookup everything from brkAccOptions table and write it to brkAccDropdowns
    const brkAccDropdowns = await querySql("SELECT * FROM " + database + "." + dbConfig.brkAcc_options_table);

    //for each option in layoutDropdowns, push to layoutDropdownData
    for (let dropdown of layoutDropdowns) {
        layoutDropdownData.push({
            type: dropdown.dropdownType,
            value: dropdown.dropdownValue
        });
    }

    //initialize temp variable
    let tempBrkAccDropdownData = [];
    //for each option in brkAccDropdowns, push to tempBrkAccDropdownData
    for (let dropdown of brkAccDropdowns) {
        tempBrkAccDropdownData.push({
            id: dropdown.brkAccDropdownID,
            type: dropdown.brkAcc,
            name: dropdown.brkAccName,
            value: dropdown.brkAccOpt
        });
    }

    //for each item in tempBrkAccDropdownData
    for (let item of tempBrkAccDropdownData) {
        //if record already exists in brkAccDropdownData, push to the id and value arrays within the filtered object
        if (brkAccDropdownData.filter(e => e.type === item.type).length > 0) {
            brkAccDropdownData.filter(e => e.type === item.type)[0].value.push(item.value);
            brkAccDropdownData.filter(e => e.type === item.type)[0].id.push(item.brkAccDropdownID)
        } else {
        //if no prior record exists, then create it
            brkAccDropdownData.push({
                id: [item.id],
                type: item.type,
                name: item.name,
                value: [item.value]
            })
        }
    }
    return null
}

//getSectionData "helper" function for db querys
//takes in layoutData. also provided an empty array sectionData to fill
async function getSectionData(layoutData, sectionData) {
    //if layoutData exists
    if (layoutData.length != 0) {
        //lookup all rows from submittalSectionSum that correspond to layoutID
        const sections = await querySql("SELECT * FROM " + database + "." + dbConfig.submittal_sections_table+ " WHERE layoutID = ?", layoutData[0].layoutID);
        //for each section
        for (let section of sections) {
            //push to sectionData
            sectionData.push({
                secID: section.secID,
                layoutID: section.layoutID,
                sectionNum: section.sectionNum,
                compType: section.compType,
                controlAsmID: section.controlAsmID,
                secType: section.secType,
                brkType: section.brkType,
                secAmp: section.secAmp,
                secPoles: section.secPoles,
                secHeight: section.secHeight,
                secWidth: section.secWidth,
                secDepth: section.secDepth
            })
        }
    }
    return null
}

//getTypeAndRestrictionData "helper" function for db querys
//takes in empty sectionTypeData, brkTypeData, and restrictionData arrays to fill
async function getTypeAndRestrictionData(sectionTypeData, brkTypeData, restrictionData) {
    //lookup everything from secType and write it to secTypes
    const secTypes = await querySql("SELECT * FROM " + database + "." + dbConfig.secType_table);
    //for each secType push to sectionTypeData
    for (let secType of secTypes) {
        sectionTypeData.push({
            secType: secType.type
        });
    }

    //lookup everything from brkType and write it to brkTypes
    const brkTypes = await querySql("SELECT * FROM " + database + "." + dbConfig.brkType_table);
    //for each brkType push to brkTypeData
    for (let brkType of brkTypes) {
        brkTypeData.push({
            brkType: brkType.type
        })
    }

    //lookup everything from layoutParamRestriction and write it to layoutParamRestrictions
    const layoutParamRestrictions = await querySql("SELECT * FROM " + database + "." + dbConfig.layout_paramType_restrictions);
    //for each restriction push to restrictionData
    for (let restriction of layoutParamRestrictions) {
        restrictionData.push({
            type: restriction.dropdownType,
            value: restriction.dropdownValue,
            restrictions: JSON.parse(restriction.dropdownRestrictions)
        });
    }

    return null
}

//getPbRowData "helper" function for db querys
//takes in sectionData. also provided an empty array pbRowData to fill
async function getPbRowData(sectionData, pbRowData) {
    //for each section
    for (let section of sectionData) {
        //lookup the submittalPanelBrk rows referenced by secID
        const pbRows = await querySql("SELECT * FROM " + database + "." + dbConfig.submittal_panel_breakers + " WHERE secID = ?", section.secID);
        //if rows exist
        if (pbRows.length != 0) {
            //for each row, push to pbRowData
            for (let row of pbRows) {
                pbRowData.push({
                    secID: section.secID,
                    secNum: section.sectionNum,
                    devID: row.devID,
                    panelRow: row.panelRow,
                    configuration: row.configuration,
                    mounting: row.mounting,
                    frame: row.frame
                });
            }
        }
    }
    return null
}

//getMfgBreakerDropdownData "helper" function for db querys
//takes in empty brkDropdownOpts array to fill
async function getMfgBreakerDropdownData(brkDropdownOpts) {
    //lookup everything in brkDropdownOptions table and write it to breakerDropdownOptions
    const breakerDropdownOptions = await querySql("SELECT * FROM " + database + "." + dbConfig.breakerDropdown_options_table);
    //for each option, push to brkDropdownOpts
    for (let opt of breakerDropdownOptions) {
        brkDropdownOpts.push(opt);
    }
    return null
}

//searchSubmittalRoutine "helper" function for db querys
//main function in combining all of the functions above into a compact function that can be run quickly in the functions called below
//specifically useful for getting all the data needed to successfully return to/render the searchSubmittal page during the generateSubmittal process
async function searchSubmittalRoutine(subID, res, message) {
    //Initialize variables
    let subData = [];
    let revData = [];
    let creoData = [];
    let layoutData = [];
    let layoutDropdownData = [];
    let brkAccDropdownData = [];
    let deviceData = [];
    let brkAccData = [];
    let sectionData = [];
    let sectionTypeData = [];
    let brkTypeData = [];
    let restrictionData = [];
    let pbRowData = [];
    let brkDropdownOpts = [];
    //execute submittalLookup function
    submittalLookup(subData, [null, null, subID])
        .then(async function() {
            //execute revLookup function
            return await revLookup(revData,[subData[0].subID])
        })
        .then(async function() {
            //execute getCreoData function
            return await getCreoData(subData, revData, creoData);
        })
        .then(async function () {
            //execute getLayoutData function
            return await getLayoutData(subData, layoutData);
        })
        .then(async function() {
            //execute getBreakerData function
            return await getBreakerData(layoutData, deviceData);
        })
        .then(async function() {
            //execute getBreakerAccData function
            return await getBreakerAccData(deviceData, brkAccData);
        })
        .then(async function() {
            //execute getLayoutAndBrkAccDropdownData function
            return await getLayoutAndBrkAccDropdownData(layoutDropdownData, brkAccDropdownData);
        })
        .then(async function() {
            //execute getSectionData function
            return await getSectionData(layoutData, sectionData);
        })
        .then(async function() {
            //execute getTypeAndRestrictionData function
            return await getTypeAndRestrictionData(sectionTypeData, brkTypeData, restrictionData);
        })
        .then(async function() {
            //execute getPbRowData function
            return await getPbRowData(sectionData, pbRowData);
        })
        .then(async function() {
            //execute getMfgBreakerDropdownData function
            return await getMfgBreakerDropdownData(brkDropdownOpts);
        })
        .then(() => {
            //render the searchSubmittal page with all required data
            res.locals = {title: 'Submittal'};
            res.render('Submittal/searchSubmittal', {
                message: message,
                subData: subData,
                revData: revData,
                creoData: creoData,
                layoutData: layoutData,
                sectionData: sectionData,
                sectionType: sectionTypeData,
                brkType: brkTypeData,
                layoutDropdownData: layoutDropdownData,
                brkAccDropdownData: brkAccDropdownData,
                layoutItemData: [],
                userItemData: [],
                comItemData: [],
                layoutControlData: [],
                controlAsmData: [],
                panelboardData: [],
                deviceData: deviceData,
                brkAccData: brkAccData,
                brkAccDropdown: [],
                restrictionData: restrictionData,
                pbRowData: pbRowData,
                brkDropdownOpts: brkDropdownOpts,
                currentSlide: 1
            })
        })
        .catch(err => {
            //if an error occurs at anytime at any point in the above code, log it to the console
            console.log(err);
        })
}


/***********************************************
 MAIN SUBMITTAL
 ***********************************************/
//submittal function
exports.submittal = function(req, res) {
    //initialize variables
    let submittalData = [];

    //lookup everything from the submittalSum table
    querySql("SELECT * FROM " + database + "." + dbConfig.submittal_summary_table)
        .then(async function(submittals) {
            //for each submittal
            for (let submittal of submittals) {
                //re-format the date using moment and format()
                let drawnDate = moment(submittal.drawnDate).utc().format("YYYY-MM-DD");
                let checkedDate = moment(submittal.checkedDate).utc().format("YYYY-MM-DD");
                //push to submittalData
                await submittalData.push({
                    subID: submittal.subID,
                    jobNum: submittal.jobNum,
                    releaseNum: submittal.releaseNum,
                    jobName: submittal.jobName,
                    customer: submittal.customer,
                    layoutName: submittal.layoutName,
                    drawnBy: submittal.drawnBy,
                    drawnDate: drawnDate,
                    checkedBy: submittal.checkedBy,
                    checkedDate: checkedDate
                });
            }
            return null
        })
        .then(() => {
            //render the submittal page with message, newSubData, and submittalData
            res.locals = {title: 'Submittal'};
            res.render('Submittal/submittal', {
                message: null,
                newSubData: null,
                submittalData: submittalData
            });
        })
        .catch(err => {
            //if an error occurs at anytime at any point in the above code, log it to the console
            console.log(err);
        });
};







//createSubmittal function
exports.createSubmittal = function(req, res) {
    //Initialize variables
    let submittalData = [];
    let subData = [];
    let newSubData = {
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

    //createSubmittal async function definition - helper function for db query
    async function createSubmittal(subData) {
        return await querySql("INSERT INTO " + database + "." + dbConfig.submittal_summary_table + " SET ?", subData);
    }
    //createRev async function definition - helper function for db query
    async function createRev(revData) {
        return await querySql("INSERT INTO " + database + "." + dbConfig.submittal_rev_table + " SET ?", revData);
    }

    //execute submittalLookup function
    submittalLookup(subData,[])
        .then(async function() {
            //initialize existingSubID
            let existingSubID = null;
            //for each submittal (since lookupArray is [] submittalLookup returns all submittals)
            for (let submittal of subData) {
                //push to submittalData
                submittalData.push({
                    subID: submittal.subID,
                    jobNum: submittal.jobNum,
                    releaseNum: submittal.releaseNum,
                    jobName: submittal.jobName,
                    customer: submittal.customer,
                    layoutName: submittal.layoutName,
                    drawnBy: submittal.drawnBy,
                    drawnDate: submittal.drawnDate,
                    checkedBy: submittal.checkedBy,
                    checkedDate: submittal.checkedDate
                });
                //if the jobNum and releaseNum already exist
                if (submittal.jobNum == newSubData.jobNum && submittal.releaseNum == newSubData.releaseNum) {
                    //update existingSubID
                    existingSubID = submittal.subID;
                }
            }
            //if existsingSubID exists
            if (existingSubID != null) {
                res.locals = {title: 'Submittal'};
                res.render('Submittal/submittal', {
                    //render the submittal page with a message warning the user that this already exists
                    message: "Submittal already exists for "+newSubData.jobNum+newSubData.releaseNum,
                    newSubData: newSubData,
                    submittalData: submittalData
                });
            } else {
            //if no existingSubID
                //execute createSubmittal function feeding it newSubData
                await createSubmittal(newSubData);
                //initialize submittals array
                let submittals = [];
                //execute submittalLookup again, but this time with lookupArray including the job num and release
                await submittalLookup(submittals,[newSubData.jobNum, newSubData.releaseNum, null]);
                //write the subID obtained from submittals array (should only include 1 element)
                let subID = submittals[0].subID;
                //initialize/set newRevData
                let newRevData = {
                    subID: subID,
                    revNum: 'S00',
                    revNote: req.body.revNote
                };
                //execute createRev function feeding it newRevData
                await createRev(newRevData);
                //redirect to the searchSubmittal page
                res.locals = {title: 'Submittal'};
                res.redirect('../searchSubmittal/?subID='+newSubData.jobNum+newSubData.releaseNum+"_"+subID);
            }
        })
        .catch(err => {
            //if an error occurs at anytime at any point in the above code, log it to the console
            console.log(err);
        })
};






//editSubmittal function
exports.editSubmittal = function(req, res) {
    //initialize/set variables
    let urlObj = url.parse(req.originalUrl);
    urlObj.protocol = req.protocol;
    urlObj.host = req.get('host');
    let qs = queryString.parse(urlObj.search);
    let jobNumReleaseNum = qs.subID.split('_')[0];
    let subID = qs.subID.split('_')[1];

    let newSubData = {
        jobName: req.body.jobName,
        customer: req.body.customer,
        layoutName: req.body.layoutName,
        drawnBy: req.body.drawnBy,
        drawnDate: req.body.drawnDate,
        checkedBy: req.body.checkedBy,
        checkedDate: req.body.checkedDate
    };

    //editSubmittal async function definition - helper function for dq query
    async function editSubmittal(subData) {
        //updates the submittalSum table with the data provided in the row referenced by subID (this is obtained from the url querystring above)
        return await querySql("UPDATE " + database + "." + dbConfig.submittal_summary_table + " SET ? WHERE subID = ?", [subData, subID]);
    }

    //execute editSubmittal feeding it newSubData
    editSubmittal(newSubData)
        .then(() => {
            //redirect to searchSubmittal page
            res.redirect('../searchSubmittal/?subID='+jobNumReleaseNum+"_"+subID);
        })
        .catch(err => {
            //if an error occurs at anytime at any point in the above code, log it to the console
            console.log(err);
        });
};






//searchSubmittal function
exports.searchSubmittal = function(req, res) {
    //initialize/set variables
    let urlObj = url.parse(req.originalUrl);
    urlObj.protocol = req.protocol;
    urlObj.host = req.get('host');
    let qs = queryString.parse(urlObj.search);
    let subID = qs.subID.split('_')[1];
    let subData = [];
    let revData = [];
    let creoData = [];
    let layoutData = [];
    let layoutDropdownData = [];
    let brkAccDropdownData = [];
    let deviceData = [];
    let brkAccData = [];
    let sectionData = [];
    let sectionTypeData = [];
    let brkTypeData = [];
    let restrictionData = [];
    let pbRowData = [];
    let brkDropdownOpts = [];

    //execute submittalLookup function with the lookupArray including the subID
    submittalLookup(subData, [null, null, subID])
        .then(async function() {
            //execute the revLookup function
            return await revLookup(revData,[subData[0].subID])
        })
        .then(async function() {
            //execute the getCreoData function
            return await getCreoData(subData, revData, creoData);
        })
        .then(async function () {
            //execute the getLayoutData function
            return await getLayoutData(subData, layoutData);
        })
        .then(async function() {
            //execute the getBreakerData function
            return await getBreakerData(layoutData, deviceData);
        })
        .then(async function() {
            //execute the getBreakerAccData function
            return await getBreakerAccData(deviceData, brkAccData);
        })
        .then(async function() {
            //execute the getLayoutAndBrkAccDropdownData function
            return await getLayoutAndBrkAccDropdownData(layoutDropdownData, brkAccDropdownData);
        })
        .then(async function() {
            //execute the getSectionData function
            return await getSectionData(layoutData, sectionData);
        })
        .then(async function() {
            //execute the getTypeAndRestrictionData function
            return await getTypeAndRestrictionData(sectionTypeData, brkTypeData, restrictionData);
        })
        .then(async function() {
            //execute the getPbRowData function
            return await getPbRowData(sectionData, pbRowData);
        })
        .then(async function() {
            //execute the getMfgBreakerDropdownData function
            return await getMfgBreakerDropdownData(brkDropdownOpts);
        })
        .then(() => {
            //render the searchSubmittal page with all required data
            res.locals = {title: 'Submittal'};
            res.render('Submittal/searchSubmittal', {
                message: null,
                subData: subData,
                revData: revData,
                creoData: creoData,
                layoutData: layoutData,
                sectionData: sectionData,
                sectionType: sectionTypeData,
                brkType: brkTypeData,
                layoutDropdownData: layoutDropdownData,
                brkAccDropdownData: brkAccDropdownData,
                layoutItemData: [],
                userItemData: [],
                comItemData: [],
                layoutControlData: [],
                controlAsmData: [],
                panelboardData: [],
                deviceData: deviceData,
                brkAccData: brkAccData,
                brkAccDropdown: [],
                restrictionData: restrictionData,
                pbRowData: pbRowData,
                brkDropdownOpts: brkDropdownOpts,
                currentSlide: 1
            })
        })
        .catch((err) => {
            //if an error occurs at anytime at any point in the above code, log it to the console
            return Promise.reject(err);
        });
};









/***********************************************
 LAYOUTS IN SUBMITTAL
 ***********************************************/
//addLayout function
exports.addLayout = function(req, res) {
    //initialize/set variables
    let urlObj = url.parse(req.originalUrl);
    urlObj.protocol = req.protocol;
    urlObj.host = req.get('host');
    let qs = queryString.parse(urlObj.search);
    let jobNumReleaseNum = qs.subID.split('_')[0];
    let subID = qs.subID.split('_')[1];
    let checkArray = [];
    let reqChecks = [req.body.insulatedBus, req.body.boots, req.body.seismic, req.body.mimic, req.body.IR, req.body.wireway, req.body.trolley];
    for (let i = 0; i < reqChecks.length; i++) {
        if(reqChecks[i]) {
            checkArray.push("Y");
        } else {
            checkArray.push("N");
        }
    }
    let newLayoutData = {
        subID: subID,
        layoutName: req.body.layoutName,
        ulListing: req.body.ulListing,
        systemType: req.body.systemType,
        systemAmp: req.body.systemAmp,
        mainBusAmp: req.body.mainBusAmp,
        enclosure: req.body.enclosure,
        accessibility: req.body.accessibility,
        cableAccess: req.body.cableAccess,
        paint: req.body.paint,
        interruptRating: req.body.interruptRating,
        busBracing: req.body.busBracing,
        busType: req.body.busType,
        insulatedBus: checkArray[0],
        boots: checkArray[1],
        keyInterlocks: req.body.keyInterlocks,
        seismic: checkArray[2],
        mimic: checkArray[3],
        ir: checkArray[4],
        wireway: checkArray[5],
        trolley: checkArray[6],
        numSections: 0
    };

    //createLayout async function definition
    async function createLayout(layoutData) {
        //inserts new row into submittalLayoutSum with layoutData
        return await querySql("INSERT INTO " + database + "." + dbConfig.submittal_layout_table + " SET ?", layoutData);
    }

    //execute createLayout function
    createLayout(newLayoutData)
        .then(() => {
            //redirect to searchSubmittal page
            res.redirect('../searchSubmittal/?subID='+jobNumReleaseNum+"_"+subID);
        })
        .catch(err => {
            //if an error occurs at anytime at any point in the above code, log it to the console
            console.log(err);
        });
};







//editLayout function
exports.editLayout = function(req, res) {
    //initialize/set variables
    let urlObj = url.parse(req.originalUrl);
    urlObj.protocol = req.protocol;
    urlObj.host = req.get('host');
    let qs = queryString.parse(urlObj.search);
    let jobNumReleaseNum = qs.subID.split('_')[0];
    let subID = qs.subID.split('_')[1];

    let checkArray = [];
    let reqChecks = [req.body.insulatedBus_edit, req.body.boots_edit, req.body.seismic_edit, req.body.mimic_edit, req.body.IR_edit, req.body.wireway_edit, req.body.trolley_edit];
    for (let i = 0; i < reqChecks.length; i++) {
        if(reqChecks[i]) {
            checkArray.push("Y");
        } else {
            checkArray.push("N");
        }
    }
    let newLayoutData = {
        layoutName: req.body.layoutName,
        ulListing: req.body.ulListing_edit,
        systemType: req.body.systemType_edit,
        systemAmp: req.body.systemAmp_edit,
        mainBusAmp: req.body.mainBusAmp_edit,
        enclosure: req.body.enclosure_edit,
        accessibility: req.body.accessibility_edit,
        cableAccess: req.body.cableAccess_edit,
        paint: req.body.paint_edit,
        interruptRating: req.body.interruptRating_edit,
        busBracing: req.body.busBracing_edit,
        busType: req.body.busType_edit,
        insulatedBus: checkArray[0],
        boots: checkArray[1],
        keyInterlocks: req.body.keyInterlocks_edit,
        seismic: checkArray[2],
        mimic: checkArray[3],
        ir: checkArray[4],
        wireway: checkArray[5],
        trolley: checkArray[6]
    };

    //editLayout async function definition
    async function editLayout(layoutData) {
        //update the submittalLayoutSub table with layoutData in the row referenced by subID
        return await querySql("UPDATE " + database + "." + dbConfig.submittal_layout_table + " SET ? WHERE subID = ?", [layoutData, subID]);
    }

    //execute editLayout function
    editLayout(newLayoutData)
        .then(() => {
            //redirect to searchSubmittal page
            res.redirect('../searchSubmittal/?subID='+jobNumReleaseNum+"_"+subID);
        })
        .catch(err => {
            //if an error occurs at anytime at any point in the above code, log it to the console
            console.log(err);
        });
};









/*********************************************
 SECTION CONFIGURE
 *********************************************/
//layoutAddSection function
exports.layoutAddSection = function(req, res){
    //initialize/set variables
    let urlObj = url.parse(req.originalUrl);
    urlObj.protocol = req.protocol;
    urlObj.host = req.get('host');
    let qs = queryString.parse(urlObj.search);
    let jobRelease = qs.subID.split('_')[0];
    let subID = qs.subID.split('_')[1];
    let layoutID, numSections;

    //lookup submittalLayoutSum row referenced by subID
    querySql("SELECT * FROM " + database + "." + dbConfig.submittal_layout_table + " WHERE subID = ?", subID)
        .then(layouts => {
            //if layouts exist
            if (layouts.length != 0) {
                //set the layoutID and numSections variables
                layoutID = layouts[0].layoutID;
                numSections = layouts[0].numSections;
                if (numSections == null)
                    numSections = 1;
                else
                    numSections += 1;

                //update the submittalLayoutSum table numSections column in the row referenced by layoutID
                querySql("UPDATE " + database + "." + dbConfig.submittal_layout_table + " SET numSections = ? WHERE layoutID = ? ", [numSections, layoutID]);
                //insert new row into submittalSectionSum and set the layoutID and sectionNum
                querySql("INSERT INTO " + database + "." + dbConfig.submittal_sections_table + " SET layoutID = ?, sectionNum = ?", [layoutID, numSections]);
            }
            return null
        })
        .then(() => {
            //redirect to searchSubmittal page
            res.locals = {title: 'Add Section'};
            res.redirect('../searchSubmittal/?subID='+jobRelease+"_"+subID);
            return null
        })
        .catch((err) => {
            //if an error occurs at anytime at any point in the above code, log it to the console
            return Promise.reject(err);
        });
};








//layoutDeleteSection function
exports.layoutDeleteSection = function(req, res) {
    //initialize/set variables
    let urlObj = url.parse(req.originalUrl);
    urlObj.protocol = req.protocol;
    urlObj.host = req.get('host');
    let qs = queryString.parse(urlObj.search);
    let selectedSection = qs.selectedSection;
    let jobRelease = qs.subID.split('_')[0];
    let subID = qs.subID.split('_')[1];
    let layoutID;
    let numSections;

    //lookup submittalLayout table row referenced by subID
    querySql("SELECT * FROM " + database + "." + dbConfig.submittal_layout_table + " WHERE subID = ?", subID)
        .then(layouts => {
            //if layouts exist
            if (layouts.length != 0) {
                //set the layoutID and numSections variables
                layoutID = layouts[0].layoutID;
                numSections = layouts[0].numSections;
                if (numSections == 1)
                    numSections = null;
                else
                    numSections -= 1;
                //update the submittalLayout table numSections column in the row referenced by layoutID
                querySql("UPDATE " + database + "." + dbConfig.submittal_layout_table + " SET numSections = ? WHERE layoutID = ? ", [numSections, layoutID]);
            }
            //lookup submittalSection table rows referenced by layoutID
            return querySql("SELECT * FROM " + database + "." + dbConfig.submittal_sections_table + " WHERE layoutID = ?", layoutID)
        })
        .then(sections => {
            //if sections exist
            if (sections.length != 0) {
                //for each section
                for (let section of sections) {
                    if (parseInt(section.sectionNum) == parseInt(selectedSection.toString())) {
                        //if the sectionNum matches the selected section to be deleted, the delete the row
                        querySql("DELETE FROM " + database + "." + dbConfig.submittal_sections_table + " WHERE secID = ?",section.secID);
                    } else if (parseInt(section.sectionNum) > parseInt(selectedSection.toString())) {
                        //if the sectionNum is greater than the selected section to be deleted, then update the row with the decremented sectionNum
                        querySql("UPDATE " + database + "." + dbConfig.submittal_sections_table + " SET sectionNum = ? WHERE secID = ?", [section.sectionNum - 1, section.secID]);
                    }
                }
            }
            return null
        })
        .then(() => {
            //redirect to searchSubmittal page
            res.locals = {title: 'Add Section'};
            res.redirect('../searchSubmittal/?subID='+jobRelease+"_"+subID);
            return null
        })
        .catch((err) => {
            //if an error occurs at anytime at any point in the above code, log it to the console
            return Promise.reject(err);
        });
};







//layoutSectionProperties function
exports.layoutSectionProperties = function(req, res) {
    //initialize/set variables
    let urlObj = url.parse(req.originalUrl);
    urlObj.protocol = req.protocol;
    urlObj.host = req.get('host');
    let qs = queryString.parse(urlObj.search);
    let jobRelease = qs.subID.split('_')[0];
    let subID = qs.subID.split('_')[1];
    let sectionNum = qs.sectionNum;
    let layoutID;
    let comp;
    let totalRows = req.body["totalRows_"+sectionNum];
    let pbRowData = [];

    //if the section is a panelboard, analyze the HTML elements names/values to set pbRowData
    if(req.body.pbCheck){
        //for each row
        for (let i = 0; i < totalRows; i++) {
            //if the rowType_# HTML element has a value of DUAL
            if (req.body["rowType_"+(i+1)] == 'DUAL') {
                //push to pbRowData
                pbRowData.push({
                    row: i+1,
                    configuration: "DUAL",
                    mounting: "LEFT",
                    frame: req.body["row"+(i+1)+"_frameL"]
                });
                pbRowData.push({
                    row: i+1,
                    configuration: "DUAL",
                    mounting: "RIGHT",
                    frame: req.body["row"+(i+1)+"_frameR"]
                });
            } else if (req.body["rowType_"+(i+1)] == 'SINGLE') {
            //if the rowType_# HTML element has a value of SINGLE
                //if the row_#_frameL HTML element exists
                if (req.body["row"+(i+1)+"_frameL"]) {
                    //push to pbRowData
                    pbRowData.push({
                        row: i+1,
                        configuration: "SINGLE",
                        mounting: "LEFT",
                        frame: req.body["row"+(i+1)+"_frameL"]
                    });
                } else if (req.body["row"+(i+1)+"_frameR"]) {
                //if the row_#_frameR HTML element exists
                    //push to pbRowData
                    pbRowData.push({
                        row: i+1,
                        configuration: "SINGLE",
                        mounting: "RIGHT",
                        frame: req.body["row"+(i+1)+"_frameR"]
                    });
                } else if (req.body["row"+(i+1)+"_frameCL"]) {
                //if the row_#_frameCL HTML element exists
                    //push to pbRowData
                    pbRowData.push({
                        row: i+1,
                        configuration: "SINGLE",
                        mounting: "CENTER - LEFT",
                        frame: req.body["row"+(i+1)+"_frameCL"]
                    });
                } else if (req.body["row"+(i+1)+"_frameCR"]) {
                //if the row_#_frameCR HTML element exists
                    //push to pbRowData
                    pbRowData.push({
                        row: i+1,
                        configuration: "SINGLE",
                        mounting: "CENTER - RIGHT",
                        frame: req.body["row"+(i+1)+"_frameCR"]
                    });
                }
            }
        }
        //if panelboard without main iccb, then set comp object as all panelboard
        if(req.body.pbCheck == 'noBrk'){
            comp = {
                A: 'panelboard',
                B: 'panelboard',
                C: 'panelboard',
                D: 'panelboard'
            };
        } else {
        //if panelboard with main iccb, then set comp object as brk in bottom D, and the rest panelboard
            comp = {
                A: 'panelboard',
                B: 'panelboard',
                C: 'panelboard',
                D: 'brk'
            }
        }
    } else {
    //if not a panelboard, then set comp object according to the user input for A, B, C, and D
        comp = {
            A: req.body.compA.split('_')[0],
            B: req.body.compB.split('_')[0],
            C: req.body.compC.split('_')[0],
            D: req.body.compD.split('_')[0]
        };
    }

    //set data
    let data = {
        secType: req.body.secType,
        brkType: req.body.brkType,
        secAmp: req.body.secAmp,
        secPoles: req.body.secPoles,
        secHeight: req.body.secHeight,
        secWidth: req.body.secWidth,
        secDepth: req.body.secDepth
    };

    //set applyToArr (used to let section configuration options apply to multiple sections to save time)
    let applyToArr = [];
    applyToArr.push(sectionNum);

    let apply = req.body.applyToCheck;

    //lookup submittalLayout row referenced by subID
    querySql("SELECT * FROM " + database + "." + dbConfig.submittal_layout_table + " WHERE subID = ?", subID)
        .then(layouts => {
            //set layoutID
            layoutID = layouts[0].layoutID;
            return null
        })
        .then(async function() {
            if (apply) {

                //if apply is an array
                if(apply instanceof Array) {
                    //for each section applied
                    for (let i = 0; i < apply.length; i++) {
                        //push to applyToArr
                        let temp = apply[i].split('o')[1];
                        applyToArr.push(temp);
                    }
                } else {
                    //push to applyToArr
                    let temp = apply.split('o')[1];
                    applyToArr.push(temp);
                }
            }

            /*for (let i = 0; i < applyToArr.length; i++) {
                await querySql("UPDATE " + database + "." + dbConfig.submittal_sections_table + " SET " +
                    "compType = JSON_SET(COALESCE(compType,'{}'), '$.A', ?, '$.B', ?, '$.C', ?, '$.D', ?), secType = ?, brkType = ?, secAmp = ?, secPoles = ?, secHeight = ?, secWidth = ?, secDepth = ? WHERE layoutID = ? AND sectionNum = ?",
                    [comp.A, comp.B, comp.C, comp.D, data.secType, data.brkType, data.secAmp, data.secPoles, data.secHeight, data.secWidth, data.secDepth, layoutID, applyToArr[i]]);
            }*/
            return null
        })
        .then(async function() {
            //for each section in the applyToArr
            for(let row of applyToArr) {
                //lookup the submittalSection row referenced by layoutID and sectionNum
                await querySql("SELECT * FROM " + database + "." + dbConfig.submittal_sections_table + " WHERE layoutID = ? " +
                    "AND sectionNum = ?", [layoutID, row])
                    .then(async function(rows){
                        //for each section returned (typically 1)
                        for(let row of rows){
                            //update the submittalBrk table removing the comp and secID properties (in order to "clean" the section, since the existing breakers might not work within the new section properties
                            await querySql("UPDATE " + database + "." + dbConfig.submittal_breaker_table + " SET " +
                                "comp = ?, secID = ? WHERE secID = ?", [null, null, row.secID]);
                        }

                        //sorry dood, i have no clue whats going on here but im pretty sure it works
                        if (row.compType == null) {
                            await querySql("UPDATE " + database + "." + dbConfig.submittal_sections_table + " SET " +
                                "compType = JSON_OBJECT('A', ?, 'B', ?, 'C', ?, 'D', ?), secType = ?, brkType = ?, secAmp = ?, secPoles = ?, secHeight = ?, secWidth = ?, secDepth = ? WHERE layoutID = ? AND sectionNum = ?",
                                [comp.A, comp.B, comp.C, comp.D, data.secType, data.brkType, data.secAmp, data.secPoles, data.secHeight, data.secWidth, data.secDepth, layoutID, row]);
                        } else {
                            await querySql("UPDATE " + database + "." + dbConfig.submittal_sections_table + " SET " +
                                "compType = JSON_SET(compType, '$.A', ?, '$.B', ?, '$.C', ?, '$.D', ?), secType = ?, brkType = ?, secAmp = ?, secPoles = ?, secHeight = ?, secWidth = ?, secDepth = ? WHERE layoutID = ? AND sectionNum = ?",
                                [comp.A, comp.B, comp.C, comp.D, data.secType, data.brkType, data.secAmp, data.secPoles, data.secHeight, data.secWidth, data.secDepth, layoutID, row]);
                        }
                    })
                    .catch(err => {
                        //if an error occurs at anytime at any point in the above code, log it to the console
                        console.log(err);
                    });
            }
            return null
        })
        .then(async function() {
            //if pbRowData exists
            if (pbRowData.length != 0) {
                //for each section in applyToArr
                for (let i = 0; i < applyToArr.length; i++) {
                    //lookup submittalSection table in the row referenced by layoutID and sectionNum
                    const section = await querySql("SELECT * FROM " + database + "." + dbConfig.submittal_sections_table + " WHERE layoutID = ? AND sectionNum = ?", [layoutID, applyToArr[i]]);
                    //set secID
                    let secID = section[0].secID;

                    //lookup submittalPanelBrk rows referenced by secID
                    const pbBreakers = await querySql("SELECT * FROM " + database + "." + dbConfig.submittal_panel_breakers + " WHERE secID = ?", secID);
                    //if pbBreakers exist
                    if (pbBreakers.length != 0) {
                        //for each breaker
                        for (let j = 0; j < pbRowData.length; j++) {
                            //if the configuration is SINGLE
                            if (pbRowData[j].configuration == 'SINGLE') {
                                //check if single breaker exists by looking up submittalPanelBrk rows referenced by secID and panelRow
                                const doesSingleBreakerExist = await querySql("SELECT * FROM " + database + "." + dbConfig.submittal_panel_breakers + " WHERE secID = ? AND panelRow = ?", [secID, pbRowData[j].row]);
                                if (doesSingleBreakerExist.length != 0) {
                                    //if exists, set the panelBrkID
                                    let panelBrkID = doesSingleBreakerExist[0].panelBrkID;
                                    //update the submittalPanelBrk table with the pbRowData in the row referenced by panelBrkID
                                    await querySql("UPDATE " + database + "." + dbConfig.submittal_panel_breakers + " SET configuration = ?, mounting = ?, frame = ? WHERE panelBrkID = ?", [pbRowData[j].configuration, pbRowData[j].mounting, pbRowData[j].frame, panelBrkID]);
                                } else {
                                    //insert new row into submittalPanelBrk table with pbRowData and secID
                                    await querySql("INSERT INTO " + database + "." + dbConfig.submittal_panel_breakers + " SET secID = ?, panelRow = ?, configuration = ?, mounting = ?, frame = ?", [secID, pbRowData[j].row, pbRowData[j].configuration, pbRowData[j].mounting, pbRowData[j].frame]);
                                }
                            } else if (pbRowData[j].configuration == 'DUAL') {
                            //if the configuration is DUAL
                                //check if dual breaker exists by looking up submittalPanelBrk rows referenced by secID and panelRow
                                const doesDualBreakerExist = await querySql("SELECT * FROM " + database + "." + dbConfig.submittal_panel_breakers + " WHERE secID = ? AND panelRow = ?", [secID, pbRowData[j].row]);
                                ///if exists, set the panelBrkArr as the array of both breakers details
                                if (doesDualBreakerExist.length != 0) {
                                    let panelBrkArr = [{
                                        panelBrkID: doesDualBreakerExist[0].panelBrkID,
                                        configuration: pbRowData[j].configuration,
                                        mounting: pbRowData[j].mounting,
                                        frame: pbRowData[j].frame
                                    }, {
                                        panelBrkID: doesDualBreakerExist[1].panelBrkID,
                                        configuration: pbRowData[j+1].configuration,
                                        mounting: pbRowData[j+1].mounting,
                                        frame: pbRowData[j+1].frame
                                    }];
                                    //for each breaker in panelBrkArr
                                    for (let panelBrk of panelBrkArr) {
                                        //update the submittalPanelBrk table with the details
                                        await querySql("UPDATE " + database + "." + dbConfig.submittal_panel_breakers + " SET configuration = ?, mounting = ?, frame = ? WHERE panelBrkID = ?", [panelBrk.configuration, panelBrk.mounting, panelBrk.frame, panelBrk.panelBrkID]);
                                    }
                                    j += 1;
                                } else {
                                    //set panelBrkArr with pbRowData
                                    let panelBrkArr = [{
                                        secID: secID,
                                        panelRow: pbRowData[j].row,
                                        configuration: pbRowData[j].configuration,
                                        mounting: pbRowData[j].mounting,
                                        frame: pbRowData[j].frame
                                    }, {
                                        secID: secID,
                                        panelRow: pbRowData[j+1].row,
                                        configuration: pbRowData[j+1].configuration,
                                        mounting: pbRowData[j+1].mounting,
                                        frame: pbRowData[j+1].frame
                                    }];
                                    //for each breaker
                                    for (let panelBrk of panelBrkArr) {
                                        //insert new row into submittalPanelBrk table
                                        await querySql("INSERT INTO " + database + "." + dbConfig.submittal_panel_breakers + " SET ?", panelBrk);
                                    }
                                    j += 1;
                                }
                            }
                        }

                        //for each breaker in pbBreakers
                        for (let row of pbBreakers) {
                            //filter pbRowData by panelRow, and if no entries exist, then delete row from submittalPanelBrk table
                            if (pbRowData.filter(e => e.row == row.panelRow).length == 0) {
                                await querySql("DELETE FROM " + database + "." + dbConfig.submittal_panel_breakers + " WHERE panelBrkID = ?", row.panelBrkID);
                            }
                        }
                    } else {
                        //for each row in pbRowData
                        for (let row of pbRowData) {
                            //insert new row into submittalPanelBrk table with row data
                            await querySql("INSERT INTO " + database + "." + dbConfig.submittal_panel_breakers + " SET secID = ?, panelRow = ?, configuration = ?, mounting = ?, frame = ?", [secID, row.row, row.configuration, row.mounting, row.frame]);
                        }
                    }
                }

            }
        })
        .then(() => {
            //redirect to searchSubmittal page
            res.locals = {title: 'Add Section'};
            res.redirect('../searchSubmittal/?subID='+jobRelease+"_"+subID);
            return null
        })
        .catch((err) => {
            //if an error occurs at anytime at any point in the above code, log it to the console
            return Promise.reject(err);
        });

};










/***********************************************
 BREAKERS IN SUBMITTAL
 ***********************************************/
//addBrk function
exports.addBrk = function(req, res) {
    //initialize/set variables
    let jobRelease = req.body.jobRelease;
    let accOpts = req.body.accOpts;
    let jobNum = jobRelease.slice(0, jobRelease.length - 1);
    let releaseNum = jobRelease.slice(jobRelease.length - 1, jobRelease.length);
    let data = [];
    let subID, layoutID;

    //Splitting up the device designation
    let designations = req.body.devDesignation;
    let designationArrayInitial = designations.split(',').map(item => item.trim());
    let designationArrayFinal = [];
    for (let i = 0; i < designationArrayInitial.length; i++) {
        if (designationArrayInitial[i].includes("(") == true) {
            let designationInterval = (designationArrayInitial[i].slice(designationArrayInitial[i].indexOf('(') + 1, designationArrayInitial[i].indexOf(')'))).split('-');
            let designationInitialText = designationArrayInitial[i].slice(0, designationArrayInitial[i].indexOf('('));
            let designationFinalText = designationArrayInitial[i].slice(designationArrayInitial[i].indexOf(')') + 1, designationArrayInitial[i].length);
            for (let j = parseInt(designationInterval[0]); j <= parseInt(designationInterval[1]); j++) {
                let newDesignation = designationInitialText + j.toString() + designationFinalText;
                designationArrayFinal.push(newDesignation);
            }
        } else {
            designationArrayFinal.push(designationArrayInitial[i]);
        }
    }


    //initialize variables
    let platform, devType, devMfg, devFrame, frameAmp;
    //if breaker being added is an ICCB
    if (req.body.iccbPlatform.length != 0) {
        //set variables
        platform = req.body.iccbPlatform;
        devType = 'ICCB';
        devMfg = 'ALL';
        devFrame = 'ALL';
        frameAmp = parseInt(req.body.devFrameSet.slice(0,req.body.devFrameSet.length - 1));
    } else if (req.body.mccbPlatform.length != 0) {
    //if breaker being added in an MCCB
        //         //get the selected platform
        platform = req.body.mccbPlatform;
        //if SQD
        if (platform == 'SQUARE D POWERPACT') {
            //set static variables
            devType = 'MCCB';
            devMfg = 'SQUARE D';
            //run a switch on the frame amperage to determine the frame
            switch (parseInt(req.body.devFrameSet.slice(0,req.body.devFrameSet.length - 1))) {
                case 150:
                    devFrame = 'H';
                    frameAmp = 150;
                    break;
                case 250:
                    devFrame = 'J';
                    frameAmp = 250;
                    break;
                case 400:
                    devFrame = 'L';
                    frameAmp = 400;
                    break;
                case 600:
                    devFrame = 'L';
                    frameAmp = 600;
                    break;
                case 800:
                    devFrame = 'P';
                    frameAmp = 800;
                    break;
                case 1200:
                    devFrame = 'P';
                    frameAmp = 1200;
                    break;
            }
        } else if (platform == 'ABB TMAX') {
        //if ABB TMAX
            //set static variables
            devType = 'MCCB';
            devMfg = 'ABB';
            //run a switch on the frame amperage to determine the frame
            switch (parseInt(req.body.devFrameSet.slice(0,req.body.devFrameSet.length - 1))) {
                case 125:
                    devFrame = 'XT2';
                    frameAmp = 125;
                    break;
                case 250:
                    devFrame = 'XT4';
                    frameAmp = 250;
                    break;
                case 600:
                    devFrame = 'XT5';
                    frameAmp = 600;
                    break;
                case 800:
                    devFrame = 'XT6';
                    frameAmp = 800;
                    break;
                case 1200:
                    devFrame = 'XT7';
                    frameAmp = 1200;
                    break;
            }
        }
    } else if (req.body.vcbPlatform.length != 0) {
    //if breaker being added is a VCB (i.e. mv breakers), set selected platform
        platform = req.body.vcbPlatform;
    }


    //lookup the submittalSum table row referenced by job num and release
    querySql("SELECT * FROM "+database+"."+dbConfig.submittal_summary_table+" WHERE (jobNum, releaseNum) = (?,?)",[jobNum, releaseNum])
        .then(async function(sub) {
            //set the subID
            subID = sub[0].subID;
            //lookup the submittalLayout table row referenced by subID
            return await querySql("SELECT * FROM "+database+"."+dbConfig.submittal_layout_table+" WHERE subID = ?",subID);
        })
        .then(async function(layout) {
            //set the layoutID
            layoutID = layout[0].layoutID;
            //for each breaker designation
            for(let row of designationArrayFinal) {
                //lookup the brkLugLanding table row corresponding with the breaker details
                const lugInfo = await querySql("SELECT * FROM "+database+"."+dbConfig.brk_lugLanding_table+" WHERE (devType, devMfg, devFrame, frameAmp) = (?,?,?,?)",[devType, devMfg, devFrame, frameAmp]);
                //push to data
                data.push({
                    layoutID: layoutID,
                    devDesignation: row.toUpperCase(),
                    devFunction: req.body.devFunction,
                    unitOfIssue: 'EA',
                    catCode: req.body.catCode,
                    platform: platform,
                    brkPN: req.body.brkPN,
                    cradlePN: req.body.cradlePN,
                    devMount: req.body.devMount,
                    rearAdaptType: req.body.rearAdaptType,
                    devUL: req.body.devUL,
                    devLevel: req.body.devLevel,
                    devOperation: req.body.devOperation,
                    devCtrlVolt: req.body.devCtrlVolt,
                    devMaxVolt: req.body.devMaxVolt,
                    devKAIC: req.body.devKAIC,
                    devFrameSet: req.body.devFrameSet,
                    devSensorSet: req.body.devSensorSet,
                    devTripSet: req.body.devTripSet,
                    devTripUnit: req.body.devTripUnit,
                    devTripParam: req.body.devTripParam,
                    devPoles: req.body.devPoles,
                    devLugQty: lugInfo[0].lugQty,
                    devLugType: lugInfo[0].lugType,
                    devLugSize: lugInfo[0].lugSize
                });
            }
            return null
        })
        .then(async function() {
            //initialize temp variable
            let temps = [];
            //for each breaker in data
            for (let row of data) {
                //insert row into the submittalBrk table
                await querySql("INSERT INTO " +  database + "." + dbConfig.submittal_breaker_table + " SET ? ", row)
                    .then(rows => {
                        //push to temps
                        temps.push(rows.insertId);
                    });
            }
            return temps
        })
        .then(async function(temps) {
            //lookup everything in the brkAccOptions table
            const accOptions = await querySql("SELECT * FROM " + database + "." + dbConfig.brkAcc_options_table);
            //for each breaker in temps
            for (let temp of temps) {
                //initialize accData
                let accData = [];
                //for each acc option
                for (let i = 0; i < accOptions.length; i++) {
                    //if 1, then push to accData
                    if (accOpts[i] == 1) {
                        accData.push({
                            devID: temp,
                            brkAccDropdownID: accOptions[i].brkAccDropdownID
                        });
                    }
                }
                //for each acc in accData
                for (let j = 0; j < accData.length; j++) {
                    //insert new row into the submittalBrkAcc table
                    await querySql("INSERT INTO " +  database + "." + dbConfig.submittal_brkAcc_table + " SET ? ", accData[j])
                }
            }
        })
        .then(() => {
            //redirect to searchSubmittal page
            res.locals = {title: 'Submittal'};
            res.redirect('../searchSubmittal/?subID='+jobNum+releaseNum+"_"+subID);
            return null;
        })
        .catch(err => {
            //if an error occurs at anytime at any point in the above code, log it to the console
            return Promise.reject(err);
        });

};








//copyBrk function
exports.copyBrk = function(req, res) {
    //initialize/set variables
    let urlObj = url.parse(req.originalUrl);
    urlObj.protocol = req.protocol;
    urlObj.host = req.get('host');
    let qs = queryString.parse(urlObj.search);
    let jobRelease = qs.subID.split('_')[0];
    let subID = qs.subID.split('_')[1];
    let layoutID = qs.layoutID;
    let copiedDevID = qs.devID;
    let newDevID;
    let newBrkData = [];
    let newAccData = [];

    //getCopyBrkData async function definition
    async function getCopyBrkData() {
        //lookup submittalBrk table in the row referenced by copied devID
        return await querySql("SELECT * FROM "+database+"."+dbConfig.submittal_breaker_table+" WHERE devID = ?", copiedDevID);
    }

    //getCopyAccData async function definition
    async function getCopyAccData() {
        //lookup submittalBrkAcc table in the row referenced by copied devID
        return await querySql("SELECT * FROM "+database+"."+dbConfig.submittal_brkAcc_table+" WHERE devID = ?", copiedDevID);
    }

    //execute getCopyBrkData function
    getCopyBrkData()
        .then(async function(brkData) {
            //for each breaker in returned brkData
            for (let breaker of brkData) {
                //push to newBrkData
                await newBrkData.push({
                    layoutID: layoutID,
                    devDesignation: breaker.devDesignation,
                    devFunction: breaker.devFunction,
                    unitOfIssue: breaker.unitOfIssue,
                    catCode: breaker.catCode,
                    platform: breaker.platform,
                    brkPN: breaker.brkPN,
                    cradlePN: breaker.cradlePN,
                    devMount: breaker.devMount,
                    rearAdaptType: breaker.rearAdaptType,
                    devUL: breaker.devUL,
                    devLevel: breaker.devLevel,
                    devOperation: breaker.devOperation,
                    devCtrlVolt: breaker.devCtrlVolt,
                    devMaxVolt: breaker.devMaxVolt,
                    devKAIC: breaker.devKAIC,
                    devFrameSet: breaker.devFrameSet,
                    devSensorSet: breaker.devSensorSet,
                    devTripSet: breaker.devTripSet,
                    devTripUnit: breaker.devTripUnit,
                    devTripParam: breaker.devTripParam,
                    devPoles: breaker.devPoles,
                    devLugQty: breaker.devLugQty,
                    devLugType: breaker.devLugType,
                    devLugSize: breaker.devLugSize
                });
            }

            //for each new breaker
            for (let newBreaker of newBrkData) {
                //insert a row into the submittalBrk table with newBreaker data
                const brkInsert = await querySql("INSERT INTO "+database+"."+dbConfig.submittal_breaker_table+" SET ?", newBreaker);
                //also get the id using the .insertId property of an sql INSERT query
                newDevID = brkInsert.insertId;
            }
            //execute getCopyAccData
            return getCopyAccData();
        })
        .then(async function(accData) {
            //for each acc
            for (let acc of accData) {
                //push to newAccData
                newAccData.push({
                    brkAccDropdownID: acc.brkAccDropdownID,
                    devID: newDevID
                });
            }
            //for each new acc
            for (let newAcc of newAccData) {
                //insert new row into submittalBrkAcc table with newAcc data
                await querySql("INSERT INTO "+database+"."+dbConfig.submittal_brkAcc_table+" SET ?", newAcc);
            }
            return null;
        })
        .then(() => {
            //redirect to searchSubmittal page
            res.locals = {title: 'Submittal'};
            res.redirect('../searchSubmittal/?subID='+jobRelease+"_"+subID);
            return null;
        })
        .catch(err => {
            //if an error occurs at anytime at any point in the above code, log it to the console
            return Promise.reject(err);
        });

};







//editBrk function
exports.editBrk = function(req, res) {
    //initialize/set variables
    let urlObj = url.parse(req.originalUrl);
    urlObj.protocol = req.protocol;
    urlObj.host = req.get('host');
    let qs = queryString.parse(urlObj.search);
    let jobRelease = qs.subID.split('_')[0];
    let subID = qs.subID.split('_')[1];
    let layoutID = qs.layoutID;
    let devID = qs.devID;
    let newAccOpts = req.body.accOpts;

    //initialize variables
    let platform, devType, devMfg, devFrame, frameAmp;
    //if breaker being added is an ICCB
    if (req.body.iccbPlatform.length != 0) {
        //set variables
        platform = req.body.iccbPlatform;
        devType = 'ICCB';
        devMfg = 'ALL';
        devFrame = 'ALL';
        frameAmp = parseInt(req.body.devFrameSet.slice(0,req.body.devFrameSet.length - 1));
    } else if (req.body.mccbPlatform.length != 0) {
    //if breaker being added in an MCCB
        //get the selected platform
        platform = req.body.mccbPlatform;
        //if SQD
        if (platform == 'SQUARE D POWERPACT') {
            //set static variables
            devType = 'MCCB';
            devMfg = 'SQUARE D';
            //run a switch on the frame amperage to determine the frame
            switch (parseInt(req.body.devFrameSet.slice(0,req.body.devFrameSet.length - 1))) {
                case 150:
                    devFrame = 'H';
                    frameAmp = 150;
                    break;
                case 250:
                    devFrame = 'J';
                    frameAmp = 250;
                    break;
                case 400:
                    devFrame = 'L';
                    frameAmp = 400;
                    break;
                case 600:
                    devFrame = 'L';
                    frameAmp = 600;
                    break;
                case 800:
                    devFrame = 'P';
                    frameAmp = 800;
                    break;
                case 1200:
                    devFrame = 'P';
                    frameAmp = 1200;
                    break;
            }
        } else if (platform == 'ABB TMAX') {
        //if ABB TMAX
            //set static variables
            devType = 'MCCB';
            devMfg = 'ABB';
            //run a switch on the frame amperage to determine the frame
            switch (parseInt(req.body.devFrameSet.slice(0,req.body.devFrameSet.length - 1))) {
                case 125:
                    devFrame = 'XT2';
                    frameAmp = 125;
                    break;
                case 250:
                    devFrame = 'XT4';
                    frameAmp = 250;
                    break;
                case 400:
                    devFrame = 'XT5';
                    frameAmp = 600;
                    break;
                case 600:
                    devFrame = 'XT5';
                    frameAmp = 600;
                    break;
                case 800:
                    devFrame = 'XT6';
                    frameAmp = 800;
                    break;
                case 1200:
                    devFrame = 'XT7';
                    frameAmp = 1200;
                    break;
            }
        }
    } else if (req.body.vcbPlatform.length != 0) {
    //if breaker being added is a VCB (i.e. mv breakers), set selected platform
        platform = req.body.vcbPlatform;
    }

    //lookup the brkLugLanding table row using the breaker details
    querySql("SELECT * FROM "+database+"."+dbConfig.brk_lugLanding_table+" WHERE (devType, devMfg, devFrame, frameAmp) = (?,?,?,?)",[devType, devMfg, devFrame, frameAmp])
        .then(async function(lugInfo) {
            //initialize/set newBrkData
            let newBrkData = {
                layoutID: layoutID,
                devDesignation: req.body.devDesignation,
                devFunction: req.body.devFunction,
                unitOfIssue: 'EA',
                catCode: req.body.catCode,
                platform: platform,
                brkPN: req.body.brkPN,
                cradlePN: req.body.cradlePN,
                devMount: req.body.devMount,
                rearAdaptType: req.body.rearAdaptType,
                devUL: req.body.devUL,
                devLevel: req.body.devLevel,
                devOperation: req.body.devOperation,
                devCtrlVolt: req.body.devCtrlVolt,
                devMaxVolt: req.body.devMaxVolt,
                devKAIC: req.body.devKAIC,
                devFrameSet: req.body.devFrameSet,
                devSensorSet: req.body.devSensorSet,
                devTripSet: req.body.devTripSet,
                devTripUnit: req.body.devTripUnit,
                devTripParam: req.body.devTripParam,
                devPoles: req.body.devPoles,
                devLugQty: lugInfo[0].lugQty,
                devLugType: lugInfo[0].lugType,
                devLugSize: lugInfo[0].lugSize
            };

            //update submittalBrk table with newBrkData in the row referenced by devID
            await querySql("UPDATE "+database+"."+dbConfig.submittal_breaker_table+" SET ? WHERE devID = ?", [newBrkData, devID]);
            return null
        })
        .then(async function() {
            //lookup everything in the brkAccOptions table
            const accOptions = await querySql("SELECT * FROM " + database + "." + dbConfig.brkAcc_options_table);
            //initialize accData
            let accData = [];
            //for each option in accOptions
            for (let i = 0; i < accOptions.length; i++) {
                //if 1, then push to accData
                if (newAccOpts[i] == 1) {
                    accData.push({
                        devID: devID,
                        brkAccDropdownID: accOptions[i].brkAccDropdownID
                    });
                }
            }

            //delete row from submittalBrkAcc table corresponding with devID
            await querySql("DELETE FROM " + database + "." + dbConfig.submittal_brkAcc_table + " WHERE devID = ?",devID);

            //for each acc in accData
            for (let j = 0; j < accData.length; j++) {
                //insert new row into submittalBrkAcc table
                await querySql("INSERT INTO " +  database + "." + dbConfig.submittal_brkAcc_table + " SET ? ", accData[j])
            }

        })
        .then(() => {
            //redirect to seaerchSubmittal page
            res.locals = {title: 'Submittal'};
            res.redirect('../searchSubmittal/?subID='+jobRelease+"_"+subID);
            return null;
        })
        .catch(err => {
            //if an error occurs at anytime at any point in the above code, log it to the console
            return Promise.reject(err);
        });
};








//deleteBrk function
exports.deleteBrk = function(req, res) {
    //initialize/set variables
    let urlObj = url.parse(req.originalUrl);
    urlObj.protocol = req.protocol;
    urlObj.host = req.get('host');
    let qs = queryString.parse(urlObj.search);
    let jobRelease = qs.subID.split('_')[0];
    let subID = qs.subID.split('_')[1];
    let devID = qs.devID;

    //delete row from submittalBrk table corresponding to devID
    querySql("DELETE FROM "+database+"."+dbConfig.submittal_breaker_table+" WHERE devID = ?", devID)
        .then(() => {
            //redirect to searchSubmittal page
            res.locals = {title: 'Submittal'};
            res.redirect('../searchSubmittal/?subID='+jobRelease+"_"+subID);
            return null;
        })
        .catch(err => {
            //if an error occurs at anytime at any point in the above code, log it to the console
            return Promise.reject(err);
        });
};










/***********************************************
 CREOSON SUBMITTAL
 ***********************************************/

//setWD function
exports.setWD = function(req, res) {
    //initialize/set variables
    let urlObj = url.parse(req.originalUrl);
    urlObj.protocol = req.protocol;
    urlObj.host = req.get('host');
    let qs = queryString.parse(urlObj.search);
    let jobRelease = qs.subID.split('_')[0];
    let subID = qs.subID.split('_')[1];

    creoWorkingDir = req.body.workingDir;
    creoStandardLib = req.body.standardLib;

    //cdAndCreateOutputDir async function definition
    async function cdAndCreateOutputDir() {
        //pass the current creo wd to dir variable
        let dir = await creo(sessionId, {
            command: "creo",
            function: "pwd",
            data: {}
        });

        //if dir.data exists
        if (dir.data != undefined) {
            //if the current directory is not creoWorkingDir, then set it
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

    //execute cdAndCreateOutputDir
    cdAndCreateOutputDir()
        .then(() => {
            //redirect to searchSubmittal page
            res.locals = {title: 'Submittal'};
            res.redirect('../searchSubmittal/?subID='+jobRelease+"_"+subID);
            return null;
        })
        .catch(err => {
            //if an error occurs at anytime at any point in the above code, log it to the console
            return Promise.reject(err);
        });
};







//generateSubmittal function
exports.generateSubmittal = function(req, res) {
    req.setTimeout(0); //no timeout (this is needed to prevent error due to page taking a long time to load)
    //initialize/set variables
    let urlObj = url.parse(req.originalUrl);
    urlObj.protocol = req.protocol;
    urlObj.host = req.get('host');
    let qs = queryString.parse(urlObj.search);
    let jobRelease = qs.subID.split('_')[0];
    let subID = qs.subID.split('_')[1];
    let jobNum = jobRelease.slice(0,6);
    let releaseNum = jobRelease.slice(jobRelease.length - 1, jobRelease.length);
    let layoutNum = releaseNum.toLowerCase().charCodeAt(0) - 96;
    let asmNum;
    if (layoutNum < 10) {
        asmNum = "00"+layoutNum.toString();
    } else {
        asmNum = "0"+layoutNum;
    }
    let jobData, layoutID;
    let sectionData = [];
    let uniqueSections = [];
    let sortedSectionSum = [];
    let creoData = [];
    let breakerData = [];
    let creoPanelData = [];
    let message = null;

    //checkWorkingDirAndStandardLib async function definition
    async function checkWorkingDirAndStandardLib() {
        //if either workingDir or standard library is null
        if (creoWorkingDir == null || creoStandardLib == null) {
            //set message
            message = {
                location: 2,
                text: 'Please set the location of the Working Directory as well as the Standard Library'
            };
            //execute the searchSubmittalRoutine function (defined at beginning of file)
            await searchSubmittalRoutine(subID, res, message);
            //exit
            return 'STOP';
        } else {
            return null
        }
    }

    //getSectionDetails async function definition
    async function getSectionDetails() {
        //lookup submittalLayout table row referenced by subID
        const layouts = await querySql("SELECT * FROM " + database + "." + dbConfig.submittal_layout_table + " WHERE subID = ?", subID);
        //for each layout
        for (let layout of layouts) {
            layoutID = layout.layoutID;
        }
        //lookup submittalSection table rows referenced by layoutID
        const sections = await querySql("SELECT * FROM "+ database + "." +dbConfig.submittal_sections_table + " WHERE layoutID = ?", layoutID);

        //for each section
        for (let section of sections) {
            //initialize/set sectionNum with leading zeros accordingly
            let sectionNum;
            if (layoutNum < 10 && section.sectionNum < 10) {
                sectionNum = layoutNum.toString() + "0" + section.sectionNum.toString();
            } else if (layoutNum >= 10 || section.sectionNum >= 10) {
                sectionNum = layoutNum.toString() + section.sectionNum.toString();
            }
            //push to sectionData
            sectionData.push({
                secID: section.secID,
                layoutID: layoutID,
                sectionNum: sectionNum,
                compType: section.compType,
                secType: section.secType,
                brkType: section.brkType,
                secAmp: section.secAmp,
                secPoles: section.secPoles,
                secHeight: section.secHeight,
                secWidth: section.secWidth,
                secDepth: section.secDepth
            })
        }
        return null
    }

    //getBreakerDetails function
    async function getBreakerDetails() {
        //lookup submittalBrk table rows referenced by layoutID
        const breakers = await querySql("SELECT * FROM " + database + "." + dbConfig.submittal_breaker_table + " WHERE layoutID = ?", layoutID);

        //for each breaker
        for (let breaker of breakers) {
            //push to breakerData
            breakerData.push({
                devID: breaker.devID,
                layoutID: breaker.layoutID,
                secID: breaker.secID,
                comp: breaker.comp,
                devDesignation: breaker.devDesignation,
                devFunction: breaker.devFunction,
                platform: breaker.platform,
                unitOfIssue: breaker.unitOfIssue,
                catCode: breaker.catCode,
                brkPN: breaker.brkPN,
                cradlePN: breaker.cradlePN,
                devMount: breaker.devMount,
                rearAdaptType: breaker.rearAdaptType,
                devUL: breaker.devUL,
                devLevel: breaker.devLevel,
                devOperation: breaker.devOperation,
                devCtrlVolt: breaker.devCtrlVolt,
                devMaxVolt: breaker.devMaxVolt,
                devKAIC: breaker.devKAIC,
                devFrameSet: breaker.devFrameSet,
                devSensorSet: breaker.devSensorSet,
                devTripSet: breaker.devTripSet,
                devTripUnit: breaker.devTripUnit,
                devTripParam: breaker.devTripParam,
                devPoles: breaker.devPoles,
                devLugQty: breaker.devLugQty,
                devLugType: breaker.devLugType,
                devLugSize: breaker.devLugSize
            });
        }
        return null;
    }

    //getPanelDetails async function definition
    async function getPanelDetails() {
        //lookup submittalSection table row referenced by layoutID
        const sections = await querySql("SELECT * FROM " + database + "." + dbConfig.submittal_sections_table + " WHERE layoutID = ?", [layoutID]);
        //for each section
        for (let section of sections) {
            if (section.secType.includes(' - ') == true) {
                //if secType is PANELBOARD
                if (section.secType.split(' - ')[0] == 'PANELBOARD') {
                    //initialize panelData
                    let panelData = [];
                    //lookup submittalPanelBrk table rows referenced by secID
                    let panels = await querySql("SELECT * FROM " + database + "." + dbConfig.submittal_panel_breakers + " WHERE secID = ?", [section.secID]);

                    //if panels exist (panels => rows on a panel board => single or double breakers)
                    if (panels.length > 0) {
                        let panelType = section.secType.split(' - ')[1];
                        //for each row
                        for (let panel of panels) {
                            //push to panelData
                            panelData.push({
                                panelBrkID: panel.panelBrkID,
                                secID: panel.secID,
                                devID: panel.devID,
                                panelRow: panel.panelRow,
                                configuration: panel.configuration,
                                mounting: panel.mounting,
                                frame: panel.frame
                            });
                        }
                        //initialize maxRow
                        let maxRow = 0;
                        //for each panel row
                        for (let row of panelData) {
                            if (row.panelRow > maxRow) {
                                //overwrite maxRow
                                maxRow = row.panelRow;
                            }
                        }

                        //initialize/set mainLug
                        let mainLug;
                        switch (panelType) {
                            case 'MAIN LUG (T)':
                                mainLug = 'TOP';
                                break;
                            case 'MAIN LUG (B)':
                                mainLug = 'BOTTOM';
                                break;
                            case 'NO MAIN LUG':
                                mainLug = 'NONE';
                                break;
                        }

                        //if panelData exists
                        if (panelData.length > 0) {
                            //push to creoPanelData
                            creoPanelData.push({
                                secID: panelData[0].secID,
                                mainLug: mainLug,
                                rows: []
                            });
                        }

                        //for each row
                        for (let i = 0; i < maxRow; i++) {
                            //set rowData
                            let rowData = panelData.filter(e => e.panelRow == i + 1);

                            //if multiple entries, then push each to creoPanelData
                            if (rowData.length == 2) {
                                creoPanelData.filter(e => e.secID == rowData[0].secID)[0].rows.push({
                                    panelRow: rowData[0].panelRow,
                                    configuration: rowData[0].configuration,
                                    breakers: [{
                                        mount: rowData[0].mounting,
                                        devID: rowData[0].devID,
                                        frame: rowData[0].frame
                                    }, {
                                        mount: rowData[1].mounting,
                                        devID: rowData[1].devID,
                                        frame: rowData[1].frame
                                    }]
                                });

                            } else if (rowData.length == 1) {
                                //if single entry, then push to creoPanelData
                                creoPanelData.filter(e => e.secID == rowData[0].secID)[0].rows.push({
                                    panelRow: rowData[0].panelRow,
                                    configuration: rowData[0].configuration,
                                    breakers: [{
                                        mount: rowData[0].mounting,
                                        devID: rowData[0].devID,
                                        frame: rowData[0].frame
                                    }]
                                });
                            }
                        }
                    }
                }
            }
        }
        return null
    }

    //getCreoData async function definition
    async function getCreoData() {

        //pass the workingDir to dir
        let dir = await creo(sessionId, {
            command: "creo",
            function: "pwd",
            data: {}
        });
        //if no dir.data then set wd
        if (dir.data == undefined) {
            await creo(sessionId, {
                command: "creo",
                function: "cd",
                data: {
                    "dirname": creoWorkingDir
                }
            });
        } else {
        //if dirnames dont match, then set it
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
        //push to creoData
        creoData.push({
            workingDir: creoWorkingDir,
            standardLib: creoStandardLib
        });
        return null
    }

    //saveStandardFrame async function defintion
    async function saveStandardFrame(mainFramePN, secData) {
        //open frame generic in standard library
        await creo(sessionId, {
            command: "file",
            function: "open",
            data: {
                file: "000123-0010-000.asm",
                dirname: creoData[0].standardLib,
                display: true,
                activate: true
            }
        });


        //****************VERY IMPORTANT********************
        //save as, but with a variable name mapkey
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
                    "~ Update `file_saveas` `Inputname` " + "`" + mainFramePN + "`;" +
                    "~ Activate `file_saveas` `OK`;~ Activate `assyrename` `OpenBtn`;"
            }
        });

        //open the mainFramePN asm
        await creo(sessionId, {
            command: "file",
            function: "open",
            data: {
                file: mainFramePN+".asm"
            }
        });

        //set the SEC_HEIGHT parameter
        await creo(sessionId, {
            command: "parameter",
            function: "set",
            data: {
                file: mainFramePN+".asm",
                name: "SEC_HEIGHT",
                type: "INTEGER",
                value: secData.secHeight
            }
        });

        //set the SEC_WIDTH parameter
        await creo(sessionId, {
            command: "parameter",
            function: "set",
            data: {
                file: mainFramePN+".asm",
                name: "SEC_WIDTH",
                type: "INTEGER",
                value: secData.secWidth
            }
        });

        //set the SEC_DEPTH parameter
        await creo(sessionId, {
            command: "parameter",
            function: "set",
            data: {
                file: mainFramePN+".asm",
                name: "SEC_DEPTH",
                type: "INTEGER",
                value: secData.secDepth
            }
        });

        //execute the regenAndSave helper function
        await regenAndSave(sessionId, mainFramePN+".asm");
        return null
    }

    //assembleUniqueBaseFrameAndCornerPost async function definition
    async function assembleUniqueBaseFrameAndCornerPost() {
        //lookupp everything from the baseFrames table and write it to baseFrames
        let baseFrames = await querySql("SELECT * FROM " + database + "." + dbConfig.baseFrame_table);
        //lookup everything from the cornerPosts table and write it to cornerPosts
        let cornerPosts = await querySql("SELECT * FROM " + database + "." + dbConfig.cornerPost_table);

        //for each unique section
        for (let uniqueSection of uniqueSections) {
            //initialize variables
            let uniqueBaseFrame;
            let uniqueFrontCPost;
            let uniqueRearCPost;
            //for each baseFrame
            for (let baseFrame of baseFrames) {
                //if width and depth match, then set uniqueBaseFrame
                if (baseFrame.frameWidth == uniqueSection.secData.secWidth && baseFrame.frameDepth == uniqueSection.secData.secDepth ) {
                    uniqueBaseFrame = baseFrame.frameAsm;
                }
            }

            //if unique section type is SWITCHBOARD - UL891
            if (uniqueSection.secData.secType == 'SWITCHBOARD - UL891') {
                //if unique section's breaker type is MASTERPACT NW (SQUARE D) - DRAWOUT
                if (uniqueSection.secData.brkType == 'MASTERPACT NW (SQUARE D) - DRAWOUT') {
                    //for each corenerPost
                    for (let cornerPost of cornerPosts) {
                        //if the heights match and CPostType is NW DRAWOUT, then set uniqueFrontCPost
                        if (cornerPost.CPostHeight == uniqueSection.secData.secHeight && cornerPost.CPostType == 'NW DRAWOUT' ) {
                            uniqueFrontCPost = {
                                generic: cornerPost.partGeneric,
                                instance: cornerPost.partInstance
                            }
                        }
                        //if the heights match and CPostType is SHORT, then set uniqueFrontCPost
                        if (cornerPost.CPostHeight == uniqueSection.secData.secHeight && cornerPost.CPostType == 'SHORT' ) {
                            uniqueRearCPost = {
                                generic: cornerPost.partGeneric,
                                instance: cornerPost.partInstance
                            }
                        }
                    }
                } else if (uniqueSection.secData.brkType == 'MASTERPACT NW (SQUARE D) - FIXED') {
                //if unique section's breaker type is MASTERPACT NW (SQUARE D) - FIXED
                    //for each cornerPost
                    for (let cornerPost of cornerPosts) {
                        //if the heights match and CPostType is NW FIXED, then set uniqueFrontCPost
                        if (cornerPost.CPostHeight == uniqueSection.secData.secHeight && cornerPost.CPostType == 'NW FIXED' ) {
                            uniqueFrontCPost = {
                                generic: cornerPost.partGeneric,
                                instance: cornerPost.partInstance
                            }
                        }
                        //if the heights match and CPostType is SHORT, then set uniqueFrontCPost
                        if (cornerPost.CPostHeight == uniqueSection.secData.secHeight && cornerPost.CPostType == 'SHORT' ) {
                            uniqueRearCPost = {
                                generic: cornerPost.partGeneric,
                                instance: cornerPost.partInstance
                            }
                        }
                    }
                } else if (uniqueSection.secData.brkType == 'EMAX2 (ABB) - DRAWOUT') {
                //if unique section's breaker type is EMAX2 (ABB) - DRAWOUT
                    //for each cornerPost
                    for (let cornerPost of cornerPosts) {
                        //if the heights match and CPostType is EMAX2 DRAWOUT, then set uniqueFrontCPost
                        if (cornerPost.CPostHeight == uniqueSection.secData.secHeight && cornerPost.CPostType == 'EMAX2 DRAWOUT') {
                            uniqueFrontCPost = {
                                generic: cornerPost.partGeneric,
                                instance: cornerPost.partInstance
                            }
                        }
                        //if the heights match and CPostType is SHORT, then set uniqueFrontCPost
                        if (cornerPost.CPostHeight == uniqueSection.secData.secHeight && cornerPost.CPostType == 'SHORT') {
                            uniqueRearCPost = {
                                generic: cornerPost.partGeneric,
                                instance: cornerPost.partInstance
                            }
                        }
                    }
                } else if (uniqueSection.secData.brkType == 'EMAX2 (ABB) - FIXED') {
                //if unique section's breaker type is EMAX2 (ABB) - FIXED
                    //for each cornerPost
                    for (let cornerPost of cornerPosts) {
                        //if the heights match and CPostType is EMAX2 FIXED, then set uniqueFrontCPost
                        if (cornerPost.CPostHeight == uniqueSection.secData.secHeight && cornerPost.CPostType == 'EMAX2 FIXED') {
                            uniqueFrontCPost = {
                                generic: cornerPost.partGeneric,
                                instance: cornerPost.partInstance
                            }
                        }
                        //if the heights match and CPostType is SHORT, then set uniqueFrontCPost
                        if (cornerPost.CPostHeight == uniqueSection.secData.secHeight && cornerPost.CPostType == 'SHORT') {
                            uniqueRearCPost = {
                                generic: cornerPost.partGeneric,
                                instance: cornerPost.partInstance
                            }
                        }
                    }
                }
            } else if (uniqueSection.secData.secType == 'PANELBOARD - MAIN LUG (T)' || uniqueSection.secData.secType == 'PANELBOARD - MAIN LUG (B)' || uniqueSection.secData.secType == 'PANELBOARD - NO MAIN LUG') {
            //if unique section type is either PANELBOARD - MAIN LUG (T), PANELBOARD - MAIN LUG (B), or PANELBOARD - NO MAIN LUG
                //for each corenerPost
                for (let cornerPost of cornerPosts) {
                    //if the heights match and CPostType is SHORT, then set uniqueFrontCPost
                    if (cornerPost.CPostHeight == uniqueSection.secData.secHeight && cornerPost.CPostType == 'SHORT' ) {
                        uniqueFrontCPost = {
                            generic: cornerPost.partGeneric,
                            instance: cornerPost.partInstance
                        }
                    }
                    //if the heights match and CPostType is SHORT, then set uniqueFrontCPost
                    if (cornerPost.CPostHeight == uniqueSection.secData.secHeight && cornerPost.CPostType == 'SHORT' ) {
                        uniqueRearCPost = {
                            generic: cornerPost.partGeneric,
                            instance: cornerPost.partInstance
                        }
                    }
                }
            } else if (uniqueSection.secData.secType == 'CONTROL') {
            //if unique section type is CONTROL AND brkType is n/a
                if (uniqueSection.secData.brkType == 'N/A') {
                   //if secDepth > 20
                    if (uniqueSection.secData.secDepth > 20) {
                        //for each corenerPost
                        for (let cornerPost of cornerPosts) {
                            //if the heights match and CPostType is NW DRAWOUT, then set uniqueFrontCPost
                            if (cornerPost.CPostHeight == uniqueSection.secData.secHeight && cornerPost.CPostType == 'NW DRAWOUT' ) {
                                uniqueFrontCPost = {
                                    generic: cornerPost.partGeneric,
                                    instance: cornerPost.partInstance
                                }
                            }
                            //if the heights match and CPostType is SHORT, then set uniqueFrontCPost
                            if (cornerPost.CPostHeight == uniqueSection.secData.secHeight && cornerPost.CPostType == 'SHORT' ) {
                                uniqueRearCPost = {
                                    generic: cornerPost.partGeneric,
                                    instance: cornerPost.partInstance
                                }
                            }
                        }
                    } else {
                    //if secDepth =< 20
                        //for each cornerPost
                        for (let cornerPost of cornerPosts) {
                            //if the heights match and CPostType is NW FIXED, then set uniqueFrontCPost
                            if (cornerPost.CPostHeight == uniqueSection.secData.secHeight && cornerPost.CPostType == 'NW FIXED' ) {
                                uniqueFrontCPost = {
                                    generic: cornerPost.partGeneric,
                                    instance: cornerPost.partInstance
                                }
                            }
                            //if the heights match and CPostType is SHORT, then set uniqueFrontCPost
                            if (cornerPost.CPostHeight == uniqueSection.secData.secHeight && cornerPost.CPostType == 'SHORT' ) {
                                uniqueRearCPost = {
                                    generic: cornerPost.partGeneric,
                                    instance: cornerPost.partInstance
                                }
                            }
                        }
                    }

                }
            }

            //open main frame file
            await creo(sessionId, {
                command: "file",
                function: "open",
                data: {
                    file: uniqueSection.mainFramePN+".asm"
                }
            });

            //assemble the unique base frame into the main frame (bottom) using csys (coord. sys)
            await creo(sessionId, {
                command: "file",
                function: "assemble",
                data: {
                    file: uniqueBaseFrame+".asm",
                    into_asm: uniqueSection.mainFramePN+".asm",
                    constraints: [{
                        "asmref": "ASM_DEF_CSYS",
                        "compref": "ASM_DEF_CSYS",
                        "type": "csys"
                    }],
                }
            });

            //assemble the unique base frame into the main frame (top) using csys (coord. sys)
            await creo(sessionId, {
                command: "file",
                function: "assemble",
                data: {
                    file: uniqueBaseFrame+".asm",
                    into_asm: uniqueSection.mainFramePN+".asm",
                    constraints: [{
                        "asmref": "CSYS_FRONT_ROOF",
                        "compref": "ASM_TOP_CSYS",
                        "type": "csys"
                    }],
                }
            });

            //assemble the unique front corner post into the main frame (front right) using csys
            await creo(sessionId, {
                command: "file",
                function: "assemble",
                data: {
                    file: uniqueFrontCPost.instance+".asm",
                    generic: uniqueFrontCPost.generic,
                    into_asm: uniqueSection.mainFramePN+".asm",
                    constraints: [{
                        "asmref": "CPOST_FR",
                        "compref": "ASM_DEF_CSYS",
                        "type": "csys"
                    }],
                }
            });

            //assemble the unique front corner post into the main frame (front left) using csys
            await creo(sessionId, {
                command: "file",
                function: "assemble",
                data: {
                    file: uniqueFrontCPost.instance+".asm",
                    generic: uniqueFrontCPost.generic,
                    into_asm: uniqueSection.mainFramePN+".asm",
                    constraints: [{
                        "asmref": "CPOST_FL",
                        "compref": "ASM_DEF_CSYS",
                        "type": "csys"
                    }],
                }
            });

            //assemble the unique front corner post into the main frame (back right) using csys
            await creo(sessionId, {
                command: "file",
                function: "assemble",
                data: {
                    file: uniqueRearCPost.instance+".asm",
                    generic: uniqueRearCPost.generic,
                    into_asm: uniqueSection.mainFramePN+".asm",
                    constraints: [{
                        "asmref": "CPOST_BR",
                        "compref": "ASM_DEF_CSYS",
                        "type": "csys"
                    }],
                }
            });

            //assemble the unique front corner post into the main frame (back left) using csys
            await creo(sessionId, {
                command: "file",
                function: "assemble",
                data: {
                    file: uniqueRearCPost.instance+".asm",
                    generic: uniqueRearCPost.generic,
                    into_asm: uniqueSection.mainFramePN+".asm",
                    constraints: [{
                        "asmref": "CPOST_BL",
                        "compref": "ASM_DEF_CSYS",
                        "type": "csys"
                    }],
                }
            });

            //execute regenAndSave helper function
            await regenAndSave(sessionId,uniqueSection.mainFramePN+".asm")
        }
        return null
    }

    //generateDistinctSections async function definition
    async function generateDistinctSections(section) {
        //open standard start section asm
        await creo(sessionId, {
            command: "file",
            function: "open",
            data: {
                file: "000123-0101-100.asm",
                activate: true,
                display: true
            }
        });

        //save as with variable name mapkey
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
                    "~ Update `file_saveas` `Inputname` " + "`" + section.sectionPN + "`;" +
                    "~ Activate `file_saveas` `OK`;~ Activate `assyrename` `OpenBtn`;"
            }
        });

        //close section file
        await creo(sessionId, {
            command: "file",
            function: "close",
            data: {
                file: section.sectionPN
            }
        });

        return null
    }

    //resizeSectionParamsAndAssembleFrame async function definition
    async function resizeSectionParamsAndAssembleFrame(section) {
        await creo(sessionId, {
            command: "file",
            function: "open",
            data: {
                file: section.sectionPN
            }
        });

        await creo(sessionId, {
            command: "parameter",
            function: "set",
            data: {
                file: section.sectionPN,
                name: "SEC_HEIGHT",
                type: "DOUBLE",
                value: section.secHeight
            }
        });

        await creo(sessionId, {
            command: "parameter",
            function: "set",
            data: {
                file: section.sectionPN,
                name: "SEC_WIDTH",
                type: "DOUBLE",
                value: section.secWidth
            }
        });

        await creo(sessionId, {
            command: "parameter",
            function: "set",
            data: {
                file: section.sectionPN,
                name: "SEC_DEPTH",
                type: "DOUBLE",
                value: section.secDepth
            }
        });

        await creo(sessionId, {
            command: "file",
            function: "regenerate",
            data: {
                file: section.sectionPN
            }
        });

        await creo(sessionId, {
            command: "file",
            function: "assemble",
            data: {
                file: section.mainFramePN,
                into_asm: section.sectionPN,
                constraints: [{
                    asmref: "ASM_DEF_CSYS",
                    compref: "ASM_DEF_CSYS",
                    type: "csys"
                }]
            }
        });
        await regenSaveAndClose(sessionId, section.sectionPN);
        return null
    }
    async function findBrkCompartmentAndAssemble() {
        const compartmentsNW = await querySql("SELECT * FROM " + database + "." + dbConfig.brkCompartment_NW_table);
        const breakersNW = await querySql("SELECT * FROM " + database + "." + dbConfig.brk_NW_table);

        const compartmentsEmax2 = await querySql("SELECT * FROM " + database + "." + dbConfig.brkCompartment_Emax2_table);
        const breakersEmax2 = await querySql("SELECT * FROM " + database + "." + dbConfig.brk_Emax2_table);


        let count = 1;

        let usedBreakers = [];

        for (let i = 0; i < breakerData.length; i++) {
            if (breakerData[i].secID != null) {
                let mount, frame, provision, compartment;
                if (sectionData.filter(e => e.secID == breakerData[i].secID).length > 0) {

                    if (breakerData[i].devMount == 'DRAW-OUT') {
                        mount = 'DRAWOUT';
                    } else {
                        mount = breakerData[i].devMount;
                    }

                    if (breakerData[i].platform == 'SQUARE D MASTERPACT NW') {
                        if (breakerData[i].brkPN.length != 0) {
                            provision = 'N';
                            if (breakerData[i].brkPN.slice(0,1) == 'W') {
                                frame = 'W';
                            } else if (breakerData[i].brkPN.slice(0,1) == 'Y') {
                                frame = 'Y';
                            }
                        } else {
                            provision = 'Y';
                            if (breakerData[i].cradlePN.slice(1,2) == 'W') {
                                frame = 'W';
                            } else if (breakerData[i].cradlePN.slice(1,2) == 'Y') {
                                frame = 'Y';
                            }
                        }

                        compartment = breakerData[i].comp;
                        if (breakerData[i].comp == 'C') {
                            let totalSecBreakers = breakerData.filter(e => e.secID == breakerData[i].secID);
                            let restrictedBreakers = totalSecBreakers.filter(e => e.comp == 'D' && e.devUL == 'UL1066' && parseInt(e.devFrameSet.slice(0, e.devFrameSet.length - 1)) >= 3200);
                            if (restrictedBreakers.length != 0) {
                                compartment = 'B';
                            }
                            if (breakerData[i].devUL == 'UL1066' && parseInt(breakerData[i].devFrameSet.slice(0, breakerData[i].devFrameSet.length - 1)) >= 3200) {
                                compartment = 'BC';
                            }
                        }
                    } else if (breakerData[i].platform == 'ABB EMAX2') {
                        if (breakerData[i].brkPN.length != 0) {
                            provision = 'N';
                        } else {
                            provision = 'Y';
                        }

                        if (parseInt(breakerData[i].devFrameSet.slice(0,breakerData[i].devFrameSet.length - 1)) < 6000) {
                            if (parseInt(breakerData[i].devFrameSet.slice(0,breakerData[i].devFrameSet.length - 1)) < 3200) {
                                if (parseInt(breakerData[i].devFrameSet.slice(0,breakerData[i].devFrameSet.length - 1)) < 2500) {
                                    frame = 'E2.2';
                                } else {
                                    frame = 'E4.2';
                                }
                            } else {
                                frame = 'E4.2';
                            }
                        } else {
                            frame = 'E6.2';
                        }
                        compartment = breakerData[i].comp;
                    }
                    const breakerAccessories = await getBreakerAccessories(breakerData[i]);

                    let accString = "";
                    let accString_1;
                    let accString_2;

                    for (let j = 0; j < breakerAccessories.length; j++) {
                        if (breakerAccessories[j].opt != null) {
                            if (j != (breakerAccessories.length - 1)) {
                                accString += breakerAccessories[j].name+"("+breakerAccessories[j].opt+"), "
                            } else {
                                accString += breakerAccessories[j].name+"("+breakerAccessories[j].opt+")"
                            }
                        } else {
                            if (j != (breakerAccessories.length - 1)) {
                                accString += breakerAccessories[j].name+", "
                            } else {
                                accString += breakerAccessories[j].name
                            }
                        }
                    }

                    if (accString.length < 80) {
                        accString_1 = accString;
                        accString_2 = ""
                    } else {
                        accString_1 = accString.slice(0,80);
                        accString_2 = accString.slice(80,accString.length);
                    }

                    usedBreakers.push({
                        devID: breakerData[i].devID,
                        secID: breakerData[i].secID,
                        sectionNum: parseInt(sectionData.filter(e => e.secID == breakerData[i].secID)[0].sectionNum),
                        comp: compartment,
                        devDesignation: breakerData[i].devDesignation,
                        platform: breakerData[i].platform,
                        catCode: breakerData[i].catCode,
                        devFunction: breakerData[i].devFunction.split(' - ')[0],
                        devConnection: breakerData[i].devFunction.split(' - ')[1],
                        provision: provision,
                        devFrame: frame,
                        devMount: mount,
                        devUL: breakerData[i].devUL,
                        devFrameSet: parseInt(breakerData[i].devFrameSet.slice(0, breakerData[i].devFrameSet.length - 1)),
                        devPoles: parseInt(breakerData[i].devPoles),
                        lugQty: breakerData[i].devLugQty,
                        lugType: breakerData[i].devLugType,
                        lugSize: breakerData[i].devLugSize,
                        accessories_1: accString_1,
                        accessories_2: accString_2
                    });
                }
            }
        }


        for (let section of sortedSectionSum) {
            for (let usedBreaker of usedBreakers) {
                if (usedBreaker.sectionNum == section.sectionNum) {
                    if (usedBreaker.catCode == '37-CB IC') {
                        let compData = [];
                        let brkData = [];
                        if (usedBreaker.platform == 'SQUARE D MASTERPACT NW') {
                            for (let compNW of compartmentsNW) {
                                if (usedBreaker.devUL == 'UL489') {
                                    if (compNW.frame == usedBreaker.devFrame && compNW.mounting == usedBreaker.devMount && compNW.poles == usedBreaker.devPoles && compNW.maxAmps >= usedBreaker.devFrameSet && compNW.ul489 == 'Y' && compNW.secWidth == section.secWidth) {
                                        if (compNW.position.includes(', ') == true) {
                                            if (compNW.position.split(', ').includes(usedBreaker.comp) == true) {
                                                compData.push(compNW);
                                            }
                                        }
                                        if (compNW.position == usedBreaker.comp) {
                                            compData.push(compNW);
                                        }
                                    }
                                } else if (usedBreaker.devUL == 'UL1066') {
                                    if (compNW.frame == usedBreaker.devFrame && compNW.mounting == usedBreaker.devMount && compNW.poles == usedBreaker.devPoles && compNW.maxAmps >= usedBreaker.devFrameSet && compNW.ul1066 == 'Y' && compNW.secWidth == section.secWidth) {
                                        if (compNW.position.includes(', ') == true) {
                                            if (compNW.position.split(', ').includes(usedBreaker.comp) == true) {
                                                compData.push(compNW);
                                            }
                                        } else {
                                            if (compNW.position == usedBreaker.comp) {
                                                compData.push(compNW);
                                            }
                                        }
                                    }
                                }
                            }
                            for (let brkNW of breakersNW) {
                                if (usedBreaker.devUL == 'UL489') {
                                    switch (usedBreaker.comp) {
                                        case "A":
                                            if (brkNW.frame == usedBreaker.devFrame && brkNW.mounting == usedBreaker.devMount && brkNW.poles == usedBreaker.devPoles && brkNW.maxAmps >= usedBreaker.devFrameSet && brkNW.ul489 == 'Y' && brkNW.provision == usedBreaker.provision && brkNW.compA == 'Y') {
                                                brkData.push(brkNW);
                                            }
                                            break;
                                        case "B":
                                            if (brkNW.frame == usedBreaker.devFrame && brkNW.mounting == usedBreaker.devMount && brkNW.poles == usedBreaker.devPoles && brkNW.maxAmps >= usedBreaker.devFrameSet && brkNW.ul489 == 'Y' && brkNW.provision == usedBreaker.provision && brkNW.compB == 'Y') {
                                                brkData.push(brkNW);
                                            }
                                            break;
                                        case "C":
                                            if (brkNW.frame == usedBreaker.devFrame && brkNW.mounting == usedBreaker.devMount && brkNW.poles == usedBreaker.devPoles && brkNW.maxAmps >= usedBreaker.devFrameSet && brkNW.ul489 == 'Y' && brkNW.provision == usedBreaker.provision && brkNW.compC == 'Y') {
                                                brkData.push(brkNW);
                                            }
                                            break;
                                        case "BC":
                                            if (brkNW.frame == usedBreaker.devFrame && brkNW.mounting == usedBreaker.devMount && brkNW.poles == usedBreaker.devPoles && brkNW.maxAmps >= usedBreaker.devFrameSet && brkNW.ul489 == 'Y' && brkNW.provision == usedBreaker.provision && brkNW.compBC == 'Y') {
                                                brkData.push(brkNW);
                                            }
                                            break;
                                        case "D":
                                            if (brkNW.frame == usedBreaker.devFrame && brkNW.mounting == usedBreaker.devMount && brkNW.poles == usedBreaker.devPoles && brkNW.maxAmps >= usedBreaker.devFrameSet && brkNW.ul489 == 'Y' && brkNW.provision == usedBreaker.provision && brkNW.compD == 'Y') {
                                                brkData.push(brkNW);
                                            }
                                            break;
                                    }
                                } else if (usedBreaker.devUL == 'UL1066') {
                                    switch (usedBreaker.comp) {
                                        case "A":
                                            if (brkNW.frame == usedBreaker.devFrame && brkNW.mounting == usedBreaker.devMount && brkNW.poles == usedBreaker.devPoles && brkNW.maxAmps >= usedBreaker.devFrameSet && brkNW.ul1066 == 'Y' && brkNW.provision == usedBreaker.provision && brkNW.compA == 'Y') {
                                                brkData.push(brkNW);
                                            }
                                            break;
                                        case "B":
                                            if (brkNW.frame == usedBreaker.devFrame && brkNW.mounting == usedBreaker.devMount && brkNW.poles == usedBreaker.devPoles && brkNW.maxAmps >= usedBreaker.devFrameSet && brkNW.ul1066 == 'Y' && brkNW.provision == usedBreaker.provision && brkNW.compB == 'Y') {
                                                brkData.push(brkNW);
                                            }
                                            break;
                                        case "C":
                                            if (brkNW.frame == usedBreaker.devFrame && brkNW.mounting == usedBreaker.devMount && brkNW.poles == usedBreaker.devPoles && brkNW.maxAmps >= usedBreaker.devFrameSet && brkNW.ul1066 == 'Y' && brkNW.provision == usedBreaker.provision && brkNW.compC == 'Y') {
                                                brkData.push(brkNW);
                                            }
                                            break;
                                        case "BC":
                                            if (brkNW.frame == usedBreaker.devFrame && brkNW.mounting == usedBreaker.devMount && brkNW.poles == usedBreaker.devPoles && brkNW.maxAmps >= usedBreaker.devFrameSet && brkNW.ul1066 == 'Y' && brkNW.provision == usedBreaker.provision && brkNW.compBC == 'Y') {
                                                brkData.push(brkNW);
                                            }
                                            break;
                                        case "D":
                                            if (brkNW.frame == usedBreaker.devFrame && brkNW.mounting == usedBreaker.devMount && brkNW.poles == usedBreaker.devPoles && brkNW.maxAmps >= usedBreaker.devFrameSet && brkNW.ul1066 == 'Y' && brkNW.provision == usedBreaker.provision && brkNW.compD == 'Y') {
                                                brkData.push(brkNW);
                                            }
                                            break;
                                    }
                                }
                            }
                        } else if (usedBreaker.platform == 'ABB EMAX2') {
                            for (let compEmax2 of compartmentsEmax2) {
                                if (usedBreaker.devUL == 'UL1066') {
                                    if (compEmax2.frame == usedBreaker.devFrame && compEmax2.mounting == usedBreaker.devMount && compEmax2.poles == usedBreaker.devPoles && compEmax2.maxAmps >= usedBreaker.devFrameSet && compEmax2.ul1066 == 'Y' && compEmax2.secWidth == section.secWidth) {
                                        if (compEmax2.position.includes(', ') == true) {
                                            if (compEmax2.position.split(', ').includes(usedBreaker.comp) == true) {
                                                compData.push(compEmax2);
                                            }
                                        } else {
                                            if (compEmax2.position == usedBreaker.comp) {
                                                compData.push(compEmax2);
                                            }
                                        }
                                    }
                                }
                            }
                            for (let brkEmax2 of breakersEmax2) {
                                if (usedBreaker.devUL == 'UL1066') {
                                    switch (usedBreaker.comp) {
                                        case "A":
                                            if (brkEmax2.frame == usedBreaker.devFrame && brkEmax2.mounting == usedBreaker.devMount && brkEmax2.poles == usedBreaker.devPoles && brkEmax2.maxAmps >= usedBreaker.devFrameSet && brkEmax2.ul1066 == 'Y' && brkEmax2.provision == usedBreaker.provision && brkEmax2.compA == 'Y') {
                                                brkData.push(brkEmax2);
                                            }
                                            break;
                                        case "B":
                                            if (brkEmax2.frame == usedBreaker.devFrame && brkEmax2.mounting == usedBreaker.devMount && brkEmax2.poles == usedBreaker.devPoles && brkEmax2.maxAmps >= usedBreaker.devFrameSet && brkEmax2.ul1066 == 'Y' && brkEmax2.provision == usedBreaker.provision && brkEmax2.compB == 'Y') {
                                                brkData.push(brkEmax2);
                                            }
                                            break;
                                        case "C":
                                            if (brkEmax2.frame == usedBreaker.devFrame && brkEmax2.mounting == usedBreaker.devMount && brkEmax2.poles == usedBreaker.devPoles && brkEmax2.maxAmps >= usedBreaker.devFrameSet && brkEmax2.ul1066 == 'Y' && brkEmax2.provision == usedBreaker.provision && brkEmax2.compC == 'Y') {
                                                brkData.push(brkEmax2);
                                            }
                                            break;
                                        case "D":
                                            if (brkEmax2.frame == usedBreaker.devFrame && brkEmax2.mounting == usedBreaker.devMount && brkEmax2.poles == usedBreaker.devPoles && brkEmax2.maxAmps >= usedBreaker.devFrameSet && brkEmax2.ul1066 == 'Y' && brkEmax2.provision == usedBreaker.provision && brkEmax2.compD == 'Y') {
                                                brkData.push(brkEmax2);
                                            }
                                            break;
                                    }
                                }
                            }
                        }

                        if (compData.length != 0 && brkData.length != 0) {
                            await creo(sessionId, {
                                command: "file",
                                function: "open",
                                data: {
                                    file: section.sectionPN,
                                    dirname: creoData[0].workingDir,
                                    display: true,
                                    activate: true
                                }
                            });

                            await creo(sessionId, {
                                command: "file",
                                function: "assemble",
                                data: {
                                    file: compData[0].doorInstancePN+".prt",
                                    generic: compData[0].doorGenericPN,
                                    into_asm: section.sectionPN,
                                    constraints: [{
                                        "asmref": usedBreaker.comp+"_DOOR",
                                        "compref": 'PRT_CSYS_DEF',
                                        "type": "csys"
                                    }]
                                }
                            });

                            if (compData[0].iccbAsmPN != null) {
                                await creo(sessionId, {
                                    command: "file",
                                    function: "assemble",
                                    data: {
                                        file: compData[0].iccbAsmPN+".asm",
                                        into_asm: section.sectionPN,
                                        constraints: [{
                                            "asmref": usedBreaker.comp+"_BRKR",
                                            "compref": "ASM_DEF_CSYS",
                                            "type": "csys"
                                        }]
                                    }
                                });
                            }

                            await creo(sessionId, {
                                command: "file",
                                function: "assemble",
                                data: {
                                    file: brkData[0].asmPN+".asm",
                                    into_asm: section.sectionPN,
                                    constraints: [{
                                        "asmref": usedBreaker.comp+"_BRKR",
                                        "compref": brkData[0].asmCsys,
                                        "type": "csys"
                                    }]
                                }
                            });

                            await regenSaveAndClose(sessionId, section.sectionPN);
                        } else if (compData.length == 0 && brkData.length != 0) {
                            await creo(sessionId, {
                                command: "file",
                                function: "open",
                                data: {
                                    file: section.sectionPN,
                                    dirname: creoData[0].workingDir,
                                    display: true,
                                    activate: true
                                }
                            });

                            await creo(sessionId, {
                                command: "file",
                                function: "assemble",
                                data: {
                                    file: brkData[0].asmPN+".asm",
                                    into_asm: section.sectionPN,
                                    constraints: [{
                                        "asmref": usedBreaker.comp+"_BRKR",
                                        "compref": brkData[0].asmCsys,
                                        "type": "csys"
                                    }]
                                }
                            });

                            await regenSaveAndClose(sessionId, section.sectionPN);
                        }
                        await placeOneLineBrksAndFillParams(count, section, usedBreaker);
                        count += 1;
                    }
                }
            }
            await fillInRemainingOneLine(section, usedBreakers);
        }
        return null
    }
    async function findPanelAndBreakerRows() {
        const standardPanels = await querySql("SELECT * FROM " + database + "." + dbConfig.standardPanel_table);
        const powerpactMCCBs = await querySql("SELECT * FROM " +database + "." + dbConfig.brk_powerpact_table);
        const tmaxMCCBs = await querySql("SELECT * FROM " + database + "." + dbConfig.brk_tmax_table);
        console.log(creoPanelData);
        for (let creoPanel of creoPanelData) {
            let creoPanelLookupData = [];
            let breakerData = await querySql("SELECT * FROM " + database + "." + dbConfig.submittal_breaker_table + " WHERE secID = ?", creoPanel.secID);
            let sectionInfo = sectionData.filter(e => e.secID == creoPanel.secID);
            let secAmp = sectionInfo[0].secAmp;
            let secPoles = sectionInfo[0].secPoles;
            let totalUnitSpace = 0;
            let fullSecAmp;
            let splitSecAmp;
            if (secAmp.includes('PANEL') == true) {
                fullSecAmp = secAmp.split(' - ')[1].slice(0, secAmp.split(' - ')[1].length - 6).split('/')[0];
                splitSecAmp = secAmp.split(' - ')[1].slice(0, secAmp.split(' - ')[1].length - 6).split('/')[1];
            }

            for (let creoPanelRow of creoPanel.rows) {
                let creoPanelRowLookupData;
                let cbRightFrame;
                let cbRightMaxAmps;
                let cbLeftFrame;
                let cbLeftMaxAmps;
                let creoPanelRowMount;
                if (creoPanelRow.configuration == 'SINGLE') {
                    let devMount = creoPanelRow.breakers[0].mount;
                    let devID = creoPanelRow.breakers[0].devID;
                    let devFrame = creoPanelRow.breakers[0].frame;
                    let breakerInfo = breakerData.filter(e => e.devID == devID);
                    let platform = breakerInfo[0].platform;
                    if (breakerInfo[0].brkPN.length == 0) {
                        if (platform == 'SQUARE D POWERPACT') {
                            //PROVISION - SQUARE D POWERPACT
                            if (devFrame == 'P') {
                                creoPanelRowMount = 'SINGLE';
                                if (parseInt(breakerInfo[0].devFrameSet.slice(0, breakerInfo[0].devFrameSet.length - 1)) <= 1200) {
                                    if (parseInt(breakerInfo[0].devFrameSet.slice(0, breakerInfo[0].devFrameSet.length - 1)) <= 800) {
                                        if (devMount == 'CENTER - LEFT') {
                                            cbLeftFrame = 'P-PROV';
                                            cbLeftMaxAmps = 800;
                                            cbRightFrame = null;
                                            cbRightMaxAmps = null;
                                        } else if (devMount == 'CENTER - RIGHT') {
                                            cbLeftFrame = null;
                                            cbLeftMaxAmps = null;
                                            cbRightFrame = 'P-PROV';
                                            cbRightMaxAmps = 800;
                                        }
                                    } else {
                                        if (devMount == 'CENTER - LEFT') {
                                            cbLeftFrame = 'P-PROV';
                                            cbLeftMaxAmps = 1200;
                                            cbRightFrame = null;
                                            cbRightMaxAmps = null;
                                        } else if (devMount == 'CENTER - RIGHT') {
                                            cbLeftFrame = null;
                                            cbLeftMaxAmps = null;
                                            cbRightFrame = 'P-PROV';
                                            cbRightMaxAmps = 1200;
                                        }
                                    }
                                }
                            } else if (devFrame == 'L') {
                                if (parseInt(breakerInfo[0].devFrameSet.slice(0, breakerInfo[0].devFrameSet.length - 1)) <= 600) {
                                    if (parseInt(breakerInfo[0].devFrameSet.slice(0, breakerInfo[0].devFrameSet.length - 1)) <= 400) {
                                        if (devMount == 'CENTER - LEFT') {
                                            cbLeftFrame = 'L-PROV';
                                            cbLeftMaxAmps = 400;
                                            cbRightFrame = null;
                                            cbRightMaxAmps = null;
                                            creoPanelRowMount = 'SINGLE';
                                        } else if (devMount == 'CENTER - RIGHT') {
                                            cbLeftFrame = null;
                                            cbLeftMaxAmps = null;
                                            cbRightFrame = 'L-PROV';
                                            cbRightMaxAmps = 400;
                                            creoPanelRowMount = 'SINGLE';
                                        } else if (devMount == 'LEFT') {
                                            cbLeftFrame = 'L-PROV';
                                            cbLeftMaxAmps = 400;
                                            cbRightFrame = null;
                                            cbRightMaxAmps = null;
                                            creoPanelRowMount = 'TWIN';
                                        } else if (devMount == 'RIGHT') {
                                            cbLeftFrame = null;
                                            cbLeftMaxAmps = null;
                                            cbRightFrame = 'L-PROV';
                                            cbRightMaxAmps = 400;
                                            creoPanelRowMount = 'TWIN';
                                        }
                                    } else {
                                        if (devMount == 'CENTER - LEFT') {
                                            cbLeftFrame = 'L-PROV';
                                            cbLeftMaxAmps = 600;
                                            cbRightFrame = null;
                                            cbRightMaxAmps = null;
                                            creoPanelRowMount = 'SINGLE';
                                        } else if (devMount == 'CENTER - RIGHT') {
                                            cbLeftFrame = null;
                                            cbLeftMaxAmps = null;
                                            cbRightFrame = 'L-PROV';
                                            cbRightMaxAmps = 600;
                                            creoPanelRowMount = 'SINGLE';
                                        } else if (devMount == 'LEFT') {
                                            cbLeftFrame = 'L-PROV';
                                            cbLeftMaxAmps = 600;
                                            cbRightFrame = null;
                                            cbRightMaxAmps = null;
                                            creoPanelRowMount = 'TWIN';
                                        } else if (devMount == 'RIGHT') {
                                            cbLeftFrame = null;
                                            cbLeftMaxAmps = null;
                                            cbRightFrame = 'L-PROV';
                                            cbRightMaxAmps = 600;
                                            creoPanelRowMount = 'TWIN';
                                        }
                                    }
                                }
                            } else if (devFrame == 'H/J') {
                                if (parseInt(breakerInfo[0].devFrameSet.slice(0, breakerInfo[0].devFrameSet.length - 1)) <= 250) {
                                    if (parseInt(breakerInfo[0].devFrameSet.slice(0, breakerInfo[0].devFrameSet.length - 1)) <= 150) {
                                        if (devMount == 'LEFT') {
                                            cbLeftFrame = 'H-PROV';
                                            cbLeftMaxAmps = 150;
                                            cbRightFrame = null;
                                            cbRightMaxAmps = null;
                                            creoPanelRowMount = 'TWIN';
                                        } else if (devMount == 'RIGHT') {
                                            cbLeftFrame = null;
                                            cbLeftMaxAmps = null;
                                            cbRightFrame = 'H-PROV';
                                            cbRightMaxAmps = 150;
                                            creoPanelRowMount = 'TWIN';
                                        }
                                    } else {
                                        if (devMount == 'LEFT') {
                                            cbLeftFrame = 'J-PROV';
                                            cbLeftMaxAmps = 250;
                                            cbRightFrame = null;
                                            cbRightMaxAmps = null;
                                            creoPanelRowMount = 'TWIN';
                                        } else if (devMount == 'RIGHT') {
                                            cbLeftFrame = null;
                                            cbLeftMaxAmps = null;
                                            cbRightFrame = 'J-PROV';
                                            cbRightMaxAmps = 250;
                                            creoPanelRowMount = 'TWIN';
                                        }
                                    }
                                }
                            }
                            creoPanelRowLookupData = {
                                mfgProductLine: 'SQUARE-D POWERPACT',
                                cnxnType: 'DIST',
                                cbRightFrame: cbRightFrame,
                                cbRightMaxAmps: cbRightMaxAmps,
                                cbLeftFrame: cbLeftFrame,
                                cbLeftMaxAmps: cbLeftMaxAmps,
                                poles: parseInt(breakerInfo[0].devPoles),
                                panelWires: secPoles,
                                mount: creoPanelRowMount
                            };
                            creoPanelLookupData.push(creoPanelRowLookupData);
                        } else if (platform == 'ABB TMAX') {
                            //PROVISION - ABB TMAX
                            if (devFrame == 'XT7') {
                                creoPanelRowMount = 'SINGLE';
                                if (parseInt(breakerInfo[0].devFrameSet.slice(0, breakerInfo[0].devFrameSet.length - 1)) <= 1200) {
                                    if (devMount == 'CENTER - LEFT') {
                                        cbLeftFrame = 'XT7-PROV';
                                        cbLeftMaxAmps = 1200;
                                        cbRightFrame = null;
                                        cbRightMaxAmps = null;
                                    } else if (devMount == 'CENTER - RIGHT') {
                                        cbLeftFrame = null;
                                        cbLeftMaxAmps = null;
                                        cbRightFrame = 'XT7-PROV';
                                        cbRightMaxAmps = 1200;
                                    }
                                }
                            } else if(devFrame == 'XT6') {
                                if (parseInt(breakerInfo[0].devFrameSet.slice(0, breakerInfo[0].devFrameSet.length - 1)) <= 800) {
                                    if (devMount == 'CENTER - LEFT') {
                                        cbLeftFrame = 'XT6-PROV';
                                        cbLeftMaxAmps = 800;
                                        cbRightFrame = null;
                                        cbRightMaxAmps = null;
                                    } else if (devMount == 'CENTER - RIGHT') {
                                        cbLeftFrame = null;
                                        cbLeftMaxAmps = null;
                                        cbRightFrame = 'XT6-PROV';
                                        cbRightMaxAmps = 800;
                                    }
                                }
                            } else if (devFrame == 'XT5') {
                                if (parseInt(breakerInfo[0].devFrameSet.slice(0, breakerInfo[0].devFrameSet.length - 1)) <= 600) {
                                    if (parseInt(breakerInfo[0].devFrameSet.slice(0, breakerInfo[0].devFrameSet.length - 1)) <= 400) {
                                        if (devMount == 'CENTER - LEFT') {
                                            cbLeftFrame = 'XT5-PROV';
                                            cbLeftMaxAmps = 400;
                                            cbRightFrame = null;
                                            cbRightMaxAmps = null;
                                            creoPanelRowMount = 'SINGLE';
                                        } else if (devMount == 'CENTER - RIGHT') {
                                            cbLeftFrame = null;
                                            cbLeftMaxAmps = null;
                                            cbRightFrame = 'XT5-PROV';
                                            cbRightMaxAmps = 400;
                                            creoPanelRowMount = 'SINGLE';
                                        } else if (devMount == 'LEFT') {
                                            cbLeftFrame = 'XT5-PROV';
                                            cbLeftMaxAmps = 400;
                                            cbRightFrame = null;
                                            cbRightMaxAmps = null;
                                            creoPanelRowMount = 'TWIN';
                                        } else if (devMount == 'RIGHT') {
                                            cbLeftFrame = null;
                                            cbLeftMaxAmps = null;
                                            cbRightFrame = 'XT5-PROV';
                                            cbRightMaxAmps = 400;
                                            creoPanelRowMount = 'TWIN';
                                        }
                                    } else {
                                        if (devMount == 'CENTER - LEFT') {
                                            cbLeftFrame = 'XT5-PROV';
                                            cbLeftMaxAmps = 600;
                                            cbRightFrame = null;
                                            cbRightMaxAmps = null;
                                            creoPanelRowMount = 'SINGLE';
                                        } else if (devMount == 'CENTER - RIGHT') {
                                            cbLeftFrame = null;
                                            cbLeftMaxAmps = null;
                                            cbRightFrame = 'XT5-PROV';
                                            cbRightMaxAmps = 600;
                                            creoPanelRowMount = 'SINGLE';
                                        } else if (devMount == 'LEFT') {
                                            cbLeftFrame = 'XT5-PROV';
                                            cbLeftMaxAmps = 600;
                                            cbRightFrame = null;
                                            cbRightMaxAmps = null;
                                            creoPanelRowMount = 'TWIN';
                                        } else if (devMount == 'RIGHT') {
                                            cbLeftFrame = null;
                                            cbLeftMaxAmps = null;
                                            cbRightFrame = 'XT5-PROV';
                                            cbRightMaxAmps = 600;
                                            creoPanelRowMount = 'TWIN';
                                        }
                                    }
                                }
                            } else if (devFrame == 'XT4') {
                                if (parseInt(breakerInfo[0].devFrameSet.slice(0, breakerInfo[0].devFrameSet.length - 1)) <= 250) {
                                    if (devMount == 'LEFT') {
                                        cbLeftFrame = 'XT4-PROV';
                                        cbLeftMaxAmps = 250;
                                        cbRightFrame = null;
                                        cbRightMaxAmps = null;
                                        creoPanelRowMount = 'TWIN';
                                    } else if (devMount == 'RIGHT') {
                                        cbLeftFrame = null;
                                        cbLeftMaxAmps = null;
                                        cbRightFrame = 'XT4-PROV';
                                        cbRightMaxAmps = 250;
                                        creoPanelRowMount = 'TWIN';
                                    }
                                }
                            } else if (devFrame == 'XT2') {
                                if (parseInt(breakerInfo[0].devFrameSet.slice(0, breakerInfo[0].devFrameSet.length - 1)) <= 125) {
                                    if (devMount == 'LEFT') {
                                        cbLeftFrame = 'XT2-PROV';
                                        cbLeftMaxAmps = 125;
                                        cbRightFrame = null;
                                        cbRightMaxAmps = null;
                                        creoPanelRowMount = 'TWIN';
                                    } else if (devMount == 'RIGHT') {
                                        cbLeftFrame = null;
                                        cbLeftMaxAmps = null;
                                        cbRightFrame = 'XT2-PROV';
                                        cbRightMaxAmps = 125;
                                        creoPanelRowMount = 'TWIN';
                                    }
                                }
                            }
                            creoPanelRowLookupData = {
                                mfgProductLine: 'ABB TMAX',
                                cnxnType: 'DIST',
                                cbRightFrame: cbRightFrame,
                                cbRightMaxAmps: cbRightMaxAmps,
                                cbLeftFrame: cbLeftFrame,
                                cbLeftMaxAmps: cbLeftMaxAmps,
                                poles: parseInt(breakerInfo[0].devPoles),
                                panelWires: secPoles,
                                mount: creoPanelRowMount
                            };
                            creoPanelLookupData.push(creoPanelRowLookupData);
                        }
                    } else {
                        if (platform == 'SQUARE D POWERPACT') {
                            //BREAKER - SQUARE D
                            if (devFrame == 'P') {
                                if (parseInt(breakerInfo[0].devFrameSet.slice(0, breakerInfo[0].devFrameSet.length - 1)) <= 1200) {
                                    if (parseInt(breakerInfo[0].devFrameSet.slice(0, breakerInfo[0].devFrameSet.length - 1)) <= 800) {
                                        if (devMount == 'CENTER - LEFT') {
                                            cbLeftFrame = 'P';
                                            cbLeftMaxAmps = 800;
                                            cbRightFrame = null;
                                            cbRightMaxAmps = null;
                                            creoPanelRowMount = 'SINGLE';
                                        } else if (devMount == 'CENTER - RIGHT') {
                                            cbLeftFrame = null;
                                            cbLeftMaxAmps = null;
                                            cbRightFrame = 'P';
                                            cbRightMaxAmps = 800;
                                            creoPanelRowMount = 'SINGLE';
                                        }
                                    } else {
                                        if (devMount == 'CENTER - LEFT') {
                                            cbLeftFrame = 'P';
                                            cbLeftMaxAmps = 1200;
                                            cbRightFrame = null;
                                            cbRightMaxAmps = null;
                                            creoPanelRowMount = 'SINGLE';
                                        } else if (devMount == 'CENTER - RIGHT') {
                                            cbLeftFrame = null;
                                            cbLeftMaxAmps = null;
                                            cbRightFrame = 'P';
                                            cbRightMaxAmps = 1200;
                                            creoPanelRowMount = 'SINGLE';
                                        }
                                    }
                                }
                            } else if (devFrame == 'L') {
                                if (parseInt(breakerInfo[0].devFrameSet.slice(0, breakerInfo[0].devFrameSet.length - 1)) <= 600) {
                                    if (parseInt(breakerInfo[0].devFrameSet.slice(0, breakerInfo[0].devFrameSet.length - 1)) <= 400) {
                                        if (devMount == 'CENTER - LEFT') {
                                            cbLeftFrame = 'L';
                                            cbLeftMaxAmps = 400;
                                            cbRightFrame = null;
                                            cbRightMaxAmps = null;
                                            creoPanelRowMount = 'SINGLE';
                                        } else if (devMount == 'CENTER - RIGHT') {
                                            cbLeftFrame = null;
                                            cbLeftMaxAmps = null;
                                            cbRightFrame = 'L';
                                            cbRightMaxAmps = 400;
                                            creoPanelRowMount = 'SINGLE';
                                        } else if (devMount == 'LEFT') {
                                            cbLeftFrame = 'L';
                                            cbLeftMaxAmps = 400;
                                            cbRightFrame = null;
                                            cbRightMaxAmps = null;
                                            creoPanelRowMount = 'TWIN';
                                        } else if (devMount == 'RIGHT') {
                                            cbLeftFrame = null;
                                            cbLeftMaxAmps = null;
                                            cbRightFrame = 'L';
                                            cbRightMaxAmps = 400;
                                            creoPanelRowMount = 'TWIN';
                                        }
                                    } else {
                                        if (devMount == 'CENTER - LEFT') {
                                            cbLeftFrame = 'L';
                                            cbLeftMaxAmps = 600;
                                            cbRightFrame = null;
                                            cbRightMaxAmps = null;
                                            creoPanelRowMount = 'SINGLE';
                                        } else if (devMount == 'CENTER - RIGHT') {
                                            cbLeftFrame = null;
                                            cbLeftMaxAmps = null;
                                            cbRightFrame = 'L';
                                            cbRightMaxAmps = 600;
                                            creoPanelRowMount = 'SINGLE';
                                        } else if (devMount == 'LEFT') {
                                            cbLeftFrame = 'L';
                                            cbLeftMaxAmps = 600;
                                            cbRightFrame = null;
                                            cbRightMaxAmps = null;
                                            creoPanelRowMount = 'TWIN';
                                        } else if (devMount == 'RIGHT') {
                                            cbLeftFrame = null;
                                            cbLeftMaxAmps = null;
                                            cbRightFrame = 'L';
                                            cbRightMaxAmps = 600;
                                            creoPanelRowMount = 'TWIN';
                                        }
                                    }
                                }
                            } else if (devFrame == 'H/J') {
                                if (parseInt(breakerInfo[0].devFrameSet.slice(0, breakerInfo[0].devFrameSet.length - 1)) <= 250) {
                                    if (parseInt(breakerInfo[0].devFrameSet.slice(0, breakerInfo[0].devFrameSet.length - 1)) <= 150) {
                                        if (devMount == 'LEFT') {
                                            cbLeftFrame = 'H';
                                            cbLeftMaxAmps = 150;
                                            cbRightFrame = null;
                                            cbRightMaxAmps = null;
                                            creoPanelRowMount = 'TWIN';
                                        } else if (devMount == 'RIGHT') {
                                            cbLeftFrame = null;
                                            cbLeftMaxAmps = null;
                                            cbRightFrame = 'H';
                                            cbRightMaxAmps = 150;
                                            creoPanelRowMount = 'TWIN';
                                        }
                                    } else {
                                        if (devMount == 'LEFT') {
                                            cbLeftFrame = 'J';
                                            cbLeftMaxAmps = 250;
                                            cbRightFrame = null;
                                            cbRightMaxAmps = null;
                                            creoPanelRowMount = 'TWIN';
                                        } else if (devMount == 'RIGHT') {
                                            cbLeftFrame = null;
                                            cbLeftMaxAmps = null;
                                            cbRightFrame = 'J';
                                            cbRightMaxAmps = 250;
                                            creoPanelRowMount = 'TWIN';
                                        }
                                    }
                                }
                            }
                            creoPanelRowLookupData = {
                                mfgProductLine: 'SQUARE-D POWERPACT',
                                cnxnType: 'DIST',
                                cbRightFrame: cbRightFrame,
                                cbRightMaxAmps: cbRightMaxAmps,
                                cbLeftFrame: cbLeftFrame,
                                cbLeftMaxAmps: cbLeftMaxAmps,
                                poles: parseInt(breakerInfo[0].devPoles),
                                panelWires: secPoles,
                                mount: creoPanelRowMount
                            };
                            creoPanelLookupData.push(creoPanelRowLookupData);
                        } else if (platform == 'ABB TMAX') {
                            //BREAKER - ABB TMAX
                            if (devFrame == 'XT7') {
                                if (parseInt(breakerInfo[0].devFrameSet.slice(0, breakerInfo[0].devFrameSet.length - 1)) <= 1200) {
                                    if (devMount == 'CENTER - LEFT') {
                                        cbLeftFrame = 'XT7';
                                        cbLeftMaxAmps = 1200;
                                        cbRightFrame = null;
                                        cbRightMaxAmps = null;
                                        creoPanelRowMount = 'SINGLE';
                                    } else if (devMount == 'CENTER - RIGHT') {
                                        cbLeftFrame = null;
                                        cbLeftMaxAmps = null;
                                        cbRightFrame = 'XT7';
                                        cbRightMaxAmps = 1200;
                                        creoPanelRowMount = 'SINGLE';
                                    }
                                }
                            } else if (devFrame == 'XT6') {
                                if (parseInt(breakerInfo[0].devFrameSet.slice(0, breakerInfo[0].devFrameSet.length - 1)) <= 800) {
                                    if (devMount == 'CENTER - LEFT') {
                                        cbLeftFrame = 'XT6';
                                        cbLeftMaxAmps = 800;
                                        cbRightFrame = null;
                                        cbRightMaxAmps = null;
                                        creoPanelRowMount = 'SINGLE';
                                    } else if (devMount == 'CENTER - RIGHT') {
                                        cbLeftFrame = null;
                                        cbLeftMaxAmps = null;
                                        cbRightFrame = 'XT6';
                                        cbRightMaxAmps = 800;
                                        creoPanelRowMount = 'SINGLE';
                                    }
                                }
                            } else if (devFrame == 'XT5') {
                                if (parseInt(breakerInfo[0].devFrameSet.slice(0, breakerInfo[0].devFrameSet.length - 1)) <= 600) {
                                    if (parseInt(breakerInfo[0].devFrameSet.slice(0, breakerInfo[0].devFrameSet.length - 1)) <= 400) {
                                        if (devMount == 'CENTER - LEFT') {
                                            cbLeftFrame = 'XT5';
                                            cbLeftMaxAmps = 400;
                                            cbRightFrame = null;
                                            cbRightMaxAmps = null;
                                            creoPanelRowMount = 'SINGLE';
                                        } else if (devMount == 'CENTER - RIGHT') {
                                            cbLeftFrame = null;
                                            cbLeftMaxAmps = null;
                                            cbRightFrame = 'XT5';
                                            cbRightMaxAmps = 400;
                                            creoPanelRowMount = 'SINGLE';
                                        } else if (devMount == 'LEFT') {
                                            cbLeftFrame = 'XT5';
                                            cbLeftMaxAmps = 400;
                                            cbRightFrame = null;
                                            cbRightMaxAmps = null;
                                            creoPanelRowMount = 'TWIN';
                                        } else if (devMount == 'RIGHT') {
                                            cbLeftFrame = null;
                                            cbLeftMaxAmps = null;
                                            cbRightFrame = 'XT5';
                                            cbRightMaxAmps = 400;
                                            creoPanelRowMount = 'TWIN';
                                        }
                                    } else {
                                        if (devMount == 'CENTER - LEFT') {
                                            cbLeftFrame = 'XT5';
                                            cbLeftMaxAmps = 600;
                                            cbRightFrame = null;
                                            cbRightMaxAmps = null;
                                            creoPanelRowMount = 'SINGLE';
                                        } else if (devMount == 'CENTER - RIGHT') {
                                            cbLeftFrame = null;
                                            cbLeftMaxAmps = null;
                                            cbRightFrame = 'XT5';
                                            cbRightMaxAmps = 600;
                                            creoPanelRowMount = 'SINGLE';
                                        } else if (devMount == 'LEFT') {
                                            cbLeftFrame = 'XT5';
                                            cbLeftMaxAmps = 600;
                                            cbRightFrame = null;
                                            cbRightMaxAmps = null;
                                            creoPanelRowMount = 'TWIN';
                                        } else if (devMount == 'RIGHT') {
                                            cbLeftFrame = null;
                                            cbLeftMaxAmps = null;
                                            cbRightFrame = 'XT5';
                                            cbRightMaxAmps = 600;
                                            creoPanelRowMount = 'TWIN';
                                        }
                                    }
                                }
                            } else if (devFrame == 'XT4') {
                                if (parseInt(breakerInfo[0].devFrameSet.slice(0, breakerInfo[0].devFrameSet.length - 1)) <= 250) {
                                    if (devMount == 'LEFT') {
                                        cbLeftFrame = 'XT4';
                                        cbLeftMaxAmps = 250;
                                        cbRightFrame = null;
                                        cbRightMaxAmps = null;
                                        creoPanelRowMount = 'TWIN';
                                    } else if (devMount == 'RIGHT') {
                                        cbLeftFrame = null;
                                        cbLeftMaxAmps = null;
                                        cbRightFrame = 'XT4';
                                        cbRightMaxAmps = 250;
                                        creoPanelRowMount = 'TWIN';
                                    }
                                }
                            } else if (devFrame == 'XT2') {
                                if (parseInt(breakerInfo[0].devFrameSet.slice(0, breakerInfo[0].devFrameSet.length - 1)) <= 125) {
                                    if (devMount == 'LEFT') {
                                        cbLeftFrame = 'XT2';
                                        cbLeftMaxAmps = 125;
                                        cbRightFrame = null;
                                        cbRightMaxAmps = null;
                                        creoPanelRowMount = 'TWIN';
                                    } else if (devMount == 'RIGHT') {
                                        cbLeftFrame = null;
                                        cbLeftMaxAmps = null;
                                        cbRightFrame = 'XT2';
                                        cbRightMaxAmps = 125;
                                        creoPanelRowMount = 'TWIN';
                                    }
                                }
                            }
                            creoPanelRowLookupData = {
                                mfgProductLine: 'ABB TMAX',
                                cnxnType: 'DIST',
                                cbRightFrame: cbRightFrame,
                                cbRightMaxAmps: cbRightMaxAmps,
                                cbLeftFrame: cbLeftFrame,
                                cbLeftMaxAmps: cbLeftMaxAmps,
                                poles: parseInt(breakerInfo[0].devPoles),
                                panelWires: secPoles,
                                mount: creoPanelRowMount
                            };
                            creoPanelLookupData.push(creoPanelRowLookupData);
                        }
                    }
                } else if (creoPanelRow.configuration == 'DUAL') {
                    let devIDL = creoPanelRow.breakers[0].devID;
                    let devFrameL = creoPanelRow.breakers[0].frame;
                    let breakerInfoL = breakerData.filter(e => e.devID == devIDL);
                    let devIDR = creoPanelRow.breakers[1].devID;
                    let devFrameR = creoPanelRow.breakers[1].frame;
                    let breakerInfoR = breakerData.filter(e => e.devID == devIDR);
                    let platformL = breakerInfoL[0].platform;
                    if (platformL == 'SQUARE D POWERPACT') {
                        if (breakerInfoL[0].brkPN.length == 0) {
                            //PROVISION LEFT - SQUARE D POWERPACT
                            if (devFrameL == 'L') {
                                if (parseInt(breakerInfoL[0].devFrameSet.slice(0, breakerInfoL[0].devFrameSet.length - 1)) <= 600) {
                                    if (parseInt(breakerInfoL[0].devFrameSet.slice(0, breakerInfoL[0].devFrameSet.length - 1)) <= 400) {
                                        cbLeftFrame = 'L-PROV';
                                        cbLeftMaxAmps = 400;
                                    } else {
                                        cbLeftFrame = 'L-PROV';
                                        cbLeftMaxAmps = 600;
                                    }
                                }

                            } else if (devFrameL == 'H/J') {
                                if (parseInt(breakerInfoL[0].devFrameSet.slice(0, breakerInfoL[0].devFrameSet.length - 1)) <= 250) {
                                    if (parseInt(breakerInfoL[0].devFrameSet.slice(0, breakerInfoL[0].devFrameSet.length - 1)) <= 150) {
                                        cbLeftFrame = 'H-PROV';
                                        cbLeftMaxAmps = 150;
                                    } else {
                                        cbLeftFrame = 'J-PROV';
                                        cbLeftMaxAmps = 250;
                                    }
                                }
                            }
                        } else {
                            //BREAKER LEFT - SQUARE D POWERPACT
                            if (devFrameL == 'L') {
                                if (parseInt(breakerInfoL[0].devFrameSet.slice(0, breakerInfoL[0].devFrameSet.length - 1)) <= 600) {
                                    if (parseInt(breakerInfoL[0].devFrameSet.slice(0, breakerInfoL[0].devFrameSet.length - 1)) <= 400) {
                                        cbLeftFrame = 'L';
                                        cbLeftMaxAmps = 400;
                                    } else {
                                        cbLeftFrame = 'L';
                                        cbLeftMaxAmps = 600;
                                    }
                                }
                            } else if (devFrameL == 'H/J') {
                                if (parseInt(breakerInfoL[0].devFrameSet.slice(0, breakerInfoL[0].devFrameSet.length - 1)) <= 250) {
                                    if (parseInt(breakerInfoL[0].devFrameSet.slice(0, breakerInfoL[0].devFrameSet.length - 1)) <= 150) {
                                        cbLeftFrame = 'H';
                                        cbLeftMaxAmps = 150;
                                    } else {
                                        cbLeftFrame = 'J';
                                        cbLeftMaxAmps = 250;
                                    }
                                }
                            }
                        }
                    } else if (platformL == 'ABB TMAX') {
                        if (breakerInfoL[0].brkPN.length == 0) {
                            //PROVISION LEFT - ABB TMAX
                            if (devFrameL == 'XT5') {
                                if (parseInt(breakerInfoL[0].devFrameSet.slice(0, breakerInfoL[0].devFrameSet.length - 1)) <= 600) {
                                    if (parseInt(breakerInfoL[0].devFrameSet.slice(0, breakerInfoL[0].devFrameSet.length - 1)) <= 400) {
                                        cbLeftFrame = 'XT5-PROV';
                                        cbLeftMaxAmps = 400;
                                    } else {
                                        cbLeftFrame = 'XT5-PROV';
                                        cbLeftMaxAmps = 600;
                                    }
                                }

                            } else if (devFrameL == 'XT4') {
                                if (parseInt(breakerInfoL[0].devFrameSet.slice(0, breakerInfoL[0].devFrameSet.length - 1)) <= 250) {
                                    cbLeftFrame = 'XT4-PROV';
                                    cbLeftMaxAmps = 250;
                                }
                            } else if (devFrameL == 'XT2') {
                                if (parseInt(breakerInfoL[0].devFrameSet.slice(0, breakerInfoL[0].devFrameSet.length - 1)) <= 150) {
                                    cbLeftFrame = 'XT2-PROV';
                                    cbLeftMaxAmps = 125;
                                }
                            }
                        } else {
                            //BREAKER LEFT - ABB TMAX
                            if (devFrameL == 'XT5') {
                                if (parseInt(breakerInfoL[0].devFrameSet.slice(0, breakerInfoL[0].devFrameSet.length - 1)) <= 600) {
                                    if (parseInt(breakerInfoL[0].devFrameSet.slice(0, breakerInfoL[0].devFrameSet.length - 1)) <= 400) {
                                        cbLeftFrame = 'XT5';
                                        cbLeftMaxAmps = 400;
                                    } else {
                                        cbLeftFrame = 'XT5';
                                        cbLeftMaxAmps = 600;
                                    }
                                }
                            } else if (devFrameL == 'XT4') {
                                if (parseInt(breakerInfoL[0].devFrameSet.slice(0, breakerInfoL[0].devFrameSet.length - 1)) <= 250) {
                                    cbLeftFrame = 'XT4';
                                    cbLeftMaxAmps = 250;
                                }
                            } else if (devFrameL == 'XT2') {
                                if (parseInt(breakerInfoL[0].devFrameSet.slice(0, breakerInfoL[0].devFrameSet.length - 1)) <= 125) {
                                    cbLeftFrame = 'XT2';
                                    cbLeftMaxAmps = 125;
                                }
                            }
                        }
                    }
                    let platformR = breakerInfoL[0].platform;
                    if (platformR == 'SQUARE D POWERPACT') {
                        if (breakerInfoR[0].brkPN.length == 0) {
                            //PROVISION RIGHT - SQUARE D POWERPACT
                            if (devFrameR == 'L') {
                                if (parseInt(breakerInfoR[0].devFrameSet.slice(0, breakerInfoR[0].devFrameSet.length - 1)) <= 600) {
                                    if (parseInt(breakerInfoR[0].devFrameSet.slice(0, breakerInfoR[0].devFrameSet.length - 1)) <= 400) {
                                        cbRightFrame = 'L-PROV';
                                        cbRightMaxAmps = 400;
                                    } else {
                                        cbRightFrame = 'L-PROV';
                                        cbRightMaxAmps = 600;
                                    }
                                }
                            } else if (devFrameR == 'H/J') {
                                if (parseInt(breakerInfoR[0].devFrameSet.slice(0, breakerInfoR[0].devFrameSet.length - 1)) <= 250) {
                                    if (parseInt(breakerInfoR[0].devFrameSet.slice(0, breakerInfoR[0].devFrameSet.length - 1)) <= 150) {
                                        cbRightFrame = 'H-PROV';
                                        cbRightMaxAmps = 150;
                                    } else {
                                        cbRightFrame = 'J-PROV';
                                        cbRightMaxAmps = 250;
                                    }
                                }
                            }
                        } else {
                            //BREAKER RIGHT - SQUARE D POWERPACT
                            if (devFrameR == 'L') {
                                if (parseInt(breakerInfoR[0].devFrameSet.slice(0, breakerInfoR[0].devFrameSet.length - 1)) <= 600) {
                                    if (parseInt(breakerInfoR[0].devFrameSet.slice(0, breakerInfoR[0].devFrameSet.length - 1)) <= 400) {
                                        cbRightFrame = 'L';
                                        cbRightMaxAmps = 400;
                                    } else {
                                        cbRightFrame = 'L';
                                        cbRightMaxAmps = 600;
                                    }
                                }
                            } else if (devFrameR == 'H/J') {
                                if (parseInt(breakerInfoR[0].devFrameSet.slice(0, breakerInfoR[0].devFrameSet.length - 1)) <= 250) {
                                    if (parseInt(breakerInfoR[0].devFrameSet.slice(0, breakerInfoR[0].devFrameSet.length - 1)) <= 150) {
                                        cbRightFrame = 'H';
                                        cbRightMaxAmps = 150;
                                    } else {
                                        cbRightFrame = 'J';
                                        cbRightMaxAmps = 250;
                                    }
                                }
                            }
                        }
                    } else if (platformR == 'ABB TMAX') {
                        if (breakerInfoR[0].brkPN.length == 0) {
                            //PROVISION RIGHT - ABB TMAX
                            if (devFrameR == 'XT5') {
                                if (parseInt(breakerInfoR[0].devFrameSet.slice(0, breakerInfoR[0].devFrameSet.length - 1)) <= 600) {
                                    if (parseInt(breakerInfoR[0].devFrameSet.slice(0, breakerInfoR[0].devFrameSet.length - 1)) <= 400) {
                                        cbRightFrame = 'XT5-PROV';
                                        cbRightMaxAmps = 400;
                                    } else {
                                        cbRightFrame = 'XT5-PROV';
                                        cbRightMaxAmps = 600;
                                    }
                                }
                            } else if (devFrameR == 'XT4') {
                                if (parseInt(breakerInfoR[0].devFrameSet.slice(0, breakerInfoR[0].devFrameSet.length - 1)) <= 250) {
                                    cbRightFrame = 'XT4-PROV';
                                    cbRightMaxAmps = 250;
                                }
                            } else if (devFrameR == 'XT2') {
                                if (parseInt(breakerInfoR[0].devFrameSet.slice(0, breakerInfoR[0].devFrameSet.length - 1)) <= 125) {
                                    cbRightFrame = 'XT2-PROV';
                                    cbRightMaxAmps = 125;
                                }
                            }
                        } else {
                            //BREAKER RIGHT
                            if (devFrameR == 'XT5') {
                                if (parseInt(breakerInfoR[0].devFrameSet.slice(0, breakerInfoR[0].devFrameSet.length - 1)) <= 600) {
                                    if (parseInt(breakerInfoR[0].devFrameSet.slice(0, breakerInfoR[0].devFrameSet.length - 1)) <= 400) {
                                        cbRightFrame = 'XT5';
                                        cbRightMaxAmps = 400;
                                    } else {
                                        cbRightFrame = 'XT5';
                                        cbRightMaxAmps = 600;
                                    }
                                }
                            } else if (devFrameR == 'XT4') {
                                if (parseInt(breakerInfoR[0].devFrameSet.slice(0, breakerInfoR[0].devFrameSet.length - 1)) <= 250) {
                                    cbRightFrame = 'XT4';
                                    cbRightMaxAmps = 250;
                                }
                            } else if (devFrameR == 'XT2') {
                                if (parseInt(breakerInfoR[0].devFrameSet.slice(0, breakerInfoR[0].devFrameSet.length - 1)) <= 125) {
                                    cbRightFrame = 'XT2';
                                    cbRightMaxAmps = 125;
                                }
                            }
                        }
                    }
                    let creoMfgProductLine;
                    if (platformL == 'SQUARE D POWERPACT' && platformR == 'SQUARE D POWERPACT') {
                        creoMfgProductLine = 'SQUARE-D POWERPACT';
                    } else if (platformL == 'ABB TMAX' && platformR == 'ABB TMAX') {
                        creoMfgProductLine = 'ABB TMAX';
                    }

                    creoPanelRowLookupData = {
                        mfgProductLine: creoMfgProductLine,
                        cnxnType: 'DIST',
                        cbRightFrame: cbRightFrame,
                        cbRightMaxAmps: cbRightMaxAmps,
                        cbLeftFrame: cbLeftFrame,
                        cbLeftMaxAmps: cbLeftMaxAmps,
                        poles: parseInt(breakerInfoL[0].devPoles),
                        panelWires: secPoles,
                        mount: 'TWIN'
                    };
                    creoPanelLookupData.push(creoPanelRowLookupData);

                }
            }

            let lugSpace = 0;
            if (creoPanel.mainLug == 'TOP' || creoPanel.mainLug == 'BOTTOM') {
                lugSpace = 4;
            }
            let creoRowData = [];
            for (let row of creoPanelLookupData) {
                console.log(row);
                let creoRow;
                if (row.mfgProductLine == 'SQUARE-D POWERPACT') {
                    creoRow = powerpactMCCBs.filter(e => e.mfgProductLine == row.mfgProductLine && e.cnxnType == row.cnxnType && e.cbRightFrame == row.cbRightFrame && e.cbRightMaxAmps == row.cbRightMaxAmps && e.cbLeftFrame == row.cbLeftFrame && e.cbLeftMaxAmps == row.cbLeftMaxAmps && e.poles == row.poles && e.panelWires == 3 && e.mount == row.mount);
                    creoRowData.push(creoRow);
                } else if (row.mfgProductLine == 'ABB TMAX') {
                    creoRow = tmaxMCCBs.filter(e => e.mfgProductLine == row.mfgProductLine && e.cnxnType == row.cnxnType && e.cbRightFrame == row.cbRightFrame && e.cbRightMaxAmps == row.cbRightMaxAmps && e.cbLeftFrame == row.cbLeftFrame && e.cbLeftMaxAmps == row.cbLeftMaxAmps && e.poles == row.poles && e.panelWires == 3 && e.mount == row.mount);
                    creoRowData.push(creoRow);
                }
            }
            for (let creoRow of creoRowData) {
                totalUnitSpace += parseInt(creoRow[0].unitSpaceQty);
            }
            totalUnitSpace += lugSpace;
            let chosenSpacing;
            let availablePanelSpaces = [12, 24, 30, 36, 42, 48, 54];
            let acceptableSpaces = [];
            for (let space of availablePanelSpaces) {
                if (totalUnitSpace <= space) {
                    acceptableSpaces.push(space);
                }
            }
            chosenSpacing = acceptableSpaces[0];
            let panelRow = standardPanels.filter(e => e.panelType == 'DISTRIBUTION' && e.poles == secPoles && e.maxAmpFull == fullSecAmp && e.maxAmpSplit == splitSecAmp && e.totalUnitSpace == chosenSpacing);
            await assemblePanel(creoPanel, panelRow, creoRowData);
        }
        return null;
    }
    async function assemblePanel(creoPanel, panelRow, creoRowData) {
        const section = await querySql("SELECT * FROM " + database + "." + dbConfig.submittal_sections_table + " WHERE secID = ?", creoPanel.secID);
        const fillerData = await querySql("SELECT * FROM " + database + "." + dbConfig.panel_fillers_table);
        const panelRails = await querySql("SELECT * FROM "+ database + "." + dbConfig.filler_rails_table);
        const panelSupportRails = await querySql("SELECT * FROM "+ database + "." + dbConfig.panelSupport_rails_table);

        console.log(creoPanel);
        let sectionNum;
        if (section[0].sectionNum < 10) {
            sectionNum = layoutNum.toString() + '0' + section[0].sectionNum.toString();
        } else {
            sectionNum = layoutNum.toString() + section[0].sectionNum.toString();
        }

        await creo(sessionId, {
            command: "file",
            function: "open",
            data: {
                file: "000123-0200-100.asm",
                dirname: creoData[0].standardLib,
                display: true,
                activate: true
            }
        });

        let newPanelAsm = jobNum+"-0200-"+sectionNum;

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
                    "~ Update `file_saveas` `Inputname` " + "`" + newPanelAsm + "`;" +
                    "~ Activate `file_saveas` `OK`;~ Activate `assyrename` `OpenBtn`;"
            }
        });

        await creo(sessionId, {
            command: "file",
            function: "open",
            data: {
                file: newPanelAsm+".asm",
                dirname: creoData[0].workingDir,
                display: true,
                activate: true
            }
        });

        await creo(sessionId, {
            command: "parameter",
            function: "set",
            data: {
                file: newPanelAsm+".asm",
                name: "PANEL_US_QTY",
                type: "INTEGER",
                value: panelRow[0].totalUnitSpace
            }
        });

        await creo(sessionId, {
            command: "file",
            function: "assemble",
            data: {
                file: panelRow[0].panelAsm+".asm",
                into_asm: newPanelAsm+".asm",
                constraints: [{
                    "asmref": "ASM_DEF_CSYS",
                    "compref": "ASM_DEF_CSYS",
                    "type": "csys"
                }]
            }
        });

        await creo(sessionId, {
            command: "file",
            function: "regenerate",
            data: {
                file: newPanelAsm+".asm"
            }
        });

        await creo(sessionId, {
            command: "file",
            function: "open",
            data: {
                file: jobNum+"-0100-"+sectionNum+".asm",
                display: true,
                activate: true
            }
        });

        await creo(sessionId, {
            command: "parameter",
            function: "set",
            data: {
                file: jobNum+"-0100-"+sectionNum+".asm",
                name: "PANEL_US_QTY",
                type: "INTEGER",
                value: panelRow[0].totalUnitSpace
            }
        });

        await creo(sessionId, {
            command: "file",
            function: "assemble",
            data: {
                file: newPanelAsm+".asm",
                into_asm: jobNum+"-0100-"+sectionNum+".asm",
                constraints: [{
                    asmref: "CSYS_PANEL",
                    compref: "INSERT",
                    type: "csys"
                }]
            }
        });

        await regenSaveAndClose(sessionId, jobNum+"-0100-"+sectionNum+".asm");

        await creo(sessionId, {
            command: "file",
            function: "open",
            data: {
                file: newPanelAsm+".asm",
                display: true,
                activate: true
            }
        });

        let currentUnitSpace = 0;

        if (creoPanel.mainLug == 'TOP') {
            currentUnitSpace += 4;
        }

        await creo(sessionId, {
            command: "file",
            function: "open",
            data: {
                file: jobNum+"-0100-"+sectionNum+".asm",
                display: true,
                activate: true,
                new_window: true
            }
        });
        let sec32width = 'N';
        if (section[0].secWidth == 32) {
            sec32width = 'Y';
        }

        let panelRail = {
            unitSpacing: 1.375,
            secHeight: section[0].secHeight,
            sec32width: sec32width
        };

        let panelRailData = panelRails.filter(e => e.unitSpacing == panelRail.unitSpacing && e.secHeight == panelRail.secHeight && e.sec32width == panelRail.sec32width);

        await creo(sessionId, {
            command: "file",
            function: "assemble",
            data: {
                file: panelRailData[0].railAsm+".asm",
                into_asm: jobNum+"-0100-"+sectionNum+".asm",
                constraints: [{
                    asmref: "ASM_DEF_CSYS",
                    compref: "ASM_DEF_CSYS",
                    type: "CSYS"
                }]
            }
        });

        let panelSupportRailData = panelSupportRails.filter(e => e.secWidth == section[0].secWidth);
        await creo(sessionId, {
            command: "file",
            function: "assemble",
            data: {
                file: panelSupportRailData[0].supportAsm+".asm",
                into_asm: jobNum+"-0100-"+sectionNum+".asm",
                constraints: [{
                    asmref: "PANEL_RAIL_TOP",
                    compref: "ASM_DEF_CSYS",
                    type: "CSYS"
                }]
            }
        });
        await creo(sessionId, {
            command: "file",
            function: "assemble",
            data: {
                file: panelSupportRailData[0].supportAsm+".asm",
                into_asm: jobNum+"-0100-"+sectionNum+".asm",
                constraints: [{
                    asmref: "PANEL_RAIL_BTM",
                    compref: "ASM_DEF_CSYS",
                    type: "CSYS"
                }]
            }
        });


        for (let row of creoRowData) {
            let mccbRight, mccbLeft, mccbCenterRight, mccbCenterLeft, frame, panelWires;
            currentUnitSpace += row[0].unitSpaceQty;
            let CS = "ACS"+currentUnitSpace.toString();
            await creo(sessionId, {
                command: "file",
                function: "assemble",
                data: {
                    file: row[0].instanceAsm+".asm",
                    generic: row[0].genericAsm,
                    into_asm: newPanelAsm+".asm",
                    constraints: [{
                        asmref: CS,
                        compref: row[0].asmCsys,
                        type: "CSYS"
                    }]
                }
            });
            if (row[0].mount == 'SINGLE') {
                if (row[0].cbRightFrame == null) {
                    mccbRight = 'N';
                    mccbCenterRight = 'N';
                    switch (row[0].cbLeftFrame) {
                        case 'P':
                            mccbLeft = 'N';
                            mccbCenterLeft = 'Y';
                            frame = 'P';
                            panelWires = null;
                            break;
                        case 'P-PROV':
                            mccbLeft = 'N';
                            mccbCenterLeft = 'Y';
                            frame = 'P';
                            panelWires = null;
                            break;
                        case 'L':
                            if (row[0].cbLeftMaxAmps == 400) {
                                mccbLeft = 'Y';
                                mccbCenterLeft = 'N';
                                frame = 'L';
                                panelWires = null;
                            } else {
                                mccbLeft = 'N';
                                mccbCenterLeft = 'Y';
                                frame = 'L';
                                panelWires = row[0].panelWires;
                            }
                            break;
                        case 'L-PROV':
                            if (row[0].cbLeftMaxAmps == 400) {
                                mccbLeft = 'Y';
                                mccbCenterLeft = 'N';
                                frame = 'L';
                                panelWires = null;
                            } else {
                                mccbLeft = 'N';
                                mccbCenterLeft = 'Y';
                                frame = 'L';
                                panelWires = row[0].panelWires;
                            }
                            break;
                        case 'J':
                            mccbLeft = 'Y';
                            mccbCenterLeft = 'N';
                            frame = 'H/J';
                            panelWires = null;
                            break;
                        case 'J-PROV':
                            mccbLeft = 'Y';
                            mccbCenterLeft = 'N';
                            frame = 'H/J';
                            panelWires = null;
                            break;
                        case 'H':
                            mccbLeft = 'Y';
                            mccbCenterLeft = 'N';
                            frame = 'H/J';
                            panelWires = null;
                            break;
                        case 'H-PROV':
                            mccbLeft = 'Y';
                            mccbCenterLeft = 'N';
                            frame = 'H/J';
                            panelWires = null;
                            break;

                        case 'XT7':
                            mccbLeft = 'N';
                            mccbCenterLeft = 'Y';
                            frame = 'XT7';
                            panelWires = null;
                            break;
                        case 'XT7-PROV':
                            mccbLeft = 'N';
                            mccbCenterLeft = 'Y';
                            frame = 'XT7';
                            panelWires = null;
                            break;
                        case 'XT6':
                            mccbLeft = 'N';
                            mccbCenterLeft = 'Y';
                            frame = 'XT7';
                            panelWires = null;
                            break;
                        case 'XT6-PROV':
                            mccbLeft = 'N';
                            mccbCenterLeft = 'Y';
                            frame = 'XT7';
                            panelWires = null;
                            break;
                        case 'XT5':
                            if (row[0].cbLeftMaxAmps == 400) {
                                mccbLeft = 'Y';
                                mccbCenterLeft = 'N';
                                frame = 'XT5';
                                panelWires = null;
                            } else {
                                mccbLeft = 'N';
                                mccbCenterLeft = 'Y';
                                frame = 'XT5';
                                panelWires = null;
                            }
                            break;
                        case 'XT5-PROV':
                            if (row[0].cbLeftMaxAmps == 400) {
                                mccbLeft = 'Y';
                                mccbCenterLeft = 'N';
                                frame = 'XT5';
                                panelWires = null;
                            } else {
                                mccbLeft = 'N';
                                mccbCenterLeft = 'Y';
                                frame = 'XT5';
                                panelWires = null;
                            }
                            break;
                        case 'XT4':
                            mccbLeft = 'Y';
                            mccbCenterLeft = 'N';
                            frame = 'XT4';
                            panelWires = null;
                            break;
                        case 'XT4-PROV':
                            mccbLeft = 'Y';
                            mccbCenterLeft = 'N';
                            frame = 'XT4';
                            panelWires = null;
                            break;
                        case 'XT2':
                            mccbLeft = 'Y';
                            mccbCenterLeft = 'N';
                            frame = 'XT2';
                            panelWires = null;
                            break;
                        case 'XT2-PROV':
                            mccbLeft = 'Y';
                            mccbCenterLeft = 'N';
                            frame = 'XT2';
                            panelWires = null;
                            break;
                    }
                } else {
                    mccbLeft = 'N';
                    mccbCenterLeft = 'N';
                    switch (row[0].cbRightFrame) {
                        case 'P':
                            mccbRight = 'N';
                            mccbCenterRight = 'Y';
                            frame = 'P';
                            panelWires = null;
                            break;
                        case 'P-PROV':
                            mccbRight = 'N';
                            mccbCenterRight = 'Y';
                            frame = 'P';
                            panelWires = null;
                            break;
                        case 'L':
                            if (row[0].cbRightMaxAmps == 400) {
                                mccbRight = 'Y';
                                mccbCenterRight = 'N';
                                frame = 'L';
                                panelWires = null;
                            } else {
                                mccbRight = 'N';
                                mccbCenterRight = 'Y';
                                frame = 'L';
                                panelWires = row[0].panelWires;
                            }
                            break;
                        case 'L-PROV':
                            if (row[0].cbRightMaxAmps == 400) {
                                mccbRight = 'Y';
                                mccbCenterRight = 'N';
                                frame = 'L';
                                panelWires = null;
                            } else {
                                mccbRight = 'N';
                                mccbCenterRight = 'Y';
                                frame = 'L';
                                panelWires = row[0].panelWires;
                            }
                            break;
                        case 'J':
                            mccbRight = 'Y';
                            mccbCenterRight = 'N';
                            frame = 'H/J';
                            panelWires = null;
                            break;
                        case 'J-PROV':
                            mccbRight = 'Y';
                            mccbCenterRight = 'N';
                            frame = 'H/J';
                            panelWires = null;
                            break;
                        case 'H':
                            mccbRight = 'Y';
                            mccbCenterRight = 'N';
                            frame = 'H/J';
                            panelWires = null;
                            break;
                        case 'H-PROV':
                            mccbRight = 'Y';
                            mccbCenterRight = 'N';
                            frame = 'H/J';
                            panelWires = null;
                            break;
                        case 'XT7':
                            mccbRight = 'N';
                            mccbCenterRight = 'Y';
                            frame = 'XT7';
                            panelWires = null;
                            break;
                        case 'XT7-PROV':
                            mccbRight = 'N';
                            mccbCenterRight = 'Y';
                            frame = 'XT7';
                            panelWires = null;
                            break;
                        case 'XT6':
                            mccbRight = 'N';
                            mccbCenterRight = 'Y';
                            frame = 'XT6';
                            panelWires = null;
                            break;
                        case 'XT6-PROV':
                            mccbRight = 'N';
                            mccbCenterRight = 'Y';
                            frame = 'XT6';
                            panelWires = null;
                            break;
                        case 'XT5':
                            if (row[0].cbRightMaxAmps == 400) {
                                mccbRight = 'Y';
                                mccbCenterRight = 'N';
                                frame = 'XT5';
                                panelWires = null;
                            } else {
                                mccbRight = 'N';
                                mccbCenterRight = 'Y';
                                frame = 'XT5';
                                panelWires = null;
                            }
                            break;
                        case 'XT5-PROV':
                            if (row[0].cbRightMaxAmps == 400) {
                                mccbRight = 'Y';
                                mccbCenterRight = 'N';
                                frame = 'XT5';
                                panelWires = null;
                            } else {
                                mccbRight = 'N';
                                mccbCenterRight = 'Y';
                                frame = 'XT5';
                                panelWires = null;
                            }
                            break;
                        case 'XT4':
                            mccbRight = 'Y';
                            mccbCenterRight = 'N';
                            frame = 'XT4';
                            panelWires = null;
                            break;
                        case 'XT4-PROV':
                            mccbRight = 'Y';
                            mccbCenterRight = 'N';
                            frame = 'XT4';
                            panelWires = null;
                            break;
                        case 'XT2':
                            mccbRight = 'Y';
                            mccbCenterRight = 'N';
                            frame = 'XT2';
                            panelWires = null;
                            break;
                        case 'XT2-PROV':
                            mccbRight = 'Y';
                            mccbCenterRight = 'N';
                            frame = 'XT2';
                            panelWires = null;
                            break;
                    }
                }
            } else if (row[0].mount == 'TWIN') {
                panelWires = null;
                if (row[0].cbRightFrame == null) {
                    mccbRight = 'N';
                    mccbCenterRight = 'N';
                    switch (row[0].cbLeftFrame) {
                        case 'L':
                            mccbLeft = 'Y';
                            mccbCenterLeft = 'N';
                            frame = 'L';
                            break;
                        case 'L-PROV':
                            mccbLeft = 'Y';
                            mccbCenterLeft = 'N';
                            frame = 'L';
                            break;
                        case 'J':
                            mccbLeft = 'Y';
                            mccbCenterLeft = 'N';
                            frame = 'H/J';
                            break;
                        case 'J-PROV':
                            mccbLeft = 'Y';
                            mccbCenterLeft = 'N';
                            frame = 'H/J';
                            break;
                        case 'H':
                            mccbLeft = 'Y';
                            mccbCenterLeft = 'N';
                            frame = 'H/J';
                            break;
                        case 'H-PROV':
                            mccbLeft = 'Y';
                            mccbCenterLeft = 'N';
                            frame = 'H/J';
                            break;
                        case 'XT5':
                            mccbLeft = 'Y';
                            mccbCenterLeft = 'N';
                            frame = 'XT5';
                            break;
                        case 'XT5-PROV':
                            mccbLeft = 'Y';
                            mccbCenterLeft = 'N';
                            frame = 'XT5';
                            break;
                        case 'XT4':
                            mccbLeft = 'Y';
                            mccbCenterLeft = 'N';
                            frame = 'XT4';
                            break;
                        case 'XT4-PROV':
                            mccbLeft = 'Y';
                            mccbCenterLeft = 'N';
                            frame = 'XT4';
                            break;
                        case 'XT2':
                            mccbLeft = 'Y';
                            mccbCenterLeft = 'N';
                            frame = 'XT2';
                            break;
                        case 'XT2-PROV':
                            mccbLeft = 'Y';
                            mccbCenterLeft = 'N';
                            frame = 'XT2';
                            break;
                    }
                } else if (row[0].cbLeftFrame == null) {
                    mccbLeft = 'N';
                    mccbCenterLeft = 'N';
                    switch (row[0].cbRightFrame) {
                        case 'L':
                            mccbRight = 'Y';
                            mccbCenterRight = 'N';
                            frame = 'L';
                            break;
                        case 'L-PROV':
                            mccbRight = 'Y';
                            mccbCenterRight = 'N';
                            frame = 'L';
                            break;
                        case 'J':
                            mccbRight = 'Y';
                            mccbCenterRight = 'N';
                            frame = 'H/J';
                            break;
                        case 'J-PROV':
                            mccbRight = 'Y';
                            mccbCenterRight = 'N';
                            frame = 'H/J';
                            break;
                        case 'H':
                            mccbRight = 'Y';
                            mccbCenterRight = 'N';
                            frame = 'H/J';
                            break;
                        case 'H-PROV':
                            mccbRight = 'Y';
                            mccbCenterRight = 'N';
                            frame = 'H/J';
                            break;
                        case 'XT5':
                            mccbRight = 'Y';
                            mccbCenterRight = 'N';
                            frame = 'XT5';
                            break;
                        case 'XT5-PROV':
                            mccbRight = 'Y';
                            mccbCenterRight = 'N';
                            frame = 'XT5';
                            break;
                        case 'XT4':
                            mccbRight = 'Y';
                            mccbCenterRight = 'N';
                            frame = 'XT4';
                            break;
                        case 'XT4-PROV':
                            mccbRight = 'Y';
                            mccbCenterRight = 'N';
                            frame = 'XT4';
                            break;
                        case 'XT2':
                            mccbRight = 'Y';
                            mccbCenterRight = 'N';
                            frame = 'XT2';
                            break;
                        case 'XT2-PROV':
                            mccbRight = 'Y';
                            mccbCenterRight = 'N';
                            frame = 'XT2';
                            break;
                    }
                } else {
                    mccbLeft = 'Y';
                    mccbCenterLeft = 'N';
                    mccbRight = 'Y';
                    mccbCenterRight = 'N';
                    switch (row[0].cbLeftFrame) {
                        case 'L':
                            frame = 'L';
                            break;
                        case 'L-PROV':
                            frame = 'L';
                            break;
                        case 'J':
                            frame = 'H/J';
                            break;
                        case 'J-PROV':
                            frame = 'H/J';
                            break;
                        case 'H':
                            frame = 'H/J';
                            break;
                        case 'H-PROV':
                            frame = 'H/J';
                            break;
                        case 'XT5':
                            frame = 'XT5';
                            break;
                        case 'XT5-PROV':
                            frame = 'XT5';
                            break;
                        case 'XT4':
                            frame = 'XT4';
                            break;
                        case 'XT4-PROV':
                            frame = 'XT4';
                            break;
                        case 'XT2':
                            frame = 'XT2';
                            break;
                        case 'XT2-PROV':
                            frame = 'XT2';
                            break;
                    }
                }

            }
            let fillerLookup = {
                mfgProductLine: row[0].mfgProductLine,
                frame: frame,
                poles: row[0].poles,
                panelWires: panelWires,
                mccbRight: mccbRight,
                mccbLeft: mccbLeft,
                mccbCenterRight: mccbCenterRight,
                mccbCenterLeft: mccbCenterLeft,
                skru: 'N',
                mimicLevel: 0
            };
            let chosenFiller = fillerData.filter(e => e.mfgProductLine == fillerLookup.mfgProductLine && e.frame == fillerLookup.frame && e.poles == fillerLookup.poles && e.panelWires == fillerLookup.panelWires && e.mccbRight == fillerLookup.mccbRight && e.mccbLeft == fillerLookup.mccbLeft && e.mccbCenterRight == fillerLookup.mccbCenterRight && e.mccbCenterLeft == fillerLookup.mccbCenterLeft && e.skru == 'N' && e.mimicLevel == 0);
            await creo(sessionId, {
                command: "file",
                function: "assemble",
                data: {
                    file: chosenFiller[0].fillerAsm+".asm",
                    into_asm: jobNum+"-0100-"+sectionNum+".asm",
                    constraints: [{
                        asmref: CS,
                        compref: chosenFiller[0].csys,
                        type: "CSYS"
                    }]
                }
            });


        }

        await regenSaveAndClose(sessionId, newPanelAsm+".asm");

        //PANEL ONE-LINE CREATION
        await creo(sessionId, {
            command: "file",
            function: "open",
            data: {
                file: "000123-0650-102.asm",
                dirname: creoData[0].standardLib,
                display: true,
                activate: true
            }
        });

        let newOneLineSection = jobNum+"-0650-"+sectionNum;

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
                    "~ Update `file_saveas` `Inputname` " + "`" + newOneLineSection + "`;" +
                    "~ Activate `file_saveas` `OK`;~ Activate `assyrename` `OpenBtn`;"
            }
        });

        await creo(sessionId, {
            command: "file",
            function: "open",
            data: {
                file: newOneLineSection+".asm",
                display: true,
                activate: true,
                new_window: true
            }
        });

        let totalRows = creoPanel.rows.length;
        if (creoPanel.mainLug == "TOP" ) {
            totalRows += 1;
            await creo(sessionId, {
                command: "file",
                function: "assemble",
                data: {
                    file: "000000-6500-524.prt",
                    into_asm: newOneLineSection+".asm",
                    constraints: [{
                        "asmref": "CSYS_1",
                        "compref": "PRT_CSYS_DEF",
                        "type": "csys"
                    }]
                }
            });
        } else if (creoPanel.mainLug == "BOTTOM") {
            await creo(sessionId, {
                command: "file",
                function: "assemble",
                data: {
                    file: "000000-6500-523.prt",
                    into_asm: newOneLineSection+".asm",
                    constraints: [{
                        "asmref": "CSYS_"+totalRows,
                        "compref": "PRT_CSYS_DEF",
                        "type": "csys"
                    }]
                }
            });
        }

        await creo(sessionId, {
            command: "dimension",
            function: "set",
            data: {
                file: newOneLineSection+".asm",
                name: 'QTY_DEVICE',
                value: totalRows
            }
        });

        await regenSaveAndClose(sessionId, newOneLineSection+".asm");

        let existingBrks = await creo(sessionId, {
            command: "file",
            function: "list",
            data: {
                file: jobNum+"-6500-*.prt"
            }
        });


        let count = 0;

        if (existingBrks.data != undefined) {
            count += existingBrks.data.files.length;
        }

        let maxRow = creoPanel.rows.length;
        for (let i = 0; i < maxRow; i++) {
            let rowData = creoPanel.rows.filter(e => e.panelRow == i + 1);
            for (let row of rowData[0].breakers) {
                count += 1;
                await creo(sessionId, {
                    command: "file",
                    function: "open",
                    data: {
                        file: "000123-6500-002.prt",
                        display: true,
                        activate: true
                    }
                });

                let newBrkOneLine;
                if (count < 10) {
                    newBrkOneLine = jobNum + "-6500-" + "00" + count;
                } else {
                    newBrkOneLine = jobNum + "-6500-" + "0" + count;
                }

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
                            "~ Update `file_saveas` `Inputname` " + "`" + newBrkOneLine + "`;" +
                            "~ Activate `file_saveas` `OK`;~ Activate `assyrename` `OpenBtn`;"
                    }
                });

                await creo(sessionId, {
                    command: "file",
                    function: "open",
                    data: {
                        file: newBrkOneLine + ".prt",
                        display: true,
                        activate: true
                    }
                });

                let breaker = await querySql("SELECT * FROM " + database + "." + dbConfig.submittal_breaker_table + " WHERE devID = ?", row.devID);

                const breakerAccessories = await getBreakerAccessories(breaker[0]);
                let accString = "";
                let accString_1;
                let accString_2;

                for (let j = 0; j < breakerAccessories.length; j++) {
                    if (breakerAccessories[j].opt != null) {
                        if (j != (breakerAccessories.length - 1)) {
                            accString += breakerAccessories[j].name + "(" + breakerAccessories[j].opt + "), "
                        } else {
                            accString += breakerAccessories[j].name + "(" + breakerAccessories[j].opt + ")"
                        }
                    } else {
                        if (j != (breakerAccessories.length - 1)) {
                            accString += breakerAccessories[j].name + ", "
                        } else {
                            accString += breakerAccessories[j].name
                        }
                    }
                }

                if (accString.length < 80) {
                    accString_1 = accString;
                    accString_2 = ""
                } else {
                    accString_1 = accString.slice(0, 80);
                    accString_2 = accString.slice(80, accString.length);
                }

                let mfg, productLine;
                if (breaker[0].platform == 'SQUARE D POWERPACT') {
                    mfg = 'SQUARE D';
                    productLine = 'POWERPACT';
                } else if (breaker[0].platform == 'ABB TMAX') {
                    mfg = 'ABB';
                    productLine = 'TMAX';
                }

                let stringBrkParams = {
                    DESIGNATION: breaker[0].devDesignation,
                    DEVICE_TYPE: "MCCB",
                    PART_NO: breaker[0].brkPN,
                    CRADLE_PN: null,
                    MANUFACTURER: mfg,
                    PRODUCT_LINE: productLine,
                    FRAME: breaker[0].brkPN.slice(0, 1),
                    MOUNTING: "FIXED",
                    STANDARD: breaker[0].devUL,
                    OPERATION: breaker[0].devOperation,
                    VOLTAGE: breaker[0].devMaxVolt,
                    IC_RATING: breaker[0].devKAIC,
                    FRAME_AMPS: breaker[0].devFrameSet,
                    SENSOR_AMPS: breaker[0].devSensorSet,
                    TRIP_AMPS: breaker[0].devTripSet + "A",
                    TRIP_UNIT: breaker[0].devTripUnit.split('Micrologic ')[1],
                    PARAMETER: breaker[0].devTripParam,
                    LUG_TYPE: breaker[0].devLugType,
                    LUG_SIZE: breaker[0].devLugSize,
                    ACCESSORIES: accString_1,
                    ACCESSORIES_2: accString_2
                };

                let intBrkParams = {
                    DEVICE_SUMMARY: 1,
                    POLES: breaker[0].devPoles,
                    LUG_QTY: breaker[0].devLugQty
                };

                for (let brkParam in intBrkParams) {
                    await creo(sessionId, {
                        command: "parameter",
                        function: "set",
                        data: {
                            file: newBrkOneLine + ".prt",
                            name: brkParam.toString(),
                            type: "INTEGER",
                            value: intBrkParams[brkParam],
                            no_create: false
                        }
                    });
                }
                for (let brkParam in stringBrkParams) {
                    await creo(sessionId, {
                        command: "parameter",
                        function: "set",
                        data: {
                            file: newBrkOneLine + ".prt",
                            name: brkParam.toString(),
                            type: "STRING",
                            value: stringBrkParams[brkParam],
                            no_create: false
                        }
                    });
                }

                if (breaker[0].brkPN.length != 0) {
                    await creo(sessionId, {
                        command: "feature",
                        function: "resume",
                        data: {
                            file: newBrkOneLine + ".prt",
                            name: "BREAKER"
                        }
                    });
                }

                await regenSaveAndClose(sessionId, newBrkOneLine + ".prt");


                let lugRow = 0;

                if (creoPanel.mainLug == 'TOP') {
                    lugRow += 1;
                }

                if (row.mount == 'LEFT' || row.mount == 'CENTER - LEFT') {
                    await creo(sessionId, {
                        command: "file",
                        function: "assemble",
                        data: {
                            file: newBrkOneLine+".prt",
                            into_asm: newOneLineSection+".asm",
                            constraints: [{
                                "asmref": "CSL_"+(rowData[0].panelRow + lugRow),
                                "compref": "PRT_CSYS_DEF",
                                "type": "csys"
                            }]
                        }
                    });
                    await creo(sessionId, {
                        command: "file",
                        function: "assemble",
                        data: {
                            file: "000000-6500-522.prt",
                            into_asm: newOneLineSection+".asm",
                            constraints: [{
                                "asmref": "CSL_"+(rowData[0].panelRow + lugRow),
                                "compref": "PRT_CSYS_DEF",
                                "type": "csys"
                            }]
                        }
                    });
                } else if (row.mount == 'RIGHT' || row.mount == 'CENTER - RIGHT') {
                    await creo(sessionId, {
                        command: "file",
                        function: "assemble",
                        data: {
                            file: newBrkOneLine+".prt",
                            into_asm: newOneLineSection+".asm",
                            constraints: [{
                                "asmref": "CSR_"+(rowData[0].panelRow + lugRow),
                                "compref": "PRT_CSYS_DEF",
                                "type": "csys"
                            }]
                        }
                    });
                    await creo(sessionId, {
                        command: "file",
                        function: "assemble",
                        data: {
                            file: "000000-6500-521.prt",
                            into_asm: newOneLineSection+".asm",
                            constraints: [{
                                "asmref": "CSR_"+(rowData[0].panelRow + lugRow),
                                "compref": "PRT_CSYS_DEF",
                                "type": "csys"
                            }]
                        }
                    })
                }
            }
        }
        let lugRow = 0;
        if (creoPanel.mainLug == 'TOP') {
            lugRow += 1;
        }


        for (let i = 0; i < maxRow; i++) {
            await creo(sessionId, {
                command: "file",
                function: "assemble",
                data: {
                    file: "000000-6500-511.prt",
                    into_asm: newOneLineSection+".asm",
                    constraints: [{
                        "asmref": "CSYS_"+(i+1+lugRow),
                        "compref": "PRT_CSYS_DEF",
                        "type": "csys"
                    }]
                }
            });
        }

        await creo(sessionId,{
            command: "file",
            function: "assemble",
            data: {
                file: "000000-6500-301.prt",
                into_asm: newOneLineSection+".asm",
                constraints:[{
                    "asmref":"CSYS_0",
                    "compref": "PRT_CSYS_DEF",
                    "type": "csys"
                }]
            }
        });
        return null;
    }
    async function getBreakerAccessories(breaker) {

        let brkAccArray = [];
        const accessoriesList = await querySql("SELECT * FROM " + database + "." + dbConfig.submittal_brkAcc_table + " WHERE devID = ?", breaker.devID);

        for (let accessory of accessoriesList) {
            const accessoryOptionsList = await querySql("SELECT * FROM " + database + "." + dbConfig.brkAcc_options_table + " WHERE brkAccDropdownID = ?", accessory.brkAccDropdownID);
            brkAccArray.push({
                name: accessoryOptionsList[0].brkAccNameCode,
                opt: accessoryOptionsList[0].brkAccOptCode
            })
        }

        return brkAccArray;
    }
    async function backupLayoutAndOneLine() {
        await creo(sessionId, {
            command: "file",
            function: "open",
            data: {
                file: "000123-0001-000.asm",
                dirname: creoData[0].standardLib
            }
        });

        await creo(sessionId, {
            command: "file",
            function: "backup",
            data: {
                file: "000123-0001-000.asm",
                target_dir: creoData[0].workingDir
            }
        });

        await creo(sessionId, {
            command: "file",
            function: "close_window",
            data: {}
        });


        await creo(sessionId, {
            command: "file",
            function: "open",
            data: {
                file: "000123-0600-000.asm",
                dirname: creoData[0].standardLib
            }
        });

        await creo(sessionId, {
            command: "file",
            function: "backup",
            data: {
                file: "000123-0600-000.asm",
                target_dir: creoData[0].workingDir
            }
        });

        await creo(sessionId, {
            command: "file",
            function: "close_window",
            data: {}
        });

        await creo(sessionId, {
            command: "file",
            function: "open",
            data: {
                file: "000123-0000-000-s.drw",
                dirname: creoData[0].standardLib
            }
        });

        await creo(sessionId, {
            command: "file",
            function: "backup",
            data: {
                file: "000123-0000-000-s.drw",
                target_dir: creoData[0].workingDir
            }
        });

        await creo(sessionId, {
            command: "file",
            function: "close_window",
            data: {}
        });

        return null
    }
    async function renameLayoutAndOneLine() {
        await creo(sessionId, {
            command: "file",
            function: "open",
            data: {
                file: "000123-0001-000.asm",
                dirname: creoData[0].workingDir,
                display: true,
                activate: true,
                new_window: true
            }
        });
        await creo(sessionId, {
            command: "file",
            function: "open",
            data: {
                file: "000123-0600-000.asm",
                dirname: creoData[0].workingDir,
                display: true,
                activate: true,
                new_window: true
            }
        });

        await creo(sessionId, {
            command: "file",
            function: "open",
            data: {
                file: "000123-0000-000-s.drw",
                dirname: creoData[0].workingDir,
                display: true,
                activate: true,
                new_window: true
            }
        });

        await creo(sessionId, {
            command: "file",
            function: "rename",
            data: {
                file: "000123-0001-000.asm",
                new_name: jobNum + "-0001-" + asmNum+".asm",
                onlysession: false
            }
        });


        await creo(sessionId, {
            command: "file",
            function: "rename",
            data: {
                file: "000123-0600-000.asm",
                new_name: jobNum + "-0600-" + asmNum+".asm",
                onlysession: false
            }
        });

        await creo(sessionId, {
            command: "file",
            function: "rename",
            data: {
                file: "000123-0000-000-s.drw",
                new_name: jobNum + "-0000-" + asmNum + "-s.drw",
                onlysession: false
            }
        });

        await creo(sessionId, {
            command: "file",
            function: "close_window",
            data: {
                file: jobNum + "-0001-" + asmNum+".asm"
            }
        });

        await creo(sessionId, {
            command: "file",
            function: "close_window",
            data: {
                file: jobNum + "-0600-" + asmNum+".asm"
            }
        });

        await creo(sessionId, {
            command: "file",
            function: "close_window",
            data: {
                file: jobNum + "-0000-" + asmNum + "-s.drw"
            }
        });


        return null
    }
    async function assembleSectionsIntoLayout() {

        const sectionSupplyAmp = await calculateSupplyAmperage();
        //const conduitAreas = await calculateConduitArea(sectionSupplyAmp);
        //console.log(conduitAreas);

        await creo(sessionId, {
            command: "file",
            function: "open",
            data: {
                file: jobNum + "-0001-" + asmNum + ".asm",
                dirname: creoData[0].workingDir,
                display: true,
                activate: true
            }
        });

        let count = 0;
        let prevSectionWidth = 0;
        let overallHeight = 0;
        let overallWidth = 0;
        let overallDepth = 0;
        let splitNum = 1;
        let splitWidth = 0;

        for (let section of sortedSectionSum) {
            let sectionWidth = section.secWidth;
            let sectionAmperage = sectionSupplyAmp.filter(e => e.secID == section.secID)[0].sectionAmperage.toString()+" A";
            let supplyAmperage = sectionSupplyAmp.filter(e => e.secID == section.secID)[0].supplyAmperage.toString()+" A";
            if (count == 0) {
                splitWidth += sectionWidth;
                if (splitWidth > 70) {
                    splitWidth = sectionWidth;
                    splitNum += 1
                }

                await creo(sessionId, {
                    command: "file",
                    function: "open",
                    data: {
                        file: section.sectionPN,
                        activate: true,
                        display: true,
                        new_window: true
                    }
                });

                await creo(sessionId, {
                    command: "parameter",
                    function: "set",
                    data: {
                        file: section.sectionPN,
                        name: "SPLIT",
                        type: "INTEGER",
                        value: splitNum
                    }
                });

                await creo(sessionId, {
                    command: "parameter",
                    function: "set",
                    data: {
                        file: section.sectionPN,
                        name: "SECTION_AMPERAGE",
                        type: "STRING",
                        value: sectionAmperage
                    }
                });

                await creo(sessionId, {
                    command: "parameter",
                    function: "set",
                    data: {
                        file: section.sectionPN,
                        name: "SUPPLY_AMPERAGE",
                        type: "STRING",
                        value: supplyAmperage
                    }
                });

                await regenSaveAndClose(sessionId, section.sectionPN);

                await creo(sessionId, {
                    command: "file",
                    function: "assemble",
                    data: {
                        file: section.sectionPN,
                        into_asm: jobNum + "-0001-" +asmNum + ".asm",
                        constraints: [{
                            "asmref": "CSYS_"+(count+1).toString(),
                            "compref": "CSYS_LEFT",
                            "type": "csys"
                        }]
                    }
                });
                await creo(sessionId, {
                    command: "file",
                    function: "regenerate",
                    data: {
                        file: jobNum + "-0001-" +asmNum + ".asm",
                    }
                });
                overallHeight = section.secHeight;
                overallDepth = section.secDepth;
                overallWidth += sectionWidth;
                prevSectionWidth = sectionWidth;
                count += 1;
            } else {
                splitWidth += sectionWidth;
                if (splitWidth > 70) {
                    splitWidth = sectionWidth;
                    splitNum += 1;
                }

                await creo(sessionId, {
                    command: "parameter",
                    function: "set",
                    data: {
                        file: section.sectionPN,
                        name: "SPLIT",
                        type: "INTEGER",
                        value: splitNum
                    }
                });

                await creo(sessionId, {
                    command: "parameter",
                    function: "set",
                    data: {
                        file: section.sectionPN,
                        name: "SECTION_AMPERAGE",
                        type: "STRING",
                        value: sectionAmperage
                    }
                });
                await creo(sessionId, {
                    command: "parameter",
                    function: "set",
                    data: {
                        file: section.sectionPN,
                        name: "SUPPLY_AMPERAGE",
                        type: "STRING",
                        value: supplyAmperage
                    }
                });

                await regenSaveAndClose(sessionId, section.sectionPN);


                await creo(sessionId, {
                    command: "feature",
                    function: "resume",
                    data: {
                        file: jobNum + "-0001-" + asmNum + ".asm",
                        name: "CSYS_"+(count+1).toString()
                    }
                });

                await creo(sessionId, {
                    command: "dimension",
                    function: "set",
                    data: {
                        file: jobNum + "-0001-" + asmNum + ".asm",
                        name: "X"+(count+1).toString(),
                        value: prevSectionWidth
                    }
                });

                await creo(sessionId, {
                    command: "file",
                    function: "assemble",
                    data: {
                        file: section.sectionPN,
                        into_asm: jobNum + "-0001-" +asmNum + ".asm",
                        constraints: [{
                            "asmref": "CSYS_"+(count+1).toString(),
                            "compref": "CSYS_LEFT",
                            "type": "csys"
                        }]
                    }
                });

                await creo(sessionId, {
                    command: "file",
                    function: "regenerate",
                    data: {
                        file: jobNum + "-0001-" +asmNum + ".asm"
                    }
                });

                overallWidth += sectionWidth;
                prevSectionWidth = sectionWidth;
                count += 1;

            }
        }

        await creo(sessionId, {
            command: "parameter",
            function: "set",
            data: {
                file: jobNum + "-0001-" + asmNum + ".asm",
                name: "TOTAL_WIDTH",
                value: overallWidth
            }
        });

        await creo(sessionId, {
            command: "dimension",
            function: "set",
            data: {
                file: jobNum + "-0001-" + asmNum + ".asm",
                name: "HEIGHT",
                value: overallHeight
            }
        });

        await creo(sessionId, {
            command: "dimension",
            function: "set",
            data: {
                file: jobNum + "-0001-" + asmNum + ".asm",
                name: "DEPTH",
                value: overallDepth
            }
        });

        await creo(sessionId, {
            command: "file",
            function: "regenerate",
            data: {
                file: jobNum + "-0001-" + asmNum + ".asm",
            }
        });

        await creo(sessionId, {
            command: "file",
            function: "save",
            data: {
                file: jobNum + "-0001-" + asmNum + ".asm",
                dirname: creoData[0].workingDir
            }
        });
        return null;
    }
    async function assembleSectionsIntoOneLine() {

        let layoutOneLine = jobNum + "-0600-"+ asmNum + ".asm";

        await creo(sessionId, {
            command: "file",
            function: "open",
            data: {
                file: layoutOneLine,
                dirname: creoData[0].workingDir,
                display: true,
                activate: true
            }
        });
        let count = 0;

        for (let section of sortedSectionSum) {
            if (count == 0) {
                await creo(sessionId, {
                    command: "file",
                    function: "assemble",
                    data: {
                        file: jobNum + "-0650-" + section.sectionNum + ".asm",
                        into_asm: layoutOneLine,
                        constraints: [{
                            "asmref": "CSYS_" + (count + 1).toString(),
                            "compref": "ASM_DEF_CSYS",
                            "type": "csys"
                        }]
                    }
                });
                count += 1;
            } else {
                await creo(sessionId, {
                    command: "dimension",
                    function: "set",
                    data: {
                        file: layoutOneLine,
                        name: "X"+(count+1).toString(),
                        value: 1.5
                    }
                });
                await creo(sessionId, {
                    command: "file",
                    function: "regenerate",
                    data: {
                        file: layoutOneLine
                    }
                });
                await creo(sessionId, {
                    command: "file",
                    function: "assemble",
                    data: {
                        file: jobNum + "-0650-" + section.sectionNum + ".asm",
                        into_asm: layoutOneLine,
                        constraints: [{
                            "asmref": "CSYS_" + (count + 1).toString(),
                            "compref": "ASM_DEF_CSYS",
                            "type": "csys"
                        }]
                    }
                });
                count += 1;
            }
        }
        let totalWidth = count*1.5;
        await creo(sessionId, {
            command: "parameter",
            function: "set",
            data: {
                file: layoutOneLine,
                name: "TOTAL_WIDTH",
                type: "INTEGER",
                value: totalWidth
            }
        });

        await regenAndSave(sessionId, layoutOneLine);

        return null;
    }
    async function fillLayoutParameters() {

        const submittalParams = await querySql("SELECT * FROM " + database + "." + dbConfig.submittal_summary_table + " WHERE subID = ?", subID);

        const layoutParams = await querySql("SELECT * FROM " + database + "." + dbConfig.submittal_layout_table + " WHERE subID = ?", subID);

        let kaicVoltage;

        if (layoutParams[0].systemType == 'N/A') {
            jobData = {
                PROJECT_NUMBER: submittalParams[0].jobNum,
                SO_NO: jobRelease,
                REV_1_NO: 'A',
                REV_1_DATE: moment(submittalParams[0].drawnDate).utc().format("MM/DD/YYYY"),
                REV_1_BY: submittalParams[0].drawnBy,
                PROJECT_NAME: submittalParams[0].jobName,
                CUSTOMER_NAME: submittalParams[0].customer,
                PROJECT_DESC_1: submittalParams[0].layoutName,
                PROJECT_DESC_2: layoutParams[0].ulListing + ", " + layoutParams[0].systemAmp + ", " + "N/A" + ", " + "N/A" + ", " + "N/A",
                DRAWN_BY: submittalParams[0].drawnBy,
                DRAWN_DATE:  moment(submittalParams[0].drawnDate).utc().format("MM/DD/YYYY"),
                CHECKED_BY: submittalParams[0].checkedBy,
                CHECKED_DATE: moment(submittalParams[0].checkedDate).utc().format("MM/DD/YYYY"),
                UL_LISTING: layoutParams[0].ulListing,
                SYSTEM_VOLTAGE: "N/A",
                SYSTEM_PHASING: "N/A",
                SYSTEM_AMPERAGE: layoutParams[0].systemAmp,
                ENCLOSURE_TYPE: layoutParams[0].enclosure,
                CABLING_ACCESSIBILITY: layoutParams[0].cableAccess,
                BUS_BRACING: layoutParams[0].busBracing,
                FINISH:  layoutParams[0].paint,
                INTERRUPTING_RATING: "N/A",
                BUSSING: layoutParams[0].busType,
                KEY_INTERLOCKS: layoutParams[0].keyInterlocks
            };
        } else {
            switch (layoutParams[0].systemType.split(' - ')[0]) {
                case '208Y/120VAC':
                    kaicVoltage = '208VAC';
                    break;

                case '240VAC':
                    kaicVoltage = '240VAC';
                    break;

                case '380Y/220VAC':
                    kaicVoltage = '380VAC';
                    break;

                case '400Y/230VAC':
                    kaicVoltage = '400VAC';
                    break;

                case '415Y/240VAC':
                    kaicVoltage = '415VAC';
                    break;

                case '480VAC':
                    kaicVoltage = '480VAC';
                    break;

                case '480Y/277VAC':
                    kaicVoltage = '480VAC';
                    break;

                case '600VAC':
                    kaicVoltage = '600VAC';
                    break;

                case '600Y/347VAC':
                    kaicVoltage = '600VAC';
                    break;

                case '500VDC':
                    kaicVoltage = '500VDC';
                    break;

                case '600VDC':
                    kaicVoltage = '600VDC';
                    break;

                default:
                    break;
            }

            jobData = {
                PROJECT_NUMBER: submittalParams[0].jobNum,
                SO_NO: jobRelease,
                REV_1_NO: 'A',
                REV_1_DATE: moment(submittalParams[0].drawnDate).utc().format("MM/DD/YYYY"),
                REV_1_BY: submittalParams[0].drawnBy,
                PROJECT_NAME: submittalParams[0].jobName,
                CUSTOMER_NAME: submittalParams[0].customer,
                PROJECT_DESC_1: submittalParams[0].layoutName,
                PROJECT_DESC_2: layoutParams[0].ulListing + ", " + layoutParams[0].systemAmp + ", " + layoutParams[0].systemType.split(' - ')[1] + ", " + layoutParams[0].systemType.split(' - ')[0] + ", " + layoutParams[0].interruptRating + "@" + kaicVoltage,
                DRAWN_BY: submittalParams[0].drawnBy,
                DRAWN_DATE:  moment(submittalParams[0].drawnDate).utc().format("MM/DD/YYYY"),
                CHECKED_BY: submittalParams[0].checkedBy,
                CHECKED_DATE: moment(submittalParams[0].checkedDate).utc().format("MM/DD/YYYY"),
                UL_LISTING: layoutParams[0].ulListing,
                SYSTEM_VOLTAGE: layoutParams[0].systemType.split(' - ')[0],
                SYSTEM_PHASING: layoutParams[0].systemType.split(' - ')[1],
                SYSTEM_AMPERAGE: layoutParams[0].systemAmp,
                ENCLOSURE_TYPE: layoutParams[0].enclosure,
                CABLING_ACCESSIBILITY: layoutParams[0].cableAccess,
                BUS_BRACING: layoutParams[0].busBracing,
                FINISH:  layoutParams[0].paint,
                INTERRUPTING_RATING: layoutParams[0].interruptRating + "@" + kaicVoltage,
                BUSSING: layoutParams[0].busType,
                KEY_INTERLOCKS: layoutParams[0].keyInterlocks
            };
        }

        await creo(sessionId, {
            command: "file",
            function: "open",
            data: {
                file: jobNum + "-0001-" + asmNum + ".asm",
                dirname: creoData[0].workingDir,
                display: true,
                activate: true
            }
        });



        for (let parameter in jobData) {
            await creo(sessionId, {
                command: "parameter",
                function: "set",
                data: {
                    file: jobNum + "-0001-" + asmNum + ".asm",
                    name: parameter.toString(),
                    type: "STRING",
                    value: jobData[parameter.toString()]
                }
            });
        }


        await regenSaveAndClose(sessionId, jobNum+"-0001-"+asmNum+".asm");

        return null

    }
    async function calculateSupplyAmperage() {
        let ul891SecBusAmps = [800, 1200, 1600, 2000, 2500, 3000, 3200, 4000, 5000];
        let ul1558SecBusAmps = [2000, 3200, 4000, 5000];
        let deratingFactors = [1, 0.8, 0.8, 0.7];
        let maxSupplyAmp = 0;
        let ulListing;
        const layouts = await querySql("SELECT * FROM " + database + "." + dbConfig.submittal_layout_table + " WHERE subID = ?", subID);
        for (let layout of layouts) {
            if (layout.systemAmp != 'N/A') {
                maxSupplyAmp = 0;
            } else {
                maxSupplyAmp = parseInt(layout.systemAmp.slice(0, layout.systemAmp.length - 1));
            }
            ulListing = layout.ulListing
        }
        let sectionAndSupplyArr = [];

        let prevSupplyAmp = maxSupplyAmp;
        for (let section of sortedSectionSum) {
            let tieOnly = false;
            let supplyAmperage = 0;
            if (section.secType.includes('PANELBOARD') == false) {
                if (section.secType == 'CONTROL') {
                    sectionAndSupplyArr.push({
                        secID: section.secID,
                        supplyAmperage: 0,
                        sectionAmperage: 0,
                        tieOnly: false
                    });
                }
                let sumCompartmentAmps = 0;
                let numDistBreakers = 0;
                let sectionBrks = breakerData.filter(e => e.secID == section.secID);
                let tieAmperageR = 0;
                let tieAmperageL = 0;
                for (let breaker of sectionBrks) {
                    if (breaker.devFunction.includes('MAIN') == true) {
                        if (parseInt(breaker.devFrameSet.slice(0, breaker.devFrameSet.length - 1)) < maxSupplyAmp) {
                            supplyAmperage = prevSupplyAmp;
                            prevSupplyAmp = supplyAmperage;
                            sumCompartmentAmps += supplyAmperage;
                        } else if (parseInt(breaker.devFrameSet.slice(0, breaker.devFrameSet.length - 1)) == maxSupplyAmp) {
                            supplyAmperage = parseInt(breaker.devFrameSet.slice(0, breaker.devFrameSet.length - 1));
                            prevSupplyAmp = supplyAmperage;
                            sumCompartmentAmps += supplyAmperage;
                        } else if (parseInt(breaker.devFrameSet.slice(0, breaker.devFrameSet.length - 1)) > maxSupplyAmp) {
                            supplyAmperage = maxSupplyAmp;
                            prevSupplyAmp = supplyAmperage;
                            sumCompartmentAmps += supplyAmperage;
                        }
                    } else if (breaker.devFunction.includes('TIE') == true) {
                        if (breakerData.filter(e => e.secID == breaker.secID).length > 1) {
                            let tieLocation = breaker.devFunction.split(' - ')[1];
                            if (tieLocation == 'L') {
                                supplyAmperage = parseInt(breaker.devFrameSet.slice(0, breaker.devFrameSet.length - 1));
                                tieAmperageL = supplyAmperage;
                            } else if (tieLocation == 'R') {
                                supplyAmperage = prevSupplyAmp;
                                tieAmperageR = parseInt(breaker.devFrameSet.slice(0, breaker.devFrameSet.length - 1));
                            }
                        } else {
                            supplyAmperage = parseInt(breaker.devFrameSet.slice(0, breaker.devFrameSet.length - 1));
                            prevSupplyAmp = supplyAmperage;
                            sumCompartmentAmps = supplyAmperage;
                            tieOnly = true;
                        }
                    } else if (breaker.devFunction.includes('DIST') == true) {
                        if (tieAmperageR != 0) {
                            sumCompartmentAmps = tieAmperageR;
                            supplyAmperage = prevSupplyAmp;
                            prevSupplyAmp = tieAmperageR;
                            numDistBreakers += 1;
                        } else if (tieAmperageL != 0) {
                            sumCompartmentAmps = tieAmperageL;
                            supplyAmperage = tieAmperageL;
                            prevSupplyAmp = tieAmperageL;
                            numDistBreakers += 1;
                        } else {
                            sumCompartmentAmps += parseInt(breaker.devFrameSet.slice(0, breaker.devFrameSet.length - 1));
                            supplyAmperage = prevSupplyAmp;
                            numDistBreakers += 1;
                        }
                    }
                }
                if (maxSupplyAmp <= 5000) {
                    if (sumCompartmentAmps < supplyAmperage) {
                        if (ulListing == 'UL891') {
                            let applicableSectionAmps = ul891SecBusAmps.filter(e => e >= sumCompartmentAmps);
                            sectionAndSupplyArr.push({
                                secID: section.secID,
                                supplyAmperage: supplyAmperage,
                                sectionAmperage: applicableSectionAmps[0],
                                tieOnly: tieOnly
                            });

                        } else if (ulListing == 'UL1558') {
                            let applicableSectionAmps = ul1558SecBusAmps.filter(e => e >= sumCompartmentAmps);
                            sectionAndSupplyArr.push({
                                secID: section.secID,
                                supplyAmperage: supplyAmperage,
                                sectionAmperage: applicableSectionAmps[0],
                                tieOnly: tieOnly
                            });
                        }
                    } else {
                        sectionAndSupplyArr.push({
                            secID: section.secID,
                            supplyAmperage: supplyAmperage,
                            sectionAmperage: supplyAmperage,
                            tieOnly: tieOnly
                        });
                    }
                } else if (maxSupplyAmp > 5000) {
                    if (sumCompartmentAmps < supplyAmperage) {
                        if (ulListing == 'UL891') {
                            let applicableSectionAmps = ul891SecBusAmps.filter(e => e >= sumCompartmentAmps);
                            sectionAndSupplyArr.push({
                                secID: section.secID,
                                supplyAmperage: supplyAmperage,
                                sectionAmperage: applicableSectionAmps[0],
                                tieOnly: tieOnly
                            });

                        } else if (ulListing == 'UL1558') {
                            let applicableSectionAmps = ul1558SecBusAmps.filter(e => e >= sumCompartmentAmps);
                            sectionAndSupplyArr.push({
                                secID: section.secID,
                                supplyAmperage: supplyAmperage,
                                sectionAmperage: applicableSectionAmps[0],
                                tieOnly: tieOnly
                            });
                        }
                    } else {
                        let deratedSectionAmperage = deratingFactors[numDistBreakers]*sumCompartmentAmps;

                        if (deratedSectionAmperage < supplyAmperage) {
                            if (ulListing == 'UL891') {
                                let applicableSectionAmps = ul891SecBusAmps.filter(e => e >= deratedSectionAmperage);
                                sectionAndSupplyArr.push({
                                    secID: section.secID,
                                    supplyAmperage: supplyAmperage,
                                    sectionAmperage: applicableSectionAmps[0],
                                    tieOnly: tieOnly
                                });

                            } else if (ulListing == 'UL1558') {
                                let applicableSectionAmps = ul1558SecBusAmps.filter(e => e >= deratedSectionAmperage);
                                sectionAndSupplyArr.push({
                                    secID: section.secID,
                                    supplyAmperage: supplyAmperage,
                                    sectionAmperage: applicableSectionAmps[0],
                                    tieOnly: tieOnly
                                });
                            }
                        } else {
                            //error

                        }
                    }
                }
            } else {
                if (section.secType == 'PANELBOARD - NO MAIN LUG') {
                    sectionAndSupplyArr.push({
                        secID: section.secID,
                        supplyAmperage: prevSupplyAmp,
                        sectionAmperage: parseInt(section.secAmp.split(' - ')[1].slice(0,section.secAmp.split(' - ')[1].length - 6).split('/')[1]),
                        tieOnly: tieOnly
                    });
                } else {
                    sectionAndSupplyArr.push({
                        secID: section.secID,
                        supplyAmperage: prevSupplyAmp,
                        sectionAmperage: parseInt(section.secAmp.split(' - ')[1].slice(0,section.secAmp.split(' - ')[1].length - 6).split('/')[0]),
                        tieOnly: tieOnly
                    });
                }
            }
        }
        return sectionAndSupplyArr
    }
    async function calculateConduitArea(sectionSupplyAmp) {
        let conduitAreas = [];
        console.log(sectionSupplyAmp);
        for (let section of sortedSectionSum) {
            let sectionAmp = sectionSupplyAmp.filter(e => e.secID == section.secID)[0].sectionAmperage;
            let supplyAmp = sectionSupplyAmp.filter(e => e.secID == section.secID)[0].supplyAmperage;
            let tieOnly = sectionSupplyAmp.filter(e => e.secID == section.secID)[0].tieOnly;
            if (section.secType.includes('PANELBOARD') == true) {
                //PANEL CONDUIT SKETCH
            } else {
                if (tieOnly == true) {
                    //DELETE CONDUIT AREA SKETCH
                } else {
                    //CALCULATE CONDUIT AREA SIZE


                }
            }


        }
        return conduitAreas;
    }
    async function placeOneLineBrksAndFillParams(count, section, usedBreaker) {

        const breakerData = await querySql("SELECT * FROM " + database + "." + dbConfig.submittal_breaker_table + " WHERE devID = ?", usedBreaker.devID);

        let copyBreakerOneLinePN;
        let breakerOneLinePN;
        let instanceNum;
        let devType;
        let productLine;
        let mfg;
        let tripUnit;

        if (count < 10) {
            instanceNum = '00'+count;
        } else if (count < 100) {
            instanceNum = '0'+count;
        }

        if (usedBreaker.catCode == '37-CB IC') {
            devType = 'ICCB';
            if (usedBreaker.platform == 'SQUARE D MASTERPACT NW') {
                mfg = 'SQUARE D';
                productLine = 'MASTERPACT';
                tripUnit = breakerData[0].devTripUnit.split('MICROLOGIC ')[1];
            } else if (usedBreaker.platform == 'ABB EMAX2') {
                mfg = 'ABB';
                productLine = 'EMAX2';
                tripUnit = breakerData[0].devTripUnit;
            }
            if (usedBreaker.devMount == 'DRAWOUT') {
                if (usedBreaker.provision == 'Y') {
                    copyBreakerOneLinePN = '000123-6500-005';
                    breakerOneLinePN = jobNum+"-6500-"+instanceNum;
                } else if (usedBreaker.provision == 'N') {
                    copyBreakerOneLinePN = '000123-6500-004';
                    breakerOneLinePN = jobNum+"-6500-"+instanceNum;
                }
            } else if (usedBreaker.devMount == 'FIXED') {
                if (usedBreaker.provision == 'Y') {
                    copyBreakerOneLinePN = '000123-6500-002';
                    breakerOneLinePN = jobNum+"-6500-"+instanceNum;
                } else if (usedBreaker.provision == 'N') {
                    copyBreakerOneLinePN = '000123-6500-001';
                    breakerOneLinePN = jobNum+"-6500-"+instanceNum;
                }
            }
        } else if (usedBreaker.catCode == '36-CB MC') {
            devType = 'MCCB';
            if (usedBreaker.platform == 'SQUARE D POWERPACT') {
                mfg = 'SQUARE D';
                productLine = 'POWERPACT';
                tripUnit = breakerData[0].devTripUnit.split('MICROLOGIC ')[1];
            } else if (usedBreaker.platform == 'ABB TMAX') {
                mfg = 'ABB';
                productLine = 'TMAX';
                tripUnit = breakerData[0].devTripUnit;
            }
        }

        let stringBrkParams = {
            DESIGNATION: usedBreaker.devDesignation,
            DEVICE_TYPE: devType,
            PART_NO: breakerData[0].brkPN,
            CRADLE_PN: breakerData[0].cradlePN,
            MANUFACTURER: mfg,
            PRODUCT_LINE: productLine,
            FRAME: usedBreaker.devFrame,
            MOUNTING: usedBreaker.devMount,
            STANDARD: breakerData[0].devUL,
            OPERATION: breakerData[0].devOperation,
            VOLTAGE: breakerData[0].devMaxVolt,
            IC_RATING: breakerData[0].devKAIC,
            FRAME_AMPS: breakerData[0].devFrameSet,
            SENSOR_AMPS: breakerData[0].devSensorSet,
            TRIP_AMPS: breakerData[0].devTripSet+"A",
            TRIP_UNIT: tripUnit,
            PARAMETER: breakerData[0].devTripParam,
            LUG_TYPE: usedBreaker.lugType,
            LUG_SIZE: usedBreaker.lugSize,
            ACCESSORIES: usedBreaker.accessories_1,
            ACCESSORIES_2: usedBreaker.accessories_2
        };

        let intBrkParams = {
            DEVICE_SUMMARY: 1,
            POLES: usedBreaker.devPoles,
            LUG_QTY: usedBreaker.lugQty
        };


        let sectionOneLinePN = jobNum+"-0650-"+section.sectionNum;

        const sectionOneLineExist = await creo(sessionId, {
            command: "file",
            function: "exists",
            data: {
                file: sectionOneLinePN+".asm"
            }
        });

        if (sectionOneLineExist.data) {
            if (sectionOneLineExist.data.exists == false) {
                await creo(sessionId, {
                    command: "file",
                    function: "open",
                    data: {
                        file: "000123-0650-101.asm",
                        dirname: creoData[0].standardLib,
                        display: true,
                        activate: true
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
                            "~ Update `file_saveas` `Inputname` " + "`" + sectionOneLinePN + "`;" +
                            "~ Activate `file_saveas` `OK`;~ Activate `assyrename` `OpenBtn`;"
                    }
                });
            }



            await creo(sessionId, {
                command: "file",
                function: "open",
                data: {
                    file: sectionOneLinePN+".asm",
                    dirname: creoData[0].workingDir,
                    display: true,
                    activate: true
                }
            });

            await creo(sessionId, {
                command: "file",
                function: "open",
                data: {
                    file: copyBreakerOneLinePN+".prt",
                    dirname: creoData[0].standardLib,
                    display: true,
                    activate: true
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
                        "~ Update `file_saveas` `Inputname` " + "`" + breakerOneLinePN + "`;" +
                        "~ Activate `file_saveas` `OK`;~ Activate `assyrename` `OpenBtn`;"
                }
            });

            await creo(sessionId, {
                command: "file",
                function: "open",
                data: {
                    file: breakerOneLinePN+".prt",
                    dirname: creoData[0].workingDir,
                    display: true,
                    activate: true
                }
            });

            for (let brkParam in intBrkParams) {
                await creo(sessionId, {
                    command: "parameter",
                    function: "set",
                    data: {
                        file: breakerOneLinePN+".prt",
                        name: brkParam.toString(),
                        type: "INTEGER",
                        value: intBrkParams[brkParam].toString(),
                        no_create: false
                    }
                });
            }
            for (let brkParam in stringBrkParams) {
                await creo(sessionId, {
                    command: "parameter",
                    function: "set",
                    data: {
                        file: breakerOneLinePN+".prt",
                        name: brkParam.toString(),
                        type: "STRING",
                        value: stringBrkParams[brkParam].toString(),
                        no_create: false
                    }
                });
            }

            await creo(sessionId, {
                command: "file",
                function: "save",
                data: {
                    file: breakerOneLinePN
                }
            });

            await creo(sessionId, {
                command: "file",
                function: "close_window",
                data: {
                    file: breakerOneLinePN+".prt",
                    dirname: creoData[0].workingDir
                }
            });

            if (breakerData[0].devFunction.split(' - ')[0] == 'MAIN' || breakerData[0].devFunction.split(' - ')[0] == 'DIST') {
                await creo(sessionId, {
                    command: "file",
                    function: "assemble",
                    data: {
                        file: breakerOneLinePN+".prt",
                        into_asm:  sectionOneLinePN+".asm",
                        constraints: [{
                            "asmref": "CSYS_"+usedBreaker.comp,
                            "compref": "PRT_CSYS_DEF",
                            "type": "csys"
                        }]
                    }
                });
            } else if (breakerData[0].devFunction == 'TIE - L') {
                await creo(sessionId, {
                    command: "file",
                    function: "assemble",
                    data: {
                        file: breakerOneLinePN+".prt",
                        into_asm:  sectionOneLinePN+".asm",
                        constraints: [{
                            "asmref": "CSYS_0",
                            "compref": "PRT_CSYS_DEF",
                            "type": "csys"
                        }]
                    }
                });
            } else if (breakerData[0].devFunction == 'TIE - R') {
                await creo(sessionId, {
                    command: "file",
                    function: "assemble",
                    data: {
                        file: breakerOneLinePN+".prt",
                        into_asm:  sectionOneLinePN+".asm",
                        constraints: [{
                            "asmref": "CSYS_0",
                            "compref": "PRT_CSYS_DEF",
                            "type": "csys"
                        }]
                    }
                });
            }


            await regenSaveAndClose(sessionId, sectionOneLinePN+".asm");
        }
        return null
    }
    async function fillInRemainingOneLine(section, usedBreakers) {

        let sectionUsedICCBs = [];
        let doesTieExist = {
            exist: false,
            location: null
        };
        let sectionOneLinePN = jobNum+"-0650-"+section.sectionNum+".asm";
        for (let usedBreaker of usedBreakers) {
            if (usedBreaker.sectionNum == section.sectionNum) {
                if (usedBreaker.catCode == '37-CB IC') {
                    sectionUsedICCBs.push(usedBreaker);
                }
            }
        }


        for (let breaker of sectionUsedICCBs) {
            if (breaker.devFunction == 'TIE' && breaker.devConnection == 'L') {
                doesTieExist.exist = true;
                doesTieExist.location = 'L';
            } else if (breaker.devFunction == 'TIE' && breaker.devConnection == 'R') {
                doesTieExist.exist = true;
                doesTieExist.location = 'R';
            }
        }

        await creo(sessionId, {
            command: "file",
            function: "open",
            data: {
                file: sectionOneLinePN,
                dirname: creoData[0].workingDir,
                display: true,
                activate: true
            }
        });

        if (doesTieExist.exist == false) {
            //main bus
            await creo(sessionId, {
                command: "file",
                function: "assemble",
                data: {
                    file: "000000-6500-301.prt",
                    into_asm: sectionOneLinePN,
                    constraints: [{
                        "asmref": "CSYS_0",
                        "compref": "PRT_CSYS_DEF",
                        "type": "csys"
                    }]
                }
            });

            for (let breaker of sectionUsedICCBs) {
                if (breaker.devConnection == 'LL') {
                    //iccb lug landing right
                    await creo(sessionId, {
                        command: "file",
                        function: "assemble",
                        data: {
                            file: "000000-6500-111.prt",
                            into_asm: sectionOneLinePN,
                            constraints: [{
                                "asmref": "CSYS_"+breaker.comp,
                                "compref": "PRT_CSYS_DEF",
                                "type": "csys"
                            }]
                        }
                    });
                } else if (breaker.devConnection == 'BD') {
                    //bus duct flange right
                    await creo(sessionId, {
                        command: "file",
                        function: "assemble",
                        data: {
                            file: "000000-6500-115.prt",
                            into_asm: sectionOneLinePN,
                            constraints: [{
                                "asmref": "CSYS_"+breaker.comp,
                                "compref": "PRT_CSYS_DEF",
                                "type": "csys"
                            }]
                        }
                    });

                } else if (breaker.devConnection == 'XFMR') {
                    //xfmr cc right
                }

                if (breaker.comp == 'D') {
                    //vertical bus for D
                    await creo(sessionId, {
                        command: "file",
                        function: "assemble",
                        data: {
                            file: "000000-6500-103.prt",
                            into_asm: sectionOneLinePN,
                            constraints: [{
                                "asmref": "CSYS_"+breaker.comp,
                                "compref": "PRT_CSYS_DEF",
                                "type": "csys"
                            }]
                        }
                    });
                } else if (breaker.comp == 'BC') {
                    //vertical bus left 33.75"
                    await creo(sessionId, {
                        command: "file",
                        function: "assemble",
                        data: {
                            file: "000000-6500-105.prt",
                            into_asm: sectionOneLinePN,
                            constraints: [{
                                "asmref": "CSYS_"+breaker.comp,
                                "compref": "PRT_CSYS_DEF",
                                "type": "csys"
                            }]
                        }
                    });
                } else if (breaker.comp == 'A' || breaker.comp == 'B' || breaker.comp == 'C') {
                    //vertical bus left 22.5"
                    await creo(sessionId, {
                        command: "file",
                        function: "assemble",
                        data: {
                            file: "000000-6500-101.prt",
                            into_asm: sectionOneLinePN,
                            constraints: [{
                                "asmref": "CSYS_"+breaker.comp,
                                "compref": "PRT_CSYS_DEF",
                                "type": "csys"
                            }]
                        }
                    });
                }

                let vComp = [];
                for (let breaker of sectionUsedICCBs) {
                    if (breaker.comp == 'A') {
                        let bBrk = sectionUsedICCBs.filter(e => e.comp == 'B');
                        if (bBrk.length == 0) {
                            if (vComp.includes('B') == false) {
                                vComp.push('B');
                            }
                        }
                        let cBrk = sectionUsedICCBs.filter(e => e.comp == 'C');
                        if (cBrk.length == 0) {
                            if (vComp.includes('C') == false) {
                                vComp.push('C');
                            }
                        }
                    } else if (breaker.comp == 'B') {
                        let cBrk = sectionUsedICCBs.filter(e => e.comp == 'C');
                        if (cBrk.length == 0) {
                            if (vComp.includes('C') == false) {
                                vComp.push('C');
                            }
                        }

                    }
                }

                for (let comp of vComp) {
                    //vertical bus left
                    await creo(sessionId, {
                        command: "file",
                        function: "assemble",
                        data: {
                            file: "000000-6500-101.prt",
                            into_asm: sectionOneLinePN,
                            constraints: [{
                                "asmref": "CSYS_"+comp,
                                "compref": "PRT_CSYS_DEF",
                                "type": "csys"
                            }]
                        }
                    });
                }

            }
        } else {
            //tie bus
            await creo(sessionId, {
                command: "file",
                function: "assemble",
                data: {
                    file: "000000-6500-107.prt",
                    into_asm: sectionOneLinePN,
                    constraints: [{
                        "asmref": "CSYS_0",
                        "compref": "PRT_CSYS_DEF",
                        "type": "csys"
                    }]
                }
            });

            let tieLocation = doesTieExist.location;

            if (sectionUsedICCBs.length > 1) {
                if (tieLocation == 'L') {
                    //vertical bus right for D
                    await creo(sessionId, {
                        command: "file",
                        function: "assemble",
                        data: {
                            file: "000000-6500-104.prt",
                            into_asm: sectionOneLinePN,
                            constraints: [{
                                "asmref": "CSYS_D",
                                "compref": "PRT_CSYS_DEF",
                                "type": "csys"
                            }]
                        }
                    });
                    let vComp = [];
                    for (let breaker of sectionUsedICCBs) {
                        if (breaker.comp == 'A') {
                            let bBrk = sectionUsedICCBs.filter(e => e.comp == 'B');
                            if (bBrk.length == 0) {
                                if (vComp.includes('B') == false) {
                                    vComp.push('B');
                                }
                            }
                            let cBrk = sectionUsedICCBs.filter(e => e.comp == 'C');
                            if (cBrk.length == 0) {
                                if (vComp.includes('C') == false) {
                                    vComp.push('C');
                                }
                            }
                        } else if (breaker.comp == 'B') {
                            let cBrk = sectionUsedICCBs.filter(e => e.comp == 'C');
                            if (cBrk.length == 0) {
                                if (vComp.includes('C') == false) {
                                    vComp.push('C');
                                }
                            }

                        }
                    }

                    for (let comp of vComp) {
                        //vertical bus right
                        await creo(sessionId, {
                            command: "file",
                            function: "assemble",
                            data: {
                                file: "000000-6500-102.prt",
                                into_asm: sectionOneLinePN,
                                constraints: [{
                                    "asmref": "CSYS_"+comp,
                                    "compref": "PRT_CSYS_DEF",
                                    "type": "csys"
                                }]
                            }
                        });
                    }




                } else if (tieLocation == 'R') {
                    //vertical bus left for D
                    await creo(sessionId, {
                        command: "file",
                        function: "assemble",
                        data: {
                            file: "000000-6500-103.prt",
                            into_asm: sectionOneLinePN,
                            constraints: [{
                                "asmref": "CSYS_D",
                                "compref": "PRT_CSYS_DEF",
                                "type": "csys"
                            }]
                        }
                    });
                    let vComp = [];
                    for (let breaker of sectionUsedICCBs) {
                        if (breaker.comp == 'A') {
                            let bBrk = sectionUsedICCBs.filter(e => e.comp == 'B');
                            if (bBrk.length == 0) {
                                if (vComp.includes('B') == false) {
                                    vComp.push('B');
                                }
                            }
                            let cBrk = sectionUsedICCBs.filter(e => e.comp == 'C');
                            if (cBrk.length == 0) {
                                if (vComp.includes('C') == false) {
                                    vComp.push('C');
                                }
                            }
                        } else if (breaker.comp == 'B') {
                            let cBrk = sectionUsedICCBs.filter(e => e.comp == 'C');
                            if (cBrk.length == 0) {
                                if (vComp.includes('C') == false) {
                                    vComp.push('C');
                                }
                            }

                        }
                    }

                    for (let comp of vComp) {
                        //vertical bus left
                        await creo(sessionId, {
                            command: "file",
                            function: "assemble",
                            data: {
                                file: "000000-6500-101.prt",
                                into_asm: sectionOneLinePN,
                                constraints: [{
                                    "asmref": "CSYS_"+comp,
                                    "compref": "PRT_CSYS_DEF",
                                    "type": "csys"
                                }]
                            }
                        });
                    }
                }
            }

            for (let breaker of sectionUsedICCBs) {
                if (breaker.devFunction == 'MAIN' || breaker.devFunction == 'DIST') {
                    if (tieLocation == 'L') {

                        if (breaker.devConnection == 'LL') {
                            //iccb lug landing left
                            await creo(sessionId, {
                                command: "file",
                                function: "assemble",
                                data: {
                                    file: "000000-6500-112.prt",
                                    into_asm: sectionOneLinePN,
                                    constraints: [{
                                        "asmref": "CSYS_"+breaker.comp,
                                        "compref": "PRT_CSYS_DEF",
                                        "type": "csys"
                                    }]
                                }
                            });
                        } else if (breaker.devConnection == 'BD') {
                            //bus duct flange left
                            await creo(sessionId, {
                                command: "file",
                                function: "assemble",
                                data: {
                                    file: "000000-6500-116.prt",
                                    into_asm: sectionOneLinePN,
                                    constraints: [{
                                        "asmref": "CSYS_"+breaker.comp,
                                        "compref": "PRT_CSYS_DEF",
                                        "type": "csys"
                                    }]
                                }
                            });

                        } else if (breaker.devConnection == 'XFMR') {
                            //xfmr cc right
                        }

                        if (breaker.comp == 'D') {
                            //vertical bus right for D
                            await creo(sessionId, {
                                command: "file",
                                function: "assemble",
                                data: {
                                    file: "000000-6500-104.prt",
                                    into_asm: sectionOneLinePN,
                                    constraints: [{
                                        "asmref": "CSYS_"+breaker.comp,
                                        "compref": "PRT_CSYS_DEF",
                                        "type": "csys"
                                    }]
                                }
                            });
                        } else if (breaker.comp == 'BC') {
                            //vertical bus right 33.75"
                            await creo(sessionId, {
                                command: "file",
                                function: "assemble",
                                data: {
                                    file: "000000-6500-106.prt",
                                    into_asm: sectionOneLinePN,
                                    constraints: [{
                                        "asmref": "CSYS_"+breaker.comp,
                                        "compref": "PRT_CSYS_DEF",
                                        "type": "csys"
                                    }]
                                }
                            });
                        } else if (breaker.comp == 'A' || breaker.comp == 'B' || breaker.comp == 'C') {
                            //vertical bus right 22.5"
                            await creo(sessionId, {
                                command: "file",
                                function: "assemble",
                                data: {
                                    file: "000000-6500-102.prt",
                                    into_asm: sectionOneLinePN,
                                    constraints: [{
                                        "asmref": "CSYS_"+breaker.comp,
                                        "compref": "PRT_CSYS_DEF",
                                        "type": "csys"
                                    }]
                                }
                            });
                        }
                    } else if (tieLocation == 'R') {

                        if (breaker.devConnection == 'LL') {
                            //iccb lug landing right
                            await creo(sessionId, {
                                command: "file",
                                function: "assemble",
                                data: {
                                    file: "000000-6500-111.prt",
                                    into_asm: sectionOneLinePN,
                                    constraints: [{
                                        "asmref": "CSYS_"+breaker.comp,
                                        "compref": "PRT_CSYS_DEF",
                                        "type": "csys"
                                    }]
                                }
                            });
                        } else if (breaker.devConnection == 'BD') {
                            //bus duct flange right
                            await creo(sessionId, {
                                command: "file",
                                function: "assemble",
                                data: {
                                    file: "000000-6500-115.prt",
                                    into_asm: sectionOneLinePN,
                                    constraints: [{
                                        "asmref": "CSYS_"+breaker.comp,
                                        "compref": "PRT_CSYS_DEF",
                                        "type": "csys"
                                    }]
                                }
                            });

                        } else if (breaker.devConnection == 'XFMR') {
                            //xfmr cc right
                        }

                        if (breaker.comp == 'D') {
                            //vertical bus left for D
                            await creo(sessionId, {
                                command: "file",
                                function: "assemble",
                                data: {
                                    file: "000000-6500-103.prt",
                                    into_asm: sectionOneLinePN,
                                    constraints: [{
                                        "asmref": "CSYS_"+breaker.comp,
                                        "compref": "PRT_CSYS_DEF",
                                        "type": "csys"
                                    }]
                                }
                            });
                        } else if (breaker.comp == 'BC') {
                            //vertical bus left 33.75"
                            await creo(sessionId, {
                                command: "file",
                                function: "assemble",
                                data: {
                                    file: "000000-6500-105.prt",
                                    into_asm: sectionOneLinePN,
                                    constraints: [{
                                        "asmref": "CSYS_"+breaker.comp,
                                        "compref": "PRT_CSYS_DEF",
                                        "type": "csys"
                                    }]
                                }
                            });
                        } else if (breaker.comp == 'A' || breaker.comp == 'B' || breaker.comp == 'C') {
                            //vertical bus left 22.5"
                            await creo(sessionId, {
                                command: "file",
                                function: "assemble",
                                data: {
                                    file: "000000-6500-101.prt",
                                    into_asm: sectionOneLinePN,
                                    constraints: [{
                                        "asmref": "CSYS_"+breaker.comp,
                                        "compref": "PRT_CSYS_DEF",
                                        "type": "csys"
                                    }]
                                }
                            });
                        }
                    }
                }
            }
        }

        return null;
    }



    checkWorkingDirAndStandardLib()
        .then((response) => {
            if (response == null) {
                getSectionDetails()
                    .then(() => {
                        return getCreoData();
                    })
                    .then(async function () {
                        for (let section of sectionData) {
                            let currentSecData = {
                                secType: section.secType,
                                brkType: section.brkType,
                                secAmp: section.secAmp,
                                secPoles: section.secPoles,
                                secHeight: section.secHeight,
                                secWidth: section.secWidth,
                                secDepth: section.secDepth
                            };
                            if (uniqueSections.filter(e => JSON.stringify(e.secData) === JSON.stringify(currentSecData)).length > 0) {
                                uniqueSections.filter(e => JSON.stringify(e.secData) === JSON.stringify(currentSecData))[0].sectionNum.push(section.sectionNum);
                            } else {
                                uniqueSections.push({
                                    sectionNum: [section.sectionNum],
                                    mainFramePN: jobNum + "-0010-" + section.sectionNum,
                                    secData: currentSecData
                                });
                            }
                        }

                        for (let uniqueSection of uniqueSections) {
                            await saveStandardFrame(uniqueSection.mainFramePN, uniqueSection.secData);
                        }
                        return null
                    })
                    .then(async function () {
                        await assembleUniqueBaseFrameAndCornerPost();
                        return null
                    })
                    .then(async function () {
                        for (let uniqueSection of uniqueSections) {
                            for (let i = 0; i < uniqueSection.sectionNum.length; i++) {
                                let secID = sectionData.filter(e => e.sectionNum == uniqueSection.sectionNum[i]);
                                sortedSectionSum.push({
                                    sectionNum: parseInt(uniqueSection.sectionNum[i]),
                                    secID: secID[0].secID,
                                    sectionPN: jobNum + "-0100-" + uniqueSection.sectionNum[i] + ".asm",
                                    mainFramePN: uniqueSection.mainFramePN + ".asm",
                                    secType: uniqueSection.secData.secType,
                                    brkType: uniqueSection.secData.brkType,
                                    secAmp: uniqueSection.secData.secAmp,
                                    secPoles: uniqueSection.secData.secPoles,
                                    secHeight: uniqueSection.secData.secHeight,
                                    secWidth: uniqueSection.secData.secWidth,
                                    secDepth: uniqueSection.secData.secDepth
                                });
                            }
                        }
                        sortedSectionSum.sort(function (a, b) {
                            return a.sectionNum - b.sectionNum
                        });
                        return null

                    })
                    .then(async function () {
                        for (let section of sortedSectionSum) {
                            await generateDistinctSections(section);
                        }
                        return null
                    })
                    .then(async function () {
                        for (let section of sortedSectionSum) {
                            await resizeSectionParamsAndAssembleFrame(section);
                        }
                        return null
                    })
                    .then(async function () {
                        await getBreakerDetails();
                        await findBrkCompartmentAndAssemble();
                        return null
                    })
                    .then(async function () {
                        await getPanelDetails();
                        await findPanelAndBreakerRows();
                        return null
                    })
                    .then(async function () {
                        await backupLayoutAndOneLine();
                        await renameLayoutAndOneLine();
                        return null
                    })
                    .then(async function () {
                        await assembleSectionsIntoLayout();
                        await fillLayoutParameters();
                        await assembleSectionsIntoOneLine();
                        return null
                    })
                    .then(() => {
                        res.locals = {title: 'Submittal'};
                        res.redirect('../searchSubmittal/?subID=' + jobRelease + "_" + subID);
                        return null
                    })
                    .catch((err) => {
                        return Promise.reject(err);
                    })
            } else {

            }

        })
};

exports.verifySubmittal = function(req, res) {
    //initialize variables
    let urlObj = url.parse(req.originalUrl);
    urlObj.protocol = req.protocol;
    urlObj.host = req.get('host');
    let qs = queryString.parse(urlObj.search);
    let jobRelease = qs.subID.split('_')[0];
    let subID = qs.subID.split('_')[1];
    let secData = [];
    let layoutID;

    let sectionNum = req.body.sectionNum;
    let comp = req.body.comp;
    let id = req.body.ID;

    let panelSectionNumArr = req.body.panel_sectionNum;
    let panelDevIdArr = req.body.panel_devID;
    let panelRowArr = req.body.panelRow;
    let panelConfigArr = req.body.panel_configuration;
    let panelMountArr = req.body.panel_mounting;
    let panelArr = [];


    if (panelSectionNumArr != undefined) {
        for (let i = 0; i < panelSectionNumArr.length; i++) {
            panelArr.push({
                secNum: parseInt(panelSectionNumArr[i]),
                devID: parseInt(panelDevIdArr[i]),
                panelRow: parseInt(panelRowArr[i]),
                configuration: panelConfigArr[i],
                mounting: panelMountArr[i]
            });
        }
    }


    let totalQueueICCB = req.body.totalQueue_ICCB;
    let totalQueueMCCB = req.body.totalQueue_MCCB;
    let queueICCB = req.body.queue_ICCB;
    let queueMCCB = req.body.queue_MCCB;
    let iccbQueueArr = [];
    let mccbQueueArr = [];

    if (Array.isArray(queueICCB) == true) {
        for (let i = 0; i < totalQueueICCB; i++) {
            iccbQueueArr.push({
                devID: parseInt(queueICCB[i].slice(1,queueICCB[i].length))
            });
        }
    } else {
        if (queueICCB != undefined) {
            iccbQueueArr.push({
                devID: parseInt(queueICCB.slice(1,queueICCB.length))
            });
        }
    }
    if (Array.isArray(queueMCCB) == true) {
        for (let i = 0; i < totalQueueMCCB; i++) {
            mccbQueueArr.push({
                devID: parseInt(queueMCCB[i].slice(1,queueMCCB[i].length))
            });
        }
    } else {
        if (queueMCCB != undefined) {
            mccbQueueArr.push({
                devID: parseInt(queueMCCB.slice(1,queueMCCB.length))
            });
        }
    }

    querySql("SELECT * FROM " + database + "." + dbConfig.submittal_layout_table + " WHERE subID = ?", subID)
        .then(async function(layouts) {
            for (let layout of layouts) {
                layoutID = layout.layoutID;
            }
            if (Array.isArray(id) == true) {
                for (let i = 0; i < sectionNum.length; i ++) {
                    const section = await querySql("SELECT * FROM " + database + "." + dbConfig.submittal_sections_table + " WHERE layoutID = ? AND sectionNum = ?", [layoutID, sectionNum[i]]);
                    secData.push({
                        devID: parseInt(id[i].slice(1,id[i].length)),
                        secID: section[0].secID,
                        comp: comp[i]
                    });
                }
            } else {
                if (id != undefined) {
                    const section = await querySql("SELECT * FROM " + database + "." + dbConfig.submittal_sections_table + " WHERE layoutID = ? AND sectionNum = ?", [layoutID, sectionNum]);
                    secData.push({
                        devID: parseInt(id.slice(1,id.length)),
                        secID: section[0].secID,
                        comp: comp
                    });
                }
            }

            return null;
        })
        .then(async function() {
            for (let section of secData) {
                await querySql("UPDATE " + database + "." + dbConfig.submittal_breaker_table + " SET secID = ? , comp = ? WHERE devID = ?", [section.secID, section.comp, section.devID]);
            }
            return null;
        })
        .then(async function(){
            for (let panelRow of panelArr) {
                const section = await querySql("SELECT * FROM " + database + "." + dbConfig.submittal_sections_table + " WHERE layoutID = ? AND sectionNum = ?",[layoutID, panelRow.secNum]);
                let secID = section[0].secID;
                await querySql("UPDATE " + database + "." + dbConfig.submittal_breaker_table + " SET secID = ? WHERE devID = ?", [secID, panelRow.devID]);
                await querySql("UPDATE " + database + "." + dbConfig.submittal_panel_breakers + " SET devID = ? WHERE (secID, panelRow, configuration, mounting) = (?,?,?,?)", [panelRow.devID, secID, panelRow.panelRow,panelRow.configuration, panelRow.mounting]);
            }
        })
        .then(async function() {
            for (let iccb of iccbQueueArr) {
                const iccbData = await querySql("SELECT * FROM " + database + "." + dbConfig.submittal_breaker_table + " WHERE devID = ?",[iccb.devID]);
                if (iccbData[0].secID != null || iccbData[0].comp != null) {
                    await querySql("UPDATE " +database + "." + dbConfig.submittal_breaker_table + " SET secID = ? AND comp = ? WHERE devID = ?", [null, null, iccb.devID])
                }
            }

            for (let mccb of mccbQueueArr) {
                const mccbData = await querySql("SELECT * FROM " + database + "." + dbConfig.submittal_panel_breakers + " WHERE devID = ?", [mccb.devID]);

                if (mccbData.length > 0) {
                    await querySql("UPDATE " + database + "." + dbConfig.submittal_panel_breakers + " SET devID = ? WHERE panelBrkID = ?", [null, mccbData[0].panelBrkID]);
                    await querySql("UPDATE " + database + "." + dbConfig.submittal_breaker_table + " SET secID = ? WHERE devID = ?", [null, mccb.devID]);
                }
            }
            return null
        })
        .then(() => {
            res.locals = {title: 'Submittal'};
            res.redirect('../searchSubmittal/?subID='+jobRelease+"_"+subID);
            return null
        })
        .catch((err) => {
            console.log(err);
            return Promise.reject(err);
        })

};