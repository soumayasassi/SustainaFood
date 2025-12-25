import React from "react";
import  { useState, useEffect } from 'react';

const ConfirmationModal = ({ message, onConfirm, onCancel }) => {
  return (
    <div className="confirmation-modal-overlay">
      <div className="confirmation-modal">
        <div className="confirmation-modal-content">
          <p>{message}</p>
          <div className="confirmation-modal-buttons">
            <button className="confirmation-modal-button confirm" onClick={onConfirm}>
              Yes
            </button>
            <button className="confirmation-modal-button cancel" onClick={onCancel}>
              No
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;