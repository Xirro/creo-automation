//BOILERPLATE CODE - GOES AT BEGINNING OF ANY .JS FILE USING CREOSON

//Excel Connection
const xlsxFile = require('read-excel-file/node');

//Creoson Connection (using axios instead of request-promise)
const axios = require('axios');
let creoHttp = 'http://localhost:9056/creoson';
let sessionId;

async function initCreoSession() {
    try {
        const resp = await axios.post(creoHttp, { command: 'connection', function: 'connect' });
        if (resp && resp.data && resp.data.sessionId) sessionId = resp.data.sessionId;
    } catch (err) {
        console.log('there was an error:' + err);
    }
}

// initialize session immediately
initCreoSession();

function creo(sessionId, functionData) {
    const payload = { sessionId: sessionId, command: functionData.command, function: functionData.function };
    if (functionData.data && functionData.data.length !== undefined && functionData.data.length !== 0) {
        payload.data = functionData.data;
    }
    return axios.post(creoHttp, payload).then(r => r.data);
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

