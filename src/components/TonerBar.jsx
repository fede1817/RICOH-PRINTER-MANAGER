import React from "react";

const getBarClass = (value, error) => {
  if (value === null || value < 0) return "toner-bar low";
  if (value <= 20) return "toner-bar low";
  if (value <= 40) return "toner-bar medium";
  return "toner-bar high";
};
export default function TonerBar({ value }) {
  if (value === null || value < 0) return "No disponible";

  return (
    <div className="t-toner-bar-container">
      <div className={getBarClass(value)} style={{ width: `${value}%` }}></div>
      <div className="toner-text">{value}%</div>
    </div>
  );
}
