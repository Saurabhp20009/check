const express = require("express");
const app = express();
const PORT = 8000;
const connection = require("./Connection");
const { userRouter } = require("./Routes/UserRoutes");
const cors = require("cors");
const passport = require("passport");
const aweberRouter = require("./Routes/AweberRoutes");
const { default: mongoose } = require("mongoose");
require("dotenv").config();




app.use(cors());
app.use(express.json());
app.use("/user/api", userRouter);
app.use("/aweber/api",aweberRouter)

app.listen(PORT, () => console.log("Server is active"));
