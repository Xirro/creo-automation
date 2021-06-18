/*
let asmCount = document.getElementById('renameAsmCount');
let partCount = document.getElementById('renamePartCount');

for (let i = 0; i < asmCount.value; i++) {
    let id = (i+1).toString();
    asmCount.change(function(){
        let categoryAsm = document.getElementById('categoryAsm_' + id).value;
        let groupAsm = document.getElementById('groupAsm_' + id).value;
        let offsetAsm = document.getElementById('offsetAsm_' + id).value;
        let endPN = (parseInt(groupAsm) + parseInt(offsetAsm)).toString();
        document.getElementById('newNameAsm_' + id).value = categoryAsm + "-" + endPN

    });
}
*/

$(document).ready(function() {

    let asmCount = $('#renameAsmCount').val();
    let partCount = $('#renamePartCount').val();
    let projectNum = $('#PROJECT_NUMBER').val();
    for (let i = 0; i < asmCount; i++) {
        let id = (i+1).toString();
        let categoryAsm = $('#categoryAsm_' + id).val();
        let groupAsm = $('#groupAsm_' + id).val();
        let offsetAsm = $('#offsetAsm_' + id).val();
        let endPN;
        if(parseInt(groupAsm) + parseInt(offsetAsm) == 0) {
            endPN = '000';
        } else if(parseInt(groupAsm) + parseInt(offsetAsm) < 10) {
            endPN = '00' + parseInt(groupAsm) + parseInt(offsetAsm);
        } else if(parseInt(groupAsm) + parseInt(offsetAsm) < 100) {
            endPN = '0' + parseInt(groupAsm) + parseInt(offsetAsm);
        } else {
            endPN = (parseInt(groupAsm) + parseInt(offsetAsm)).toString();
        }
        $('#newNameAsm_' + id).val(projectNum + "-" +categoryAsm + "-" + endPN);



        $('#categoryAsm_' + id).change(function(){
            categoryAsm = $('#categoryAsm_' + id).val();
            groupAsm = $('#groupAsm_' + id).val();
            offsetAsm = $('#offsetAsm_' + id).val();
            if(parseInt(groupAsm) + parseInt(offsetAsm) == 0) {
                endPN = '000';
            } else if(parseInt(groupAsm) + parseInt(offsetAsm) < 10) {
                endPN = '00' + parseInt(groupAsm) + parseInt(offsetAsm);
            } else if(parseInt(groupAsm) + parseInt(offsetAsm) < 100) {
                endPN = '0' + parseInt(groupAsm) + parseInt(offsetAsm);
            } else {
                endPN = (parseInt(groupAsm) + parseInt(offsetAsm)).toString();
            }
            $('#newNameAsm_' + id).val(projectNum + "-" +categoryAsm + "-" + endPN);
        });

        $('#groupAsm_' + id).change(function(){
            let categoryAsm = $('#categoryAsm_' + id).val();
            let groupAsm = $('#groupAsm_' + id).val();
            let offsetAsm = $('#offsetAsm_' + id).val();
            let endPN;
            if(parseInt(groupAsm) + parseInt(offsetAsm) == 0) {
                endPN = '000';
            } else if(parseInt(groupAsm) + parseInt(offsetAsm) < 10) {
                endPN = '00' + parseInt(groupAsm) + parseInt(offsetAsm);
            } else if(parseInt(groupAsm) + parseInt(offsetAsm) < 100) {
                endPN = '0' + parseInt(groupAsm) + parseInt(offsetAsm);
            } else {
                endPN = (parseInt(groupAsm) + parseInt(offsetAsm)).toString();
            }
            $('#newNameAsm_' + id).val(projectNum + "-" +categoryAsm + "-" + endPN);
        });

        $('#offsetAsm_' + id).change(function(){
            let categoryAsm = $('#categoryAsm_' + id).val();
            let groupAsm = $('#groupAsm_' + id).val();
            let offsetAsm = $('#offsetAsm_' + id).val();
            let endPN;
            if(parseInt(groupAsm) + parseInt(offsetAsm) == 0) {
                endPN = '000';
            } else if(parseInt(groupAsm) + parseInt(offsetAsm) < 10) {
                endPN = '00' + parseInt(groupAsm) + parseInt(offsetAsm);
            } else if(parseInt(groupAsm) + parseInt(offsetAsm) < 100) {
                endPN = '0' + parseInt(groupAsm) + parseInt(offsetAsm);
            } else {
                endPN = (parseInt(groupAsm) + parseInt(offsetAsm)).toString();
            }
            $('#newNameAsm_' + id).val(projectNum + "-" +categoryAsm + "-" + endPN);
        });


    }

    for (let i = 0; i < partCount; i++) {
        let id = (i+1).toString();
        $('#categoryPart_' + id).change(function(){
            let categoryPart = $('#categoryPart_' + id).val();
            let groupPart = $('#groupPart_' + id).val();
            let offsetPart = $('#offsetPart_' + id).val();
            let endPN;
            if(parseInt(groupPart) + parseInt(offsetPart) == 0) {
                endPN = '000';
            } else if(parseInt(groupPart) + parseInt(offsetPart) < 10) {
                endPN = '00' + parseInt(groupPart) + parseInt(offsetPart);
            } else if(parseInt(groupPart) + parseInt(offsetPart) < 100) {
                endPN = '0' + parseInt(groupPart) + parseInt(offsetPart);
            } else {
                endPN = (parseInt(groupPart) + parseInt(offsetPart)).toString();
            }
            $('#newNamePart_' + id).val(projectNum + "-" +categoryPart + "-" + endPN);
        });
    }


});
