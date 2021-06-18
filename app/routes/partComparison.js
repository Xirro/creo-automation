const partComparisonController = require('../controllers/partComparisonController.js');


module.exports = function(app) {

    //Part Comparison GET request
    app.get('/partComparison', partComparisonController.partComparison);

    //Set Working Directory POST request
    app.post('/compareSetWD', partComparisonController.setWD);

    //Set Part and Working Directory POST request
    app.post('/compareSetPart', partComparisonController.setPart);

    //Part Comparison POST request
    app.post('/compareParts', partComparisonController.compareParts);

    //Part Comparison POST request
    app.post('/compareSinglePart', partComparisonController.compareSinglePart);

};