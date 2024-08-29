import React, { useState } from "react";
import { SiBrevo } from "react-icons/si";
import { ToastContainer, toast } from "react-toastify";
import axios from "axios";
import "react-toastify/dist/ReactToastify.css";

const ActiveCampaignAuthPage = () => {
  const user = JSON.parse(localStorage.getItem("userInfo"));
  const [connect, setConnect] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [accountName, setAccountName] = useState("");

  const headers = {
    Authorization: `Bearer ${user.token}`,
    "Content-Type": "application/json",
  };

  const handleConnect = async () => {
    const body = {
      apiKey: apiKey,
      accountName: accountName,
    };

    await axios
      .post(
        `http://24.199.76.74:5000/bigmarker/api/create/account?email=${user.email}`,
        body,
        {
          headers: headers,
        }
      )
      .then((response) => {
        console.log(response);
        toast.success("ActiveCampaign account connected");
        setConnect(true);
      })
      .catch((error) => {
        console.log("e", error.response.data.error);
        toast.error("Invalid api key or account name , unauthorized");
      });
  };

  const handleKeyChange = (e) => {
    setApiKey(e.target.value);
  };

  return (
    <div>
      <ToastContainer autoClose={3000} />

      <div
        style={{
          display: "flex",
          alignItems: "center",
          flexDirection: "column",
          marginTop: "10vh",
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <img
            src="https://play-lh.googleusercontent.com/3Ll5PntDCYMEyb1n6ty67SAtuW77SkTLTGFlsDlGBhqUUnf9IhHr37wY1wonbBlq0rvK"
            alt="getresponse-icon"
            style={{ color: "#0b996f", height: "40px", width: "40px" , marginRight: "2vh" }}
          />
          <h1>ActiveCampaign AuthPage</h1>
        </div>

        {connect ? (
          <h1>ActiveCampaign Account connected successfully!!</h1>
        ) : (
          <div style={{ width: "20%" }}>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                textAlign: "left",
              }}
            >
              <label style={{ fontWeight: "bolder" }}>Enter Api Key</label>
              <input
                value={apiKey}
                style={{ marginTop: "2vh" }}
                onChange={handleKeyChange}
                placeholder="API KEY"
              ></input>
              <label style={{ fontWeight: "bolder" }}>Enter Account name</label>
              <input
                value={apiKey}
                style={{ marginTop: "2vh" }}
                onChange={(e)=>setAccountName(e.target.value)}
                placeholder="Account name"
              ></input>
            </div>

            <button
              style={{
                backgroundColor: "#004cff",
                border: "none",
                padding: "2vh",
                borderRadius: "25px",
                color: "white",
                fontWeight: "bolder",
                cursor: "pointer",
              }}
              onClick={handleConnect}
            >
              {" "}
              Connect
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActiveCampaignAuthPage;
