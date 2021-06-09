const renameController = require('../controllers/renameController.js');


module.exports = function(app) {

    //Rename Main GET request
    app.get('/renameMain', renameController.renameMain);

    //Set Working Directory POST request
    app.post('/renameSetWD', renameController.renameSetWD);

    //Load Parts GET request
    app.post('/loadParts', renameController.loadParts);

    //Rename POST request
    app.post('/rename', renameController.rename);

};