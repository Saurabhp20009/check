require("dotenv").config();
const { AuthorizationCode } = require("simple-oauth2");
const crypto = require("crypto");
const express = require("express");
const { default: axios } = require("axios");
const {
  GoToWebinarTokenData,
  GotoWebinerListInDB,
  GoToWebinarAutomationData,
  GoToWebinarToGoogleSheetAutomationData,
} = require("../Models/GoToWebinarModel");
const app = express();
const { google } = require("googleapis");
const { ModelGoogleTokenData } = require("../Models/GoogleModel");
const {
  FetchDataFromSheet,
  getAccessTokenFromRefreshToken,
} = require("./GoogleControllers");
const cron = require("node-cron");

let Email;

const GTWUrls = {
  OAUTH_SERVICE_URL: "https://authentication.logmeininc.com",
  OAUTH_REDIRECT_URI:
    "http://connectsyncdata.com:5000/gotowebinar/api/login/oauth2/code/goto",
};

let oauthConfig = {
  client: {
    id: null,
    secret: null,
  },
  auth:{
    tokenHost: null
  }
};

var expectedStateForAuthorizationCode = crypto.randomBytes(15).toString("hex");

const linkGotoWebinarAccount = async (req, res) => {
  const { email } = req.query;
  const { client_id, client_secret } = req.body;

  Email = email;

  console.log(Email);

   oauthConfig = {
    client: {
      id: client_id,
      secret: client_secret,
    },
    auth:{
      tokenHost: GTWUrls.OAUTH_SERVICE_URL
    }
  };

  // if (Email === "ychoudhary320@gmail.com") {
  //   oauthConfig = {
  //     client: {
  //       id: yogeshSir.OAUTH_CLIENT_ID,
  //       secret: yogeshSir.OAUTH_CLIENT_SECRET,
  //     },
  //     auth: {
  //       tokenHost: yogeshSir.OAUTH_SERVICE_URL,
  //     },
  //   };
  // } else {
  //   oauthConfig = {
  //     client: {
  //       id: NehaMam.OAUTH_CLIENT_ID,
  //       secret: NehaMam.OAUTH_CLIENT_SECRET,
  //     },
  //     auth: {
  //       tokenHost: NehaMam.OAUTH_SERVICE_URL,
  //     },
  //   };
  // }

  console.log(oauthConfig);
  const oauthClient = new AuthorizationCode(oauthConfig);

  const authorizationUrl = oauthClient.authorizeURL({
    redirect_uri: GTWUrls.OAUTH_REDIRECT_URI,
    scope: "collab:",
    state: expectedStateForAuthorizationCode,
  });

  res.status(200).json({ AuthUrl: authorizationUrl });
};

const GotoWebinarCallback = async (req, res) => {
  if (req.query.state != expectedStateForAuthorizationCode) {
    console.log("Ignoring authorization code with unexpected state");
    res.sendStatus(403);
  }

  var authorizationCode = req.query.code;

  // if (Email === "ychoudhary320@gmail.com") {
  //   oauthConfig = {
  //     client: {
  //       id: yogeshSir.OAUTH_CLIENT_ID,
  //       secret: yogeshSir.OAUTH_CLIENT_SECRET,
  //     },
  //     auth: {
  //       tokenHost: yogeshSir.OAUTH_SERVICE_URL,
  //     },
  //   };
  // } else {
  //   oauthConfig = {
  //     client: {
  //       id: NehaMam.OAUTH_CLIENT_ID,
  //       secret: NehaMam.OAUTH_CLIENT_SECRET,
  //     },
  //     auth: {
  //       tokenHost: NehaMam.OAUTH_SERVICE_URL,
  //     },
  //   };
  // }
  const oauthClient = new AuthorizationCode(oauthConfig);

  var tokenParams = {
    code: authorizationCode,
    redirect_uri: GTWUrls.OAUTH_REDIRECT_URI,
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

  const GetAccountNumber = await axios.get(
    "https://api.getgo.com/identity/v1/Users/me",
    {
      headers: { Authorization: `Bearer ${tokenResponse.token.access_token}` },
    }
  );

  const DocumentInstance = new GoToWebinarTokenData({
    Access_token: tokenResponse.token.access_token,
    Refresh_token: tokenResponse.token.refresh_token,
    Refresh_time: Math.floor(Date.now() / 1000),
    Email: Email,
    Account_number: GetAccountNumber.data.id,
    Client_id: oauthConfig.client.id,
    Client_secret:oauthConfig.client.secret

  });

  try {
    await DocumentInstance.save();
    console.log("Token data saved successfully");
    res
      .status(200)
      .json({ message: "Account linked", tokenDatas: tokenResponse });
  } catch (error) {
    console.error("Error saving token data:", error);
    res.status(502).json({ message: error });
    // Handle error appropriately
  }
};

const SendRegistrantDataToAPI = async (WebinarId, GTWAutomationData, email) => {
  const userRecords = await GotoWebinerListInDB.findOne({ UserEmail: email });

  //Checking user's GotoWebinar token is valid or not
  await CheckGTWRefreshToken(email);

  const registrantsArray = userRecords.RegistrantRecords.map((registrant) => ({
    firstName: registrant.FirstName,
    lastName: registrant.LastName,
    email: registrant.Email,
  }));

  //Getting remaining registrant from list
  const RemainingRegistrant = await GetRemainingRegistrant(
    WebinarId,
    email,
    registrantsArray
  );

  //Syncing the data in webinar
  const sendDataPromises = RemainingRegistrant.map(
    async (registrant, index) => {
      await sendData(registrant, index, WebinarId, GTWAutomationData, email);
    }
  );

  //Wait for all promises to resolve
  await Promise.all(sendDataPromises);
  await GotoWebinerListInDB.deleteMany({ UserEmail: email });
};

async function sendData(
  registrant,
  index,
  WebinarId,
  GTWAutomationData,
  email
) {
  return new Promise(async (resolve, reject) => {
    try {
      const payload = {
        firstName: registrant.firstName,
        lastName: registrant.lastName,
        email: registrant.email,
      };

      const account = await GoToWebinarTokenData.findOne({ Email: email });

      const options = {
        method: "POST",
        url: `https://api.getgo.com/G2W/rest/v2/organizers/${account.Account_number}/webinars/${WebinarId}/registrants`,
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${account.Access_token}`,
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
          // console.log(error.response.data);
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

  //checking for any automation running currently?
  const TotalAutomation = await GoToWebinarAutomationData.find({
    Email: email,
    Status: "Running",
  });
  if (TotalAutomation.length > 0) {
    return res.status(400).json({ message: "Already an automation running" });
  }

  try {
    //creating an automation record in DB
    const DocumentInstance = new GoToWebinarAutomationData({
      Name: Name,
      AppName: "GoToWebinar",
      SpreadSheetId: SpreadSheetId,
      SheetName: SheetName,
      WebinarId: WebinarId,
      Status: "Running",
      Email: email,
      ErrorRecords: [],
    });

    const GTWAutomationData = await DocumentInstance.save();
    console.log("Automation created...");

    await GotoWebinerListInDB.deleteMany({ UserEmail: email });

    res
      .status(200)
      .json({ message: `Automation started in background jobs name ${Name}` });

    await FetchDataFromSheet(SpreadSheetId, SheetName, email);
    await SendRegistrantDataToAPI(WebinarId, GTWAutomationData, email);

    const task = cron.schedule("* * * * *", async () => {
      try {
        const CheckDataInDB = await GotoWebinerListInDB.find();
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

const GetRemainingRegistrant = async (WebinarId, email, registrantsArray) => {
  const account = await GoToWebinarTokenData.findOne({ Email: email });

  const RemainingRegistrant = [];

  try {
    var options = {
      method: "GET",
      url: `https://api.getgo.com/G2W/rest/v2/organizers/${account.Account_number}/webinars/${WebinarId}/registrants`,
      //params: {page: 'SOME_INTEGER_VALUE', limit: 'SOME_INTEGER_VALUE'},
      headers: { Authorization: `Bearer ${account.Access_token}` },
    };

    const response = await axios.request(options);
    console.log(response);

    const RegistredRegistrantsEmails = response.data.map((obj) => obj.email);

    registrantsArray.forEach((item) => {
      if (!RegistredRegistrantsEmails.includes(item.email)) {
        RemainingRegistrant.push(item);
      }
    });

    console.log(RemainingRegistrant);
    return RemainingRegistrant;
  } catch (error) {
    console.log(error);
  }
  //console.log(response)
};

const CheckGTWRefreshToken = async (email) => {
  let base64EncodedString;
   
  const {Client_id,Client_secret}= await GoToWebinarTokenData.findOne({Email:email})


  // if (email === "ychoudhary320@gmail.com") {
  //   const combinedString = `${yogeshSir.OAUTH_CLIENT_ID}:${yogeshSir.OAUTH_CLIENT_SECRET}`;
  //   console.log(combinedString);
  //   base64EncodedString = Buffer.from(combinedString).toString("base64");
  // } else {
  //   const combinedString = `${NehaMam.OAUTH_CLIENT_ID}:${NehaMam.OAUTH_CLIENT_SECRET}`;
  //   console.log(combinedString);
  //   base64EncodedString = Buffer.from(combinedString).toString("base64");
  // }
  
  const combinedString = `${Client_id}:${Client_secret}`;
  base64EncodedString = Buffer.from(combinedString).toString("base64");

  console.log(base64EncodedString);

  const tokenData = await GoToWebinarTokenData.findOne({ Email: email });

  let currentDateTimeInSeconds = Math.floor(Date.now() / 1000);

  if (parseInt(tokenData.Refresh_time) + 1800 > currentDateTimeInSeconds) {
    console.log("token is valid...");
    return;
  }

  const response = await axios.post(
    "https://authentication.logmeininc.com/oauth/token",
    {
      grant_type: "refresh_token",
      refresh_token: tokenData.Refresh_token,
    },
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${base64EncodedString}`,
      },
    }
  );

  console.log("r", response);

  try {
    const updateCheck = await GoToWebinarTokenData.updateOne(
      { _id: tokenData._id },
      {
        $set: {
          Access_token: response.data.access_token,
          Refresh_time: Math.floor(Date.now() / 1000),
        },
      }
    );

    console.log("Token GTW data updated successfully...., ", updateCheck);
  } catch (error) {
    //console.log("Error.... ", error);
  }

  console.log(response.data);
};

const GetOnlyRegistrants = async (email, WebinarId) => {
  try {
    await CheckGTWRefreshToken(email);
    const account = await GoToWebinarTokenData.findOne({ Email: email });

    if (!account) {
      throw new Error("GTW token data not found for the provided email.");
    }

    var options = {
      method: "GET",
      url: `https://api.getgo.com/G2W/rest/v2/organizers/${account.Account_number}/webinars/${WebinarId}/registrants`,
      //params: {page: 'SOME_INTEGER_VALUE', limit: 'SOME_INTEGER_VALUE'},
      headers: { Authorization: `Bearer ${account.Access_token}` },
    };

    const response = await axios.request(options);
    console.log(response.data);
    return response.data;
  } catch (error) {
    // Handle any errors that occurred during the database operation
    console.error("Error while retrieving GTW  data:", error.message);
  }
};

const StartAutomationWriteDataInSheetFromWebinar = async (req, res) => {
  try {
    const { name, SpreadSheetId, SheetName, WebinarId } = req.body;
    const { email } = req.query;

    console.log(name);
    const auth = new google.auth.OAuth2();
    await getAccessTokenFromRefreshToken(email);

    const TokenData = await ModelGoogleTokenData.findOne({
      Email: email,
    });

    const TotalAutomation = await GoToWebinarToGoogleSheetAutomationData.find({
      Email: email,
      Status: "Running",
    });
    if (TotalAutomation.length > 0) {
      return res.status(400).json({ message: "Already an automation running" });
    }

    const DocumentInstance = new GoToWebinarToGoogleSheetAutomationData({
      Name: name,
      AppName: "GTWToSheet",
      SpreadSheetId: SpreadSheetId,
      SheetName: SheetName,
      WebinarId: WebinarId,
      Status: "Running",
      Email: email,
    });

    const automationData = await DocumentInstance.save();

    if (automationData) {
      console.log("Automation created...");
    }

    res
      .status(200)
      .json({ message: `Automation started.. ${automationData.Name}` });
    auth.setCredentials({
      access_token: TokenData.Access_token,
    });

    // Load Google Sheets API
    const sheets = google.sheets({ version: "v4", auth });

    const spreadsheetId = SpreadSheetId;
    const range = `${SheetName}!A1:C`; // Specify the range where you want to write data

    // Data to be written to the sheet
    const values = [["firstname", "lastname", "email"]];

    //getting registrant data

    const registrantData = await GetOnlyRegistrants(email, WebinarId);

    registrantData.forEach((obj) => {
      // Extract firstname, lastname, and email from the object
      const { firstName, lastName, email } = obj;
      // Append them to the resultArray
      values.push([firstName, lastName, email]);
    });

    const response = await sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheetId,
      range: range,
      valueInputOption: "RAW",
      requestBody: {
        values: values,
      },
    });

    console.log("Data written successfully:", response.data);
    await GoToWebinarToGoogleSheetAutomationData.updateOne(
      { _id: automationData._id },
      { $set: { Status: "Finished" } }
    );
  } catch (error) {
    console.error("Error while writting the data in sheet...", error.message);
    res.status(403).json({ message: `error occured.. ${error.message}` });
  }
};

const RemoveGTWAccount = async (req, res) => {
  const { email } = req.query;

  if (!email) {
    res.status(401).json({ message: "Bad request,email didn't found" });
  }

  try {
    const response = await GoToWebinarTokenData.deleteOne({ Email: email });
    res.status(200).json({ message: "account removed successfully..." });
  } catch (error) {
    res.status(500).json({ error: error });
  }
};

module.exports = {
  GotoWebinarCallback,
  linkGotoWebinarAccount,
  StartGoToWebinarAutomation,
  StartAutomationWriteDataInSheetFromWebinar,
  RemoveGTWAccount,
};
