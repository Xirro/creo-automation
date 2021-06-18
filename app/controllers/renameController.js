
const path = require('path');
const fs = require('fs').promises;
const queryString = require('query-string');
const util = require('util');

const _ = require('lodash');
require('deepdash')(_);


const math = require('mathjs');

//Excel Connection
const Excel = require('exceljs');


//DATABASE INFORMATION (TABLE NAMES)
const dbConfig = require('../config/database.js');
const database = dbConfig.database;
const creoDB = database;

//Creoson Connection
const reqPromise = require('request-promise');
let creoHttp = 'http://localhost:9056/creoson';
let sessionId = '';
let connectOptions = {
    method: 'POST',
    uri: creoHttp,
    body: {
        "command": "connection",
        "function": "connect"
    },
    json: true // Automatically stringifies the body to JSON
};

reqPromise(connectOptions)
    .then(reqConnectBody => {
        // get the sessionId
        sessionId = reqConnectBody.sessionId;
        reqPromise({
            method: 'POST',
            uri: creoHttp,
            body: {
                "sessionId": reqConnectBody.sessionId,
                "command": "creo",
                "function": "set_creo_version",
                "data": {
                    "version": "3"
                }
            },
            json: true
        });
    })
    .catch(err => {
        console.log('there was an error:' + err)
    });

function creo(sessionId, functionData) {
    if (functionData.data.length != 0) {
        return reqPromise({
            method: 'POST',
            uri: creoHttp,
            body: {
                "sessionId": sessionId,
                "command": functionData.command,
                "function": functionData.function,
                "data": functionData.data
            },
            json: true
        });
    } else {
        return reqPromise({
            method: 'POST',
            uri: creoHttp,
            body: {
                "sessionId": sessionId,
                "command": functionData.command,
                "function": functionData.function
            },
            json: true
        });
    }
}

//*********************************MECHANICAL ENG. PORTAL*************************************//


const DB = require('../config/db.js');
const querySql = DB.querySql;
const Promise = require('bluebird');

exports = {};
module.exports = exports;

exports.renameMain = function(req, res) {
    let workingDir;
    res.locals = {title: 'Rename Script'};
    res.render('Rename/renameMain', {
        message: null,
        asmList: [],
        workingDir: workingDir
    });
};

exports.renameSetWD = function(req, res) {
    let message = null;
    let workingDir = req.body.CREO_workingDir;
    let topLevelAsmList = [];

    async function cd() {
        let dir = await creo(sessionId, {
            command: "creo",
            function: "pwd",
            data: {}
        });

        if (dir.data != undefined) {
            if (dir.data.dirname != workingDir) {
                await creo(sessionId, {
                    command: "creo",
                    function: "cd",
                    data: {
                        "dirname": workingDir
                    }
                });
            }
        }
        return null
    }

    cd()
        .then(async function() {
            const listAsms = await creo(sessionId, {
                command: "creo",
                function: "list_files",
                data: {
                    "filename":"*asm"
                }
            });

            let asmList = listAsms.data.filelist;
            for (let i = 0; i < asmList.length; i++) {
                if (asmList[i].slice(7,11) == '0000') {
                    await creo(sessionId, {
                        command: "file",
                        function: "open",
                        data: {
                            "file": asmList[i]
                        }
                    });
                    const famTabExists = await creo(sessionId, {
                        command: "familytable",
                        function: "list",
                        data: {
                            "file": asmList[i]
                        }
                    });
                    if (famTabExists.data.instances.length != 0) {
                        topLevelAsmList.push(asmList[i]);
                        for (let j = 0; j < famTabExists.data.instances.length; j++) {
                            topLevelAsmList.push(famTabExists.data.instances[j]+'<'+asmList[i].slice(0,15) +'>'+'.asm')
                        }
                    } else {
                        topLevelAsmList.push(asmList[i])
                    }
                }
            }
            return null;
        })
        .then(() => {
            if (message == null) {
                res.locals = {title: 'Rename Script'};
                res.render('Rename/renameMain', {
                    message: null,
                    workingDir: workingDir,
                    asmList: topLevelAsmList
                });
            } else {
                res.locals = {title: 'Rename Script'};
                res.render('Rename/renameMain', {
                    message: message,
                    workingDir: workingDir,
                    asmList: [],
                });
            }
        })
        .catch(err => {
            console.log(err);
        });
};


exports.loadParts = function(req, res) {
    req.setTimeout(0); //no timeout
    //initialize variables
    let workingDir = req.body.CREO_workingDir;
    let asmCount = req.body.asmCount;
    let asmNames = req.body.asmName;
    let includeArray = req.body.includeInExportCheck;
    let asms = [];
    let parts = [];
    let sortedCheckedDwgs = [];
    let globallyCommonParts = [];
    let partList = [];
    let asmList = [];
    let masterFilteredAsmBom = [];
    let partData = [];
    let asmData = [];



    async function getCounter() {
        let currentCount =  await querySql("SELECT renameCount FROM " + database + "." + dbConfig.script_counter_table+" WHERE idCounter = ?",1);
        return currentCount[0].renameCount;
    }

    async function cd() {
        let dir = await creo(sessionId, {
            command: "creo",
            function: "pwd",
            data: {}
        });

        if (dir.data.dirname != workingDir) {
            await creo(sessionId, {
                command: "creo",
                function: "cd",
                data: {
                    "dirname": workingDir
                }
            })
        }
        return null
    }

    cd()
        .then(async function() {
            let counter = await getCounter();
            await querySql("UPDATE " + database + "." + dbConfig.script_counter_table + " SET renameCount = ? WHERE idCounter = ?",[counter + 1, 1]);
            return null
        })
        .then(() => {
            //create the drawings JSON array from the .drw files in the working directory
            if (asmCount == 1) {
                if (includeArray == 1) {
                    asms.push(asmNames);
                }
            } else {
                for (let i = 0; i < asmCount; i++) {
                    if (includeArray[i] == 1) {
                        asms.push(asmNames[i]);
                    }
                }
            }
        })
        .then(async function () {
            const parts = await creo(sessionId, {
                command: "file",
                function: "list",
                data: {
                    file: "*.prt"
                }
            });

            for (let part of parts.data.files) {
                let partText = part.toString();
                if (partText.slice(0,6) != '999999' && partText.slice(0,6) != '777777' && partText.slice(0,6) != '777999') {
                    partList.push(partText);
                }
            }

            const assemblies = await creo(sessionId, {
                command: "file",
                function: "list",
                data: {
                    file: "*.asm"
                }
            });

            for (let assembly of assemblies.data.files) {
                let assemblyText = assembly.toString();
                if (assemblyText.slice(0,6) != '999999' && assemblyText.slice(0,6) != '777777' && assemblyText.slice(0,6) != '777999') {
                    asmList.push(assemblyText);
                }
            }

        })
        .then(async function() {
            for (let asm of asmList) {
                let doesDwgExist = await creo(sessionId, {
                    command: "creo",
                    function: "list_files",
                    data: {
                        filename: asm.slice(0,15)+".drw"
                    }
                });

                let doesBomDwgExist = await creo(sessionId, {
                    command: "creo",
                    function: "list_files",
                    data: {
                        filename: asm.slice(0,15)+"-bom.drw"
                    }
                });
                if (asm.includes('<') == true) {
                    let asmGeneric = asm.split('<')[1].slice(0,15);
                    let asmInstance = asm.split('<')[0];
                    let asmOffset = parseInt(asmInstance.slice(12,15)) - parseInt(asmGeneric.slice(12,15));

                    if (doesDwgExist.data.filelist.length > 0 && doesBomDwgExist.data.filelist.length > 0) {
                        asmData.push({
                            currentName: asmInstance,
                            currentGeneric: asmGeneric,
                            currentFlatName: null,
                            drawing: 'bom,0',
                            category: null,
                            group: null,
                            offset: asmOffset,
                            message: 'OK'
                        });
                    } else if (doesDwgExist.data.filelist.length > 0 && doesBomDwgExist.data.filelist.length == 0) {
                        asmData.push({
                            currentName: asmInstance,
                            currentGeneric: asmGeneric,
                            currentFlatName: null,
                            drawing: '0',
                            category: null,
                            group: null,
                            offset: asmOffset,
                            message: 'OK'
                        });
                    } else if (doesDwgExist.data.filelist.length == 0 && doesBomDwgExist.data.filelist.length > 0) {
                        asmData.push({
                            currentName: asmInstance,
                            currentGeneric: asmGeneric,
                            currentFlatName: null,
                            drawing: 'bom',
                            category: null,
                            group: null,
                            offset: asmOffset,
                            message: 'OK'
                        });
                    } else {
                        asmData.push({
                            currentName: asmInstance,
                            currentGeneric: asmGeneric,
                            currentFlatName: null,
                            drawing: null,
                            category: null,
                            group: null,
                            offset: asmOffset,
                            message: 'OK'
                        });
                    }
                } else {
                    if (doesDwgExist.data.filelist.length > 0 && doesBomDwgExist.data.filelist.length > 0) {
                        asmData.push({
                            currentName: asm.slice(0,15),
                            currentGeneric: null,
                            currentFlatName: null,
                            drawing: 'bom,0',
                            category: asm.slice(7,11),
                            group: asm.slice(12,15),
                            offset: 0,
                            message: 'OK'
                        });
                    } else if (doesDwgExist.data.filelist.length > 0 && doesBomDwgExist.data.filelist.length == 0) {
                        asmData.push({
                            currentName: asm.slice(0,15),
                            currentGeneric: null,
                            currentFlatName: null,
                            drawing: '0',
                            category: asm.slice(7,11),
                            group: asm.slice(12,15),
                            offset: 0,
                            message: 'OK'
                        });
                    } else if (doesDwgExist.data.filelist.length == 0 && doesBomDwgExist.data.filelist.length > 0) {
                        asmData.push({
                            currentName: asm.slice(0,15),
                            currentGeneric: null,
                            currentFlatName: null,
                            drawing: 'bom',
                            category: asm.slice(7,11),
                            group: asm.slice(12,15),
                            offset: 0,
                            message: 'OK'
                        });
                    } else {
                        asmData.push({
                            currentName: asm.slice(0,15),
                            currentGeneric: null,
                            currentFlatName: null,
                            drawing: null,
                            category: asm.slice(7,11),
                            group: asm.slice(12,15),
                            offset: 0,
                            message: 'OK'
                        });
                    }
                }
            }

            for (let prt of partList) {
                let doesDwgExist = await creo(sessionId, {
                    command: "creo",
                    function: "list_files",
                    data: {
                        filename: prt.slice(0,15)+".drw"
                    }
                });
                //IF PART IS AN INSTANCE
                if (prt.includes('<') == true) {

                    let partGeneric = prt.split('<')[1].slice(0,15);
                    let partInstance = prt.split('<')[0];
                    let partOffset = parseInt(partInstance.slice(12,15)) - parseInt(partGeneric.slice(12,15));

                    //THEN CHECK FAMILY TABLE FOR FLAT
                    let flatInstance = await creo(sessionId, {
                        command: "familytable",
                        function: "list",
                        data: {
                            file: prt
                        }
                    });

                    if (doesDwgExist.data.filelist.length > 0 && flatInstance.data.instances.length > 0) {
                        partData.push({
                            currentName: partInstance,
                            currentGeneric: partGeneric,
                            currentFlatName: flatInstance.data.instances[0],
                            drawing: '0',
                            category: null,
                            group: null,
                            offset: partOffset,
                            message: 'OK'
                        });
                    } else if (doesDwgExist.data.filelist.length > 0 && flatInstance.data.instances.length == 0) {
                        partData.push({
                            currentName: partInstance,
                            currentGeneric: partGeneric,
                            currentFlatName: null,
                            drawing: '0',
                            category: null,
                            group: null,
                            offset: partOffset,
                            message: 'OK'
                        });
                    } else if (doesDwgExist.data.filelist.length == 0 && flatInstance.data.instances.length > 0) {
                        partData.push({
                            currentName: partInstance,
                            currentGeneric: partGeneric,
                            currentFlatName: flatInstance.data.instances[0],
                            drawing: null,
                            category: null,
                            group: null,
                            offset: partOffset,
                            message: 'OK'
                        });
                    } else {
                        partData.push({
                            currentName: partInstance,
                            currentGeneric: partGeneric,
                            currentFlatName: null,
                            drawing: null,
                            category: null,
                            group: null,
                            offset: partOffset,
                            message: 'OK'
                        });
                    }
                } else {
                    if (doesDwgExist.data.filelist.length > 0) {
                        partData.push({
                            currentName: prt.slice(0,15),
                            currentGeneric: null,
                            currentFlatName: null,
                            drawing: '0',
                            category: prt.slice(7,11),
                            group: prt.slice(12,15),
                            offset: 0,
                            message: 'OK'
                        });
                    } else {
                        partData.push({
                            currentName: prt.slice(0,15),
                            currentGeneric: null,
                            currentFlatName: null,
                            drawing: null,
                            category: prt.slice(7,11),
                            group: prt.slice(12,15),
                            offset: 0,
                            message: 'OK'
                        });
                    }
                }
            }
            asmData.sort(function(a,b) {
                let intA = parseInt(a.currentName.slice(7,11) + a.currentName.slice(12,15));
                let intB = parseInt(b.currentName.slice(7,11) + b.currentName.slice(12,15));
                return intA - intB
            });
            partData.sort(function(a,b) {
                let intA = parseInt(a.currentName.slice(7,11) + a.currentName.slice(12,15));
                let intB = parseInt(b.currentName.slice(7,11) + b.currentName.slice(12,15));
                return intA - intB
            });

            let count = 0;

            for (let i = 0; i < asmData.length; i++) {
                if (asmData[i].category == null && asmData[i].group == null) {
                    let foundParent = false;
                    for (let j = i; j >= 0 && j < count; j--) {
                        if (foundParent == false) {
                            if (asmData[j].category != null) {
                                console.log(asmData[j].category);
                                console.log(asmData[j].group);
                                asmData[i].category = asmData[j].category;
                                asmData[i].group = asmData[j].group;
                                foundParent = true;
                            }
                        }

                    }

                }
                count++
            }

            //console.log(partData);
            //console.log(asmData);
            return null
        })
        .then(async function() {
            for (let asm of asms) {
                await creo(sessionId, {
                    command: "file",
                    function: "open",
                    data: {
                        file: asm,
                        display: true,
                        activate: true,
                        new_window: true
                    }
                });

                let asmBom = await creo(sessionId, {
                    command: "bom",
                    function: "get_paths",
                    data: {
                        file: asm
                    }
                });

                let filteredAsmBom = _.filterDeep(asmBom, (value, key) => {
                    if (key == 'file' && value.slice(0,6) != '999999' && value.slice(0,6) != '777777' && value.slice(0,6) != '777999') return true;
                });

                masterFilteredAsmBom.push(filteredAsmBom);
            }
            return null
        })
        .then(async function() {

            async function asmToPartWithParents(arr, parts, parent) {
                for (let i = 0; i < arr.length; i++) {
                    if (!arr[i].children) {
                        if (parts.filter(e => e.part === arr[i].file).length > 0) {
                            parts.filter(e => e.part === arr[i].file)[0].qty += 1;
                            if (parts.filter(e => e.part === arr[i].file)[0].parent.includes(parent) == false) {
                                parts.filter(e => e.part === arr[i].file)[0].parent.push(parent);
                            }
                        } else {
                            parts.push({
                                part: arr[i].file,
                                qty: 1,
                                parent: [parent]
                            })
                        }
                    } else {
                        await asmToPartWithParents(arr[i].children, parts, arr[i].file);
                    }
                }
                return null
            }

            for (let bom of masterFilteredAsmBom) {
                let asmChildren = bom.data.children.children;
                await asmToPartWithParents(asmChildren, parts, null);
            }
            await fs.writeFile('asmBom.txt', util.inspect(masterFilteredAsmBom, {showHidden: false, depth: null, maxArrayLength: null}));
            return null
        })
        .then(() => {
            res.locals = {title: 'Rename Script'};
            res.render('Rename/loadParts', {
                message: null,
                workingDir: workingDir,
                asmList: asms,
                partData: partData,
                asmData: asmData
            });
        })
        .catch(err => {
            console.log(err);
        });
};


exports.rename = function(req, res) {

};