const { default: axios } = require("axios");

const { getAccessTokenFromRefreshToken } = require("./GoogleControllers");
const { google } = require("googleapis");
const { ModelGoogleTokenData } = require("../Models/GoogleModel");
const cron = require("node-cron");
const {
  SendyUserDetails,
  SendyRegistrants,
  SendyAutomationData,
} = require("../Models/SendyModel");

const cheerio = require("cheerio");

const CLIENT_ID =
  "682751091317-vsefliu7rhk0ndf2p7dqpc9k8bsjvjp4.apps.googleusercontent.com";
const REDIRECT_URI = "http://24.199.76.74:5000/goauth/api/auth/google/callback";
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

const handleCreateAccount = async (req, res) => {
  try {
    const { email } = req.query;
    const { apiKey, sendyUrl } = req.body;

    const options = {
      method: "POST",
      url: `${sendyUrl}/api/brands/get-brands.php`,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      data: { api_key: apiKey },
    };

    await axios.request(options).then(async function (response) {
      console.log(response.data);

      const DocumentInstance = new SendyUserDetails({
        UserEmail: email,
        SendyUrl: sendyUrl,
        ApiKey: apiKey,
      });

      const account = await DocumentInstance.save();
      console.log(account);

      res.status(200).json({ Sendy: account });
    });
  } catch (error) {
    console.error("Error creating sendy account:", error);
    res.status(401).json({ error: error });
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

    const DocumentInstance = new SendyRegistrants({
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

    const updateCheck = await SendyRegistrants.updateOne(
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

const SendingSheetDataToSendy = async (
  SubscriberDetailsInDB,
  email,
  ListId,
  workflow_id
) => {
  try {
    console.log("Sending data from sheet...");

    const dataInDB = await SendyRegistrants.findById(SubscriberDetailsInDB._id);

    const data = dataInDB.SubscriberRecords.slice(0, 100);

    const account = await SendyUserDetails.findOne({ UserEmail: email });
    const ApiKey = account.ApiKey;
    const SendyUrl = account.SendyUrl;
    //sending data to api
    for (const item of data) {
      try {
        await SendDataToAPI(item, ApiKey, SendyUrl, ListId, workflow_id);
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`Error sending data for item ${item}: ${error}`);
      }
    }

    //getting document to remove data
    const document = await SendyRegistrants.findById(SubscriberDetailsInDB._id);

    //removing 100 records from db
    document.SubscriberRecords.splice(0, 100);

    // Save the modified document back to the database
    const result = await document.save();

    const TotalDataInDB = await SendyRegistrants.findById(
      SubscriberDetailsInDB._id
    );

    //checking for db is empty or not?
    if (TotalDataInDB.SubscriberRecords.length <= 0) {
      const result = await SendyAutomationData.findByIdAndUpdate(workflow_id, {
        $set: {
          Status: "Finished",
        },
      });

      const deleteResult = await SendyRegistrants.deleteOne({
        _id: SubscriberDetailsInDB._id,
      });
    }
  } catch (error) {
    console.error(error);
  }
};

const SendDataToAPI = (item, ApiKey, SendyUrl, ListId, workflow_id) => {
  try {
    const options = {
      method: "POST",
      url: `${SendyUrl}/subscribe`,
      headers: {
        Accept: "application/json",
        "Content-type": "application/x-www-form-urlencoded",
      },
      data: {
        name: item.FirstName + item.LastName,
        api_key: ApiKey,
        email: item.Email,
        list: ListId,
      },
    };

    axios
      .request(options)
      .then(async function (response) {
        const $ = cheerio.load(response.data);
        const data = $("div#wrapper > h2").text();
        console.log(data, typeof data);

        if (!data) {
          await SendyAutomationData.findByIdAndUpdate(workflow_id, {
            $push: {
              ErrorRecords: {
                firstName: item.FirstName,
                lastName: item.LastName,
                email: item.Email,
              },
            },
          });
        }
      })
      .catch(async function (error) {
        console.error(error);
        await SendyAutomationData.findByIdAndUpdate(workflow_id, {
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
    console.error(error);
  }
};

const SendDataToDelAPI = (item, ApiKey, SendyUrl, ListId, workflow_id) => {
  try {
    const options = {
      method: "POST",
      url: `${SendyUrl}/api/subscribers/delete.php`,
      headers: {
        Accept: "application/json",
        "Content-type": "application/x-www-form-urlencoded",
      },
      data: {
        api_key: ApiKey,
        list_id: ListId,
        email: item.Email,
      },
    };

    axios
      .request(options)
      .then(async function (response) {
        const $ = cheerio.load(response.data);
        const data = $("div#wrapper > h2").text();
        console.log(data, typeof data);

        if (!data) {
          await SendyAutomationData.findByIdAndUpdate(workflow_id, {
            $push: {
              ErrorRecords: {
                firstName: item.FirstName,
                lastName: item.LastName,
                email: item.Email,
              },
            },
          });
        }
      })
      .catch(async function (error) {
        console.error(error);
        await SendyAutomationData.findByIdAndUpdate(workflow_id, {
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
    console.error(error);
  }
};

const handleStartAutomation = async (req, res) => {
  const { Name, SpreadSheetId, SheetName, ListId } = req.body;

  const { email } = req.query;

  // console.log(Name,SpreadsheetId,SheetName,ConferenceId,email)

  if (!email || !Name || !SpreadSheetId || !SheetName || !ListId) {
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

    const DocumentInstance = await new SendyAutomationData({
      Name: Name,
      AppName: "Sendy",
      AppId: 6,
      SpreadSheetId: SpreadSheetId,
      SheetName: SheetName,
      Status: "Running",
      Email: email,
      ListId: ListId,
      Operation: 1,
      DataInDB: SubscriberDetailsInDB._id,
      ErrorRecords: [],
    });

    const workflow = await DocumentInstance.save();

    if (!workflow) {
      return res
        .status(500)
        .json({ message: "Unable to save workflow record in DB" });
    }

    //starting cron jobs
    const task = cron.schedule("* * * * *", async () => {
      console.log("cron jobs running..");

      await SendingSheetDataToSendy(
        SubscriberDetailsInDB,
        email,
        workflow.ListId,
        workflow._id
      );
    });

    const interval = setInterval(
      async () => {
        const workflowCheck = await SendyAutomationData.findOne({
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

const SendingSheetDataToDelSendy = async (
  SubscriberDetailsInDB,
  email,
  ListId,
  workflow_id
) => {
  try {
    console.log("Sending data from sheet...");

    const dataInDB = await SendyRegistrants.findById(SubscriberDetailsInDB._id);

    const data = dataInDB.SubscriberRecords.slice(0, 100);

    const account = await SendyUserDetails.findOne({ UserEmail: email });
    const ApiKey = account.ApiKey;
    const SendyUrl = account.SendyUrl;
    //sending data to api
    for (const item of data) {
      try {
        await SendDataToDelAPI(item, ApiKey, SendyUrl, ListId, workflow_id);
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`Error sending data for item ${item}: ${error}`);
      }
    }

    //getting document to remove data
    const document = await SendyRegistrants.findById(SubscriberDetailsInDB._id);

    //removing 100 records from db
    document.SubscriberRecords.splice(0, 100);

    // Save the modified document back to the database
    const result = await document.save();

    const TotalDataInDB = await SendyRegistrants.findById(
      SubscriberDetailsInDB._id
    );

    //checking for db is empty or not?
    if (TotalDataInDB.SubscriberRecords.length <= 0) {
      const result = await SendyAutomationData.findByIdAndUpdate(workflow_id, {
        $set: {
          Status: "Finished",
        },
      });

      const deleteResult = await SendyRegistrants.deleteOne({
        _id: SubscriberDetailsInDB._id,
      });
    }
  } catch (error) {
    console.error(error);
  }
};

const handleStartAutomationDel = async (req, res) => {
  const { Name, SpreadSheetId, SheetName, ListId } = req.body;

  const { email } = req.query;

  // console.log(Name,SpreadsheetId,SheetName,ConferenceId,email)

  if (!email || !Name || !SpreadSheetId || !SheetName || !ListId) {
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

    const DocumentInstance = await new SendyAutomationData({
      Name: Name,
      AppName: "SheetToSendy(Del)",
      AppId: 6,
      SpreadSheetId: SpreadSheetId,
      SheetName: SheetName,
      Status: "Running",
      Email: email,
      ListId: ListId,
      Operation: 2,
      DataInDB: SubscriberDetailsInDB._id,
      ErrorRecords: [],
    });

    const workflow = await DocumentInstance.save();

    if (!workflow) {
      return res
        .status(500)
        .json({ message: "Unable to save workflow record in DB" });
    }

    //starting cron jobs
    const task = cron.schedule("* * * * *", async () => {
      console.log("cron jobs running..");

      await SendingSheetDataToDelSendy(
        SubscriberDetailsInDB,
        email,
        workflow.ListId,
        workflow._id
      );
    });

    const interval = setInterval(
      async () => {
        const workflowCheck = await SendyAutomationData.findOne({
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

const handleEditAutomation = async (req, res) => {
  const { DataInDB, Name, SpreadSheetId, SheetName, ListId, Item,Operation } = req.body;

  const { email } = req.query;

  if (
    !email ||
    !Name ||
    !SpreadSheetId ||
    !SheetName ||
    !ListId ||
    !Item ||
    !DataInDB ||
    !Operation
  ) {
    // console.log(name, spreadSheetId, sheetName, listIds);
    return res
      .status(401)
      .json({ message: "Bad request,please check the fields" });
  }

  try {
    const token = req.headers.authorization;

    const resultRemoveSheetData = await SendyRegistrants.findByIdAndDelete(
      DataInDB
    );

    await SendyAutomationData.findByIdAndDelete(Item._id);

    console.log(resultRemoveSheetData);

    console.log("Sheet is clear...");

    const headers = {
      Authorization: `${token}`,
      "Content-Type": "application/json",
    };

    if (Operation == 1) {
      const body = {
        Name: Name,
        SpreadSheetId: SpreadSheetId,
        SheetName: SheetName,
        ListId: ListId,
      };

      const response = await axios
        .post(
          `http://24.199.76.74:5000/sendy/api/start/automation?email=${email}`,
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
        ListId: ListId,
      };

      const response = await axios
        .post(
          `http://24.199.76.74:5000/sendy/api/start/del/automation?email=${email}`,
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

const handleRemoveAccount = async (req, res) => {
  const { id } = req.query;

  console.log(id);

  try {
    const response = await SendyUserDetails.deleteOne({ _id: id });

    if (response.deletedCount > 0) {
      return res.status(200).json({ message: "Account removed" });
    }

    return res.status(500).json({ message: "unable to delete the account" });
  } catch (error) {
    res.status(502).json({ error: error });
  }
};

module.exports = {
  handleCreateAccount,
  handleRemoveAccount,
  handleStartAutomation,
  handleEditAutomation,
  handleStartAutomationDel,
};
