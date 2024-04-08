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

let Email;

const yogeshSir = {
  OAUTH_SERVICE_URL: "https://authentication.logmeininc.com",
  OAUTH_CLIENT_ID: "e6e0a08a-9c31-40fe-9685-8a7ffc9d8d2c",
  OAUTH_CLIENT_SECRET: "HCC5Ug0dYygNAfO9BoSq6cyb",
  OAUTH_REDIRECT_URI:
    "http://localhost:5000/gotowebinar/api/login/oauth2/code/goto",
};

const NehaMam = {
  OAUTH_SERVICE_URL: "https://authentication.logmeininc.com",
  OAUTH_CLIENT_ID: "d3823c8b-4e25-447e-90e7-d84edb3c00fa",
  OAUTH_CLIENT_SECRET: "lusB5pkPVIopN8Sp1mWBb1Aa",
  OAUTH_REDIRECT_URI:
    "http://localhost:5000/gotowebinar/api/login/oauth2/code/goto",
};

var expectedStateForAuthorizationCode = crypto
.randomBytes(15)
.toString("hex");

const linkGotoWebinarAccount = async (req, res) => {
  const { email } = req.query;

  Email = email;

  console.log(Email)

  let oauthConfig;
  if (Email === "ychoudhary320@gmail.com") {
    oauthConfig = {
      client: {
        id: yogeshSir.OAUTH_CLIENT_ID,
        secret: yogeshSir.OAUTH_CLIENT_SECRET,
      },
      auth: {
        tokenHost: yogeshSir.OAUTH_SERVICE_URL,
      },
    };
  } else {
    oauthConfig = {
      client: {
        id: NehaMam.OAUTH_CLIENT_ID,
        secret: NehaMam.OAUTH_CLIENT_SECRET,
      },
      auth: {
        tokenHost: NehaMam.OAUTH_SERVICE_URL,
      },
    };
  }

  console.log(oauthConfig)
  const oauthClient = new AuthorizationCode(oauthConfig);

  const authorizationUrl = oauthClient.authorizeURL({
    redirect_uri: yogeshSir.OAUTH_REDIRECT_URI,
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

  let oauthConfig;
  if (Email === "ychoudhary320@gmail.com") {
    oauthConfig = {
      client: {
        id: yogeshSir.OAUTH_CLIENT_ID,
        secret: yogeshSir.OAUTH_CLIENT_SECRET,
      },
      auth: {
        tokenHost: yogeshSir.OAUTH_SERVICE_URL,
      },
    };
  } else {
    oauthConfig = {
      client: {
        id: NehaMam.OAUTH_CLIENT_ID,
        secret: NehaMam.OAUTH_CLIENT_SECRET,
      },
      auth: {
        tokenHost: NehaMam.OAUTH_SERVICE_URL,
      },
    };
  }
  const oauthClient = new AuthorizationCode(oauthConfig);

  var tokenParams = {
    code: authorizationCode,
    redirect_uri: yogeshSir.OAUTH_REDIRECT_URI,
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

  const GetAccountNumber = await axios.get("https://api.getgo.com/identity/v1/Users/me",{
    headers: {Authorization : `Bearer ${tokenResponse.token.access_token}`}
  });
 
 console.log("g",GetAccountNumber)

  const DocumentInstance = new GoToWebinarTokenData({
    Access_token: tokenResponse.token.access_token,
    Refresh_token: tokenResponse.token.refresh_token,
    Refresh_time: Math.floor(Date.now() / 1000),
    Email: Email,
    Account_number: GetAccountNumber.data.id
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

const SendRegistrantDataToAPI = async (WebinarId, GTWAutomationData,email) => {
  const data = await GoToWebinarList.find();

  await CheckGTWRefreshToken(email);

  const registrantsArray = data.map((registrant) => ({
    firstName: registrant.FirstName,
    lastName: registrant.LastName,
    email: registrant.Email,
    // Include other fields as needed
  }));

  const sendDataPromises = registrantsArray.map(async (registrant, index) => {
    await sendData(registrant, index, WebinarId, GTWAutomationData,email);
  });

  //Wait for all promises to resolve
  await Promise.all(sendDataPromises);
  await GoToWebinarList.deleteMany({});
};

async function sendData(registrant, index, WebinarId, GTWAutomationData,email) {
  return new Promise(async (resolve, reject) => {
    try {
      
  
      const payload = {
        firstName: registrant.firstName,
        lastName: registrant.lastName,
        email: registrant.email,
        // Include other fields as needed
      };

      const account= await GoToWebinarTokenData.findOne({Email:email})  
      
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

    await GoToWebinarList.deleteMany({});

    res
      .status(200)
      .json({ message: `Automation started in background jobs name ${Name}` });

    await FetchDataFromSheet(SpreadSheetId, SheetName, email);
    await SendRegistrantDataToAPI(WebinarId, GTWAutomationData,email);

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

const CheckGTWRefreshToken = async (email) => {
   
  let base64EncodedString

  if (email==="ychoudhary320@gmail.com") {
    const combinedString = `${yogeshSir.OAUTH_CLIENT_ID}:${yogeshSir.OAUTH_CLIENT_SECRET}`;
     console.log(combinedString) 
    base64EncodedString = Buffer.from(combinedString).toString('base64');

  } else {
    const combinedString = `${NehaMam.OAUTH_CLIENT_ID}:${NehaMam.OAUTH_CLIENT_SECRET}`;
    console.log(combinedString)
     base64EncodedString = Buffer.from(combinedString).toString('base64');
  }

  console.log(base64EncodedString)


  const tokenData = await GoToWebinarTokenData.findOne({Email:email})

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
        Authorization:
          `Basic ${base64EncodedString}`,
      },
    }
  );

  console.log('r',response)

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





module.exports = {
  GotoWebinarCallback,
  linkGotoWebinarAccount,
  StartGoToWebinarAutomation,
};
