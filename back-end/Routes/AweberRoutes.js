const express=require('express')
const { buildAuthUrlAweber, createTokenAweberAndStoreInDB, checkAweberLink, gettingAweberLists, revokeToken, startAutomation, gettingSpreadSheetsList, gettingSheetsList, restartAutomation, getAllWorkflows, handleRemove, handleEditAutomation, handleDeleteSubscribers,  } = require('../Controllers/AweberControllers')
const { GetSpreadSheetRecords, GetSheetNames } = require('../Controllers/GoogleControllers')
const verifyToken = require('../Middleware/JWTMiddleware')
const aweberRouter= express.Router()


aweberRouter.get("/buildauthurl",verifyToken,buildAuthUrlAweber)
aweberRouter.post("/createtoken",verifyToken,createTokenAweberAndStoreInDB)
aweberRouter.post("/checkaweberlink",verifyToken,checkAweberLink)
aweberRouter.post("/gettinglists",verifyToken,gettingAweberLists)
aweberRouter.get("/gettingspreadsheets",verifyToken,GetSpreadSheetRecords)
aweberRouter.post("/gettingsheets",verifyToken,GetSheetNames)
aweberRouter.post("/startautomation",verifyToken,startAutomation)
aweberRouter.delete("/remove/account",verifyToken,handleRemove)
aweberRouter.post("/edit/automation",verifyToken,handleEditAutomation)
aweberRouter.post("/start/del/automation",verifyToken,handleDeleteSubscribers)


module.exports=aweberRouter