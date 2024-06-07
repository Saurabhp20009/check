const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const SendyRegistrantsSchemaInDb = new Schema({
  UserEmail: String,
  SubscriberRecords: [{ FirstName: String, LastName: String, Email: String }],
});

const SendyAutomationDataSchema = new Schema({
  Name: String,
  AppName: String,
  AppId: Number,
  SpreadSheetId: String,
  SheetName: String,
  ListId: String,
  Status: String,
  Email: String,
  Operation: Number,
  DataInDB: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "SendyRegistrants",
  },
  ErrorRecords: [
    {
      firstName: String,
      lastName: String,
      email: String,
    },
  ],
});



const SendyUserDetailsSchemaInDb = new Schema({
  UserEmail: String,
  SendyUrl: String,
  ApiKey: String,
});

const SendyRegistrants = mongoose.model(
  "SendyRegistrantsSchemaInDb",
  SendyRegistrantsSchemaInDb
);

const SendyAutomationData = mongoose.model(
  "SendyAutomationDataSchema",
  SendyAutomationDataSchema
);

const SendyUserDetails = mongoose.model(
  "SendyUserDetailsSchemaInDb",
  SendyUserDetailsSchemaInDb
);

module.exports = {
  SendyRegistrants,
  SendyAutomationData,
  SendyUserDetails,
};
