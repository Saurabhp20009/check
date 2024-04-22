import React, { useState } from "react";
import { SiBrevo, SiGotomeeting } from "react-icons/si";
import { ToastContainer, toast } from "react-toastify";
import axios from "axios";
import "react-toastify/dist/ReactToastify.css";

const GoToWebinarAuthPage = () => {
  const user = JSON.parse(localStorage.getItem("userInfo"));
  const [connect, setConnect] = useState(false);
  const [client_id, setClient_id] = useState("");
  const [client_secret, setClient_secret] = useState("");

  const headers = {
    Authorization: `Bearer ${user.token}`,
    "Content-Type": "application/json",
  };

  const body = {
    client_id: client_id,
    client_secret:client_secret
  };

  const handleConnect = async () => {
    await axios
      .post(
        `http://connectsyncdata.com:5000/gotowebinar/api/login?email=${user.email}`,
        body,
        {
          headers: headers,
        }
      )
      .then((response) => {
        console.log(response);
        window.open(response.data.AuthUrl)
        setConnect(!connect);
      })
      .catch((error) => {
        console.log("e", error.response.data.error);
        //toast.error(" , unauthorized");
      });
  };

  const handleClientId = (e) => {
    setClient_id(e.target.value);
  };
  
  const handleClientSecret = (e) => {
    setClient_secret(e.target.value);
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
          <SiGotomeeting
            style={{
              color: "#01baeb",
              height: "40px",
              width: "40px",
              marginRight: "1vh",
            }}
          />{" "}
          <h1>GoToWebinar Auth Page</h1>
        </div>

        {connect ? (
          <h1>GotoWebinar account connected successfully!!</h1>
        ) : (
          <div style={{ width: "20%" }}>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                textAlign: "left",
              }}
            >
              <div>
                <label style={{ fontWeight: "bolder" }}>Enter Client ID:</label>
                <input
                  value={client_id}
                  style={{ marginTop: "2vh" }}
                  onChange={handleClientId}
                  placeholder="Client ID"
                ></input>
              </div>

              <div>
                <label style={{ fontWeight: "bolder" }}>Enter Client Secret:</label>
                <input
                  value={client_secret}
                  style={{ marginTop: "2vh" }}
                  onChange={handleClientSecret}
                  placeholder="Client Secret"
                ></input>
              </div>
            </div>

            <button
              style={{
                backgroundColor: "#01baeb",
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

export default GoToWebinarAuthPage;
