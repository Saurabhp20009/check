const express=require('express')
const verifyToken = require('../Middleware/JWTMiddleware')
const { handleLinkJvzooAccount } = require('../Controllers/JvzooControllers')
const JvzooRouter= express.Router()

JvzooRouter.post("/link/active/account",verifyToken,handleLinkJvzooAccount)


module.exports=JvzooRouter