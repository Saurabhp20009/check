import React, { useState } from "react";
import { SiBrevo } from "react-icons/si";
import { ToastContainer, toast } from "react-toastify";
import axios from "axios";
import "react-toastify/dist/ReactToastify.css";

const BigmarkerAuthPage = () => {
  const user = JSON.parse(localStorage.getItem("userInfo"));
  const [connect, setConnect] = useState(false);
  const [apiKey, setApiKey] = useState("");

  const headers = {
    Authorization: `Bearer ${user.token}`,
    "Content-Type": "application/json",
  };

  

  const handleConnect = async () => {
    
    const body = {
      apiKey: apiKey,
    };

    await axios
      .post(
        `http://connectsyndata.com:5000/bigmarker/api/create/account?email=${user.email}`,
        body,
        {
          headers: headers,
        }
      )
      .then((response) => {
        console.log(response);
        toast.success("Bigmarker account connected");
        setConnect(true);
      })
      .catch((error) => {
        console.log("e", error.response.data.error);
        toast.error("Invalid Api Key , unauthorized");
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
            src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQCLeX6fGZJOijKz60REOzXGQPQmE6aU-xeACo72UZ80g&s"
            alt="getresponse-icon"
            style={{ color: "#0b996f", height: "40px", width: "40px" }}
          />
          <h1>Bigmarker AuthPage</h1>
        </div>

        {connect ? (
          <h1>Bigmarker Account connected successfully!!</h1>
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
            </div>

            <button
              style={{
                backgroundColor: "#04adee",
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

export default BigmarkerAuthPage;
