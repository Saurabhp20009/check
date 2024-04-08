import React, { useEffect, useRef, useState } from "react";
import "./AutomationCard.css"; // Import CSS for styling
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import { TbSettingsAutomation } from "react-icons/tb";
import { TfiClose } from "react-icons/tfi";

function AweberAutomationCard({ setShowAutomationCard, ShowAutomationCard }) {
  const [spreadsheetId, setSpreadsheetId] = useState("");
  const [sheetName, setSheetName] = useState("");
  const [aweberListId, setAweberListId] = useState("");
  const [aweberDataList, setAweberDataList] = useState([]);
  const [googleSpreadDataList, setGoogleSpreadDataList] = useState([]);
  const [googleSpreadDataSheetList, setGoogleSpreadDataSheetList] = useState(
    []
  );
  const [workflowName, setWorkflowName] = useState("");

  const user = JSON.parse(localStorage.getItem("userInfo"));
  const divRef = useRef(null);

  const headers = {
    Authorization: `Bearer ${user.token} `,
    "Content-Type": "application/json",
  };

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

    const response = await axios
      .post("http://connectsyncdata:5000/aweber/api/startautomation", body, {
        headers: headers,
      })
      .then((response) => window.location.reload());

    return toast.error(response.data.message);
  };

  const gettingAweberList = async () => {
   await axios
      .post(
        "http://connectsyncdata:5000/aweber/api/gettinglists",
        {
          email: user.email,
        },
        {
          headers: headers,
        }
      )
      .then((response) => {
        setAweberDataList([...response.data.list_data]);
        setAweberListId(response.data.list_data[0].id);
      })
      .catch((error) => console.log(error));
  };

  const gettingSpreadsheetList = async () => {
    const response = await axios
      .get(
        `http://connectsyncdata:5000/goauth/api/get/spreadsheets?email=${user.email}`,
        {
          headers: headers,
        }
      )
      .then((response) => {
        setGoogleSpreadDataList([...response.data.SpreadSheetData]);
        setSpreadsheetId(response.data.SpreadSheetData[0].id);
      })
      .catch((error) => console.log(error));
  };

  const gettingSpreadsheetSheetList = async () => {
    const body = {
      SheetId: spreadsheetId,
    };

    const response = await axios
      .post(
        `http://connectsyncdata:5000/goauth/api/get/sheetsnames?email=${user.email}`,
        body,
        {
          headers: headers,
        }
      )
      .then((response) => {
        setGoogleSpreadDataSheetList([...response.data.Sheets]);
        setSheetName(response.data.Sheets[0]);
      })
      .catch((error) => console.log(error));
  };

  const handleNameChange = (e) => {
    setWorkflowName(e.target.value);
  };

  useEffect(() => {
    gettingAweberList();
    gettingSpreadsheetList();
    gettingSpreadsheetSheetList();
    divRef.current.focus();
  }, []);

  useEffect(() => {
    gettingSpreadsheetSheetList();
  }, [spreadsheetId]);

  return (
    <div className="automation-card" tabIndex={0} ref={divRef}>
      <div className="input-group card-head">
        <div className="name-div">
          {" "}
          <label htmlFor="name">Name</label>
          <input
            value={workflowName}
            className="NameInput"
            onChange={handleNameChange}
          />
        </ div>
        <div className="close-card" onClick={()=>setShowAutomationCard(!ShowAutomationCard)}>
        <TfiClose />
        </div>  

      </div>

      <div className="input-group">
        <label htmlFor="spreadsheetId"> Select Spreadsheet</label>

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
        <label htmlFor="sheetName">Select the Sheet</label>
        <select
          id="aweberList"
          value={sheetName}
          onChange={handleSheetNameChange}
        >
          {googleSpreadDataSheetList.map((item, index) => (
            <option key={index} value={item}>
              {item}
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
      <div className="buttons">
        <button className="start-button" onClick={handleStartAutomation}>
          <TbSettingsAutomation className="start-icon" />
          Start
        </button>
      </div>

      <ToastContainer autoClose={3000} />
    </div>
  );
}

export default AweberAutomationCard;
