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


const cluster = require("node:cluster");
const numCPUs = require("node:os").availableParallelism();
const process = require("node:process");

if (cluster.isPrimary) {
  console.log(`Primary ${process.pid} is running`);

  // Fork workers.
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on("exit", (worker, code, signal) => {
    console.log(`worker ${worker.process.pid} died`);
    cluster.fork();
  });
} else {
  // Workers can share any TCP connection

  app.use(cors());
  app.use(express.json());
  app.use("/user/api", userRouter);
  app.use("/aweber/api", aweberRouter);
  app.use("/gotowebinar/api", GoToWebinarRouter);
  app.use("/goauth/api", GoogleRouter);
  app.use("/brevo/api", BrevoRouter);
  app.use("/getresponse/api", GetResponseRouter);
  app.use("/bigmarker/api", BigmarkerRouter);
  app.use("/sendy/api", SendyRouter);

  app.listen(PORT, () => console.log(`Server is active at port ${PORT}`));

  console.log(`Worker ${process.pid} started`);
}
