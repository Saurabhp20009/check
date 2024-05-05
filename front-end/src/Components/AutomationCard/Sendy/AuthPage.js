import React, { useState } from "react";
import { SiBrevo, SiGotomeeting } from "react-icons/si";
import { ToastContainer, toast } from "react-toastify";
import axios from "axios";
import "react-toastify/dist/ReactToastify.css";

const SendyAuthPage = () => {
  const user = JSON.parse(localStorage.getItem("userInfo"));
  const [connect, setConnect] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [sendyUrl, setSendyUrl] = useState("");
  const [spinner, setSpinner] = useState(false);

  const headers = {
    Authorization: `Bearer ${user.token}`,
    "Content-Type": "application/json",
  };

  // const body = {
  //   client_id: client_id,
  //   client_secret: client_secret,
  // };

  const handleConnect = async () => {
    setSpinner(true);

    if(!apiKey || !sendyUrl)
    { 
      
     toast.error("Please fill all fields")
     return setSpinner(false)
    }

    const body = {
      apiKey: apiKey,
      sendyUrl: sendyUrl,
    };

    await axios
      .post(
        `http://connectsyncdata.com:5000/sendy/api/create/account?email=${user.email}`,
        body,
        {
          headers: headers,
        }
      )
      .then((response) => {
        console.log(response);
        toast.success("Sendy Account Connected");
        setConnect(true)
        setSpinner(false);
      })
      .catch((error) => {
        console.log("e", error);
        toast.error("invalid api key ,unauthorized");
        setSpinner(false);
      });
  };

  const handleApiKey = (e) => {
    setApiKey(e.target.value);
  };

  console.log(spinner);
  const handleSendyUrl = (e) => {
    setSendyUrl(e.target.value);
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
            src="https://cdn-1.webcatalog.io/catalog/sendy/sendy-icon-filled-256.png?v=1675594526904"
            Bigmarker
            alt="sendy-icon"
            className="bigmarker-img"
          />{" "}
          <h1>Sendy Auth Page</h1>
        </div>

        {connect ?  <h1>Sendy account is Connected</h1>  : <div style={{ width: "20%" }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              textAlign: "left",
            }}
          >
            <div style={{display: "flex",flexDirection: "column"}}>
              <label style={{ fontWeight: "bolder" }}>Enter Api Key:</label>
              <input
                value={apiKey}
                style={{ marginTop: "2vh" }}
                onChange={handleApiKey}
                placeholder="Api Key"
              ></input>
            </div>

            <div>
              <label style={{ fontWeight: "bolder" }}>
                Enter Sendy Installation Url:
              </label>
              <input
                value={sendyUrl}
                style={{ marginTop: "2vh" }}
                onChange={handleSendyUrl}
                placeholder="Sendy Url"
              ></input>
            </div>
          </div>

          {!spinner ? (
            <button
              style={{
                backgroundColor: "#161616",
                border: "none",
                padding: "2vh",
                borderRadius: "25px",
                color: "white",
                fontWeight: "bolder",
                cursor: "pointer",
              }}
              onClick={handleConnect}
            >
              Connect
            </button>
          ) : (
            <div className="spinner-overlay">
              <div className="spinner-container">
                <div className="spinner"></div>
              </div>
            </div>
          )}
        </div>}
      </div>
    </div>
  );
};

export default SendyAuthPage;
