const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const axios = require("axios");
const { JVZooAccount } = require("../Models/JvzooModel");

// Function to validate the API key
const validateApiKey = async (apiKey) => {
  const url = "https://api.jvzoo.com/v2.0";

  try {
    const response = await axios.get(url, {
      headers: {
        "Content-Type": "application/json",
      },
      auth: {
        username: apiKey,
        password: "x",
      },
    });

    console.log("API Key is valid");
    console.log("Response:", response.data);
    return true;
  } catch (error) {
    if (error.response) {
      console.log("API Key is invalid");
      console.log("Error response:", error.response.data);
    } else {
      console.log("Error:", error.message);
    }
    return false;
  }
};

const handleLinkJvzooAccount = async (req, res) => {
  const { email, apiKey, name } = req.body;

  // Validate API key
  const isValidApiKey = await validateApiKey(apiKey);
  if (!isValidApiKey) {
    return res.status(400).send("Invalid API key");
  }

  try {
    // Find the account by email
    let account = await JVZooAccount.findOne({ Email: email });
    if (!account) {
      // Create new account if not found
      account = new JVZooAccount({ Email: email, Apis: [] });
    }

    // Check if the API key or name already exists
    const apiExists = account.Apis.some((api) => api.ApiKey === apiKey);
    const nameExists = account.Apis.some((api) => api.Name === name);
    if (apiExists) {
      return res.status(400).send("API key already exists");
    }
    if (nameExists) {
      return res.status(400).send("API name already exists");
    }

    // Append the API key to the apis array
    const newApiData = {
      Name: name,
      ApiKey: apiKey,
    };

    account.Apis.push(newApiData);
    await account.save();

    res.status(200).send("API key saved successfully");
  } catch (error) {
    res.status(500).send("Error processing request: " + error.message);
  }
};


const handleUnLinkJvzooAccount = async (req, res) => {
  const { email, apiKey, name } = req.body;

  // Validate API key
  const isValidApiKey = await validateApiKey(apiKey);
  if (!isValidApiKey) {
    return res.status(400).send("Invalid API key");
  }

  try {
    // Find the account by email
    let account = await JVZooAccount.findOne({ Email: email });
    if (!account) {
      // Create new account if not found
      account = new JVZooAccount({ Email: email, Apis: [] });
    }

    // Check if the API key or name already exists
    const apiExists = account.Apis.some((api) => api.ApiKey === apiKey);
    const nameExists = account.Apis.some((api) => api.Name === name);
    if (apiExists) {
      return res.status(400).send("API key already exists");
    }
    if (nameExists) {
      return res.status(400).send("API name already exists");
    }

    // Append the API key to the apis array
    const newApiData = {
      Name: name,
      ApiKey: apiKey,
    };

    account.Apis.push(newApiData);
    await account.save();

    res.status(200).send("API key saved successfully");
  } catch (error) {
    res.status(500).send("Error processing request: " + error.message);
  }
};

module.exports = {
  handleLinkJvzooAccount,
};
