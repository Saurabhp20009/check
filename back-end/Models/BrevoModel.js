const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const BrevoUserAccountSchemaInDb = new Schema({
  UserEmail: String,
  SubscriberRecords: [{ FirstName: String, LastName: String, Email: String }],
});

const BrevoAutomationDataSchema = new Schema({
  Name: String,
  AppName: String,
  SpreadSheetId: String,
  SheetName: String,
  Status: String,
  Email: String,
  ListIds: [Number],
  ErrorRecords: [
    {
      firstName: String,
      lastName: String,
      email: String,
    },
  ],
});

const BrevoUserDetailsSchemaInDb = new Schema({
  UserEmail: String,
  ApiKey: String,
});

const BrevoSubscriberListInDB = mongoose.model(
  "BrevoContactListInDB",
  BrevoUserAccountSchemaInDb
);

const BrevoAutomationData = mongoose.model(
  "BrevoAutomationDataSchema",
  BrevoAutomationDataSchema
);

const BrevoUserData = mongoose.model(
  "BrevoUserDetailsInDb",
  BrevoUserDetailsSchemaInDb
);

module.exports = {
  BrevoSubscriberListInDB,
  BrevoAutomationData,
  BrevoUserData,
};
