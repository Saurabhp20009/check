import React, { useEffect, useState } from "react";
import "../SettingsUI/Setting.css";
import { FaUserCircle } from "react-icons/fa";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";

const Settings = () => {
  const [userInfoData, setUserInfoData] = useState();
  const user = JSON.parse(localStorage.getItem("userInfo"));
  const [displayLinked, setDisplayLinked] = useState(false);
  

  const checkLinkedAweberAccount = async () => {
    const response = await axios.post(
      "http://localhost:8000/aweber/api/checkaweberlink",
      { email: user.email }
    );

    if (response.data.status === 200) {
      setDisplayLinked(true);
    }
  };

  const gettinguserInfo = async () => {
    const requestResponse = await axios.post(
      "http://localhost:8000/user/api/gettinguser",
      { email: user.email}
    );

    if (requestResponse.data.status === 200) {
      setUserInfoData(requestResponse.data.info.username);
    }
  };

  const handleAweberButton = async () => {
    const response = await axios.get(
      "http://localhost:8000/aweber/api/buildauthurl"
    );

    //navigation to app callback url
    if (response.data.status === 200) {
      window.open(response.data.url);
      window.open("/aweberauth");
      checkLinkedAweberAccount();
    }
  };
 
  const handleRevokeToken=async()=>{
  
  const response=  await axios.post("http://localhost:8000/aweber/api/revokeToken",{email:user.email})
  
  if(response.data.status===200)
  {
    toast.success("Access token updated successfully")
  }
 
}
 

  useEffect(() => {
    gettinguserInfo();
    checkLinkedAweberAccount();
  }, []);

  return (
    <div className="setting-outerbox">
      <div className="settings-container">
        <div className="user-card">
          <div className="user-card-flex">
            <FaUserCircle className="card-user-icon" />
            <h4 className="username">{userInfoData}</h4>
          </div>

          <div className="buttons-container">
            <div className="google-sign-in-button">
              
              <button className="btn-text" onClick={handleRevokeToken}>
                <b>Revoke Token</b>
              </button>
            </div>
            {!displayLinked ? (
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
                  <b>Account Linked</b>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      <ToastContainer autoClose={3000}/>
    </div>
  );
};

export default Settings;
