const { default: axios } = require("axios");
const {
  BigmarkerUserData,
  BigmarkerAutomationData,
  BigmarkerRegistrantsInDb,
  BigmarkerToGoogleSheetAutomationData,
  BigmarkerToAppAutomationData,
} = require("../Models/BigMarkerModel");
const { getAccessTokenFromRefreshToken } = require("./GoogleControllers");
const { google } = require("googleapis");
const { ModelGoogleTokenData } = require("../Models/GoogleModel");
const cron = require("node-cron");
const { BigmarkerToAweberSync } = require("./AweberControllers");
const { BigmarkerToBrevoSync } = require("./BrevoControllers");
const { BigmarkerToGetResponse } = require("./GetResponseControllers");

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

const handleCreateAccount = async (req, res) => {
  try {
    const { email } = req.query;
    const { apiKey } = req.body;

    const options = {
      method: "GET",
      url: "https://www.bigmarker.com/api/v1/conferences/",
      headers: { "API-KEY": `${apiKey}`, "Content-Type": "application/json" },
    };

    await axios.request(options).then(async function (response) {
      console.log(response.data);

      const DocumentInstance = new BigmarkerUserData({
        UserEmail: email,
        ApiKey: apiKey,
      });

      const account = await DocumentInstance.save();
      console.log(account);

      res.status(200).json({ Bigmarker: account });
    });
  } catch (error) {
    console.error("Error creating get response account:", error);
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

    const DocumentInstance = new BigmarkerRegistrantsInDb({
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

    const updateCheck = await BigmarkerRegistrantsInDb.updateOne(
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

const SendingSheetDataToBigMarker = async (
  SubscriberDetailsInDB,
  email,
  ConferenceId,
  workflow_id
) => {
  try {
    console.log("Sending data from sheet...");

    const dataInDB = await BigmarkerRegistrantsInDb.findById(
      SubscriberDetailsInDB._id
    ).select({ SubscriberRecords: { $slice: 100 } });

    const account = await BigmarkerUserData.findOne({ UserEmail: email });
    const ApiKey = account.ApiKey;

    //sending data to api
    for (const item of dataInDB.SubscriberRecords) {
      try {
        await SendDataToAPI(item, ApiKey, ConferenceId, workflow_id);
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`Error sending data for item ${item}: ${error}`);
      }
    }

    //getting document to remove data
    const document = await BigmarkerRegistrantsInDb.findById(
      SubscriberDetailsInDB._id
    );

    //removing 100 records from db
    document.SubscriberRecords.splice(0, 100);

    // Save the modified document back to the database
    const result = await document.save();

    const TotalDataInDB = await BigmarkerRegistrantsInDb.findById(
      SubscriberDetailsInDB._id
    );

    //checking for db is empty or not?
    if (TotalDataInDB.SubscriberRecords.length <= 0) {
      const result = await BigmarkerAutomationData.findByIdAndUpdate(
        workflow_id,
        {
          $set: {
            Status: "Finished",
          },
        }
      );

      const deleteResult = await BigmarkerRegistrantsInDb.deleteOne({
        _id: SubscriberDetailsInDB._id,
      });
    }
  } catch (error) {
    console.error(error);
  }
};

const SendDataToAPI = (item, ApiKey, ConferenceId, workflow_id) => {
  try {
    const options = {
      method: "PUT",
      url: "https://www.bigmarker.com/api/v1/conferences/register",
      headers: {
        accept: "application/json",
        "content-type": "application/x-www-form-urlencoded",
        "API-KEY": ApiKey,
      },
      data: {
        id: ConferenceId,
        email: item.Email,
        first_name: item.FirstName,
        last_name: item.LastName,
      },
    };

    axios
      .request(options)
      .then(function (response) {
        console.log(response.data);
      })
      .catch(async function (error) {
        console.error(error);
        await BigmarkerAutomationData.findByIdAndUpdate(workflow_id, {
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

const handleStartAutomationWebinarToSheet = async (req, res) => {
  try {
    const { Name, SpreadSheetId, SheetName, ConferenceId } = req.body;
    const { email } = req.query;

    if (!Name || !SpreadSheetId || !SheetName || !ConferenceId) {
      return res
        .status(401)
        .json({ message: "Fields are missing..bad request" });
    }

    const auth = new google.auth.OAuth2();
    await getAccessTokenFromRefreshToken(email);

    const TokenData = await ModelGoogleTokenData.findOne({
      Email: email,
    });

    const user = await BigmarkerUserData.findOne({ UserEmail: email });

    if (!user) {
      return res
        .status(500)
        .json({ message: "Doesn't found any Api Key for this account" });
    }

    const { ApiKey } = user;
    
    const registrantData = await GetOnlyRegistrants(ApiKey, ConferenceId);

    if(!registrantData || registrantData.length<=0)
      {
        return res
        .status(500)
        .json({ message: "No registrants found in webinar or webinar is invalid`" });
      }




    const DocumentInstance = new BigmarkerToGoogleSheetAutomationData({
      Name: Name,
      AppName: "BigMarker to Sheet",
      AppId: 2,
      SpreadSheetId: SpreadSheetId,
      SheetName: SheetName,
      ConferenceId: ConferenceId,
      Status: "Running",
      Email: email,
      Operation: 2,
    });

    const automationData = await DocumentInstance.save();

    console.log(automationData);

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

    

    console.log(registrantData, registrantData.length);

    registrantData.forEach((obj) => {
      // Extract firstname, lastname, and email from the object
      const { first_name, last_name, email } = obj;
      // Append them to the resultArray
      values.push([first_name, last_name, email]);
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
    await BigmarkerToGoogleSheetAutomationData.updateOne(
      { _id: automationData._id },
      { $set: { Status: "Finished" } }
    );
    console.log("Automation is finished...");
  } catch (error) {
    console.error("Error while writting the data in sheet...", error.message);
    res.status(403).json({ message: `error occured.. ${error.message}` });
  }
};

const GetOnlyRegistrants = async (ApiKey, ConferenceId) => {
  try {
    var options = {
      method: "GET",
      url: `https://www.bigmarker.com/api/v1/conferences/registrations/${ConferenceId}?per_page=30000`,
      headers: { "Api-Key": ApiKey },
    };

    const response = await axios.request(options);
   

    const registrantData = [];

    response.data.registrations.forEach((obj) => {
      // Extract firstname, lastname, and email from the object
      const { first_name, last_name, email } = obj;
      registrantData.push({first_name : first_name, last_name:last_name, email: email});
    });
    return registrantData;
  } catch (error) {
    // Handle any errors that occurred during the database operation
    console.error("Error while retrieving Bigmarker  data:", error);
  }
};

const handleStartAutomation = async (req, res) => {
  const { Name, SpreadSheetId, SheetName, ConferenceId } = req.body;

  const { email } = req.query;

  // console.log(Name,SpreadsheetId,SheetName,ConferenceId,email)

  if (!email || !Name || !SpreadSheetId || !SheetName || !ConferenceId) {
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

    console.log(SubscriberDetailsInDB);

    const DocumentInstance = await new BigmarkerAutomationData({
      Name: Name,
      AppName: "Bigmarker",
      AppId: 2,
      SpreadSheetId: SpreadSheetId,
      SheetName: SheetName,
      Status: "Running",
      Email: email,
      ConferenceId: ConferenceId,
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
      console.log("cron jobs running...");
      await SendingSheetDataToBigMarker(
        SubscriberDetailsInDB,
        email,
        workflow.ConferenceId,
        workflow._id
      );
    });

    const interval = setInterval(
      async () => {
        const workflowCheck = await BigmarkerAutomationData.findOne({
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
  const {
    DataInDB,
    Name,
    SpreadSheetId,
    SheetName,
    ConferenceId,
    Item,
    Operation,
  } = req.body;

  const { email } = req.query;
  if (
    !Name ||
    !ConferenceId ||
    !email ||
    !Item ||
    !Operation
  ) {
    return res.status(400).json({ message: "fields are invalid" });
  }

  try {
    const token = req.headers.authorization;

    if (DataInDB) {
      const resultRemoveSheetData =
        await BigmarkerRegistrantsInDb.findByIdAndDelete(DataInDB);
      console.log(resultRemoveSheetData);
      console.log("Sheet is clear...");
    }

    await BigmarkerAutomationData.findByIdAndDelete(Item._id);
    await BigmarkerToAppAutomationData.findByIdAndDelete(Item._id);
    await BigmarkerToGoogleSheetAutomationData.findByIdAndDelete(Item._id);

    const headers = {
      Authorization: `${token}`,
      "Content-Type": "application/json",
    };

    if (Operation == 1) {
      const body = {
        Name: Name,
        SpreadSheetId: SpreadSheetId,
        SheetName: SheetName,
        ConferenceId: ConferenceId,
      };

      const response = await axios
        .post(
          `http://connectsyncdata.com:5000/bigmarker/api/start/automation?email=${email}`,
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
        ConferenceId: ConferenceId,
      };

      await axios
        .post(
          `http://connectsyncdata.com:5000/bigmarker/api/start/bigmarkertosheet/automation?email=${email}`,
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
    } else if (Operation == 3) {
      const { AweberListId } = req.body;

      let body = {
        Name: Name,
        WebinarId: ConferenceId,
        AweberListId: AweberListId,
      };

      await axios
        .post(
          `http://connectsyncdata.com:5000/bigmarker/api/start/bigmarkertoapp/automation?email=${email}`,
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
    } else if (Operation == 4) {
      const { ListId } = req.body;

      let body = {
        Name: Name,
        WebinarId: ConferenceId,
        BrevoListId: ListId,
      };

      await axios
        .post(
          `http://connectsyncdata.com:5000/bigmarker/api/start/bigmarkertoapp/automation?email=${email}`,
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
    } else {
      const { CampaignListId } = req.body;

      let body = {
        Name: Name,
        WebinarId: ConferenceId,
        CampaignId: CampaignListId,
      };

      await axios
        .post(
          `http://connectsyncdata.com:5000/bigmarker/api/start/bigmarkertoapp/automation?email=${email}`,
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
  } catch (error) {
    res.status(500).json({ message: `Automation failed to start.${error}` });
    console.log(error);
  }
};

const handleRemoveAccount = async (req, res) => {
  const { id } = req.query;

  console.log(id);

  try {
    const response = await BigmarkerUserData.deleteOne({ _id: id });

    if (response.deletedCount > 0) {
      return res.status(200).json({ message: "Account removed" });
    }

    return res.status(500).json({ message: "unable to delete the account" });
  } catch (error) {
    res.status(502).json({ error: error });
  }
};

const StartAutomationBigmarkerToApp = async (req, res) => {
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
      Operation=3
    } else if (req.body.BrevoListId) {
      const { BrevoListId } = req.body;
      AppName = "Brevo";
      ListId = BrevoListId;
      Operation=4

    } else if (req.body.CampaignId) {
      const { CampaignId } = req.body;
      AppName = "Getresponse";
      ListId = CampaignId;
      Operation=5

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

    const TotalAutomationRunning = await BigmarkerToAppAutomationData.find({
      Email: email,
      Status: "Running",
    });

    //checking for any automation running for same app?
    TotalAutomationRunning.forEach((automation) => {
      if (automation.AppName === `BigmarkerTo${AppName}`) {
        return res
          .status(400)
          .json({ message: "Already an automation running" });
      }
    });

    const account = await BigmarkerUserData.findOne({ UserEmail: email });
    const ApiKey = account.ApiKey;

    //getting registrant data
    const registrantData = await GetOnlyRegistrants(ApiKey, WebinarId);

    if (!registrantData || registrantData.length <= 0) {
      return res
        .status(500)
        .json({ message: `No registrant found in webinar` });
    }

    const BigmarkerRegistrantsInDbInstance = new BigmarkerRegistrantsInDb({
      UserEmail: email,
      SubscriberRecords: [],
    });

    const SubscriberDetailsInDB = await BigmarkerRegistrantsInDbInstance.save();

    let tempRegistrant = [];

    registrantData.forEach((obj) => {
      // Extract firstname, lastname, and email from the object

      const { first_name, last_name, email } = obj;

      tempRegistrant.push({
        FirstName: first_name,
        LastName: last_name,
        Email: email,
      });
    });

    //setting the webinar data in db
    const updateCheck = await BigmarkerRegistrantsInDb.findOneAndUpdate(
      { _id: SubscriberDetailsInDB._id },
      { $set: { SubscriberRecords: tempRegistrant } }
    );

    console.log(updateCheck);

    if ((updateCheck.SubscriberRecords.length = 0)) {
      return res
        .status(501)
        .json({ message: `Unable to store registrant data in database` });
    }

    const DocumentInstance = new BigmarkerToAppAutomationData({
      Name: Name,
      AppName: `BigmarkerTo${AppName}`,
      AppId: 2,
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
        await BigmarkerToAweberSync(
          email,
          SubscriberDetailsInDB._id,
          automationData._id,
          ListId
        );
      } else if (AppName === "Brevo") {
        await BigmarkerToBrevoSync(
          email,
          SubscriberDetailsInDB._id,
          automationData._id,
          ListId
        );
      } else {
        await BigmarkerToGetResponse(
          email,
          SubscriberDetailsInDB._id,
          automationData._id,
          ListId
        );
      }
    });

    const interval = setInterval(
      async () => {
        const workflowCheck = await BigmarkerToAppAutomationData.findOne({
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
    console.error("Error in automation...", error.message);
    res.status(403).json({ message: `error occured.. ${error.message}` });
  }
};

module.exports = {
  handleCreateAccount,
  handleRemoveAccount,
  handleStartAutomation,
  handleStartAutomationWebinarToSheet,
  handleEditAutomation,
  StartAutomationBigmarkerToApp,
};
