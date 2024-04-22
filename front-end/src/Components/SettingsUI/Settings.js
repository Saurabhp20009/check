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
        "http://connectsyncdata.com:5000/user/api/gettinguser",
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
      .get("http://connectsyncdata.com:5000/aweber/api/buildauthurl", {
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
      .get(`http://connectsyncdata.com:5000/goauth/api/link?email=${user.email}`, {
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

    // console.log(headers);
    // await axios
    //   .get(`http://connectsyncdata.com:5000/gotowebinar/api/login?email=${user.email}`, {
    //     headers: headers,
    //   })
    //   .then((response) => window.open(response.data.AuthUrl))
    //   .catch((error) => console.log(error));
  };

  const handleUnlinkGTWAccount = async () => {
    await axios
      .delete(
        `http://connectsyncdata.com:5000/gotowebinar/api/remove/account?email=${user.email}`,
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
        `http://connectsyncdata.com:5000/goauth/api/unlink/googleaccount?email=${user.email}`,
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
        `http://connectsyncdata.com:5000/brevo/api/delete/account?email=${user.email}`,
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

  useEffect(() => {
    getUserInfo();
  }, []);

  console.log(displayLinked);

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
          <h2>Account linking</h2>

          <div className="buttons-container button-margin">
            <div className="aweber-link-button">
              <img
                className="aweber-icon"
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
                  <button className="Connect-button">Disconnect</button>
                )}
              </div>
            </div>
          </div>

          <div className="google-sign-in-button button-margin">
            <div className="google-button-div">
              <FcGoogle className="google-icon" />
              <label>Google</label>
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
              <label> GotoWebinar</label>
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
                src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS5i_7FxYoqMQp_vaNNTz2EU7aQyLHaaf_yLw8YDhZPWA&s"
                Bigmarker
                alt="getresponse-icon"
                className="bigmarker-img"
              />{" "}
              GetResponse
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
          </div>

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
        </div>
      </div>
      <ToastContainer autoClose={3000} />
    </div>
  );
};

export default Settings;
