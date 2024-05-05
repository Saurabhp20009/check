const cron = require("node-cron");

var num = 1;
const task = cron.schedule("*/10 * * * * *", async () => {
  console.log("cron-jobs running");
  num += 1;

  if (num > 1) {
    console.log(num);
  }
});


const interval= setInterval(()=>{
  console.log("set interval running..")
  if(num>10)
    {
      task.stop()
      console.log("cron job stopped.")
      Stop()
    }
},1000)

const Stop = () => {
  clearInterval(interval);
  console.log("set interval stopped.")
};
