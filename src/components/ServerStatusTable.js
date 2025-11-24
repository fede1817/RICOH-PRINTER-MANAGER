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
} from "@fortawesome/free-solid-svg-icons";
import "./ServerStatusTable.css";

const ServerStatusTable = () => {
  const [servers, setServers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [selectedType, setSelectedType] = useState("todos");
  const [verifyingServers, setVerifyingServers] = useState(new Set());

  const API_BASE_URL = "http://localhost:3001/api";

  // Función para obtener el ícono según el tipo - CORREGIDA
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
      const response = await fetch(`${API_BASE_URL}/servidores`);

      if (!response.ok) {
        throw new Error("Error al cargar los servidores");
      }

      const data = await response.json();
      setServers(data.servidores || []);
    } catch (err) {
      console.error("Error:", err);
      setError(err.message);
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
      const response = await fetch(`${API_BASE_URL}/servidores-estadisticas`);
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

      const response = await fetch(
        `${API_BASE_URL}/servidores/${serverId}/verificar`,
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
    } catch (error) {
      console.error("Error verificando servidor:", error);
      alert("❌ Error al verificar el servidor");
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

      const response = await fetch(
        `${API_BASE_URL}/servidores/verificar-todos`,
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
        alert("✅ Todos los servidores verificados correctamente");
      }
    } catch (error) {
      console.error("Error verificando todos los servidores:", error);
      alert("❌ Error al verificar los servidores");
    } finally {
      setIsLoading(false);
      setVerifyingServers(new Set());
    }
  };

  // Agregar nuevo servidor
  const addServer = async (event) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    const ip = prompt("Ingrese la IP del nuevo servidor:");
    if (!ip) return;

    const sucursal = prompt("Ingrese la sucursal:");
    if (!sucursal) return;

    const nombre = prompt("Ingrese el nombre del equipo:") || `Equipo ${ip}`;

    const tipo =
      prompt(
        "Ingrese el tipo (servidor, switch, router, firewall, database):",
        "servidor"
      ) || "servidor";

    if (ip && sucursal) {
      try {
        const response = await fetch(`${API_BASE_URL}/servidores`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ip,
            sucursal,
            nombre,
            tipo: tipo.toLowerCase(),
          }),
        });

        if (response.ok) {
          await loadAllData();
          alert("✅ Servidor agregado correctamente");
        } else {
          throw new Error("Error en la respuesta del servidor");
        }
      } catch (error) {
        console.error("Error agregando servidor:", error);
        alert("❌ Error al agregar servidor");
      }
    }
  };

  // Eliminar servidor
  const deleteServer = async (serverId, serverIp, event) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    if (window.confirm(`¿Está seguro de eliminar el servidor ${serverIp}?`)) {
      try {
        const response = await fetch(`${API_BASE_URL}/servidores/${serverId}`, {
          method: "DELETE",
        });

        if (response.ok) {
          await loadAllData();
          alert("✅ Servidor eliminado correctamente");
        } else {
          throw new Error("Error en la respuesta del servidor");
        }
      } catch (error) {
        console.error("Error eliminando servidor:", error);
        alert("❌ Error al eliminar servidor");
      }
    }
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
            onClick={addServer}
          >
            <FontAwesomeIcon icon={faPlus} /> Agregar Servidor
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
                        className="server-monitor-btn server-monitor-btn-info"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          verifyServer(server.id);
                        }}
                        title="Verificar estado"
                        disabled={verifyingServers.has(server.id)}
                      >
                        {verifyingServers.has(server.id) ? (
                          <>
                            <FontAwesomeIcon icon={faSpinner} spin />{" "}
                            Verificando...
                          </>
                        ) : (
                          <>
                            <FontAwesomeIcon icon={faEye} /> Verificar
                          </>
                        )}
                      </button>
                      <button
                        className="server-monitor-btn server-monitor-btn-danger"
                        onClick={(e) => deleteServer(server.id, server.ip, e)}
                        title="Eliminar servidor"
                      >
                        <FontAwesomeIcon icon={faTrash} /> Eliminar
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
    </div>
  );
};

export default ServerStatusTable;
