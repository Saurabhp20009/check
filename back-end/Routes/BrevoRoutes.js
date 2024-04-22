const express=require('express')
const verifyToken = require('../Middleware/JWTMiddleware')
const { createBrevoAccountInDB, StartAutomation, RemoveAccount } = require('../Controllers/BrevoControllers')
const BrevoRouter= express.Router()


BrevoRouter.post("/create/account",verifyToken,createBrevoAccountInDB)
BrevoRouter.post("/start/automation",verifyToken,StartAutomation)
BrevoRouter.delete("/delete/account",verifyToken,RemoveAccount)


module.exports=BrevoRouter