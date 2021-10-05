//import the js functions from the mainController.js file and write them to a variable mainController
const mainController = require('../controllers/mainController.js');

//export a function of app (this exposes these functions to server.js and completes the connection between server-router-controller-view)
module.exports = function(app) {
    //get request to /home url => landingPage()
    app.get('/home', mainController.landingPage);

    //we can also bypass the extra file in mainController.js for simple functions by using it directly
    /*app.get('/home',
        function(req, res) {
            //render the landingPage (does not require any additional data to be sent)
            res.locals = {title: 'CREO Automation'};
            res.render('Main/landingPage');
    });*/
};