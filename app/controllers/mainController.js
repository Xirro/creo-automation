//exports
exports = {};
module.exports = exports;


//IN ANY OF THESE FUNCTIONS IF YOU WANT TO DEBUG OR ANALYZE THE BEHAVIOR
//THE BEST THING TO DO IS console.log WHATEVER VARIABLE, OBJECT, ARRAY, PROPERTY, ETC. THAT YOU ARE TRYING TO STUDY

//landingPage function
exports.landingPage = function(req, res) {
    //render the landingPage (does not require any additional data to be sent)
    res.locals = {title: 'CREO Automation'};
    res.render('Main/landingPage');
};