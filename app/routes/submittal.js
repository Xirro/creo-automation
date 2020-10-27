const submittalController = require('../controllers/submittalController.js');


module.exports = function(app) {

    app.get('/submittal', submittalController.submittal);

    app.post('/createSubmittal', submittalController.createSubmittal);

    app.get('/searchSubmittal/', submittalController.searchSubmittal);

    app.post('/editSubmittal/', submittalController.editSubmittal);

    //app.post('/reverseEngineerLayout/', submittalController.reverseEngineerLayout);

    app.post('/addLayout/', submittalController.addLayout);

    app.post('/editLayout/', submittalController.editLayout);

    app.post('/layoutAddSection/', submittalController.layoutAddSection);

    app.post('/layoutDeleteSection/', submittalController.layoutDeleteSection);

    app.post('/layoutSectionProperties/', submittalController.layoutSectionProperties);

    app.post('/addDevice', submittalController.addBrk);

    app.post('/submittalCopyDevice/', submittalController.copyBrk);

    app.post('/submittalEditDevice/', submittalController.editBrk);

    app.post('/submittalDeleteDevice/', submittalController.deleteBrk);

    app.post('/creoGenSubmittal/', submittalController.generateSubmittal);

    app.post('/submittalSetWD/', submittalController.setWD);

    app.post('/verifySubmittal/', submittalController.verifySubmittal);
};