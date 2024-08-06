const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const TokenDataSchema = new Schema({
    Email: String,
    ApiKey: String,
    AccountName: String

  });
  

  
const ActiveCampaignApiRecordModel = mongoose.model(
    "ActiveCampaignApiRecord",
    TokenDataSchema
  );

  module.exports = {
    ActiveCampaignApiRecordModel
  };
  