import axios from "axios";
import React, { useEffect, useState } from "react";
import { IoCheckmarkDoneCircle } from "react-icons/io5";
import "./ExistingWorkFlows.css";
import { IoIosRemoveCircle } from "react-icons/io";
import { ToastContainer, toast } from "react-toastify";
import { PopBox } from "../PopUpBox/PopBox.js";
import Modal from "react-modal";

const ExistingWorkFlows = ({ item }) => {
  console.log(item);

  const user = JSON.parse(localStorage.getItem("userInfo"));

  const headers = {
    Authorization: `Bearer ${user.token} `,
    "Content-Type": "application/json",
  };

  const [isOpen, setIsOpen] = React.useState(false);

  const handleConfirm = async () => {
    await axios
      .delete(`http://localhost:8000/user/api/delete/workflow?id=${item._id}`, {
        headers: headers,
      })
      .then((response) => window.location.reload())
      .catch((error) => toast.error(error));

    setIsOpen(false);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  return (
    <div className="Container">
      <div className="flex-content">
        <div className="content">
          <label>Name</label>
          <p>{item.Name}</p>
        </div>
        <div className="content">
          <label>Sheet Name</label>
          <p>{item.SheetName}</p>
        </div>
        <div className="content">
          <label>{item.WebinarId ? "WebinarId" : "Aweber List Id"}</label>
          <p>{item.WebinarId ? item.WebinarId : item.AweberListId}</p>
        </div>
        <div className="content">
          <label>Status</label>
          <p style={{ display: "flex", alignItems: "center" }}>
            <div className="spinner-overlay">
              {item.Status === "Running" ? (
                <div className="spinner-container">
                  <div className="spinner"></div>
                </div>
              ) : (
                <IoCheckmarkDoneCircle className="finishedIcon" />
              )}
            </div>
            {item.Status}
          </p>
        </div>
        <div>
          <button
            type="button"
            className={
              item.Status === "Running" ? "odd-remove-button" : "remove-button"
            }
            onClick={() => {
             {
                setIsOpen(true);
              }
            }}
          >
            <IoIosRemoveCircle className="removeIcon" />
            Remove
          </button>
        </div>
      </div>
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

      <ToastContainer />
    </div>
  );
};

export default ExistingWorkFlows;
