const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const BigmarkerRegistrantsSchemaInDb = new Schema({
  UserEmail: String,
  SubscriberRecords: [{ FirstName: String, LastName: String, Email: String }],
});

const BigmarkerAutomationDataSchema = new Schema({
  Name: String,
  AppName: String,
  AppId: Number,
  SpreadSheetId: String,
  SheetName: String,
  ConferenceId: String,
  Status: String,
  Email: String,
  Operation: Number ,
  DataInDB: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "BigmarkerRegistrantsInDb",
  },
  ErrorRecords: [
    {
      firstName: String,
      lastName: String,
      email: String,
    },
  ],
});


const BigmarkerToGoogleSheetAutomationDataSchema = new Schema({
  Name: String,
  AppName: String,
  AppId:Number,
  SpreadSheetId: String,
  SheetName: String,
  ConferenceId: String,
  Status: String,
  Email: String,
  Operation: Number,
  DataInDB: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "BigmarkerRegistrantsInDb",
  },
});





const BigmarkerToAppAutomationDataSchema = new Schema({
  Name: String,
  AppName: String,
  AppId:Number,
  WebinarId: String,
  ListId: String,
  Status: String,
  Email: String,
  Operation: Number,
  DataInDB: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "BigmarkerRegistrantsInDb",
  },
  ErrorRecords: [
    {
      firstName: String,
      lastName: String,
      email: String,
    },
  ],
});



const BigmarkerUserDetailsSchemaInDb = new Schema({
  UserEmail: String,
  ApiKey: String,
});

const BigmarkerRegistrantsInDb =  mongoose.model(
  "BigMarkerRegistrantListInDB",
  BigmarkerRegistrantsSchemaInDb
);

const BigmarkerAutomationData = mongoose.model(
  "BigmarkerAutomationDataSchema",
  BigmarkerAutomationDataSchema
);

const BigmarkerUserData = mongoose.model(
    "BigmarkerUserDetailsSchemaInDb",
    BigmarkerUserDetailsSchemaInDb
  );

const BigmarkerToGoogleSheetAutomationData = mongoose.model(
    "BigmarkerToGoogleSheetAutomationDataSchema",
    BigmarkerToGoogleSheetAutomationDataSchema
  );

  const BigmarkerToAppAutomationData = mongoose.model(
    "BigmarkerToAppAutomationDataSchema",
    BigmarkerToAppAutomationDataSchema
  );
  

  module.exports={
    BigmarkerRegistrantsInDb,
    BigmarkerAutomationData,
    BigmarkerUserData,
    BigmarkerToGoogleSheetAutomationData,
    BigmarkerToAppAutomationData
  }