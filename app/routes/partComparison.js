//import the js functions from the partComparisonController.js file and write them to a variable partComparisonController
const partComparisonController = require('../controllers/partComparisonController.js');


//export a function of app (this exposes these functions to server.js
//and completes the connection between server-router-controller-view)
module.exports = function(app) {

    //get request to /partComparison url => partComparison()
    app.get('/partComparison', partComparisonController.partComparison);

    //post request to /compareSetWD url => setWD()
    app.post('/compareSetWD', partComparisonController.setWD);

    //post request to /compareSetPart url => setPart()
    app.post('/compareSetPart', partComparisonController.setPart);

    //post request to /compareParts url => compareParts()
    app.post('/compareParts', partComparisonController.compareParts);

    //post request to /compareSinglePart url => compareSinglePart()
    app.post('/compareSinglePart', partComparisonController.compareSinglePart);
};