const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const GTWRegistrantSchemaInDB = new Schema({
  UserEmail: String,
  RegistrantRecords: [{ FirstName: String, LastName: String, Email: String }],
});

const GTWUserTokenSchema = new Schema({
  Access_token: String,
  Refresh_token: String,
  Refresh_time: String,
  Email: String,
  Account_number: String,
  Client_id: String,
  Client_secret: String,
});

const GTWAutomationDataSchema = new Schema({
  Name: String,
  AppName: String,
  AppId: Number,
  SpreadSheetId: String,
  SheetName: String,
  WebinarId: String,
  Status: String,
  Email: String,
  Operation: Number,
  DataInDB: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "GotoWebinerListInDB",
  },
  ErrorRecords: [
    {
      firstName: String,
      lastName: String,
      email: String,
    },
  ],
});

const GTWToGoogleSheetAutomationDataSchema = new Schema({
  Name: String,
  AppName: String,
  AppId: Number,
  SpreadSheetId: String,
  SheetName: String,
  WebinarId: String,
  Status: String,
  Email: String,
  Operation: Number,
});

const GTWToAppAutomationDataSchema = new Schema({
  Name: String,
  AppName: String,
  AppId: Number,
  WebinarId: String,
  ListId: String,
  Status: String,
  Email: String,
  Operation: Number ,
  DataInDB: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "GotoWebinerListInDB",
  },
  ErrorRecords: [
    {
      firstName: String,
      lastName: String,
      email: String,
    },
  ],
});

const GotoWebinerListInDB = mongoose.model(
  "GTWRegistrantList",
  GTWRegistrantSchemaInDB
);
const GoToWebinarTokenData = mongoose.model(
  "GTWTokenDatas",
  GTWUserTokenSchema
);
const GoToWebinarAutomationData = mongoose.model(
  "GTWAutomationData",
  GTWAutomationDataSchema
);

const GoToWebinarToGoogleSheetAutomationData = mongoose.model(
  "GTWToGoogleSheetAutomationData",
  GTWToGoogleSheetAutomationDataSchema
);

const GoToWebinarToAppAutomationData = mongoose.model(
  "GTWToAppAutomationData",
  GTWToAppAutomationDataSchema
);

module.exports = {
  GotoWebinerListInDB,
  GoToWebinarTokenData,
  GoToWebinarAutomationData,
  GoToWebinarToGoogleSheetAutomationData,
  GoToWebinarToAppAutomationData
};
