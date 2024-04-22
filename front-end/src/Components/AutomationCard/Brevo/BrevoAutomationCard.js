import React, { useEffect, useState } from "react";
import "./AutomationCard.css"; // Import CSS for styling
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import { TfiClose } from "react-icons/tfi";
import { TbSettingsAutomation } from "react-icons/tb";



function BrevoAutomationCard({ setShowAutomationCard, ShowAutomationCard }) {
  const [spreadsheetId, setSpreadsheetId] = useState("");
  const [sheetName, setSheetName] = useState("");
  const [googleSpreadDataList, setGoogleSpreadDataList] = useState([]);
  const [googleSpreadDataSheetList, setGoogleSpreadDataSheetList] = useState(
    []
  );
  const [listId, setListId] = useState("");
  const [workflowName, setWorkflowName] = useState("");

  const user = JSON.parse(localStorage.getItem("userInfo"));
   
  const headers = {
    'Authorization': `Bearer ${user.token} `,
    'Content-Type': 'application/json'
  };


  const handleSpreadsheetIdChange = (event) => {
    setSpreadsheetId(event.target.value);
  };

  const handleSheetNameChange = (event) => {
    setSheetName(event.target.value);
  };

  const handleListId = (event) => {
    setListId(event.target.value);
  };

  const handleStartAutomation = async () => {
    if (!workflowName || !listId) {
      return toast.error("Please fill the input fields correctly");
    }
  
   
    const numberlistId=parseInt(listId)
  
    console.log(spreadsheetId)
 

    const body = {
      name: workflowName,
      spreadsheetId: spreadsheetId,
      sheetName: sheetName,
      listIds: numberlistId,
    };

    console.log(body);
    await axios
      .post(
        `http://localhost:5000/brevo/api/start/automation?email=${user.email}`,
        body,{
          headers: headers
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
        `http://localhost:5000/goauth/api/get/spreadsheets?email=${user.email}`,{
          headers: headers
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

     await axios
      .post(
        `http://localhost:5000/goauth/api/get/sheetsnames?email=${user.email}`,
        body,{
          headers: headers
        }
      )
      .then((response) =>
        {setGoogleSpreadDataSheetList([...response.data.Sheets])
        setSheetName(response.data.Sheets[0])}
      )
      .catch((error) => console.log(error.response));
  };

  const handleNameChange = (e) => {
    setWorkflowName(e.target.value);
  };

  useEffect(() => {
    gettingSpreadsheetList();
    gettingSpreadsheetSheetList();
  }, []);

  useEffect(() => {
    gettingSpreadsheetSheetList();
  }, [spreadsheetId]);

  return (
    <div className="automation-card">
      <div className="input-group card-head">
      <div className="name-div ">
          {" "}
          <label htmlFor="name">Name :  Brevo </label>
          <input
            value={workflowName}
            className="NameInput"
            onChange={handleNameChange}
            placeholder="Enter workflow name"
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
        <label htmlFor="aweberList">Enter List ID</label>
        <input
          value={listId}
          className="NameInput"
          placeholder="Enter the list id"
          onChange={handleListId}
          type="number"/>
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

export default BrevoAutomationCard;
