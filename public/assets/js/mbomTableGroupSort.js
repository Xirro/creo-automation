(function(window){
'use strict';

function escapeText(t){ return (t||'').toString().trim().toLowerCase(); }
function getColText(row, colIndex){
    const cells = row.querySelectorAll('td,th');
    if (cells.length>colIndex) return escapeText(cells[colIndex].textContent);
    return escapeText(row.textContent);
}

function groupTable(tableId){
    const table = document.getElementById(tableId);
    if(!table) return;
    const tbody = table.tBodies[0];
    if(!tbody) return;
    const groupColAttr = table.getAttribute('data-group-col');
    if (!groupColAttr || groupColAttr === 'none') return;
    const groupCol = parseInt(groupColAttr,10);
    const allRows = Array.from(tbody.querySelectorAll('tr'));
    // remove existing group headers
    allRows.filter(r=>r.classList && r.classList.contains('group-header')).forEach(r=>r.remove());
    // only consider visible main rows (filtering has precedence)
    const mainRows = allRows.filter(r=> {
        const td = r.querySelector('td');
        return td && !td.hasAttribute('colspan') && r.style.display !== 'none';
    });
    const colCount = table.querySelectorAll('thead th').length || (mainRows[0] ? mainRows[0].cells.length : 1);
    if(mainRows.length === 0) return;
    let seen = new Map();
    mainRows.forEach((row)=> {
        const key = getColText(row, groupCol) || 'Unassigned';
        if(!seen.has(key)) seen.set(key, []);
        seen.get(key).push(row);
    });
    const keys = Array.from(seen.keys());
    keys.sort((a,b)=>{
        const an = parseFloat(a);
        const bn = parseFloat(b);
        if(!isNaN(an) && !isNaN(bn)) return an - bn;
        if(a < b) return -1;
        if(a > b) return 1;
        return 0;
    });
    const oldRows = Array.from(tbody.querySelectorAll('tr'));
    const entriesByOrig = new Map();
    for(let i=0;i<oldRows.length;i++){
        const r = oldRows[i];
        const firstTd = r.querySelector('td');
        if(!firstTd) continue;
        if(firstTd.hasAttribute('colspan')){
            const prev = oldRows[i-1];
            const orig = prev && prev.getAttribute ? prev.getAttribute('data-orig-index') : null;
            if(orig !== null && entriesByOrig.has(orig)){
                entriesByOrig.get(orig).detail = r;
            }
            continue;
        }
        const orig = r.getAttribute('data-orig-index') || null;
        const maybeForm = r.closest ? r.closest('form') : null;
        const formAncestor = (maybeForm && r.parentElement === maybeForm) ? maybeForm : null;
        const obj = {row: r, detail: null, orig: orig !== null ? parseInt(orig,10) : Number.MAX_SAFE_INTEGER, form: formAncestor};
        entriesByOrig.set(String(obj.orig), obj);
    }

    const appended = new Set();
    const frag = document.createDocumentFragment();
    for(const key of keys){
        const rowsForKey = seen.get(key) || [];
        if(rowsForKey.length === 0) continue;
        const header = document.createElement('tr');
        header.className = 'group-header';
        const hd = document.createElement('td');
        hd.colSpan = colCount + 1;
        hd.style.cursor = 'pointer';
        hd.style.background = '#f5f5f5';
        hd.style.fontWeight = '600';
        hd.style.padding = '6px 12px';
        const label = document.createElement('span');
        label.textContent = (key ? key.toUpperCase() : 'UNASSIGNED') + ' (' + rowsForKey.length + ')';
        const icon = document.createElement('span');
        icon.style.float = 'right';
        icon.textContent = '\u25BC';
        hd.appendChild(label);
        hd.appendChild(icon);
        header.appendChild(hd);
        frag.appendChild(header);
        rowsForKey.forEach(r => {
            const orig = r.getAttribute && r.getAttribute('data-orig-index');
            if(orig !== null && entriesByOrig.has(orig)){
                const ent = entriesByOrig.get(orig);
                // prefer appending the enclosing form if present so buttons keep form context
                if(ent.form && !appended.has('form:' + ent.orig)){
                    frag.appendChild(ent.form);
                    appended.add('form:' + ent.orig);
                } else {
                    frag.appendChild(ent.row);
                    if(ent.detail) frag.appendChild(ent.detail);
                    appended.add(orig);
                }
            } else {
                const formAncestor = r.closest ? r.closest('form') : null;
                if(formAncestor){
                    frag.appendChild(formAncestor);
                } else {
                    frag.appendChild(r);
                    const next = r.nextElementSibling;
                    if(next && next.querySelector('td') && next.querySelector('td').hasAttribute('colspan')) frag.appendChild(next);
                }
            }
        });
        header.addEventListener('click', function(){
            const isCollapsed = header.classList.toggle('collapsed');
            icon.textContent = isCollapsed ? '\u25B6' : '\u25BC';
            rowsForKey.forEach(r => {
                r.style.display = isCollapsed ? 'none' : '';
            });
        });
    }

    const remaining = Array.from(entriesByOrig.values()).sort((a,b)=>a.orig - b.orig);
    remaining.forEach(ent => {
        const key = String(ent.orig);
        if(appended.has(key) || appended.has('form:' + ent.orig)) return;
        if(ent.form){
            frag.appendChild(ent.form);
            appended.add('form:' + ent.orig);
        } else {
            frag.appendChild(ent.row);
            if(ent.detail) frag.appendChild(ent.detail);
            appended.add(key);
        }
    });

    tbody.innerHTML = '';
    tbody.appendChild(frag);
    try{ patchInlineFormActions(tableId); }catch(e){ if(window.__DEBUG) console.error('patchInlineFormActions error', e); }
}

function sortTable(tableId, colIndex, asc){
    const table = document.getElementById(tableId);
    if(!table) return;
    const tbody = table.tBodies[0];
    if(!tbody) return;
    const allRows = Array.from(tbody.querySelectorAll('tr'));
    const entries = [];
    for(let i=0;i<allRows.length;i++){
        const r = allRows[i];
        if(r.classList && r.classList.contains('group-header')) continue;
        const firstTd = r.querySelector('td');
        if(!firstTd) continue;
        if(firstTd.hasAttribute('colspan')){
            if(entries.length) entries[entries.length-1].detail = r;
            continue;
        }
        const key = getColText(r, colIndex);
        const next = r.nextElementSibling;
        let detail = null;
        if(next && next.querySelector('td') && next.querySelector('td').hasAttribute('colspan')) detail = next;
        const maybeForm = r.closest ? r.closest('form') : null;
        const formAncestor = (maybeForm && r.parentElement === maybeForm) ? maybeForm : null;
        entries.push({key: key, row: r, detail: detail, form: formAncestor});
    }

    const groupColAttr = table.getAttribute('data-group-col');
    const groupingActive = groupColAttr && groupColAttr !== 'none';

    const compareFn = (a,b)=>{
        const an = parseFloat(a.key);
        const bn = parseFloat(b.key);
        if(!isNaN(an) && !isNaN(bn)) return asc ? an-bn : bn-an;
        if(a.key < b.key) return asc ? -1 : 1;
        if(a.key > b.key) return asc ? 1 : -1;
        return 0;
    };

    if(!groupingActive){
        clearGroupHeaders(tableId);
        entries.sort(compareFn);
        tbody.innerHTML = '';
        entries.forEach(e => {
            if(e.form){ tbody.appendChild(e.form); }
            else { tbody.appendChild(e.row); if(e.detail) tbody.appendChild(e.detail); }
        });
        try{ patchInlineFormActions(tableId); }catch(e){ if(window.__DEBUG) console.error('patchInlineFormActions error', e); }
    } else {
        const groupCol = parseInt(groupColAttr,10);
        const groups = new Map();
        entries.forEach(ent => {
            const gkey = getColText(ent.row, groupCol) || 'Unassigned';
            if(!groups.has(gkey)) groups.set(gkey, []);
            groups.get(gkey).push(ent);
        });
        const groupKeys = Array.from(groups.keys());
        groupKeys.sort((a,b)=>{
            const an = parseFloat(a);
            const bn = parseFloat(b);
            if(!isNaN(an) && !isNaN(bn)) return an - bn;
            if(a < b) return -1;
            if(a > b) return 1;
            return 0;
        });
        groupKeys.forEach(k => {
            groups.set(k, groups.get(k).sort(compareFn));
        });
        tbody.innerHTML = '';
        groupKeys.forEach(k => {
            const arr = groups.get(k) || [];
            arr.forEach(e => {
                if(e.form){ tbody.appendChild(e.form); }
                else { tbody.appendChild(e.row); if(e.detail) tbody.appendChild(e.detail); }
            });
        });
        try{ patchInlineFormActions(tableId); }catch(e){ if(window.__DEBUG) console.error('patchInlineFormActions error', e); }
    }
    if(groupingActive){
        try{ groupTable(tableId); }catch(e){}
    }
}

function clearGroupHeaders(tableId){
    const table = document.getElementById(tableId);
    if(!table) return;
    const tbody = table.tBodies[0];
    if(!tbody) return;
    Array.from(tbody.querySelectorAll('tr.group-header')).forEach(r=>r.remove());
    try{
        const anyRow = tbody.querySelector('tr');
        if(!anyRow) return;
        const allRows = Array.from(tbody.querySelectorAll('tr'));
        const entries = [];
        for(let i=0;i<allRows.length;i++){
            const r = allRows[i];
            const firstTd = r.querySelector('td');
            if(!firstTd) continue;
            if(firstTd.hasAttribute('colspan')){
                if(entries.length) entries[entries.length-1].detail = r;
                continue;
            }
                const orig = r.getAttribute('data-orig-index');
                const idx = orig !== null ? parseInt(orig,10) : Number.MAX_SAFE_INTEGER;
                const maybeForm = r.closest ? r.closest('form') : null;
                const formAncestor = (maybeForm && r.parentElement === maybeForm) ? maybeForm : null;
                entries.push({orig: idx, row: r, detail: null, form: formAncestor});
        }
        const hasOrig = entries.some(e=>isFinite(e.orig) && e.orig !== Number.MAX_SAFE_INTEGER);
        if(!hasOrig) return;
        entries.sort((a,b)=> a.orig - b.orig);
        tbody.innerHTML = '';
        entries.forEach(e=>{
            if(e.form){ tbody.appendChild(e.form); }
            else { tbody.appendChild(e.row); if(e.detail) tbody.appendChild(e.detail); }
        });
        try{ patchInlineFormActions(tableId); }catch(e){ if(window.__DEBUG) console.error('patchInlineFormActions error', e); }
    }catch(e){}
}

function applyCurrentSort(tableId){
    const table = document.getElementById(tableId);
    if(!table) return;
    const thead = table.tHead;
    if(!thead) return;
    const ths = Array.from(thead.querySelectorAll('th'));
    for(const th of ths){
        const as = th.getAttribute('aria-sort');
        if(as){
            const colIdx = th.cellIndex;
            const asc = (as === 'ascending');
            try{ sortTable(tableId, colIdx, asc); }catch(e){}
            break;
        }
    }
}

function clearSortIndicators(tableId){
    const table = document.getElementById(tableId);
    if(!table) return;
    const thead = table.tHead;
    if(!thead) return;
    Array.from(thead.querySelectorAll('th')).forEach(function(th){
        const ind = th.querySelector('.sort-indicator');
        if(ind) ind.textContent = '';
        th.removeAttribute('aria-sort');
    });
}

function refreshSortIndicators(tableId){
    const table = document.getElementById(tableId);
    if(!table) return;
    const thead = table.tHead;
    if(!thead) return;
    Array.from(thead.querySelectorAll('th')).forEach(function(th){
        const ind = th.querySelector('.sort-indicator');
        const as = th.getAttribute('aria-sort');
        if(ind){
            if(as === 'ascending') ind.textContent = '\u25B2';
            else if(as === 'descending') ind.textContent = '\u25BC';
            else ind.textContent = '';
        }
    });
}

// Replace inline onclicks that use `this.form` with safe handlers that locate the nearest form
function patchInlineFormActions(tableId){
    const table = document.getElementById(tableId);
    if(!table) return;
    const inputs = Array.from(table.querySelectorAll('input[onclick]'));
    inputs.forEach(inp => {
        const raw = inp.getAttribute('onclick') || '';
        if(raw.indexOf('this.form') === -1) return;
        // preserve raw string for debugging
        inp.setAttribute('data-onclick-raw', raw);
        inp.removeAttribute('onclick');
        // attach a safer handler that finds the nearest form and sets action
        inp.addEventListener('click', function(ev){
            try{
                const s = this.getAttribute('data-onclick-raw') || '';
                const m = s.match(/this\.form\.action\s*=\s*'([^']+)'/);
                if(m && m[1]){
                    const url = m[1];
                    const f = this.closest ? this.closest('form') : null;
                    if(f){
                        // set action and allow normal submit to proceed
                        f.action = url;
                        return;
                    }
                    // no enclosing form: prevent default and submit a temporary POST form as fallback
                    ev.preventDefault();
                    try{
                        const tmp = document.createElement('form');
                        tmp.style.display = 'none';
                        tmp.method = 'post';
                        tmp.action = url;
                        // copy page-level mbom identifiers if present so server has context
                        const copyField = (name, id) => {
                            const el = id ? document.getElementById(id) : document.querySelector('input[name="' + name + '"]');
                            if(el && el.value !== undefined){
                                const h = document.createElement('input');
                                h.type = 'hidden';
                                h.name = name;
                                h.value = el.value;
                                tmp.appendChild(h);
                            }
                        };
                        copyField('mbomID','mbomID');
                        copyField('jobNum','jobNum');
                        copyField('releaseNum','releaseNum');
                        document.body.appendChild(tmp);
                        tmp.submit();
                        // cleanup (best-effort)
                        setTimeout(()=>{ try{ document.body.removeChild(tmp); }catch(e){} }, 1000);
                    }catch(e){
                        if(window.__DEBUG) console.error('form-submit fallback failed', e);
                    }
                }
            }catch(e){ if(window.__DEBUG) console.error('patchInlineFormActions handler error', e); }
        });
    });
}

function makeHeadersSortable(tableId, opts){
    const table = document.getElementById(tableId);
    if(!table) return;
    const thead = table.tHead;
    if(!thead) return;
    let sortState = {};
    Array.from(thead.querySelectorAll('th')).forEach(function(th){
        // Skip sortable wiring for columns that should not be sorted (select/action columns)
        const skipSort = (th.classList && (th.classList.contains('no-sort') || th.classList.contains('select-col') || th.classList.contains('actions-col'))) || th.dataset && th.dataset.orderable === 'false';
        if(skipSort) return;
        th.style.cursor = 'pointer';
        let ind = th.querySelector('.sort-indicator');
        if(!ind){
            ind = document.createElement('span');
            ind.className = 'sort-indicator';
            ind.style.marginLeft = '8px';
            ind.style.fontSize = '0.9em';
            th.appendChild(ind);
        }
        th.addEventListener('click', function(){
            const colIdx = th.cellIndex;
            const dir = sortState[colIdx] = !(sortState[colIdx] || false);
            Array.from(thead.querySelectorAll('th')).forEach(function(other){
                if(other === th) return;
                const oind = other.querySelector('.sort-indicator');
                if(oind) oind.textContent = '';
                other.removeAttribute('aria-sort');
            });
            const indicator = th.querySelector('.sort-indicator');
            if(indicator) indicator.textContent = dir ? '\u25B2' : '\u25BC';
            th.setAttribute('aria-sort', dir ? 'ascending' : 'descending');
            try{
                if(window.__DEBUG) console.log('sorting', tableId, colIdx, dir);
                sortTable(tableId, colIdx, dir);
            }catch(err){ if(window.__DEBUG) console.error('sortTable error', err); }

            if(opts && opts.filterId){
                const inp = document.getElementById(opts.filterId);
                if(inp){
                    const t = document.getElementById(tableId);
                    const groupColAttr = t && t.getAttribute ? t.getAttribute('data-group-col') : null;
                    const groupingActive = groupColAttr && groupColAttr !== 'none';
                    if(groupingActive){ inp.dispatchEvent(new Event('input')); }
                }
            }
        });
    });
}

function annotateOriginalOrder(tableId){
    const t = document.getElementById(tableId);
    if(!t) return;
    const tbody = t.tBodies[0];
    if(!tbody) return;
    let counter = 0;
    const rows = Array.from(tbody.querySelectorAll('tr'));
    for(let i=0;i<rows.length;i++){
        const r = rows[i];
        const td = r.querySelector('td');
        if(td && !td.hasAttribute('colspan')){
            r.setAttribute('data-orig-index', counter++);
            const next = r.nextElementSibling;
            if(next && next.querySelector('td') && next.querySelector('td').hasAttribute('colspan')){
                next.setAttribute('data-orig-index', r.getAttribute('data-orig-index'));
            }
        }
    }
}

// setupFilter is slightly generic: accepts an options object for clear button and group select id
function setupFilter(inputId, tableId, opts){
    const input = document.getElementById(inputId);
    const table = document.getElementById(tableId);
    if (window.__DEBUG) console.log('setupFilter init', inputId, tableId, !!input, !!table);
    if(!input || !table) return;
    const tbody = table.tBodies[0];
    input.addEventListener('input', function(){
        try{
            const q = input.value.trim().toLowerCase();
            const rows = Array.from(tbody.querySelectorAll('tr'));
            if (window.__DEBUG) console.log('MBOM FILTER', inputId, q, rows.length);
            rows.forEach(r => {
                if(r.classList && r.classList.contains('group-header')) return;
                const tds = Array.from(r.querySelectorAll('td'));
                if(tds.length === 0) return;
                const text = tds.map(td=>td.textContent.trim().toLowerCase()).join(' ');
                const match = q === '' ? true : (text.indexOf(q) !== -1);
                r.style.display = match ? '' : 'none';
                const next = r.nextElementSibling;
                if(next && next.querySelector('td') && next.querySelector('td').hasAttribute('colspan')){
                    next.style.display = match ? '' : 'none';
                }
            });
            const groupColAttr = table.getAttribute('data-group-col');
            const groupingActive = groupColAttr && groupColAttr !== 'none';
            if(groupingActive){
                try{ groupTable(tableId); }catch(e){ if(window.__DEBUG) console.error('groupTable error', e); }
                try{ applyCurrentSort(tableId); }catch(e){ if(window.__DEBUG) console.error('applyCurrentSort error', e); }
            } else {
                clearGroupHeaders(tableId);
            }
            try{ refreshSortIndicators(tableId); }catch(e){}
        }catch(err){ if(window.__DEBUG) console.error('MBOM filter handler error', err); }
    });
    try{
        input.addEventListener('keyup', function(){ input.dispatchEvent(new Event('input')); });
        input.addEventListener('change', function(){ input.dispatchEvent(new Event('input')); });
        input.addEventListener('paste', function(){ setTimeout(function(){ input.dispatchEvent(new Event('input')); }, 0); });
    }catch(e){ if(window.__DEBUG) console.warn('setupFilter: additional listeners failed', e); }
    const clearBtn = opts && opts.clearFilterId ? document.getElementById(opts.clearFilterId) : null;
    if(clearBtn){
        clearBtn.addEventListener('click', function(){
            input.value = '';
            input.dispatchEvent(new Event('input'));
            if(opts && opts.groupSelectId){
                const sel = document.getElementById(opts.groupSelectId);
                if(sel){ sel.value = 'none'; if(typeof opts.applyGrouping === 'function') opts.applyGrouping(); }
            }
        });
    }
}

// Apply grouping for a specific table using a select element (map should be provided if needed)
function applyGroupingFor(tableId, selId, map){
    const sel = selId ? document.getElementById(selId) : null;
    const table = document.getElementById(tableId);
    if(!table) return;
    const val = sel ? sel.value : null;
    if(!sel || val === 'none' || val === null){
        table.setAttribute('data-group-col', 'none');
        const f = document.getElementById((tableId==='breakersTable'?'brkFilter':(tableId==='itemsTable'?'itemFilter':'')));
        if(f) f.dispatchEvent(new Event('input'));
        try{ clearSortIndicators(tableId); }catch(e){}
        return;
    }
    const idx = map && map[val] !== undefined ? map[val] : 2;
    table.setAttribute('data-group-col', idx);
    const f = document.getElementById((tableId==='breakersTable'?'brkFilter':(tableId==='itemsTable'?'itemFilter':'')));
    if(f) f.dispatchEvent(new Event('input'));
    try{ clearSortIndicators(tableId); }catch(e){}
}

// Initialization entry point: pass an array of table configs
// config: {tableId, filterId, clearFilterId, groupSelectId, groupMap, defaultGroup}
function mbomInit(configs){
    if(!Array.isArray(configs)) return;
    configs.forEach(cfg=>{
        try{ annotateOriginalOrder(cfg.tableId); }catch(e){}
    });
    configs.forEach(cfg=>{
        try{
            if(cfg.defaultGroup !== undefined){
                const table = document.getElementById(cfg.tableId);
                if(table) table.setAttribute('data-group-col', String(cfg.defaultGroup));
            }
            try{ groupTable(cfg.tableId); }catch(e){}
            try{ setupFilter(cfg.filterId, cfg.tableId, {clearFilterId: cfg.clearFilterId, groupSelectId: cfg.groupSelectId, applyGrouping: function(){ applyGroupingFor(cfg.tableId, cfg.groupSelectId, cfg.groupMap); }}); }catch(e){}
            try{ makeHeadersSortable(cfg.tableId, {filterId: cfg.filterId}); }catch(e){}
            if(cfg.groupSelectId){
                const sel = document.getElementById(cfg.groupSelectId);
                if(sel){
                    sel.addEventListener('change', function(){ applyGroupingFor(cfg.tableId, cfg.groupSelectId, cfg.groupMap); });
                    if(!sel.value) sel.value = 'none';
                    applyGroupingFor(cfg.tableId, cfg.groupSelectId, cfg.groupMap);
                }
            }
        }catch(e){}
    });
    window.__mbomGroupTables = function(){ try{ configs.forEach(cfg=>{ groupTable(cfg.tableId); makeHeadersSortable(cfg.tableId, {filterId: cfg.filterId}); }); }catch(e){} };
}

// expose init globally
window.mbomInit = mbomInit;

})(window);
