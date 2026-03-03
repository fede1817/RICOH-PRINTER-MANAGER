import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faServer,
  faBuilding,
  faSearch,
  faPlus,
  faSync,
  faTrash,
  faEye,
  faExclamationTriangle,
  faCheckCircle,
  faTimesCircle,
  faSignal,
  faClock,
  faCog,
  faSpinner,
  faDesktop,
  faNetworkWired,
  faShieldAlt,
  faFilter,
  faDatabase,
  faWifi,
  faSatelliteDish,
  faProjectDiagram,
  faSitemap,
  faEdit,
} from "@fortawesome/free-solid-svg-icons";
import Swal from "sweetalert2";
import ServerModal from "./ServerModal";
import PingApp from "./Ping"; // 🔧 IMPORTAR COMPONENTE PING
import "./ServerStatusTable.css";

const ServerStatusTable = ({urls}) => {
  const [servers, setServers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [selectedType, setSelectedType] = useState("todos");
  const [verifyingServers, setVerifyingServers] = useState(new Set());

  // Estados para modales
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingServer, setEditingServer] = useState(null);
  const [showPingModal, setShowPingModal] = useState(false); // 🔧 ESTADO PARA MODAL PING

  // 🔧 FUNCIÓN PARA ABRIR MODAL PING
  const openPingModal = () => {
    setShowPingModal(true);
  };

  // 🔧 FUNCIÓN PARA CERRAR MODAL PING
  const closePingModal = () => {
    setShowPingModal(false);
  };

  // Función para mostrar alertas de éxito
  const showSuccessAlert = (title, message) => {
    Swal.fire({
      title: title,
      text: message,
      icon: "success",
      confirmButtonColor: "#10b981",
      confirmButtonText: "Aceptar",
      background: "#1e293b",
      color: "#f1f5f9",
      iconColor: "#10b981",
    });
  };

  // Función para mostrar alertas de error
  const showErrorAlert = (title, message) => {
    Swal.fire({
      title: title,
      text: message,
      icon: "error",
      confirmButtonColor: "#ef4444",
      confirmButtonText: "Aceptar",
      background: "#1e293b",
      color: "#f1f5f9",
      iconColor: "#ef4444",
    });
  };

  // Función para mostrar confirmación
  const showConfirmDialog = (
    title,
    text,
    confirmButtonText = "Sí, eliminar"
  ) => {
    return Swal.fire({
      title: title,
      text: text,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: confirmButtonText,
      cancelButtonText: "Cancelar",
      background: "#1e293b",
      color: "#f1f5f9",
      iconColor: "#f59e0b",
    });
  };

  // Función para obtener el ícono según el tipo
  const getTypeIcon = (tipo) => {
    switch (tipo?.toLowerCase()) {
      case "servidor":
        return faServer;
      case "switch":
        return faProjectDiagram;
      case "router":
        return faWifi;
      case "firewall":
        return faShieldAlt;
      case "database":
        return faDatabase;
      default:
        return faDesktop;
    }
  };

  // Función para obtener el color según el tipo
  const getTypeColor = (tipo) => {
    switch (tipo?.toLowerCase()) {
      case "servidor":
        return "#3498db";
      case "switch":
        return "#9b59b6";
      case "router":
        return "#e67e22";
      case "firewall":
        return "#e74c3c";
      case "database":
        return "#2ecc71";
      default:
        return "#95a5a6";
    }
  };

  // Función para formatear fechas de manera segura
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";

    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return "Fecha inválida";
      }
      return date.toLocaleString("es-ES");
    } catch (error) {
      console.error("Error formateando fecha:", error, dateString);
      return "Error en fecha";
    }
  };

  // Cargar servidores desde el backend
  const loadServers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      // 👇 CAMBIO 1: Usar urls directamente (ya incluye /api)
      const response = await fetch(`${urls}/servidores`);

      if (!response.ok) {
        throw new Error("Error al cargar los servidores");
      }

      const data = await response.json();
      setServers(data.servidores || []);
    } catch (err) {
      console.error("Error:", err);
      setError(err.message);
      showErrorAlert("Error", "No se pudieron cargar los servidores");
    } finally {
      setIsLoading(false);
    }
  };

  const loadAllData = async () => {
    await loadServers();
    await loadStats();
  };

  // Cargar estadísticas
  const loadStats = async () => {
    try {
      // 👇 CAMBIO 2: Ruta de estadísticas
      const response = await fetch(`${urls}/servidores/estadisticas/resumen`);
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Error cargando estadísticas:", error);
    }
  };

  // Verificar estado de un servidor
  const verifyServer = async (serverId) => {
    if (verifyingServers.has(serverId)) return;

    try {
      setVerifyingServers((prev) => new Set(prev.add(serverId)));

      // Mostrar loading mientras se verifica
      Swal.fire({
        title: "Verificando servidor...",
        text: "Por favor espere",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
        background: "#1e293b",
        color: "#f1f5f9",
      });

      // 👇 CAMBIO 3: Ruta para verificar un servidor
      const response = await fetch(
        `${urls}/servidores/${serverId}/verificar`,
        { method: "POST" }
      );

      if (!response.ok) {
        throw new Error("Error al verificar el servidor");
      }

      const result = await response.json();

      // Actualizar solo el servidor verificado
      setServers((prevServers) =>
        prevServers.map((server) =>
          server.id === serverId
            ? {
                ...server,
                estado: result.estado,
                latencia: result.latencia,
                ultima_verificacion: new Date().toISOString(),
              }
            : server
        )
      );

      await loadStats();

      // Cerrar loading y mostrar éxito
      Swal.close();
      showSuccessAlert("¡Éxito!", "Servidor verificado correctamente");
    } catch (error) {
      console.error("Error verificando servidor:", error);
      Swal.close();
      showErrorAlert("Error", "No se pudo verificar el servidor");
    } finally {
      setVerifyingServers((prev) => {
        const newSet = new Set(prev);
        newSet.delete(serverId);
        return newSet;
      });
    }
  };

  // Verificar todos los servidores
  const verifyAllServers = async (event) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    try {
      setIsLoading(true);
      const serverIds = servers.map((server) => server.id);
      setVerifyingServers(new Set(serverIds));

      // Mostrar loading mientras se verifican todos
      Swal.fire({
        title: "Verificando todos los servidores...",
        text: "Esto puede tomar unos momentos",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
        background: "#1e293b",
        color: "#f1f5f9",
      });

      // 👇 CAMBIO 4: Ruta para verificar todos
      const response = await fetch(
        `${urls}/servidores/verificar-todos`,
        {
          method: "POST",
        }
      );

      if (response.ok) {
        const result = await response.json();
        const currentTimestamp = new Date().toISOString();

        setServers((prevServers) =>
          prevServers.map((server) => {
            const serverResult = result.resultados?.find(
              (r) => r.id === server.id
            );
            return serverResult
              ? {
                  ...server,
                  estado: serverResult.estado,
                  latencia: serverResult.latencia,
                  ultima_verificacion: currentTimestamp,
                }
              : server;
          })
        );

        await loadStats();

        // Cerrar loading y mostrar éxito
        Swal.close();
        showSuccessAlert(
          "¡Éxito!",
          "Todos los servidores fueron verificados correctamente"
        );
      }
    } catch (error) {
      console.error("Error verificando todos los servidores:", error);
      Swal.close();
      showErrorAlert("Error", "No se pudieron verificar los servidores");
    } finally {
      setIsLoading(false);
      setVerifyingServers(new Set());
    }
  };

  // Agregar nuevo servidor
  const handleAddServer = async (formData) => {
    try {
      // 👇 CAMBIO 5: Ruta para agregar servidor
      const response = await fetch(`${urls}/servidores`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await loadAllData();
        showSuccessAlert(
          "¡Servidor agregado!",
          "El servidor ha sido agregado correctamente"
        );
      } else {
        throw new Error("Error en la respuesta del servidor");
      }
    } catch (error) {
      console.error("Error agregando servidor:", error);
      showErrorAlert("Error", "No se pudo agregar el servidor");
    }
  };

  // Editar servidor
  const handleEditServer = async (formData) => {
    try {
      // 👇 CAMBIO 6: Ruta para editar servidor
      const response = await fetch(
        `${urls}/servidores/${editingServer.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }
      );

      if (response.ok) {
        await loadAllData();
        showSuccessAlert(
          "¡Servidor actualizado!",
          "El servidor ha sido actualizado correctamente"
        );
      } else {
        throw new Error("Error en la respuesta del servidor");
      }
    } catch (error) {
      console.error("Error actualizando servidor:", error);
      showErrorAlert("Error", "No se pudo actualizar el servidor");
    }
  };

  // Eliminar servidor
  const deleteServer = async (serverId, serverIp, event) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    const result = await showConfirmDialog(
      "¿Está seguro?",
      `Esta acción eliminará el servidor ${serverIp}. Esta acción no se puede deshacer.`,
      "Sí, eliminar"
    );

    if (result.isConfirmed) {
      try {
        // Mostrar loading mientras se elimina
        Swal.fire({
          title: "Eliminando servidor...",
          text: "Por favor espere",
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          },
          background: "#1e293b",
          color: "#f1f5f9",
        });

        // 👇 CAMBIO 7: Ruta para eliminar servidor
        const response = await fetch(`${urls}/servidores/${serverId}`, {
          method: "DELETE",
        });

        if (response.ok) {
          await loadAllData();
          Swal.close();
          showSuccessAlert(
            "¡Eliminado!",
            "El servidor ha sido eliminado correctamente"
          );
        } else {
          throw new Error("Error en la respuesta del servidor");
        }
      } catch (error) {
        console.error("Error eliminando servidor:", error);
        Swal.close();
        showErrorAlert("Error", "No se pudo eliminar el servidor");
      }
    }
  };

  // Abrir modal de edición
  const openEditModal = (server, event) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    setEditingServer(server);
    setShowEditModal(true);
  };

  // Manejar cambio de búsqueda
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Limpiar búsqueda
  const clearSearch = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setSearchTerm("");
  };

  // Limpiar filtro de tipo
  const clearTypeFilter = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setSelectedType("todos");
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Efecto para actualización automática cada 5 minutos
  useEffect(() => {
    const interval = setInterval(() => {
      console.log("🔄 Actualización automática iniciada");
      loadAllData();
    }, 5 * 60 * 1000); // 5 minutos

    return () => clearInterval(interval);
  }, []);

  // Filtrar servidores
  const filteredServers = servers.filter((server) => {
    const matchesSearch =
      server.ip?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      server.sucursal?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      server.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      server.tipo?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType =
      selectedType === "todos" || server.tipo?.toLowerCase() === selectedType;

    return matchesSearch && matchesType;
  });

  if (isLoading && servers.length === 0) {
    return (
      <div className="server-monitor-container">
        <div className="server-monitor-loading">
          <div className="server-monitor-spinner"></div>
          <p>
            <FontAwesomeIcon icon={faCog} spin /> Cargando información de
            servidores...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="server-monitor-container">
      {/* Modales */}
      <ServerModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddServer}
        title="Agregar Nuevo Servidor"
        isEditing={false}
        urls={urls} // 👈 Pasar urls al modal si lo necesita
      />

      <ServerModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSubmit={handleEditServer}
        title="Editar Servidor"
        serverData={editingServer}
        isEditing={true}
        urls={urls} // 👈 Pasar urls al modal si lo necesita
      />

      {/* 🔧 MODAL PING */}
      {showPingModal && (
        <div className="modal-overlay" onClick={closePingModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Herramienta Ping</h3>
              <button className="modal-close-btn" onClick={closePingModal}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <PingApp urls={urls} /> {/* 👈 Pasar urls a PingApp */}
            </div>
          </div>
        </div>
      )}

      <header className="server-monitor-header">
        <div className="server-monitor-title">
          <h1>
            <FontAwesomeIcon icon={faServer} /> Monitor de Estado de Servidores
          </h1>
          <p>Sistema de verificación en tiempo real del estado de la red</p>
        </div>
        <div className="server-monitor-controls">
          <button
            className="server-monitor-btn server-monitor-btn-primary"
            onClick={() => setShowAddModal(true)}
          >
            <FontAwesomeIcon icon={faPlus} /> Agregar Servidor
          </button>

          {/* 🔧 BOTÓN PING NUEVO */}
          <button
            className="server-monitor-btn server-monitor-btn-info"
            onClick={openPingModal}
            title="Herramienta Ping de Red"
          >
            <FontAwesomeIcon icon={faNetworkWired} /> Ping
          </button>

          <button
            className="server-monitor-btn server-monitor-btn-success"
            onClick={verifyAllServers}
            disabled={isLoading || servers.length === 0}
          >
            {isLoading ? (
              <>
                <FontAwesomeIcon icon={faSpinner} spin /> Verificando...
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faSync} /> Verificar Todos
              </>
            )}
          </button>
        </div>
      </header>

      {error && (
        <div className="server-monitor-error">
          <FontAwesomeIcon icon={faExclamationTriangle} /> Error: {error}
          <button onClick={loadAllData} className="server-monitor-retry">
            Reintentar
          </button>
        </div>
      )}

      {stats && (
        <div className="server-monitor-stats">
          <div className="server-monitor-stats-grid">
            <div className="server-monitor-stat">
              <span className="server-monitor-stat-number">{stats.total}</span>
              <span className="server-monitor-stat-label">
                <FontAwesomeIcon icon={faServer} /> Total Equipos
              </span>
            </div>
            <div className="server-monitor-stat server-monitor-stat-active">
              <span className="server-monitor-stat-number">
                {stats.activos}
              </span>
              <span className="server-monitor-stat-label">
                <FontAwesomeIcon icon={faCheckCircle} /> Activos
              </span>
            </div>
            <div className="server-monitor-stat server-monitor-stat-inactive">
              <span className="server-monitor-stat-number">
                {stats.inactivos}
              </span>
              <span className="server-monitor-stat-label">
                <FontAwesomeIcon icon={faTimesCircle} /> Inactivos
              </span>
            </div>
            <div className="server-monitor-stat server-monitor-stat-health">
              <span className="server-monitor-stat-number">
                {stats.porcentajeSalud}%
              </span>
              <span className="server-monitor-stat-label">
                <FontAwesomeIcon icon={faSignal} /> Salud de Red
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Filtros Mejorados */}
      <div className="server-monitor-filters">
        <div className="server-monitor-search">
          <div className="server-monitor-search-wrapper">
            <FontAwesomeIcon
              icon={faSearch}
              className="server-monitor-search-icon"
            />
            <input
              type="text"
              placeholder="Buscar por IP, sucursal, nombre o tipo..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="server-monitor-search-input"
            />
            {searchTerm && (
              <button
                className="server-monitor-clear-search"
                onClick={clearSearch}
                title="Limpiar búsqueda"
              >
                <FontAwesomeIcon icon={faTimesCircle} />
              </button>
            )}
          </div>
        </div>

        <div className="server-monitor-filter-group">
          <div className="server-monitor-type-filter">
            <FontAwesomeIcon
              icon={faFilter}
              className="server-monitor-filter-icon"
            />
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="server-monitor-type-select"
            >
              <option value="todos">Todos los tipos</option>
              <option value="servidor">Servidores</option>
              <option value="switch">Switches</option>
              <option value="router">Routers</option>
              <option value="firewall">Firewalls</option>
              <option value="database">Bases de datos</option>
            </select>
            {selectedType !== "todos" && (
              <button
                className="server-monitor-clear-filter"
                onClick={clearTypeFilter}
                title="Limpiar filtro"
              >
                <FontAwesomeIcon icon={faTimesCircle} />
              </button>
            )}
          </div>

          <div className="server-monitor-filter-info">
            <span className="server-monitor-filter-badge">
              {selectedType !== "todos" && `Tipo: ${selectedType}`}
              {searchTerm && ` • Búsqueda: "${searchTerm}"`}
            </span>
          </div>
        </div>
      </div>

      <div className="server-monitor-table-container">
        <table className="server-monitor-table">
          <thead>
            <tr>
              <th>IP</th>
              <th>Sucursal</th>
              <th>Nombre</th>
              <th>Tipo</th>
              <th>Estado</th>
              <th>Latencia</th>
              <th>Última Verificación</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredServers.length > 0 ? (
              filteredServers.map((server) => (
                <tr
                  key={server.id}
                  className={`server-monitor-${server.estado} ${
                    verifyingServers.has(server.id)
                      ? "server-monitor-verifying"
                      : ""
                  }`}
                >
                  <td>
                    <span className="server-monitor-ip">
                      <FontAwesomeIcon icon={faDesktop} /> {server.ip}
                    </span>
                  </td>
                  <td>
                    <span className="server-monitor-sucursal">
                      <FontAwesomeIcon icon={faBuilding} /> {server.sucursal}
                    </span>
                  </td>
                  <td>
                    <span className="server-monitor-name">
                      {server.nombre || "Sin nombre"}
                    </span>
                  </td>
                  <td>
                    <span
                      className="server-monitor-type-badge"
                      style={{
                        borderColor: getTypeColor(server.tipo),
                        backgroundColor: `${getTypeColor(server.tipo)}20`,
                      }}
                    >
                      <FontAwesomeIcon
                        icon={getTypeIcon(server.tipo)}
                        style={{ color: getTypeColor(server.tipo) }}
                      />
                      {server.tipo || "servidor"}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`server-monitor-status server-monitor-status-${server.estado}`}
                    >
                      <FontAwesomeIcon
                        icon={
                          server.estado === "activo"
                            ? faCheckCircle
                            : faTimesCircle
                        }
                      />
                      {server.estado === "activo" ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`server-monitor-latency server-monitor-latency-${server.estado}`}
                    >
                      <FontAwesomeIcon icon={faSignal} />
                      {server.latencia || "N/A"}
                    </span>
                  </td>
                  <td>
                    <span className="server-monitor-last-check">
                      <FontAwesomeIcon icon={faClock} />
                      {server.ultima_verificacion
                        ? formatDate(server.ultima_verificacion)
                        : "Sin verificar"}
                    </span>
                  </td>
                  <td>
                    <div className="server-monitor-actions">
                      <button
                        className="server-monitor-action-btn server-monitor-action-verify"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          verifyServer(server.id);
                        }}
                        disabled={verifyingServers.has(server.id)}
                      >
                        {verifyingServers.has(server.id) ? (
                          <FontAwesomeIcon icon={faSpinner} spin />
                        ) : (
                          <FontAwesomeIcon icon={faEye} />
                        )}
                      </button>
                      <button
                        className="server-monitor-action-btn server-monitor-action-edit"
                        onClick={(e) => openEditModal(server, e)}
                      >
                        <FontAwesomeIcon icon={faEdit} />
                      </button>
                      <button
                        className="server-monitor-action-btn server-monitor-action-delete"
                        onClick={(e) => deleteServer(server.id, server.ip, e)}
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" className="server-monitor-no-results">
                  <FontAwesomeIcon icon={faExclamationTriangle} />
                  No se encontraron servidores que coincidan con los filtros
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="server-monitor-footer">
        <p>
          Mostrando {filteredServers.length} de {servers.length} equipos
          {selectedType !== "todos" && ` • Filtrado por: ${selectedType}`}
          {searchTerm && ` • Búsqueda: "${searchTerm}"`}
          {verifyingServers.size > 0 &&
            ` • Verificando ${verifyingServers.size} equipo(s)...`}
        </p>
      </div>

      <style jsx>{`
        /* 🔧 ESTILOS MODAL PING */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }

        .modal-content {
          background: #1e293b;
          border-radius: 10px;
          width: 90%;
          max-width: 500px;
          max-height: 80vh;
          overflow: auto;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
          border: 1px solid #334155;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          border-bottom: 1px solid #334155;
          background: #0f172a;
          border-radius: 10px 10px 0 0;
        }

        .modal-header h3 {
          margin: 0;
          color: #f1f5f9;
          font-size: 1.25rem;
          font-weight: 600;
        }

        .modal-close-btn {
          background: none;
          border: none;
          color: #94a3b8;
          font-size: 24px;
          cursor: pointer;
          padding: 0;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: color 0.2s;
        }

        .modal-close-btn:hover {
          color: #f1f5f9;
          background: rgba(239, 68, 68, 0.1);
          border-radius: 50%;
        }

        .modal-body {
          padding: 20px;
        }

        /* 🔧 ESTILOS PARA EL BOTÓN PING */
        .server-monitor-btn-info {
          background: linear-gradient(135deg, #06b6d4, #3b82f6);
          border: 1px solid #06b6d4;
        }

        .server-monitor-btn-info:hover:not(:disabled) {
          background: linear-gradient(135deg, #0891b2, #2563eb);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(6, 182, 212, 0.3);
        }

        .server-monitor-controls {
          display: flex;
          gap: 10px;
          align-items: center;
        }

        @media (max-width: 768px) {
          .server-monitor-controls {
            flex-direction: column;
            width: 100%;
          }

          .server-monitor-controls .server-monitor-btn {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
};

export default ServerStatusTable;