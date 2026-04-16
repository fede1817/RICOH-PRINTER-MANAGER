import React, { useState, useEffect } from "react";
import {
  IoIosAdd,
  IoIosDesktop,
  IoIosCheckmarkCircle,
  IoIosCloseCircle,
  IoIosTrash,
  IoIosRefresh,
} from "react-icons/io";
import Swal from "sweetalert2";
import { useAuth } from "../context/AuthContext";

const PerifericosSection = ({ urls }) => {
  const { user1 } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState("solicitudes"); // solicitudes o stock

  // Estados Periféricos (Stock)
  const [perifericos, setPerifericos] = useState([]);
  const [loadingStock, setLoadingStock] = useState(false);

  // Estados Solicitudes
  const [solicitudes, setSolicitudes] = useState([]);
  const [loadingSolicitudes, setLoadingSolicitudes] = useState(false);
  
  // Estado Formulario Solicitud
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    periferico_id: "",
    sucursal: "",
    cantidad: 1,
  });

  // Estado Formulario Nuevo Periférico
  const [showPerifericoForm, setShowPerifericoForm] = useState(false);
  const [perifericoData, setPerifericoData] = useState({
    nombre: "",
    tipo: "",
    stock: 0,
    sucursal: "CENT",
  });

  const sucursales = ['CENT', 'CDE', 'ENC', 'CAAG', 'PJC', 'SANT', 'MIS', 'CONC'];

  useEffect(() => {
    const adminStatus = localStorage.getItem("isAdmin");
    setIsAdmin(adminStatus === "true");
    
    // Al cargar el componente siempre traemos la data necesaria
    fetchPerifericos();
    fetchSolicitudes();
  }, [urls]);

  // ===================================
  // LÓGICA DE STOCK (PERIFÉRICOS)
  // ===================================
  const fetchPerifericos = async () => {
    setLoadingStock(true);
    try {
      const response = await fetch(`${urls}/perifericos`);
      if (response.ok) {
        const data = await response.json();
        setPerifericos(data.perifericos || []);
      }
    } catch (error) {
      console.error("Error al cargar periféricos:", error);
    } finally {
      setLoadingStock(false);
    }
  };

  const handleCreatePeriferico = async (e) => {
    e.preventDefault();
    if (!perifericoData.nombre || !perifericoData.tipo) {
      return Swal.fire({
        icon: "warning",
        title: "Campos incompletos",
        text: "Nombre y tipo son obligatorios.",
        background: "#2c2c2c", color: "#fff"
      });
    }

    try {
      const response = await fetch(`${urls}/perifericos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(perifericoData)
      });

      if (response.ok) {
        Swal.fire({
          icon: "success", title: "Periférico Creado",
          background: "#2c2c2c", color: "#fff"
        });
        setShowPerifericoForm(false);
        setPerifericoData({ nombre: "", tipo: "", stock: 0, sucursal: "CENT" });
        fetchPerifericos();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const updateStock = async (id, newStock) => {
    try {
      const response = await fetch(`${urls}/perifericos/${id}/stock`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stock: newStock })
      });
      if (response.ok) fetchPerifericos();
    } catch (error) {
      console.error(error);
    }
  };

  const deletePeriferico = async (id) => {
    const res = await Swal.fire({
      title: "¿Eliminar periférico?",
      text: "Se perderá el registro",
      icon: "warning",
      showCancelButton: true,
      background: "#2c2c2c", color: "#fff"
    });
    if (res.isConfirmed) {
      try {
        await fetch(`${urls}/perifericos/${id}`, { method: "DELETE" });
        Swal.fire({ icon: "success", title: "Eliminado", background: "#2c2c2c", color: "#fff" });
        fetchPerifericos();
      } catch (error) {
        console.error(error);
      }
    }
  };


  // ===================================
  // LÓGICA DE SOLICITUDES
  // ===================================
  const fetchSolicitudes = async () => {
    setLoadingSolicitudes(true);
    try {
      const response = await fetch(`${urls}/perifericos/solicitudes`);
      if (response.ok) {
        const data = await response.json();
        setSolicitudes(data.solicitudes || []);
      }
    } catch (error) {
      console.error("Error al cargar solicitudes:", error);
    } finally {
      setLoadingSolicitudes(false);
    }
  };

  const handleCreateSolicitud = async (e) => {
    e.preventDefault();
    if (!formData.periferico_id || !formData.sucursal || formData.cantidad < 1) {
      return Swal.fire({
        icon: "warning",
        title: "Campos incompletos",
        background: "#2c2c2c", color: "#fff"
      });
    }

    // 🔥 VALIDACIÓN DE STOCK EN FRONTEND
    const seleccionado = perifericos.find(p => p.id === parseInt(formData.periferico_id));
    if (seleccionado && seleccionado.stock < formData.cantidad) {
      return Swal.fire({
        icon: "error",
        title: "Stock Insuficiente",
        text: `No hay suficiente stock para este periférico. Disponible: ${seleccionado.stock}`,
        background: "#2c2c2c", color: "#fff"
      });
    }

    const payload = {
      ...formData,
      solicitante: user1?.nombrepersona || "Sin especificar"
    };

    try {
      const response = await fetch(`${urls}/perifericos/solicitudes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        Swal.fire({
          icon: "success", title: "Solicitud enviada",
          background: "#2c2c2c", color: "#fff"
        });
        setShowForm(false);
        setFormData({ periferico_id: "", sucursal: "", cantidad: 1 });
        fetchSolicitudes();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const procesarSolicitud = async (id) => {
    try {
      const res = await fetch(`${urls}/perifericos/solicitudes/${id}/procesar`, { method: "PUT" });
      if (res.ok) {
        Swal.fire({ icon: "success", title: "Procesado", background: "#2c2c2c", color: "#fff" });
        fetchSolicitudes();
        fetchPerifericos(); // Actualizar el stock
      } else {
        const err = await res.json();
        Swal.fire({ icon: "error", title: "Error", text: err.error, background: "#2c2c2c", color: "#fff" });
      }
    } catch (error) {
      console.error(error);
    }
  };

  const rechazarSolicitud = async (id) => {
    try {
      const res = await fetch(`${urls}/perifericos/solicitudes/${id}/rechazar`, { method: "PUT" });
      if (res.ok) fetchSolicitudes();
    } catch (error) {
      console.error(error);
    }
  };

  const volverAPendiente = async (id) => {
    const res = await Swal.fire({
      title: "¿Volver a pendiente?",
      text: "Si estaba aprobada, el stock se reintegrará automáticamente.",
      icon: "question",
      showCancelButton: true,
      background: "#2c2c2c", color: "#fff"
    });
    
    if (res.isConfirmed) {
      try {
        const response = await fetch(`${urls}/perifericos/solicitudes/${id}/pendiente`, { method: "PUT" });
        if (response.ok) {
          Swal.fire({ icon: "success", title: "Estado actualizado", background: "#2c2c2c", color: "#fff" });
          fetchSolicitudes();
          fetchPerifericos();
        }
      } catch (error) {
        console.error(error);
      }
    }
  };

  const eliminarSolicitud = async (id) => {
    const res = await Swal.fire({
      title: "¿Eliminar solicitud?",
      text: "Esta acción no se puede deshacer.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      background: "#2c2c2c", color: "#fff"
    });

    if (res.isConfirmed) {
      try {
        const response = await fetch(`${urls}/perifericos/solicitudes/${id}`, { method: "DELETE" });
        if (response.ok) {
          Swal.fire({ icon: "success", title: "Solicitud eliminada", background: "#2c2c2c", color: "#fff" });
          fetchSolicitudes();
          fetchPerifericos();
        }
      } catch (error) {
        console.error(error);
      }
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <IoIosDesktop className="text-blue-500" />
          Gestión de Periféricos
        </h2>

        <div className="flex gap-2">
          <button 
            onClick={() => { fetchPerifericos(); fetchSolicitudes(); }} 
            className="p-2 bg-gray-700 hover:bg-gray-600 rounded text-white"
            title="Refrescar"
          >
            <IoIosRefresh className="text-xl" />
          </button>
        </div>
      </div>

      {isAdmin && (
        <div className="flex border-b border-gray-700 mb-6">
          <button
            className={`px-4 py-2 font-medium ${activeTab === 'solicitudes' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-400 hover:text-gray-300'}`}
            onClick={() => setActiveTab('solicitudes')}
          >
            Solicitudes de Periféricos
          </button>
          <button
            className={`px-4 py-2 font-medium ${activeTab === 'stock' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-400 hover:text-gray-300'}`}
            onClick={() => setActiveTab('stock')}
          >
            Inventario / Stock
          </button>
        </div>
      )}

      {/* ======================================= */}
      {/* PESTAÑA DE SOLICITUDES                  */}
      {/* ======================================= */}
      {(!isAdmin || activeTab === "solicitudes") && (
        <div>
          {!showForm ? (
            <>
              <div className="mb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <button
                  onClick={() => setShowForm(true)}
                  className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <IoIosAdd className="text-xl" />
                  <span>Cargar Solicitud</span>
                </button>
              </div>

              <div className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-900 border-b border-gray-700 text-gray-300">
                        <th className="p-3">Fecha</th>
                        <th className="p-3">Solicitante</th>
                        <th className="p-3">Sucursal</th>
                        <th className="p-3">Periférico</th>
                        <th className="p-3">Cant.</th>
                        <th className="p-3">Estado</th>
                        {isAdmin && <th className="p-3 text-center">Acciones</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {solicitudes.length === 0 ? (
                        <tr>
                          <td colSpan={isAdmin ? 7 : 6} className="p-4 text-center text-gray-500">
                            No hay solicitudes registradas
                          </td>
                        </tr>
                      ) : (
                        solicitudes.map(sol => (
                          <tr key={sol.id} className="border-b border-gray-700 hover:bg-gray-750">
                            <td className="p-3 text-sm">{new Date(sol.fecha_solicitud).toLocaleDateString()}</td>
                            <td className="p-3">{sol.solicitante}</td>
                            <td className="p-3">{sol.sucursal}</td>
                            <td className="p-3">
                              <div className="font-semibold">{sol.modelo_periferico_display}</div>
                              <div className="text-xs text-gray-400">{sol.tipo_periferico_display}</div>
                            </td>
                            <td className="p-3">{sol.cantidad}</td>
                            <td className="p-3">
                              <span className={`px-2 py-1 rounded text-xs font-medium
                                ${sol.estado === 'aprobado' ? 'bg-green-900/50 text-green-400' :
                                  sol.estado === 'rechazado' ? 'bg-red-900/50 text-red-400' :
                                  'bg-yellow-900/50 text-yellow-400'}`}>
                                {sol.estado.toUpperCase()}
                              </span>
                            </td>
                            {isAdmin && (
                              <td className="p-3">
                                <div className="flex justify-center gap-2">
                                  {sol.estado === 'pendiente' ? (
                                    <>
                                      <button onClick={() => procesarSolicitud(sol.id)} className="p-1.5 bg-green-900/50 text-green-400 rounded hover:bg-green-800/50" title="Aprobar">
                                        <IoIosCheckmarkCircle />
                                      </button>
                                      <button onClick={() => rechazarSolicitud(sol.id)} className="p-1.5 bg-red-900/50 text-red-400 rounded hover:bg-red-800/50" title="Rechazar">
                                        <IoIosCloseCircle />
                                      </button>
                                    </>
                                  ) : (
                                    <>
                                      <button onClick={() => volverAPendiente(sol.id)} className="p-1.5 bg-blue-900/50 text-blue-400 rounded hover:bg-blue-800/50" title="Volver a Pendiente">
                                        <IoIosRefresh />
                                      </button>
                                      <button onClick={() => eliminarSolicitud(sol.id)} className="p-1.5 bg-red-900/50 text-red-400 rounded hover:bg-red-800/50" title="Eliminar Solicitud">
                                        <IoIosTrash />
                                      </button>
                                    </>
                                  )}
                                </div>
                              </td>
                            )}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-gray-800 p-6 rounded-lg max-w-2xl mx-auto border border-gray-700">
              <h3 className="text-xl font-semibold mb-4 border-b border-gray-700 pb-2">Nueva Solicitud</h3>
              <form onSubmit={handleCreateSolicitud} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Sucursal</label>
                  <select
                    value={formData.sucursal}
                    onChange={e => setFormData({ ...formData, sucursal: e.target.value })}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white"
                    required
                  >
                    <option value="">Seleccione Sucursal</option>
                    {sucursales.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Periférico</label>
                  <select
                    value={formData.periferico_id}
                    onChange={e => setFormData({ ...formData, periferico_id: e.target.value })}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white"
                    required
                  >
                    <option value="">Seleccione Periférico</option>
                    {perifericos.map(p => (
                      <option key={p.id} value={p.id}>{p.nombre} ({p.tipo}) - Stock: {p.stock}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Cantidad</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.cantidad}
                    onChange={e => setFormData({ ...formData, cantidad: parseInt(e.target.value) })}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white"
                    required
                  />
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg">Cancelar</button>
                  <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">Enviar Solicitud</button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* ======================================= */}
      {/* PESTAÑA DE INVENTARIO/STOCK             */}
      {/* ======================================= */}
      {isAdmin && activeTab === "stock" && (
        <div>
           {!showPerifericoForm ? (
            <>
              <div className="mb-4">
                <button
                  onClick={() => setShowPerifericoForm(true)}
                  className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <IoIosAdd className="text-xl" />
                  <span>Nuevo Periférico</span>
                </button>
              </div>

              <div className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-900 border-b border-gray-700 text-gray-300">
                        <th className="p-3">Nombre / Modelo</th>
                        <th className="p-3">Tipo</th>
                        <th className="p-3">Sucursal Asignada</th>
                        <th className="p-3 text-center">Stock Actual</th>
                        <th className="p-3 text-center">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {perifericos.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-4 text-center text-gray-500">
                            No hay periféricos en el inventario
                          </td>
                        </tr>
                      ) : (
                        perifericos.map(per => (
                          <tr key={per.id} className="border-b border-gray-700 hover:bg-gray-750">
                            <td className="p-3 font-semibold">{per.nombre}</td>
                            <td className="p-3">{per.tipo}</td>
                            <td className="p-3">{per.sucursal}</td>
                            <td className="p-3 text-center">
                              <input 
                                type="number" 
                                className="w-20 bg-gray-900 border border-gray-600 rounded px-2 py-1 text-center"
                                defaultValue={per.stock}
                                onBlur={(e) => updateStock(per.id, parseInt(e.target.value))}
                              />
                            </td>
                            <td className="p-3">
                              <div className="flex justify-center">
                                <button onClick={() => deletePeriferico(per.id)} className="p-1.5 text-red-500 hover:bg-gray-700 rounded" title="Eliminar">
                                  <IoIosTrash />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
           ): (
            <div className="bg-gray-800 p-6 rounded-lg max-w-2xl mx-auto border border-gray-700">
              <h3 className="text-xl font-semibold mb-4 border-b border-gray-700 pb-2">Registrar Nuevo Periférico</h3>
              <form onSubmit={handleCreatePeriferico} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Nombre o Modelo</label>
                  <input
                    type="text"
                    value={perifericoData.nombre}
                    onChange={e => setPerifericoData({ ...perifericoData, nombre: e.target.value })}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white"
                    placeholder="Ej. Teclado Mecánico Redragon"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Tipo de Periférico</label>
                  <input
                    type="text"
                    value={perifericoData.tipo}
                    onChange={e => setPerifericoData({ ...perifericoData, tipo: e.target.value })}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white"
                    placeholder="Ej. Teclado, Mouse, Auricular..."
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Sucursal (Almacén Central)</label>
                  <select
                    value={perifericoData.sucursal}
                    onChange={e => setPerifericoData({ ...perifericoData, sucursal: e.target.value })}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white"
                  >
                    {sucursales.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Stock Inicial</label>
                  <input
                    type="number"
                    min="0"
                    value={perifericoData.stock}
                    onChange={e => setPerifericoData({ ...perifericoData, stock: parseInt(e.target.value) })}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <button type="button" onClick={() => setShowPerifericoForm(false)} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg">Cancelar</button>
                  <button type="submit" className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg">Guardar Registro</button>
                </div>
              </form>
            </div>
           )}
        </div>
      )}

    </div>
  );
};

export default PerifericosSection;
