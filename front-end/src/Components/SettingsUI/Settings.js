import React, { useEffect, useState } from "react";
import "../SettingsUI/Setting.css";
import { FaUserCircle } from "react-icons/fa";
import axios from "axios";
import { ToastContainer } from "react-toastify";
import { FcGoogle } from "react-icons/fc";
import { SiGotomeeting } from "react-icons/si";
import { BiLogoGoogle } from "react-icons/bi";

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
        "http://localhost:5000/user/api/gettinguser",
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
      .get("http://localhost:5000/aweber/api/buildauthurl", {
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
      .get(`http://localhost:5000/goauth/api/link?email=${user.email}`, {
        headers: headers,
      })
      .then((response) => window.open(response.data.AuthUrl))
      .catch((error) => console.log(error));
  };

  const handleGTWLink = async () => {
    console.log(headers);
    await axios
      .get(`http://localhost:5000/gotowebinar/api/login?email=${user.email}`, {
        headers: headers,
      })
      .then((response) => window.open(response.data.AuthUrl))
      .catch((error) => console.log(error));
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
          <div className="buttons-container">
            {!displayLinked.Aweber ? (
              <div className="aweber-link-button" onClick={handleAweberButton}>
                <div className="aweber-icon-wrapper">
                  <img
                    className="aweber-icon"
                    src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSGHvFQKZjNIDSbfv0aiO6O3HsGDAFEOhvoPUXBpRpytQ&s"
                    alt="AWeber icon"
                  />
                </div>
                <button className="aweber-btn-text">
                  <b>Link AWeber</b>
                </button>
              </div>
            ) : (
              <div className="aweber-link-button">
                <button className="aweber-btn-text">
                  <b>Aweber Account Connected</b>
                </button>
              </div>
            )}
          </div>

          {!displayLinked.Google ? (
            <div className="google-sign-in-button">
              <FcGoogle />
              <button className="btn-text" onClick={handleGoogleLink}>
                Connect Google Account
              </button>
            </div>
          ) : (
            <div className="google-sign-in-button">
              <BiLogoGoogle />
              <button className="btn-text">Google Account Connected</button>
            </div>
          )}
          {!displayLinked.GTW ? (
            <div className="google-sign-in-button" onClick={handleGTWLink}>
              <SiGotomeeting />
              <button className="btn-text">Connect GotoWebinar Account</button>
            </div>
          ) : (
            <div className="google-sign-in-button">
              <SiGotomeeting />
              <button className="btn-text">
                GotoWebinar Account Connected
              </button>
            </div>
          )}
        </div>
      </div>
      <ToastContainer autoClose={3000} />
    </div>
  );
};

export default Settings;
