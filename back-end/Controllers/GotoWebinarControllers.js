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
  GoToWebinarToAppAutomationData,
} = require("../Models/GoToWebinarModel");
const app = express();
const { google } = require("googleapis");
const { ModelGoogleTokenData } = require("../Models/GoogleModel");
const {
  FetchDataFromSheet,
  getAccessTokenFromRefreshToken,
} = require("./GoogleControllers");
const cron = require("node-cron");
const { GTWToAweberSync } = require("./AweberControllers");
const { GTWToBrevoSync } = require("./BrevoControllers");
const { GTWToGetResponse } = require("./GetResponseControllers");

let Email;

const GTWUrls = {
  OAUTH_SERVICE_URL: "https://authentication.logmeininc.com",
  OAUTH_REDIRECT_URI:
    "https://backend.connectsyncdata.com:5000/gotowebinar/api/login/oauth2/code/goto",
};

let oauthConfig = {
  client: {
    id: null,
    secret: null,
  },
  auth: {
    tokenHost: null,
  },
};

var expectedStateForAuthorizationCode = crypto.randomBytes(15).toString("hex");

const linkGotoWebinarAccount = async (req, res) => {
  const { email } = req.query;
  const { client_id, client_secret } = req.body;

  if (!client_id || !client_secret || !email) {
    return res.status(401).json({ message: "Fields are missing..." });
  }

  try {
    Email = email;

    // console.log(Email);

    oauthConfig = {
      client: {
        id: client_id,
        secret: client_secret,
      },
      auth: {
        tokenHost: GTWUrls.OAUTH_SERVICE_URL,
      },
    };

    // console.log(oauthConfig);
    const oauthClient = new AuthorizationCode(oauthConfig);

    const authorizationUrl = oauthClient.authorizeURL({
      redirect_uri: GTWUrls.OAUTH_REDIRECT_URI,
      scope: "collab:",
      state: expectedStateForAuthorizationCode,
    });

    console.log(GTWUrls);
    res.status(200).json({ AuthUrl: authorizationUrl });
  } catch (error) {
    res.status(401).json({ message: error });
  }
};

const GotoWebinarCallback = async (req, res) => {
  if (req.query.state != expectedStateForAuthorizationCode) {
    console.log("Ignoring authorization code with unexpected state");
    res.sendStatus(403);
  }

  var authorizationCode = req.query.code;

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

  // console.log(tokenResponse.token);

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
    Client_secret: oauthConfig.client.secret,
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

const SendRegistrantDataToAPI = async (
  WebinarId,
  GTWAutomationData,
  email,
  SubscriberDetailsInDB
) => {
  try {
    console.log("Sending data to API...");

    const Records = await GotoWebinerListInDB.findById(
      SubscriberDetailsInDB._id
    );

    //Data record didn't found means automation failed
    if (!Records) {
      console.error("Registrant records didn't found in db");
      await GoToWebinarAutomationData.updateOne(
        { _id: GTWAutomationData._id },
        { $set: { Status: "Failed" } }
      );
      return;
    } else if (Records.RegistrantRecords.length <= 0) {
      await GoToWebinarAutomationData.updateOne(
        { _id: GTWAutomationData._id },
        { $set: { Status: "Finished" } }
      );
      await GotoWebinerListInDB.findByIdAndDelete(SubscriberDetailsInDB._id);
      console.log(
        "Automation is set to finished && Registrant record also deleted...."
      );
      return;
    }

    //Checking user's GotoWebinar token is valid or not
    await CheckGTWRefreshToken(email);

    const account = await GoToWebinarTokenData.findOne({ Email: email });

    if (!account) {
      return console.error("Didn't found user's gotowebinar account");
    }

    const { Account_number, Access_token } = account;

    const data = Records.RegistrantRecords.slice(0, 300);

    const document = await GotoWebinerListInDB.findById(
      SubscriberDetailsInDB._id
    );

    //removing 100 records from db
    const resultSplice = document.RegistrantRecords.splice(0, 300);
    const result = await document.save();

    //Syncing the data in webinar
    const sendDataPromises = data.map(async (registrant, index) => {
      await sendData(
        registrant,
        index,
        WebinarId,
        GTWAutomationData,
        Account_number,
        Access_token
      );
    });

    // //Wait for all promises to resolve
    await Promise.all(sendDataPromises);

    // Save the modified document back to the database
  } catch (error) {
    console.error(error);
  }
};

const SendRegistrantDataToDelAPI = async (
  WebinarId,
  GTWAutomationData,
  email,
  SubscriberDetailsInDB
) => {
  try {
    console.log("Sending data to API...");

    const Records = await GotoWebinerListInDB.findById(
      SubscriberDetailsInDB._id
    );

    //Data record didn't found means automation failed
    if (!Records) {
      console.error("Registrant records didn't found in db");
      await GoToWebinarAutomationData.updateOne(
        { _id: GTWAutomationData._id },
        { $set: { Status: "Failed" } }
      );
      return;
    } else if (Records.RegistrantRecords.length <= 0) {
      await GoToWebinarAutomationData.updateOne(
        { _id: GTWAutomationData._id },
        { $set: { Status: "Finished" } }
      );
      await GotoWebinerListInDB.findByIdAndDelete(SubscriberDetailsInDB._id);
      console.log(
        "Automation is set to finished && Registrant record also deleted...."
      );
      return;
    }

    //Checking user's GotoWebinar token is valid or not
    await CheckGTWRefreshToken(email);

    const account = await GoToWebinarTokenData.findOne({ Email: email });

    if (!account) {
      return console.error("Didn't found user's gotowebinar account");
    }

    const { Account_number, Access_token } = account;

    const data = Records.RegistrantRecords.slice(0, 300);

    const document = await GotoWebinerListInDB.findById(
      SubscriberDetailsInDB._id
    );

    //removing 100 records from db
    const resultSplice = document.RegistrantRecords.splice(0, 300);
    const result = await document.save();

    //Syncing the data in webinar
    const sendDataPromises = data.map(async (registrant, index) => {
      await sendDataDel(
        registrant,
        index,
        WebinarId,
        GTWAutomationData,
        Account_number,
        Access_token
      );
    });

    // //Wait for all promises to resolve
    await Promise.all(sendDataPromises);

    // Save the modified document back to the database
  } catch (error) {
    console.error(error);
  }
};

async function sendData(
  registrant,
  index,
  WebinarId,
  GTWAutomationData,
  Account_number,
  Access_token,
  Errors
) {
  return new Promise(async (resolve, reject) => {
    try {
      const payload = {
        firstName: registrant.FirstName,
        lastName: registrant.LastName,
        email: registrant.Email,
      };

      const options = {
        method: "POST",
        url: `https://api.getgo.com/G2W/rest/v2/organizers/${Account_number}/webinars/${WebinarId}/registrants`,
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${Access_token}`,
        },
        data: payload,
      };

      //Use setTimeout to introduce a delay
      setTimeout(async () => {
        try {
          const response = await axios.request(options);
          // console.log(response.data);
          resolve(); // Resolve the promise when the operation is successful
        } catch (error) {
          if (error) {
            console.log(error?.response?.data);
            if (error?.response?.status !== 409) {
              await GoToWebinarAutomationData.updateOne(
                { _id: GTWAutomationData._id },
                { $push: { ErrorRecords: payload } }
              );
            }
          }
          resolve(); // Resolve the promise even if there's an error
        }
      }, index * 200); // Delay based on index
    } catch (error) {
      console.error("Error fetching token data:", error);
      reject(error); // Reject the promise if an error occurs
    }
  });
}



async function sendDataDel(
  registrant,
  index,
  WebinarId,
  GTWAutomationData,
  Account_number,
  Access_token,
  Errors
) {
  return new Promise(async (resolve, reject) => {
   

    try {

      console.log(registrant.registrantKey)

      const options = {
        method: "DELETE",
        url: `https://api.getgo.com/G2W/rest/v2/organizers/${Account_number}/webinars/${WebinarId}/registrants/${registrant.registrantKey}`,
        headers: {
          Authorization: `Bearer ${Access_token}`,
        }
      };

      //Use setTimeout to introduce a delay
      setTimeout(async () => {
        try {
          const response = await axios.request(options);
          console.log(response.data);
          resolve(); // Resolve the promise when the operation is successful
        } catch (error) {
          if (error) {
            // console.log(error?.response?.data);
            if (error?.response?.status !== 409) {
              await GoToWebinarAutomationData.updateOne(
                { _id: GTWAutomationData._id },
                { $push: { ErrorRecords: 
                  {
                   Email:registrant.Email
                  }
                 } }
              );
            }
          }
          resolve(); // Resolve the promise even if there's an error
        }
      }, index * 200); // Delay based on index
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
    const SubscriberDetailsInDB = await FetchDataFromSheet(
      SpreadSheetId,
      SheetName,
      email
    );

    //creating an automation record in DB
    const DocumentInstance = new GoToWebinarAutomationData({
      Name: Name,
      AppName: "GoToWebinar",
      AppId: 5,
      SpreadSheetId: SpreadSheetId,
      SheetName: SheetName,
      WebinarId: WebinarId,
      Status: "Running",
      Email: email,
      Operation: 1,
      DataInDB: SubscriberDetailsInDB._id,
      ErrorRecords: [],
    });

    const Workflow = await DocumentInstance.save();
    console.log("Automation created...");

    //Getting remaining registrant from list
    const error = await GetRemainingRegistrant(SubscriberDetailsInDB, Workflow);
    if (error) {
      return res.status(502).json(error);
    }

    const task = cron.schedule("* * * * *", async () => {
      console.log("cron jobs running..");

      try {
        await SendRegistrantDataToAPI(
          WebinarId,
          Workflow,
          email,
          SubscriberDetailsInDB
        );
      } catch (error) {
        console.log(error);

        await GoToWebinarAutomationData.updateOne(
          { _id: Workflow._id },
          { $set: { Status: "Failed" } }
        );
      }
    });

    const interval = setInterval(
      async () => {
        const workflow = await GoToWebinarAutomationData.findOne({
          _id: Workflow._id,
        });

        if (
          !workflow ||
          workflow.Status === "Finished" ||
          workflow.Status === "Failed"
        ) {
          task.stop();
          console.log("cron-jobs stopped...");
          StopInterval();
        }
      },

      1000
    );

    res
      .status(200)
      .json({ message: `Automation started in background jobs name ${Name}` });

    const StopInterval = () => {
      clearInterval(interval);
    };
  } catch (error) {
    console.log(error);
    res.status(401).json(error);
  }
};

const GetRemainingRegistrant = async (SubscriberDetailsInDB, Workflow) => {
  const RemainingRegistrant = [];

  try {
    await CheckGTWRefreshToken(Workflow.Email);

    const TokenData = await GoToWebinarTokenData.findOne({
      Email: Workflow.Email,
    });

    if (!TokenData) {
      return console.log("User record didn't found in db");
    }

    //getting the data
    const dataInDB = await GotoWebinerListInDB.findById(
      SubscriberDetailsInDB._id
    );

    if (!dataInDB) {
      return console.log("Subscriber record didn't found in db!!!");
    }

    var options = {
      method: "GET",
      url: `https://api.getgo.com/G2W/rest/v2/organizers/${TokenData.Account_number}/webinars/${Workflow.WebinarId}/registrants`,
      headers: { Authorization: `Bearer ${TokenData.Access_token}` },
    };

    const AlreadyRegistredRegistrant = await axios.request(options);

    //checking the api response
    if (!AlreadyRegistredRegistrant.data) {
      return console.log("Didn't get data the Already registrant registrants ");
    }

    const RegistredRegistrantsEmails = AlreadyRegistredRegistrant.data.map(
      (obj) => obj.email
    );

    dataInDB.RegistrantRecords.forEach((item) => {
      if (!RegistredRegistrantsEmails.includes(item.Email)) {
        RemainingRegistrant.push(item);
      }
    });

    // console.log(RemainingRegistrant);
    try {
      const updateResult = await GotoWebinerListInDB.findOneAndUpdate(
        { _id: SubscriberDetailsInDB._id },
        { $set: { RegistrantRecords: RemainingRegistrant } }
      );
      // console.log(updateResult); // Optional: Log the result for debugging
    } catch (error) {
      console.error("Error updating document:", error);
    }
  } catch (error) {
    console.log(error);
    return error;
  }
};

const GetRegistrant = async (Workflow) => {
  try {
    await CheckGTWRefreshToken(Workflow.Email);

    const TokenData = await GoToWebinarTokenData.findOne({
      Email: Workflow.Email,
    });

    if (!TokenData) {
      return console.log("User record didn't found in db");
    }

    var options = {
      method: "GET",
      url: `https://api.getgo.com/G2W/rest/v2/organizers/${TokenData.Account_number}/webinars/${Workflow.WebinarId}/registrants`,
      headers: { Authorization: `Bearer ${TokenData.Access_token}` },
    };

    const AlreadyRegistredRegistrant = await axios.request(options);

    //checking the api response
    if (!AlreadyRegistredRegistrant.data) {
      return console.log("Didn't get data the Already registrant registrants ");
    }

    return AlreadyRegistredRegistrant.data
  } catch (error) {
    console.log(error);
    return error;
  }
};

const CheckGTWRefreshToken = async (email) => {
  let base64EncodedString;

  const { Client_id, Client_secret } = await GoToWebinarTokenData.findOne({
    Email: email,
  });

  const combinedString = `${Client_id}:${Client_secret}`;
  base64EncodedString = Buffer.from(combinedString).toString("base64");

  // console.log(base64EncodedString);

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

    const registrantData = [];

    response.data.forEach((obj) => {
      // Extract firstname, lastname, and email from the object
      const { firstName, lastName, email } = obj;
      registrantData.push(obj);
    });
    return registrantData;
  } catch (error) {
    // Handle any errors that occurred during the database operation
    console.error("Error while retrieving GTW  data:", error.message);
  }
};

const StartAutomationWriteDataInSheetFromWebinar = async (req, res) => {
  try {
    const { Name, SpreadSheetId, SheetName, WebinarId } = req.body;
    const { email } = req.query;

    if (!Name || !SpreadSheetId || !SheetName || !WebinarId) {
      return res
        .status(401)
        .json({ message: "Fields are missing..bad request" });
    }

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
      Name: Name,
      AppName: "GTWToSheet",
      AppId: 5,
      SpreadSheetId: SpreadSheetId,
      SheetName: SheetName,
      WebinarId: WebinarId,
      Status: "Running",
      Operation: 2,
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

    if (!registrantData || registrantData.length <= 0) {
      return console.log("No registrant found in Webinar");
    }

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
    console.log("Automation is finished...");
  } catch (error) {
    console.error("Error while writting the data in sheet...", error.message);
    res.status(403).json({ message: `error occured.. ${error.message}` });
  }
};

const handleEditAutomation = async (req, res) => {
  const {
    DataInDB,
    Name,
    SpreadSheetId,
    SheetName,
    WebinarId,
    Item,
    Operation,
  } = req.body;

  const { email } = req.query;
  if (!Name || !WebinarId || !email || !Item || !Operation) {
    return res.status(400).json({ message: "fields are invalid" });
  }

  try {
    const token = req.headers.authorization;

    if (DataInDB) {
      const resultRemoveSheetData = await GotoWebinerListInDB.findByIdAndDelete(
        DataInDB
      );
    }
    console.log("Sheet is clear...");

    await GoToWebinarAutomationData.findByIdAndDelete(Item._id);
    await GoToWebinarToAppAutomationData.findByIdAndDelete(Item._id);
    await GoToWebinarToGoogleSheetAutomationData.findByIdAndDelete(Item._id);

    const headers = {
      Authorization: `${token}`,
      "Content-Type": "application/json",
    };

    if (Operation == 1) {
      const body = {
        Name: Name,
        SpreadSheetId: SpreadSheetId,
        SheetName: SheetName,
        WebinarId: WebinarId,
      };

      const response = await axios
        .post(
          `https://backend.connectsyncdata.com:5000/gotowebinar/api/start/automation?email=${email}`,
          body,
          {
            headers: headers,
          }
        )
        .then(async (response) => {
          res.status(200).json({ message: "Automation started." });
          console.log("Automation started..");
        })
        .catch((error) => {
          res
            .status(500)
            .json({ message: `Automation failed to start.${error}` });
          console.log(error);
        });
    } else if (Operation == 2) {
      const body = {
        Name: Name,
        SpreadSheetId: SpreadSheetId,
        SheetName: SheetName,
        WebinarId: WebinarId,
      };

      const response = await axios
        .post(
          `https://backend.connectsyncdata.com:5000/gotowebinar/api/start/gtwtosheet/automation?email=${email}`,
          body,
          {
            headers: headers,
          }
        )
        .then(async (response) => {
          res.status(200).json({ message: "Automation started." });
          console.log("Automation started..");
        })
        .catch((error) => {
          res
            .status(500)
            .json({ message: `Automation failed to start.${error}` });
          console.log(error);
        });
    } else if (Operation == 3) {
      const { AweberListId } = req.body;

      let body = {
        Name: Name,
        WebinarId: WebinarId,
        AweberListId: AweberListId,
      };

      const response = await axios
        .post(
          `https://backend.connectsyncdata.com:5000/gotowebinar/api/start/gtwtoapp/automation?email=${email}`,
          body,
          {
            headers: headers,
          }
        )
        .then(async (response) => {
          res.status(200).json({ message: "Automation started." });
          console.log("Automation started..");
        })
        .catch((error) => {
          res
            .status(500)
            .json({ message: `Automation failed to start.${error}` });
          console.log(error);
        });
    } else if (Operation == 4) {
      const { ListId } = req.body;

      let body = {
        Name: Name,
        WebinarId: WebinarId,
        BrevoListId: ListId,
      };

      await axios
        .post(
          `https://backend.connectsyncdata.com:5000/gotowebinar/api/start/gtwtoapp/automation?email=${email}`,
          body,
          {
            headers: headers,
          }
        )
        .then((response) => {
          res.status(200).json({ message: "Automation started." });
          console.log("Automation started..");
        })
        .catch((error) => {
          res
            .status(500)
            .json({ message: `Automation failed to start.${error}` });
          console.log(error);
          console.log(error.response);
        });
    } else if (Operation == 5) {
      const { CampaignListId } = req.body;

      let body = {
        Name: Name,
        WebinarId: WebinarId,
        CampaignId: CampaignListId,
      };

      await axios
        .post(
          `https://backend.connectsyncdata.com:5000/gotowebinar/api/start/gtwtoapp/automation?email=${email}`,
          body,
          {
            headers: headers,
          }
        )
        .then((response) => {
          res.status(200).json({ message: "Automation started." });
          console.log("Automation started..");
        })
        .catch((error) => {
          res
            .status(500)
            .json({ message: `Automation failed to start.${error}` });
          console.log(error);
          console.log(error.response);
        });
    }
    else if (Operation == 6) {
      const body = {
        Name: Name,
        SpreadSheetId: SpreadSheetId,
        SheetName: SheetName,
        WebinarId: WebinarId,
      };

      const response = await axios
        .post(
          `https://backend.connectsyncdata.com:5000/gotowebinar/api/start/del/automation?email=${email}`,
          body,
          {
            headers: headers,
          }
        )
        .then(async (response) => {
          res.status(200).json({ message: "Automation started." });
          console.log("Automation started..");
        })
        .catch((error) => {
          res
            .status(500)
            .json({ message: `Automation failed to start.${error}` });
          console.log(error);
        });
    }
    
  } catch (error) {
    res.status(500).json({ message: `Automation failed to start.${error}` });
    console.log(error);
  }
};


async function RemainingRegistrant(Registrants, SubscriberDetailsInDB) {
  const DataInDB = await GotoWebinerListInDB.findById(
    SubscriberDetailsInDB._id
  );

  if (DataInDB.RegistrantRecords.length < 0) {
    return false;
  }

  // Create a map from contacts array with email as key and contactId as value
  const contactMap = new Map();
  Registrants.forEach((registrants) => {
    contactMap.set(registrants.email, registrants.registrantKey);
  });

  // Create a separate array with only common emails and contactId
  const commonRegistrantsArray = DataInDB.RegistrantRecords.filter((item) =>
    contactMap.has(item.Email)
  ).map((item) => ({
    FirstName: item.FirstName,
    LastName: item.LastName,
    Email: item.Email,
    registrantKey: contactMap.get(item.Email),
  }));


  await GotoWebinerListInDB.updateOne(
    { _id: SubscriberDetailsInDB._id },
    { $set: { RegistrantRecords: commonRegistrantsArray } }
  );
}


const StartGoToWebinarDelAutomation = async (req, res) => {
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
    const SubscriberDetailsInDB = await FetchDataFromSheet(
      SpreadSheetId,
      SheetName,
      email
    );
   
    //creating an automation record in DB
    const DocumentInstance = new GoToWebinarAutomationData({
      Name: Name,
      AppName: "SheetToGoToWebinar(Del)",
      AppId: 5,
      SpreadSheetId: SpreadSheetId,
      SheetName: SheetName,
      WebinarId: WebinarId,
      Status: "Running",
      Email: email,
      Operation: 6,
      DataInDB: SubscriberDetailsInDB._id,
      ErrorRecords: [],
    });

    const Workflow = await DocumentInstance.save();
   
    const Registrants=  await GetRegistrant(Workflow)

    console.log(Registrants)
       
   await RemainingRegistrant(Registrants, SubscriberDetailsInDB)
  
    console.log("Automation created...");

    //Getting remaining registrant from list


    const task = cron.schedule("* * * * *", async () => {
      console.log("cron jobs running..");

      try {
        await SendRegistrantDataToDelAPI(
          WebinarId,
          Workflow,
          email,
          SubscriberDetailsInDB
        );
      } catch (error) {
        console.log(error);

        await GoToWebinarAutomationData.updateOne(
          { _id: Workflow._id },
          { $set: { Status: "Failed" } }
        );
      }
    });

    const interval = setInterval(
      async () => {
        const workflow = await GoToWebinarAutomationData.findOne({
          _id: Workflow._id,
        });

        if (
          !workflow ||
          workflow.Status === "Finished" ||
          workflow.Status === "Failed"
        ) {
          task.stop();
          console.log("cron-jobs stopped...");
          StopInterval();
        }
      },

      1000
    );

    res
      .status(200)
      .json({ message: `Automation started in background jobs name ${Name}` });

    const StopInterval = () => {
      clearInterval(interval);
    };
  } catch (error) {
    console.log(error);
    res.status(401).json(error);
  }
};

const StartAutomationGotoWebinarToApp = async (req, res) => {
  try {
    const { email } = req.query;
    const { Name, WebinarId } = req.body;
    let AppName = "";
    let ListId = "";
    let Operation = 0;

    //checking for an which app listid
    if (req.body.AweberListId) {
      const { AweberListId } = req.body;
      AppName = "Aweber";
      ListId = AweberListId;
      Operation = 3;
    } else if (req.body.BrevoListId) {
      const { BrevoListId } = req.body;
      AppName = "Brevo";
      ListId = BrevoListId;
      Operation = 4;
    } else if (req.body.CampaignId) {
      const { CampaignId } = req.body;
      AppName = "Getresponse";
      ListId = CampaignId;
      Operation = 5;
    } else {
      return res
        .status(401)
        .json({ message: "Fields are missing..bad request" });
    }

    if (!Name || !WebinarId) {
      return res
        .status(401)
        .json({ message: "Fields are missing..bad request" });
    }

    const TotalAutomationRunning = await GoToWebinarToAppAutomationData.find({
      Email: email,
      Status: "Running",
    });

    //checking for any automation running for same app?
    TotalAutomationRunning.forEach((automation) => {
      if (automation.AppName === `GTWTo${AppName}`) {
        return res
          .status(400)
          .json({ message: "Already an automation running" });
      }
    });

    //getting registrant data
    const registrantData = await GetOnlyRegistrants(email, WebinarId);

    if (!registrantData || registrantData.length <= 0) {
      return res
        .status(500)
        .json({ message: `No registrant found in webinar` });
    }

    const GotoWebinerListInDBInstance = new GotoWebinerListInDB({
      UserEmail: email,
      RegistrantRecords: [],
    });

    const SubscriberDetailsInDB = await GotoWebinerListInDBInstance.save();

    let tempRegistrant = [];

    registrantData.forEach((obj) => {
      // Extract firstname, lastname, and email from the object
      const { firstName, lastName, email } = obj;

      tempRegistrant.push({
        FirstName: firstName,
        LastName: lastName,
        Email: email,
      });
    });

    //setting the webinar data in db
    const updateCheck = await GotoWebinerListInDB.findOneAndUpdate(
      { _id: SubscriberDetailsInDB._id },
      { $set: { RegistrantRecords: tempRegistrant } }
    );

    console.log(updateCheck);

    if ((updateCheck.RegistrantRecords.length = 0)) {
      return res
        .status(501)
        .json({ message: `Unable to store registrant data in database` });
    }

    const DocumentInstance = new GoToWebinarToAppAutomationData({
      Name: Name,
      AppName: `GTWTo${AppName}`,
      AppId: 5,
      WebinarId: WebinarId,
      ListId: ListId,
      Status: "Running",
      Operation: Operation,
      Email: email,
      DataInDB: SubscriberDetailsInDB._id,
    });

    const automationData = await DocumentInstance.save();

    if (automationData) {
      console.log("Automation created...");
    }

    res
      .status(200)
      .json({ message: `Automation started.. ${automationData.Name}` });

    const task = cron.schedule("* * * * *", async () => {
      console.log("cron-jobs running...");

      if (AppName === "Aweber") {
        await GTWToAweberSync(
          email,
          SubscriberDetailsInDB._id,
          automationData._id,
          ListId
        );
      } else if (AppName === "Brevo") {
        await GTWToBrevoSync(
          email,
          SubscriberDetailsInDB._id,
          automationData._id,
          ListId
        );
      } else {
        await GTWToGetResponse(
          email,
          SubscriberDetailsInDB._id,
          automationData._id,
          ListId
        );
      }
    });

    const interval = setInterval(
      async () => {
        const workflowCheck = await GoToWebinarToAppAutomationData.findOne({
          _id: automationData._id,
        });

        if (!workflowCheck || workflowCheck.Status !== "Running") {
          task.stop();
          console.log("cron-jobs stopped...");
          StopInterval();
        }
      },

      1000
    );

    const StopInterval = () => {
      clearInterval(interval);
    };
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
  handleEditAutomation,
  StartAutomationGotoWebinarToApp,
  StartGoToWebinarDelAutomation
};
