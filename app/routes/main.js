//import the js functions from the mainproController.js file and write them to a variable mainController
const mainController = require('../controllers/mainController.js');
// mount debug routes (temporary) - mounted below with the real `app` instance

//export a function of app (this exposes these functions to server.js and completes the connection between server-router-controller-view)
module.exports = function(app) {
    //get request to /home url => landingPage()
    app.get('/home', mainController.landingPage);

    // Account request routes (public)
    app.get('/request-account', mainController.requestAccountForm);
    app.post('/request-account', mainController.submitRequestAccount);

    // debug routes removed in cleanup

    //we can also bypass the extra file in mainController.js for simple functions by using it directly
    /*app.get('/home',
        function(req, res) {
            //render the landingPage (does not require any additional data to be sent)
            res.locals = {title: 'CREO Automation'};
            res.render('Main/landingPage');
    });*/
};