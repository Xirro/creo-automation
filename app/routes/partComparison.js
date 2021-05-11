const partComparisonController = require('../controllers/partComparisonController.js');


module.exports = function(app) {

    //Part Comparison GET request
    app.get('/partComparison', partComparisonController.partComparison);

    //Set Working Directory POST request
    app.post('/compareSetWD', partComparisonController.setWD);

    //Part Comparison POST request
    app.post('/compareParts', partComparisonController.compareParts);

};