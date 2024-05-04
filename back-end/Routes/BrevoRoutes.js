const express=require('express')
const verifyToken = require('../Middleware/JWTMiddleware')
const { createBrevoAccountInDB, StartAutomation, RemoveAccount, handleEditAutomation } = require('../Controllers/BrevoControllers')
const BrevoRouter= express.Router()


BrevoRouter.post("/create/account",verifyToken,createBrevoAccountInDB)
BrevoRouter.post("/start/automation",verifyToken,StartAutomation)
BrevoRouter.delete("/delete/account",verifyToken,RemoveAccount)
BrevoRouter.post('/edit/automation',verifyToken,handleEditAutomation)


module.exports=BrevoRouter