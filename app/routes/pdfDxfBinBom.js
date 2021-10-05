//import the js functions from the pdfDxfBinBomController.js file and write them to a variable pdfDxfBinBomController
const pdfDxfBinBomController = require('../controllers/pdfDxfBinBomController.js');


//export a function of app (this exposes these functions to server.js
//and completes the connection between server -> router -> controller -> view)
module.exports = function(app) {

    //get request to /PDF-DXF-BIN_BOM url => pdfDxfBinBom()
    app.get('/PDF-DXF-BIN_BOM', pdfDxfBinBomController.pdfDxfBinBom);

    //post request to /setWD url => setWD()
    app.post('/setWD', pdfDxfBinBomController.setWD);

    //post request to /loadDesign url => loadDesign()
    app.post('/loadDesign', pdfDxfBinBomController.loadDesign);

    //post request to /generateAll url => generateAll()
    app.post('/generateAll', pdfDxfBinBomController.generateAll);

};