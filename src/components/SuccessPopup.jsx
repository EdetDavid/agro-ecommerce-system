import React from "react";
import "./SuccessPopup.css"; // Ensure you create a CSS file for styling

const SuccessPopup = ({ message }) => {
  return (
    <div className="success-popup">
      <p>{message}</p>
    </div>
  );
};

export default SuccessPopup;
