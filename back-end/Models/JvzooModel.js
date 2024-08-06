const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Define the API schema
const apiSchema = new Schema({
  Name: { type: String, required: true },
  ApiKey: { type: String, required: true },
});

// Define the JVZoo Account schema
const jvzooAccountSchema = new Schema({
  Email: { type: String, required: true, unique: true },
  Apis: [apiSchema],
});

// Create the models
const JVZooAccount = mongoose.model('JVZooAccount', jvzooAccountSchema);

module.exports = {
  JVZooAccount,
};
