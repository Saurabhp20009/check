const express = require("express");
const verifyToken = require("../Middleware/JWTMiddleware");
const {
  createGetResponseAccountInDB,
  GetCampaign,
  RemoveAccount,
  handleStartAutomation,
  handleEditAutomation,
} = require("../Controllers/GetResponseControllers");
const GetResponseRouter = express.Router();

GetResponseRouter.post(
  "/create/account",
  verifyToken,
  createGetResponseAccountInDB
);
GetResponseRouter.get("/get/campaign", verifyToken, GetCampaign);
GetResponseRouter.post("/start/automation", verifyToken, handleStartAutomation);
GetResponseRouter.post("/edit/automation", verifyToken, handleEditAutomation);

GetResponseRouter.delete("/remove/account", verifyToken, RemoveAccount);

module.exports = GetResponseRouter;
