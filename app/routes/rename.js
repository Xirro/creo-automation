//import the js functions from the renameController.js file and write them to a variable renameController
const renameController = require('../controllers/renameController.js');

//export a function of app (this exposes these functions to server.js
//and completes the connection between server-router-controller-view)
module.exports = function(app) {

    //get request to /renameMain url => renameMain()
    app.get('/renameMain', renameController.renameMain);

    //post request to /renameSetWD url => renameSetWD()
    app.post('/renameSetWD', renameController.renameSetWD);

    //post request to /loadParts url => loadParts()
    app.post('/loadParts', renameController.loadParts);

    //post request to /rename url => rename()
    app.post('/rename', renameController.rename);

};