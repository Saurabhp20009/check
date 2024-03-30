const express=require('express')
const { handleSignUp, handleLogin, handleGettingUserInfo, handleGetAutomationData, handleDeleteWorkflow } = require('../Controllers/UserControllers')
const verifyToken = require('../Middleware/JWTMiddleware')
const userRouter= express.Router()


userRouter.post('/signup',handleSignUp)
userRouter.post('/login',handleLogin)
userRouter.post('/gettinguser',handleGettingUserInfo)
userRouter.get('/get/workflows',verifyToken ,handleGetAutomationData)
userRouter.delete('/delete/workflow',verifyToken,handleDeleteWorkflow)

module.exports={userRouter}