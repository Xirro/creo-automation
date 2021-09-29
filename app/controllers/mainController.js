exports = {};
module.exports = exports;

//MAIN LANDING PAGE
exports.landingPage = function(req, res) {
    res.locals = {title: 'CREO Automation'};
    res.render('Main/landingPage');
};