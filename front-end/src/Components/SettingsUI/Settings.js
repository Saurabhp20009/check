import React, { useEffect, useState } from "react";
import "../SettingsUI/Setting.css";
import { FaUserCircle } from "react-icons/fa";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import { FcGoogle } from "react-icons/fc";
import { SiGotomeeting } from "react-icons/si";
import { SiBrevo } from "react-icons/si";

const Settings = () => {
  const user = JSON.parse(localStorage.getItem("userInfo"));
  const [displayLinked, setDisplayLinked] = useState({});

  const headers = {
    Authorization: `Bearer ${user.token}`,
    "Content-Type": "application/json",
  };

  const getUserInfo = async () => {
    await axios
      .post(
        "http://24.199.76.74:5000/user/api/gettinguser",
        {
          email: user.email,
        },
        {
          headers: headers,
        }
      )
      .then((response) => {
        console.log(response.data);
        setDisplayLinked(response.data);
      })
      .catch((error) => console.log(error));
  };

  const handleAweberButton = async () => {
    await axios
      .get("http://24.199.76.74:5000/aweber/api/buildauthurl", {
        headers: headers,
      })
      .then((response) => {
        window.open(response.data.url);
        window.open("/aweberauth");
      })
      .catch((error) => console.log(error));
  };

  const handleGoogleLink = async () => {
    console.log(headers);
    await axios
      .get(`http://24.199.76.74:5000/goauth/api/link?email=${user.email}`, {
        headers: headers,
      })
      .then((response) => {
        window.open(response.data.AuthUrl);
        console.log(response);
      })
      .catch((error) => console.log(error));
  };

  const handleGTWLink = async () => {
    window.open("auth/gtw");
  };

  const handleUnlinkGTWAccount = async () => {
    await axios
      .delete(
        `http://24.199.76.74:5000/gotowebinar/api/remove/account?email=${user.email}`,
        {
          headers: headers,
        }
      )
      .then((response) => window.location.reload())
      .catch((error) => console.log(error));
  };

  const handleUnlinkGoogleAccount = async () => {
    await axios
      .delete(
        `http://24.199.76.74:5000/goauth/api/unlink/googleaccount?email=${user.email}`,
        {
          headers: headers,
        }
      )
      .then((response) => window.location.reload())
      .catch((error) => console.log(error));
  };

  const handleBrevoLink = async () => {
    window.open("/auth/brevo");
  };

  const handleBrevoAccountRemove = async () => {
    await axios
      .delete(
        `http://24.199.76.74:5000/brevo/api/delete/account?email=${user.email}`,
        {
          headers: headers,
        }
      )
      .then((response) => window.location.reload())
      .catch((error) => {
        console.log(error);
        toast.error("Error occurred..");
      });
  };

  const handleGetReponse = () => {
    window.open("/auth/get/response");
  };

  const handleRemoveGetResponseAccount = async () => {
    const r = await axios
      .delete(
        `http://24.199.76.74:5000/getresponse/api/remove/account?id=${displayLinked.GetResponse._id}`,
        {
          headers: headers,
        }
      )
      .then((response) => window.location.reload())
      .catch((error) => console.log(error));
  };

  const handleAweberRemove = async () => {
    const r = await axios
      .delete(
        `http://24.199.76.74:5000/aweber/api/remove/account?id=${displayLinked.Aweber._id}`,
        {
          headers: headers,
        }
      )
      .then((response) => window.location.reload())
      .catch((error) => console.log(error));
  };

  const handleBigMarkerConnect = async () => {
    window.open("auth/bigmarker");
  };

  const handleBigmarkerAccountRemove = async () => {
    const r = await axios
      .delete(
        `http://24.199.76.74:5000/bigmarker/api/remove/account?id=${displayLinked.Bigmarker._id}`,
        {
          headers: headers,
        }
      )
      .then((response) => window.location.reload())
      .catch((error) => console.log(error));
  };

  const handleSendyAccountRemove = async () => {
    const r = await axios
      .delete(
        `http://24.199.76.74:5000/sendy/api/remove/account?id=${displayLinked.Sendy._id}`,
        {
          headers: headers,
        }
      )
      .then((response) => window.location.reload())
      .catch((error) => console.log(error));
  };

  const handleSendyConnect = () => {
    window.open("auth/sendy");
  };
 
  const handleActiveCampaignDisconnect=async()=>{
    const r = await axios
    .delete(
      `http://24.199.76.74:5000/active/api/unlink/active/account?id=${displayLinked.ActiveCampaign._id}`,
      {
        headers: headers,
      }
    )
    .then((response) => window.location.reload())
    .catch((error) => console.log(error));

  }
  const handleActiveCampaignConnect = () => {
    window.open("auth/active");
  };
  

  useEffect(() => {
    getUserInfo();
  }, []);


  return (
    <div className="setting-outerbox">
      <div className="settings-container">
        <div className="user-card">
          <div className="user-card-flex">
            <FaUserCircle className="card-user-icon" />
            <h4 className="username">{user.username}</h4>
          </div>
        </div>
        <div className="user-card buttons-card">
          <h2 >Connect Accounts</h2>

          <div className="google-sign-in-button button-margin">
            <div className="google-button-div">
              <img
                className="bigmarker-img"
                src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSGHvFQKZjNIDSbfv0aiO6O3HsGDAFEOhvoPUXBpRpytQ&s"
                alt="AWeber icon"
              />
               AWeber
            </div>

            <div className="Connection-show-button">
              <div>
                {!displayLinked.Aweber ? (
                  <button
                    className="Connect-button"
                    onClick={handleAweberButton}
                  >
                    Connect
                  </button>
                ) : (
                  <button
                    className="Connect-button"
                    onClick={handleAweberRemove}
                  >
                    Disconnect
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="google-sign-in-button button-margin">
            <div className="google-button-div">
              <FcGoogle className="google-icon" />
              Google
            </div>
            <div className="Connection-show-button">
              <div>
                {!displayLinked.Google ? (
                  <button className="Connect-button" onClick={handleGoogleLink}>
                    Connect
                  </button>
                ) : (
                  <button
                    className="Connect-button"
                    onClick={handleUnlinkGoogleAccount}
                  >
                    Disconnect
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="google-sign-in-button button-margin">
            <div className="google-button-div">
              <SiGotomeeting
                className="google-icon"
                style={{ color: "#00baeb" }}
              />
              GotoWebinar
            </div>

            <div>
              {!displayLinked.GTW ? (
                <button className="Connect-button" onClick={handleGTWLink}>
                  Connect
                </button>
              ) : (
                <button
                  className="Connect-button"
                  onClick={handleUnlinkGTWAccount}
                >
                  Disconnect
                </button>
              )}
            </div>
          </div>

          <div className="google-sign-in-button button-margin">
            <div className="google-button-div">
              <SiBrevo className="google-icon" style={{ color: "#0b996f" }} />
              Brevo
            </div>

            <div>
              {!displayLinked.Brevo ? (
                <button className="Connect-button" onClick={handleBrevoLink}>
                  Connect
                </button>
              ) : (
                <button
                  className="Connect-button"
                  onClick={handleBrevoAccountRemove}
                >
                  Disconnect
                </button>
              )}
            </div>
          </div>

          <div className="google-sign-in-button button-margin">
            <div className="google-button-div">
              <img
                src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQCLeX6fGZJOijKz60REOzXGQPQmE6aU-xeACo72UZ80g&s"
                Bigmarker
                alt="bigmarker-icon"
                className="bigmarker-img"
              />{" "}
              Bigmarker
            </div>

            <div>
              {!displayLinked.Bigmarker ? (
                <button
                  className="Connect-button"
                  onClick={handleBigMarkerConnect}
                >
                  Connect
                </button>
              ) : (
                <button
                  className="Connect-button"
                  onClick={handleBigmarkerAccountRemove}
                >
                  Disconnect
                </button>
              )}
            </div>
          </div>

          <div className="google-sign-in-button button-margin">
            <div className="google-button-div">
              <img
                src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS5i_7FxYoqMQp_vaNNTz2EU7aQyLHaaf_yLw8YDhZPWA&s"
                alt="getresponse-icon"
                className="bigmarker-img"
              />{" "}
              GetResponse
            </div>

            <div>
              {!displayLinked.GetResponse ? (
                <button className="Connect-button" onClick={handleGetReponse}>
                  Connect
                </button>
              ) : (
                <button
                  className="Connect-button"
                  onClick={handleRemoveGetResponseAccount}
                >
                  Disconnect
                </button>
              )}
            </div>
          </div>

          {/* <div className="google-sign-in-button button-margin">
            <div className="google-button-div">
              <img
                src="https://pipedream.com/s.v0/app_OkrhrJ/logo/orig"
                Bigmarker
                alt="mailwizz-icon"
                className="bigmarker-img"
              />{" "}
              Mailwizz
            </div>

            <div>
              {!displayLinked.Brevo ? (
                <button className="Connect-button" onClick={handleBrevoLink}>
                  Connect
                </button>
              ) : (
                <button
                  className="Connect-button"
                  onClick={handleBrevoAccountRemove}
                >
                  Disconnect
                </button>
              )}
            </div>
          </div> */}

          <div className="google-sign-in-button button-margin">
            <div className="google-button-div">
              <img
                src="https://cdn-1.webcatalog.io/catalog/sendy/sendy-icon-filled-256.png?v=1675594526904"
                Bigmarker
                alt="sendy-icon"
                className="bigmarker-img"
              />{" "}
              Sendy
            </div>

            <div>
              {!displayLinked.Sendy ? (
                <button className="Connect-button" onClick={handleSendyConnect}>
                  Connect
                </button>
              ) : (
                <button
                  className="Connect-button"
                  onClick={handleSendyAccountRemove}
                >
                  Disconnect
                </button>
              )}
            </div>
          </div>
          <div className="google-sign-in-button button-margin">
            <div className="google-button-div">
              <img
                src="https://play-lh.googleusercontent.com/3Ll5PntDCYMEyb1n6ty67SAtuW77SkTLTGFlsDlGBhqUUnf9IhHr37wY1wonbBlq0rvK"
                Bigmarker
                alt="sendy-icon"
                className="bigmarker-img"
              />{" "}
              Active Campaign
            </div>

            <div>
              {!displayLinked.ActiveCampaign ? (
                <button className="Connect-button" onClick={handleActiveCampaignConnect}>
                  Connect
                </button>
              ) : (
                <button
                  className="Connect-button"
                  onClick={handleActiveCampaignDisconnect}
                >
                  Disconnect
                </button>
              )}
            </div>
          </div>

          <div className="google-sign-in-button button-margin">
            <div className="google-button-div">
              <img
                src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRVcwl5RlZ9ooNVwU2C3zkLLKdhGHQk1mvLcQ&s"
                Bigmarker
                alt="sendy-icon"
                className="bigmarker-img"
              />{" "}
              JvZoo
            </div>

            <div>
              {!displayLinked.Jvzoo ? (
                <button className="Connect-button" onClick={handleActiveCampaignConnect}>
                  Connect
                </button>
              ) : (
                <button
                  className="Connect-button"
                  onClick={handleActiveCampaignDisconnect}
                >
                  Disconnect
                </button>
              )}
            </div>
          </div>
       

        </div>
      </div>
      <ToastContainer autoClose={3000} />
    </div>
  );
};

export default Settings;
