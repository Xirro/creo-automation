let accData = {};
let brkData = {};

function addBrkAccessory(){
    if(document.getElementById('accessoryQty').value != null){
        accData ={
            accQty: document.getElementById('accessoryQty').value,
            accType: document.getElementById('accessoryType').value,
            accMfg: document.getElementById('devMfg').value,
            accDesc: document.getElementById('accessoryDescLimit').value,
            accPN: document.getElementById('accessoryPN').value
        };

        brkData = {
            devDesignation: document.getElementById('devDesLimit').value,
            brkPN: document.getElementById('brkPN').value,
            cradlePN: document.getElementById('cradlePN').value,
            devMfg: document.getElementById('devMfg').value,
            catCode: document.getElementById('devCatCode').value,
            class: document.getElementById('devClassCode').value
        };

    }

    //clear input data
    document.getElementById('accessoryQty').value = null;
    document.getElementById('accessoryType').value = null;
    document.getElementById('accessoryDescLimit').value = null;
    document.getElementById('accessoryPN').value = null;

    mbomBrkAccFormSubmit(accData, brkData);
}


function addBrkAccessoryFromEdit(idDev){

    let form = document.createElement('form');
    form.method = "POST";
    form.action = "../addBreakerAccFromEdit";

    let element2 = document.createElement('input');
    element2.value = idDev;
    element2.name = 'idDev';
    form.appendChild(element2);

    let element3 = document.createElement('input');
    element3.value = document.getElementById('mbomID').value;
    element3.name = 'mbomID';
    form.appendChild(element3);

    let element4 = document.createElement('input');
    element4.value = document.getElementById('jobNum').value;
    element4.name = 'jobNum';
    form.appendChild(element4);

    let element5 = document.createElement('input');
    element5.value = document.getElementById('releaseNum').value;
    element5.name = 'releaseNum';
    form.appendChild(element5);

    let element6 = document.createElement('input');
    element6.value = document.getElementById('jobName').value;
    element6.name = 'jobName';
    form.appendChild(element6);

    let element7 = document.createElement('input');
    element7.value = document.getElementById('customer').value;
    element7.name = 'customer';
    form.appendChild(element7);

    let element8 = document.createElement('input');
    element8.value = document.getElementById('devLayout').value;
    element8.name = 'devLayout';
    form.appendChild(element8);


    let element9  = document.createElement('input');
    element9.value = document.getElementById('accessoryQty').value;
    element9.name = 'accQty';
    form.appendChild(element9);

    let element10  = document.createElement('input');
    element10.value =  document.getElementById('accessoryType').value;
    element10.name = 'accType';
    form.appendChild(element10);


    let element11  = document.createElement('input');
    element11.value = document.getElementById('accessoryDescLimit').value;
    element11.name = 'accDesc';
    form.appendChild(element11);

    let element12  = document.createElement('input');
    element12.value = document.getElementById('accessoryPN').value;
    element12.name = 'accPN';
    form.appendChild(element12);

    let element13  = document.createElement('input');
    element13.value = document.getElementById('editDevDesLimit').value;
    element13.name = 'editDevDesLimit';
    form.appendChild(element13);

    let element14  = document.createElement('input');
    element14.value = document.getElementById('editBrkPN').value;
    element14.name = 'editBrkPN';
    form.appendChild(element14);

    let element15  = document.createElement('input');
    element15.value = document.getElementById('editCradlePN').value;
    element15.name = 'editCradlePN';
    form.appendChild(element15);

    let element16  = document.createElement('input');
    element16.value = document.getElementById('editDevMfg').value;
    element16.name = 'editDevMfg';
    form.appendChild(element16);


    let element17  = document.createElement('input');
    element17.value = document.getElementById('editDevCatCode').value;
    element17.name = 'editDevCatCode';
    form.appendChild(element17);


    let element18 = document.createElement('input');
    element18.value = document.getElementById('editDevClass').value;
    element18.name = 'class';
    form.appendChild(element18);

    console.log(form);


    document.body.appendChild(form);
    form.submit()

}



function editBrkAcc(brkAccID) {
    let form = document.createElement('form');
    form.method = "POST";
    form.action = "../editBreakerAcc";


    let mbomID = document.getElementById('mbomID').value;
    let jobNum = document.getElementById('jobNum').value;
    let releaseNum = document.getElementById('releaseNum').value;

    let element1 = document.createElement('input');
    element1.value = brkAccID;
    element1.name = 'brkAccID';
    form.appendChild(element1);

    let element3 = document.createElement('input');
    element3.value = document.getElementById('editAccQty').value;
    element3.name = 'editAccQty';
    form.appendChild(element3);

    let element4 = document.createElement('input');
    element4.value = document.getElementById('editAccType').value;
    element4.name = 'editAccType';
    form.appendChild(element4);

    let element5 = document.createElement('input');
    element5.value = document.getElementById('editAccDescLimit').value;
    element5.name = 'editAccDescLimit';
    form.appendChild(element5);

    let element6 = document.createElement('input');
    element6.value = document.getElementById('editAccPN').value;
    element6.name = 'editAccPN';
    form.appendChild(element6);

    let element7 = document.createElement('input');
    element7.value = jobNum;
    element7.name = 'jobNum';
    form.appendChild(element7);

    let element8 = document.createElement('input');
    element8.value = releaseNum;
    element8.name = 'releaseNum';
    form.appendChild(element8);

    let element9 = document.createElement('input');
    element9.value = mbomID;
    element9.name = 'mbomID';
    form.appendChild(element9);

    document.body.appendChild(form);
    form.submit()
}

function editBrkAccFromEdit (letiable) {
    // letiable may be either the button element (this) or a brkAccID (number/string)
    var brkAccID = '';
    if (letiable && typeof letiable === 'object' && typeof letiable.getAttribute === 'function') {
        // prefer data-acc-id attribute (set on the button), else fall back to id
        brkAccID = letiable.getAttribute('data-acc-id') || letiable.id || '';
        // if id contains a prefix like 'saveAcc_123', extract the trailing number
        var m = String(brkAccID).match(/(\d+)$/);
        if (m) brkAccID = m[1];
    } else {
        brkAccID = String(letiable || '');
    }

    var form = document.createElement('form');
    form.method = "POST";
    form.action = "../editBreakerAccFromEdit";

    var mbomID = document.getElementById('mbomID').value;
    var jobNum = document.getElementById('jobNum').value;
    var releaseNum = document.getElementById('releaseNum').value;

    var element1 = document.createElement('input');
    element1.value = brkAccID;
    element1.name = 'brkAccID';
    form.appendChild(element1);


    let element2 = document.createElement('input');
    element2.value = document.getElementById('idDev').value;
    element2.name = 'idDev';
    form.appendChild(element2);


    let element3 = document.createElement('input');
    element3.value = mbomID;
    element3.name = 'mbomID';
    form.appendChild(element3);

    let element4 = document.createElement('input');
    element4.value = jobNum;
    element4.name = 'jobNum';
    form.appendChild(element4);

    let element5 = document.createElement('input');
    element5.value = releaseNum;
    element5.name = 'releaseNum';
    form.appendChild(element5);

    let element6 = document.createElement('input');
    element6.value = document.getElementById('jobName').value;
    element6.name = 'jobName';
    form.appendChild(element6);

    let element7 = document.createElement('input');
    element7.value = document.getElementById('customer').value;
    element7.name = 'customer';
    form.appendChild(element7);

    let element8 = document.createElement('input');
    element8.value = document.getElementById('devLayout').value;
    element8.name = 'devLayout';
    form.appendChild(element8);

    let editAccQty = 'editAccQty_'+element1.value.toString();
    let editAccType = 'editAccType_'+element1.value.toString();
    let editAccDescLimit = 'editAccDescLimit_'+element1.value.toString();
    let editAccPN = 'editAccPN_'+element1.value.toString();


    let element9  = document.createElement('input');
    element9.value = document.getElementById(editAccQty).value;
    element9.name = 'editAccQty';
    form.appendChild(element9);

    let element10  = document.createElement('input');
    element10.value =  document.getElementById(editAccType).value;
    element10.name = 'editAccType';
    form.appendChild(element10);


    let element11  = document.createElement('input');
    element11.value = document.getElementById(editAccDescLimit).value;
    element11.name = 'editAccDescLimit';
    form.appendChild(element11);

    let element12  = document.createElement('input');
    element12.value = document.getElementById(editAccPN).value;
    element12.name = 'editAccPN';
    form.appendChild(element12);

    let element13  = document.createElement('input');
    element13.value = document.getElementById('editDevDesLimit').value;
    element13.name = 'editDevDesLimit';
    form.appendChild(element13);

    let element14  = document.createElement('input');
    element14.value = document.getElementById('editBrkPN').value;
    element14.name = 'editBrkPN';
    form.appendChild(element14);

    let element15  = document.createElement('input');
    element15.value = document.getElementById('editCradlePN').value;
    element15.name = 'editCradlePN';
    form.appendChild(element15);

    let element16  = document.createElement('input');
    element16.value = document.getElementById('editDevMfg').value;
    element16.name = 'editDevMfg';
    form.appendChild(element16);


    let element17  = document.createElement('input');
    element17.value = document.getElementById('editDevCatCode').value;
    element17.name = 'editDevCatCode';
    form.appendChild(element17);

    let element18 = document.createElement('input');
    element18.value = document.getElementById('editDevClass').value;
    element18.name = 'class';
    form.appendChild(element18);

    document.body.appendChild(form);
   form.submit()
}

function deleteBrkAcc(elOrEvent) {
    // elOrEvent may be the button element, or an object like { target: element }
    var btn = null;
    if (elOrEvent && typeof elOrEvent === 'object' && elOrEvent.target) {
        btn = elOrEvent.target;
    } else if (elOrEvent && typeof elOrEvent === 'object' && typeof elOrEvent.getAttribute === 'function') {
        btn = elOrEvent;
    }

    if (!btn) {
        console.error('deleteBrkAcc: missing element');
        alert('Unable to delete accessory: missing element');
        return;
    }

    var brkAccID = btn.getAttribute('data-acc-id') || '';
    if (!brkAccID) {
        console.error('deleteBrkAcc: data-acc-id missing on delete button');
        alert('Unable to delete accessory: missing accessory id');
        return;
    }

    let mbomID = document.getElementById('mbomID').value;
    let jobNum = document.getElementById('jobNum').value;
    let releaseNum = document.getElementById('releaseNum').value;

    let form = document.createElement('form');
    form.method = "POST";
    form.action = "../deleteBreakerAcc";

    // send arrIndex (in-memory index) instead of brkAccID to avoid ambiguity with DB primary keys
    let elementIndex = document.createElement('input');
    elementIndex.value = brkAccID;
    elementIndex.name = "arrIndex";
    form.appendChild(elementIndex);

    //MBOM DATA
    let element2 = document.createElement('input');
    element2.value = mbomID;
    element2.name = "mbomID";
    form.appendChild(element2);

    let element3 = document.createElement('input');
    element3.value = jobNum;
    element3.name = "jobNum";
    form.appendChild(element3);

    let element4 = document.createElement('input');
    element4.value = releaseNum;
    element4.name = "releaseNum";
    form.appendChild(element4);

    //BRK DATA
    let element5 = document.createElement('input');
    element5.value = document.getElementById('devDesLimit').value.toUpperCase();
    element5.name = "devDesignation";
    form.appendChild(element5);

    let element6 = document.createElement('input');
    element6.value = document.getElementById('brkPN').value;
    element6.name = "brkPN";
    form.appendChild(element6);

    let element7 = document.createElement('input');
    element7.value = document.getElementById('cradlePN').value;
    element7.name = "cradlePN";
    form.appendChild(element7);

    let element8 = document.createElement('input');
    element8.value = document.getElementById('devMfg').value.toUpperCase();
    element8.name = "devMfg";
    form.appendChild(element8);

    let element9 = document.createElement('input');
    element9.value = document.getElementById('devCatCode').value;
    element9.name = "catCode";
    form.appendChild(element9);

    let element10 = document.createElement('input');
    element10.value = document.getElementById('devClassCode').value;
    element10.name = "classCode";
    form.appendChild(element10);

    document.body.appendChild(form);
    form.submit()
}

function deleteBrkAccFromEdit(brkAcc) {
    // brkAcc may be either the button element, or an object like { target: element }
    var btn = null;
    if (brkAcc && typeof brkAcc === 'object' && brkAcc.target) {
        btn = brkAcc.target;
    } else if (brkAcc && typeof brkAcc === 'object' && typeof brkAcc.getAttribute === 'function') {
        btn = brkAcc;
    }

    // Require that the button contains a data-acc-id attribute (primary key). Don't attempt fallbacks.
    if (!btn) {
        console.error('deleteBrkAccFromEdit: no button element provided');
        alert('Unable to delete accessory: missing element');
        return;
    }

    var form = document.createElement('form');
    form.method = "POST";
    form.action = "../deleteBreakerAccFromEdit";

    // require data-acc-id and send only that to the server
    var brkAccID = btn.getAttribute('data-acc-id') || '';
    if (!brkAccID) {
        console.error('deleteBrkAccFromEdit: data-acc-id missing on delete button');
        alert('Unable to delete accessory: missing accessory id');
        return;
    }

    var elementId = document.createElement('input');
    elementId.value = brkAccID;
    elementId.name = 'brkAccID';
    form.appendChild(elementId);

    // try to include idDev (from button data-dev) so server can re-query if needed
    var idDevAttr = btn.getAttribute('data-dev') || '';
    if (idDevAttr) {
        var elementIdDev = document.createElement('input');
        elementIdDev.value = idDevAttr;
        elementIdDev.name = 'idDev';
        form.appendChild(elementIdDev);
    } else {
        // if data-dev not present, but page has a hidden #idDev field, include that
        var idDevField = document.getElementById('idDev');
        if (idDevField && idDevField.value) {
            var elementIdDev2 = document.createElement('input');
            elementIdDev2.value = idDevField.value;
            elementIdDev2.name = 'idDev';
            form.appendChild(elementIdDev2);
        }
    }

    //MBOM DATA
    let element3 = document.createElement('input');
    element3.value = document.getElementById('mbomID').value;
    element3.name = 'mbomID';
    form.appendChild(element3);

    let element4 = document.createElement('input');
    element4.value = document.getElementById('jobNum').value;
    element4.name = 'jobNum';
    form.appendChild(element4);

    let element5 = document.createElement('input');
    element5.value = document.getElementById('releaseNum').value;
    element5.name = 'releaseNum';
    form.appendChild(element5);

    let element6 = document.createElement('input');
    element6.value = document.getElementById('jobName').value;
    element6.name = 'jobName';
    form.appendChild(element6);

    let element7 = document.createElement('input');
    element7.value = document.getElementById('customer').value;
    element7.name = 'customer';
    form.appendChild(element7);

    let element8 = document.createElement('input');
    element8.value = document.getElementById('devLayout').value;
    element8.name = 'devLayout';
    form.appendChild(element8);

    //BRK DATA
    let element9 = document.createElement('input');
    element9.value = document.getElementById('editDevDesLimit').value.toUpperCase();
    element9.name = "devDesignation";
    form.appendChild(element9);

    let element10 = document.createElement('input');
    element10.value = document.getElementById('editBrkPN').value;
    element10.name = "brkPN";
    form.appendChild(element10);

    let element11 = document.createElement('input');
    element11.value = document.getElementById('editCradlePN').value;
    element11.name = "cradlePN";
    form.appendChild(element11);

    let element12 = document.createElement('input');
    element12.value = document.getElementById('editDevMfg').value.toUpperCase();
    element12.name = "devMfg";
    form.appendChild(element12);

    let element13 = document.createElement('input');
    element13.value = document.getElementById('editDevCatCode').value;
    element13.name = "catCode";
    form.appendChild(element13);

    let element14 = document.createElement('input');
    element14.value = document.getElementById('editDevClass').value;
    element14.name = "class";
    form.appendChild(element14);

    document.body.appendChild(form);
    form.submit()
}


function mbomBrkAccFormSubmit(accData, brkData) {
    //mbomData
    let mbomID = document.getElementById('mbomID').value;
    let jobNum = document.getElementById('jobNum').value;
    let releaseNum = document.getElementById('releaseNum').value;

    let form = document.createElement('form');
    form.method = "POST";
    form.action = "../addBreakerAcc";

    let element1 = document.createElement('input');
    element1.value = accData.accQty;
    element1.name = "accQty";
    form.appendChild(element1);

    let element2 = document.createElement('input');
    element2.value = accData.accType.toUpperCase();
    element2.name = "accType";
    form.appendChild(element2);

    let element3 = document.createElement('input');
    element3.value = accData.accMfg.toUpperCase();
    element3.name = "accMfg";
    form.appendChild(element3);

    let element4 = document.createElement('input');
    element4.value = accData.accDesc.toUpperCase();
    element4.name = "accDesc";
    form.appendChild(element4);

    let element5 = document.createElement('input');
    element5.value = accData.accPN;
    element5.name = "accPN";
    form.appendChild(element5);

    //MBOM DATA
    let element6 = document.createElement('input');
    element6.value = mbomID;
    element6.name = "mbomID";
    form.appendChild(element6);

    let element7 = document.createElement('input');
    element7.value = jobNum;
    element7.name = "jobNum";
    form.appendChild(element7);

    let element8 = document.createElement('input');
    element8.value = releaseNum;
    element8.name = "releaseNum";
    form.appendChild(element8);

    //BRK DATA
    let element9 = document.createElement('input');
    element9.value = brkData.devDesignation.toUpperCase();
    element9.name = "devDesignation";
    form.appendChild(element9);

    let element10 = document.createElement('input');
    element10.value = brkData.brkPN;
    element10.name = "brkPN";
    form.appendChild(element10);

    let element11 = document.createElement('input');
    element11.value = brkData.cradlePN;
    element11.name = "cradlePN";
    form.appendChild(element11);

    let element12 = document.createElement('input');
    element12.value = brkData.devMfg.toUpperCase();
    element12.name = "devMfg";
    form.appendChild(element12);

    let element13 = document.createElement('input');
    element13.value = brkData.catCode;
    element13.name = "catCode";
    form.appendChild(element13);

    let element14 = document.createElement('input');
    element14.value = brkData.class;
    element14.name = "classCode";
    form.appendChild(element14);

    document.body.appendChild(form);
    form.submit()
}

