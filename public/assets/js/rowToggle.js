(function(window){
'use strict';

function setVisibility(rowEl, visible){
    if(!rowEl) return;
    if(visible){
        rowEl.classList.remove('d-none');
        rowEl.style.display = '';
    } else {
        rowEl.classList.add('d-none');
        rowEl.style.display = 'none';
    }
}

function setupFilterToggle(btnId, rowId, opts){
    opts = opts || {};
    var storageBase = opts.storageKey || ('mbom.filter.' + btnId);
    function currentStorageKey(){
        try{
            var mbomEl = document.getElementById('mbomID');
            if(mbomEl && mbomEl.value){ return storageBase + '.' + String(mbomEl.value); }
        }catch(e){}
        return storageBase;
    }
    // remove other MBOM-specific keys for this control when we have a concrete mbomID
    function clearOtherMbomKeys(){
        try{
            var mbomEl = document.getElementById('mbomID');
            if(!mbomEl || !mbomEl.value) return;
            var cur = String(mbomEl.value);
            var prefix = storageBase + '.';
            for(var i=localStorage.length-1;i>=0;i--){
                var k = localStorage.key(i);
                if(!k) continue;
                if(k.indexOf(prefix) === 0){
                    var suffix = k.substring(prefix.length);
                    if(suffix !== cur){
                        try{ localStorage.removeItem(k); }catch(e){}
                    }
                }
            }
        }catch(e){/*ignore*/}
    }
    var btn = document.getElementById(btnId);
    var row = document.getElementById(rowId);
    if(!btn || !row){
        document.addEventListener('DOMContentLoaded', function(){ setupFilterToggle(btnId, rowId, opts); });
        return;
    }

    // Determine initial visibility: prefer persisted value if available
        try{
            var stored = null;
            try{ stored = localStorage.getItem(currentStorageKey()); }catch(e){ stored = null; }
            // when loading a specific MBOM, clear old MBOM-specific keys for this control
            try{ clearOtherMbomKeys(); }catch(e){}
            if(stored === 'true' || stored === 'false'){
                var visible = (stored === 'true');
                setVisibility(row, visible);
                btn.setAttribute('aria-pressed', visible ? 'true' : 'false');
                btn.title = visible ? (opts.hideTitle || 'Hide Filter Options') : (opts.showTitle || 'Show Filter Options');
            } else if(opts.initialHidden === true){
                setVisibility(row, false);
                btn.setAttribute('aria-pressed', 'false');
                btn.title = opts.showTitle || 'Show Filter Options';
            } else {
                try{
                    const cs = window.getComputedStyle(row);
                    const visible = cs && cs.display !== 'none' && !row.classList.contains('d-none');
                    setVisibility(row, visible);
                    btn.setAttribute('aria-pressed', visible ? 'true' : 'false');
                    btn.title = visible ? (opts.hideTitle || 'Hide Filter Options') : (opts.showTitle || 'Show Filter Options');
                }catch(e){
                    setVisibility(row, false);
                    btn.setAttribute('aria-pressed','false');
                    btn.title = opts.showTitle || 'Show Filter Options';
                }
            }
        }catch(e){ /* ignore storage errors */ }

    btn.addEventListener('click', function(){
        try{
            const cs = window.getComputedStyle(row);
            const currentlyVisible = cs && cs.display !== 'none' && !row.classList.contains('d-none');
            const willShow = !currentlyVisible;
            setVisibility(row, willShow);
            btn.setAttribute('aria-pressed', willShow ? 'true' : 'false');
            btn.title = willShow ? (opts.hideTitle || 'Hide Filter Options') : (opts.showTitle || 'Show Filter Options');

            try{ localStorage.setItem(currentStorageKey(), willShow ? 'true' : 'false'); }catch(e){/*ignore*/}

            if(window.jQuery){
                try{
                    const $btn = jQuery(btn);
                    if($btn.data('bs.tooltip')){
                        $btn.tooltip('hide');
                        $btn.attr('data-original-title', btn.title);
                    }
                }catch(e){/*ignore*/}
            }
        }catch(e){/*ignore*/}
    });
}

// expose globally
window.setupFilterToggle = setupFilterToggle;

})(window);
