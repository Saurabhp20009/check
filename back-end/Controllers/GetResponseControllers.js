const { default: axios } = require("axios");
const {
  GetResponseUserData,
  GetResponseSubscriberListInDB,
  GetResponseAutomationData,
} = require("../Models/GoToResponseModel");
const { getAccessTokenFromRefreshToken } = require("./GoogleControllers");
const { google } = require("googleapis");
const { ModelGoogleTokenData } = require("../Models/GoogleModel");
const cron = require("node-cron");

const CLIENT_ID =
  "682751091317-vsefliu7rhk0ndf2p7dqpc9k8bsjvjp4.apps.googleusercontent.com";
const REDIRECT_URI = "http://connectsyncdata.com:5000/goauth/api/auth/google/callback";
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

const createGetResponseAccountInDB = async (req, res) => {
  try {
    const { email } = req.query;
    const { apiKey } = req.body;

    const options = {
      method: "GET",
      url: "https://api.getresponse.com/v3/campaigns",
      headers: { "X-Auth-Token": `api-key ${apiKey}` },
    };

    await axios.request(options).then(async function (response) {
      console.log(response.data);

      const DocumentInstance = new GetResponseUserData({
        UserEmail: email,
        ApiKey: apiKey,
      });

      const account = await DocumentInstance.save();
      console.log(account);

      res.status(200).json({ GetResponse: account });
    });
  } catch (error) {
    console.error("Error creating get response account:", error.response.data);
    res.status(error.response.status).json({ error: error.response.data });
  }
};

const FetchSheetData = async (SpreadSheetId, SheetName, email) => {
  try {
    console.log("Fetching data from sheet....");
    await getAccessTokenFromRefreshToken(email);

    const TokenData = await ModelGoogleTokenData.findOne({
      Email: email,
    });

    if (!TokenData) {
      throw new Error("Token data not found");
    }

    oauth2Client.setCredentials({ access_token: TokenData.Access_token });

    const sheets = google.sheets({ version: "v4", auth: oauth2Client });

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

    const DocumentInstance = new GetResponseSubscriberListInDB({
      UserEmail: email,
      SubscriberRecords: [],
    });

    const SubscriberDetailsInDB = await DocumentInstance.save();

    let tempRegistrant = [];
    //looping for accessing every elements of rows
    for (let i = 1; i <= rows.length - 1; i++) {
      tempRegistrant.push({
        FirstName: rows[i][0],
        LastName: rows[i][1],
        Email: rows[i][2],
      });
      // //Getting only updated data from the sheet
    }

    const updateCheck = await GetResponseSubscriberListInDB.updateOne(
      {
        _id: SubscriberDetailsInDB._id,
      },
      {
        $set: { SubscriberRecords: tempRegistrant },
      }
    );

    return SubscriberDetailsInDB;
  } catch (error) {
    console.error("Error is coming...", error);
  }
};

const SendingSheetDataToGetResponse = async (
  SubscriberDetailsInDB,
  email,
  CampaignId,
  workflow_id
) => {
  try {
    console.log("Sending data from sheet...");

    const dataInDB = await GetResponseSubscriberListInDB.findById(
      SubscriberDetailsInDB._id
    )
   
    const data= dataInDB.SubscriberRecords.slice(0,100)

    const account = await GetResponseUserData.findOne({ UserEmail: email });
    const ApiKey = account.ApiKey;
    //sending data to api
    for (const item of data) {
      try {
        await SendDataToAPI(item, ApiKey, CampaignId, workflow_id);
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`Error sending data for item ${item}: ${error}`);
      }
    }

    //getting document to remove data
    const document = await GetResponseSubscriberListInDB.findById(
      SubscriberDetailsInDB._id
    );

    //removing 100 records from db
    document.SubscriberRecords.splice(0, 100);

    // Save the modified document back to the database
    const result = await document.save();

    const TotalDataInDB = await GetResponseSubscriberListInDB.findById(
      SubscriberDetailsInDB._id
    );

    //checking for db is empty or not?
    if (TotalDataInDB.SubscriberRecords.length <= 0) {
      const result = await GetResponseAutomationData.findByIdAndUpdate(
        workflow_id,
        {
          $set: {
            Status: "Finished",
          },
        }
      );

      const deleteResult = await GetResponseSubscriberListInDB.deleteOne({
        _id: SubscriberDetailsInDB._id,
      });
    }
  } catch (error) {
    console.error(error);
  }
};

const SendDataToAPI = (item, ApiKey, CampaignId, workflow_id) => {
  try {
    const options = {
      method: "POST",
      url: "https://api.getresponse.com/v3/contacts",
      headers: {
        Accept: "application/json",
        "Content-type": "application/json",
        "X-Auth-Token": `api-key ${ApiKey}`,
      },
      data: {
        name: item.FirstName + item.LastName,
        campaign: {
          campaignId: CampaignId,
        },
        email: item.Email,
      },
    };

    axios
      .request(options)
      .then(async function (response) {
        console.log(response);
      })
      .catch(async function (error) {
        console.error(error);
        await GetResponseAutomationData.findByIdAndUpdate(workflow_id, {
          $push: {
            ErrorRecords: {
              firstName: item.FirstName,
              lastName: item.LastName,
              email: item.Email,
            },
          },
        });
      });
  } catch (error) {
    console.error(error.response.data.context);
  }
};

const handleStartAutomation = async (req, res) => {
  const { Name, SpreadSheetId, SheetName, CampaignId } = req.body;

  const { email } = req.query;

  console.log(Name, SpreadSheetId, SheetName, CampaignId, email);

  if (!email || !Name || !SpreadSheetId || !SheetName || !CampaignId) {
    return res
      .status(401)
      .json({ message: "Bad request,please check the fields" });
  }

  try {
    //fetching google sheet data
    const SubscriberDetailsInDB = await FetchSheetData(
      SpreadSheetId,
      SheetName,
      email
    );

    const DocumentInstance = await new GetResponseAutomationData({
      Name: Name,
      AppName: "Sheet to GetResponse",
      AppId: 4,
      SpreadSheetId: SpreadSheetId,
      SheetName: SheetName,
      Status: "Running",
      Email: email,
      CampaignId: CampaignId,
      Operation: {
        sheetToApp: true,
      },
      DataInDB: SubscriberDetailsInDB._id,
      ErrorRecords: [],
    });

    const workflow = await DocumentInstance.save();

    if (!workflow) {
      return res
        .status(500)
        .json({ message: "Unable to save workflow record in DB" });
    }

    console.log(SubscriberDetailsInDB);

    //starting cron jobs
    const task = cron.schedule("* * * * *", async () => {
      console.log("cron jobs running..");

      await SendingSheetDataToGetResponse(
        SubscriberDetailsInDB,
        email,
        workflow.CampaignId,
        workflow._id
      );
    });

    const interval = setInterval(
      async () => {
        const workflowCheck = await GetResponseAutomationData.findOne({
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

    res.status(200).json({ message: `Automation started ${workflow.Name}` });
  } catch (error) {
    return res.status(502).json({ message: error.message });
  }
};

const GetCampaign = async (req, res) => {
  const { email } = req.query;

  const userData = await GetResponseUserData.findOne({ UserEmail: email });

  if (!userData) {
    return res
      .status(500)
      .json({ message: "Api key doesn't found , please connect the account" });
  }

  const ApiKey = userData.ApiKey;
  try {
    const options = {
      method: "GET",
      url: "https://api.getresponse.com/v3/campaigns",
      headers: { "X-Auth-Token": `api-key ${ApiKey}` },
    };

    await axios.request(options).then(async function (response) {
      console.log(response.data);

      res.status(200).json({ data: response.data });
    });
  } catch (error) {
    res.status(500).json({ message: error.response.data.message });
  }
};

const handleEditAutomation = async (req, res) => {
  const { DataInDB, Name, SpreadSheetId, SheetName, CampaignId, Item } =
    req.body;

  const { email } = req.query;

  if (
    !email ||
    !Name ||
    !SpreadSheetId ||
    !SheetName ||
    !CampaignId ||
    !Item ||
    !DataInDB
  ) {
    // console.log(name, spreadSheetId, sheetName, listIds);
    return res
      .status(401)
      .json({ message: "Bad request,please check the fields" });
  }

  try {
    const token = req.headers.authorization;

    const resultRemoveSheetData =
      await GetResponseSubscriberListInDB.findByIdAndDelete(DataInDB);
    console.log(resultRemoveSheetData);

    console.log("Sheet is clear...");

    const headers = {
      Authorization: `${token}`,
      "Content-Type": "application/json",
    };

    const body = {
      Name: Name,
      SpreadSheetId: SpreadSheetId,
      SheetName: SheetName,
      CampaignId: CampaignId,
    };

    await GetResponseAutomationData.findByIdAndDelete(Item._id);

    const response = await axios
      .post(
        `http://connectsyncdata.com:5000/getresponse/api/start/automation?email=${email}`,
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
  } catch (error) {
    res.status(500).json({ message: `Automation failed to start.${error}` });
    console.log(error);
  }
};

const RemoveAccount = async (req, res) => {
  const { id } = req.body;

  try {
    const response = await GetResponseUserData.deleteOne({ _id: id });
    res.status(200).json({ message: "Account removed" });
  } catch (error) {
    res.status(502).json({ error: error });
  }
};

module.exports = {
  createGetResponseAccountInDB,
  GetCampaign,
  RemoveAccount,
  handleStartAutomation,
  handleEditAutomation,
};
