import React, { useEffect, useState } from "react";
import AutomationCard from "../AutomationCard/AutomationCard";
import "./Dasboard.css";
import { IoMdAdd } from "react-icons/io";
import { ToastContainer, toast } from "react-toastify";
import axios from "axios";
import ExistingWorkFlows from "../AutomationCard/ExistingWorkFlows";

const Dashboard = () => {
  const [displayWorkflows, setDisplayWorkFlows] = useState([]);
  const [automationLimit, setAutomationLimit] = useState([]);

  const handleClick = () => {
    if (automationLimit.length < 10)
      setAutomationLimit([
        ...automationLimit,
        { id: automationLimit.length + 1 },
      ]);
  };

  const handleDelete = async (index) => {
    const updatedCards = [...automationLimit];
    updatedCards.splice(index, 1);
    setAutomationLimit(updatedCards);
    toast.success("Automation deleted");
  };

  const handleExistWorkflowDelete = async (index) => {
    const updatedCards = [...displayWorkflows];
    updatedCards.splice(index, 1);
    setDisplayWorkFlows(updatedCards);
    toast.success("Automation deleted");
  };

  const getWorkFlows = async () => {
    const user = JSON.parse(localStorage.getItem("userInfo"));
    const response = await axios.post(
      "http://localhost:8000/aweber/api/getallworkflows",
      {
        Email: user.email,
      }
    );

    if (response.data.status === 200) {
      setDisplayWorkFlows([...response.data.workflows]);
    }
  };

  useEffect(() => {
    getWorkFlows();
  }, []);

  return (
    <div style={{backgroundColor: "#f3f6f9"}}>
      <div>
        <div className="add-automation-card" onClick={handleClick}>
          <button className="add-automation-button">Add Automation</button>
        </div>
        {displayWorkflows.map((card, index) => (
          <ExistingWorkFlows
          key={index}
            id={card._id}
            Name={card.Name}
            Email={card.Email}
            SheetId={card.SheetId}
            SheetName={card.SheetName}
            AweberListId={card.AweberListId}
            Status={card.Status}
            LastTimeTrigged={card.LastTimeTrigged}
            handleDelete={() => handleExistWorkflowDelete(index)}
          />
        ))}

        {automationLimit.map((card, index) => (
          <AutomationCard
            key={index}
            handleDelete={() => handleDelete(index)}
          />
        ))}
      </div>

      <ToastContainer />
    </div>
  );
};

export default Dashboard;
