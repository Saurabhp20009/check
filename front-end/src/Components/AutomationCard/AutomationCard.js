import React, { useEffect, useState } from "react";
import "./AutomationCard.css"; // Import CSS for styling
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrashAlt } from "@fortawesome/free-solid-svg-icons";
import { faPlay } from "@fortawesome/free-solid-svg-icons";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";

function AutomationCard({ handleDelete }) {
  const [spreadsheetId, setSpreadsheetId] = useState("");
  const [sheetName, setSheetName] = useState("");
  const [aweberListId, setAweberListId] = useState("");
  const [lastTriggered, setLastTriggered] = useState("N/A");
  const [aweberDataList, setAweberDataList] = useState([]);
  const [googleSpreadDataList, setGoogleSpreadDataList] = useState([]);
  const [googleSpreadDataSheetList, setGoogleSpreadDataSheetList] = useState(
    []
  );
  const [workflowName, setWorkflowName] = useState("");
  

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
    setLastTriggered(new Date().toLocaleString());

    if (!workflowName) {
      return toast.error("Please fill the workflow name");
    }
    const user = JSON.parse(localStorage.getItem("userInfo"));
    const body = {
      name: workflowName,
      email: user.email,
      sheetId: spreadsheetId,
      sheetName: sheetName,
      listId: aweberListId,
    };

    const response = await axios.post(
      "http://localhost:8000/aweber/api/startautomation",
      body
    );
    // console.log(sheetName, aweberListId, spreadsheetId, workflowName);
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

  const handleNameChange = (e) => {
    setWorkflowName(e.target.value);
  };

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

        <input
          value={workflowName}
          className="NameInput"
          onChange={handleNameChange}
        />
        <label htmlFor="spreadsheetId"> Select Google Spreadsheet ID:</label>

        <select
          id="aweberList"
          value={spreadsheetId}
          onChange={handleSpreadsheetIdChange}
        >
          {googleSpreadDataList.map((item, index) => (
            <option key={index} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </div>


      <div className="input-group">
        <label htmlFor="sheetName">Enter the Sheet Name:</label>
        <select
          id="aweberList"
          value={sheetName}
          onChange={handleSheetNameChange}
        >
          {googleSpreadDataSheetList.map((item, index) => (
            <option key={index} value={item.title}>
              {item.title}
            </option>
          ))}
        </select>
      </div>
      <div className="input-group">
        <label htmlFor="aweberList">Aweber List:</label>
        <select
          id="aweberList"
          value={aweberListId}
          onChange={handleAweberListChange}
        >
          {aweberDataList.map((item, index) => (
            <option key={index} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </div>
      <div className="label-group">
        <label>Last Time Triggered:</label>
        <span>{lastTriggered}</span>
      </div>
      <div className="buttons">
        <button className="start-button" onClick={handleStartAutomation}>
          <FontAwesomeIcon icon={faPlay} className="start-icon" />
          Start
        </button>
        <button className="delete-button" onClick={handleDelete}>
          <FontAwesomeIcon className="delete-icon" icon={faTrashAlt} />
          Delete
        </button>
      </div>

      <ToastContainer autoClose={3000} />
    </div>
  );
}

export default AutomationCard;
