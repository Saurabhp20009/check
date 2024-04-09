const ClientOAuth2 = require("client-oauth2");
const OAUTH_URL = "https://auth.aweber.com/oauth2";
const TOKEN_URL = "https://auth.aweber.com/oauth2/token";
const {
  ModelTokenData,
  ModelAweberTokenData,
  ModelAweberAutomationData,
  ModelAweberSubscriberList,
} = require("../Models/AweberModel.js");
const clientId = "zoL6mwfjdAiMsF8wVRVWVpAZ40S0H0Pt";
const clientSecret = "F1HeE25IpnwU5WoGWm3uMEK7ji6A0SO2";
const state = "Undefined";
const { google } = require("googleapis");
const { ModelAutomationData } = require("../Models/UserModel.js");
const {
  gettingSheetDataAndStoringInDB,
  fetchDataFromDBAndSendToAPI,
} = require("../Functions.js");
const cron = require("node-cron");
const { default: axios } = require("axios");

const scopes = [
  "account.read",
  "list.read",
  "list.write",
  "subscriber.read",
  "subscriber.write",
  "email.read",
  "email.write",
  "subscriber.read-extended",
  "landing-page.read",
];

const aweberAuth = new ClientOAuth2({
  clientId,
  clientSecret,
  accessTokenUri: TOKEN_URL,
  authorizationUri: `${OAUTH_URL}/authorize`,
  redirectUri: "https://connectsyncdata.com/callback/aweber",
  scopes,
});

const buildAuthUrlAweber = async (req, res) => {
  const authorizationUrl = await aweberAuth.code.getUri({ state });
  res.status(200).json({ url: authorizationUrl });
};

const createTokenAweberAndStoreInDB = async (req, res) => {
  const { authorizationResponse, email } = req.body;
  console.log(email);
  try {
    const user = await aweberAuth.code.getToken(authorizationResponse);

    const currentTimeInMilliseconds = Date.now();

    const currentTimeInSeconds =
      Math.floor(currentTimeInMilliseconds / 1000) + 7200;

    if (user.data) {
      const TokenDataInstance = new ModelAweberTokenData({
        access_token: user.data.access_token,
        refresh_token: user.data.refresh_token,
        email: email,
        Refresh_time: currentTimeInSeconds,
      });

      TokenDataInstance.save();
      console.log("Access token and refresh token created successfully...");
      return res.status(200).json({ tokenData: user.data });
    } else {
      return res.status(401).json({ message: "Authentication failed" });
    }
  } catch (error) {
    return res.status(401).json({ message: "Authentication failed" });
  }
};

const checkAweberLink = async (req, res) => {
  const { email } = req.body;

  const tokenData = await ModelAweberTokenData.findOne({ email: email });

  if (tokenData) {
    res.status(200).json({ message: "already linked" });
  } else {
    res.status(404).json({ message: "not linked" });
  }
};

const gettingAweberLists = async (req, res) => {
  const { email } = req.body;
  try {
    await revokeAweberToken(email);
    const tokenInfo = await ModelAweberTokenData.findOne({ email: email });

    if(!tokenInfo)
    {
      return
    }

    const headers = {
      Accept: "application/json",
      "User-Agent": "AWeber-Node-code-sample/1.0",
      Authorization: `Bearer ${tokenInfo.access_token}`,
    };

    const url = `https://api.aweber.com/1.0/accounts/1756373/lists/`;
    fetch(url, { headers: headers })
      .then((response) => response.json())
      .then((data) => {
        if (data.entries) {
          res.status(200).json({
            total_list: data.total_size,
            list_data: data.entries,
          });
        } else {
          res.status(401).json({
            message: "expired token",
          });
        }
      });
  } catch (err) {
    console.error("The API returned an error:", err);
    return res.status(400).json({ SheetsData: err });
  }
};

const savingAutomationData = async (
  name,
  email,
  sheetId,
  sheetName,
  aweberListId
) => {
  //saving automation data
  try {
    const automationInstance = new ModelAweberAutomationData({
      Name: name,
      Email: email,
      SheetId: sheetId,
      SheetName: sheetName,
      AweberListId: aweberListId,
      Status: "Running",
      ErrorDatas: [],
    });

    const workflow = await automationInstance.save();
    console.log("automation data is created in db...");

    console.log(workflow);

    return workflow;
  } catch (error) {
    console.error(error);
    return false;
  }
};

const startAutomation = async (req, res) => {
  const { sheetId, sheetName, listId, email, name } = req.body;

  if (!name || !sheetId || !sheetName || !listId || !email) {
    return res.status(400).json({ message: "fields are missing" });
  }

  const checkingAutomation = await ModelAweberAutomationData.find({
    Email: email,
    Status: "Running",
  });

  if (checkingAutomation.length > 0) {
    return res.status(409).json({
      message:
        "Already automation running in background please wait till finished!!",
    });
  }

  await revokeAweberToken(email);
  try {
    //saving the automation data in db
    const workflow = await savingAutomationData(
      name,
      email,
      sheetId,
      sheetName,
      listId
    );

    if (!workflow) {
      return res.status(422).json({
        message: "Unable to save automation data in DB!",
      });
    }

    console.log(workflow.Name);
    
    //deleting all records before proceding
    await ModelAweberSubscriberList.deleteMany({});

    await gettingSheetDataAndStoringInDB(email, sheetId, sheetName);
    let errorRecords = [];

    const task = cron.schedule("* * * * *", async () => {
      const checkWorkFlowStatus = await ModelAweberAutomationData.findOne({
        _id: workflow._id,
      });

      if (checkWorkFlowStatus.Status === "Running") {
        errorRecords = await fetchDataFromDBAndSendToAPI(workflow);
      } else {
        console.log("Automation is finished no data found in DB");
        task.stop();
      }
    });
    task.start();
    res.status(200).json({ message: `Automation started ${workflow.Name} ` });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: `Automation failed ` });
  }
};

const restartAutomation = async (req, res) => {
  const { workflowId } = req.body;

  const getWorkflow = await ModelAutomationData.findOne({
    _id: workflowId,
  });

  const checkAnyAutomationRunning = await ModelAutomationData.find({
    Email: getWorkflow.Email,
    Status: "running",
  });

  console.log(checkAnyAutomationRunning);

  if (checkAnyAutomationRunning.length > 0) {
    return res.json({
      status: 403,
      message: `Already automation ${checkAnyAutomationRunning[0].Name} running in background please wait !!`,
    });
  }

  try {
    const LastTimeTrigged = new Date().toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
    });

    console.log(LastTimeTrigged);

    await ModelAutomationData.updateOne(
      { _id: getWorkflow._id },
      { $set: { LastTimeTrigged: LastTimeTrigged, Status: "running" } }
    );

    console.log("LastTimeTrigged  updated and status is running ...");

    const task = cron.schedule("* * * * *", async () => {
      const checkWorkFlowStatus = await ModelAutomationData.findOne({
        _id: workflowId,
      });

      if (checkWorkFlowStatus.Status === "running") {
        await gettingSheetDataAndStoringInDB(
          getWorkflow.SheetId,
          getWorkflow.SheetName,
          getWorkflow._id
        );
        await fetchDataFromDBAndSendToAPI(getWorkflow);
      } else {
        console.log("Automation is finished no data found in DB");
        task.stop();
      }
    });
    task.start();
    res.json({
      status: 200,
      message: `Automation started ${getWorkflow.Name} `,
    });
  } catch (error) {
    res.json({
      status: 403,
      message: `Automation failed ${getWorkflow.Name} `,
    });
    console.log(error);
  }
};

const revokeAweberToken = async (email) => {
  const tokenData = await ModelAweberTokenData.findOne({ email: email });
  
  if(!tokenData)
  {
    return
  }

  const currentTimeInMilliseconds = Date.now();
  const currentTimeInSeconds = Math.floor(currentTimeInMilliseconds / 1000);
  const time = Number(tokenData.Refresh_time) - 3600;
  console.log(currentTimeInSeconds, time);

  if (currentTimeInSeconds < time) {
    return console.log("Aweber token is valid...");
  }

  const aweberAuth = new ClientOAuth2({
    clientId: clientId,
    clientSecret: clientSecret,
    accessTokenUri: TOKEN_URL,
    authorizationUri: `${OAUTH_URL}/authorize`,
    redirectUri: "https://connectsyncdata.com/callback/aweber",
    scopes,
  });

  const user = await aweberAuth
    .createToken(tokenData.access_token, tokenData.refresh_token, "bearer")
    .refresh();

  const u = await ModelAweberTokenData.updateOne(
    { _id: tokenData._id },
    {
      $set: {
        access_token: user.data.access_token,
        Refresh_time: currentTimeInSeconds + 7200,
      },
    }
  );
  console.log(u);
};

const getAllWorkflows = async (req, res) => {
  const { Email } = req.body;

  try {
    const workflows = await ModelAutomationData.find({ Email: Email });
    res.json({ status: 200, workflows: workflows });
  } catch (error) {
    res.json({ status: 403, message: "Unable to get all workflows" });
  }
};

module.exports = {
  buildAuthUrlAweber,
  createTokenAweberAndStoreInDB,
  checkAweberLink,
  gettingAweberLists,
  startAutomation,
  restartAutomation,
  getAllWorkflows,
};
