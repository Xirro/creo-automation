//import the js functions from the slimvacController.js file and write them to a variable slimvacController
const slimvacController = require('../controllers/slimVACController.js');

//export a function of app (this exposes these functions to server.js
//and completes the connection between server-router-controller-view)
module.exports = function(app) {

    //get request to /slimVAC_NAR url => slimVAC()
    app.get('/slimVAC_NAR', slimvacController.slimVAC);

    //post request to /createLayout url => createLayout()
    app.post('/createLayout', slimvacController.createLayout);

    //post request to /layoutSetWD/ url => setWD()
    app.post('/layoutSetWD/', slimvacController.setWD);

    //get request to /searchLayout/ url => searchLayout()
    app.get('/searchLayout/', slimvacController.searchLayout);

    //post request to /editLayoutData/ url => editLayoutData()
    app.post('/editLayoutData/', slimvacController.editLayoutData);

    //post request to /reverseEngineerLayoutDetail/ url => reverseEngineerLayoutDetail()
    app.post('/reverseEngineerLayoutDetail/', slimvacController.reverseEngineerLayoutDetail);

    //post request to /addLayoutDetail/ url => addLayoutDetail()
    app.post('/addLayoutDetail/', slimvacController.addLayoutDetail);

    //post request to /editLayoutDetail/ url => editLayoutDetail()
    app.post('/editLayoutDetail/', slimvacController.editLayoutDetail);

    //post request to /reverseEngineerSectionDetail/ url => reverseEngineerSectionDetail()
    app.post('/reverseEngineerSectionDetail/', slimvacController.reverseEngineerSectionDetail);

    //post request to /addSectionDetail/ url => addSectionDetail()
    app.post('/addSectionDetail/', slimvacController.addSectionDetail);

    //post request to /editSectionDetail/ url => editSectionDetail()
    app.post('/editSectionDetail/', slimvacController.editSectionDetail);

    //post request to /saveSectionDetail/ url => saveSectionDetail()
    app.post('/saveSectionDetail/', slimvacController.saveSectionDetail);

    //post request to /deleteSectionDetail/ url => deleteSectionDetail()
    app.post('/deleteSectionDetail/', slimvacController.deleteSectionDetail);

    //post request to /generateLayout/ url => generateLayout()
    app.post('/generateLayout/', slimvacController.generateLayout);

};