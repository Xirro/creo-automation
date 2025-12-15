//import the js functions from the mainproController.js file and write them to a variable mainController
const projectController = require('../controllers/projectController.js');
const mbomController = require('../controllers/mbomController.js');
// mount debug routes (temporary) - mounted below with the real `app` instance

//export a function of app (this exposes these functions to server.js and completes the connection between server-router-controller-view)
module.exports = function(app) {
    //get request to /projects url => projectMain()
    app.get('/projects', projectController.projectMain);
    // Create project routes (optional simple form)
    app.get('/projects/create', projectController.createProjectForm);
    app.post('/projects/create', projectController.createProject);
    // Project dashboard
    app.get('/projects/:id', projectController.projectDashboard);
    // Project-scoped MBOM view (renders same as /searchMBOM but scoped under project path)
    app.get('/projects/:id/searchMBOM', function(req, res, next) {
        // forward request to MBOM controller's search handler
        return mbomController.searchMBOMGet(req, res, next);
    });
    // MBOM edit/delete endpoints
    app.post('/projects/mbom/:id/update', projectController.updateMbom);
    app.post('/projects/mbom/:id/delete', projectController.deleteMbom);
    // Batch delete MBOMs (expects JSON array in body.ids)
    app.post('/projects/mbom/batch-delete', projectController.batchDeleteMbom);
};