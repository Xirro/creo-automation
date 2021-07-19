

//*********************************MECHANICAL ENG. PORTAL*************************************//
exports = {};
module.exports = exports;
const path = require('path');
const url = require('url');
const queryString = require('query-string');
const moment = require('moment');
const DB = require('../config/db.js');
const querySql = DB.querySql;
const Promise = require('bluebird');

//Excel Connection
const Excel = require('exceljs');

//DATABASE INFORMATION (TABLE NAMES)
const dbConfig = require('../config/database.js');
const database = dbConfig.database;

exports.MBOM = function(req, res) {
    req.setTimeout(0); //no timeout
    let mbomData = [];
    let comItemData = [];
    let message;

    async function f() {
        const mbomSum = await querySql("SELECT * FROM " + database + "." + dbConfig.MBOM_summary_table);
        const comItems = await querySql("SELECT * FROM " + database + "." + dbConfig.MBOM_common_items);
        return {mbomSum, comItems}
    }

    f().then(({mbomSum, comItems}) => {
        for(let row of mbomSum)
            mbomData.push(row);
        for(let row of comItems)
            comItemData.push(row);
        return null
    })
        .then(() => {
            res.locals = {title: 'Mechanical BOMs'};
            res.render('MBOM/MBOM', {
                mbomData: mbomData,
                comItemData: comItemData,
                message: message
            });
        })
        .catch(err => {
            return Promise.reject(err);
        });
};

exports.createMBOM = function(req, res) {
    req.setTimeout(0); //no timeout
    let data = {
        jobNum: req.body.jobNum,
        releaseNum: req.body.releaseNum,
        jobName: req.body.jobName,
        customer: req.body.customer,
        boardDesignation: req.body.boardDesignation,
        numSections: 0
    };
    let mbomID, message;
    querySql("SELECT * FROM mbomSum")
        .then(
            async function(rows){
                for(let row of rows){
                    if(row.jobNum == data.jobNum && row.releaseNum == data.releaseNum) {
                        message = 'Job and Release Number already exist';
                        res.locals = {title: 'Create MBOM'};
                        res.render('MBOM/MBOM', {
                            mbomData: rows,
                            message: message
                        });
                        throw new Error('Job and Release Number already exist');
                    }
                }

                await querySql("INSERT INTO mbomSum SET ?", data);
                return null;
            }
        )
        .then(
            async function() {
                return await querySql("SELECT * FROM mbomSum WHERE jobNum = ? AND releaseNum = ?", [data.jobNum, data.releaseNum]);
            }
        )
        .then(rows => {
            mbomID = rows[0].mbomID;
            res.locals = {title: 'Create MBOM'};
            res.redirect('searchMBOM/?bomID=' + data.jobNum + data.releaseNum + "_" + mbomID);
            return null;
        })
        .catch(err => {
            console.log('there was an error:' + err);
        });
};

exports.copyMBOM = function(req, res) {
    req.setTimeout(0); //no timeout
    let copyMbomID, copyNumSections;
    let copyMbomData = {
        jobNum: req.body.copyJobNum,
        releaseNum: req.body.copyReleaseNum
    };
    let sectionData = [];
    let brkData = [];
    let copyUserItemData = [];

    //NEW
    let newMbomID;
    let newMbomData = {
        jobNum: req.body.jobNum,
        releaseNum: req.body.releaseNum,
        jobName: req.body.jobName,
        customer: req.body.customer,
        boardDesignation: req.body.boardDesignation,
        numSections: null
    };
    let newUserItemData = [];
    let newItemsForItemTable = [];
    let newUserItemID;
    let newBrkAccData = [];

    querySql("SELECT * FROM " + database + "." + dbConfig.MBOM_summary_table + " WHERE jobNum = ? AND releaseNum = ?",
        [copyMbomData.jobNum, copyMbomData.releaseNum])
        .then(rows => {
            copyMbomID = rows[0].mbomID;
            copyNumSections = rows[0].numSections;
            newMbomData.numSections = copyNumSections;

            return null;
        })
        .then(
            async function() {
                await querySql("INSERT INTO " + database + "." + dbConfig.MBOM_summary_table + " SET ?", newMbomData);
                return await querySql("SELECT * FROM " + database + "." + dbConfig.MBOM_summary_table + " WHERE " +
                    "jobNum = ? AND releaseNum = ?", [newMbomData.jobNum, newMbomData.releaseNum]);
            }
        )
        .then(rows => {
            for(let row of rows)
                newMbomID = row.mbomID;

            return querySql("SELECT * FROM " + database + "." + dbConfig.MBOM_new_section_sum + " WHERE mbomID = ?", copyMbomID);
        })
        .then(rows => {
            for (let row of rows) {
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
                for(let i = 0; i < rows.length; i++){
                    await querySql("INSERT INTO " + database + "." + dbConfig.MBOM_new_section_sum + " SET sectionNum = ?, " +
                        "mbomID = ?", [rows[i].sectionNum, newMbomID])
                        .then(rows => {
                            sectionData[i].newSecID = rows.insertId;
                        });
                }
                return null;
            })
        .then(() => {
            return querySql("SELECT * FROM " + database + "." + dbConfig.MBOM_user_items + " WHERE mbomID = ?", copyMbomID);
        })
        .then(rows => {
            for(let row of rows){
                copyUserItemData.push(row);

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
                for(let row of rows){
                    await querySql("INSERT INTO " + database + "." + dbConfig.MBOM_user_items + " SET ? ", row);
                }

                return null;
            }
        )
        .then(
            async function() {
                const getNewItems = await querySql("SELECT * FROM " + database + "." + dbConfig.MBOM_user_items + " WHERE mbomID = ?", newMbomID);
                const getItemSum = await querySql("SELECT * FROM " + database + "." + dbConfig.MBOM_item_table + " WHERE mbomID = ?", copyMbomID);

                return {getNewItems, getItemSum}
            }
        )
        .then(({getNewItems, getItemSum}) => {
            newUserItemData = [];
            for(let row of getNewItems){
                newUserItemData.push(row);
            }
            for(let row of getItemSum){
                newUserItemID = null;
                if(row.userItemID != null){
                    for(let el of copyUserItemData){
                        if(el.userItemID == row.userItemID){
                            for(let el2 of newUserItemData){
                                if(el.itemPN == el2.itemPN)
                                    newUserItemID = el2.userItemID;
                            }
                        }
                    }
                }

                newItemsForItemTable.push({
                    comItemID: row.comItemID,
                    userItemID: newUserItemID,
                    mbomID: newMbomID,
                    secID: row.secID,
                    itemQty: row.itemQty,
                    shipLoose: row.shipLoose
                });
            }
            for(let row of sectionData){
                for(let el of newItemsForItemTable){
                    if(row.copySecID == el.secID){
                        el.secID = row.newSecID;
                    }
                }
            }

            return newItemsForItemTable;
        })
        .then(
            async function(rows) {
                for(let row of rows)
                    await querySql("INSERT INTO " + database + "." + dbConfig.MBOM_item_table + " SET ?", row);

                return querySql("SELECT * FROM " + database + "." + dbConfig.MBOM_breaker_table + " WHERE mbomID = ?", copyMbomID);
            }
        )
        .then(rows => {
            for(let row of rows){
                let secID = null;

                for(let el of sectionData){
                    if(row.secID == el.copySecID){
                        secID = el.newSecID;
                    }
                }
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
                for(let i = 0; i < rows.length; i++){
                    await querySql("INSERT INTO " + database + "." + dbConfig.MBOM_breaker_table + " SET mbomID = ?," +
                        "secID = ?, devLayout = ?, devDesignation = ?, brkPN = ?, cradlePN = ?, unitOfIssue = ?, catCode = ?, class = ?, " +
                        "devMfg = ? ", [rows[i].mbomID, rows[i].secID, rows[i].devLayout, rows[i].devDesignation,
                        rows[i].brkPN, rows[i].cradlePN, rows[i].unitOfIssue, rows[i].catCode, rows[i].class, rows[i].devMfg])
                        .then(rows => {
                            brkData[i].newidDev = rows.insertId;
                        });
                }

                return await querySql("SELECT * FROM " + database + "." + dbConfig.MBOM_brkAcc_table + " WHERE mbomID = ? ", copyMbomID);
            }
        )
        .then(rows => {
            for(let row of rows){
                for(let el of brkData){
                    if(row.idDev == el.copyidDev){
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
                for(let row of rows){
                    await querySql("INSERT INTO " + database + "." + dbConfig.MBOM_brkAcc_table + " SET ? ", row);
                }

                return null;
            }
        )
        .then(() => {
            res.locals = {title: 'Search MBOM'};
            res.redirect('./searchMBOM/?bomID=' + newMbomData.jobNum + newMbomData.releaseNum + "_" + newMbomID);
            return null;
        })
        .catch(err => {
            return Promise.reject(err);
        });
};

exports.editMBOM = function(req, res) {
    req.setTimeout(0); //no timeout
    let urlObj = url.parse(req.originalUrl);
    urlObj.protocol = req.protocol;
    urlObj.host = req.get('host');
    let qs = queryString.parse(urlObj.search);

    let data = {
        jobNum: req.body.jobNum,
        releaseNum: req.body.releaseNum,
        jobName: req.body.jobName,
        customer: req.body.customer,
        boardDesignation: req.body.boardDesignation
    };

    querySql("UPDATE " + database + "." + dbConfig.MBOM_summary_table + " SET jobName = ?, customer = ?, " +
        "boardDesignation = ? WHERE mbomID = ?", [data.jobName, data.customer, data.boardDesignation, qs.mbomID])
        .then(() => {
            res.locals = {title: 'Search MBOM'};
            res.redirect('../searchMBOM/?bomID=' + data.jobNum + data.releaseNum + "_" + qs.mbomID);
        })
        .catch(err => {
            console.log('there was an error:' + err);
        });
};


/***********************************************
 BRK ACC IN BEFORE SAVED IN DB
 ***********************************************/
let brkDataObj;
let brkAccArr = [];
let currentMbomID = '';

exports.addBreakerAcc = function(req, res) {
    req.setTimeout(0); //no timeout
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
        catCode: req.body.catCode
    };

    if (currentMbomID == '') {
        currentMbomID = mbomID;
    }

    if (currentMbomID == mbomID){
        if (req.body.qty != '') {
            let formData = {
                mbomID: mbomID,
                qty: req.body.accQty,
                type: req.body.accType,
                mfg: req.body.accMfg,
                desc: req.body.accDesc,
                pn: req.body.accPN
            };

            brkAccArr.push(formData);
        }
    } else {
        currentMbomID = mbomID;
        brkAccArr = [];

        if (req.body.qty != '') {
            let formData = {
                mbomID: mbomID,
                qty: req.body.accQty,
                type: req.body.accType,
                mfg: req.body.accMfg,
                desc: req.body.accDesc,
                pn: req.body.accPN
            };

            brkAccArr.push(formData);
        }
    }
    res.redirect('searchMBOM/?bomID=' + mbomData.jobNum + mbomData.releaseNum + "_" + mbomID);
};

let editBrkDataObj;

exports.editBreakerAcc = function(req, res){
    req.setTimeout(0); //no timeout
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

    function arrayEdit(arr, value, id) {
        for (let i = 0; i < arr.length; i++) {
            if(i == id) {
                arr[i].qty = value.qty;
                arr[i].type = value.type;
                arr[i].desc = value.desc;
                arr[i].pn = value.pn;
            }
        }
        return arr
    }

    brkAccArr = arrayEdit(brkAccArr, updateAcc, brkAccID);
    res.redirect('../searchMBOM/?bomID=' + jobNum + releaseNum + '_' + mbomID);
};

exports.deleteBreakerAcc = function(req, res){
    req.setTimeout(0); //no timeout
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
        catCode: req.body.catCode
    };
    let pn = req.body.pn;

    function arrayRemove(arr, value) {
        return arr.filter(function(el){
            return el.pn != value;
        });
    }

    brkAccArr = arrayRemove(brkAccArr, pn);

    res.redirect('searchMBOM/?bomID=' + mbomData.jobNum + mbomData.releaseNum + "_" + mbomID);
};

/***********************************************
 BRK ACC FROM EDIT
 ***********************************************/
exports.addBrkAccFromEdit = function(req, res) {
    req.setTimeout(0); //no timeout
    let mbomID = req.body.mbomID;

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


    editBrkDataObj = {
        devDesignation: req.body.editDevDesLimit,
        brkPN: req.body.editBrkPN,
        cradlePN: req.body.editCradlePN,
        devMfg: req.body.editDevMfg,
        catCode: req.body.editDevCatCode
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

    querySql("INSERT INTO " + database + "." + dbConfig.MBOM_brkAcc_table + " SET ?", formData)
        .then(() => {
            return querySql("SELECT * FROM " + database + "." + dbConfig.MBOM_breaker_table + " WHERE idDev = ?", idDev)
        })
        .then(rows => {
            for(let row of rows){
                breakerData.push(row);
            }
            return querySql("SELECT * FROM " + database + "." + dbConfig.MBOM_brkAcc_table + " WHERE idDev = ?", idDev)
        })
        .then(rows => {
            for(let row of rows){
                accData.push(row);
            }
            return null
        })
        .then(() => {
            res.locals = {title: 'Add Breaker Accessory'};
            res.render('MBOM/editBreaker', {
                mbomBrkData: breakerData,
                brkAccData: accData,
                mbomData: mbomData,
                brkData: editBrkDataObj,
            });
        })
        .catch(err => {
            return Promise.reject(err);
        });
};

exports.editBrkAccFromEdit = function(req, res) {
    req.setTimeout(0); //no timeout
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


    editBrkDataObj = {
        devDesignation: req.body.editDevDesLimit,
        brkPN: req.body.editBrkPN,
        cradlePN: req.body.editCradlePN,
        devMfg: req.body.editDevMfg,
        catCode: req.body.editDevCatCode
    };

    let idDev = req.body.idDev;
    let brkAccID = req.body.brkAccID;

    let updateAcc = {
        qty: req.body.editAccQty,
        type: req.body.editAccType,
        desc: req.body.editAccDescLimit,
        pn: req.body.editAccPN
    };

    querySql("UPDATE " + database + "." + dbConfig.MBOM_brkAcc_table + " SET brkAccQty = ?, brkAccType = ?, brkAccDesc = ?, brkAccPN = ? WHERE brkAccID = ? ", [updateAcc.qty, updateAcc.type, updateAcc.desc, updateAcc.pn, brkAccID])
        .then(() => {
            return querySql("SELECT * FROM " + database + "." + dbConfig.MBOM_breaker_table + " WHERE idDev = ?", idDev)
        })
        .then(rows => {
            for(let row of rows){
                breakerData.push(row);
            }
            return querySql("SELECT * FROM " + database + "." + dbConfig.MBOM_brkAcc_table + " WHERE idDev = ?", idDev)
        })
        .then(rows => {
            for(let row of rows){
                accData.push(row);
            }
            return null
        })
        .then(() => {
            res.locals = {title: 'Edit Breaker Accessory'};
            res.render('MBOM/editBreaker', {
                mbomBrkData: breakerData,
                brkAccData: accData,
                mbomData: mbomData,
                brkData: editBrkDataObj
            });
        })
        .catch(err => {
            return Promise.reject(err);
        });
};

exports.deleteBrkAccFromEdit = function(req, res) {
    req.setTimeout(0); //no timeout
    let idDev = req.body.idDev;
    let pn = req.body.pn;

    let breakerData = [];
    let accData = [];
    editBrkDataObj = {
        devDesignation: req.body.devDesignation,
        brkPN: req.body.brkPN,
        cradlePN: req.body.cradlePN,
        devMfg: req.body.devMfg,
        catCode: req.body.catCode
    };
    let mbomData = {
        mbomID: req.body.mbomID,
        jobNum: req.body.jobNum,
        releaseNum: req.body.releaseNum,
        jobName: req.body.jobName,
        customer: req.body.customer,
        boardDesignation: req.body.devLayout
    };


    querySql("DELETE FROM "+ database + "." + dbConfig.MBOM_brkAcc_table + " WHERE idDev = ? AND brkAccPN = ?", [idDev, pn])
        .then(() => {
            return querySql("SELECT * FROM " + database + "." + dbConfig.MBOM_breaker_table + " WHERE idDev = ?", idDev)
        })
        .then(rows => {
            for(let row of rows){
                breakerData.push(row);
            }
            return querySql("SELECT * FROM " + database + "." + dbConfig.MBOM_brkAcc_table + " WHERE idDev = ?", idDev)
        })
        .then(rows => {
            for(let row of rows){
                accData.push(row);
            }
            return null
        })
        .then(() => {
            res.locals = {title: 'Delete Breaker Accessory'};
            res.render('MBOM/editBreaker', {
                mbomBrkData: breakerData,
                brkAccData: accData,
                mbomData: mbomData,
                brkData: editBrkDataObj
            });
        })
        .catch(err => {
            return Promise.reject(err);
        });
};


/***********************************************
 MAIN MBOM VIEW
 ***********************************************/
exports.searchMBOMGet = function(req, res) {
    req.setTimeout(0); //no timeout
    let urlObj = url.parse(req.originalUrl);
    urlObj.protocol = req.protocol;
    urlObj.host = req.get('host');
    let qs = queryString.parse(urlObj.search);
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

    if(brkAccArr.length != 0){
        if(brkAccArr[0].mbomID == mbomID)
            brkAccData = brkAccArr;
    }
    if(brkDataObj)
        brkData = brkDataObj;

    querySql("SELECT * FROM " + database + " . " + dbConfig.MBOM_summary_table + " WHERE mbomID = ?", mbomID)
        .then(rows => {
            mbomData = rows[0];

            return null;
        })
        .then(
            async function(){
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
            return Promise.reject(err);
        });
};


/***********************************************
 COM ITEM TABLE
 ***********************************************/
//CREATE COM ITEMS TABLE GET
exports.createComItemTableGET = function(req, res) {
    req.setTimeout(0); //no timeout
    let comItemData = [];
    let catCodeData = [];
    let classCodeData = [];

    async function f(){
        const comItems = await querySql("SELECT * FROM " + database + "." + dbConfig.MBOM_common_items);
        const catCodes =  await querySql("SELECT catCode FROM " + database + " . " + dbConfig.jobscope_codes_table);
        const classCodes = await querySql("SELECT classCode FROM " + database + "." + dbConfig.jobscope_classCodes_table);

        return {comItems, catCodes, classCodes}
    }

    f().then(({comItems, catCodes, classCodes}) => {
        for(let row of comItems){
            comItemData.push(row);
        }
        for(let row of catCodes){
            catCodeData.push(row);
        }
        for(let row of classCodes) {
            classCodeData.push(row);
        }

        return null;
    })
        .then(() => {
            res.locals = {title: 'Create Com Item'};
            res.render('MBOM/createComItemTable', {
                comItemData: comItemData,
                catCodeData: catCodeData,
                classCodeData: classCodeData
            });
        })
        .catch(err => {
            console.log('there was an error:' + err);
        });
};

//CREATE COM ITEMS TABLE POST
exports.createComItemTablePOST = function(req, res) {
    req.setTimeout(0); //no timeout
    //let exists;
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

    querySql("SELECT * FROM " + database + " . " + dbConfig.MBOM_common_items + " WHERE itemType = ? AND itemMfg = ? " +
        "AND itemDesc = ? AND itemPN = ?", [data.itemType, data.itemMfg, data.itemDesc, data.itemPN])
        .then(rows => {
            /*if(rows.length != 0){
                exists = true;
            } else
                exists = false;*/

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
            console.log('there was an error:' + err);
        });
};

//EDIT COM ITEM TABLE GET
exports.editComItemTableGET = function(req, res) {
    req.setTimeout(0); //no timeout
    let urlObj = url.parse(req.originalUrl);
    urlObj.protocol = req.protocol;
    urlObj.host = req.get('host');
    let qs = queryString.parse(urlObj.search);
    let comItemID = qs.comItemID;
    let editComItemData = {};
    let comItemData = [];
    let catCodeData = [];
    let classCodeData = [];

    async function f(){
        const editComItem = await querySql("SELECT * FROM " + database + "." + dbConfig.MBOM_common_items + " WHERE " +
            "comitemID = ?", comItemID);
        const comItems = await querySql("SELECT * FROM " + database + "." + dbConfig.MBOM_common_items);
        const catCodes =  await querySql("SELECT catCode FROM " + database + " . " + dbConfig.jobscope_codes_table);
        const classCodes = await querySql("SELECT classCode FROM " + database + "." + dbConfig.jobscope_classCodes_table);
        return {editComItem, comItems, catCodes, classCodes}
    }


    f().then(({editComItem, comItems, userProfiles, catCodes, classCodes}) => {
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
        for(let row of comItems){
            comItemData.push(row);
        }
        for(let row of catCodes){
            catCodeData.push(row);
        }
        for (let row of classCodes) {
            classCodeData.push(row);
        }


        return null;
    })
        .then(() => {
            res.locals = {title: 'Edit Item'};
            res.render('MBOM/editComItem', {
                editComItemData: editComItemData,
                comItemData: comItemData,
                catCodeData: catCodeData,
                classCodeData: classCodeData
            });
        })
        .catch(err => {
            console.log('there was an error:' + err);
        });
};

//EDIT COM ITEM TABLE POST
exports.editComItemTablePOST = function(req, res) {
    req.setTimeout(0); //no timeout
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

    querySql("UPDATE " + database + "." + dbConfig.MBOM_common_items + " SET itemType = ?, itemMfg = ?, itemDesc = ?, " +
        "itemPN = ?, unitOfIssue = ?, catCode = ?, class = ? WHERE comItemID = ?", [updateData.itemType, updateData.itemMfg,
        updateData.itemDesc, updateData.itemPN, updateData.unitOfIssue, updateData.catCode, updateData.class, qs.comItemID])
        .then(() => {
            res.locals = {title: 'Edit Common Item'};
            res.redirect('../MBOM');
        })
        .catch(err => {
            console.log('there was an error:' + err);
        });
};


/***********************************************
 COM ITEM IN MBOM
 ***********************************************/
//ADD COM ITEM IN MBOM
exports.addComItem = function(req, res) {
    req.setTimeout(0); //no timeout
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

    querySql("SELECT * FROM " + database + "." + dbConfig.MBOM_common_items + " WHERE itemType = ? AND itemMfg = ? " +
        "AND itemDesc = ? AND itemPN = ?", [data.itemType, data.itemMfg, data.itemDesc, data.itemPN])
        .then(rows => {
            comItemID = rows[0].comItemID;

            let itemSumData = {
                comItemID: comItemID,
                itemSumID: itemSumID,
                mbomID: mbomData.mbomID,
                itemQty: req.body.itemQty,
                shipLoose: shipLooseCheck
            };

            querySql("INSERT INTO " + database + "." + dbConfig.MBOM_item_table + " SET ?", itemSumData);

            return null;
        })
        .then(() => {
            res.locals = {title: 'Add Com Item'};
            res.redirect('searchMBOM/?bomID=' + mbomData.jobNum + mbomData.releaseNum + "_" + mbomData.mbomID);
        })
        .catch(err => {
            console.log('there was an error:' + err);
        });
};

//EDIT COM ITEM IN MBOM
exports.editComItem = function(req, res) {
    req.setTimeout(0); //no timeout
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

    async function f() {
        const comItem = await querySql("SELECT *  FROM " + database + "." + dbConfig.MBOM_common_items);
        const itemSum = await querySql("SELECT * FROM " + database + "." + dbConfig.MBOM_item_table + " WHERE itemSumID = ?", itemSumID);
        const editItem = await querySql("SELECT * FROM " + database + "." + dbConfig.MBOM_common_items + " WHERE comItemID = ?", comItemID);

        return {comItem, itemSum, editItem};
    }

    f().then(({comItem, itemSum, editItem, userProfile}) => {
        for(let row of comItem){
            comItemData.push(row);
        }
        for(let row of itemSum){
            data.push(row);
        }
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
            console.log('there was an error:' + err);
        });
};

//SAVE EDIT COM ITEM IN MBOM POST
exports.editComItemSave = function(req, res) {
    req.setTimeout(0); //no timeout
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

    querySql("SELECT comItemID FROM " + database + "." + dbConfig.MBOM_common_items + " WHERE itemType= ? AND " +
        "itemMfg = ? AND itemDesc = ? AND itemPN = ?", [updateData.itemType, updateData.itemMfg, updateData.itemDesc, updateData.itemPN])
        .then(rows => {
            comItemID = rows[0].comItemID;

            querySql("UPDATE mbomItemSum SET comItemID = ?, itemQty = ?, shipLoose = ? WHERE itemSumID = ?",
                [comItemID, updateData.itemQty, updateData.shipLoose, itemSumID]);

            return null
        })
        .then(() => {
            res.locals = {title: 'Edit Common Item'};
            res.redirect('../searchMBOM/?bomID=' + mbomData.jobNum + mbomData.releaseNum + "_" + mbomData.mbomID);
        })
        .catch(err => {
            console.log('there was an error:' + err);
        });
};


/***********************************************
 USER ITEM IN MBOM
 ***********************************************/
//CREATE USER ITEM IN MBOM
exports.createUserItem = function(req, res) {
    req.setTimeout(0); //no timeout
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

    querySql("SELECT * FROM " + database + "." + dbConfig.MBOM_user_items + " WHERE itemType = ? AND itemMfg = ? " +
        "AND itemDesc = ? AND itemPN = ?", [data.itemType, data.itemMfg, data.itemDesc, data.itemPN])
        .then(rows => {
            if(rows.length != 0 && rows[0].mbomID == data.mbomID){
                userItemID = rows[0].userItemID;
                exists = true;
            } else
                exists = false;

            if (!exists) {
                querySql("INSERT INTO " + database + "." + dbConfig.MBOM_user_items + " SET ?", data)
                    .then(() => {
                        return querySql("SELECT * FROM " + database + "." + dbConfig.MBOM_user_items + " WHERE " +
                            "itemType = ? AND itemMfg = ? AND itemDesc = ? AND itemPN = ? AND mbomID = ?",
                            [data.itemType, data.itemMfg, data.itemDesc, data.itemPN, data.mbomID])
                    })
                    .then(rows => {
                        userItemID = rows[0].userItemID;

                        let itemSumData = {
                            itemSumID: itemSumID,
                            comItemID: null,
                            userItemID: userItemID,
                            mbomID:  data.mbomID,
                            itemQty: req.body.itemQty,
                            shipLoose: shipLooseCheck
                        };

                        querySql("INSERT INTO " + database + "." + dbConfig.MBOM_item_table + " SET ?", itemSumData);

                        return null;
                    })
                    .catch(err => {
                        console.log('there was an error:' + err);
                    });
            } else {
                let itemSumData = {
                    itemSumID: itemSumID,
                    comItemID: null,
                    userItemID: userItemID,
                    mbomID: data.mbomID,
                    itemQty: req.body.itemQty,
                };

                querySql("INSERT INTO " + database + "." + dbConfig.MBOM_item_table + " SET ?", itemSumData);

                return null;
            }

            return null;
        })
        .then(() => {
            res.locals = {title: 'Create User Item'};
            res.redirect('searchMBOM/?bomID=' + mbomData.jobNum + mbomData.releaseNum + "_" + mbomData.mbomID);
        })
        .catch(err => {
            console.log('there was an error:' + err);
        });
};

//EDIT USER ITEM IN MBOM
exports.editUserItem = function(req, res) {
    req.setTimeout(0); //no timeout
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


    async function f() {
        const comItem = await querySql("SELECT *  FROM " + database + "." + dbConfig.MBOM_common_items);
        const itemSum = await querySql("SELECT * FROM " + database + "." + dbConfig.MBOM_item_table + " WHERE itemSumID = ?", qs.itemSumID);
        const userItem = await querySql("SELECT * FROM " + database + "." + dbConfig.MBOM_user_items + " WHERE userItemID = ?", qs.userItemID);
        const catCode = await querySql("SELECT * FROM " + database + "." + dbConfig.jobscope_codes_table);
        const classCode = await querySql("SELECT * FROM " + database + "." + dbConfig.jobscope_classCodes_table);

        return {comItem, itemSum, userItem, catCode, classCode};
    }

    f().then(({comItem, itemSum, userItem, catCode, classCode}) => {
        for(let row of comItem){
            comItemData.push(row);
        }
        for(let row of itemSum){
            data.push(row);
        }
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
        for(let row of catCode){
            catCodeData.push(row);
        }
        for(let row of classCode) {
            classCodeData.push(row);
        }
        return null;
    })
        .then(() => {
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
            console.log('there was an error:' + err);
        });
};

//SAVE EDIT USER ITEM IN MBOM
exports.editUserItemSave = function(req, res) {
    req.setTimeout(0); //no timeout
    let mbomData = {
        mbomID: req.body.mbomID,
        jobNum: req.body.jobNum,
        releaseNum: req.body.releaseNum
    };
    let itemSumID = req.body.itemSumID;
    let userItemID;

    //Get new data start
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

    querySql("SELECT * FROM " + database + "." + dbConfig.MBOM_user_items + " WHERE itemPN = ? AND mbomID = ?",
        [updateData.itemPN, updateData.mbomID])
        .then(rows => {
            if(rows.length > 0){
                userItemID = rows[0].userItemID;

                querySql("UPDATE " + database + "." + dbConfig.MBOM_user_items + " SET itemType = ?, itemMfg = ?, " +
                    "itemDesc = ?, unitOfIssue = ?, catCode = ?, class = ? WHERE itemPN = ? AND mbomID = ?", [updateData.itemType,
                    updateData.itemMfg, updateData.itemDesc, updateData.unitOfIssue, updateData.catCode, updateData.class, updateData.itemPN, updateData.mbomID])
                    .then(() => {
                        querySql("UPDATE " + database + "." + dbConfig.MBOM_item_table + " SET itemQty = ?, shipLoose = ? " +
                            "WHERE itemSumID = ?", [updateData.itemQty, updateData.shipLoose, itemSumID]);

                        return null
                    })
                    .then(() => {
                        querySql("UPDATE " + database + "." + dbConfig.MBOM_item_table + " SET userItemID = ? WHERE " +
                            "itemSumID = ? AND mbomID = ? ", [userItemID, itemSumID, updateData.mbomID]);

                        return null
                    })
                    .catch(err => {
                        console.log('there was an error:' + err);
                    });
            } else {
                querySql("INSERT INTO " + database + "." + dbConfig.MBOM_user_items + " SET itemType = ?, itemMfg = ?, " +
                    "itemDesc = ?, unitOfIssue = ?, catCode = ?, class = ?, itemPN = ?, mbomID = ?", [updateData.itemType,
                    updateData.itemMfg, updateData.itemDesc, updateData.unitOfIssue, updateData.catCode, updateData.class, updateData.itemPN, updateData.mbomID])
                    .then(() => {
                        return querySql("SELECT * FROM " + database + "." + dbConfig.MBOM_user_items + " WHERE itemPN = ? " +
                            "AND mbomID = ?", [updateData.itemPN, updateData.mbomID])
                    })
                    .then(rows => {
                        userItemID = rows[0].userItemID;

                        querySql("UPDATE " + database + "." + dbConfig.MBOM_item_table + " SET userItemID = ?, itemQty = ?, " +
                            "shipLoose = ? WHERE itemSumID = ?", [userItemID, updateData.itemQty, updateData.shipLoose, itemSumID]);

                        return null
                    })
                    .catch(err => {
                        console.log('there was an error:' + err);
                    });
            }

            return null
        })
        .then(() => {
            res.locals = {title: 'Edit User Item'};
            res.redirect('../searchMBOM/?bomID=' + mbomData.jobNum + mbomData.releaseNum + "_" + mbomData.mbomID);
        })
        .catch(err => {
            console.log('there was an error:' + err);
        });
};


/***********************************************
 COM AND USER ITEM IN MBOM
 ***********************************************/
//COPY COM AND USER ITEM IN MBOM
exports.copyItem = function(req, res) {
    req.setTimeout(0); //no timeout
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

    querySql("SELECT * FROM " + database + "." + dbConfig.MBOM_item_table + " WHERE itemSumID = ?", qs.itemSumID)
        .then(rows => {

            itemData = {
                comItemID: rows[0].comItemID,
                userItemID: rows[0].userItemID,
                mbomID: rows[0].mbomID,
                itemQty: rows[0].itemQty,
                shipLoose: rows[0].shipLoose
            };

            querySql("INSERT INTO " + database + "." + dbConfig.MBOM_item_table + " SET ?", itemData);
            return null
        })
        .then(() => {
            res.locals = {title: 'Copy Item'};
            res.redirect('../searchMBOM/?bomID=' + mbomData.jobNum + mbomData.releaseNum + "_" + mbomData.mbomID);
        })
        .catch(err => {
            console.log('there was an error:' + err);
        });
};

//DELETE USER AND COM ITEMS IN MBOM
exports.deleteItem = function(req, res) {
    req.setTimeout(0); //no timeout
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

    querySql("SELECT userItemID FROM " + database + "." + dbConfig.MBOM_item_table + " WHERE itemSumID = ?", qs.itemSumID)
        .then(rows => {
            userItemID = rows[0].userItemID;

            querySql("SELECT * FROM " + database + "." + dbConfig.MBOM_item_table + " WHERE userItemID = ? AND mbomID = ?", [userItemID, mbomData.mbomID])
                .then(rows => {
                    if(rows.length == 1){
                        querySql("DELETE FROM " + database + "." + dbConfig.MBOM_user_items + " WHERE userItemID = ?", userItemID)
                    }
                    return null;
                })
                .catch(err => {
                    console.log('there was an error:' + err);
                });

            querySql("DELETE FROM " + database + "." + dbConfig.MBOM_item_table + " WHERE itemSumID = ?", qs.itemSumID);

            return null;
        })
        .then(() => {
            res.locals = {title: 'Delete Item'};
            res.redirect('../searchMBOM/?bomID=' + mbomData.jobNum + mbomData.releaseNum + "_" + mbomData.mbomID);
        })
        .catch(err => {
            console.log('there was an error:' + err);
        });
};


/***********************************************
 BREAKERS IN MBOM
 ***********************************************/
//CREATE BREAKER IN MBOM
exports.addBrk = function(req, res) {
    req.setTimeout(0); //no timeout
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
    async function f(){
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

    f().then(
        async function (rows) {
            let temp = [];
            for (let row of rows) {
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
                for(let row of rows){
                    for(let el of brkAccData){
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
            res.locals = {title: 'Add Breaker'};
            res.redirect('searchMBOM/?bomID=' + data1.jobNum + data1.releaseNum + "_" + data1.mbomID);

            return null;
        })
        .catch(err => {
            return Promise.reject(err);
        });
};

//COPY BREAKER IN MBOM
exports.copyBreaker = function(req, res) {
    req.setTimeout(0); //no timeout
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

    async function f() {
        const brk = await querySql("SELECT * FROM " + database + "." + dbConfig.MBOM_breaker_table + " WHERE idDev = ?", qs.idDev);
        const accList = await querySql("SELECT * FROM " + database + "." + dbConfig.MBOM_brkAcc_table + " WHERE idDev = ?", qs.idDev);

        return {brk, accList}
    }

    f().then(({brk, accList}) => {
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

        for (let row of accList) {
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
                await querySql("INSERT INTO " + database + " . " + dbConfig.MBOM_breaker_table + " SET ?", breakerData);

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
            res.locals = {title: 'Copy Breaker'};
            res.redirect('../searchMBOM/?bomID=' + mbomData.jobNum + mbomData.releaseNum + "_" + mbomData.mbomID);
        })
        .catch(err => {
            return Promise.reject(err);
        });
};

//EDIT BREAKER IN MBOM
exports.editBreaker = function(req, res) {
    req.setTimeout(0); //no timeout
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


    querySql("SELECT * FROM " + database + "." + dbConfig.MBOM_breaker_table + " WHERE idDev = ?", qs.idDev)
        .then(rows => {
            for(let row of rows){
                breakerData.push(row);
            }
            return querySql("SELECT * FROM " + database + "." + dbConfig.MBOM_brkAcc_table + " WHERE idDev = ?", qs.idDev)
        })
        .then(rows => {
            for(let row of rows){
                accData.push(row);
            }
            return null
        })
        .then(() => {
            res.locals = {title: 'Edit Breaker'};
            res.render('MBOM/editBreaker', {
                mbomBrkData: breakerData,
                brkAccData: accData,
                mbomData: mbomData,
                brkData: brkDataObj
            });
        })
        .catch(err => {
            console.log('there was an error:' + err);
        });
};

//SAVE EDIT BREAKER IN MBOM
exports.editBreakerSave = function(req, res) {
    req.setTimeout(0); //no timeout
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
    querySql("UPDATE " + database + "." + dbConfig.MBOM_breaker_table + " SET mbomID = ?, " +
        " devLayout = ?, devDesignation = ?, unitOfIssue = ?, catCode = ?, class = ?, brkPN = ?, cradlePN = ?, devMfg = ? WHERE idDev = ?", [updateData.mbomID,
        updateData.devLayout, updateData.devDesignation, updateData.unitOfIssue, updateData.catCode, updateData.class, updateData.brkPN, updateData.cradlePN,
        updateData.devMfg, updateData.idDev])
        .then(() => {
            res.locals = {title: 'Copy Breaker'};
            res.redirect('../searchMBOM/?bomID=' + mbomData.jobNum + mbomData.releaseNum + "_" + updateData.mbomID);
        })
        .catch(err => {
            console.log('there was an error:' + err);
        });
};

//DELETE BREAKER IN MBOM
exports.deleteBreaker = function(req, res) {
    req.setTimeout(0); //no timeout
    let urlObj = url.parse(req.originalUrl);
    urlObj.protocol = req.protocol;
    urlObj.host = req.get('host');
    let qs = queryString.parse(urlObj.search);

    let mbomData = {
        mbomID: req.body.mbomID,
        jobNum: req.body.jobNum,
        releaseNum: req.body.releaseNum,
    };

    async function f() {
        await querySql("DELETE FROM " + database + "." + dbConfig.MBOM_breaker_table + " WHERE idDev = ?", qs.idDev);
        await querySql("DELETE FROM " + database + "." + dbConfig.MBOM_brkAcc_table + " WHERE idDev = ?", qs.idDev);

        return null;
    }

    f().then(() => {
        res.locals = {title: 'Delete Breaker'};
        res.redirect('../searchMBOM/?bomID=' + mbomData.jobNum + mbomData.releaseNum + "_" + mbomData.mbomID);
    })
        .catch(err => {
            console.log('there was an error:' + err);
        });
};


/***********************************************
 SECTION CONFIGURE IN MBOM
 ***********************************************/
//ADD SECTION
exports.mbomAddSection = function(req, res) {
    req.setTimeout(0); //no timeout
    let data = {
        jobNum: req.body.jobNum,
        releaseNum: req.body.releaseNum,
    };
    let numSections, mbomID;

    querySql("SELECT * FROM " + database + " . " + dbConfig.MBOM_summary_table + " WHERE jobNum = ? AND releaseNum = ?", [data.jobNum, data.releaseNum])
        .then(rows => {
            numSections = rows[0].numSections + 1;
            mbomID = rows[0].mbomID;

            querySql("UPDATE " + database + "." + dbConfig.MBOM_summary_table + " SET numSections = ? WHERE jobNum = ? AND releaseNum = ?", [numSections, data.jobNum, data.releaseNum]);
            querySql("INSERT INTO " + database + "." + dbConfig.MBOM_new_section_sum + " SET sectionNum = ?, mbomID = ?", [numSections, mbomID]);
            return null;
        })
        .then(() => {
            res.locals = {title: 'Add Section'};
            res.redirect('searchMBOM/?bomID=' + data.jobNum + data.releaseNum + "_" + mbomID);
        })
        .catch(err => {
            console.log('there was an error:' + err);
        });
};

//RESET SECTIONS
exports.mbomResetSection = function(req, res) {
    req.setTimeout(0); //no timeout
    let data = {
        jobNum: req.body.jobNum,
        releaseNum: req.body.releaseNum,
    };
    let numSections = 0;
    let mbomID;

    querySql("SELECT * FROM " + database + " . " + dbConfig.MBOM_summary_table + " WHERE jobNum = ? AND releaseNum = ?", [data.jobNum, data.releaseNum])
        .then(rows => {
            mbomID = rows[0].mbomID;

            querySql("UPDATE " + database + "." + dbConfig.MBOM_summary_table + " SET numSections = ? WHERE jobNum = ? AND releaseNum = ?", [numSections, data.jobNum, data.releaseNum]);
            querySql("DELETE FROM " + database + "." + dbConfig.MBOM_new_section_sum + " WHERE mbomID = ?", mbomID);
            querySql("UPDATE " + database + "." + dbConfig.MBOM_item_table + " SET secID = ? WHERE mbomID = ?", [null, mbomID]);
            querySql("UPDATE " + database + "." + dbConfig.MBOM_breaker_table + " SET secID = ? WHERE mbomID = ?", [null, mbomID]);

            return null;
        })
        .then(() => {
            res.locals = {title: 'Reset Section'};
            res.redirect('searchMBOM/?bomID=' + data.jobNum + data.releaseNum + "_" + mbomID);
        })
        .catch(err => {
            console.log('there was an error:' + err);
        });
};

//DELETE A SECTION
exports.mbomDeleteSection = function(req, res) {
    req.setTimeout(0); //no timeout
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

    querySql("SELECT * FROM " + database + " . " + dbConfig.MBOM_new_section_sum + " WHERE mbomID = ? AND sectionNum = ?", [data.mbomID, selectedSec])
        .then(
            async function(rows){
                const brk = await querySql("SELECT * FROM " + dbConfig.MBOM_breaker_table + " WHERE secID = ?", rows[0].secID);
                const item = await querySql("SELECT * FROM " + dbConfig.MBOM_item_table + " WHERE secID = ?", rows[0].secID);
                return {brk, item};
            })
        .then(({brk, item}) => {
            for(let row of brk){
                brkIDs.push(row.idDev);
            }
            for(let row of item){
                itemIDs.push(row.itemSumID);
            }

            querySql("DELETE FROM " + database + " . " + dbConfig.MBOM_new_section_sum + " WHERE mbomID = ? AND sectionNum = ?", [data.mbomID[0], selectedSec]);

            return null;
        })
        .then(
            async function(){
                for(let row of brkIDs){
                    await querySql("UPDATE " + database + "." + dbConfig.MBOM_breaker_table + " SET secID = ? WHERE idDev = ?", [null, row]);
                }
                for(let row of itemIDs){
                    await querySql("UPDATE " + database + " . " + dbConfig.MBOM_item_table + " SET secID = ? WHERE itemSumID = ?", [null, row]);
                }

                return null;
            }
        )
        .then(() => {
            for(let i = parseInt(selectedSec) + 1; i <= numSections; i++){
                querySql("UPDATE " + database + " . " + dbConfig.MBOM_new_section_sum + " SET sectionNum = ? WHERE mbomID = ? AND sectionNum = ?", [i - 1, data.mbomID[0], i]);
            }

            return null;
        })
        .then(() => {
            querySql("UPDATE " + database + "." + dbConfig.MBOM_summary_table + " SET numSections = ? WHERE mbomID = ?", [(numSections - 1), data.mbomID]);

            return null;
        })
        .then(() => {
            res.locals = {title: 'Delete Section'};
            res.redirect('../searchMBOM/?bomID=' + data.jobNum + data.releaseNum + "_" + data.mbomID);
        })
        .catch(err => {
            console.log('there was an error:' + err);
        });
};

//SAVE CHANGES TO SECTION CONFIGURE
exports.sectionConfigure = function(req, res) {
    req.setTimeout(0); //no timeout
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

    querySql("SELECT jobNum, releaseNum FROM " + database + "." + dbConfig.MBOM_summary_table + " WHERE mbomID = ?", data[0].mbomID)
        .then(rows => {
            jobNum = rows[0].jobNum;
            releaseNum = rows[0].releaseNum;

            return null;
        })
        .then(() => {
            if(data[0].sectionNum != 0) {
                for (let j = 0; j < data.length; j++) {
                    let secData = data[j];
                    querySql("SELECT * FROM " + database + " . " + dbConfig.MBOM_new_section_sum + " WHERE sectionNum = ? AND mbomID = ?", [secData.sectionNum, secData.mbomID])
                        .then(rows => {
                            if(rows.length != 0){
                                if((secData.ID).includes('I')) {
                                    let tempID = (secData.ID).substring(1);
                                    querySql("UPDATE " + database + " . " + dbConfig.MBOM_item_table + " SET secID = ? WHERE itemSumID = ?", [rows[0].secID, tempID]);
                                } else {
                                    let tempID = (secData.ID).substring(1);
                                    querySql("UPDATE " + database + " . " + dbConfig.MBOM_breaker_table + " SET secID = ? WHERE idDev = ?", [rows[0].secID, tempID]);
                                }
                                return null
                            }
                        })
                        .catch(err => {
                            console.log('there was an error:' + err);
                        });
                }
            }
            return null
        })
        .then(() => {
            res.locals = {title: 'Section Configure'};
            res.redirect('searchMBOM/?bomID=' + jobNum + releaseNum + "_" + data[0].mbomID)
        })
        .catch(err => {
            console.log('there was an error:' + err);
        });
};

//GENERATE MBOM
exports.generateMBOM = function (req, res) {
    req.setTimeout(0); //no timeout
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

    let workbook = new Excel.Workbook();
    let sheet = workbook.addWorksheet(mbomData.jobNum + mbomData.releaseNum + ' Jobscope BOM');

    async function getCounter() {
        let currentCount =  await querySql("SELECT mbomCount FROM " + database + "." + dbConfig.script_counter_table+" WHERE idCounter = ?",1);
        return currentCount[0].mbomCount;
    }

    //PROTECT THE SHEET
    async function f(){
        await sheet.protect('password', {selectLockedCells: true, formatColumns: true, formatRows: true});
        return null;
    }
    f()
        .then(async function() {
            let counter = await getCounter();
            await querySql("UPDATE " + database + "." + dbConfig.script_counter_table + " SET mbomCount = ? WHERE idCounter = ?",[counter+1, 1]);
            return null
        })
        .then();

    //FORMAT THE SHEET
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
    ];
    sheet.getRow('1').font = {name: 'Calibri', size: 11, bold: true};

    querySql("SELECT * FROM " + database + " . " + dbConfig.MBOM_summary_table + " WHERE mbomID = ?", mbomData.mbomID)
        .then(rows => {
            for (let row of rows) {
                mbomSumData.push(row);
            }

            return null;
        })
        .then(
            async function() {
                const secSum = await querySql("SELECT * FROM " + database + "." + dbConfig.MBOM_new_section_sum +
                    " WHERE mbomID = ?", mbomData.mbomID);
                const itemSum = await querySql("SELECT * FROM " + database + "." + dbConfig.MBOM_item_table + " WHERE " +
                    "mbomID = ?", mbomData.mbomID);
                const userItems = await querySql("SELECT * FROM " + database + "." + dbConfig.MBOM_user_items + " WHERE " +
                    "mbomID = ?", mbomData.mbomID);
                const comItems = await querySql("SELECT * FROM " + database + "." + dbConfig.MBOM_common_items);
                const brks = await querySql("SELECT * FROM " + database + "." + dbConfig.MBOM_breaker_table + " WHERE " +
                    "mbomID = ?", mbomData.mbomID);
                const brkAcc = await querySql("SELECT * FROM " + database + "." + dbConfig.MBOM_brkAcc_table + " WHERE " +
                    "mbomID = ?", mbomData.mbomID);

                return {secSum, itemSum, userItems, comItems, brks, brkAcc};
            }
        )
        .then(({secSum, itemSum, userItems, comItems, brks, brkAcc}) => {
            for(let row of secSum)
                mbomSecSumData.push(row);
            for(let row of itemSum)
                mbomItemData.push(row);
            for(let row of userItems)
                mbomUserItem.push(row);
            for(let row of comItems)
                mbomComItem.push(row);
            for(let row of brks)
                mbomBrkSum.push(row);
            for(let row of brkAcc)
                mbomBrkAccSum.push(row);

            return null;
        })
        .then(() => {
            mbomSecSumData.sort(function(a,b) {
                let intA = parseInt(a.sectionNum);
                let intB = parseInt(b.sectionNum);
                return intA - intB
            });


            let mbomAssemNumArr = [];
            for (let i = 0; i < mbomSecSumData.length; i++) {
                let sectionNumber;
                if (parseInt(mbomSecSumData[i].sectionNum) < 10 ) {
                    sectionNumber = '10'+ mbomSecSumData[i].sectionNum
                } else {
                    sectionNumber = '1'+mbomSecSumData[i].sectionNum;
                }

                let assemblyNum = mbomData.jobNum + mbomData.releaseNum + '-MBOM-' + sectionNumber;
                mbomAssemNumArr.push(assemblyNum);
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
                    if (row.secID == mbomSecSumData[i].secID) {
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
                                    });
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
                                    });
                                }
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
                    if (row.shipLoose == 'N') {
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
                }

                //FOR BREAKERS
                let brkArr = [];
                let brkAccArr = [];

                for (let row of mbomBrkSum) {
                    if (row.secID == mbomSecSumData[i].secID) {
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
                        })
                    }
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
                        totalBrkQty.filter(e => e.brkPN == brkObj.brkPN)[0].idDev.push(brkObj.idDev[0])
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
                        brkPN =  mbomData.jobNum + mbomData.releaseNum + "-" + partNumCount + "-BRK";
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
                    // FOR BRK ACCESSORIES
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
            }

            //FOR SHIP LOOSE ITEMS
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

            for(let row of mbomItemData){
                if(row.shipLoose == 'Y'){
                    if(row.userItemID != null) {
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
                if(itemPN.length > 20){
                    itemPN = itemPN.slice(0,20);
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

            //MBOM SUMMARY
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
                if(i+1 == mbomAssemNumArr.length){
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
            sheet.getColumn(4).eachCell(function(cell){
                cell.alignment = {wrapText: true};
            });


            workbook.xlsx.writeFile('uploads/' + mbomData.jobNum + mbomData.releaseNum + ' MBOM.xlsx').then(function () {
                const remoteFilePath = 'uploads/';
                const remoteFilename = mbomData.jobNum + mbomData.releaseNum + ' MBOM.xlsx';
                res.download(remoteFilePath + remoteFilename);
            });

            return null;
        })
        .catch(err => {
            console.log('there was an error:' + err);
        });
};