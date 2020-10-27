const mbomController = require('../controllers/mbomController.js');

module.exports = function(app) {


    /***********************************************
     BOM'S SECTION
     ***********************************************/
    app.get('/MBOM',  mbomController.MBOM);

    app.post('/createMBOM',  mbomController.createMBOM);

    app.post('/copyMBOM', mbomController.copyMBOM);

    app.post('/editMBOM',  mbomController.editMBOM);

    app.get('/searchMBOM/', mbomController.searchMBOMGet);


    /***********************************************
     BRK ACC IN BEFORE SAVED IN DB
     ***********************************************/
    app.post('/addBreakerAcc', mbomController.addBreakerAcc);

    app.post('/editBreakerAcc', mbomController.editBreakerAcc);

    app.post('/deleteBreakerAcc', mbomController.deleteBreakerAcc);


    /***********************************************
     BRK ACC FROM EDIT
     ***********************************************/
    app.post('/addBreakerAccFromEdit', mbomController.addBrkAccFromEdit);

    app.post('/editBreakerAccFromEdit', mbomController.editBrkAccFromEdit);

    app.post('/deleteBreakerAccFromEdit', mbomController.deleteBrkAccFromEdit);


    /***********************************************
     COM ITEM TABLE
     ***********************************************/
    app.get('/createComItem', mbomController.createComItemTableGET);

    app.post('/createComItem', mbomController.createComItemTablePOST);

    app.get('/editComItemTableGET', mbomController.editComItemTableGET);

    app.post('/editComItemTablePOST', mbomController.editComItemTablePOST);


    /***********************************************
     COM ITEM IN MBOM
     ***********************************************/
    app.post('/addComItem', mbomController.addComItem);

    app.post('/editComItem', mbomController.editComItem);

    app.post('/editComItemSave', mbomController.editComItemSave);


    /***********************************************
     USER ITEM IN MBOM
     ***********************************************/
    app.post('/createUserItem', mbomController.createUserItem);

    app.post('/editUserItem', mbomController.editUserItem);

    app.post('/editUserItemSave', mbomController.editUserItemSave);


    /***********************************************
     COM AND USER ITEM IN MBOM
     ***********************************************/
    app.post('/copyItem', mbomController.copyItem);

    app.post('/deleteItem', mbomController.deleteItem);


    /***********************************************
     BREAKERS IN MBOM
     ***********************************************/
    app.post('/addBrk', mbomController.addBrk);

    app.post('/copyBreaker', mbomController.copyBreaker);

    app.post('/editBreaker', mbomController.editBreaker);

    app.post('/editBreakerSave', mbomController.editBreakerSave);

    app.post('/deleteBreaker', mbomController.deleteBreaker);


    /***********************************************
     SECTION CONFIGURE IN MBOM
     ***********************************************/
    app.post('/mbomAddSection', mbomController.mbomAddSection);

    app.post('/mbomResetSection', mbomController.mbomResetSection);

    app.post('/mbomDeleteSection', mbomController.mbomDeleteSection);

    app.post('/sectionConfigure', mbomController.sectionConfigure);

    app.post('/generateMBOM', mbomController.generateMBOM);



};