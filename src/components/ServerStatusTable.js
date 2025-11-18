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
} from "@fortawesome/free-solid-svg-icons";
import "./ServerStatusTable.css";

const ServerStatusTable = () => {
  const [servers, setServers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [selectedType, setSelectedType] = useState("todos");
  const [verifyingServers, setVerifyingSs] = useState(new Set());

  const API_BASE_URL = "http://localhost:3001/api";

  // Función para formatear fechas de manera segura
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";

    try {
      const date = new Date(dateString);

      // Verificar si la fecha es válida
      if (isNaN(date.getTime())) {
        // Si no es válida, intentar parsear formatos comunes
        const timestamp = Date.parse(dateString);
        if (!isNaN(timestamp)) {
          return new Date(timestamp).toLocaleString("es-ES");
        }
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

  // Verificar estado de un servidor - CORREGIDO
  const verifyServer = async (serverId) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/servidores/${serverId}/verificar`,
        { method: "POST" }
      );

      if (!response.ok) {
        throw new Error("Error al verificar el servidor");
      }

      const result = await response.json();

      // 🔹 Actualizar solo el servidor verificado
      setServers((prevServers) =>
        prevServers.map((server) =>
          server.id === serverId
            ? {
                ...server,
                estado: result.estado,
                latencia: result.latencia,
                ultima_verificacion: normalizeDate(result.timestamp),
              }
            : server
        )
      );

      return result;
    } catch (error) {
      console.error("Error verificando servidor:", error);
    }
  };

  const normalizeDate = (ts) => {
    if (!ts) return null;

    // Si es número en segundos
    if (typeof ts === "number") {
      return new Date(ts * 1000).toISOString();
    }

    // Si es string de número
    if (/^\d+$/.test(ts)) {
      return new Date(parseInt(ts, 10) * 1000).toISOString();
    }

    // Si ya es string ISO
    if (!isNaN(Date.parse(ts))) {
      return new Date(ts).toISOString();
    }

    // Si es un formato raro, lo ignoramos
    return null;
  };

  // Verificar todos los servidores - CORREGIDO
  const verifyAllServers = async (event) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    try {
      setIsLoading(true);
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
            const serverResult = result.resultados.find(
              (r) => r.id === server.id
            );
            return serverResult
              ? {
                  ...server,
                  estado: serverResult.estado,
                  latencia: serverResult.latencia,
                  ultima_verificacion: currentTimestamp, // Usar timestamp actual
                }
              : server;
          })
        );

        await loadStats();
      }
    } catch (error) {
      console.error("Error verificando todos los servidores:", error);
      alert("❌ Error al verificar los servidores");
    } finally {
      setIsLoading(false);
    }
  };

  // Agregar nuevo servidor
  const addServer = async (event) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    const ip = prompt("Ingrese la IP del nuevo servidor:");
    const sucursal = prompt("Ingrese la sucursal:");
    const nombre = prompt("Ingrese el nombre del equipo:");
    const tipo = prompt(
      "Ingrese el tipo (servidor, switch, router, firewall):"
    );

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
            nombre: nombre || `Equipo ${ip}`,
            tipo: tipo || "servidor",
          }),
        });

        if (response.ok) {
          await loadServers();
          await loadStats();
          alert("✅ Servidor agregado correctamente");
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
          await loadServers();
          await loadStats();
          alert("✅ Servidor eliminado correctamente");
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

  useEffect(() => {
    loadAllData();
  }, []);

  // Efecto para actualización automática cada 5 minutos
  useEffect(() => {
    const interval = setInterval(() => {
      console.log("🔄 Actualización automática iniciada");
      loadAllData();
    }, 5 * 60 * 100); // 5 minutos

    return () => clearInterval(interval);
  }, []);

  // Filtrar servidores
  const filteredServers = servers.filter((server) => {
    const matchesSearch =
      server.ip.toLowerCase().includes(searchTerm.toLowerCase()) ||
      server.sucursal.toLowerCase().includes(searchTerm.toLowerCase()) ||
      server.nombre.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType =
      selectedType === "todos" || server.tipo === selectedType;

    return matchesSearch && matchesType;
  });

  if (isLoading) {
    return (
      <div className="server-status-container">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>
            <FontAwesomeIcon icon={faCog} spin /> Cargando información de
            servidores...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="server-status-container">
      <header>
        <div className="header-title">
          <h1>
            <FontAwesomeIcon icon={faServer} /> Monitor de Estado de Servidores
          </h1>
          <p>Sistema de verificación en tiempo real del estado de la red</p>
        </div>
        <div className="controls">
          <button className="btn btn-primary" onClick={addServer}>
            <FontAwesomeIcon icon={faPlus} /> Agregar Servidor
          </button>
          <button className="btn btn-success" onClick={verifyAllServers}>
            <FontAwesomeIcon icon={faSync} /> Verificar Todos
          </button>
        </div>
      </header>

      {error && (
        <div className="error-message">
          <FontAwesomeIcon icon={faExclamationTriangle} /> Error: {error}
        </div>
      )}

      {stats && (
        <div className="stats">
          <div className="stats-grid">
            <div className="stat-card">
              <span className="stat-number">{stats.total}</span>
              <span className="stat-label">
                <FontAwesomeIcon icon={faServer} /> Total Servidores
              </span>
            </div>
            <div className="stat-card active">
              <span className="stat-number">{stats.activos}</span>
              <span className="stat-label">
                <FontAwesomeIcon icon={faCheckCircle} /> Activos
              </span>
            </div>
            <div className="stat-card inactive">
              <span className="stat-number">{stats.inactivos}</span>
              <span className="stat-label">
                <FontAwesomeIcon icon={faTimesCircle} /> Inactivos
              </span>
            </div>
            <div className="stat-card health">
              <span className="stat-number">{stats.porcentajeSalud}%</span>
              <span className="stat-label">
                <FontAwesomeIcon icon={faSignal} /> Salud de Red
              </span>
            </div>
          </div>

          {/* Estadísticas por tipo */}
        </div>
      )}

      <div className="filters-container">
        <div className="search-box">
          <FontAwesomeIcon icon={faSearch} className="search-icon" />
          <input
            type="text"
            placeholder="Buscar por IP, sucursal o nombre..."
            value={searchTerm}
            onChange={handleSearchChange}
          />
          {searchTerm && (
            <button
              className="clear-search"
              onClick={clearSearch}
              title="Limpiar búsqueda"
            >
              <FontAwesomeIcon icon={faTimesCircle} />
            </button>
          )}
        </div>
      </div>

      <div className="table-responsive">
        <table className="server-table">
          <thead>
            <tr>
              <th>IP</th>
              <th>Sucursal</th>
              <th>Estado</th>
              <th>Latencia</th>
              <th>Última Verificación</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredServers.length > 0 ? (
              filteredServers.map((server) => (
                <tr key={server.id} className={server.estado}>
                  <td>
                    <span className="ip-address">
                      <FontAwesomeIcon icon={faDesktop} /> {server.ip}
                    </span>
                  </td>
                  <td>
                    <span className="sucursal-name">
                      <FontAwesomeIcon icon={faBuilding} /> {server.sucursal}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge ${server.estado}`}>
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
                    <span className={`latencia ${server.estado}`}>
                      <FontAwesomeIcon icon={faSignal} /> {server.latencia}
                    </span>
                  </td>
                  <td>
                    <span className="ultima-verificacion">
                      <FontAwesomeIcon icon={faClock} />
                      {server.ultima_verificacion
                        ? new Date(server.ultima_verificacion).toLocaleString(
                            "es-ES"
                          )
                        : "Sin verificar"}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn btn-info"
                        onClick={(e) => verifyServer(server.id, e)}
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
                        className="btn btn-danger"
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
                <td colSpan="8" className="no-results">
                  <FontAwesomeIcon icon={faExclamationTriangle} />
                  No se encontraron servidores que coincidan con los filtros
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="table-footer">
        <p>
          Mostrando {filteredServers.length} de {servers.length} servidores
          {verifyingServers.size > 0 &&
            ` • Verificando ${verifyingServers.size} servidor(es)...`}
        </p>
      </div>
    </div>
  );
};

export default ServerStatusTable;
