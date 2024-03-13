import React, { useEffect, useState } from "react";
import "./AutomationCard.css"; // Import CSS for styling
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrashAlt } from "@fortawesome/free-solid-svg-icons";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "./AutomationCard.css";
import { RiRestartFill } from "react-icons/ri";
import { MdRestartAlt } from "react-icons/md";
import { ImSpinner4 } from "react-icons/im";
import { FaAngleDown } from "react-icons/fa6";
import { IoIosArrowUp } from "react-icons/io";

function ExistingWorkFlows({
  handleDelete,
  Name,
  Email,
  SheetId,
  SheetName,
  AweberListId,
  Status,
  LastTimeTrigged,
  id,
}) {
  const [spreadsheetId, setSpreadsheetId] = useState("");
  const [sheetName, setSheetName] = useState("");
  const [aweberListId, setAweberListId] = useState("");
  const [lastTriggered, setLastTriggered] = useState("N/A");
  const [aweberDataList, setAweberDataList] = useState([]);
  const [googleSpreadDataList, setGoogleSpreadDataList] = useState([]);
  const [googleSpreadDataSheetList, setGoogleSpreadDataSheetList] = useState(
    []
  );
  const [workflowName, setWorkflowName] = useState(Name);
  const [showSettings, setShowSettings] = useState(false);
  
  const handleSpreadsheetIdChange = (event) => {
    setSpreadsheetId(event.target.value);
  };

  const handleSheetNameChange = (event) => {
    setSheetName(event.target.value);
  };

  const handleAweberListChange = (event) => {
    setAweberListId(event.target.value);
  };

  const handleStartAutomation = async () => {
    // Your logic to start automation goes here
    // For demo purposes, update lastTriggered with current time
    console.log(id);

    const response = await axios.post(
      "http://localhost:8000/aweber/api/restartautomation",
      { workflowId: id }
    );

    if (response.data.status === 200) {
      return toast.success(response.data.message);
    }

    return toast.error(response.data.message);
  };

  const gettingAweberList = async () => {
    const user = JSON.parse(localStorage.getItem("userInfo")).email;

    const response = await axios.post(
      "http://localhost:8000/aweber/api/gettinglists",
      {
        email: JSON.parse(localStorage.getItem("userInfo")).email,
      }
    );

    if (response.data.status === 200) {
      setAweberDataList([...response.data.list_data]);
      setAweberListId(response.data.list_data[0].id);
    }
  };

  const gettingSpreadsheetList = async () => {
    const response = await axios.get(
      "http://localhost:8000/aweber/api/gettingspreadsheets"
    );
    if (response.data.status === 200) {
      setGoogleSpreadDataList([...response.data.data]);
      setSpreadsheetId(response.data.data[0].id);
    }
  };

  const gettingSpreadsheetSheetList = async () => {
    const response = await axios.post(
      "http://localhost:8000/aweber/api/gettingsheets",
      {
        sheetId: spreadsheetId,
      }
    );
    if (response.data.status === 200) {
      setGoogleSpreadDataSheetList([...response.data.data]);
      setSheetName(response.data.data[0].title);
    }
  };

 const handleSettings=()=>{
  setShowSettings(!showSettings)
 }

  useEffect(() => {
    gettingAweberList();
    gettingSpreadsheetList();
    gettingSpreadsheetSheetList();
  }, []);

  useEffect(() => {
    gettingSpreadsheetSheetList();
  }, [spreadsheetId]);

  return (
    <div className="automation-card">
      <div className="input-group">
        <label htmlFor="name">Name</label>

        <input className="NameInput" value={workflowName} />
      </div>
      
      <div className="accordions" onClick={handleSettings}> Show More  {showSettings ? <IoIosArrowUp /> : <FaAngleDown />} </div>

      {showSettings && (
        <div className="accordions_dropdown">
          <div className="input-group">
            <label htmlFor="spreadsheetId"> Select spreadsheet</label>

            <select id="aweberList" value={SheetId}>
              {googleSpreadDataList.map((item, index) => (
                <option key={index} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>

          <div className="input-group">
            <label htmlFor="sheetName">Select sheet</label>
            <select id="aweberList" value={SheetName}>
              {googleSpreadDataSheetList.map((item, index) => (
                <option key={index} value={item.title}>
                  {item.title}
                </option>
              ))}
            </select>
          </div>
          <div className="input-group">
            <label htmlFor="aweberList">Select aweber list</label>
            <select id="aweberList" value={AweberListId}>
              {aweberDataList.map((item, index) => (
                <option key={index} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>
          <div className="label-group">
            <label>Last Time Triggered</label>
            <span>{LastTimeTrigged}</span>
          </div>
        </div>
      )}

      <div className="buttons">
        <button className="start-button" onClick={handleStartAutomation}>
          {Status !== "running" ? (
            <>
              <MdRestartAlt className="start-icon" />
              Restart
            </>
          ) : (
            <>
              <ImSpinner4 className="start-icon" />
              Running
            </>
          )}
        </button>
        <button className="delete-button" onClick={handleDelete}>
          <FontAwesomeIcon className="delete-icon" icon={faTrashAlt} />
          Remove
        </button>
      </div>

      <ToastContainer autoClose={3000} />
    </div>
  );
}

export default ExistingWorkFlows;
