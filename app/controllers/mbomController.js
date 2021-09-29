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
const querySql = DB.querySql;
const Promise = require('bluebird');

//Excel Connection
const Excel = require('exceljs');

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
            res.locals = {title: 'Mechanical BOMs'};
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
                        res.locals = {title: 'Create MBOM'};
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
            res.locals = {title: 'Create MBOM'};
            res.redirect('searchMBOM/?bomID=' + data.jobNum + data.releaseNum + "_" + mbomID);
            return null;
        })
        .catch(err => {
            //if an error occurs at any time or at any point in the above code, then log it to the console
            console.log('there was an error:' + err);
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
            res.locals = {title: 'Search MBOM'};
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
    querySql("UPDATE " + database + "." + dbConfig.MBOM_summary_table + " SET jobName = ?, customer = ?, " +
        "boardDesignation = ?, noSectionMBOM = ? WHERE mbomID = ?", [data.jobName, data.customer, data.boardDesignation, data.noSectionMBOM, qs.mbomID])
        .then(() => {
            //redirect to the searchMBOM page
            res.locals = {title: 'Search MBOM'};
            res.redirect('../searchMBOM/?bomID=' + data.jobNum + data.releaseNum + "_" + qs.mbomID);
        })
        .catch(err => {
            //if error occurs at any time at any point in the above, log the error to the console
            console.log('there was an error:' + err);
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
    req.setTimeout(0);  //no timeout (this is needed to prevent error due to page taking a long time to load)
    //Initialize variables
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
    let pn = req.body.pn;

    //arrayRemove function definition
    function arrayRemove(arr, value) {
        return arr.filter(function(el){
            return el.pn != value;
        });
    }

    //execute arrayRemove function on brkAccArr
    brkAccArr = arrayRemove(brkAccArr, pn);

    //redirect to the searchMBOM page
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
            return querySql("SELECT * FROM " + database + "." + dbConfig.MBOM_breaker_table + " WHERE idDev = ?", idDev)
        })
        .then(rows => {
            //for each row
            for(let row of rows){
                //push to breakerData
                breakerData.push(row);
            }
            //lookup mbomBrkAccSum using idDev
            return querySql("SELECT * FROM " + database + "." + dbConfig.MBOM_brkAcc_table + " WHERE idDev = ?", idDev)
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
            res.locals = {title: 'Add Breaker Accessory'};
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
            return querySql("SELECT * FROM " + database + "." + dbConfig.MBOM_breaker_table + " WHERE idDev = ?", idDev)
        })
        .then(rows => {
            //for each breaker
            for(let row of rows){
                //push to breakerData
                breakerData.push(row);
            }
            //lookup the mbomBrkAccSum table for corresponding accessories
            return querySql("SELECT * FROM " + database + "." + dbConfig.MBOM_brkAcc_table + " WHERE idDev = ?", idDev)
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
            res.locals = {title: 'Edit Breaker Accessory'};
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

//deleteBrkAccFromEdit function
exports.deleteBrkAccFromEdit = function(req, res) {
    req.setTimeout(0); //no timeout (this is needed to prevent error due to page taking a long time to load)
    //Initialize variables
    let idDev = req.body.idDev;
    let pn = req.body.pn;
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
    //update editBrkDataObj (defined outside of the function) with user input
    editBrkDataObj = {
        devDesignation: req.body.devDesignation,
        brkPN: req.body.brkPN,
        cradlePN: req.body.cradlePN,
        devMfg: req.body.devMfg,
        catCode: req.body.catCode,
        class: req.body.class
    };

    //Initial db query - delete the mbomBrkAccSum row corresponding to the idDev and pn
    querySql("DELETE FROM "+ database + "." + dbConfig.MBOM_brkAcc_table + " WHERE idDev = ? AND brkAccPN = ?", [idDev, pn])
        .then(() => {
            //lookup mbomBrkSum row with the specific idDev
            return querySql("SELECT * FROM " + database + "." + dbConfig.MBOM_breaker_table + " WHERE idDev = ?", idDev)
        })
        .then(rows => {
            //for breaker row
            for(let row of rows){
                //push to breakerData
                breakerData.push(row);
            }
            //lookup the mbomBrkAccSum table where the idDev matches
            return querySql("SELECT * FROM " + database + "." + dbConfig.MBOM_brkAcc_table + " WHERE idDev = ?", idDev)
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
            res.locals = {title: 'Delete Breaker Accessory'};
            res.render('MBOM/editBreaker', {
                mbomBrkData: breakerData,
                brkAccData: accData,
                mbomData: mbomData,
                brkData: editBrkDataObj
            });
        })
        .catch(err => {
            //if error occurs at anytime at any point in the code above, log it to the console
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
            res.locals = {title: 'Search MBOM'};
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
                mbomBrkAcc: mbomBrkAcc
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
            res.locals = {title: 'Create Com Item'};
            res.render('MBOM/createComItemTable', {
                comItemData: comItemData,
                catCodeData: catCodeData,
                classCodeData: classCodeData
            });
        })
        .catch(err => {
            //if error occurs at anytime at any point in the code above, log it to the console
            console.log('there was an error:' + err);
        });
};

//createComItemTablePOST function (handles the POST request to createComItemTable)
exports.createComItemTablePOST = function(req, res) {
    req.setTimeout(0); //no timeout (this is needed to prevent error due to page taking a long time to load)
    //Initialize variables
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
        itemType: itemType,
        itemMfg: itemMfg,
        itemDesc: (req.body.itemDesc).toUpperCase(),
        itemPN: req.body.itemPN,
        unitOfIssue: req.body.unitOfIssue,
        catCode: req.body.catCode,
        class: req.body.class
    };

    //Initial db query - lookup the mbomComItem table rows that match the itemType, itemMfg, itemDesc, and itemPN
    querySql("SELECT * FROM " + database + " . " + dbConfig.MBOM_common_items + " WHERE itemType = ? AND itemMfg = ? " +
        "AND itemDesc = ? AND itemPN = ?", [data.itemType, data.itemMfg, data.itemDesc, data.itemPN])
        .then(rows => {
            //insert a new row in the mbomComItem table with data from
            if(rows.length == 0){
                querySql("INSERT INTO " + database + " . " + dbConfig.MBOM_common_items + " SET ?", data);
            }

            return null;
        })
        .then(() => {
            res.locals = {title: 'Create Com Item'};
            res.redirect('./MBOM');
        })
        .catch(err => {
            //if error occurs at anytime at any point in the code above, log it to the console
            console.log('there was an error:' + err);
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
                    classCode: row.class
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
            res.locals = {title: 'Edit Item'};
            res.render('MBOM/editComItem', {
                editComItemData: editComItemData,
                comItemData: comItemData,
                catCodeData: catCodeData,
                classCodeData: classCodeData
            });
        })
        .catch(err => {
            //if error occurs at anytime at any point in the code above, log it to the console
            console.log('there was an error:' + err);
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
        class: req.body.class
    };

    //Initial db query - update mbomComItems with user input at the given comItemID
    querySql("UPDATE " + database + "." + dbConfig.MBOM_common_items + " SET itemType = ?, itemMfg = ?, itemDesc = ?, " +
        "itemPN = ?, unitOfIssue = ?, catCode = ?, class = ? WHERE comItemID = ?", [updateData.itemType, updateData.itemMfg,
        updateData.itemDesc, updateData.itemPN, updateData.unitOfIssue, updateData.catCode, updateData.class, qs.comItemID])
        .then(() => {
            //redirect to the main mbom page
            res.locals = {title: 'Edit Common Item'};
            res.redirect('../MBOM');
        })
        .catch(err => {
            //if error occurs at anytime at any point in the code above, log it to the console
            console.log('there was an error:' + err);
        });
};


/***********************************************
 COM ITEM IN MBOM
 ***********************************************/
//addComItem function
exports.addComItem = function(req, res) {
    req.setTimeout(0); //no timeout (this is needed to prevent error due to page taking a long time to load)
    //Initialize variables
    let comItemID, itemSumID;
    let itemMfg = req.body.itemMfg.split('|')[1];
    let itemDesc = req.body.itemDesc.split('|')[2];
    let itemPN = req.body.itemPN.split('|')[3];
    let shipLooseCheck;
    let mbomData = {
        mbomID: req.body.mbomID,
        jobNum: req.body.jobNum,
        releaseNum: req.body.releaseNum,
    };
    let data = {
        itemType: req.body.itemType,
        itemMfg: itemMfg,
        itemDesc: itemDesc,
        itemPN: itemPN,
    };

    if (req.body.shipLoose)
        shipLooseCheck = 'Y';
    else
        shipLooseCheck = 'N';

    //Initial db query - lookup mbomComItem row where itemType, itemMfg, itemDesc, and itemPN match
    querySql("SELECT * FROM " + database + "." + dbConfig.MBOM_common_items + " WHERE itemType = ? AND itemMfg = ? " +
        "AND itemDesc = ? AND itemPN = ?", [data.itemType, data.itemMfg, data.itemDesc, data.itemPN])
        .then(rows => {
            //write result id to comItemID
            comItemID = rows[0].comItemID;

            //create itemSumData varaible needed for sql query
            let itemSumData = {
                comItemID: comItemID,
                itemSumID: itemSumID,
                mbomID: mbomData.mbomID,
                itemQty: req.body.itemQty,
                shipLoose: shipLooseCheck
            };

            //insert new row to mbomItemSum table with itemSumData
            querySql("INSERT INTO " + database + "." + dbConfig.MBOM_item_table + " SET ?", itemSumData);

            return null;
        })
        .then(() => {
            //redirect to searchMBOM page
            res.locals = {title: 'Add Com Item'};
            res.redirect('searchMBOM/?bomID=' + mbomData.jobNum + mbomData.releaseNum + "_" + mbomData.mbomID);
        })
        .catch(err => {
            //if error occurs at anytime at any point in the code above, log it to the console
            console.log('there was an error:' + err);
        });
};

//editComItem function
exports.editComItem = function(req, res) {
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

        return {comItem, itemSum, editItem};
    }

    //execute getItemData
    getItemData()
        .then(({comItem, itemSum, editItem, userProfile}) => {
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
                    itemPN: row.itemPN
                };
            }
            return null;
        })
        //render MBOMeditComItem page with mbomItemData, mbomData, comItemData, and editData
        .then(() => {
            res.locals = {title: 'Edit Item'};
            res.render('MBOM/MBOMeditComItem', {
                mbomItemData: data,
                mbomData: mbomData,
                comItemData: comItemData,
                editData: editData
            });
        })
        .catch(err => {
            //if error occurs at anytime at any point in the code above, log it to the console
            console.log('there was an error:' + err);
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
    let updateData = {
        itemQty: req.body.itemQty,
        itemType: req.body.itemType,
        itemMfg: req.body.itemMfg.split('|')[1],
        itemDesc: req.body.itemDesc.split('|')[2],
        itemPN: req.body.itemPN.split('|')[3],
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
            //write result id to comItemID
            comItemID = rows[0].comItemID;
            //update mbomItemSum with the updateData in the row referenced by itemSumID
            querySql("UPDATE mbomItemSum SET comItemID = ?, itemQty = ?, shipLoose = ? WHERE itemSumID = ?",
                [comItemID, updateData.itemQty, updateData.shipLoose, itemSumID]);

            return null
        })
        .then(() => {
            //redirect to searchMBOM page
            res.locals = {title: 'Edit Common Item'};
            res.redirect('../searchMBOM/?bomID=' + mbomData.jobNum + mbomData.releaseNum + "_" + mbomData.mbomID);
        })
        .catch(err => {
            //if error occurs at anytime at any point in the code above, log it to the console
            console.log('there was an error:' + err);
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
                        console.log('there was an error:' + err);
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
            res.locals = {title: 'Create User Item'};
            res.redirect('searchMBOM/?bomID=' + mbomData.jobNum + mbomData.releaseNum + "_" + mbomData.mbomID);
        })
        .catch(err => {
            //if error occurs at anytime at any point in the code above, log it to the console
            console.log('there was an error:' + err);
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
            res.locals = {title: 'Edit User Item'};
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
            console.log('there was an error:' + err);
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
    let shipLooseCheck;
    if(req.body.editUserShipLoose)
        shipLooseCheck = 'Y';
    else
        shipLooseCheck = 'N';
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
        mbomID: req.body.mbomID,
        itemQty: req.body.itemQty,
        itemType: itemType,
        itemMfg: itemMfg,
        itemDesc: (req.body.itemDesc).toUpperCase(),
        unitOfIssue: req.body.unitOfIssue,
        catCode: req.body.catCode,
        class: req.body.class,
        itemPN: req.body.itemPN,
        shipLoose: shipLooseCheck
    };

    //Initial db query - lookup mbomUserItem row where itemPN and mbomID match
    querySql("SELECT * FROM " + database + "." + dbConfig.MBOM_user_items + " WHERE itemPN = ? AND mbomID = ?",
        [updateData.itemPN, updateData.mbomID])
        .then(rows => {
            //if rows have data
            if(rows.length > 0){
                //write id to userItemID
                userItemID = rows[0].userItemID;

                //update mbomUserItems with new data in the row referenced by itemPN and mbomID
                querySql("UPDATE " + database + "." + dbConfig.MBOM_user_items + " SET itemType = ?, itemMfg = ?, " +
                    "itemDesc = ?, unitOfIssue = ?, catCode = ?, class = ? WHERE itemPN = ? AND mbomID = ?", [updateData.itemType,
                    updateData.itemMfg, updateData.itemDesc, updateData.unitOfIssue, updateData.catCode, updateData.class, updateData.itemPN, updateData.mbomID])
                    .then(() => {
                        //update mbomItemSum with new data in the row referenced by itemSumID
                        querySql("UPDATE " + database + "." + dbConfig.MBOM_item_table + " SET itemQty = ?, shipLoose = ? " +
                            "WHERE itemSumID = ?", [updateData.itemQty, updateData.shipLoose, itemSumID]);
                        return null
                    })
                    .then(() => {
                        //update mbomItemSum with new userItemID in the row referenced by itemSumID and mbomID
                        querySql("UPDATE " + database + "." + dbConfig.MBOM_item_table + " SET userItemID = ? WHERE " +
                            "itemSumID = ? AND mbomID = ? ", [userItemID, itemSumID, updateData.mbomID]);

                        return null
                    })
                    .catch(err => {
                        //if error occurs at anytime at any point in the code above, log it to the console
                        console.log('there was an error:' + err);
                    });
            } else {
                //if rows dont have data
                //insert new row into mbomUserItem with updateData
                querySql("INSERT INTO " + database + "." + dbConfig.MBOM_user_items + " SET itemType = ?, itemMfg = ?, " +
                    "itemDesc = ?, unitOfIssue = ?, catCode = ?, class = ?, itemPN = ?, mbomID = ?", [updateData.itemType,
                    updateData.itemMfg, updateData.itemDesc, updateData.unitOfIssue, updateData.catCode, updateData.class, updateData.itemPN, updateData.mbomID])
                    .then(() => {
                        //lookup mbomUserItem row referenced by itemPN and mbomID
                        return querySql("SELECT * FROM " + database + "." + dbConfig.MBOM_user_items + " WHERE itemPN = ? " +
                            "AND mbomID = ?", [updateData.itemPN, updateData.mbomID])
                    })
                    .then(rows => {
                        //set userItemID
                        userItemID = rows[0].userItemID;

                        //update mbomItemSum with update data in the row referenced by itemSumID
                        querySql("UPDATE " + database + "." + dbConfig.MBOM_item_table + " SET userItemID = ?, itemQty = ?, " +
                            "shipLoose = ? WHERE itemSumID = ?", [userItemID, updateData.itemQty, updateData.shipLoose, itemSumID]);
                        return null
                    })
                    .catch(err => {
                        //if error occurs at anytime at any point in the code above, log it to the console
                        console.log('there was an error:' + err);
                    });
            }

            return null
        })
        .then(() => {
            //redirect to searchMBOM page
            res.locals = {title: 'Edit User Item'};
            res.redirect('../searchMBOM/?bomID=' + mbomData.jobNum + mbomData.releaseNum + "_" + mbomData.mbomID);
        })
        .catch(err => {
            //if error occurs at anytime at any point in the code above, log it to the console
            console.log('there was an error:' + err);
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
            res.locals = {title: 'Copy Item'};
            res.redirect('../searchMBOM/?bomID=' + mbomData.jobNum + mbomData.releaseNum + "_" + mbomData.mbomID);
        })
        .catch(err => {
            //if error occurs at anytime at any point in the code above, log it to the console
            console.log('there was an error:' + err);
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
                    console.log('there was an error:' + err);
                });

            //delete row from mbomItemSum referenced by itemSumID
            querySql("DELETE FROM " + database + "." + dbConfig.MBOM_item_table + " WHERE itemSumID = ?", qs.itemSumID);

            return null;
        })
        .then(() => {
            //redirect to the searchMBOM page
            res.locals = {title: 'Delete Item'};
            res.redirect('../searchMBOM/?bomID=' + mbomData.jobNum + mbomData.releaseNum + "_" + mbomData.mbomID);
        })
        .catch(err => {
            //if error occurs at anytime at any point in the code above, log it to the console
            console.log('there was an error:' + err);
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
            res.locals = {title: 'Add Breaker'};
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
            res.locals = {title: 'Copy Breaker'};
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
            res.locals = {title: 'Edit Breaker'};
            res.render('MBOM/editBreaker', {
                mbomBrkData: breakerData,
                brkAccData: accData,
                mbomData: mbomData,
                brkData: brkDataObj
            });
        })
        .catch(err => {
            //if error occurs at anytime at any point in the code above, log it to the console
            console.log('there was an error:' + err);
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
            res.locals = {title: 'Copy Breaker'};
            res.redirect('../searchMBOM/?bomID=' + mbomData.jobNum + mbomData.releaseNum + "_" + updateData.mbomID);
        })
        .catch(err => {
            //if error occurs at anytime at any point in the code above, log it to the console
            console.log('there was an error:' + err);
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
            res.locals = {title: 'Delete Breaker'};
            res.redirect('../searchMBOM/?bomID=' + mbomData.jobNum + mbomData.releaseNum + "_" + mbomData.mbomID);
        })
        .catch(err => {
            //if error occurs at anytime at any point in the code above, log it to the console
            console.log('there was an error:' + err);
        });
};


/***********************************************
 SECTION CONFIGURE IN MBOM
 ***********************************************/
//mbomAddSection function
exports.mbomAddSection = function(req, res) {
    req.setTimeout(0); //no timeout (this is needed to prevent error due to page taking a long time to load)
    //Initialize variables
    let data = {
        jobNum: req.body.jobNum,
        releaseNum: req.body.releaseNum,
    };
    let numSections, mbomID;

    //Initial db query - lookup mbomSum in the row referenced by jobNum and releaseNum
    querySql("SELECT * FROM " + database + " . " + dbConfig.MBOM_summary_table + " WHERE jobNum = ? AND releaseNum = ?", [data.jobNum, data.releaseNum])
        .then(rows => {
            //write the numSections and mbomID
            numSections = rows[0].numSections + 1;
            mbomID = rows[0].mbomID;

            //update mbomSum with the new numSections in the row referenced by jobNum and releaseNum
            querySql("UPDATE " + database + "." + dbConfig.MBOM_summary_table + " SET numSections = ? WHERE jobNum = ? AND releaseNum = ?", [numSections, data.jobNum, data.releaseNum]);
            //insert new row into mbomNewSectionSum with numSections and mbomID
            querySql("INSERT INTO " + database + "." + dbConfig.MBOM_new_section_sum + " SET sectionNum = ?, mbomID = ?", [numSections, mbomID]);
            return null;
        })
        .then(() => {
            //redirect to searchMBOM page
            res.locals = {title: 'Add Section'};
            res.redirect('searchMBOM/?bomID=' + data.jobNum + data.releaseNum + "_" + mbomID);
        })
        .catch(err => {
            //if error occurs at anytime at any point in the code above, log it to the console
            console.log('there was an error:' + err);
        });
};

//mbomResetSection function
exports.mbomResetSection = function(req, res) {
    req.setTimeout(0); //no timeout (this is needed to prevent error due to page taking a long time to load)
    //Initialize variables
    let data = {
        jobNum: req.body.jobNum,
        releaseNum: req.body.releaseNum,
    };
    let numSections = 0;
    let mbomID;

    //lookup mbomSum row referenced by jobNum and releaseNum
    querySql("SELECT * FROM " + database + " . " + dbConfig.MBOM_summary_table + " WHERE jobNum = ? AND releaseNum = ?", [data.jobNum, data.releaseNum])
        .then(rows => {
            //write the mbomID
            mbomID = rows[0].mbomID;

            //update mbomSum with numSections in the row referenced by jobNum and releaseNum
            querySql("UPDATE " + database + "." + dbConfig.MBOM_summary_table + " SET numSections = ? WHERE jobNum = ? AND releaseNum = ?", [numSections, data.jobNum, data.releaseNum]);
            //delete row from mbomNewSectionSum referenced by mbomID
            querySql("DELETE FROM " + database + "." + dbConfig.MBOM_new_section_sum + " WHERE mbomID = ?", mbomID);
            //update mbomItemSum with null secID in the row referenced by mbomID
            querySql("UPDATE " + database + "." + dbConfig.MBOM_item_table + " SET secID = ? WHERE mbomID = ?", [null, mbomID]);
            //update mbomBrkSum with null secID in the row referenced by mbomID
            querySql("UPDATE " + database + "." + dbConfig.MBOM_breaker_table + " SET secID = ? WHERE mbomID = ?", [null, mbomID]);

            return null;
        })
        .then(() => {
            //redirect to searchMBOM
            res.locals = {title: 'Reset Section'};
            res.redirect('searchMBOM/?bomID=' + data.jobNum + data.releaseNum + "_" + mbomID);
        })
        .catch(err => {
            //if error occurs at anytime at any point in the code above, log it to the console
            console.log('there was an error:' + err);
        });
};

//mbomDeleteSection function
exports.mbomDeleteSection = function(req, res) {
    req.setTimeout(0); //no timeout (this is needed to prevent error due to page taking a long time to load)
    //Initialize variables
    let urlObj = url.parse(req.originalUrl);
    urlObj.protocol = req.protocol;
    urlObj.host = req.get('host');
    let qs = queryString.parse(urlObj.search);
    let selectedSec = qs.selectedSec;
    let numSections = qs.numSections;
    let data = {
        mbomID: req.body.mbomID[0],
        jobNum: req.body.jobNum[0],
        releaseNum: req.body.releaseNum[0]
    };
    let brkIDs = [];
    let itemIDs = [];

    //Initial db query - lookup mbomNewSectionSum row referenced by mbomID and sectionNum
    querySql("SELECT * FROM " + database + " . " + dbConfig.MBOM_new_section_sum + " WHERE mbomID = ? AND sectionNum = ?", [data.mbomID, selectedSec])
        .then(
            async function(rows){
                //lookup mbomBrkSum row referenced by secID
                const brk = await querySql("SELECT * FROM " + dbConfig.MBOM_breaker_table + " WHERE secID = ?", rows[0].secID);
                //lookup mbomItemSum row referenced by secID
                const item = await querySql("SELECT * FROM " + dbConfig.MBOM_item_table + " WHERE secID = ?", rows[0].secID);
                return {brk, item};
            })
        .then(({brk, item}) => {
            //for each brk
            for(let row of brk){
                //push id to brkIDs
                brkIDs.push(row.idDev);
            }
            //for each item
            for(let row of item){
                //push id to itemIDs
                itemIDs.push(row.itemSumID);
            }

            //delete row from mbomNewSectionSum referenced by mbomID and sectionNum
            querySql("DELETE FROM " + database + " . " + dbConfig.MBOM_new_section_sum + " WHERE mbomID = ? AND sectionNum = ?", [data.mbomID[0], selectedSec]);

            return null;
        })
        .then(
            async function(){
                //for each breaker id
                for(let row of brkIDs){
                    //update the mbomBrkSum secID in the row referenced by idDev
                    await querySql("UPDATE " + database + "." + dbConfig.MBOM_breaker_table + " SET secID = ? WHERE idDev = ?", [null, row]);
                }
                for(let row of itemIDs){
                    //update the mbomItemSum secID in the row referenced by itemSumID
                    await querySql("UPDATE " + database + " . " + dbConfig.MBOM_item_table + " SET secID = ? WHERE itemSumID = ?", [null, row]);
                }

                return null;
            }
        )
        .then(() => {
            for(let i = parseInt(selectedSec) + 1; i <= numSections; i++){
                //update the mbomNewSectionSum sectionNum in the row referenced by mbomID and sectionNum
                querySql("UPDATE " + database + " . " + dbConfig.MBOM_new_section_sum + " SET sectionNum = ? WHERE mbomID = ? AND sectionNum = ?", [i - 1, data.mbomID[0], i]);
            }
            return null;
        })
        .then(() => {
            //update the mbomSum numSections in the row referenced by mbomID
            querySql("UPDATE " + database + "." + dbConfig.MBOM_summary_table + " SET numSections = ? WHERE mbomID = ?", [(numSections - 1), data.mbomID]);
            return null;
        })
        .then(() => {
            //redirect to searchMBOM
            res.locals = {title: 'Delete Section'};
            res.redirect('../searchMBOM/?bomID=' + data.jobNum + data.releaseNum + "_" + data.mbomID);
        })
        .catch(err => {
            //if error occurs at anytime at any point in the code above, log it to the console
            console.log('there was an error:' + err);
        });
};

//sectionConfigure function
exports.sectionConfigure = function(req, res) {
    req.setTimeout(0); //no timeout (this is needed to prevent error due to page taking a long time to load)
    //Initialize variables
    let data = [];
    if(req.body.sectionNum == 0){
        data[0] = {
            sectionNum: req.body.sectionNum,
            mbomID: req.body.mbomID
        }
    } else if (req.body.sectionNum.length == 1) {
        data[0] = {
            sectionNum: req.body.sectionNum,
            ID: req.body.ID,
            mbomID: req.body.mbomID
        }
    } else {
        for (let i = 0; i < req.body.totalSection; i++) {
            data[i] = {
                sectionNum: (req.body.sectionNum)[i],
                ID: (req.body.ID)[i],
                mbomID: (req.body.mbomID)[i]
            };
        }
    }
    let jobNum, releaseNum;

    //Initial db query - lookup mbomSum row referenced by mbomID
    querySql("SELECT jobNum, releaseNum FROM " + database + "." + dbConfig.MBOM_summary_table + " WHERE mbomID = ?", data[0].mbomID)
        .then(rows => {
            //write jobNum and releaseNum from result
            jobNum = rows[0].jobNum;
            releaseNum = rows[0].releaseNum;

            return null;
        })
        .then(() => {
            //if more then 0 sections
            if(data[0].sectionNum != 0) {
                //for each section
                for (let j = 0; j < data.length; j++) {
                    //write to secData
                    let secData = data[j];
                    //lookup mbomNewSectionSum row referenced by sectionNum and mbomID
                    querySql("SELECT * FROM " + database + " . " + dbConfig.MBOM_new_section_sum + " WHERE sectionNum = ? AND mbomID = ?", [secData.sectionNum, secData.mbomID])
                        .then(rows => {
                            //if sections exist
                            if(rows.length != 0){
                                //if the ID has an I (short for Item)
                                if((secData.ID).includes('I')) {
                                    //write the number portion to tempID
                                    let tempID = (secData.ID).substring(1);
                                    //update the mbomItemSum secID column in the row referenced by itemSumID
                                    querySql("UPDATE " + database + " . " + dbConfig.MBOM_item_table + " SET secID = ? WHERE itemSumID = ?", [rows[0].secID, tempID]);
                                } else {
                                    //write the number portion to tempID
                                    let tempID = (secData.ID).substring(1);
                                    //update the mbomBrkSum secID column in the row referenced by idDev
                                    querySql("UPDATE " + database + " . " + dbConfig.MBOM_breaker_table + " SET secID = ? WHERE idDev = ?", [rows[0].secID, tempID]);
                                }
                                return null
                            }
                        })
                        .catch(err => {
                            //if error occurs at anytime at any point in the code above, log it to the console
                            console.log('there was an error:' + err);
                        });
                }
            }
            return null
        })
        .then(() => {
            //redirect to searchMBOM
            res.locals = {title: 'Section Configure'};
            res.redirect('searchMBOM/?bomID=' + jobNum + releaseNum + "_" + data[0].mbomID)
        })
        .catch(err => {
            //if error occurs at anytime at any point in the code above, log it to the console
            console.log('there was an error:' + err);
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
                                //if userItemID is null
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

                //**********for ship loose items*********//
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
                let count = 1;
                let shipLooseItems = [];

                for (let row of mbomItemData) {
                    if (row.shipLoose == 'Y') {
                        if (row.userItemID != null) {
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

                let totalSLQty = [];
                let SLobj = null;
                for (let f = 0; f < shipLooseItems.length; f++) {
                    SLobj = shipLooseItems[f];
                    if (!totalSLQty[SLobj.itemID]) {
                        totalSLQty[SLobj.itemID] = SLobj;
                    } else {
                        totalSLQty[SLobj.itemID].qty += SLobj.qty;
                        totalSLQty[SLobj.itemID].itemDesc = SLobj.itemDesc;
                    }
                }
                let totalSLQtyResults = [];
                for (let prop in totalSLQty)
                    totalSLQtyResults.push(totalSLQty[prop]);

                for (let row of totalSLQtyResults) {
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
                    /*let mfgPartNum = null;
                    if(itemPN.length > 20){
                        mfgPartNum = itemPN;
                        itemPN = mbomData.jobNum + mbomData.releaseNum + '-' + partNumCount + '-ITEM';
                        partNumCount++;
                    }*/

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

                for (let i = 0; i < mbomAssemNumArr.length; i++) {
                    let seqNum;
                    if ((i + 1) < 10)
                        seqNum = '00' + (i + 1);
                    else if ((i + 1) < 100)
                        seqNum = '0' + (i + 1);
                    else
                        seqNum = (i + 1);

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

                /*sheet.getColumn(3).eachCell(function(cell){
                    if(cell.value != 'Component Part Number:' && cell.value.includes(mbomData.jobNum + mbomData.releaseNum + '-') &&
                        !cell.value.includes(mbomData.jobNum + mbomData.releaseNum + '-MBOM')){
                        cell.fill = {type: 'pattern', pattern:'solid', fgColor:{argb:'FFFF9999'}};
                        cell.alignment = {wrapText: true};
                    }
                });*/
                sheet.getColumn(4).eachCell(function (cell) {
                    cell.alignment = {wrapText: true};
                });


                workbook.xlsx.writeFile('uploads/' + mbomData.jobNum + mbomData.releaseNum + ' MBOM.xlsx').then(function () {
                    const remoteFilePath = 'uploads/';
                    const remoteFilename = mbomData.jobNum + mbomData.releaseNum + ' MBOM.xlsx';
                    res.download(remoteFilePath + remoteFilename);
                });

                return null;
            } else {
                let assemblyNum = mbomData.jobNum + mbomData.releaseNum + '-MBOM';
                let count = 1;

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

                //FOR ITEMS
                let itemArr = [];
                for (let row of mbomItemData) {
                    if (row.userItemID != null) {
                        for (let item of mbomUserItem) {
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
                        for (let item of mbomComItem) {
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

                let totalItemQty = [];
                let itemObj = null;
                for (let f = 0; f < itemArr.length; f++) {
                    itemObj = itemArr[f];
                    if (!totalItemQty[itemObj.itemID]) {
                        totalItemQty[itemObj.itemID] = itemObj;
                    } else {
                        totalItemQty[itemObj.itemID].qty += itemObj.qty;
                        totalItemQty[itemObj.itemID].itemDesc = itemObj.itemDesc;
                    }
                }
                let totalItemQtyResults = [];
                for (let prop in totalItemQty)
                    totalItemQtyResults.push(totalItemQty[prop]);

                for (let row of totalItemQtyResults) {
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

                //FOR BREAKERS
                let brkArr = [];
                let brkAccArr = [];

                for (let row of mbomBrkSum) {
                    for (let el of mbomBrkAccSum) {
                        if (el.idDev == row.idDev) {
                            brkAccArr.push(el);
                        }
                    }
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

                let totalBrkQty = [];
                let brkObj = null;

                for (let f = 0; f < brkArr.length; f++) {
                    brkObj = brkArr[f];
                    if (totalBrkQty.filter(e => e.brkPN == brkObj.brkPN).length == 0) {
                        totalBrkQty.push(brkObj);
                    } else {
                        totalBrkQty.filter(e => e.brkPN == brkObj.brkPN)[0].qty += brkObj.qty;
                        totalBrkQty.filter(e => e.brkPN == brkObj.brkPN)[0].devDesignation += ", " + brkObj.devDesignation;
                        totalBrkQty.filter(e => e.brkPN == brkObj.brkPN)[0].idDev.push(brkObj.idDev[0]);
                    }
                }

                for (let row of totalBrkQty) {
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
                    if (brkPN.length > 20) {
                        brkMfgPartNum = brkPN;
                        brkPN = mbomData.jobNum + mbomData.releaseNum + "-" + partNumCount + "-BRK";
                        partNumCount++;
                    }

                    let crdMfgPartNum = null;
                    if (crdPN.length > 20) {
                        crdMfgPartNum = crdPN;
                        crdPN = mbomData.jobNum + mbomData.releaseNum + "-" + partNumCount + "-CRA";
                        partNumCount++;
                    }

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

                    let totalBrkAccQty = [];
                    //FOR BRK ACCESSORIES
                    for (let dev of idDev) {
                        if (brkAccArr.filter(e => e.idDev == dev).length != 0) {
                            for (let g = 0; g < brkAccArr.filter(e => e.idDev == dev).length; g++) {
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
                    for (let el of totalBrkAccQty) {
                        count++;
                        let brkAccDesc = el.brkAccDesc;
                        let brkAccDesc1 = brkAccDesc.substring(0, 40);
                        let brkAccDesc2 = brkAccDesc.substring(40, 80);
                        let brkAccDesc3 = brkAccDesc.substring(80, 120);
                        let brkAccDesc4 = brkAccDesc.substring(120, 160);
                        let brkAccPN = el.brkAccPN;
                        let brkAccMfgPartNum = null;
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
                sheet.getColumn(4).eachCell(function (cell) {
                    cell.alignment = {wrapText: true};
                });


                workbook.xlsx.writeFile('uploads/' + mbomData.jobNum + mbomData.releaseNum + ' MBOM.xlsx').then(function () {
                    const remoteFilePath = 'uploads/';
                    const remoteFilename = mbomData.jobNum + mbomData.releaseNum + ' MBOM.xlsx';
                    res.download(remoteFilePath + remoteFilename);
                });

                return null;
            }
        })
        .catch(err => {
            //if error occurs at anytime at any point in the code above, log it to the console
            console.log('there was an error:' + err);
        });
};