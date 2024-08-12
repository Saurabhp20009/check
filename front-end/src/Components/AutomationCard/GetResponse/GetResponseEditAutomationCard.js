import React, { useEffect, useRef, useState } from "react";
import "./AutomationCard.css"; // Import CSS for styling
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import { TbSettingsAutomation } from "react-icons/tb";
import { TfiClose } from "react-icons/tfi";

function GetResponseEditAutomationCard({ setShowAutomationCard, item }) {
  const [spreadsheetId, setSpreadsheetId] = useState(item.SpreadSheetId);
  const [sheetName, setSheetName] = useState(item.SheetName);
  const [campaignListId, setCampaignListId] = useState(item.CampaignId);
  const [CampaignLists, setCampaignaLists] = useState([]);
  const [googleSpreadDataList, setGoogleSpreadDataList] = useState([]);
  const [googleSpreadDataSheetList, setGoogleSpreadDataSheetList] = useState(
    []
  );
  const [workflowName, setWorkflowName] = useState(item.Name);
  const [operation, setOperation] = useState(item.Operation);

  const user = JSON.parse(localStorage.getItem("userInfo"));

  const headers = {
    Authorization: `Bearer ${user.token} `,
    "Content-Type": "application/json",
  };

  const handleSpreadsheetIdChange = (event) => {
    setSpreadsheetId(event.target.value);
  };

  const handleOperation = (event) => {
    setOperation(event.target.value);
  };

  const handleSheetNameChange = (event) => {
    setSheetName(event.target.value);
  };

  const handleCampaignListChange = (event) => {
    setCampaignListId(event.target.value);
  };

  const handleStartAutomation = async () => {
    // Your logic to start automation goes here
    // For demo purposes, update lastTriggered with current time

    if (!workflowName) {
      return toast.error("Please fill the workflow name");
    }
    const user = JSON.parse(localStorage.getItem("userInfo"));
    const body = {
      Name: workflowName,
      SpreadSheetId: spreadsheetId,
      SheetName: sheetName,
      CampaignId: campaignListId,
      DataInDB: item.DataInDB,
      Item: item,
      Operation:operation
    };


    const response = await axios
      .post(
        `http://backend.connectsyncdata.com:5000/getresponse/api/edit/automation?email=${user.email}`,
        body,
        {
          headers: headers,
        }
      )
      .then((response) => window.location.reload());

    return toast.error(response.data.message);
  };

  const gettingCampaignLists = async () => {
    await axios
      .get(
        `http://backend.connectsyncdata.com:5000/getresponse/api/get/campaign?email=${user.email}`,
        {
          headers: headers,
        }
      )
      .then((response) => {
        console.log(response.data);
        setCampaignaLists([...response.data.data]);

        //console.log("e", CampaignListsId);
      })
      .catch((error) => console.log(error));
  };

  const gettingSpreadsheetList = async () => {
    const response = await axios
      .get(
        `http://backend.connectsyncdata.com:5000/goauth/api/get/spreadsheets?email=${user.email}`,
        {
          headers: headers,
        }
      )
      .then((response) => {
        setGoogleSpreadDataList([...response.data.SpreadSheetData]);
      })
      .catch((error) => console.log(error));
  };

  const gettingSpreadsheetSheetList = async () => {
    const body = {
      SheetId: spreadsheetId,
    };

    const response = await axios
      .post(
        `http://backend.connectsyncdata.com:5000/goauth/api/get/sheetsnames?email=${user.email}`,
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
    gettingCampaignLists();
    gettingSpreadsheetList();
    gettingSpreadsheetSheetList();
  }, []);

  useEffect(() => {
    gettingSpreadsheetSheetList();
  }, [spreadsheetId]);

  console.log(CampaignLists);

  return (
    <div className="automation-card" tabIndex={0}>
      <div className="input-group card-head">
        <div className="name-div">
          {" "}
          <label htmlFor="name">Name</label>
          <input
            value={workflowName}
            className="NameInput"
            onChange={handleNameChange}
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
          <option value={1}>Google Sheet --- Get Response</option>
          <option value={2}>Google Sheet --- Get Response(Delete Contacts)</option>
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
        <label htmlFor="aweberList"><b>Destination:</b> Campaign List</label>
        <select
          id="aweberList"
          value={campaignListId}
          onChange={handleCampaignListChange}
        >
          {CampaignLists.map((item, index) => (
            <option key={index} value={item.campaignId}>
              {console.log(item.name)}
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

export default GetResponseEditAutomationCard;
