const express=require('express')
const verifyToken = require('../Middleware/JWTMiddleware')
const { handleActiveCampaignLinkAccount, handleActiveCampaignUnLinkAccount } = require('../Controllers/ActiveCampaignControllers')
const activeCampaignRouter= express.Router()


activeCampaignRouter.post("/link/active/account",verifyToken,handleActiveCampaignLinkAccount)
activeCampaignRouter.delete("/unlink/active/account",verifyToken,handleActiveCampaignUnLinkAccount)


module.exports=activeCampaignRouter