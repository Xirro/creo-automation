const pdfDxfBinBomController = require('../controllers/pdfDxfBinBomController.js');


module.exports = function(app) {

    //PDF, DXF, BIN BOM Script GET request
    app.get('/PDF-DXF-BIN_BOM', pdfDxfBinBomController.pdfDxfBinBom);

    //Set Working Directory POST request
    app.post('/setWD', pdfDxfBinBomController.setWD);

    //Load Drawings from current working directory
    app.post('/loadDesign', pdfDxfBinBomController.loadDesign);

    //Generate BIN BOMs and Drawings POST request
    app.post('/generateAll', pdfDxfBinBomController.generateAll);

    //Generate Drawings POST request
    app.post('/generateDrawings', pdfDxfBinBomController.generateDrawings);

    //Generate BIN BOMS POST request
    app.post('/generateBinBoms', pdfDxfBinBomController.generateBinBoms);

};