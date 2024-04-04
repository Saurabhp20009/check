const { ModelUserData } = require("../Models/UserModel");
const bcrypt = require("bcrypt");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const {
  GoToWebinarAutomationData,
  GoToWebinarTokenData,
} = require("../Models/GoToWebinarModel");
const {
  ModelAweberAutomationData,
  ModelAweberTokenData,
} = require("../Models/AweberModel");
const { ModelGoogleTokenData } = require("../Models/GoogleModel");

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

  const checkGoogleAcountLinked = await ModelGoogleTokenData.find({
    Email: email,
  });
  const checkGoToWebinarAccountLinked = await GoToWebinarTokenData.find();
  const checkAweberAccountLinked = await ModelAweberTokenData.find({
    email: email,
  });

  const GoogleAccountLinked = checkGoogleAcountLinked.length > 0;
  const GoToWebinarAccountLinked = checkGoToWebinarAccountLinked.length > 0;
  const AweberAccountLinked = checkAweberAccountLinked.length > 0;

  if (!userInfo) {
    return res.json({ status: 403, message: "user didn't found" });
  } else {
    return res.status(200).json({
      Google: GoogleAccountLinked,
      GTW: GoToWebinarAccountLinked,
      Aweber: AweberAccountLinked,
    });
  }
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
    TotalWorkflows = [];
    const AweberAutomationData = await ModelAweberAutomationData.find({
      Email: email,
    });

    TotalWorkflows = GTWAutomationData.concat(AweberAutomationData);
    console.log(TotalWorkflows);
    res.status(200).json({ Workflows: TotalWorkflows });
  } catch (error) {
    console.log(error);
  }
};

const handleDeleteWorkflow = async (req, res) => {
  const { id } = req.query;

  try {
    const model = await GoToWebinarAutomationData.findById(id).exec();
    if (model) {
      await GoToWebinarAutomationData.deleteOne({ _id: id });
      return res.status(200).json({ message: "Document deleted successfully." });
    } else {
      const modelB = await ModelAweberAutomationData.findById(id).exec();
      if (modelB) {
        await ModelAweberAutomationData.deleteOne({ _id: id });
        return res.status(200).json({ message: "Document deleted successfully." });
      } else {
        console.log("Document not found in either GoToWebinarAutomationData or ModelAweberAutomationData");
        return res.status(404).json({ message: "Document not found." });
      }
    }
  } catch (error) {
    console.error("Error querying documents:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
  
};

module.exports = {
  handleSignUp,
  handleLogin,
  handleGettingUserInfo,
  handleGetAutomationData,
  handleDeleteWorkflow
};
