$('#checkAllSteel').change(function() {
   if (this.checked) {
       $('.pdfCheck').each(function() {
           if (this.id.slice(11,12) == '1' || this.id.slice(11,12) == '2') {
               this.checked = false;
               this.click();
           }
       })
       $('.dxfCheck').each(function() {
           if (this.id.slice(11,12) == '1' || this.id.slice(11,12) == '2') {
               this.checked = false;
               this.click();
           }
       })
   } else {
       $('.pdfCheck').each(function() {
           if (this.id.slice(11,12) == '1' || this.id.slice(11,12) == '2') {
               this.checked = true;
               this.click();
           }
       })
       $('.dxfCheck').each(function() {
           if (this.id.slice(11,12) == '1' || this.id.slice(11,12) == '2') {
               this.checked = true;
               this.click();
           }
       })
   }
});

$('#checkAllCopper').change(function() {
    if (this.checked) {
        $('.pdfCheck').each(function() {
            if (this.id.slice(11,12) == '3') {
                this.checked = false;
                this.click();
            }
        })
        $('.dxfCheck').each(function() {
            if (this.id.slice(11,12) == '3') {
                this.checked = false;
                this.click();
            }
        })
    } else {
        $('.pdfCheck').each(function() {
            if (this.id.slice(11,12) == '3') {
                this.checked = true;
                this.click();
            }
        })
        $('.dxfCheck').each(function() {
            if (this.id.slice(11,12) == '3') {
                this.checked = true;
                this.click();
            }
        })
    }
});

$('#checkAllGlastic').change(function() {
    if (this.checked) {
        $('.pdfCheck').each(function() {
            if (this.id.slice(11,12) == '4') {
                if (this.id.slice(11,15) != '4105') {
                    this.checked = false;
                    this.click();
                }
            }
        });
    } else {
        $('.pdfCheck').each(function() {
            if (this.id.slice(11,12) == '4') {
                if (this.id.slice(11,15) != '4105') {
                    this.checked = true;
                    this.click();
                }
            }
        });
    }
});

$('#checkAllNameplate').change(function() {
    if (this.checked) {
        $('.dxfCheck').each(function() {
            if (this.id.slice(11,14) == '410') {
                this.checked = false;
                this.click();
            }
        })
    } else {

        $('.dxfCheck').each(function() {
            if (this.id.slice(11,14) == '410') {
                this.checked = true;
                this.click();
            }
        })
    }
});


$("#checkAllPDF").change(function() {
    if (this.checked) {
        $(".pdfCheck").each(function() {
            this.checked = false;
            this.click();
        });
    } else {
        $(".pdfCheck").each(function() {
            this.checked = true;
            this.click();
        });
    }
});


$(".pdfCheck").click(function () {
    if ($(this).is(":checked")) {
        var isAllChecked = 0;

        $(".pdfCheck").each(function() {
            if (!this.checked)
                isAllChecked = 1;
        });

        if (isAllChecked == 0) {
            $("#checkAllPDF").prop("checked", true);
        }
    }
    else {
        $("#checkAllPDF").prop("checked", false);
    }
});


$("#checkAllDXF").change(function() {
    if (this.checked) {
        $(".dxfCheck").each(function() {
            this.checked = false;
            this.click();
        });
    } else {
        $(".dxfCheck").each(function() {
            this.checked = true;
            this.click();
        });
    }
});


$(".dxfCheck").click(function () {
    if ($(this).is(":checked")) {
        var isAllChecked = 0;

        $(".dxfCheck").each(function() {
            if (!this.checked)
                isAllChecked = 1;
        });

        if (isAllChecked == 0) {
            $("#checkAllDXF").prop("checked", true);
        }
    }
    else {
        $("#checkAllDXF").prop("checked", false);
    }
});

/*
$(".includeInExportCheck").click(function() {
    if (this.checked) {
        this.checked = true;
        this.previousSibling.value=1-this.previousSibling.value;
    } else {
        this.checked = false;
        this.previousSibling.value=1-this.previousSibling.value;
    }
    let checkedId = this.id;
    $(".includeInExportCheck").each(function() {
      if (this.id != checkedId) {
          if (this.checked) {
              this.checked = false;
              this.previousSibling.value=1-this.previousSibling.value
          }
      }
    })
});*/



