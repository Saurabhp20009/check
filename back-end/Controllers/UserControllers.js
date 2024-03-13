const {ModelUserData} = require("../Models/UserModel");
const bcrypt = require("bcrypt");

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
        automations: []
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
        return res.json({ status: 200, message: "User authenticated" });
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
  } else {
    return res.json({ status: 200, message: "user found", info: userInfo });
  }
};

module.exports = { handleSignUp, handleLogin, handleGettingUserInfo };
