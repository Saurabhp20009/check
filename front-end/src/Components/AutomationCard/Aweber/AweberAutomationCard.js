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
  const [operation, setOperation] = useState(1);
  const [workflowName, setWorkflowName] = useState("");

  const user = JSON.parse(localStorage.getItem("userInfo"));

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

  const handleOperation = (event) => {
    setOperation(event.target.value);
  };

  const handleStartAutomation = async () => {
    // Your logic to start automation goes here
    // For demo purposes, update lastTriggered with current time

    if (!workflowName) {
      return toast.error("Please fill the workflow name");
    }

    if (operation == 1) {
      const user = JSON.parse(localStorage.getItem("userInfo"));
      const body = {
        name: workflowName,
        email: user.email,
        sheetId: spreadsheetId,
        sheetName: sheetName,
        listId: aweberListId,
      };

      const response = await axios
        .post("http://24.199.76.74:5000/aweber/api/startautomation", body, {
          headers: headers,
        })
        .then((response) => window.location.reload());

      return toast.error(response.data.message);
    } else if(operation ==2) {
      const body = {
        name: workflowName,
        email: user.email,
        sheetId: spreadsheetId,
        sheetName: sheetName,
        listId: aweberListId,
      };
      const response = await axios
        .post("http://24.199.76.74:5000/aweber/api/start/del/automation", body, {
          headers: headers,
        })
        .then((response) => window.location.reload());

      return toast.error(response.data.message);
    }
    else  {
      const body = {
        name: workflowName,
        email: user.email,
        sheetId: spreadsheetId,
        sheetName: sheetName,
        listId: aweberListId,
      };
      const response = await axios
        .post("http://24.199.76.74:5000/aweber/api/start/app/automation", body, {
          headers: headers,
        })
        .then((response) => window.location.reload());

      return toast.error(response.data.message);
    }
  };

  const gettingAweberList = async () => {
    await axios
      .post(
        "http://24.199.76.74:5000/aweber/api/gettinglists",
        {
          email: user.email,
        },
        {
          headers: headers,
        }
      )
      .then((response) => {
        console.log("res");
        setAweberDataList([...response.data.list_data]);
        setAweberListId(response.data.list_data[0].id);
      })
      .catch((error) => {

        // toast.error(error?.response?.data?.message);
      });
  };



  const gettingSpreadsheetList = async () => {
    const response = await axios
      .get(
        `http://24.199.76.74:5000/goauth/api/get/spreadsheets?email=${user.email}`,
        {
          headers: headers,
        }
      )
      .then((response) => {
        setGoogleSpreadDataList([...response.data.SpreadSheetData]);
        setSpreadsheetId(response.data.SpreadSheetData[0].id);
      })
      .catch((error) => {
        if (error?.response?.status == 401)
          {
            console.log("Google account credentials are invalid")
          }
          // toast.error(
          //   "Google account credentials is invalid or connect your google account"
          // );

      });
  };

  const gettingSpreadsheetSheetList = async () => {
    const body = {
      SheetId: spreadsheetId,
    };

    const response = await axios
      .post(
        `http://24.199.76.74:5000/goauth/api/get/sheetsnames?email=${user.email}`,
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
    if (spreadsheetId) {
      gettingSpreadsheetSheetList();
    }
  }, [spreadsheetId]);

  useEffect(() => {
    gettingAweberList();
    gettingSpreadsheetList();
    gettingSpreadsheetSheetList();
  }, []);

  return (
    <div className="automation-card">
      <div className="input-group card-head">
        <div className="name-div">
          {" "}
          <label htmlFor="name">Name</label>
          <input
            value={workflowName}
            className="NameInput"
            onChange={handleNameChange}
            placeholder="Enter workflow name"
          />
        </div>
        <div
          className="close-card"
          onClick={() => setShowAutomationCard(!ShowAutomationCard)}
        >
          <TfiClose />
        </div>
      </div>

      <div className="input-group">
        <label htmlFor="spreadsheetId"> Select Operation</label>

        <select id="aweberList" value={operation} onChange={handleOperation}>
          <option value={1}>Google Sheet --- Aweber</option>

          <option value={2}>
            Google Sheet --- Aweber (Delete subscribers)
          </option>
        
          <option value={3}>
            Aweber --- Active Campaign(Create contacts) 
          </option>

        </select>
      </div>

      <div className="input-group">
        <label htmlFor="spreadsheetId">
          <b>Source:</b> Spreadsheet
        </label>

        <select
          id="aweberList"
          value={spreadsheetId}
          onChange={handleSpreadsheetIdChange}
        >
          {googleSpreadDataList.length > 0 &&
            googleSpreadDataList.map((item, index) => (
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
          {googleSpreadDataSheetList.length > 0 &&
            googleSpreadDataSheetList.map((item, index) => (
              <option key={index} value={item}>
                {item}
              </option>
            ))}
        </select>
      </div>
      <div className="input-group">
        <label htmlFor="aweberList">
          <b>Destination:</b> Aweber List:
        </label>
        <select
          id="aweberList"
          value={aweberListId}
          onChange={handleAweberListChange}
        >
          {aweberDataList.length > 0 &&
            aweberDataList.map((item, index) => (
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
      {/* <ToastContainer autoClose={3000} /> */}
    </div>
  );
}

export default AweberAutomationCard;
