//needed to export all the functions found next to "exports."
exports = {};
module.exports = exports;

//misc imports
const url = require('url');
const queryString = require('query-string');

//Database information (table names)
const dbConfig = require('../config/database.js');
const database = dbConfig.database;

//Database interaction function (querySql)
//querySql takes 2 arguments, query (the sql string to be passed)
//and params (if there are ?'s in the query, these values will be inserted in their place)
//second argument params is optional, you only need to include it if you need to insert values into the string
//querySql returns the result of the sql query
const DB = require('../config/db.js');
// Wrap the DB.querySql call so we can log queries when DEBUG_MODE enables server logging
const querySql = function(sql, params){
    if (DEBUG_SERVER) {
        try {
            // capture a stack trace and extract the immediate caller
            const err = new Error();
            // exclude this wrapper from the captured stack so the next frame is the caller
            Error.captureStackTrace(err, querySql);
            const stack = err.stack || '';
            const stackLines = stack.split('\n').map(s => s.trim()).filter(Boolean);
            // stackLines[0] is the 'Error' message, stackLines[1] should be the caller
            const callerLine = stackLines[1] || stackLines[2] || '';
            const caller = callerLine.replace(/^at\s+/, '');
            console.log('SQL QUERY called from:', caller);
            console.log('SQL QUERY:', sql, params, '\n');
        } catch(e) {
            // ignore logging errors
        }
    }
    return DB.querySql(sql, params);
};
const Promise = require('bluebird');

// Debug mode controlled by environment variable DEBUG_MODE.
// Accept values: 'true' (both), 'server', 'client', 'both', otherwise 'false'.
const DEBUG_MODE = (process.env.DEBUG_MODE || 'false');
const DEBUG_SERVER = (DEBUG_MODE === 'true' || DEBUG_MODE === 'server' || DEBUG_MODE === 'both');
const DEBUG_CLIENT = (DEBUG_MODE === 'true' || DEBUG_MODE === 'client' || DEBUG_MODE === 'both');

//Excel Connection
const Excel = require('exceljs');



//IN ANY OF THESE FUNCTIONS IF YOU WANT TO DEBUG OR ANALYZE THE BEHAVIOR
//THE BEST THING TO DO IS console.log WHATEVER VARIABLE, OBJECT, ARRAY, PROPERTY, ETC. THAT YOU ARE TRYING TO STUDY

/***********************************************
   MAIN MBOM
 ***********************************************/

//main MBOM function
exports.MBOM = function(req, res) {
    req.setTimeout(0);  //no timeout (this is needed to prevent error due to page taking a long time to load)
    //Initialize variables
    let mbomData = [];
    let comItemData = [];
    let message;

    //getInitialData async function definition (used for mbom and common items table rendered on the initial mbom page)
    async function getInitialData() {
        const mbomSum = await querySql("SELECT * FROM " + database + "." + dbConfig.MBOM_summary_table);
        const comItems = await querySql("SELECT * FROM " + database + "." + dbConfig.MBOM_common_items);
        return {mbomSum, comItems}
    }

    //execute getInitialData then push returned result to mbomData and comItemData arrays
    getInitialData()
        .then(({mbomSum, comItems}) => {
            for(let row of mbomSum)
                mbomData.push(row);
            for(let row of comItems)
                comItemData.push(row);
            return null
        })
        .then(() => {
            //render the MBOM page with mbomData, comItemData, and message
            res.locals.title = 'Mechanical BOMs';
            res.render('MBOM/MBOM', {
                mbomData: mbomData,
                comItemData: comItemData,
                message: message
            });
        })
        .catch(err => {
            //if error occurs at anytime at any point in the code above, log it to the console
            return Promise.reject(err);
        });
};





//createMBOM function
exports.createMBOM = function(req, res) {
    req.setTimeout(0); //no timeout (this is needed to prevent error due to page taking a long time to load)
    //Initialize variables
    let mbomID, message;
    let noSectionMBOM;
    if (req.body.noSectionMBOM) {
        noSectionMBOM = 'Y';
    } else {
        noSectionMBOM = 'N';
    }
    let data = {
        jobNum: req.body.jobNum,
        releaseNum: req.body.releaseNum,
        jobName: req.body.jobName,
        customer: req.body.customer,
        boardDesignation: req.body.boardDesignation,
        numSections: 0,
        noSectionMBOM: noSectionMBOM
    };

    //initial db query - select everything from mbomSum
    querySql("SELECT * FROM mbomSum")
        .then(
            async function(rows){
                //for each row
                for(let row of rows){
                    //if jobNum and releaseNum already exist in the mbomSum table
                    if(row.jobNum == data.jobNum && row.releaseNum == data.releaseNum) {
                        //create a flag warning the user that this mbom already exists
                        message = 'Job and Release Number already exist';
                        //render the MBOM page with mbomData and message
                        res.locals.title = 'Create MBOM';
                        res.render('MBOM/MBOM', {
                            mbomData: rows,
                            message: message
                        });
                        //throw error in order to escape from the function and trigger the catch block below
                        throw new Error('Job and Release Number already exist');
                    }
                }

                //if no existing entry in mbomSum is found, then insert user data into the table
                await querySql("INSERT INTO mbomSum SET ?", data);
                return null;
            }
        )
        .then(
            //search the mbomSum table for the newly created row (we need this to get the mbomID)
            async function() {
                return await querySql("SELECT * FROM mbomSum WHERE jobNum = ? AND releaseNum = ?", [data.jobNum, data.releaseNum]);
            }
        )
        .then(rows => {
            //write mbomID to a variable and redirect to the searchMBOM page with the required unique identifier mbomID
            mbomID = rows[0].mbomID;
            res.locals.title = 'Create MBOM';
            res.redirect('searchMBOM/?bomID=' + data.jobNum + data.releaseNum + "_" + mbomID);
            return null;
        })
        .catch(err => {
            //if an error occurs at any time or at any point in the above code, then log it to the console
            console.log('Error occurred in createMBOM: \n', err, '\n');
        });
};





//copyMBOM function
exports.copyMBOM = function(req, res) {
    req.setTimeout(0);  //no timeout (this is needed to prevent error due to page taking a long time to load)
    //Initialize variables
    let sectionData = [];
    let brkData = [];
    let copyUserItemData = [];
    let copyMbomID, copyNumSections;
    let copyMbomData = {
        jobNum: req.body.copyJobNum,
        releaseNum: req.body.copyReleaseNum
    };

    //New MBOM data taken from user input
    let newMbomID;
    let newUserItemData = [];
    let newItemsForItemTable = [];
    let newUserItemID;
    let newBrkAccData = [];
    let noSectionMBOM;
    if (req.body.noSectionMBOM) {
        noSectionMBOM = 'Y';
    } else {
        noSectionMBOM = 'N';
    }
    let newMbomData = {
        jobNum: req.body.jobNum,
        releaseNum: req.body.releaseNum,
        jobName: req.body.jobName,
        customer: req.body.customer,
        boardDesignation: req.body.boardDesignation,
        numSections: null,
        noSectionMBOM: noSectionMBOM
    };

    //Initial db query - select the row from the mbomSum table that has the specific jobNum and releaseNum
    querySql("SELECT * FROM " + database + "." + dbConfig.MBOM_summary_table + " WHERE jobNum = ? AND releaseNum = ?",
        [copyMbomData.jobNum, copyMbomData.releaseNum])
        .then(rows => {
            //write the copied mbomID and numSections variables, also use the value for numSections within newMbomData
            copyMbomID = rows[0].mbomID;
            copyNumSections = rows[0].numSections;
            newMbomData.numSections = copyNumSections;
            return null;
        })
        .then(
            async function() {
                //insert new row into mbomSum table, then return the selected row in order to get the newMbomID
                await querySql("INSERT INTO " + database + "." + dbConfig.MBOM_summary_table + " SET ?", newMbomData);
                return await querySql("SELECT * FROM " + database + "." + dbConfig.MBOM_summary_table + " WHERE " +
                    "jobNum = ? AND releaseNum = ?", [newMbomData.jobNum, newMbomData.releaseNum]);
            }
        )
        .then(rows => {
            for(let row of rows)
                newMbomID = row.mbomID;

            //lookup the section details of the copied MBOM
            return querySql("SELECT * FROM " + database + "." + dbConfig.MBOM_new_section_sum + " WHERE mbomID = ?", copyMbomID);
        })
        .then(rows => {
            //for each section
            for (let row of rows) {
                //push to sectionData
                sectionData.push({
                    copySecID: row.secID,
                    newSecID: null,
                    sectionNum: row.sectionNum
                });
            }

            return sectionData;
        })
        .then(
            async function(rows) {
                //for each row of sectionData
                for(let i = 0; i < rows.length; i++){
                    //insert a row into the mbomSectionSum table for the new MBOM
                    await querySql("INSERT INTO " + database + "." + dbConfig.MBOM_new_section_sum + " SET sectionNum = ?, " +
                        "mbomID = ?", [rows[i].sectionNum, newMbomID])
                        .then(rows => {
                            sectionData[i].newSecID = rows.insertId;
                        });
                }
                return null;
            })
        .then(() => {
            //lookup the userItem details of the copied MBOM
            return querySql("SELECT * FROM " + database + "." + dbConfig.MBOM_user_items + " WHERE mbomID = ?", copyMbomID);
        })
        .then(rows => {
            //for each row of the result
            for(let row of rows){
                //push to copyUserItemData
                copyUserItemData.push(row);

                //push to newUserItemData
                newUserItemData.push({
                    mbomID: newMbomID,
                    itemType: row.itemType,
                    itemMfg: row.itemMfg,
                    itemDesc: row.itemDesc,
                    itemPN: row.itemPN,
                    unitOfIssue: row.unitOfIssue,
                    catCode: row.catCode,
                    class: row.class
                });
            }

            return newUserItemData;
        })
        .then(
            async function(rows) {
                //for each row of newUserItemData
                for(let row of rows){
                    //insert a row into the mbomUserItems table
                    await querySql("INSERT INTO " + database + "." + dbConfig.MBOM_user_items + " SET ? ", row);
                }
                return null;
            }
        )
        .then(
            async function() {
                //get the new user items from the mbomUserItems table
                const getNewItems = await querySql("SELECT * FROM " + database + "." + dbConfig.MBOM_user_items + " WHERE mbomID = ?", newMbomID);
                //get the itemSum table rows from the copied MBOM
                const getItemSum = await querySql("SELECT * FROM " + database + "." + dbConfig.MBOM_item_table + " WHERE mbomID = ?", copyMbomID);

                return {getNewItems, getItemSum}
            }
        )
        .then(({getNewItems, getItemSum}) => {
            //initialize newUserItemData
            newUserItemData = [];
            //for each item in getNewItems
            for(let row of getNewItems){
                //push to newUserItemData
                newUserItemData.push(row);
            }
            //for each item in getItemSum
            for(let row of getItemSum){
                newUserItemID = null;
                //if item is a user item
                if(row.userItemID != null){
                    //for each row in copyUserItemData
                    for(let el of copyUserItemData){
                        //if the id matches
                        if(el.userItemID == row.userItemID){
                            //for each row in newUserItemData
                            for(let el2 of newUserItemData){
                                //if the PN matches
                                if(el.itemPN == el2.itemPN)
                                    //update the newUserItemID variable
                                    newUserItemID = el2.userItemID;
                            }
                        }
                    }
                }

                //finally push to newItemsForItemTable array
                newItemsForItemTable.push({
                    comItemID: row.comItemID,
                    userItemID: newUserItemID,
                    mbomID: newMbomID,
                    secID: row.secID,
                    itemQty: row.itemQty,
                    shipLoose: row.shipLoose
                });
            }
            //for each section
            for(let row of sectionData){
                //for each item in newItemsForItemTable
                for(let el of newItemsForItemTable){
                    //if the secID matches
                    if(row.copySecID == el.secID){
                        //overwrite the secID
                        el.secID = row.newSecID;
                    }
                }
            }
            return newItemsForItemTable;
        })
        .then(
            async function(rows) {
                //for each item in newItemsForItemTable, insert a row in the mbomItemSum table
                for(let row of rows)
                    await querySql("INSERT INTO " + database + "." + dbConfig.MBOM_item_table + " SET ?", row);

                //lookup the breaker details of the copied MBOM
                return querySql("SELECT * FROM " + database + "." + dbConfig.MBOM_breaker_table + " WHERE mbomID = ?", copyMbomID);
            }
        )
        .then(rows => {
            //for each breaker
            for(let row of rows){
                //initialize secID
                let secID = null;

                //for each section
                for(let el of sectionData){
                    //if the secID matches
                    if(row.secID == el.copySecID){
                        //update secID
                        secID = el.newSecID;
                    }
                }
                //push to brkData
                brkData.push({
                    copyidDev: row.idDev,
                    newidDev: null,
                    mbomID: newMbomID,
                    secID: secID,
                    devLayout: newMbomData.boardDesignation,
                    devDesignation: row.devDesignation,
                    brkPN: row.brkPN,
                    cradlePN: row.cradlePN,
                    unitOfIssue: row.unitOfIssue,
                    catCode: row.catCode,
                    class: row.class,
                    devMfg: row.devMfg
                });
            }

            return brkData;
        })
        .then(
            async function(rows){
                //for each breaker in brkData, insert a new row into mbomBrkSum
                for(let i = 0; i < rows.length; i++){
                    await querySql("INSERT INTO " + database + "." + dbConfig.MBOM_breaker_table + " SET mbomID = ?," +
                        "secID = ?, devLayout = ?, devDesignation = ?, brkPN = ?, cradlePN = ?, unitOfIssue = ?, catCode = ?, class = ?, " +
                        "devMfg = ? ", [rows[i].mbomID, rows[i].secID, rows[i].devLayout, rows[i].devDesignation,
                        rows[i].brkPN, rows[i].cradlePN, rows[i].unitOfIssue, rows[i].catCode, rows[i].class, rows[i].devMfg])
                        .then(rows => {
                            brkData[i].newidDev = rows.insertId;
                        });
                }

                //lookup the breaker accessory details of the copied MBOM and return the result
                return await querySql("SELECT * FROM " + database + "." + dbConfig.MBOM_brkAcc_table + " WHERE mbomID = ? ", copyMbomID);
            }
        )
        .then(rows => {
            //for each accessory
            for(let row of rows){
                //for each breaker in brkData
                for(let el of brkData){
                    //if the idDev matches
                    if(row.idDev == el.copyidDev){
                        //push to newBrkAccData
                        newBrkAccData.push({
                            mbomID: newMbomID,
                            idDev: el.newidDev,
                            brkAccQty: row.brkAccQty,
                            brkAccType: row.brkAccType,
                            brkAccMfg: row.brkAccMfg,
                            brkAccDesc: row.brkAccDesc,
                            brkAccPN: row.brkAccPN
                        });
                    }
                }
            }

            return newBrkAccData;
        })
        .then(
            async function(rows){
                //for each accessory in newBrkAccData
                for(let row of rows){
                    //insert a row into mbomBrkAccSum
                    await querySql("INSERT INTO " + database + "." + dbConfig.MBOM_brkAcc_table + " SET ? ", row);
                }
                return null;
            }
        )
        .then(() => {
            //redirect to the searchMBOM page
            res.locals.title = 'Search MBOM';
            res.redirect('./searchMBOM/?bomID=' + newMbomData.jobNum + newMbomData.releaseNum + "_" + newMbomID);
            return null;
        })
        .catch(err => {
            //if error occurs at anytime at any point in the code above, then log the error
            return Promise.reject(err);
        });
};





//editMBOM function
exports.editMBOM = function(req, res) {
    req.setTimeout(0);  //no timeout (this is needed to prevent error due to page taking a long time to load)
    //Initialize variables
    let urlObj = url.parse(req.originalUrl);
    urlObj.protocol = req.protocol;
    urlObj.host = req.get('host');
    //qs is needed to get the mbomID (urlObj.search allows you to retrieve parts of the url that follow ?'s)
    let qs = queryString.parse(urlObj.search);

    let noSectionMBOM;
    if (req.body.noSectionMBOM) {
        noSectionMBOM = 'Y';
    } else {
        noSectionMBOM = 'N';
    }

    let data = {
        jobNum: req.body.jobNum,
        releaseNum: req.body.releaseNum,
        jobName: req.body.jobName,
        customer: req.body.customer,
        boardDesignation: req.body.boardDesignation,
        noSectionMBOM: noSectionMBOM
    };

    //Initial sql query - update the mbomSum table with the user input at the specific mbomID
    querySql("UPDATE " + database + "." + dbConfig.MBOM_summary_table + " SET jobNum = ?, releaseNum = ?, jobName = ?, customer = ?, " +
        "boardDesignation = ?, noSectionMBOM = ? WHERE mbomID = ?", [data.jobNum, data.releaseNum, data.jobName, data.customer, data.boardDesignation, data.noSectionMBOM, qs.mbomID])
        .then(() => {
            //redirect to the searchMBOM page
            res.locals.title = 'Search MBOM';
            res.redirect('../searchMBOM/?bomID=' + data.jobNum + data.releaseNum + "_" + qs.mbomID);
        })
        .catch(err => {
            //if error occurs at any time at any point in the above, log the error to the console
            console.log('Error in editMBOM: \n', err, '\n');
        });
};







/***********************************************
 BRK ACC IN BEFORE SAVED IN DB
 ***********************************************/
//Initialize variables (outside of the function - this is important)
let brkDataObj;
let brkAccArr = [];
let currentMbomID = '';

//addBreakerAcc function
exports.addBreakerAcc = function(req, res) {
    req.setTimeout(0); //no timeout (this is needed to prevent error due to page taking a long time to load)
    //Initialize function-scoped variables
    let mbomID = req.body.mbomID;
    let mbomData = {
        jobNum: req.body.jobNum,
        releaseNum: req.body.releaseNum
    };

    //update brkDataObj
    brkDataObj = {
        devDesignation: req.body.devDesignation,
        brkPN: req.body.brkPN,
        cradlePN: req.body.cradlePN,
        devMfg: req.body.devMfg,
        catCode: req.body.catCode,
        class: req.body.classCode
    };

    //update currentMbomID
    if (currentMbomID == '') {
        currentMbomID = mbomID;
    }

    //if currentMbomID and mbomID match
    if (currentMbomID == mbomID){
        //if qty is not nothing
        if (req.body.qty != '') {
            //write to formData
            let formData = {
                mbomID: mbomID,
                qty: req.body.accQty,
                type: req.body.accType,
                mfg: req.body.accMfg,
                desc: req.body.accDesc,
                pn: req.body.accPN
            };
            //push formData to brkAccArr
            brkAccArr.push(formData);
        }
    } else {
        //update currentMbomID
        currentMbomID = mbomID;
        brkAccArr = [];

        //if qty is not nothing
        if (req.body.qty != '') {
            //write to formData
            let formData = {
                mbomID: mbomID,
                qty: req.body.accQty,
                type: req.body.accType,
                mfg: req.body.accMfg,
                desc: req.body.accDesc,
                pn: req.body.accPN
            };

            //push to brkAccArr
            brkAccArr.push(formData);
        }
    }
    //redirect to searchMBOM page
    res.redirect('searchMBOM/?bomID=' + mbomData.jobNum + mbomData.releaseNum + "_" + mbomID);
};







//Initialize editBrkDataObj (outside of the function - this is important)
let editBrkDataObj;

exports.editBreakerAcc = function(req, res){
    req.setTimeout(0);  //no timeout (this is needed to prevent error due to page taking a long time to load)
    //Initialize variables
    let jobNum = req.body.jobNum;
    let releaseNum = req.body.releaseNum;
    let mbomID = req.body.mbomID;
    let brkAccID = req.body.brkAccID;
    let updateAcc = {
        qty: req.body.editAccQty,
        type: req.body.editAccType,
        desc: req.body.editAccDescLimit,
        pn: req.body.editAccPN
    };

    //arrayEdit function definition
    function arrayEdit(arr, value, id) {
        //for each item in array
        for (let i = 0; i < arr.length; i++) {
            //if id matches
            if(i == id) {
                //update values
                arr[i].qty = value.qty;
                arr[i].type = value.type;
                arr[i].desc = value.desc;
                arr[i].pn = value.pn;
            }
        }
        return arr
    }

    //execute arrayEdit with brkAccArr and updateAcc, and write the result to brkAccArr (defined outside of function)
    brkAccArr = arrayEdit(brkAccArr, updateAcc, brkAccID);
    //redirect to the searchMBOM page
    res.redirect('../searchMBOM/?bomID=' + jobNum + releaseNum + '_' + mbomID);
};







//deleteBreakerAcc function
exports.deleteBreakerAcc = function(req, res){
    req.setTimeout(0);

    // Accept either arrIndex (in-memory index) or brkAccID (primary key). At least one must be present.
    if (!req.body || (typeof req.body.arrIndex === 'undefined' && typeof req.body.brkAccID === 'undefined')) {
        console.warn('deleteBreakerAcc called without arrIndex or brkAccID; rejecting request');
        res.status(400).send('arrIndex or brkAccID is required');
        return;
    }

    let mbomID = req.body.mbomID;
    let mbomData = {
        jobNum: req.body.jobNum,
        releaseNum: req.body.releaseNum
    };

    brkDataObj = {
        devDesignation: req.body.devDesignation,
        brkPN: req.body.brkPN,
        cradlePN: req.body.cradlePN,
        devMfg: req.body.devMfg,
        catCode: req.body.catCode,
        class: req.body.classCode
    };

    // prefer explicit arrIndex when provided
    if (typeof req.body.arrIndex !== 'undefined' && req.body.arrIndex !== null && req.body.arrIndex !== '') {
        const idx = parseInt(req.body.arrIndex, 10);
        if (!isNaN(idx) && isFinite(idx) && idx >= 0 && idx < brkAccArr.length) {
            if (brkAccArr[idx] && String(brkAccArr[idx].mbomID) === String(mbomID)) {
                brkAccArr.splice(idx, 1);
            } else {
                // mbomID mismatch: be conservative and do not delete; log and continue
                console.warn('deleteBreakerAcc: arrIndex mbomID mismatch or item missing at index', idx);
            }
        } else {
            console.warn('deleteBreakerAcc: arrIndex out of bounds or invalid:', req.body.arrIndex);
        }
    } else {
        // fallback to removing by brkAccID (primary key style) from in-memory array
        const brkAccID = req.body.brkAccID;
        brkAccArr = brkAccArr.filter(function(el){
            return String(el.brkAccID) !== String(brkAccID);
        });
    }

    // redirect back to searchMBOM
    res.redirect('searchMBOM/?bomID=' + mbomData.jobNum + mbomData.releaseNum + "_" + mbomID);
};







/***********************************************
 BRK ACC FROM EDIT
 ***********************************************/
//addBrkAccFromEdit function
exports.addBrkAccFromEdit = function(req, res) {
    req.setTimeout(0);  //no timeout (this is needed to prevent error due to page taking a long time to load)
    //Initialize variables
    let mbomID = req.body.mbomID;
    let breakerData = [];
    let accData = [];
    let mbomData = {
        mbomID: req.body.mbomID,
        jobNum: req.body.jobNum,
        releaseNum: req.body.releaseNum,
        jobName: req.body.jobName,
        customer: req.body.customer,
        boardDesignation: req.body.devLayout,

    };

    let idDev = req.body.idDev;
    let formData = {
        mbomID: mbomID,
        idDev: idDev,
        brkAccQty: req.body.accQty,
        brkAccType: req.body.accType,
        brkAccDesc: req.body.accDesc,
        brkAccMfg: req.body.editDevMfg,
        brkAccPN: req.body.accPN
    };

    //update editBrkDataObj (defined outside of function)
    editBrkDataObj = {
        devDesignation: req.body.editDevDesLimit,
        brkPN: req.body.editBrkPN,
        cradlePN: req.body.editCradlePN,
        devMfg: req.body.editDevMfg,
        catCode: req.body.editDevCatCode,
        class: req.body.class
    };


    //Initial db query - insert a new row into the mbomBrkAccSum table
    querySql("INSERT INTO " + database + "." + dbConfig.MBOM_brkAcc_table + " SET ?", formData)
        .then(() => {
            //lookup mbomBrkSum row
            return querySql("SELECT * FROM " + database + "." + dbConfig.MBOM_breaker_table + " WHERE idDev = ?", [idDev])
        })
        .then(rows => {
            //for each row
            for(let row of rows){
                //push to breakerData
                breakerData.push(row);
            }
            //lookup mbomBrkAccSum using idDev
            return querySql("SELECT * FROM " + database + "." + dbConfig.MBOM_brkAcc_table + " WHERE idDev = ?", [idDev])
        })
        .then(rows => {
            //for each accessory
            for(let row of rows){
                //push to accData
                accData.push(row);
            }
            return null
        })
        .then(() => {
            //render the editBreaker page with mbomBrkData, brkAccData, mbomData, and brkData
            res.locals.title = 'Add Breaker Accessory';
            res.render('MBOM/editBreaker', {
                mbomBrkData: breakerData,
                brkAccData: accData,
                mbomData: mbomData,
                brkData: editBrkDataObj,
            });
        })
        .catch(err => {
            //if an error occurs at anytime at any point in the above, log it to the console
            return Promise.reject(err);
        });
};







//editBrkAccFromEdit function
exports.editBrkAccFromEdit = function(req, res) {
    req.setTimeout(0); //no timeout (this is needed to prevent error due to page taking a long time to load)
    //Initialize variables
    let breakerData = [];
    let accData = [];
    let mbomData = {
        mbomID: req.body.mbomID,
        jobNum: req.body.jobNum,
        releaseNum: req.body.releaseNum,
        jobName: req.body.jobName,
        customer: req.body.customer,
        boardDesignation: req.body.devLayout
    };

    let idDev = req.body.idDev;
    let brkAccID = req.body.brkAccID;

    let updateAcc = {
        qty: req.body.editAccQty,
        type: req.body.editAccType,
        desc: req.body.editAccDescLimit,
        pn: req.body.editAccPN
    };

    //update editBrkDataObj (defined outside of the function)
    editBrkDataObj = {
        devDesignation: req.body.editDevDesLimit,
        brkPN: req.body.editBrkPN,
        cradlePN: req.body.editCradlePN,
        devMfg: req.body.editDevMfg,
        catCode: req.body.editDevCatCode,
        class: req.body.class
    };

    //Initial db query - update the mbomBrkAcc table with the new values
    querySql("UPDATE " + database + "." + dbConfig.MBOM_brkAcc_table + " SET brkAccQty = ?, brkAccType = ?, brkAccDesc = ?, brkAccPN = ? WHERE brkAccID = ? ", [updateAcc.qty, updateAcc.type, updateAcc.desc, updateAcc.pn, brkAccID])
        .then(() => {
            //lookup the mbomBrkSum table for the specific row
            return querySql("SELECT * FROM " + database + "." + dbConfig.MBOM_breaker_table + " WHERE idDev = ?", [idDev])
        })
        .then(rows => {
            //for each breaker
            for(let row of rows){
                //push to breakerData
                breakerData.push(row);
            }
            //lookup the mbomBrkAccSum table for corresponding accessories
            return querySql("SELECT * FROM " + database + "." + dbConfig.MBOM_brkAcc_table + " WHERE idDev = ?", [idDev])
        })
        .then(rows => {
            //for each accessory
            for(let row of rows){
                //push to accData
                accData.push(row);
            }
            return null
        })
        .then(() => {
            //render the editBreaker page with mbomBrkData, brkAccData, mbomData, and brkData
            res.locals.title = 'Edit Breaker Accessory';
            res.render('MBOM/editBreaker', {
                mbomBrkData: breakerData,
                brkAccData: accData,
                mbomData: mbomData,
                brkData: editBrkDataObj
            });
        })
        .catch(err => {
            //if error occurs at anytime at any point in the above code, log it to the console
            return Promise.reject(err);
        });
};








//deleteBrkAccFromEdit function (strict: requires brkAccID)
exports.deleteBrkAccFromEdit = function(req, res) {
    req.setTimeout(0);

    // Validate input: brkAccID is required to avoid ambiguous deletions
    if (!req.body || !req.body.brkAccID) {
        console.warn('deleteBrkAccFromEdit called without brkAccID; rejecting request to prevent multi-row delete');
        res.status(400).send({ success: false, error: 'brkAccID is required' });
        return;
    }

    const brkAccID = req.body.brkAccID;

    // First, look up the accessory row to determine its idDev (authoritative source)
    querySql("SELECT idDev FROM " + database + "." + dbConfig.MBOM_brkAcc_table + " WHERE brkAccID = ?", [brkAccID])
        .then(rows => {
            if (!rows || rows.length === 0) {
                // accessory not found; nothing to delete
                console.warn('deleteBrkAccFromEdit: brkAccID not found:', brkAccID);
                res.status(404).send({ success: false, error: 'Accessory not found' });
                return Promise.resolve(null);
            }

            const idDevServer = rows[0].idDev;

            // perform delete by primary key only
            return querySql("DELETE FROM " + database + "." + dbConfig.MBOM_brkAcc_table + " WHERE brkAccID = ?", [brkAccID])
                .then(() => idDevServer);
        })
        .then(idDevServer => {
            // if earlier we already responded (accessory not found), short-circuit
            if (!idDevServer) return null;

            // after delete, fetch updated breaker row and accessory list for re-render using server-side idDev
            let breakerData = [];
            let accData = [];

            return querySql("SELECT * FROM " + database + "." + dbConfig.MBOM_breaker_table + " WHERE idDev = ?", [idDevServer])
                .then(rows => {
                    for (let row of rows) breakerData.push(row);
                    return querySql("SELECT * FROM " + database + "." + dbConfig.MBOM_brkAcc_table + " WHERE idDev = ?", [idDevServer]);
                })
                .then(rows => {
                    for (let row of rows) accData.push(row);

                    // build mbomData and editBrkDataObj for re-rendering (prefer client-provided values but fallback to breakerData[0])
                    let mbomData = {
                        mbomID: req.body.mbomID,
                        jobNum: req.body.jobNum,
                        releaseNum: req.body.releaseNum,
                        jobName: req.body.jobName,
                        customer: req.body.customer,
                        boardDesignation: req.body.devLayout || (breakerData[0] && breakerData[0].devLayout)
                    };

                    // prefer the values the client submitted; if missing, use breaker row values
                    editBrkDataObj = {
                        devDesignation: req.body.devDesignation || (breakerData[0] && breakerData[0].devDesignation),
                        brkPN: req.body.brkPN || (breakerData[0] && breakerData[0].brkPN),
                        cradlePN: req.body.cradlePN || (breakerData[0] && breakerData[0].cradlePN),
                        devMfg: req.body.devMfg || (breakerData[0] && breakerData[0].devMfg),
                        catCode: req.body.catCode || (breakerData[0] && breakerData[0].catCode),
                        class: req.body.class || (breakerData[0] && breakerData[0].class)
                    };

                    res.locals.title = 'Delete Breaker Accessory';
                    res.render('MBOM/editBreaker', {
                        mbomBrkData: breakerData,
                        brkAccData: accData,
                        mbomData: mbomData,
                        brkData: editBrkDataObj
                    });
                });
        })
        .catch(err => {
            console.error('Error in deleteBrkAccFromEdit:', err);
            return Promise.reject(err);
        });
};







/***********************************************
 MAIN MBOM VIEW
 ***********************************************/
//searchMBOMGet function (handles the GET request to searchMBOM page)
exports.searchMBOMGet = function(req, res) {
    req.setTimeout(0); //no timeout (this is needed to prevent error due to page taking a long time to load)
    //Initialize variables
    let urlObj = url.parse(req.originalUrl);
    urlObj.protocol = req.protocol;
    urlObj.host = req.get('host');
    let qs = queryString.parse(urlObj.search);
    //get mbomID from the query string qs
    let mbomID = qs.bomID.split('_')[1];
    let mbomData = {};
    let mbomBrkData = [];
    let mbomItemData = [];
    let comItemData = [];
    let userItemData = [];
    let mbomSecData = [];
    let catCodeData = [];
    let classCodeData = [];
    let brkAccData = [];
    let brkData ={};
    let mbomBrkAcc = [];

    //if brkAccArr (defined outside of function) is not empty, and the mbomID matches, write the result to brkAccData
    if(brkAccArr.length != 0){
        if(brkAccArr[0].mbomID == mbomID)
            brkAccData = brkAccArr;
    }
    //if brkDataObj exists, write it to brkData
    if(brkDataObj)
        brkData = brkDataObj;

    //Initial db query - lookup the mbomSum row referenced by the specific mbomID
    querySql("SELECT * FROM " + database + " . " + dbConfig.MBOM_summary_table + " WHERE mbomID = ?", mbomID)
        .then(rows => {
            //write result to mbomData
            mbomData = rows[0];
            return null;
        })
        .then(
            async function(){
                //lookup mbomComItem, mbomUserItem, mbomBrkSum, mbomItemSum, mbomNewSectionSum, jobscopeCatCodes, jobscopeClassCodes, and mbomBrkAcc table data and write it to variables
                //using the method of writing the await calls to const's and then returning the 'awaited' group result allows for parallel processing and time/performance savings
                const comItems = await querySql("SELECT * FROM " + database + "." + dbConfig.MBOM_common_items);
                const userItems = await querySql("SELECT * FROM " + database + " . " + dbConfig.MBOM_user_items);
                const brkSum = await querySql("SELECT * FROM " + database + " . " + dbConfig.MBOM_breaker_table + " WHERE mbomID = ?", mbomID);
                const itemSum = await querySql("SELECT * FROM " + database + " . " + dbConfig.MBOM_item_table + " WHERE mbomID = ?", mbomID);
                const secSum = await querySql("SELECT * FROM " + database + " . " + dbConfig.MBOM_new_section_sum + " WHERE mbomID = ?", mbomID);
                const catCodeSum = await querySql("SELECT * FROM " + database + "." + dbConfig.jobscope_codes_table);
                const classCodeSum = await querySql("SELECT * FROM " + database + "." + dbConfig.jobscope_classCodes_table);
                const brkAccessories = await querySql("SELECT * FROM " + database + "." + dbConfig.MBOM_brkAcc_table + " WHERE mbomID = ?", mbomID);

                return {comItems, userItems, brkSum, itemSum, secSum, catCodeSum, classCodeSum, brkAccessories}
            }
        )
        .then(({comItems, userItems, brkSum, itemSum, secSum, catCodeSum, classCodeSum, brkAccessories}) => {
            //loop through the results from above and write them to function-scoped variables
            for(let row of comItems)
                comItemData.push(row);
            for(let row of userItems)
                userItemData.push(row);
            for(let row of brkSum)
                mbomBrkData.push(row);
            for(let row of itemSum)
                mbomItemData.push(row);
            for(let row of secSum)
                mbomSecData.push({
                    secID: row.secID,
                    sectionNum: row.sectionNum,
                    mbomID: row.mbomID,
                });
            for(let row of catCodeSum)
                catCodeData.push(row.catCode);
            for(let row of classCodeSum)
                classCodeData.push(row.classCode);
            for(let row of brkAccessories)
                mbomBrkAcc.push(row);
            return null;
        })
        .then(() => {
            //render the searchMBOM page with mbomID, mbomData, mbomBrkData, mbomSecData, mbomItemData,
            //comItemData, userItemData, catCodeData, classCodeData, bekAccData, brkData, and mbomBrkAcc
            res.locals.title = 'Search MBOM';
            res.render('MBOM/searchMBOM', {
                mbomID: mbomID,
                mbomData: mbomData,
                mbomBrkData: mbomBrkData,
                mbomSecData: mbomSecData,
                mbomItemData: mbomItemData,
                comItemData: comItemData,
                userItemData: userItemData,
                catCodeData: catCodeData,
                classCodeData: classCodeData,
                brkAccData: brkAccData,
                brkData: brkData,
                mbomBrkAcc: mbomBrkAcc,
                message: (qs && qs.error) ? qs.error : null,
                errorField: (qs && qs.errorField) ? qs.errorField : null,
                debug: DEBUG_CLIENT
            });

            return null;
        })
        .catch(err => {
            //if error occurs at anytime at any point in the code above, log it to the console
            return Promise.reject(err);
        });
};








/***********************************************
 COM ITEM TABLE
 ***********************************************/
//createComItemTableGET function (handles the GET request to createComItemTable
exports.createComItemTableGET = function(req, res) {
    req.setTimeout(0); //no timeout (this is needed to prevent error due to page taking a long time to load)
    //Initialize variables
    let comItemData = [];
    let catCodeData = [];
    let classCodeData = [];

    //getCommonItemData function definition
    async function getCommonItemData(){
        //lookup everything in mbomComItems and write it to comItems
        const comItems = await querySql("SELECT * FROM " + database + "." + dbConfig.MBOM_common_items);
        //lookup the catCode column in jobscopeCatCodes and write it to catCodes
        const catCodes =  await querySql("SELECT catCode FROM " + database + " . " + dbConfig.jobscope_codes_table);
        //lookup the classCode column in jobscopeClassCodes and write it to classCodes
        const classCodes = await querySql("SELECT classCode FROM " + database + "." + dbConfig.jobscope_classCodes_table);

        return {comItems, catCodes, classCodes}
    }

    //execute getCommonItemData function
    getCommonItemData()
        .then(({comItems, catCodes, classCodes}) => {
            //for each item in comItems push to comItemData
            for(let row of comItems){
                comItemData.push(row);
            }
            //for each code in catCodes push to catCodeData
            for(let row of catCodes){
                catCodeData.push(row);
            }
            //for each code in classCodes push to classCodeData
            for(let row of classCodes) {
                classCodeData.push(row);
            }
            return null;
        })
        .then(() => {
            //render createComItemTable page with comItemData, catCodeData, and classCodeData
            res.locals.title = 'Create Com Item';
            res.render('MBOM/createComItemTable', {
                comItemData: comItemData,
                catCodeData: catCodeData,
                classCodeData: classCodeData
            });
        })
        .catch(err => {
            //if error occurs at anytime at any point in the code above, log it to the console
            console.log('Error in createComItemTableGET: \n', err, '\n');
        });
};









// Helper to normalize values and uppercase where appropriate
function norm(v){ return (typeof v === 'string') ? v.trim() : v; }

// Helper to convert DB error objects into user-friendly messages
function dbErrorMsg(err){
    if(!err) return 'Database error';
    // mysql error codes: ER_DUP_ENTRY (1062), ER_BAD_NULL_ERROR (1048)
    try{
        if(err.code === 'ER_DUP_ENTRY' || err.errno === 1062) {
            return 'Duplicate entry. This P/N already exists. Please check your input and try again.';
        }
        if(err.code === 'ER_BAD_NULL_ERROR' || err.errno === 1048) {
            return 'A required field was missing (NOT NULL). Please provide all required values and try again.';
        }
    } catch(e) {}
    // fallback to the original message where helpful
    return (err && (err.sqlMessage || err.message)) ? String(err.sqlMessage || err.message) : 'Database error';
}

exports.createComItemTablePOST = function(req, res) {
    req.setTimeout(0); //no timeout (this is needed to prevent error due to page taking a long time to load)

    //Initialize variables
    let itemType = req.body.itemSelect2;
    if (itemType == 'OTHER')
        itemType = (req.body.otherItemType).toUpperCase();

    let itemMfg = req.body.mfgSelect2;
    if (itemMfg == 'OTHER')
        itemMfg = (req.body.otherMfgType).toUpperCase();

    let data = {
        itemType: itemType,
        itemMfg: itemMfg,
        itemDesc: (req.body.itemDesc).toUpperCase(),
        itemPN: req.body.itemPN,
        unitOfIssue: req.body.unitOfIssue,
        catCode: req.body.catCode,
        class: req.body.class,
        status: req.body.status
    };

    //Initial db query - lookup the mbomComItem table rows that match the itemPN
    querySql("SELECT * FROM " + database + " . " + dbConfig.MBOM_common_items + " WHERE itemPN = ?", [data.itemPN])
        .then(rows => {
            // If a row already exists with this P/N, treat it as a duplicate and surface a friendly error
            if (rows && rows.length > 0) {
                const err = new Error('Duplicate P/N');
                // Give dbErrorMsg enough shape to detect a duplicate entry
                err.code = 'ER_DUP_ENTRY';
                err.errno = 1062;
                throw err;
            }

            // insert a new row in the mbomComItem table with data from the form
            return querySql("INSERT INTO " + database + " . " + dbConfig.MBOM_common_items + " SET ?", data);
        })
        .then(() => {
            res.locals.title = 'Create Com Item';
            res.redirect('./MBOM');
        })
        .catch(err => {
            //if error occurs at anytime at any point in the code above, log it to the console
            console.log('Error in createComItemTablePOST: \n', err, '\n');
            const msg = dbErrorMsg(err);

            // MBOM-specific rendering removed: this POST handler is admin-only.
            // Fall through to the admin fallback below which renders the create page with an error message.

            // Original admin-flow error handling when no MBOM context present
            // Try to render the create page with the message; fetch the supporting lists first
            Promise.all([
                querySql("SELECT * FROM " + database + "." + dbConfig.MBOM_common_items),
                querySql("SELECT catCode FROM " + database + " . " + dbConfig.jobscope_codes_table),
                querySql("SELECT classCode FROM " + database + "." + dbConfig.jobscope_classCodes_table)
            ]).then(([comItems, catCodes, classCodes]) => {
                const comItemData = [];
                const catCodeData = [];
                const classCodeData = [];
                for(let row of comItems) comItemData.push(row);
                for(let row of catCodes) catCodeData.push(row);
                for(let row of classCodes) classCodeData.push(row);
                // determine which field likely caused the error (prefer itemPN for duplicate P/N)
                let errorField = null;
                if (err && (err.code === 'ER_DUP_ENTRY' || err.errno === 1062)) {
                    errorField = 'itemPN';
                }
                res.locals.title = 'Create Com Item';
                res.render('MBOM/createComItemTable', {
                    comItemData: comItemData,
                    catCodeData: catCodeData,
                    classCodeData: classCodeData,
                    message: msg,
                    formValues: req.body,
                    errorField: errorField
                });
            }).catch(renderErr => {
                console.log('Error while attempting to render createComItemTable with DB error message:', renderErr);
                // as a last resort, redirect back to MBOM
                res.redirect('./MBOM');
            });
        });
};









//editComItemTableGET function (handles the GET request to editComItemTable)
exports.editComItemTableGET = function(req, res) {
    req.setTimeout(0); //no timeout (this is needed to prevent error due to page taking a long time to load)
    //Initialize variables
    let urlObj = url.parse(req.originalUrl);
    urlObj.protocol = req.protocol;
    urlObj.host = req.get('host');
    let qs = queryString.parse(urlObj.search);
    let comItemID = qs.comItemID;
    let editComItemData = {};
    let comItemData = [];
    let catCodeData = [];
    let classCodeData = [];

    //getComItemData function definition
    async function getComItemData(){
        //lookup mbomComItem row with the comItemID and write it to editComItem
        const editComItem = await querySql("SELECT * FROM " + database + "." + dbConfig.MBOM_common_items + " WHERE " +
            "comitemID = ?", comItemID);
        //lookup everything from the mbomComItem table and write it to comItems
        const comItems = await querySql("SELECT * FROM " + database + "." + dbConfig.MBOM_common_items);
        //lookup the catCode column in jobscopeCatCodes and write it to catCodes
        const catCodes =  await querySql("SELECT catCode FROM " + database + " . " + dbConfig.jobscope_codes_table);
        //lookup the classCodes column in jobscopeClassCodes and write it to classCodes
        const classCodes = await querySql("SELECT classCode FROM " + database + "." + dbConfig.jobscope_classCodes_table);

        //using the method of writing the await calls to const's and then returning the 'awaited' group result allows for parallel processing and time/performance savings
        return {editComItem, comItems, catCodes, classCodes}
    }

    //execute getComItemData function
    getComItemData()
        .then(({editComItem, comItems, userProfiles, catCodes, classCodes}) => {
            //for each item in editComItem, write to editComItemData
            for(let row of editComItem){
                editComItemData = {
                    comItemID: row.comItemID,
                    itemType: row.itemType,
                    itemMfg: row.itemMfg,
                    itemDesc: row.itemDesc,
                    itemPN: row.itemPN,
                    unitOfIssue: row.unitOfIssue,
                    catCode: row.catCode,
                    classCode: row.class,
                    status: row.status
                }
            }
            //for each item in comItems, write to comItemData
            for(let row of comItems){
                comItemData.push(row);
            }
            //for each code in catCodes, write to catCodeData
            for(let row of catCodes){
                catCodeData.push(row);
            }
            //for each code in classCodes, write to classCodeData
            for (let row of classCodes) {
                classCodeData.push(row);
            }
            return null;
        })
        .then(() => {
            //render editComItem page with editComItemData, comItemData, catCodeData, and classCodeData
            res.locals.title = 'Edit Item';
            res.render('MBOM/editComItemMBOM', {
                editComItemData: editComItemData,
                comItemData: comItemData,
                catCodeData: catCodeData,
                classCodeData: classCodeData
            });
        })
        .catch(err => {
            //if error occurs at anytime at any point in the code above, log it to the console
            console.log('Error in editComItemTableGET: \n', err, '\n');
        });
};








//editComItemTablePOST function (handles the POST request of editComItemTable)
exports.editComItemTablePOST = function(req, res) {
    req.setTimeout(0); //no timeout (this is needed to prevent error due to page taking a long time to load)
    //Initialize variables
    let urlObj = url.parse(req.originalUrl);
    urlObj.protocol = req.protocol;
    urlObj.host = req.get('host');
    let qs = queryString.parse(urlObj.search);
    let itemType = req.body.itemSelect2;
    if (itemType == 'OTHER')
        itemType = (req.body.otherItemType).toUpperCase();
    let itemMfg;
    let otherMfgDropdown = req.body.mfgList;
    let mfgSelect = req.body.mfgSelect2;
    if (mfgSelect == 'OTHER' || otherMfgDropdown == 'OTHER')
        itemMfg = req.body.otherMfgType.toUpperCase();
    else if (mfgSelect)
        itemMfg = mfgSelect.split('|')[1];
    else
        itemMfg = otherMfgDropdown;

    let updateData = {
        itemType: itemType,
        itemMfg: itemMfg,
        itemDesc: (req.body.itemDesc).toUpperCase(),
        itemPN: (req.body.itemPN).toUpperCase(),
        unitOfIssue: req.body.unitOfIssue,
        catCode: req.body.catCode,
        status: (req.body.status && String(req.body.status).trim()) ? String(req.body.status).trim() : null,
        class: req.body.class
    };

    //Initial db query - update mbomComItems with user input at the given comItemID
    querySql("UPDATE " + database + "." + dbConfig.MBOM_common_items + " SET itemType = ?, itemMfg = ?, itemDesc = ?, " +
        "itemPN = ?, unitOfIssue = ?, catCode = ?, status = ?, class = ? WHERE comItemID = ?", [updateData.itemType, updateData.itemMfg,
        updateData.itemDesc, updateData.itemPN, updateData.unitOfIssue, updateData.catCode, updateData.status, updateData.class, qs.comItemID])
        .then(() => {
            //redirect to the main mbom page
            res.locals.title = 'Edit Common Item';
            res.redirect('../MBOM');
        })
        .catch(err => {
            //if error occurs at anytime at any point in the code above, log it to the console
            console.log('Error in editComItemTablePOST: \n', err, '\n');
        });
};








/***********************************************
 COM ITEM IN MBOM
 ***********************************************/
// addComItemMBOM: handles Add-Item submissions originating from searchMBOM
exports.addComItemMBOM = function(req, res) {
    req.setTimeout(0);

    // Map fields from the add-item form
    let itemType = norm(req.body.itemType) || '';
    if (itemType === 'OTHER') itemType = (norm(req.body.itemTypeOther) || '').toUpperCase();

    let itemMfg = norm(req.body.itemMfg) || '';
    if (itemMfg === 'OTHER') itemMfg = (norm(req.body.itemMfgOther) || '').toUpperCase();

    let itemDesc = norm(req.body.itemDesc) || '';
    if (itemDesc === 'OTHER') itemDesc = (norm(req.body.itemDescOther) || '').toUpperCase();

    let itemPN = norm(req.body.itemPN) || '';
    if (itemPN === 'OTHER') itemPN = (norm(req.body.itemPNOther) || '').toUpperCase();

    // Build comItem data; prefer the submitted status if provided, otherwise default to 'Uncommon'
    let comData = {
        itemType: itemType,
        itemMfg: itemMfg,
        itemDesc: itemDesc,
        itemPN: itemPN,
        status: (typeof req.body.status !== 'undefined' && req.body.status) ? String(req.body.status) : 'Uncommon',
        unitOfIssue: (norm(req.body.unitOfIssue) || '') || null,
        catCode: (norm(req.body.catCode) || '') || null,
        class: (norm(req.body.class) || '') || null
    };

    // Determine whether the submitted P/N was the manual "OTHER" entry
    const submittedPNWasOther = (norm(req.body.itemPN) === 'OTHER');

    // Lookup existing common itemPN
    querySql("SELECT * FROM " + database + " . " + dbConfig.MBOM_common_items + " WHERE itemPN = ?", [comData.itemPN])
        .then(rows => {
            if (rows && rows.length > 0) {
                // If the user explicitly entered a manual P/N (selected OTHER),
                // treat a matching DB row as a duplicate error so we re-render
                // and preserve form values for correction. Otherwise (user
                // selected an existing P/N from the dropdown), reuse the
                // existing comItemID and proceed to insert into the MBOM.
                if (submittedPNWasOther) {
                    const dupErr = new Error('Duplicate P/N exists');
                    dupErr.code = 'ER_DUP_ENTRY';
                    dupErr.errno = 1062;
                    throw dupErr;
                }
                // Use existing comItemID (reuse)
                return Promise.resolve(rows[0].comItemID);
            }
            // No existing row found — insert new common item and return the insertId
            return querySql("INSERT INTO " + database + "." + dbConfig.MBOM_common_items + " SET ?", comData)
                .then(result => {
                    return (result && result.insertId) ? result.insertId : null;
                });
        })
        .then(comItemID => {
            if (!comItemID) throw new Error('Failed to resolve comItemID');

            // Prepare mbom item insertion(s)
            const shipLoose = req.body.shipLoose ? 'Y' : 'N';

            // Helper to perform insert for a single secID (can be null)
            function insertForSec(secID){
                const itemSumData = {
                    comItemID: comItemID,
                    mbomID: req.body.mbomID,
                    itemQty: req.body.itemQty || 1,
                    shipLoose: shipLoose,
                    secID: secID || null
                };
                return querySql("INSERT INTO " + database + "." + dbConfig.MBOM_item_table + " SET ?", itemSumData);
            }

            // If the Section select asked to 'assign', insert one row per checked assignSecIDs[]
            if (String(req.body.secID || '') === 'assign'){
                let assigns = req.body.assignSecIDs || [];
                // normalize single value to array
                if (!Array.isArray(assigns)) assigns = [assigns];

                if (assigns.length === 0){
                    // Nothing checked — fallback to single insert with no secID
                    return insertForSec(null).then(() => {
                        res.locals.title = 'Add Com Item';
                        const redirectUrl = 'searchMBOM/?bomID=' + (req.body.jobNum || '') + (req.body.releaseNum || '') + '_' + req.body.mbomID;
                        res.redirect(redirectUrl);
                        return null;
                    });
                }

                // insert for each checked section in sequence
                return assigns.reduce((p, sec) => {
                    return p.then(() => insertForSec(sec));
                }, Promise.resolve()).then(() => {
                    res.locals.title = 'Add Com Item';
                    const redirectUrl = 'searchMBOM/?bomID=' + (req.body.jobNum || '') + (req.body.releaseNum || '') + '_' + req.body.mbomID;
                    res.redirect(redirectUrl);
                    return null;
                });
            }

            // Otherwise, insert a single row; if a specific secID was provided, include it
            const specificSec = (req.body.secID && String(req.body.secID).trim() !== '') ? req.body.secID : null;
            return insertForSec(specificSec).then(() => {
                res.locals.title = 'Add Com Item';
                const redirectUrl = 'searchMBOM/?bomID=' + (req.body.jobNum || '') + (req.body.releaseNum || '') + '_' + req.body.mbomID;
                res.redirect(redirectUrl);
                return null;
            });
        })
        .catch(err => {
            console.log('Error in addComItemMBOM: \n', err, '\n');
            const msg = dbErrorMsg(err);
            // Instead of redirecting, re-render the MBOM search page preserving input values so the user can correct them
            const mbomID = req.body.mbomID;
            // fetch the data used by searchMBOMGet to render the page
            Promise.all([
                querySql("SELECT * FROM " + database + "." + dbConfig.MBOM_summary_table + " WHERE mbomID = ?", [mbomID]),
                querySql("SELECT * FROM " + database + "." + dbConfig.MBOM_common_items),
                querySql("SELECT * FROM " + database + " . " + dbConfig.MBOM_user_items),
                querySql("SELECT * FROM " + database + " . " + dbConfig.MBOM_breaker_table + " WHERE mbomID = ?", [mbomID]),
                querySql("SELECT * FROM " + database + " . " + dbConfig.MBOM_item_table + " WHERE mbomID = ?", [mbomID]),
                querySql("SELECT * FROM " + database + " . " + dbConfig.MBOM_new_section_sum + " WHERE mbomID = ?", [mbomID]),
                querySql("SELECT * FROM " + database + "." + dbConfig.jobscope_codes_table),
                querySql("SELECT * FROM " + database + "." + dbConfig.jobscope_classCodes_table),
                querySql("SELECT * FROM " + database + "." + dbConfig.MBOM_brkAcc_table + " WHERE mbomID = ?", [mbomID])
            ]).then(([mbomRows, comItems, userItems, brkSum, itemSum, secSum, catCodeSum, classCodeSum, brkAccessories]) => {
                const mbomData = mbomRows[0] || {};
                const comItemData = []; const userItemData = []; const mbomBrkData = []; const mbomItemData = []; const mbomSecData = []; const catCodeData = []; const classCodeData = []; const mbomBrkAcc = []; const brkAccData = [];
                for(let row of comItems) comItemData.push(row);
                for(let row of userItems) userItemData.push(row);
                for(let row of brkSum) mbomBrkData.push(row);
                for(let row of itemSum) mbomItemData.push(row);
                for(let row of secSum) mbomSecData.push({ secID: row.secID, sectionNum: row.sectionNum, mbomID: row.mbomID });
                for(let row of catCodeSum) catCodeData.push(row.catCode);
                for(let row of classCodeSum) classCodeData.push(row.classCode);
                for(let row of brkAccessories) mbomBrkAcc.push(row);

                // if brkAccArr was populated for this mbomID, preserve it
                if(brkAccArr.length != 0 && brkAccArr[0] && String(brkAccArr[0].mbomID) === String(mbomID)) brkAccData.push(...brkAccArr);

                res.locals.title = 'Search MBOM';
                res.render('MBOM/searchMBOM', {
                    mbomID: mbomID,
                    mbomData: mbomData,
                    mbomBrkData: mbomBrkData,
                    mbomSecData: mbomSecData,
                    mbomItemData: mbomItemData,
                    comItemData: comItemData,
                    userItemData: userItemData,
                    catCodeData: catCodeData,
                    classCodeData: classCodeData,
                    brkAccData: brkAccData,
                    brkData: brkDataObj || {},
                    mbomBrkAcc: mbomBrkAcc,
                    message: msg,
                    formValues: req.body,
                    errorField: (err && (err.code === 'ER_DUP_ENTRY' || err.errno === 1062)) ? 'itemPN' : null,
                    debug: DEBUG_CLIENT
                });
            }).catch(renderErr => {
                console.log('Error while attempting to render searchMBOM with DB error message:', renderErr);
                // fallback to redirect with encoded error
                const redirectUrl = 'searchMBOM/?bomID=' + (req.body.jobNum || '') + (req.body.releaseNum || '') + '_' + mbomID + '&error=' + encodeURIComponent(msg) + '&errorField=' + encodeURIComponent((err && (err.code === 'ER_DUP_ENTRY' || err.errno === 1062)) ? 'itemPN' : '');
                res.redirect(redirectUrl);
            });
        });
    };






//editComItem function
exports.editComItemMBOM = function(req, res) {
    req.setTimeout(0); //no timeout (this is needed to prevent error due to page taking a long time to load)
    //Initialize variables
    let urlObj = url.parse(req.originalUrl);
    urlObj.protocol = req.protocol;
    urlObj.host = req.get('host');
    let qs = queryString.parse(urlObj.search);
    let itemSumID = qs.itemSumID;
    let comItemID = qs.comItemID;
    let comItemData = [];
    let data = [];
    let editData = {};
    let catCodeData = [];
    let classCodeData = [];
    let mbomData = {
        mbomID: req.body.mbomID,
        jobNum: req.body.jobNum,
        releaseNum: req.body.releaseNum,
        jobName: req.body.jobName,
        customer: req.body.customer,
        boardDesignation: req.body.boardDesignation
    };

    //getItemData async function definition
    async function getItemData() {
        //lookup mbomComItem table and write result to comItem
        const comItem = await querySql("SELECT *  FROM " + database + "." + dbConfig.MBOM_common_items);
        //lookup mbomItemSum table and write result to itemSum
        const itemSum = await querySql("SELECT * FROM " + database + "." + dbConfig.MBOM_item_table + " WHERE itemSumID = ?", itemSumID);
        //lookup mbomComItem row with specific comItemID and write result to editItem
        const editItem = await querySql("SELECT * FROM " + database + "." + dbConfig.MBOM_common_items + " WHERE comItemID = ?", comItemID);
        // lookup cat/class codes for Uncommon row selects
        const catCodes = await querySql("SELECT catCode FROM " + database + "." + dbConfig.jobscope_codes_table);
        const classCodes = await querySql("SELECT classCode FROM " + database + "." + dbConfig.jobscope_classCodes_table);

        return {comItem, itemSum, editItem, catCodes, classCodes};
    }

    //execute getItemData
    getItemData()
        .then(({comItem, itemSum, editItem, catCodes, classCodes}) => {
            //for each item in comItem push to comItemData
            for(let row of comItem){
                comItemData.push(row);
            }
            //for each item in itemSum push to data
            for(let row of itemSum){
                data.push(row);
            }
            //for each item in editItem push to editData
            for(let row of editItem){
                editData = {
                    comItemID: row.comItemID,
                    itemType: row.itemType,
                    itemMfg: row.itemMfg,
                    itemDesc: row.itemDesc,
                    itemPN: row.itemPN,
                    status: row.status
                };
            }
            // cat/class codes (if any)
            if (catCodes && Array.isArray(catCodes)) {
                for (let r of catCodes) catCodeData.push(r.catCode);
            }
            if (classCodes && Array.isArray(classCodes)) {
                for (let r of classCodes) classCodeData.push(r.classCode);
            }
            return null;
        })
        //render MBOMeditComItem page with mbomItemData, mbomData, comItemData, editData and mbomSecData
        .then(() => {
            // ensure we have the mbomID from the itemSum data to lookup sections
            if (data && data.length && data[0].mbomID) {
                let mbomID = data[0].mbomID;
                // lookup sections for this mbomID
                return querySql("SELECT * FROM " + database + "." + dbConfig.MBOM_new_section_sum + " WHERE mbomID = ?", [mbomID])
                    .then(rows => {
                        let mbomSecData = [];
                        if (rows && rows.length) {
                            for (let row of rows) mbomSecData.push(row);
                            // sort ascending by sectionNum
                            mbomSecData.sort((a, b) => parseInt(a.sectionNum) - parseInt(b.sectionNum));
                        }
                        res.locals.title = 'Edit Item';
                        res.render('MBOM/MBOMeditComItem', {
                            mbomItemData: data,
                            mbomData: mbomData,
                            comItemData: comItemData,
                            editData: editData,
                            mbomSecData: mbomSecData,
                            catCodeData: catCodeData,
                            classCodeData: classCodeData
                        });
                        return null;
                    });
            }
            // fallback: render with empty sections array
            res.locals.title = 'Edit Item';
            res.render('MBOM/MBOMeditComItem', {
                mbomItemData: data,
                mbomData: mbomData,
                comItemData: comItemData,
                editData: editData,
                mbomSecData: [],
                catCodeData: catCodeData,
                classCodeData: classCodeData
            });
        })
        .catch(err => {
            //if error occurs at anytime at any point in the code above, log it to the console
            console.log('Error in editComItemSave: \n', err, '\n');
        });
};








//editComItemSave function
exports.editComItemSave = function(req, res) {
    req.setTimeout(0); //no timeout (this is needed to prevent error due to page taking a long time to load)
    //Initialize variables
    let urlObj = url.parse(req.originalUrl);
    urlObj.protocol = req.protocol;
    urlObj.host = req.get('host');
    let qs = queryString.parse(urlObj.search);
    let itemSumID = qs.itemSumID;
    let comItemID;

    let shipLooseCheck;
    if(req.body.editShipLoose)
        shipLooseCheck = 'Y';
    else
        shipLooseCheck = 'N';
    // Helper to gracefully handle values that may be either pipe-delimited
    // (old behavior: "a|mfg|desc|pn") or plain strings (new behavior)
    function pickPart(src, index) {
        try {
            if (typeof src !== 'string') return '';
            var parts = src.split('|');
            return (parts.length > index) ? parts[index] : src;
        } catch (e) {
            return '';
        }
    }

    let updateData = {
        itemQty: req.body.itemQty,
        itemType: req.body.itemType,
        itemMfg: pickPart(req.body.itemMfg, 1),
        itemDesc: pickPart(req.body.itemDesc, 2),
        itemPN: pickPart(req.body.itemPN, 3),
        shipLoose: shipLooseCheck
    };
    let mbomData = {
        mbomID: req.body.mbomID,
        jobNum: req.body.jobNum,
        releaseNum: req.body.releaseNum
    };

    //Initial db query - lookup mbomComItem row where itemType, itemMfg, itemDesc, and itemPN match
    querySql("SELECT comItemID FROM " + database + "." + dbConfig.MBOM_common_items + " WHERE itemType= ? AND " +
        "itemMfg = ? AND itemDesc = ? AND itemPN = ?", [updateData.itemType, updateData.itemMfg, updateData.itemDesc, updateData.itemPN])
        .then(rows => {
            if (rows && rows.length > 0) {
                // existing common item found
                return Promise.resolve(rows[0].comItemID);
            }

            // no common item exists for this combination — insert as 'Uncommon'
            const comData = {
                itemType: (updateData.itemType || '').toUpperCase(),
                itemMfg: (updateData.itemMfg || '').toUpperCase(),
                itemDesc: (updateData.itemDesc || '').toUpperCase(),
                itemPN: (updateData.itemPN || ''),
                status: 'Uncommon',
                unitOfIssue: (req.body.unitOfIssue && req.body.unitOfIssue.trim()) ? req.body.unitOfIssue : null,
                catCode: (req.body.catCode && req.body.catCode.trim()) ? req.body.catCode : null,
                class: (req.body.class && req.body.class.trim()) ? req.body.class : null
            };

            return querySql("INSERT INTO " + database + "." + dbConfig.MBOM_common_items + " SET ?", comData)
                .then(result => {
                    return (result && result.insertId) ? result.insertId : null;
                });
        })
        .then(comId => {
            if (!comId) throw new Error('Failed to resolve or create comItemID');
            comItemID = comId;
            //update mbomItemSum with the updateData in the row referenced by itemSumID
            return querySql("UPDATE mbomItemSum SET comItemID = ?, itemQty = ?, shipLoose = ? WHERE itemSumID = ?",
                [comItemID, updateData.itemQty, updateData.shipLoose, itemSumID]);
        })
        .then(() => {
            //redirect to searchMBOM page
            res.locals.title = 'Edit Common Item';
            res.redirect('../searchMBOM/?bomID=' + mbomData.jobNum + mbomData.releaseNum + "_" + mbomData.mbomID);
        })
        .catch(err => {
            //if error occurs at anytime at any point in the code above, log it to the console
            console.log('Error in editCommonItemSave: \n', err, '\n');
        });
};







/***********************************************
 USER ITEM IN MBOM
 ***********************************************/
//createUserItem function
exports.createUserItem = function(req, res) {
    req.setTimeout(0); //no timeout (this is needed to prevent error due to page taking a long time to load)
    //Initialize variables
    let exists, userItemID, itemSumID, shipLooseCheck;
    let mbomData = {
        mbomID: req.body.mbomID,
        jobNum: req.body.jobNum,
        releaseNum: req.body.releaseNum,
    };
    let itemType = req.body.itemSelect2;
    if (itemType == 'OTHER')
        itemType = (req.body.otherItemType).toUpperCase();

    let itemMfg;
    let otherMfgDropdown = req.body.mfgList;
    let mfgSelect = req.body.mfgSelect2;

    if (mfgSelect == 'OTHER' || otherMfgDropdown == 'OTHER')
        itemMfg = req.body.otherMfgType.toUpperCase();
    else if (mfgSelect)
        itemMfg = mfgSelect.split('|')[1];
    else
        itemMfg = otherMfgDropdown;

    let data = {
        mbomID: req.body.mbomID,
        itemType: itemType,
        itemMfg: itemMfg,
        itemDesc: (req.body.itemDesc).toUpperCase(),
        itemPN: req.body.itemPN,
        catCode: req.body.catCode,
        class: req.body.classCode,
        unitOfIssue: req.body.unitOfIssue
    };

    if (req.body.userShipLoose)
        shipLooseCheck = 'Y';
    else
        shipLooseCheck = 'N';

    //Initial db query - lookup mbomUserItem rows that match itemType, itemMfg, itemDesc, and itemPN
    querySql("SELECT * FROM " + database + "." + dbConfig.MBOM_user_items + " WHERE itemType = ? AND itemMfg = ? " +
        "AND itemDesc = ? AND itemPN = ?", [data.itemType, data.itemMfg, data.itemDesc, data.itemPN])
        .then(rows => {
            //if rows have data and the mbomID matches write to userItemID and toggle exists
            if(rows.length != 0 && rows[0].mbomID == data.mbomID) {
                userItemID = rows[0].userItemID;
                exists = true;
            } else
                exists = false;

            //if it doesnt exist, then insert a new row into the mbomUserItem table, and lookup the the new row in mbomUserItem
            if (!exists) {
                querySql("INSERT INTO " + database + "." + dbConfig.MBOM_user_items + " SET ?", data)
                    .then(() => {
                        return querySql("SELECT * FROM " + database + "." + dbConfig.MBOM_user_items + " WHERE " +
                            "itemType = ? AND itemMfg = ? AND itemDesc = ? AND itemPN = ? AND mbomID = ?",
                            [data.itemType, data.itemMfg, data.itemDesc, data.itemPN, data.mbomID])
                    })
                    .then(rows => {
                        //write userItemID
                        userItemID = rows[0].userItemID;

                        //create itemSumData for db entry
                        let itemSumData = {
                            itemSumID: itemSumID,
                            comItemID: null,
                            userItemID: userItemID,
                            mbomID:  data.mbomID,
                            itemQty: req.body.itemQty,
                            shipLoose: shipLooseCheck
                        };

                        //insert row into mbomItemSum with itemSumData
                        querySql("INSERT INTO " + database + "." + dbConfig.MBOM_item_table + " SET ?", itemSumData);

                        return null;
                    })
                    .catch(err => {
                        //if error occurs at anytime at any point in the code above, log it to the console
                        console.log('Error in createUserItem: \n', err, '\n');
                    });
            } else {
            // if it does exist
                //create itemSumData
                let itemSumData = {
                    itemSumID: itemSumID,
                    comItemID: null,
                    userItemID: userItemID,
                    mbomID: data.mbomID,
                    itemQty: req.body.itemQty,
                };

                //insert new row into mbomItemSum with itemSumData
                querySql("INSERT INTO " + database + "." + dbConfig.MBOM_item_table + " SET ?", itemSumData);
                return null;
            }
            return null;
        })
        .then(() => {
            //redirect to searchMBOM page
            res.locals.title = 'Create User Item';
            res.redirect('searchMBOM/?bomID=' + mbomData.jobNum + mbomData.releaseNum + "_" + mbomData.mbomID);
        })
        .catch(err => {
            //if error occurs at anytime at any point in the code above, log it to the console
            console.log('Error in createUserItem: \n', err, '\n');
        });
};







//editUserItem function
exports.editUserItem = function(req, res) {
    req.setTimeout(0); //no timeout (this is needed to prevent error due to page taking a long time to load)
    //Initialize variables
    let urlObj = url.parse(req.originalUrl);
    urlObj.protocol = req.protocol;
    urlObj.host = req.get('host');
    let qs = queryString.parse(urlObj.search);

    let comItemData = [];
    let userItemData = {};
    let catCodeData = [];
    let classCodeData = [];

    let data = [];
    let mbomData = {
        mbomID: req.body.mbomID,
        jobNum: req.body.jobNum,
        releaseNum: req.body.releaseNum,
        jobName: req.body.jobName,
        customer: req.body.customer,
        boardDesignation: req.body.boardDesignation
    };

    //getItemData async function definition
    async function getAllItemData() {
        //lookup mbomComItem table and write result to comItem
        const comItem = await querySql("SELECT *  FROM " + database + "." + dbConfig.MBOM_common_items);
        //lookup mbomItemSum table and write result to itemSum
        const itemSum = await querySql("SELECT * FROM " + database + "." + dbConfig.MBOM_item_table + " WHERE itemSumID = ?", qs.itemSumID);
        //lookup mbomUserItem table and write result to userItem
        const userItem = await querySql("SELECT * FROM " + database + "." + dbConfig.MBOM_user_items + " WHERE userItemID = ?", qs.userItemID);
        //lookup catCode table and write result to catCode
        const catCode = await querySql("SELECT * FROM " + database + "." + dbConfig.jobscope_codes_table);
        //lookup classCode table and write result to classCode
        const classCode = await querySql("SELECT * FROM " + database + "." + dbConfig.jobscope_classCodes_table);

        return {comItem, itemSum, userItem, catCode, classCode};
    }

    //execute getAllItemData
    getAllItemData()
        .then(({comItem, itemSum, userItem, catCode, classCode}) => {
            //for each item in comItem push to comItemData
            for(let row of comItem){
                comItemData.push(row);
            }
            //for each item in itemSum push to data
            for(let row of itemSum){
                data.push(row);
            }
            //for each item in userItem push to userItemData
            for(let row of userItem){
                userItemData = {
                    userItemID: row.userItemID,
                    itemType: row.itemType,
                    itemMfg: row.itemMfg,
                    itemDesc: row.itemDesc,
                    itemPN: row.itemPN,
                    unitOfIssue: row.unitOfIssue,
                    catCode: row.catCode,
                    class: row.class
                };
            }
            //for each code in catCodes push to catCodeData
            for(let row of catCode){
                catCodeData.push(row);
            }
            //for each code in classCode push to classCodeData
            for(let row of classCode) {
                classCodeData.push(row);
            }
            return null;
        })
        .then(() => {
            //render the editUserItem page with mbomItemData, mbomData, comItemData, userItemData, catCodeData, and classCodeData
            res.locals.title = 'Edit User Item';
            // console.log('editUserItem userItemData:', userItemData);
            res.render('MBOM/editUserItem', {
                mbomItemData: data,
                mbomData: mbomData,
                comItemData: comItemData,
                userItemData: userItemData,
                catCodeData: catCodeData,
                classCodeData: classCodeData
            });
        })
        .catch(err => {
            //if error occurs at anytime at any point in the code above, log it to the console
            console.log('Error in editUserItem: \n', err, '\n');
        });
};







//editUserItemSave function
exports.editUserItemSave = function(req, res) {
    req.setTimeout(0); //no timeout (this is needed to prevent error due to page taking a long time to load)
    //Initialize variables
    let mbomData = {
        mbomID: req.body.mbomID,
        jobNum: req.body.jobNum,
        releaseNum: req.body.releaseNum
    };
    let itemSumID = req.body.itemSumID;
    let userItemID;
    let comItemID = null;
    let shipLooseCheck;
    if(req.body.editUserShipLoose)
        shipLooseCheck = 'Y';
    else
        shipLooseCheck = 'N';
    // Use only the template select names and manual OTHER inputs.
    // If the selected value is 'OTHER', use the corresponding manual input instead.
    // Item Type
    let itemType = '';
    if (String(req.body.itemTypeSelect) === 'OTHER') {
        itemType = (req.body.itemTypeOther || '').toUpperCase();
    } else {
        itemType = (req.body.itemTypeSelect || '').toUpperCase();
    }

    // Item Manufacturer
    let itemMfg = '';
    if (String(req.body.itemMfgSelect) === 'OTHER') {
        itemMfg = (req.body.itemMfgOther || '').toUpperCase();
    } else {
        itemMfg = (req.body.itemMfgSelect || '').toUpperCase();
    }

    // Description
    let itemDescVal = '';
    if (String(req.body.itemDescSelect) === 'OTHER') {
        itemDescVal = (req.body.itemDescOther || '').toUpperCase();
    } else {
        itemDescVal = (req.body.itemDescSelect || '').toUpperCase();
    }

    // Part Number (PN)
    let itemPNVal = '';
    if (String(req.body.itemPNSelect) === 'OTHER') {
        itemPNVal = (req.body.itemPNOther || '') || '';
    } else {
        itemPNVal = req.body.itemPNSelect || '';
    }

    let updateData = {
        mbomID: req.body.mbomID,
        itemQty: req.body.itemQty,
        itemType: itemType,
        itemMfg: itemMfg,
        itemDesc: (itemDescVal).toUpperCase(),
        unitOfIssue: req.body.unitOfIssue,
        catCode: req.body.catCode,
        class: req.body.class,
        itemPN: itemPNVal,
        shipLoose: shipLooseCheck
    };

    // Debug: log the payload that will be sent to the DB (only when DEBUG_MODE enables server logs)
    if (DEBUG_SERVER) {
        try {
            console.log('editUserItemSave payload:', JSON.stringify(updateData));
        } catch (e) {
            console.log('editUserItemSave payload (non-serializable):', updateData);
        }
    }

    // Ensure the corresponding MBOM_common_items entry exists (insert as 'Uncommon' if missing)
    querySql("SELECT comItemID FROM " + database + "." + dbConfig.MBOM_common_items + " WHERE itemType = ? AND itemMfg = ? AND itemDesc = ? AND itemPN = ?", [
        (updateData.itemType || '').toUpperCase(), (updateData.itemMfg || '').toUpperCase(), (updateData.itemDesc || '').toUpperCase(), (updateData.itemPN || '')
    ])
        .then(rows => {
            if (rows && rows.length > 0) {
                comItemID = rows[0].comItemID;
                return comItemID;
            }
            const comData = {
                itemType: (updateData.itemType || '').toUpperCase(),
                itemMfg: (updateData.itemMfg || '').toUpperCase(),
                itemDesc: (updateData.itemDesc || '').toUpperCase(),
                itemPN: (updateData.itemPN || ''),
                status: 'Uncommon',
                unitOfIssue: (req.body.unitOfIssue && req.body.unitOfIssue.trim()) ? req.body.unitOfIssue : null,
                catCode: (req.body.catCode && req.body.catCode.trim()) ? req.body.catCode : null,
                class: (req.body.class && req.body.class.trim()) ? req.body.class : null
            };
            if (DEBUG_SERVER) console.log('editUserItemSave: inserting Uncommon MBOM_common_items for', comData);
            return querySql("INSERT INTO " + database + "." + dbConfig.MBOM_common_items + " SET ?", comData)
                .then(result => {
                    comItemID = (result && result.insertId) ? result.insertId : null;
                    return comItemID;
                });
        })
        .then(() => {
            // Before updating MBOM_user_items, set catCode to 'OBSOLETE'
            updateData.catCode = 'OBSOLETE';
            if (DEBUG_SERVER) console.log('editUserItemSave: catCode for userItem set to OBSOLETE for itemSumID=' + itemSumID + ', mbomID=' + updateData.mbomID);
            // Continue with primary-key based update via MBOM_item_table lookup
            return querySql("SELECT userItemID FROM " + database + "." + dbConfig.MBOM_item_table + " WHERE itemSumID = ? AND mbomID = ?", [itemSumID, updateData.mbomID]);
        })
        .then(rows => {
            if (rows && rows.length > 0 && rows[0].userItemID) {
                // We have a primary key mapping; update by PK
                userItemID = rows[0].userItemID;
                if (DEBUG_SERVER) console.log('editUserItemSave: updating existing MBOM_user_items by userItemID=', userItemID);
                return querySql("UPDATE " + database + "." + dbConfig.MBOM_user_items + " SET itemType = ?, itemMfg = ?, " +
                    "itemDesc = ?, unitOfIssue = ?, catCode = ?, class = ? WHERE userItemID = ?", [updateData.itemType,
                    updateData.itemMfg, updateData.itemDesc, updateData.unitOfIssue, updateData.catCode, updateData.class, userItemID])
                    .then(() => {
                        if (DEBUG_SERVER) console.log('editUserItemSave: updating MBOM_item_table itemSumID=', itemSumID, ' with itemQty=', updateData.itemQty, ' shipLoose=', updateData.shipLoose);
                        return querySql("UPDATE " + database + "." + dbConfig.MBOM_item_table + " SET itemQty = ?, shipLoose = ? WHERE itemSumID = ?", [updateData.itemQty, updateData.shipLoose, itemSumID]);
                    })
                    .then(() => {
                        if (DEBUG_SERVER) console.log('editUserItemSave: ensuring userItemID=', userItemID, ' is set on MBOM_item_table for itemSumID=', itemSumID);
                        return querySql("UPDATE " + database + "." + dbConfig.MBOM_item_table + " SET userItemID = ? WHERE itemSumID = ? AND mbomID = ? ", [userItemID, itemSumID, updateData.mbomID]);
                    });
            }

            // No userItemID mapping found for this itemSumID — insert a new MBOM_user_items row
            if (DEBUG_SERVER) console.log('editUserItemSave: no userItemID found for itemSumID=', itemSumID, ' — inserting new MBOM_user_items');
            return querySql("INSERT INTO " + database + "." + dbConfig.MBOM_user_items + " SET itemType = ?, itemMfg = ?, " +
                "itemDesc = ?, unitOfIssue = ?, catCode = ?, class = ?, itemPN = ?, mbomID = ?", [updateData.itemType,
                updateData.itemMfg, updateData.itemDesc, updateData.unitOfIssue, updateData.catCode, updateData.class, updateData.itemPN, updateData.mbomID])
                .then(insertRes => {
                    if (insertRes && insertRes.insertId) {
                        userItemID = insertRes.insertId;
                        if (DEBUG_SERVER) console.log('editUserItemSave: inserted MBOM_user_items userItemID=', userItemID);
                    } else {
                        if (DEBUG_SERVER) console.log('editUserItemSave: insert returned no insertId for MBOM_user_items');
                    }
                    return null;
                })
                .then(() => {
                    if (userItemID) {
                        if (DEBUG_SERVER) console.log('editUserItemSave: updating MBOM_item_table set userItemID=', userItemID, ' itemSumID=', itemSumID, ' itemQty=', updateData.itemQty, ' shipLoose=', updateData.shipLoose);
                        return querySql("UPDATE " + database + "." + dbConfig.MBOM_item_table + " SET userItemID = ?, itemQty = ?, " +
                            "shipLoose = ? WHERE itemSumID = ?", [userItemID, updateData.itemQty, updateData.shipLoose, itemSumID]);
                    }
                    return null;
                });
        })
        .then(() => {
            // If we have a comItemID (found or just created), ensure the mbom itemSum row references it
            if (comItemID) {
                if (DEBUG_SERVER) console.log('editUserItemSave: updating MBOM_item_table set comItemID=', comItemID, ' for itemSumID=', itemSumID);
                // Update the specific itemSum row first
                return querySql("UPDATE " + database + "." + dbConfig.MBOM_item_table + " SET comItemID = ? WHERE itemSumID = ?", [comItemID, itemSumID])
                    .then(() => {
                        // Also propagate the comItemID to all MBOM_item_table rows that reference the same userItemID
                        if (userItemID) {
                            if (DEBUG_SERVER) console.log('editUserItemSave: propagating comItemID=', comItemID, ' to all MBOM_item_table rows with userItemID=', userItemID);
                            return querySql("UPDATE " + database + "." + dbConfig.MBOM_item_table + " SET comItemID = ? WHERE userItemID = ?", [comItemID, userItemID]);
                        }
                        return null;
                    });
            }
            return null;
        })
        .then(() => {
            // Final cleanup: unlink user item and item-sum references if requested.
            // Set mbomID to NULL on MBOM_user_items for this userItemID, then clear userItemID on MBOM_item_table for this itemSumID.
            if (userItemID) {
                if (DEBUG_SERVER) console.log('editUserItemSave: nulling MBOM_user_items.mbomID for userItemID=', userItemID);
                return querySql("UPDATE " + database + "." + dbConfig.MBOM_user_items + " SET mbomID = NULL WHERE userItemID = ?", [userItemID])
                    .then(() => {
                        if (DEBUG_SERVER) console.log('editUserItemSave: nulling MBOM_item_table.userItemID for userItemID=', userItemID);
                        return querySql("UPDATE " + database + "." + dbConfig.MBOM_item_table + " SET userItemID = NULL WHERE userItemID = ?", [userItemID]);
                    });
            }
            return null;
        })
        .then(() => {
            //redirect to searchMBOM page
            res.locals.title = 'Edit User Item';
            res.redirect('../searchMBOM/?bomID=' + mbomData.jobNum + mbomData.releaseNum + "_" + mbomData.mbomID);
        })
        .catch(err => {
            //if error occurs at anytime at any point in the code above, log it to the console
            console.log('Error in editUserItemSave: \n', err, '\n');
        });
};






/***********************************************
 COM AND USER ITEM IN MBOM
 ***********************************************/
//copyItem function
exports.copyItem = function(req, res) {
    req.setTimeout(0); //no timeout (this is needed to prevent error due to page taking a long time to load)
    //Initialize variables
    let urlObj = url.parse(req.originalUrl);
    urlObj.protocol = req.protocol;
    urlObj.host = req.get('host');
    let qs = queryString.parse(urlObj.search);
    let itemData = [];
    let mbomData = {
        mbomID: req.body.mbomID,
        jobNum: req.body.jobNum,
        releaseNum: req.body.releaseNum
    };

    //Initial db query - lookup mbomItemSum in the row referenced by itemSumID
    querySql("SELECT * FROM " + database + "." + dbConfig.MBOM_item_table + " WHERE itemSumID = ?", qs.itemSumID)
        .then(rows => {
            //update itemData with the result
            itemData = {
                comItemID: rows[0].comItemID,
                userItemID: rows[0].userItemID,
                mbomID: rows[0].mbomID,
                itemQty: rows[0].itemQty,
                shipLoose: rows[0].shipLoose
            };

            //insert new row into the mbomItemSum with itemData
            querySql("INSERT INTO " + database + "." + dbConfig.MBOM_item_table + " SET ?", itemData);
            return null
        })
        .then(() => {
            //redirect to searchMBOM page
            res.locals.title = 'Copy Item';
            res.redirect('../searchMBOM/?bomID=' + mbomData.jobNum + mbomData.releaseNum + "_" + mbomData.mbomID);
        })
        .catch(err => {
            //if error occurs at anytime at any point in the code above, log it to the console
            console.log('Error in copyItem: \n', err, '\n');
        });
};







//deleteItem function
exports.deleteItem = function(req, res) {
    req.setTimeout(0); //no timeout (this is needed to prevent error due to page taking a long time to load)
    //Initialize variables
    let urlObj = url.parse(req.originalUrl);
    urlObj.protocol = req.protocol;
    urlObj.host = req.get('host');
    let qs = queryString.parse(urlObj.search);

    let mbomData = {
        mbomID: req.body.mbomID,
        jobNum: req.body.jobNum,
        releaseNum: req.body.releaseNum,
    };
    let userItemID;

    //Initial db query - lookup userItemID from mbomItemSum in the row referenced by itemSumID
    querySql("SELECT userItemID FROM " + database + "." + dbConfig.MBOM_item_table + " WHERE itemSumID = ?", qs.itemSumID)
        .then(rows => {
            //set userItemID
            userItemID = rows[0].userItemID;

            //lookup mbomItemSum in the row referenced by userItemID and mbomID
            querySql("SELECT * FROM " + database + "." + dbConfig.MBOM_item_table + " WHERE userItemID = ? AND mbomID = ?", [userItemID, mbomData.mbomID])
                .then(rows => {
                    //if record exists
                    if(rows.length == 1){
                        //delete row from mbomUserItem referenced by userItemID
                        querySql("DELETE FROM " + database + "." + dbConfig.MBOM_user_items + " WHERE userItemID = ?", userItemID)
                    }
                    return null;
                })
                .catch(err => {
                    //if error occurs at anytime at any point in the code above, log it to the console
                    console.log('Error in deleteItem: \n', err, '\n');
                });

            //delete row from mbomItemSum referenced by itemSumID
            querySql("DELETE FROM " + database + "." + dbConfig.MBOM_item_table + " WHERE itemSumID = ?", qs.itemSumID);

            return null;
        })
        .then(() => {
            //redirect to the searchMBOM page
            res.locals.title = 'Delete Item';
            res.redirect('../searchMBOM/?bomID=' + mbomData.jobNum + mbomData.releaseNum + "_" + mbomData.mbomID);
        })
        .catch(err => {
            //if error occurs at anytime at any point in the code above, log it to the console
            console.log('Error in deleteItem: \n', err, '\n');
        });
};








/***********************************************
 BREAKERS IN MBOM
 ***********************************************/
//addBrk function
exports.addBrk = function(req, res) {
    req.setTimeout(0); //no timeout (this is needed to prevent error due to page taking a long time to load)
    //Initialize variables
    let data1 = {
        jobNum: req.body.jobNum,
        releaseNum: req.body.releaseNum,
        mbomID: req.body.mbomID
    };
    let data = [];
    let brkAccData = [];
    for(let el of brkAccArr){
        brkAccData.push({
            brkAccID: null,
            mbomID: data1.mbomID,
            idDev: null,
            brkAccQty: el.qty,
            brkAccType: el.type,
            brkAccMfg: el.mfg,
            brkAccDesc: el.desc,
            brkAccPN: el.pn
        });
    }
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
    //dataPush function definition
    async function dataPush(){
        for(let row of designationArrayFinal) {
            data.push({
                mbomID: req.body.mbomID,
                devDesignation: row.toUpperCase(),
                devLayout: req.body.devLayout,
                unitOfIssue: req.body.unitOfIssue,
                catCode: req.body.catCode,
                class: req.body.classCode,
                brkPN: req.body.brkPN,
                cradlePN: req.body.cradlePN,
                devMfg: (req.body.devMfg).toUpperCase()
            });
        }
        return data;
    }

    //execute dataPush
    dataPush()
        .then(
            async function (rows) {
                let temp = [];
                //for each breaker
                for (let row of rows) {
                    //insert new row into mbomBrkSum
                    await querySql("INSERT INTO " +  database + "." + dbConfig.MBOM_breaker_table + " SET ? ", row)
                        .then(rows => {
                            temp.push(rows.insertId);
                        });
                }
                return temp
            }
        )
        .then(
            async function(rows) {
                //for each breaker
                for(let row of rows){
                    //for each breaker accessory
                    for(let el of brkAccData){
                        //insert new row into mbomBrkAcc
                        await querySql("INSERT INTO " + database + "." + dbConfig.MBOM_brkAcc_table + " SET mbomID = ?, " +
                            "idDev = ?, brkAccQty = ?, brkAccType = ?, brkAccMfg = ?, brkAccDesc = ?, brkAccPN = ?",
                            [el.mbomID, row, el.brkAccQty, el.brkAccType, el.brkAccMfg, el.brkAccDesc, el.brkAccPN]);
                    }
                }

                brkAccArr = [];
                brkDataObj = {};
                return null;
            }
        )
        .then(() => {
            //redirect to searchMBOM
            res.locals.title = 'Add Breaker';
            res.redirect('searchMBOM/?bomID=' + data1.jobNum + data1.releaseNum + "_" + data1.mbomID);
            return null;
        })
        .catch(err => {
            //if error occurs at anytime at any point in the code above, log it to the console
            return Promise.reject(err);
        });
};







//copyBreaker function
exports.copyBreaker = function(req, res) {
    req.setTimeout(0); //no timeout (this is needed to prevent error due to page taking a long time to load)
    //Initialize variables
    let urlObj = url.parse(req.originalUrl);
    urlObj.protocol = req.protocol;
    urlObj.host = req.get('host');
    let qs = queryString.parse(urlObj.search);
    let mbomData = {
        mbomID: req.body.mbomID,
        jobNum: req.body.jobNum,
        releaseNum: req.body.releaseNum,
        jobName: req.body.jobName,
        customer: req.body.customer,
        boardDesignation: req.body.boardDesignation
    };
    let breakerData;
    let accData = [];

    async function getBrkAndAccData() {
        //lookup mbomBrkSum row referenced by idDev
        const brk = await querySql("SELECT * FROM " + database + "." + dbConfig.MBOM_breaker_table + " WHERE idDev = ?", qs.idDev);
        //lookup mbomBrkAcc row referenced by idDev
        const accList = await querySql("SELECT * FROM " + database + "." + dbConfig.MBOM_brkAcc_table + " WHERE idDev = ?", qs.idDev);

        return {brk, accList}
    }

    //execute getBrkAndAccData
    getBrkAndAccData()
        .then(({brk, accList}) => {
            //update breakerData with the result
            breakerData = {
                mbomID: brk[0].mbomID,
                devLayout: brk[0].devLayout,
                devDesignation: brk[0].devDesignation,
                unitOfIssue: brk[0].unitOfIssue,
                catCode: brk[0].catCode,
                class: brk[0].class,
                brkPN: brk[0].brkPN,
                cradlePN: brk[0].cradlePN,
                devMfg: brk[0].devMfg
            };

            //for each accessory
            for (let row of accList) {
                //push to the accData array
                accData.push({
                    mbomID: row.mbomID,
                    brkAccQty: row.brkAccQty,
                    brkAccType: row.brkAccType,
                    brkAccMfg: row.brkAccMfg,
                    brkAccDesc: row.brkAccDesc,
                    brkAccPN: row.brkAccPN
                });
            }

            return breakerData;
        })
        .then(
            async function(breakerData){
                //insert new row into mbomBrkSum using breakerData
                await querySql("INSERT INTO " + database + " . " + dbConfig.MBOM_breaker_table + " SET ?", breakerData);
                //lookup mbomBrkSum rows referenced by mbomID
                return querySql("SELECT * FROM " + database + "." + dbConfig.MBOM_breaker_table + " WHERE mbomID = ?", breakerData.mbomID);
            }
        )
        .then(rows => {
            let newDevID = rows[rows.length - 1].idDev;
            for (let i = 0; i < accData.length; i++) {
                accData[i].idDev = newDevID;
                querySql("INSERT INTO " + database + " . " + dbConfig.MBOM_brkAcc_table + " SET ?", accData[i]);
            }
            return null
        })
        .then(() => {
            //redirect to searchMBOM page
            res.locals.title = 'Copy Breaker';
            res.redirect('../searchMBOM/?bomID=' + mbomData.jobNum + mbomData.releaseNum + "_" + mbomData.mbomID);
        })
        .catch(err => {
            //if error occurs at anytime at any point in the code above, log it to the console
            return Promise.reject(err);
        });
};







//editBreaker function
exports.editBreaker = function(req, res) {
    req.setTimeout(0); //no timeout (this is needed to prevent error due to page taking a long time to load)
    //Initialize variables
    let urlObj = url.parse(req.originalUrl);
    urlObj.protocol = req.protocol;
    urlObj.host = req.get('host');
    let qs = queryString.parse(urlObj.search);
    let breakerData = [];
    let accData = [];
    let brkDataObj;
    let mbomData = {
        mbomID: req.body.mbomID,
        jobNum: req.body.jobNum,
        releaseNum: req.body.releaseNum,
        jobName: req.body.jobName,
        customer: req.body.customer,
        boardDesignation: req.body.boardDesignation
    };


    //Initial db query - lookup mbomBrkSum row refenced by idDev
    querySql("SELECT * FROM " + database + "." + dbConfig.MBOM_breaker_table + " WHERE idDev = ?", qs.idDev)
        .then(rows => {
            //for each breaker
            for(let row of rows){
                //push to breakerData
                breakerData.push(row);
            }
            //lookup the mbomBrkAcc table rows referenced by idDev
            return querySql("SELECT * FROM " + database + "." + dbConfig.MBOM_brkAcc_table + " WHERE idDev = ?", qs.idDev)
        })
        .then(rows => {
            //for each accessory
            for(let row of rows){
                //push to accData
                accData.push(row);
            }
            return null
        })
        .then(() => {
            //render editBreaker with mbomBrkData, brkAccData, mbomData, and brkData
            res.locals.title = 'Edit Breaker';
            res.render('MBOM/editBreaker', {
                mbomBrkData: breakerData,
                brkAccData: accData,
                mbomData: mbomData,
                brkData: brkDataObj
            });
        })
        .catch(err => {
            //if error occurs at anytime at any point in the code above, log it to the console
            console.log('Error in editBreaker: \n', err, '\n');
        });
};







//editBreakerSave function
exports.editBreakerSave = function(req, res) {
    req.setTimeout(0); //no timeout (this is needed to prevent error due to page taking a long time to load)
    //Initialize variables
    let mbomData = {
        mbomID: req.body.mbomID,
        jobNum: req.body.jobNum,
        releaseNum: req.body.releaseNum,
    };
    let updateData = {
        idDev: req.body.idDev,
        mbomID: req.body.mbomID,
        devLayout: req.body.devLayout,
        devDesignation: req.body.devDesignation,
        unitOfIssue: req.body.unitOfIssue,
        catCode: req.body.catCode,
        class: req.body.class,
        brkPN: req.body.brkPN,
        cradlePN: req.body.cradlePN,
        devMfg: req.body.devMfg
    };

    //Initial db query - update mbomBrkSum in the row referenced by idDev using updateData
    querySql("UPDATE " + database + "." + dbConfig.MBOM_breaker_table + " SET mbomID = ?, " +
        " devLayout = ?, devDesignation = ?, unitOfIssue = ?, catCode = ?, class = ?, brkPN = ?, cradlePN = ?, devMfg = ? WHERE idDev = ?", [updateData.mbomID,
        updateData.devLayout, updateData.devDesignation, updateData.unitOfIssue, updateData.catCode, updateData.class, updateData.brkPN, updateData.cradlePN,
        updateData.devMfg, updateData.idDev])
        .then(() => {
            //redirect to searchMBOM page
            res.locals.title = 'Copy Breaker';
            res.redirect('../searchMBOM/?bomID=' + mbomData.jobNum + mbomData.releaseNum + "_" + updateData.mbomID);
        })
        .catch(err => {
            //if error occurs at anytime at any point in the code above, log it to the console
            console.log('Error in editBreakerSave: \n', err, '\n');
        });
};







//deleteBreaker function
exports.deleteBreaker = function(req, res) {
    req.setTimeout(0); //no timeout (this is needed to prevent error due to page taking a long time to load)
    //Initialize variables
    let urlObj = url.parse(req.originalUrl);
    urlObj.protocol = req.protocol;
    urlObj.host = req.get('host');
    let qs = queryString.parse(urlObj.search);

    let mbomData = {
        mbomID: req.body.mbomID,
        jobNum: req.body.jobNum,
        releaseNum: req.body.releaseNum,
    };

    //deleteBreakerAndAcc function definition
    async function deleteBreakerAndAcc() {
        //delete row referenced by idDev from mbomBrkSum
        await querySql("DELETE FROM " + database + "." + dbConfig.MBOM_breaker_table + " WHERE idDev = ?", qs.idDev);
        //delete row referenced by idDev from mbomBrkAcc
        await querySql("DELETE FROM " + database + "." + dbConfig.MBOM_brkAcc_table + " WHERE idDev = ?", qs.idDev);

        return null;
    }

    //execute deleteBreakerAndAcc function
    deleteBreakerAndAcc()
        .then(() => {
            //redirect to searchMBOM page
            res.locals.title = 'Delete Breaker';
            res.redirect('../searchMBOM/?bomID=' + mbomData.jobNum + mbomData.releaseNum + "_" + mbomData.mbomID);
        })
        .catch(err => {
            //if error occurs at anytime at any point in the code above, log it to the console
            console.log('Error in deleteBreaker: \n', err, '\n');
        });
};








/***********************************************
 SECTION CONFIGURE IN MBOM
 ***********************************************/
//mbomAddSection function
exports.mbomAddSection = async function(req, res) {
    req.setTimeout(0);
    // Initialize variables
    const data = {
        jobNum: req.body.jobNum,
        releaseNum: req.body.releaseNum,
    };
    // normalize possible array inputs from duplicate form fields (take first value)
    let jobNum = data.jobNum;
    let releaseNum = data.releaseNum;
    if (Array.isArray(jobNum)) jobNum = jobNum[0];
    if (Array.isArray(releaseNum)) releaseNum = releaseNum[0];
    // ensure strings
    jobNum = (typeof jobNum === 'undefined' || jobNum === null) ? '' : String(jobNum);
    releaseNum = (typeof releaseNum === 'undefined' || releaseNum === null) ? '' : String(releaseNum);
    try {
        // Use a dedicated connection and transaction to avoid race conditions
        const conn = await DB.getSqlConnection();
        try {
            await conn.beginTransaction();

            // lock the summary row for this job/release
            const selectForUpdate = "SELECT * FROM " + database + "." + dbConfig.MBOM_summary_table + " WHERE jobNum = ? AND releaseNum = ? FOR UPDATE";
            const [rows] = await conn.query(selectForUpdate, [jobNum, releaseNum]);
            if (!rows || rows.length === 0) {
                await conn.rollback();
                conn.release();
                return res.redirect('searchMBOM/?bomID=' + jobNum + releaseNum + "_");
            }

            const currentNumSections = parseInt(rows[0].numSections || 0, 10);
            const mbomID = rows[0].mbomID;

            // allow adding multiple sections in one request via `addCount` form field
            let addCount = 1;
            if (req.body && (req.body.addCount || req.body.numToAdd)) {
                addCount = parseInt(req.body.addCount || req.body.numToAdd, 10) || 1;
            }
            // sanity bounds
            if (addCount < 1) addCount = 1;
            if (addCount > 50) addCount = 50;

            const newTotal = currentNumSections + addCount;

            // insert new sections with the locked connection
            for (let s = currentNumSections + 1; s <= newTotal; s++) {
                await conn.query("INSERT INTO " + database + "." + dbConfig.MBOM_new_section_sum + " (sectionNum, mbomID) VALUES (?, ?)", [s, mbomID]);
            }

            // update the summary numSections
            const updateQuery = "UPDATE " + database + "." + dbConfig.MBOM_summary_table + " SET numSections = ? WHERE jobNum = ? AND releaseNum = ?";
            await conn.query(updateQuery, [newTotal, jobNum, releaseNum]);

            await conn.commit();
            conn.release();

            // redirect to searchMBOM page
            res.locals.title = 'Add Section';
            return res.redirect('searchMBOM/?bomID=' + jobNum + releaseNum + "_" + mbomID);
        } catch (e) {
            try { await conn.rollback(); } catch (er) { /* ignore */ }
            try { conn.release(); } catch (er) { /* ignore */ }
            throw e;
        }
    } catch (err) {
        console.log('Error in mbomAddSection: \n', err, '\n');
        return res.status(500).send('Error adding section');
    }
};







//mbomResetSection function
exports.mbomResetSection = async function(req, res) {
    req.setTimeout(0); //no timeout (this is needed to prevent error due to page taking a long time to load)
    // Initialize variables
    let data = {
        jobNum: req.body.jobNum,
        releaseNum: req.body.releaseNum,
    };

    // normalize possible array inputs (take first value)
    let jobNum = data.jobNum;
    let releaseNum = data.releaseNum;
    if (Array.isArray(jobNum)) jobNum = jobNum[0];
    if (Array.isArray(releaseNum)) releaseNum = releaseNum[0];
    jobNum = (typeof jobNum === 'undefined' || jobNum === null) ? '' : String(jobNum);
    releaseNum = (typeof releaseNum === 'undefined' || releaseNum === null) ? '' : String(releaseNum);

    try {
        const conn = await DB.getSqlConnection();
        try {
            await conn.beginTransaction();

            // Lock the summary row for this job to prevent concurrent changes
            const selectQuery = "SELECT * FROM " + database + "." + dbConfig.MBOM_summary_table + " WHERE jobNum = ? AND releaseNum = ? FOR UPDATE";
            const [rows] = await conn.query(selectQuery, [jobNum, releaseNum]);
            if (!rows || rows.length === 0) {
                await conn.rollback();
                conn.release();
                console.log('mbomResetSection - summary row not found for', jobNum, releaseNum);
                res.locals.title = 'Reset Section - Not Found';
                return res.redirect('searchMBOM/?bomID=' + jobNum + releaseNum + "_");
            }

            const mbomID = rows[0].mbomID;

            // set numSections to 0 in summary
            const updateSummary = "UPDATE " + database + "." + dbConfig.MBOM_summary_table + " SET numSections = ? WHERE jobNum = ? AND releaseNum = ?";
            await conn.query(updateSummary, [0, jobNum, releaseNum]);

            // delete sections for this mbomID
            const deleteSections = "DELETE FROM " + database + "." + dbConfig.MBOM_new_section_sum + " WHERE mbomID = ?";
            await conn.query(deleteSections, [mbomID]);

            // null out secID on items and breakers for this mbomID
            const updateItems = "UPDATE " + database + "." + dbConfig.MBOM_item_table + " SET secID = NULL WHERE mbomID = ?";
            await conn.query(updateItems, [mbomID]);

            const updateBrks = "UPDATE " + database + "." + dbConfig.MBOM_breaker_table + " SET secID = NULL WHERE mbomID = ?";
            await conn.query(updateBrks, [mbomID]);

            await conn.commit();
            conn.release();

            // redirect to searchMBOM after commit so UI sees consistent DB state
            res.locals.title = 'Reset Section';
            return res.redirect('searchMBOM/?bomID=' + jobNum + releaseNum + "_" + mbomID);
        } catch (e) {
            try { await conn.rollback(); } catch (er) { /* ignore */ }
            try { conn.release(); } catch (er) { /* ignore */ }
            throw e;
        }
    } catch (err) {
        console.log('Error in mbomResetSection: \n', err, '\n');
        return res.status(500).send('Error resetting sections');
    }
};








//mbomDeleteSection function
exports.mbomDeleteSection = async function(req, res) {
    req.setTimeout(0);
    // Initialize variables
    const urlObj = url.parse(req.originalUrl);
    urlObj.protocol = req.protocol;
    urlObj.host = req.get('host');
    const qs = queryString.parse(urlObj.search || '');
    const selectedSec = qs.selectedSec;
    const secIDParam = qs.secID;
    const numSections = qs.numSections;
    const data = {
        mbomID: req.body.mbomID,
        jobNum: req.body.jobNum,
        releaseNum: req.body.releaseNum
    };
    // normalize possible array inputs (take first value)
    let mbomID = data.mbomID;
    let jobNum = data.jobNum;
    let releaseNum = data.releaseNum;
    if (Array.isArray(mbomID)) mbomID = mbomID[0];
    if (Array.isArray(jobNum)) jobNum = jobNum[0];
    if (Array.isArray(releaseNum)) releaseNum = releaseNum[0];
    mbomID = (typeof mbomID === 'undefined' || mbomID === null) ? '' : String(mbomID);
    jobNum = (typeof jobNum === 'undefined' || jobNum === null) ? '' : String(jobNum);
    releaseNum = (typeof releaseNum === 'undefined' || releaseNum === null) ? '' : String(releaseNum);

    try {
        const conn = await DB.getSqlConnection();
        try {
            await conn.beginTransaction();

            // lock the target section row. Prefer secID when provided to avoid ambiguity.
            let selectSectionQuery;
            let selectParams;
            if (secIDParam) {
                selectSectionQuery = "SELECT * FROM " + database + "." + dbConfig.MBOM_new_section_sum + " WHERE secID = ? FOR UPDATE";
                selectParams = [secIDParam];
            } else {
                selectSectionQuery = "SELECT * FROM " + database + "." + dbConfig.MBOM_new_section_sum + " WHERE mbomID = ? AND sectionNum = ? FOR UPDATE";
                selectParams = [mbomID, selectedSec];
            }
            // locked target section row
            const [rows] = await conn.query(selectSectionQuery, selectParams);
            console.log('mbomDeleteSection - select returned rows count:', (rows && rows.length) || 0);
            if (!rows || rows.length === 0) {
                await conn.rollback();
                conn.release();
                console.log('mbomDeleteSection - section not found, redirecting back. params:', {mbomID, selectedSec, numSections, jobNum, releaseNum});
                res.locals.title = 'Delete Section - Not Found';
                return res.redirect('../searchMBOM/?bomID=' + jobNum + releaseNum + "_" + mbomID);
            }

            const secID = rows[0].secID;
            // prefer the authoritative sectionNum from the locked row (use for renumbering)
            const deletedSectionNum = rows[0].sectionNum;

            // delete the section row. If we locked by secID, delete by secID; otherwise delete by mbomID+sectionNum
            let deleteQuery, deleteParams;
            if (secID) {
                deleteQuery = "DELETE FROM " + database + "." + dbConfig.MBOM_new_section_sum + " WHERE secID = ?";
                deleteParams = [secID];
            } else {
                deleteQuery = "DELETE FROM " + database + "." + dbConfig.MBOM_new_section_sum + " WHERE mbomID = ? AND sectionNum = ?";
                deleteParams = [mbomID, selectedSec];
            }
            // executing delete
            const [deleteResult] = await conn.query(deleteQuery, deleteParams);
            console.log('mbomDeleteSection - delete affectedRows:', deleteResult && deleteResult.affectedRows);

            // null out secID on affected breakers and items (only meaningful if secID exists)
            if (secID) {
                const clearBrk = "UPDATE " + database + "." + dbConfig.MBOM_breaker_table + " SET secID = NULL WHERE mbomID = ? AND secID = ?";
                await conn.query(clearBrk, [mbomID, secID]);
                const clearItem = "UPDATE " + database + "." + dbConfig.MBOM_item_table + " SET secID = NULL WHERE mbomID = ? AND secID = ?";
                await conn.query(clearItem, [mbomID, secID]);
            }

            // renumber sections following the deleted one in a single statement. Use the locked row's sectionNum.
            const renumberQuery = "UPDATE " + database + "." + dbConfig.MBOM_new_section_sum + " SET sectionNum = sectionNum - 1 WHERE mbomID = ? AND sectionNum > ?";
            await conn.query(renumberQuery, [mbomID, deletedSectionNum]);

            // update summary numSections
            const updateSummaryQuery = "UPDATE " + database + "." + dbConfig.MBOM_summary_table + " SET numSections = numSections - 1 WHERE mbomID = ?";
            await conn.query(updateSummaryQuery, [mbomID]);

            await conn.commit();
            conn.release();

            // redirect to searchMBOM
            res.locals.title = 'Delete Section';
            return res.redirect('../searchMBOM/?bomID=' + jobNum + releaseNum + "_" + mbomID);
        } catch (e) {
            try { await conn.rollback(); } catch (er) { /* ignore */ }
            try { conn.release(); } catch (er) { /* ignore */ }
            throw e;
        }
    } catch (err) {
        console.log('Error in mbomDeleteSection: \n', err, '\n');
        return res.status(500).send('Error deleting section');
    }
};









//sectionConfigure function
exports.sectionConfigure = function(req, res) {
    req.setTimeout(0); //no timeout (this is needed to prevent error due to page taking a long time to load)
    // Initialize variables (handle single value, array, or missing fields)
    let data = [];
    const sectionNumField = req.body && req.body.sectionNum;
    const idField = req.body && req.body.ID;
    const mbomIDField = req.body && req.body.mbomID;

    // Debug incoming request body
    try { if (DEBUG_SERVER) console.log('DEBUG sectionConfigure REQ.BODY:', req.body); } catch (e) {}

    if (Array.isArray(sectionNumField)) {
        // sectionNum is an array
        if (sectionNumField.length === 0) {
            data[0] = { sectionNum: 0, mbomID: mbomIDField };
        } else if (sectionNumField.length === 1) {
            data[0] = {
                sectionNum: sectionNumField[0],
                ID: Array.isArray(idField) ? idField[0] : idField,
                mbomID: Array.isArray(mbomIDField) ? mbomIDField[0] : mbomIDField
            };
        } else {
            const total = sectionNumField.length;
            for (let i = 0; i < total; i++) {
                data[i] = {
                    sectionNum: sectionNumField[i],
                    ID: Array.isArray(idField) ? idField[i] : idField,
                    mbomID: Array.isArray(mbomIDField) ? mbomIDField[i] : mbomIDField
                };
            }
        }
    } else {
        // sectionNum is a single value or undefined
        if (sectionNumField == null || sectionNumField == 0 || sectionNumField === '0') {
            // Preserve ID when present so queue moves (section 0) can be processed
            data[0] = { sectionNum: 0, ID: idField, mbomID: mbomIDField };
        } else {
            data[0] = { sectionNum: sectionNumField, ID: idField, mbomID: mbomIDField };
        }
    }
    let jobNum, releaseNum;

    //Initial db query - lookup mbomSum row referenced by mbomID
    // Ensure mbomID is passed as an array to the DB helper so '?' placeholders are bound
    if (!data[0].mbomID) {
        if (DEBUG_SERVER) console.log('DEBUG sectionConfigure: missing mbomID in data[0]', data[0]);
    }
    querySql("SELECT jobNum, releaseNum FROM " + database + "." + dbConfig.MBOM_summary_table + " WHERE mbomID = ?", [data[0].mbomID])
        .then(rows => {
            //write jobNum and releaseNum from result
            jobNum = rows[0].jobNum;
            releaseNum = rows[0].releaseNum;

            return null;
        })
        .then(() => {
            // Process each entry in data. If sectionNum == 0, clear secID (set NULL). Otherwise lookup section and set secID accordingly.
            for (let j = 0; j < data.length; j++) {
                let secData = data[j];

                // If this entry was placed back into the queue (section 0), clear secID
                if (secData.sectionNum == 0 || secData.sectionNum === '0') {
                    if (secData.ID && (secData.ID).includes('I')) {
                        let tempID = (secData.ID).substring(1);
                        const clearItemSql = "UPDATE " + database + "." + dbConfig.MBOM_item_table + " SET secID = NULL WHERE itemSumID = ?";
                        if (DEBUG_SERVER) console.log('DEBUG sectionConfigure CLEAR ITEM SECID:', clearItemSql, [tempID]);
                        querySql(clearItemSql, [tempID]);
                    } else if (secData.ID) {
                        let tempID = (secData.ID).substring(1);
                        const clearBrkSql = "UPDATE " + database + "." + dbConfig.MBOM_breaker_table + " SET secID = NULL WHERE idDev = ?";
                        if (DEBUG_SERVER) console.log('DEBUG sectionConfigure CLEAR BRK SECID:', clearBrkSql, [tempID]);
                        querySql(clearBrkSql, [tempID]);
                    }
                    continue;
                }

                // For non-zero sections, lookup the new section mapping and set secID; if mapping not found, clear secID.
                querySql("SELECT * FROM " + database + "." + dbConfig.MBOM_new_section_sum + " WHERE sectionNum = ? AND mbomID = ?", [secData.sectionNum, secData.mbomID])
                    .then(rows => {
                        if (rows.length != 0) {
                            let targetSecID = rows[0].secID;
                            if (secData.ID && (secData.ID).includes('I')) {
                                let tempID = (secData.ID).substring(1);
                                const updateItemSql = "UPDATE " + database + "." + dbConfig.MBOM_item_table + " SET secID = ? WHERE itemSumID = ?";
                                const updateItemParams = [targetSecID, tempID];
                                if (DEBUG_SERVER) console.log('DEBUG sectionConfigure UPDATE ITEM:', updateItemSql, updateItemParams);
                                querySql(updateItemSql, updateItemParams);
                            } else if (secData.ID) {
                                let tempID = (secData.ID).substring(1);
                                const updateBrkSql = "UPDATE " + database + "." + dbConfig.MBOM_breaker_table + " SET secID = ? WHERE idDev = ?";
                                const updateBrkParams = [targetSecID, tempID];
                                if (DEBUG_SERVER) console.log('DEBUG sectionConfigure UPDATE BRK:', updateBrkSql, updateBrkParams);
                                querySql(updateBrkSql, updateBrkParams);
                            }
                        } else {
                            // No matching section mapping found - treat as cleared (NULL)
                            if (secData.ID && (secData.ID).includes('I')) {
                                let tempID = (secData.ID).substring(1);
                                const clearItemSql = "UPDATE " + database + "." + dbConfig.MBOM_item_table + " SET secID = NULL WHERE itemSumID = ?";
                                if (DEBUG_SERVER) console.log('DEBUG sectionConfigure CLEAR ITEM (no map) SECID:', clearItemSql, [tempID]);
                                querySql(clearItemSql, [tempID]);
                            } else if (secData.ID) {
                                let tempID = (secData.ID).substring(1);
                                const clearBrkSql = "UPDATE " + database + "." + dbConfig.MBOM_breaker_table + " SET secID = NULL WHERE idDev = ?";
                                if (DEBUG_SERVER) console.log('DEBUG sectionConfigure CLEAR BRK (no map) SECID:', clearBrkSql, [tempID]);
                                querySql(clearBrkSql, [tempID]);
                            }
                        }
                        return null
                    })
                    .catch(err => {
                        console.log('Error in sectionConfigure: \n', err, '\n');
                    });
            }
            return null
        })
        .then(() => {
            //redirect to searchMBOM
            res.locals.title = 'Section Configure';
            res.redirect('searchMBOM/?bomID=' + jobNum + releaseNum + "_" + data[0].mbomID)
        })
        .catch(err => {
            //if error occurs at anytime at any point in the code above, log it to the console
            console.log('Error in sectionConfigure: \n', err, '\n');
        });
};









//generateMBOM function
exports.generateMBOM = function (req, res) {
    req.setTimeout(0); //no timeout (this is needed to prevent error due to page taking a long time to load)
    //Initialize variables
    let mbomData = {
        mbomID: req.body.mbomID,
        jobNum: req.body.jobNum,
        releaseNum: req.body.releaseNum
    };
    let partNumCount = 1;
    let mbomSumData = [];
    let mbomSecSumData = [];
    let mbomItemData = [];
    let mbomUserItem = [];
    let mbomComItem = [];
    let mbomBrkSum = [];
    let mbomBrkAccSum = [];

    //create new Excel workook
    let workbook = new Excel.Workbook();
    //add a sheet to the workbook
    let sheet = workbook.addWorksheet(mbomData.jobNum + mbomData.releaseNum + ' Jobscope BOM');

    //getCounter function definition (used to increment script counter)
    async function getCounter() {
        let currentCount =  await querySql("SELECT mbomCount FROM " + database + "." + dbConfig.script_counter_table+" WHERE idCounter = ?",1);
        return currentCount[0].mbomCount;
    }

    //protectSheet function definition
    async function protectSheet(){
        await sheet.protect('password', {selectLockedCells: true, formatColumns: true, formatRows: true});
        return null;
    }
    //execute protectSheet function
    protectSheet()
        .then(async function() {
            //increment scriptCounter table
            let counter = await getCounter();
            await querySql("UPDATE " + database + "." + dbConfig.script_counter_table + " SET mbomCount = ? WHERE idCounter = ?",[counter+1, 1]);
            return null
        })
        //???????????????????
        .then();

    //set the sheet column format according to Jobscope Map Master requirements
    sheet.columns = [
        {header: 'Assembly Number:', key: 'assemblyNum', width: 20, style: {font: {name: 'Calibri', size: 11}}},
        {
            header: 'Item & BOM Sequence Number:',
            key: 'seqNum',
            width: 30,
            style: {font: {name: 'Calibri', size: 11}}
        },
        {
            header: 'Component Part Number:',
            key: 'compPartNum',
            width: 30,
            style: {font: {name: 'Calibri', size: 11}}
        },
        {header: 'Manufacturer Part Number', key: 'mfgPartNum', width: 50,  style: {font: {name: 'Calibri', size: 11}}},
        {header: 'Description 1:', key: 'desc1', width: 50, style: {font: {name: 'Calibri', size: 11}}},
        {header: 'Description 2:', key: 'desc2', width: 50, style: {font: {name: 'Calibri', size: 11}}},
        {header: 'Description 3:', key: 'desc3', width: 50, style: {font: {name: 'Calibri', size: 11}}},
        {header: 'Description 4:', key: 'desc4', width: 50, style: {font: {name: 'Calibri', size: 11}}},
        {header: 'Quantity Per:', key: 'qty', width: 20, style: {font: {name: 'Calibri', size: 11}}},
        {header: 'Unit Of Issue:', key: 'unitOfIssue', width: 20, style: {font: {name: 'Calibri', size: 11}}},
        {
            header: 'Unit Of Purchase:',
            key: 'unitOfPurchase',
            width: 20,
            style: {font: {name: 'Calibri', size: 11}}
        },
        {header: 'Category Code:', key: 'categoryCode', width: 20, style: {font: {name: 'Calibri', size: 11}}},
        {header: 'Make Part:', key: 'makePart', width: 20, style: {font: {name: 'Calibri', size: 11}}},
        {header: 'Buy Part', key: 'buyPart', width: 20, style: {font: {name: 'Calibri', size: 11}}},
        {header: 'Stock Part', key: 'stockPart', width: 20, style: {font: {name: 'Calibri', size: 11}}},
        {header: 'Manufacturer:', key: 'manufacturer', width: 20, style: {font: {name: 'Calibri', size: 11}}},
        {header: 'Device Designation:', key: 'deviceDes', width: 50, style: {font: {name: 'Calibri', size: 11}}},
        {header: 'Class:', key: 'deviceClass', width: 50, style: {font: {name: 'Calibri', size: 11}}}
    ]
    //bold the first row of text
    sheet.getRow('1').font = {name: 'Calibri', size: 11, bold: true};

    //Initial db query - lookup mbomSum row refenced by mbomID
    querySql("SELECT * FROM " + database + " . " + dbConfig.MBOM_summary_table + " WHERE mbomID = ?", mbomData.mbomID)
        .then(rows => {
            //for each mbom (usually 1)
            for (let row of rows) {
                //push to mbomSumData
                mbomSumData.push(row);
            }

            return null;
        })
        .then(
            async function() {
                //lookup mbomNewSectionSum rows referenced by mbomID
                const secSum = await querySql("SELECT * FROM " + database + "." + dbConfig.MBOM_new_section_sum +
                    " WHERE mbomID = ?", mbomData.mbomID);
                //lookup mbomItemSum rows referenced by mbomID
                const itemSum = await querySql("SELECT * FROM " + database + "." + dbConfig.MBOM_item_table + " WHERE " +
                    "mbomID = ?", mbomData.mbomID);
                //lookup mbomUserItem rows referenced by mbomID
                const userItems = await querySql("SELECT * FROM " + database + "." + dbConfig.MBOM_user_items + " WHERE " +
                    "mbomID = ?", mbomData.mbomID);
                //lookup mbomComItem rows referenced by mbomID
                const comItems = await querySql("SELECT * FROM " + database + "." + dbConfig.MBOM_common_items);
                //lookup mbomBrkSum rows referenced by mbomID
                const brks = await querySql("SELECT * FROM " + database + "." + dbConfig.MBOM_breaker_table + " WHERE " +
                    "mbomID = ?", mbomData.mbomID);
                //lookup mbomBrkAcc rows referenced by mbomID
                const brkAcc = await querySql("SELECT * FROM " + database + "." + dbConfig.MBOM_brkAcc_table + " WHERE " +
                    "mbomID = ?", mbomData.mbomID);

                //return all data when 'awaited' promise has been resolved
                return {secSum, itemSum, userItems, comItems, brks, brkAcc};
            }
        )
        .then(({secSum, itemSum, userItems, comItems, brks, brkAcc}) => {
            //for each section push to mbomSecSumData
            for(let row of secSum)
                mbomSecSumData.push(row);
            //for each item push to mbomItemData
            for(let row of itemSum)
                mbomItemData.push(row);
            //for each userItem push to mbomUserItem
            for(let row of userItems)
                mbomUserItem.push(row);
            //for each comItem push to mbomComItem
            for(let row of comItems)
                mbomComItem.push(row);
            //for each breaker push to mbomBrkSum
            for(let row of brks)
                mbomBrkSum.push(row);
            //for each accessory push to mbomBrkAccSum
            for(let row of brkAcc)
                mbomBrkAccSum.push(row);
            return null;
        })
        .then(() => {
            //if this mbom has sections
            if (mbomSumData[0].noSectionMBOM == 'N') {

                //sort mbomSecSumData in ascending order by sectionNum
                mbomSecSumData.sort(function (a, b) {
                    let intA = parseInt(a.sectionNum);
                    let intB = parseInt(b.sectionNum);
                    return intA - intB
                });

                //initialize mbomAssemNumArr
                let mbomAssemNumArr = [];
                //for each section in mbomSecSumData
                for (let i = 0; i < mbomSecSumData.length; i++) {
                    let sectionNumber;
                    //if sectionNum is less than 10, add a leading '10'
                    if (parseInt(mbomSecSumData[i].sectionNum) < 10) {
                        sectionNumber = '10' + mbomSecSumData[i].sectionNum
                    } else {
                    //else sectionNum gets a leading '1'
                        sectionNumber = '1' + mbomSecSumData[i].sectionNum;
                    }

                    //set assemblyNum from jobNum, releaseNum, and sectionNumber
                    let assemblyNum = mbomData.jobNum + mbomData.releaseNum + '-MBOM-' + sectionNumber;
                    //push to mbomAssemNumArr
                    mbomAssemNumArr.push(assemblyNum);
                    //set count at 1
                    let count = 1;

                    //add row to the sheet using data from above
                    sheet.addRow({
                        assemblyNum: assemblyNum,
                        seqNum: null,
                        compPartNum: assemblyNum,
                        mfgPartNum: null,
                        desc1: assemblyNum + ' Bill of Material',
                        desc2: null,
                        desc3: null,
                        desc4: null,
                        qty: 1,
                        unitOfIssue: 'EA',
                        unitOfPurchase: 'EA',
                        categoryCode: '82-BOM',
                        makePart: 1,
                        buyPart: 0,
                        stockPart: 0,
                        manufacturer: 'SAI',
                        deviceDes: null,
                        deviceClass: null
                    });

                    //**********for item calculations********//
                    //initialize itemArr
                    let itemArr = [];
                    //for each item in mbomItemData
                    for (let row of mbomItemData) {
                        //if secID's match and userItemID is not null
                        if (row.secID == mbomSecSumData[i].secID) {
                            if (row.userItemID != null) {
                                //for each user item in mbomUserItem
                                for (let item of mbomUserItem) {
                                    //if userItemID's match push to itemArr
                                    if (item.userItemID == row.userItemID) {
                                        itemArr.push({
                                            itemID: item.userItemID,
                                            sumID: row.itemSumID,
                                            itemPN: item.itemPN,
                                            qty: row.itemQty,
                                            shipLoose: row.shipLoose,
                                            itemMfg: item.itemMfg,
                                            itemDesc: item.itemDesc,
                                            unitOfIssue: item.unitOfIssue,
                                            catCode: item.catCode,
                                            class: item.class
                                        });
                                    }
                                }
                            } else {
                                //if userItemID is null (i.e. item is a common item)
                                //for each common item in mbomComItem
                                for (let item of mbomComItem) {
                                    //if comItemID's match push to itemArr
                                    if (item.comItemID == row.comItemID) {
                                        itemArr.push({
                                            itemID: item.comItemID,
                                            sumID: row.itemSumID,
                                            itemPN: item.itemPN,
                                            qty: row.itemQty,
                                            shipLoose: row.shipLoose,
                                            itemMfg: item.itemMfg,
                                            itemDesc: item.itemDesc,
                                            unitOfIssue: item.unitOfIssue,
                                            catCode: item.catCode,
                                            class: item.class
                                        });
                                    }
                                }
                            }
                        }
                    }
                    //initialize totalItemQty and itemObj
                    let totalItemQty = [];
                    let itemObj = null;
                    //for each item in itemArr
                    for (let f = 0; f < itemArr.length; f++) {
                        //set itemObj to element f in itemArr
                        itemObj = itemArr[f];
                        //if no totalItemQty (i.e. this is the first), then set it to itemObj
                        if (!totalItemQty[itemObj.itemID]) {
                            totalItemQty[itemObj.itemID] = itemObj;
                        } else {
                        // totalItemQty exists, and all we need to do is increment qty and write the description
                            totalItemQty[itemObj.itemID].qty += itemObj.qty;
                            totalItemQty[itemObj.itemID].itemDesc = itemObj.itemDesc;
                        }
                    }

                    //initialize totalItemQtyResults
                    let totalItemQtyResults = [];
                    //for each property in totalItemQty JSON object
                    for (let prop in totalItemQty)
                        //push the value into totalItemQtyResults
                        totalItemQtyResults.push(totalItemQty[prop]);

                    //for each row of totalItemQtyResults
                    for (let row of totalItemQtyResults) {
                        //if no ship loose
                        if (row.shipLoose == 'N') {
                            //initialize/set variables
                            let seqNum;
                            if (count < 10)
                                seqNum = '00' + count;
                            else if (count < 100)
                                seqNum = '0' + count;
                            else
                                seqNum = count;

                            let itemPN = row.itemPN;
                            let qty = row.qty;
                            let itemDesc = row.itemDesc;
                            let itemDesc1 = itemDesc.substring(0, 40);
                            let itemDesc2 = itemDesc.substring(40, 80);
                            let itemDesc3 = itemDesc.substring(80, 120);
                            let itemDesc4 = itemDesc.substring(120, 160);
                            let unitOfIssue = row.unitOfIssue;
                            let catCode = row.catCode;
                            let classCode = row.class;
                            let itemMfg = row.itemMfg;
                            let mfgPartNum = null;
                            if (itemPN.length > 20) {
                                mfgPartNum = itemPN;
                                itemPN = mbomData.jobNum + mbomData.releaseNum + '-' + partNumCount + '-ITEM';
                                partNumCount++;
                            }
                            //once all variables are set, add a row to the sheet
                            sheet.addRow({
                                assemblyNum: assemblyNum,
                                seqNum: seqNum.toString(),
                                compPartNum: itemPN,
                                mfgPartNum: mfgPartNum,
                                desc1: itemDesc1,
                                desc2: itemDesc2,
                                desc3: itemDesc3,
                                desc4: itemDesc4,
                                qty: qty,
                                unitOfIssue: unitOfIssue,
                                unitOfPurchase: unitOfIssue,
                                categoryCode: catCode,
                                makePart: 0,
                                buyPart: 1,
                                stockPart: 0,
                                manufacturer: itemMfg,
                                deviceDes: null,
                                deviceClass: classCode
                            });
                            count++;
                        }
                    }

                    //**********for breaker calculations*********//
                    //initialize brkArr and brkAccArr
                    let brkArr = [];
                    let brkAccArr = [];

                    //for each breaker in mbomBrkSum
                    for (let row of mbomBrkSum) {
                        //if the secID's match
                        if (row.secID == mbomSecSumData[i].secID) {
                            //for each accessory in mbomBrkAccSum
                            for (let el of mbomBrkAccSum) {
                                //if the idDev's match push to brkAccArr
                                if (el.idDev == row.idDev) {
                                    brkAccArr.push(el);
                                }
                            }
                            //push to brkArr
                            brkArr.push({
                                idDev: [row.idDev],
                                brkPN: row.brkPN,
                                cradlePN: row.cradlePN,
                                devDesignation: row.devDesignation,
                                qty: 1,
                                unitOfIssue: row.unitOfIssue,
                                catCode: row.catCode,
                                class: row.class,
                                devMfg: row.devMfg
                            })
                        }
                    }

                    //initialize totalBrkQty and brkObj
                    let totalBrkQty = [];
                    let brkObj = null;

                    //for each breaker in brkArr
                    for (let f = 0; f < brkArr.length; f++) {
                        //set brkObj to f'th element in brkArr
                        brkObj = brkArr[f];
                        //if element does not exist in totalBrkQty array, then push to it
                        if (totalBrkQty.filter(e => e.brkPN == brkObj.brkPN).length == 0) {
                            totalBrkQty.push(brkObj);
                        } else {
                        //if element already exists then increment the qty and add to devDesignation and idDev
                            totalBrkQty.filter(e => e.brkPN == brkObj.brkPN)[0].qty += brkObj.qty;
                            totalBrkQty.filter(e => e.brkPN == brkObj.brkPN)[0].devDesignation += ", " + brkObj.devDesignation;
                            totalBrkQty.filter(e => e.brkPN == brkObj.brkPN)[0].idDev.push(brkObj.idDev[0])
                        }
                    }


                    //for each breaker in totalBrkQty
                    for (let row of totalBrkQty) {
                        //initialize/set variables
                        let seqNum;
                        if (count < 10)
                            seqNum = '00' + count;
                        else if (count < 100)
                            seqNum = '0' + count;
                        else
                            seqNum = count;
                        let brkPN = row.brkPN;
                        let crdPN = row.cradlePN;
                        let devDes = row.devDesignation;
                        let qty = row.qty;
                        let unitOfIssue = row.unitOfIssue;
                        let catCode = row.catCode;
                        let classCode = row.class;
                        let devMfg = row.devMfg;
                        let idDev = row.idDev;

                        let brkMfgPartNum = null;
                        //jobscope part number length restriction
                        if (brkPN.length > 20) {
                            brkMfgPartNum = brkPN;
                            brkPN = mbomData.jobNum + mbomData.releaseNum + "-" + partNumCount + "-BRK";
                            partNumCount++;
                        }
                        let crdMfgPartNum = null;
                        //jobscope part number length restriction
                        if (crdPN.length > 20) {
                            crdMfgPartNum = crdPN;
                            crdPN = mbomData.jobNum + mbomData.releaseNum + "-" + partNumCount + "-CRA";
                            partNumCount++;
                        }

                        //if breaker and cradle part numbers exist, add rows for both
                        if (brkPN != '' && crdPN != '') {
                            sheet.addRow({
                                assemblyNum: assemblyNum,
                                seqNum: seqNum.toString(),
                                compPartNum: brkPN,
                                mfgPartNum: brkMfgPartNum,
                                desc1: 'BREAKER',
                                desc2: null,
                                desc3: null,
                                desc4: null,
                                qty: qty,
                                unitOfIssue: unitOfIssue,
                                unitOfPurchase: unitOfIssue,
                                categoryCode: catCode,
                                makePart: 0,
                                buyPart: 1,
                                stockPart: 0,
                                manufacturer: devMfg,
                                deviceDes: devDes,
                                deviceClass: classCode
                            });
                            count++;
                            if (count < 10)
                                seqNum = '00' + count;
                            else if (count < 100)
                                seqNum = '0' + count;
                            else
                                seqNum = count;
                            sheet.addRow({
                                assemblyNum: assemblyNum,
                                seqNum: seqNum.toString(),
                                compPartNum: crdPN,
                                mfgPartNum: crdMfgPartNum,
                                desc1: 'CRADLE',
                                desc2: null,
                                desc3: null,
                                desc4: null,
                                qty: qty,
                                unitOfIssue: unitOfIssue,
                                unitOfPurchase: unitOfIssue,
                                categoryCode: catCode,
                                makePart: 0,
                                buyPart: 1,
                                stockPart: 0,
                                manufacturer: devMfg,
                                deviceDes: devDes,
                                deviceClass: classCode
                            });
                        } else if (brkPN != '' && crdPN == '') {
                        //if only a breaker pn exists, we assume it is a breaker
                            sheet.addRow({
                                assemblyNum: assemblyNum,
                                seqNum: seqNum.toString(),
                                compPartNum: brkPN,
                                mfgPartNum: brkMfgPartNum,
                                desc1: 'BREAKER',
                                desc2: null,
                                desc3: null,
                                desc4: null,
                                qty: qty,
                                unitOfIssue: unitOfIssue,
                                unitOfPurchase: unitOfIssue,
                                categoryCode: catCode,
                                makePart: 0,
                                buyPart: 1,
                                stockPart: 0,
                                manufacturer: devMfg,
                                deviceDes: devDes,
                                deviceClass: classCode
                            });
                        } else if (brkPN == '' && crdPN != '') {
                        //if only a cradle pn exists, we assume it is a cradle
                            sheet.addRow({
                                assemblyNum: assemblyNum,
                                seqNum: seqNum.toString(),
                                compPartNum: crdPN,
                                mfgPartNum: crdMfgPartNum,
                                desc1: 'CRADLE',
                                desc2: null,
                                desc3: null,
                                desc4: null,
                                qty: qty,
                                unitOfIssue: unitOfIssue,
                                unitOfPurchase: unitOfIssue,
                                categoryCode: catCode,
                                makePart: 0,
                                buyPart: 1,
                                stockPart: 0,
                                manufacturer: devMfg,
                                deviceDes: devDes,
                                deviceClass: classCode
                            });
                        }

                        //**********for breaker accessories*********//
                        //initialize totalBrkAccQty
                        let totalBrkAccQty = [];
                        //for each id in idDev array
                        for (let dev of idDev) {
                            //filter brkAccArr by idDev
                            if (brkAccArr.filter(e => e.idDev == dev).length != 0) {
                                //for each element in filtered brkAccArr
                                for (let g = 0; g < brkAccArr.filter(e => e.idDev == dev).length; g++) {
                                    //filter further by the brkAccPN, if one does not exist then push, otherwise increment qty and update data
                                    if (totalBrkAccQty.filter(e => e.brkAccPN == brkAccArr.filter(e => e.idDev == dev)[g].brkAccPN).length == 0) {
                                        totalBrkAccQty.push({
                                            brkAccID: [brkAccArr.filter(e => e.idDev == dev)[g].brkAccID],
                                            mbomID: brkAccArr.filter(e => e.idDev == dev)[g].mbomID,
                                            idDev: [brkAccArr.filter(e => e.idDev == dev)[g].idDev],
                                            brkAccQty: brkAccArr.filter(e => e.idDev == dev)[g].brkAccQty,
                                            brkAccType: brkAccArr.filter(e => e.idDev == dev)[g].brkAccType,
                                            brkAccMfg: brkAccArr.filter(e => e.idDev == dev)[g].brkAccMfg,
                                            brkAccDesc: brkAccArr.filter(e => e.idDev == dev)[g].brkAccDesc,
                                            brkAccPN: brkAccArr.filter(e => e.idDev == dev)[g].brkAccPN,
                                        });
                                    } else {
                                        totalBrkAccQty.filter(e => e.brkAccPN == brkAccArr.filter(e => e.idDev == dev)[g].brkAccPN)[0].brkAccQty += brkAccArr.filter(e => e.idDev == dev)[g].brkAccQty;
                                        totalBrkAccQty.filter(e => e.brkAccPN == brkAccArr.filter(e => e.idDev == dev)[g].brkAccPN)[0].brkAccID.push(brkAccArr.filter(e => e.idDev == dev)[g].brkAccID);
                                        totalBrkAccQty.filter(e => e.brkAccPN == brkAccArr.filter(e => e.idDev == dev)[g].brkAccPN)[0].idDev.push(brkAccArr.filter(e => e.idDev == dev)[g].idDev);
                                    }
                                }
                            }
                        }
                        //for each element in totalBrkAccQty
                        for (let el of totalBrkAccQty) {
                            count++;
                            let brkAccDesc = el.brkAccDesc;
                            let brkAccDesc1 = brkAccDesc.substring(0, 40);
                            let brkAccDesc2 = brkAccDesc.substring(40, 80);
                            let brkAccDesc3 = brkAccDesc.substring(80, 120);
                            let brkAccDesc4 = brkAccDesc.substring(120, 160);
                            let brkAccPN = el.brkAccPN;
                            let brkAccMfgPartNum = null;
                            //jobscope part number restriction
                            if (brkAccPN.length > 20) {
                                brkAccMfgPartNum = brkAccPN;
                                brkAccPN = mbomData.jobNum + mbomData.releaseNum + '-' + partNumCount + '-BRKACC';
                                partNumCount++;
                            }
                            if (count < 10)
                                seqNum = '00' + count;
                            else if (count < 100)
                                seqNum = '0' + count;
                            else
                                seqNum = count;

                            //add row to the sheet
                            sheet.addRow({
                                assemblyNum: assemblyNum,
                                seqNum: seqNum.toString(),
                                compPartNum: brkAccPN,
                                mfgPartNum: brkAccMfgPartNum,
                                desc1: brkAccDesc1,
                                desc2: brkAccDesc2,
                                desc3: brkAccDesc3,
                                desc4: brkAccDesc4,
                                qty: el.brkAccQty,
                                unitOfIssue: unitOfIssue,
                                unitOfPurchase: unitOfIssue,
                                categoryCode: catCode,
                                makePart: 0,
                                buyPart: 1,
                                stockPart: 0,
                                manufacturer: el.brkAccMfg,
                                deviceDes: devDes,
                                deviceClass: classCode
                            });
                        }
                        count++;
                    }
                }

                //**********for ship loose/spare parts items*********//
                //add first row in SP bom - this shows up for every mbom regardless
                sheet.addRow({
                    assemblyNum: mbomData.jobNum + mbomData.releaseNum + '-MBOM-SP',
                    seqNum: null,
                    compPartNum: mbomData.jobNum + mbomData.releaseNum + '-MBOM-SP',
                    mfgPartNum: null,
                    desc1: mbomData.jobNum + mbomData.releaseNum + '-MBOM-SP Bill of Material',
                    desc2: null,
                    desc3: null,
                    desc4: null,
                    qty: 1,
                    unitOfIssue: 'EA',
                    unitOfPurchase: 'EA',
                    categoryCode: '82-BOM',
                    makePart: 1,
                    buyPart: 0,
                    stockPart: 0,
                    manufacturer: 'SAI',
                    deviceDes: null,
                    deviceClass: null
                });
                //initialize count and shipLooseItems array
                let count = 1;
                let shipLooseItems = [];

                //for each item in mbomItemData
                for (let row of mbomItemData) {
                    //if ship loose
                    if (row.shipLoose == 'Y') {
                        //if userItemID exists
                        if (row.userItemID != null) {
                            //for each item in mbomUserItem if userItemID matches,then push to shipLooseItems
                            for (let item of mbomUserItem) {
                                if (item.userItemID == row.userItemID) {
                                    shipLooseItems.push({
                                        itemID: item.userItemID,
                                        sumID: row.itemSumID,
                                        itemPN: item.itemPN,
                                        qty: row.itemQty,
                                        itemMfg: item.itemMfg,
                                        itemDesc: item.itemDesc,
                                        unitOfIssue: item.unitOfIssue,
                                        catCode: item.catCode,
                                        class: item.class
                                    });
                                }
                            }
                        } else {
                        //item is a com item
                            //for each item in mbomComItem if comItemID matches, then push to shipLooseItems
                            for (let item of mbomComItem) {
                                if (item.comItemID == row.comItemID) {
                                    shipLooseItems.push({
                                        itemID: item.comItemID,
                                        sumID: row.itemSumID,
                                        itemPN: item.itemPN,
                                        qty: row.itemQty,
                                        itemMfg: item.itemMfg,
                                        itemDesc: item.itemDesc,
                                        unitOfIssue: item.unitOfIssue,
                                        catCode: item.catCode,
                                        class: item.class
                                    });
                                }
                            }
                        }
                    }
                }

                //initialize totalSLQty and SLobj
                let totalSLQty = [];
                let SLobj = null;
                //for each item in shipLooseItems
                for (let f = 0; f < shipLooseItems.length; f++) {
                    //write object to SLobj
                    SLobj = shipLooseItems[f];
                    //if totalSLQty does not have an element for the itemID yet, then create it
                    if (!totalSLQty[SLobj.itemID]) {
                        totalSLQty[SLobj.itemID] = SLobj;
                    } else {
                    //if totalSLQty itemID element already exists, then increment the qty
                        totalSLQty[SLobj.itemID].qty += SLobj.qty;
                        totalSLQty[SLobj.itemID].itemDesc = SLobj.itemDesc;
                    }
                }

                //initialize totalSLQtyResults
                let totalSLQtyResults = [];
                //for each prop in totalSLQty array (this is not typically advised -- read more about "for-in" loops with arrays instead of objects)
                for (let prop in totalSLQty)
                    //push to results array
                    totalSLQtyResults.push(totalSLQty[prop]);

                //for each item in totalSLQtyResults array
                for (let row of totalSLQtyResults) {
                    //initialize/set variables
                    let seqNum;
                    if (count < 10)
                        seqNum = '00' + count;
                    else if (count < 100)
                        seqNum = '0' + count;
                    else
                        seqNum = count;

                    let itemPN = (row.itemPN).toString();
                    let qty = row.qty;
                    let itemDesc = row.itemDesc;
                    let itemDesc1 = itemDesc.substring(0, 40);
                    let itemDesc2 = itemDesc.substring(40, 80);
                    let itemDesc3 = itemDesc.substring(80, 120);
                    let itemDesc4 = itemDesc.substring(120, 160);
                    let unitOfIssue = row.unitOfIssue;
                    let catCode = row.catCode;
                    let classCode = row.class;
                    let itemMfg = row.itemMfg;
                    let mfgPartNum = itemPN;
                    if (itemPN.length > 20) {
                        itemPN = itemPN.slice(0, 20);
                        partNumCount++;
                    }

                    //add row to the sheet
                    sheet.addRow({
                        assemblyNum: mbomData.jobNum + mbomData.releaseNum + '-MBOM-SP',
                        seqNum: seqNum.toString(),
                        compPartNum: itemPN,
                        mfgPartNum: mfgPartNum,
                        desc1: itemDesc1,
                        desc2: itemDesc2,
                        desc3: itemDesc3,
                        desc4: itemDesc4,
                        qty: qty,
                        unitOfIssue: unitOfIssue,
                        unitOfPurchase: unitOfIssue,
                        categoryCode: catCode,
                        makePart: 0,
                        buyPart: 1,
                        stockPart: 0,
                        manufacturer: itemMfg,
                        deviceDes: null,
                        deviceClass: classCode
                    });
                    count++;
                }


                //**********mbom summary*********//
                //add first row to the bom msummary portion of the mbom - this always appears regardless
                sheet.addRow({
                    assemblyNum: mbomData.jobNum + mbomData.releaseNum + '-MBOM',
                    seqNum: null,
                    compPartNum: mbomData.jobNum + mbomData.releaseNum + '-MBOM',
                    mfgPartNum: null,
                    desc1: mbomData.jobNum + mbomData.releaseNum + '-MBOM Bill of Material',
                    desc2: null,
                    desc3: null,
                    desc4: null,
                    qty: 1,
                    unitOfIssue: 'EA',
                    unitOfPurchase: 'EA',
                    categoryCode: '82-BOM',
                    makePart: 1,
                    buyPart: 0,
                    stockPart: 0,
                    manufacturer: 'SAI',
                    deviceDes: null,
                    deviceClass: null
                });

                //for each assembly number (i.e. section) in mbomAssemNumArr
                for (let i = 0; i < mbomAssemNumArr.length; i++) {
                    //initialize/set variables
                    let seqNum;
                    if ((i + 1) < 10)
                        seqNum = '00' + (i + 1);
                    else if ((i + 1) < 100)
                        seqNum = '0' + (i + 1);
                    else
                        seqNum = (i + 1);

                    //add a row to the sheet
                    sheet.addRow({
                        assemblyNum: mbomData.jobNum + mbomData.releaseNum + '-MBOM',
                        seqNum: seqNum.toString(),
                        compPartNum: mbomAssemNumArr[i],
                        mfgPartNum: null,
                        desc1: null,
                        desc2: null,
                        desc3: null,
                        desc4: null,
                        qty: 1,
                        /*qty: result[0].qtyBoard,*/
                        unitOfIssue: null,
                        unitOfPurchase: null,
                        categoryCode: null,
                        makePart: null,
                        buyPart: null,
                        stockPart: null,
                        manufacturer: null,
                        deviceDes: null,
                        deviceClass: null
                    });
                    //if this is the last section in the mbom, then afterwards add the additional ship loose bom SP
                    if (i + 1 == mbomAssemNumArr.length) {
                        seqNum = parseInt(seqNum) + 1;
                        if (seqNum < 10)
                            seqNum = '00' + seqNum;
                        else if (seqNum < 100)
                            seqNum = '0' + seqNum;
                        else
                            seqNum = seqNum.toString();
                        sheet.addRow({
                            assemblyNum: mbomData.jobNum + mbomData.releaseNum + '-MBOM',
                            seqNum: seqNum,
                            compPartNum: mbomData.jobNum + mbomData.releaseNum + '-MBOM-SP',
                            mfgPartNum: null,
                            desc1: null,
                            desc2: null,
                            desc3: null,
                            desc4: null,
                            qty: 1,
                            /*qty: result[0].qtyBoard,*/
                            unitOfIssue: null,
                            unitOfPurchase: null,
                            categoryCode: null,
                            makePart: null,
                            buyPart: null,
                            stockPart: null,
                            manufacturer: null,
                            deviceDes: null,
                            deviceClass: null
                        });
                    }
                }

                //further column formatting
                sheet.getColumn(4).eachCell(function (cell) {
                    cell.alignment = {wrapText: true};
                });


                //write workbook to a file in the user's Downloads folder and then send it to the client's downloads
                //build the Downloads path using the OS home directory
                const remoteFilename = mbomData.jobNum + mbomData.releaseNum + ' MBOM.xlsx';
                workbook.xlsx.writeBuffer()
                    .then(function (buffer) {
                        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
                        res.setHeader('Content-Disposition', 'attachment; filename="' + remoteFilename + '"');
                        res.send(Buffer.from(buffer));
                    })
                    .catch(function (err) {
                        console.log('Error generating workbook buffer (sections):', err);
                        if (!res.headersSent) res.status(500).send('Error generating MBOM');
                    });

                return null;
            } else {
            //if this is a "no-section" MBOM (needed for cases where we ship parts or items without any sections)
                //initialize/set variables
                let assemblyNum = mbomData.jobNum + mbomData.releaseNum + '-MBOM';
                let count = 1;

                //add first row to the sheet - this is required on every mbom
                sheet.addRow({
                    assemblyNum: assemblyNum,
                    seqNum: null,
                    compPartNum: assemblyNum,
                    mfgPartNum: null,
                    desc1: assemblyNum + ' Bill of Material',
                    desc2: null,
                    desc3: null,
                    desc4: null,
                    qty: 1,
                    unitOfIssue: 'EA',
                    unitOfPurchase: 'EA',
                    categoryCode: '82-BOM',
                    makePart: 1,
                    buyPart: 0,
                    stockPart: 0,
                    manufacturer: 'SAI',
                    deviceDes: null,
                    deviceClass: null
                });

                //**********for item calculations********//
                //initialize itemArr
                let itemArr = [];

                //for each item in mbomItemData
                for (let row of mbomItemData) {
                    //if userItemID is not null
                    if (row.userItemID != null) {
                        //for each user item in mbomUserItem
                        for (let item of mbomUserItem) {
                            //if userItemID's match push to itemArr
                            if (item.userItemID == row.userItemID) {
                                itemArr.push({
                                    itemID: item.userItemID,
                                    sumID: row.itemSumID,
                                    itemPN: item.itemPN,
                                    qty: row.itemQty,
                                    shipLoose: row.shipLoose,
                                    itemMfg: item.itemMfg,
                                    itemDesc: item.itemDesc,
                                    unitOfIssue: item.unitOfIssue,
                                    catCode: item.catCode,
                                    class: item.class
                                })
                            }
                        }
                    } else {
                        //if userItemID is null (i.e. item is a common item)
                        //for each common item in mbomComItem
                        for (let item of mbomComItem) {
                            //if comItemID's match push to itemArr
                            if (item.comItemID == row.comItemID) {
                                itemArr.push({
                                    itemID: item.comItemID,
                                    sumID: row.itemSumID,
                                    itemPN: item.itemPN,
                                    qty: row.itemQty,
                                    shipLoose: row.shipLoose,
                                    itemMfg: item.itemMfg,
                                    itemDesc: item.itemDesc,
                                    unitOfIssue: item.unitOfIssue,
                                    catCode: item.catCode,
                                    class: item.class
                                })
                            }
                        }
                    }
                }
                //initialize totalItemQty and itemObj
                let totalItemQty = [];
                let itemObj = null;
                //for each item in itemArr
                for (let f = 0; f < itemArr.length; f++) {
                    //set itemObj to element f in itemArr
                    itemObj = itemArr[f];
                    //if no totalItemQty (i.e. this is the first), then set it to itemObj
                    if (!totalItemQty[itemObj.itemID]) {
                        totalItemQty[itemObj.itemID] = itemObj;
                    } else {
                    // totalItemQty exists, and all we need to do is increment qty and write the description
                        totalItemQty[itemObj.itemID].qty += itemObj.qty;
                        totalItemQty[itemObj.itemID].itemDesc = itemObj.itemDesc;
                    }
                }

                //initialize totalItemQtyResults
                let totalItemQtyResults = [];
                //for each property in totalItemQty JSON object
                for (let prop in totalItemQty)
                    //push the value into totalItemQtyResults
                    totalItemQtyResults.push(totalItemQty[prop]);

                //for each row of totalItemQtyResults
                for (let row of totalItemQtyResults) {
                    //initialize/set variables
                    let seqNum;
                    if (count < 10)
                        seqNum = '00' + count;
                    else if (count < 100)
                        seqNum = '0' + count;
                    else
                        seqNum = count;

                    let itemPN = row.itemPN;
                    let qty = row.qty;
                    let itemDesc = row.itemDesc;
                    let itemDesc1 = itemDesc.substring(0, 40);
                    let itemDesc2 = itemDesc.substring(40, 80);
                    let itemDesc3 = itemDesc.substring(80, 120);
                    let itemDesc4 = itemDesc.substring(120, 160);
                    let unitOfIssue = row.unitOfIssue;
                    let catCode = row.catCode;
                    let classCode = row.class;
                    let itemMfg = row.itemMfg;
                    let mfgPartNum = null;
                    if (itemPN.length > 20) {
                        mfgPartNum = itemPN;
                        itemPN = mbomData.jobNum + mbomData.releaseNum + '-' + partNumCount + '-ITEM';
                        partNumCount++;
                    }
                    //once all variables are set, add a row to the sheet
                    sheet.addRow({
                        assemblyNum: assemblyNum,
                        seqNum: seqNum.toString(),
                        compPartNum: itemPN,
                        mfgPartNum: mfgPartNum,
                        desc1: itemDesc1,
                        desc2: itemDesc2,
                        desc3: itemDesc3,
                        desc4: itemDesc4,
                        qty: qty,
                        unitOfIssue: unitOfIssue,
                        unitOfPurchase: unitOfIssue,
                        categoryCode: catCode,
                        makePart: 0,
                        buyPart: 1,
                        stockPart: 0,
                        manufacturer: itemMfg,
                        deviceDes: null,
                        deviceClass: classCode
                    });
                    count++;
                }

                //**********for breaker calculations*********//
                //initialize brkArr and brkAccArr
                let brkArr = [];
                let brkAccArr = [];

                //for each breaker in mbomBrkSum
                for (let row of mbomBrkSum) {
                    //for each accessory in mbomBrkAccSum
                    for (let el of mbomBrkAccSum) {
                        //if the idDev's match push to brkAccArr
                        if (el.idDev == row.idDev) {
                            brkAccArr.push(el);
                        }
                    }
                    //push to brkArr
                    brkArr.push({
                        idDev: [row.idDev],
                        brkPN: row.brkPN,
                        cradlePN: row.cradlePN,
                        devDesignation: row.devDesignation,
                        qty: 1,
                        unitOfIssue: row.unitOfIssue,
                        catCode: row.catCode,
                        class: row.class,
                        devMfg: row.devMfg
                    });
                }

                //initialize totalBrkQty and brkObj
                let totalBrkQty = [];
                let brkObj = null;

                //for each breaker in brkArr
                for (let f = 0; f < brkArr.length; f++) {
                    //set brkObj to f'th element in brkArr
                    brkObj = brkArr[f];
                    //if element does not exist in totalBrkQty array, then push to it
                    if (totalBrkQty.filter(e => e.brkPN == brkObj.brkPN).length == 0) {
                        totalBrkQty.push(brkObj);
                    } else {
                        //if element already exists then increment the qty and add to devDesignation and idDev
                        totalBrkQty.filter(e => e.brkPN == brkObj.brkPN)[0].qty += brkObj.qty;
                        totalBrkQty.filter(e => e.brkPN == brkObj.brkPN)[0].devDesignation += ", " + brkObj.devDesignation;
                        totalBrkQty.filter(e => e.brkPN == brkObj.brkPN)[0].idDev.push(brkObj.idDev[0]);
                    }
                }

                //for each breaker in totalBrkQty
                for (let row of totalBrkQty) {
                    //initialize/set variables
                    let seqNum;
                    if (count < 10)
                        seqNum = '00' + count;
                    else if (count < 100)
                        seqNum = '0' + count;
                    else
                        seqNum = count;

                    let brkPN = row.brkPN;
                    let crdPN = row.cradlePN;
                    let devDes = row.devDesignation;
                    let qty = row.qty;
                    let unitOfIssue = row.unitOfIssue;
                    let catCode = row.catCode;
                    let classCode = row.class;
                    let devMfg = row.devMfg;
                    let idDev = row.idDev;

                    let brkMfgPartNum = null;
                    //jobscope part number length restriction
                    if (brkPN.length > 20) {
                        brkMfgPartNum = brkPN;
                        brkPN = mbomData.jobNum + mbomData.releaseNum + "-" + partNumCount + "-BRK";
                        partNumCount++;
                    }

                    let crdMfgPartNum = null;
                    //jobscope part number length restriction
                    if (crdPN.length > 20) {
                        crdMfgPartNum = crdPN;
                        crdPN = mbomData.jobNum + mbomData.releaseNum + "-" + partNumCount + "-CRA";
                        partNumCount++;
                    }

                    //if breaker and cradle part numbers exist, add rows for both
                    if (brkPN != '' && crdPN != '') {
                        sheet.addRow({
                            assemblyNum: assemblyNum,
                            seqNum: seqNum.toString(),
                            compPartNum: brkPN,
                            mfgPartNum: brkMfgPartNum,
                            desc1: 'BREAKER',
                            desc2: null,
                            desc3: null,
                            desc4: null,
                            qty: qty,
                            unitOfIssue: unitOfIssue,
                            unitOfPurchase: unitOfIssue,
                            categoryCode: catCode,
                            makePart: 0,
                            buyPart: 1,
                            stockPart: 0,
                            manufacturer: devMfg,
                            deviceDes: devDes,
                            deviceClass: classCode
                        });
                        count++;
                        if (count < 10)
                            seqNum = '00' + count;
                        else if (count < 100)
                            seqNum = '0' + count;
                        else
                            seqNum = count;
                        sheet.addRow({
                            assemblyNum: assemblyNum,
                            seqNum: seqNum.toString(),
                            compPartNum: crdPN,
                            mfgPartNum: crdMfgPartNum,
                            desc1: 'CRADLE',
                            desc2: null,
                            desc3: null,
                            desc4: null,
                            qty: qty,
                            unitOfIssue: unitOfIssue,
                            unitOfPurchase: unitOfIssue,
                            categoryCode: catCode,
                            makePart: 0,
                            buyPart: 1,
                            stockPart: 0,
                            manufacturer: devMfg,
                            deviceDes: devDes,
                            deviceClass: classCode
                        });
                    } else if (brkPN != '' && crdPN == '') {
                        //if only a breaker pn exists, we assume it is a breaker
                        sheet.addRow({
                            assemblyNum: assemblyNum,
                            seqNum: seqNum.toString(),
                            compPartNum: brkPN,
                            mfgPartNum: brkMfgPartNum,
                            desc1: 'BREAKER',
                            desc2: null,
                            desc3: null,
                            desc4: null,
                            qty: qty,
                            unitOfIssue: unitOfIssue,
                            unitOfPurchase: unitOfIssue,
                            categoryCode: catCode,
                            makePart: 0,
                            buyPart: 1,
                            stockPart: 0,
                            manufacturer: devMfg,
                            deviceDes: devDes,
                            deviceClass: classCode
                        });
                    } else if (brkPN == '' && crdPN != '') {
                        //if only a cradle pn exists, we assume it is a cradle
                        sheet.addRow({
                            assemblyNum: assemblyNum,
                            seqNum: seqNum.toString(),
                            compPartNum: crdPN,
                            mfgPartNum: crdMfgPartNum,
                            desc1: 'CRADLE',
                            desc2: null,
                            desc3: null,
                            desc4: null,
                            qty: qty,
                            unitOfIssue: unitOfIssue,
                            unitOfPurchase: unitOfIssue,
                            categoryCode: catCode,
                            makePart: 0,
                            buyPart: 1,
                            stockPart: 0,
                            manufacturer: devMfg,
                            deviceDes: devDes,
                            deviceClass: classCode
                        });
                    }

                    //**********for breaker accessories*********//
                    //initialize totalBrkAccQty
                    let totalBrkAccQty = [];
                    //for each id in idDev array
                    for (let dev of idDev) {
                        //filter brkAccArr by idDev
                        if (brkAccArr.filter(e => e.idDev == dev).length != 0) {
                            //for each element in filtered brkAccArr
                            for (let g = 0; g < brkAccArr.filter(e => e.idDev == dev).length; g++) {
                                //filter further by the brkAccPN, if one does not exist then push, otherwise increment qty and update data
                                if (totalBrkAccQty.filter(e => e.brkAccPN == brkAccArr.filter(e => e.idDev == dev)[g].brkAccPN).length == 0) {
                                    totalBrkAccQty.push({
                                        brkAccID: [brkAccArr.filter(e => e.idDev == dev)[g].brkAccID],
                                        mbomID: brkAccArr.filter(e => e.idDev == dev)[g].mbomID,
                                        idDev: [brkAccArr.filter(e => e.idDev == dev)[g].idDev],
                                        brkAccQty: brkAccArr.filter(e => e.idDev == dev)[g].brkAccQty,
                                        brkAccType: brkAccArr.filter(e => e.idDev == dev)[g].brkAccType,
                                        brkAccMfg: brkAccArr.filter(e => e.idDev == dev)[g].brkAccMfg,
                                        brkAccDesc: brkAccArr.filter(e => e.idDev == dev)[g].brkAccDesc,
                                        brkAccPN: brkAccArr.filter(e => e.idDev == dev)[g].brkAccPN,
                                    });
                                } else {
                                    totalBrkAccQty.filter(e => e.brkAccPN == brkAccArr.filter(e => e.idDev == dev)[g].brkAccPN)[0].brkAccQty += brkAccArr.filter(e => e.idDev == dev)[g].brkAccQty;
                                    totalBrkAccQty.filter(e => e.brkAccPN == brkAccArr.filter(e => e.idDev == dev)[g].brkAccPN)[0].brkAccID.push(brkAccArr.filter(e => e.idDev == dev)[g].brkAccID);
                                    totalBrkAccQty.filter(e => e.brkAccPN == brkAccArr.filter(e => e.idDev == dev)[g].brkAccPN)[0].idDev.push(brkAccArr.filter(e => e.idDev == dev)[g].idDev);
                                }
                            }
                        }
                    }
                    //for each element in totalBrkAccQty
                    for (let el of totalBrkAccQty) {
                        count++;
                        let brkAccDesc = el.brkAccDesc;
                        let brkAccDesc1 = brkAccDesc.substring(0, 40);
                        let brkAccDesc2 = brkAccDesc.substring(40, 80);
                        let brkAccDesc3 = brkAccDesc.substring(80, 120);
                        let brkAccDesc4 = brkAccDesc.substring(120, 160);
                        let brkAccPN = el.brkAccPN;
                        let brkAccMfgPartNum = null;
                        //jobscope part number restriction
                        if (brkAccPN.length > 20) {
                            brkAccMfgPartNum = brkAccPN;
                            brkAccPN = mbomData.jobNum + mbomData.releaseNum + '-' + partNumCount + '-BRKACC';
                            partNumCount++;
                        }
                        if (count < 10)
                            seqNum = '00' + count;
                        else if (count < 100)
                            seqNum = '0' + count;
                        else
                            seqNum = count;

                        //add row to the sheet
                        sheet.addRow({
                            assemblyNum: assemblyNum,
                            seqNum: seqNum.toString(),
                            compPartNum: brkAccPN,
                            mfgPartNum: brkAccMfgPartNum,
                            desc1: brkAccDesc1,
                            desc2: brkAccDesc2,
                            desc3: brkAccDesc3,
                            desc4: brkAccDesc4,
                            qty: el.brkAccQty,
                            unitOfIssue: unitOfIssue,
                            unitOfPurchase: unitOfIssue,
                            categoryCode: catCode,
                            makePart: 0,
                            buyPart: 1,
                            stockPart: 0,
                            manufacturer: el.brkAccMfg,
                            deviceDes: devDes,
                            deviceClass: classCode
                        });
                    }
                    count++;
                }

                //further column formatting
                sheet.getColumn(4).eachCell(function (cell) {
                    cell.alignment = {wrapText: true};
                });

                //write workbook to a file in the user's Downloads folder and then send it to the client's downloads
                //build the Downloads path using the OS home directory
                const remoteFilename = mbomData.jobNum + mbomData.releaseNum + ' MBOM.xlsx';
                workbook.xlsx.writeBuffer()
                    .then(function (buffer) {
                        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
                        res.setHeader('Content-Disposition', 'attachment; filename="' + remoteFilename + '"');
                        res.send(Buffer.from(buffer));
                    })
                    .catch(function (err) {
                        console.log('Error generating workbook buffer (no-section):', err);
                        if (!res.headersSent) res.status(500).send('Error generating MBOM');
                    });

                return null;
            }
        })
        .catch(err => {
            //if error occurs at anytime at any point in the code above, log it to the console
            console.log('Error in generateMBOM: \n', err, '\n');
        });
};


// updateItemSection: AJAX endpoint to update secID for a given itemSumID
exports.updateItemSection = function(req, res) {
    req.setTimeout(0);
    if (!req.body || !req.body.itemSumID) {
        res.json({ success: false, error: 'itemSumID required' });
        return;
    }
    const itemSumID = req.body.itemSumID;
    // allow null/empty secID to clear assignment
    const secID = (typeof req.body.secID !== 'undefined' && req.body.secID !== '') ? req.body.secID : null;

    querySql("UPDATE " + database + "." + dbConfig.MBOM_item_table + " SET secID = ? WHERE itemSumID = ?", [secID, itemSumID])
        .then(() => {
            res.json({ success: true });
        })
        .catch(err => {
            console.error('updateItemSection error:', err);
            res.json({ success: false, error: String(err) });
        });
};


// Bulk delete items (transactional)
exports.deleteItems = async function(req, res) {
    req.setTimeout(0);
    // normalize selected IDs from form (could be single value or array)
    let selected = req.body.selectedItemIDs || req.body['selectedItemIDs[]'] || [];
    if (!Array.isArray(selected)) selected = [selected];
    // normalize and dedupe IDs to avoid duplicate processing from duplicate form inputs
    selected = selected.map(String).filter(v => v && v.trim() !== '');
    selected = Array.from(new Set(selected));

    const mbomData = {
        mbomID: req.body.mbomID,
        jobNum: req.body.jobNum,
        releaseNum: req.body.releaseNum
    };

    if (!selected || selected.length === 0) {
        res.locals.title = 'Delete Items';
        return res.redirect('../searchMBOM/?bomID=' + (mbomData.jobNum || '') + (mbomData.releaseNum || '') + "_" + (mbomData.mbomID || ''));
    }

    try {
        const conn = await DB.getSqlConnection();
        try {
            await conn.beginTransaction();

            for (let itemSumID of selected) {
                // determine userItemID for potential cleanup
                const [userRows] = await conn.query("SELECT userItemID FROM " + database + "." + dbConfig.MBOM_item_table + " WHERE itemSumID = ?", [itemSumID]);
                const userItemID = (userRows && userRows[0]) ? userRows[0].userItemID : null;

                // delete the itemSum row
                await conn.query("DELETE FROM " + database + "." + dbConfig.MBOM_item_table + " WHERE itemSumID = ?", [itemSumID]);

                // if there was a userItemID, ensure no other rows reference it before deleting the MBOM_user_items row
                if (userItemID) {
                    const [refCountRows] = await conn.query("SELECT COUNT(*) AS cnt FROM " + database + "." + dbConfig.MBOM_item_table + " WHERE userItemID = ?", [userItemID]);
                    const cnt = (refCountRows && refCountRows[0]) ? refCountRows[0].cnt : 0;
                    if (cnt === 0) {
                        await conn.query("DELETE FROM " + database + "." + dbConfig.MBOM_user_items + " WHERE userItemID = ?", [userItemID]);
                    }
                }
            }

            await conn.commit();
            conn.release();

            res.locals.title = 'Delete Items';
            return res.redirect('../searchMBOM/?bomID=' + mbomData.jobNum + mbomData.releaseNum + "_" + mbomData.mbomID);
        } catch (err) {
            try { await conn.rollback(); } catch (e) { /* ignore */ }
            try { conn.release(); } catch (e) { /* ignore */ }
            throw err;
        }
    } catch (err) {
        console.log('Error in deleteItems: \n', err, '\n');
        return res.status(500).send('Error deleting items');
    }
};


// Bulk copy items (transactional)
exports.copyItems = async function(req, res) {
    req.setTimeout(0);
    let selected = req.body.selectedItemIDs || req.body['selectedItemIDs[]'] || [];
    if (!Array.isArray(selected)) selected = [selected];
    // normalize and dedupe
    selected = selected.map(String).filter(v => v && v.trim() !== '');
    selected = Array.from(new Set(selected));

    const mbomData = {
        mbomID: req.body.mbomID,
        jobNum: req.body.jobNum,
        releaseNum: req.body.releaseNum
    };

    if (!selected || selected.length === 0) {
        res.locals.title = 'Copy Items';
        return res.redirect('../searchMBOM/?bomID=' + (mbomData.jobNum || '') + (mbomData.releaseNum || '') + "_" + (mbomData.mbomID || ''));
    }

    try {
        const conn = await DB.getSqlConnection();
        try {
            await conn.beginTransaction();

            for (let itemSumID of selected) {
                // fetch the source row
                const [rows] = await conn.query("SELECT comItemID, userItemID, itemQty, shipLoose FROM " + database + "." + dbConfig.MBOM_item_table + " WHERE itemSumID = ?", [itemSumID]);
                if (rows && rows[0]) {
                    const itemData = {
                        comItemID: rows[0].comItemID,
                        userItemID: rows[0].userItemID,
                        mbomID: mbomData.mbomID,
                        itemQty: rows[0].itemQty,
                        shipLoose: rows[0].shipLoose
                    };
                    await conn.query("INSERT INTO " + database + "." + dbConfig.MBOM_item_table + " SET ?", itemData);
                }
            }

            await conn.commit();
            conn.release();

            res.locals.title = 'Copy Items';
            return res.redirect('../searchMBOM/?bomID=' + mbomData.jobNum + mbomData.releaseNum + "_" + mbomData.mbomID);
        } catch (err) {
            try { await conn.rollback(); } catch (e) { /* ignore */ }
            try { conn.release(); } catch (e) { /* ignore */ }
            throw err;
        }
    } catch (err) {
        console.log('Error in copyItems: \n', err, '\n');
        return res.status(500).send('Error copying items');
    }
};


// Bulk delete breakers (transactional)
exports.deleteBreakers = async function(req, res) {
    req.setTimeout(0);
    let selected = req.body.selectedBreakerIDs || req.body['selectedBreakerIDs[]'] || [];
    if (!Array.isArray(selected)) selected = [selected];
    // normalize and dedupe
    selected = selected.map(String).filter(v => v && v.trim() !== '');
    selected = Array.from(new Set(selected));

    const mbomData = {
        mbomID: req.body.mbomID,
        jobNum: req.body.jobNum,
        releaseNum: req.body.releaseNum
    };

    if (!selected || selected.length === 0) {
        res.locals.title = 'Delete Breakers';
        return res.redirect('../searchMBOM/?bomID=' + (mbomData.jobNum || '') + (mbomData.releaseNum || '') + "_" + (mbomData.mbomID || ''));
    }

    try {
        const conn = await DB.getSqlConnection();
        try {
            await conn.beginTransaction();

            for (let idDev of selected) {
                await conn.query("DELETE FROM " + database + "." + dbConfig.MBOM_breaker_table + " WHERE idDev = ?", [idDev]);
                await conn.query("DELETE FROM " + database + "." + dbConfig.MBOM_brkAcc_table + " WHERE idDev = ?", [idDev]);
            }

            await conn.commit();
            conn.release();

            res.locals.title = 'Delete Breakers';
            return res.redirect('../searchMBOM/?bomID=' + mbomData.jobNum + mbomData.releaseNum + "_" + mbomData.mbomID);
        } catch (err) {
            try { await conn.rollback(); } catch (e) { /* ignore */ }
            try { conn.release(); } catch (e) { /* ignore */ }
            throw err;
        }
    } catch (err) {
        console.log('Error in deleteBreakers: \n', err, '\n');
        return res.status(500).send('Error deleting breakers');
    }
};


// Bulk copy breakers (transactional)
exports.copyBreakers = async function(req, res) {
    req.setTimeout(0);
    let selected = req.body.selectedBreakerIDs || req.body['selectedBreakerIDs[]'] || [];
    if (!Array.isArray(selected)) selected = [selected];
    // normalize and dedupe
    selected = selected.map(String).filter(v => v && v.trim() !== '');
    selected = Array.from(new Set(selected));

    const mbomData = {
        mbomID: req.body.mbomID,
        jobNum: req.body.jobNum,
        releaseNum: req.body.releaseNum
    };

    if (!selected || selected.length === 0) {
        res.locals.title = 'Copy Breakers';
        return res.redirect('../searchMBOM/?bomID=' + (mbomData.jobNum || '') + (mbomData.releaseNum || '') + "_" + (mbomData.mbomID || ''));
    }

    try {
        const conn = await DB.getSqlConnection();
        try {
            await conn.beginTransaction();

            for (let idDev of selected) {
                // fetch breaker and its accessories
                const [brkRows] = await conn.query("SELECT devLayout, devDesignation, unitOfIssue, catCode, class, brkPN, cradlePN, devMfg FROM " + database + "." + dbConfig.MBOM_breaker_table + " WHERE idDev = ?", [idDev]);
                if (!(brkRows && brkRows[0])) continue;
                const brk = brkRows[0];
                const brkData = {
                    mbomID: mbomData.mbomID,
                    devLayout: brk.devLayout,
                    devDesignation: brk.devDesignation,
                    unitOfIssue: brk.unitOfIssue,
                    catCode: brk.catCode,
                    class: brk.class,
                    brkPN: brk.brkPN,
                    cradlePN: brk.cradlePN,
                    devMfg: brk.devMfg
                };

                const [insertRes] = await conn.query("INSERT INTO " + database + "." + dbConfig.MBOM_breaker_table + " SET ?", brkData);
                const newDevID = (insertRes && insertRes.insertId) ? insertRes.insertId : null;

                if (newDevID) {
                    const [accRows] = await conn.query("SELECT brkAccQty, brkAccType, brkAccMfg, brkAccDesc, brkAccPN FROM " + database + "." + dbConfig.MBOM_brkAcc_table + " WHERE idDev = ?", [idDev]);
                    for (let acc of accRows) {
                        const accData = {
                            mbomID: mbomData.mbomID,
                            idDev: newDevID,
                            brkAccQty: acc.brkAccQty,
                            brkAccType: acc.brkAccType,
                            brkAccMfg: acc.brkAccMfg,
                            brkAccDesc: acc.brkAccDesc,
                            brkAccPN: acc.brkAccPN
                        };
                        await conn.query("INSERT INTO " + database + "." + dbConfig.MBOM_brkAcc_table + " SET ?", accData);
                    }
                }
            }

            await conn.commit();
            conn.release();

            res.locals.title = 'Copy Breakers';
            return res.redirect('../searchMBOM/?bomID=' + mbomData.jobNum + mbomData.releaseNum + "_" + mbomData.mbomID);
        } catch (err) {
            try { await conn.rollback(); } catch (e) { /* ignore */ }
            try { conn.release(); } catch (e) { /* ignore */ }
            throw err;
        }
    } catch (err) {
        console.log('Error in copyBreakers: \n', err, '\n');
        return res.status(500).send('Error copying breakers');
    }
};