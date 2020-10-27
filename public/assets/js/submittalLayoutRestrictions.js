
let restrictionList = [];
let restrictionTypeList = [];
let restrictionValList = [];

let restrictions = document.getElementsByClassName("restriction");

for (let i = 0; i < restrictions.length; i++) {
    restrictionList.push(restrictions[i].value)
}

for (let restriction of restrictionList) {
    let restrictionTypes = document.getElementsByClassName("restrictionType_"+restriction.split('_')[0]+"_"+restriction.split('_')[1]);
    let temp1 = [];
    for (let j = 0; j < restrictionTypes.length; j++) {
        temp1.push(restrictionTypes[j].value);
        let temp2 = [];
        let restrictionVals = document.getElementsByClassName("restrictionVal_"+restriction.split('_')[0]+"_"+restriction.split('_')[1]+"_"+restrictionTypes[j].value);
        for (let k = 0; k < restrictionVals.length; k++) {
            temp2.push(restrictionVals[k].value);
        }
        restrictionValList.push(temp2);
    }
    restrictionTypeList.push(temp1);
}


$(function() {
    let UL_INIT = '';
    $('#ulListing option').each(function() {
        if (this.selected == true) {
            UL_INIT = $(this).attr('value');
        }
    });
    let optionsCount_UL = 0;
    switch (UL_INIT) {
        case "UL891":
            for (let i = 0; i < restrictionList.length; i++) {
                if (restrictionList[i].split("_")[1] == "UL891") {
                    for (let j = 0; j < restrictionTypeList[i].length; j++) {
                        let currentValue = '';
                        let formSelectID = restrictionTypeList[i][j];
                        let formSelectID_edit = restrictionTypeList[i][j]+"_edit";
                        $("#"+formSelectID.toString()+" option").each(function() {
                            if (this.selected == true) {
                                currentValue = $(this).attr('value');
                            }
                        });
                        $("#"+formSelectID_edit.toString()+" option").remove();
                        for (let k = 0; k < restrictionValList[optionsCount_UL].length; k++) {
                            if (restrictionValList[optionsCount_UL][k] == currentValue) {
                                $("#"+formSelectID_edit.toString()).append('<option value="' + restrictionValList[optionsCount_UL][k] + '" selected="selected">' + restrictionValList[optionsCount_UL][k] + '</option>');
                            } else {
                                $("#"+formSelectID_edit.toString()).append('<option value="' + restrictionValList[optionsCount_UL][k] + '">' + restrictionValList[optionsCount_UL][k] + '</option>');
                            }
                        }

                        optionsCount_UL += 1;
                    }
                } else {
                    optionsCount_UL += restrictionTypeList[i].length;
                }
            }
            break;
        case "UL1558":
            for (let i = 0; i < restrictionList.length; i++) {
                if (restrictionList[i].split("_")[1] == "UL1558") {
                    for (let j = 0; j < restrictionTypeList[i].length; j++) {
                        let formSelectID = restrictionTypeList[i][j];
                        let formSelectID_edit = restrictionTypeList[i][j]+"_edit";
                        let currentValue = '';
                        $("#"+formSelectID.toString()+" option").each(function() {
                            if (this.selected == true) {
                                currentValue = $(this).attr('value');
                            }
                        });
                        $("#"+formSelectID_edit.toString()+" option").remove();

                        for (let k = 0; k < restrictionValList[optionsCount_UL].length; k++) {
                            if (restrictionValList[optionsCount_UL][k] == currentValue) {
                                $("#"+formSelectID_edit.toString()).append('<option value="' + restrictionValList[optionsCount_UL][k] + '" selected="selected">' + restrictionValList[optionsCount_UL][k] + '</option>');
                            } else {
                                $("#"+formSelectID_edit.toString()).append('<option value="' + restrictionValList[optionsCount_UL][k] + '">' + restrictionValList[optionsCount_UL][k] + '</option>');
                            }
                        }
                        optionsCount_UL += 1;
                    }
                } else {
                    optionsCount_UL += restrictionTypeList[i].length;
                }
            }
            break;
        case "UL/ANSI":
            for (let i = 0; i < restrictionList.length; i++) {
                if (restrictionList[i].split("_")[1] == "UL/ANSI") {
                    for (let j = 0; j < restrictionTypeList[i].length; j++) {
                        let formSelectID = restrictionTypeList[i][j];
                        let formSelectID_edit = restrictionTypeList[i][j]+"_edit";
                        let currentValue = '';
                        $("#"+formSelectID.toString()+" option").each(function() {
                            if (this.selected == true) {
                                currentValue = $(this).attr('value');
                            }
                        });
                        $("#"+formSelectID_edit.toString()+" option").remove();
                        for (let k = 0; k < restrictionValList[optionsCount_UL].length; k++) {
                            if (restrictionValList[optionsCount_UL][k] == currentValue) {
                                $("#"+formSelectID_edit.toString()).append('<option value="' + restrictionValList[optionsCount_UL][k] + '" selected="selected">' + restrictionValList[optionsCount_UL][k] + '</option>');
                            } else {
                                $("#"+formSelectID_edit.toString()).append('<option value="' + restrictionValList[optionsCount_UL][k] + '">' + restrictionValList[optionsCount_UL][k] + '</option>');
                            }                        }
                        optionsCount_UL += 1;
                    }
                } else {
                    optionsCount_UL += restrictionTypeList[i].length;
                }
            }
            break;
    }


    let ENCLOSURE_INIT = '';
    $('#enclosure option').each(function() {
        if (this.selected == true) {
            ENCLOSURE_INIT = $(this).attr('value');
        }
    });
    let optionsCount_ENC = 0;
    switch (ENCLOSURE_INIT) {
        case "NEMA 1":
            if (UL_INIT == 'UL891') {
                for (let i = 0; i < restrictionList.length; i++) {
                    if (restrictionList[i].split("_")[1] == "NEMA 1") {
                        for (let j = 0; j < restrictionTypeList[i].length; j++) {
                            let formSelectID = restrictionTypeList[i][j];
                            let formSelectID_edit = restrictionTypeList[i][j]+"_edit";
                            let currentValue = '';
                            $("#"+formSelectID.toString()+" option").each(function() {
                                if (this.selected == true) {
                                    currentValue = $(this).attr('value');
                                }
                            });
                            $("#"+formSelectID_edit.toString()+" option").remove();
                            for (let k = 0; k < restrictionValList[optionsCount_ENC].length; k++) {
                                if (restrictionValList[optionsCount_ENC][k] == currentValue) {
                                    $("#"+formSelectID_edit.toString()).append('<option value="' + restrictionValList[optionsCount_ENC][k] + '" selected="selected">' + restrictionValList[optionsCount_ENC][k] + '</option>');
                                } else {
                                    $("#"+formSelectID_edit.toString()).append('<option value="' + restrictionValList[optionsCount_ENC][k] + '">' + restrictionValList[optionsCount_ENC][k] + '</option>');
                                }
                            }
                            optionsCount_ENC += 1;
                        }
                    } else {
                        optionsCount_ENC += restrictionTypeList[i].length;
                    }
                }
            }
            break;
        case "NEMA 3R":
            for (let i = 0; i < restrictionList.length; i++) {
                if (restrictionList[i].split("_")[1] == "NEMA 3R") {
                    for (let j = 0; j < restrictionTypeList[i].length; j++) {
                        let formSelectID = restrictionTypeList[i][j];
                        let formSelectID_edit = restrictionTypeList[i][j]+"_edit";
                        let currentValue = '';
                        $("#"+formSelectID.toString()+" option").each(function() {
                            if (this.selected == true) {
                                currentValue = $(this).attr('value');
                            }
                        });
                        $("#"+formSelectID_edit.toString()+" option").remove();
                        for (let k = 0; k < restrictionValList[optionsCount_ENC].length; k++) {
                            if (restrictionValList[optionsCount_ENC][k] == currentValue) {
                                $("#"+formSelectID_edit.toString()).append('<option value="' + restrictionValList[optionsCount_ENC][k] + '" selected="selected">' + restrictionValList[optionsCount_ENC][k] + '</option>');
                            } else {
                                $("#"+formSelectID_edit.toString()).append('<option value="' + restrictionValList[optionsCount_ENC][k] + '">' + restrictionValList[optionsCount_ENC][k] + '</option>');
                            }
                        }
                        optionsCount_ENC += 1;
                    }
                } else {
                    optionsCount_ENC += restrictionTypeList[i].length;
                }
            }
            break;
    }
});

let UL = '';
$('#ulListing').change(function() {
    let selectedUL = '';
    $('#ulListing option').each(function() {
        if (this.selected == true) {
            selectedUL = $(this).attr('value');
            UL = $(this).attr('value');
        }
    });
    let optionsCount = 0;
    switch (selectedUL) {
        case "UL891":
            for (let i = 0; i < restrictionList.length; i++) {
                if (restrictionList[i].split("_")[1] == "UL891") {
                    for (let j = 0; j < restrictionTypeList[i].length; j++) {
                       let formSelectID = restrictionTypeList[i][j];
                       $("#"+formSelectID.toString()+" option").remove();
                       for (let k = 0; k < restrictionValList[optionsCount].length; k++) {
                           $("#"+formSelectID.toString()).append('<option value="' + restrictionValList[optionsCount][k] + '">' + restrictionValList[optionsCount][k] + '</option>');
                       }
                        optionsCount += 1;
                    }
                } else {
                    optionsCount += restrictionTypeList[i].length;
                }
            }
            break;
        case "UL1558":
            for (let i = 0; i < restrictionList.length; i++) {
                if (restrictionList[i].split("_")[1] == "UL1558") {
                    for (let j = 0; j < restrictionTypeList[i].length; j++) {
                        let formSelectID = restrictionTypeList[i][j];
                        $("#"+formSelectID.toString()+" option").remove();
                        for (let k = 0; k < restrictionValList[optionsCount].length; k++) {
                            $("#"+formSelectID.toString()).append('<option value="' + restrictionValList[optionsCount][k] + '">' + restrictionValList[optionsCount][k] + '</option>');
                        }
                        optionsCount += 1;
                    }
                } else {
                    optionsCount += restrictionTypeList[i].length;
                }
            }
            break;
        case "UL/ANSI":
            for (let i = 0; i < restrictionList.length; i++) {
                if (restrictionList[i].split("_")[1] == "UL/ANSI") {
                    for (let j = 0; j < restrictionTypeList[i].length; j++) {
                        let formSelectID = restrictionTypeList[i][j];
                        $("#"+formSelectID.toString()+" option").remove();
                        for (let k = 0; k < restrictionValList[optionsCount].length; k++) {
                            $("#"+formSelectID.toString()).append('<option value="' + restrictionValList[optionsCount][k] + '">' + restrictionValList[optionsCount][k] + '</option>');
                        }
                        optionsCount += 1;
                    }
                } else {
                    optionsCount += restrictionTypeList[i].length;
                }
            }
            break;
    }
});

let ENCLOSURE = '';
$('#enclosure').change(function() {
    let selectedEnclosure = '';
    $('#enclosure option').each(function() {
        if (this.selected == true) {
            selectedEnclosure = $(this).attr('value');
            ENCLOSURE = $(this).attr('value');
        }
    });
    let optionsCount = 0;
    switch (selectedEnclosure) {
        case "NEMA 1":
            if (UL == 'UL891') {
                for (let i = 0; i < restrictionList.length; i++) {
                    if (restrictionList[i].split("_")[1] == "NEMA 1") {
                        for (let j = 0; j < restrictionTypeList[i].length; j++) {
                            let formSelectID = restrictionTypeList[i][j];
                            $("#"+formSelectID.toString()+" option").remove();
                            for (let k = 0; k < restrictionValList[optionsCount].length; k++) {
                                $("#"+formSelectID.toString()).append('<option value="' + restrictionValList[optionsCount][k] + '">' + restrictionValList[optionsCount][k] + '</option>');
                            }
                            optionsCount += 1;
                        }
                    } else {
                        optionsCount += restrictionTypeList[i].length;
                    }
                }
            }
            break;
        case "NEMA 3R":
            for (let i = 0; i < restrictionList.length; i++) {
                if (restrictionList[i].split("_")[1] == "NEMA 3R") {
                    for (let j = 0; j < restrictionTypeList[i].length; j++) {
                        let formSelectID = restrictionTypeList[i][j];
                        $("#"+formSelectID.toString()+" option").remove();
                        for (let k = 0; k < restrictionValList[optionsCount].length; k++) {
                            $("#"+formSelectID.toString()).append("<option value="+restrictionValList[optionsCount][k]+">"+restrictionValList[optionsCount][k]+"</option>");
                        }
                        optionsCount += 1;
                    }
                } else {
                    optionsCount += restrictionTypeList[i].length;
                }
            }
            break;
    }

});

let EDIT_UL = '';
$('#ulListing_edit').change(function() {
    let selectedUL = '';
    $('#ulListing_edit option').each(function() {
        if (this.selected == true) {
            selectedUL = $(this).attr('value');
            EDIT_UL = $(this).attr('value');
        }
    });
    let optionsCount = 0;
    switch (selectedUL) {
        case "UL891":
            for (let i = 0; i < restrictionList.length; i++) {
                if (restrictionList[i].split("_")[1] == "UL891") {
                    for (let j = 0; j < restrictionTypeList[i].length; j++) {
                        let formSelectID = restrictionTypeList[i][j]+"_edit";
                        let currentValue = '';
                        $("#"+formSelectID.toString()+" option").each(function() {
                            if (this.selected == true) {
                                currentValue = $(this).attr('value');
                            }
                            $(this).remove();
                        });
                        for (let k = 0; k < restrictionValList[optionsCount].length; k++) {
                            if (restrictionValList[optionsCount][k] == currentValue) {
                                $("#"+formSelectID.toString()).append('<option value="' + restrictionValList[optionsCount][k] + '" selected="selected">' + restrictionValList[optionsCount][k] + '</option>');
                            } else {
                                $("#"+formSelectID.toString()).append('<option value="' + restrictionValList[optionsCount][k] + '">' + restrictionValList[optionsCount][k] + '</option>');
                            }
                        }
                        optionsCount += 1;
                    }
                } else {
                    optionsCount += restrictionTypeList[i].length;
                }
            }
            break;
        case "UL1558":
            for (let i = 0; i < restrictionList.length; i++) {
                if (restrictionList[i].split("_")[1] == "UL1558") {
                    for (let j = 0; j < restrictionTypeList[i].length; j++) {
                        let formSelectID = restrictionTypeList[i][j]+"_edit";
                        $("#"+formSelectID.toString()+" option").remove();
                        for (let k = 0; k < restrictionValList[optionsCount].length; k++) {
                            $("#"+formSelectID.toString()).append('<option value="' + restrictionValList[optionsCount][k] + '">' + restrictionValList[optionsCount][k] + '</option>');
                        }
                        optionsCount += 1;
                    }
                } else {
                    optionsCount += restrictionTypeList[i].length;
                }
            }
            break;
        case "UL/ANSI":
            for (let i = 0; i < restrictionList.length; i++) {
                if (restrictionList[i].split("_")[1] == "UL/ANSI") {
                    for (let j = 0; j < restrictionTypeList[i].length; j++) {
                        let formSelectID = restrictionTypeList[i][j]+"_edit";
                        $("#"+formSelectID.toString()+" option").remove();
                        for (let k = 0; k < restrictionValList[optionsCount].length; k++) {
                            $("#"+formSelectID.toString()).append('<option value="' + restrictionValList[optionsCount][k] + '">' + restrictionValList[optionsCount][k] + '</option>');
                        }
                        optionsCount += 1;
                    }
                } else {
                    optionsCount += restrictionTypeList[i].length;
                }
            }
            break;
    }
});

let EDIT_ENCLOSURE = '';
$('#enclosure_edit').change(function() {
    let selectedEnclosure = '';
    $('#enclosure_edit option').each(function() {
        if (this.selected == true) {
            selectedEnclosure = $(this).attr('value');
            EDIT_ENCLOSURE = $(this).attr('value');
        }
    });
    let optionsCount = 0;
    switch (selectedEnclosure) {
        case "NEMA 1":
            if (EDIT_UL == 'UL891') {
                for (let i = 0; i < restrictionList.length; i++) {
                    if (restrictionList[i].split("_")[1] == "NEMA 1") {
                        for (let j = 0; j < restrictionTypeList[i].length; j++) {
                            let formSelectID = restrictionTypeList[i][j]+"_edit";
                            $("#"+formSelectID.toString()+" option").remove();
                            for (let k = 0; k < restrictionValList[optionsCount].length; k++) {
                                $("#"+formSelectID.toString()).append('<option value="' + restrictionValList[optionsCount][k] + '">' + restrictionValList[optionsCount][k] + '</option>');
                            }
                            optionsCount += 1;
                        }
                    } else {
                        optionsCount += restrictionTypeList[i].length;
                    }
                }
            }
            break;
        case "NEMA 3R":
            for (let i = 0; i < restrictionList.length; i++) {
                if (restrictionList[i].split("_")[1] == "NEMA 3R") {
                    for (let j = 0; j < restrictionTypeList[i].length; j++) {
                        let formSelectID = restrictionTypeList[i][j]+"_edit";
                        $("#"+formSelectID.toString()+" option").remove();
                        for (let k = 0; k < restrictionValList[optionsCount].length; k++) {
                            $("#"+formSelectID.toString()).append("<option value="+restrictionValList[optionsCount][k]+">"+restrictionValList[optionsCount][k]+"</option>");
                            console.log(restrictionValList[optionsCount][k]);
                        }
                        optionsCount += 1;
                    }
                } else {
                    optionsCount += restrictionTypeList[i].length;
                }
            }
            break;
    }

});

$('#paint').change(function() {
    $('#paint option').each(function() {
        if (this.selected == true) {
            if (this.value == 'OTHER') {
              $('#paintCustom').css("display", "block")
            } else {
            $('#paintCustom').attr('value', '');
            $('#paintCustom').css("display", "none")
            }
        }
    });
});


$('#paint_edit').change(function() {
    $('#paint_edit option').each(function() {
        if (this.selected == true) {
            if (this.value == 'OTHER') {
                $('#paintCustom_edit').css("display", "block")
            } else {
                $('#paintCustom_edit').attr('value', '');
                $('#paintCustom_edit').css("display", "none")
            }
        }
    });
});
