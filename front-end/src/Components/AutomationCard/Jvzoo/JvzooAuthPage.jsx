import React, { useState } from "react";
import { SiBrevo } from "react-icons/si";
import { ToastContainer, toast } from "react-toastify";
import axios from "axios";
import "react-toastify/dist/ReactToastify.css";

const JvzooAuthPage = () => {
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
      email: user.name,
      apiKey: apiKey,
      name: accountName,
    };

    await axios
      .post(
        `http://backend.connectsyncdata.com:5000/jvzoo/api/link/active/account`,
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
            src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRVcwl5RlZ9ooNVwU2C3zkLLKdhGHQk1mvLcQ&s"
            alt="getresponse-icon"
            style={{ color: "#0b996f", height: "40px", width: "40px" , marginRight: "2vh" }}
          />
          <h1>JvzooAuthPage</h1>
        </div>

        {connect ? (
          <h1>JvzooAuthPage</h1>
        ) : (
          <div style={{ width: "20%" }}>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                textAlign: "left",
              }}
            >
              <label style={{ fontWeight: "bolder" }}>Enter api Key</label>
              <input
                value={apiKey}
                style={{ marginTop: "2vh" }}
                onChange={handleKeyChange}
                placeholder="API KEY"
              ></input>
              <label style={{ fontWeight: "bolder" }}>Enter api name</label>
              <input
                value={apiKey}
                style={{ marginTop: "2vh" }}
                onChange={(e)=>setAccountName(e.target.value)}
                placeholder="Api name"
              ></input>
            </div>

            <button
              style={{
                backgroundColor: "#e93524",
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

export default JvzooAuthPage;
