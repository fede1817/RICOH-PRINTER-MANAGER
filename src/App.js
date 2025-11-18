import React, { useEffect, useState } from "react";
import "./App.css";
import PrinterTable from "./components/PrinterTable";
import PrinterForm from "./components/PrinterForm";
import InfoModal from "./components/InfoModal";
import LoadingModal from "./components/LoadingModal";
import Swal from "sweetalert2";
import {
  IoIosAdd,
  IoIosPrint,
  IoIosPulse,
  IoIosMenu,
  IoIosArrowDropleft,
  IoIosArrowDropright,
} from "react-icons/io";
import ServerStatusTable from "./components/ServerStatusTable";

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
  const [tablaActiva, setTablaActiva] = useState("impresoras");
  const [tipoImpresoraActiva, setTipoImpresoraActiva] = useState("principal");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const urls = "http://192.168.8.166:3001";

  // ✅ Función para cargar impresoras
  const fetchImpresoras = (showMessage = false) => {
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
    fetchImpresoras();
    const interval = setInterval(() => {
      fetchImpresoras();
    }, 3000);
    return () => clearInterval(interval);
  }, []);

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

  // Opciones simplificadas del sidebar
  const menuItems = [
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
  ];

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
                  onClick={() => setTablaActiva(item.id)}
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
              </h1>
            </div>
          </div>
        </header>

        {/* Contenido - Menos espacio entre header y contenido */}
        <main className="flex-1 overflow-auto bg-gray-900 pt-2">
          {showLoadingMessage && <LoadingModal />}

          {/* Botón Agregar centrado - solo para impresoras */}
          {tablaActiva === "impresoras" && (
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

          {/* Tabs en columnas estilo original - SOLO para impresoras */}
          {tablaActiva === "impresoras" && (
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
            {tablaActiva === "impresoras" && (
              <PrinterTable
                impresoras={impresoras}
                tipo={tipoImpresoraActiva}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onInfo={(data) => setInfoModal({ visible: true, data })}
                onCopy={handleCopyPedido}
              />
            )}

            {tablaActiva === "servidores" && (
              <div id="server-status">
                <ServerStatusTable />
              </div>
            )}
          </div>
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
