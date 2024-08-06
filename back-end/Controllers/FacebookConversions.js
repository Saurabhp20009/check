const { FacebookConversionAccount } = require("../Models/FacebookConversionModel");



// Verify Facebook Pixel ID and Access Token
const verifyFacebookAccount = async (pixelId, accessToken) => {
    try {
      const response = await axios.get(`https://graph.facebook.com/v13.0/${pixelId}`, {
        params: {
          access_token: accessToken,
        },
      });
      return response.data;
    } catch (error) {
      throw new Error('Invalid Pixel ID or Access Token');
    }
  };







const handleFacebookConversionLinkAccount = async (req, res) => {
    const { email, pixelId, accessToken } = req.body;

    if (!email || !pixelId || !accessToken) {
      return res.status(400).json({ error: 'Email, Pixel ID, and Access Token are required' });
    }
  
    try {
      // Verify the Pixel ID and Access Token
      await verifyFacebookAccount(pixelId, accessToken);
  
      // Find the account by email
      let account = await FacebookConversionAccount.findOne({ Email: email });
  
      if (account) {
        // Check if the combination of Pixel ID and Access Token already exists
        const existingAccount = account.Accounts.find(acc => acc.PixelId === pixelId && acc.AccessToken === accessToken);
  
        if (existingAccount) {
          return res.status(400).json({ error: 'This Pixel ID and Access Token combination already exists.' });
        }
  
        // If the combination does not exist, push the new Pixel ID and Access Token into the Accounts array
        account.Accounts.push({ PixelId: pixelId, AccessToken: accessToken });
      } else {
        // If the account does not exist, create a new one
        account = new FacebookConversionAccount({
          Email: email,
          Accounts: [{ PixelId: pixelId, AccessToken: accessToken }],
        });
      }
  
      // Save the account
      await account.save();
  
      res.json({ message: 'Account saved successfully', account });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  };


  