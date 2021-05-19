
const path = require('path');
const fs = require('fs').promises;
const queryString = require('query-string');


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

    async function cdAndCreateOutputDir() {
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

    cdAndCreateOutputDir()
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
    let lineups = [];
    let partsList = [];
    let sortedCheckedDwgs = [];
    let globallyCommonParts = [];

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

    function asmToPart(arr, parts) {
        for (let item of arr) {
            if (!item.children) {
                if (parts.filter(e => e.part === item.file).length > 0) {
                    parts.filter(e => e.part === item.file)[0].qty += 1;
                } else {
                    parts.push({
                        part: item.file,
                        qty: 1
                    })
                }
            } else {
                asmToPart(item.children, parts)
            }
        }
        return parts
    }

    cd()
        .then(async function() {
            let counter = await getCounter();
            await querySql("UPDATE " + database + "." + dbConfig.script_counter_table + " SET renameCount = ? WHERE idCounter = ?",[counter+1, 1]);
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
            for (let asm of asms) {
                const isAsmOpen = await creo(sessionId, {
                    command: "file",
                    function: "is_active",
                    data: {
                        "file": asm
                    }
                });
                if (isAsmOpen.data.active != true) {
                    await creo(sessionId, {
                        command: "file",
                        function: "open",
                        data: {
                            "file": asm,
                            "display": true,
                            "activate": true
                        }
                    });
                    await creo(sessionId, {
                        command: "file",
                        function: "regenerate",
                        data: {
                            "file": asm
                        }
                    })
                } else {
                    await creo(sessionId, {
                        command: "file",
                        function: "regenerate",
                        data: {
                            "file": asm
                        }
                    })
                }
                const hierarchy = await creo(sessionId, {
                    command: "bom",
                    function: "get_paths",
                    data: {
                        file: asm
                    }
                });
                console.log(hierarchy);
            }
            return null
        })
        .then(async function () {
            console.log('Completed: .asm files opened and regenerated with mass properties');
            let secPartData = [];
            for (let asm of asms) {
                const sectionData = await creo(sessionId, {
                    command: "bom",
                    function: "get_paths",
                    data: {
                        "file": asm,
                        "top_level": true,
                        "exclude_inactive": true
                    }
                });
                for (let data of sectionData.data.children.children) {
                    let parts = [];
                    let section = data.file;
                    if (section.slice(section.length - 4, section.length) != '.PRT') {

                        await creo(sessionId, {
                            command: "file",
                            function: "open",
                            data: {
                                "file": section,
                                "display": true,
                                "activate": true
                            }
                        });
                        const comps = await creo(sessionId, {
                            command: "bom",
                            function: "get_paths",
                            data: {
                                "file": section,
                                "exclude_inactive": true
                            }
                        });

                        const secParts = asmToPart(comps.data.children.children, parts);

                        secPartData.push({
                            section: section,
                            parts: secParts
                        });
                    }
                }
            }
            return secPartData
        })
        .then(async function (secPartData) {
            console.log('Completed: Parts extracted from all sections within selected layouts');
            for (let i = 0; i < secPartData.length; i++) {
                for (let j = 0; j < secPartData[i].parts.length; j++) {
                    if (secPartData[i].parts[j].part.slice(0,6) != '777777' && secPartData[i].parts[j].part.slice(0,6) != '999999' && secPartData[i].parts[j].part.slice(0,6) != '777999') {
                        if (globallyCommonParts.includes(secPartData[i].parts[j].part) == false) {
                            await globallyCommonParts.push(secPartData[i].parts[j].part);
                        }
                    }
                }
            }
            console.log('Completed: Unique parts identified');
            return null
        })
        .then(async function() {
            const workingDirDwgs = await creo(sessionId, {
                command: "creo",
                function: "list_files",
                data: {
                    filename: "*drw"
                }
            });
            for (let part of globallyCommonParts) {
                const instances = await creo(sessionId, {
                    command: "familytable",
                    function: "list",
                    data: {
                        file: part
                    }
                });
                let drawing;

                if (workingDirDwgs.data.filelist.includes(part.slice(0,15) + ".drw") == true) {
                    drawing = "0";
                } else {
                    drawing = null;
                }

                if (instances.data.instances.length != 0) {
                    let group;
                    let offset;
                    let flat = instances.data.instances[0];

                    if (part.length == 19) {
                        group = part.slice(12,15);
                        offset = 0;
                    } else {
                        group = part.slice(28,31);
                        offset = Number(part.slice(12,15)) - Number(part.slice(28,31));

                    }

                    partsList.push({
                        part: part,
                        flat: flat,
                        drawings: drawing,
                        category: part.slice(7,11),
                        group: group,
                        offset: offset.toString(),
                        message: 'OK'
                    })
                }
            }
            return null
        })
        .then(async function () {
            for (let part of partsList) {
                let message = "OK";
                if (part.drawings == "0") {
                    let openDwg = await creo(sessionId, {
                        command: "file",
                        function: "open",
                        data: {
                            file: part.part.slice(0,15) + ".drw",
                            display: true,
                            activate: true
                        }
                    });
                    if (openDwg.status.error == true) {
                        message = "Unable to open drawing"
                    } else {

                        const numSheets = await creo(sessionId, {
                            command: "drawing",
                            function: "get_num_sheets",
                            data: {
                                drawing: part.part.slice(0,15) + ".drw"
                            }
                        });

                        if (numSheets > 1) {
                            await creo(sessionId, {
                                command: "drawing",
                                function: "scale_sheet",
                                data: {
                                    drawing: part.part.slice(0,15) + ".drw",
                                    sheet: 2,
                                    scale: 1
                                }
                            });
                        }

                        const listModels = await creo(sessionId, {
                            command: "drawing",
                            function: "list_models",
                            data: {
                                drawing: part.part.slice(0, 15) + ".drw"
                            }
                        });
                        let drawingModels = listModels.data.files;
                        for (let i = 0; i < drawingModels.length; i++) {
                            if (drawingModels[i].slice(12, 15) != part.part.slice(12, 15)) {
                                message = "Drawing models do not match";
                            }
                        }
                    }
                    if (message != 'OK') {
                        partsList.filter(e => e.part == part.part)[0].message = message;
                    }
                }
            }
            return null
        })
        .then(async function () {
            console.log(partsList);
        })
        .then(() => {
            console.log("Completed: Matching Drawing Models and Scale Check");
            partsList.sort(function(a,b) {
                let intA = parseInt(a.part.slice(7, 11) + a.part.slice(12, 15));
                let intB = parseInt(b.part.slice(7, 11) + b.part.slice(12, 15));
                return intA - intB
            });
            //console.log(sortedCheckedDwgs);
            res.locals = {title: 'Rename Script'};
            res.render('Rename/loadParts', {
                workingDir: workingDir,
                drawingList: [],
                asmList: asms,
                partsList: partsList,
                sortedCheckedDwgs: []
            })
        })
        .catch(err => {
            console.log(err);
        });

};

exports.rename = function(req, res) {

};