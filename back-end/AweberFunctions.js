const ClientOAuth2 = require("client-oauth2");
const readline = require("readline");
const OAUTH_URL = "https://auth.aweber.com/oauth2";
const TOKEN_URL = "https://auth.aweber.com/oauth2/token";
const axios = require("axios");
const fs = require("fs");

const { ModelAutomationData } = require("./Models/UserModel");
const { ModelTokenData } = require("./Models/AweberModel");

const scopes = [
  "account.read",
  "list.read",
  "list.write",
  "subscriber.read",
  "subscriber.write",
  "email.read",
  "email.write",
  "subscriber.read-extended",
  "landing-page.read",
];

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const clientId = "zoL6mwfjdAiMsF8wVRVWVpAZ40S0H0Pt";
const clientSecret = "F1HeE25IpnwU5WoGWm3uMEK7ji6A0SO2";
const state = "Undefined";

const question = (q) => new Promise((resolve) => rl.question(q, resolve));

const aweberAuth = new ClientOAuth2({
  clientId,
  clientSecret,
  accessTokenUri: TOKEN_URL,
  authorizationUri: `${OAUTH_URL}/authorize`,
  redirectUri: "https://connectsyncdata.com/callback/aweber",
  scopes,
});

async function buildAuthorizationURL() {
  const authorizationUrl = await aweberAuth.code.getUri({ state });
  console.log(authorizationUrl);
}

async function getAccessToken() {
  await buildAuthorizationURL();

  const authorizationResponse = await question(
    "Login and paste the returned URL here:"
  );

  console.log(authorizationResponse);
  const user = await aweberAuth.code.getToken(authorizationResponse);

  const TokenDataInstance = new ModelTokenData({
    access_token: user.data.access_token,
    refresh_token: user.data.refresh_token,
  });

  TokenDataInstance.save();
  console.log("Access token and refresh token created successfully...");

  return user;
}

async function RevokeAccessToken() {
  const tokenData = await ModelTokenData.find();

  const aweberAuth = new ClientOAuth2({
    clientId: clientId,
    clientSecret: clientSecret,
    accessTokenUri: TOKEN_URL,
    authorizationUri: `${OAUTH_URL}/authorize`,
    redirectUri: "https://connectsyncdata.com/callback/aweber",
    scopes,
  });

  user = await aweberAuth.createToken(
    tokenData[0].access_token,
    tokenData[0].refresh_token,
    "bearer"
  );
  await ModelTokenData.updateOne({
    access_token: user.data.accessToken,
    refresh_token: user.data.refresh_token,
  });
  console.log(user, "Token data updated....");
}

async function addingSubscribers(data, workflow) {
 

  const TokenData = await ModelTokenData.findOne({ email: workflow.Email });
  const accessToken = TokenData.access_token;
  const apiUrl = `https://api.aweber.com/1.0/accounts/1756373/lists/${workflow.AweberListId}/subscribers`;

  const headers = {
    Accept: "application/json",
    "Content-Type": "application/json",
    "User-Agent": "AWeber-Node-code-sample/1.0",
    Authorization: `Bearer ${accessToken}`,
  };
  const body = JSON.stringify({
    name: data.FirstName + data.LastName,
    email: data.Email,
  });




  const response = await fetch(apiUrl, {
    headers: headers,
    method: "POST",
    body: body,
  });

  if (response.status === 201) {
    console.log(`Subscriber created for email ${data.Email}`, response.status);
    return true;
  } else {
    console.log(
      `Subscriber not created for email ${data.Email}`,
      response.status
    );

    return false;
  }

  //console.log("temp",tempArr)
}

module.exports = { addingSubscribers };
