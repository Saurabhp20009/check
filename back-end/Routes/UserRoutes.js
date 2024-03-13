const express=require('express')
const { handleSignUp, handleLogin, handleGettingUserInfo } = require('../Controllers/UserControllers')
const userRouter= express.Router()


userRouter.post('/signup',handleSignUp)
userRouter.post('/login',handleLogin)
userRouter.post('/gettinguser',handleGettingUserInfo)


module.exports={userRouter}