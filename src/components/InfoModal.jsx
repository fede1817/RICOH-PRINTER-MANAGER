import React, { useState, useEffect } from "react";
import { X } from "lucide-react"; // Asegurate de tener instalado lucide-react

export default function InfoModal({ visible, data, onClose }) {
  const [colorToners, setColorToners] = useState(null);
  const [loadingColors, setLoadingColors] = useState(false);

  useEffect(() => {
    if (visible && data && data.ip === "192.168.8.20") {
      setLoadingColors(true);
      // Hardcoded base URL (matches App.js)
      fetch(`http://192.168.8.166:3001/api/impresoras/${data.id}/color-toners`)
        .then((res) => res.json())
        .then((tonerData) => {
          if (!tonerData.error) {
            setColorToners(tonerData);
          } else {
            setColorToners(null);
          }
        })
        .catch((err) => {
          console.error("Error fetching color toners:", err);
          setColorToners(null);
        })
        .finally(() => setLoadingColors(false));
    } else {
      setColorToners(null);
    }
  }, [visible, data]);

  if (!visible || !data) return null;
  console.log("contador" + data.contador);
  return (
    <div className="info-modal-overlay">
      <div className="info-modal-content">
        <div className="info-modal-header">
          <h3>Información del Tóner</h3>
          <button className="info-close-icon" onClick={onClose} title="Cerrar">
            <X size={20} />
          </button>
        </div>
        <div className="info-modal-body">
          <p>
            <strong>Sucursal:</strong> {data.sucursal}
          </p>
          <p>
            <strong>Modelo:</strong> {data.modelo}
          </p>
          <p>
            <strong>Tipo:</strong> {data.tipo}
          </p>
          <p>
            <strong>Contador:</strong> {data?.contador_paginas ?? "N/A"}
          </p>
          <p>
            <strong>Número de Serie:</strong> {data?.numero_serie || "N/A"}
          </p>
          <p>
            <strong>Tóner de reserva:</strong> {data.toner_reserva || 0}
          </p>
          <p>
            <strong>Último cambio de tóner:</strong>{" "}
            {data.fecha_ultimo_cambio
              ? new Date(data.fecha_ultimo_cambio).toLocaleString()
              : "N/A"}
          </p>
          <p>
            <strong>Último Pedido:</strong>{" "}
            {data.ultimo_pedido_fecha
              ? new Date(data.ultimo_pedido_fecha).toLocaleString()
              : "N/A"}
          </p>

          {data.ip === "192.168.8.20" && (
            <div style={{ marginTop: "15px", paddingTop: "15px", borderTop: "1px solid #dee2e6" }}>
              <h4>Niveles de Color</h4>
              {loadingColors ? (
                <p>Cargando niveles de color...</p>
              ) : colorToners ? (
                <>
                  <p>
                    <strong style={{ color: "#00bfff" }}>Cyan:</strong>{" "}
                    {colorToners.cyan !== null ? `${colorToners.cyan}%` : "N/A"}
                  </p>
                  <p>
                    <strong style={{ color: "#ff00ff" }}>Magenta:</strong>{" "}
                    {colorToners.magenta !== null ? `${colorToners.magenta}%` : "N/A"}
                  </p>
                  <p>
                    <strong style={{ color: "#ffcc00" }}>Yellow:</strong>{" "}
                    {colorToners.yellow !== null ? `${colorToners.yellow}%` : "N/A"}
                  </p>
                </>
              ) : (
                <p>No se pudo obtener la información de color.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
