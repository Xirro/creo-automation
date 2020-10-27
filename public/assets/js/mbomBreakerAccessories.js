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
            catCode: document.getElementById('devCatCode').value
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
    let brkAccID = letiable.id;

    let form = document.createElement('form');
    form.method = "POST";
    form.action = "../editBreakerAccFromEdit";


    let mbomID = document.getElementById('mbomID').value;
    let jobNum = document.getElementById('jobNum').value;
    let releaseNum = document.getElementById('releaseNum').value;

    let element1 = document.createElement('input');
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

    document.body.appendChild(form);
   form.submit()
}

function deleteBrkAcc(brkAccPN) {
    let mbomID = document.getElementById('mbomID').value;
    let jobNum = document.getElementById('jobNum').value;
    let releaseNum = document.getElementById('releaseNum').value;

    let form = document.createElement('form');
    form.method = "POST";
    form.action = "../deleteBreakerAcc";

    let element1 = document.createElement('input');
    element1.value = brkAccPN.id;
    element1.name = "pn";
    form.appendChild(element1);

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

    document.body.appendChild(form);
    form.submit()
}

function deleteBrkAccFromEdit(brkAcc) {
    let brkAccPN = brkAcc.id.split('_')[0];
    let idDev = brkAcc.id.split('_')[1];

    let form = document.createElement('form');
    form.method = "POST";
    form.action = "../deleteBreakerAccFromEdit";

    let element1 = document.createElement('input');
    element1.value = brkAccPN;
    element1.name = "pn";
    form.appendChild(element1);

    let element2 = document.createElement('input');
    element2.value = idDev;
    element2.name = 'idDev';
    form.appendChild(element2);

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

    document.body.appendChild(form);
    form.submit()
}

