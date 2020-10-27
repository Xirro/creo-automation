
const path = require('path');

//Excel Connection
const Excel = require('exceljs');

//Creoson Connection
const reqPromise = require('request-promise');
let creoHttp = 'http://localhost:9056/creoson';
let sessionId;
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

exports = {};
module.exports = exports;

//Initial PDF-DXF-BIN BOM GET request
exports.pdfDxfBinBom = function(req, res) {
    let workingDir;
    let outputDir;
    res.locals = {title: 'PDF-DXF-BIN BOM'};
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
    let message = null;
    let workingDir = req.body.CREO_workingDir;
    let outputDir = workingDir + '/_outputDir';
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

            const innerDirs = await creo(sessionId, {
                command: "creo",
                function: "list_dirs",
                data: {
                    "dirname": "_outputDir"
                }
            });
            if (!innerDirs.data) {
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
            } else {
                message = "_outputDir already exists within the working directory. Please remove before continuing.";
            }

        } else {
            const innerDirs = await creo(sessionId, {
                command: "creo",
                function: "list_dirs",
                data: {
                    "dirname": "_outputDir"
                }
            });

            if (!innerDirs.data) {
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
            } else {
                message = "_outputDir already exists within the working directory. Please remove before continuing."
            }

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
                    if (famTabExists.data != undefined) {
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
                res.locals = {title: 'PDF-DXF-BIN BOM'};
                res.render('MechEng/pdfDxfBinBom', {
                    message: null,
                    workingDir: workingDir,
                    outputDir: outputDir,
                    asmList: topLevelAsmList,
                    sortedCheckedDwgs: []
                });
            } else {
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
            console.log(err);
        });
};

//Loads and Checks Drawings Filtered by Top-Level Assembly
exports.loadDesign = function(req, res) {
    req.setTimeout(0); //no timeout
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
    async function listExistingPDFs(sessionId, outputDir) {
        let existingPDFs = [];
        await creo(sessionId, {
            command: "creo",
            function: "cd",
            data: {
                "dirname": outputDir + "\\PDF"
            }
        });
        const listFiles = await creo(sessionId, {
            command: "creo",
            function: "list_files",
            data: {
                "filename": "*pdf"
            }
        });
        if (listFiles.data) {
            for (let file of listFiles.data.filelist) {
                if (file.slice(file.length - 4, file.length) == '.pdf') {
                    existingPDFs.push(file.slice(0,15))
                }
            }
        }

        return existingPDFs
    }
    async function listExistingDXFs(sessionId, outputDir) {
        let existingDXFs = [];
        await creo(sessionId, {
            command: "creo",
            function: "cd",
            data: {
                "dirname": outputDir + "\\DXF"
            }
        });
        const listFiles = await creo(sessionId, {
            command: "creo",
            function: "list_files",
            data: {
                "filename": "*dxf"
            }
        });
        if (listFiles.data) {
            for (let file of listFiles.data.filelist) {
                if (file.slice(file.length - 4, file.length) == '.dxf') {
                    existingDXFs.push(file.slice(0,15))
                }
            }
        }
        return existingDXFs
    }
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
    async function getNameplateParams(sessionId, part, qty, NP) {
        let TEMPLATE = 'NULL';
        let templateExists = await creo(sessionId, {
            command: "parameter",
            function: "exists",
            data: {
                "file": part,
                "name": "NAMEPLATE_TEMPLATE"
            }
        });
        if (templateExists.data.exists == true) {
            const templateParam = await creo(sessionId, {
                command: "parameter",
                function: "list",
                data: {
                    "file": part,
                    "name": "NAMEPLATE_TEMPLATE"
                }
            });
            TEMPLATE = templateParam.data.paramlist[0].value;
        }

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
                //console.log(part);
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

            partBinInfo.push({
                part: part,
                partNum: PART_NO,
                partDesc: TITLE,
                bin: BIN,
                material: MATERIAL,
                gauge: GAUGE,
                cutLength: CUT_LENGTH,
                weight: WEIGHT
            });
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

            await creo(sessionId, {
                command: "creo",
                function: "set_config",
                data: {
                    "name": "mass_property_calculate",
                    "value": "automatic"
                }
            });
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
            }
            return null
        })
        .then(async function () {
            console.log('Completed: .asm files opened and regenerated with mass properties');
            let secPartData = [];
            for (let asm of asms) {
                let sections = [];
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
                        sections.push(section.slice(12,15));

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
                lineups.push({
                    lineup: asm.slice(0,15),
                    sections: sections
                })
            }
            return secPartData
        })
        .then(async function (secPartData) {
            console.log('Completed: Parts extracted from all sections within selected layouts');
            let globallyCommonParts = [];
            for (let i = 0; i < secPartData.length; i++) {
                for (let j = 0; j < secPartData[i].parts.length; j++) {
                    if (globallyCommonParts.includes(secPartData[i].parts[j].part) == false) {
                        await globallyCommonParts.push(secPartData[i].parts[j].part);
                    }
                }
            }

            console.log('Completed: Unique parts identified');

            await listParameters(sessionId, globallyCommonParts, partBinInfo);

            console.log('Completed: Applicable Parameters extracted from all unique parts');

            let standalonePNLs = [];
            for (let lineup of lineups) {
                if (lineup.sections.length == 1) {
                    for (let a = 0; a < secPartData.length; a++) {
                        if (secPartData[a].section.slice(12,15) == lineup.sections[0]) {
                            for (let b = 0; b < secPartData[a].parts.length; b++) {
                                let part = secPartData[a].parts[b].part;
                                for (let c = 0; c < partBinInfo.length; c++) {
                                    if (part == partBinInfo[c].part) {
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

            console.log(partBinInfo);

            let sectionMatBoms = [];
            for (let m = 0; m < secPartData.length; m++) {
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
                for (let n = 0; n < secPartData[m].parts.length; n++) {
                    let part = secPartData[m].parts[n].part;
                    for (let p = 0; p < partBinInfo.length; p++) {
                        if (part == partBinInfo[p].part) {
                            switch(partBinInfo[p].bin.toString()) {
                                case 'NULL':
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
                                    if (part.slice(7,11) == '4105') {
                                        await getNameplateParams(sessionId, part, secPartData[m].parts[n].qty, NP);
                                    }
                                    break;
                                case '1':
                                    STR.push({
                                        qty: secPartData[m].parts[n].qty,
                                        part: part,
                                        partNum: partBinInfo[p].partNum,
                                        partDesc: partBinInfo[p].partDesc,
                                        weight: partBinInfo[p].weight
                                    });
                                    break;
                                case '2':
                                    PNL.push({
                                        qty: secPartData[m].parts[n].qty,
                                        part: part,
                                        partNum: partBinInfo[p].partNum,
                                        partDesc: partBinInfo[p].partDesc,
                                        weight: partBinInfo[p].weight
                                    });
                                    break;
                                case '3':
                                    CTL.push({
                                        qty: secPartData[m].parts[n].qty,
                                        part: part,
                                        partNum: partBinInfo[p].partNum,
                                        partDesc: partBinInfo[p].partDesc,
                                        weight: partBinInfo[p].weight
                                    });
                                    break;
                                case '4':
                                    if (standalonePNLs.filter(e => e.section === secPartData[m].section.slice(12,15)).length > 0) {
                                        PNL.push({
                                            qty: secPartData[m].parts[n].qty,
                                            part: part,
                                            partNum: partBinInfo[p].partNum,
                                            partDesc: partBinInfo[p].partDesc,
                                            weight: partBinInfo[p].weight
                                        });
                                    } else {
                                        INT.push({
                                            qty: secPartData[m].parts[n].qty,
                                            part: part,
                                            partNum: partBinInfo[p].partNum,
                                            partDesc: partBinInfo[p].partDesc,
                                            weight: partBinInfo[p].weight
                                        });
                                    }
                                    if (part.slice(7,8) == '9') {
                                        SCL.push({
                                            qty: secPartData[m].parts[n].qty,
                                            part: part,
                                            partNum: partBinInfo[p].partNum,
                                            partDesc: partBinInfo[p].partDesc,
                                            weight: partBinInfo[p].weight,
                                            cutLength: partBinInfo[p].cutLength
                                        });
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
                                    EXT.push({
                                        qty: secPartData[m].parts[n].qty,
                                        part: part,
                                        partNum: partBinInfo[p].partNum,
                                        partDesc: partBinInfo[p].partDesc,
                                        weight: partBinInfo[p].weight
                                    });
                                    break;
                            }

                            switch(partBinInfo[p].material) {
                                case "":
                                    break;
                                case "STAINLESS STEEL":
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
                        }
                    }
                }

                if (binBoms.filter(e => e.section == secPartData[m].section.slice(12,15)).length == 0) {
                    binBoms.push({
                        section: secPartData[m].section.slice(12,15),
                        PUR: PUR,
                        STR: STR,
                        PNL: PNL,
                        CTL: CTL,
                        INT: INT,
                        EXT: EXT,
                        SCL: SCL
                    });

                    sectionMatBoms.push({
                        section: secPartData[m].section.slice(12,15),
                        SS: SS,
                        AL: AL,
                        GA_7: GA_7,
                        LEXAN: LEXAN,
                        NP: NP
                    });
                }
            }

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
            }

            for (let lineup of lineups) {
                let lineup_SS_bom = [];
                let lineup_AL_bom = [];
                let lineup_GA_7_bom = [];
                let lineup_LEXAN_bom = [];
                let lineup_NP_bom = [];
                let sections = lineup.sections;
                for (let sectionMatBom of sectionMatBoms) {
                    if (sections.includes(sectionMatBom.section)) {
                        let ss = sectionMatBom.SS;
                        let al = sectionMatBom.AL;
                        let ga_7 = sectionMatBom.GA_7;
                        let lexan = sectionMatBom.LEXAN;
                        let np = sectionMatBom.NP;
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
                        for (let part5 of np) {
                            lineup_NP_bom.push({
                                part: part5.part,
                                template: part5.template,
                                text_row1: part5.text_row1,
                                text_row2: part5.text_row2,
                                text_row3: part5.text_row3
                            })
                        }
                    }
                }

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

                layoutBoms.push({
                    lineup: lineup.lineup,
                    sections: lineup.sections,
                    SS: lineup_SS_bom,
                    AL: lineup_AL_bom,
                    GA_7: lineup_GA_7_bom,
                    LEXAN: lineup_LEXAN_bom,
                    NP: lineup_NP_bom
                })
            }
            return null
        })
        .then(async function () {

            console.log("Completed: All SS, AL, LEXAN, 7GA, NP, and BIN BOMs calculated");

            let similarPURs = [];
            let similarSTRs = [];
            let similarPNLs = [];
            let similarCTLs = [];
            let similarINTs = [];
            let similarEXTs = [];
            let similarSCLs = [];

            let sections = [];
            let purBOMS = [];
            let strBOMS = [];
            let pnlBOMS = [];
            let ctlBOMS = [];
            let intBOMS = [];
            let extBOMS = [];
            let sclBOMS = [];
            function areJSONArraysEqual (jsonArray1, jsonArray2) {
                if (jsonArray1.length !== jsonArray2.length) return false;
                const ser = o => JSON.stringify(Object.keys(o).sort().map( k => [k, o[k]] ));
                jsonArray1 = new Set(jsonArray1.map(ser));
                return jsonArray2.every( o => jsonArray1.has(ser(o)) );
            }

            console.log(binBoms);

            for (let binBom of binBoms) {
                sections.push(binBom.section);
                purBOMS.push(binBom.PUR);
                strBOMS.push(binBom.STR);
                pnlBOMS.push(binBom.PNL);
                ctlBOMS.push(binBom.CTL);
                intBOMS.push(binBom.INT);
                extBOMS.push(binBom.EXT);
                sclBOMS.push(binBom.SCL);
            }

            console.log(sections);



            for (let i = 0; i < sections.length; i++) {
                let currentPurBom = purBOMS[i];
                let currentStrBom = strBOMS[i];
                let currentPnlBom = pnlBOMS[i];
                let currentCtlBom = ctlBOMS[i];
                let currentIntBom = intBOMS[i];
                let currentExtBom = extBOMS[i];
                let currentSclBom = sclBOMS[i];
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
            }


            for (let similarPUR of similarPURs) {
                let parent = similarPUR.parent;
                for (let child of similarPUR.children) {
                    binBoms.filter(e => e.section === child)[0].PUR = parent
                }
            }
            for (let similarSTR of similarSTRs) {
                let parent = similarSTR.parent;
                for (let child of similarSTR.children) {
                    binBoms.filter(e => e.section === child)[0].STR = parent
                }
            }
            for (let similarPNL of similarPNLs) {
                let parent = similarPNL.parent;
                for (let child of similarPNL.children) {
                    binBoms.filter(e => e.section === child)[0].PNL = parent
                }
            }
            for (let similarCTL of similarCTLs) {
                let parent = similarCTL.parent;
                for (let child of similarCTL.children) {
                    binBoms.filter(e => e.section === child)[0].CTL = parent
                }
            }
            for (let similarINT of similarINTs) {
                let parent = similarINT.parent;
                for (let child of similarINT.children) {
                    binBoms.filter(e => e.section === child)[0].INT = parent
                }
            }
            for (let similarEXT of similarEXTs) {
                let parent = similarEXT.parent;
                for (let child of similarEXT.children) {
                    binBoms.filter(e => e.section === child)[0].EXT = parent
                }
            }
            for (let similarSCL of similarSCLs) {
                let parent = similarSCL.parent;
                for (let child of similarSCL.children) {
                    binBoms.filter(e => e.section === child)[0].SCL = parent
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
            return await listAllDwgs(sessionId, drawings)
        })
        .then(async function (sortedCheckedDwgs) {
            console.log("Completed: Drawing Existence and Error Check");
            await checkFlats(sessionId, sortedCheckedDwgs);
            return null
        })
        .then(() => {
            console.log("Completed: Matching Drawing Models and Scale Check");
            sortedCheckedDwgs.sort(function(a,b) {
                let intA = parseInt(a.drawing.slice(7, 11) + a.drawing.slice(12, 15));
                let intB = parseInt(b.drawing.slice(7, 11) + b.drawing.slice(12, 15));
                return intA - intB
            });
            //render the main PDF-DXF-BIN BOM page (happens AFTER the CreoSON requests above finish)
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
            console.log(err);
        });
};

//Exports the Checked drawings to PDF/DXF format and BIN BOMs
exports.generateAll = function(req, res) {
    req.setTimeout(0); //no timeout
    //initialize variables
    let workingDir = req.body.CREO_workingDir;
    let outputDir = workingDir + '/_outputDir';

    let drawingCount = req.body.drawingCount;
    let drawingNames = req.body.drawingName;
    let pdfs = req.body.pdfCheck;
    let dxfs = req.body.dxfCheck;
    let drawings = [];

    async function exportSheet1PDF(sessionId, drawing) {
        await creo(sessionId, {
            command: "file",
            function: "open",
            data: {
                "file": drawing.name,
                "display": true,
                "activate": true
            }
        });
        let curSheetPDF = await creo(sessionId, {
            command: "drawing",
            function: "get_cur_sheet",
            data: {}
        });

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
        });
    }

    async function exportSheet1DXF(sessionId, drawing) {
        await creo(sessionId, {
            command: "file",
            function: "open",
            data: {
                "file": drawing.name,
                "display": true,
                "activate": true
            }
        });
        await creo(sessionId, {
            command: "drawing",
            function: "select_sheet",
            data: {
                "drawing": drawing.name,
                "sheet": 1
            }
        });

        let scaleDXF = await creo(sessionId, {
            command: "drawing",
            function: "get_sheet_scale",
            data: {
                "drawing": drawing.name,
                "sheet": 1
            }
        });
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

    async function exportSheet2DXF(sessionId, drawing) {
        await creo(sessionId, {
            command: "file",
            function: "open",
            data: {
                "file": drawing.name,
                "display": true,
                "activate": true
            }
        });
        await creo(sessionId, {
            command: "drawing",
            function: "select_sheet",
            data: {
                "drawing": drawing.name,
                "sheet": 2
            }
        });

        let scaleDXF = await creo(sessionId, {
            command: "drawing",
            function: "get_sheet_scale",
            data: {
                "drawing": drawing.name,
                "sheet": 2
            }
        });
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
    let PUR = [];
    let STR = [];
    let PNL = [];
    let CTL = [];
    let INT = [];
    let EXT = [];
    let SCL = [];
    let BIN_TRACKER = [];

    if (Array.isArray(layoutBoms) == true) {
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

    if (Array.isArray(sectionBoms) == true) {
        for (let sectionBom of sectionBoms) {
            sections.push(sectionBom);
        }
    } else {
        sections.push(sectionBoms);
    }

    for (let layout of layouts) {
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
    }

    for (let section of sections) {
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
    }

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

    for (let layout of layouts) {
        let secBinTrackingData = [];
        let pur, str, pnl, ctl, int, ext, scl;
            for (let section of layout.sections.split(',')) {
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

    if (SS.length != 0) {
        for (let ss of SS) {
            let workbook = new Excel.Workbook();
            let sheet = workbook.addWorksheet('sheet1');
            sheet.columns = [
                {header: 'Qty:', key: 'qty', width: 10, style: {font: {name: 'Calibri', size: 11}}},
                {header: 'Part Description:', key: 'partDesc', width: 40, style: {font: {name: 'Calibri', size: 11}}},
                {header: 'Part #:', key: 'part', width: 25, style: {font: {name: 'Calibri', size: 11}}}
            ];

            for(let ssItem of ss.data) {
                sheet.addRow({
                    qty: ssItem.qty,
                    partDesc: ssItem.partDesc,
                    part: ssItem.part
                });
            }
            workbook.xlsx.writeFile(outputDir + '/BIN BOMS/' + ss.bom + '.xlsx').then(function() {
                return null
            });
        }
    }

    if (AL.length != 0) {
        for (let al of AL) {
            let workbook = new Excel.Workbook();
            let sheet = workbook.addWorksheet('sheet1');
            sheet.columns = [
                {header: 'Qty:', key: 'qty', width: 10, style: {font: {name: 'Calibri', size: 11}}},
                {header: 'Part Description:', key: 'partDesc', width: 40, style: {font: {name: 'Calibri', size: 11}}},
                {header: 'Part #:', key: 'part', width: 25, style: {font: {name: 'Calibri', size: 11}}}
            ];

            for(let alItem of al.data) {
                sheet.addRow({
                    qty: alItem.qty,
                    partDesc: alItem.partDesc,
                    part: alItem.part
                });
            }
            workbook.xlsx.writeFile(outputDir + '/BIN BOMS/' + al.bom + '.xlsx').then(function() {
                return null
            });
        }
    }

    if (GA_7.length != 0) {
        for (let ga_7 of GA_7) {
            let workbook = new Excel.Workbook();
            let sheet = workbook.addWorksheet('sheet1');
            sheet.columns = [
                {header: 'Qty:', key: 'qty', width: 10, style: {font: {name: 'Calibri', size: 11}}},
                {header: 'Part Description:', key: 'partDesc', width: 40, style: {font: {name: 'Calibri', size: 11}}},
                {header: 'Part #:', key: 'part', width: 25, style: {font: {name: 'Calibri', size: 11}}}
            ];

            for(let ga_7Item of ga_7.data) {
                sheet.addRow({
                    qty: ga_7Item.qty,
                    partDesc: ga_7Item.partDesc,
                    part: ga_7Item.part
                });
            }
            workbook.xlsx.writeFile(outputDir + '/BIN BOMS/' + ga_7.bom + '.xlsx').then(function() {
                return null
            });
        }
    }

    if (LEXAN.length != 0) {
        for (let lexan of LEXAN) {
            let workbook = new Excel.Workbook();
            let sheet = workbook.addWorksheet('sheet1');
            sheet.columns = [
                {header: 'Qty:', key: 'qty', width: 10, style: {font: {name: 'Calibri', size: 11}}},
                {header: 'Part Description:', key: 'partDesc', width: 40, style: {font: {name: 'Calibri', size: 11}}},
                {header: 'Part #:', key: 'part', width: 25, style: {font: {name: 'Calibri', size: 11}}}
            ];

            for(let lexanItem of lexan.data) {
                sheet.addRow({
                    qty: lexanItem.qty,
                    partDesc: lexanItem.partDesc,
                    part: lexanItem.part
                });
            }
            workbook.xlsx.writeFile(outputDir + '/BIN BOMS/' + lexan.bom + '.xlsx').then(function() {
                return null
            });
        }
    }

    if (NP_A.length != 0) {
        for (let npA of NP_A) {
            let workbook = new Excel.Workbook();
            let sheet = workbook.addWorksheet(npA.bom);

            for (let npAItem of npA.data) {
                sheet.addRow([npAItem.text_row1, npAItem.text_row2, npAItem.text_row3])
            }
            workbook.csv.writeFile(outputDir + '/NAMEPLATES/' + npA.bom + '.csv').then(function() {
                return null
            });
        }
    }

    if (NP_B.length != 0) {
        for (let npB of NP_B) {
            let workbook = new Excel.Workbook();
            let sheet = workbook.addWorksheet(npB.bom);

            for (let npBItem of npB.data) {
                sheet.addRow([npBItem.text_row1, npBItem.text_row2, npBItem.text_row3])
            }

            workbook.csv.writeFile(outputDir + '/NAMEPLATES/' + npB.bom + '.csv').then(function() {
                return null
            });
        }
    }

    if (NP_C.length!= 0) {
        for (let npC of NP_C) {
            let workbook = new Excel.Workbook();
            let sheet = workbook.addWorksheet(npC.bom);

            for (let npCItem of npC.data) {
                sheet.addRow([npCItem.text_row1, npCItem.text_row2, npCItem.text_row3])
            }

            workbook.csv.writeFile(outputDir + '/NAMEPLATES/' + npC.bom + '.csv').then(function() {
                return null
            });
        }
    }

    if (NP_D.length != 0) {
        for (let npD of NP_D) {
            let workbook = new Excel.Workbook();
            let sheet = workbook.addWorksheet(npD.bom);

            for (let npDItem of npD.data) {
                sheet.addRow([npDItem.text_row1, npDItem.text_row2, npDItem.text_row3])
            }

            for (let npDItem of npD.data) {
                sheet.addRow([npDItem.text_row1, npDItem.text_row2, npDItem.text_row3])
            }
            workbook.csv.writeFile(outputDir + '/NAMEPLATES/' + npD.bom + '.csv').then(function() {
                return null
            });
        }
    }

    if (PUR.length != 0) {
        for (let pur of PUR) {
            let workbook = new Excel.Workbook();
            let sheet = workbook.addWorksheet('sheet1');
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
            let count = 1;
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
            workbook.xlsx.writeFile(outputDir + '/BIN BOMS/' + pur.bom + '.xlsx').then(function() {
                return null
            });
        }
    }

    if (STR.length != 0) {
        for (let str of STR) {
            let workbook = new Excel.Workbook();
            let sheet = workbook.addWorksheet('sheet1');
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
            let count = 1;
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
            workbook.xlsx.writeFile(outputDir + '/BIN BOMS/' + str.bom + '.xlsx').then(function() {
                return null
            });
        }
    }

    if (PNL.length != 0) {
        for (let pnl of PNL) {
            let workbook = new Excel.Workbook();
            let sheet = workbook.addWorksheet('sheet1');
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
            let count = 1;
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
            workbook.xlsx.writeFile(outputDir + '/BIN BOMS/' + pnl.bom + '.xlsx').then(function() {
                return null
            });
        }
    }

    if (CTL.length != 0) {
        for (let ctl of CTL) {
            let workbook = new Excel.Workbook();
            let sheet = workbook.addWorksheet('sheet1');
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
            let count = 1;
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
            workbook.xlsx.writeFile(outputDir + '/BIN BOMS/' + ctl.bom + '.xlsx').then(function() {
                return null
            });
        }
    }

    if (INT.length != 0) {
        for (let int of INT) {
            let workbook = new Excel.Workbook();
            let sheet = workbook.addWorksheet('sheet1');
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
            let count = 1;
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
            workbook.xlsx.writeFile(outputDir + '/BIN BOMS/' + int.bom + '.xlsx').then(function() {
                return null
            });
        }
    }

    if (EXT.length != 0) {
        for (let ext of EXT) {
            let workbook = new Excel.Workbook();
            let sheet = workbook.addWorksheet('sheet1');
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
            let count = 1;
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
            workbook.xlsx.writeFile(outputDir + '/BIN BOMS/' + ext.bom + '.xlsx').then(function() {
                return null
            });
        }
    }

    if (SCL.length != 0) {
        for (let scl of SCL) {
            let workbook = new Excel.Workbook();
            let sheet = workbook.addWorksheet('sheet1');
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

            for(let sclItem of scl.data) {

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
            workbook.xlsx.writeFile(outputDir + '/BIN BOMS/' + scl.bom + '.xlsx').then(function() {
                return null
            });
        }
    }

    if (BIN_TRACKER.length != 0) {
        for (let binTracker of BIN_TRACKER) {
            let workbook = new Excel.Workbook();
            let sheet = workbook.addWorksheet('sheet1');
            sheet.columns = [
                {header: 'Section:', key: 'section', width: 20, style: {font: {name: 'Calibri', size: 11}}},
                {header: 'PUR:', key: 'pur', width: 30, style: {font: {name: 'Calibri', size: 11}}},
                {header: 'STR:', key: 'str', width: 30, style: {font: {name: 'Calibri', size: 11}}},
                {header: 'PNL:', key: 'pnl', width: 30, style: {font: {name: 'Calibri', size: 11}}},
                {header: 'CTL:', key: 'ctl', width: 30, style: {font: {name: 'Calibri', size: 11}}},
                {header: 'INT:', key: 'int', width: 30, style: {font: {name: 'Calibri', size: 11}}},
                {header: 'EXT:', key: 'ext', width: 30, style: {font: {name: 'Calibri', size: 11}}},
                {header: 'SCL:', key: 'scl', width: 30, style: {font: {name: 'Calibri', size: 11}}}
            ];
            for (let binTrackerItem of binTracker.data) {
                sheet.addRow({
                    section: binTrackerItem.section,
                    pur: binTrackerItem.data.PUR,
                    str: binTrackerItem.data.STR,
                    pnl: binTrackerItem.data.PNL,
                    ctl: binTrackerItem.data.CTL,
                    int: binTrackerItem.data.INT,
                    ext: binTrackerItem.data.EXT,
                    scl: binTrackerItem.data.SCL
                });
            }
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
            dxf: parseInt(dxfs[i])
        })
    }
    //function that takes in a .drw file, opens it, and then generates a PDF
    async function openAndExport_PDF_DXF(sessionId, drawings) {
        const doesSetupExist = await creo(sessionId, {
            command: "creo",
            function: "list_files",
            data: {
                "filename": "*dop"
            }
        });


        if (doesSetupExist.data == undefined) {
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

        for (let drawing of drawings) {
            if (drawing.pdf == 1 && drawing.dxf == 1) {
                await exportSheet1PDF(sessionId, drawing);
                await exportSheet2DXF(sessionId, drawing);
            }
            if (drawing.pdf == 1 && drawing.dxf == 0) {
                await exportSheet1PDF(sessionId, drawing);
            }
            if (drawing.pdf == 0 && drawing.dxf == 1) {
                await exportSheet1DXF(sessionId, drawing);
            }
        }
        return null
    }

    //execute the async open and export PDF_DXF_BINBOM function declared above
    openAndExport_PDF_DXF(sessionId, drawings)
        .then(() => {
            //render the main PDF-DXF-BIN BOM page (happens before the CreoSON requests above finish)
            res.locals = {title: 'PDF-DXF-BIN BOM'};
            res.redirect('/PDF-DXF-BIN_BOM');
        })
        .catch(err => {
            console.log(err);
        });
};

//Exports the BIN BOMs only
exports.generateBinBoms = function(req, res) {
    req.setTimeout(0); //no timeout
    //initialize variables
    let workingDir = req.body.CREO_workingDir;
    let outputDir = workingDir + '/_outputDir';
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
    let PUR = [];
    let STR = [];
    let PNL = [];
    let CTL = [];
    let INT = [];
    let EXT = [];
    let SCL = [];
    let BIN_TRACKER = [];

    if (Array.isArray(layoutBoms) == true) {
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

    if (Array.isArray(sectionBoms) == true) {
        for (let sectionBom of sectionBoms) {
            sections.push(sectionBom);
        }
    } else {
        sections.push(sectionBoms);
    }

    for (let layout of layouts) {
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
    }

    for (let section of sections) {
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
    }

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

        if (existingLayoutBom.slice(existingLayoutBom.length - 2, existingLayoutBom.length) == 'AL') {
            let al = [];
            if (Array.isArray(req.body['qty_' + existingLayoutBom]) == true) {
                for (let i = 0; i < req.body['qty_' + existingLayoutBom].length; i++) {
                    al.push({
                        qty: req.body['qty_' + existingLayoutBom][i],
                        partDesc: req.body['partDesc_' + existingLayoutBom][i],
                        part: req.body['part_' + existingLayoutBom][i]
                    })
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

    for (let layout of layouts) {
        let secBinTrackingData = [];
        let pur, str, pnl, ctl, int, ext, scl;
        for (let section of layout.sections.split(',')) {
            if (req.body['binTracker_PUR_' + layout.layout.slice(0,7) + section] != undefined) {
                pur = req.body['binTracker_PUR_' + layout.layout.slice(0,7) + section];
            } else {
                pur = 'N/A';
            }
            if (req.body['binTracker_STR_' + layout.layout.slice(0,7) + section] != undefined) {
                str = req.body['binTracker_STR_' + layout.layout.slice(0,7) + section];
            } else {
                str = 'N/A';
            }
            if (req.body['binTracker_PNL_' + layout.layout.slice(0,7) + section] != undefined) {
                pnl = req.body['binTracker_PNL_' + layout.layout.slice(0,7) + section];
            } else {
                pnl = 'N/A';
            }
            if (req.body['binTracker_CTL_' + layout.layout.slice(0,7) + section] != undefined) {
                ctl = req.body['binTracker_CTL_' + layout.layout.slice(0,7) + section];
            } else {
                ctl = 'N/A';
            }
            if (req.body['binTracker_INT_' + layout.layout.slice(0,7) + section] != undefined) {
                int = req.body['binTracker_INT_' + layout.layout.slice(0,7) + section];
            } else {
                int = 'N/A';
            }
            if (req.body['binTracker_EXT_' + layout.layout.slice(0,7) + section] != undefined) {
                ext = req.body['binTracker_EXT_' + layout.layout.slice(0,7) + section];
            } else {
                ext = 'N/A';
            }
            if (req.body['binTracker_SCL_' + layout.layout.slice(0,7) + section] != undefined) {
                scl = req.body['binTracker_SCL_' + layout.layout.slice(0,7) + section];
            } else {
                scl = 'N/A';
            }
            secBinTrackingData.push({
                section: section,
                data: {
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

    if (SS.length != 0) {
        for (let ss of SS) {
            let workbook = new Excel.Workbook();
            let sheet = workbook.addWorksheet('sheet1');
            sheet.columns = [
                {header: 'Qty:', key: 'qty', width: 10, style: {font: {name: 'Calibri', size: 11}}},
                {header: 'Part Description:', key: 'partDesc', width: 40, style: {font: {name: 'Calibri', size: 11}}},
                {header: 'Part #:', key: 'part', width: 25, style: {font: {name: 'Calibri', size: 11}}}
            ];

            for(let ssItem of ss.data) {
                sheet.addRow({
                    qty: ssItem.qty,
                    partDesc: ssItem.partDesc,
                    part: ssItem.part
                });
            }
            workbook.xlsx.writeFile(outputDir + '/BIN BOMS/' + ss.bom + '.xlsx').then(function() {
                return null
            });
        }
    }

    if (AL.length != 0) {
        for (let al of AL) {
            let workbook = new Excel.Workbook();
            let sheet = workbook.addWorksheet('sheet1');
            sheet.columns = [
                {header: 'Qty:', key: 'qty', width: 10, style: {font: {name: 'Calibri', size: 11}}},
                {header: 'Part Description:', key: 'partDesc', width: 40, style: {font: {name: 'Calibri', size: 11}}},
                {header: 'Part #:', key: 'part', width: 25, style: {font: {name: 'Calibri', size: 11}}}
            ];

            for(let alItem of al.data) {
                sheet.addRow({
                    qty: alItem.qty,
                    partDesc: alItem.partDesc,
                    part: alItem.part
                });
            }
            workbook.xlsx.writeFile(outputDir + '/BIN BOMS/' + al.bom + '.xlsx').then(function() {
                return null
            });
        }
    }

    if (GA_7.length != 0) {
        for (let ga_7 of GA_7) {
            let workbook = new Excel.Workbook();
            let sheet = workbook.addWorksheet('sheet1');
            sheet.columns = [
                {header: 'Qty:', key: 'qty', width: 10, style: {font: {name: 'Calibri', size: 11}}},
                {header: 'Part Description:', key: 'partDesc', width: 40, style: {font: {name: 'Calibri', size: 11}}},
                {header: 'Part #:', key: 'part', width: 25, style: {font: {name: 'Calibri', size: 11}}}
            ];

            for(let ga_7Item of ga_7.data) {
                sheet.addRow({
                    qty: ga_7Item.qty,
                    partDesc: ga_7Item.partDesc,
                    part: ga_7Item.part
                });
            }
            workbook.xlsx.writeFile(outputDir + '/BIN BOMS/' + ga_7.bom + '.xlsx').then(function() {
                return null
            });
        }
    }

    if (LEXAN.length != 0) {
        for (let lexan of LEXAN) {
            let workbook = new Excel.Workbook();
            let sheet = workbook.addWorksheet('sheet1');
            sheet.columns = [
                {header: 'Qty:', key: 'qty', width: 10, style: {font: {name: 'Calibri', size: 11}}},
                {header: 'Part Description:', key: 'partDesc', width: 40, style: {font: {name: 'Calibri', size: 11}}},
                {header: 'Part #:', key: 'part', width: 25, style: {font: {name: 'Calibri', size: 11}}}
            ];

            for(let lexanItem of lexan.data) {
                sheet.addRow({
                    qty: lexanItem.qty,
                    partDesc: lexanItem.partDesc,
                    part: lexanItem.part
                });
            }
            workbook.xlsx.writeFile(outputDir + '/BIN BOMS/' + lexan.bom + '.xlsx').then(function() {
                return null
            });
        }
    }

    if (NP_A.length != 0) {
        for (let npA of NP_A) {
            let workbook = new Excel.Workbook();
            let sheet = workbook.addWorksheet(npA.bom);

            for (let npAItem of npA.data) {
                sheet.addRow([npAItem.text_row1, npAItem.text_row2, npAItem.text_row3])
            }
            workbook.csv.writeFile(outputDir + '/NAMEPLATES/' + npA.bom + '.csv').then(function() {
                return null
            });
        }
    }

    if (NP_B.length != 0) {
        for (let npB of NP_B) {
            let workbook = new Excel.Workbook();
            let sheet = workbook.addWorksheet(npB.bom);

            for (let npBItem of npB.data) {
                sheet.addRow([npBItem.text_row1, npBItem.text_row2, npBItem.text_row3])
            }

            workbook.csv.writeFile(outputDir + '/NAMEPLATES/' + npB.bom + '.csv').then(function() {
                return null
            });
        }
    }

    if (NP_C.length!= 0) {
        for (let npC of NP_C) {
            let workbook = new Excel.Workbook();
            let sheet = workbook.addWorksheet(npC.bom);

            for (let npCItem of npC.data) {
                sheet.addRow([npCItem.text_row1, npCItem.text_row2, npCItem.text_row3])
            }

            workbook.csv.writeFile(outputDir + '/NAMEPLATES/' + npC.bom + '.csv').then(function() {
                return null
            });
        }
    }

    if (NP_D.length != 0) {
        for (let npD of NP_D) {
            let workbook = new Excel.Workbook();
            let sheet = workbook.addWorksheet(npD.bom);

            for (let npDItem of npD.data) {
                sheet.addRow([npDItem.text_row1, npDItem.text_row2, npDItem.text_row3])
            }

            for (let npDItem of npD.data) {
                sheet.addRow([npDItem.text_row1, npDItem.text_row2, npDItem.text_row3])
            }
            workbook.csv.writeFile(outputDir + '/NAMEPLATES/' + npD.bom + '.csv').then(function() {
                return null
            });
        }
    }

    if (PUR.length != 0) {
        for (let pur of PUR) {
            let workbook = new Excel.Workbook();
            let sheet = workbook.addWorksheet('sheet1');
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
            let count = 1;
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
            workbook.xlsx.writeFile(outputDir + '/BIN BOMS/' + pur.bom + '.xlsx').then(function() {
                return null
            });
        }
    }

    if (STR.length != 0) {
        for (let str of STR) {
            let workbook = new Excel.Workbook();
            let sheet = workbook.addWorksheet('sheet1');
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
            let count = 1;
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
            workbook.xlsx.writeFile(outputDir + '/BIN BOMS/' + str.bom + '.xlsx').then(function() {
                return null
            });
        }
    }

    if (PNL.length != 0) {
        for (let pnl of PNL) {
            let workbook = new Excel.Workbook();
            let sheet = workbook.addWorksheet('sheet1');
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
            let count = 1;
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
            workbook.xlsx.writeFile(outputDir + '/BIN BOMS/' + pnl.bom + '.xlsx').then(function() {
                return null
            });
        }
    }

    if (CTL.length != 0) {
        for (let ctl of CTL) {
            let workbook = new Excel.Workbook();
            let sheet = workbook.addWorksheet('sheet1');
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
            let count = 1;
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
            workbook.xlsx.writeFile(outputDir + '/BIN BOMS/' + ctl.bom + '.xlsx').then(function() {
                return null
            });
        }
    }

    if (INT.length != 0) {
        for (let int of INT) {
            let workbook = new Excel.Workbook();
            let sheet = workbook.addWorksheet('sheet1');
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
            let count = 1;
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
            workbook.xlsx.writeFile(outputDir + '/BIN BOMS/' + int.bom + '.xlsx').then(function() {
                return null
            });
        }
    }

    if (EXT.length != 0) {
        for (let ext of EXT) {
            let workbook = new Excel.Workbook();
            let sheet = workbook.addWorksheet('sheet1');
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
            let count = 1;
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
            workbook.xlsx.writeFile(outputDir + '/BIN BOMS/' + ext.bom + '.xlsx').then(function() {
                return null
            });
        }
    }

    if (SCL.length != 0) {
        for (let scl of SCL) {
            let workbook = new Excel.Workbook();
            let sheet = workbook.addWorksheet('sheet1');
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

            for(let sclItem of scl.data) {

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
            workbook.xlsx.writeFile(outputDir + '/BIN BOMS/' + scl.bom + '.xlsx').then(function() {
                return null
            });
        }
    }

    if (BIN_TRACKER.length != 0) {
        for (let binTracker of BIN_TRACKER) {
            let workbook = new Excel.Workbook();
            let sheet = workbook.addWorksheet('sheet1');
            sheet.columns = [
                {header: 'Section:', key: 'section', width: 20, style: {font: {name: 'Calibri', size: 11}}},
                {header: 'PUR:', key: 'pur', width: 30, style: {font: {name: 'Calibri', size: 11}}},
                {header: 'STR:', key: 'str', width: 30, style: {font: {name: 'Calibri', size: 11}}},
                {header: 'PNL:', key: 'pnl', width: 30, style: {font: {name: 'Calibri', size: 11}}},
                {header: 'CTL:', key: 'ctl', width: 30, style: {font: {name: 'Calibri', size: 11}}},
                {header: 'INT:', key: 'int', width: 30, style: {font: {name: 'Calibri', size: 11}}},
                {header: 'EXT:', key: 'ext', width: 30, style: {font: {name: 'Calibri', size: 11}}},
                {header: 'SCL:', key: 'scl', width: 30, style: {font: {name: 'Calibri', size: 11}}}
            ];
            for (let binTrackerItem of binTracker.data) {
                sheet.addRow({
                    section: binTrackerItem.section,
                    pur: binTrackerItem.data.PUR,
                    str: binTrackerItem.data.STR,
                    pnl: binTrackerItem.data.PNL,
                    ctl: binTrackerItem.data.CTL,
                    int: binTrackerItem.data.INT,
                    ext: binTrackerItem.data.EXT,
                    scl: binTrackerItem.data.SCL
                });
            }
            workbook.xlsx.writeFile(outputDir + '/BIN BOMS/' + binTracker.layout + '-BIN_TRACKER' + '.xlsx').then(function() {
                return null
            });
        }
    }

    //render the main PDF-DXF-BIN BOM page (happens before the CreoSON requests above finish)
    res.locals = {title: 'PDF-DXF-BIN BOM'};
    res.redirect('/PDF-DXF-BIN_BOM');

};

//Exports the Checked drawings to PDF/DXF format
exports.generateDrawings = function(req, res) {
    req.setTimeout(0); //no timeout
    //initialize variables
    let workingDir = req.body.CREO_workingDir;
    let outputDir = workingDir + '/_outputDir';
    let drawingCount = req.body.drawingCount;
    let drawingNames = req.body.drawingName;
    let pdfs = req.body.pdfCheck;
    let dxfs = req.body.dxfCheck;
    let drawings = [];

    async function exportSheet1PDF(sessionId, drawing) {
        await creo(sessionId, {
            command: "file",
            function: "open",
            data: {
                "file": drawing.name,
                "display": true,
                "activate": true
            }
        });
        let curSheetPDF = await creo(sessionId, {
            command: "drawing",
            function: "get_cur_sheet",
            data: {}
        });

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
                    "~ Command `ProCmdDwgPubSettings` ;~ Activate `intf_profile` `OkPshBtn`;\n" +
                    "~ Command `ProCmdDwgPubExport` ;~ Activate `file_saveas` `Current Dir`;\n" +
                    "~ Select `file_saveas` `ph_list.Filelist` 1 `_outputDir`;\n" +
                    "~ Activate `file_saveas` `ph_list.Filelist` 1 `_outputDir`;\n" +
                    "~ Select `file_saveas` `ph_list.Filelist` 1 `PDF`;\n" +
                    "~ Activate `file_saveas` `ph_list.Filelist` 1 `PDF`;\n" +
                    "~ Activate `file_saveas` `OK`;~ Command `ProCmdDwgPubCloseExportPvw`;"
            }
        });
    }

    async function exportSheet1DXF(sessionId, drawing) {
        await creo(sessionId, {
            command: "file",
            function: "open",
            data: {
                "file": drawing.name,
                "display": true,
                "activate": true
            }
        });
        await creo(sessionId, {
            command: "drawing",
            function: "select_sheet",
            data: {
                "drawing": drawing.name,
                "sheet": 1
            }
        });

        let scaleDXF = await creo(sessionId, {
            command: "drawing",
            function: "get_sheet_scale",
            data: {
                "drawing": drawing.name,
                "sheet": 1
            }
        });
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

    async function exportSheet2DXF(sessionId, drawing) {
        await creo(sessionId, {
            command: "file",
            function: "open",
            data: {
                "file": drawing.name,
                "display": true,
                "activate": true
            }
        });
        await creo(sessionId, {
            command: "drawing",
            function: "select_sheet",
            data: {
                "drawing": drawing.name,
                "sheet": 2
            }
        });

        let scaleDXF = await creo(sessionId, {
            command: "drawing",
            function: "get_sheet_scale",
            data: {
                "drawing": drawing.name,
                "sheet": 2
            }
        });
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

    //create the drawings JSON array from the .drw files in the working directory
    for (let i = 0; i < drawingCount - 1; i++) {
        drawings.push({
            name: drawingNames[i],
            pdf: parseInt(pdfs[i]),
            dxf: parseInt(dxfs[i])
        })
    }
    //function that takes in a .drw file, opens it, and then generates a PDF
    async function openAndExport_PDF_DXF(sessionId, drawings) {
        for (let drawing of drawings) {
            if (drawing.pdf == 1 && drawing.dxf == 1) {
                await exportSheet1PDF(sessionId, drawing);
                await exportSheet2DXF(sessionId, drawing);
            }
            if (drawing.pdf == 1 && drawing.dxf == 0) {
                await exportSheet1PDF(sessionId, drawing);
            }
            if (drawing.pdf == 0 && drawing.dxf == 1) {
                await exportSheet1DXF(sessionId, drawing);
            }
        }
        return null
    }

    //execute the async open and export PDF_DXF_BINBOM function declared above
    openAndExport_PDF_DXF(sessionId, drawings)
        .then(() => {
            //render the main PDF-DXF-BIN BOM page (happens before the CreoSON requests above finish)
            res.locals = {title: 'PDF-DXF-BIN BOM'};
            res.redirect('/PDF-DXF-BIN_BOM');
        })
        .catch(err => {
            console.log(err);
        });
};



