// components/LoadingModal.jsx
import React from "react";
// o podés usar App.css si preferís

const LoadingModal = () => {
  return (
    <div className="loading-backdrop">
      <div className="loading-content">
        <div className="spinner"></div>
        <p className="loading-text">Cargando impresoras...</p>
      </div>
    </div>
  );
};

export default LoadingModal;
