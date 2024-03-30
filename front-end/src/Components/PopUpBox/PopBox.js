import React from 'react'
import Modal from 'react-modal';
import "./PopBox.css"


const PopBox = () => {
  
    const [isOpen, setIsOpen] = React.useState(false);

    const handleConfirm = () => {
      // Handle confirm action here
      setIsOpen(false);
    };
  
    const handleClose = () => {
      setIsOpen(false);
    };

  return (
    <div>
    <button onClick={() => setIsOpen(true)}>Open Modal</button>
    <Modal isOpen={isOpen} onRequestClose={handleClose} className="modal" overlayClassName="overlay">
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

  )
}

export default PopBox