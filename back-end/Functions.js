const { google } = require("googleapis");
const { ModelMetaData } = require("./Connection");
const crypto = require("crypto");
const mongoose = require("mongoose");
const { ModelAutomationData } = require("./Models/UserModel.js");
const {
  ModelTestData,
  ModelAweberSubscriberList,
  ModelAweberAutomationData,
  ModelAweberTokenData,
} = require("./Models/AweberModel.js");
const {
  getAccessTokenFromRefreshToken,
} = require("./Controllers/GoogleControllers.js");
const { ModelGoogleTokenData } = require("./Models/GoogleModel.js");

require("./Connection.js");

//Authentication

const CLIENT_ID = "zoL6mwfjdAiMsF8wVRVWVpAZ40S0H0Pt";
const CLIENT_SECRET = "F1HeE25IpnwU5WoGWm3uMEK7ji6A0SO2";
const REDIRECT_URI = "http://localhost:5000/goauth/api/auth/google/callback";

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

const SCOPE = [
  "https://www.googleapis.com/auth/spreadsheets",
  "https://www.googleapis.com/auth/drive",
];

async function gettingSheetDataAndStoringInDB(Email, SpreadSheetId, SheetName) {
  console.log("Fetching documents from sheet...");

  await getAccessTokenFromRefreshToken(Email);

  const TokenData = await ModelGoogleTokenData.findOne({
    Email: Email,
  });

  oauth2Client.setCredentials({ access_token: TokenData.Access_token });

  const sheets = google.sheets({ version: "v4", auth: oauth2Client });

  try {
    const spreadsheetId = SpreadSheetId;
    const range = `${SheetName}!A1:C`;

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    let rowContainingData = [];

    //filtering rows containing data

    {
      response.data.values.find((element) => {
        if (element.length > 0) {
          rowContainingData.push(element);
        }
      });
    }

    //getting every rows in array

    const rows = rowContainingData;

    //getting all data from sheet (first time)
    {
      //looping for accessing every elements of rows
      for (let i = 1; i <= rows.length - 1; i++) {
        const DocumentInstance = new ModelAweberSubscriberList({
          FirstName: rows[i][0],
          LastName: rows[i][1],
          Email: rows[i][2],
        });

        await DocumentInstance.save();
        // //Getting only updated data from the sheet
      }
    }
  } catch (error) {
    console.log("Unable to fetch data", error);
  }
}

async function fetchDataFromDBAndSendToAPI(Workflow) {
  console.log("Sending data to API...");
  //fetching 100 data from db
  const dataInDB = await ModelAweberSubscriberList.find().limit(100);

  for (let i = 0; i <= dataInDB.length - 1; i++) {
    //console.log(dataInDB[i])

    const response = await addingSubscribers(dataInDB[i], Workflow);
    let record = {
      firstName: dataInDB[i].FirstName,
      lastName: dataInDB[i].LastName,
      email: dataInDB[i].Email,
    };

    if (!response) {
      const check = await ModelAweberAutomationData.updateOne(
        {
          _id: Workflow._id,
        },
        { $push: { ErrorRecords: record } }
      );
      console.log("Aweber Error Record updated...");
    }

    await ModelAweberSubscriberList.deleteOne({ _id: dataInDB[i]._id });
  }

  if (dataInDB.length <= 0) {
    await ModelAweberAutomationData.updateOne(
      { _id: Workflow._id },
      { $set: { Status: "Finished" } }
    );
  }
}

async function addingSubscribers(data, Workflow) {
  const TokenData = await ModelAweberTokenData.findOne({
    email: Workflow.Email,
  });

  const accessToken = TokenData.access_token;
  const apiUrl = `https://api.aweber.com/1.0/accounts/1756373/lists/${Workflow.AweberListId}/subscribers`;

  const headers = {
    Accept: "application/json",
    "Content-Type": "application/json",
    "User-Agent": "AWeber-Node-code-sample/1.0",
    Authorization: `Bearer ${accessToken}`,
  };
  const body = JSON.stringify({
    name: data.FirstName + data.LastName,
    email: data.Email,
  });

  const response = await fetch(apiUrl, {
    headers: headers,
    method: "POST",
    body: body,
  });

  if (response.status === 201) {
    console.log(`Subscriber created for email ${data.Email}`, response.status);
    return true;
  } else {
    console.log(
      `Subscriber not created for email ${data.Email}`,
      response.status
    );

    return false;
  }
}

module.exports = {
  gettingSheetDataAndStoringInDB,
  fetchDataFromDBAndSendToAPI,
};
