import React, { useEffect, useState } from "react";
import "./App.css";
import PrinterTable from "./components/PrinterTable";
import PrinterForm from "./components/PrinterForm";
import InfoModal from "./components/InfoModal";
import LoadingModal from "./components/LoadingModal";
import Login from "./components/Login";
import Swal from "sweetalert2";
import {
  IoIosAdd,
  IoIosPrint,
  IoIosPulse,
  IoIosMenu,
  IoIosArrowDropleft,
  IoIosArrowDropright,
  IoIosCart,
  IoIosLogOut,
  IoIosPerson,
  IoIosPersonAdd,
} from "react-icons/io";
import ServerStatusTable from "./components/ServerStatusTable";
import PedidosSection from "./components/PedidosSection";
import Censo from "./components/Censo";

function App() {
  const [impresoras, setImpresoras] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    ip: "",
    sucursal: "",
    modelo: "",
    drivers_url: "",
    tipo: "principal",
    toner_reserva: "",
  });
  const [editingId, setEditingId] = useState(null);
  const [infoModal, setInfoModal] = useState({ visible: false, data: null });
  const [showLoadingMessage, setShowLoadingMessage] = useState(false);

  // 🔥 PERSISTIR tablaActiva EN localStorage
  const [tablaActiva, setTablaActiva] = useState(() => {
    const saved = localStorage.getItem("tablaActiva");
    return saved || "impresoras";
  });

  const [tipoImpresoraActiva, setTipoImpresoraActiva] = useState("principal");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Estados de autenticación
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState(null);

  const urls = "http://192.168.8.166:3001";

  // Verificar autenticación al cargar
  useEffect(() => {
    const authStatus = localStorage.getItem("isAuthenticated");
    const adminStatus = localStorage.getItem("isAdmin");
    const userData = localStorage.getItem("user");

    if (authStatus === "true") {
      setIsAuthenticated(true);
      setIsAdmin(adminStatus === "true");
      setUser(userData ? JSON.parse(userData) : null);
    }

    // 🔥 VERIFICAR PARÁMETROS URL PARA DETERMINAR LA SECCIÓN
    const urlParams = new URLSearchParams(window.location.search);
    const censoParam = urlParams.get("censo");
    const sectionParam = urlParams.get("section");

    if (censoParam || sectionParam === "censos") {
      // Si hay parámetro de censo o section=censos, activar la sección de censos
      setTablaActiva("censos");
    }
  }, []);

  // 🔥 GUARDAR tablaActiva EN localStorage CUANDO CAMBIE
  useEffect(() => {
    localStorage.setItem("tablaActiva", tablaActiva);
  }, [tablaActiva]);

  // 🔥 FUNCIÓN PARA CAMBIAR TABLA ACTIVA
  const handleTablaActivaChange = (nuevaTabla) => {
    setTablaActiva(nuevaTabla);
  };

  // ✅ Función para cargar impresoras
  const fetchImpresoras = (showMessage = false) => {
    if (!isAdmin) return; // Solo cargar si es admin

    if (showMessage) {
      setShowLoadingMessage(true);
    }

    fetch(urls + "/api/toners")
      .then((res) => res.json())
      .then((data) => setImpresoras(data.impresoras || []))
      .catch((err) => console.error("Error al obtener datos:", err))
      .finally(() => {
        if (showMessage) {
          setTimeout(() => setShowLoadingMessage(false), 500);
        }
      });
  };

  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      fetchImpresoras();
      const interval = setInterval(() => {
        fetchImpresoras();
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, isAdmin]);

  // Función de login
  // En App.js, modifica la función handleLogin
  const handleLogin = (userData, adminStatus, seccionInicial = null) => {
    setUser(userData);
    setIsAuthenticated(true);
    setIsAdmin(adminStatus);

    // 🔥 USAR LA SECCIÓN INICIAL SI SE PROPORCIONA, SINO LA LÓGICA NORMAL
    if (seccionInicial) {
      setTablaActiva(seccionInicial);
    } else if (!adminStatus) {
      setTablaActiva("pedidos");
    }
    // Si es admin y no hay sección inicial, se mantiene la que estaba en localStorage
  };

  // Función de logout
  const handleLogout = async () => {
    const result = await Swal.fire({
      title: "¿Cerrar sesión?",
      text: "¿Estás seguro de que quieres salir?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Sí, salir",
      cancelButtonText: "Cancelar",
      background: "#2c2c2c",
      color: "#fff",
    });

    if (result.isConfirmed) {
      localStorage.removeItem("isAuthenticated");
      localStorage.removeItem("isAdmin");
      localStorage.removeItem("user");
      localStorage.removeItem("tablaActiva"); // 🔥 Limpiar también el estado de tabla
      setIsAuthenticated(false);
      setIsAdmin(false);
      setUser(null);
      setTablaActiva("impresoras");
    }
  };

  const handleInputChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await Swal.fire({
      title: "¿Estás seguro?",
      text: editingId
        ? "¿Quieres guardar los cambios en la impresora?"
        : "¿Quieres agregar esta nueva impresora?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, confirmar",
      cancelButtonText: "No, cancelar",
      background: "#2c2c2c",
      color: "#fff",
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
    });

    if (!result.isConfirmed) return;

    const method = editingId ? "PUT" : "POST";
    const url = editingId
      ? `${urls}/api/impresoras/${editingId}`
      : `${urls}/api/impresoras`;

    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error("Error en la respuesta del servidor");

      await Swal.fire({
        title: editingId ? "¡Cambios guardados!" : "¡Impresora agregada!",
        text: editingId
          ? "Los datos fueron actualizados correctamente."
          : "La nueva impresora fue guardada correctamente.",
        icon: "success",
        background: "#2c2c2c",
        color: "#fff",
        confirmButtonColor: "#3085d6",
      });

      fetchImpresoras(true);
      setShowModal(false);
      setFormData({
        ip: "",
        sucursal: "",
        modelo: "",
        drivers_url: "",
        tipo: "principal",
        toner_reserva: "",
      });
      setEditingId(null);
    } catch (err) {
      console.error("Error al guardar:", err);
      Swal.fire({
        title: "Error",
        text: "Hubo un problema al guardar la impresora.",
        icon: "error",
        background: "#2c2c2c",
        color: "#fff",
        confirmButtonColor: "#d33",
      });
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "¿Estás seguro?",
      text: "Esta acción eliminará la impresora.",
      icon: "warning",
      background: "#2c2c2c",
      color: "#fff",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });

    if (result.isConfirmed) {
      try {
        await fetch(`${urls}/api/impresoras/${id}`, {
          method: "DELETE",
        });

        await Swal.fire({
          title: "¡Eliminado!",
          text: "La impresora fue eliminada correctamente.",
          icon: "success",
          background: "#2c2c2c",
          color: "#fff",
          confirmButtonColor: "#3085d6",
        });

        fetchImpresoras(true);
      } catch (error) {
        console.error("Error al eliminar la impresora:", error);
        Swal.fire({
          title: "Error",
          text: "No se pudo eliminar la impresora.",
          icon: "error",
          background: "#2c2c2c",
          color: "#fff",
        });
      }
    }
  };

  const handleEdit = (impresora) => {
    setFormData({
      ip: impresora.ip,
      sucursal: impresora.sucursal,
      modelo: impresora.modelo,
      drivers_url: impresora.drivers_url,
      tipo: impresora.tipo,
      toner_reserva: impresora.toner_reserva,
      direccion: impresora.direccion,
    });
    setEditingId(impresora.id);
    setShowModal(true);
  };

  const handleCopyPedido = async (impresora) => {
    const pedidoData = {
      impresora_id: impresora.id,
      modelo: impresora.modelo,
      numero_serie: impresora.numero_serie ?? "N/A",
      contador_total: impresora.contador_paginas ?? "N/A",
      nombre: impresora.sucursal || "Sucursal Desconocida",
      direccion: impresora.direccion || "Dirección no especificada",
      telefono: "0987 200316",
      correo: "bryan.medina@surcomercial.com.py",
      ultimo_pedido_fecha: impresora.ultimo_pedido_fecha,
    };

    let fechaFormateada = "N/A";
    if (pedidoData.ultimo_pedido_fecha) {
      const fecha = new Date(pedidoData.ultimo_pedido_fecha);
      const dia = String(fecha.getDate()).padStart(2, "0");
      const mes = String(fecha.getMonth() + 1).padStart(2, "0");
      const anio = String(fecha.getFullYear()).slice(-2);
      fechaFormateada = `${dia}/${mes}/${anio}`;
    }

    const textoParaCopiar = `
Sucursal: ${pedidoData.nombre}
Modelo: ${pedidoData.modelo}
Número de Serie: ${pedidoData.numero_serie}
Contador: ${pedidoData.contador_total}
Dirección: ${pedidoData.direccion}
Teléfono: ${pedidoData.telefono}
Correo: ${pedidoData.correo}
Último Pedido: ${fechaFormateada}
  `.trim();

    const confirmacion = await Swal.fire({
      title: "¿Confirmar pedido de tóner?",
      html: `<pre style="text-align:left">${textoParaCopiar}</pre>`,
      icon: "question",
      background: "#2c2c2c",
      color: "#fff",
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      showCancelButton: true,
      confirmButtonText: "Confirmar",
      cancelButtonText: "Cancelar",
      customClass: {
        popup: "swal2-popup swal2-preformatted-text",
      },
    });

    if (confirmacion.isConfirmed) {
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(textoParaCopiar);
        } else {
          const textArea = document.createElement("textarea");
          textArea.value = textoParaCopiar;
          textArea.style.position = "fixed";
          textArea.style.opacity = "0";
          document.body.appendChild(textArea);
          textArea.focus();
          textArea.select();
          const exito = document.execCommand("copy");
          document.body.removeChild(textArea);
          if (!exito) throw new Error("No se pudo copiar con fallback");
        }

        const response = await fetch(urls + "/api/pedido", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ impresora_id: pedidoData.impresora_id }),
        });

        if (!response.ok) {
          throw new Error("Error al guardar el pedido en el backend");
        }

        await Swal.fire({
          icon: "success",
          title: "Pedido confirmado",
          text: "Los datos fueron copiados al portapapeles y enviados correctamente.",
          background: "#2c2c2c",
          color: "#fff",
          confirmButtonColor: "#3085d6",
          timer: 3000,
          showConfirmButton: false,
        });

        fetchImpresoras(true);
      } catch (error) {
        console.error("Error al procesar el pedido:", error);
        await Swal.fire({
          icon: "error",
          title: "Error",
          text: "Ocurrió un error al procesar el pedido. Intenta nuevamente.",
          background: "#2c2c2c",
          color: "#fff",
          confirmButtonColor: "#3085d6",
          cancelButtonColor: "#d33",
        });
      }
    }
  };

  // Opciones del sidebar - varían según el rol
  const menuItems = isAdmin
    ? [
        {
          id: "impresoras",
          label: "Impresoras",
          icon: <IoIosPrint className="text-2xl" />,
        },
        {
          id: "servidores",
          label: "Servidores",
          icon: <IoIosPulse className="text-2xl" />,
        },
        {
          id: "pedidos",
          label: "Pedidos",
          icon: <IoIosCart className="text-2xl" />,
        },
        {
          id: "censos",
          label: "Censos",
          icon: <IoIosPersonAdd className="text-2xl" />,
        },
      ]
    : [
        {
          id: "pedidos",
          label: "Pedidos",
          icon: <IoIosCart className="text-2xl" />,
        },
      ];

  // Mostrar login si no está autenticado
  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      {/* Sidebar Minimalista */}
      <div
        className={`
        bg-gray-800 border-r border-gray-700 transition-all duration-300 ease-in-out
        ${sidebarCollapsed ? "w-20" : "w-64"}
        flex flex-col
      `}
      >
        {/* Header del Sidebar */}
        <div
          className={`flex items-center ${
            sidebarCollapsed ? "justify-center p-3" : "justify-between p-4"
          } border-b border-gray-700`}
        >
          {!sidebarCollapsed && (
            <h1 className="text-xl font-bold text-white">PrinterManager</h1>
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            {sidebarCollapsed ? (
              <IoIosArrowDropright className="text-xl" />
            ) : (
              <IoIosArrowDropleft className="text-xl" />
            )}
          </button>
        </div>

        {/* Menú de Navegación Simplificado */}
        <nav className="flex-1 p-4">
          <ul className="space-y-3">
            {menuItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => handleTablaActivaChange(item.id)}
                  className={`
                    w-full flex items-center rounded-lg transition-all duration-200
                    ${
                      tablaActiva === item.id
                        ? "bg-blue-600 text-white shadow-lg"
                        : "text-gray-300 hover:bg-gray-700 hover:text-white"
                    }
                    ${sidebarCollapsed ? "justify-center p-3" : "space-x-3 p-3"}
                  `}
                  title={sidebarCollapsed ? item.label : ""}
                >
                  {item.icon}
                  {!sidebarCollapsed && (
                    <span className="font-medium">{item.label}</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Información del usuario y logout */}
        {!sidebarCollapsed && (
          <div className="p-4 border-t border-gray-700">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <IoIosPerson className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {user?.nombrepersona || "Usuario"}
                </p>
                <p className="text-xs text-gray-400 truncate">
                  {isAdmin ? "Administrador" : "Usuario"}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-2 p-2 text-gray-300 hover:bg-gray-700 hover:text-white rounded-lg transition-colors"
            >
              <IoIosLogOut className="text-lg" />
              <span className="text-sm">Cerrar Sesión</span>
            </button>
          </div>
        )}
      </div>

      {/* Contenido Principal */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header Minimalista */}
        <header className="bg-gray-800 border-b border-gray-700 p-4">
          <div className="flex items-center justify-center relative">
            {/* Botón menú móvil a la izquierda - posición absoluta */}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="absolute left-4 p-2 hover:bg-gray-700 rounded-lg transition-colors lg:hidden"
            >
              <IoIosMenu className="text-xl" />
            </button>

            {/* Título centrado */}
            <div className="text-center">
              <h1 className="text-xl font-bold text-white">
                {tablaActiva === "impresoras" && "Gestión de Impresoras"}
                {tablaActiva === "servidores" && "Estado del Servidor"}
                {tablaActiva === "pedidos" && "Lista de Pedidos"}
                {tablaActiva === "censos" && "Validador de Censos"}
              </h1>
              {!isAdmin && (
                <p className="text-sm text-gray-400 mt-1">
                  Acceso limitado - Solo pedidos
                </p>
              )}
            </div>
          </div>
        </header>

        {/* Contenido - Menos espacio entre header y contenido */}
        <main className="flex-1 overflow-auto bg-gray-900 pt-2">
          {showLoadingMessage && <LoadingModal />}

          {/* Botón Agregar centrado - solo para impresoras y solo para admin */}
          {tablaActiva === "impresoras" && isAdmin && (
            <div className="flex justify-center mb-4">
              <button
                onClick={() => setShowModal(true)}
                className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 whitespace-nowrap"
              >
                <IoIosAdd className="text-lg" />
                <span>Agregar Impresora</span>
              </button>
            </div>
          )}

          {/* Tabs en columnas estilo original - SOLO para impresoras y solo para admin */}
          {tablaActiva === "impresoras" && isAdmin && (
            <div className="tab-column-header">
              <div
                className={`tab-column ${
                  tipoImpresoraActiva === "principal" ? "active" : ""
                }`}
                onClick={() => setTipoImpresoraActiva("principal")}
              >
                Principales
              </div>
              <div
                className={`tab-column ${
                  tipoImpresoraActiva === "backup" ? "active" : ""
                }`}
                onClick={() => setTipoImpresoraActiva("backup")}
              >
                Backup
              </div>
              <div
                className={`tab-column ${
                  tipoImpresoraActiva === "comercial" ? "active" : ""
                }`}
                onClick={() => setTipoImpresoraActiva("comercial")}
              >
                Comercial
              </div>
            </div>
          )}

          {/* Contenido Principal */}
          <div>
            {tablaActiva === "impresoras" && isAdmin && (
              <PrinterTable
                impresoras={impresoras}
                tipo={tipoImpresoraActiva}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onInfo={(data) => setInfoModal({ visible: true, data })}
                onCopy={handleCopyPedido}
              />
            )}

            {tablaActiva === "servidores" && isAdmin && (
              <div id="server-status">
                <ServerStatusTable />
              </div>
            )}
          </div>
          <div>
            {tablaActiva === "pedidos" && <PedidosSection urls={urls} />}
          </div>
          {tablaActiva === "censos" && isAdmin && (
            <div id="censos">
              <Censo />
            </div>
          )}
        </main>
      </div>

      {/* Modales */}
      {showModal && (
        <PrinterForm
          formData={formData}
          onChange={handleInputChange}
          onSubmit={handleSubmit}
          onClose={() => {
            setShowModal(false);
            setEditingId(null);
            setFormData({
              ip: "",
              sucursal: "",
              modelo: "",
              drivers_url: "",
              tipo: "principal",
              toner_reserva: "",
            });
          }}
          isEditing={editingId !== null}
        />
      )}

      <InfoModal
        visible={infoModal.visible}
        data={infoModal.data}
        onClose={() => setInfoModal({ visible: false, data: null })}
      />
    </div>
  );
}

export default App;
