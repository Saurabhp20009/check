const express=require('express')
const { GotoWebinarCallback, linkGotoWebinarAccount, StartGoToWebinarAutomation, StartAutomationWriteDataInSheetFromWebinar, RemoveGTWAccount, handleEditAutomation, StartAutomationGotoWebinarToApp } = require('../Controllers/GotoWebinarControllers')
const verifyToken = require('../Middleware/JWTMiddleware')

const GoToWebinarRouter= express.Router()

GoToWebinarRouter.post('/login',verifyToken,linkGotoWebinarAccount)
GoToWebinarRouter.get('/login/oauth2/code/goto',GotoWebinarCallback)
GoToWebinarRouter.post('/start/automation',verifyToken,StartGoToWebinarAutomation)
GoToWebinarRouter.post('/start/gtwtosheet/automation',verifyToken,StartAutomationWriteDataInSheetFromWebinar)
GoToWebinarRouter.delete('/remove/account',verifyToken,RemoveGTWAccount)
GoToWebinarRouter.post('/edit/automation',verifyToken,handleEditAutomation)
GoToWebinarRouter.post('/start/gtwtoapp/automation',verifyToken,StartAutomationGotoWebinarToApp)



module.exports=GoToWebinarRouter