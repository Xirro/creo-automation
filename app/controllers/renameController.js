//loadash import
const _ = require('lodash');
require('deepdash')(_);

//database information (table and db names)
const dbConfig = require('../config/database.js');
const database = dbConfig.database;

//Creoson Connection options
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
//inital creoson connection (needed to get the sessionId)
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

//creo function (used to remove some of the boilerplate thats involved with creoson http calls)
//Inputs: creoson sessionId provided from above, and function data JSON object
//Outputs: a POST request, formatted in Creoson JSON syntax in the form of a promise
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
//Database information
const DB = require('../config/db.js');
const querySql = DB.querySql;

exports = {};
module.exports = exports;

//renameMain function
//brings user to the rendered rename page
exports.renameMain = function(req, res) {
    let workingDir;
    res.locals = {title: 'Rename Script'};
    res.render('Rename/renameMain', {
        message: null,
        asmList: [],
        workingDir: workingDir
    });
};





//renameSetWD function
//sets creo WD based on users input
exports.renameSetWD = function(req, res) {
    //variable initialization
    let message = null;
    let workingDir = req.body.CREO_workingDir;
    let topLevelAsmList = [];

    //cd async function definition
    async function cd() {
        let dir = await creo(sessionId, {
            command: "creo",
            function: "pwd",
            data: {}
        });
        if (dir.data != undefined) {
            //if current creo wd is not equal to the users input, then set it
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

    //executes the cd function
    cd()
        .then(async function() {
            //list all asm's in the current creo wd
            const listAsms = await creo(sessionId, {
                command: "creo",
                function: "list_files",
                data: {
                    "filename":"*asm"
                }
            });

            let asmList = listAsms.data.filelist;
            //loop through asm's
            for (let i = 0; i < asmList.length; i++) {
                //if current asm is a top-level lineup
                if (asmList[i].slice(7,11) == '0000') {
                    //open layout
                    await creo(sessionId, {
                        command: "file",
                        function: "open",
                        data: {
                            "file": asmList[i]
                        }
                    });
                    //check for family table
                    const famTabExists = await creo(sessionId, {
                        command: "familytable",
                        function: "list",
                        data: {
                            "file": asmList[i]
                        }
                    });
                    //if one exists, then add the instances to the top-level asm list as well
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
            //render renameMain with message (if exists), workingDir, and asmList
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
            //in case of error at any point in the above code, log the error
            console.log(err);
        });
};





//loadParts function
//extracts part and asm data from all top-level asm's
exports.loadParts = function(req, res) {
    req.setTimeout(0); //no timeout (this is needed to prevent error due to page taking a long time to load)
    //initialize variables
    let workingDir = req.body.CREO_workingDir;
    let asmCount = req.body.asmCount;
    let asmNames = req.body.asmName;
    let includeArray = req.body.includeInExportCheck;
    let asms = [];
    let partList = [];
    let asmList = [];
    let partData = [];
    let asmData = [];


    //getCounter function definition
    async function getCounter() {
        let currentCount =  await querySql("SELECT renameCount FROM " + database + "." + dbConfig.script_counter_table+" WHERE idCounter = ?",1);
        return currentCount[0].renameCount;
    }

    //cd async function definition
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

    //execute the cd function
    cd()
        .then(async function() {
            //increment the scriptCounter db table using the getCounter function
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
            //looks up all *.prt in the wd, and writes result to partsData
            const parts = await creo(sessionId, {
                command: "creo",
                function: "list_files",
                data: {
                    filename: "*prt"
                }

            });
            let partsData = parts.data.filelist;

            //looks up all the *.asm in the wd, and writes result to assembliesData
            const assemblies = await creo(sessionId, {
                command: "creo",
                function: "list_files",
                data: {
                    filename: "*.asm"
                }
            });

            let assembliesData = assemblies.data.filelist;

            //loop through parts
            for (let part of partsData) {
                //if part is a generic
                if (part.includes('<') == false) {
                    let partText = part.toString();
                    //if part is not a 999999, 777777, 777999
                    if (partText.slice(0,6) != '999999' && partText.slice(0,6) != '777777' && partText.slice(0,6) != '777999') {
                        //add to partsList array
                        partList.push(partText)
                    }

                    //open generic part
                    await creo(sessionId, {
                        command: "file",
                        function: "open",
                        data: {
                            file: part,
                            display: true,
                            activate: true
                        }
                    });

                    //list the instances associated with part
                    let instances = await creo(sessionId, {
                        command: "familytable",
                        function: "list",
                        data: {
                            file: part
                        }
                    });

                    //if there are instances
                    if (instances.data.instances.length > 0) {
                        //for each instance
                        for (let instance of instances.data.instances) {
                            let instanceText = instance.toString();
                            if (instanceText.slice(0,6) != '999999' && instanceText.slice(0,6) != '777777' && instanceText.slice(0,6) != '777999') {
                                //add to partsList if it is not a 999999, 777777, or 777999
                                partList.push(instanceText+"<"+partText.slice(0,15)+">.prt");
                            }
                        }
                    }
                }
            }


            //loop through assemblies
            for (let assembly of assembliesData) {
                //if asm is a generic
                if (assembly.includes('<') == false) {
                    let assemblyText = assembly.toString();
                    if (assemblyText.slice(0,6) != '999999' && assemblyText.slice(0,6) != '777777' && assemblyText.slice(0,6) != '777999') {
                        //add to asmList if it is not a 999999, 777777, or 777999
                        asmList.push(assemblyText);
                    }

                    //open generic asm
                    await creo(sessionId, {
                        command: "file",
                        function: "open",
                        data: {
                            file: assembly,
                            display: true,
                            activate: true
                        }
                    });

                    //list the instances associated with the asm
                    let instances = await creo(sessionId, {
                        command: "familytable",
                        function: "list",
                        data: {
                            file: assembly
                        }
                    });

                    //if there are instances
                    if (instances.data.instances.length > 0) {
                        //for each instance
                        for (let instance of instances.data.instances) {
                            let instanceText = instance.toString();
                            if (instanceText.slice(0,6) != '999999' && instanceText.slice(0,6) != '777777' && instanceText.slice(0,6) != '777999') {
                                //add to asmList if it is not a 999999, 777777, or 777999
                                asmList.push(instanceText+"<"+assemblyText.slice(0,15)+">.asm");
                            }
                        }
                    }
                }
            }
            return null
        })
        .then(async function() {
            //loop through asmList
            for (let asm of asmList) {
                //if asm is an instance
                if (asm.includes('<') == true) {
                    //check for drawing
                    let doesDwgExist = await creo(sessionId, {
                        command: "creo",
                        function: "list_files",
                        data: {
                            filename: asm.slice(0,15)+".drw"
                        }
                    });

                    //check for bom drawing
                    let doesBomDwgExist = await creo(sessionId, {
                        command: "creo",
                        function: "list_files",
                        data: {
                            filename: asm.slice(0,15)+"-bom.drw"
                        }
                    });

                    //set rename variables based on asm string
                    let asmGeneric = asm.split('<')[1].slice(0,15);
                    let asmInstance = asm.split('<')[0];
                    let asmOffset = parseInt(asmInstance.slice(12,15)) - parseInt(asmGeneric.slice(12,15));


                    if (doesDwgExist.data.filelist.length > 0 && doesBomDwgExist.data.filelist.length > 0) {
                        //if drawing and bom.drawing
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
                        //if drawing but no bom.drawing
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
                        //if no drawing but bom.drawing
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
                        //if no drawing and no bom.drawing
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
                    //if asm is a generic
                    //check for drawing
                    let doesDwgExist = await creo(sessionId, {
                        command: "creo",
                        function: "list_files",
                        data: {
                            filename: asm.slice(0,15)+".drw"
                        }
                    });

                    //check for bom.drawing
                    let doesBomDwgExist = await creo(sessionId, {
                        command: "creo",
                        function: "list_files",
                        data: {
                            filename: asm.slice(0,15)+"-bom.drw"
                        }
                    });

                    if (doesDwgExist.data.filelist.length > 0 && doesBomDwgExist.data.filelist.length > 0) {
                        //if there is a drawing and bom.drawing
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
                        //if there is a drawing and no bom.drawing
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
                        //if there is no drawing, but there is a bom.drawing
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
                        //if there is no drawing and no bom.drawing
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

            //sort asmData in ascending order based on last 7 digits
            asmData.sort(function(a,b) {
                let intA = parseInt(a.currentName.slice(7,11) + a.currentName.slice(12,15));
                let intB = parseInt(b.currentName.slice(7,11) + b.currentName.slice(12,15));
                return intA - intB
            });

            //loop through partList
            for (let prt of partList) {
                //if part is an instance
                if (prt.includes('<') == true) {
                    //open part instance
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
                    //open part generic
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

                //check for drawing
                let doesDwgExist = await creo(sessionId, {
                    command: "creo",
                    function: "list_files",
                    data: {
                        filename: prt.slice(0,15)+".drw"
                    }
                });
                //log part to the console (helps in debugging)
                console.log(prt);

                //if part is an instance
                if (prt.includes('<') == true) {
                    //if FLAT instance exists
                    if (prt.includes('FLAT') == true) {
                        let partGeneric = prt.split('<')[1].slice(0,15);
                        let partOffset = '0';
                        let flatInstance = prt.split('<')[0];
                        //write to partData
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
                    //if part includes INST then do nothing with it

                    } else {
                        let partGeneric = prt.split('<')[1].slice(0,15);
                        let partInstance = prt.split('<')[0];
                        let partOffset = parseInt(partInstance.slice(12,15)) - parseInt(partGeneric.slice(12,15));

                        //check family table for FLAT
                        let flatInstance = await creo(sessionId, {
                            command: "familytable",
                            function: "list",
                            data: {
                                file: prt
                            }
                        });
                        if (doesDwgExist.data.filelist.length > 0 && flatInstance.data.instances.length > 0) {
                            //if drawing exists and flat instance exists
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
                            //if drawing exists, but no flat instance
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
                            //if no drawing exists, but a flat instance does
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
                            //if no drawing and no flat instance exists
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
                    //list flat instance name
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

            //sort partData in ascending order based on last 7 digits
            partData.sort(function(a,b) {
                let intA = parseInt(a.currentName.slice(7,11) + a.currentName.slice(12,15));
                let intB = parseInt(b.currentName.slice(7,11) + b.currentName.slice(12,15));
                return intA - intB
            });

            //initialize counter
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
            return null
        })
        .then(() => {
            //render loadParts page with message, workingDir, asmList, partData, and asmData
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
            //if error occurs anytime at any point in the above, log the error
            console.log(err);
        });
};


//rename function
//renames all the parts and asms based on user input from the loadParts page
exports.rename = function(req, res) {
    req.setTimeout(0); //no timeout (this is needed to prevent error due to page taking a long time to load)
    //initialize variables
    let workingDir = req.body.CREO_workingDir;
    let asmName = req.body.asmName;
    let asmCount = req.body.renameAsmCount;
    let partCount = req.body.renamePartCount;
    let renameAsmData = [];
    let renamePartData = [];
    let partData = [];
    let asmData = [];
    let asms = [];
    let parts = [];
    let paramList = {
        CUSTOMER_NAME: req.body.CUSTOMER_NAME,
        PROJECT_NAME: req.body.PROJECT_NAME,
        PROJECT_NUMBER: req.body.PROJECT_NUMBER,
        PROJECT_DESC_1: req.body.PROJECT_DESC_1,
        PROJECT_DESC_2: req.body.PROJECT_DESC_2,
        DESIGNED_BY: req.body.DESIGNED_BY,
        DESIGNED_DATE: req.body.DESIGNED_DATE,
        DRAWN_BY: req.body.DRAWN_BY,
        DRAWN_DATE: req.body.DRAWN_DATE,
        CHECKED_BY: req.body.CHECKED_BY,
        CHECKED_DATE: req.body.CHECKED_DATE,
        APPROVED_NO: req.body.APPROVED_NO,
        APPROVED_BY: req.body.APPROVED_BY,
        APPROVED_DESC: req.body.APPROVED_DESC,
        APPROVED_DATE: req.body.APPROVED_DATE,
        REV_1_NO: req.body.REV_1_NO,
        REV_1_BY: req.body.REV_1_BY,
        REV_1_DESC: req.body.REV_1_DESC,
        REV_1_DATE: req.body.REV_1_DATE,
    };

    //for each asm, write the currentName, newName, and drawing to renameAsmData
    for (let i = 0; i < asmCount; i++) {
        let id = (i+1).toString();
        renameAsmData.push({
            currentName: req.body['currentNameAsm_' + id],
            newName: req.body['newNameAsm_' + id],
            drawing: req.body['drawingAsm_' + id]
        });
    }

    //for each part, write the currentName, currentFlatName, newName, newFlatName, and drawing to renamePartData
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

    //cd async function definition
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

    //getAllCreoData async function definition
    async function getAllCreoData() {

        //list all the asms in creo wd and write them to asms
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

        //list all the parts in creo wd and write them to parts
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

    //execute cd function
    cd()
        .then(async function() {
            //execute getAllCreoData and await for returned promise
            await getAllCreoData();

            //for each part
            for (let part of parts) {
                //open part
                await creo(sessionId, {
                    command: "file",
                    function: "open",
                    data: {
                        file: part,
                        display: true,
                        activate: true
                    }
                });

                //set parameters using paramList object
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

                //save part
                await creo(sessionId, {
                    command: "file",
                    function: "save",
                    data: {
                        file: part
                    }
                });


                //list part instances
                let instances = await creo(sessionId, {
                    command: "file",
                    function: "list_instances",
                    data: {
                        file: part
                    }
                });

                //first push generic part data
                partData.push({
                    generic: part,
                    instances:[]
                });


                //if instances exist
                if (instances.data.files.length > 0) {
                    for (let instance of instances.data.files) {
                        //push all instances into the instances array of partData
                        partData.filter(e => e.generic == part)[0].instances.push(instance);
                    }
                }
            }

            //for each asm
            for (let asm of asms) {
                //open asm
                await creo(sessionId, {
                    command: "file",
                    function: "open",
                    data: {
                        file: asm,
                        display: true,
                        activate: true
                    }
                });

                //set parameters using paramList object
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

                //save asm
                await creo(sessionId, {
                    command: "file",
                    function: "save",
                    data: {
                        file: asm
                    }
                });

                //list all instances of the asm
                let instances = await creo(sessionId, {
                    command: "file",
                    function: "list_instances",
                    data: {
                        file: asm
                    }
                });

                //first push generic asm data
                asmData.push({
                    generic: asm,
                    instances:[]
                });

                //if instances exist
                if (instances.data.files.length > 0) {
                    for (let instance of instances.data.files) {
                        //push all instances into the instances array of asmData
                        asmData.filter(e => e.generic == asm)[0].instances.push(instance);
                    }
                }
            }
        })
        .then(async function () {

            //main rename loop
            //for each asm in asmData
            for (let i = 0; i < asmData.length; i++) {

                //if this is the first item, give it a new window
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
                //if a drawing exists
                if (renameData.drawing == '0') {
                    //open drawing
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

                    //rename drawing
                    await creo(sessionId, {
                        command: "file",
                        function: "rename",
                        data: {
                            file: renameData.currentName+".drw",
                            new_name: newName + ".drw",
                            onlysession: false
                        }
                    });

                    //save drawing
                    await creo(sessionId, {
                        command: "file",
                        function: "save",
                        data: {
                            file: newName + ".drw"
                        }
                    });

                    //close drawing window
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

                //once the drawings have all been renamed, then rename the generic
                await creo(sessionId, {
                    command: "file",
                    function: "rename",
                    data: {
                        file: asmData[i].generic,
                        new_name: newName + ".asm",
                        onlysession: false
                    }
                });

                //for each instance
                for (let instance of asmData[i].instances) {
                    //open instance
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
                    //if instance drawing exists
                    if (renameData.drawing == '0') {
                        //open instance drawing
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
                        //rename instance drawing
                        await creo(sessionId, {
                            command: "file",
                            function: "rename",
                            data: {
                                file: renameData.currentName+".drw",
                                new_name: newInstanceName + ".drw",
                                onlysession: false
                            }
                        });
                        //save instance drawing
                        await creo(sessionId, {
                            command: "file",
                            function: "save",
                            data: {
                                file: newInstanceName + ".drw"
                            }
                        });
                        //close drawing window
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

                    //finally, rename the instance
                    await creo(sessionId, {
                        command: "file",
                        function: "rename",
                        data: {
                            file: instance,
                            new_name: newInstanceName + ".asm",
                            onlysession: false
                        }
                    });

                    //save the instance
                    await creo(sessionId, {
                        command: "file",
                        function: "save",
                        data: {
                            file: newInstanceName + ".asm"
                        }
                    });

                    //close the instance window
                    await creo(sessionId, {
                        command: "file",
                        function: "close_window",
                        data: {
                            file: newInstanceName + ".asm",
                        }
                    });
                }
                //save the generic
                await creo(sessionId, {
                    command: "file",
                    function: "save",
                    data: {
                        file: asmData[i].generic
                    }
                });
                //close the generic window
                await creo(sessionId, {
                    command: "file",
                    function: "close_window",
                    data: {
                        file: asmData[i].generic,
                    }
                });
            }

            //repeat process above, but now for parts
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


            //open all assemblies and save (this fixes the error the session rename sequence)
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

            //open all drawings and save (this fixes the error the session rename sequence)
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
            //render loadParts page with message, workingDir, asmList, partData, and asmData
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