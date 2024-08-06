const { ModelUserData } = require("../Models/UserModel");
const bcrypt = require("bcrypt");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const {
  GoToWebinarAutomationData,
  GoToWebinarTokenData,
  GoToWebinarToGoogleSheetAutomationData,
  GotoWebinerListInDB,
  GoToWebinarToAppAutomationData,
} = require("../Models/GoToWebinarModel");
const {
  ModelAweberAutomationData,
  ModelAweberTokenData,
  ModelAweberSubscriberList,
} = require("../Models/AweberModel");
const { ModelGoogleTokenData } = require("../Models/GoogleModel");
const {
  BrevoUserData,
  BrevoAutomationData,
  BrevoSubscriberListInDB,
} = require("../Models/BrevoModel");
const {
  GetResponseUserData,
  GetResponseAutomationData,
  GetResponseSubscriberListInDB,
} = require("../Models/GoToResponseModel");
const {
  BigmarkerUserData,
  BigmarkerAutomationData,
  BigmarkerToGoogleSheetAutomationData,
  BigmarkerRegistrantsInDb,
  BigmarkerToAppAutomationData,
} = require("../Models/BigMarkerModel");
const {
  SendyUserDetails,
  SendyAutomationData,
  SendyRegistrants,
} = require("../Models/SendyModel");
const {
  ActiveCampaignApiRecordModel,
} = require("../Models/ActiveCampaignModel");
const { JVZooAccount } = require("../Models/JvzooModel");

const createHash = async (password) => {
  const saltRounds = 10;

  const salt = await bcrypt.genSaltSync(saltRounds);
  const hashPassword = await bcrypt.hashSync(password, salt);
  return hashPassword;
};

const handleSignUp = async (req, res) => {
  const { email, username, password } = req.body;
  //checking all the fields
  if (!email || !username || !password) {
    return res.json({ status: 403, message: "Please check your fields" });
  }

  try {
    const hashPassword = await createHash(password);
    const checkUserExistInDB = await ModelUserData.find({ email: email });

    //checking user already exist or not
    if (checkUserExistInDB.length <= 0) {
      const userInstance = new ModelUserData({
        email: email,
        username: username,
        password: hashPassword,
        automations: [],
      });
      userInstance.save();
      console.log("user sucessfully created...");
      return res.json({ status: 200, message: "user sucessfully created" });
    } else {
      console.log("user already exist...");
      return res.json({ status: 401, message: "user already exist" });
    }
  } catch (error) {
    console.log(error);
  }
};

const handleLogin = async (req, res) => {
  const { email, password } = req.body;
  const secretKey = process.env.SECRET_KEY;

  // Checking all the fields
  if (!email || !password) {
    return res.json({ message: "Please check your fields" });
  }

  try {
    const checkUserExistInDB = await ModelUserData.findOne({ email: email });

    // Checking if user already exists
    if (!checkUserExistInDB) {
      console.log("User doesn't exist...");
      return res.json({ status: 403, message: "User doesn't exist" });
    } else {
      // Comparing passwords
      const passwordCompareResult = await bcrypt.compare(
        password,
        checkUserExistInDB.password
      );

      if (passwordCompareResult) {
        console.log("Password is correct & User authenticated ...");

        const payload = {
          email: checkUserExistInDB.email,
          password: checkUserExistInDB.password,
        };

        const options = { expiresIn: "7d" };

        const token = jwt.sign(payload, secretKey, options);

        return res.json({ status: 200, checkUserExistInDB, token: token });
      } else {
        console.log("Password is incorrect...");
        return res.json({ status: 403, message: "Password is incorrect" });
      }
    }
  } catch (error) {
    console.error("Error occurred:", error);
    return res.json({ message: "Internal server error" });
  }

  // const userInstance= await new ModelUserData({email: email,})
};

const handleGettingUserInfo = async (req, res) => {
  const { email } = req.body;

  const userInfo = await ModelUserData.findOne({ email: email });

  if (!userInfo) {
    return res.json({ status: 403, message: "user didn't found" });
  }

  const checkGoogleAcountLinked = await ModelGoogleTokenData.findOne({
    Email: email,
  });
  const checkGoToWebinarAccountLinked = await GoToWebinarTokenData.findOne({
    Email: email,
  });
  const checkAweberAccountLinked = await ModelAweberTokenData.findOne({
    email: email,
  });

  const checkBrevoAccountLinked = await BrevoUserData.findOne({
    UserEmail: email,
  });

  const checkGetResponseAccountLinked = await GetResponseUserData.findOne({
    UserEmail: email,
  });

  const checkBigmarkerAccountLinked = await BigmarkerUserData.findOne({
    UserEmail: email,
  });

  const checkSendyAccountLinked = await SendyUserDetails.findOne({
    UserEmail: email,
  });

  const checkActiveCampaignAccountLinked =
    await ActiveCampaignApiRecordModel.findOne({
      Email: email,
    });
  
    const checkJvzooAccountLinked =
    await JVZooAccount.findOne({
      Email: email,
    });


  res.status(200).json({
    Google: checkGoogleAcountLinked,
    GTW: checkGoToWebinarAccountLinked,
    Aweber: checkAweberAccountLinked,
    Brevo: checkBrevoAccountLinked,
    GetResponse: checkGetResponseAccountLinked,
    Bigmarker: checkBigmarkerAccountLinked,
    Sendy: checkSendyAccountLinked,
    ActiveCampaign: checkActiveCampaignAccountLinked,
    Jvzoo: checkJvzooAccountLinked
  });
};

const handleGetAutomationData = async (req, res) => {
  const { email } = req.query;

  if (!email) {
    return res.status(400).json({ message: "Email not found" });
  }

  try {
    let TotalWorkflows = [];
    const GTWAutomationData = await GoToWebinarAutomationData.find({
      Email: email,
    });

    const GTWToGoogleSheetWorkflows =
      await GoToWebinarToGoogleSheetAutomationData.find({ Email: email });
    const AweberAutomationData = await ModelAweberAutomationData.find({
      Email: email,
    });

    const BrevoWorkflow = await BrevoAutomationData.find({
      Email: email,
    });

    const BigmarkerWorkflows = await BigmarkerAutomationData.find({
      Email: email,
    });

    const GTWToAppWorkflows = await GoToWebinarToAppAutomationData.find({
      Email: email,
    });

    const BigmarkerToAppWorkflows = await BigmarkerToAppAutomationData.find({
      Email: email,
    });

    const BigmarkerToSheetWorkflows =
      await BigmarkerToGoogleSheetAutomationData.find({ Email: email });

    const GetResponseWorkflows = await GetResponseAutomationData.find({
      Email: email,
    });

    const SendyWorkflows = await SendyAutomationData.find({ Email: email });

    TotalWorkflows = GTWAutomationData.concat(
      GTWToGoogleSheetWorkflows,
      AweberAutomationData,
      BrevoWorkflow,
      BigmarkerWorkflows,
      BigmarkerToSheetWorkflows,
      GetResponseWorkflows,
      SendyWorkflows,
      GTWToAppWorkflows,
      BigmarkerToAppWorkflows
    );
    res.status(200).json({ Workflows: TotalWorkflows });
  } catch (error) {
    console.log(error);
  }
};

const handleDeleteWorkflow = async (req, res) => {
  const { id } = req.query;
  const { RecordInDBId } = req.body;

  try {
    const collections = [
      {
        Automation: ModelAweberAutomationData,
        DataModel: ModelAweberSubscriberList,
      },
      {
        Automation: BigmarkerAutomationData,
        DataModel: BigmarkerRegistrantsInDb,
      },
      { Automation: BigmarkerToGoogleSheetAutomationData, DataModel: null },
      { Automation: BrevoAutomationData, DataModel: BrevoSubscriberListInDB },
      {
        Automation: GetResponseAutomationData,
        DataModel: GetResponseSubscriberListInDB,
      },
      { Automation: GoToWebinarAutomationData, DataModel: GotoWebinerListInDB },
      { Automation: GoToWebinarToGoogleSheetAutomationData, DataModel: null },
      { Automation: SendyAutomationData, DataModel: SendyRegistrants },
      {
        Automation: GoToWebinarToAppAutomationData,
        DataModel: GotoWebinerListInDB,
      },
      {
        Automation: BigmarkerToAppAutomationData,
        DataModel: BigmarkerRegistrantsInDb,
      },
    ];

    let workflowDeleted = false;

    for (const item of collections) {
      const delItem = await item.Automation.findByIdAndDelete(id);

      if (delItem) {
        workflowDeleted = true;

        if (item.DataModel && RecordInDBId) {
          await item.DataModel.findByIdAndDelete(RecordInDBId);
        }

        // If you've found and deleted the workflow, you may not need to check further collections.
        break;
      }
    }

    if (!workflowDeleted) {
      res.status(404).json({ message: "Workflow not found..." });
    } else {
      res.status(200).json({
        message: "Workflow deleted successfully, and DB record cleared.",
      });
    }
  } catch (error) {
    console.error("Error querying documents:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

module.exports = {
  handleSignUp,
  handleLogin,
  handleGettingUserInfo,
  handleGetAutomationData,
  handleDeleteWorkflow,
};
