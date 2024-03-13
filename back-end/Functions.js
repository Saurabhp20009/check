const { google } = require("googleapis");
const { ModelMetaData } = require("./Connection");
const crypto = require("crypto");
const { addingSubscribers } = require("./AweberFunctions");
const mongoose = require("mongoose");
const { ModelAutomationData } = require("./Models/UserModel.js");
const { ModelTestData } = require("./Models/AweberModel.js");
require("./Connection.js");

//Authentication
const auth = new google.auth.GoogleAuth({
  keyFile: "my-project-6051-412211-c4701a7e7602.json",
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const clientId = "zoL6mwfjdAiMsF8wVRVWVpAZ40S0H0Pt";
const clientSecret = "F1HeE25IpnwU5WoGWm3uMEK7ji6A0SO2";
const redirectUri = "https://connectsyncdata.com/callback/aweber";

//function for creating hash for every row
async function createHash(row) {
  const rowDataString = JSON.stringify(row);
  const hash = crypto.createHash("sha256");
  hash.update(rowDataString);
  return hash.digest("hex");
}

async function gettingSheetDataAndStoringInDB(sheetId, sheetName, workflow_id) {
  console.log("Fetching documents from sheet...");
  const sheet = google.sheets({ version: "v4", auth });

  try {
    const spreadsheetId = sheetId;
    const range = `${sheetName}!A1:C`;

    const response = await sheet.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    let rowContainingData = [];

    //filtering rows containing data
    response.data.values.find((element) => {
      if (element.length > 0) {
        rowContainingData.push(element);
      }
    });

    //getting every rows in array

    const rows = rowContainingData;

    const workflow = await ModelAutomationData.findById(workflow_id);

    //getting all data from sheet (first time)
    if (!workflow.LastFetchedRowHashValue) {
      //looping for accessing every elements of rows
      for (let i = 1; i <= rows.length - 1; i++) {
        const rowHash = await createHash(rows[i]);

        const DocumentInstance = new ModelTestData({
          FirstName: rows[i][0],
          LastName: rows[i][1],
          Email: rows[i][2],
          HashValue: rowHash,
        });

        DocumentInstance.save();

        if (i === rows.length - 1) {
          await ModelAutomationData.updateOne(
            { _id: workflow._id },
            { $set: { LastFetchedRowHashValue: rowHash } }
          );
          console.log("Last fetched row hash value is created....");
        }
      }
    }

    // //Getting only updated data from the sheet
    else {
      let FetchingIndex;

      for (let i = 0; i <= rows.length - 1; i++) {
        const rowHash = await createHash(rows[i]);
        if (rowHash === workflow.LastFetchedRowHashValue) {
          FetchingIndex = i + 1;
        }
      }

      if (rows[FetchingIndex]) {
        for (let i = FetchingIndex; i <= rows.length - 1; i++) {
          const rowHash = await createHash(rows[i]);

          const DocumentInstance = new ModelTestData({
            FirstName: rows[i][0],
            LastName: rows[i][1],
            Email: rows[i][2],
            HashValue: rowHash,
          });

          DocumentInstance.save();

          await ModelAutomationData.updateOne(
            { _id: workflow._id },
            { $set: { LastFetchedRowHashValue: rowHash } }
          );
          console.log("Last fetched row hash value is updated....");
        }
      }
    }
  } catch (error) {
    console.log("Unable to fetch data", error);
  }
}

async function fetchDataFromDBAndSendToAPI(workflow) {
  console.log("Sending data to API...");
  //fetching 100 data from db
  const dataInDB = await ModelTestData.find().limit(100);

  if (dataInDB.length <= 100) {
    for (let i = 0; i <= dataInDB.length - 1; i++) {

      const response = await addingSubscribers(dataInDB[i], workflow);

      if (!response) {
        await ModelAutomationData.updateOne(
          { _id: workflow._id },
          {
            $push: {
              ErrorDatas: {
                Email: dataInDB[i].Email,
                HashValue: dataInDB[i].HashValue,
              },
            },
          }
        );
      }

      await ModelTestData.deleteOne({ _id: dataInDB[i]._id });
    }
  } else {
    for (let i = 0; i <= 99; i++) {
      const response = await addingSubscribers(dataInDB[i], workflow);
      if (!response) {
        tempArr.push({
          Email: dataInDB[i].Email,
          HashValue: dataInDB[i].HashValue,
        });
        await ModelAutomationData.updateOne(
          { _id: workflow._id },
          {
            $push: {
              ErrorDatas: {
                Email: dataInDB[i].Email,
                HashValue: dataInDB[i].HashValue,
              },
            },
          }
        );
      }

      await ModelTestData.deleteOne({ _id: dataInDB[i]._id });
    }
  }
    checkDataInDB = await ModelTestData.find();
  console.log(checkDataInDB);

  if (checkDataInDB.length <= 0) {
    await ModelAutomationData.updateOne(
      { _id: workflow._id },
      { $set: { Status: "finished" } }
    );
  }
}

module.exports = {
  gettingSheetDataAndStoringInDB,
  fetchDataFromDBAndSendToAPI,
};
