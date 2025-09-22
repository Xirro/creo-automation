//path import
const path = require('path');

//Excel Connection
const Excel = require('exceljs');

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

// Creoson Connection (axios)
const axios = require('axios');
let creoHttp = 'http://localhost:9056/creoson';
let sessionId = '';
axios.post(creoHttp, { command: 'connection', function: 'connect' })
    .then(resp => {
        sessionId = resp.data && resp.data.sessionId;
        axios.post(creoHttp, { sessionId: sessionId, command: 'creo', function: 'set_creo_version', data: { version: '3' } });
    })
    .catch(err => {
        if (err.code === 'ECONNREFUSED') console.log('> Error in pdfDxfBinBomController.js: Creoson server not reachable');
        else console.log('> There was an error in pdfDxfBinBomController.js:', err);
    });

//creo function (used to remove some of the boilerplate thats involved with creoson http calls)
//Inputs: creoson sessionId provided from above, and function data JSON object
//Outputs: a POST request, formatted in Creoson JSON syntax in the form of a promise
function creo(sessionId, functionData) {
    const payload = { sessionId: sessionId, command: functionData.command, function: functionData.function };
    if (functionData.data && functionData.data.length !== undefined && functionData.data.length !== 0) payload.data = functionData.data;
    return axios.post(creoHttp, payload).then(r => r.data);
}


//*********************************MECHANICAL ENG. PORTAL*************************************//



//IN ANY OF THESE FUNCTIONS IF YOU WANT TO DEBUG OR ANALYZE THE BEHAVIOR
//THE BEST THING TO DO IS console.log WHATEVER VARIABLE, OBJECT, ARRAY, PROPERTY, ETC. THAT YOU ARE TRYING TO STUDY


exports = {};
module.exports = exports;

//pdfDxfBinBom function (directs user to the main pdfDxfBinBom page)
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

//setWD function (sets creo's working directory)
exports.setWD = function(req, res) {
    //initialize variables
    let message = null;
    let workingDir = req.body.CREO_workingDir;
    let outputDir = workingDir + '/_outputDir';
    let topLevelAsmList = [];

    //cdAndCreateOutputDir async function definition (sets the working directory and creates the _outputDir, updates message if it has a problem with either setting or creating)
    async function cdAndCreateOutputDir() {
        //pass the current creo wd to dir
        let dir = await creo(sessionId, {
            command: "creo",
            function: "pwd",
            data: {}
        });

        //if dir exists
        if (dir.data != undefined) {
            //if dirname is not workingDir
            if (dir.data.dirname != workingDir) {
                await creo(sessionId, {
                    command: "creo",
                    function: "cd",
                    data: {
                        "dirname": workingDir
                    }
                });

                //list the inner dirs that begin with _outputDir
                let innerDirs = await creo(sessionId, {
                    command: "creo",
                    function: "list_dirs",
                    data: {
                        "dirname": "_outputDir"
                    }
                });
                console.log(innerDirs);

                //if no innerDirs already exist
                if (innerDirs.data.dirlist.length == 0 || !innerDirs.data) {
                    //make the _outputDir folder
                    await creo(sessionId, {
                        command: "creo",
                        function: "mkdir",
                        data: {
                            "dirname": "_outputDir"
                        }
                    });
                    //make the _outputDir/PDF folder
                    await creo(sessionId, {
                        command: "creo",
                        function: "mkdir",
                        data: {
                            "dirname": "_outputDir\\PDF"
                        }
                    });
                    //make the _outputDir/DXF folder
                    await creo(sessionId, {
                        command: "creo",
                        function: "mkdir",
                        data: {
                            "dirname": "_outputDir\\DXF"
                        }
                    });
                    //make the _outputDir/BIN BOMS folder
                    await creo(sessionId, {
                        command: "creo",
                        function: "mkdir",
                        data: {
                            "dirname": "_outputDir\\BIN BOMS"
                        }
                    });
                    //make the _outputDir/NAMEPLATES folder
                    await creo(sessionId, {
                        command: "creo",
                        function: "mkdir",
                        data: {
                            "dirname": "_outputDir\\NAMEPLATES"
                        }
                    });
                    //make the _outputDir/STEP folder
                    await creo(sessionId, {
                        command: "creo",
                        function: "mkdir",
                        data: {
                            "dirname": "_outputDir\\STEP"
                        }
                    });
                } else {
                //if _outputDir already exists, then send a warning message to the user to remove it
                    message = "_outputDir already exists within the working directory. Please remove before continuing.";
                }
            } else {
            //if dirname is already matches workingDir
                //list the innerDirs that match _outputDir
                let innerDirs = await creo(sessionId, {
                    command: "creo",
                    function: "list_dirs",
                    data: {
                        "dirname": "_outputDir"
                    }
                });

                console.log(innerDirs);

                //if no innerDirs exist
                if (innerDirs.data.dirlist.length == 0 || !innerDirs.data) {
                    //make the _outputDir folder
                    await creo(sessionId, {
                        command: "creo",
                        function: "mkdir",
                        data: {
                            "dirname": "_outputDir"
                        }
                    });
                    //make the _outputDir/PDF folder
                    await creo(sessionId, {
                        command: "creo",
                        function: "mkdir",
                        data: {
                            "dirname": "_outputDir\\PDF"
                        }
                    });
                    //make the _outputDir/DXF folder
                    await creo(sessionId, {
                        command: "creo",
                        function: "mkdir",
                        data: {
                            "dirname": "_outputDir\\DXF"
                        }
                    });
                    //make the _outputDir/BIN BOMS folder
                    await creo(sessionId, {
                        command: "creo",
                        function: "mkdir",
                        data: {
                            "dirname": "_outputDir\\BIN BOMS"
                        }
                    });
                    //make the _outputDir/NAMEPLATES folder
                    await creo(sessionId, {
                        command: "creo",
                        function: "mkdir",
                        data: {
                            "dirname": "_outputDir\\NAMEPLATES"
                        }
                    });
                    //make the _outputDir/STEP folder
                    await creo(sessionId, {
                        command: "creo",
                        function: "mkdir",
                        data: {
                            "dirname": "_outputDir\\STEP"
                        }
                    });
                } else {
                    //if _outputDir already exists, then send a warning message to the user to remove it
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
                    //if there are no asm instances, then only push the generic
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
        //pass current creo wd to dir
        let dir = await creo(sessionId, {
            command: "creo",
            function: "pwd",
            data: {}
        });

        //if dirname isnt workingDir, then set wd
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
        //initialize drawingsList
        let drawingsList = [];
        //list all .drw files in the wd
        const workingDirDwgs = await creo(sessionId, {
            command: "creo",
            function: "list_files",
            data: {
                "filename":"*drw"
            }
        });

        //for each drawing
        for (let drawing of drawings) {
            //if workingDirDwgs has a record existing
            if (workingDirDwgs.data.filelist.includes(drawing) == true) {
                //push to drwaingsList with success message
                drawingsList.push({
                    drawing: drawing,
                    message: 'OK'
                });
            } else {
                //push to drwaingsList with failure message
                drawingsList.push({
                    drawing: drawing,
                    message: 'Drawing does not exist'
                });
            }
        }

        //for each drawing
        for (let drawing of drawingsList) {
            //push to sortedCheckedDwgs
            sortedCheckedDwgs.push({
                drawing: drawing.drawing,
                message: drawing.message
            });
        }

        //sort sortedCheckedDwgs in ascending order
        sortedCheckedDwgs.sort(function(a,b) {
            let intA = parseInt(a.drawing.slice(7,11)+a.drawing.slice(12,15));
            let intB = parseInt(b.drawing.slice(7,11)+b.drawing.slice(12,15));
            return intA - intB
        });

        return sortedCheckedDwgs
    }

    //checkFlats async function definition
    async function checkFlats(sessionId, sortedCheckedDwgs) {
        //initialize unmatchedParts
        let unmatchedParts = [];
        //for each drawing
        for (let drawing of sortedCheckedDwgs) {
            //if middle 4 digits begin with a 1, 2, or 3
            if (drawing.drawing.slice(7,8) == '1' || drawing.drawing.slice(7,8) == '2' || drawing.drawing.slice(7,8) == '3' ) {
                //initialize message as 'OK'
                let message = 'OK';
                //open drawing
                let openDwg = await creo(sessionId, {
                    command: "file",
                    function: "open",
                    data: {
                        "file": drawing.drawing,
                        "display": true,
                        "activate": true
                    }
                });
                //if there was an error in opening the drawing, update the message accordingly
                if (openDwg.status.error == true) {
                    message = 'Unable to open drawing'
                } else {
                //if no error in opening the drawing, then list the models associated with the drawing
                    const listModels = await creo(sessionId, {
                        command: "drawing",
                        function: "list_models",
                        data: {
                            "drawing": drawing.drawing
                        }
                    });
                    let drawingModels = listModels.data.files;
                    //for each model
                    for (let i = 0; i < drawingModels.length; i++) {
                        //if the last 3 digits dont match, then update the message accordingly
                        if (drawingModels[i].slice(12, 15) != drawing.drawing.slice(12,15)) {
                            message = 'Drawing models do not match'
                        }
                    }
                }

                //if message is not OK, then push it to unmatchedParts
                if (message != 'OK') {
                    unmatchedParts.push({
                        part: drawing.drawing,
                        message: message
                    });
                }
            }
        }
        //for each unmatched part
        for (let unmatchedPart of unmatchedParts) {
            //for each drawing
            for (let sortedCheckedDwg of sortedCheckedDwgs) {
                //if the full part number doesnt match, then update the sortedCheckDwg message as well
                if (sortedCheckedDwg.drawing.slice(0, 15) == unmatchedPart.part.slice(0, 15)) {
                    sortedCheckedDwg.message = unmatchedPart.message
                }
            }
        }
        return null
    }

    //getNameplateParams async function definition
    async function getNameplateParams(sessionId, part, qty, NP) {
        //initialize TEMPLATE
        let TEMPLATE = 'NULL';
        
        //list the NAMEPLATE_TYPE param of the part and write it to typeParam
        const typeParam = await creo(sessionId, {
            command: "parameter",
            function: "list",
            data: {
                "file": part,
                "name": "NAMEPLATE_TYPE"
            }
        });

        if (typeParam.data.paramlist[0].value == 1 || typeParam.data.paramlist[0].value == 2) {
        //if NAMEPLATE_TYPE is either 1 or 2, then TEMPLATE is A
            TEMPLATE = 'A';
        } else if (typeParam.data.paramlist[0].value == 3) {
        //if NAMEPLATE_TYPE is 3, then TEMPLATE is B
            TEMPLATE = 'B';
        } else if (typeParam.data.paramlist[0].value == 4 || typeParam.data.paramlist[0].value == 5) {
        //if NAMEPLATE_TYPE is either 4 or 5, then TEMPLATE is C
            TEMPLATE = 'C';
        } else if (typeParam.data.paramlist[0].value == 6) {
        //if NAMEPLATE_TYPE is 6, then TEMPLATE is D
            TEMPLATE = 'D';
        }

        //initialize/set TEXT_ROW1 to empty string, then check if the parameter exists, if yes, then update TEXT_ROW1
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

        //initialize/set TEXT_ROW2 to empty string, then check if the parameter exists, if yes, then update TEXT_ROW2
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

        //initialize/set TEXT_ROW3 to empty string, then check if the parameter exists, if yes, then update TEXT_ROW3
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

        //for 0 to qty
        for (let i = 0; i < qty; i++) {
            //push to NP
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
        //for each part
        for (let part of parts) {
            //initialize/set BIN to NULL, then check if the parameter exists, if yes, then update BIN
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


            //initialize/set TITLE to empty string, then check if the parameter exists, if yes, then update TITLE
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


            //initialize/set PART_NO to empty string, then check if the parameter exists, if yes, then update PART_NO
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


            //initialize/set WEIGHT to empty string, then check if the parameter exists, if yes, then update WEIGHT
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

            //initialize/set MATERIAL to empty string, then check if the parameter exists, if yes, then update MATERIAL
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

            //initialize/set GAUGE to empty string, then check if the parameter exists, if yes, then update GAUGE
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

            //initialize/set FINISH to empty string, then check if the parameter exists, if yes, then update FINISH
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

            //initialize/set CUT_LENGTH to empty string, then check if the parameter exists, if yes, then update CUT_LENGTH
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

            //push part and all obtained parameters to partBinInfo
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

    //asmToPart async function definition (this function is also recursive)
    function asmToPart(arr, parts) {
        //for each item
        for (let item of arr) {
            //if no children
            if (!item.children) {
                //filter parts by item, and if record already exists, then increment qty
                if (parts.filter(e => e.part === item.file).length > 0) {
                    parts.filter(e => e.part === item.file)[0].qty += 1;
                } else {
                //if no prior record exists, then push to parts
                    parts.push({
                        part: item.file,
                        qty: 1
                    })
                }
            } else {
            //if children exist, execute asmToPart function recursively feeding it the children data one level deeper, and then current parts array
                asmToPart(item.children, parts)
            }
        }
        //finally return parts array
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
                //if asm is not open
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
                    //initialize/set parts and section variables
                    let parts = [];
                    let section = data.file;
                    //if not a prt file (this gets rid of layout-level items like transformers,etc. and leaves behind only the asms (sections))
                    if (section.slice(section.length - 4, section.length) != '.PRT') {
                        //push to sections
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

                        //send component hierarchy to the asmToPart function which returns an array of parts and qtys
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

            //initialize globallyCommonParts
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
                //initialize the bom variables
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
                //1st check - if the lengths of the arrays are not equal, the array's cannot be equal
                if (jsonArray1.length !== jsonArray2.length) return false;
                //declare ser, which takes an object and returns a stringified representation where each key is mapped to an array of [key, value]
                const ser = o => JSON.stringify(Object.keys(o).sort().map( k => [k, o[k]] ));
                //update jsonArray1 to be a new set which represents the mapped json array using ser as the mapping function
                jsonArray1 = new Set(jsonArray1.map(ser));
                //check every object in jsonArray2 and see if it is included in jsonArray1 (this makes it so order doesnt matter) - if all yes, then return true
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

                //if currentPurBom has data
                if (currentPurBom.length != 0) {
                    //for each bom in purBOMs collection
                    for (let k = i + 1; k < purBOMS.length; k++) {
                        //check if the JSON arrays are equal using function defined above
                        if (areJSONArraysEqual(currentPurBom, purBOMS[k]) == true ) {
                            //filter similarPURs by conditionally checking if the children includes section,
                            //and if the filtered array is empty
                            if (similarPURs.filter(e => e.children.includes(sections[i]) == true).length == 0) {
                                //if the parent section already exists in the similarPURs array
                                if (similarPURs.filter(e => e.parent === sections[i]).length > 0) {
                                    //update children by pushing section to its array
                                    similarPURs.filter(e => e.parent === sections[i])[0].children.push(sections[k]);
                                } else {
                                //if the parent section does not exist in the similarPURs array
                                    //push to similarPURs
                                    similarPURs.push({
                                        parent: sections[i],
                                        children: [sections[k]]
                                    })
                                }
                            }
                        }
                    }
                }

                //if currentStrBom has data
                if (currentStrBom.length != 0) {
                    //for each bom in strBOMs collection
                    for (let k = i + 1; k < strBOMS.length; k++) {
                        //check if the JSON arrays are equal using function defined above
                        if (areJSONArraysEqual(currentStrBom, strBOMS[k]) == true ) {
                            //filter similarSTRs by conditionally checking if the children includes section,
                            //and if the filtered array is empty
                            if (similarSTRs.filter(e => e.children.includes(sections[i]) == true).length == 0) {
                                //if the parent section already exists in the similarSTRs array
                                if (similarSTRs.filter(e => e.parent === sections[i]).length > 0) {
                                    //update children by pushing section to its array
                                    similarSTRs.filter(e => e.parent === sections[i])[0].children.push(sections[k]);
                                } else {
                                //if the parent section does not exist in the similarSTRs array
                                    //push to similarSTRs
                                    similarSTRs.push({
                                        parent: sections[i],
                                        children: [sections[k]]
                                    })
                                }
                            }
                        }
                    }
                }

                //if currentPnlBom has data
                if (currentPnlBom.length != 0) {
                    //for each bom in pnlBOMS collection
                    for (let k = i + 1; k < pnlBOMS.length; k++) {
                        //check if the JSON arrays are equal using function defined above
                        if (areJSONArraysEqual(currentPnlBom, pnlBOMS[k]) == true ) {
                            //filter similarPNLs by conditionally checking if the children includes section,
                            //and if the filtered array is empty
                            if (similarPNLs.filter(e => e.children.includes(sections[i]) == true).length == 0) {
                                //if the parent section already exists in the similarPNLs array
                                if (similarPNLs.filter(e => e.parent === sections[i]).length > 0) {
                                    similarPNLs.filter(e => e.parent === sections[i])[0].children.push(sections[k]);
                                } else {
                                //if the parent section does not exist in the similarPNLs array
                                    //push to similarPNLs
                                    similarPNLs.push({
                                        parent: sections[i],
                                        children: [sections[k]]
                                    })
                                }
                            }
                        }
                    }
                }

                //if currentCtlBom has data
                if (currentCtlBom.length != 0) {
                    //for each bom in ctlBOMS collection
                    for (let k = i + 1; k < ctlBOMS.length; k++) {
                        //check if the JSON arrays are equal using function defined above
                        if (areJSONArraysEqual(currentCtlBom, ctlBOMS[k]) == true ) {
                        //filter similarCTLs by conditionally checking if the children includes section,
                            //and if the filtered array is empty
                            if (similarCTLs.filter(e => e.children.includes(sections[i]) == true).length == 0) {
                                //if the parent section already exists in the similarCTLs array
                                if (similarCTLs.filter(e => e.parent === sections[i]).length > 0) {
                                    similarCTLs.filter(e => e.parent === sections[i])[0].children.push(sections[k]);
                                } else {
                                //if the parent section does not exist in the similarCTLs array
                                    //push to similarCTLs
                                    similarCTLs.push({
                                        parent: sections[i],
                                        children: [sections[k]]
                                    })
                                }
                            }
                        }
                    }
                }

                //if currentIntBom has data
                if (currentIntBom.length != 0 ) {
                    //for each bom in intBOMS collection
                    for (let k = i + 1; k < intBOMS.length; k++) {
                        //check if the JSON arrays are equal using function defined above
                        if (areJSONArraysEqual(currentIntBom, intBOMS[k]) == true ) {
                            //filter similarINTs by conditionally checking if the children includes section,
                            //and if the filtered array is empty
                            if (similarINTs.filter(e => e.children.includes(sections[i]) == true).length == 0) {
                                //if the parent section already exists in the similarINTs array
                                if (similarINTs.filter(e => e.parent === sections[i]).length > 0) {
                                    similarINTs.filter(e => e.parent === sections[i])[0].children.push(sections[k]);
                                } else {
                                //if the parent section does not exist in the similarINTs array
                                    //push to similarINTs
                                    similarINTs.push({
                                        parent: sections[i],
                                        children: [sections[k]]
                                    })
                                }
                            }
                        }
                    }
                }

                //if currentExtBom has data
                if (currentExtBom.length != 0 ) {
                    //for each bom in extBOMS collection
                    for (let k = i + 1; k < extBOMS.length; k++) {
                        //check if the JSON arrays are equal using function defined above
                        if (areJSONArraysEqual(currentExtBom, extBOMS[k]) == true ) {
                            //filter similarEXTs by conditionally checking if the children includes section,
                            //and if the filtered array is empty
                            if (similarEXTs.filter(e => e.children.includes(sections[i]) == true).length == 0) {
                                //if the parent section already exists in the similarEXTs array
                                if (similarEXTs.filter(e => e.parent === sections[i]).length > 0) {
                                    similarEXTs.filter(e => e.parent === sections[i])[0].children.push(sections[k]);
                                } else {
                                //if the parent section does not exist in the similarEXTs array
                                    //push to similarEXTs
                                    similarEXTs.push({
                                        parent: sections[i],
                                        children: [sections[k]]
                                    })
                                }
                            }
                        }
                    }
                }

                //if currentSclBom has data
                if (currentSclBom.length != 0 ) {
                    //for each bom in sclBOMS collection
                    for (let k = i + 1; k < sclBOMS.length; k++) {
                        //check if the JSON arrays are equal using function defined above
                        if (areJSONArraysEqual(currentSclBom, sclBOMS[k]) == true ) {
                            //filter similarSCLs by conditionally checking if the children includes section,
                            //and if the filtered array is empty
                            if (similarSCLs.filter(e => e.children.includes(sections[i]) == true).length == 0) {
                                //if the parent section already exists in the similarSCLs array
                                if (similarSCLs.filter(e => e.parent === sections[i]).length > 0) {
                                    similarSCLs.filter(e => e.parent === sections[i])[0].children.push(sections[k]);
                                } else {
                                //if the parent section does not exist in the similarSCLs array
                                    //push to similarSCLs
                                    similarSCLs.push({
                                        parent: sections[i],
                                        children: [sections[k]]
                                    })
                                }
                            }
                        }
                    }
                }

                //if currentOutBom has data
                if (currentOutBom.length != 0) {
                    //for each bom in outBOMS collection
                    for (let k = i + 1; k < outBOMS.length; k++) {
                        //check if the JSON arrays are equal using function defined above
                        if (areJSONArraysEqual(currentOutBom, outBOMS[k]) == true) {
                            //filter similarOUTs by conditionally checking if the children includes section,
                            //and if the filtered array is empty
                            if (similarOUTs.filter(e => e.children.includes(sections[i]) == true).length == 0) {
                                //if the parent section already exists in the similarOUTs array
                                if (similarOUTs.filter(e => e.parent === sections[i]).length > 0) {
                                    similarOUTs.filter(e => e.parent === sections[i])[0].children.push(sections[k]);
                                } else {
                                //if the parent section does not exist in the similarOUTs array
                                    //push to similarOUTs
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

            //for each similarPUR
            for (let similarPUR of similarPURs) {
                //set parent section
                let parent = similarPUR.parent;
                //for each child section
                for (let child of similarPUR.children) {
                    //filter binBoms to child and set the PUR value as the parent section
                    binBoms.filter(e => e.section === child)[0].PUR = parent
                }
            }

            //for each similarSTR
            for (let similarSTR of similarSTRs) {
                //set parent section
                let parent = similarSTR.parent;
                //for each child section
                for (let child of similarSTR.children) {
                    //filter binBoms to child and set the STR value as the parent section
                    binBoms.filter(e => e.section === child)[0].STR = parent
                }
            }

            //for each similarPNL
            for (let similarPNL of similarPNLs) {
                //set parent section
                let parent = similarPNL.parent;
                //for each child section
                for (let child of similarPNL.children) {
                    //filter binBoms to child and set the PNL value as the parent section
                    binBoms.filter(e => e.section === child)[0].PNL = parent
                }
            }

            //for each similarCTL
            for (let similarCTL of similarCTLs) {
                //set parent section
                let parent = similarCTL.parent;
                //for each child section
                for (let child of similarCTL.children) {
                    //filter binBoms to child and set the CTL value as the parent section
                    binBoms.filter(e => e.section === child)[0].CTL = parent
                }
            }

            //for each similarINT
            for (let similarINT of similarINTs) {
                //set parent section
                let parent = similarINT.parent;
                //for each child section
                for (let child of similarINT.children) {
                    //filter binBoms to child and set the INT value as the parent section
                    binBoms.filter(e => e.section === child)[0].INT = parent
                }
            }

            //for each similarEXT
            for (let similarEXT of similarEXTs) {
                //set parent section
                let parent = similarEXT.parent;
                //for each child section
                for (let child of similarEXT.children) {
                    //filter binBoms to child and set the EXT value as the parent section
                    binBoms.filter(e => e.section === child)[0].EXT = parent
                }
            }

            //for each similarSCL
            for (let similarSCL of similarSCLs) {
                //set parent section
                let parent = similarSCL.parent;
                //for each child section
                for (let child of similarSCL.children) {
                    //filter binBoms to child and set the SCL value as the parent section
                    binBoms.filter(e => e.section === child)[0].SCL = parent
                }
            }

            //for each similarOUT
            for (let similarOUT of similarOUTs) {
                //set parent section
                let parent = similarOUT.parent;
                //for each child section
                for (let child of similarOUT.children) {
                    //filter binBoms to child and set the OUT value as the parent section
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
            //if an error occurs at anytime at any point in the above code, log it to the console
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

    //for each existingLayoutBom
    for (let existingLayoutBom of existingLayoutBoms) {
        //if existingLayoutBOM is SS
        if (existingLayoutBom.slice(existingLayoutBom.length - 2, existingLayoutBom.length) == 'SS') {
            //initialize ss
            let ss = [];
            //if HTML element value (obtained from req.body[*elementName*]) is array
            if (Array.isArray(req.body['qty_' + existingLayoutBom]) == true) {
                //for each item in array
                for (let i = 0; i < req.body['qty_' + existingLayoutBom].length; i++) {
                    //push to ss
                    ss.push({
                        qty: req.body['qty_' + existingLayoutBom][i],
                        partDesc: req.body['partDesc_' + existingLayoutBom][i],
                        part: req.body['part_' + existingLayoutBom][i]
                    })
                }
            } else {
            //if HTML value is not an array
                //push single item to ss
                ss.push({
                    qty: req.body['qty_' + existingLayoutBom],
                    partDesc: req.body['partDesc_' + existingLayoutBom],
                    part: req.body['part_' + existingLayoutBom]
                })
            }
            //push ss to SS
            SS.push({
                bom: existingLayoutBom,
                data: ss
            });
        }

        //if existingLayoutBOM is OUT
        if (existingLayoutBom.slice(existingLayoutBom.length - 3, existingLayoutBom.length) == 'OUT') {
            //initialize out
            let out = [];
            //if HTML element value (obtained from req.body[*elementName*]) is array
            if (Array.isArray(req.body['qty_' + existingLayoutBom]) == true) {
                //for each item in array
                for (let i = 0; i < req.body['qty_' + existingLayoutBom].length; i++) {
                    //push to out
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
            //if HTML value is not an array
                //push single item to out
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
            //push out to OUT_L
            OUT_L.push({
                bom: existingLayoutBom,
                data: out
            });
        }

        //if existingLayoutBOM is AL
        if (existingLayoutBom.slice(existingLayoutBom.length - 2, existingLayoutBom.length) == 'AL') {
            //initialize al
            let al = [];
            //if HTML element value (obtained from req.body[*elementName*]) is array
            if (Array.isArray(req.body['qty_' + existingLayoutBom]) == true) {
                //for each item in array
                for (let i = 0; i < req.body['qty_' + existingLayoutBom].length; i++) {
                    //push to al
                    al.push({
                        qty: req.body['qty_' + existingLayoutBom][i],
                        partDesc: req.body['partDesc_' + existingLayoutBom][i],
                        part: req.body['part_' + existingLayoutBom][i]
                    });
                }
            } else {
            //if HTML value is not an array
                //push single item to al
                al.push({
                    qty: req.body['qty_' + existingLayoutBom],
                    partDesc: req.body['partDesc_' + existingLayoutBom],
                    part: req.body['part_' + existingLayoutBom]
                })
            }
            //push al to AL
            AL.push({
                bom: existingLayoutBom,
                data: al
            });
        }

        //if existingLayoutBOM is 7GA
        if (existingLayoutBom.slice(existingLayoutBom.length - 3, existingLayoutBom.length) == '7GA') {
            //initialize ga_7
            let ga_7 = [];
            //if HTML element value (obtained from req.body[*elementName*]) is array
            if (Array.isArray(req.body['qty_' + existingLayoutBom]) == true) {
                //for each item in array
                for (let i = 0; i < req.body['qty_' + existingLayoutBom].length; i++) {
                    //push to ga_7
                    ga_7.push({
                        qty: req.body['qty_' + existingLayoutBom][i],
                        partDesc: req.body['partDesc_' + existingLayoutBom][i],
                        part: req.body['part_' + existingLayoutBom][i]
                    })
                }
            } else {
            //if HTML value is not an array
                //push single item to ga_7
                ga_7.push({
                    qty: req.body['qty_' + existingLayoutBom],
                    partDesc: req.body['partDesc_' + existingLayoutBom],
                    part: req.body['part_' + existingLayoutBom]
                })
            }
            //push ga_7 to GA_7
            GA_7.push({
                bom: existingLayoutBom,
                data: ga_7
            });
        }

        //if existingLayoutBOM is LEXAN
        if (existingLayoutBom.slice(existingLayoutBom.length - 5, existingLayoutBom.length) == 'LEXAN') {
            //initialize lexan
            let lexan = [];
            //if HTML element value (obtained from req.body[*elementName*]) is array
            if (Array.isArray(req.body['qty_' + existingLayoutBom]) == true) {
                //for each item in array
                for (let i = 0; i < req.body['qty_' + existingLayoutBom].length; i++) {
                    //push to lexan
                    lexan.push({
                        qty: req.body['qty_' + existingLayoutBom][i],
                        partDesc: req.body['partDesc_' + existingLayoutBom][i],
                        part: req.body['part_' + existingLayoutBom][i]
                    })
                }
            } else {
            //if HTML value is not an array
                //push single item to lexan
                lexan.push({
                    qty: req.body['qty_' + existingLayoutBom],
                    partDesc: req.body['partDesc_' + existingLayoutBom],
                    part: req.body['part_' + existingLayoutBom]
                })
            }
            //push lexan to LEXAN
            LEXAN.push({
                bom: existingLayoutBom,
                data: lexan
            });
        }

        //if existingLayoutBOM is A
        if (existingLayoutBom.slice(existingLayoutBom.length - 1, existingLayoutBom.length) == 'A') {
            //initialize npA
            let npA = [];
            //if HTML element value (obtained from req.body[*elementName*]) is array
            if (Array.isArray(req.body['part_' + existingLayoutBom]) == true) {
                //for each item in array
                for (let i = 0; i < req.body['part_' + existingLayoutBom].length; i++) {
                    //push to npA
                    npA.push({
                        part: req.body['part_' + existingLayoutBom][i],
                        text_row1: req.body['text_row1_' + existingLayoutBom][i],
                        text_row2: req.body['text_row2_' + existingLayoutBom][i],
                        text_row3: req.body['text_row3_' + existingLayoutBom][i]
                    })
                }
            } else {
            //if HTML value is not an array
                //push single item to ss
                npA.push({
                    part: req.body['part_' + existingLayoutBom],
                    text_row1: req.body['text_row1_' + existingLayoutBom],
                    text_row2: req.body['text_row2_' + existingLayoutBom],
                    text_row3: req.body['text_row3_' + existingLayoutBom]
                })
            }
            //push npA to NP_A
            NP_A.push({
                bom: existingLayoutBom,
                data: npA
            })
        }

        //if existingLayoutBOM is B
        if (existingLayoutBom.slice(existingLayoutBom.length - 1, existingLayoutBom.length) == 'B') {
            //initialize npB
            let npB = [];
            //if HTML element value (obtained from req.body[*elementName*]) is array
            if (Array.isArray(req.body['part_' + existingLayoutBom]) == true) {
                //for each item in array
                for (let i = 0; i < req.body['part_' + existingLayoutBom].length; i++) {
                    //push to npB
                    npB.push({
                        part: req.body['part_' + existingLayoutBom][i],
                        text_row1: req.body['text_row1_' + existingLayoutBom][i],
                        text_row2: req.body['text_row2_' + existingLayoutBom][i],
                        text_row3: req.body['text_row3_' + existingLayoutBom][i]
                    })
                }
            } else {
            //if HTML value is not an array
                //push single item to npB
                npB.push({
                    part: req.body['part_' + existingLayoutBom],
                    text_row1: req.body['text_row1_' + existingLayoutBom],
                    text_row2: req.body['text_row2_' + existingLayoutBom],
                    text_row3: req.body['text_row3_' + existingLayoutBom]
                })
            }
            //push npB to NP_B
            NP_B.push({
                bom: existingLayoutBom,
                data: npB
            })
        }

        //if existingLayoutBOM is C
        if (existingLayoutBom.slice(existingLayoutBom.length - 1, existingLayoutBom.length) == 'C') {
            //initialize npC
            let npC = [];
            //if HTML element value (obtained from req.body[*elementName*]) is array
            if (Array.isArray(req.body['part_' + existingLayoutBom]) == true) {
                //for each item in array
                for (let i = 0; i < req.body['part_' + existingLayoutBom].length; i++) {
                    //push to npC
                    npC.push({
                        part: req.body['part_' + existingLayoutBom][i],
                        text_row1: req.body['text_row1_' + existingLayoutBom][i],
                        text_row2: req.body['text_row2_' + existingLayoutBom][i],
                        text_row3: req.body['text_row3_' + existingLayoutBom][i]
                    })
                }
            } else {
            //if HTML value is not an array
                //push single item to npC
                npC.push({
                    part: req.body['part_' + existingLayoutBom],
                    text_row1: req.body['text_row1_' + existingLayoutBom],
                    text_row2: req.body['text_row2_' + existingLayoutBom],
                    text_row3: req.body['text_row3_' + existingLayoutBom]
                })
            }
            //push npC to NP_C
            NP_C.push({
                bom: existingLayoutBom,
                data: npC
            })
        }

        //if existingLayoutBOM is D
        if (existingLayoutBom.slice(existingLayoutBom.length - 1, existingLayoutBom.length) == 'D') {
            //initialize npD
            let npD = [];
            //if HTML element value (obtained from req.body[*elementName*]) is array
            if (Array.isArray(req.body['part_' + existingLayoutBom]) == true) {
                //for each item in array
                for (let i = 0; i < req.body['part_' + existingLayoutBom].length; i++) {
                    //push to npD
                    npD.push({
                        part: req.body['part_' + existingLayoutBom][i],
                        text_row1: req.body['text_row1_' + existingLayoutBom][i],
                        text_row2: req.body['text_row2_' + existingLayoutBom][i],
                        text_row3: req.body['text_row3_' + existingLayoutBom][i]
                    })
                }
            } else {
            //if HTML value is not an array
                //push single item to npD
                npD.push({
                    part: req.body['part_' + existingLayoutBom],
                    text_row1: req.body['text_row1_' + existingLayoutBom],
                    text_row2: req.body['text_row2_' + existingLayoutBom],
                    text_row3: req.body['text_row3_' + existingLayoutBom]
                })
            }
            //push npD to NP_D
            NP_D.push({
                bom: existingLayoutBom,
                data: npD
            })
        }
    }

    //for each existingSectionBom
    for (let existingSectionBom of existingSectionBoms) {
        //if existingSectionBom is OUT
        if (existingSectionBom.slice(existingSectionBom.length - 3, existingSectionBom.length) == 'OUT') {
            //initialize out
            let out = [];
            //if HTML element value (obtained from req.body[*elementName*]) is array
            if (Array.isArray(req.body['qty_' + existingSectionBom]) == true) {
                //for each item in array
                for (let i = 0; i < req.body['qty_' + existingSectionBom].length; i++) {
                    //push to out
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
            //if HTML value is not an array
                //push single item to out
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
            //push out to OUT
            OUT.push({
                bom: existingSectionBom,
                data: out
            });
        }

        //if existingSectionBom is PUR
        if (existingSectionBom.slice(existingSectionBom.length - 3, existingSectionBom.length) == 'PUR') {
            //initialize pur
            let pur = [];
            //if HTML element value (obtained from req.body[*elementName*]) is array
            if (Array.isArray(req.body['qty_' + existingSectionBom]) == true) {
                //for each item in array
                for (let i = 0; i < req.body['qty_' + existingSectionBom].length; i++) {
                    //push to pur
                    pur.push({
                        qty: req.body['qty_' + existingSectionBom][i],
                        partDesc: req.body['partDesc_' + existingSectionBom][i],
                        partNum: req.body['partNum_' + existingSectionBom][i],
                        weight: req.body['weight_' + existingSectionBom][i],
                    })
                }
            } else {
            //if HTML value is not an array
                //push single item to pur
                pur.push({
                    qty: req.body['qty_' + existingSectionBom],
                    partDesc: req.body['partDesc_' + existingSectionBom],
                    partNum: req.body['partNum_' + existingSectionBom],
                    weight: req.body['weight_' + existingSectionBom],
                })
            }
            //push pur to PUR
            PUR.push({
                bom: existingSectionBom,
                data: pur
            });
        }

        //if existingSectionBom is STR
        if (existingSectionBom.slice(existingSectionBom.length - 3, existingSectionBom.length) == 'STR') {
            //initialize str
            let str = [];
            //if HTML element value (obtained from req.body[*elementName*]) is array
            if (Array.isArray(req.body['qty_' + existingSectionBom]) == true) {
                //for each item in array
                for (let i = 0; i < req.body['qty_' + existingSectionBom].length; i++) {
                    //push to str
                    str.push({
                        qty: req.body['qty_' + existingSectionBom][i],
                        partDesc: req.body['partDesc_' + existingSectionBom][i],
                        part: req.body['part_' + existingSectionBom][i],
                        weight: req.body['weight_' + existingSectionBom][i],
                    })
                }
            } else {
            //if HTML value is not an array
                //push single item to str
                str.push({
                    qty: req.body['qty_' + existingSectionBom],
                    partDesc: req.body['partDesc_' + existingSectionBom],
                    part: req.body['part_' + existingSectionBom],
                    weight: req.body['weight_' + existingSectionBom],
                })
            }
            //push out to STR
            STR.push({
                bom: existingSectionBom,
                data: str
            });
        }

        //if existingSectionBom is PNL
        if (existingSectionBom.slice(existingSectionBom.length - 3, existingSectionBom.length) == 'PNL') {
            //initialize pnl
            let pnl = [];
            //if HTML element value (obtained from req.body[*elementName*]) is array
            if (Array.isArray(req.body['qty_' + existingSectionBom]) == true) {
                //for each item in array
                for (let i = 0; i < req.body['qty_' + existingSectionBom].length; i++) {
                    //push to pnl
                    pnl.push({
                        qty: req.body['qty_' + existingSectionBom][i],
                        partDesc: req.body['partDesc_' + existingSectionBom][i],
                        part: req.body['part_' + existingSectionBom][i],
                        weight: req.body['weight_' + existingSectionBom][i],
                    })
                }
            } else {
            //if HTML value is not an array
                //push single item to pnl
                pnl.push({
                    qty: req.body['qty_' + existingSectionBom],
                    partDesc: req.body['partDesc_' + existingSectionBom],
                    part: req.body['part_' + existingSectionBom],
                    weight: req.body['weight_' + existingSectionBom],
                })
            }
            //push pnl to PNL
            PNL.push({
                bom: existingSectionBom,
                data: pnl
            });
        }
        //if existingSectionBom is CTL
        if (existingSectionBom.slice(existingSectionBom.length - 3, existingSectionBom.length) == 'CTL') {
            //initialize ctl
            let ctl = [];
            //if HTML element value (obtained from req.body[*elementName*]) is array
            if (Array.isArray(req.body['qty_' + existingSectionBom]) == true) {
                //for each item in array
                for (let i = 0; i < req.body['qty_' + existingSectionBom].length; i++) {
                    //push to ctl
                    ctl.push({
                        qty: req.body['qty_' + existingSectionBom][i],
                        partDesc: req.body['partDesc_' + existingSectionBom][i],
                        part: req.body['part_' + existingSectionBom][i],
                        weight: req.body['weight_' + existingSectionBom][i],
                    })
                }
            } else {
            //if HTML value is not an array
                //push single item to ctl
                ctl.push({
                    qty: req.body['qty_' + existingSectionBom],
                    partDesc: req.body['partDesc_' + existingSectionBom],
                    part: req.body['part_' + existingSectionBom],
                    weight: req.body['weight_' + existingSectionBom],
                })
            }

            //push ctl to CTL
            CTL.push({
                bom: existingSectionBom,
                data: ctl
            });
        }

        //if existingSectionBom is INT
        if (existingSectionBom.slice(existingSectionBom.length - 3, existingSectionBom.length) == 'INT') {
            //initialize int
            let int = [];
            //if HTML element value (obtained from req.body[*elementName*]) is array
            if (Array.isArray(req.body['qty_' + existingSectionBom]) == true) {
                //for each item in array
                for (let i = 0; i < req.body['qty_' + existingSectionBom].length; i++) {
                    //push to int
                    int.push({
                        qty: req.body['qty_' + existingSectionBom][i],
                        partDesc: req.body['partDesc_' + existingSectionBom][i],
                        part: req.body['part_' + existingSectionBom][i],
                        weight: req.body['weight_' + existingSectionBom][i],
                    })
                }
            } else {
            //if HTML value is not an array
                //push single item to out
                int.push({
                    qty: req.body['qty_' + existingSectionBom],
                    partDesc: req.body['partDesc_' + existingSectionBom],
                    part: req.body['part_' + existingSectionBom],
                    weight: req.body['weight_' + existingSectionBom],
                })
            }

            //push int to INT
            INT.push({
                bom: existingSectionBom,
                data: int
            });
        }

        //if existingSectionBom is EXT
        if (existingSectionBom.slice(existingSectionBom.length - 3, existingSectionBom.length) == 'EXT') {
            //initialize ext
            let ext = [];
            //if HTML element value (obtained from req.body[*elementName*]) is array
            if (Array.isArray(req.body['qty_' + existingSectionBom]) == true) {
                //for each item in array
                for (let i = 0; i < req.body['qty_' + existingSectionBom].length; i++) {
                    //push to ext
                    ext.push({
                        qty: req.body['qty_' + existingSectionBom][i],
                        partDesc: req.body['partDesc_' + existingSectionBom][i],
                        part: req.body['part_' + existingSectionBom][i],
                        weight: req.body['weight_' + existingSectionBom][i],
                    })
                }
            } else {
            //if HTML value is not an array
                //push single item to ext
                ext.push({
                    qty: req.body['qty_' + existingSectionBom],
                    partDesc: req.body['partDesc_' + existingSectionBom],
                    part: req.body['part_' + existingSectionBom],
                    weight: req.body['weight_' + existingSectionBom],
                })
            }
            //push ext to EXT
            EXT.push({
                bom: existingSectionBom,
                data: ext
            });
        }

        //if existingSectionBom is SCL
        if (existingSectionBom.slice(existingSectionBom.length - 3, existingSectionBom.length) == 'SCL') {
            //initialize scl
            let scl = [];
            //if HTML element value (obtained from req.body[*elementName*]) is array
            if (Array.isArray(req.body['qty_' + existingSectionBom]) == true) {
                //for each item in array
                for (let i = 0; i < req.body['qty_' + existingSectionBom].length; i++) {
                    //push to scl
                    scl.push({
                        qty: req.body['qty_' + existingSectionBom][i],
                        partDesc: req.body['partDesc_' + existingSectionBom][i],
                        part: req.body['part_' + existingSectionBom][i],
                        weight: req.body['weight_' + existingSectionBom][i],
                        cutLength: req.body['cutLength_' + existingSectionBom][i]
                    })
                }
            } else {
            //if HTML value is not an array
                //push single item to out
                scl.push({
                    qty: req.body['qty_' + existingSectionBom],
                    partDesc: req.body['partDesc_' + existingSectionBom],
                    part: req.body['part_' + existingSectionBom],
                    weight: req.body['weight_' + existingSectionBom],
                    cutLength: req.body['cutLength_' + existingSectionBom]
                })
            }

            //push scl to SCL
            SCL.push({
                bom: existingSectionBom,
                data: scl
            });
        }
    }

    //for each layout
    for (let layout of layouts) {
        //initialize secBinTrackingData and bom variables
        let secBinTrackingData = [];
        let pur, str, pnl, ctl, int, ext, scl, out;
        //for each section
        for (let section of layout.sections.split(',')) {
            //if OUT binTracker HTML element exists
            if (req.body['binTracker_OUT_' + layout.layout.slice(0,7) + section] != undefined) {
                //write to out
                out = req.body['binTracker_OUT_' + layout.layout.slice(0,7) + section];
            } else {
            //if OUT binTracker HTML element does not exist, set out to N/A
                out = 'N/A';
            }
            //if PUR binTracker HTML element exists
            if (req.body['binTracker_PUR_' + layout.layout.slice(0, 7) + section] != undefined) {
                //write to pur
                pur = req.body['binTracker_PUR_' + layout.layout.slice(0, 7) + section];
            } else {
            //if PUR binTracker HTML element does not exist, set pur to N/A
                pur = 'N/A';
            }
            //if STR binTracker HTML element exists
            if (req.body['binTracker_STR_' + layout.layout.slice(0, 7) + section] != undefined) {
                //write to str
                str = req.body['binTracker_STR_' + layout.layout.slice(0, 7) + section];
            } else {
            //if STR binTracker HTML element does not exist, set str to N/A
                str = 'N/A';
            }
            //if PNL binTracker HTML element exists
            if (req.body['binTracker_PNL_' + layout.layout.slice(0, 7) + section] != undefined) {
                //write to pnl
                pnl = req.body['binTracker_PNL_' + layout.layout.slice(0, 7) + section];
            } else {
            //if PNL binTracker HTML element does not exist, set pnl to N/A
                pnl = 'N/A';
            }
            //if CTL binTracker HTML element exists
            if (req.body['binTracker_CTL_' + layout.layout.slice(0, 7) + section] != undefined) {
                //write to ctl
                ctl = req.body['binTracker_CTL_' + layout.layout.slice(0, 7) + section];
            } else {
            //if CTL binTracker HTML element does not exist, set ctl to N/A
                ctl = 'N/A';
            }
            //if INT binTracker HTML element exists
            if (req.body['binTracker_INT_' + layout.layout.slice(0, 7) + section] != undefined) {
                //write to int
                int = req.body['binTracker_INT_' + layout.layout.slice(0, 7) + section];
            } else {
            //if INT binTracker HTML element does not exist, set int to N/A
                int = 'N/A';
            }
            //if EXT binTracker HTML element exists
            if (req.body['binTracker_EXT_' + layout.layout.slice(0, 7) + section] != undefined) {
                //write to ext
                ext = req.body['binTracker_EXT_' + layout.layout.slice(0, 7) + section];
            } else {
            //if EXT binTracker HTML element does not exist, set ext to N/A
                ext = 'N/A';
            }
            //if SCL binTracker HTML element exists
            if (req.body['binTracker_SCL_' + layout.layout.slice(0, 7) + section] != undefined) {
                //write to scl
                scl = req.body['binTracker_SCL_' + layout.layout.slice(0, 7) + section];
            } else {
            //if SCL binTracker HTML element does not exist, set scl to N/A
                scl = 'N/A';
            }
            //push to secBinTrackingData
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
        //push secBinTrackingData to BIN_TRACKER
        BIN_TRACKER.push({
            layout: layout.layout,
            data: secBinTrackingData
        });
    }

    //logging all bom data to the console (use console.dir with null depth in order to print whole contents of javascript object)
    console.log('SS BOM (LAYOUT):');
    console.dir(SS, { depth: null });
    console.log('AL BOM (LAYOUT):');
    console.dir(AL, { depth: null });
    console.log('GA_7 BOM (LAYOUT):');
    console.dir(GA_7, { depth: null });
    console.log('LEXAN BOM (LAYOUT):');
    console.dir(LEXAN, { depth: null });
    console.log('NP_A BOM (LAYOUT):');
    console.dir(NP_A, { depth: null });
    console.log('NP_B BOM (LAYOUT):');
    console.dir(NP_B, { depth: null });
    console.log('NP_C BOM (LAYOUT):');
    console.dir(NP_C, { depth: null });
    console.log('NP_D BOM (LAYOUT):');
    console.dir(NP_D, { depth: null });
    console.log('OUT_L BOM (LAYOUT):');
    console.dir(OUT_L, { depth: null });
    console.log('PUR BOM: (SECTION)');
    console.dir(PUR, { depth: null });
    console.log('STR BOM: (SECTION)');
    console.dir(STR, { depth: null });
    console.log('PNL BOM: (SECTION)');
    console.dir(PNL, { depth: null });
    console.log('CTL BOM: (SECTION)');
    console.dir(CTL, { depth: null });
    console.log('INT BOM: (SECTION)');
    console.dir(INT, { depth: null });
    console.log('EXT BOM: (SECTION)');
    console.dir(EXT, { depth: null });
    console.log('SCL BOM: (SECTION)');
    console.dir(SCL, { depth: null });
    console.log('OUT BOM: (SECTION)');
    console.dir(OUT, { depth: null });
    console.log('BIN_TRACKER BOM:');
    console.dir(BIN_TRACKER, { depth: null });


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
                        //if filter has data in it
                        if (filterSTR.length != 0) {
                            //for each item of data
                            for (let item of filterSTR[0].data) {
                                //if part matches the drawing name
                                if (item.part == drawing.name.slice(0,drawing.name.length - 4)) {
                                    //if no record currently exists in outsource, push to it
                                    if (outsource.data.filter(e => e.part == item.part).length == 0) {
                                        outsource.data.push({
                                            qty: parseInt(item.qty),
                                            partDesc: item.partDesc,
                                            part: item.part,
                                            weight: item.weight
                                        });
                                    } else {
                                    //if record exists then just increment the qty
                                        outsource.data.filter(e => e.part == item.part)[0].qty += parseInt(item.qty);
                                    }
                                }
                            }
                        }
                    }

                    //if secPNL has data in it
                    if (secPNL != 'N/A') {
                        //filter PNL
                        let filterPNL = PNL.filter(e => e.bom == secPNL);
                        //if filter has data in it
                        if (filterPNL.length != 0) {
                            //for each item in data
                            for (let item of filterPNL[0].data) {
                                //if part matches the drawing name
                                if (item.part == drawing.name.slice(0,drawing.name.length - 4)) {
                                    //if no record currently exists in outsource, push to it
                                    if (outsource.data.filter(e => e.part == item.part).length == 0) {
                                        outsource.data.push({
                                            qty: parseInt(item.qty),
                                            partDesc: item.partDesc,
                                            part: item.part,
                                            weight: item.weight
                                        });
                                    } else {
                                    //if record exists then just increment the qty
                                        outsource.data.filter(e => e.part == item.part)[0].qty += parseInt(item.qty);
                                    }
                                }
                            }
                        }
                    }

                    //if secCTL has data in it
                    if (secCTL != 'N/A') {
                        //filter CTL
                        let filterCTL = CTL.filter(e => e.bom == secCTL);
                        //if filter has data in it
                        if (filterCTL.length != 0) {
                            //for each item in data
                            for (let item of filterCTL[0].data) {
                                //if part matches the drawing name
                                if (item.part == drawing.name.slice(0,drawing.name.length - 4)) {
                                    //if no record currently exists in outsource, push to it
                                    if (outsource.data.filter(e => e.part == item.part).length == 0) {
                                        outsource.data.push({
                                            qty: parseInt(item.qty),
                                            partDesc: item.partDesc,
                                            part: item.part,
                                            weight: item.weight
                                        });
                                    } else {
                                    //if record exists then just increment the qty
                                        outsource.data.filter(e => e.part == item.part)[0].qty += parseInt(item.qty);
                                    }
                                }
                            }
                        }
                    }

                    //if secINT has data in it
                    if (secINT != 'N/A') {
                        //filter INT
                        let filterINT = INT.filter(e => e.bom == secINT);
                        //if filter has data in it
                        if (filterINT.length != 0) {
                            //for each item in data
                            for (let item of filterINT[0].data) {
                                //if part matches the drawing name
                                if (item.part == drawing.name.slice(0,drawing.name.length - 4)) {
                                    //if no record currently exists in outsource, push to it
                                    if (outsource.data.filter(e => e.part == item.part).length == 0) {
                                        outsource.data.push({
                                            qty: parseInt(item.qty),
                                            partDesc: item.partDesc,
                                            part: item.part,
                                            weight: item.weight
                                        });
                                    } else {
                                    //if record exists then just increment the qty
                                        outsource.data.filter(e => e.part == item.part)[0].qty += parseInt(item.qty);
                                    }
                                }
                            }
                        }
                    }

                    //if secEXT has data in it
                    if (secEXT != 'N/A') {
                        //filter EXT
                        let filterEXT = EXT.filter(e => e.bom == secEXT);
                        //if filter has data in it
                        if (filterEXT.length != 0) {
                            //for each item in data
                            for (let item of filterEXT[0].data) {
                                //if part matches the drawing name
                                if (item.part == drawing.name.slice(0,drawing.name.length - 4)) {
                                    //if no record currently exists in outsource, push to it
                                    if (outsource.data.filter(e => e.part == item.part).length == 0) {
                                        outsource.data.push({
                                            qty: parseInt(item.qty),
                                            partDesc: item.partDesc,
                                            part: item.part,
                                            weight: item.weight
                                        });
                                    } else {
                                    //if record exists then just increment the qty
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
            //if an error occurs at anytime at any point in the above code, log it to the console
            console.log(err);
        });
};

