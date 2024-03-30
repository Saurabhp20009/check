const { default: axios } = require("axios");
const express = require("express");
const app = express();
const { google } = require("googleapis");
const { ModelGoogleTokenData } = require("../Models/GoogleModel");
const { GoToWebinarList } = require("../Models/GoToWebinarModel");

const CLIENT_ID =
  "682751091317-vsefliu7rhk0ndf2p7dqpc9k8bsjvjp4.apps.googleusercontent.com";
const REDIRECT_URI = "http://localhost:8000/goauth/api/auth/google/callback";
const CLIENT_SECRET = "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";

const SCOPE = [
  "https://www.googleapis.com/auth/spreadsheets",
  "https://www.googleapis.com/auth/drive",
];

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

var Email = null;

const LinkGoogleAccount = async (req, res) => {
  const { email } = req.query;
  Email = email;

  res.header("Access-Control-Allow-Origin", "http://localhost:3000");
  res.header("Referrer-Policy", "no-referrer-when-downgrade");

  const url = oauth2Client.generateAuthUrl({
    access_type: "offline", // Request refresh token
    scope: SCOPE,
    prompt: "consent",
    include_granted_scopes: true,
  });
  res.status(200).json({ AuthUrl: url });
};

const GoogleOAuthCallBackHandle = async (req, res) => {
  const code = req.query.code;
  try {
    const { tokens } = await oauth2Client.getToken(code);
    console.log(tokens);
    const accessToken = tokens.access_token;
    const refreshToken = tokens.refresh_token; // This will contain the refresh token

    const DocumentInstance = new ModelGoogleTokenData({
      Access_token: accessToken,
      Refresh_token: refreshToken,
      Email: Email,
    });

    DocumentInstance.save();
    res.status(200).json({AccessToken: `${accessToken}`, RefreshToken: `${refreshToken}`,message: "Google account connected successfully,token details successfully save in db"});
  } catch (error) {
    console.error("Error exchanging code for tokens:", error);
    res.status(500).send("Failed to authenticate with Google.");
  }
};

const GetSpreadSheetRecords = async (req, res) => {
  const { email } = req.query;

  console.log(email);
  await getAccessTokenFromRefreshToken(email);

  const TokenData = await ModelGoogleTokenData.findOne({
    Email: email,
  });

  if (!TokenData) {
    return console.log("Token data is null");
  }

  oauth2Client.setCredentials({ access_token: TokenData.Access_token });

  const drive = google.drive({ version: "v3", auth: oauth2Client });

  try {
    const response = await drive.files.list({
      q: "mimeType='application/vnd.google-apps.spreadsheet'",
      fields: "files(name,id)",
    });

    console.log(response);

    if (response.status === 200) {
      const files = response.data.files;

      return res.status(200).json({ SpreadSheetData: files });
    }
  } catch (error) {
    return res.status(401).json({ message: error });
  }
};

const GetSheetNames = async (req, res) => {
  const { SheetId } = req.body;
  const { email } = req.query;

  console.log(SheetId, email);

  if (!SheetId || !email) {
    return res.status(400).json({ message: "Fields are missing" });
  }

  try {
    await getAccessTokenFromRefreshToken(email);

    const { Access_token } = await ModelGoogleTokenData.findOne({
      Email: email,
    });

    oauth2Client.setCredentials({ access_token: Access_token });

    const sheets = google.sheets({ version: "v4", auth: oauth2Client });

    const response = await sheets.spreadsheets.get({
      spreadsheetId: SheetId,
      fields: "sheets(properties/title)",
    });

    const sheetNames = response.data.sheets.map(
      (sheet) => sheet.properties.title
    );

    res.status(200).json({ Sheets: sheetNames });
  } catch (error) {
    res.status(401).json({ error: error });
  }
};

const FetchDataFromSheet = async (SpreadSheetId, SheetName, email) => {
  await getAccessTokenFromRefreshToken(email);

  const TokenData = await ModelGoogleTokenData.findOne({
    Email: email,
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
        const DocumentInstance = new GoToWebinarList({
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
};

async function getAccessTokenFromRefreshToken(Email) {
  const { Access_token, Refresh_token } = await ModelGoogleTokenData.findOne({
    Email: Email,
  });

  const TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
  const tokenInfoUrl = `https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=${Access_token}`;
  const response = await fetch(tokenInfoUrl);
  const tokenInfo = await response.json();

  if (!response.ok) {
    // If the response status is not OK, there was an error validating the token
    console.error(
      `Failed to validate access token: ${
        tokenInfo.error_description || tokenInfo.error
      }`
    );
  }

  const now = Date.now() / 1000;

  if (tokenInfo.exp > now) {
    return console.log("Google access token is valid...");
  }

  try {
    const tokenResponse = await axios.post(TOKEN_ENDPOINT, {
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      refresh_token: Refresh_token,
      grant_type: "refresh_token",
    });

    console.log(tokenResponse);

    try {
      if (tokenResponse.status === 200) {
        const r = await ModelGoogleTokenData.updateOne(
          { Email: "saurabhpatwal92000@gmail.com" },
          { $set: { Access_token: tokenResponse.data.access_token } }
        );

        console.log("Token updated successfully.");
      }
    } catch (error) {
      console.error("Error updating token:", error);
    }
  } catch (error) {
    console.error("Error refreshing token:", error);
  }
}

module.exports = {
  LinkGoogleAccount,
  GoogleOAuthCallBackHandle,
  GetSpreadSheetRecords,
  GetSheetNames,
  FetchDataFromSheet,
  getAccessTokenFromRefreshToken,
};
