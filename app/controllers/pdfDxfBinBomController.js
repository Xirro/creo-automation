//path import
const path = require('path');

//Excel Connection
const Excel = require('exceljs');

//Database information (table names)
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

exports = {};
module.exports = exports;

//Initial PDF-DXF-BIN BOM GET request
exports.pdfDxfBinBom = function(req, res) {
    //initialize variables
    let workingDir;
    let outputDir;
    res.locals = {title: 'PDF-DXF-BIN BOM'};
    //render the pdfDxfBinBom page with message, asmList, workingDir, outputDir, and sortedCheckedDwgs
    res.render('MechEng/pdfDxfBinBom', {
        message: null,
        asmList: [],
        workingDir: workingDir,
        outputDir: outputDir,
        sortedCheckedDwgs: []
    });
};

//Set Working Directory POST request
exports.setWD = function(req, res) {
    //initialize variables
    let message = null;
    let workingDir = req.body.CREO_workingDir;
    let outputDir = workingDir + '/_outputDir';
    let topLevelAsmList = [];

    //cdAndCreateOutputDir async function (sets the working directory and creates the _outputDir, updates message if it has a problem with either setting or creating)
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


                let innerDirs = await creo(sessionId, {
                    command: "creo",
                    function: "list_dirs",
                    data: {
                        "dirname": "_outputDir"
                    }
                });

                console.log(innerDirs);

                if (innerDirs.data.dirlist.length == 0 || !innerDirs.data) {
                    await creo(sessionId, {
                        command: "creo",
                        function: "mkdir",
                        data: {
                            "dirname": "_outputDir"
                        }
                    });
                    await creo(sessionId, {
                        command: "creo",
                        function: "mkdir",
                        data: {
                            "dirname": "_outputDir\\PDF"
                        }
                    });
                    await creo(sessionId, {
                        command: "creo",
                        function: "mkdir",
                        data: {
                            "dirname": "_outputDir\\DXF"
                        }
                    });
                    await creo(sessionId, {
                        command: "creo",
                        function: "mkdir",
                        data: {
                            "dirname": "_outputDir\\BIN BOMS"
                        }
                    });
                    await creo(sessionId, {
                        command: "creo",
                        function: "mkdir",
                        data: {
                            "dirname": "_outputDir\\NAMEPLATES"
                        }
                    });
                    await creo(sessionId, {
                        command: "creo",
                        function: "mkdir",
                        data: {
                            "dirname": "_outputDir\\STEP"
                        }
                    });
                } else {
                    message = "_outputDir already exists within the working directory. Please remove before continuing.";
                }

            } else {
                let innerDirs = await creo(sessionId, {
                    command: "creo",
                    function: "list_dirs",
                    data: {
                        "dirname": "_outputDir"
                    }
                });

                console.log(innerDirs);

                if (innerDirs.data.dirlist.length == 0 || !innerDirs.data) {
                    await creo(sessionId, {
                        command: "creo",
                        function: "mkdir",
                        data: {
                            "dirname": "_outputDir"
                        }
                    });
                    await creo(sessionId, {
                        command: "creo",
                        function: "mkdir",
                        data: {
                            "dirname": "_outputDir\\PDF"
                        }
                    });
                    await creo(sessionId, {
                        command: "creo",
                        function: "mkdir",
                        data: {
                            "dirname": "_outputDir\\DXF"
                        }
                    });
                    await creo(sessionId, {
                        command: "creo",
                        function: "mkdir",
                        data: {
                            "dirname": "_outputDir\\BIN BOMS"
                        }
                    });
                    await creo(sessionId, {
                        command: "creo",
                        function: "mkdir",
                        data: {
                            "dirname": "_outputDir\\NAMEPLATES"
                        }
                    });
                    await creo(sessionId, {
                        command: "creo",
                        function: "mkdir",
                        data: {
                            "dirname": "_outputDir\\STEP"
                        }
                    });
                } else {
                    message = "_outputDir already exists within the working directory. Please remove before continuing."
                }

            }
        }
        return null
    }

    //execute the cdAndCreateOutputDir function
    cdAndCreateOutputDir()
        .then(async function() {
            //list all asm's in the creo working directory
            const listAsms = await creo(sessionId, {
                command: "creo",
                function: "list_files",
                data: {
                    "filename":"*asm"
                }
            });

            let asmList = listAsms.data.filelist;
            //for each asm
            for (let i = 0; i < asmList.length; i++) {
                //if asm is a top-level lineup asm
                if (asmList[i].slice(7,11) == '0000') {
                    //open asm
                    await creo(sessionId, {
                        command: "file",
                        function: "open",
                        data: {
                            "file": asmList[i]
                        }
                    });

                    //check if family table exists
                    const famTabExists = await creo(sessionId, {
                        command: "familytable",
                        function: "list",
                        data: {
                            "file": asmList[i]
                        }
                    });

                    //if there are asm instances
                    if (famTabExists.data.instances.length != 0) {
                        //push generic asm into topLevelAsmList
                        topLevelAsmList.push(asmList[i]);
                        for (let j = 0; j < famTabExists.data.instances.length; j++) {
                            //push each instance asm into the topLevelAsmList
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
                //if message is null, render pdfDxfBinBom with message, workingDir, outputDir, asmList, and sortedCheckedDwgs
                res.locals = {title: 'PDF-DXF-BIN BOM'};
                res.render('MechEng/pdfDxfBinBom', {
                    message: null,
                    workingDir: workingDir,
                    outputDir: outputDir,
                    asmList: topLevelAsmList,
                    sortedCheckedDwgs: []
                });
            } else {
                //if message exists, render pdfDxfBinBom with message, workingDir, outputDir, asmList, and sortedCheckedDwgs
                res.locals = {title: 'PDF-DXF-BIN BOM'};
                res.render('MechEng/pdfDxfBinBom', {
                    message: message,
                    workingDir: workingDir,
                    outputDir: undefined,
                    asmList: [],
                    sortedCheckedDwgs: []
                });
            }
        })
        .catch(err => {
            //if there is an error anytime at any point in the above, log the error to the console
            console.log(err);
        });
};

//loadDesign function
//loads and checks drawings filtered by top-level assembly
exports.loadDesign = function(req, res) {
    req.setTimeout(0); //no timeout (this is needed to prevent error due to page taking a long time to load)
    //initialize variables
    let workingDir = req.body.CREO_workingDir;
    let outputDir = workingDir + '/_outputDir';
    let asmCount = req.body.asmCount;
    let asmNames = req.body.asmName;
    let includeArray = req.body.includeInExportCheck;
    let asms = [];
    let lineups = [];
    let partBinInfo = [];
    let binBoms = [];
    let layoutBoms = [];
    let sortedCheckedDwgs = [];
    let existingDwgs = [];

    //getCounter async function definition
    async function getCounter() {
        let currentCount =  await querySql("SELECT binBomCount FROM " + database + "." + dbConfig.script_counter_table+" WHERE idCounter = ?",1);
        return currentCount[0].binBomCount;
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

    //listAllDwgs async function definition
    async function listAllDwgs(sessionId, drawings) {
        let drawingsList = [];
        const workingDirDwgs = await creo(sessionId, {
            command: "creo",
            function: "list_files",
            data: {
                "filename":"*drw"

            }
        });

        for (let drawing of drawings) {
            if (workingDirDwgs.data.filelist.includes(drawing) == true) {
                drawingsList.push({
                    drawing: drawing,
                    message: 'OK'
                });
            } else {
                drawingsList.push({
                    drawing: drawing,
                    message: 'Drawing does not exist'
                });
            }
        }

        for (let drawing of drawingsList) {
            sortedCheckedDwgs.push({
                drawing: drawing.drawing,
                message: drawing.message
            });
        }

        sortedCheckedDwgs.sort(function(a,b) {
            let intA = parseInt(a.drawing.slice(7,11)+a.drawing.slice(12,15));
            let intB = parseInt(b.drawing.slice(7,11)+b.drawing.slice(12,15));
            return intA - intB
        });

        return sortedCheckedDwgs
    }

    //checkFlats async function definition
    async function checkFlats(sessionId, sortedCheckedDwgs) {
        let unmatchedParts = [];
        for (let drawing of sortedCheckedDwgs) {
            if (drawing.drawing.slice(7,8) == '1' || drawing.drawing.slice(7,8) == '2' || drawing.drawing.slice(7,8) == '3' ) {
                let message = 'OK';
                let openDwg = await creo(sessionId, {
                    command: "file",
                    function: "open",
                    data: {
                        "file": drawing.drawing,
                        "display": true,
                        "activate": true
                    }
                });
                if (openDwg.status.error == true) {
                    message = 'Unable to open drawing'
                } else {
                    const listModels = await creo(sessionId, {
                        command: "drawing",
                        function: "list_models",
                        data: {
                            "drawing": drawing.drawing
                        }
                    });
                    let drawingModels = listModels.data.files;
                    for (let i = 0; i < drawingModels.length; i++) {
                        if (drawingModels[i].slice(12, 15) != drawing.drawing.slice(12,15)) {
                            message = 'Drawing models do not match'
                        }
                    }
                }

                if (message != 'OK') {
                    unmatchedParts.push({
                        part: drawing.drawing,
                        message: message
                    });
                }
            }
        }
        for (let unmatchedPart of unmatchedParts) {
            for (let sortedCheckedDwg of sortedCheckedDwgs) {
                if (sortedCheckedDwg.drawing.slice(0, 15) == unmatchedPart.part.slice(0, 15)) {
                    sortedCheckedDwg.message = unmatchedPart.message
                }
            }
        }
        return null
    }

    //getNameplateParams async function definition
    async function getNameplateParams(sessionId, part, qty, NP) {
        let TEMPLATE = 'NULL';
        //let TYPE = 'NULL';
        /*let templateExists = await creo(sessionId, {
            command: "parameter",
            function: "exists",
            data: {
                "file": part,
                "name": "NAMEPLATE_TEMPLATE"
            }
        });*/
        /*if (templateExists.data.exists == true) {
            const templateParam = await creo(sessionId, {
                command: "parameter",
                function: "list",
                data: {
                    "file": part,
                    "name": "NAMEPLATE_TEMPLATE"
                }
            });
            console.log(templateParam.data.paramlist[0].value);
            if (templateParam.data.paramlist[0].value != '' && templateParam.data.paramlist[0].value != 'NULL') {
                TEMPLATE = templateParam.data.paramlist[0].value;
            }
        }*/
        /*let typeExists = await creo(sessionId, {
            command: "parameter",
            function: "exists",
            data: {
                file: part,
                name: "NAMEPLATE_TYPE"
            }
        });*/
        //if (typeExists.data.exists == true) {
            const typeParam = await creo(sessionId, {
                command: "parameter",
                function: "list",
                data: {
                    "file": part,
                    "name": "NAMEPLATE_TYPE"
                }
            });

            //console.log(typeParam);
            //console.log(typeParam.data.paramlist[0].value);

            if (typeParam.data.paramlist[0].value == 1 || typeParam.data.paramlist[0].value == 2) {
                TEMPLATE = 'A';
            } else if (typeParam.data.paramlist[0].value == 3) {
                TEMPLATE = 'B';
            } else if (typeParam.data.paramlist[0].value == 4 || typeParam.data.paramlist[0].value == 5) {
                TEMPLATE = 'C';
            } else if (typeParam.data.paramlist[0].value == 6) {
                TEMPLATE = 'D';
            }

            /*if (typeParam.data.paramlist[0].value == 1 && typeParam.data.paramlist[0].value != 'NULL') {
                TEMPLATE = typeParam.data.paramlist[0].value;
            }*/
        //}

        let TEXT_ROW1 = '';
        let textRow1Exists = await creo(sessionId, {
            command: "parameter",
            function: "exists",
            data: {
                "file": part,
                "name": "NAMEPLATE_TEXT_ROW1"
            }
        });
        if (textRow1Exists.data.exists == true) {
            const textRow1 = await creo(sessionId, {
                command: "parameter",
                function: "list",
                data: {
                    "file": part,
                    "name": "NAMEPLATE_TEXT_ROW1"
                }
            });
            TEXT_ROW1 = textRow1.data.paramlist[0].value;
        }

        let TEXT_ROW2 = '';
        let textRow2Exists = await creo(sessionId, {
            command: "parameter",
            function: "exists",
            data: {
                "file": part,
                "name": "NAMEPLATE_TEXT_ROW2"
            }
        });
        if (textRow2Exists.data.exists == true) {
            const textRow2 = await creo(sessionId, {
                command: "parameter",
                function: "list",
                data: {
                    "file": part,
                    "name": "NAMEPLATE_TEXT_ROW2"
                }
            });
            TEXT_ROW2 = textRow2.data.paramlist[0].value;
        }

        let TEXT_ROW3 = '';
        let textRow3Exists = await creo(sessionId, {
            command: "parameter",
            function: "exists",
            data: {
                "file": part,
                "name": "NAMEPLATE_TEXT_ROW3"
            }
        });
        if (textRow3Exists.data.exists == true) {
            const textRow3 = await creo(sessionId, {
                command: "parameter",
                function: "list",
                data: {
                    "file": part,
                    "name": "NAMEPLATE_TEXT_ROW3"
                }
            });
            TEXT_ROW3 = textRow3.data.paramlist[0].value;
        }

        for (let i = 0; i < qty; i++) {
            NP.push({
                part: part,
                template: TEMPLATE,
                text_row1: TEXT_ROW1,
                text_row2: TEXT_ROW2,
                text_row3: TEXT_ROW3,
            })
        }
        return null
    }

    //listParameters async function definition
    async function listParameters(sessionId, parts, partBinInfo) {
        for (let part of parts) {
            //get BIN parameter
            let BIN = 'NULL';
            let binExists = await creo(sessionId, {
                command: "parameter",
                function: "exists",
                data: {
                    "file": part,
                    "name": "BIN"
                }
            });

            if (binExists.data.exists == true) {
                const binParam = await creo(sessionId, {
                    command: "parameter",
                    function: "list",
                    data: {
                        "file": part,
                        "name": "BIN"
                    }
                });
                BIN = binParam.data.paramlist[0].value;
            }


            //get TITLE parameter
            let TITLE = '';
            let titleExists = await creo(sessionId, {
                command: "parameter",
                function: "exists",
                data: {
                    "file": part,
                    "name": "TITLE"
                }
            });
            if (titleExists.data.exists == true) {
                const titleParam = await creo(sessionId, {
                    command: "parameter",
                    function: "list",
                    data: {
                        "file": part,
                        "name": "TITLE"
                    }
                });
                TITLE = titleParam.data.paramlist[0].value;
            }


            //get PART_NO parameter
            let PART_NO = '';
            let partNumExists = await creo(sessionId, {
                command: "parameter",
                function: "exists",
                data: {
                    "file": part,
                    "name": "PART_NO"
                }
            });
            if (partNumExists.data.exists == true) {
                const partNumParam = await creo(sessionId, {
                    command: "parameter",
                    function: "list",
                    data: {
                        "file": part,
                        "name": "PART_NO"
                    }
                });
                PART_NO = partNumParam.data.paramlist[0].value;
            }


            //get WEIGHT parameter
            let WEIGHT = '';
            let weightExists = await creo(sessionId, {
                command: "parameter",
                function: "exists",
                data: {
                    "file": part,
                    "name": "WEIGHT"
                }
            });
            if (weightExists.data.exists == true) {
                const weightParam = await creo(sessionId, {
                    command: "parameter",
                    function: "list",
                    data: {
                        "file": part,
                        "name": "WEIGHT"
                    }
                });
                if (weightParam.data.paramlist[0].value.length != 0) {
                    WEIGHT = weightParam.data.paramlist[0].value.toFixed(2);
                }
            }

            //get MATERIAL parameter
            let MATERIAL = '';
            let materialExists = await creo(sessionId, {
                command: "parameter",
                function: "exists",
                data: {
                    "file": part,
                    "name": "MATERIAL"
                }
            });
            if (materialExists.data.exists == true) {
                const materialParam = await creo(sessionId, {
                    command: "parameter",
                    function: "list",
                    data: {
                        "file": part,
                        "name": "MATERIAL"
                    }
                });
                MATERIAL = materialParam.data.paramlist[0].value;
            }

            //get GAUGE parameter
            let GAUGE = '';
            let gaugeExists = await creo(sessionId, {
                command: "parameter",
                function: "exists",
                data: {
                    "file": part,
                    "name": "GAUGE"
                }
            });
            if (gaugeExists.data.exists == true) {
                const gaugeParam = await creo(sessionId, {
                    command: "parameter",
                    function: "list",
                    data: {
                        "file": part,
                        "name": "GAUGE"
                    }
                });
                GAUGE = gaugeParam.data.paramlist[0].value;
            }

            //get FINISH parameter
            let FINISH = '';
            let finishExists = await creo(sessionId, {
                command: "parameter",
                function: "exists",
                data: {
                    "file": part,
                    "name": "FINISH"
                }
            });
            if (finishExists.data.exists == true) {
                const finishParam = await creo(sessionId, {
                    command: "parameter",
                    function: "list",
                    data: {
                        "file": part,
                        "name": "FINISH"
                    }
                });
                FINISH = finishParam.data.paramlist[0].value;
            }

            //get CUT_LENGTH parameter
            let CUT_LENGTH = '';
            let cutLengthExists = await creo(sessionId, {
                command: "parameter",
                function: "exists",
                data: {
                    "file": part,
                    "name": "CUT_LENGTH"
                }
            });
            if (cutLengthExists.data.exists == true) {
                const cutLengthParam = await creo(sessionId, {
                    command: "parameter",
                    function: "list",
                    data: {
                        "file": part,
                        "name": "CUT_LENGTH"
                    }
                });
                CUT_LENGTH = cutLengthParam.data.paramlist[0].value;
            }

            /*console.log({
                part: part,
                partNum: PART_NO,
                partDesc: TITLE,
                bin: BIN,
                material: MATERIAL,
                gauge: GAUGE,
                cutLength: CUT_LENGTH,
                weight: WEIGHT
            });*/

            partBinInfo.push({
                part: part,
                partNum: PART_NO,
                partDesc: TITLE,
                bin: BIN,
                material: MATERIAL,
                gauge: GAUGE,
                cutLength: CUT_LENGTH,
                weight: WEIGHT,
                finish: FINISH
            });
        }
        return null
    }

    //asmToPart async function definition
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

    //execute the cd function
    cd()
        .then(async function() {
            //update scriptCouter with increment
            let counter = await getCounter();
            await querySql("UPDATE " + database + "." + dbConfig.script_counter_table + " SET binBomCount = ? WHERE idCounter = ?",[counter+1, 1]);
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
            //set creo config mass property calculation
            await creo(sessionId, {
                command: "creo",
                function: "set_config",
                data: {
                    "name": "mass_property_calculate",
                    "value": "automatic"
                }
            });
            //for each asm
            for (let asm of asms) {
                //check if asm is open
                const isAsmOpen = await creo(sessionId, {
                    command: "file",
                    function: "is_active",
                    data: {
                        "file": asm
                    }
                });
                //if not
                if (isAsmOpen.data.active != true) {
                    //open asm
                    await creo(sessionId, {
                        command: "file",
                        function: "open",
                        data: {
                            "file": asm,
                            "display": true,
                            "activate": true
                        }
                    });
                    //regenerate asm
                    await creo(sessionId, {
                        command: "file",
                        function: "regenerate",
                        data: {
                            "file": asm
                        }
                    })
                } else {
                    //regenerate asm
                    await creo(sessionId, {
                        command: "file",
                        function: "regenerate",
                        data: {
                            "file": asm
                        }
                    })
                }
            }
            return null
        })
        .then(async function () {
            console.log('Completed: .asm files opened and regenerated with mass properties');
            //initialize secPartData
            let secPartData = [];
            //for each asm
            for (let asm of asms) {
                //initialize sections
                let sections = [];
                //get complete hierarchy of parts and assemblies within an asm
                const sectionData = await creo(sessionId, {
                    command: "bom",
                    function: "get_paths",
                    data: {
                        "file": asm,
                        "top_level": true,
                        "exclude_inactive": true
                    }
                });
                //for each section
                for (let data of sectionData.data.children.children) {
                    let parts = [];
                    let section = data.file;
                    if (section.slice(section.length - 4, section.length) != '.PRT') {
                        sections.push(section.slice(12,15));
                        //open section
                        await creo(sessionId, {
                            command: "file",
                            function: "open",
                            data: {
                                "file": section,
                                "display": true,
                                "activate": true
                            }
                        });
                        //get hierarchy of components
                        const comps = await creo(sessionId, {
                            command: "bom",
                            function: "get_paths",
                            data: {
                                "file": section,
                                "exclude_inactive": true
                            }
                        });

                        const secParts = asmToPart(comps.data.children.children, parts);
                        //push data to secPartData
                        secPartData.push({
                            section: section,
                            parts: secParts
                        });
                    }
                }
                //push data to lineups
                lineups.push({
                    lineup: asm.slice(0,15),
                    sections: sections
                })
            }
            //return secPartData for further refinement
            return secPartData
        })
        .then(async function (secPartData) {
            console.log('Completed: Parts extracted from all sections within selected layouts');
            let globallyCommonParts = [];
            //calculate the globally common (i.e. unique) parts
            for (let i = 0; i < secPartData.length; i++) {
                for (let j = 0; j < secPartData[i].parts.length; j++) {
                    if (globallyCommonParts.includes(secPartData[i].parts[j].part) == false) {
                        await globallyCommonParts.push(secPartData[i].parts[j].part);
                    }
                }
            }

            console.log('Completed: Unique parts identified');

            //execute the listParameters function on the globallyCommonParts array to create partBinInfo
            await listParameters(sessionId, globallyCommonParts, partBinInfo);

            console.log('Completed: Applicable Parameters extracted from all unique parts');

            //initiate the standalone panels check
            let standalonePNLs = [];
            for (let lineup of lineups) {
                //if lineup is only 1 section
                if (lineup.sections.length == 1) {
                    //look through the secPartData
                    for (let a = 0; a < secPartData.length; a++) {
                        if (secPartData[a].section.slice(12,15) == lineup.sections[0]) {
                            for (let b = 0; b < secPartData[a].parts.length; b++) {
                                let part = secPartData[a].parts[b].part;
                                //cross reference the partBinInfo to find the bin
                                for (let c = 0; c < partBinInfo.length; c++) {
                                    if (part == partBinInfo[c].part) {
                                        //if bin 2 shows up in any of the parts, then standalone panel
                                        if (partBinInfo[c].bin == '2') {
                                            if (standalonePNLs.filter(e => e.layout === lineup.lineup).length == 0) {
                                                standalonePNLs.push({
                                                    layout: lineup.lineup,
                                                    section: lineup.sections[0]
                                                })
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
            console.log('Completed: Standalone Panel Check');

            //initialize the overall section-level material boms
            let sectionMatBoms = [];
            //for each section
            for (let m = 0; m < secPartData.length; m++) {
                //initialize the bom's
                let SS = [];
                let AL = [];
                let GA_7 = [];
                let LEXAN = [];
                let NP = [];
                let PUR = [];
                let STR = [];
                let PNL = [];
                let CTL = [];
                let INT = [];
                let EXT = [];
                let SCL = [];
                let OUT = [];
                //loop through the parts in secPartData
                for (let n = 0; n < secPartData[m].parts.length; n++) {
                    let part = secPartData[m].parts[n].part;
                    //cross-reference partBinInfo for the bin
                    for (let p = 0; p < partBinInfo.length; p++) {
                        if (part == partBinInfo[p].part) {
                            //switch statement used to filter by bin
                            switch(partBinInfo[p].bin.toString()) {
                                case 'NULL':
                                    //if no bin and 999999, then go to PUR
                                    if (part.slice(0,6) == '999999') {
                                        PUR.push({
                                            qty: secPartData[m].parts[n].qty,
                                            part: part,
                                            partNum: partBinInfo[p].partNum,
                                            partDesc: partBinInfo[p].partDesc,
                                            weight: partBinInfo[p].weight
                                        })
                                    }
                                    break;
                                case '0':
                                    //if bin 0 and 4105, then go to NP
                                    if (part.slice(7,11) == '4105') {
                                        await getNameplateParams(sessionId, part, secPartData[m].parts[n].qty, NP);
                                    }
                                    break;
                                case '1':
                                    //if bin 1, then go to STR
                                    STR.push({
                                        qty: secPartData[m].parts[n].qty,
                                        part: part,
                                        partNum: partBinInfo[p].partNum,
                                        partDesc: partBinInfo[p].partDesc,
                                        weight: partBinInfo[p].weight
                                    });
                                    break;
                                case '2':
                                    //if bin 2, then go to PNL
                                    PNL.push({
                                        qty: secPartData[m].parts[n].qty,
                                        part: part,
                                        partNum: partBinInfo[p].partNum,
                                        partDesc: partBinInfo[p].partDesc,
                                        weight: partBinInfo[p].weight
                                    });
                                    break;
                                case '3':
                                    //if bin 3, then go to CTL
                                    CTL.push({
                                        qty: secPartData[m].parts[n].qty,
                                        part: part,
                                        partNum: partBinInfo[p].partNum,
                                        partDesc: partBinInfo[p].partDesc,
                                        weight: partBinInfo[p].weight
                                    });
                                    break;
                                case '4':
                                    //if bin 4 and standalone panel, then go to PNL
                                    if (standalonePNLs.filter(e => e.section === secPartData[m].section.slice(12,15)).length > 0) {
                                        PNL.push({
                                            qty: secPartData[m].parts[n].qty,
                                            part: part,
                                            partNum: partBinInfo[p].partNum,
                                            partDesc: partBinInfo[p].partDesc,
                                            weight: partBinInfo[p].weight
                                        });
                                    } else {
                                    //if bin 4 and not standalone panel,  then go to INT
                                        INT.push({
                                            qty: secPartData[m].parts[n].qty,
                                            part: part,
                                            partNum: partBinInfo[p].partNum,
                                            partDesc: partBinInfo[p].partDesc,
                                            weight: partBinInfo[p].weight
                                        });
                                    }
                                    //if bin 4 and part middle 4 digits begin with 9, then go to SCL
                                    if (part.slice(7,8) == '9') {
                                        SCL.push({
                                            qty: secPartData[m].parts[n].qty,
                                            part: part,
                                            partNum: partBinInfo[p].partNum,
                                            partDesc: partBinInfo[p].partDesc,
                                            weight: partBinInfo[p].weight,
                                            cutLength: partBinInfo[p].cutLength
                                        });
                                        //if part is 9768, then also go to PUR
                                        if (part.slice(7,11) == '9768') {
                                            PUR.push({
                                                qty: secPartData[m].parts[n].qty,
                                                part: part,
                                                partNum: partBinInfo[p].partNum,
                                                partDesc: partBinInfo[p].partDesc,
                                                weight: partBinInfo[p].weight
                                            })
                                        }
                                    }
                                    break;
                                case '5':
                                    //if bin 5, then go to EXT
                                    EXT.push({
                                        qty: secPartData[m].parts[n].qty,
                                        part: part,
                                        partNum: partBinInfo[p].partNum,
                                        partDesc: partBinInfo[p].partDesc,
                                        weight: partBinInfo[p].weight
                                    });
                                    break;
                            }

                            //switch statement based on material
                            switch(partBinInfo[p].material) {
                                case "":
                                    //no material, do nothing
                                    break;
                                case "STAINLESS STEEL":
                                    //stainless steel material, send to SS
                                    if (SS.filter(e => e.part === part).length > 0) {
                                        SS.filter(e => e.part === part)[0].qty += secPartData[m].parts[n].qty;
                                    } else {
                                        SS.push({
                                            qty: secPartData[m].parts[n].qty,
                                            part: part,
                                            partNum: partBinInfo[p].partNum,
                                            partDesc: partBinInfo[p].partDesc,
                                            weight: partBinInfo[p].weight
                                        });
                                    }
                                    break;
                                case "ALUMINUM":
                                    //aluminum material, send to AL
                                    if(part.slice(0,6) != '777777') {
                                        if (AL.filter(e => e.part === part).length > 0) {
                                            AL.filter(e => e.part === part)[0].qty += secPartData[m].parts[n].qty;
                                        } else {
                                            AL.push({
                                                qty: secPartData[m].parts[n].qty,
                                                part: part,
                                                partNum: partBinInfo[p].partNum,
                                                partDesc: partBinInfo[p].partDesc,
                                                weight: partBinInfo[p].weight
                                            });
                                        }
                                    }
                                    break;
                                case "MILD STEEL":
                                    if (partBinInfo[p].gauge == '7') {
                                        //mild steel material and gauge 7, send to GA_7
                                        if (GA_7.filter(e => e.part === part).length > 0) {
                                            GA_7.filter(e => e.part === part)[0].qty += secPartData[m].parts[n].qty;
                                        } else {
                                            GA_7.push({
                                                qty: secPartData[m].parts[n].qty,
                                                part: part,
                                                partNum: partBinInfo[p].partNum,
                                                partDesc: partBinInfo[p].partDesc,
                                                weight: partBinInfo[p].weight
                                            });
                                        }
                                    }
                                    break;
                                case "LEXAN":
                                    //lexan material, send to LEXAN
                                    if (LEXAN.filter(e => e.part === part).length > 0) {
                                        LEXAN.filter(e => e.part === part)[0].qty += secPartData[m].parts[n].qty;
                                    } else {
                                        LEXAN.push({
                                            qty: secPartData[m].parts[n].qty,
                                            part: part,
                                            partNum: partBinInfo[p].partNum,
                                            partDesc: partBinInfo[p].partDesc,
                                            weight: partBinInfo[p].weight
                                        });
                                    }
                                    break;
                                default:
                                    break;
                            }

                            //if part is not a 999999, 6000, 4100, 4105, 4110, or 777777-95, then send to OUT
                            if (part.slice(0,6) != "999999" && part.slice(7,11) != "6000" && part.slice(7,11) != "4100" && part.slice(7,11) != "4105" && part.slice(7,11) != "4110" && part.slice(0,9) != "777777-95") {
                                if (OUT.filter(e => e.part === part).length > 0) {
                                    OUT.filter(e => e.part === part)[0].qty += secPartData[m].parts[n].qty;
                                } else {
                                    OUT.push({
                                        qty: secPartData[m].parts[n].qty,
                                        part: part,
                                        partNum: partBinInfo[p].partNum,
                                        partDesc: partBinInfo[p].partDesc,
                                        material: partBinInfo[p].material,
                                        gauge: partBinInfo[p].gauge,
                                        bin: partBinInfo[p].bin.toString(),
                                        finish: partBinInfo[p].finish,
                                        weight: partBinInfo[p].weight
                                    });
                                }
                            }

                        }
                    }
                }

                //add all calculated boms from above and insert them into the binBoms and sectionMatBoms array
                if (binBoms.filter(e => e.section == secPartData[m].section.slice(12,15)).length == 0) {
                    binBoms.push({
                        section: secPartData[m].section.slice(12,15),
                        PUR: PUR,
                        STR: STR,
                        PNL: PNL,
                        CTL: CTL,
                        INT: INT,
                        EXT: EXT,
                        SCL: SCL,
                        OUT: OUT
                    });

                    sectionMatBoms.push({
                        section: secPartData[m].section.slice(12,15),
                        SS: SS,
                        AL: AL,
                        GA_7: GA_7,
                        LEXAN: LEXAN,
                        NP: NP,
                        OUT: OUT
                    });
                }
            }

            //sort the PUR, STR, PNL, CTL, INT, EXT, SCL, and OUT boms each in ascending order
            for (let binBom of binBoms) {
                binBom.PUR.sort(function(a,b) {
                    let intA = parseInt(a.part.slice(7,11)+a.part.slice(12,15));
                    let intB = parseInt(b.part.slice(7,11)+b.part.slice(12,15));
                    return intA - intB
                });
                binBom.STR.sort(function(a,b) {
                    let intA = parseInt(a.part.slice(0,6)+a.part.slice(7,11)+a.part.slice(12,15));
                    let intB = parseInt(b.part.slice(0,6)+b.part.slice(7,11)+b.part.slice(12,15));
                    return intA - intB
                });
                binBom.PNL.sort(function(a,b) {
                    let intA = parseInt(a.part.slice(0,6)+a.part.slice(7,11)+a.part.slice(12,15));
                    let intB = parseInt(b.part.slice(0,6)+b.part.slice(7,11)+b.part.slice(12,15));
                    return intA - intB
                });
                binBom.CTL.sort(function(a,b) {
                    let intA = parseInt(a.part.slice(0,6)+a.part.slice(7,11)+a.part.slice(12,15));
                    let intB = parseInt(b.part.slice(0,6)+b.part.slice(7,11)+b.part.slice(12,15));
                    return intA - intB
                });
                binBom.INT.sort(function(a,b) {
                    let intA = parseInt(a.part.slice(0,6)+a.part.slice(7,11)+a.part.slice(12,15));
                    let intB = parseInt(b.part.slice(0,6)+b.part.slice(7,11)+b.part.slice(12,15));
                    return intA - intB
                });
                binBom.EXT.sort(function(a,b) {
                    let intA = parseInt(a.part.slice(0,6)+a.part.slice(7,11)+a.part.slice(12,15));
                    let intB = parseInt(b.part.slice(0,6)+b.part.slice(7,11)+b.part.slice(12,15));
                    return intA - intB
                });
                binBom.SCL.sort(function(a,b) {
                    let intA = parseInt(a.part.slice(0,6)+a.part.slice(7,11)+a.part.slice(12,15));
                    let intB = parseInt(b.part.slice(0,6)+b.part.slice(7,11)+b.part.slice(12,15));
                    return intA - intB
                });
                binBom.OUT.sort(function(a,b) {
                    let intA = parseInt(a.part.slice(0,6)+a.part.slice(7,11)+a.part.slice(12,15));
                    let intB = parseInt(b.part.slice(0,6)+b.part.slice(7,11)+b.part.slice(12,15));
                    return intA - intB
                });
            }

            //loop through lineups
            for (let lineup of lineups) {
                //initialize lineup SS, AL, GA_7, LEXAN, NP, and OUT boms
                let lineup_SS_bom = [];
                let lineup_AL_bom = [];
                let lineup_GA_7_bom = [];
                let lineup_LEXAN_bom = [];
                let lineup_NP_bom = [];
                let lineup_OUT_bom = [];
                let sections = lineup.sections;
                //for each sectionMatBom
                for (let sectionMatBom of sectionMatBoms) {
                    //if sections array includes this section
                    if (sections.includes(sectionMatBom.section)) {
                        //write to variables
                        let ss = sectionMatBom.SS;
                        let al = sectionMatBom.AL;
                        let ga_7 = sectionMatBom.GA_7;
                        let lexan = sectionMatBom.LEXAN;
                        let np = sectionMatBom.NP;
                        let out = sectionMatBom.OUT;

                        //for each part of ss, update the lineup_SS_bom
                        for (let part1 of ss) {
                            if (lineup_SS_bom.filter(e => e.part === part1.part.slice(0,15)).length > 0) {
                                lineup_SS_bom.filter(e => e.part === part1.part.slice(0,15))[0].qty += part1.qty;
                            } else {
                                lineup_SS_bom.push({
                                    qty: part1.qty,
                                    part: part1.part.slice(0,15),
                                    partDesc: part1.partDesc
                                })
                            }
                        }
                        //for each part of al, update the lineup_AL_bom
                        for (let part2 of al) {
                            if (lineup_AL_bom.filter(e => e.part === part2.part.slice(0,15)).length > 0) {
                                lineup_AL_bom.filter(e => e.part === part2.part.slice(0,15))[0].qty += part2.qty;
                            } else {
                                lineup_AL_bom.push({
                                    qty: part2.qty,
                                    part: part2.part.slice(0,15),
                                    partDesc: part2.partDesc
                                })
                            }
                        }
                        //for each part of ga_7, update the lineup_GA_7_bom
                        for (let part3 of ga_7) {
                            if (lineup_GA_7_bom.filter(e => e.part === part3.part.slice(0,15)).length > 0) {
                                lineup_GA_7_bom.filter(e => e.part === part3.part.slice(0,15))[0].qty += part3.qty;
                            } else {
                                lineup_GA_7_bom.push({
                                    qty: part3.qty,
                                    part: part3.part.slice(0,15),
                                    partDesc: part3.partDesc
                                })
                            }
                        }
                        //for each part of lexan, update the lineup_LEXAN_bom
                        for (let part4 of lexan) {
                            if (lineup_LEXAN_bom.filter(e => e.part === part4.part.slice(0,15)).length > 0) {
                                lineup_LEXAN_bom.filter(e => e.part === part4.part.slice(0,15))[0].qty += part4.qty;
                            } else {
                                lineup_LEXAN_bom.push({
                                    qty: part4.qty,
                                    part: part4.part.slice(0,15),
                                    partDesc: part4.partDesc
                                })
                            }
                        }
                        //for each part of np, update the lineup_NP_bom
                        for (let part5 of np) {
                            lineup_NP_bom.push({
                                part: part5.part,
                                template: part5.template,
                                text_row1: part5.text_row1,
                                text_row2: part5.text_row2,
                                text_row3: part5.text_row3
                            })
                        }
                        //for each part of out, update the lineup_OUT_bom
                        for (let part6 of out) {
                            if (lineup_OUT_bom.filter(e => e.partNum.slice(0,15) === part6.part.slice(0,15)).length > 0) {
                                lineup_OUT_bom.filter(e => e.partNum.slice(0,15) === part6.part.slice(0,15))[0].qty += part6.qty;
                            } else {
                                lineup_OUT_bom.push({
                                    qty: part6.qty,
                                    partNum: part6.part,
                                    partDesc: part6.partDesc,
                                    material: part6.material,
                                    gauge: part6.gauge,
                                    bin: part6.bin,
                                    finish: part6.finish,
                                    weight: part6.weight
                                })
                            }
                        }
                    }
                }

                //sort the lineup SS, AL, GA_7, LEXAN, NP, and OUT boms
                lineup_SS_bom.sort(function(a,b) {
                    let intA = parseInt(a.part.slice(0,6)+a.part.slice(7,11)+a.part.slice(12,15));
                    let intB = parseInt(b.part.slice(0,6)+b.part.slice(7,11)+b.part.slice(12,15));
                    return intA - intB
                });
                lineup_AL_bom.sort(function(a,b) {
                    let intA = parseInt(a.part.slice(0,6)+a.part.slice(7,11)+a.part.slice(12,15));
                    let intB = parseInt(b.part.slice(0,6)+b.part.slice(7,11)+b.part.slice(12,15));
                    return intA - intB
                });
                lineup_GA_7_bom.sort(function(a,b) {
                    let intA = parseInt(a.part.slice(0,6)+a.part.slice(7,11)+a.part.slice(12,15));
                    let intB = parseInt(b.part.slice(0,6)+b.part.slice(7,11)+b.part.slice(12,15));
                    return intA - intB
                });
                lineup_LEXAN_bom.sort(function(a,b) {
                    let intA = parseInt(a.part.slice(0,6)+a.part.slice(7,11)+a.part.slice(12,15));
                    let intB = parseInt(b.part.slice(0,6)+b.part.slice(7,11)+b.part.slice(12,15));
                    return intA - intB
                });
                lineup_NP_bom.sort(function(a,b) {
                    let intA = parseInt(a.part.slice(0,6)+a.part.slice(7,11)+a.part.slice(12,15));
                    let intB = parseInt(b.part.slice(0,6)+b.part.slice(7,11)+b.part.slice(12,15));
                    return intA - intB
                });
                lineup_OUT_bom.sort(function(a,b) {
                    let intA = parseInt(a.partNum.slice(0,6)+a.partNum.slice(7,11)+a.partNum.slice(12,15));
                    let intB = parseInt(b.partNum.slice(0,6)+b.partNum.slice(7,11)+b.partNum.slice(12,15));
                    return intA - intB
                });

                //push to layoutBoms
                layoutBoms.push({
                    lineup: lineup.lineup,
                    sections: lineup.sections,
                    SS: lineup_SS_bom,
                    AL: lineup_AL_bom,
                    GA_7: lineup_GA_7_bom,
                    LEXAN: lineup_LEXAN_bom,
                    NP: lineup_NP_bom,
                    OUT: lineup_OUT_bom
                })
            }
            return null
        })
        .then(async function () {

            console.log("Completed: All SS, AL, LEXAN, 7GA, NP, and BIN BOMs calculated");

            //initialize all of the similar boms arrays (used for creating the BIN_TRACKER)
            let similarPURs = [];
            let similarSTRs = [];
            let similarPNLs = [];
            let similarCTLs = [];
            let similarINTs = [];
            let similarEXTs = [];
            let similarSCLs = [];
            let similarOUTs = [];

            let sections = [];
            let purBOMS = [];
            let strBOMS = [];
            let pnlBOMS = [];
            let ctlBOMS = [];
            let intBOMS = [];
            let extBOMS = [];
            let sclBOMS = [];
            let outBOMS = [];

            //areJSONArraysEqual function definition
            function areJSONArraysEqual (jsonArray1, jsonArray2) {
                if (jsonArray1.length !== jsonArray2.length) return false;
                const ser = o => JSON.stringify(Object.keys(o).sort().map( k => [k, o[k]] ));
                jsonArray1 = new Set(jsonArray1.map(ser));
                return jsonArray2.every( o => jsonArray1.has(ser(o)) );
            }


            //for each binBom
            for (let binBom of binBoms) {
                sections.push(binBom.section);
                purBOMS.push(binBom.PUR);
                strBOMS.push(binBom.STR);
                pnlBOMS.push(binBom.PNL);
                ctlBOMS.push(binBom.CTL);
                intBOMS.push(binBom.INT);
                extBOMS.push(binBom.EXT);
                sclBOMS.push(binBom.SCL);
                outBOMS.push(binBom.OUT);
            }


            //for each section
            for (let i = 0; i < sections.length; i++) {
                //set current boms
                let currentPurBom = purBOMS[i];
                let currentStrBom = strBOMS[i];
                let currentPnlBom = pnlBOMS[i];
                let currentCtlBom = ctlBOMS[i];
                let currentIntBom = intBOMS[i];
                let currentExtBom = extBOMS[i];
                let currentSclBom = sclBOMS[i];
                let currentOutBom = outBOMS[i];

                //check PUR bom equality
                if (currentPurBom.length != 0) {
                    for (let k = i + 1; k < purBOMS.length; k++) {
                        if (areJSONArraysEqual(currentPurBom, purBOMS[k]) == true ) {
                            if (similarPURs.filter(e => e.children.includes(sections[i]) == true).length == 0) {
                                if (similarPURs.filter(e => e.parent === sections[i]).length > 0) {
                                    similarPURs.filter(e => e.parent === sections[i])[0].children.push(sections[k]);
                                } else {
                                    similarPURs.push({
                                        parent: sections[i],
                                        children: [sections[k]]
                                    })
                                }
                            }
                        }
                    }
                }
                //check STR bom equality
                if (currentStrBom.length != 0) {
                    for (let k = i + 1; k < strBOMS.length; k++) {
                        if (areJSONArraysEqual(currentStrBom, strBOMS[k]) == true ) {
                            if (similarSTRs.filter(e => e.children.includes(sections[i]) == true).length == 0) {
                                if (similarSTRs.filter(e => e.parent === sections[i]).length > 0) {
                                    similarSTRs.filter(e => e.parent === sections[i])[0].children.push(sections[k]);
                                } else {
                                    similarSTRs.push({
                                        parent: sections[i],
                                        children: [sections[k]]
                                    })
                                }
                            }
                        }
                    }
                }
                //check PNL bom equality
                if (currentPnlBom.length != 0) {
                    for (let k = i + 1; k < pnlBOMS.length; k++) {
                        if (areJSONArraysEqual(currentPnlBom, pnlBOMS[k]) == true ) {
                            if (similarPNLs.filter(e => e.children.includes(sections[i]) == true).length == 0) {
                                if (similarPNLs.filter(e => e.parent === sections[i]).length > 0) {
                                    similarPNLs.filter(e => e.parent === sections[i])[0].children.push(sections[k]);
                                } else {
                                    similarPNLs.push({
                                        parent: sections[i],
                                        children: [sections[k]]
                                    })
                                }
                            }
                        }
                    }
                }
                //check CTL bom equality
                if (currentCtlBom.length != 0) {
                    for (let k = i + 1; k < ctlBOMS.length; k++) {
                        if (areJSONArraysEqual(currentCtlBom, ctlBOMS[k]) == true ) {
                            if (similarCTLs.filter(e => e.children.includes(sections[i]) == true).length == 0) {
                                if (similarCTLs.filter(e => e.parent === sections[i]).length > 0) {
                                    similarCTLs.filter(e => e.parent === sections[i])[0].children.push(sections[k]);
                                } else {
                                    similarCTLs.push({
                                        parent: sections[i],
                                        children: [sections[k]]
                                    })
                                }
                            }
                        }
                    }
                }
                //check INT bom equality
                if (currentIntBom.length != 0 ) {
                    for (let k = i + 1; k < intBOMS.length; k++) {
                        if (areJSONArraysEqual(currentIntBom, intBOMS[k]) == true ) {
                            if (similarINTs.filter(e => e.children.includes(sections[i]) == true).length == 0) {
                                if (similarINTs.filter(e => e.parent === sections[i]).length > 0) {
                                    similarINTs.filter(e => e.parent === sections[i])[0].children.push(sections[k]);
                                } else {
                                    similarINTs.push({
                                        parent: sections[i],
                                        children: [sections[k]]
                                    })
                                }
                            }
                        }
                    }
                }
                //check EXT bom equality
                if (currentExtBom.length != 0 ) {
                    for (let k = i + 1; k < extBOMS.length; k++) {
                        if (areJSONArraysEqual(currentExtBom, extBOMS[k]) == true ) {
                            if (similarEXTs.filter(e => e.children.includes(sections[i]) == true).length == 0) {
                                if (similarEXTs.filter(e => e.parent === sections[i]).length > 0) {
                                    similarEXTs.filter(e => e.parent === sections[i])[0].children.push(sections[k]);
                                } else {
                                    similarEXTs.push({
                                        parent: sections[i],
                                        children: [sections[k]]
                                    })
                                }
                            }
                        }
                    }
                }
                //check SCL bom equality
                if (currentSclBom.length != 0 ) {
                    for (let k = i + 1; k < sclBOMS.length; k++) {
                        if (areJSONArraysEqual(currentSclBom, sclBOMS[k]) == true ) {
                            if (similarSCLs.filter(e => e.children.includes(sections[i]) == true).length == 0) {
                                if (similarSCLs.filter(e => e.parent === sections[i]).length > 0) {
                                    similarSCLs.filter(e => e.parent === sections[i])[0].children.push(sections[k]);
                                } else {
                                    similarSCLs.push({
                                        parent: sections[i],
                                        children: [sections[k]]
                                    })
                                }
                            }
                        }
                    }
                }
                //check OUT bom equality
                if (currentOutBom.length != 0) {
                    for (let k = i + 1; k < outBOMS.length; k++) {
                        if (areJSONArraysEqual(currentOutBom, outBOMS[k]) == true) {
                            if (similarOUTs.filter(e => e.children.includes(sections[i]) == true).length == 0) {
                                if (similarOUTs.filter(e => e.parent === sections[i]).length > 0) {
                                    similarOUTs.filter(e => e.parent === sections[i])[0].children.push(sections[k]);
                                } else {
                                    similarOUTs.push({
                                        parent: sections[i],
                                        children: [sections[k]]
                                    })
                                }
                            }
                        }
                    }
                }
            }

            //mark the BIN_TRACKER for PUR boms
            for (let similarPUR of similarPURs) {
                let parent = similarPUR.parent;
                for (let child of similarPUR.children) {
                    binBoms.filter(e => e.section === child)[0].PUR = parent
                }
            }
            //mark the BIN_TRACKER for STR boms
            for (let similarSTR of similarSTRs) {
                let parent = similarSTR.parent;
                for (let child of similarSTR.children) {
                    binBoms.filter(e => e.section === child)[0].STR = parent
                }
            }
            //mark the BIN_TRACKER for PNL boms
            for (let similarPNL of similarPNLs) {
                let parent = similarPNL.parent;
                for (let child of similarPNL.children) {
                    binBoms.filter(e => e.section === child)[0].PNL = parent
                }
            }
            //mark the BIN_TRACKER for CTL boms
            for (let similarCTL of similarCTLs) {
                let parent = similarCTL.parent;
                for (let child of similarCTL.children) {
                    binBoms.filter(e => e.section === child)[0].CTL = parent
                }
            }
            //mark the BIN_TRACKER for INT boms
            for (let similarINT of similarINTs) {
                let parent = similarINT.parent;
                for (let child of similarINT.children) {
                    binBoms.filter(e => e.section === child)[0].INT = parent
                }
            }
            //mark the BIN_TRACKER for EXT boms
            for (let similarEXT of similarEXTs) {
                let parent = similarEXT.parent;
                for (let child of similarEXT.children) {
                    binBoms.filter(e => e.section === child)[0].EXT = parent
                }
            }
            //mark the BIN_TRACKER for SCL boms
            for (let similarSCL of similarSCLs) {
                let parent = similarSCL.parent;
                for (let child of similarSCL.children) {
                    binBoms.filter(e => e.section === child)[0].SCL = parent
                }
            }
            //mark the BIN_TRACKER for OUT boms
            for (let similarOUT of similarOUTs) {
                let parent = similarOUT.parent;
                for (let child of similarOUT.children) {
                    binBoms.filter(e => e.section === child)[0].OUT = parent
                }
            }
            return null
        })
        .then(async function () {
            console.log("Completed: BIN tracker calculated");
            let drawings = [];
            for (let part of partBinInfo) {
                //filters out the hardware and skeletons from the part drawing array
                if (part.part.slice(0, 6) != '999999' && part.part.slice(0, 6) != '777777' && part.part.slice(0, 6) != '777999' && part.part.slice(7, 11) != '6000') {
                    await drawings.push(part.part.slice(0, 15) + '.drw');
                }
            }
            return drawings
        })
        .then(async function (drawings) {
            //execute the listAllDwgs function are return the result
            return await listAllDwgs(sessionId, drawings)
        })
        .then(async function (sortedCheckedDwgs) {
            //using the returned result (sortedCheckedDwgs), execte the checkFlats function and return the result
            console.log("Completed: Drawing Existence and Error Check");
            await checkFlats(sessionId, sortedCheckedDwgs);
            return null
        })
        .then(() => {
            console.log("Completed: Matching Drawing Models and Scale Check");
            //sort the sortedCheckedDrawings array
            sortedCheckedDwgs.sort(function(a,b) {
                let intA = parseInt(a.drawing.slice(7, 11) + a.drawing.slice(12, 15));
                let intB = parseInt(b.drawing.slice(7, 11) + b.drawing.slice(12, 15));
                return intA - intB
            });
            //render the loadDesign page with the workingDir, outputDir, drawingList, asmList, partsList, sortedCheckedDwgs, existingDwgs, binBoms, and layoutBoms
            res.locals = {title: 'PDF-DXF-BIN BOM'};
            res.render('MechEng/loadDesign', {
                workingDir: workingDir,
                outputDir: outputDir,
                drawingList: [],
                asmList: asms,
                partsList: [],
                sortedCheckedDwgs: sortedCheckedDwgs,
                existingDwgs: existingDwgs,
                binBoms: binBoms,
                layoutBoms: layoutBoms
            });
        })
        .catch(err => {
            //if an error occurs at anythime at any point in the above code, log it to the console
            console.log(err);
        });
};

//generateAll function (used to create pdf's, dxf's, step's, and bin boms
exports.generateAll = function(req, res) {
    req.setTimeout(0); //no timeout (this is needed to prevent error due to page taking a long time to load)
    //initialize variables
    let workingDir = req.body.CREO_workingDir;
    let outputDir = workingDir + '/_outputDir';
    let drawingCount = req.body.drawingCount;
    let drawingNames = req.body.drawingName;
    let pdfs = req.body.pdfCheck;
    let dxfs = req.body.dxfCheck;
    let steps = req.body.stepCheck;
    let drawings = [];
    let layoutBoms = req.body.layoutBom;
    let layoutSections = req.body.layoutSections;
    let sectionBoms = req.body.binBomSection;
    let layouts = [];
    let sections = [];
    let existingLayoutBoms = [];
    let existingSectionBoms = [];
    let SS = [];
    let AL = [];
    let GA_7 = [];
    let LEXAN = [];
    let NP_A = [];
    let NP_B = [];
    let NP_C = [];
    let NP_D = [];
    let OUT_L = [];
    let PUR = [];
    let STR = [];
    let PNL = [];
    let CTL = [];
    let INT = [];
    let EXT = [];
    let SCL = [];
    let OUT = [];
    let BIN_TRACKER = [];
    let OUTSOURCE = [];


    //exportSheet1PDF async function definition
    async function exportSheet1PDF(sessionId, drawing) {
        //open drawing
        await creo(sessionId, {
            command: "file",
            function: "open",
            data: {
                "file": drawing.name,
                "display": true,
                "activate": true
            }
        });
        //get the current sheet
        let curSheetPDF = await creo(sessionId, {
            command: "drawing",
            function: "get_cur_sheet",
            data: {}
        });
        //if current sheet is not 1, then select first sheet
        if (curSheetPDF.data.sheet != 1) {
            await creo(sessionId, {
                command: "drawing",
                function: "select_sheet",
                data: {
                    "drawing": drawing.name,
                    "sheet": 1
                }
            });
        }

        //run pdf mapkey
        return await creo(sessionId, {
            command: "interface",
            function: "mapkey",
            data: {
                "script": "~ Activate `main_dlg_cur` `switcher_lay_buttons_lay_ph.page_0` 1;\n" +
                    "~ Trail `UI Desktop` `UI Desktop` `SmartTabs` `selectButton \n" +
                    "main_dlg_cur@switcher_lay_buttons_lay page_0 0`;\n" +
                    "~ Close `main_dlg_cur` `appl_casc`;~ Command `ProCmdExportPreview` ;\n" +
                    "~ Activate `main_dlg_cur` `switcher_lay_buttons_lay_ph.page_0` 1;\n" +
                    "~ Trail `UI Desktop` `UI Desktop` `SmartTabs` `selectButton \n" +
                    "main_dlg_cur@switcher_lay_buttons_lay page_0 0`;\n" +
                    "~ Close `main_dlg_cur` `appl_casc`;~ Command `ProCmdExportPreview` ;\n" +
                    "~ Command `ProCmdDwgPubSettings` ;~ Open `intf_profile` `opt_profile`;\n" +
                    "~ Close `intf_profile` `opt_profile`;\n" +
                    "~ Select `intf_profile` `opt_profile` 1 `drawing_setup`;\n" +
                    "~ Command `ProCmdDwgPubSettings` ;~ Activate `intf_profile` `OkPshBtn`;\n" +
                    "~ Command `ProCmdDwgPubExport` ;~ Activate `file_saveas` `Current Dir`;\n" +
                    "~ Select `file_saveas` `ph_list.Filelist` 1 `_outputDir`;\n" +
                    "~ Activate `file_saveas` `ph_list.Filelist` 1 `_outputDir`;\n" +
                    "~ Select `file_saveas` `ph_list.Filelist` 1 `PDF`;\n" +
                    "~ Activate `file_saveas` `ph_list.Filelist` 1 `PDF`;\n" +
                    "~ Activate `file_saveas` `OK`;~ Command `ProCmdDwgPubCloseExportPvw`;"
            }

            /*data: {
                "script": "~ Activate `main_dlg_cur` `switcher_lay_buttons_lay_ph.page_0` 1;~ Trail `UI Desktop` `UI Desktop` `SmartTabs` `selectButton main_dlg_cur@switcher_lay_buttons_lay page_0 0`;~ Close `main_dlg_cur` `appl_casc`;~ Command `ProCmdExportPreview` ;~ Activate `main_dlg_cur` `switcher_lay_buttons_lay_ph.page_0` 1;~ Trail `UI Desktop` `UI Desktop` `SmartTabs` `selectButton main_dlg_cur@switcher_lay_buttons_lay page_0 0`;~ Close `main_dlg_cur` `appl_casc`;~ Command `ProCmdExportPreview` ;~ Command `ProCmdDwgPubSettings` ;~ Open `intf_profile` `opt_profile`;~ Close `intf_profile` `opt_profile`;~ Select `intf_profile` `opt_profile` 1 `drawing_setup`;~ Command `ProCmdDwgPubSettings` ;~ Activate `intf_profile` `OkPshBtn`;~ Command `ProCmdDwgPubExport` ;~ Activate `file_saveas` `Current Dir`;~ Select `file_saveas` `ph_list.Filelist` 1 `_outputDir`;~ Activate `file_saveas` `ph_list.Filelist` 1 `_outputDir`;~ Select `file_saveas` `ph_list.Filelist` 1 `PDF`;~ Activate `file_saveas` `ph_list.Filelist` 1 `PDF`;~ Activate `file_saveas` `OK`;~ Command `ProCmdDwgPubCloseExportPvw`;"
            }*/

        });
    }

    //exportSheet1DXF async function definition
    async function exportSheet1DXF(sessionId, drawing) {
        //open drawing
        await creo(sessionId, {
            command: "file",
            function: "open",
            data: {
                "file": drawing.name,
                "display": true,
                "activate": true
            }
        });
        //select sheet 1
        await creo(sessionId, {
            command: "drawing",
            function: "select_sheet",
            data: {
                "drawing": drawing.name,
                "sheet": 1
            }
        });

        //get sheet 1 scale
        let scaleDXF = await creo(sessionId, {
            command: "drawing",
            function: "get_sheet_scale",
            data: {
                "drawing": drawing.name,
                "sheet": 1
            }
        });

        //if not 1, then set it
        if (scaleDXF.data.scale != 1) {
            await creo(sessionId, {
                command: "drawing",
                function: "scale_sheet",
                data: {
                    "drawing": drawing.name,
                    "sheet": 1,
                    "scale": 1
                }
            })
        }

        //run built-in creoson export dxf function and return the result
        return await creo(sessionId, {
            command: "interface",
            function: "export_file",
            data: {
                "file": drawing.name,
                "type": "DXF",
                "dirname":path.join(outputDir, "DXF"),
                "filename": drawing.name.slice(0, drawing.name.length - 4) + ".dxf"
            }
        });
    }

    //exportSheet2DXF async function definition
    async function exportSheet2DXF(sessionId, drawing) {
        //open drawing
        await creo(sessionId, {
            command: "file",
            function: "open",
            data: {
                "file": drawing.name,
                "display": true,
                "activate": true
            }
        });

        //select sheet 2
        await creo(sessionId, {
            command: "drawing",
            function: "select_sheet",
            data: {
                "drawing": drawing.name,
                "sheet": 2
            }
        });

        //get sheet 2 scale
        let scaleDXF = await creo(sessionId, {
            command: "drawing",
            function: "get_sheet_scale",
            data: {
                "drawing": drawing.name,
                "sheet": 2
            }
        });

        // if scale is not 1, then set it
        if (scaleDXF.data.scale != 1) {
            await creo(sessionId, {
                command: "drawing",
                function: "scale_sheet",
                data: {
                    "drawing": drawing.name,
                    "sheet": 2,
                    "scale": 1
                }
            })
        }

        //run built-in creoson export dxf function and return the result
        return await creo(sessionId, {
            command: "interface",
            function: "export_file",
            data: {
                "file": drawing.name,
                "type": "DXF",
                "dirname":path.join(outputDir, "DXF"),
                "filename": drawing.name.slice(0, drawing.name.length - 4) + ".dxf"
            }
        });
    }

    //exportPartSTEP async function definition
    async function exportPartSTEP(sessionId, drawing) {
        //get part name from drawing
        let part = drawing.name.slice(0,drawing.name.length - 4)+".prt";
        //open part
        await creo(sessionId, {
            command: "file",
            function: "open",
            data: {
                "file": part,
                "display": true,
                "activate": true
            }
        });

        //run step mapkey
        return await creo(sessionId, {
            command: "interface",
            function: "mapkey",
            data: {
                "script": "~ Close `main_dlg_cur` `appl_casc`;~ Command `ProCmdModelSaveAs` ;~ Open `file_saveas` `type_option`;~ Close `file_saveas` `type_option`;~ Select `file_saveas` `type_option` 1 `db_539`;~ Activate `file_saveas` `OK`;~ Activate `intf_export` `curves_points` 1;~ Activate `intf_export` `facets` 1;~ Activate `intf_export` `OkPushBtn`;"
            }
        });
    }


    //if layoutBoms is an array
    if (Array.isArray(layoutBoms) == true) {
        //push each member to layouts
        for (let i = 0; i < layoutBoms.length; i++) {
            layouts.push({
                layout: layoutBoms[i].slice(0,7) + layoutBoms[i].slice(12,15),
                sections: layoutSections[i]
            });
        }
    } else {
        layouts.push({
            layout: layoutBoms.slice(0,7) + layoutBoms.slice(12,15),
            sections: layoutSections
        });
    }

    //if sectionBoms is an array
    if (Array.isArray(sectionBoms) == true) {
        //push each member to sections
        for (let sectionBom of sectionBoms) {
            sections.push(sectionBom);
        }
    } else {
        sections.push(sectionBoms);
    }

    //for each layout
    for (let layout of layouts) {
        //figure out which boms exist based on the HTML element from loadDesign
        if (req.body['title_' + layout.layout + '-SS'] != undefined) {
            existingLayoutBoms.push(layout.layout + '-SS');
        }
        if (req.body['title_' + layout.layout + '-AL'] != undefined) {
            existingLayoutBoms.push(layout.layout + '-AL');
        }
        if (req.body['title_' + layout.layout + '-7GA'] != undefined) {
            existingLayoutBoms.push(layout.layout + '-7GA');
        }
        if (req.body['title_' + layout.layout + '-LEXAN'] != undefined) {
            existingLayoutBoms.push(layout.layout + '-LEXAN');
        }
        if (req.body['title_' + layout.layout + '-A'] != undefined) {
            existingLayoutBoms.push(layout.layout + '-A');
        }
        if (req.body['title_' + layout.layout + '-B'] != undefined) {
            existingLayoutBoms.push(layout.layout + '-B');
        }
        if (req.body['title_' + layout.layout + '-C'] != undefined) {
            existingLayoutBoms.push(layout.layout + '-C');
        }
        if (req.body['title_' + layout.layout + '-D'] != undefined) {
            existingLayoutBoms.push(layout.layout + '-D');
        }
        if (req.body['title_' + layout.layout + '-OUT'] != undefined) {
            existingLayoutBoms.push(layout.layout + '-OUT');
        }
    }

    //for each section
    for (let section of sections) {
        //figure out which boms exist based on the HTML element (i.e. using req.body[*elementName*]) from loadDesign
        if (req.body['title_' + section + '-PUR'] != undefined) {
            existingSectionBoms.push(section + '-PUR');
        }
        if (req.body['title_' + section + '-STR'] != undefined) {
            existingSectionBoms.push(section + '-STR');
        }
        if (req.body['title_' + section + '-PNL'] != undefined) {
            existingSectionBoms.push(section + '-PNL');
        }
        if (req.body['title_' + section + '-CTL'] != undefined) {
            existingSectionBoms.push(section + '-CTL');
        }
        if (req.body['title_' + section + '-INT'] != undefined) {
            existingSectionBoms.push(section + '-INT');
        }
        if (req.body['title_' + section + '-EXT'] != undefined) {
            existingSectionBoms.push(section + '-EXT');
        }
        if (req.body['title_' + section + '-SCL'] != undefined) {
            existingSectionBoms.push(section + '-SCL');
        }
        if (req.body['title_' + section + '-OUT'] != undefined) {
            existingSectionBoms.push(section + '-OUT');
        }
    }

    //loop through the existent layout boms and push values obtained via the HTML element (i.e. using req.body.[*elementName*]) to the corresponding bom arrays
    for (let existingLayoutBom of existingLayoutBoms) {
        if (existingLayoutBom.slice(existingLayoutBom.length - 2, existingLayoutBom.length) == 'SS') {
            let ss = [];
            if (Array.isArray(req.body['qty_' + existingLayoutBom]) == true) {
                for (let i = 0; i < req.body['qty_' + existingLayoutBom].length; i++) {
                    ss.push({
                        qty: req.body['qty_' + existingLayoutBom][i],
                        partDesc: req.body['partDesc_' + existingLayoutBom][i],
                        part: req.body['part_' + existingLayoutBom][i]
                    })
                }
            } else {
                ss.push({
                    qty: req.body['qty_' + existingLayoutBom],
                    partDesc: req.body['partDesc_' + existingLayoutBom],
                    part: req.body['part_' + existingLayoutBom]
                })
            }

            SS.push({
                bom: existingLayoutBom,
                data: ss
            });
        }

        if (existingLayoutBom.slice(existingLayoutBom.length - 3, existingLayoutBom.length) == 'OUT') {
            let out = [];
            if (Array.isArray(req.body['qty_' + existingLayoutBom]) == true) {
                for (let i = 0; i < req.body['qty_' + existingLayoutBom].length; i++) {
                    out.push({
                        qty: req.body['qty_' + existingLayoutBom][i],
                        partDesc: req.body['partDesc_' + existingLayoutBom][i],
                        partNum: req.body['partNum_' + existingLayoutBom][i],
                        material: req.body['material_' + existingLayoutBom][i],
                        gauge: req.body['gauge_' + existingLayoutBom][i],
                        bin: req.body['bin_' + existingLayoutBom][i],
                        finish: req.body['finish_' + existingLayoutBom][i],
                        weight: req.body['weight_' + existingLayoutBom][i],
                    })
                }
            } else {
                out.push({
                    qty: req.body['qty_' + existingLayoutBom],
                    partDesc: req.body['partDesc_' + existingLayoutBom],
                    partNum: req.body['partNum_' + existingLayoutBom],
                    material: req.body['material_' + existingLayoutBom],
                    gauge: req.body['gauge_' + existingLayoutBom],
                    bin: req.body['bin_' + existingLayoutBom],
                    finish: req.body['finish_' + existingLayoutBom],
                    weight: req.body['weight_' + existingLayoutBom],
                })
            }

            OUT_L.push({
                bom: existingLayoutBom,
                data: out
            });
        }


        if (existingLayoutBom.slice(existingLayoutBom.length - 2, existingLayoutBom.length) == 'AL') {
            let al = [];
            if (Array.isArray(req.body['qty_' + existingLayoutBom]) == true) {
                for (let i = 0; i < req.body['qty_' + existingLayoutBom].length; i++) {
                    al.push({
                        qty: req.body['qty_' + existingLayoutBom][i],
                        partDesc: req.body['partDesc_' + existingLayoutBom][i],
                        part: req.body['part_' + existingLayoutBom][i]
                    });
                }
            } else {
                al.push({
                    qty: req.body['qty_' + existingLayoutBom],
                    partDesc: req.body['partDesc_' + existingLayoutBom],
                    part: req.body['part_' + existingLayoutBom]
                })
            }

            AL.push({
                bom: existingLayoutBom,
                data: al
            });
        }

        if (existingLayoutBom.slice(existingLayoutBom.length - 3, existingLayoutBom.length) == '7GA') {
            let ga_7 = [];
            if (Array.isArray(req.body['qty_' + existingLayoutBom]) == true) {
                for (let i = 0; i < req.body['qty_' + existingLayoutBom].length; i++) {
                    ga_7.push({
                        qty: req.body['qty_' + existingLayoutBom][i],
                        partDesc: req.body['partDesc_' + existingLayoutBom][i],
                        part: req.body['part_' + existingLayoutBom][i]
                    })
                }
            } else {
                ga_7.push({
                    qty: req.body['qty_' + existingLayoutBom],
                    partDesc: req.body['partDesc_' + existingLayoutBom],
                    part: req.body['part_' + existingLayoutBom]
                })
            }
            GA_7.push({
                bom: existingLayoutBom,
                data: ga_7
            });
        }

        if (existingLayoutBom.slice(existingLayoutBom.length - 5, existingLayoutBom.length) == 'LEXAN') {
            let lexan = [];
            if (Array.isArray(req.body['qty_' + existingLayoutBom]) == true) {
                for (let i = 0; i < req.body['qty_' + existingLayoutBom].length; i++) {
                    lexan.push({
                        qty: req.body['qty_' + existingLayoutBom][i],
                        partDesc: req.body['partDesc_' + existingLayoutBom][i],
                        part: req.body['part_' + existingLayoutBom][i]
                    })
                }
            } else {
                lexan.push({
                    qty: req.body['qty_' + existingLayoutBom],
                    partDesc: req.body['partDesc_' + existingLayoutBom],
                    part: req.body['part_' + existingLayoutBom]
                })
            }

            LEXAN.push({
                bom: existingLayoutBom,
                data: lexan
            });
        }

        if (existingLayoutBom.slice(existingLayoutBom.length - 1, existingLayoutBom.length) == 'A') {
            let npA = [];
            if (Array.isArray(req.body['part_' + existingLayoutBom]) == true) {
                for (let i = 0; i < req.body['part_' + existingLayoutBom].length; i++) {
                    npA.push({
                        part: req.body['part_' + existingLayoutBom][i],
                        text_row1: req.body['text_row1_' + existingLayoutBom][i],
                        text_row2: req.body['text_row2_' + existingLayoutBom][i],
                        text_row3: req.body['text_row3_' + existingLayoutBom][i]
                    })
                }
            } else {
                npA.push({
                    part: req.body['part_' + existingLayoutBom],
                    text_row1: req.body['text_row1_' + existingLayoutBom],
                    text_row2: req.body['text_row2_' + existingLayoutBom],
                    text_row3: req.body['text_row3_' + existingLayoutBom]
                })
            }

            NP_A.push({
                bom: existingLayoutBom,
                data: npA
            })
        }

        if (existingLayoutBom.slice(existingLayoutBom.length - 1, existingLayoutBom.length) == 'B') {
            let npB = [];
            if (Array.isArray(req.body['part_' + existingLayoutBom]) == true) {
                for (let i = 0; i < req.body['part_' + existingLayoutBom].length; i++) {
                    npB.push({
                        part: req.body['part_' + existingLayoutBom][i],
                        text_row1: req.body['text_row1_' + existingLayoutBom][i],
                        text_row2: req.body['text_row2_' + existingLayoutBom][i],
                        text_row3: req.body['text_row3_' + existingLayoutBom][i]
                    })
                }
            } else {
                npB.push({
                    part: req.body['part_' + existingLayoutBom],
                    text_row1: req.body['text_row1_' + existingLayoutBom],
                    text_row2: req.body['text_row2_' + existingLayoutBom],
                    text_row3: req.body['text_row3_' + existingLayoutBom]
                })
            }
            NP_B.push({
                bom: existingLayoutBom,
                data: npB
            })
        }

        if (existingLayoutBom.slice(existingLayoutBom.length - 1, existingLayoutBom.length) == 'C') {
            let npC = [];
            if (Array.isArray(req.body['part_' + existingLayoutBom]) == true) {
                for (let i = 0; i < req.body['part_' + existingLayoutBom].length; i++) {
                    npC.push({
                        part: req.body['part_' + existingLayoutBom][i],
                        text_row1: req.body['text_row1_' + existingLayoutBom][i],
                        text_row2: req.body['text_row2_' + existingLayoutBom][i],
                        text_row3: req.body['text_row3_' + existingLayoutBom][i]
                    })
                }
            } else {
                npC.push({
                    part: req.body['part_' + existingLayoutBom],
                    text_row1: req.body['text_row1_' + existingLayoutBom],
                    text_row2: req.body['text_row2_' + existingLayoutBom],
                    text_row3: req.body['text_row3_' + existingLayoutBom]
                })
            }
            NP_C.push({
                bom: existingLayoutBom,
                data: npC
            })
        }

        if (existingLayoutBom.slice(existingLayoutBom.length - 1, existingLayoutBom.length) == 'D') {
            let npD = [];
            if (Array.isArray(req.body['part_' + existingLayoutBom]) == true) {
                for (let i = 0; i < req.body['part_' + existingLayoutBom].length; i++) {
                    npD.push({
                        part: req.body['part_' + existingLayoutBom][i],
                        text_row1: req.body['text_row1_' + existingLayoutBom][i],
                        text_row2: req.body['text_row2_' + existingLayoutBom][i],
                        text_row3: req.body['text_row3_' + existingLayoutBom][i]
                    })
                }
            } else {
                npD.push({
                    part: req.body['part_' + existingLayoutBom],
                    text_row1: req.body['text_row1_' + existingLayoutBom],
                    text_row2: req.body['text_row2_' + existingLayoutBom],
                    text_row3: req.body['text_row3_' + existingLayoutBom]
                })
            }

            NP_D.push({
                bom: existingLayoutBom,
                data: npD
            })
        }
    }

    for (let existingSectionBom of existingSectionBoms) {
        if (existingSectionBom.slice(existingSectionBom.length - 3, existingSectionBom.length) == 'OUT') {
            let out = [];
            if (Array.isArray(req.body['qty_' + existingSectionBom]) == true) {
                for (let i = 0; i < req.body['qty_' + existingSectionBom].length; i++) {
                    out.push({
                        qty: req.body['qty_' + existingSectionBom][i],
                        partDesc: req.body['partDesc_' + existingSectionBom][i],
                        part: req.body['part_' + existingSectionBom][i],
                        material: req.body['material_' + existingSectionBom][i],
                        gauge: req.body['gauge_' + existingSectionBom][i],
                        bin: req.body['bin_' + existingSectionBom][i],
                        finish: req.body['finish_' + existingSectionBom][i],
                        weight: req.body['weight_' + existingSectionBom][i],
                    })
                }
            } else {
                out.push({
                    qty: req.body['qty_' + existingSectionBom],
                    partDesc: req.body['partDesc_' + existingSectionBom],
                    part: req.body['part_' + existingSectionBom],
                    material: req.body['material_' + existingSectionBom],
                    gauge: req.body['gauge_' + existingSectionBom],
                    bin: req.body['bin_' + existingSectionBom],
                    finish: req.body['finish_' + existingSectionBom],
                    weight: req.body['weight_' + existingSectionBom],
                })
            }
            OUT.push({
                bom: existingSectionBom,
                data: out
            });
        }
        if (existingSectionBom.slice(existingSectionBom.length - 3, existingSectionBom.length) == 'PUR') {
            let pur = [];
            if (Array.isArray(req.body['qty_' + existingSectionBom]) == true) {
                for (let i = 0; i < req.body['qty_' + existingSectionBom].length; i++) {
                    pur.push({
                        qty: req.body['qty_' + existingSectionBom][i],
                        partDesc: req.body['partDesc_' + existingSectionBom][i],
                        partNum: req.body['partNum_' + existingSectionBom][i],
                        weight: req.body['weight_' + existingSectionBom][i],
                    })
                }
            } else {
                pur.push({
                    qty: req.body['qty_' + existingSectionBom],
                    partDesc: req.body['partDesc_' + existingSectionBom],
                    partNum: req.body['partNum_' + existingSectionBom],
                    weight: req.body['weight_' + existingSectionBom],
                })
            }

            PUR.push({
                bom: existingSectionBom,
                data: pur
            });
        }
        if (existingSectionBom.slice(existingSectionBom.length - 3, existingSectionBom.length) == 'STR') {
            let str = [];
            if (Array.isArray(req.body['qty_' + existingSectionBom]) == true) {
                for (let i = 0; i < req.body['qty_' + existingSectionBom].length; i++) {
                    str.push({
                        qty: req.body['qty_' + existingSectionBom][i],
                        partDesc: req.body['partDesc_' + existingSectionBom][i],
                        part: req.body['part_' + existingSectionBom][i],
                        weight: req.body['weight_' + existingSectionBom][i],
                    })
                }
            } else {
                str.push({
                    qty: req.body['qty_' + existingSectionBom],
                    partDesc: req.body['partDesc_' + existingSectionBom],
                    part: req.body['part_' + existingSectionBom],
                    weight: req.body['weight_' + existingSectionBom],
                })
            }

            STR.push({
                bom: existingSectionBom,
                data: str
            });
        }
        if (existingSectionBom.slice(existingSectionBom.length - 3, existingSectionBom.length) == 'PNL') {
            let pnl = [];
            if (Array.isArray(req.body['qty_' + existingSectionBom]) == true) {
                for (let i = 0; i < req.body['qty_' + existingSectionBom].length; i++) {
                    pnl.push({
                        qty: req.body['qty_' + existingSectionBom][i],
                        partDesc: req.body['partDesc_' + existingSectionBom][i],
                        part: req.body['part_' + existingSectionBom][i],
                        weight: req.body['weight_' + existingSectionBom][i],
                    })
                }
            } else {
                pnl.push({
                    qty: req.body['qty_' + existingSectionBom],
                    partDesc: req.body['partDesc_' + existingSectionBom],
                    part: req.body['part_' + existingSectionBom],
                    weight: req.body['weight_' + existingSectionBom],
                })
            }
            PNL.push({
                bom: existingSectionBom,
                data: pnl
            });
        }
        if (existingSectionBom.slice(existingSectionBom.length - 3, existingSectionBom.length) == 'CTL') {
            let ctl = [];
            if (Array.isArray(req.body['qty_' + existingSectionBom]) == true) {
                for (let i = 0; i < req.body['qty_' + existingSectionBom].length; i++) {
                    ctl.push({
                        qty: req.body['qty_' + existingSectionBom][i],
                        partDesc: req.body['partDesc_' + existingSectionBom][i],
                        part: req.body['part_' + existingSectionBom][i],
                        weight: req.body['weight_' + existingSectionBom][i],
                    })
                }
            } else {
                ctl.push({
                    qty: req.body['qty_' + existingSectionBom],
                    partDesc: req.body['partDesc_' + existingSectionBom],
                    part: req.body['part_' + existingSectionBom],
                    weight: req.body['weight_' + existingSectionBom],
                })
            }
            //console.log(existingSectionBom);

            CTL.push({
                bom: existingSectionBom,
                data: ctl
            });
        }
        if (existingSectionBom.slice(existingSectionBom.length - 3, existingSectionBom.length) == 'INT') {
            let int = [];
            if (Array.isArray(req.body['qty_' + existingSectionBom]) == true) {
                for (let i = 0; i < req.body['qty_' + existingSectionBom].length; i++) {
                    int.push({
                        qty: req.body['qty_' + existingSectionBom][i],
                        partDesc: req.body['partDesc_' + existingSectionBom][i],
                        part: req.body['part_' + existingSectionBom][i],
                        weight: req.body['weight_' + existingSectionBom][i],
                    })
                }
            } else {
                int.push({
                    qty: req.body['qty_' + existingSectionBom],
                    partDesc: req.body['partDesc_' + existingSectionBom],
                    part: req.body['part_' + existingSectionBom],
                    weight: req.body['weight_' + existingSectionBom],
                })
            }

            INT.push({
                bom: existingSectionBom,
                data: int
            });
        }
        if (existingSectionBom.slice(existingSectionBom.length - 3, existingSectionBom.length) == 'EXT') {
            let ext = [];
            if (Array.isArray(req.body['qty_' + existingSectionBom]) == true) {
                for (let i = 0; i < req.body['qty_' + existingSectionBom].length; i++) {
                    ext.push({
                        qty: req.body['qty_' + existingSectionBom][i],
                        partDesc: req.body['partDesc_' + existingSectionBom][i],
                        part: req.body['part_' + existingSectionBom][i],
                        weight: req.body['weight_' + existingSectionBom][i],
                    })
                }
            } else {
                ext.push({
                    qty: req.body['qty_' + existingSectionBom],
                    partDesc: req.body['partDesc_' + existingSectionBom],
                    part: req.body['part_' + existingSectionBom],
                    weight: req.body['weight_' + existingSectionBom],
                })
            }

            EXT.push({
                bom: existingSectionBom,
                data: ext
            });
        }
        if (existingSectionBom.slice(existingSectionBom.length - 3, existingSectionBom.length) == 'SCL') {
            let scl = [];
            if (Array.isArray(req.body['qty_' + existingSectionBom]) == true) {
                for (let i = 0; i < req.body['qty_' + existingSectionBom].length; i++) {
                    scl.push({
                        qty: req.body['qty_' + existingSectionBom][i],
                        partDesc: req.body['partDesc_' + existingSectionBom][i],
                        part: req.body['part_' + existingSectionBom][i],
                        weight: req.body['weight_' + existingSectionBom][i],
                        cutLength: req.body['cutLength_' + existingSectionBom][i]
                    })
                }
            } else {
                scl.push({
                    qty: req.body['qty_' + existingSectionBom],
                    partDesc: req.body['partDesc_' + existingSectionBom],
                    part: req.body['part_' + existingSectionBom],
                    weight: req.body['weight_' + existingSectionBom],
                    cutLength: req.body['cutLength_' + existingSectionBom]
                })
            }

            SCL.push({
                bom: existingSectionBom,
                data: scl
            });
        }
    }

    //for each layout, create the secBinTrackingData based on HTML elements (using req.body[*elementName*])
    for (let layout of layouts) {
        let secBinTrackingData = [];
        let pur, str, pnl, ctl, int, ext, scl, out;
        for (let section of layout.sections.split(',')) {
            if (req.body['binTracker_OUT_' + layout.layout.slice(0,7) + section] != undefined) {
                out = req.body['binTracker_OUT_' + layout.layout.slice(0,7) + section];
            } else {
                out = 'N/A';
            }
            if (req.body['binTracker_PUR_' + layout.layout.slice(0, 7) + section] != undefined) {
                pur = req.body['binTracker_PUR_' + layout.layout.slice(0, 7) + section];
            } else {
                pur = 'N/A';
            }
            if (req.body['binTracker_STR_' + layout.layout.slice(0, 7) + section] != undefined) {
                str = req.body['binTracker_STR_' + layout.layout.slice(0, 7) + section];
            } else {
                str = 'N/A';
            }
            if (req.body['binTracker_PNL_' + layout.layout.slice(0, 7) + section] != undefined) {
                pnl = req.body['binTracker_PNL_' + layout.layout.slice(0, 7) + section];
            } else {
                pnl = 'N/A';
            }
            if (req.body['binTracker_CTL_' + layout.layout.slice(0, 7) + section] != undefined) {
                ctl = req.body['binTracker_CTL_' + layout.layout.slice(0, 7) + section];
            } else {
                ctl = 'N/A';
            }
            if (req.body['binTracker_INT_' + layout.layout.slice(0, 7) + section] != undefined) {
                int = req.body['binTracker_INT_' + layout.layout.slice(0, 7) + section];
            } else {
                int = 'N/A';
            }
            if (req.body['binTracker_EXT_' + layout.layout.slice(0, 7) + section] != undefined) {
                ext = req.body['binTracker_EXT_' + layout.layout.slice(0, 7) + section];
            } else {
                ext = 'N/A';
            }
            if (req.body['binTracker_SCL_' + layout.layout.slice(0, 7) + section] != undefined) {
                scl = req.body['binTracker_SCL_' + layout.layout.slice(0, 7) + section];
            } else {
                scl = 'N/A';
            }
            secBinTrackingData.push({
                section: section,
                data: {
                    OUT: out,
                    PUR: pur,
                    STR: str,
                    PNL: pnl,
                    CTL: ctl,
                    INT: int,
                    EXT: ext,
                    SCL: scl
                }
            });
        }
        BIN_TRACKER.push({
            layout: layout.layout,
            data: secBinTrackingData
        });
    }

    //if SS has data
    if (SS.length != 0) {
        for (let ss of SS) {
            //create new Excel workbook
            let workbook = new Excel.Workbook();
            //add sheet
            let sheet = workbook.addWorksheet('sheet1');
            //set sheet column content
            sheet.columns = [
                {header: 'Qty:', key: 'qty', width: 10, style: {font: {name: 'Calibri', size: 11}}},
                {header: 'Part Description:', key: 'partDesc', width: 40, style: {font: {name: 'Calibri', size: 11}}},
                {header: 'Part #:', key: 'part', width: 25, style: {font: {name: 'Calibri', size: 11}}}
            ];

            //for each item in bom
            for(let ssItem of ss.data) {
                //add a row to the sheet
                sheet.addRow({
                    qty: ssItem.qty,
                    partDesc: ssItem.partDesc,
                    part: ssItem.part
                });
            }
            //write to file using outputDir path
            workbook.xlsx.writeFile(outputDir + '/BIN BOMS/' + ss.bom + '.xlsx').then(function() {
                return null
            });
        }
    }

    //if OUT_L (layout) has data
    if (OUT_L.length != 0) {
        //for each out bom
        for (let out of OUT_L) {
            //create a new Excel workbook
            let workbook = new Excel.Workbook();
            //add new sheet
            let sheet = workbook.addWorksheet('sheet1');
            //set sheet columns
            sheet.columns = [
                {header: 'Quantity Per:', key: 'qty', width: 15, style: {font: {name: 'Calibri', size: 11}}},
                {header: 'Part:', key: 'part', width: 50, style: {font: {name: 'Calibri', size: 11}}},
                {header: 'Description:', key: 'desc', width: 50, style: {font: {name: 'Calibri', size: 11}}},
                {header: 'Material:', key: 'material', width: 50, style: {font: {name: 'Calibri', size: 11}}},
                {header: 'Gauge:', key: 'gauge', width: 15, style: {font: {name: 'Calibri', size: 11}}},
                {header: 'Bin:', key: 'bin', width: 10, style: {font: {name: 'Calibri', size: 11}}},
                {header: 'Finish:', key: 'finish', width: 15, style: {font: {name: 'Calibri', size: 11}}},
            ];

            //for each item in out add a row to the sheet
            for (let outItem of out.data) {
                sheet.addRow({
                    qty: parseInt(outItem.qty),
                    part: outItem.partNum,
                    desc: outItem.partDesc,
                    material: outItem.material,
                    gauge: outItem.gauge,
                    bin: outItem.bin,
                    finish: outItem.finish
                });
            }
            //write to file using outputDir path
            workbook.xlsx.writeFile(outputDir + '/BIN BOMS/' + out.bom + '.xlsx').then(function() {
                return null
            });
        }
    }

    //if AL has data in it
    if (AL.length != 0) {
        //for each al bom
        for (let al of AL) {
            //create a new Excel workbook
            let workbook = new Excel.Workbook();
            //add a new sheet to the workbook
            let sheet = workbook.addWorksheet('sheet1');
            //set sheet columns
            sheet.columns = [
                {header: 'Qty:', key: 'qty', width: 10, style: {font: {name: 'Calibri', size: 11}}},
                {header: 'Part Description:', key: 'partDesc', width: 40, style: {font: {name: 'Calibri', size: 11}}},
                {header: 'Part #:', key: 'part', width: 25, style: {font: {name: 'Calibri', size: 11}}}
            ];

            //for each item in al add a row to sheet
            for(let alItem of al.data) {
                sheet.addRow({
                    qty: alItem.qty,
                    partDesc: alItem.partDesc,
                    part: alItem.part
                });
            }
            //write to file using the outputDir path
            workbook.xlsx.writeFile(outputDir + '/BIN BOMS/' + al.bom + '.xlsx').then(function() {
                return null
            });
        }
    }

    //if GA_7 has data in it
    if (GA_7.length != 0) {
        //for each ga_7 bom
        for (let ga_7 of GA_7) {
            //create a new Excel workbook
            let workbook = new Excel.Workbook();
            //add a new sheet to the workbook
            let sheet = workbook.addWorksheet('sheet1');
            //set sheet columns
            sheet.columns = [
                {header: 'Qty:', key: 'qty', width: 10, style: {font: {name: 'Calibri', size: 11}}},
                {header: 'Part Description:', key: 'partDesc', width: 40, style: {font: {name: 'Calibri', size: 11}}},
                {header: 'Part #:', key: 'part', width: 25, style: {font: {name: 'Calibri', size: 11}}}
            ];
            //for each item in ga_7 add a row to the sheet
            for(let ga_7Item of ga_7.data) {
                sheet.addRow({
                    qty: ga_7Item.qty,
                    partDesc: ga_7Item.partDesc,
                    part: ga_7Item.part
                });
            }
            //write to file using outputDir path
            workbook.xlsx.writeFile(outputDir + '/BIN BOMS/' + ga_7.bom + '.xlsx').then(function() {
                return null
            });
        }
    }

    //if LEXAN has data in it
    if (LEXAN.length != 0) {
        //for each lexan bom
        for (let lexan of LEXAN) {
            //create a new Excel workbook
            let workbook = new Excel.Workbook();
            //add a new sheet to the workbook
            let sheet = workbook.addWorksheet('sheet1');
            //set sheet columns
            sheet.columns = [
                {header: 'Qty:', key: 'qty', width: 10, style: {font: {name: 'Calibri', size: 11}}},
                {header: 'Part Description:', key: 'partDesc', width: 40, style: {font: {name: 'Calibri', size: 11}}},
                {header: 'Part #:', key: 'part', width: 25, style: {font: {name: 'Calibri', size: 11}}}
            ];

            //for each item in lexan add a row to the sheet
            for(let lexanItem of lexan.data) {
                sheet.addRow({
                    qty: lexanItem.qty,
                    partDesc: lexanItem.partDesc,
                    part: lexanItem.part
                });
            }
            //write to file using the outputDir path
            workbook.xlsx.writeFile(outputDir + '/BIN BOMS/' + lexan.bom + '.xlsx').then(function() {
                return null
            });
        }
    }

    //if NP_A has data in it
    if (NP_A.length != 0) {
        //for each np_a bom
        for (let npA of NP_A) {
            //create a new Excel workbook
            let workbook = new Excel.Workbook();
            //add a sheet to the workbook
            let sheet = workbook.addWorksheet(npA.bom);
            //for each item in np_a add a row to the sheet
            for (let npAItem of npA.data) {
                sheet.addRow([npAItem.text_row1, npAItem.text_row2, npAItem.text_row3])
            }
            //write to file using the outputDir path
            workbook.csv.writeFile(outputDir + '/NAMEPLATES/' + npA.bom + '.csv').then(function() {
                return null
            });
        }
    }

    //if NP_B has data in it
    if (NP_B.length != 0) {
        //for each np_b bom
        for (let npB of NP_B) {
            //create a new Excel workbook
            let workbook = new Excel.Workbook();
            //add a sheet to the workbook
            let sheet = workbook.addWorksheet(npB.bom);
            //for each item in np_b add a row to the sheet
            for (let npBItem of npB.data) {
                sheet.addRow([npBItem.text_row1, npBItem.text_row2, npBItem.text_row3])
            }
            //write to file using the outputDir path
            workbook.csv.writeFile(outputDir + '/NAMEPLATES/' + npB.bom + '.csv').then(function() {
                return null
            });
        }
    }

    //if NP_C has data in it
    if (NP_C.length!= 0) {
        //for each np_c bom
        for (let npC of NP_C) {
            //create a new Excel workbook
            let workbook = new Excel.Workbook();
            //add a sheet to the workbook
            let sheet = workbook.addWorksheet(npC.bom);
            //for each item in np_c add a row to the sheet
            for (let npCItem of npC.data) {
                sheet.addRow([npCItem.text_row1, npCItem.text_row2, npCItem.text_row3])
            }
            //write to file using the outputDir path
            workbook.csv.writeFile(outputDir + '/NAMEPLATES/' + npC.bom + '.csv').then(function() {
                return null
            });
        }
    }

    //if NP_D has data in it
    if (NP_D.length != 0) {
        //for each np_d bom
        for (let npD of NP_D) {
            //create a new Excel workbook
            let workbook = new Excel.Workbook();
            //add a new sheet to the workbook
            let sheet = workbook.addWorksheet(npD.bom);
            //for each item in np_d add a row to the sheet
            for (let npDItem of npD.data) {
                sheet.addRow([npDItem.text_row1, npDItem.text_row2, npDItem.text_row3])
            }
            //write to file using the outputDir path
            workbook.csv.writeFile(outputDir + '/NAMEPLATES/' + npD.bom + '.csv').then(function() {
                return null
            });
        }
    }

    //if PUR has data in it
    if (PUR.length != 0) {
        //for each pur bom
        for (let pur of PUR) {
            //create a new Excel workbook
            let workbook = new Excel.Workbook();
            //add a new sheet to the workbook
            let sheet = workbook.addWorksheet('sheet1');
            //set sheet columns to the form needed for Jobscope Map Master
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
                {header: 'Description 1:', key: 'desc1', width: 50, style: {font: {name: 'Calibri', size: 11}}},
                {header: 'Quantity Per:', key: 'qty', width: 15, style: {font: {name: 'Calibri', size: 11}}},
                {header: 'Unit Of Issue:', key: 'unitOfIssue', width: 10, style: {font: {name: 'Calibri', size: 11}}},
                {
                    header: 'Unit Of Purchase:',
                    key: 'unitOfPurchase',
                    width: 15,
                    style: {font: {name: 'Calibri', size: 11}}
                },
                {header: 'Category Code:', key: 'categoryCode', width: 10, style: {font: {name: 'Calibri', size: 11}}},
                {header: 'Make Part:', key: 'makePart', width: 10, style: {font: {name: 'Calibri', size: 11}}},
                {header: 'Buy Part', key: 'buyPart', width: 10, style: {font: {name: 'Calibri', size: 11}}},
                {header: 'Stock Part', key: 'stockPart', width: 10, style: {font: {name: 'Calibri', size: 11}}},
                {header: 'Weight:', key: 'weight', width: 10, style: {font: {name: 'Calibri', size: 11}}}
            ];
            sheet.getColumn(2).numFmt = '000';
            //count needed for BOM sequence number
            let count = 1;
            //add first row to the sheet (needed for Jobscope)
            sheet.addRow({
                assemblyNum: pur.bom,
                seqNum: count,
                compPartNum: pur.bom,
                desc1: pur.bom + ' Bill of Material',
                qty: 1,
                unitOfIssue: 'EA',
                unitOfPurchase: 'EA',
                categoryCode: '82-BOM',
                makePart: 1,
                buyPart: 0,
                stockPart: 0,
                manufacturer: 'SAI'
            });

            //for each item in pur add a row to the sheet
            for (let purItem of pur.data) {
                count += 1;
                let seqNum = count;
                sheet.addRow({
                    assemblyNum: pur.bom,
                    seqNum: seqNum,
                    compPartNum: purItem.partNum,
                    desc1: purItem.partDesc,
                    qty: parseInt(purItem.qty),
                });
            }
            //write to file using outputDir path
            workbook.xlsx.writeFile(outputDir + '/BIN BOMS/' + pur.bom + '.xlsx').then(function() {
                return null
            });
        }
    }

    //if OUT has data in it
    if (OUT.length != 0) {
        //for each out bom
        for (let out of OUT) {
            //create a new Excel workbook
            let workbook = new Excel.Workbook();
            //add a new sheet to the workbook
            let sheet = workbook.addWorksheet('sheet1');
            //set sheet columns
            sheet.columns = [
                {header: 'Quantity Per:', key: 'qty', width: 15, style: {font: {name: 'Calibri', size: 11}}},
                {header: 'Part:', key: 'part', width: 50, style: {font: {name: 'Calibri', size: 11}}},
                {header: 'Description:', key: 'desc', width: 50, style: {font: {name: 'Calibri', size: 11}}},
                {header: 'Material:', key: 'material', width: 50, style: {font: {name: 'Calibri', size: 11}}},
                {header: 'Gauge:', key: 'gauge', width: 15, style: {font: {name: 'Calibri', size: 11}}},
                {header: 'Bin:', key: 'bin', width: 10, style: {font: {name: 'Calibri', size: 11}}},
                {header: 'Finish:', key: 'finish', width: 15, style: {font: {name: 'Calibri', size: 11}}},
            ];

            //for each item in out add a row to the sheet
            for (let outItem of out.data) {
                sheet.addRow({
                    qty: parseInt(outItem.qty),
                    part: outItem.part,
                    desc: outItem.partDesc,
                    material: outItem.material,
                    gauge: outItem.gauge,
                    bin: outItem.bin,
                    finish: outItem.finish
                });
            }
            //write to file using the outputDir path
            workbook.xlsx.writeFile(outputDir + '/BIN BOMS/' + out.bom + '.xlsx').then(function() {
                return null
            });
        }
    }

    //if STR has data in it
    if (STR.length != 0) {
        //for each str bom
        for (let str of STR) {
            //create a new Excel workbook
            let workbook = new Excel.Workbook();
            //add a new sheet to the workbook
            let sheet = workbook.addWorksheet('sheet1');
            //set sheet columns to the format needed for Jobscope Map Master
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
                {header: 'Description 1:', key: 'desc1', width: 50, style: {font: {name: 'Calibri', size: 11}}},
                {header: 'Quantity Per:', key: 'qty', width: 15, style: {font: {name: 'Calibri', size: 11}}},
                {header: 'Unit Of Issue:', key: 'unitOfIssue', width: 10, style: {font: {name: 'Calibri', size: 11}}},
                {
                    header: 'Unit Of Purchase:',
                    key: 'unitOfPurchase',
                    width: 15,
                    style: {font: {name: 'Calibri', size: 11}}
                },
                {header: 'Category Code:', key: 'categoryCode', width: 10, style: {font: {name: 'Calibri', size: 11}}},
                {header: 'Make Part:', key: 'makePart', width: 10, style: {font: {name: 'Calibri', size: 11}}},
                {header: 'Buy Part', key: 'buyPart', width: 10, style: {font: {name: 'Calibri', size: 11}}},
                {header: 'Stock Part', key: 'stockPart', width: 10, style: {font: {name: 'Calibri', size: 11}}},
                {header: 'Weight:', key: 'weight', width: 20, style: {font: {name: 'Calibri', size: 11}}}
            ];
            sheet.getColumn(2).numFmt = '000';
            //count needed for BOM sequence number
            let count = 1;
            //add first row to the sheet (needed for Jobscope)
            sheet.addRow({
                assemblyNum: str.bom,
                seqNum: count,
                compPartNum: str.bom,
                desc1: str.bom + ' Bill of Material',
                qty: 1,
                unitOfIssue: 'EA',
                unitOfPurchase: 'EA',
                categoryCode: '82-BOM',
                makePart: 1,
                buyPart: 0,
                stockPart: 0,
                manufacturer: 'SAI'
            });

            //for each item in str add a row to the sheet
            for (let strItem of str.data) {
                count += 1;
                let seqNum = count;
                sheet.addRow({
                    assemblyNum: str.bom,
                    seqNum: seqNum,
                    compPartNum: strItem.part,
                    desc1: strItem.partDesc,
                    qty: parseInt(strItem.qty),
                    unitOfIssue: 'EA',
                    unitOfPurchase: 'EA',
                    categoryCode: '91-MFG',
                    makePart: 1,
                    buyPart: 0,
                    stockPart: 0,
                    weight: strItem.weight
                });
            }
            //write to file using the outputDir path
            workbook.xlsx.writeFile(outputDir + '/BIN BOMS/' + str.bom + '.xlsx').then(function() {
                return null
            });
        }
    }

    //if PNL has data in it
    if (PNL.length != 0) {
        //for each pnl bom
        for (let pnl of PNL) {
            //create a new Excel workbook
            let workbook = new Excel.Workbook();
            //add a new sheet to the workbook
            let sheet = workbook.addWorksheet('sheet1');
            //set sheet columns to the format needed for Jobscope Map Master
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
                {header: 'Description 1:', key: 'desc1', width: 50, style: {font: {name: 'Calibri', size: 11}}},
                {header: 'Quantity Per:', key: 'qty', width: 15, style: {font: {name: 'Calibri', size: 11}}},
                {header: 'Unit Of Issue:', key: 'unitOfIssue', width: 10, style: {font: {name: 'Calibri', size: 11}}},
                {
                    header: 'Unit Of Purchase:',
                    key: 'unitOfPurchase',
                    width: 15,
                    style: {font: {name: 'Calibri', size: 11}}
                },
                {header: 'Category Code:', key: 'categoryCode', width: 10, style: {font: {name: 'Calibri', size: 11}}},
                {header: 'Make Part:', key: 'makePart', width: 10, style: {font: {name: 'Calibri', size: 11}}},
                {header: 'Buy Part', key: 'buyPart', width: 10, style: {font: {name: 'Calibri', size: 11}}},
                {header: 'Stock Part', key: 'stockPart', width: 10, style: {font: {name: 'Calibri', size: 11}}},
                {header: 'Weight:', key: 'weight', width: 15, style: {font: {name: 'Calibri', size: 11}}}
            ];
            sheet.getColumn(2).numFmt = '000';
            //count needed for BOM sequence number
            let count = 1;
            //add first row to the sheet (needed for Jobscope)
            sheet.addRow({
                assemblyNum: pnl.bom,
                seqNum: count,
                compPartNum: pnl.bom,
                desc1: pnl.bom + ' Bill of Material',
                qty: 1,
                unitOfIssue: 'EA',
                unitOfPurchase: 'EA',
                categoryCode: '82-BOM',
                makePart: 1,
                buyPart: 0,
                stockPart: 0,
                manufacturer: 'SAI'
            });

            //for each item in pnl add a row to the sheet
            for (let pnlItem of pnl.data) {
                count += 1;
                let seqNum = count;
                sheet.addRow({
                    assemblyNum: pnl.bom,
                    seqNum: seqNum,
                    compPartNum: pnlItem.part,
                    desc1: pnlItem.partDesc,
                    qty: parseInt(pnlItem.qty),
                    unitOfIssue: 'EA',
                    unitOfPurchase: 'EA',
                    categoryCode: '91-MFG',
                    makePart: 1,
                    buyPart: 0,
                    stockPart: 0,
                    weight: pnlItem.weight
                });
            }
            //write to file using outputDir path
            workbook.xlsx.writeFile(outputDir + '/BIN BOMS/' + pnl.bom + '.xlsx').then(function() {
                return null
            });
        }
    }

    //if CTL has data in it
    if (CTL.length != 0) {
        //for each ctl bom
        for (let ctl of CTL) {
            //create a new Excel workbook
            let workbook = new Excel.Workbook();
            //add a new sheet to the workbook
            let sheet = workbook.addWorksheet('sheet1');
            //set sheet columns to the format needed for Jobscope Map Master
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
                {header: 'Description 1:', key: 'desc1', width: 50, style: {font: {name: 'Calibri', size: 11}}},
                {header: 'Quantity Per:', key: 'qty', width: 15, style: {font: {name: 'Calibri', size: 11}}},
                {header: 'Unit Of Issue:', key: 'unitOfIssue', width: 10, style: {font: {name: 'Calibri', size: 11}}},
                {
                    header: 'Unit Of Purchase:',
                    key: 'unitOfPurchase',
                    width: 15,
                    style: {font: {name: 'Calibri', size: 11}}
                },
                {header: 'Category Code:', key: 'categoryCode', width: 10, style: {font: {name: 'Calibri', size: 11}}},
                {header: 'Make Part:', key: 'makePart', width: 10, style: {font: {name: 'Calibri', size: 11}}},
                {header: 'Buy Part', key: 'buyPart', width: 10, style: {font: {name: 'Calibri', size: 11}}},
                {header: 'Stock Part', key: 'stockPart', width: 10, style: {font: {name: 'Calibri', size: 11}}},
                {header: 'Weight:', key: 'weight', width: 20, style: {font: {name: 'Calibri', size: 11}}}
            ];
            sheet.getColumn(2).numFmt = '000';
            //count needed for BOM sequence number
            let count = 1;
            //add firrst row to the sheett (needed for Jobscope)
            sheet.addRow({
                assemblyNum: ctl.bom,
                seqNum: count,
                compPartNum: ctl.bom,
                desc1: ctl.bom + ' Bill of Material',
                qty: 1,
                unitOfIssue: 'EA',
                unitOfPurchase: 'EA',
                categoryCode: '82-BOM',
                makePart: 1,
                buyPart: 0,
                stockPart: 0,
                manufacturer: 'SAI'
            });

            // for each item in ctl add a row to the sheet
            for (let ctlItem of ctl.data) {
                count += 1;
                let seqNum = count;
                sheet.addRow({
                    assemblyNum: ctl.bom,
                    seqNum: seqNum,
                    compPartNum: ctlItem.part,
                    desc1: ctlItem.partDesc,
                    qty: parseInt(ctlItem.qty),
                    unitOfIssue: 'EA',
                    unitOfPurchase: 'EA',
                    categoryCode: '91-MFG',
                    makePart: 1,
                    buyPart: 0,
                    stockPart: 0,
                    weight: ctlItem.weight
                });
            }
            //write to file using the outputDir path
            workbook.xlsx.writeFile(outputDir + '/BIN BOMS/' + ctl.bom + '.xlsx').then(function() {
                return null
            });
        }
    }

    //if INT has data in it
    if (INT.length != 0) {
        //for each int bom
        for (let int of INT) {
            //create a new Excel workbook
            let workbook = new Excel.Workbook();
            //add a sheet to the workbook
            let sheet = workbook.addWorksheet('sheet1');
            //set sheet columns to the format needed for Jobscope Map Master
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
                {header: 'Description 1:', key: 'desc1', width: 50, style: {font: {name: 'Calibri', size: 11}}},
                {header: 'Quantity Per:', key: 'qty', width: 15, style: {font: {name: 'Calibri', size: 11}}},
                {header: 'Unit Of Issue:', key: 'unitOfIssue', width: 10, style: {font: {name: 'Calibri', size: 11}}},
                {
                    header: 'Unit Of Purchase:',
                    key: 'unitOfPurchase',
                    width: 15,
                    style: {font: {name: 'Calibri', size: 11}}
                },
                {header: 'Category Code:', key: 'categoryCode', width: 10, style: {font: {name: 'Calibri', size: 11}}},
                {header: 'Make Part:', key: 'makePart', width: 10, style: {font: {name: 'Calibri', size: 11}}},
                {header: 'Buy Part', key: 'buyPart', width: 10, style: {font: {name: 'Calibri', size: 11}}},
                {header: 'Stock Part', key: 'stockPart', width: 10, style: {font: {name: 'Calibri', size: 11}}},
                {header: 'Weight:', key: 'weight', width: 20, style: {font: {name: 'Calibri', size: 11}}}
            ];
            sheet.getColumn(2).numFmt = '000';
            //count needed for BOM sequence number
            let count = 1;
            //add first row to the sheet (needed for Jobscope)
            sheet.addRow({
                assemblyNum: int.bom,
                seqNum: count,
                compPartNum: int.bom,
                desc1: int.bom + ' Bill of Material',
                qty: 1,
                unitOfIssue: 'EA',
                unitOfPurchase: 'EA',
                categoryCode: '82-BOM',
                makePart: 1,
                buyPart: 0,
                stockPart: 0,
                manufacturer: 'SAI'
            });

            //for each item in int add a row to the sheet
            for (let intItem of int.data) {
                count += 1;
                let seqNum = count;
                sheet.addRow({
                    assemblyNum: int.bom,
                    seqNum: seqNum,
                    compPartNum: intItem.part,
                    desc1: intItem.partDesc,
                    qty: parseInt(intItem.qty),
                    unitOfIssue: 'EA',
                    unitOfPurchase: 'EA',
                    categoryCode: '91-MFG',
                    makePart: 1,
                    buyPart: 0,
                    stockPart: 0,
                    weight: intItem.weight
                });
            }
            //write to file using the outputDir path
            workbook.xlsx.writeFile(outputDir + '/BIN BOMS/' + int.bom + '.xlsx').then(function() {
                return null
            });
        }
    }

    //if EXT has data in it
    if (EXT.length != 0) {
        //for each ext bom
        for (let ext of EXT) {
            //create a new Excel workbook
            let workbook = new Excel.Workbook();
            //add a new sheet to the workbook
            let sheet = workbook.addWorksheet('sheet1');
            //set sheet columns to the format needed for Jobscope Map Master
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
                {header: 'Description 1:', key: 'desc1', width: 50, style: {font: {name: 'Calibri', size: 11}}},
                {header: 'Quantity Per:', key: 'qty', width: 15, style: {font: {name: 'Calibri', size: 11}}},
                {header: 'Unit Of Issue:', key: 'unitOfIssue', width: 10, style: {font: {name: 'Calibri', size: 11}}},
                {
                    header: 'Unit Of Purchase:',
                    key: 'unitOfPurchase',
                    width: 15,
                    style: {font: {name: 'Calibri', size: 11}}
                },
                {header: 'Category Code:', key: 'categoryCode', width: 10, style: {font: {name: 'Calibri', size: 11}}},
                {header: 'Make Part:', key: 'makePart', width: 10, style: {font: {name: 'Calibri', size: 11}}},
                {header: 'Buy Part', key: 'buyPart', width: 10, style: {font: {name: 'Calibri', size: 11}}},
                {header: 'Stock Part', key: 'stockPart', width: 10, style: {font: {name: 'Calibri', size: 11}}},
                {header: 'Weight:', key: 'weight', width: 20, style: {font: {name: 'Calibri', size: 11}}}
            ];
            sheet.getColumn(2).numFmt = '000';
            //count needed for BOM sequence number
            let count = 1;
            //add first row to the sheet (needed for Jobscope)
            sheet.addRow({
                assemblyNum: ext.bom,
                seqNum: count,
                compPartNum: ext.bom,
                desc1: ext.bom + ' Bill of Material',
                qty: 1,
                unitOfIssue: 'EA',
                unitOfPurchase: 'EA',
                categoryCode: '82-BOM',
                makePart: 1,
                buyPart: 0,
                stockPart: 0,
                manufacturer: 'SAI'
            });

            //for each item in ext add a row to the sheet
            for (let extItem of ext.data) {
                count += 1;
                let seqNum = count;
                sheet.addRow({
                    assemblyNum: ext.bom,
                    seqNum: seqNum,
                    compPartNum: extItem.part,
                    desc1: extItem.partDesc,
                    qty: parseInt(extItem.qty),
                    unitOfIssue: 'EA',
                    unitOfPurchase: 'EA',
                    categoryCode: '91-MFG',
                    makePart: 1,
                    buyPart: 0,
                    stockPart: 0,
                    weight: extItem.weight
                });
            }
            //write to file using the outputDir path
            workbook.xlsx.writeFile(outputDir + '/BIN BOMS/' + ext.bom + '.xlsx').then(function() {
                return null
            });
        }
    }

    //if SCL has data in it
    if (SCL.length != 0) {
        //for each scl bom
        for (let scl of SCL) {
            //create a new Excel workbook
            let workbook = new Excel.Workbook();
            //add a sheet to the workbook
            let sheet = workbook.addWorksheet('sheet1');
            //set sheet columns
            sheet.columns = [
                {header: 'Total Qty Required', key: 'qty', width: 30, style: {font: {name: 'Calibri', size: 11}}},
                {header: 'Mat\'l Category Code', key: 'catCode', width: 20, style: {font: {name: 'Calibri', size: 11}}},
                {header: 'Jobscope Stock #', key: 'jobscopeStockNum', width: 25, style: {font: {name: 'Calibri', size: 11}}},
                {header: 'by', key: 'by1', width: 5, style: {font: {name: 'Calibri', size: 11}}},
                {header: 'Length', key: 'length', width: 10, style: {font: {name: 'Calibri', size: 11}}},
                {header: 'by', key: 'by2', width: 5, style: {font: {name: 'Calibri', size: 11}}},
                {header: 'Width', key: 'width', width: 10, style: {font: {name: 'Calibri', size: 11}}},
                {header: 'Part Description', key: 'partDesc', width: 40, style: {font: {name: 'Calibri', size: 11}}},
                {header: 'Program Number', key: 'programNum', width: 20, style: {font: {name: 'Calibri', size: 11}}},
                {header: 'PART #', key: 'partNum', width: 25, style: {font: {name: 'Calibri', size: 11}}}
            ];

            //for each item in scl
            for(let sclItem of scl.data) {
                //figure out what the stock number is based on context
                let jobscopeStockNum;
                switch(sclItem.partDesc.split(',')[0]) {
                    case 'OUTER TUBE':
                        jobscopeStockNum = 'GREEN OUTER TUBE';
                        break;
                    case 'INNER TUBE':
                        jobscopeStockNum = 'BLACK INNER TUBE';
                        break;
                    case 'THREADED ROD':
                        jobscopeStockNum = 'THREADED ROD';
                        break;
                }

                //add a row to the sheet
                sheet.addRow({
                    qty: sclItem.qty,
                    catCode: 'MISC',
                    jobscopeStockNum: jobscopeStockNum,
                    by1: 'x',
                    length: sclItem.cutLength,
                    by2: 'X',
                    partDesc: sclItem.partDesc,
                    partNum: sclItem.part
                });
            }
            //write to file using the outputDir path
            workbook.xlsx.writeFile(outputDir + '/BIN BOMS/' + scl.bom + '.xlsx').then(function() {
                return null
            });
        }
    }

    //if BIN_TRACKER has data in it
    if (BIN_TRACKER.length != 0) {
        //for each binTracker bom
        for (let binTracker of BIN_TRACKER) {
            //create a new Excel workbook
            let workbook = new Excel.Workbook();
            //add a sheet to the workbook
            let sheet = workbook.addWorksheet('sheet1');
            //set sheet columns to the various bom names
            sheet.columns = [
                {header: 'Section:', key: 'section', width: 20, style: {font: {name: 'Calibri', size: 11}}},
                {header: 'PUR:', key: 'pur', width: 30, style: {font: {name: 'Calibri', size: 11}}},
                {header: 'STR:', key: 'str', width: 30, style: {font: {name: 'Calibri', size: 11}}},
                {header: 'PNL:', key: 'pnl', width: 30, style: {font: {name: 'Calibri', size: 11}}},
                {header: 'CTL:', key: 'ctl', width: 30, style: {font: {name: 'Calibri', size: 11}}},
                {header: 'INT:', key: 'int', width: 30, style: {font: {name: 'Calibri', size: 11}}},
                {header: 'EXT:', key: 'ext', width: 30, style: {font: {name: 'Calibri', size: 11}}},
                {header: 'SCL:', key: 'scl', width: 30, style: {font: {name: 'Calibri', size: 11}}},
                {header: 'OUT:', key: 'out', width: 30, style: {font: {name: 'Calibri', size: 11}}}
            ];
            //for each item in binTracker add a row to the sheet
            for (let binTrackerItem of binTracker.data) {
                sheet.addRow({
                    section: binTrackerItem.section,
                    pur: binTrackerItem.data.PUR,
                    str: binTrackerItem.data.STR,
                    pnl: binTrackerItem.data.PNL,
                    ctl: binTrackerItem.data.CTL,
                    int: binTrackerItem.data.INT,
                    ext: binTrackerItem.data.EXT,
                    scl: binTrackerItem.data.SCL,
                    out: binTrackerItem.data.OUT
                });
            }
            //write to file using the outputDir path
            workbook.xlsx.writeFile(outputDir + '/BIN BOMS/' + binTracker.layout + '-BIN_TRACKER' + '.xlsx').then(function() {
                return null
            });
        }
    }

    //create the drawings JSON array from the .drw files in the working directory
    for (let i = 0; i < drawingCount - 1; i++) {
        drawings.push({
            name: drawingNames[i],
            pdf: parseInt(pdfs[i]),
            dxf: parseInt(dxfs[i]),
            step: parseInt(steps[i])
        })
    }

    //create the layout level OUTSOURCE bom
    for (let layout of layouts) {
        OUTSOURCE.push({
            layout: layout.layout,
            sections: layout.sections.split(','),
            data: []
        });
    }

    //this section is to compose the layout level OUTSOURCE bom by
    //cross referencing the bin boms and adding/updating qtys

    //for each drawing
    for (let drawing of drawings) {
        //if drawing has a name and the step checkbox is checked
        if (drawing.name != undefined && drawing.step == 1) {
            //for each outsource bom
            for (let outsource of OUTSOURCE) {
                //filter the BIN_TRACKER down to the layout level
                let trackerFilter = BIN_TRACKER.filter(e => e.layout == outsource.layout);
                //for each section in the outsource bom
                for (let section of outsource.sections) {
                    //further filter the trackerFilter down to the specific section and log the results to variables
                    let sectionFilter = trackerFilter[0].data.filter(e => e.section == section);
                    let secSTR = sectionFilter[0].data.STR;
                    let secPNL = sectionFilter[0].data.PNL;
                    let secCTL = sectionFilter[0].data.CTL;
                    let secINT = sectionFilter[0].data.INT;
                    let secEXT = sectionFilter[0].data.EXT;

                    //if secSTR has data in it
                    if (secSTR != 'N/A') {
                        //filter STR
                        let filterSTR = STR.filter(e => e.bom == secSTR);
                        if (filterSTR.length != 0) {
                            for (let item of filterSTR[0].data) {
                                if (item.part == drawing.name.slice(0,drawing.name.length - 4)) {
                                    if (outsource.data.filter(e => e.part == item.part).length == 0) {
                                        outsource.data.push({
                                            qty: parseInt(item.qty),
                                            partDesc: item.partDesc,
                                            part: item.part,
                                            weight: item.weight
                                        });
                                    } else {
                                        outsource.data.filter(e => e.part == item.part)[0].qty += parseInt(item.qty);
                                    }
                                }
                            }
                        }
                    }

                    if (secPNL != 'N/A') {
                        let filterPNL = PNL.filter(e => e.bom == secPNL);
                        if (filterPNL.length != 0) {
                            for (let item of filterPNL[0].data) {
                                if (item.part == drawing.name.slice(0,drawing.name.length - 4)) {
                                    if (outsource.data.filter(e => e.part == item.part).length == 0) {
                                        outsource.data.push({
                                            qty: parseInt(item.qty),
                                            partDesc: item.partDesc,
                                            part: item.part,
                                            weight: item.weight
                                        });
                                    } else {
                                        outsource.data.filter(e => e.part == item.part)[0].qty += parseInt(item.qty);
                                    }
                                }
                            }
                        }
                    }

                    if (secCTL != 'N/A') {
                        let filterCTL = CTL.filter(e => e.bom == secCTL);
                        if (filterCTL.length != 0) {
                            for (let item of filterCTL[0].data) {
                                if (item.part == drawing.name.slice(0,drawing.name.length - 4)) {
                                    if (outsource.data.filter(e => e.part == item.part).length == 0) {
                                        outsource.data.push({
                                            qty: parseInt(item.qty),
                                            partDesc: item.partDesc,
                                            part: item.part,
                                            weight: item.weight
                                        });
                                    } else {
                                        outsource.data.filter(e => e.part == item.part)[0].qty += parseInt(item.qty);
                                    }
                                }
                            }
                        }
                    }

                    if (secINT != 'N/A') {
                        let filterINT = INT.filter(e => e.bom == secINT);
                        if (filterINT.length != 0) {
                            for (let item of filterINT[0].data) {
                                if (item.part == drawing.name.slice(0,drawing.name.length - 4)) {
                                    if (outsource.data.filter(e => e.part == item.part).length == 0) {
                                        outsource.data.push({
                                            qty: parseInt(item.qty),
                                            partDesc: item.partDesc,
                                            part: item.part,
                                            weight: item.weight
                                        });
                                    } else {
                                        outsource.data.filter(e => e.part == item.part)[0].qty += parseInt(item.qty);
                                    }
                                }
                            }
                        }
                    }

                    if (secEXT != 'N/A') {
                        let filterEXT = EXT.filter(e => e.bom == secEXT);
                        if (filterEXT.length != 0) {
                            for (let item of filterEXT[0].data) {
                                if (item.part == drawing.name.slice(0,drawing.name.length - 4)) {
                                    if (outsource.data.filter(e => e.part == item.part).length == 0) {
                                        outsource.data.push({
                                            qty: parseInt(item.qty),
                                            partDesc: item.partDesc,
                                            part: item.part,
                                            weight: item.weight
                                        });
                                    } else {
                                        outsource.data.filter(e => e.part == item.part)[0].qty += parseInt(item.qty);
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    //if OUTSOURCE has data in it
    if (OUTSOURCE.length != 0) {
        //for each outsource bom
        for (let outsource of OUTSOURCE) {
            //create a new Excel workbook
            let workbook = new Excel.Workbook();
            //add a new sheet to the workbook
            let sheet = workbook.addWorksheet('sheet1');
            //set sheet columns to the format needed for Jobscope Map Master
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
                {header: 'Description 1:', key: 'desc1', width: 50, style: {font: {name: 'Calibri', size: 11}}},
                {header: 'Quantity Per:', key: 'qty', width: 15, style: {font: {name: 'Calibri', size: 11}}},
                {header: 'Unit Of Issue:', key: 'unitOfIssue', width: 10, style: {font: {name: 'Calibri', size: 11}}},
                {
                    header: 'Unit Of Purchase:',
                    key: 'unitOfPurchase',
                    width: 15,
                    style: {font: {name: 'Calibri', size: 11}}
                },
                {header: 'Category Code:', key: 'categoryCode', width: 10, style: {font: {name: 'Calibri', size: 11}}},
                {header: 'Make Part:', key: 'makePart', width: 10, style: {font: {name: 'Calibri', size: 11}}},
                {header: 'Buy Part', key: 'buyPart', width: 10, style: {font: {name: 'Calibri', size: 11}}},
                {header: 'Stock Part', key: 'stockPart', width: 10, style: {font: {name: 'Calibri', size: 11}}},
                {header: 'Weight:', key: 'weight', width: 20, style: {font: {name: 'Calibri', size: 11}}}
            ];
            sheet.getColumn(2).numFmt = '000';
            //count needed for BOM sequence number
            let count = 1;
            //add first row (needed for Jobscope)
            sheet.addRow({
                assemblyNum: outsource.layout + "-OUTSOURCE",
                seqNum: count,
                compPartNum: outsource.layout + "-OUTSOURCE",
                desc1: outsource.layout + "-OUTSOURCE Bill of Material",
                qty: 1,
                unitOfIssue: 'EA',
                unitOfPurchase: 'EA',
                categoryCode: '82-BOM',
                makePart: 1,
                buyPart: 0,
                stockPart: 0,
                manufacturer: 'SAI'
            });

            //for each item in outsource add a row to the workbook
            for (let outsourceItem of outsource.data) {
                count += 1;
                let seqNum = count;
                sheet.addRow({
                    assemblyNum: outsource.layout + "-OUTSOURCE",
                    seqNum: seqNum,
                    compPartNum: outsourceItem.part,
                    desc1: outsourceItem.partDesc,
                    qty: outsourceItem.qty,
                    unitOfIssue: 'EA',
                    unitOfPurchase: 'EA',
                    categoryCode: '91-MFG',
                    makePart: 1,
                    buyPart: 0,
                    stockPart: 0,
                    weight: outsourceItem.weight
                });
            }
            //write to file using the outputDir
            workbook.xlsx.writeFile(outputDir + '/BIN BOMS/' + outsource.layout + '-OUTSOURCE' + '.xlsx').then(function() {
                return null
            });
        }
    }


    //openAndExport_PDF_DXF async function definition
    //takes in a .drw file, opens it, and then generates a PDF
    async function openAndExport_PDF_DXF(sessionId, drawings) {
        //looks for *dop file
        //I THINK THIS DOP FILE MAY BE A WAY TO ELIMINATE
        //HAVING TO CHECK THE PDF SETTINGS ONCE BEFORE RUNNING THE SCRIPT
        const doesSetupExist = await creo(sessionId, {
            command: "creo",
            function: "list_files",
            data: {
                "filename": "*dop"
            }
        });


        //if no dop then execute a mapkey that tries to change the settings
        if (doesSetupExist.data.filelist.length == 0) {
            await creo(sessionId, {
                command: "interface",
                function: "mapkey",
                data: {
                    "script":
                        "~ Command `ProCmdExportPreview` ;~ Command `ProCmdDwgPubSettings` ;\n" +
                        "~ Update `intf_profile` `opt_profile` `drawing_setup`;\n" +
                        "~ Select `intf_profile` `pdf_export.pdf_sheets_choice` 1 `current`;\n" +
                        "~ Select `intf_profile` `pdf_export.pdf_color_depth` 1 `pdf_mono`;\n" +
                        "~ Activate `intf_profile` `pdf_export.pdf_launch_viewer` 0;\n" +
                        "~ Activate `intf_profile` `psh_profile_save`;\n" +
                        "~ Activate `intf_profile` `OkPshBtn`;"
                }
            });
        }

        //for each drawing
        for (let drawing of drawings) {
            //if pdf and dxf is checked then assume it is page 1 pdf and page 2 dxf
            if (drawing.pdf == 1 && drawing.dxf == 1) {
                await exportSheet1PDF(sessionId, drawing);
                await exportSheet2DXF(sessionId, drawing);
            }
            //if only pdf then assume it is page 1 pdf
            if (drawing.pdf == 1 && drawing.dxf == 0) {
                await exportSheet1PDF(sessionId, drawing);
            }
            //if only dxf then assume it is page 1 dxf
            if (drawing.pdf == 0 && drawing.dxf == 1) {
                await exportSheet1DXF(sessionId, drawing);
            }
            //if step then export part step
            if (drawing.step == 1) {
                await exportPartSTEP(sessionId, drawing);
            }
        }
        return null
    }

    //execute the async open and export PDF_DXF_BINBOM function declared above
    openAndExport_PDF_DXF(sessionId, drawings)
        .then(() => {
            //redirect to the the main PDF-DXF-BIN BOM page (not using render since we dont need to send any data here)
            res.locals = {title: 'PDF-DXF-BIN BOM'};
            res.redirect('/PDF-DXF-BIN_BOM');
        })
        .catch(err => {
            console.log(err);
        });
};

