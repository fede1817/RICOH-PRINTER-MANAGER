import React, {
  useEffect,
  useState,
  useMemo,
  useCallback,
  Suspense,
  lazy,
} from "react";
import "./App.css";
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
import { FiNavigation } from "react-icons/fi";

// Lazy load de componentes pesados - SOLO se cargan cuando se necesitan
const PrinterTable = lazy(() => import("./components/PrinterTable"));
const ServerStatusTable = lazy(() => import("./components/ServerStatusTable"));
const PedidosSection = lazy(() => import("./components/PedidosSection"));
const Censo = lazy(() => import("./components/Censo"));
const CellManager = lazy(() => import("./components/CellManager"));

// Constantes para evitar recreación de objetos
const INITIAL_FORM_DATA = {
  ip: "",
  sucursal: "",
  modelo: "",
  drivers_url: "",
  tipo: "principal",
  toner_reserva: "",
};

const URLS = "http://192.168.8.166:3001";

// 🔥 COMPONENTE MEMOIZADO PARA MENÚ ITEMS
const MenuItem = React.memo(({ item, isActive, isCollapsed, onClick }) => {
  return (
    <li>
      <button
        onClick={onClick}
        className={`
          w-full flex items-center rounded-lg transition-all duration-200
          ${
            isActive
              ? "bg-blue-600 text-white shadow-lg"
              : "text-gray-300 hover:bg-gray-700 hover:text-white"
          }
          ${isCollapsed ? "justify-center p-3" : "space-x-3 p-3"}
        `}
        title={isCollapsed ? item.label : ""}
        aria-label={item.label}
      >
        {item.icon}
        {!isCollapsed && <span className="font-medium">{item.label}</span>}
      </button>
    </li>
  );
});

MenuItem.displayName = "MenuItem";

// 🔥 COMPONENTE MEMOIZADO PARA SIDEBAR
const Sidebar = React.memo(
  ({
    collapsed,
    onToggle,
    menuItems,
    tablaActiva,
    onTabChange,
    user,
    isAdmin,
    onLogout,
  }) => {
    return (
      <div
        className={`
        bg-gray-800 border-r border-gray-700 transition-all duration-300 ease-in-out
        ${collapsed ? "w-20" : "w-64"}
        flex flex-col
      `}
      >
        <div
          className={`flex items-center ${
            collapsed ? "justify-center p-3" : "justify-between p-4"
          } border-b border-gray-700`}
        >
          {!collapsed && (
            <h1 className="text-xl font-bold text-white">PrinterManager</h1>
          )}
          <button
            onClick={onToggle}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            aria-label={collapsed ? "Expandir menú" : "Colapsar menú"}
          >
            {collapsed ? (
              <IoIosArrowDropright className="text-xl" />
            ) : (
              <IoIosArrowDropleft className="text-xl" />
            )}
          </button>
        </div>

        <nav className="flex-1 p-4">
          <ul className="space-y-3">
            {menuItems.map((item) => (
              <MenuItem
                key={item.id}
                item={item}
                isActive={tablaActiva === item.id}
                isCollapsed={collapsed}
                onClick={() => onTabChange(item.id)}
              />
            ))}
          </ul>
        </nav>

        {!collapsed && (
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
              onClick={onLogout}
              className="w-full flex items-center space-x-2 p-2 text-gray-300 hover:bg-gray-700 hover:text-white rounded-lg transition-colors"
              aria-label="Cerrar sesión"
            >
              <IoIosLogOut className="text-lg" />
              <span className="text-sm">Cerrar Sesión</span>
            </button>
          </div>
        )}
      </div>
    );
  }
);

Sidebar.displayName = "Sidebar";

// 🔥 COMPONENTE MEMOIZADO PARA HEADER
const Header = React.memo(({ tablaActiva, isAdmin, onToggleMenu }) => {
  const getTitle = () => {
    switch (tablaActiva) {
      case "impresoras":
        return "Gestión de Impresoras";
      case "servidores":
        return "Estado del Servidor";
      case "pedidos":
        return "Lista de Pedidos";
      case "censos":
        return "Validador de Censos";
      case "rastreo":
        return "Rastreo de Dispositivos";
      default:
        return "PrinterManager";
    }
  };

  return (
    <header className="bg-gray-800 border-b border-gray-700 p-4">
      <div className="flex items-center justify-center relative">
        <button
          onClick={onToggleMenu}
          className="absolute left-4 p-2 hover:bg-gray-700 rounded-lg transition-colors lg:hidden"
          aria-label="Alternar menú"
        >
          <IoIosMenu className="text-xl" />
        </button>

        <div className="text-center">
          <h1 className="text-xl font-bold text-white">{getTitle()}</h1>
          {!isAdmin && (
            <p className="text-sm text-gray-400 mt-1">
              Acceso limitado - Solo pedidos
            </p>
          )}
        </div>
      </div>
    </header>
  );
});

Header.displayName = "Header";

// 🔥 COMPONENTE MEMOIZADO PARA TABS DE IMPRESORAS
const PrinterTabs = React.memo(({ tipoActiva, onChange }) => {
  const tabs = [
    { id: "principal", label: "Principales" },
    { id: "backup", label: "Backup" },
    { id: "comercial", label: "Comercial" },
  ];

  return (
    <div className="tab-column-header">
      {tabs.map((tab) => (
        <div
          key={tab.id}
          className={`tab-column ${tipoActiva === tab.id ? "active" : ""}`}
          onClick={() => onChange(tab.id)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && onChange(tab.id)}
        >
          {tab.label}
        </div>
      ))}
    </div>
  );
});

PrinterTabs.displayName = "PrinterTabs";

// 🔥 FUNCIÓN PARA GENERAR TEXTO DE PEDIDO (separada para evitar recreación)
const generarTextoPedido = (impresora) => {
  let fechaFormateada = "N/A";
  if (impresora.ultimo_pedido_fecha) {
    const fecha = new Date(impresora.ultimo_pedido_fecha);
    const dia = String(fecha.getDate()).padStart(2, "0");
    const mes = String(fecha.getMonth() + 1).padStart(2, "0");
    const anio = String(fecha.getFullYear()).slice(-2);
    fechaFormateada = `${dia}/${mes}/${anio}`;
  }

  return `
Sucursal: ${impresora.sucursal || "Sucursal Desconocida"}
Modelo: ${impresora.modelo}
Número de Serie: ${impresora.numero_serie ?? "N/A"}
Contador: ${impresora.contador_paginas ?? "N/A"}
Dirección: ${impresora.direccion || "Dirección no especificada"}
Teléfono: 0987 200316
Correo: bryan.medina@surcomercial.com.py
Último Pedido: ${fechaFormateada}
  `.trim();
};

// 🔥 FUNCIÓN PARA COPIAR AL PORTAPAPELES
const copyToClipboard = async (text) => {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
    } else {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const success = document.execCommand("copy");
      document.body.removeChild(textArea);
      if (!success) throw new Error("Fallback copy failed");
    }
    return true;
  } catch (error) {
    console.error("Error copying to clipboard:", error);
    return false;
  }
};

function App() {
  // 🔥 ESTADOS PRINCIPALES
  const [impresoras, setImpresoras] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [editingId, setEditingId] = useState(null);
  const [infoModal, setInfoModal] = useState({ visible: false, data: null });
  const [showLoadingMessage, setShowLoadingMessage] = useState(false);

  // 🔥 PERSISTIR tablaActiva EN localStorage CON LAZY INITIALIZATION
  const [tablaActiva, setTablaActiva] = useState(() => {
    const saved = localStorage.getItem("tablaActiva");
    return saved || "impresoras";
  });

  const [tipoImpresoraActiva, setTipoImpresoraActiva] = useState("principal");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);

  // Estados de autenticación
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState(null);

  // 🔥 HANDLERS OPTIMIZADOS CON useCallback
  const handleTablaActivaChange = useCallback((nuevaTabla) => {
    setTablaActiva(nuevaTabla);
  }, []);

  const actualizarImpresora = useCallback((id, nuevosDatos) => {
    setImpresoras((prev) =>
      prev.map((imp) => (imp.id === id ? { ...imp, ...nuevosDatos } : imp))
    );
  }, []);

  const actualizarTodasImpresoras = useCallback((nuevasImpresoras) => {
    setImpresoras((prevImpresoras) => {
      // 🔥 USAR MAP PARA MEJOR PERFORMANCE CON MUCHAS IMPRESORAS
      const nuevasMap = new Map(nuevasImpresoras.map((n) => [n.id, n]));

      return prevImpresoras.map((impresora) => {
        const impresoraActualizada = nuevasMap.get(impresora.id);
        if (impresoraActualizada) {
          return {
            ...impresora,
            estado: impresoraActualizada.estado,
            ultima_verificacion: impresoraActualizada.ultima_verificacion,
          };
        }
        return impresora;
      });
    });
  }, []);

  // 🔥 FETCH IMPRESORAS OPTIMIZADO
  const fetchImpresoras = useCallback(
    (showMessage = false) => {
      if (!isAdmin) return; // Solo cargar si es admin

      if (showMessage) {
        setShowLoadingMessage(true);
      }

      fetch(URLS + "/api/toners")
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
          return res.json();
        })
        .then((data) => {
          setImpresoras(data.impresoras || []);
        })
        .catch((err) => {
          console.error("Error al obtener datos:", err);
          // Opcional: mostrar error al usuario
        })
        .finally(() => {
          if (showMessage) {
            setTimeout(() => setShowLoadingMessage(false), 500);
          }
        });
    },
    [isAdmin]
  );

  // 🔥 EFFECT PARA CARGA INICIAL Y VERIFICACIÓN DE AUTENTICACIÓN
  useEffect(() => {
    const authStatus = localStorage.getItem("isAuthenticated");
    const adminStatus = localStorage.getItem("isAdmin");
    const userData = localStorage.getItem("user");

    if (authStatus === "true") {
      setIsAuthenticated(true);
      setIsAdmin(adminStatus === "true");
      setUser(userData ? JSON.parse(userData) : null);
    }

    // 🔥 VERIFICAR PARÁMETROS URL
    const urlParams = new URLSearchParams(window.location.search);
    const censoParam = urlParams.get("censo");
    const sectionParam = urlParams.get("section");

    if (censoParam || sectionParam === "censos") {
      setTablaActiva("censos");
    }
  }, []); // Solo se ejecuta una vez al montar

  // 🔥 GUARDAR tablaActiva EN localStorage CUANDO CAMBIE
  useEffect(() => {
    localStorage.setItem("tablaActiva", tablaActiva);
  }, [tablaActiva]);

  // 🔥 EFFECT PARA POLLING DE IMPRESORAS (solo si es admin)
  useEffect(() => {
    let intervalId;

    if (isAuthenticated && isAdmin) {
      fetchImpresoras();
      intervalId = setInterval(() => {
        fetchImpresoras();
      }, 300000); // 5 minutos

      // 🔥 CLEANUP FUNCTION
      return () => {
        if (intervalId) clearInterval(intervalId);
      };
    }
  }, [isAuthenticated, isAdmin, fetchImpresoras]);

  // 🔥 HANDLE LOGIN OPTIMIZADO
  const handleLogin = useCallback(
    (userData, adminStatus, seccionInicial = null) => {
      setUser(userData);
      setIsAuthenticated(true);
      setIsAdmin(adminStatus);

      if (seccionInicial) {
        setTablaActiva(seccionInicial);
      } else if (!adminStatus) {
        setTablaActiva("pedidos");
      }
    },
    []
  );

  // 🔥 HANDLE LOGOUT OPTIMIZADO
  const handleLogout = useCallback(async () => {
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
      localStorage.removeItem("tablaActiva");
      setIsAuthenticated(false);
      setIsAdmin(false);
      setUser(null);
      setTablaActiva("impresoras");
    }
  }, []);

  // 🔥 HANDLE INPUT CHANGE OPTIMIZADO
  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  // 🔥 HANDLE SUBMIT OPTIMIZADO
  const handleSubmit = useCallback(
    async (e) => {
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
        ? `${URLS}/api/impresoras/${editingId}`
        : `${URLS}/api/impresoras`;

      try {
        const response = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.message || "Error en la respuesta del servidor"
          );
        }

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
        setFormData(INITIAL_FORM_DATA);
        setEditingId(null);
      } catch (err) {
        console.error("Error al guardar:", err);
        Swal.fire({
          title: "Error",
          text: err.message || "Hubo un problema al guardar la impresora.",
          icon: "error",
          background: "#2c2c2c",
          color: "#fff",
          confirmButtonColor: "#d33",
        });
      }
    },
    [editingId, formData, fetchImpresoras]
  );

  // 🔥 HANDLE DELETE OPTIMIZADO
  const handleDelete = useCallback(
    async (id) => {
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
          const response = await fetch(`${URLS}/api/impresoras/${id}`, {
            method: "DELETE",
          });

          if (!response.ok) throw new Error("Error al eliminar");

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
    },
    [fetchImpresoras]
  );

  // 🔥 HANDLE EDIT OPTIMIZADO
  const handleEdit = useCallback((impresora) => {
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
  }, []);

  // 🔥 HANDLE COPY PEDIDO OPTIMIZADO
  const handleCopyPedido = useCallback(
    async (impresora) => {
      const textoParaCopiar = generarTextoPedido(impresora);

      const confirmacion = await Swal.fire({
        title: "¿Confirmar pedido de tóner?",
        html: `<pre style="text-align:left; white-space: pre-wrap; word-wrap: break-word;">${textoParaCopiar}</pre>`,
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
          const copySuccess = await copyToClipboard(textoParaCopiar);

          if (!copySuccess) {
            throw new Error("Error al copiar al portapapeles");
          }

          const response = await fetch(URLS + "/api/pedido", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ impresora_id: impresora.id }),
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
    },
    [fetchImpresoras]
  );

  // 🔥 MENU ITEMS MEMOIZADO
  const menuItems = useMemo(() => {
    const baseItems = isAdmin
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
          {
            id: "rastreo",
            label: "Rastreo",
            icon: <FiNavigation className="text-2xl" />,
          },
        ]
      : [
          {
            id: "pedidos",
            label: "Pedidos",
            icon: <IoIosCart className="text-2xl" />,
          },
        ];

    // 🔥 FREEZE EL ARRAY PARA EVITAR MUTACIONES ACCIDENTALES
    return Object.freeze(baseItems);
  }, [isAdmin]);

  // 🔥 RESET FORM FUNCTION
  const resetForm = useCallback(() => {
    setFormData(INITIAL_FORM_DATA);
    setEditingId(null);
    setShowModal(false);
  }, []);

  // 🔥 TOGGLE SIDEBAR FUNCTION
  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed((prev) => !prev);
  }, []);

  // Mostrar login si no está autenticado
  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      {/* Sidebar Optimizado */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={toggleSidebar}
        menuItems={menuItems}
        tablaActiva={tablaActiva}
        onTabChange={handleTablaActivaChange}
        user={user}
        isAdmin={isAdmin}
        onLogout={handleLogout}
      />

      {/* Contenido Principal */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header Optimizado */}
        <Header
          tablaActiva={tablaActiva}
          isAdmin={isAdmin}
          onToggleMenu={toggleSidebar}
        />

        {/* Contenido - Menos espacio entre header y contenido */}
        <main className="flex-1 overflow-auto bg-gray-900 pt-2">
          {showLoadingMessage && <LoadingModal />}

          {/* Botón Agregar centrado - solo para impresoras y solo para admin */}
          {tablaActiva === "impresoras" && isAdmin && (
            <div className="flex justify-center mb-4">
              <button
                onClick={() => setShowModal(true)}
                className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 whitespace-nowrap"
                aria-label="Agregar nueva impresora"
              >
                <IoIosAdd className="text-lg" />
                <span>Agregar Impresora</span>
              </button>
            </div>
          )}

          {/* Tabs en columnas estilo original - SOLO para impresoras y solo para admin */}
          {tablaActiva === "impresoras" && isAdmin && (
            <PrinterTabs
              tipoActiva={tipoImpresoraActiva}
              onChange={setTipoImpresoraActiva}
            />
          )}

          {/* 🔥 CONTENIDO PRINCIPAL CON SUSPENSE PARA LAZY LOADING */}
          <Suspense
            fallback={
              <div className="flex justify-center items-center h-64">
                <div className="text-gray-400">Cargando...</div>
              </div>
            }
          >
            {tablaActiva === "impresoras" && isAdmin && (
              <PrinterTable
                impresoras={impresoras}
                tipo={tipoImpresoraActiva}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onInfo={(data) => setInfoModal({ visible: true, data })}
                onCopy={handleCopyPedido}
                onUpdatePrinter={actualizarImpresora}
                onUpdateAllPrinters={actualizarTodasImpresoras}
              />
            )}

            {tablaActiva === "servidores" && isAdmin && (
              <div id="server-status">
                <ServerStatusTable />
              </div>
            )}

            {tablaActiva === "pedidos" && <PedidosSection urls={URLS} />}

            {tablaActiva === "censos" && isAdmin && (
              <div id="censos">
                <Censo />
              </div>
            )}

            {tablaActiva === "rastreo" && isAdmin && (
              <div id="rastreo">
                <CellManager />
              </div>
            )}
          </Suspense>
        </main>
      </div>

      {/* Modales */}
      {showModal && (
        <PrinterForm
          formData={formData}
          onChange={handleInputChange}
          onSubmit={handleSubmit}
          onClose={resetForm}
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

// 🔥 EXPORTAR CON REACT.MEMO
export default React.memo(App);
