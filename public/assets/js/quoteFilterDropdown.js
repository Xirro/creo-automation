//for add layout table
$('#layoutTypeSelect').change(function() {
    var parent = $(this);

    //FOR UL LISTING
    var ulVisibleOptions = $('#layoutULSelect option').hide().filter(function() {
        return $(this).data('parent') == parent.val();
    }).show();

    if(ulVisibleOptions.length)
        ulVisibleOptions.eq(0).prop('selected', true);
    else
        $('#layoutULSelect').val('');
    $('#layoutULSelect').change();

    //FOR SYSTEM TYPE
    var systemVisibleOptions = $('#layoutSystemSelect option').hide().filter(function() {
        return $(this).data('parent') == parent.val();
    }).show();

    if(systemVisibleOptions.length)
        systemVisibleOptions.eq(0).prop('selected', true);
    else
        $('#layoutSystemSelect').val('');
    $('#layoutSystemSelect').change();

    //FOR SYSTEM AMP
    var systemAmpVisibleOptions = $('#layoutSystemAmpSelect option').hide().filter(function() {
        return $(this).data('parent') == parent.val();
    }).show();

    if(systemAmpVisibleOptions.length)
        systemAmpVisibleOptions.eq(0).prop('selected', true);
    else
        $('#layoutSystemAmpSelect').val('');
    $('#layoutSystemAmpSelect').change();

    //FOR MAIN BUS AMP
    var mainBusAmpVisibleOptions = $('#layoutMainBusAmpSelect option').hide().filter(function() {
        return $(this).data('parent') == parent.val();
    }).show();

    if(mainBusAmpVisibleOptions.length)
        mainBusAmpVisibleOptions.eq(0).prop('selected', true);
    else
        $('#layoutMainBusAmpSelect').val('');
    $('#layoutMainBusAmpSelect').change();

    //FOR BUS BRACING
    var busBracingVisibleOptions = $('#layoutBusBracingSelect option').hide().filter(function() {
        return $(this).data('parent') == parent.val();
    }).show();

    if(busBracingVisibleOptions.length)
        busBracingVisibleOptions.eq(0).prop('selected', true);
    else
        $('#layoutBusBracingSelect').val('');
    $('#layoutBusBracingSelect').change();

    //FOR KAIC RATING
    var kAICRatingVisibleOptions = $('#layoutkAICRatingSelect option').hide().filter(function() {
        return $(this).data('parent') == parent.val();
    }).show();

    if(kAICRatingVisibleOptions.length)
        kAICRatingVisibleOptions.eq(0).prop('selected', true);
    else
        $('#layoutkAICRatingSelect').val('');
    $('#layoutkAICRatingSelect').change();

}).change();



//for edit layout table
$('#editLayoutTypeSelect').change(function() {
    var parent = $(this);

    //FOR UL LISTING
    var ulVisibleOptions2 = $('#editLayoutULSelect option').hide().filter(function() {
        return $(this).data('parent') == parent.val();
    }).show();

    if(ulVisibleOptions2.length)
        ulVisibleOptions2.eq(0).prop('selected', true);
    else
        $('#editLayoutULSelect').val('');
    $('#editLayoutULSelect').change();

    //FOR SYSTEM TYPE
    var systemVisibleOptions2 = $('#editLayoutSystemSelect option').hide().filter(function() {
        return $(this).data('parent') == parent.val();
    }).show();

    if(systemVisibleOptions2.length)
        systemVisibleOptions2.eq(0).prop('selected', true);
    else
        $('#editLayoutSystemSelect').val('');
    $('#editLayoutSystemSelect').change();

    //FOR SYSTEM AMP
    var systemAmpVisibleOptions2 = $('#editLayoutSystemAmpSelect option').hide().filter(function() {
        return $(this).data('parent') == parent.val();
    }).show();

    if(systemAmpVisibleOptions2.length)
        systemAmpVisibleOptions2.eq(0).prop('selected', true);
    else
        $('#editLayoutSystemAmpSelect').val('');
    $('#editLayoutSystemAmpSelect').change();

    //FOR MAIN BUS AMP
    var mainBusAmpVisibleOptions2 = $('#editLayoutMainBusAmpSelect option').hide().filter(function() {
        return $(this).data('parent') == parent.val();
    }).show();

    if(mainBusAmpVisibleOptions2.length)
        mainBusAmpVisibleOptions2.eq(0).prop('selected', true);
    else
        $('#editLayoutMainBusAmpSelect').val('');
    $('#editLayoutMainBusAmpSelect').change();

    //FOR BUS BRACING
    var busBracingVisibleOptions2 = $('#editLayoutBusBracingSelect option').hide().filter(function() {
        return $(this).data('parent') == parent.val();
    }).show();

    if(busBracingVisibleOptions2.length)
        busBracingVisibleOptions2.eq(0).prop('selected', true);
    else
        $('#editLayoutBusBracingSelect').val('');
    $('#editLayoutBusBracingSelect').change();

    //FOR KAIC RATING
    var kAICRatingVisibleOptions2 = $('#editLayoutkAICRatingSelect option').hide().filter(function() {
        return $(this).data('parent') == parent.val();
    }).show();

    if(kAICRatingVisibleOptions2.length)
        kAICRatingVisibleOptions2.eq(0).prop('selected', true);
    else
        $('#editLayoutkAICRatingSelect').val('');
    $('#editLayoutkAICRatingSelect').change();

}).change();