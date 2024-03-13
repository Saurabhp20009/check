const ClientOAuth2 = require("client-oauth2");
const OAUTH_URL = "https://auth.aweber.com/oauth2";
const TOKEN_URL = "https://auth.aweber.com/oauth2/token";
const { ModelTokenData } = require("../Models/AweberModel.js");
const clientId = "zoL6mwfjdAiMsF8wVRVWVpAZ40S0H0Pt";
const clientSecret = "F1HeE25IpnwU5WoGWm3uMEK7ji6A0SO2";
const state = "Undefined";
const { google } = require("googleapis");
const key = require("../my-project-6051-412211-c4701a7e7602.json");
const { ModelAutomationData } = require("../Models/UserModel.js");
const {
  gettingSheetDataAndStoringInDB,
  fetchDataFromDBAndSendToAPI,
} = require("../Functions.js");
const creating = require("./my-project-6051-412211-c4701a7e7602.json");
const checkCollectionInDB = require("../Connection.js");
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
  res.json({ status: 200, url: authorizationUrl });
};

const createTokenAweberAndStoreInDB = async (req, res) => {
  const { authorizationResponse, email } = req.body;
  console.log(email);
  try {
    const user = await aweberAuth.code.getToken(authorizationResponse);

    if (user.data) {
      const TokenDataInstance = new ModelTokenData({
        access_token: user.data.access_token,
        refresh_token: user.data.refresh_token,
        email: email,
      });

      TokenDataInstance.save();
      console.log("Access token and refresh token created successfully...");
      return res.json({ status: 200, tokenData: user.data });
    } else {
      return res.json({ status: 403, message: "Authentication failed" });
    }
  } catch (error) {
    return res.json({ status: 403, message: "Authentication failed" });
  }
};

const checkAweberLink = async (req, res) => {
  const { email } = req.body;

  const tokenData = await ModelTokenData.findOne({ email: email });

  if (tokenData) {
    res.json({ status: 200, message: "already linked" });
  } else {
    res.json({ status: 201, message: "not linked" });
  }
};

const gettingAweberLists = async (req, res) => {
  const { email } = req.body;
  try {
    const tokenInfo = await ModelTokenData.findOne({ email: email });

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
          res.json({
            status: 200,
            total_list: data.total_size,
            list_data: data.entries,
          });
        } else {
          res.json({
            status: 403,
            message: "expired token",
          });
        }
      });
  } catch (err) {
    console.error("The API returned an error:", err);
    return res.json({ status: 403, SheetsData: err });
  }
};

const gettingSpreadSheetsList = async (req, res) => {
  const auth = new google.auth.GoogleAuth({
    credentials: key,
    scopes: ["https://www.googleapis.com/auth/drive.metadata.readonly"],
  });

  const drive = google.drive({ version: "v3", auth });

  try {
    const response = await drive.files.list({
      q: "mimeType='application/vnd.google-apps.spreadsheet'",
      fields: "files(id, name)",
    });

    const spreadsheets = response.data.files;
    res.json({ status: 200, data: spreadsheets });
  } catch (error) {
    console.error("The API returned an error:", error);
    res.json({ status: 403, message: "no spreadsheet found" });
  }
};

const gettingSheetsList = async (req, res) => {
  const { sheetId } = req.body;

  const auth = new google.auth.GoogleAuth({
    keyFile: "my-project-6051-412211-c4701a7e7602.json",
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  try {
    const sheet = google.sheets({ version: "v4", auth });

    const spreadsheetId = sheetId;

    const response = await sheet.spreadsheets.get({
      spreadsheetId,
    });

    const sheetList = response.data.sheets.map((sheet) => sheet.properties);
    res.json({ status: 200, data: sheetList });
  } catch (error) {
    res.json({ status: 403, message: "no sheets found" });
  }
};

const savingAutomationData = async (
  name,
  email,
  sheetId,
  sheetName,
  aweberListId,
  LastTimeTrigged
) => {
  //saving automation data
  try {
    const automationInstance = new ModelAutomationData({
      Name: name,
      Email: email,
      SheetId: sheetId,
      SheetName: sheetName,
      AweberListId: aweberListId,
      LastTimeTrigged: LastTimeTrigged,
      LastFetchedRowHashValue: "",
      Status: "running",
      ErrorDatas: [],
    });

    await automationInstance.save();
    console.log("automation data is created in db...");
    

    const workflow = await ModelAutomationData.findOne({
      Name: name,
      Email: email,
      SheetId: sheetId,
      SheetName: sheetName,
      AweberListId: aweberListId,
    });


    console.log(workflow)

    return workflow;
  } catch (error) {
    console.error(error);
    return false;
  }
};

const startAutomation = async (req, res) => {
  const { sheetId, sheetName, listId, email, name } = req.body;

  if (!name || !sheetId || !sheetName || !listId || !email) {
    return res.json({ status: 403, message: "fields are missing" });
  }

  const checkForFirstAutomation = await ModelAutomationData.find({
    Email: email,
  });

  if (checkForFirstAutomation.length != 0) {
    const checkAnyAutomationRunning = await ModelAutomationData.find({
      $and: [{ Email: email }, { Status: "running" }],
    });

    if (checkAnyAutomationRunning.length > 0) {
      return res.json({
        status: 403,
        message: "Already automation running in background please wait till finished!!",
      });
    }
  }

  const checkExistAutomation = await ModelAutomationData.findOne({
    Email: email,
    SheetId: sheetId,
    SheetName: sheetName,
    AweberListId: listId,
  });

  if (checkExistAutomation) {
    await axios.post("http://localhost:8000/aweber/api/restartautomation", {
      workflowId: checkExistAutomation._id,
    });

    return res.json({
      status: 200,
      message: "This workflow already exist , workflow is restarted",
    });
  }

  try {
    const LastTimeTrigged = new Date().toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
    });

    //saving the automation data in db
    const workflow = await savingAutomationData(
      name,
      email,
      sheetId,
      sheetName,
      listId,
      LastTimeTrigged
    );

    console.log(workflow);

    if (!workflow) {
      return res.json({
        status: 403,
        message: "Unable to save automation data in DB!",
      });
    }

    const task = cron.schedule("* * * * *", async () => {
      const checkWorkFlowStatus = await ModelAutomationData.findOne({
        _id: workflow._id,
      });

      if (checkWorkFlowStatus.Status === "running") {
        await gettingSheetDataAndStoringInDB(sheetId, sheetName, workflow._id);
        await fetchDataFromDBAndSendToAPI(workflow);
      } else {
        console.log("Automation is finished no data found in DB");
        task.stop();
      }
    });
    task.start();
    res.json({ status: 200, message: `Automation started ${workflow.Name} ` });
  } catch (error) {
    res.json({ status: 403, message: `Automation failed ${workflow.Name} ` });
  }
};

const restartAutomation = async (req, res) => {
  const { workflowId } = req.body;

  const getWorkflow = await ModelAutomationData.findOne({
    _id: workflowId,
  });

  const checkAnyAutomationRunning = await ModelAutomationData.find({
    Email: getWorkflow.Email , Status: "running"
  });
  
  console.log(checkAnyAutomationRunning)

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

const revokeToken = async (req, res) => {
  const { email } = req.body;

  const tokenData = await ModelTokenData.findOne({ email: email });
  console.log(tokenData);

  const aweberAuth = new ClientOAuth2({
    clientId: clientId,
    clientSecret: clientSecret,
    accessTokenUri: TOKEN_URL,
    authorizationUri: `${OAUTH_URL}/authorize`,
    redirectUri: "https://connectsyncdata.com/callback/aweber",
    scopes,
  });

  user = await aweberAuth
    .createToken(tokenData.access_token, tokenData.refresh_token, "bearer")
    .refresh();
  await ModelTokenData.updateOne(
    { email: email },
    {
      $set: {
        access_token: user.data.access_token,
        refresh_token: user.data.refresh_token,
      },
    }
  );
  console.log("Token data updated....");
  res.json({ status: 200, message: "access token updated" });
};

const getAllWorkflows=async(req,res)=>{
   
  const {Email}= req.body

  try {
    const workflows = await ModelAutomationData.find({Email: Email})
    res.json({status: 200 , workflows: workflows})
  } catch (error) {
    res.json({status: 403 , message : "Unable to get all workflows"})
  }
 
 
}

module.exports = {
  buildAuthUrlAweber,
  createTokenAweberAndStoreInDB,
  checkAweberLink,
  gettingAweberLists,
  gettingSpreadSheetsList,
  gettingSheetsList,
  revokeToken,
  startAutomation,
  restartAutomation,
  getAllWorkflows
};
