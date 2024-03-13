const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const mySchema = new Schema([
  {
    FirstName: String,
    LastName: String,
    Email: String,
    HashValue: String,
  },
]);

const MetaDataSchema = new Schema([
  {
    LastFetchedRowHashValue: String,
  },
]);

const TokenDataSchema = new Schema([
  {
    access_token: String,
    refresh_token: String,
    email: String,
  },
]);



const ModelTestData = mongoose.model("TestData", mySchema);
const ModelMetaData = mongoose.model("MetaData", MetaDataSchema);
const ModelTokenData = mongoose.model("TokenData", TokenDataSchema);


module.exports = {
  ModelTestData,
  ModelMetaData,
  ModelTokenData,
};
