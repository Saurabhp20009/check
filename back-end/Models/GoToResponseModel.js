const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const GetResponseUserAccountSchemaInDb = new Schema({
  UserEmail: String,
  SubscriberRecords: [{ FirstName: String, LastName: String, Email: String }],
});

const GetResponseAutomationDataSchema = new Schema({
  Name: String,
  AppName: String,
  SpreadSheetId: String,
  SheetName: String,
  CampaignId: String,
  Status: String,
  Email: String,
  ErrorRecords: [
    {
      firstName: String,
      lastName: String,
      email: String,
    },
  ],
});

const GetResponseUserDetailsSchemaInDb = new Schema({
  UserEmail: String,
  ApiKey: String,
});

const GetResponseSubscriberListInDB = mongoose.model(
  "GetResponseSubscriberListInDB",
  GetResponseUserAccountSchemaInDb
);

const GetResponseAutomationData = mongoose.model(
  "GetResponseAutomationDataSchema",
  GetResponseAutomationDataSchema
);

const GetResponseUserData = mongoose.model(
    "GetResponseUserDetailsInDb",
    GetResponseUserDetailsSchemaInDb
  );