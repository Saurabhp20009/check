const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const GoogleTokenDataSchema = new Schema([
  {
    Access_token: String,
    Refresh_token: String,
    Email: String,
  },
]);

const ModelGoogleTokenData = mongoose.model(
  "GoogleTokenData",
  GoogleTokenDataSchema
);

module.exports = { ModelGoogleTokenData };
