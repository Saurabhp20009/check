import React, { useEffect, useState } from "react";
import axios from "axios";

const AweberAuthLinkPage = () => {
  const [aweberLink, setAweberLink] = useState("");
  const [displayState, setDisplayState] = useState(false);
  const user = JSON.parse(localStorage.getItem("userInfo"));

  const handleSubmit = async (e) => {
    e.preventDefault();

    // You can perform actions here with the aweberLink state
    const response = await axios.post(
      "http://localhost:8000/aweber/api/createtoken",
      {
        authorizationResponse: aweberLink,
        email: user.email,
      }
    );

    if (response.status === 200) {
      setDisplayState(true);
    }
  };

  return (
    <div style={{ marginTop: "50px", padding: "0 20px" }}>
      <div style={{ display: "flex", justifyContent: "center" }}>
        <div style={{ width: "100%", maxWidth: "600px" }}>
          {!displayState ? (
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: "20px" }}>
                <label htmlFor="aweberLink" style={{ fontWeight: "bold" }}>
                  Login and paste the returned URL here
                </label>
                <input
                  type="text"
                  style={{
                    width: "100%",
                    padding: "10px",
                    fontSize: "16px",
                    borderRadius: "5px",
                    border: "1px solid #ccc",
                    marginTop: "20px",
                  }}
                  id="aweberLink"
                  placeholder="Paste Link"
                  value={aweberLink}
                  onChange={(e) => setAweberLink(e.target.value)}
                  required
                />
              </div>
              <button
                type="submit"
                style={{
                  backgroundColor: "#007bff",
                  color: "#fff",
                  border: "none",
                  padding: "12px 20px",
                  fontSize: "16px",
                  cursor: "pointer",
                  width: "20%",
                  borderRadius: "5px",
                }}
              >
                Submit
              </button>
            </form>
          ) : (
            <h5 style={{ textAlign: "center" }}>
              Please back to settings page authorization successful!
            </h5>
          )}
        </div>
      </div>
    </div>
  );
};

export default AweberAuthLinkPage;
