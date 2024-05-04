const express = require("express");
const verifyToken = require("../Middleware/JWTMiddleware");
const {
  handleCreateAccount,
  handleRemoveAccount,
  handleStartAutomation,
  handleStartAutomationWebinarToSheet,
  handleEditAutomation,
} = require("../Controllers/BigMarkerControllers");
const BigmarkerRouter = express.Router();

BigmarkerRouter.post("/create/account", verifyToken,handleCreateAccount);
BigmarkerRouter.post("/start/automation",verifyToken, handleStartAutomation);
BigmarkerRouter.post('/start/bigmarkertosheet/automation',verifyToken,handleStartAutomationWebinarToSheet)
BigmarkerRouter.delete("/remove/account",verifyToken, handleRemoveAccount);
BigmarkerRouter.post('/edit/automation',verifyToken,handleEditAutomation)


module.exports = BigmarkerRouter;
