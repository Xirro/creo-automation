exports.searchSubmittal = function(req, res) {
    let urlObj = url.parse(req.originalUrl);
    urlObj.protocol = req.protocol;
    urlObj.host = req.get('host');
    let qs = queryString.parse(urlObj.search);
    let subID = qs.subID.split('_')[1];
    let subData = [];
    let revData = [];
    let creoData = [];
    let layoutData = [];
    let layoutDropdownData = [];
    let brkAccDropdownData = [];
    let deviceData = [];
    let brkAccData = [];
    let sectionData = [];
    let sectionTypeData = [];
    let brkTypeData = [];
    let restrictionData = [];
    let pbRowData = [];
    let brkDropdownOpts_NW = [];
    let brkDropdownOpts_Emax2 = [];
    let brkDropdownOpts_Powerpact = [];
    let brkDropdownOpts_Tmax = [];
    submittalLookup(subData, [null, null, subID])
        .then(async function(submittals) {
            for (let submittal of submittals) {
                let drawnDate = moment(submittal.drawnDate).utc().format("YYYY-MM-DD");
                let checkedDate = moment(submittal.checkedDate).utc().format("YYYY-MM-DD");
                await subData.push({
                    subID: submittal.subID,
                    jobNum: submittal.jobNum,
                    releaseNum: submittal.releaseNum,
                    jobName: submittal.jobName,
                    customer: submittal.customer,
                    layoutName: submittal.layoutName,
                    drawnBy: submittal.drawnBy,
                    drawnDate: drawnDate,
                    checkedBy: submittal.checkedBy,
                    checkedDate: checkedDate
                });
            }
            return null
        })
        .then(async function() {
            return await revLookup([subData[0].subID])
        })
        .then(async function(revs) {
            for (let rev of revs) {
                await revData.push({
                    revID: rev.revID,
                    subID: rev.subID,
                    revNum: rev.revNum,
                    revNote: rev.revNote
                })
            }
            return null
        })
        .then(async function() {
            let jobNum = subData[0].jobNum;
            let releaseNum = subData[0].releaseNum;
            let layoutName = subData[0].layoutName;
            let latestRevNum = revData[revData.length - 1].revNum;

            let layoutNum = releaseNum.toLowerCase().charCodeAt(0) - 96;
            let dir = await creo(sessionId, {
                command: "creo",
                function: "pwd",
                data: {}
            });
            if (dir.data == undefined) {
                await creo(sessionId, {
                    command: "creo",
                    function: "cd",
                    data: {
                        "dirname": creoWorkingDir
                    }
                });
            } else {
                if (dir.data.dirname != creoWorkingDir) {
                    await creo(sessionId, {
                        command: "creo",
                        function: "cd",
                        data: {
                            "dirname": creoWorkingDir
                        }
                    });
                }
            }
            let creoLayoutAsm;
            let creoLayoutDrw;
            let creoOneLineAsm;
            let creoOutputDir = null;
            let creoOutputPDF;
            if (layoutNum < 10) {
                creoLayoutAsm = jobNum+'-'+'0000'+'-'+'00'+layoutNum+'.asm';
                creoOneLineAsm = jobNum+'-'+'0001'+'-'+'00'+layoutNum+'.asm';
            } else if (layoutNum < 100) {
                creoLayoutAsm = jobNum+'-'+'0000'+'-'+'0'+layoutNum+'.asm';
                creoOneLineAsm = jobNum+'-'+'0001'+'-'+'0'+layoutNum+'.asm';
            }
            creoLayoutDrw = creoLayoutAsm.slice(0,15)+'-S.drw';
            creoOutputPDF = creoLayoutAsm.slice(0,15)+'-'+latestRevNum+'_'+layoutName+'.pdf';
            creoData.push({
                workingDir: creoWorkingDir,
                layoutAsm: creoLayoutAsm,
                layoutDrw: creoLayoutDrw,
                oneLineAsm: creoOneLineAsm,
                standardLib: creoStandardLib,
                outputDir: creoOutputDir,
                outputPDF: creoOutputPDF
            });
            return null
        })
        .then(async function () {
            return await querySql("SELECT * FROM " + database + "." + dbConfig.submittal_layout_table + " WHERE subID = ?", subData[0].subID);
        })
        .then(async function(layouts) {
            if (layouts.length != 0) {
                for (let layout of layouts) {
                    layoutData.push({
                        subID: layout.subID,
                        layoutID: layout.layoutID,
                        layoutName: layout.layoutName,
                        ulListing: layout.ulListing,
                        systemType: layout.systemType,
                        systemAmp: layout.systemAmp,
                        mainBusAmp: layout.mainBusAmp,
                        enclosure: layout.enclosure,
                        accessibility: layout.accessibility,
                        cableAccess: layout.cableAccess,
                        paint: layout.paint,
                        interruptRating: layout.interruptRating,
                        busBracing: layout.busBracing,
                        busType: layout.busType,
                        insulatedBus: layout.insulatedBus,
                        boots: layout.boots,
                        iccbPlatform: layout.iccbPlatform,
                        mccbPlatform: layout.mccbPlatform,
                        vcbPlatform: layout.vcbPlatform,
                        keyInterlocks: layout.keyInterlocks,
                        seismic: layout.seismic,
                        mimic: layout.mimic,
                        ir: layout.ir,
                        wireway: layout.wireway,
                        trolley: layout.trolley,
                        numSections: layout.numSections
                    });
                }
            }
            return null
        })
        .then(async function() {
            if (layoutData.length != 0) {
                let layoutID = layoutData[0].layoutID;
                return await querySql("SELECT * FROM " + database + "." + dbConfig.submittal_breaker_table + " WHERE layoutID = ?", layoutID);
            } else {
                return [];
            }
        })
        .then(async function(breakers) {
            for (let breaker of breakers) {
                deviceData.push({
                    devID: breaker.devID,
                    layoutID: breaker.layoutID,
                    secID: breaker.secID,
                    comp: breaker.comp,
                    devDesignation: breaker.devDesignation,
                    devFunction: breaker.devFunction,
                    unitOfIssue: breaker.unitOfIssue,
                    catCode: breaker.catCode,
                    platform: breaker.platform,
                    brkPN: breaker.brkPN,
                    cradlePN: breaker.cradlePN,
                    devMount: breaker.devMount,
                    rearAdaptType: breaker.rearAdaptType,
                    devUL: breaker.devUL,
                    devLevel: breaker.devLevel,
                    devOperation: breaker.devOperation,
                    devCtrlVolt: breaker.devCtrlVolt,
                    devMaxVolt: breaker.devMaxVolt,
                    devKAIC: breaker.devKAIC,
                    devFrameSet: breaker.devFrameSet,
                    devSensorSet: breaker.devSensorSet,
                    devTripSet: breaker.devTripSet,
                    devTripUnit: breaker.devTripUnit,
                    devTripParam: breaker.devTripParam,
                    devPoles: breaker.devPoles,
                    devLugQty: breaker.devLugQty,
                    devLugType: breaker.devLugType,
                    devLugSize: breaker.devLugSize
                })
            }
            return null
        })
        .then(async function() {
            for (let data of deviceData) {
                const devAccs = await querySql("SELECT * FROM " + database + "." + dbConfig.submittal_brkAcc_table + " WHERE devID = ?", data.devID);
                const devAccOptions = await querySql("SELECT * FROM " + database + "." + dbConfig.brkAcc_options_table);
                for (let devAcc of devAccs) {
                    for  (let devAccOpt of devAccOptions) {
                        if (devAcc.brkAccDropdownID == devAccOpt.brkAccDropdownID) {
                            brkAccData.push({
                                brkAccID: devAcc.brkAccID,
                                brkAccDropdownID: devAcc.brkAccDropdownID,
                                name: devAccOpt.brkAccName,
                                opt: devAccOpt.brkAccOpt,
                                devID: devAcc.devID
                            });
                        }
                    }
                }
            }

        })
        .then(async function() {
            const layoutDropdowns = await querySql("SELECT * FROM " + database + "." + dbConfig.layout_paramTypes_table);
            const brkAccDropdowns = await querySql("SELECT * FROM " + database + "." + dbConfig.brkAcc_options_table);
            return {layoutDropdowns, brkAccDropdowns}
        })
        .then(async function({layoutDropdowns, brkAccDropdowns}) {
            for (let dropdown of layoutDropdowns) {
                layoutDropdownData.push({
                    type: dropdown.dropdownType,
                    value: dropdown.dropdownValue
                });
            }
            let tempBrkAccDropdownData = [];
            for (let dropdown of brkAccDropdowns) {
                tempBrkAccDropdownData.push({
                    id: dropdown.brkAccDropdownID,
                    type: dropdown.brkAcc,
                    name: dropdown.brkAccName,
                    value: dropdown.brkAccOpt
                });
            }

            for (let item of tempBrkAccDropdownData) {
                if (brkAccDropdownData.filter(e => e.type === item.type).length > 0) {
                    brkAccDropdownData.filter(e => e.type === item.type)[0].value.push(item.value);
                    brkAccDropdownData.filter(e => e.type === item.type)[0].id.push(item.brkAccDropdownID)
                } else {
                    brkAccDropdownData.push({
                        id: [item.id],
                        type: item.type,
                        name: item.name,
                        value: [item.value]
                    })
                }
            }
            return null
        })
        .then(async function() {
            if (layoutData.length != 0) {
                const sections = await querySql("SELECT * FROM " + database + "." + dbConfig.submittal_sections_table+ " WHERE layoutID = ?", layoutData[0].layoutID);
                for (let section of sections) {
                    sectionData.push({
                        secID: section.secID,
                        layoutID: section.layoutID,
                        sectionNum: section.sectionNum,
                        compType: section.compType,
                        controlAsmID: section.controlAsmID,
                        secType: section.secType,
                        brkType: section.brkType,
                        secAmp: section.secAmp,
                        secPoles: section.secPoles,
                        secHeight: section.secHeight,
                        secWidth: section.secWidth,
                        secDepth: section.secDepth
                    })
                }
            }
            return null
        })
        .then(async function() {
            const secTypes = await querySql("SELECT * FROM " + database + "." + dbConfig.secType_table);
            for (let secType of secTypes) {
                sectionTypeData.push({
                    secType: secType.type
                });
            }
            return null
        })
        .then(async function() {
            const brkTypes = await querySql("SELECT * FROM " + database + "." + dbConfig.brkType_table);
            for (let brkType of brkTypes) {
                brkTypeData.push({
                    brkType: brkType.type
                })
            }
            return null
        })
        .then(async function() {
            const layoutParamRestrictions = await querySql("SELECT * FROM " + database + "." + dbConfig.layout_paramType_restrictions);
            for (let restriction of layoutParamRestrictions) {
                restrictionData.push({
                    type: restriction.dropdownType,
                    value: restriction.dropdownValue,
                    restrictions: JSON.parse(restriction.dropdownRestrictions)
                });
            }
        })
        .then(async function() {
            for (let section of sectionData) {
                const pbRows = await querySql("SELECT * FROM " + database + "." + dbConfig.submittal_panel_breakers + " WHERE secID = ?", section.secID);
                if (pbRows.length != 0) {
                    for (let row of pbRows) {
                        pbRowData.push({
                            secID: section.secID,
                            secNum: section.sectionNum,
                            devID: row.devID,
                            panelRow: row.panelRow,
                            configuration: row.configuration,
                            mounting: row.mounting,
                            frame: row.frame
                        });
                    }
                }
            }
            return null
        })
        .then(async function() {
            const breakerDropdownOptions = await querySql("SELECT * FROM " + database + "." + dbConfig.breakerDropdown_options_table);
            brkDropdownOpts_NW = breakerDropdownOptions.filter(e => e.platform == 'SQUARE D MASTERPACT NW');
            brkDropdownOpts_Emax2 = breakerDropdownOptions.filter(e => e.platform == 'ABB EMAX2');
            brkDropdownOpts_Powerpact = breakerDropdownOptions.filter(e => e.platform == 'SQUARE D POWERPACT');
            brkDropdownOpts_Tmax = breakerDropdownOptions.filter(e => e.platform == 'ABB TMAX');
        })
        .then(() => {
            res.locals = {title: 'Submittal'};
            res.render('Submittal/searchSubmittal', {
                message: null,
                subData: subData,
                revData: revData,
                creoData: creoData,
                layoutData: layoutData,
                sectionData: sectionData,
                sectionType: sectionTypeData,
                brkType: brkTypeData,
                layoutDropdownData: layoutDropdownData,
                brkAccDropdownData: brkAccDropdownData,
                layoutItemData: [],
                userItemData: [],
                comItemData: [],
                layoutControlData: [],
                controlAsmData: [],
                panelboardData: [],
                deviceData: deviceData,
                brkAccData: brkAccData,
                brkAccDropdown: [],
                restrictionData: restrictionData,
                pbRowData: pbRowData,
                brkDropdownOpts_NW: brkDropdownOpts_NW,
                brkDropdownOpts_Emax2: brkDropdownOpts_Emax2,
                brkDropdownOpts_Powerpact: brkDropdownOpts_Powerpact,
                brkDropdownOpts_Tmax: brkDropdownOpts_Tmax,
                currentSlide: 1
            })
        })
        .catch(err => {
            console.log(err);
        })
};






