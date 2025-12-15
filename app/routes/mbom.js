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
app.post('/projects/:id/createMBOM', mbomController.createMBOM);

//post request to /copyMBOM url => copyMBOM()
app.post('/copyMBOM', mbomController.copyMBOM);
app.post('/projects/:id/copyMBOM', mbomController.copyMBOM);

//post request to /editMBOM url => editMBOM()
app.post('/editMBOM',  mbomController.editMBOM);
app.post('/projects/:id/editMBOM',  mbomController.editMBOM);

//get request to /searchMBOM/ url => searchMBOMGet()
app.get('/searchMBOM/', mbomController.searchMBOMGet);
app.get('/projects/:id/searchMBOM/', mbomController.searchMBOMGet);


/***********************************************
 BRK ACC BEFORE SAVED IN DB
 ***********************************************/
//post request to /addBreakerAcc url => addBreakerAcc()
app.post('/addBreakerAcc', mbomController.addBreakerAcc);
app.post('/projects/:id/addBreakerAcc', mbomController.addBreakerAcc);

//post request to /editBreakerAcc url => editBreakerAcc()
app.post('/editBreakerAcc', mbomController.editBreakerAcc);
app.post('/projects/:id/editBreakerAcc', mbomController.editBreakerAcc);

//post request to /deleteBreakerAcc url => deleteBreakerAcc()
app.post('/deleteBreakerAcc', mbomController.deleteBreakerAcc);
app.post('/projects/:id/deleteBreakerAcc', mbomController.deleteBreakerAcc);


/***********************************************
 BRK ACC FROM EDIT
 ***********************************************/
//post request to /addBreakerAccFromEdit url => addBrkAccFromEdit()
app.post('/addBreakerAccFromEdit', mbomController.addBrkAccFromEdit);
app.post('/projects/:id/addBreakerAccFromEdit', mbomController.addBrkAccFromEdit);

//post request to /editBreakerAccFromEdit url => editBrkAccFromEdit()
app.post('/editBreakerAccFromEdit', mbomController.editBrkAccFromEdit);
app.post('/projects/:id/editBreakerAccFromEdit', mbomController.editBrkAccFromEdit);

//post request to /deleteBreakerAccFromEdit url => deleteBrkAccFromEdit()
app.post('/deleteBreakerAccFromEdit', mbomController.deleteBrkAccFromEdit);
app.post('/projects/:id/deleteBreakerAccFromEdit', mbomController.deleteBrkAccFromEdit);


/***********************************************
 COM ITEM TABLE
 ***********************************************/
//get request to /createComItemTable url => createComItemTableGET()
app.get('/createComItemTable', mbomController.createComItemTableGET);
app.get('/projects/:id/createComItemTable', mbomController.createComItemTableGET);

//post request to /createComItemTable url => createComItemTablePOST()
app.post('/createComItemTable', mbomController.createComItemTablePOST);
app.post('/projects/:id/createComItemTable', mbomController.createComItemTablePOST);

//get request to /editComItemTableGET url => editComItemTableGET()
app.get('/editComItemTableGET', mbomController.editComItemTableGET);
app.get('/projects/:id/editComItemTableGET', mbomController.editComItemTableGET);

//post request to /editComItemTablePOST url => editComItemTablePOST()
app.post('/editComItemTablePOST', mbomController.editComItemTablePOST);
app.post('/projects/:id/editComItemTablePOST', mbomController.editComItemTablePOST);


/***********************************************
 COM ITEM IN MBOM
 ***********************************************/
//post request to /addComItem url => addComItem()
app.post('/addComItemMBOM', mbomController.addComItemMBOM);
app.post('/projects/:id/addComItemMBOM', mbomController.addComItemMBOM);

//post request to /editComItem url => editComItem()
app.post('/editComItemMBOM', mbomController.editComItemMBOM);
app.post('/projects/:id/editComItemMBOM', mbomController.editComItemMBOM);

//post request to /editComItemSave url => editComItemSave()
app.post('/editComItemSave', mbomController.editComItemSave);
app.post('/projects/:id/editComItemSave', mbomController.editComItemSave);

//post request to /updateItemSection url => updateItemSection()
app.post('/updateItemSection', mbomController.updateItemSection);
app.post('/projects/:id/updateItemSection', mbomController.updateItemSection);


/***********************************************
 USER ITEM IN MBOM
 ***********************************************/
//post request to /createUserItem url => createUserItem()
app.post('/createUserItem', mbomController.createUserItem);
app.post('/projects/:id/createUserItem', mbomController.createUserItem);

//post request to /editUserItem url => editUserItem()
app.post('/editUserItem', mbomController.editUserItem);
app.post('/projects/:id/editUserItem', mbomController.editUserItem);

//post request to /editUserItemSave url => editUserItemSave()
app.post('/editUserItemSave', mbomController.editUserItemSave);
app.post('/projects/:id/editUserItemSave', mbomController.editUserItemSave);


/***********************************************
 COM AND USER ITEM IN MBOM
 ***********************************************/
//post request to /copyItem url => copyItem()
app.post('/copyItem', mbomController.copyItem);
app.post('/projects/:id/copyItem', mbomController.copyItem);

//post request to /deleteItem url => deleteItem()
app.post('/deleteItem', mbomController.deleteItem);
app.post('/projects/:id/deleteItem', mbomController.deleteItem);
//post request to /copyItems url => copyItems() (bulk)
app.post('/copyItems', mbomController.copyItems);
app.post('/projects/:id/copyItems', mbomController.copyItems);
//post request to /deleteItems url => deleteItems() (bulk)
app.post('/deleteItems', mbomController.deleteItems);
app.post('/projects/:id/deleteItems', mbomController.deleteItems);


/***********************************************
 BREAKERS IN MBOM
 ***********************************************/
//post request to /addBrk url => addBrk()
app.post('/addBrk', mbomController.addBrk);
app.post('/projects/:id/addBrk', mbomController.addBrk);

//post request to /copyBreaker url => copyBreaker()
app.post('/copyBreaker', mbomController.copyBreaker);
app.post('/projects/:id/copyBreaker', mbomController.copyBreaker);

//post request to /editBreaker url => editBreaker()
app.post('/editBreaker', mbomController.editBreaker);
app.post('/projects/:id/editBreaker', mbomController.editBreaker);

//post request to /editBreakerSave url => editBreakerSave()
app.post('/editBreakerSave', mbomController.editBreakerSave);
app.post('/projects/:id/editBreakerSave', mbomController.editBreakerSave);

//post request to /deleteBreaker url => deleteBreaker()
app.post('/deleteBreaker', mbomController.deleteBreaker);
app.post('/projects/:id/deleteBreaker', mbomController.deleteBreaker);
//post request to /copyBreakers url => copyBreakers() (bulk)
app.post('/copyBreakers', mbomController.copyBreakers);
app.post('/projects/:id/copyBreakers', mbomController.copyBreakers);
//post request to /deleteBreakers url => deleteBreakers() (bulk)
app.post('/deleteBreakers', mbomController.deleteBreakers);
app.post('/projects/:id/deleteBreakers', mbomController.deleteBreakers);


/***********************************************
 SECTION CONFIGURE IN MBOM
 ***********************************************/
//post request to /mbomAddSection url => mbomAddSection()
app.post('/mbomAddSection', mbomController.mbomAddSection);
app.post('/projects/:id/mbomAddSection', mbomController.mbomAddSection);

//post request to /mbomResetSection url => mbomResetSection()
app.post('/mbomResetSection', mbomController.mbomResetSection);
app.post('/projects/:id/mbomResetSection', mbomController.mbomResetSection);

//post request to /mbomDeleteSection url => mbomDeleteSection()
app.post('/mbomDeleteSection', mbomController.mbomDeleteSection);
app.post('/projects/:id/mbomDeleteSection', mbomController.mbomDeleteSection);

//post request to /sectionConfigure url => sectionConfigure()
app.post('/sectionConfigure', mbomController.sectionConfigure);
app.post('/projects/:id/sectionConfigure', mbomController.sectionConfigure);

//post request to /generateMBOM url => generateMBOM()
app.post('/generateMBOM', mbomController.generateMBOM);
app.post('/projects/:id/generateMBOM', mbomController.generateMBOM);

};