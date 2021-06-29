$(document).ready(function() {

    let asmCount = $('#renameAsmCount').val();
    let partCount = $('#renamePartCount').val();
    let $projectNum = $('#PROJECT_NUMBER');

    $projectNum.change(function() {
        for (let i = 0; i < asmCount; i++) {
            let projectNum = $('#PROJECT_NUMBER').val();
            let id = (i+1).toString();
            let categoryAsm = $('#categoryAsm_' + id).val();
            let groupAsm = $('#groupAsm_' + id).val();
            let offsetAsm = $('#offsetAsm_' + id).val();
            let endPN;
            let endDigits;
            if(parseInt(groupAsm) + parseInt(offsetAsm) == 0) {
                endPN = '000';
            } else if(parseInt(groupAsm) + parseInt(offsetAsm) < 10) {
                endDigits = parseInt(groupAsm) + parseInt(offsetAsm);
                endPN = '00' + endDigits;
            } else if(parseInt(groupAsm) + parseInt(offsetAsm) < 100) {
                endDigits = parseInt(groupAsm) + parseInt(offsetAsm);
                endPN = '0' + endDigits;
            } else {
                endDigits = parseInt(groupAsm) + parseInt(offsetAsm);
                endPN = (endDigits).toString();
            }
            $('#newNameAsm_' + id).val(projectNum + "-" +categoryAsm + "-" + endPN);




            $('#categoryAsm_' + id).change(function(){
                let projectNum = $('#PROJECT_NUMBER').val();
                let categoryAsm = $('#categoryAsm_' + id).val();
                let groupAsm = $('#groupAsm_' + id).val();
                let offsetAsm = $('#offsetAsm_' + id).val();
                let endPN;
                let endDigits;
                if(parseInt(groupAsm) + parseInt(offsetAsm) == 0) {
                    endPN = '000';
                } else if(parseInt(groupAsm) + parseInt(offsetAsm) < 10) {
                    endDigits = parseInt(groupAsm) + parseInt(offsetAsm);
                    endPN = '00' + endDigits;
                } else if(parseInt(groupAsm) + parseInt(offsetAsm) < 100) {
                    endDigits = parseInt(groupAsm) + parseInt(offsetAsm);
                    endPN = '0' + endDigits;
                } else {
                    endDigits = parseInt(groupAsm) + parseInt(offsetAsm);
                    endPN = (endDigits).toString();
                }
                $('#newNameAsm_' + id).val(projectNum + "-" +categoryAsm + "-" + endPN);

                for (let j = 1; j < asmCount - i; j++) {
                    let next_id = (i+j+1).toString();
                    if ($('#categoryAsm_' + next_id).hasClass('instance') == true) {
                        let oldName = $('#newNameAsm_' + next_id).val();
                        $('#newNameAsm_' + next_id).val(projectNum + "-" +categoryAsm + oldName.slice(oldName.length-4,oldName.length));
                        $('#categoryAsm_' + next_id).val(categoryAsm);
                    }
                    else {
                        break;
                    }
                }

            });

            $('#groupAsm_' + id).change(function(){
                let projectNum = $('#PROJECT_NUMBER').val();
                let categoryAsm = $('#categoryAsm_' + id).val();
                let groupAsm = $('#groupAsm_' + id).val();
                let offsetAsm = $('#offsetAsm_' + id).val();
                let endPN;
                let endDigits;
                if(parseInt(groupAsm) + parseInt(offsetAsm) == 0) {
                    endPN = '000';
                } else if(parseInt(groupAsm) + parseInt(offsetAsm) < 10) {
                    endDigits = parseInt(groupAsm) + parseInt(offsetAsm);
                    endPN = '00' + endDigits;
                } else if(parseInt(groupAsm) + parseInt(offsetAsm) < 100) {
                    endDigits = parseInt(groupAsm) + parseInt(offsetAsm);
                    endPN = '0' + endDigits;
                } else {
                    endDigits = parseInt(groupAsm) + parseInt(offsetAsm);
                    endPN = (endDigits).toString();
                }
                $('#newNameAsm_' + id).val(projectNum + "-" +categoryAsm + "-" + endPN);

                for (let j = 1; j < asmCount - i; j++) {
                    let next_id = (i+j+1).toString();
                    if ($('#groupAsm_' + next_id).hasClass('instance') == true) {
                        $('#groupAsm_' + next_id).val(groupAsm);
                        let offsetNext = $('#offsetAsm_' + next_id).val();
                        let endPNNext;
                        let endDigitsNext;
                        if (parseInt(groupAsm) + parseInt(offsetNext) == 0) {
                            endPNNext = '000';
                        } else if (parseInt(groupAsm) + parseInt(offsetNext) < 10) {
                            endDigitsNext = parseInt(groupAsm) + parseInt(offsetNext);
                            endPNNext = '00' + endDigitsNext;
                        } else if (parseInt(groupAsm) + parseInt(offsetNext) < 100) {
                            endDigitsNext = parseInt(groupAsm) + parseInt(offsetNext);
                            endPNNext = '0' + endDigitsNext;
                        } else {
                            endDigitsNext = parseInt(groupAsm) + parseInt(offsetNext);
                            endPNNext = endDigitsNext.toString();
                        }
                        $('#newNameAsm_' + next_id).val(projectNum + "-" + categoryAsm + "-" + endPNNext);
                    }
                    else {
                        break;
                    }
                }

            });

            $('#offsetAsm_' + id).change(function(){
                let projectNum = $('#PROJECT_NUMBER').val();
                let categoryAsm = $('#categoryAsm_' + id).val();
                let groupAsm = $('#groupAsm_' + id).val();
                let offsetAsm = $('#offsetAsm_' + id).val();
                let endPN;
                let endDigits;
                if(parseInt(groupAsm) + parseInt(offsetAsm) == 0) {
                    endPN = '000';
                } else if(parseInt(groupAsm) + parseInt(offsetAsm) < 10) {
                    endDigits = parseInt(groupAsm) + parseInt(offsetAsm);
                    endPN = '00' + endDigits;
                } else if(parseInt(groupAsm) + parseInt(offsetAsm) < 100) {
                    endDigits = parseInt(groupAsm) + parseInt(offsetAsm);
                    endPN = '0' + endDigits;
                } else {
                    endDigits = parseInt(groupAsm) + parseInt(offsetAsm);
                    endPN = (endDigits).toString();
                }
                $('#newNameAsm_' + id).val(projectNum + "-" +categoryAsm + "-" + endPN);
            });


        };

        for (let i = 0; i < partCount; i++) {
            let id = (i+1).toString();
            let categoryPart = $('#categoryPart_' + id).val();
            let groupPart = $('#groupPart_' + id).val();
            let offsetPart = $('#offsetPart_' + id).val();
            let currentFlatNamePart = $("#currentFlatNamePart_" + id).val();
            let endPN;
            let endDigits;

            let projectNum = $('#PROJECT_NUMBER').val();
            if(parseInt(groupPart) + parseInt(offsetPart) == 0) {
                endPN = '000';
            } else if(parseInt(groupPart) + parseInt(offsetPart) < 10) {
                endDigits = parseInt(groupPart) + parseInt(offsetPart);
                endPN = '00' + endDigits;
            } else if(parseInt(groupPart) + parseInt(offsetPart) < 100) {
                endDigits = parseInt(groupPart) + parseInt(offsetPart);
                endPN = '0' + endDigits;
            } else {
                endDigits = parseInt(groupPart) + parseInt(offsetPart);
                endPN = (endDigits).toString();
            }
            $('#newNamePart_' + id).val(projectNum + "-" +categoryPart + "-" + endPN);

            if (currentFlatNamePart != '') {
                $('#newFlatNamePart_' + id).val(projectNum + "-" +categoryPart + "-" + endPN + '-FLAT');
            }

            $('#categoryPart_' + id).change(function(){
                let categoryPart = $('#categoryPart_' + id).val();
                let groupPart = $('#groupPart_' + id).val();
                let offsetPart = $('#offsetPart_' + id).val();
                let currentFlatNamePart = $("#currentFlatNamePart_" + id).val();
                let endPN;
                let endDigits;
                let projectNum = $('#PROJECT_NUMBER').val();
                if(parseInt(groupPart) + parseInt(offsetPart) == 0) {
                    endPN = '000';
                } else if(parseInt(groupPart) + parseInt(offsetPart) < 10) {
                    endDigits = parseInt(groupPart) + parseInt(offsetPart);
                    endPN = '00' + endDigits;
                } else if(parseInt(groupPart) + parseInt(offsetPart) < 100) {
                    endDigits = parseInt(groupPart) + parseInt(offsetPart);
                    endPN = '0' + endDigits;
                } else {
                    endDigits = parseInt(groupPart) + parseInt(offsetPart);
                    endPN = (endDigits).toString();
                }
                $('#newNamePart_' + id).val(projectNum + "-" +categoryPart + "-" + endPN);
                if (currentFlatNamePart != '') {
                    $('#newFlatNamePart_' + id).val(projectNum + "-" +categoryPart + "-" + endPN + '-FLAT');
                }
                for (let j = 1; j < partCount - i; j++) {
                    let next_id = (i+j+1).toString();
                    if ($('#categoryPart_' + next_id).hasClass('instance') == true) {
                        $('#categoryPart_' + next_id).val(categoryPart);
                        let oldName = $('#newNamePart_' + next_id).val();
                        let oldFlatName = $('#newNameFlatPart' + next_id).val();
                        $('#newNamePart_' + next_id).val(projectNum + "-" + categoryPart + oldName.slice(oldName.length-4, oldName.length));
                        if($('#newFlatNamePart_' + next_id).val() != '') {
                            $('#newFlatNamePart_' + next_id).val(projectNum + "-" + categoryPart + oldFlatName.slice(oldFlatName.length-9, oldFlatName.length))
                        }
                    }
                    else {
                        break;
                    }
                }

            });

            $('#groupPart_' + id).change(function(){
                let categoryPart = $('#categoryPart_' + id).val();
                let groupPart = $('#groupPart_' + id).val();
                let offsetPart = $('#offsetPart_' + id).val();
                let currentFlatNamePart = $("#currentFlatNamePart_" + id).val();
                let endPN;
                let endDigits;
                let projectNum = $('#PROJECT_NUMBER').val();
                if(parseInt(groupPart) + parseInt(offsetPart) == 0) {
                    endPN = '000';
                } else if(parseInt(groupPart) + parseInt(offsetPart) < 10) {
                    endDigits = parseInt(groupPart) + parseInt(offsetPart);
                    endPN = '00' + endDigits;
                } else if(parseInt(groupPart) + parseInt(offsetPart) < 100) {
                    endDigits = parseInt(groupPart) + parseInt(offsetPart);
                    endPN = '0' + endDigits;
                } else {
                    endDigits = parseInt(groupPart) + parseInt(offsetPart);
                    endPN = (endDigits).toString();
                }
                $('#newNamePart_' + id).val(projectNum + "-" +categoryPart + "-" + endPN);

                if (currentFlatNamePart != '') {
                    $('#newFlatNamePart_' + id).val(projectNum + "-" +categoryPart + "-" + endPN + '-FLAT');
                }

                for (let j = 1; j < partCount - i; j++) {
                    let next_id = (i+j+1).toString();
                    if ($('#groupPart_' + next_id).hasClass('instance') == true) {
                        $('#groupPart_' + next_id).val(groupPart);
                        let offsetNext = $('#offsetPart_' + next_id).val();
                        let endPNNext;
                        let endDigitsNext;
                        if (parseInt(groupPart) + parseInt(offsetNext) == 0) {
                            endPNNext = '000';
                        } else if (parseInt(groupPart) + parseInt(offsetNext) < 10) {
                            endDigitsNext = parseInt(groupPart) + parseInt(offsetNext);
                            endPNNext = '00' + endDigitsNext;
                        } else if (parseInt(groupPart) + parseInt(offsetNext) < 100) {
                            endDigitsNext = parseInt(groupPart) + parseInt(offsetNext);
                            endPNNext = '0' + endDigitsNext;
                        } else {
                            endDigitsNext = parseInt(groupPart) + parseInt(offsetNext);
                            endPNNext = endDigitsNext.toString();
                        }
                        $('#newNamePart_' + next_id).val(projectNum + "-" + categoryPart + "-" + endPNNext);
                        if ($('#newFlatNamePart_' + next_id).val() != '') {
                            $('#newFlatNamePart_' + next_id).val(projectNum + "-" + categoryPart + "-" + endPNNext + "-FLAT");
                        }
                    }
                    else {
                        break;
                    }
                }
            });

            $('#offsetPart_' + id).change(function(){
                let categoryPart = $('#categoryPart_' + id).val();
                let groupPart = $('#groupPart_' + id).val();
                let offsetPart = $('#offsetPart_' + id).val();
                let currentFlatNamePart = $("#currentFlatNamePart_" + id).val();
                let endPN;
                let endDigits;
                let projectNum = $('#PROJECT_NUMBER').val();
                if(parseInt(groupPart) + parseInt(offsetPart) == 0) {
                    endPN = '000';
                } else if(parseInt(groupPart) + parseInt(offsetPart) < 10) {
                    endDigits = parseInt(groupPart) + parseInt(offsetPart);
                    endPN = '00' + endDigits;
                } else if(parseInt(groupPart) + parseInt(offsetPart) < 100) {
                    endDigits = parseInt(groupPart) + parseInt(offsetPart);
                    endPN = '0' + endDigits;
                } else {
                    endDigits = parseInt(groupPart) + parseInt(offsetPart);
                    endPN = (endDigits).toString();
                }
                $('#newNamePart_' + id).val(projectNum + "-" +categoryPart + "-" + endPN);

                if (currentFlatNamePart != '') {
                    $('#newFlatNamePart_' + id).val(projectNum + "-" +categoryPart + "-" + endPN + '-FLAT');
                }
            });
        };
    });

    for (let i = 0; i < asmCount; i++) {
        let id = (i+1).toString();
        let categoryAsm = $('#categoryAsm_' + id).val();
        let groupAsm = $('#groupAsm_' + id).val();
        let offsetAsm = $('#offsetAsm_' + id).val();
        if (categoryAsm == '' && groupAsm == '') {
            let prev_id = i.toString();
            let prevCategoryAsm = $('#categoryAsm_' + prev_id).val();
            let prevGroupAsm = $('#groupAsm_' + prev_id).val();
            $('#categoryAsm_' + id).val(prevCategoryAsm);
            categoryAsm = prevCategoryAsm;
            $('#categoryAsm_' + id).css("background-color", "lightgray");
            $('#categoryAsm_' + id).attr("readonly", "readonly");
            $('#categoryAsm_' + id).addClass("instance");
            $('#groupAsm_' + id).val(prevGroupAsm);
            groupAsm = prevGroupAsm;
            $('#groupAsm_' + id).css("background-color", "lightgray");
            $('#groupAsm_' + id).attr("readonly", "readonly");
            $('#groupAsm_' + id).addClass("instance");

        }
        let endPN;
        let endDigits;
        let projectNum = $('#PROJECT_NUMBER').val();
        if(parseInt(groupAsm) + parseInt(offsetAsm) == 0) {
            endPN = '000';
        } else if(parseInt(groupAsm) + parseInt(offsetAsm) < 10) {
            endDigits = parseInt(groupAsm) + parseInt(offsetAsm);
            endPN = '00' + endDigits;
        } else if(parseInt(groupAsm) + parseInt(offsetAsm) < 100) {
            endDigits = parseInt(groupAsm) + parseInt(offsetAsm);
            endPN = '0' + endDigits;
        } else {
            endDigits = parseInt(groupAsm) + parseInt(offsetAsm);
            endPN = (endDigits).toString();
        }

        $('#newNameAsm_' + id).val(projectNum + "-" +categoryAsm + "-" + endPN);

        $('#categoryAsm_' + id).change(function(){
            let categoryAsm = $('#categoryAsm_' + id).val();
            let groupAsm = $('#groupAsm_' + id).val();
            let offsetAsm = $('#offsetAsm_' + id).val();
            let projectNum = $('#PROJECT_NUMBER').val();
            let endPN;
            let endDigits;
            if(parseInt(groupAsm) + parseInt(offsetAsm) == 0) {
                endPN = '000';
            } else if(parseInt(groupAsm) + parseInt(offsetAsm) < 10) {
                endDigits = parseInt(groupAsm) + parseInt(offsetAsm);
                endPN = '00' + endDigits;
            } else if(parseInt(groupAsm) + parseInt(offsetAsm) < 100) {
                endDigits = parseInt(groupAsm) + parseInt(offsetAsm);
                endPN = '0' + endDigits;
            } else {
                endDigits = parseInt(groupAsm) + parseInt(offsetAsm);
                endPN = (endDigits).toString();
            }

            $('#newNameAsm_' + id).val(projectNum + "-" +categoryAsm + "-" + endPN);

            for (let j = 1; j < asmCount - i; j++) {
                let next_id = (i+j+1).toString();
                if ($('#categoryAsm_' + next_id).hasClass('instance') == true) {
                    $('#categoryAsm_' + next_id).val(categoryAsm);
                    let oldName = $('#newNameAsm_' + next_id).val();
                    $('#newNameAsm_' + next_id).val(projectNum + "-" +categoryAsm + oldName.slice(oldName.length-4,oldName.length));
                }
                else {
                    break;
                }
            }

        });

        $('#groupAsm_' + id).change(function(){
            let categoryAsm = $('#categoryAsm_' + id).val();
            let groupAsm = $('#groupAsm_' + id).val();
            let offsetAsm = $('#offsetAsm_' + id).val();
            let endPN;
            let endDigits;
            let projectNum = $('#PROJECT_NUMBER').val();
            if(parseInt(groupAsm) + parseInt(offsetAsm) == 0) {
                endPN = '000';
            } else if(parseInt(groupAsm) + parseInt(offsetAsm) < 10) {
                endDigits = parseInt(groupAsm) + parseInt(offsetAsm);
                endPN = '00' + endDigits;
            } else if(parseInt(groupAsm) + parseInt(offsetAsm) < 100) {
                endDigits = parseInt(groupAsm) + parseInt(offsetAsm);
                endPN = '0' + endDigits;
            } else {
                endDigits = parseInt(groupAsm) + parseInt(offsetAsm);
                endPN = (endDigits).toString();
            }
            $('#newNameAsm_' + id).val(projectNum + "-" +categoryAsm + "-" + endPN);

            for (let j = 1; j < asmCount - i; j++) {
                let next_id = (i+j+1).toString();
                if ($('#groupAsm_' + next_id).hasClass('instance') == true) {
                    $('#groupAsm_' + next_id).val(groupAsm);
                    let offsetNext = $('#offsetAsm_' + next_id).val();
                    let endPNNext;
                    let endDigitsNext;
                    if (parseInt(groupAsm) + parseInt(offsetNext) == 0) {
                        endPNNext = '000';
                    } else if (parseInt(groupAsm) + parseInt(offsetNext) < 10) {
                        endDigitsNext = parseInt(groupAsm) + parseInt(offsetNext);
                        endPNNext = '00' + endDigitsNext;
                    } else if (parseInt(groupAsm) + parseInt(offsetNext) < 100) {
                        endDigitsNext = parseInt(groupAsm) + parseInt(offsetNext);
                        endPNNext = '0' + endDigitsNext;
                    } else {
                        endDigitsNext = parseInt(groupAsm) + parseInt(offsetNext);
                        endPNNext = endDigitsNext.toString();
                    }
                    $('#newNameAsm_' + next_id).val(projectNum + "-" + categoryAsm + "-" + endPNNext);
                }
                else {
                    break;
                }
            }

        });

        $('#offsetAsm_' + id).change(function(){
            let categoryAsm = $('#categoryAsm_' + id).val();
            let groupAsm = $('#groupAsm_' + id).val();
            let offsetAsm = $('#offsetAsm_' + id).val();
            let endPN;
            let endDigits;
            let projectNum = $('#PROJECT_NUMBER').val();
            if(parseInt(groupAsm) + parseInt(offsetAsm) == 0) {
                endPN = '000';
            } else if(parseInt(groupAsm) + parseInt(offsetAsm) < 10) {
                endDigits = parseInt(groupAsm) + parseInt(offsetAsm);
                endPN = '00' + endDigits;
            } else if(parseInt(groupAsm) + parseInt(offsetAsm) < 100) {
                endDigits = parseInt(groupAsm) + parseInt(offsetAsm);
                endPN = '0' + endDigits;
            } else {
                endDigits = parseInt(groupAsm) + parseInt(offsetAsm);
                endPN = (endDigits).toString();
            }
            $('#newNameAsm_' + id).val(projectNum + "-" +categoryAsm + "-" + endPN);

        });
    };

    for (let i = 0; i < partCount; i++) {
        let id = (i+1).toString();
        let categoryPart = $('#categoryPart_' + id).val();
        let groupPart = $('#groupPart_' + id).val();
        let offsetPart = $('#offsetPart_' + id).val();
        let currentFlatNamePart = $("#currentFlatNamePart_" + id).val();
        if (categoryPart == '' && groupPart == '') {
            let prev_id = i.toString();
            let prevCategoryPart = $('#categoryPart_' + prev_id).val();
            let prevGroupPart = $('#groupPart_' + prev_id).val();
            $('#categoryPart_' + id).val(prevCategoryPart);
            categoryPart = prevCategoryPart;
            $('#categoryPart_' + id).css("background-color", "lightgray");
            $('#categoryPart_' + id).attr('readonly', 'readonly');
            $('#categoryPart_' + id).addClass("instance");
            $('#groupPart_' + id).val(prevGroupPart);
            groupPart = prevGroupPart;
            $('#groupPart_' + id).css("background-color", "lightgray");
            $('#groupPart_' + id).attr('readonly', 'readonly');
            $('#groupPart_' + id).addClass("instance");
        }
        let endPN;
        let endDigits;
        let projectNum = $('#PROJECT_NUMBER').val();
        if(parseInt(groupPart) + parseInt(offsetPart) == 0) {
            endPN = '000';
        } else if(parseInt(groupPart) + parseInt(offsetPart) < 10) {
            endDigits = parseInt(groupPart) + parseInt(offsetPart);
            endPN = '00' + endDigits;
        } else if(parseInt(groupPart) + parseInt(offsetPart) < 100) {
            endDigits = parseInt(groupPart) + parseInt(offsetPart);
            endPN = '0' + endDigits;
        } else {
            endDigits = parseInt(groupPart) + parseInt(offsetPart);
            endPN = (endDigits).toString();
        }
        $('#newNamePart_' + id).val(projectNum + "-" +categoryPart + "-" + endPN);

        if (currentFlatNamePart != '') {
            $('#newFlatNamePart_' + id).val(projectNum + "-" +categoryPart + "-" + endPN + '-FLAT');
        }

        $('#categoryPart_' + id).change(function(){
            let categoryPart = $('#categoryPart_' + id).val();
            let groupPart = $('#groupPart_' + id).val();
            let offsetPart = $('#offsetPart_' + id).val();
            let currentFlatNamePart = $("#currentFlatNamePart_" + id).val();
            let endPN;
            let endDigits;
            let projectNum = $('#PROJECT_NUMBER').val();
            if(parseInt(groupPart) + parseInt(offsetPart) == 0) {
                endPN = '000';
            } else if(parseInt(groupPart) + parseInt(offsetPart) < 10) {
                endDigits = parseInt(groupPart) + parseInt(offsetPart);
                endPN = '00' + endDigits;
            } else if(parseInt(groupPart) + parseInt(offsetPart) < 100) {
                endDigits = parseInt(groupPart) + parseInt(offsetPart);
                endPN = '0' + endDigits;
            } else {
                endDigits = parseInt(groupPart) + parseInt(offsetPart);
                endPN = (endDigits).toString();
            }
            $('#newNamePart_' + id).val(projectNum + "-" +categoryPart + "-" + endPN);

            if (currentFlatNamePart != '') {
                $('#newFlatNamePart_' + id).val(projectNum + "-" +categoryPart + "-" + endPN + '-FLAT');
            }

            for (let j = 1; j < partCount - i; j++) {
                let next_id = (i+j+1).toString();
                if ($('#categoryPart_' + next_id).hasClass('instance') == true) {
                    $('#categoryPart_' + next_id).val(categoryPart);
                    let oldName = $('#newNamePart_' + next_id).val();
                    let oldFlatName = $('#newFlatNamePart_' + next_id).val();
                    $('#newNamePart_' + next_id).val(projectNum + "-" + categoryPart + oldName.slice(oldName.length-4, oldName.length));
                    if($('#newFlatNamePart_' + next_id).val() != '') {
                        $('#newFlatNamePart_' + next_id).val(projectNum + "-" + categoryPart + oldFlatName.slice(oldFlatName.length-9, oldFlatName.length))
                    }
                }
                else {
                    break;
                }
            }
        });

        $('#groupPart_' + id).change(function(){
            let categoryPart = $('#categoryPart_' + id).val();
            let groupPart = $('#groupPart_' + id).val();
            let offsetPart = $('#offsetPart_' + id).val();
            let currentFlatNamePart = $("#currentFlatNamePart_" + id).val();
            let endPN;
            let endDigits;
            let projectNum = $('#PROJECT_NUMBER').val();
            if(parseInt(groupPart) + parseInt(offsetPart) == 0) {
                endPN = '000';
            } else if(parseInt(groupPart) + parseInt(offsetPart) < 10) {
                endDigits = parseInt(groupPart) + parseInt(offsetPart);
                endPN = '00' + endDigits;
            } else if(parseInt(groupPart) + parseInt(offsetPart) < 100) {
                endDigits = parseInt(groupPart) + parseInt(offsetPart);
                endPN = '0' + endDigits;
            } else {
                endDigits = parseInt(groupPart) + parseInt(offsetPart);
                endPN = (endDigits).toString();
            }
            $('#newNamePart_' + id).val(projectNum + "-" +categoryPart + "-" + endPN);

            if (currentFlatNamePart != '') {
                $('#newFlatNamePart_' + id).val(projectNum + "-" +categoryPart + "-" + endPN + '-FLAT');
            }

            for (let j = 1; j < partCount - i; j++) {
                let next_id = (i+j+1).toString();
                if ($('#groupPart_' + next_id).hasClass('instance') == true) {
                    $('#groupPart_' + next_id).val(groupPart);
                    let offsetNext = $('#offsetPart_' + next_id).val();
                    let endPNNext;
                    let endDigitsNext;
                    if (parseInt(groupPart) + parseInt(offsetNext) == 0) {
                        endPNNext = '000';
                    } else if (parseInt(groupPart) + parseInt(offsetNext) < 10) {
                        endDigitsNext = parseInt(groupPart) + parseInt(offsetNext);
                        endPNNext = '00' + endDigitsNext;
                    } else if (parseInt(groupPart) + parseInt(offsetNext) < 100) {
                        endDigitsNext = parseInt(groupPart) + parseInt(offsetNext);
                        endPNNext = '0' + endDigitsNext;
                    } else {
                        endDigitsNext = parseInt(groupPart) + parseInt(offsetNext);
                        endPNNext = endDigitsNext.toString();
                    }

                    $('#newNamePart_' + next_id).val(projectNum + "-" + categoryPart + "-" + endPNNext);
                    if ($('#newFlatNamePart_' + next_id).val() != '') {
                        $('#newFlatNamePart_' + next_id).val(projectNum + "-" + categoryPart + "-" + endPNNext + "-FLAT");
                    }
                }
                else {
                    break;
                }
            }
        });

        $('#offsetPart_' + id).change(function(){
            let categoryPart = $('#categoryPart_' + id).val();
            let groupPart = $('#groupPart_' + id).val();
            let offsetPart = $('#offsetPart_' + id).val();
            let currentFlatNamePart = $("#currentFlatNamePart_" + id).val();
            let endPN;
            let endDigits;
            let projectNum = $('#PROJECT_NUMBER').val();
            if(parseInt(groupPart) + parseInt(offsetPart) == 0) {
                endPN = '000';
            } else if(parseInt(groupPart) + parseInt(offsetPart) < 10) {
                endDigits = parseInt(groupPart) + parseInt(offsetPart);
                endPN = '00' + endDigits;
            } else if(parseInt(groupPart) + parseInt(offsetPart) < 100) {
                endDigits = parseInt(groupPart) + parseInt(offsetPart);
                endPN = '0' + endDigits;
            } else {
                endDigits = parseInt(groupPart) + parseInt(offsetPart);
                endPN = (endDigits).toString();
            }
            $('#newNamePart_' + id).val(projectNum + "-" +categoryPart + "-" + endPN);

            if (currentFlatNamePart != '') {
                $('#newFlatNamePart_' + id).val(projectNum + "-" +categoryPart + "-" + endPN + '-FLAT');
            }
        });

    };


    $('#checkNamesBtn').click(function() {
        for (let i = 0; i < asmCount; i++) {
            let matchFound = false;
            let id_1 = (i+1).toString();
            let nameAsm1 = $('#newNameAsm_' + id_1).val();
            for (let j = 0; j < asmCount; j++) {
                let id_2 = (j+1).toString();
                let nameAsm2 = $('#newNameAsm_' + id_2).val();
                if (j != i) {
                    if (nameAsm2 == nameAsm1) {
                        matchFound = true;
                        $('#newNameAsm_' + id_2).addClass('sameName');
                    }
                }
            }
            if (matchFound == true) {
                $('#newNameAsm_' + id_1).addClass('sameName');
            } else {
                if ($('#newNameAsm_' + id_1).hasClass('sameName') == true) {
                    $('#newNameAsm_' + id_1).removeClass('sameName');
                }
            }
        }

        for (let i = 0; i < asmCount; i++) {
            let id = (i+1).toString();
            if($('#newNameAsm_' + id).hasClass('sameName') == true) {
                $('#newNameAsm_' + id).css("background-color", "red");
            } else {
                $('#newNameAsm_' + id).css("background-color", "white");
            }
        }



        for (let i = 0; i < partCount; i++) {
            let matchFound = false;
            let id_1 = (i+1).toString();
            let namePart1 = $('#newNamePart_' + id_1).val();
            for (let j = 0; j < partCount; j++) {
                let id_2 = (j+1).toString();
                let namePart2 = $('#newNamePart_' + id_2).val();
                if (j != i) {
                    if (namePart2 == namePart1) {
                        matchFound = true;
                        $('#newNamePart_' + id_2).addClass('sameName');
                        if ($('#newFlatNamePart_' + id_2).val() != '') {
                            $('#newFlatNamePart_' + id_2).addClass('sameName');
                        }
                    }
                }
            }
            if (matchFound == true) {
                $('#newNamePart_' + id_1).addClass('sameName');
                if ($('#newFlatNamePart_' + id_1).val() != '') {
                    $('#newFlatNamePart_' + id_1).addClass('sameName');
                }
            } else {
                if ($('#newNamePart_' + id_1).hasClass('sameName') == true) {
                    $('#newNamePart_' + id_1).removeClass('sameName');
                    if ($('#newFlatNamePart_' + id_1).val() != '') {
                        $('#newFlatNamePart_' + id_1).removeClass('sameName');
                    }
                }
            }
        }

        for (let i = 0; i < partCount; i++) {
            let id = (i+1).toString();
            if ($('#newNamePart_' + id).hasClass('sameName') == true) {
                $('#newNamePart_' + id).css("background-color", "red");
            } else {
                $('#newNamePart_' + id).css("background-color", "white");
            }
            if ($('#newFlatNamePart_' + id).val() != '') {
                if ($('#newFlatNamePart_' + id).hasClass('sameName') == true) {
                    $('#newFlatNamePart_' + id).css("background-color", "red");
                } else {
                    $('#newFlatNamePart_' + id).css("background-color", "white");
                }
            }
        }
    });

});
