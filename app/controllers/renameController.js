
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
                    "version": "7"
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
    //let parts = [];
    //let sortedCheckedDwgs = [];
    //let globallyCommonParts = [];
    let partList = [];
    let asmList = [];
    //let masterFilteredAsmBom = [];
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

          /*  //LISTS ONLY THE PARTS/ASMS THAT ARE BEING USED
            for (let asm of asms) {
                await creo(sessionId, {
                    command: "file",
                    function: "open",
                    data: {
                        file: asm + ".asm"
                    }
                });
                let bomGetPath = await creo(sessionId, {
                    command: "bom",
                    function: "get_paths",
                    data: {
                        file: asm + ".asm"
                    }
                })
            }*/
            //LISTS ALL PARTS/ASMS IN THE WORKING DIRECTORY
            const parts = await creo(sessionId, {
                command: "creo",
                function: "list_files",
                data: {
                    filename: "*prt"
                }

            });

            const assemblies = await creo(sessionId, {
                command: "creo",
                function: "list_files",
                data: {
                    filename: "*.asm"
                }
            });
            let partsData = parts.data.filelist;
            let assembliesData = assemblies.data.filelist;

            for (let part of partsData) {
                if (part.includes('<') == false) {
                    let partText = part.toString();
                    if (partText.slice(0,6) != '999999' && partText.slice(0,6) != '777777' && partText.slice(0,6) != '777999') {
                        partList.push(partText)
                    }
                    await creo(sessionId, {
                        command: "file",
                        function: "open",
                        data: {
                            file: part,
                            display: true,
                            activate: true
                        }
                    });
                    let instances = await creo(sessionId, {
                        command: "familytable",
                        function: "list",
                        data: {
                            file: part
                        }
                    });

                    if (instances.data.instances.length > 0) {
                        for (let instance of instances.data.instances) {
                            let instanceText = instance.toString();
                            if (instanceText.slice(0,6) != '999999' && instanceText.slice(0,6) != '777777' && instanceText.slice(0,6) != '777999') {
                                partList.push(instanceText+"<"+partText.slice(0,15)+">.prt");
                            }
                        }
                    }

                }
            }
            for (let assembly of assembliesData) {
                if (assembly.includes('<') == false) {
                    let assemblyText = assembly.toString();
                    if (assemblyText.slice(0,6) != '999999' && assemblyText.slice(0,6) != '777777' && assemblyText.slice(0,6) != '777999') {
                        asmList.push(assemblyText);
                    }
                    await creo(sessionId, {
                        command: "file",
                        function: "open",
                        data: {
                            file: assembly,
                            display: true,
                            activate: true
                        }
                    });
                    let instances = await creo(sessionId, {
                        command: "familytable",
                        function: "list",
                        data: {
                            file: assembly
                        }
                    });

                    if (instances.data.instances.length > 0) {
                        for (let instance of instances.data.instances) {
                            let instanceText = instance.toString();
                            if (instanceText.slice(0,6) != '999999' && instanceText.slice(0,6) != '777777' && instanceText.slice(0,6) != '777999') {
                                asmList.push(instanceText+"<"+assemblyText.slice(0,15)+">.asm");
                            }
                        }
                    }
                }
            }
            return null
        })
        .then(async function() {
            for (let asm of asmList) {
                if (asm.includes('<') == true) {
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

            asmData.sort(function(a,b) {
                let intA = parseInt(a.currentName.slice(7,11) + a.currentName.slice(12,15));
                let intB = parseInt(b.currentName.slice(7,11) + b.currentName.slice(12,15));
                return intA - intB
            });

            for (let prt of partList) {
                if (prt.includes('<') == true) {
                    await creo(sessionId, {
                        command: "file",
                        function: "open",
                        data: {
                            file: prt.slice(0,15)+".prt",
                            generic: prt.slice(16,31),
                            display: true,
                            activate: true
                        }
                    });
                } else {
                    await creo(sessionId, {
                        command: "file",
                        function: "open",
                        data: {
                            file: prt,
                            display: true,
                            activate: true
                        }
                    });
                }

                let doesDwgExist = await creo(sessionId, {
                    command: "creo",
                    function: "list_files",
                    data: {
                        filename: prt.slice(0,15)+".drw"
                    }
                });
                console.log(prt);
                //IF PART IS AN INSTANCE
                if (prt.includes('<') == true) {

                    if (prt.includes('FLAT') == true) {
                        let partGeneric = prt.split('<')[1].slice(0,15);
                        let partInstance = null;
                        let partOffset = '0';
                        let flatInstance = prt.split('<')[0];

                        partData.push({
                            currentName: partGeneric,
                            currentGeneric: null,
                            currentFlatName: flatInstance,
                            drawing: null,
                            category: partGeneric.slice(7,11),
                            group: partGeneric.slice(12,15),
                            offset: partOffset,
                            message: 'OK'
                        });

                    } else if (prt.includes('INST') == true) {

                    } else {
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
                    }
                } else {

                    let flatInstance = await creo(sessionId, {
                        command: "familytable",
                        function: "list",
                        data: {
                            file: prt
                        }
                    });


                    if (doesDwgExist.data.filelist.length > 0 && flatInstance.data.instances.length > 0) {
                        partData.push({
                            currentName: prt.slice(0,15),
                            currentGeneric: null,
                            currentFlatName: flatInstance.data.instances[0],
                            drawing: '0',
                            category: prt.slice(7,11),
                            group: prt.slice(12,15),
                            offset: 0,
                            message: 'OK'
                        });


                    } else if (doesDwgExist.data.filelist.length > 0 && flatInstance.data.instances.length == 0) {
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
                    } else if (doesDwgExist.data.filelist.length == 0 && flatInstance.data.instances.length > 0) {
                        partData.push({
                            currentName: prt.slice(0,15),
                            currentGeneric: null,
                            currentFlatName: flatInstance.data.instances[0],
                            drawing: null,
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

            partData.sort(function(a,b) {
                let intA = parseInt(a.currentName.slice(7,11) + a.currentName.slice(12,15));
                let intB = parseInt(b.currentName.slice(7,11) + b.currentName.slice(12,15));
                return intA - intB
            });

            let count = 0;

            //what is this for
            for (let i = 0; i < asmData.length; i++) {
                if (asmData[i].category == null && asmData[i].group == null) {
                    let foundParent = false;
                    for (let j = i; j >= 0 && j < count; j--) {
                        if (foundParent == false) {
                            if (asmData[j].category != null) {
                                asmData[i].category = asmData[j].category;
                                asmData[i].group = asmData[j].group;
                                foundParent = true;
                            }
                        }

                    }

                }
                count++
            }



            /*for (let asm of asms) {
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
            }*/
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

    req.setTimeout(0); //no timeout
    //initialize variables
    let workingDir = req.body.CREO_workingDir;
    let asmName = req.body.asmName;
    let asmCount = req.body.renameAsmCount;
    let partCount = req.body.renamePartCount;
    let paramList = {
        CUSTOMER_NAME: req.body.CUSTOMER_NAME,
        PROJECT_NAME: req.body.PROJECT_NAME,
        PROJECT_NUMBER: req.body.PROJECT_NUMBER ,
        PROJECT_DESC_1: req.body.PROJECT_DESC_1 ,
        PROJECT_DESC_2: req.body.PROJECT_DESC_2 ,
        DESIGNED_BY: req.body.DESIGNED_BY ,
        DESIGNED_DATE: req.body.DESIGNED_DATE ,
        DRAWN_BY: req.body.DRAWN_BY ,
        DRAWN_DATE: req.body.DRAWN_DATE ,
        CHECKED_BY: req.body.CHECKED_BY ,
        CHECKED_DATE: req.body.CHECKED_DATE ,
        APPROVED_NO: req.body.APPROVED_NO ,
        APPROVED_BY: req.body.APPROVED_BY ,
        APPROVED_DESC: req.body.APPROVED_DESC ,
        APPROVED_DATE: req.body.APPROVED_DATE ,
        REV_1_NO: req.body.REV_1_NO ,
        REV_1_BY: req.body.REV_1_BY ,
        REV_1_DESC: req.body.REV_1_DESC ,
        REV_1_DATE: req.body.REV_1_DATE ,
    };

    let renameAsmData = [];
    let renamePartData = [];
    let masterFilteredAsmBom = [];
    let partData = [];
    let asmData = [];
    let asms = [];
    let parts = [];

    for (let i = 0; i < asmCount; i++) {
        let id = (i+1).toString();
        renameAsmData.push({
            currentName: req.body['currentNameAsm_' + id],
            newName: req.body['newNameAsm_' + id],
            drawing: req.body['drawingAsm_' + id]
        });
    }

    for (let i = 0; i < partCount; i++) {
        let id = (i+1).toString();
        renamePartData.push({
            currentName: req.body['currentNamePart_' + id],
            currentFlatName: req.body['currentFlatNamePart_' + id],
            newName: req.body['newNamePart_' + id],
            newFlatName: req.body['newFlatNamePart_' + id],
            drawing: req.body['drawingPart_' + id]
        });
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

    async function getAllCreoData() {
        let asmList = await creo(sessionId, {
            command: "creo",
            function: "list_files",
            data: {
                filename: "*asm"
            }
        });

        for (let asm of asmList.data.filelist) {
            asms.push(asm)
        }

        let partList = await creo(sessionId, {
            command: "creo",
            function: "list_files",
            data: {
                filename: "*prt"
            }
        });

        for (let part of partList.data.filelist) {
            parts.push(part)
        }

        return null
    }

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


    cd()
    /*.then(async function() {
            if (Array.isArray(asmName) == true) {
                for (let name of asmName) {
                    await creo(sessionId, {
                        command: "file",
                        function: "open",
                        data: {
                            file: name,
                            display: true,
                            activate: true,
                            new_window: true
                        }
                    });
                    let asmBom = await creo(sessionId, {
                        command: "bom",
                        function: "get_paths",
                        data: {
                            file: name
                        }
                    });
                }
            } else {
                await creo(sessionId, {
                    command: "file",
                    function: "open",
                    data: {
                        file: asmName,
                        display: true,
                        activate: true,
                        new_window: true
                    }
                });
                let asmBom = await creo(sessionId, {
                    command: "bom",
                    function: "get_paths",
                    data: {
                        file: asmName
                    }
                });
                let filteredAsmBom = _.filterDeep(asmBom, (value, key) => {
                    if (key == 'file' && value.slice(0,6) != '999999' && value.slice(0,6) != '777777' && value.slice(0,6) != '777999') return true;
                });
                masterFilteredAsmBom.push(filteredAsmBom);
            }

            for (let bom of masterFilteredAsmBom) {
                let asmChildren = bom.data.children.children;
                await asmToPartWithParents(asmChildren, [], null);
            }

            await fs.writeFile('asmBom.txt', util.inspect(masterFilteredAsmBom, {showHidden: false, depth: null, maxArrayLength: null}));
            return null
        })*/
        .then(async function() {
            await getAllCreoData();
            //FAMILY TABLE CHECK
            for (let part of parts) {
                await creo(sessionId, {
                    command: "file",
                    function: "open",
                    data: {
                        file: part,
                        display: true,
                        activate: true
                    }
                });

                for (let param in paramList) {
                    await creo(sessionId, {
                        command: "parameter",
                        function: "set",
                        data: {
                            file: part,
                            name: param,
                            type: "STRING",
                            value: paramList[param]
                        }
                    })
                }

                await creo(sessionId, {
                    command: "file",
                    function: "save",
                    data: {
                        file: part
                    }
                });


                let instances = await creo(sessionId, {
                    command: "file",
                    function: "list_instances",
                    data: {
                        file: part
                    }
                });

                partData.push({
                    generic: part,
                    instances:[]
                });


                if (instances.data.files.length > 0) {
                    for (let instance of instances.data.files) {
                        partData.filter(e => e.generic == part)[0].instances.push(instance);
                    }
                }
            }
            for (let asm of asms) {
                await creo(sessionId, {
                    command: "file",
                    function: "open",
                    data: {
                        file: asm,
                        display: true,
                        activate: true
                    }
                });

                for (let param in paramList) {
                    await creo(sessionId, {
                        command: "parameter",
                        function: "set",
                        data: {
                            file: asm,
                            name: param,
                            type: "STRING",
                            value: paramList[param]
                        }
                    })
                }
                await creo(sessionId, {
                    command: "file",
                    function: "save",
                    data: {
                        file: asm
                    }
                });

                let instances = await creo(sessionId, {
                    command: "file",
                    function: "list_instances",
                    data: {
                        file: asm
                    }
                });
                asmData.push({
                    generic: asm,
                    instances:[]
                });

                if (instances.data.files.length > 0) {
                    for (let instance of instances.data.files) {
                        asmData.filter(e => e.generic == asm)[0].instances.push(instance);
                    }
                }
            }
        })
        .then(async function () {
            //MAIN RENAME LOOP
            /*console.log(renamePartData);
            console.log(renameAsmData);
            console.log(partData);*/
            for (let i = 0; i < asmData.length; i++) {

                if (i == 0) {
                    await creo(sessionId, {
                        command: "file",
                        function: "open",
                        data: {
                            file: asmData[i].generic,
                            display: true,
                            activate: true,
                            new_window: true
                        }
                    });
                } else {
                    await creo(sessionId, {
                        command: "file",
                        function: "open",
                        data: {
                            file: asmData[i].generic,
                            display: true,
                            activate: true
                        }
                    });
                }

                let renameData = renameAsmData.filter(e => e.currentName == asmData[i].generic.slice(0,15))[0];
                let newName = renameData.newName;
                if (renameData.drawing == '0') {
                    await creo(sessionId, {
                        command: "file",
                        function: "open",
                        data: {
                            file: renameData.currentName+".drw",
                            display: true,
                            activate: true,
                            new_window: true
                        }
                    });
                    await creo(sessionId, {
                        command: "file",
                        function: "rename",
                        data: {
                            file: renameData.currentName+".drw",
                            new_name: newName + ".drw",
                            onlysession: false
                        }
                    });
                    await creo(sessionId, {
                        command: "file",
                        function: "save",
                        data: {
                            file: newName + ".drw"
                        }
                    });
                    await creo(sessionId, {
                        command: "file",
                        function: "close_window",
                        data: {
                            file: newName + ".drw"
                        }
                    });
                } else if (renameData.drawing == 'bom,0') {
                    await creo(sessionId, {
                        command: "file",
                        function: "open",
                        data: {
                            file: renameData.currentName+"-bom.drw",
                            display: true,
                            activate: true,
                            new_window: true
                        }
                    });
                    await creo(sessionId, {
                        command: "file",
                        function: "rename",
                        data: {
                            file: renameData.currentName+"-bom.drw",
                            new_name: newName + "-bom.drw",
                            onlysession: false
                        }
                    });
                    await creo(sessionId, {
                        command: "file",
                        function: "save",
                        data: {
                            file: newName + "-bom.drw"
                        }
                    });
                    await creo(sessionId, {
                        command: "file",
                        function: "close_window",
                        data: {
                            file: newName + "-bom.drw"
                        }
                    });
                    await creo(sessionId, {
                        command: "file",
                        function: "open",
                        data: {
                            file: renameData.currentName+".drw",
                            display: true,
                            activate: true,
                            new_window: true
                        }
                    });
                    await creo(sessionId, {
                        command: "file",
                        function: "rename",
                        data: {
                            file: renameData.currentName+".drw",
                            new_name: newName + ".drw",
                            onlysession: false
                        }
                    });
                    await creo(sessionId, {
                        command: "file",
                        function: "save",
                        data: {
                            file: newName + ".drw"
                        }
                    });
                    await creo(sessionId, {
                        command: "file",
                        function: "close_window",
                        data: {
                            file: newName + ".drw"
                        }
                    });
                }

                await creo(sessionId, {
                    command: "file",
                    function: "rename",
                    data: {
                        file: asmData[i].generic,
                        new_name: newName + ".asm",
                        onlysession: false
                    }
                });

                for (let instance of asmData[i].instances) {
                    await creo(sessionId, {
                        command: "file",
                        function: "open",
                        data: {
                            file: instance,
                            display: true,
                            activate: true
                            //new_window: true
                        }
                    });

                    let renameData = renameAsmData.filter(e => e.currentName == instance.slice(0,15))[0];
                    let newInstanceName = renameData.newName;
                    if (renameData.drawing == '0') {
                        await creo(sessionId, {
                            command: "file",
                            function: "open",
                            data: {
                                file: renameData.currentName+".drw",
                                display: true,
                                activate: true,
                                new_window: true
                            }
                        });
                        await creo(sessionId, {
                            command: "file",
                            function: "rename",
                            data: {
                                file: renameData.currentName+".drw",
                                new_name: newInstanceName + ".drw",
                                onlysession: false
                            }
                        });
                        await creo(sessionId, {
                            command: "file",
                            function: "save",
                            data: {
                                file: newInstanceName + ".drw"
                            }
                        });
                        await creo(sessionId, {
                            command: "file",
                            function: "close_window",
                            data: {
                                file: newInstanceName+".drw"
                            }
                        });
                    } else if (renameData.drawing == 'bom,0') {
                        await creo(sessionId, {
                            command: "file",
                            function: "open",
                            data: {
                                file: renameData.currentName+"-bom.drw",
                                display: true,
                                activate: true,
                                new_window: true
                            }
                        });
                        await creo(sessionId, {
                            command: "file",
                            function: "rename",
                            data: {
                                file: renameData.currentName+"-bom.drw",
                                new_name: newInstanceName + "-bom.drw",
                                onlysession: false
                            }
                        });
                        await creo(sessionId, {
                            command: "file",
                            function: "save",
                            data: {
                                file: newInstanceName + "-bom.drw"
                            }
                        });

                        await creo(sessionId, {
                            command: "file",
                            function: "close_window",
                            data: {
                                file: newInstanceName+"-bom.drw"
                            }
                        });
                        await creo(sessionId, {
                            command: "file",
                            function: "open",
                            data: {
                                file: renameData.currentName+".drw",
                                display: true,
                                activate: true,
                                new_window: true
                            }
                        });
                        await creo(sessionId, {
                            command: "file",
                            function: "rename",
                            data: {
                                file: renameData.currentName+".drw",
                                new_name: newInstanceName + ".drw",
                                onlysession: false
                            }
                        });
                        await creo(sessionId, {
                            command: "file",
                            function: "save",
                            data: {
                                file: newInstanceName + ".drw"
                            }
                        });
                        await creo(sessionId, {
                            command: "file",
                            function: "close_window",
                            data: {
                                file: newInstanceName+".drw"
                            }
                        });
                    }

                    await creo(sessionId, {
                        command: "file",
                        function: "rename",
                        data: {
                            file: instance,
                            new_name: newInstanceName + ".asm",
                            onlysession: false
                        }
                    });

                    await creo(sessionId, {
                        command: "file",
                        function: "save",
                        data: {
                            file: newInstanceName + ".asm"
                        }
                    });

                    await creo(sessionId, {
                        command: "file",
                        function: "close_window",
                        data: {
                            file: newInstanceName + ".asm",
                        }
                    });
                }
                await creo(sessionId, {
                    command: "file",
                    function: "save",
                    data: {
                        file: asmData[i].generic
                    }
                });
                await creo(sessionId, {
                    command: "file",
                    function: "close_window",
                    data: {
                        file: asmData[i].generic,
                    }
                });
            }

            for (let i = 0; i < partData.length; i++) {
                if (i == 0) {
                    await creo(sessionId, {
                        command: "file",
                        function: "open",
                        data: {
                            file: partData[i].generic,
                            display: true,
                            activate: true,
                            new_window:true
                        }
                    });
                } else {
                    await creo(sessionId, {
                        command: "file",
                        function: "open",
                        data: {
                            file: partData[i].generic,
                            display: true,
                            activate: true
                        }
                    });
                }

                let renameData = renamePartData.filter(e => e.currentName == partData[i].generic.slice(0,15))[0];
                let newName = renameData.newName;

                if (renameData.drawing == '0') {
                    await creo(sessionId, {
                        command: "file",
                        function: "open",
                        data: {
                            file: renameData.currentName+".drw",
                            display: true,
                            activate: true
                            //new_window: true
                        }
                    });
                    await creo(sessionId, {
                        command: "file",
                        function: "rename",
                        data: {
                            file: renameData.currentName + ".drw",
                            new_name: newName + ".drw",
                            onlysession: false
                        }
                    });
                    await creo(sessionId, {
                        command: "file",
                        function: "save",
                        data: {
                            file: newName + ".drw"
                        }
                    });
                    await creo(sessionId, {
                        command: "file",
                        function: "close_window",
                        data: {
                            file: newName + ".drw"
                        }
                    });
                }

                for (let instance of partData[i].instances) {
                    await creo(sessionId, {
                        command: "file",
                        function: "open",
                        data: {
                            file: instance,
                            display: true,
                            activate: true
                            //new_window: true
                        }
                    });

                    let renameData = renamePartData.filter(e => e.currentName == instance.slice(0,15))[0];
                    let newInstanceName = renameData.newName;
                    let newFlatName = renameData.newFlatName;
                    if (renameData.drawing == '0') {

                        await creo(sessionId, {
                            command: "file",
                            function: "open",
                            data: {
                                file: instance.slice(0,15)+".drw",
                                display: true,
                                activate: true,
                                new_window: true
                            }
                        });

                        await creo(sessionId, {
                            command: "file",
                            function: "rename",
                            data: {
                                file: instance.slice(0,15) + ".drw",
                                new_name: newInstanceName + ".drw",
                                onlysession: false
                            }
                        });

                        await creo(sessionId, {
                            command: "file",
                            function: "save",
                            data: {
                                file: newInstanceName + ".drw"
                            }
                        });
                        await creo(sessionId, {
                            command: "file",
                            function: "close_window",
                            data: {
                                file: newInstanceName+".drw"
                            }
                        });
                    }

                    await creo(sessionId, {
                        command: "file",
                        function: "rename",
                        data: {
                            file: instance,
                            new_name: newInstanceName + ".prt"
                        }
                    });

                    if (newFlatName != '') {
                        await creo(sessionId, {
                            command: "file",
                            function: "open",
                            data: {
                                file: renameData.currentFlatName + ".prt"
                            }
                        });
                        await creo(sessionId, {
                            command: "file",
                            function: "rename",
                            data: {
                                file: renameData.currentFlatName + ".prt",
                                new_name: newFlatName + ".prt",
                                onlysession: false
                            }
                        });
                        await creo(sessionId, {
                            command: "file",
                            function: "close_window",
                            data: {
                                file: newFlatName + ".prt"
                            }
                        });
                    }


                    await creo(sessionId, {
                        command: "file",
                        function: "save",
                        data: {
                            file: newInstanceName + ".prt"
                        }
                    });

                    await creo(sessionId, {
                        command: "file",
                        function: "close_window",
                        data: {
                            new_name: newInstanceName + ".prt"
                        }
                    });
                }

                await creo(sessionId, {
                    command: "file",
                    function: "rename",
                    data: {
                        file: partData[i].generic,
                        new_name: newName + ".prt",
                        onlysession: false
                    }
                });

                await creo(sessionId, {
                    command: "file",
                    function: "save",
                    data: {
                        file: partData[i].generic
                    }
                });
                await creo(sessionId, {
                    command: "file",
                    function: "close_window",
                    data: {
                        file: partData[i].generic,
                    }
                });
            }

            for (let asm of asmName) {
                if (asm.includes('<') == true) {
                    await creo(sessionId, {
                        command: "file",
                        function: "open",
                        data: {
                            file: asm.split('<')[0] + ".asm",
                            generic: asm.split('<')[1].slice(0,15),
                            display: true,
                            activate: true,
                            new_window: true
                        }
                    });

                    await creo(sessionId, {
                        command: "file",
                        function: "save",
                        data: {
                            file: asm
                        }
                    });

                } else {
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

                    await creo(sessionId, {
                        command: "file",
                        function: "save",
                        data: {
                            file: asm
                        }
                    });

                }
            }

            const drawings = await creo(sessionId, {
                command: "creo",
                function: "list_files",
                data: {
                    filename: "*drw"
                }
            });

            for (let drawing of drawings.data.filelist) {
                await creo(sessionId, {
                    command: "file",
                    function: "open",
                    data: {
                        file: drawing,
                        display: true,
                        activate: true
                    }
                });
                await creo(sessionId, {
                    command: "file",
                    function: "save",
                    data: {
                        file: drawing
                    }
                });
            }


        })
        .then(() => {
            res.locals = {title: 'Rename Script'};
            res.render('Rename/loadParts', {
                message: null,
                workingDir: workingDir,
                asmList: [],
                partData: [],
                asmData: []
            });
        })
};