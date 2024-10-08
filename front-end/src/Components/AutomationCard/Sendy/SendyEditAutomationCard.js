import React, { useEffect, useState } from "react";
import "./AutomationCard.css"; // Import CSS for styling
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import { TfiClose } from "react-icons/tfi";
import { TbSettingsAutomation } from "react-icons/tb";

function SendyEditAutomationCard({
  setShowAutomationCard,
  item,
}) {
  const [spreadsheetId, setSpreadsheetId] = useState(item.SpreadSheetId);
  const [sheetName, setSheetName] = useState(item.SheetName);
  const [googleSpreadDataList, setGoogleSpreadDataList] = useState([]);
  const [googleSpreadDataSheetList, setGoogleSpreadDataSheetList] = useState(
    []
  );
  const [listId, setListId] = useState(item.ListId);
  const [workflowName, setWorkflowName] = useState(item.Name);
  const [operation, setOperation] = useState(1);


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

  const handleOperation = (event) => {
    setOperation(event.target.value);
  };


  const handleListId = (event) => {
    setListId(event.target.value);
  };

  const handleStartAutomation = async () => {
    if (!workflowName || !listId) {
      return toast.error("Please fill the input fields correctly");
    }

    const body = {
      Name: workflowName,
      SpreadSheetId: spreadsheetId,
      SheetName: sheetName,
      ListId: listId,
      DataInDB: item.DataInDB,
      Item: item,
      Operation: operation
    };

    console.log(body);
    await axios
      .post(
        `http://24.199.76.74:5000/sendy/api/edit/automation?email=${user.email}`,
        body,
        {
          headers: headers,
        }
      )
      .then((response) => {
        console.log(response);
        window.location.reload();
      })
      .catch((error) => {
        console.log(error.response);
        return toast.error(error.response.data.message);
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
      })
      .catch((error) => {
        console.log(error);
      });
  };

  const gettingSpreadsheetSheetList = async () => {
    const body = {
      SheetId: spreadsheetId,
    };

    await axios
      .post(
        `http://24.199.76.74:5000/goauth/api/get/sheetsnames?email=${user.email}`,
        body,
        {
          headers: headers,
        }
      )
      .then((response) => {
        setGoogleSpreadDataSheetList([...response.data.Sheets]);
      })
      .catch((error) => {
        console.log(error.response);
      });
  };

  const handleNameChange = (e) => {
    setWorkflowName(e.target.value);
  };

  useEffect(() => {
    gettingSpreadsheetList();
  }, []);

  useEffect(() => {
    if (spreadsheetId) {
      gettingSpreadsheetSheetList();
    }
  }, [spreadsheetId]);

  return (
    <div className="automation-card">
      <ToastContainer autoClose={3000} />

      <div className="input-group card-head">
        <div className="name-div ">
          {" "}
          <label htmlFor="name">Name </label>
          <input
            value={workflowName}
            className="NameInput"
            onChange={handleNameChange}
            placeholder="Enter workflow name"
          />
        </div>
        <div
          className="close-card"
          onClick={() => setShowAutomationCard(false)}
        >
          <TfiClose />
        </div>
      </div>
   
      <div className="input-group">
        <label htmlFor="spreadsheetId"> Select Operation</label>

        <select id="aweberList" value={operation} onChange={handleOperation}>
          <option value={1}>Google Sheet --- Sendy</option>
          <option value={2}>Google Sheet --- Sendy(Delete subscribers)</option>
        </select>
      </div>

      <div className="input-group">
        <label htmlFor="spreadsheetId"><b>Source :</b> Spreadsheet</label>

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
        <label htmlFor="aweberList"><b>Destination:</b> List ID</label>
        <input
          value={listId}
          className="NameInput"
          placeholder="Enter the list id"
          onChange={handleListId}
        />
      </div>
      <div className="buttons">
        <button className="start-button" onClick={handleStartAutomation}>
          <TbSettingsAutomation className="start-icon" />
          Start
        </button>
      </div>
    </div>
  );
}

export default SendyEditAutomationCard;
