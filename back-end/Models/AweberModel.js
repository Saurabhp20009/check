const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const AweberSubscribersSchema = new Schema({
  UserEmail: String,
  SubscriberRecords: [
    {
      FirstName: String,
      LastName: String,
      Email: String,
    },
  ],
});

const TokenDataSchema = new Schema({
  access_token: String,
  refresh_token: String,
  email: String,
  Refresh_time: String,
  Account_id: String
});

const AweberAutomationDataSchema = new Schema([
  {
    Name: String,
    AppName: String,
    AppId: Number,
    Email: String,
    SheetId: String,
    SheetName: String,
    AweberListId: String,
    Status: String,
    Operation: {
      sheetToApp: Boolean,
    },
    DataInDB: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ModelAweberSubscriberList",
    },
    ErrorRecords: [{ firstName: String, lastName: String, email: String }],
  },
]);

const ModelAweberSubscriberList = mongoose.model(
  "AweberSubscriberList",
  AweberSubscribersSchema
);
const ModelAweberTokenData = mongoose.model("AweberTokenData", TokenDataSchema);
const ModelAweberAutomationData = mongoose.model(
  "AweberAutomationData",
  AweberAutomationDataSchema
);

module.exports = {
  ModelAweberSubscriberList,
  ModelAweberTokenData,
  ModelAweberAutomationData,
};
