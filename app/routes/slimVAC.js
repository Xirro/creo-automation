const slimvacController = require('../controllers/slimVACController.js');


module.exports = function(app) {

    app.get('/slimVAC_NAR', slimvacController.slimVAC);

    app.post('/createLayout', slimvacController.createLayout);

    app.post('/layoutSetWD/', slimvacController.setWD);

    app.get('/searchLayout/', slimvacController.searchLayout);

    app.post('/editLayoutData/', slimvacController.editLayoutData);

    app.post('/reverseEngineerLayoutDetail/', slimvacController.reverseEngineerLayoutDetail);

    app.post('/addLayoutDetail/', slimvacController.addLayoutDetail);

    app.post('/editLayoutDetail/', slimvacController.editLayoutDetail);

    app.post('/reverseEngineerSectionDetail/', slimvacController.reverseEngineerSectionDetail);

    app.post('/addSectionDetail/', slimvacController.addSectionDetail);

    app.post('/editSectionDetail/', slimvacController.editSectionDetail);

    app.post('/saveSectionDetail/', slimvacController.saveSectionDetail);

    app.post('/deleteSectionDetail/', slimvacController.deleteSectionDetail);

    app.post('/generateLayout/', slimvacController.generateLayout);

};