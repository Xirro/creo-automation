const mainController = require('../controllers/mainController.js');


module.exports = function(app) {

    app.get('/home', mainController.landingPage);

};