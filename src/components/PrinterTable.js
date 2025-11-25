import TonerBar from "./TonerBar";
import { FaRegEdit } from "react-icons/fa";
import { RiDeleteBin6Line } from "react-icons/ri";
import { FaCartShopping } from "react-icons/fa6";
import { BsInfoCircleFill } from "react-icons/bs";
import { FaPrint, FaSync } from "react-icons/fa";
import { useState } from "react";
import Swal from "sweetalert2";

export default function PrinterTable({
  impresoras,
  tipo,
  onEdit,
  onDelete,
  onInfo,
  onCopy,
  onUpdatePrinter, // 🔧 NUEVA PROP
  onUpdateAllPrinters, // 🔧 NUEVA PROP
}) {
  const [loadingStates, setLoadingStates] = useState({});
  const [loadingAll, setLoadingAll] = useState(false); // 🔧 NUEVO ESTADO PARA CARGA GENERAL

  // 🔹 Función para verificar estado de una impresora específica
  const checkSinglePrinterStatus = async (printerId) => {
    setLoadingStates((prev) => ({ ...prev, [printerId]: true }));

    try {
      const res = await fetch(
        `http://192.168.8.166:3001/api/impresoras/${printerId}/status`
      );

      if (!res.ok) {
        throw new Error("Error en la respuesta del servidor");
      }

      const data = await res.json();

      // 🔧 ACTUALIZAR EL ESTADO EN EL COMPONENTE PADRE
      if (onUpdatePrinter) {
        onUpdatePrinter(printerId, {
          estado: data.estado,
          ultima_verificacion: data.ultima_verificacion,
        });
      }

      // Mostrar mensaje de éxito
      Swal.fire({
        icon: "success",
        title: "Estado actualizado",
        text: `Impresora ${
          data.estado === "conectada" ? "conectada" : "desconectada"
        }`,
        timer: 2000,
        showConfirmButton: false,
        background: "#2c2c2c",
        color: "#fff",
      });
    } catch (error) {
      console.error("Error checking printer status:", error);
      Swal.fire({
        icon: "error",
        title: "Error de conexión",
        text: "No se pudo verificar el estado de la impresora",
        background: "#2c2c2c",
        color: "#fff",
        confirmButtonColor: "#d33",
      });
    } finally {
      setLoadingStates((prev) => ({ ...prev, [printerId]: false }));
    }
  };

  // 🔹 Función para verificar estado de TODAS las impresoras
  const checkAllPrintersStatus = async () => {
    setLoadingAll(true); // 🔧 ACTIVAR SPINNER GENERAL

    try {
      const res = await fetch(
        "http://192.168.8.166:3001/api/impresoras/status"
      );

      if (!res.ok) {
        throw new Error("Error en la respuesta del servidor");
      }

      const data = await res.json();

      // 🔧 ACTUALIZAR TODAS LAS IMPRESORAS EN EL COMPONENTE PADRE
      if (onUpdateAllPrinters) {
        onUpdateAllPrinters(data);
      }

      Swal.fire({
        icon: "success",
        title: "Estados actualizados",
        text: `Se verificaron ${data.length} impresoras`,
        timer: 2000,
        showConfirmButton: false,
        background: "#2c2c2c",
        color: "#fff",
      });
    } catch (error) {
      console.error("Error checking all printers status:", error);
      Swal.fire({
        icon: "error",
        title: "Error de conexión",
        text: "No se pudieron verificar los estados",
        background: "#2c2c2c",
        color: "#fff",
        confirmButtonColor: "#d33",
      });
    } finally {
      setLoadingAll(false); // 🔧 DESACTIVAR SPINNER GENERAL
    }
  };

  // 🔹 Función para obtener el ícono y color del estado
  const getStatusInfo = (estado) => {
    const status = estado || "verificando";

    switch (status) {
      case "conectada":
        return {
          icon: "🟢",
          text: "Conectada",
          class: "status-connected",
        };
      case "desconectada":
        return {
          icon: "🔴",
          text: "Desconectada",
          class: "status-disconnected",
        };
      default:
        return {
          icon: "🟡",
          text: "Verificando",
          class: "status-checking",
        };
    }
  };

  // 🔹 Función para subir archivo e imprimir
  const handlePrint = async (impresoraId, file, impresoraEstado) => {
    if (!file) return;

    // Verificar estado antes de imprimir
    if (impresoraEstado === "desconectada") {
      Swal.fire({
        icon: "warning",
        title: "Impresora desconectada",
        text: "No se puede imprimir en una impresora desconectada",
        background: "#2c2c2c",
        color: "#fff",
        confirmButtonColor: "#3085d6",
      });
      return;
    }

    // Crear y mostrar el spinner
    const spinner = document.createElement("div");
    spinner.innerHTML = `
    <div style="
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 9999;
    ">
      <div style="
        padding: 30px;
        border-radius: 10px;
        text-align: center;
        color: white;
      ">
        <div style="
          width: 50px;
          height: 50px;
          border: 5px solid #f3f3f3;
          border-top: 5px solid #3085d6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 15px;
        "></div>
        <p>Enviando a imprimir...</p>
      </div>
    </div>
    <style>
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    </style>
  `;

    document.body.appendChild(spinner);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(
        `http://192.168.8.166:3001/api/impresoras/${impresoraId}/print`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await res.json();

      document.body.removeChild(spinner);

      if (res.ok) {
        Swal.fire({
          icon: "success",
          title: "Impresión enviada",
          text: "✅ Archivo enviado a imprimir correctamente",
          timer: 2500,
          showConfirmButton: false,
          background: "#2c2c2c",
          color: "#fff",
          confirmButtonColor: "#3085d6",
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Error en impresión",
          text: data.error || "Ocurrió un problema",
          background: "#2c2c2c",
          color: "#fff",
          confirmButtonColor: "#d33",
        });
      }
    } catch (error) {
      document.body.removeChild(spinner);
      Swal.fire({
        icon: "error",
        title: "Error de conexión",
        text: error.message,
        background: "#2c2c2c",
        color: "#fff",
        confirmButtonColor: "#d33",
      });
    }
  };

  return (
    <>
      <table className="dark-table">
        <thead>
          <tr>
            <th>
              <div className="ip-header">
                <span>IP</span>
                {/* 🔧 BOTÓN PARA ACTUALIZAR TODOS LOS ESTADOS - AHORA EN EL HEADER DE IP */}
                <button
                  className="refresh-all-btn"
                  onClick={checkAllPrintersStatus}
                  disabled={loadingAll}
                  title="Actualizar todos los estados"
                >
                  {loadingAll ? (
                    <div className="spinner-small"></div>
                  ) : (
                    <FaSync size={14} />
                  )}
                </button>
              </div>
            </th>
            <th>Sucursal</th>
            <th>Modelo</th>
            <th>Nivel de Tóner Negro</th>
            <th>Estado</th>
            <th>Info</th>
            <th>Acciones</th>
            <th>Pedido</th>
          </tr>
        </thead>
        <tbody>
          {impresoras
            .filter((i) => i.tipo === tipo)
            .map((impresora, index) => {
              const statusInfo = getStatusInfo(impresora.estado);
              const isLoading = loadingStates[impresora.id];

              return (
                <tr key={`${tipo}-${index}`}>
                  <td>
                    <div className="ip-cell">
                      <a
                        href={`http://${impresora.ip}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={
                          impresora.estado === "desconectada"
                            ? "link-disabled"
                            : ""
                        }
                      >
                        {impresora.ip}
                      </a>
                    </div>
                  </td>
                  <td>{impresora.sucursal}</td>
                  <td>
                    <a
                      href={impresora.drivers_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {impresora.modelo}
                    </a>
                  </td>
                  <td>
                    {impresora.estado === "desconectada" ? (
                      <span className="toner-unavailable">No disponible</span>
                    ) : impresora.toner_anterior <= 0 ? (
                      "No disponible"
                    ) : (
                      <TonerBar value={impresora.toner_anterior} />
                    )}
                  </td>
                  <td>
                    <div className="status-cell">
                      <div className={`status-indicator ${statusInfo.class}`}>
                        <span className="status-icon">{statusInfo.icon}</span>
                        <span className="status-text">{statusInfo.text}</span>
                      </div>
                      <button
                        className="refresh-single-btn"
                        onClick={() => checkSinglePrinterStatus(impresora.id)}
                        disabled={isLoading}
                        title="Verificar estado"
                      >
                        {isLoading ? (
                          <div className="spinner-small"></div>
                        ) : (
                          <FaSync size={12} />
                        )}
                      </button>
                    </div>
                  </td>
                  <td>
                    <button
                      className="info-button"
                      onClick={() => onInfo(impresora)}
                      title="Ver información"
                    >
                      <BsInfoCircleFill />
                    </button>
                  </td>
                  <td>
                    <input
                      type="file"
                      id={`file-${impresora.id}`}
                      style={{ display: "none" }}
                      onChange={(e) =>
                        handlePrint(
                          impresora.id,
                          e.target.files[0],
                          impresora.estado
                        )
                      }
                      disabled={impresora.estado === "desconectada"}
                    />
                    <button
                      className="print-btn"
                      title="Imprimir archivo"
                      onClick={() =>
                        document.getElementById(`file-${impresora.id}`).click()
                      }
                      disabled={impresora.estado === "desconectada"}
                    >
                      <FaPrint />
                    </button>
                    <button
                      className="edit-btn"
                      title="Editar Impresora"
                      onClick={() => onEdit(impresora)}
                    >
                      <FaRegEdit />
                    </button>
                    <button
                      className="delete-btn"
                      title="Eliminar Impresora"
                      onClick={() => onDelete(impresora.id)}
                    >
                      <RiDeleteBin6Line />
                    </button>
                  </td>
                  <td>
                    <button
                      className="pedido-btn"
                      onClick={() => onCopy(impresora)}
                      title="Generar pedido de tóner"
                    >
                      <FaCartShopping />
                    </button>
                  </td>
                </tr>
              );
            })}
        </tbody>
      </table>

      <style jsx>{`
        .ip-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }

        .refresh-all-btn {
          background: #4caf50;
          color: white;
          border: none;
          padding: 6px 12px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
          display: flex;
          align-items: center;
          gap: 6px;
          white-space: nowrap;
        }

        .refresh-all-btn:hover:not(:disabled) {
          background: #45a049;
        }

        .refresh-all-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .ip-cell {
          display: flex;
          align-items: center;
        }

        .status-cell {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .status-indicator {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 10px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
          min-width: 110px;
        }

        .status-connected {
          background: rgba(76, 175, 80, 0.15);
          color: #4caf50;
          border: 1px solid rgba(76, 175, 80, 0.3);
        }

        .status-disconnected {
          background: rgba(244, 67, 54, 0.15);
          color: #f44336;
          border: 1px solid rgba(244, 67, 54, 0.3);
        }

        .status-checking {
          background: rgba(255, 193, 7, 0.15);
          color: #ffc107;
          border: 1px solid rgba(255, 193, 7, 0.3);
        }

        .status-icon {
          font-size: 14px;
        }

        .status-text {
          font-size: 11px;
        }

        .spinner-small {
          width: 14px;
          height: 14px;
          border: 2px solid #f3f3f3;
          border-top: 2px solid #ffffff;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .refresh-single-btn {
          background: rgba(255, 255, 255, 0.1);
          border: none;
          cursor: pointer;
          padding: 6px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
        }

        .refresh-single-btn:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.2);
        }

        .refresh-single-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .link-disabled {
          opacity: 0.5;
          pointer-events: none;
          text-decoration: line-through;
        }

        .toner-unavailable {
          color: #888;
          font-style: italic;
        }

        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </>
  );
}
