require("dotenv").config();
const { AuthorizationCode } = require("simple-oauth2");
const crypto = require("crypto");
const express = require("express");
const { default: axios } = require("axios");
const {
  GoToWebinarTokenData,
  GoToWebinarList,
  GoToWebinarAutomationData,
} = require("../Models/GoToWebinarModel");
const app = express();
const { google } = require("googleapis");
const { ModelGoogleTokenData } = require("../Models/GoogleModel");
const { FetchDataFromSheet } = require("./GoogleControllers");
const cron = require("node-cron");


const oauthConfig = {
  client: {
    id: process.env.OAUTH_CLIENT_ID,
    secret: process.env.OAUTH_CLIENT_SECRET,
  },
  auth: {
    tokenHost: process.env.OAUTH_SERVICE_URL,
  },
};

const oauthClient = new AuthorizationCode(oauthConfig);

const expectedStateForAuthorizationCode = crypto
  .randomBytes(15)
  .toString("hex");

const authorizationUrl = oauthClient.authorizeURL({
  redirect_uri: process.env.OAUTH_REDIRECT_URI,
  scope: "collab:",
  state: expectedStateForAuthorizationCode,
});

const linkGotoWebinarAccount = async (req, res) => {
  res.status(200).json({ AuthUrl: authorizationUrl });
};

const GotoWebinarCallback = async (req, res) => {
  if (req.query.state != expectedStateForAuthorizationCode) {
    console.log("Ignoring authorization code with unexpected state");
    res.sendStatus(403);
  }

  var authorizationCode = req.query.code;

  var tokenParams = {
    code: authorizationCode,
    redirect_uri: process.env.OAUTH_REDIRECT_URI,
    scope: "collab:",
  };

  var tokenResponse = null;

  try {
    tokenResponse = await oauthClient.getToken(tokenParams);
  } catch (error) {
    console.log("Access Token Error", error.message);

    return;
  }

  console.log(tokenResponse.token);

  const DocumentInstance = new GoToWebinarTokenData({
    Access_token: tokenResponse.token.access_token,
    Refresh_token: tokenResponse.token.refresh_token,
    Refresh_time: Math.floor(Date.now() / 1000),
  });

  try {
    await DocumentInstance.save();
    console.log("Token data saved successfully");
  } catch (error) {
    console.error("Error saving token data:", error);
    // Handle error appropriately
  }

  res.json({ message: "Account linked", tokenDatas: tokenResponse });
};

const SendRegistrantDataToAPI = async (WebinarId,GTWAutomationData) => {
  const data = await GoToWebinarList.find();

  await CheckGTWRefreshToken();

  const registrantsArray = data.map((registrant) => ({
    firstName: registrant.FirstName,
    lastName: registrant.LastName,
    email: registrant.Email,
    // Include other fields as needed
  }));

  const sendDataPromises = registrantsArray.map(async (registrant, index) => {
    await sendData(registrant, index, WebinarId,GTWAutomationData);
  });

  //Wait for all promises to resolve
  await Promise.all(sendDataPromises);
  await GoToWebinarList.deleteMany({});
};

async function sendData(registrant, index, WebinarId,GTWAutomationData) {
  return new Promise(async (resolve, reject) => {
    try {
      const tokenData = await GoToWebinarTokenData.find();

      const payload = {
        firstName: registrant.firstName,
        lastName: registrant.lastName,
        email: registrant.email,
        // Include other fields as needed
      };

      const options = {
        method: "POST",
        url: `https://api.getgo.com/G2W/rest/v2/organizers/4721184591451331590/webinars/${WebinarId}/registrants`,
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${tokenData[0].Access_token}`,
        },
        data: payload,
      };

      // Use setTimeout to introduce a delay
      setTimeout(async () => {
        try {
          const response = await axios.request(options);
          console.log(response.data);
          resolve(); // Resolve the promise when the operation is successful
        } catch (error) {
          //console.error("Error sending request:", error);
          console.log(error.response.data);
          if (error.response.status !== 409) {
            await GoToWebinarAutomationData.updateOne(
              { _id: GTWAutomationData._id },
              { $push: { ErrorRecords: payload } }
            );
          }
          resolve(); // Resolve the promise even if there's an error
        }
      }, index * 110); // Delay based on index
    } catch (error) {
      console.error("Error fetching token data:", error);
      reject(error); // Reject the promise if an error occurs
    }
  });
}

const StartGoToWebinarAutomation = async (req, res) => {
  const { email } = req.query;
  const { Name, SpreadSheetId, SheetName, WebinarId } = req.body;

  if (!Name || !SpreadSheetId || !SheetName || !WebinarId || !email) {
    return res.status(400).json({ message: "fields are invalid" });
  }

  const TotalAutomation = await GoToWebinarAutomationData.find({
    Email: email,
    Status: "Running",
  });
  if (TotalAutomation.length > 0) {
    return res.status(400).json({ message: "Already an automation running" });
  }

  try {
    const DocumentInstance = new GoToWebinarAutomationData({
      Name: Name,
      SpreadSheetId: SpreadSheetId,
      SheetName: SheetName,
      WebinarId: WebinarId,
      Status: "Running",
      Email: email,
      ErrorRecords: [],
    });

    const GTWAutomationData = await DocumentInstance.save();
    console.log("Automation created...");

    res
      .status(200)
      .json({ message: `Automation started in background jobs name ${Name}` });

    await FetchDataFromSheet(SpreadSheetId, SheetName, email);
    await SendRegistrantDataToAPI(WebinarId, GTWAutomationData);

    const task = cron.schedule("* * * * *", async () => {
      try {
        const CheckDataInDB = await GoToWebinarList.find();
        console.log(CheckDataInDB);
        if (CheckDataInDB.length <= 0) {
          await GoToWebinarAutomationData.updateOne(
            { _id: GTWAutomationData._id },
            { $set: { Status: "Finished" } }
          );
          console.log("No data in db. Automation is finished....");
          task.stop();
        }
      } catch (error) {
        console.error("Error occurred:", error);
      }
    });

    task.start();
  } catch (error) {
    console.log(error);
    res.status(401).json(error);
  }
};

``;

const CheckGTWRefreshToken = async () => {
  const tokenData = await GoToWebinarTokenData.find().limit(1);

  let currentDateTimeInSeconds = Math.floor(Date.now() / 1000);

  if (parseInt(tokenData[0].Refresh_time) + 1800 > currentDateTimeInSeconds) {
    console.log("token is valid...");
    return;
  }

  const response = await axios.post(
    "https://authentication.logmeininc.com/oauth/token",
    {
      grant_type: "refresh_token",
      refresh_token: tokenData[0].Refresh_token,
    },
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization:
          "Basic ZDM4MjNjOGItNGUyNS00NDdlLTkwZTctZDg0ZWRiM2MwMGZhOmx1c0I1cGtQVklvcE44U3AxbVdCYjFBYQ==",
      },
    }
  );

  try {
    const updateCheck = await GoToWebinarTokenData.updateOne(
      { _id: tokenData[0]._id },
      {
        $set: {
          Access_token: response.data.access_token,
          Refresh_time: Math.floor(Date.now() / 1000),
        },
      }
    );

    console.log("Token GTW data updated successfully...., ", updateCheck);
  } catch (error) {
    console.log("Error.... ", error);
  }

  console.log(response.data);
};

//GetGTWRefreshToken()

//getAccessTokenFromRefreshToken();

//CheckGTWRefreshToken("2956140803390498906");

//CheckGTWRefreshToken();

module.exports = {
  GotoWebinarCallback,
  linkGotoWebinarAccount,
  StartGoToWebinarAutomation,
};
