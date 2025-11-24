/************************************************************
 COMMON ITEM SECTION
 ************************************************************/
$('#itemSelect').change(function() {
    var parent = $(this);

    var visibleOptions1 = $('#mfgSelect option').hide().filter(function() {
        return $(this).data('parent') == parent.val();
    }).show();

    if(visibleOptions1.length)
        visibleOptions1.eq(0).prop('selected', true);
    else
        $('#mfgSelect').val('');
    $('#mfgSelect').change();
}).change();


$('#mfgSelect').change(function() {
    var parent = $(this);

    var visibleOptions = $('#descSelect option').hide().filter(function() {
        return $(this).data('parent') == parent.val();
    }).show();

    if(visibleOptions.length)
        visibleOptions.eq(0).prop('selected', true);
    else
        $('#descSelect').val('');
    $('#descSelect').change();
}).change();

$('#descSelect').change(function() {
    var parent = $(this);

    var visibleOptions = $('#pnSelect option').hide().filter(function() {
        return $(this).data('parent') == parent.val();
    }).show();
    if(visibleOptions.length) {
        visibleOptions.eq(0).prop('selected', true);
    } else {
        $('#pnSelect').val('');
    }
}).change();

/************************************************************
 USER DEFINED SECTION
 ************************************************************/
// Ensure MFG data is loaded from server-rendered hidden element if window variables are not present
if (typeof window.MFG_BY_TYPE === 'undefined') {
    var $mfgDataElem = $('#mfg-data');
    if ($mfgDataElem.length) {
        try {
            window.MFG_BY_TYPE = JSON.parse($mfgDataElem.attr('data-mfg'));
        } catch (e) {
            window.MFG_BY_TYPE = {};
        }
        try {
            window.CURRENT_MFG = JSON.parse($mfgDataElem.attr('data-current'));
        } catch (e) {
            window.CURRENT_MFG = { type: '', mfg: '' };
        }
    }
}

// Show single manufacturer list and filter options by selected item type
$('#mfgList').show();

$('#itemSelect2').change(function() {
    var selectedType = $(this).val();
    // Rebuild options from window.MFG_BY_TYPE to avoid Select2 showing hidden options
    var $mfg = $('#mfgList');
    $mfg.empty();
    $mfg.append($('<option>', { value: '', text: 'Select' }));

    if (selectedType && selectedType !== 'OTHER' && window.MFG_BY_TYPE && window.MFG_BY_TYPE[selectedType]) {
        var list = window.MFG_BY_TYPE[selectedType];
        for (var i = 0; i < list.length; i++) {
            $mfg.append($('<option>', { 'data-parent': selectedType, value: list[i], text: list[i] }));
        }
        $mfg.append($('<option>', { 'data-parent': selectedType, value: 'OTHER', text: 'OTHER' }));

        // preselect existing if it matches
        if (window.CURRENT_MFG && window.CURRENT_MFG.type === selectedType && window.CURRENT_MFG.mfg) {
            $mfg.val(window.CURRENT_MFG.mfg);
        } else {
            $mfg.prop('selectedIndex', 0);
        }

        $('#otherMfgType').hide();
        $('#otherItemType').hide();
    } else if (selectedType === 'OTHER') {
        // item type OTHER → allow free-text manufacturer
        $mfg.append($('<option>', { value: 'OTHER', text: 'OTHER' }));
        $mfg.prop('selectedIndex', 1);
        $('#otherItemType').show();
        $('#otherMfgType').show();
    } else {
        // no type selected → keep only placeholder
        $mfg.prop('selectedIndex', 0);
        $('#otherMfgType').hide();
        $('#otherItemType').hide();
    }

    // trigger Select2 to update
    try { $mfg.trigger('change.select2'); } catch (e) { $mfg.trigger('change'); }
}).change();

//OTHER mfg type text box
$('#mfgSelect2').change(function() {
    var selected = $(this).val();
    if (selected == 'OTHER') {
        $('#otherMfgType').show();
    }
    else
        $('#otherMfgType').hide();
});

$('#mfgList').change(function() {
    var selected = $(this).val();
    if (selected == 'OTHER') {
        $('#otherMfgType').show();
    }
    else
        $('#otherMfgType').hide();
});

/************************************************************
 EDIT COM ITEM SECTION
 ************************************************************/
var selCount = 0;

$('#itemEditSelect').change(function() {
    selCount++;
    if(selCount <= 1) {
        var parent = $(this);

        var visibleOptions1 = $('#mfgEditSelect option').hide().filter(function () {
            return $(this).data('parent') == parent.val();
        }).show();

        if (visibleOptions1.length)
            visibleOptions1;
        else
            $('#mfgEditSelect').val('');
        $('#mfgEditSelect').change();
    }
    else {
        var parent = $(this);

        var visibleOptions1 = $('#mfgEditSelect option').hide().filter(function () {
            return $(this).data('parent') == parent.val();
        }).show();

        if (visibleOptions1.length)
            visibleOptions1.eq(0).prop('selected', true);
        else
            $('#mfgEditSelect').val('');
        $('#mfgEditSelect').change();
    }
}).change();

var mfgCount = 0;

$('#mfgEditSelect').change(function() {
    mfgCount++;
    if(mfgCount <= 1) {
        var parent = $(this);

        var visibleOptions = $('#descEditSelect option').hide().filter(function () {
            return $(this).data('parent') == parent.val();
        }).show();

        if (visibleOptions.length)
            visibleOptions;
        else
            $('#descEditSelect').val('');
        $('#descEditSelect').change();
    }
    else{
        var parent = $(this);

        var visibleOptions = $('#descEditSelect option').hide().filter(function () {
            return $(this).data('parent') == parent.val();
        }).show();

        if (visibleOptions.length)
            visibleOptions.eq(0).prop('selected', true);
        else
            $('#descEditSelect').val('');
        $('#descEditSelect').change();
    }
}).change();

$('#descEditSelect').change(function() {
    var parent = $(this);

    var visibleOptions = $('#pnEditSelect option').hide().filter(function() {
        return $(this).data('parent') == parent.val();
    }).show();
    if(visibleOptions.length) {
        visibleOptions.prop('selected', true);
    } else {
        $('#pnEditSelect').val('');
    }
}).change();