const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const UserSchema = new Schema([
  {
    email: String,
    username: String,
    password: String,
  }
]);

const AutomationDataSchema = new Schema([
  { 
    Name: String,
    Email: String,
    SheetId: String,
    SheetName: String,
    AweberListId: String,
    LastTimeTrigged: String,
    LastFetchedRowHashValue: String,
    Status: String,
    ErrorDatas : [{Email: String, HashValue: String}]
  },
]);

const ModelUserData = mongoose.model("UserData", UserSchema);
const ModelAutomationData = mongoose.model(
  "AutomationData",
  AutomationDataSchema
);

module.exports = { ModelUserData, ModelAutomationData };
