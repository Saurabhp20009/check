const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Define the API schema
const accountSchema = new Schema({
  PixelId: { type: String, required: true },
  AccessToken: { type: String, required: true },
});

// Define the JVZoo Account schema
const FacebookConversionAccountSchema = new Schema({
  Email: { type: String, required: true, unique: true },
  Accounts : [accountSchema],
});

// Create the models
const FacebookConversionAccount = mongoose.model('FacebookConversionAccount', FacebookConversionAccountSchema);

module.exports = {
    FacebookConversionAccount,
};
