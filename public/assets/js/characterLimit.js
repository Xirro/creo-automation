$("#devDesLimit").on("keyup", function() {
    var maxLength = $(this).attr("maxLength");
    if(maxLength == $(this).val().length){
        alert("You have reached the max character limit");
    }
});

$("#itemDescLimit").on("keyup", function() {
    var maxLength = $(this).attr("maxLength");
    if(maxLength == $(this).val().length){
        alert("You have reached the max character limit");
    }
});

$("#accessoryDescLimit").on("keyup", function() {
    var maxLength = $(this).attr("maxLength");
    if(maxLength == $(this).val().length){
        alert("You have reached the max character limit");
    }
});

$("#editAccDescLimit").on("keyup", function() {
    var maxLength = $(this).attr("maxLength");
    if(maxLength == $(this).val().length){
        alert("You have reached the max character limit");
    }
});