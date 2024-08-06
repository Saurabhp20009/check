const axios = require('axios');

async function checkApiKey(apiKey) {
  const url = 'https://api.jvzoo.com/v2.0';

  try {
    const response = await axios.get(url, {
      headers: {
        'Content-Type': 'application/json'
      },
      auth: {
        username: apiKey,
        password: 'x'
      }
    });

    console.log('API Key is valid');
    console.log('Response:', response.data);
  } catch (error) {
    if (error.response) {
      console.log('API Key is invalid');
      console.log('Error response:', error.response.data);
    } else {
      console.log('Error:', error.message);
    }
  }
}

// Replace 'MyAPIKeyString' with your actual API key
checkApiKey('d12e881c0e2e99ea13779f280570b742039a53b951e9db47992bb6ca3df364e6');
