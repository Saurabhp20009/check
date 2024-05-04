const express = require("express");
const app = express();
const PORT = 5000;
const connection = require("./Connection");
const { userRouter } = require("./Routes/UserRoutes");
const cors = require("cors");
const passport = require("passport");
const aweberRouter = require("./Routes/AweberRoutes");
const { default: mongoose } = require("mongoose");
const GoToWebinarRouter = require("./Routes/GoToWebinarRoutes");
const GoogleRouter = require("./Routes/GoogleRoutes");
const BrevoRouter = require("./Routes/BrevoRoutes");
const GetResponseRouter = require("./Routes/GetResponseRoutes");
const BigmarkerRouter = require("./Routes/BigmarkerRoutes");
const SendyRouter = require("./Routes/SendyRoutes");
require("dotenv").config();


app.use(cors())
app.use(express.json());
app.use("/user/api", userRouter);
app.use("/aweber/api", aweberRouter);
app.use("/gotowebinar/api", GoToWebinarRouter);
app.use("/goauth/api", GoogleRouter);
app.use("/brevo/api",BrevoRouter);
app.use("/getresponse/api",GetResponseRouter);
app.use("/bigmarker/api",BigmarkerRouter);
app.use("/sendy/api",SendyRouter);




app.listen(PORT, () => console.log(`Server is active at port ${PORT}`));
