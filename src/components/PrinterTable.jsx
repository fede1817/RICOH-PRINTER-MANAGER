import TonerBar from "./TonerBar";
import { FaRegEdit } from "react-icons/fa";
import { RiDeleteBin6Line } from "react-icons/ri";
import { FaCartShopping } from "react-icons/fa6";
import { BsInfoCircleFill } from "react-icons/bs";
import { FaPrint, FaSync, FaPowerOff } from "react-icons/fa";
import { useState } from "react";
import Swal from "sweetalert2";

export default function PrinterTable({
  impresoras,
  tipo,
  onEdit,
  onDelete,
  onInfo,
  onCopy,
  onUpdatePrinter,
  onUpdateAllPrinters,
}) {
  const [loadingStates, setLoadingStates] = useState({});
  const [loadingAll, setLoadingAll] = useState(false);
  const [rebootingStates, setRebootingStates] = useState({});
  const [showRebootDialog, setShowRebootDialog] = useState(false);
  const [selectedPrinter, setSelectedPrinter] = useState(null);

  // 🔧 NUEVA FUNCIÓN: Reiniciar impresora
  const handleReboot = async (printerId, ip, modelo, tipoReinicio = "warm") => {
    setRebootingStates(prev => ({ ...prev, [printerId]: true }));

    try {
      // Verificar estado actual
      const estadoRes = await fetch(
        `http://192.168.8.166:3001/api/impresoras/${printerId}/status`
      );
      const estadoData = await estadoRes.json();

      if (estadoData.estado === "desconectada") {
        Swal.fire({
          icon: 'warning',
          title: 'Impresora desconectada',
          text: 'No se puede reiniciar una impresora desconectada',
          background: '#2c2c2c',
          color: '#fff',
          confirmButtonColor: '#3085d6',
        });
        setRebootingStates(prev => ({ ...prev, [printerId]: false }));
        return;
      }

      // Confirmación simple
      const confirmResult = await Swal.fire({
        title: `¿Reiniciar impresora?`,
        html: `
          <div style="text-align: center; margin: 15px 0;">
            <p><strong>${modelo}</strong></p>
            <p>IP: ${ip}</p>
            <p>Tipo: ${tipoReinicio === "warm" ? "Reinicio suave" : "Reinicio completo"}</p>
            <p style="color: #ff8c00; margin-top: 10px;">
              ⚠️ La impresora estará indisponible por ~2-3 minutos
            </p>
          </div>
        `,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#ff8c00',
        cancelButtonColor: '#666',
        confirmButtonText: 'Sí, reiniciar',
        cancelButtonText: 'Cancelar',
        background: '#2c2c2c',
        color: '#fff',
      });

      if (!confirmResult.isConfirmed) {
        setRebootingStates(prev => ({ ...prev, [printerId]: false }));
        return;
      }

      // Mostrar loading
      const { value: accept } = await Swal.fire({
        title: 'Reiniciando...',
        html: `
          <div style="text-align: center;">
            <div style="
              width: 50px;
              height: 50px;
              border: 4px solid rgba(255, 255, 255, 0.1);
              border-top: 4px solid #ff8c00;
              border-radius: 50%;
              animation: spin 1s linear infinite;
              margin: 0 auto 15px;
            "></div>
            <p>Por favor espera...</p>
            <p style="font-size: 0.9rem; color: #aaa;">IP: ${ip}</p>
          </div>
          <style>
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          </style>
        `,
        allowOutsideClick: false,
        showConfirmButton: false,
        background: '#2c2c2c',
        color: '#fff',
        timer: 3000,
      });

      // Ejecutar reinicio
      const res = await fetch(
        `http://192.168.8.166:3001/api/impresoras/${printerId}/reboot`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            tipo: tipoReinicio,
            community_write: 'private'
          })
        }
      );

      const data = await res.json();

      if (res.ok) {
        Swal.fire({
          icon: 'success',
          title: '✅ Reinicio iniciado',
          html: `
            <div style="text-align: center; margin: 15px 0;">
              <p>El reinicio se ha iniciado correctamente</p>
              <p style="font-size: 0.9rem; color: #aaa;">
                Verifica el estado en unos minutos
              </p>
            </div>
          `,
          timer: 3000,
          showConfirmButton: false,
          background: '#2c2c2c',
          color: '#fff',
        });

        // Actualizar estado después de 10 segundos
        setTimeout(() => {
          checkSinglePrinterStatus(printerId);
        }, 10000);

      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error en reinicio',
          text: data.error || 'No se pudo reiniciar la impresora',
          background: '#2c2c2c',
          color: '#fff',
          confirmButtonColor: '#d33',
        });
      }

    } catch (error) {
      console.error('Error en reinicio:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error de conexión',
        text: error.message,
        background: '#2c2c2c',
        color: '#fff',
        confirmButtonColor: '#d33',
      });
    } finally {
      setRebootingStates(prev => ({ ...prev, [printerId]: false }));
    }
  };

  // 🔧 NUEVA FUNCIÓN: Mostrar opciones de reinicio
  const showRebootOptions = (printer) => {
    setSelectedPrinter(printer);
    setShowRebootDialog(true);
  };

  // 🔧 FUNCIÓN: Ejecutar reinicio desde diálogo
  const executeReboot = async (tipoReinicio) => {
    if (!selectedPrinter) return;
    
    setShowRebootDialog(false);
    await handleReboot(
      selectedPrinter.id,
      selectedPrinter.ip,
      selectedPrinter.modelo,
      tipoReinicio
    );
    setSelectedPrinter(null);
  };

  // 🔹 Función para verificar estado de una impresora específica (existente - SIN CAMBIOS)
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

      if (onUpdatePrinter) {
        onUpdatePrinter(printerId, {
          estado: data.estado,
          ultima_verificacion: data.ultima_verificacion,
        });
      }

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

  // 🔹 Función para verificar estado de TODAS las impresoras (existente - SIN CAMBIOS)
  const checkAllPrintersStatus = async () => {
    setLoadingAll(true);

    try {
      const res = await fetch(
        "http://192.168.8.166:3001/api/impresoras/status"
      );

      if (!res.ok) {
        throw new Error("Error en la respuesta del servidor");
      }

      const data = await res.json();

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
      setLoadingAll(false);
    }
  };

  // 🔹 Función para obtener el ícono y color del estado (existente - SIN CAMBIOS)
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

  // 🔹 Función para subir archivo e imprimir (existente - SIN CAMBIOS)
  const handlePrint = async (impresoraId, file, impresoraEstado) => {
    if (!file) return;

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
      {/* 🔧 DIÁLOGO DE REINICIO CON ESTILOS ESPECÍFICOS */}
      {showRebootDialog && selectedPrinter && (
        <div style={styles.rebootDialogOverlay}>
          <div style={styles.rebootDialog}>
            <h3 style={styles.dialogTitle}>
              <FaPowerOff style={{ marginRight: '10px' }} />
              Reiniciar Impresora
            </h3>
            
            <div style={styles.printerInfo}>
              <p><strong>Modelo:</strong> {selectedPrinter.modelo}</p>
              <p><strong>IP:</strong> {selectedPrinter.ip}</p>
              <p><strong>Sucursal:</strong> {selectedPrinter.sucursal}</p>
            </div>

            <div style={styles.warningBox}>
              <p style={styles.warningText}>
                ⚠️ La impresora estará indisponible durante 2-3 minutos
              </p>
            </div>

            <div style={styles.rebootOptions}>
              <button 
                style={styles.rebootOptionWarm}
                onClick={() => executeReboot("warm")}
                disabled={rebootingStates[selectedPrinter.id]}
              >
                <div style={styles.optionIcon}>🔄</div>
                <div style={styles.optionContent}>
                  <div style={styles.optionTitle}>Reinicio Suave</div>
                  <div style={styles.optionDesc}>Recomendado para problemas menores</div>
                </div>
                {rebootingStates[selectedPrinter.id] && (
                  <div style={styles.spinnerSmall}></div>
                )}
              </button>
              
              <button 
                style={styles.rebootOptionCold}
                onClick={() => executeReboot("cold")}
                disabled={rebootingStates[selectedPrinter.id]}
              >
                <div style={styles.optionIcon}>❄️</div>
                <div style={styles.optionContent}>
                  <div style={styles.optionTitle}>Reinicio Completo</div>
                  <div style={styles.optionDesc}>Como apagar y encender físicamente</div>
                </div>
                {rebootingStates[selectedPrinter.id] && (
                  <div style={styles.spinnerSmall}></div>
                )}
              </button>
            </div>
            
            <div style={styles.dialogActions}>
              <button 
                style={styles.cancelBtn}
                onClick={() => {
                  setShowRebootDialog(false);
                  setSelectedPrinter(null);
                }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      <table className="dark-table">
        <thead>
          <tr>
            <th>
              <div className="ip-header">
                <span>IP</span>
                <div className="tooltip-container">
                  <button
                    className="refresh-all-btn"
                    onClick={checkAllPrintersStatus}
                    disabled={loadingAll}
                  >
                    {loadingAll ? (
                      <div className="spinner-small"></div>
                    ) : (
                      <FaSync size={14} />
                    )}
                  </button>
                  <span className="tooltip">Actualizar todos los estados</span>
                </div>
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
              const isRebooting = rebootingStates[impresora.id];

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
                      <div className="tooltip-container">
                        <button
                          className="refresh-single-btn"
                          onClick={() => checkSinglePrinterStatus(impresora.id)}
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <div className="spinner-small"></div>
                          ) : (
                            <FaSync size={12} />
                          )}
                        </button>
                        <span className="tooltip">Verificar estado</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="tooltip-container">
                      <button
                        className="info-button"
                        onClick={() => onInfo(impresora)}
                      >
                        <BsInfoCircleFill />
                      </button>
                      <span className="tooltip">Ver información</span>
                    </div>
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
                    <div className="action-buttons">
                      {/* 🔧 BOTÓN DE REINICIO CON ESTILOS INLINE */}
                      <div className="tooltip-container">
                        <button
                          style={styles.rebootBtn}
                          onClick={() => showRebootOptions(impresora)}
                          disabled={impresora.estado === "desconectada" || isRebooting}
                        >
                          {isRebooting ? (
                            <div style={styles.spinnerSmall}></div>
                          ) : (
                            <FaPowerOff />
                          )}
                        </button>
                        <span className="tooltip">
                          {isRebooting ? "Reiniciando..." : "Reiniciar impresora"}
                        </span>
                      </div>
                      
                      {/* 🖨️ BOTONES EXISTENTES (mantienen sus estilos CSS) */}
                      <div className="tooltip-container">
                        <button
                          className="print-btn"
                          onClick={() =>
                            document.getElementById(`file-${impresora.id}`).click()
                          }
                          disabled={impresora.estado === "desconectada"}
                        >
                          <FaPrint />
                        </button>
                        <span className="tooltip">Imprimir archivo</span>
                      </div>
                      <div className="tooltip-container">
                        <button
                          className="edit-btn"
                          onClick={() => onEdit(impresora)}
                        >
                          <FaRegEdit />
                        </button>
                        <span className="tooltip">Editar Impresora</span>
                      </div>
                      <div className="tooltip-container">
                        <button
                          className="delete-btn"
                          onClick={() => onDelete(impresora.id)}
                        >
                          <RiDeleteBin6Line />
                        </button>
                        <span className="tooltip">Eliminar Impresora</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="tooltip-container">
                      <button
                        className="pedido-btn"
                        onClick={() => onCopy(impresora)}
                      >
                        <FaCartShopping />
                      </button>
                      <span className="tooltip">Generar pedido de tóner</span>
                    </div>
                  </td>
                </tr>
              );
            })}
        </tbody>
      </table>

      {/* 🔧 ESTILOS INLINE SOLO PARA EL REINICIO */}
      <style jsx>{`
        /* ESTILOS EXISTENTES (NO TOCAR) */
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

        .tooltip-container {
          position: relative;
          display: inline-block;
        }

        .tooltip {
          position: absolute;
          bottom: -35px;
          left: 50%;
          transform: translateX(-50%);
          background-color: rgba(0, 0, 0, 0.8);
          color: white;
          padding: 6px 12px;
          border-radius: 4px;
          font-size: 0.75rem;
          white-space: nowrap;
          opacity: 0;
          visibility: hidden;
          transition: opacity 0.3s, visibility 0.3s;
          z-index: 100;
          pointer-events: none;
        }

        .tooltip::after {
          content: '';
          position: absolute;
          top: -5px;
          left: 50%;
          transform: translateX(-50%);
          border-width: 0 5px 5px 5px;
          border-style: solid;
          border-color: transparent transparent rgba(0, 0, 0, 0.8) transparent;
        }

        .tooltip-container:hover .tooltip {
          opacity: 1;
          visibility: visible;
        }

        .action-buttons {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .info-button, .print-btn, .edit-btn, .delete-btn, .pedido-btn {
          background: rgba(255, 255, 255, 0.1);
          border: none;
          cursor: pointer;
          padding: 8px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background-color 0.3s;
        }

        .info-button:hover:not(:disabled),
        .print-btn:hover:not(:disabled),
        .edit-btn:hover:not(:disabled),
        .pedido-btn:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.2);
        }

        .delete-btn:hover:not(:disabled) {
          background: rgba(244, 67, 54, 0.3);
        }

        .info-button:disabled,
        .print-btn:disabled,
        .edit-btn:disabled,
        .delete-btn:disabled,
        .pedido-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
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

// 🔧 ESTILOS INLINE PARA EL BOTÓN Y MODAL DE REINICIO
const styles = {
  // Botón de reinicio en la tabla
  rebootBtn: {
    background: 'rgba(255, 140, 0, 0.15)',
    color: '#ff8c00',
    border: 'none',
    cursor: 'pointer',
    padding: '8px',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.3s',
  },

  // Modal overlay
  rebootDialogOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background: 'rgba(0, 0, 0, 0.8)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },

  // Modal container
  rebootDialog: {
    background: '#2c2c2c',
    padding: '25px',
    borderRadius: '10px',
    width: '400px',
    maxWidth: '90%',
    border: '1px solid #444',
    boxShadow: '0 5px 20px rgba(0, 0, 0, 0.5)',
  },

  // Título del modal
  dialogTitle: {
    margin: '0 0 20px 0',
    color: '#fff',
    fontSize: '1.2rem',
    textAlign: 'center',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Información de la impresora
  printerInfo: {
    margin: '15px 0',
    padding: '15px',
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '8px',
  },

  printerInfoText: {
    margin: '5px 0',
    color: '#ccc',
    fontSize: '0.9rem',
  },

  // Caja de advertencia
  warningBox: {
    margin: '15px 0',
    padding: '10px',
    background: 'rgba(255, 140, 0, 0.1)',
    border: '1px solid rgba(255, 140, 0, 0.3)',
    borderRadius: '6px',
    textAlign: 'center',
  },

  warningText: {
    color: '#ff8c00',
    fontSize: '0.9rem',
    margin: 0,
  },

  // Opciones de reinicio
  rebootOptions: {
    margin: '20px 0',
  },

  // Opción de reinicio suave
  rebootOptionWarm: {
    width: '100%',
    padding: '15px',
    margin: '10px 0',
    border: 'none',
    borderRadius: '8px',
    background: 'rgba(255, 140, 0, 0.1)',
    color: '#ff8c00',
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    cursor: 'pointer',
    transition: 'all 0.3s',
    textAlign: 'left',
  },

  // Opción de reinicio completo
  rebootOptionCold: {
    width: '100%',
    padding: '15px',
    margin: '10px 0',
    border: 'none',
    borderRadius: '8px',
    background: 'rgba(0, 150, 255, 0.1)',
    color: '#0096ff',
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    cursor: 'pointer',
    transition: 'all 0.3s',
    textAlign: 'left',
  },

  // Icono de opción
  optionIcon: {
    fontSize: '24px',
  },

  // Contenido de opción
  optionContent: {
    flex: 1,
  },

  // Título de opción
  optionTitle: {
    display: 'block',
    fontSize: '1rem',
    fontWeight: 'bold',
    marginBottom: '3px',
  },

  // Descripción de opción
  optionDesc: {
    color: '#aaa',
    fontSize: '0.8rem',
  },

  // Spinner pequeño
  spinnerSmall: {
    width: '16px',
    height: '16px',
    border: '2px solid rgba(255, 255, 255, 0.3)',
    borderTop: '2px solid #fff',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },

  // Botones de acción del modal
  dialogActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginTop: '20px',
  },

  // Botón cancelar
  cancelBtn: {
    background: '#666',
    color: 'white',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '5px',
    cursor: 'pointer',
    transition: 'background 0.3s',
  },
};