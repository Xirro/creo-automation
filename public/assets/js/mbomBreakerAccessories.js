/*
 Client-side accessory store and UI
 - window.__initialBrkAccData is provided by the server (array)
 - window.__breakerAccessories is the live array used for creation/edit flows
 - Accessories are rendered into #breakerAccessoriesTable tbody
 - Before submitting #breakerForm we serialize the array into #brkAccessoriesJson
*/
window.__breakerAccessories = [];
window.__editingAccessoryIndex = null;

function _getBreakerMfg(){
    const el = document.getElementById('devMfg') || document.getElementById('editDevMfg');
    return (el && typeof el.value !== 'undefined') ? el.value : '';
}

function _renderBreakerAccessoriesTable(){
    const tbody = document.querySelector('#breakerAccessoriesTable tbody');
    if(!tbody) return;
    tbody.innerHTML = '';
    (window.__breakerAccessories || []).forEach(function(acc, idx){
        const tr = document.createElement('tr');
        tr.setAttribute('data-acc-idx', idx);

        // If this row is currently being edited, render input fields and accept/cancel actions
        if (window.__editingAccessoryIndex === idx) {
            const tdQty = document.createElement('td');
            const inpQty = document.createElement('input'); inpQty.type='number'; inpQty.min='1'; inpQty.className='form-control form-control-sm'; inpQty.value = acc.qty || '';
            tdQty.appendChild(inpQty); tr.appendChild(tdQty);

            const tdType = document.createElement('td');
            const inpType = document.createElement('input'); inpType.type='text'; inpType.className='form-control form-control-sm'; inpType.value = acc.type || '';
            tdType.appendChild(inpType); tr.appendChild(tdType);

            const tdMfg = document.createElement('td');
            const inpMfg = document.createElement('input'); inpMfg.type='text'; inpMfg.className='form-control form-control-sm'; inpMfg.value = acc.mfg || '';
            tdMfg.appendChild(inpMfg); tr.appendChild(tdMfg);

            const tdDesc = document.createElement('td');
            const inpDesc = document.createElement('input'); inpDesc.type='text'; inpDesc.className='form-control form-control-sm'; inpDesc.value = acc.desc || '';
            tdDesc.appendChild(inpDesc); tr.appendChild(tdDesc);

            const tdPN = document.createElement('td');
            const inpPN = document.createElement('input'); inpPN.type='text'; inpPN.className='form-control form-control-sm'; inpPN.value = acc.pn || '';
            tdPN.appendChild(inpPN); tr.appendChild(tdPN);

            const tdActions = document.createElement('td');
            const btnAccept = document.createElement('button'); btnAccept.type='button'; btnAccept.className='btn btn-sm btn-success mr-1'; btnAccept.innerHTML = '&#10003;';
            btnAccept.addEventListener('click', function(){
                // commit changes
                const newVal = {
                    qty: inpQty.value,
                    type: inpType.value,
                    mfg: inpMfg.value,
                    desc: inpDesc.value,
                    pn: inpPN.value,
                    tmpId: acc.tmpId || Date.now()
                };
                window.__breakerAccessories[idx] = newVal;
                window.__editingAccessoryIndex = null;
                _renderBreakerAccessoriesTable();
            });
            const btnCancel = document.createElement('button'); btnCancel.type='button'; btnCancel.className='btn btn-sm btn-outline-secondary'; btnCancel.innerHTML = '&times;';
            btnCancel.addEventListener('click', function(){
                window.__editingAccessoryIndex = null;
                _renderBreakerAccessoriesTable();
            });
            tdActions.appendChild(btnAccept); tdActions.appendChild(btnCancel); tr.appendChild(tdActions);

            tbody.appendChild(tr);
            return; // continue to next row
        }

        // non-editing row render
        const tdQty = document.createElement('td'); tdQty.textContent = acc.qty || ''; tr.appendChild(tdQty);
        const tdType = document.createElement('td'); tdType.textContent = acc.type || ''; tr.appendChild(tdType);
        const tdMfg = document.createElement('td'); tdMfg.textContent = acc.mfg || ''; tr.appendChild(tdMfg);
        const tdDesc = document.createElement('td'); tdDesc.textContent = acc.desc || ''; tr.appendChild(tdDesc);
        const tdPN = document.createElement('td'); tdPN.textContent = acc.pn || ''; tr.appendChild(tdPN);

        const tdActions = document.createElement('td');
        const btnEdit = document.createElement('button'); btnEdit.type='button'; btnEdit.className='btn btn-sm btn-outline-warning mr-1'; btnEdit.textContent='Edit';
        btnEdit.addEventListener('click', function(){ inlineEditAccessory(idx); });
        const btnDel = document.createElement('button'); btnDel.type='button'; btnDel.className='btn btn-sm btn-outline-danger'; btnDel.textContent='Delete';
        btnDel.addEventListener('click', function(){ deleteAccessory(idx); });
        tdActions.appendChild(btnEdit); tdActions.appendChild(btnDel); tr.appendChild(tdActions);

        tbody.appendChild(tr);
    });
}

function _clearAccessoryInputs(){
    const q = document.getElementById('accessoryQty'); if(q) q.value = '';
    const t = document.getElementById('accessoryType'); if(t) t.value = '';
    const d = document.getElementById('accessoryDescLimit'); if(d) d.value = '';
    const p = document.getElementById('accessoryPN'); if(p) p.value = '';
    // reset add button
    const addBtn = document.getElementById('addAccessoryBtn'); if(addBtn) { addBtn.textContent = 'Add Accessory'; addBtn.removeAttribute('data-editing'); }
    window.__editingAccessoryIndex = null;
}

function addBrkAccessory(){
    const qtyEl = document.getElementById('accessoryQty');
    if(!qtyEl) return alert('Accessory Qty input not found');
    const qty = qtyEl.value || '';
    const type = (document.getElementById('accessoryType') || {}).value || '';
    // manufacturer for accessories is the same as breaker manufacturer
    const mfg = _getBreakerMfg() || '';
    const desc = (document.getElementById('accessoryDescLimit') || {}).value || '';
    const pn = (document.getElementById('accessoryPN') || {}).value || '';

    const acc = { qty: qty, type: type, mfg: mfg, desc: desc, pn: pn, tmpId: Date.now() };

    if (window.__editingAccessoryIndex !== null && typeof window.__editingAccessoryIndex !== 'undefined') {
        // update existing
        window.__breakerAccessories[window.__editingAccessoryIndex] = acc;
    } else {
        window.__breakerAccessories.push(acc);
    }

    _renderBreakerAccessoriesTable();
    _clearAccessoryInputs();
}

function editAccessory(idx){
    // kept for backward compatibility with older UI; switch to inline edit
    inlineEditAccessory(idx);
}

function inlineEditAccessory(idx){
    if (typeof idx === 'undefined' || idx === null) return;
    window.__editingAccessoryIndex = idx;
    _renderBreakerAccessoriesTable();
}

function deleteAccessory(idx){
    if (typeof idx === 'undefined' || idx === null) return;
    window.__breakerAccessories.splice(idx,1);
    _renderBreakerAccessoriesTable();
}

// initialize on DOM ready
document.addEventListener('DOMContentLoaded', function(){
    try {
        // Normalize server-provided accessory objects into the client shape {qty,type,mfg,desc,pn,tmpId}
        var init = Array.isArray(window.__initialBrkAccData) ? window.__initialBrkAccData : [];
        window.__breakerAccessories = init.map(function(el){
            if(!el) return null;
                return {
                    qty: el.qty || el.brkAccQty || el.accQty || el.accQty || '',
                    type: el.type || el.brkAccType || el.accType || '',
                    mfg: el.mfg || el.brkAccMfg || el.accMfg || _getBreakerMfg() || '',
                    desc: el.desc || el.brkAccDesc || el.accDesc || '',
                    pn: el.pn || el.brkAccPN || el.accPN || '',
                    brkAccID: (typeof el.brkAccID !== 'undefined') ? el.brkAccID : (typeof el.brkAccId !== 'undefined' ? el.brkAccId : null),
                    idDev: (typeof el.idDev !== 'undefined') ? el.idDev : null,
                    tmpId: el.tmpId || Date.now()
                };
        }).filter(Boolean);
    } catch(e){ window.__breakerAccessories = []; }

    _renderBreakerAccessoriesTable();

    const addBtn = document.getElementById('addAccessoryBtn');
    if(addBtn) addBtn.addEventListener('click', addBrkAccessory);

    // Validation: enable Add Accessory button only when both breaker required fields
    // and accessory inputs are populated/valid. Works for create and edit pages.
    (function(){
        var addBtnLocal = document.getElementById('addAccessoryBtn');
        if(!addBtnLocal) return;

        // accessory input ids
        var accessoryIds = ['accessoryQty','accessoryType','accessoryDescLimit','accessoryPN'];
        var accessoryEls = accessoryIds.map(function(id){ return document.getElementById(id); }).filter(Boolean);

        // breaker field id pairs [createId, editId]
        var breakerIdPairs = [
            ['devDesLimit','editDevDesLimit'],
            ['brkPN','editBrkPN'],
            ['cradlePN','editCradlePN'],
            ['devMfg','editDevMfg'],
            ['devCatCode','editDevCatCode'],
            ['devClassCode','editDevClass']
        ];

        var breakerEls = breakerIdPairs.map(function(pair){
            for(var i=0;i<pair.length;i++){ var el = document.getElementById(pair[i]); if(el) return el; }
            return null;
        }).filter(Boolean);

        function isElementValid(el){
            if(!el) return false;
            var tag = (el.tagName || '').toLowerCase();
            if(tag === 'select') return el.value !== '' && el.value !== 'Select';
            if(el.type === 'number') return el.value !== '' && !isNaN(Number(el.value)) && Number(el.value) > 0;
            return String(el.value || '').trim().length > 0;
        }

        function areAllValid(list){
            if(list.length === 0) return false;
            return list.every(function(el){ return isElementValid(el); });
        }

        function updateAddAccessoryState(){
            var breakerOk = areAllValid(breakerEls);
            var accOk = areAllValid(accessoryEls);

            // build reason tooltip text when disabled
            var missingBreaker = [];
            var breakerLabels = ['Device Designation','Breaker P/N','Cradle P/N','Manufacturer','Cat. Code','Class'];
            for(var i=0;i<breakerEls.length;i++){
                if(!isElementValid(breakerEls[i])) missingBreaker.push(breakerLabels[i] || ('Field ' + (i+1)));
            }

            var missingAcc = [];
            var accLabels = ['Qty','Type','Description','P/N'];
            for(var j=0;j<accessoryEls.length;j++){
                if(!isElementValid(accessoryEls[j])) missingAcc.push(accLabels[j] || ('Acc ' + (j+1)));
            }

            if(breakerOk && accOk){
                addBtnLocal.disabled = false;
                addBtnLocal.classList.remove('disabled');
                if(addBtnLocal.classList.contains('btn-outline-secondary')) addBtnLocal.classList.replace('btn-outline-secondary','btn-outline-info');
                addBtnLocal.style.opacity = '';
                addBtnLocal.setAttribute('aria-disabled','false');

                // Dispose any existing bootstrap tooltip (if present)
                try {
                    if(window.jQuery && typeof $(addBtnLocal).tooltip === 'function') { $(addBtnLocal).tooltip('dispose'); }
                } catch(e){}

                // clear title
                addBtnLocal.removeAttribute('title');
                addBtnLocal.removeAttribute('data-original-title');
                addBtnLocal.removeAttribute('data-toggle');
            } else {
                addBtnLocal.disabled = true;
                addBtnLocal.classList.add('disabled');
                if(addBtnLocal.classList.contains('btn-outline-info')) addBtnLocal.classList.replace('btn-outline-info','btn-outline-secondary');
                addBtnLocal.style.opacity = '0.65';
                addBtnLocal.setAttribute('aria-disabled','true');

                var reasons = [];
                if(missingBreaker.length) reasons.push('Complete breaker fields: ' + missingBreaker.join(', '));
                if(missingAcc.length) reasons.push('Complete accessory fields: ' + missingAcc.join(', '));
                var tooltipText = reasons.join(' ; ');

                // Set up Bootstrap tooltip if available, otherwise fall back to title
                try {
                    if(window.jQuery && typeof $(addBtnLocal).tooltip === 'function'){
                        // ensure attribute exists for selector-based initialization
                        addBtnLocal.setAttribute('data-toggle','tooltip');
                        addBtnLocal.setAttribute('title', tooltipText);
                        // re-init tooltip
                        $(addBtnLocal).tooltip('dispose');
                        $(addBtnLocal).tooltip({container: 'body'});
                    } else {
                        addBtnLocal.title = tooltipText;
                    }
                } catch(e){
                    try { addBtnLocal.title = tooltipText; } catch(e2){}
                }
            }
        }

        // wire listeners
        accessoryEls.concat(breakerEls).forEach(function(el){
            el.addEventListener('input', updateAddAccessoryState);
            el.addEventListener('change', updateAddAccessoryState);
        });

        // initial state
        updateAddAccessoryState();
    })();

    // hook breakerForm submit to serialize accessories into hidden input
    const breakerForm = document.getElementById('breakerForm');
    if(breakerForm){
        breakerForm.addEventListener('submit', function(evt){
            // Auto-uppercase key breaker fields before submit (supports create and edit IDs)
            try {
                var mfg = document.getElementById('devMfg') || document.getElementById('editDevMfg');
                var brk = document.getElementById('brkPN') || document.getElementById('editBrkPN');
                var cradle = document.getElementById('cradlePN') || document.getElementById('editCradlePN');
                if(mfg && typeof mfg.value !== 'undefined') mfg.value = String(mfg.value).toUpperCase();
                if(brk && typeof brk.value !== 'undefined') brk.value = String(brk.value).toUpperCase();
                if(cradle && typeof cradle.value !== 'undefined') cradle.value = String(cradle.value).toUpperCase();
            } catch(e){ /* ignore */ }

            const hidden = document.getElementById('brkAccessoriesJson');
            if(hidden) hidden.value = JSON.stringify(window.__breakerAccessories || []);
        });
    }
});


function addBrkAccessoryFromEdit(idDev){

    let form = document.createElement('form');
    form.method = "POST";
    // choose project-scoped URL when projectId present
    var projFieldLocal = document.getElementById('projectId') || (document.getElementsByName && document.getElementsByName('projectId') && document.getElementsByName('projectId')[0]);
    if (projFieldLocal && projFieldLocal.value) {
        form.action = "/projects/" + encodeURIComponent(projFieldLocal.value) + "/addBreakerAccFromEdit";
    } else {
        form.action = "/addBreakerAccFromEdit";
    }

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
    element16.value = _getBreakerMfg();
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
    // include projectId if present on page
    var projFieldAdd = document.getElementById('projectId') || (document.getElementsByName && document.getElementsByName('projectId') && document.getElementsByName('projectId')[0]);
    if (projFieldAdd && projFieldAdd.value) {
        var pAdd = document.createElement('input');
        pAdd.name = 'projectId';
        pAdd.value = projFieldAdd.value;
        form.appendChild(pAdd);
    }

    form.submit()

}



function editBrkAcc(brkAccID) {
    let form = document.createElement('form');
    form.method = "POST";
    var projFieldLocal = document.getElementById('projectId') || (document.getElementsByName && document.getElementsByName('projectId') && document.getElementsByName('projectId')[0]);
    if (projFieldLocal && projFieldLocal.value) {
        form.action = "/projects/" + encodeURIComponent(projFieldLocal.value) + "/editBreakerAcc";
    } else {
        form.action = "/editBreakerAcc";
    }


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
    // include projectId if present on page
    var projFieldEdit = document.getElementById('projectId') || (document.getElementsByName && document.getElementsByName('projectId') && document.getElementsByName('projectId')[0]);
    if (projFieldEdit && projFieldEdit.value) {
        var pEdit = document.createElement('input');
        pEdit.name = 'projectId';
        pEdit.value = projFieldEdit.value;
        form.appendChild(pEdit);
    }

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
    var projFieldLocal = document.getElementById('projectId') || (document.getElementsByName && document.getElementsByName('projectId') && document.getElementsByName('projectId')[0]);
    if (projFieldLocal && projFieldLocal.value) {
        form.action = "/projects/" + encodeURIComponent(projFieldLocal.value) + "/editBreakerAccFromEdit";
    } else {
        form.action = "/editBreakerAccFromEdit";
    }

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

    // include projectId if present on page
    var projField = document.getElementById('projectId') || (document.getElementsByName && document.getElementsByName('projectId') && document.getElementsByName('projectId')[0]);
    if (projField && projField.value) {
        var p = document.createElement('input');
        p.name = 'projectId';
        p.value = projField.value;
        form.appendChild(p);
    }

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
    element16.value = _getBreakerMfg();
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
    var projFieldLocal = document.getElementById('projectId') || (document.getElementsByName && document.getElementsByName('projectId') && document.getElementsByName('projectId')[0]);
    if (projFieldLocal && projFieldLocal.value) {
        form.action = "/projects/" + encodeURIComponent(projFieldLocal.value) + "/deleteBreakerAcc";
    } else {
        form.action = "/deleteBreakerAcc";
    }

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

    // include projectId if present on page
    var projField2 = document.getElementById('projectId') || (document.getElementsByName && document.getElementsByName('projectId') && document.getElementsByName('projectId')[0]);
    if (projField2 && projField2.value) {
        var p2 = document.createElement('input');
        p2.name = 'projectId';
        p2.value = projField2.value;
        form.appendChild(p2);
    }

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
    element8.value = (_getBreakerMfg() || '').toUpperCase();
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
    // include projectId if present on page
    var projFieldDel = document.getElementById('projectId') || (document.getElementsByName && document.getElementsByName('projectId') && document.getElementsByName('projectId')[0]);
    if (projFieldDel && projFieldDel.value) {
        var pDel = document.createElement('input');
        pDel.name = 'projectId';
        pDel.value = projFieldDel.value;
        form.appendChild(pDel);
    }

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
    var projFieldLocal = document.getElementById('projectId') || (document.getElementsByName && document.getElementsByName('projectId') && document.getElementsByName('projectId')[0]);
    if (projFieldLocal && projFieldLocal.value) {
        form.action = "/projects/" + encodeURIComponent(projFieldLocal.value) + "/deleteBreakerAccFromEdit";
    } else {
        form.action = "/deleteBreakerAccFromEdit";
    }

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
    element12.value = (_getBreakerMfg() || '').toUpperCase();
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
    // include projectId if present on page
    var projFieldMbom = document.getElementById('projectId') || (document.getElementsByName && document.getElementsByName('projectId') && document.getElementsByName('projectId')[0]);
    if (projFieldMbom && projFieldMbom.value) {
        var pMbom = document.createElement('input');
        pMbom.name = 'projectId';
        pMbom.value = projFieldMbom.value;
        form.appendChild(pMbom);
    }

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
    var projFieldLocal = document.getElementById('projectId') || (document.getElementsByName && document.getElementsByName('projectId') && document.getElementsByName('projectId')[0]);
    if (projFieldLocal && projFieldLocal.value) {
        form.action = "/projects/" + encodeURIComponent(projFieldLocal.value) + "/addBreakerAcc";
    } else {
        form.action = "/addBreakerAcc";
    }

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

    // Only include catCode if it has a non-empty value to avoid submitting empty hidden inputs
    if (brkData && typeof brkData.catCode !== 'undefined' && brkData.catCode !== null && String(brkData.catCode).trim() !== '') {
        let element13 = document.createElement('input');
        element13.value = brkData.catCode;
        element13.name = "catCode";
        form.appendChild(element13);
    }

    let element14 = document.createElement('input');
    element14.value = brkData.class;
    element14.name = "classCode";
    form.appendChild(element14);

    document.body.appendChild(form);
    form.submit()
}

