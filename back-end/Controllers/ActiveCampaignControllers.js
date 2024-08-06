const { default: axios } = require("axios");
const { ActiveCampaignApiRecordModel } = require("../Models/ActiveCampaignModel");


const handleActiveCampaignLinkAccount = async (req, res) => {
    try {
      const { email } = req.query;
      const { apiKey, accountName } = req.body;
      const options = {
        method: "GET",
        url: `https://${accountName}.api-us1.com/api/3/activities`,
        headers: { "Api-Token": `${apiKey}`, "Content-Type": "application/json",'accept': 'application/json' },
      };
  
      await axios.request(options).then(async function (response) {
        console.log(response.data);
  
        const DocumentInstance = new ActiveCampaignApiRecordModel({
          Email: email,
          ApiKey: apiKey,
          AccountName:accountName
        });
  
        const account = await DocumentInstance.save();
        console.log(account);
  
        res.status(200).json({ ActiveCampaign: account });
      });
    } catch (error) {
      console.error("Error creating get response account:", error);
      res.status(401).json({ error: error });
    }
  };


const handleActiveCampaignUnLinkAccount =async(req,res)=>{
    const { id } = req.query;

    try {
      const result = await ActiveCampaignApiRecordModel.deleteOne({ _id: id });
  
      // console.log(result);
  
      if (result.deletedCount > 0) {
        return res.status(200).json({ message: "Account removed" });
      }
  
      res.status(500).json({ message: "unable to delete the account" });
    } catch (error) {
      // console.log(error);
      res.status(502).json({ error: error });
    }
}  



  module.exports={handleActiveCampaignLinkAccount,handleActiveCampaignUnLinkAccount}