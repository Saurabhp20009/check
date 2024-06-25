const express = require("express");
const verifyToken = require("../Middleware/JWTMiddleware");
const { handleCreateAccount, handleRemoveAccount, handleStartAutomation, handleEditAutomation, handleStartAutomationDel } = require("../Controllers/SendyController");
const SendyRouter = express.Router();

SendyRouter.post("/create/account",verifyToken,handleCreateAccount );
SendyRouter.post("/start/automation",verifyToken,handleStartAutomation);
SendyRouter.delete("/remove/account",verifyToken,handleRemoveAccount);
SendyRouter.post("/edit/automation",verifyToken,handleEditAutomation);
SendyRouter.post('/start/del/automation',verifyToken,handleStartAutomationDel)



module.exports = SendyRouter;
