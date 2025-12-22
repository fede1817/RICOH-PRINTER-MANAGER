import React, { useState, useCallback, useMemo, memo } from "react";
import TonerBar from "./TonerBar";
import { FaRegEdit } from "react-icons/fa";
import { RiDeleteBin6Line } from "react-icons/ri";
import { FaCartShopping } from "react-icons/fa6";
import { BsInfoCircleFill } from "react-icons/bs";
import { FaPrint, FaSync, FaPowerOff } from "react-icons/fa";
import Swal from "sweetalert2";

// 🔥 CONSTANTES FUERA DEL COMPONENTE
const API_BASE_URL = "http://192.168.8.166:3001";
const INITIAL_STATUS_INFO = {
  verificando: { icon: "🟡", text: "Verificando", class: "status-checking" },
  conectada: { icon: "🟢", text: "Conectada", class: "status-connected" },
  desconectada: { icon: "🔴", text: "Desconectada", class: "status-disconnected" }
};

// 🔥 COMPONENTES MEMOIZADOS
const StatusIndicator = memo(({ estado }) => {
  const statusInfo = INITIAL_STATUS_INFO[estado] || INITIAL_STATUS_INFO.verificando;
  
  return (
    <div className={`status-indicator ${statusInfo.class}`}>
      <span className="status-icon">{statusInfo.icon}</span>
      <span className="status-text">{statusInfo.text}</span>
    </div>
  );
});

StatusIndicator.displayName = 'StatusIndicator';

const RefreshButton = memo(({ onClick, loading, title, size = "small" }) => {
  return (
    <div className="tooltip-container">
      <button
        className={`refresh-btn ${size}`}
        onClick={onClick}
        disabled={loading}
        aria-label={title}
      >
        {loading ? (
          <div className="spinner-small"></div>
        ) : (
          <FaSync size={size === "small" ? 12 : 14} />
        )}
      </button>
      <span className="tooltip">{title}</span>
    </div>
  );
});

RefreshButton.displayName = 'RefreshButton';

const ActionButton = memo(({ 
  icon: Icon, 
  onClick, 
  className, 
  tooltip, 
  disabled = false,
  loading = false 
}) => {
  return (
    <div className="tooltip-container">
      <button
        className={`action-btn ${className}`}
        onClick={onClick}
        disabled={disabled || loading}
        aria-label={tooltip}
      >
        {loading ? <div className="spinner-small"></div> : <Icon />}
      </button>
      <span className="tooltip">{tooltip}</span>
    </div>
  );
});

ActionButton.displayName = 'ActionButton';

// 🔥 REBOOT DIALOG COMPONENT
const RebootDialog = memo(({ 
  visible, 
  printer, 
  onReboot, 
  onClose,
  loading 
}) => {
  if (!visible || !printer) return null;

  const handleReboot = (tipoReinicio) => {
    onReboot(printer.id, printer.ip, printer.modelo, tipoReinicio);
  };

  return (
    <div className="reboot-dialog-overlay">
      <div className="reboot-dialog">
        <h3 className="dialog-title">
          <FaPowerOff className="dialog-icon" />
          Reiniciar Impresora
        </h3>
        
        <div className="printer-info">
          <p><strong>Modelo:</strong> {printer.modelo}</p>
          <p><strong>IP:</strong> {printer.ip}</p>
          <p><strong>Sucursal:</strong> {printer.sucursal}</p>
        </div>

        <div className="warning-box">
          <p className="warning-text">
            ⚠️ La impresora estará indisponible durante 2-3 minutos
          </p>
        </div>

        <div className="reboot-options">
          <button 
            className="reboot-option warm"
            onClick={() => handleReboot("warm")}
            disabled={loading}
          >
            <div className="option-icon">🔄</div>
            <div className="option-content">
              <div className="option-title">Reinicio Suave</div>
              <div className="option-desc">Recomendado para problemas menores</div>
            </div>
            {loading && <div className="spinner-small"></div>}
          </button>
          
          <button 
            className="reboot-option cold"
            onClick={() => handleReboot("cold")}
            disabled={loading}
          >
            <div className="option-icon">❄️</div>
            <div className="option-content">
              <div className="option-title">Reinicio Completo</div>
              <div className="option-desc">Como apagar y encender físicamente</div>
            </div>
            {loading && <div className="spinner-small"></div>}
          </button>
        </div>
        
        <div className="dialog-actions">
          <button 
            className="cancel-btn"
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
});

RebootDialog.displayName = 'RebootDialog';

// 🔥 FUNCIONES PURAS FUERA DEL COMPONENTE
const generateRebootConfirmationHTML = (modelo, ip, tipoReinicio) => `
  <div style="text-align: center; margin: 15px 0;">
    <p><strong>${modelo}</strong></p>
    <p>IP: ${ip}</p>
    <p>Tipo: ${tipoReinicio === "warm" ? "Reinicio suave" : "Reinicio completo"}</p>
    <p style="color: #ff8c00; margin-top: 10px;">
      ⚠️ La impresora estará indisponible por ~2-3 minutos
    </p>
  </div>
`;

const showLoadingSwal = (ip) => {
  return Swal.fire({
    title: 'Reiniciando...',
    html: `
      <div style="text-align: center;">
        <div class="custom-spinner"></div>
        <p>Por favor espera...</p>
        <p style="font-size: 0.9rem; color: #aaa;">IP: ${ip}</p>
      </div>
    `,
    allowOutsideClick: false,
    showConfirmButton: false,
    background: '#2c2c2c',
    color: '#fff',
    timer: 3000,
  });
};

// 🔥 COMPONENTE PRINCIPAL
function PrinterTable({
  impresoras,
  tipo,
  onEdit,
  onDelete,
  onInfo,
  onCopy,
  onUpdatePrinter,
  onUpdateAllPrinters,
}) {
  // 🔥 ESTADOS OPTIMIZADOS
  const [loadingStates, setLoadingStates] = useState({});
  const [loadingAll, setLoadingAll] = useState(false);
  const [rebootingStates, setRebootingStates] = useState({});
  const [rebootDialog, setRebootDialog] = useState({
    visible: false,
    printer: null
  });

  // 🔥 MEMOIZAR IMPRESORAS FILTRADAS
  const filteredPrinters = useMemo(() => 
    impresoras.filter((i) => i.tipo === tipo),
    [impresoras, tipo]
  );

  // 🔥 HANDLERS OPTIMIZADOS CON useCallback
  const handleReboot = useCallback(async (printerId, ip, modelo, tipoReinicio = "warm") => {
    setRebootingStates(prev => ({ ...prev, [printerId]: true }));

    try {
      // 🔥 VERIFICAR ESTADO ANTES DE REINICIAR
      const estadoRes = await fetch(`${API_BASE_URL}/api/impresoras/${printerId}/status`);
      if (!estadoRes.ok) throw new Error("Error al verificar estado");
      
      const estadoData = await estadoRes.json();
      if (estadoData.estado === "desconectada") {
        await Swal.fire({
          icon: 'warning',
          title: 'Impresora desconectada',
          text: 'No se puede reiniciar una impresora desconectada',
          background: '#2c2c2c',
          color: '#fff',
          confirmButtonColor: '#3085d6',
        });
        return;
      }

      // 🔥 CONFIRMACIÓN
      const confirmResult = await Swal.fire({
        title: `¿Reiniciar impresora?`,
        html: generateRebootConfirmationHTML(modelo, ip, tipoReinicio),
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#ff8c00',
        cancelButtonColor: '#666',
        confirmButtonText: 'Sí, reiniciar',
        cancelButtonText: 'Cancelar',
        background: '#2c2c2c',
        color: '#fff',
      });

      if (!confirmResult.isConfirmed) return;

      // 🔥 LOADING
      await showLoadingSwal(ip);

      // 🔥 EJECUTAR REINICIO
      const res = await fetch(`${API_BASE_URL}/api/impresoras/${printerId}/reboot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: tipoReinicio,
          community_write: 'private'
        })
      });

      const data = await res.json();

      if (res.ok) {
        await Swal.fire({
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

        // 🔥 ACTUALIZAR ESTADO DESPUÉS DE 10s
        setTimeout(() => {
          checkSinglePrinterStatus(printerId);
        }, 10000);
      } else {
        throw new Error(data.error || 'No se pudo reiniciar la impresora');
      }

    } catch (error) {
      console.error('Error en reinicio:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'Error al reiniciar la impresora',
        background: '#2c2c2c',
        color: '#fff',
        confirmButtonColor: '#d33',
      });
    } finally {
      setRebootingStates(prev => ({ ...prev, [printerId]: false }));
      setRebootDialog({ visible: false, printer: null });
    }
  }, []);

  const checkSinglePrinterStatus = useCallback(async (printerId) => {
    setLoadingStates(prev => ({ ...prev, [printerId]: true }));

    try {
      const res = await fetch(`${API_BASE_URL}/api/impresoras/${printerId}/status`);
      if (!res.ok) throw new Error("Error en la respuesta del servidor");

      const data = await res.json();
      if (onUpdatePrinter) {
        onUpdatePrinter(printerId, {
          estado: data.estado,
          ultima_verificacion: data.ultima_verificacion,
        });
      }

      await Swal.fire({
        icon: "success",
        title: "Estado actualizado",
        text: `Impresora ${data.estado === "conectada" ? "conectada" : "desconectada"}`,
        timer: 2000,
        showConfirmButton: false,
        background: "#2c2c2c",
        color: "#fff",
      });
    } catch (error) {
      console.error("Error checking printer status:", error);
      await Swal.fire({
        icon: "error",
        title: "Error de conexión",
        text: "No se pudo verificar el estado de la impresora",
        background: "#2c2c2c",
        color: "#fff",
        confirmButtonColor: "#d33",
      });
    } finally {
      setLoadingStates(prev => ({ ...prev, [printerId]: false }));
    }
  }, [onUpdatePrinter]);

  const checkAllPrintersStatus = useCallback(async () => {
    setLoadingAll(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/impresoras/status`);
      if (!res.ok) throw new Error("Error en la respuesta del servidor");

      const data = await res.json();
      if (onUpdateAllPrinters) {
        onUpdateAllPrinters(data);
      }

      await Swal.fire({
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
      await Swal.fire({
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
  }, [onUpdateAllPrinters]);

  const handlePrint = useCallback(async (impresoraId, file, impresoraEstado) => {
    if (!file) return;

    if (impresoraEstado === "desconectada") {
      await Swal.fire({
        icon: "warning",
        title: "Impresora desconectada",
        text: "No se puede imprimir en una impresora desconectada",
        background: "#2c2c2c",
        color: "#fff",
        confirmButtonColor: "#3085d6",
      });
      return;
    }

    // 🔥 SPINNER MÁS EFICIENTE
    const spinner = document.createElement("div");
    spinner.className = "global-spinner";
    document.body.appendChild(spinner);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(
        `${API_BASE_URL}/api/impresoras/${impresoraId}/print`,
        { method: "POST", body: formData }
      );

      const data = await res.json();

      if (res.ok) {
        await Swal.fire({
          icon: "success",
          title: "Impresión enviada",
          text: "✅ Archivo enviado a imprimir correctamente",
          timer: 2500,
          showConfirmButton: false,
          background: "#2c2c2c",
          color: "#fff",
        });
      } else {
        throw new Error(data.error || "Ocurrió un problema");
      }
    } catch (error) {
      console.error("Error al imprimir:", error);
      await Swal.fire({
        icon: "error",
        title: "Error en impresión",
        text: error.message,
        background: "#2c2c2c",
        color: "#fff",
        confirmButtonColor: "#d33",
      });
    } finally {
      if (document.body.contains(spinner)) {
        document.body.removeChild(spinner);
      }
    }
  }, []);

  const showRebootOptions = useCallback((printer) => {
    setRebootDialog({ visible: true, printer });
  }, []);

  const closeRebootDialog = useCallback(() => {
    setRebootDialog({ visible: false, printer: null });
  }, []);

  // 🔥 RENDERIZAR FILAS DE LA TABLA
  const renderTableRows = useMemo(() => 
    filteredPrinters.map((impresora) => {
      const isLoading = loadingStates[impresora.id];
      const isRebooting = rebootingStates[impresora.id];

      return (
        <tr key={`${tipo}-${impresora.id}`}>
          <td>
            <div className="ip-cell">
              <a
                href={`http://${impresora.ip}`}
                target="_blank"
                rel="noopener noreferrer"
                className={impresora.estado === "desconectada" ? "link-disabled" : ""}
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
              className="model-link"
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
              <StatusIndicator estado={impresora.estado} />
              <RefreshButton
                onClick={() => checkSinglePrinterStatus(impresora.id)}
                loading={isLoading}
                title="Verificar estado"
                size="small"
              />
            </div>
          </td>
          <td>
            <ActionButton
              icon={BsInfoCircleFill}
              onClick={() => onInfo(impresora)}
              className="info-btn"
              tooltip="Ver información"
            />
          </td>
          <td>
            <input
              type="file"
              id={`file-${impresora.id}`}
              className="file-input"
              onChange={(e) => handlePrint(impresora.id, e.target.files[0], impresora.estado)}
              disabled={impresora.estado === "desconectada"}
            />
            <div className="action-buttons">
              <ActionButton
                icon={FaPowerOff}
                onClick={() => showRebootOptions(impresora)}
                className="reboot-btn"
                tooltip={isRebooting ? "Reiniciando..." : "Reiniciar impresora"}
                disabled={impresora.estado === "desconectada"}
                loading={isRebooting}
              />
              <ActionButton
                icon={FaPrint}
                onClick={() => document.getElementById(`file-${impresora.id}`).click()}
                className="print-btn"
                tooltip="Imprimir archivo"
                disabled={impresora.estado === "desconectada"}
              />
              <ActionButton
                icon={FaRegEdit}
                onClick={() => onEdit(impresora)}
                className="edit-btn"
                tooltip="Editar Impresora"
              />
              <ActionButton
                icon={RiDeleteBin6Line}
                onClick={() => onDelete(impresora.id)}
                className="delete-btn"
                tooltip="Eliminar Impresora"
              />
            </div>
          </td>
          <td>
            <ActionButton
              icon={FaCartShopping}
              onClick={() => onCopy(impresora)}
              className="pedido-btn"
              tooltip="Generar pedido de tóner"
            />
          </td>
        </tr>
      );
    }),
    [filteredPrinters, loadingStates, rebootingStates, tipo, checkSinglePrinterStatus, handlePrint, showRebootOptions, onInfo, onEdit, onDelete, onCopy]
  );

  return (
    <>
      <RebootDialog
        visible={rebootDialog.visible}
        printer={rebootDialog.printer}
        onReboot={handleReboot}
        onClose={closeRebootDialog}
        loading={rebootDialog.printer ? rebootingStates[rebootDialog.printer.id] : false}
      />

      <table className="dark-table">
        <thead>
          <tr>
            <th>
              <div className="ip-header">
                <span>IP</span>
                <RefreshButton
                  onClick={checkAllPrintersStatus}
                  loading={loadingAll}
                  title="Actualizar todos los estados"
                  size="large"
                />
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
          {renderTableRows}
        </tbody>
      </table>

      <style jsx>{`
        .dark-table {
          width: 100%;
          border-collapse: collapse;
          background: #1e1e1e;
          color: #fff;
          font-size: 0.9rem;
        }

        .dark-table th,
        .dark-table td {
          padding: 12px 8px;
          text-align: left;
          border-bottom: 1px solid #333;
        }

        .dark-table th {
          background: #2c2c2c;
          font-weight: 600;
          color: #ddd;
        }

        .dark-table tr:hover {
          background: rgba(255, 255, 255, 0.05);
        }

        /* HEADER STYLES */
        .ip-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }

        .refresh-btn {
          background: rgba(255, 255, 255, 0.1);
          border: none;
          cursor: pointer;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          transition: background-color 0.3s;
        }

        .refresh-btn.small {
          padding: 6px;
        }

        .refresh-btn.large {
          padding: 6px 12px;
          background: #4caf50;
          font-size: 12px;
        }

        .refresh-btn.large:hover:not(:disabled) {
          background: #45a049;
        }

        .refresh-btn:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.2);
        }

        .refresh-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        /* STATUS STYLES */
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

        /* ACTION BUTTONS */
        .action-buttons {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .action-btn {
          background: rgba(255, 255, 255, 0.1);
          border: none;
          cursor: pointer;
          padding: 8px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background-color 0.3s;
          color: inherit;
        }

        .action-btn:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.2);
        }

        .action-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .reboot-btn {
          background: rgba(255, 140, 0, 0.15);
          color: #ff8c00;
        }

        .reboot-btn:hover:not(:disabled) {
          background: rgba(255, 140, 0, 0.3);
        }

        .print-btn {
          background: rgba(33, 150, 243, 0.15);
          color: #2196f3;
        }

        .print-btn:hover:not(:disabled) {
          background: rgba(33, 150, 243, 0.3);
        }

        .edit-btn {
          background: rgba(255, 193, 7, 0.15);
          color: #ffc107;
        }

        .edit-btn:hover:not(:disabled) {
          background: rgba(255, 193, 7, 0.3);
        }

        .delete-btn {
          background: rgba(244, 67, 54, 0.15);
          color: #f44336;
        }

        .delete-btn:hover:not(:disabled) {
          background: rgba(244, 67, 54, 0.3);
        }

        .info-btn {
          background: rgba(156, 39, 176, 0.15);
          color: #9c27b0;
        }

        .info-btn:hover:not(:disabled) {
          background: rgba(156, 39, 176, 0.3);
        }

        .pedido-btn {
          background: rgba(76, 175, 80, 0.15);
          color: #4caf50;
        }

        .pedido-btn:hover:not(:disabled) {
          background: rgba(76, 175, 80, 0.3);
        }

        /* TOOLTIP */
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

        /* MISC */
        .ip-cell {
          display: flex;
          align-items: center;
        }

        .model-link {
          color: #64b5f6;
          text-decoration: none;
        }

        .model-link:hover {
          text-decoration: underline;
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

        .file-input {
          display: none;
        }

        .spinner-small {
          width: 14px;
          height: 14px;
          border: 2px solid #f3f3f3;
          border-top: 2px solid #ffffff;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        /* REBOOT DIALOG STYLES */
        .reboot-dialog-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          justify-content: center;
          alignItems: center;
          z-index: 1000;
        }

        .reboot-dialog {
          background: #2c2c2c;
          padding: 25px;
          border-radius: 10px;
          width: 400px;
          max-width: 90%;
          border: 1px solid #444;
          box-shadow: 0 5px 20px rgba(0, 0, 0, 0.5);
        }

        .dialog-title {
          margin: 0 0 20px 0;
          color: #fff;
          font-size: 1.2rem;
          text-align: center;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .dialog-icon {
          margin-right: 10px;
        }

        .printer-info {
          margin: 15px 0;
          padding: 15px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 8px;
          color: #ccc;
          font-size: 0.9rem;
        }

        .warning-box {
          margin: 15px 0;
          padding: 10px;
          background: rgba(255, 140, 0, 0.1);
          border: 1px solid rgba(255, 140, 0, 0.3);
          border-radius: 6px;
          text-align: center;
        }

        .warning-text {
          color: #ff8c00;
          font-size: 0.9rem;
          margin: 0;
        }

        .reboot-options {
          margin: 20px 0;
        }

        .reboot-option {
          width: 100%;
          padding: 15px;
          margin: 10px 0;
          border: none;
          border-radius: 8px;
          display: flex;
          align-items: center;
          gap: 15px;
          cursor: pointer;
          transition: all 0.3s;
          text-align: left;
        }

        .reboot-option.warm {
          background: rgba(255, 140, 0, 0.1);
          color: #ff8c00;
        }

        .reboot-option.cold {
          background: rgba(0, 150, 255, 0.1);
          color: #0096ff;
        }

        .reboot-option:hover:not(:disabled) {
          filter: brightness(1.2);
        }

        .reboot-option:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .option-icon {
          font-size: 24px;
        }

        .option-content {
          flex: 1;
        }

        .option-title {
          display: block;
          font-size: 1rem;
          font-weight: bold;
          margin-bottom: 3px;
        }

        .option-desc {
          color: #aaa;
          font-size: 0.8rem;
        }

        .dialog-actions {
          display: flex;
          justify-content: flex-end;
          margin-top: 20px;
        }

        .cancel-btn {
          background: #666;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 5px;
          cursor: pointer;
          transition: background 0.3s;
        }

        .cancel-btn:hover:not(:disabled) {
          background: #777;
        }

        .cancel-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        /* GLOBAL SPINNER */
        .global-spinner {
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
        }

        .global-spinner::before {
          content: '';
          width: 50px;
          height: 50px;
          border: 5px solid #f3f3f3;
          border-top: 5px solid #3085d6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        /* SWAL CUSTOM SPINNER */
        .custom-spinner {
          width: 50px;
          height: 50px;
          border: 4px solid rgba(255, 255, 255, 0.1);
          border-top: 4px solid #ff8c00;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 15px;
        }

        /* ANIMATIONS */
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}

// 🔥 MEMOIZAR EL COMPONENTE COMPLETO
export default memo(PrinterTable);