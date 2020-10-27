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
$('#mfgList').hide();

$('#itemSelect2').change(function() {
    var parent = $(this);

    var visibleOptions1 = $('#mfgSelect2 option').hide().filter(function() {
        return $(this).data('parent') == parent.val();
    }).show();

    if(parent.val() == 'OTHER') {
        $('#otherItemType').show();
        $('#mfgList').show();
        $('#otherMfgType').show();
        $('#mfgList').change();
        $('#mfgSelect2').hide();
    }

    if(visibleOptions1.length) {
        visibleOptions1.eq(0).prop('selected', true);
    }
    else
        $('#mfgSelect2').val('');
    $('#mfgSelect2').change();
}).change();

//OTHER item type text box
$('#itemSelect2').change(function() {
    var selected = $(this).val();
    if (selected == 'OTHER') {
        $('#otherItemType').show();
        $('#mfgList').show();
        $('#mfgList').change();
        $('#mfgSelect2').hide();
    }
    else {
        $('#otherItemType').hide();
        $('#mfgList').hide();
        $('#mfgSelect2').show();
    }
});

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