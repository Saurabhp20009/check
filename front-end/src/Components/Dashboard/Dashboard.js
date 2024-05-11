import React, { useEffect, useState } from "react";
import "./Dasboard.css";
import { ToastContainer } from "react-toastify";
import axios from "axios";
import ExistingWorkFlows from "../AutomationCard/ExistingWorkFlows";
import AweberAutomationCard from "../AutomationCard/Aweber/AweberAutomationCard";
import GTWAutomationCard from "../AutomationCard/GoToWebinar/GTWAutomationCard";
import { RiPagesLine } from "react-icons/ri";
import { useNavigate } from "react-router-dom";
import { RiErrorWarningFill } from "react-icons/ri";
import BrevoAutomationCard from "../AutomationCard/Brevo/BrevoAutomationCard";
import Spinner from "../LoadingSpinner/Spinner";
import GetResponseAutomationCard from "../AutomationCard/GetResponse/GetResponseAutomationCard";
import BigmarkerAutomationCard from "../AutomationCard/Bigmarker/BigmarkerAutomationCard";
import SendyAutomationCard from "../AutomationCard/Sendy/SendyAutomationCard";

const Dashboard = () => {
  const [automationLimit, setAutomationLimit] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [ShowAutomationCard, setShowAutomationCard] = useState(false);
  const [ShowApps, setShowApps] = useState(null);
  const [workFlows, setWorkFlows] = useState([]);
  const [pagesDropDown, setPagesDropDown] = useState(false);
  const [loading, setLoading] = useState(true);

  const Applications = [
    <AweberAutomationCard
      setShowAutomationCard={setShowAutomationCard}
      ShowAutomationCard={ShowAutomationCard}
    />,
    <BigmarkerAutomationCard
      setShowAutomationCard={setShowAutomationCard}
      ShowAutomationCard={ShowAutomationCard}
    />,
    <BrevoAutomationCard
      setShowAutomationCard={setShowAutomationCard}
      ShowAutomationCard={ShowAutomationCard}
    />,
    <GetResponseAutomationCard
      setShowAutomationCard={setShowAutomationCard}
      ShowAutomationCard={ShowAutomationCard}
    />,
    <GTWAutomationCard
      setShowAutomationCard={setShowAutomationCard}
      ShowAutomationCard={ShowAutomationCard}
    />,
    <SendyAutomationCard
      setShowAutomationCard={setShowAutomationCard}
      ShowAutomationCard={ShowAutomationCard}
    />,
  ];

  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("userInfo"));

  const headers = {
    Authorization: `Bearer ${user.token} `,
    "Content-Type": "application/json",
  };

  const handleClick = () => {
    if (automationLimit.length < 10)
      setAutomationLimit([
        ...automationLimit,
        { id: automationLimit.length + 1 },
      ]);

    setIsDropdownOpen(!isDropdownOpen);
  };

  const getWorkFlows = async () => {
    

    await axios
      .get(`http://connectsyncdata.com:5000/user/api/get/workflows?email=${user.email}`, {
        headers: headers,
      })
      .then(async(response) => {
        console.log(response.data.Workflows);
        await setWorkFlows([...response.data.Workflows]);
      })
      .catch((error) => console.log(error));
      setLoading(false);
    };

  const handlePagesDropDown = () => {
    setPagesDropDown(!pagesDropDown);
  };

  const handleList = (index) => {
    setShowAutomationCard(!ShowAutomationCard);
    setShowApps(index);
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handlePages = () => {
    navigate("/error");
  };

  console.log(workFlows);
  useEffect(() => {
    getWorkFlows();
  }, []);

  return (
    <div style={{ backgroundColor: "#f3f6f9", minHeight: "100vh" }}>
      <div>
        <div className="add-automation-card">
          <div className="pages" onClick={handlePagesDropDown}>
            <RiPagesLine />
            Pages
            <div className="pagesDropDown">
              <ul>
                <li onClick={handlePages}>
                  <RiErrorWarningFill className="error-icon" /> Error Records
                </li>
              </ul>
            </div>
          </div>

          
      
          <button className="add-automation-button" onClick={handleClick}>
            Add Automation
            <div className="dropdown-list">
              <ul>
                <li onClick={() => handleList(0)}>Aweber</li>
                <li onClick={() => handleList(1)}>BigMarker</li>
                <li onClick={() => handleList(2)}>Brevo</li>
                <li onClick={() => handleList(3)}>GetResponse</li>
                <li onClick={() => handleList(4)}>GoToWebinar</li>
                <li onClick={() => handleList(5)}>Sendy</li>
              </ul>
            </div>
          </button>
        </div>

        {ShowAutomationCard && <div>{Applications[ShowApps]}</div>}


        {loading ? (
          <Spinner />
        ) : workFlows.length > 0 ? (
          workFlows.map((item, index) => {
            return <ExistingWorkFlows key={index} item={item} />;
          })
        ) : (
          <h1 className="no-workflow-found">No workflow found!</h1>
        )}
      </div>

      <ToastContainer />
    </div>
  );
};

export default Dashboard;
