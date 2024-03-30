const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const GTWRegistrantSchema = new Schema({
  FirstName: String,
  LastName: String,
  Email: String,
});

const GTWUserTokenSchema = new Schema({
  Access_token: String,
  Refresh_token: String,
  Refresh_time: String,
});

const GTWAutomationDataSchema = new Schema({
  Name: String,
  SpreadSheetId: String,
  SheetName: String,
  WebinarId: String,
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

const GoToWebinarList = mongoose.model(
  "GTWRegistrantList",
  GTWRegistrantSchema
);
const GoToWebinarTokenData = mongoose.model(
  "GTWTokenDatas",
  GTWUserTokenSchema
);
const GoToWebinarAutomationData = mongoose.model(
  "GTWAutomationData",
  GTWAutomationDataSchema
);

module.exports = {
  GoToWebinarList,
  GoToWebinarTokenData,
  GoToWebinarAutomationData,
};
