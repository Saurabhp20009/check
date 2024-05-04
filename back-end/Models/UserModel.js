const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const UserSchema = new Schema([
  {
    email: String,
    username: String,
    password: String,
  }
]);


const ModelUserData = mongoose.model("UserData", UserSchema);

module.exports = { ModelUserData };
