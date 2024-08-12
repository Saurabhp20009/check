import React, { useEffect, useState } from "react";
import "./AutomationCard.css"; // Import CSS for styling
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import { TfiClose } from "react-icons/tfi";
import { TbSettingsAutomation } from "react-icons/tb";

function BigmarkerAutomationCard({
  setShowAutomationCard,
  ShowAutomationCard,
}) {
  const [spreadsheetId, setSpreadsheetId] = useState("");
  const [sheetName, setSheetName] = useState("");
  const [googleSpreadDataList, setGoogleSpreadDataList] = useState([]);
  const [googleSpreadDataSheetList, setGoogleSpreadDataSheetList] = useState(
    []
  );
  const [WebinarId, setWebinarId] = useState("");
  const [workflowName, setWorkflowName] = useState("");
  const [operation, setOperation] = useState(1);
  const [aweberListId, setAweberListId] = useState("");
  const [aweberDataList, setAweberDataList] = useState([]);
  const [listId, setListId] = useState("");
  const [campaignListId, setCampaignListId] = useState("");
  const [CampaignLists, setCampaignaLists] = useState([]);

  const user = JSON.parse(localStorage.getItem("userInfo"));

  const headers = {
    Authorization: `Bearer ${user.token} `,
    "Content-Type": "application/json",
  };

  const handleAweberListChange = (event) => {
    setAweberListId(event.target.value);
  };

  const gettingAweberList = async () => {
    await axios
      .post(
        "http://backend.connectsyncdata.com:5000/aweber/api/gettinglists",
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
      .catch((error) => {
        console.log(error.response.data.message);
        // toast.error(
        //   "Unable to aweber fetch sheet data :" + error.response.data.message
        // );
      });
  };

  const handleCampaignListChange = (event) => {
    setCampaignListId(event.target.value);
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
        setCampaignListId(response.data[0].id);
      })
      .catch((error) => console.log(error));
  };

  const handleSpreadsheetIdChange = (event) => {
    setSpreadsheetId(event.target.value);
  };

  const handleSheetNameChange = (event) => {
    setSheetName(event.target.value);
  };

  const handleWebinarId = (event) => {
    setWebinarId(event.target.value);
  };

  const handleListId = (event) => {
    setListId(event.target.value);
  };

  const handleOperation = (event) => {
    setOperation(event.target.value);
  };

  const renderContentInOperation = [
    null,
    //sheet-to-bigmarker
    <div>
      <div className="input-group">
        <label htmlFor="spreadsheetId">
          <b>Source:</b> Spreadsheet
        </label>
        {console.log(operation)}
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
        <label htmlFor="sheetName"> Select the Sheet</label>
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
        <label htmlFor="aweberList">
          <b>Destination</b>: Webinar ID
        </label>
        <input
          value={WebinarId}
          className="NameInput"
          onChange={handleWebinarId}
          placeholder="Enter webinar id"
        />
      </div>
    </div>,

    //gtwtosheet
    <div>
      <div className="input-group">
        <label htmlFor="aweberList">
          <b>Source:</b> Webinar ID
        </label>
        <input
          value={WebinarId}
          className="NameInput"
          onChange={handleWebinarId}
          placeholder="Enter webinar id"
        />
      </div>

      <div className="input-group">
        <label htmlFor="spreadsheetId">
          <b>Destination:</b> Spreadsheet
        </label>
        {console.log(operation)}
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
        <label htmlFor="sheetName"> Select the Sheet</label>
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
    </div>,

    //gtwtoaweber
    <div>
      <div className="input-group">
        <label htmlFor="aweberList">
          <b>Source </b>: Webinar ID
        </label>
        <input
          value={WebinarId}
          className="NameInput"
          onChange={handleWebinarId}
          placeholder="Enter webinar id"
        />
      </div>

      <div className="input-group">
        <label htmlFor="aweberList">
          <b>Destination :</b> Aweber List
        </label>
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
    </div>,

    //gtwtobrevo

    <div>
      <div className="input-group">
        <label htmlFor="aweberList">
          <b>Source :</b> Webinar ID
        </label>
        <input
          value={WebinarId}
          className="NameInput"
          onChange={handleWebinarId}
          placeholder="Enter webinar id"
        />
      </div>

      <div className="input-group">
        <label htmlFor="aweberList">
          <b>Destination:</b> List ID
        </label>
        <input
          value={listId}
          className="NameInput"
          placeholder="Enter the list id"
          onChange={handleListId}
          type="number"
        />
      </div>
    </div>,
    //gtwtogetresponse
    <div>
      <div className="input-group">
        <label htmlFor="aweberList">
          <b>Source :</b> Webinar ID
        </label>
        <input
          value={WebinarId}
          className="NameInput"
          onChange={handleWebinarId}
          placeholder="Enter webinar id"
        />
      </div>

      <div className="input-group">
        <label htmlFor="aweberList">
          <b>Destination:</b> Campaign List
        </label>
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
    </div>,

    <div>
      <div className="input-group">
        <label htmlFor="spreadsheetId">
          <b>Source:</b> Spreadsheet
        </label>
        {console.log(operation)}
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
        <label htmlFor="sheetName"> Select the Sheet</label>
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
        <label htmlFor="aweberList">
          <b>Destination</b>: Webinar ID
        </label>
        <input
          value={WebinarId}
          className="NameInput"
          onChange={handleWebinarId}
          placeholder="Enter webinar id"
        />
      </div>
    </div>,
  ];

  const handleStartAutomation = async () => {
    if (!workflowName || !WebinarId) {
      return toast.error("Please fill the input fields correctly");
    }

    const temp = WebinarId;
    const WebinarIdWithoutHyphens = temp.replace(/-/g, "");

    const body = {
      Name: workflowName,
      SpreadSheetId: spreadsheetId,
      SheetName: sheetName,
      ConferenceId: WebinarIdWithoutHyphens,
    };

    console.log(body, typeof operation);

    if (operation === "2") {
      const body = {
        Name: workflowName,
        SpreadSheetId: spreadsheetId,
        SheetName: sheetName,
        ConferenceId: WebinarIdWithoutHyphens,
      };

      await axios
        .post(
          `http://backend.connectsyncdata.com:5000/bigmarker/api/start/bigmarkertosheet/automation?email=${user.email}`,
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

      return;
    } else if (operation == 1) {
      const body = {
        Name: workflowName,
        SpreadSheetId: spreadsheetId,
        SheetName: sheetName,
        ConferenceId: WebinarIdWithoutHyphens,
      };

      await axios
        .post(
          `http://backend.connectsyncdata.com:5000/bigmarker/api/start/automation?email=${user.email}`,
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
          return toast.error(error?.response?.data?.message);
        });
    } else if (operation == 3) {
      let body = {
        Name: workflowName,
        WebinarId: WebinarId,
        AweberListId: aweberListId,
      };

      await axios
        .post(
          `http://backend.connectsyncdata.com:5000/bigmarker/api/start/bigmarkertoapp/automation?email=${user.email}`,
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
          return toast.error(error?.response?.data?.message);
        });
    } else if (operation == 4) {
      let body = {
        Name: workflowName,
        WebinarId: WebinarId,
        BrevoListId: listId,
      };

      await axios
        .post(
          `http://backend.connectsyncdata.com:5000/bigmarker/api/start/bigmarkertoapp/automation?email=${user.email}`,
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
          return toast.error(error?.response?.data?.message);
        });
    } else if (operation == 5) {
      let body = {
        Name: workflowName,
        WebinarId: WebinarId,
        CampaignId: campaignListId,
      };

      await axios
        .post(
          `http://backend.connectsyncdata.com:5000/bigmarker/api/start/bigmarkertoapp/automation?email=${user.email}`,
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
          return toast.error(error?.response?.data?.message);
        });
    } else if (operation == 6) {
      const body = {
        Name: workflowName,
        SpreadSheetId: spreadsheetId,
        SheetName: sheetName,
        ConferenceId: WebinarIdWithoutHyphens,
      };

      await axios
        .post(
          `http://backend.connectsyncdata.com:5000/bigmarker/api/start/del/automation?email=${user.email}`,
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
          return toast.error(error?.response?.data?.message);
        });
    }
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
        `http://backend.connectsyncdata.com:5000/goauth/api/get/sheetsnames?email=${user.email}`,
        body,
        {
          headers: headers,
        }
      )
      .then((response) => {
        setGoogleSpreadDataSheetList([...response.data.Sheets]);
        setSheetName(response.data.Sheets[0]);
      })
      .catch((error) => console.log(error.response));
  };

  const handleNameChange = (e) => {
    setWorkflowName(e.target.value);
  };


  useEffect(() => {
    setTimeout(() => {
      gettingAweberList();
      gettingSpreadsheetList();
      gettingCampaignLists();
    }, 1000);

    //gettingSpreadsheetSheetList();
  }, []);

  useEffect(() => {
    if (spreadsheetId) {
      gettingSpreadsheetSheetList();
    }
  }, [spreadsheetId]);
  return (
    <div className="automation-card">
      <div className="input-group card-head">
        <div className="name-div ">
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
          <option value={1}>Google Sheet --- BigMarker</option>

          <option value={2}>BigMarker --- Google Sheet</option>
          <option value={3}>BigMarker --- Aweber</option>
          <option value={4}>BigMarker --- Brevo</option>
          <option value={5}>BigMarker --- Get Response</option>
          <option value={6}>
            Google Sheet --- BigMarker(Delete registrants)
          </option>
        </select>
      </div>

      <div>{renderContentInOperation[operation]}</div>

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

export default BigmarkerAutomationCard;
