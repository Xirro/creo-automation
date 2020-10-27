
$('#carouselExampleIndicators').on('slid.bs.carousel', function () {
    var currentSlide = $('#carouselExampleIndicators div.active').index();
    var quoteNum = $('#quoteNum').val();
    var revNum = $('#revNum').val();
    var slideSelect = currentSlide;
    selectedSlideFormSubmit(slideSelect, quoteNum, revNum);
});



function selectedSlideFormSubmit(slideSelect, quoteNum, revNum) {
    var form = document.createElement('form');
    form.method = "POST";
    form.action = "../selectedSlide";

    var element1 = document.createElement('input');
    var element2 = document.createElement('input');
    var element3 = document.createElement('input');


    element1.value = slideSelect;
    element1.name = "slideSelect";
    form.appendChild(element1);


    element2.value = quoteNum;
    element2.name = "quoteNum";
    form.appendChild(element2);

    element3.value = revNum;
    element3.name = "revNum";
    form.appendChild(element3);


    document.body.appendChild(form);
    form.submit();
}

