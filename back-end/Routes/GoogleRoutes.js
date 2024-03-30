const express = require("express");
const {
  LinkGoogleAccount,
  GoogleOAuthCallBackHandle,
  GetSpreadSheetRecords,
  GetSheetNames,
} = require("../Controllers/GoogleControllers");
const verifyToken = require("../Middleware/JWTMiddleware");
const CORSFunction = require("../Middleware/CORSMiddleware");

const GoogleRouter = express.Router();

GoogleRouter.get(
  "/link",verifyToken,
  LinkGoogleAccount
);
GoogleRouter.get("/auth/google/callback",GoogleOAuthCallBackHandle);
GoogleRouter.get("/get/spreadsheets", verifyToken,GetSpreadSheetRecords);
GoogleRouter.post("/get/sheetsnames",verifyToken,GetSheetNames);



module.exports = GoogleRouter;
