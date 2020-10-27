//BOILERPLATE CODE - GOES AT BEGINNING OF ANY .JS FILE USING CREOSON

//Excel Connection
const xlsxFile = require('read-excel-file/node');

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

//END OF BOILERPLATE CODE


//BASE FRAME AUTOMATION
xlsxFile('modules/LV_Master_Creo_Library.xlsx').then(async function(rows)  {

    let workingDir = "C:\\Users\\james.africh\\Desktop\\200610_CREO";
    console.table(rows);
    for (let i in rows) {
        if (i == 0) {
        //THIS ROW CONTAINS ALL THE COLUMN NAMES, SO IT GETS SKIPPED
        } else {
            //OPENING BASE FRAME ASM
            await creo(sessionId, {
                command: "file",
                function: "open",
                data: {
                    file: "000000-0006-000.asm",
                    dirname: workingDir,
                    display: true,
                    activate: true
                }
            });

            //REGEN
            await creo(sessionId, {
                command: "file",
                function: "regenerate",
                data: {
                    file: "000000-0006-000.asm",
                    display: true
                }
            });
            //SAVING COPY OF NEW 0006 ASM
            await creo(sessionId, {
                command: "interface",
                function: "mapkey",
                data: {
                    script: "~ Close `main_dlg_cur` `appl_casc`;" +
                        "~ Command `ProCmdModelSaveAs` ;" +
                        "~ LButtonArm `file_saveas` `tb_EMBED_BROWSER_TB_SAB_LAYOUT` 3 471 14 0;" +
                        "~ LButtonDisarm `file_saveas` `tb_EMBED_BROWSER_TB_SAB_LAYOUT` 3 471 14 0;" +
                        "~ LButtonActivate `file_saveas` `tb_EMBED_BROWSER_TB_SAB_LAYOUT` 3 471 14 0;" +
                        "~ Input `file_saveas` `opt_EMBED_BROWSER_TB_SAB_LAYOUT` " + "`" + workingDir + "`;" +
                        "~ Update `file_saveas` `opt_EMBED_BROWSER_TB_SAB_LAYOUT` " + "`" + workingDir + "`;" +
                        "~ FocusOut `file_saveas` `opt_EMBED_BROWSER_TB_SAB_LAYOUT`;" +
                        "~ Update `file_saveas` `Inputname` " + "`" + rows[i][6] + "`;" +
                        "~ Activate `file_saveas` `OK`;~ Activate `assyrename` `OpenBtn`;"
                }
            });

            //REGENERATE NEW ASM
            await creo(sessionId, {
                command: "file",
                function: "regenrate",
                data: {
                    file: rows[i][6]+".asm"
                }
            });

            //SETTING FRAME_WIDTH
            await creo(sessionId, {
                command: "dimension",
                function: "set",
                data: {
                    file: rows[i][6]+".asm",
                    name: "FRAME_WIDTH",
                    value: rows[i][2]
                }
            });

            //SETTING FRAME_DEPTH
            await creo(sessionId, {
                command: "dimension",
                function: "set",
                data: {
                    file: rows[i][6]+".asm",
                    name: "FRAME_DEPTH",
                    value: rows[i][4]
                }
            });

            //REPLACING 1005-001 PART
            await creo(sessionId, {
                command: "familytable",
                function: "replace",
                data: {
                    file: rows[i][6]+".asm",
                    cur_model: "000000-1005-000.prt",
                    cur_inst: "000000-1005-001",
                    new_inst: rows[i][3]
                }
            });

            //REPLACING 1006-001 PART
            await creo(sessionId, {
                command: "familytable",
                function: "replace",
                data: {
                    file: rows[i][6]+".asm",
                    cur_model: "000000-1006-000.prt",
                    cur_inst: "000000-1006-001",
                    new_inst: rows[i][5]
                }
            });

            //REGENERATE NEW ASM
            await creo(sessionId, {
                command: "file",
                function: "regenrate",
                data: {
                    file: rows[i][6]+".asm"
                }
            });

            //SAVE NEW ASM
            await creo(sessionId, {
                command: "file",
                function: "save",
                data: {
                    file: rows[i][6]+".asm"
                }
            });

            //CLOSE THE WINDOW OF NEW ASM
            await creo(sessionId, {
                command: "file",
                function: "close_window",
                data: {
                    file: rows[i][6]+".asm"
                }
            });

            //CLOSE THE WINDOW OF 0006-000 ASM
            await creo(sessionId, {
                command: "file",
                function: "close_window",
                data: {
                    file: "000000-0006-000.asm"
                }
            });

        }
    }

});

