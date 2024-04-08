import React, {useEffect, useState } from "react";
import "./Dasboard.css";
import { ToastContainer} from "react-toastify";
import axios from "axios";
import ExistingWorkFlows from "../AutomationCard/ExistingWorkFlows";
import AweberAutomationCard from "../AutomationCard/AweberAutomationCard";
import GTWAutomationCard from "../AutomationCard/GTWAutomationCard";
import { RiPagesLine } from "react-icons/ri";
import { useNavigate } from "react-router-dom";
import { RiErrorWarningFill } from "react-icons/ri";


const Dashboard = () => {
  const [automationLimit, setAutomationLimit] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [ShowAutomationCard, setShowAutomationCard] = useState(false);
  const [ShowApps, setShowApps] = useState(null);
  const [workFlows, setWorkFlows] = useState([]);
  const [pagesDropDown, setPagesDropDown] = useState(false);
  const Applications = [<AweberAutomationCard setShowAutomationCard={setShowAutomationCard} ShowAutomationCard={ShowAutomationCard} />, <GTWAutomationCard setShowAutomationCard={setShowAutomationCard} ShowAutomationCard={ShowAutomationCard} />];

 const navigate=useNavigate()
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
      .get(`http://localhost:5000/user/api/get/workflows?email=${user.email}`, {
        headers: headers,
      })
      .then((response) => {
        setWorkFlows([...response.data.Workflows]);
      })
      .catch((error) => console.log(error));
  };

  const handlePagesDropDown = () => {
    setPagesDropDown(!pagesDropDown);
    
  };

  const handleList = (index) => {
    setShowAutomationCard(!ShowAutomationCard);
    setShowApps(index);
    setIsDropdownOpen(!isDropdownOpen);
  };

 const handlePages=()=>{
  navigate('/error')
}

 

  console.log(workFlows);
  useEffect(() => {
    getWorkFlows();
  }, []);

  return (
    <div style={{ backgroundColor: "#f3f6f9" ,minHeight: "100vh" }}>
      <div>

        <div className="add-automation-card">
          <div className="pages" onClick={handlePagesDropDown}>
            <RiPagesLine />
            Pages
          </div>

          {pagesDropDown && (
            <div className="pagesDropDown">
              <ul>
                <li onClick={handlePages}><RiErrorWarningFill className="error-icon" /> Error Records</li>
              </ul>
            </div>
          )}
          <button className="add-automation-button" onClick={handleClick}>
            Add Automation
          </button>
          {isDropdownOpen && (
            <div className="dropdown-list">
              <ul>
                <li onClick={() => handleList(0)}>Aweber</li>
                <li onClick={() => handleList(1)}>GoToWebinar</li>
              </ul>
            </div>
          )}
        </div>

        {ShowAutomationCard && <div>{Applications[ShowApps]}</div>}

        { workFlows.length>0 ?
          workFlows.map((item, index) => {
            return <ExistingWorkFlows key={index} item={item} />;
          }): <h1 className="no-workflow-found">No workflow found!</h1>}
      </div>
      <ToastContainer />
    </div>
  );
};

export default Dashboard;
