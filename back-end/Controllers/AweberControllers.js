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
const cron = require("node-cron");
const { default: axios } = require("axios");

const { getAccessTokenFromRefreshToken } = require("./GoogleControllers.js");
const { ModelGoogleTokenData } = require("../Models/GoogleModel.js");
const {
  GotoWebinerListInDB,
  GoToWebinarToAppAutomationData,
} = require("../Models/GoToWebinarModel.js");
const {
  BigmarkerRegistrantsInDb,
  BigmarkerAutomationData,
  BigmarkerToAppAutomationData,
} = require("../Models/BigMarkerModel.js");
const {
  ActiveCampaignApiRecordModel,
} = require("../Models/ActiveCampaignModel.js");

const CLIENT_ID = "zoL6mwfjdAiMsF8wVRVWVpAZ40S0H0Pt";
const CLIENT_SECRET = "F1HeE25IpnwU5WoGWm3uMEK7ji6A0SO2";
const REDIRECT_URI =
  "http://24.199.76.74:5000/goauth/api/auth/google/callback";

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

const SCOPE = [
  "https://www.googleapis.com/auth/spreadsheets",
  "https://www.googleapis.com/auth/drive",
];

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
  try {
    const user = await aweberAuth.code.getToken(authorizationResponse);

    const currentTimeInMilliseconds = Date.now();

    const currentTimeInSeconds =
      Math.floor(currentTimeInMilliseconds / 1000) + 7200;

    if (user.data) {
      let Account_id;

      const headers = {
        Accept: "application/json",
        "User-Agent": "AWeber-Node-code-sample/1.0",
        Authorization: `Bearer ${user.data.access_token}`,
      };
      const url = "https://api.aweber.com/1.0/accounts";
      await fetch(url, { headers: headers })
        .then((response) => response.json())
        .then((data) => {
          // console.log(data);
          Account_id = data.entries[0].id;
        });

      const TokenDataInstance = new ModelAweberTokenData({
        access_token: user.data.access_token,
        refresh_token: user.data.refresh_token,
        email: email,
        Refresh_time: currentTimeInSeconds,
        Account_id: Account_id,
      });

      //console.log(TokenDataInstance);

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

    if (!tokenInfo) {
      return res.status(400).json({
        message:
          "Aweber account token can't be accessed,please connect the account",
      });
    }

    const { Account_id, access_token } = tokenInfo;

    const headers = {
      Accept: "application/json",
      "User-Agent": "AWeber-Node-code-sample/1.0",
      Authorization: `Bearer ${access_token}`,
    };

    const url = `https://api.aweber.com/1.0/accounts/${Account_id}/lists/`;
    fetch(url, { headers: headers })
      .then((response) => response.json())
      .then((data) => {
        if (data.entries) {
          res.status(200).json({
            total_list: data.total_size,
            list_data: data.entries,
          });
        } else {
          //console.log(data);
          res.status(401).json({
            message: "Aweber token has been expired token",
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
  aweberListId,
  SubscriberDetailsInDB
) => {
  //saving automation data
  try {
    const automationInstance = new ModelAweberAutomationData({
      Name: name,
      AppName: "Aweber",
      AppId: 1,
      Email: email,
      SheetId: sheetId,
      SheetName: sheetName,
      AweberListId: aweberListId,
      Status: "Running",
      Operation: {
        sheetToApp: true,
      },
      DataInDB: SubscriberDetailsInDB._id,
      ErrorDatas: [],
    });

    const workflow = await automationInstance.save();
    console.log("automation data is created in db...");

    //console.log(workflow);

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
    return res.status(501).json({
      message:
        "Already automation running in background please wait till finished!!",
    });
  }

  await revokeAweberToken(email);
  try {
    //saving the automation data in db

    //deleting all records before proceding

    const SubscriberDetailsInDB = await gettingSheetDataAndStoringInDB(
      email,
      sheetId,
      sheetName
    );

    const automationInstance = new ModelAweberAutomationData({
      Name: name,
      AppName: "SheetToAweber",
      AppId: 1,
      Email: email,
      SheetId: sheetId,
      SheetName: sheetName,
      AweberListId: listId,
      Status: "Running",
      Operation: 1,
      DataInDB: SubscriberDetailsInDB._id,
      ErrorDatas: [],
    });

    const workflow = await automationInstance.save();
    console.log("automation data is created in db...");

    if (!workflow) {
      return res.status(500).json({
        message: "Unable to save automation data in DB!",
      });
    }

    const task = cron.schedule("* * * * *", async () => {
      console.log("cron-jobs started...");
      await fetchDataFromDBAndSendToAPI(workflow, email, SubscriberDetailsInDB);
    });

    const interval = setInterval(
      async () => {
        const workflowCheck = await ModelAweberAutomationData.findOne({
          _id: workflow._id,
        });

        if (!workflowCheck || workflowCheck.Status === "Finished") {
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

    res.status(200).json({ message: `Automation started ${workflow.Name} ` });
  } catch (error) {
    //console.log(error);
    res.status(500).json({ message: `Automation failed ${error}` });
  }
};

const StartAutomationAweberToApp = async (req, res) => {
  const { sheetId, sheetName, listId, email, name  } = req.body;

  if (!name || !sheetId || !sheetName || !listId || !email) {
    return res.status(400).json({ message: "fields are missing" });
  }

  const checkingAutomation = await ModelAweberAutomationData.find({
    Email: email,
    Status: "Running",
  });

  if (checkingAutomation.length > 0) {
    return res.status(501).json({
      message:
        "Already automation running in background please wait till finished!!",
    });
  }



  await revokeAweberToken(email);
  try {
    //saving the automation data in db

    //deleting all records before proceding

    const SubscriberDetailsInDB = await gettingSheetDataAndStoringInDB(
      email,
      sheetId,
      sheetName
    );

    const automationInstance = new ModelAweberAutomationData({
      Name: name,
      AppName: "AweberToActiveCampaign",
      AppId: 1,
      Email: email,
      SheetId: sheetId,
      SheetName: sheetName,
      AweberListId: listId,
      Status: "Running",
      Operation: 3,
      DataInDB: SubscriberDetailsInDB._id,
      ErrorDatas: [],
    });

    const workflow = await automationInstance.save();
    console.log("automation data is created in db...");

    if (!workflow) {
      return res.status(500).json({
        message: "Unable to save automation data in DB!",
      });
    }

    const task = cron.schedule("* * * * *", async () => {
      console.log("cron-jobs started...");
      await fetchDataFromDBAndSendToAppAPI(
        workflow,
        email,
        SubscriberDetailsInDB
      );
    });

    const interval = setInterval(
      async () => {
        const workflowCheck = await ModelAweberAutomationData.findOne({
          _id: workflow._id,
        });

        if (!workflowCheck || workflowCheck.Status === "Finished") {
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

    res.status(200).json({ message: `Automation started ${workflow.Name} ` });
  } catch (error) {
    //console.log(error);
    res.status(500).json({ message: `Automation failed ${error}` });
  }
};

const revokeAweberToken = async (email) => {
  const tokenData = await ModelAweberTokenData.findOne({ email: email });

  if (!tokenData) {
    return;
  }

  const currentTimeInMilliseconds = Date.now();
  const currentTimeInSeconds = Math.floor(currentTimeInMilliseconds / 1000);
  const time = Number(tokenData.Refresh_time) - 3600;
  //console.log(currentTimeInSeconds, time);

  if (currentTimeInSeconds < time) {
    return console.log("Aweber token is valid...");
  }

  const aweberAuth = new ClientOAuth2({
    clientId: clientId,
    clientSecret: clientSecret,
    accessTokenUri: TOKEN_URL,
    authorizationUri: `${OAUTH_URL}/authorize`,
    redirectUri: "https://connectsyndata.com/callback/aweber",
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
  // console.log(u);
};

const handleRemove = async (req, res) => {
  const { id } = req.query;

  try {
    const result = await ModelAweberTokenData.deleteOne({ _id: id });

    // console.log(result);

    if (result.deletedCount > 0) {
      return res.status(200).json({ message: "Account removed" });
    }

    res.status(500).json({ message: "unable to delete the account" });
  } catch (error) {
    // console.log(error);
    res.status(502).json({ error: error });
  }
};

const handleDeleteSubscribers = async (req, res) => {
  const { sheetId, sheetName, listId, email, name } = req.body;

  if (!name || !sheetId || !sheetName || !listId || !email) {
    return res.status(400).json({ message: "fields are missing" });
  }

  const checkingAutomation = await ModelAweberAutomationData.find({
    Email: email,
    Status: "Running",
  });

  if (checkingAutomation.length > 0) {
    return res.status(501).json({
      message:
        "Already automation running in background please wait till finished!!",
    });
  }

  await revokeAweberToken(email);
  try {
    //saving the automation data in db

    //deleting all records before proceding

    const SubscriberDetailsInDB = await gettingSheetDataAndStoringInDB(
      email,
      sheetId,
      sheetName
    );

    const automationInstance = new ModelAweberAutomationData({
      Name: name,
      AppName: "SheetToAweber(Del)",
      AppId: 1,
      Email: email,
      SheetId: sheetId,
      SheetName: sheetName,
      AweberListId: listId,
      Status: "Running",
      Operation: 2,
      DataInDB: SubscriberDetailsInDB._id,
      ErrorDatas: [],
    });

    const workflow = await automationInstance.save();
    console.log("automation data is created in db...");

    if (!workflow) {
      return res.status(500).json({
        message: "Unable to save automation data in DB!",
      });
    }

    const task = cron.schedule("* * * * *", async () => {
      console.log("cron-jobs started...");
      await FetchDataFromDBAndSendToDelAPI(
        workflow,
        email,
        SubscriberDetailsInDB
      );
    });

    const interval = setInterval(
      async () => {
        const workflowCheck = await ModelAweberAutomationData.findOne({
          _id: workflow._id,
        });

        if (!workflowCheck || workflowCheck.Status === "Finished") {
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

    res.status(200).json({ message: `Automation started ${workflow.Name} ` });
  } catch (error) {
    //console.log(error);
    res.status(500).json({ message: `Automation failed ${error}` });
  }
};

async function FetchDataFromDBAndSendToDelAPI(
  Workflow,
  email,
  SubscriberDetailsInDB
) {
  console.log("Sending data to API...");
  //fetching 100 data from db

  const Record = await ModelAweberSubscriberList.findById(
    SubscriberDetailsInDB._id
  );

  const userTokenData = await ModelAweberTokenData.findOne({ email: email });
  const { Account_id, access_token } = userTokenData;
  const { AweberListId } = Workflow;
  const dataInDB = Record.SubscriberRecords.slice(0, 100);

  // console.log(dataInDB);

  for (let i = 0; i <= dataInDB.length - 1; i++) {
    const response = await deletingSubscribers(
      dataInDB[i],
      Account_id,
      AweberListId,
      access_token
    );
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
  }

  //getting document to remove data
  const document = await ModelAweberSubscriberList.findById(
    SubscriberDetailsInDB._id
  );

  //removing 100 records from db
  document.SubscriberRecords.splice(0, 100);

  // Save the modified document back to the database
  const result = await document.save();

  const dataCheck = await ModelAweberSubscriberList.findById(
    SubscriberDetailsInDB._id
  );

  if (dataCheck.SubscriberRecords.length <= 0) {
    await ModelAweberAutomationData.updateOne(
      { _id: Workflow._id },
      { $set: { Status: "Finished" } }
    );

    await ModelAweberSubscriberList.findByIdAndDelete(
      SubscriberDetailsInDB._id
    );
    console.log("Automation is finished...");
  }
}

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

    const DocumentInstance = new ModelAweberSubscriberList({
      UserEmail: Email,
      SubscriberRecords: [],
    });

    const SubscriberDetailsInDB = await DocumentInstance.save();

    let tempRegistrant = [];

    //getting all data from sheet (first time)
    {
      //looping for accessing every elements of rows
      for (let i = 1; i <= rows.length - 1; i++) {
        tempRegistrant.push({
          FirstName: rows[i][0],
          LastName: rows[i][1],
          Email: rows[i][2],
        });
      }
      const updateCheck = await ModelAweberSubscriberList.updateOne(
        {
          _id: SubscriberDetailsInDB._id,
        },
        {
          $set: { SubscriberRecords: tempRegistrant },
        }
      );
      // //Getting only updated data from the sheet
      return SubscriberDetailsInDB;
    }
  } catch (error) {
    console.log("Unable to fetch data", error);
  }
}


async function gettingAweberDataAndStoringInDB(email,listId) {
  console.log("Fetching documents from aweber...");

  try {

    const SubscriberList= gettingAweberListsSubscriber(email,listId)

    const DocumentInstance = new ModelAweberSubscriberList({
      UserEmail: Email,
      SubscriberRecords: [],
    });

    const SubscriberDetailsInDB = await DocumentInstance.save();

    let tempRegistrant = [];

    //getting all data from sheet (first time)
    {
      //looping for accessing every elements of rows
      for (let i = 1; i <= rows.length - 1; i++) {
        tempRegistrant.push({
          FirstName: rows[i][0],
          LastName: rows[i][1],
          Email: rows[i][2],
        });
      }
      const updateCheck = await ModelAweberSubscriberList.updateOne(
        {
          _id: SubscriberDetailsInDB._id,
        },
        {
          $set: { SubscriberRecords: tempRegistrant },
        }
      );
      // //Getting only updated data from the sheet
      return SubscriberDetailsInDB;
    }
  } catch (error) {
    console.log("Unable to fetch data", error);
  }
}

async function fetchDataFromDBAndSendToAPI(
  Workflow,
  email,
  SubscriberDetailsInDB
) {
  console.log("Sending data to API...");
  //fetching 100 data from db

  const Record = await ModelAweberSubscriberList.findById(
    SubscriberDetailsInDB._id
  );

  const userTokenData = await ModelAweberTokenData.findOne({ email: email });
  const { Account_id, access_token } = userTokenData;
  const { AweberListId } = Workflow;
  const dataInDB = Record.SubscriberRecords.slice(0, 100);

  // console.log(dataInDB);

  for (let i = 0; i <= dataInDB.length - 1; i++) {
    const response = await addingSubscribers(
      dataInDB[i],
      Account_id,
      AweberListId,
      access_token
    );
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
  }

  //getting document to remove data
  const document = await ModelAweberSubscriberList.findById(
    SubscriberDetailsInDB._id
  );

  //removing 100 records from db
  document.SubscriberRecords.splice(0, 100);

  // Save the modified document back to the database
  const result = await document.save();

  const dataCheck = await ModelAweberSubscriberList.findById(
    SubscriberDetailsInDB._id
  );

  if (dataCheck.SubscriberRecords.length <= 0) {
    await ModelAweberAutomationData.updateOne(
      { _id: Workflow._id },
      { $set: { Status: "Finished" } }
    );

    await ModelAweberSubscriberList.findByIdAndDelete(
      SubscriberDetailsInDB._id
    );
    console.log("Automation is finished...");
  }
}

async function gettingAweberListsSubscriber(email,listId)
{
  try {
    await revokeAweberToken(email);
    const tokenInfo = await ModelAweberTokenData.findOne({ email: email });

    if (!tokenInfo) {
      return res.status(400).json({
        message:
          "Aweber account token can't be accessed,please connect the account",
      });
    }

    const { Account_id, access_token } = tokenInfo;

    const headers = {
      Accept: "application/json",
      "User-Agent": "AWeber-Node-code-sample/1.0",
      Authorization: `Bearer ${access_token}`,
    };

    const url = `https://api.aweber.com/1.0/accounts/${Account_id}/lists/${listId}/subscribers`;
    fetch(url, { headers: headers })
      .then((response) => response.json())
      .then((data) => {
        if (data.entries) {
          // res.status(200).json({
          //   total_list: data.total_size,
          //   list_data: data.entries,
          // });
        } else {
          //console.log(data);
          // res.status(401).json({
          //   message: "Aweber token has been expired token",
          // });
        }
      });
  } catch (err) {
    console.error("The API returned an error:", err);
    // return res.status(400).json({ SheetsData: err });
  }
}



async function deletingSubscribers(
  data,
  Account_id,
  AweberListId,
  access_token
) {
  console.log(data, Account_id, AweberListId, access_token);

  const email = data.Email;

  const apiUrl = `https://api.aweber.com/1.0/accounts/${Account_id}/lists/${AweberListId}/subscribers?subscriber_email=${email}`;

  const headers = {
    Accept: "application/json",
    "Content-Type": "application/json",
    "User-Agent": "AWeber-Node-code-sample/1.0",
    Authorization: `Bearer ${access_token}`,
  };

  const response = await fetch(apiUrl, {
    headers: headers,
    method: "DELETE",
  });

  if (response.status === 200) {
    // console.log(`Subscriber created for email ${data.Email}`, response.status);
    return true;
  } else {
    console.log(
      `Subscriber not deleted for email ${data.Email}`,
      response.status,
      response
    );

    return false;
  }
}

async function addingSubscribers(data, Account_id, AweberListId, access_token) {
  console.log(data, Account_id, AweberListId, access_token);

  const apiUrl = `https://api.aweber.com/1.0/accounts/${Account_id}/lists/${AweberListId}/subscribers`;

  const headers = {
    Accept: "application/json",
    "Content-Type": "application/json",
    "User-Agent": "AWeber-Node-code-sample/1.0",
    Authorization: `Bearer ${access_token}`,
  };
  const body = JSON.stringify({
    name: data.FirstName + data.LastName,
    email: data.Email,
  });

  console.log(body);

  const response = await fetch(apiUrl, {
    headers: headers,
    method: "POST",
    body: body,
  });

  if (response.status === 201) {
    // console.log(`Subscriber created for email ${data.Email}`, response.status);
    return true;
  } else {
    console.log(
      `Subscriber not created for email ${data.Email}`,
      response.status,
      response
    );

    return false;
  }
}

async function GTWToAweberSync(email, GTWListId, AutomationId, ListId) {
  try {
    console.log("Sending data to API...");
    //fetching 100 data from db

    const Record = await GotoWebinerListInDB.findById(GTWListId);

    const userTokenData = await ModelAweberTokenData.findOne({ email: email });
    const { Account_id, access_token } = userTokenData;

    const dataInDB = Record.RegistrantRecords.slice(0, 100);

    for (let i = 0; i <= dataInDB.length - 1; i++) {
      const response = await addingSubscribers(
        dataInDB[i],
        Account_id,
        ListId,
        access_token
      );

      let record = {
        firstName: dataInDB[i].FirstName,
        lastName: dataInDB[i].LastName,
        email: dataInDB[i].Email,
      };

      if (!response) {
        const check = await GoToWebinarToAppAutomationData.updateOne(
          {
            _id: AutomationId,
          },
          { $push: { ErrorRecords: record } }
        );
        console.log("Aweber Error Record updated...");
      }
    }

    //removing 100 records from db
    Record.RegistrantRecords.splice(0, 100);

    // Save the modified document back to the database
    const result = await Record.save();

    const dataCheck = await GotoWebinerListInDB.findById(GTWListId);

    if (dataCheck.RegistrantRecords.length <= 0) {
      await GoToWebinarToAppAutomationData.updateOne(
        { _id: AutomationId._id },
        { $set: { Status: "Finished" } }
      );

      await GotoWebinerListInDB.findByIdAndDelete(GTWListId);
      console.log("Automation is finished...");
    }
  } catch (error) {
    console.log(error);
    await GoToWebinarToAppAutomationData.updateOne(
      { _id: AutomationId._id },
      { $set: { Status: "Failed" } }
    );
  }
}

async function BigmarkerToAweberSync(
  email,
  BigmakerListId,
  AutomationId,
  ListId
) {
  try {
    console.log("Sending data to API...");
    //fetching 100 data from db

    const Record = await BigmarkerRegistrantsInDb.findById(BigmakerListId);

    const userTokenData = await ModelAweberTokenData.findOne({ email: email });
    const { Account_id, access_token } = userTokenData;

    const dataInDB = Record.SubscriberRecords.slice(0, 100);

    for (let i = 0; i <= dataInDB.length - 1; i++) {
      const response = await addingSubscribers(
        dataInDB[i],
        Account_id,
        ListId,
        access_token
      );

      let record = {
        firstName: dataInDB[i].FirstName,
        lastName: dataInDB[i].LastName,
        email: dataInDB[i].Email,
      };

      if (!response) {
        const check = await BigmarkerToAppAutomationData.updateOne(
          {
            _id: AutomationId,
          },
          { $push: { ErrorRecords: record } }
        );
        console.log("Aweber Error Record updated...");
      }
    }

    //removing 100 records from db
    Record.RegistrantRecords.splice(0, 100);

    // Save the modified document back to the database
    const result = await Record.save();

    const dataCheck = await BigmarkerRegistrantsInDb.findById(BigmakerListId);

    if (dataCheck.RegistrantRecords.length <= 0) {
      await BigmarkerToAppAutomationData.updateOne(
        { _id: AutomationId._id },
        { $set: { Status: "Finished" } }
      );

      await BigmarkerRegistrantsInDb.findByIdAndDelete(BigmakerListId);
      console.log("Automation is finished...");
    }
  } catch (error) {
    console.log(error);
    await BigmarkerToAppAutomationData.updateOne(
      { _id: AutomationId },
      { $set: { Status: "Failed" } }
    );
  }
}

async function fetchDataFromDBAndSendToAppAPI(
  Workflow,
  email,
  SubscriberDetailsInDB
) {
  console.log("Sending data to API...");
  //fetching 100 data from db

  const Record = await ModelAweberSubscriberList.findById(
    SubscriberDetailsInDB._id
  );

  const userTokenData = await ActiveCampaignApiRecordModel.findOne({
    email: email,
  });
  const { ApiKey, AccountName } = userTokenData;
  const dataInDB = Record.SubscriberRecords.slice(0, 100);

  // console.log(dataInDB);

  for (let i = 0; i <= dataInDB.length - 1; i++) {
    const response = await addingContacts(dataInDB[i], ApiKey, AccountName);
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
  }

  //getting document to remove data
  const document = await ModelAweberSubscriberList.findById(
    SubscriberDetailsInDB._id
  );

  //removing 100 records from db
  document.SubscriberRecords.splice(0, 100);

  // Save the modified document back to the database
  const result = await document.save();

  const dataCheck = await ModelAweberSubscriberList.findById(
    SubscriberDetailsInDB._id
  );

  if (dataCheck.SubscriberRecords.length <= 0) {
    await ModelAweberAutomationData.updateOne(
      { _id: Workflow._id },
      { $set: { Status: "Finished" } }
    );

    await ModelAweberSubscriberList.findByIdAndDelete(
      SubscriberDetailsInDB._id
    );
    console.log("Automation is finished...");
  }
}





//adding contacts for active campaign
async function addingContacts(data, ApiKey, AccountName) {
  // console.log(data, Account_id, AweberListId, access_token);

  const apiUrl = `https://${AccountName}.api-us1.com/api/3/contacts`;

  const headers = {
    Accept: "application/json",
    "Content-Type": "application/json",
    "Api-Token": `${ApiKey}`,
  };
  const body = JSON.stringify({
    contact: {
      email: data.Email,
      firstName: data.FirstName,
      lastName: data.LastName,
    },
  });

  console.log(body);

  const response = await fetch(apiUrl, {
    headers: headers,
    method: "POST",
    body: body,
  });

  if (response.status === 201) {
    // console.log(`Subscriber created for email ${data.Email}`, response.status);
    return true;
  } else {
    console.log(
      `Subscriber not created for email ${data.Email}`,
      response.status,
      response
    );

    return false;
  }
}

const handleEditAutomation = async (req, res) => {
  const { dataInDB, name, email, sheetId, sheetName, listId, item, operation } =
    req.body;

  if (
    !dataInDB ||
    !name ||
    !email ||
    !sheetId ||
    !sheetName ||
    !listId ||
    !operation
  ) {
    return res.status(401).json({ message: "Please check the fields" });
  }

  try {
    const token = req.headers.authorization;

    const resultRemoveSheetData = await ModelAweberSubscriberList.findById(
      dataInDB
    );
    if (resultRemoveSheetData) {
      resultRemoveSheetData.SubscriberRecords = [];
      await resultRemoveSheetData.save();
      console.log("Sheet is clear...");

      const headers = {
        Authorization: `${token}`,
        "Content-Type": "application/json",
      };

      const body = {
        name: name,
        email: email,
        sheetId: sheetId,
        sheetName: sheetName,
        listId: listId,
      };

      await ModelAweberAutomationData.findByIdAndDelete(item._id);

      if (operation == 1) {
        const response = await axios
          .post("http://24.199.76.74:5000/aweber/api/startautomation", body, {
            headers: headers,
          })
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
      } else {
        const response = await axios
          .post("http://24.199.76.74:5000/aweber/api/start/del/automation", body, {
            headers: headers,
          })
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
    }
  } catch (error) {
    res.status(500).json({ message: `Automation failed to start.${error}` });
    console.log(error);
  }
};

module.exports = {
  buildAuthUrlAweber,
  createTokenAweberAndStoreInDB,
  checkAweberLink,
  gettingAweberLists,
  startAutomation,
  handleRemove,
  handleEditAutomation,
  GTWToAweberSync,
  BigmarkerToAweberSync,
  handleDeleteSubscribers,
  StartAutomationAweberToApp
};
