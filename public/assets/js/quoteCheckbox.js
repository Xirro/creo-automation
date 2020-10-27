function onlyOneA(checkbox) {
    var checkboxes = document.getElementsByName('compA')
    checkboxes.forEach((item) => {
        if (item !== checkbox) item.checked = false
    })
}
function onlyOneB(checkbox) {
    var checkboxes = document.getElementsByName('compB')
    checkboxes.forEach((item) => {
        if (item !== checkbox) item.checked = false
    })
}
function onlyOneC(checkbox) {
    var checkboxes = document.getElementsByName('compC')
    checkboxes.forEach((item) => {
        if (item !== checkbox) item.checked = false
    })
}
function onlyOneD(checkbox) {
    var checkboxes = document.getElementsByName('compD')
    checkboxes.forEach((item) => {
        if (item !== checkbox) item.checked = false
    })
}
function flyingOrDriving(checkbox) {
    var checkboxes = document.getElementsByName('flyOrDrive');
    checkboxes.forEach((item) => {
        if (item !== checkbox){
            item.checked = false
            if((item.value).toString() == 'fly'){
                $('#drivingDiv').show();
                $('#flyingDiv').hide();
            }else{
                $('#flyingDiv').show();
                $('#drivingDiv').hide();
            }
        }
    })
}
/*function editFlyingOrDriving(checkbox) {

        var checkboxes = document.getElementsByName('editFlyOrDrive');
    console.log(checkbox.id);
        var currentSlide = $('#carouselExampleIndicators div.active').index() + 1;
        checkboxes.forEach((item) => {
            if (item.id != checkbox.id) {
                console.log(item.id);

                item.removeAttribute('checked');
            }
            if (item.id.split('-')[1] == currentSlide) {
                var editDrivingDivId = "\'#editDrivingDiv-" + item.id.split('-')[1] + "\'";
                var editFlyingDivId = "\'#editFlyingDiv-" + item.id.split('-')[1] + "\'";

                if ((item.value).toString() == 'drive') {
                    console.log('test');
                    $(editFlyingDivId).hide();
                    $(editDrivingDivId).show();

                } else {
                    console.log('test2');
                    $(editDrivingDivId).hide();
                    $(editFlyingDivId).show();
                }
            }
        });
}*/
function editFlyingOrDriving(checkbox) {
    var currentSlide = $('#carouselExampleIndicators div.active').index() + 1;
    var checkboxes = document.getElementsByName('editFlyOrDrive');

    checkboxes.forEach((item) => {
        if(item.id.split('-')[1] == currentSlide.toString()) {
            if (item !== checkbox) {
                item.checked = false;

                var drivingDiv = 'editDrivingDiv-' + currentSlide;
                var flyingDiv = 'editFlyingDiv-' + currentSlide;

                if (item.id.split('-')[0].toString() == 'fly') {
                    console.log('test');
                    document.getElementById(flyingDiv).style.display = "none";
                    document.getElementById(drivingDiv).style.display = "flex";
                } else {
                    console.log('test2');
                    document.getElementById(flyingDiv).style.display = "flex";
                    document.getElementById(drivingDiv).style.display = "none";
                }
            }
        }
    });
}
//Add Freight
function typeOfTruck(checkbox) {
    var checkboxes = document.getElementsByName('truckType');
    checkboxes.forEach((item) => {
        if (item !== checkbox) item.checked = false
    })
}
function freightDestination(checkbox) {
    var checkboxes = document.getElementsByName('destinationType');
    checkboxes.forEach((item) => {
        if (item !== checkbox)item.checked = false
    })
}
//Edit Freight
function editTypeOfTruck(checkbox) {
    var checkboxes = document.getElementsByName('editTruckType');
    checkboxes.forEach((item) => {
        if (item !== checkbox) {
            item.checked = false
        }
    })
}
function editFreightDestination(checkbox) {
    var checkboxes = document.getElementsByName('editDestinationType');
    checkboxes.forEach((item) => {
        if (item !== checkbox) {
            item.checked = false
        }
    })
}




function devMfg(selectObj) {
    let mfg = selectObj.value;
    let brkAccDropdown = document.getElementsByName('brkAccDropdownArr');
    for(let row of brkAccDropdown){
        if(mfg.includes(row.value)){
            document.getElementById(row.value).style.display = 'block';
        } else {
            document.getElementById(row.value).style.display = 'none';
            for(let el of document.getElementById(row.value).getElementsByTagName('li')){
                el.children[0].checked = false;

                for(let el2 of el.getElementsByTagName('li')){
                    el2.children[0].checked = false;
                }
            }
        }
    }
}

function accBrk(checkbox) {
    if(checkbox.checked == true)
        document.getElementById(checkbox.id + 'Opt').style.display = "table-row";
    else {
        document.getElementById(checkbox.id + 'Opt').style.display = "none";
        for(let el of document.getElementById(checkbox.id + 'Opt').getElementsByTagName('li')){
            if (el.children[1].checked == true) {
                el.children[1].checked = false;
                el.children[0].value = '0';
            }
        }
    }
}

function accBrkEdit(checkbox) {
    if (checkbox.checked == true)
        document.getElementById(checkbox.id + 'Opt_Edit').style.display = "block";
    else {
        document.getElementById(checkbox.id + 'Opt_Edit').style.display = "none";
        for (let el of document.getElementById(checkbox.id + 'Opt_Edit').getElementsByTagName('li')) {
            if (el.children[1].checked == true) {
                el.children[1].checked = false;
                el.children[0].value = '0';
            }
        }
    }
}

function showComp(secNum){
    let element = document.getElementById('compA' + secNum);
    let event = new Event('change');
    element.dispatchEvent(event);

    let element2 = document.getElementById('compB' + secNum);
    let event2 = new Event('change');
    element2.dispatchEvent(event2);

    let element3 = document.getElementById('compC' + secNum);
    let event3 = new Event('change');
    element3.dispatchEvent(event3);

    let element4 = document.getElementById('compD' + secNum);
    let event4 = new Event('change');
    element4.dispatchEvent(event4);
}

function getComp(comp){
    $(".modal-header #getComp").val( comp );
}

let breakerType = '';
function getBreakerType(breakerSelect) {
    breakerType =  breakerSelect.value;
}

let platform = '';
function getBreakerPlatform(platformSelect) {
    platform = platformSelect.value;
    let selectNameArray = ['devUL', 'devMount', 'rearAdaptType', 'devOperation', 'devPoles', 'devMaxVolt', 'devKAIC', 'devCtrlVolt', 'devFrameSet', 'devSensorSet', 'devLevel', 'devTripParam', 'devTripUnit'];
    if (platform == 'SQUARE D MASTERPACT NW') {
        for (let selectName of selectNameArray) {
            let select = document.getElementsByName(selectName);
            let selectOpts = select[0].children;
            for (let opt of selectOpts) {
                opt.hidden = !(opt.id == 'NW' || opt.id == 'NONE');
            }
        }
    } else if (platform == 'SQUARE D POWERPACT') {
        for (let selectName of selectNameArray) {
            let select = document.getElementsByName(selectName);
            let selectOpts = select[0].children;
            for (let opt of selectOpts) {
                opt.hidden = !(opt.id == 'POWERPACT' || opt.id == 'NONE');
            }
        }

    } else if (platform == 'ABB EMAX2') {
        for (let selectName of selectNameArray) {
            let select = document.getElementsByName(selectName);
            let selectOpts = select[0].children;
            for (let opt of selectOpts) {
                opt.hidden = !(opt.id == 'EMAX2' || opt.id == 'NONE');
            }
        }
    } else if (platform == 'ABB TMAX') {
        for (let selectName of selectNameArray) {
            let select = document.getElementsByName(selectName);
            let selectOpts = select[0].children;
            for (let opt of selectOpts) {
                opt.hidden = !(opt.id == 'TMAX' || opt.id == 'NONE');
            }
        }
    }
}

let editPlatform = '';
function setBreakerPlatformInitial(currentBrk) {
    let iccbPlatform = document.getElementById('iccbPlatform-'+currentBrk.toString());
    let iccbOpts = iccbPlatform.children;
    let mccbPlatform = document.getElementById('mccbPlatform-'+currentBrk.toString());
    let mccbOpts = mccbPlatform.children;
    let vcbPlatform = document.getElementById('vcbPlatform-'+currentBrk.toString());
    let vcbOpts = vcbPlatform.children;
    for (let opt of iccbOpts) {
        if (opt.selected == true) {
            if (opt.value.length != 0) {
                editPlatform = opt.value;
            }
        }
    }
    for (let opt of mccbOpts) {
        if (opt.selected == true) {
            if (opt.value.length != 0) {
                editPlatform = opt.value;
            }
        }
    }
    for (let opt of vcbOpts) {
        if (opt.selected == true) {
            if (opt.value.length != 0) {
                editPlatform = opt.value;
            }
        }
    }

    let selectNameArray = ['devUL', 'devMount', 'rearAdaptType', 'devOperation', 'devPoles', 'devMaxVolt', 'devKAIC', 'devCtrlVolt', 'devFrameSet', 'devSensorSet', 'devLevel', 'devTripParam', 'devTripUnit'];
    if (editPlatform == 'SQUARE D MASTERPACT NW') {
        for (let selectName of selectNameArray) {
            let select = document.getElementById(selectName+"-"+currentBrk);
            let selectOpts = select.children;
            for (let opt of selectOpts) {
                opt.hidden = !(opt.id == 'NW' || opt.id == 'NONE');
            }
        }
    } else if (platform == 'SQUARE D POWERPACT') {
        for (let selectName of selectNameArray) {
            let select = document.getElementById(selectName+"-"+currentBrk);
            let selectOpts = select.children;
            for (let opt of selectOpts) {
                opt.hidden = !(opt.id == 'POWERPACT' || opt.id == 'NONE');
            }
        }

    } else if (platform == 'ABB EMAX2') {
        for (let selectName of selectNameArray) {
            let select = document.getElementById(selectName+"-"+currentBrk);
            let selectOpts = select.children;
            for (let opt of selectOpts) {
                opt.hidden = !(opt.id == 'EMAX2' || opt.id == 'NONE');
            }
        }
    } else if (platform == 'ABB TMAX') {
        for (let selectName of selectNameArray) {
            let select = document.getElementById(selectName+"-"+currentBrk);
            let selectOpts = select.children;
            for (let opt of selectOpts) {
                opt.hidden = !(opt.id == 'TMAX' || opt.id == 'NONE');
            }
        }
    }
}

function getBreakerPlatformEdit(platformSelect) {
    let currentBrk = platformSelect.id.split('-')[1];
    editPlatform = platformSelect.value;
    let selectNameArray = ['devUL', 'devMount', 'rearAdaptType', 'devOperation', 'devPoles', 'devMaxVolt', 'devKAIC', 'devCtrlVolt', 'devFrameSet', 'devSensorSet', 'devLevel', 'devTripParam', 'devTripUnit'];
    if (editPlatform == 'SQUARE D MASTERPACT NW') {
        for (let selectName of selectNameArray) {
            let chosenValue;
            let select = document.getElementById(selectName+"-"+currentBrk);
            let selectOpts = select.children;
            for (let opt of selectOpts) {
                if (opt.selected == true) {
                    chosenValue = opt.value;
                }
                opt.hidden = true;
            }
            for (let opt of selectOpts) {
                opt.hidden = !(opt.id == 'NW' || opt.id == 'NONE');
                if (opt.value == chosenValue) {
                    opt.selected = true;
                }
            }
        }
    } else if (editPlatform == 'SQUARE D POWERPACT') {
        for (let selectName of selectNameArray) {
            let chosenValue;
            let select = document.getElementById(selectName+"-"+currentBrk);
            let selectOpts = select.children;
            for (let opt of selectOpts) {
                if (opt.selected == true) {
                    chosenValue = opt.value;
                }
                opt.hidden = true;
            }
            for (let opt of selectOpts) {
                opt.hidden = !(opt.id == 'POWERPACT' || opt.id == 'NONE');
                if (opt.value == chosenValue) {
                    opt.selected = true;
                }
            }
        }

    } else if (editPlatform == 'ABB EMAX2') {
        for (let selectName of selectNameArray) {
            let chosenValue;
            let select = document.getElementById(selectName+"-"+currentBrk);
            let selectOpts = select.children;
            for (let opt of selectOpts) {
                if (opt.selected == true) {
                    chosenValue = opt.value;
                }
                opt.hidden = true;
            }
            for (let opt of selectOpts) {
                opt.hidden = !(opt.id == 'EMAX2' || opt.id == 'NONE');
                if (opt.value == chosenValue) {
                    opt.selected = true;
                }
            }
        }
    } else if (editPlatform == 'ABB TMAX') {
        for (let selectName of selectNameArray) {
            let chosenValue;
            let select = document.getElementById(selectName+"-"+currentBrk);
            let selectOpts = select.children;
            for (let opt of selectOpts) {
                if (opt.selected == true) {
                    chosenValue = opt.value;
                }
                opt.hidden = true;
            }
            for (let opt of selectOpts) {
                opt.hidden = !(opt.id == 'TMAX' || opt.id == 'NONE');
                if (opt.value == chosenValue) {
                    opt.selected = true;
                }
            }
        }
    }
}

function showPB(checkbox){
    let checkboxes = document.getElementsByName('pbCheck');
    let noChecks = true;
    let secNum = checkbox.id.split('_')[1];
    checkboxes.forEach((item) => {
        if (item !== checkbox){
            item.checked = false
        }

        if(item.checked == true){
            noChecks = false;
            document.getElementById('pb' + secNum).style.display = "flex";
            document.getElementById('configurePB' + secNum).style.display = "flex";
            document.getElementById('pbButtons_' + secNum + "_1" ).style.display = "flex";
            document.getElementById('pbButtons_' + secNum + "_2" ).style.display = "flex";
        } else {
            document.getElementById('pbBrk' + secNum).style.display = "none";
            document.getElementById('notPB' + secNum).style.display = "none";
            document.getElementById('pbBrkButtons_' + secNum).style.display = "none";

        }
    });

    if(noChecks){
        document.getElementById('notPB' + secNum).style.display = "flex";
        document.getElementById('pb' + secNum).style.display = "none";
        document.getElementById('configurePB' + secNum).style.display = "none";
        document.getElementById('pbButtons_' + secNum + "_1").style.display = "none";
        document.getElementById('pbButtons_' + secNum + "_2").style.display = "none";
    }
}

function showPBbrk(checkbox){
    var checkboxes = document.getElementsByName('pbCheck');
    let noChecks = true;
    let secNum = checkbox.id.split('_')[1];
    checkboxes.forEach((item) => {
        if (item !== checkbox){
            item.checked = false
        }

        if(item.checked == true){
            noChecks = false;
            document.getElementById('pbBrk' + secNum).style.display = "flex";
            document.getElementById('configurePB' + secNum).style.display = "flex";
            document.getElementById('pbBrkButtons_' + secNum).style.display = "flex";
        } else {
            document.getElementById('pb' + secNum).style.display = "none";
            document.getElementById('notPB' + secNum).style.display = "none";
            document.getElementById('pbButtons_' + secNum + "_1").style.display = "none";
            document.getElementById('pbButtons_' + secNum + "_2").style.display = "none";
        }
    });

    if(noChecks){
        document.getElementById('notPB' + secNum).style.display = "flex";
        document.getElementById('pbBrk' + secNum).style.display = "none";
        document.getElementById('configurePB' + secNum).style.display = "none";
        document.getElementById('pbBrkButtons_' + secNum).style.display = "none";
    }
}

function checkForPB(secNum, compType){
    if(compType.A == 'panelboard' && compType.D != 'brk'){
        document.getElementById('pb' + secNum).style.display = "flex";
        document.getElementById('configurePB' + secNum).style.display = "flex";
        document.getElementById('pbBrk' + secNum).style.display = "none";
        document.getElementById('notPB' + secNum).style.display = "none";
        document.getElementById('panelboard_' + secNum).checked = true;
        document.getElementById('pbButtons_' + secNum + "_1").style.display='flex';
        document.getElementById('pbButtons_' + secNum + "_2").style.display='flex';

    } else if(compType.A == 'panelboard' && compType.D == 'brk'){
        document.getElementById('pbBrk' + secNum).style.display = "flex";
        document.getElementById('configurePB' + secNum).style.display = "flex";
        document.getElementById('pb' + secNum).style.display = "none";
        document.getElementById('notPB' + secNum).style.display = "none";
        document.getElementById('panelboardbrk_' + secNum).checked = true;
        document.getElementById('pbBrkButtons_' + secNum).style.display='flex';
    }
}

let count = 0;
function addDualRowNew(secNum) {
    count += 1;

    if (document.getElementById("totalRows_"+secNum)) {
        document.getElementById("totalRows_"+secNum).value = count;
    } else {
        let input = document.createElement("input");
        input.name = "totalRows_"+secNum;
        input.id = "totalRows_"+secNum;
        input.value = count;
        input.hidden = true;
        document.getElementById('pbMain' + secNum).appendChild(input);
    }

    let rowDiv = document.createElement("div");
    rowDiv.className = "row justify-content-center";
    rowDiv.id = "pbRow"+secNum+"_"+count;

    let div1 = document.createElement("div");
    div1.className = "col-sm-4";
    div1.style.backgroundColor = "#e6e1e1";
    div1.style.border = "2px solid lightslategrey";
    div1.style.borderRadius = "3px";
    div1.id = "pbRow"+secNum+"_"+count+"_brkL";

    let div2 = document.createElement("div");
    div2.className = "col-sm-4";
    div2.style.backgroundColor = "#e6e1e1";
    div2.style.border = "2px solid lightslategrey";
    div2.style.borderRadius = "3px";
    div2.id = "pbRow"+secNum+"_"+count+"_brkR";


    let selectL = document.createElement("select");
    selectL.id = "pb"+secNum+"_row"+count+"_frameL";
    selectL.name = "row"+count+"_frameL";
    selectL.class = "form-control";

    let selectR = document.createElement("select");
    selectR.id = "pb"+secNum+"_row"+count+"_frameR";
    selectR.name = "row"+count+"_frameR";
    selectR.class = "form-control";


    let input2 = document.createElement("input");
    input2.name = "rowType_"+count;
    input2.id = "rowType_"+count;
    input2.value = "DUAL";
    input2.hidden = true;
    document.getElementById('pbMain' + secNum).appendChild(input2);


    document.getElementById('pbMain' + secNum).appendChild(rowDiv);
    document.getElementById("pbRow"+secNum+"_"+count).appendChild(div1);
    document.getElementById("pbRow"+secNum+"_"+count).appendChild(div2);
    document.getElementById("pbRow"+secNum+"_"+count+"_brkL").appendChild(selectL);
    document.getElementById("pbRow"+secNum+"_"+count+"_brkR").appendChild(selectR);

    let selectList;
    if (breakerType == 'POWERPACT (SQUARE D)') {
        selectList = ["H/J", "L"];
    } else if (breakerType == 'TMAX (ABB)') {
        selectList = ["XT2", "XT4", "XT5"];
    }

    for (let i = 0; i < selectList.length; i++) {
        let option = document.createElement("option");
        option.value = selectList[i];
        option.text = selectList[i];
        document.getElementById("pb"+secNum+"_row"+count+"_frameL").appendChild(option);
    }

    for (let i = 0; i < selectList.length; i++) {
        let option = document.createElement("option");
        option.value = selectList[i];
        option.text = selectList[i];
        document.getElementById("pb"+secNum+"_row"+count+"_frameR").appendChild(option);
    }
}

function addSingleRowCenterLeftNew(secNum) {

    count += 1;

    if (document.getElementById("totalRows_"+secNum)) {
        document.getElementById("totalRows_"+secNum).value = count;
    } else {
        let input = document.createElement("input");
        input.name = "totalRows_"+secNum;
        input.id = "totalRows_"+secNum;
        input.value = count;
        input.hidden = true;
        document.getElementById('pbMain' + secNum).appendChild(input);
    }

    let rowDiv = document.createElement("div");
    rowDiv.className = "row justify-content-center";
    rowDiv.id = "pbRow"+secNum+"_"+count;


    let div = document.createElement("div");
    div.className = "col-sm-4";
    div.style.backgroundColor = "#e6e1e1";
    div.style.border = "2px solid lightslategrey";
    div.style.borderRadius = "3px";
    div.id = "pbRow"+secNum+"_"+count+"_brkCL";


    let select = document.createElement("select");
    select.id = "pb"+secNum+"_row"+count+"_frameCL";
    select.name = "row"+count+"_frameCL";
    select.class = "form-control";

    let input2 = document.createElement("input");
    input2.name = "rowType_"+count;
    input2.id = "rowType_"+count;
    input2.value = "SINGLE";
    input2.hidden = true;
    document.getElementById('pbMain' + secNum).appendChild(input2);


    document.getElementById('pbMain' + secNum).appendChild(rowDiv);
    document.getElementById("pbRow"+secNum+"_"+count).appendChild(div);
    document.getElementById("pbRow"+secNum+"_"+count+"_brkCL").appendChild(select);


    let selectList;
    if (breakerType == 'POWERPACT (SQUARE D)') {
        selectList = ["L", "P"];
    } else if (breakerType == 'TMAX (ABB)') {
        selectList = ["XT5", "XT6", "XT7"];
    }

    for (let i = 0; i < selectList.length; i++) {
        let option = document.createElement("option");
        option.value = selectList[i];
        option.text = selectList[i];
        document.getElementById("pb"+secNum+"_row"+count+"_frameCL").appendChild(option);
    }

}

function addSingleRowCenterRightNew(secNum) {
    count += 1;

    if (document.getElementById("totalRows_"+secNum)) {
        document.getElementById("totalRows_"+secNum).value = count;
    } else {
        let input = document.createElement("input");
        input.name = "totalRows_"+secNum;
        input.id = "totalRows_"+secNum;
        input.value = count;
        input.hidden = true;
        document.getElementById('pbMain' + secNum).appendChild(input);
    }

    let rowDiv = document.createElement("div");
    rowDiv.className = "row justify-content-center";
    rowDiv.id = "pbRow"+secNum+"_"+count;


    let div = document.createElement("div");
    div.className = "col-sm-4";
    div.style.backgroundColor = "#e6e1e1";
    div.style.border = "2px solid lightslategrey";
    div.style.borderRadius = "3px";
    div.id = "pbRow"+secNum+"_"+count+"_brkCR";


    let select = document.createElement("select");
    select.id = "pb"+secNum+"_row"+count+"_frameCR";
    select.name = "row"+count+"_frameCR";
    select.class = "form-control";

    let input2 = document.createElement("input");
    input2.name = "rowType_"+count;
    input2.id = "rowType_"+count;
    input2.value = "SINGLE";
    input2.hidden = true;
    document.getElementById('pbMain' + secNum).appendChild(input2);


    document.getElementById('pbMain' + secNum).appendChild(rowDiv);
    document.getElementById("pbRow"+secNum+"_"+count).appendChild(div);
    document.getElementById("pbRow"+secNum+"_"+count+"_brkCR").appendChild(select);

    let selectList;
    if (breakerType == 'POWERPACT (SQUARE D)') {
        selectList = ["L", "P"];
    } else if (breakerType == 'TMAX (ABB)') {
        selectList = ["XT5", "XT6", "XT7"];
    }

    for (let i = 0; i < selectList.length; i++) {
        let option = document.createElement("option");
        option.value = selectList[i];
        option.text = selectList[i];
        document.getElementById("pb"+secNum+"_row"+count+"_frameCR").appendChild(option);
    }
}

function addSingleLeftRowNew(secNum) {
    count += 1;

    if (document.getElementById("totalRows_"+secNum)) {
        document.getElementById("totalRows_"+secNum).value = count;
    } else {
        let input = document.createElement("input");
        input.name = "totalRows_"+secNum;
        input.id = "totalRows_"+secNum;
        input.value = count;
        input.hidden = true;
        document.getElementById('pbMain' + secNum).appendChild(input);
    }

    let rowDiv = document.createElement("div");
    rowDiv.className = "row justify-content-center";
    rowDiv.id = "pbRow"+secNum+"_"+count;

    let div1 = document.createElement("div");
    div1.className = "col-sm-4";
    div1.style.backgroundColor = "#e6e1e1";
    div1.style.border = "2px solid lightslategrey";
    div1.style.borderRadius = "3px";
    div1.id = "pbRow"+secNum+"_"+count+"_brkL";

    let div2 = document.createElement("div");
    div2.className = "col-sm-4";
    div2.style.backgroundColor = "#e6e1e1";
    div2.style.border = "2px solid lightslategrey";
    div2.style.borderRadius = "3px";


    let selectL = document.createElement("select");
    selectL.id = "pb"+secNum+"_row"+count+"_frameL";
    selectL.name = "row"+count+"_frameL";
    selectL.class = "form-control";


    let input2 = document.createElement("input");
    input2.name = "rowType_"+count;
    input2.id = "rowType_"+count;
    input2.value = "SINGLE";
    input2.hidden = true;
    document.getElementById('pbMain' + secNum).appendChild(input2);

    document.getElementById('pbMain' + secNum).appendChild(rowDiv);
    document.getElementById("pbRow"+secNum+"_"+count).appendChild(div1);
    document.getElementById("pbRow"+secNum+"_"+count).appendChild(div2);
    document.getElementById("pbRow"+secNum+"_"+count+"_brkL").appendChild(selectL);

    let selectList;
    if (breakerType == 'POWERPACT (SQUARE D)') {
        selectList = ["H/J", "L"];
    } else if (breakerType == 'TMAX (ABB)') {
        selectList = ["XT2", "XT4", "XT5"];
    }


    for (let i = 0; i < selectList.length; i++) {
        let option = document.createElement("option");
        option.value = selectList[i];
        option.text = selectList[i];
        document.getElementById("pb"+secNum+"_row"+count+"_frameL").appendChild(option);
    }

}

function addSingleRightRowNew(secNum) {
    count += 1;

    if (document.getElementById("totalRows_"+secNum)) {
        document.getElementById("totalRows_"+secNum).value = count;
    } else {
        let input = document.createElement("input");
        input.name = "totalRows_"+secNum;
        input.id = "totalRows_"+secNum;
        input.value = count;
        input.hidden = true;
        document.getElementById('pbMain' + secNum).appendChild(input);
    }

    let rowDiv = document.createElement("div");
    rowDiv.className = "row justify-content-center";
    rowDiv.id = "pbRow"+secNum+"_"+count;

    let div1 = document.createElement("div");
    div1.className = "col-sm-4";
    div1.style.backgroundColor = "#e6e1e1";
    div1.style.border = "2px solid lightslategrey";
    div1.style.borderRadius = "3px";


    let div2 = document.createElement("div");
    div2.className = "col-sm-4";
    div2.style.backgroundColor = "#e6e1e1";
    div2.style.border = "2px solid lightslategrey";
    div2.style.borderRadius = "3px";
    div2.id = "pbRow"+secNum+"_"+count+"_brkR";


    let selectR = document.createElement("select");
    selectR.id = "pb"+secNum+"_row"+count+"_frameR";
    selectR.name = "row"+count+"_frameR";
    selectR.class = "form-control";

    let input2 = document.createElement("input");
    input2.name = "rowType_"+count;
    input2.id = "rowType_"+count;
    input2.value = "SINGLE";
    input2.hidden = true;
    document.getElementById('pbMain' + secNum).appendChild(input2);

    document.getElementById('pbMain' + secNum).appendChild(rowDiv);
    document.getElementById("pbRow"+secNum+"_"+count).appendChild(div1);
    document.getElementById("pbRow"+secNum+"_"+count).appendChild(div2);
    document.getElementById("pbRow"+secNum+"_"+count+"_brkR").appendChild(selectR);


    let selectList;
    if (breakerType == 'POWERPACT (SQUARE D)') {
        selectList = ["H/J", "L"];
    } else if (breakerType == 'TMAX (ABB)') {
        selectList = ["XT2", "XT4", "XT5"];
    }

    for (let i = 0; i < selectList.length; i++) {
        let option = document.createElement("option");
        option.value = selectList[i];
        option.text = selectList[i];
        document.getElementById("pb"+secNum+"_row"+count+"_frameR").appendChild(option);
    }
}

function removeLastRowNew(secNum) {
    count -= 1;

    if (document.getElementById("totalRows_"+secNum)) {
        document.getElementById("totalRows_"+secNum).value = count;
    }
    document.getElementById("pbRow"+secNum+"_"+count).remove();

}


let tempCount = 0;
function addDualRowExisting(secNum, currentTotalRows) {
    tempCount += 1;
    let count = tempCount + parseInt(currentTotalRows);
    if (document.getElementById("totalRows_"+secNum)) {
        document.getElementById("totalRows_"+secNum).value = count;
    }

    let rowDiv = document.createElement("div");
    rowDiv.className = "row justify-content-center";
    rowDiv.id = "pbRow"+secNum+"_"+count;

    let div1 = document.createElement("div");
    div1.className = "col-sm-4";
    div1.style.backgroundColor = "#e6e1e1";
    div1.style.border = "2px solid lightslategrey";
    div1.style.borderRadius = "3px";
    div1.id = "pbRow"+secNum+"_"+count+"_brkL";

    let div2 = document.createElement("div");
    div2.className = "col-sm-4";
    div2.style.backgroundColor = "#e6e1e1";
    div2.style.border = "2px solid lightslategrey";
    div2.style.borderRadius = "3px";
    div2.id = "pbRow"+secNum+"_"+count+"_brkR";


    let selectL = document.createElement("select");
    selectL.id = "pb"+secNum+"_row"+count+"_frameL";
    selectL.name = "row"+count+"_frameL";
    selectL.class = "form-control";

    let selectR = document.createElement("select");
    selectR.id = "pb"+secNum+"_row"+count+"_frameR";
    selectR.name = "row"+count+"_frameR";
    selectR.class = "form-control";


    let input2 = document.createElement("input");
    input2.name = "rowType_"+count;
    input2.id = "rowType_"+count;
    input2.value = "DUAL";
    input2.hidden = true;
    document.getElementById('pbMain' + secNum).appendChild(input2);


    document.getElementById('pbMain' + secNum).appendChild(rowDiv);
    document.getElementById("pbRow"+secNum+"_"+count).appendChild(div1);
    document.getElementById("pbRow"+secNum+"_"+count).appendChild(div2);
    document.getElementById("pbRow"+secNum+"_"+count+"_brkL").appendChild(selectL);
    document.getElementById("pbRow"+secNum+"_"+count+"_brkR").appendChild(selectR);

    let selectList;
    if (breakerType == '') {
        document.getElementsByName("brkType").change();
    }
    if (breakerType == 'POWERPACT (SQUARE D)') {
        selectList = ["H/J", "L"];
    } else if (breakerType == 'TMAX (ABB)') {
        selectList = ["XT2", "XT4", "XT5"];
    }

    for (let i = 0; i < selectList.length; i++) {
        let option = document.createElement("option");
        option.value = selectList[i];
        option.text = selectList[i];
        document.getElementById("pb"+secNum+"_row"+count+"_frameL").appendChild(option);
    }

    for (let i = 0; i < selectList.length; i++) {
        let option = document.createElement("option");
        option.value = selectList[i];
        option.text = selectList[i];
        document.getElementById("pb"+secNum+"_row"+count+"_frameR").appendChild(option);
    }
}

function addSingleRowCenterLeftExisting(secNum, currentTotalRows) {
    tempCount += 1;
    let count = tempCount + parseInt(currentTotalRows);
    if (document.getElementById("totalRows_"+secNum)) {
        document.getElementById("totalRows_"+secNum).value = count;
    }

    let rowDiv = document.createElement("div");
    rowDiv.className = "row justify-content-center";
    rowDiv.id = "pbRow"+secNum+"_"+count;


    let div = document.createElement("div");
    div.className = "col-sm-4";
    div.style.backgroundColor = "#e6e1e1";
    div.style.border = "2px solid lightslategrey";
    div.style.borderRadius = "3px";
    div.id = "pbRow"+secNum+"_"+count+"_brkCL";


    let select = document.createElement("select");
    select.id = "pb"+secNum+"_row"+count+"_frameCL";
    select.name = "row"+count+"_frameCL";
    select.class = "form-control";

    let input2 = document.createElement("input");
    input2.name = "rowType_"+count;
    input2.id = "rowType_"+count;
    input2.value = "SINGLE";
    input2.hidden = true;
    document.getElementById('pbMain' + secNum).appendChild(input2);


    document.getElementById('pbMain' + secNum).appendChild(rowDiv);
    document.getElementById("pbRow"+secNum+"_"+count).appendChild(div);
    document.getElementById("pbRow"+secNum+"_"+count+"_brkCL").appendChild(select);


    let selectList = ["L", "P"];

    for (let i = 0; i < selectList.length; i++) {
        let option = document.createElement("option");
        option.value = selectList[i];
        option.text = selectList[i];
        document.getElementById("pb"+secNum+"_row"+count+"_frameCL").appendChild(option);
    }
}

function addSingleRowCenterRightExisting(secNum, currentTotalRows) {
    tempCount += 1;
    let count = tempCount + parseInt(currentTotalRows);
    if (document.getElementById("totalRows_"+secNum)) {
        document.getElementById("totalRows_"+secNum).value = count;
    }

    let rowDiv = document.createElement("div");
    rowDiv.className = "row justify-content-center";
    rowDiv.id = "pbRow"+secNum+"_"+count;


    let div = document.createElement("div");
    div.className = "col-sm-4";
    div.style.backgroundColor = "#e6e1e1";
    div.style.border = "2px solid lightslategrey";
    div.style.borderRadius = "3px";
    div.id = "pbRow"+secNum+"_"+count+"_brkCR";


    let select = document.createElement("select");
    select.id = "pb"+secNum+"_row"+count+"_frameCR";
    select.name = "row"+count+"_frameCR";
    select.class = "form-control";

    let input2 = document.createElement("input");
    input2.name = "rowType_"+count;
    input2.id = "rowType_"+count;
    input2.value = "SINGLE";
    input2.hidden = true;
    document.getElementById('pbMain' + secNum).appendChild(input2);


    document.getElementById('pbMain' + secNum).appendChild(rowDiv);
    document.getElementById("pbRow"+secNum+"_"+count).appendChild(div);
    document.getElementById("pbRow"+secNum+"_"+count+"_brkCR").appendChild(select);


    let selectList = ["L", "P"];

    for (let i = 0; i < selectList.length; i++) {
        let option = document.createElement("option");
        option.value = selectList[i];
        option.text = selectList[i];
        document.getElementById("pb"+secNum+"_row"+count+"_frameCR").appendChild(option);
    }
}

function addSingleLeftRowExisting(secNum, currentTotalRows) {
    tempCount += 1;
    let count = tempCount + parseInt(currentTotalRows);
    if (document.getElementById("totalRows_"+secNum)) {
        document.getElementById("totalRows_"+secNum).value = count;
    }

    let rowDiv = document.createElement("div");
    rowDiv.className = "row justify-content-center";
    rowDiv.id = "pbRow"+secNum+"_"+count;

    let div1 = document.createElement("div");
    div1.className = "col-sm-4";
    div1.style.backgroundColor = "#e6e1e1";
    div1.style.border = "2px solid lightslategrey";
    div1.style.borderRadius = "3px";
    div1.id = "pbRow"+secNum+"_"+count+"_brkL";

    let div2 = document.createElement("div");
    div2.className = "col-sm-4";
    div2.style.backgroundColor = "#e6e1e1";
    div2.style.border = "2px solid lightslategrey";
    div2.style.borderRadius = "3px";


    let selectL = document.createElement("select");
    selectL.id = "pb"+secNum+"_row"+count+"_frameL";
    selectL.name = "row"+count+"_frameL";
    selectL.class = "form-control";


    let input2 = document.createElement("input");
    input2.name = "rowType_"+count;
    input2.id = "rowType_"+count;
    input2.value = "SINGLE";
    input2.hidden = true;
    document.getElementById('pbMain' + secNum).appendChild(input2);

    document.getElementById('pbMain' + secNum).appendChild(rowDiv);
    document.getElementById("pbRow"+secNum+"_"+count).appendChild(div1);
    document.getElementById("pbRow"+secNum+"_"+count).appendChild(div2);
    document.getElementById("pbRow"+secNum+"_"+count+"_brkL").appendChild(selectL);

    let selectList = ["H/J", "L"];

    for (let i = 0; i < selectList.length; i++) {
        let option = document.createElement("option");
        option.value = selectList[i];
        option.text = selectList[i];
        document.getElementById("pb"+secNum+"_row"+count+"_frameL").appendChild(option);
    }

}

function addSingleRightRowExisting(secNum, currentTotalRows) {
    tempCount += 1;
    let count = tempCount + parseInt(currentTotalRows);
    if (document.getElementById("totalRows_"+secNum)) {
        document.getElementById("totalRows_"+secNum).value = count;
    }

    let rowDiv = document.createElement("div");
    rowDiv.className = "row justify-content-center";
    rowDiv.id = "pbRow"+secNum+"_"+count;

    let div1 = document.createElement("div");
    div1.className = "col-sm-4";
    div1.style.backgroundColor = "#e6e1e1";
    div1.style.border = "2px solid lightslategrey";
    div1.style.borderRadius = "3px";


    let div2 = document.createElement("div");
    div2.className = "col-sm-4";
    div2.style.backgroundColor = "#e6e1e1";
    div2.style.border = "2px solid lightslategrey";
    div2.style.borderRadius = "3px";
    div2.id = "pbRow"+secNum+"_"+count+"_brkR";


    let selectR = document.createElement("select");
    selectR.id = "pb"+secNum+"_row"+count+"_frameR";
    selectR.name = "row"+count+"_frameR";
    selectR.class = "form-control";

    let input2 = document.createElement("input");
    input2.name = "rowType_"+count;
    input2.id = "rowType_"+count;
    input2.value = "SINGLE";
    input2.hidden = true;
    document.getElementById('pbMain' + secNum).appendChild(input2);

    document.getElementById('pbMain' + secNum).appendChild(rowDiv);
    document.getElementById("pbRow"+secNum+"_"+count).appendChild(div1);
    document.getElementById("pbRow"+secNum+"_"+count).appendChild(div2);
    document.getElementById("pbRow"+secNum+"_"+count+"_brkR").appendChild(selectR);


    let selectList = ["H/J", "L"];

    for (let i = 0; i < selectList.length; i++) {
        let option = document.createElement("option");
        option.value = selectList[i];
        option.text = selectList[i];
        document.getElementById("pb"+secNum+"_row"+count+"_frameR").appendChild(option);
    }

}

function removeLastRowExisting(secNum, currentTotalRows) {
    tempCount -= 1;
    let count = tempCount + parseInt(currentTotalRows);
    if (document.getElementById("totalRows_"+secNum)) {
        document.getElementById("totalRows_"+secNum).value = count;
    }
    document.getElementById("pbRow"+secNum+"_"+(count+1)).remove();
}


