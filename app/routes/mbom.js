//import the js functions from the mbomController.js file and write them to a variable mbomController
const mbomController = require('../controllers/mbomController.js');

//export a function of app (this exposes these functions to server.js
//and completes the connection between server-router-controller-view)
module.exports = function(app) {


/***********************************************
 BOM'S SECTION
 ***********************************************/

//get request to /MBOM url => MBOM()
app.get('/MBOM',  mbomController.MBOM);

//post request to /createMBOM url => createMBOM()
app.post('/createMBOM',  mbomController.createMBOM);

//post request to /copyMBOM url => copyMBOM()
app.post('/copyMBOM', mbomController.copyMBOM);

//post request to /editMBOM url => editMBOM()
app.post('/editMBOM',  mbomController.editMBOM);

//get request to /searchMBOM/ url => searchMBOMGet()
app.get('/searchMBOM/', mbomController.searchMBOMGet);


/***********************************************
 BRK ACC BEFORE SAVED IN DB
 ***********************************************/
//post request to /addBreakerAcc url => addBreakerAcc()
app.post('/addBreakerAcc', mbomController.addBreakerAcc);

//post request to /editBreakerAcc url => editBreakerAcc()
app.post('/editBreakerAcc', mbomController.editBreakerAcc);

//post request to /deleteBreakerAcc url => deleteBreakerAcc()
app.post('/deleteBreakerAcc', mbomController.deleteBreakerAcc);


/***********************************************
 BRK ACC FROM EDIT
 ***********************************************/
//post request to /addBreakerAccFromEdit url => addBrkAccFromEdit()
app.post('/addBreakerAccFromEdit', mbomController.addBrkAccFromEdit);

//post request to /editBreakerAccFromEdit url => editBrkAccFromEdit()
app.post('/editBreakerAccFromEdit', mbomController.editBrkAccFromEdit);

//post request to /deleteBreakerAccFromEdit url => deleteBrkAccFromEdit()
app.post('/deleteBreakerAccFromEdit', mbomController.deleteBrkAccFromEdit);


/***********************************************
 COM ITEM TABLE
 ***********************************************/
//get request to /createComItem url => createComItemTableGET()
app.get('/createComItem', mbomController.createComItemTableGET);

//post request to /createComItem url => createComItemTablePOST()
app.post('/createComItem', mbomController.createComItemTablePOST);

//get request to /editComItemTableGET url => editComItemTableGET()
app.get('/editComItemTableGET', mbomController.editComItemTableGET);

//post request to /editComItemTablePOST url => editComItemTablePOST()
app.post('/editComItemTablePOST', mbomController.editComItemTablePOST);


/***********************************************
 COM ITEM IN MBOM
 ***********************************************/
//post request to /addComItem url => addComItem()
app.post('/addComItem', mbomController.addComItem);

//post request to /editComItem url => editComItem()
app.post('/editComItem', mbomController.editComItem);

//post request to /editComItemSave url => editComItemSave()
app.post('/editComItemSave', mbomController.editComItemSave);


/***********************************************
 USER ITEM IN MBOM
 ***********************************************/
//post request to /createUserItem url => createUserItem()
app.post('/createUserItem', mbomController.createUserItem);

//post request to /editUserItem url => editUserItem()
app.post('/editUserItem', mbomController.editUserItem);

//post request to /editUserItemSave url => editUserItemSave()
app.post('/editUserItemSave', mbomController.editUserItemSave);


/***********************************************
 COM AND USER ITEM IN MBOM
 ***********************************************/
//post request to /copyItem url => copyItem()
app.post('/copyItem', mbomController.copyItem);

//post request to /deleteItem url => deleteItem()
app.post('/deleteItem', mbomController.deleteItem);


/***********************************************
 BREAKERS IN MBOM
 ***********************************************/
//post request to /addBrk url => addBrk()
app.post('/addBrk', mbomController.addBrk);

//post request to /copyBreaker url => copyBreaker()
app.post('/copyBreaker', mbomController.copyBreaker);

//post request to /editBreaker url => editBreaker()
app.post('/editBreaker', mbomController.editBreaker);

//post request to /editBreakerSave url => editBreakerSave()
app.post('/editBreakerSave', mbomController.editBreakerSave);

//post request to /deleteBreaker url => deleteBreaker()
app.post('/deleteBreaker', mbomController.deleteBreaker);


/***********************************************
 SECTION CONFIGURE IN MBOM
 ***********************************************/
//post request to /mbomAddSection url => mbomAddSection()
app.post('/mbomAddSection', mbomController.mbomAddSection);

//post request to /mbomResetSection url => mbomResetSection()
app.post('/mbomResetSection', mbomController.mbomResetSection);

//post request to /mbomDeleteSection url => mbomDeleteSection()
app.post('/mbomDeleteSection', mbomController.mbomDeleteSection);

//post request to /sectionConfigure url => sectionConfigure()
app.post('/sectionConfigure', mbomController.sectionConfigure);

//post request to /generateMBOM url => generateMBOM()
app.post('/generateMBOM', mbomController.generateMBOM);

};