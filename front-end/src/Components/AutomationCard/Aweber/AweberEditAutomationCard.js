import React, { useEffect, useRef, useState } from "react";
import "./AutomationCard.css"; // Import CSS for styling
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import { TbSettingsAutomation } from "react-icons/tb";
import { TfiClose } from "react-icons/tfi";

function AweberEditAutomationCard({ setShowAutomationCard,item }) {
  const [spreadsheetId, setSpreadsheetId] = useState(item.SheetId);
  const [sheetName, setSheetName] = useState(item.SheetName);
  const [aweberListId, setAweberListId] = useState(item.AweberListId);
  const [aweberDataList, setAweberDataList] = useState([]);
  const [googleSpreadDataList, setGoogleSpreadDataList] = useState([]);
  const [googleSpreadDataSheetList, setGoogleSpreadDataSheetList] = useState(
    []
  );
  const [workflowName, setWorkflowName] = useState(item.Name);
  const [operation, setOperation] = useState(item.Operation);

  const user = JSON.parse(localStorage.getItem("userInfo"));

  console.log(spreadsheetId)

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
      dataInDB: item.DataInDB,
      item: item,
      operation: operation
    };
      
   
  console.log(body)
     
    const response = await axios
      .post("http://connectsyncdata.com:5000/aweber/api/edit/automation", body, {
        headers: headers,
      })
       .then((response) => window. location. reload());

    return toast.error("error oc");
  };


  const handleOperation = (event) => {
    setOperation(event.target.value);
  };

  const gettingAweberList = async () => {
   await axios
      .post(
        "http://connectsyncdata.com:5000/aweber/api/gettinglists",
        {
          email: user.email,
        },
        {
          headers: headers,
        }
      )
      .then((response) => {
        setAweberDataList([...response.data.list_data]);
        
      })
      .catch((error) =>{ console.log(error); toast.error("Unable to aweber fetch sheet data") });
  };

  const gettingSpreadsheetList = async () => {
    const response = await axios
      .get(
        `http://connectsyncdata.com:5000/goauth/api/get/spreadsheets?email=${user.email}`,
        {
          headers: headers,
        }
      )
      .then((response) => {
        setGoogleSpreadDataList([...response.data.SpreadSheetData]);
      })
      .catch((error) => {console.log("spread")});
  };

  const gettingSpreadsheetSheetList = async () => {
    const body = {
      SheetId: spreadsheetId,
    };

    const response = await axios
      .post(
        `http://connectsyncdata.com:5000/goauth/api/get/sheetsnames?email=${user.email}`,
        body,
        {
          headers: headers,
        }
      )
      .then((response) => {
        setGoogleSpreadDataSheetList([...response.data.Sheets]);
       
      })
      .catch((error) => console.log(error));
  };

  const handleNameChange = (e) => {
    setWorkflowName(e.target.value);
  };

   useEffect(() => {
     gettingAweberList();
     gettingSpreadsheetList();
   }, []);



  useEffect(() => {
    if(spreadsheetId)
    {
      gettingSpreadsheetSheetList();
    }
    
  }, [spreadsheetId]);



  return (
    <div className="automation-card" tabIndex={0} >
      <ToastContainer autoClose={3000} />
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
        <div className="close-card" onClick={()=>setShowAutomationCard(false)}>
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
        </select>
      </div>


      <div className="input-group">
        <label htmlFor="spreadsheetId"><b>Source :</b>Spreadsheet</label>

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
        <label htmlFor="aweberList"><b>Destination: </b>Aweber List</label>
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

      
    </div>
  );
}

export default AweberEditAutomationCard;
