const express=require('express')
const { buildAuthUrlAweber, createTokenAweberAndStoreInDB, checkAweberLink, gettingAweberLists, revokeToken, startAutomation, gettingSpreadSheetsList, gettingSheetsList, restartAutomation, getAllWorkflows,  } = require('../Controllers/AweberControllers')
const aweberRouter= express.Router()


aweberRouter.get("/buildauthurl",buildAuthUrlAweber)
aweberRouter.post("/createtoken",createTokenAweberAndStoreInDB)
aweberRouter.post("/checkaweberlink",checkAweberLink)
aweberRouter.post("/gettinglists",gettingAweberLists)
aweberRouter.post("/revoketoken",revokeToken)
aweberRouter.get("/gettingspreadsheets",gettingSpreadSheetsList)
aweberRouter.post("/gettingsheets",gettingSheetsList)
aweberRouter.post("/startautomation",startAutomation)
aweberRouter.post("/restartautomation",restartAutomation)
aweberRouter.post("/getallworkflows",getAllWorkflows)

module.exports=aweberRouter