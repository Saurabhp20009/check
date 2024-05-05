const { default: axios } = require("axios");
const {
  BrevoUserData,
  BrevoSubscriberListInDB,
  BrevoAutomationData,
} = require("../Models/BrevoModel");
const { getAccessTokenFromRefreshToken } = require("./GoogleControllers");
const { google } = require("googleapis");
const { ModelGoogleTokenData } = require("../Models/GoogleModel");
const cron = require("node-cron");

const CLIENT_ID =
  "682751091317-vsefliu7rhk0ndf2p7dqpc9k8bsjvjp4.apps.googleusercontent.com";
const REDIRECT_URI = "http://localhost:5000/goauth/api/auth/google/callback";
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

const createBrevoAccountInDB = async (req, res) => {
  try {
    const { email } = req.query;
    const { apiKey } = req.body;

    const options = {
      method: "GET",
      url: "https://api.brevo.com/v3/contacts?limit=50&offset=0&sort=desc",
      headers: { accept: "application/json", "api-key": apiKey },
    };

    await axios.request(options).then(async function (response) {
      console.log(response.data);

      const DocumentInstance = new BrevoUserData({
        UserEmail: email,
        ApiKey: apiKey,
      });

      const account = await DocumentInstance.save();
      console.log(account);

      res.status(200).json({ BrevoUserAcccount: account });
    });
  } catch (error) {
    console.error("Error creating brevo account:", error.response.data);
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

    const DocumentInstance = new BrevoSubscriberListInDB({
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

    const updateCheck = await BrevoSubscriberListInDB.updateOne(
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

const FetchSheetDataFromDBToBrevoAPI = async (
  SubscriberDetailsInDB,
  email,
  listIds,
  workflow_id
) => {
  try {
    console.log("Sending data from sheet...");

    const dataInDB = await BrevoSubscriberListInDB.findById(
      SubscriberDetailsInDB._id
    ).select({ SubscriberRecords: { $slice: 100 } });

    const account = await BrevoUserData.findOne({ UserEmail: email });
    const ApiKey = account.ApiKey;

    for (const item of dataInDB.SubscriberRecords) {
      try {
        await SendDataToAPI(item, ApiKey, listIds, workflow_id);
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`Error sending data for item ${item}: ${error}`);
      }
    }

    //getting document to remove data
    const document = await BrevoSubscriberListInDB.findById(
      SubscriberDetailsInDB._id
    );

    //removing 100 records from db
    document.SubscriberRecords.splice(0, 100);

    // Save the modified document back to the database
    const result = await document.save();

    const TotalDataInDB = await BrevoSubscriberListInDB.findById(
      SubscriberDetailsInDB._id
    );

    //checking for db is empty or not?
    if (TotalDataInDB.SubscriberRecords.length <= 0) {
      const result = await BrevoAutomationData.findByIdAndUpdate(workflow_id, {
        $set: {
          Status: "Finished",
        },
      });
    }
  } catch (error) {
    console.error(error);
  }
};

const SendDataToAPI = (item, ApiKey, listIds, workflow_id) => {
  try {
    const options = {
      method: "POST",
      url: "https://api.brevo.com/v3/contacts",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        "api-key": ApiKey,
      },
      data: { email: item.Email, listIds: listIds, updateEnabled: false },
    };

    axios
      .request(options)
      .then(function (response) {
        console.log(response.data);
      })
      .catch(async function (error) {
        console.error(error);
        if (error.response.status!= 400) {
          await BrevoAutomationData.findByIdAndUpdate(workflow_id, {
            $push: {
              ErrorRecords: {
                firstName: item.FirstName,
                lastName: item.LastName,
                email: item.Email,
              },
            },
          });
        }
      });
  } catch (error) {
    console.error(error);
  }
};

const StartAutomation = async (req, res) => {
  const { name, spreadsheetId, sheetName, listIds } = req.body;

  const { email } = req.query;

  console.log(name, spreadsheetId, sheetName, listIds, email);

  // if (!email || !name || !spreadsheetId || !sheetName || !listIds) {
  //   console.log(name, spreadsheetId, sheetName, listIds,email);
  //   return res
  //     .status(401)
  //     .json({ message: "Bad request,please check the fields" });
  // }

  try {
    //fetching google sheet data
    const SubscriberDetailsInDB = await FetchSheetData(
      spreadsheetId,
      sheetName,
      email
    );

    console.log(SubscriberDetailsInDB);

    const DocumentInstance = await new BrevoAutomationData({
      Name: name,
      AppName: "Brevo",
      AppId: 3,
      SpreadSheetId: spreadsheetId,
      SheetName: sheetName,
      Status: "Running",
      Email: email,
      ListIds: [listIds],
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

    //starting cron jobs
    const task = cron.schedule("* * * * *", async () => {
      console.log("cron jobs started..");
      const checkAutomationRunning = await BrevoAutomationData.findById(
        workflow._id
      );

      if (checkAutomationRunning.Status === "Running" && checkAutomationRunning) {
        console.log("running...");
        await FetchSheetDataFromDBToBrevoAPI(
          SubscriberDetailsInDB,
          email,
          workflow.ListIds,
          workflow._id
        );
      } else {
        console.log("Automation finished....");
        task.stop();
        return
      }
    });

    task.start();

    res.status(200).json({ message: `Automation started ${workflow.Name}` });
  } catch (error) {
    return res.status(502).json({ message: error.message });
  }
};

const handleEditAutomation = async (req, res) => {
  const { DataInDB, name, spreadSheetId, sheetName, listIds, Item } = req.body;

  const { email } = req.query;

  if (
    !email ||
    !name ||
    !spreadSheetId ||
    !sheetName ||
    !listIds ||
    !Item ||
    !DataInDB
  ) {
    console.log(name, spreadSheetId, sheetName, listIds);
    return res
      .status(401)
      .json({ message: "Bad request,please check the fields" });
  }

  try {
    const token = req.headers.authorization;

    const resultRemoveSheetData =
      await BrevoSubscriberListInDB.findByIdAndDelete(DataInDB);
    console.log(resultRemoveSheetData);

    console.log("Sheet is clear...");

    const headers = {
      Authorization: `${token}`,
      "Content-Type": "application/json",
    };

    const body = {
      name: name,
      spreadsheetId: spreadSheetId,
      sheetName: sheetName,
      listIds: listIds,
    };

    await BrevoAutomationData.findByIdAndDelete(Item._id);

    const response = await axios
      .post(
        `http://localhost:5000/brevo/api/start/automation?email=${email}`,
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
  const { email } = req.query;

  if (!email) {
    return console.error("email is missing");
  }

  try {
    const response = await BrevoUserData.deleteOne({ UserEmail: email });
    res.status(200).json({ message: "Account removed" });
  } catch (error) {
    res.status(502).json({ error: error });
  }
};

//Extra functions
const GetAllBrevoContacts = async (ApiKey) => {
  try {
    const options = {
      method: "GET",
      url: "https://api.brevo.com/v3/contacts?limit=1000&sort=desc",
      headers: { accept: "application/json", "api-key": ApiKey },
    };

    const response = await axios.request(options);
    if (response) {
      return response;
    }
  } catch (error) {
    console.error(error.message);
  }
};

module.exports = {
  createBrevoAccountInDB,
  StartAutomation,
  RemoveAccount,
  handleEditAutomation,
};
