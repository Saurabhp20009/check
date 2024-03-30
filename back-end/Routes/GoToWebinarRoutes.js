const express=require('express')
const { GotoWebinarCallback, linkGotoWebinarAccount, StartGoToWebinarAutomation } = require('../Controllers/GotoWebinarControllers')
const verifyToken = require('../Middleware/JWTMiddleware')

const GoToWebinarRouter= express.Router()

GoToWebinarRouter.get('/login',verifyToken,linkGotoWebinarAccount)
GoToWebinarRouter.get('/login/oauth2/code/goto',GotoWebinarCallback)
GoToWebinarRouter.post('/start/automation',verifyToken,StartGoToWebinarAutomation)

module.exports=GoToWebinarRouter