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
    var btn = document.getElementById(btnId);
    var row = document.getElementById(rowId);
    if(!btn || !row){
        document.addEventListener('DOMContentLoaded', function(){ setupFilterToggle(btnId, rowId, opts); });
        return;
    }

    if(opts.initialHidden === true){
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

    btn.addEventListener('click', function(){
        try{
            const cs = window.getComputedStyle(row);
            const currentlyVisible = cs && cs.display !== 'none' && !row.classList.contains('d-none');
            const willShow = !currentlyVisible;
            setVisibility(row, willShow);
            btn.setAttribute('aria-pressed', willShow ? 'true' : 'false');
            btn.title = willShow ? (opts.hideTitle || 'Hide Filter Options') : (opts.showTitle || 'Show Filter Options');

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
