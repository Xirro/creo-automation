//import the js functions from the submittalController.js file and write them to a variable submittalController
const submittalController = require('../controllers/submittalController.js');

//export a function of app (this exposes these functions to server.js
//and completes the connection between server-router-controller-view)
module.exports = function(app) {

    //get request to /submittal url => submittal()
    app.get('/submittal', submittalController.submittal);

    //post request to /createSubmittal url => createSubmittal()
    app.post('/createSubmittal', submittalController.createSubmittal);

    //get request to /searchSubmittal/ url => searchSubmittal()
    app.get('/searchSubmittal/', submittalController.searchSubmittal);

    //post request to /editSubmittal/ url => editSubmittal()
    app.post('/editSubmittal/', submittalController.editSubmittal);

    //app.post('/reverseEngineerLayout/', submittalController.reverseEngineerLayout);

    //post request to /addLayout/ url => addLayout()
    app.post('/addLayout/', submittalController.addLayout);

    //post request to /editLayout/ url => editLayout()
    app.post('/editLayout/', submittalController.editLayout);

    //post request to /layoutAddSection/ url => layoutAddSection()
    app.post('/layoutAddSection/', submittalController.layoutAddSection);

    //post request to /layoutDeleteSection/ url => layoutDeleteSection()
    app.post('/layoutDeleteSection/', submittalController.layoutDeleteSection);

    //post request to /layoutSectionProperties/ url => layoutSectionProperties()
    app.post('/layoutSectionProperties/', submittalController.layoutSectionProperties);

    //post request to /addDevice/ url => addBrk()
    app.post('/addDevice', submittalController.addBrk);

    //post request to /submittalCopyDevice/ url => copyBrk()
    app.post('/submittalCopyDevice/', submittalController.copyBrk);

    //post request to /submittalEditDevice/ url => editBrk()
    app.post('/submittalEditDevice/', submittalController.editBrk);

    //post request to /submittalDeleteDevice/ url => deleteBrk()
    app.post('/submittalDeleteDevice/', submittalController.deleteBrk);

    //post request to /creoGenSubmittal/ url => generateSubmittal()
    app.post('/creoGenSubmittal/', submittalController.generateSubmittal);

    //post request to /submittalSetWD/ url => setWD()
    app.post('/submittalSetWD/', submittalController.setWD);

    //post request to /verifySubmittal/ url => verifySubmittal()
    app.post('/verifySubmittal/', submittalController.verifySubmittal);
};