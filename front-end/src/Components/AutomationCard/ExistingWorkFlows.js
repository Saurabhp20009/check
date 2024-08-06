import axios from "axios";
import React, { useEffect, useState } from "react";
import { IoCheckmarkDoneCircle } from "react-icons/io5";
import "./ExistingWorkFlows.css";
import { IoIosRemoveCircle } from "react-icons/io";
import { ToastContainer, toast } from "react-toastify";
import Modal from "react-modal";
import { MdOutlineEditNote } from "react-icons/md";
import AweberEditAutomationCard from "./Aweber/AweberEditAutomationCard";
import BigmarkerEditAutomationCard from "./Bigmarker/BigMarkerEditAutomationCard";
import BrevoEditAutomationCard from "./Brevo/BrevoEditAutomationCard";
import GetResponseEditAutomationCard from "./GetResponse/GetResponseEditAutomationCard";
import GTWEditAutomationCard from "./GoToWebinar/GTWEditAutomationCard";
import SendyEditAutomationCard from "./Sendy/SendyEditAutomationCard";

const ExistingWorkFlows = ({ item, workflowId }) => {
  console.log(item);

  const [id, setId] = useState("");
  const [index, setIndex] = useState();
  const [ShowAutomationCard, setShowAutomationCard] = useState(false);

  const user = JSON.parse(localStorage.getItem("userInfo"));

  const EditAutomationCards = [
    null,
    <AweberEditAutomationCard
      setShowAutomationCard={setShowAutomationCard}
      item={item}
    />,
    <BigmarkerEditAutomationCard
      setShowAutomationCard={setShowAutomationCard}
      item={item}
    />,
    <BrevoEditAutomationCard
      setShowAutomationCard={setShowAutomationCard}
      item={item}
    />,
    <GetResponseEditAutomationCard
      setShowAutomationCard={setShowAutomationCard}
      item={item}
    />,
    <GTWEditAutomationCard
      setShowAutomationCard={setShowAutomationCard}
      item={item}
    />,
    <SendyEditAutomationCard
      setShowAutomationCard={setShowAutomationCard}
      item={item}
    />,
  ];

  const handleExtractId = () => {
    const keysArray = Object.keys(item);
    console.log(keysArray);
    for (let key of keysArray) {
      if (key.includes("Id") && key !== "SpreadSheetId" && key !== "_id" && key !=="AppId") {
        console.log(key);
        setId(key);
      }
    }

    setIndex(item.AppId);
  };

  const handleEdit = async () => {
    if (item.Status === "Finished") {
      return;
    }
    console.log(EditAutomationCards);
    setShowAutomationCard(true);
    console.log(index);
  };

  const headers = {
    Authorization: `Bearer ${user.token} `,
    "Content-Type": "application/json",
  };

  const [isOpen, setIsOpen] = React.useState(false);

  const handleConfirm = async () => {
    const body = {
      RecordInDBId: item.DataInDB,
    };

    await axios
      .post(
        `http://connectsyndata.com:5000/user/api/delete/workflow?id=${item._id}`,
        body,
        {
          headers: headers,
        }
      )
      .then((response) => window.location.reload())
      .catch((error) => toast.error(error.response.data.message));

    setIsOpen(false);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  useEffect(() => handleExtractId(), []);

  return (
    <div className="Container">
      <div>
        <Modal
          isOpen={isOpen}
          onRequestClose={handleClose}
          className="modal"
          overlayClassName="overlay"
        >
          <div className="modal-content">
            <h2>Do you want to remove this workflow record?</h2>
            <p>There Error record will also be deleted.</p>
            <div className="modal-buttons">
              <button onClick={handleConfirm}>Yes</button>
              <button onClick={handleClose}>No</button>
            </div>
          </div>
        </Modal>
      </div>

      {ShowAutomationCard && <div>{EditAutomationCards[index]}</div>}

      <div className="flex-content-automation"   >
        <div className="sno-content"  onClick={handleEdit}>
          <label>S.no</label>
          <p>{workflowId + 1}</p>
        </div>

        <div className="content-automation"  onClick={handleEdit}>
          <label>Name</label>
          <p>{item?.Name}</p>
        </div>

        <div className="content-automation"  onClick={handleEdit}>
          <label>Operation</label>
          <p>{item?.AppName}</p>
        </div>

        <div className="content-automation"  onClick={handleEdit}>
          <label>{item.SheetName ? "Sheet Name" : "Webinar Id"}</label>
          <p>{item.SheetName ? item.SheetName : item.WebinarId}</p>
        </div>
        <div className="content-automation">
          <label>{id}</label>
          <p>{item[id]}</p>
        </div>
        <div className="content-automation"  onClick={handleEdit}>
          <label>Status</label>
          <p style={{ display: "flex", alignItems: "center" }}>
            <div className="status-spinner-overlay">
              {item?.Status === "Running" ? (
                <div className="status-spinner-container">
                  <div className="status-spinner"></div>
                </div>
              ) : (
                <IoCheckmarkDoneCircle className="finishedIcon" />
              )}
            </div>
            {item?.Status}
          </p>
        </div>
        <div className="button-div">
          <button
            className={
              item?.Status !== "Finished" ? "edit-but" : "edit-but-finished"
            }
            onClick={handleEdit}
          >
            <MdOutlineEditNote id="edit-icon" /> Edit
          </button>

          <button
            type="button"
            className={
              item?.Status === "Running" ? "odd-remove-button" : "remove-button"
            }
            onClick={() => {
              { 
                setIsOpen(true);
                

              }
            }}
          >
            <IoIosRemoveCircle className="removeIcon" />
            Delete
          </button>
        </div>
      </div>

      <ToastContainer />
    </div>
  );
};

export default ExistingWorkFlows;
