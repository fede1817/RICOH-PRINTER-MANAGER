import React, { useState, useEffect } from "react";
import {
  IoIosArrowBack,
  IoIosArrowForward,
  IoIosCart,
  IoIosCheckmarkCircle,
  IoIosCloseCircle,
  IoIosAdd,
  IoIosList,
  IoIosDownload,
  IoIosTrash,
  IoIosPlay,
  IoIosRefresh,
} from "react-icons/io";
import Swal from "sweetalert2";
import * as XLSX from "xlsx";

const PedidosSection = ({urls}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    solicitante: "",
    sucursal: "",
    modelo_impresora: "",
    tipo_toner: "",
    cantidad: ""
  });
  const [pedidos, setPedidos] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // Verificar si el usuario es administrador al cargar el componente
  useEffect(() => {
    const adminStatus = localStorage.getItem('isAdmin');
    setIsAdmin(adminStatus === 'true');
  }, []);

  const steps = [
    {
      title: "Solicitante",
      fields: ["solicitante"]
    },
    {
      title: "Sucursal", 
      fields: ["sucursal"]
    },
    {
      title: "Modelo",
      fields: ["modelo_impresora"]
    },
    {
      title: "Tipo de Toner",
      fields: ["tipo_toner"]
    },
    {
      title: "Cantidad",
      fields: ["cantidad"]
    }
  ];

  const sucursales = [
    "CDE",
    "ENC",
    "CAAG",
    'PJC',
    'SAMT',
    'MIS',
    'CONC',
  ];

  // Objeto que mapea cada sucursal con sus modelos de impresora
  const modelosPorSucursal = {
    "CDE": [
      "HP LaserJet Pro MFP M135w",
      "HP LaserJet P1102w",
      "HP DeskJet Ink Advantage 3635"
    ],
    "ENC": [
      "HP LaserJet Pro M107w",
      "HP LaserJet Pro MFP M201",
      "HP DESKJET INK ADVANTAGE 3775",
      "HP LaserJet M111w"
    ],
    "CAAG": [
      "HP LaserJet Pro M203"
    ],
    "PJC": [
      "HP LaserJet Pl 102w",
      "HP DESKJET 2130",
      "HP DESKJET 2700",
      "HP LaserJet Pro m127FN"
    ],
    "SAMT": [
      "HP LaserJet Pro M107w",
      "HP LaserJet Pro MFP M135w",
      "HP Deskjet Ink Advantage 2375"
    ],
    "MIS": [
      "HP LaserJet Pro M203dw",
      "HP LaserJet P1102w",
      "HP DeskJet 2775",
      "HP LaserJet Pro M102w"
    ],
    "CONC": [
      "HP DeskJet 2775",
      "HP LaserJet Pro M201dw",
      "HP LaserJet Pro M107w"
    ]
  };

  const tiposToner = [
    "Blanco y negro",
    "Color"
  ];

  // Función para obtener los modelos según la sucursal seleccionada
  const getModelosPorSucursal = () => {
    if (!formData.sucursal) return [];
    return modelosPorSucursal[formData.sucursal] || [];
  };

  // Función para validar si el paso actual está completo
  const isStepValid = () => {
    const currentFields = steps[currentStep].fields;
    
    for (let field of currentFields) {
      if (!formData[field] || formData[field].toString().trim() === "") {
        return false;
      }
    }
    
    return true;
  };

  // Cargar pedidos desde la API
  const fetchPedidos = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${urls}/api/pedidos`);
      if (response.ok) {
        const data = await response.json();
        setPedidos(data.pedidos || []);
      }
    } catch (error) {
      console.error('Error al cargar pedidos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!showForm) {
      fetchPedidos();
    }
  }, [showForm]);

  // Resetear modelo_impresora cuando cambia la sucursal
  useEffect(() => {
    if (formData.sucursal) {
      setFormData(prev => ({
        ...prev,
        modelo_impresora: ""
      }));
    }
  }, [formData.sucursal]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const nextStep = () => {
    if (!isStepValid()) {
      Swal.fire({
        icon: 'warning',
        title: 'Campo requerido',
        text: 'Por favor completa todos los campos antes de continuar',
        confirmButtonColor: '#3085d6',
        confirmButtonText: 'Entendido'
      });
      return;
    }

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!isStepValid()) {
      Swal.fire({
        icon: 'warning',
        title: 'Campo requerido',
        text: 'Por favor completa todos los campos antes de enviar el pedido',
        background: "#2c2c2c",
        color: "#fff",
        confirmButtonColor: '#3085d6',
        confirmButtonText: 'Entendido'
      });
      return;
    }

    try {
      const response = await fetch(`${urls}/api/pedidos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await Swal.fire({
          icon: 'success',
          title: '¡Pedido enviado!',
          text: 'Tu pedido ha sido registrado correctamente',
          background: "#2c2c2c",
          color: "#fff",
          confirmButtonColor: '#10B981',
          confirmButtonText: 'Aceptar'
        });
        
        // Reset form y volver a la lista
        setFormData({
          solicitante: "",
          sucursal: "", 
          modelo_impresora: "",
          tipo_toner: "",
          cantidad: ""
        });
        setCurrentStep(0);
        setShowForm(false);
        fetchPedidos(); // Actualizar la lista
      } else {
        const errorData = await response.json();
        await Swal.fire({
          icon: 'error',
          title: 'Error al enviar',
          text: errorData.message || 'Hubo un problema al enviar el pedido',
          background: "#2c2c2c",
          color: "#fff",
          confirmButtonColor: '#EF4444',
          confirmButtonText: 'Entendido'
        });
      }
    } catch (error) {
      console.error('Error:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Error de conexión',
        text: 'No se pudo conectar con el servidor',
         background: "#2c2c2c",
          color: "#fff",
        confirmButtonColor: '#EF4444',
        confirmButtonText: 'Entendido'
      });
    }
  };

  // Función para procesar pedido
  const procesarPedido = async (pedidoId) => {
    try {
      const response = await fetch(`${urls}/api/pedidos/${pedidoId}/procesar`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        await Swal.fire({
          icon: 'success',
          title: 'Pedido procesado',
          text: 'El pedido ha sido marcado como procesado',
          background: "#2c2c2c",
          color: "#fff",
          confirmButtonColor: '#10B981',
          confirmButtonText: 'Aceptar'
        });
        fetchPedidos(); // Actualizar la lista
      } else {
        throw new Error('Error al procesar el pedido');
      }
    } catch (error) {
      console.error('Error:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo procesar el pedido',
        background: "#2c2c2c",
        color: "#fff",
        confirmButtonColor: '#EF4444',
        confirmButtonText: 'Entendido'
      });
    }
  };

  // Función para volver a poner pendiente
  const volverAPendiente = async (pedidoId) => {
    try {
      const response = await fetch(`${urls}/api/pedidos/${pedidoId}/pendiente`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        await Swal.fire({
          icon: 'success',
          title: 'Pedido actualizado',
          text: 'El pedido ha sido marcado como pendiente',
          background: "#2c2c2c",
          color: "#fff",
          confirmButtonColor: '#10B981',
          confirmButtonText: 'Aceptar'
        });
        fetchPedidos(); // Actualizar la lista
      } else {
        throw new Error('Error al actualizar el pedido');
      }
    } catch (error) {
      console.error('Error:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo actualizar el pedido',
        background: "#2c2c2c",
        color: "#fff",
        confirmButtonColor: '#EF4444',
        confirmButtonText: 'Entendido'
      });
    }
  };

  // Función para eliminar pedido
  const eliminarPedido = async (pedidoId) => {
    const result = await Swal.fire({
      title: '¿Eliminar pedido?',
      text: "Esta acción no se puede deshacer",
      icon: 'warning',
      background: "#2c2c2c",
      color: "#fff",
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        const response = await fetch(`${urls}/api/pedidos/${pedidoId}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          await Swal.fire({
            icon: 'success',
            title: 'Pedido eliminado',
            text: 'El pedido ha sido eliminado correctamente',
            background: "#2c2c2c",
            color: "#fff",
            confirmButtonColor: '#10B981',
            confirmButtonText: 'Aceptar'
          });
          fetchPedidos(); // Actualizar la lista
        } else {
          throw new Error('Error al eliminar el pedido');
        }
      } catch (error) {
        console.error('Error:', error);
        await Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo eliminar el pedido',
          background: "#2c2c2c",
          color: "#fff",
          confirmButtonColor: '#EF4444',
          confirmButtonText: 'Entendido'
        });
      }
    }
  };

  // Función para descargar Excel con pedidos pendientes
  const descargarExcel = () => {
    const pedidosPendientes = pedidos.filter(pedido => pedido.estado === 'pendiente');
    
    if (pedidosPendientes.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'No hay datos',
        text: 'No hay pedidos pendientes para exportar',
        background: "#2c2c2c",
        color: "#fff",
        confirmButtonColor: '#3085d6',
        confirmButtonText: 'Entendido'
      });
      return;
    }

    // Preparar datos para Excel con mejor formato
    const datosExcel = pedidosPendientes.map(pedido => ({
      'SOLICITANTE': pedido.solicitante.toUpperCase(),
      'SUCURSAL': pedido.sucursal,
      'MODELO DE IMPRESORA': pedido.modelo_impresora,
      'TIPO DE TONER': pedido.tipo_toner,
      'CANTIDAD': pedido.cantidad,
      'FECHA DE PEDIDO': new Date(pedido.fecha_pedido).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }),
      'ESTADO': 'PENDIENTE'
    }));

    // Crear workbook
    const wb = XLSX.utils.book_new();
    
    // Crear worksheet con datos
    const ws = XLSX.utils.json_to_sheet(datosExcel);
    
    // Estilos y formato para el Excel
    const range = XLSX.utils.decode_range(ws['!ref']);
    
    // Aplicar estilos a los headers
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: C });
      if (!ws[cellAddress]) continue;
      
      // Formato para headers
      ws[cellAddress].s = {
        font: { bold: true, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "4472C4" } },
        alignment: { horizontal: "center", vertical: "center" },
        border: {
          top: { style: "thin", color: { rgb: "000000" } },
          left: { style: "thin", color: { rgb: "000000" } },
          bottom: { style: "thin", color: { rgb: "000000" } },
          right: { style: "thin", color: { rgb: "000000" } }
        }
      };
    }
    
    // Aplicar estilos a las celdas de datos
    for (let R = range.s.r + 1; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
        if (!ws[cellAddress]) continue;
        
        ws[cellAddress].s = {
          border: {
            top: { style: "thin", color: { rgb: "D0D0D0" } },
            left: { style: "thin", color: { rgb: "D0D0D0" } },
            bottom: { style: "thin", color: { rgb: "D0D0D0" } },
            right: { style: "thin", color: { rgb: "D0D0D0" } }
          },
          alignment: { vertical: "center" }
        };
        
        // Formato especial para columna de cantidad
        if (C === 4) { // Columna de cantidad
          ws[cellAddress].s.alignment = { horizontal: "center", vertical: "center" };
        }
      }
    }
    
    // Ajustar anchos de columnas
    const colWidths = [
      { wch: 20 }, // Solicitante
      { wch: 10 }, // Sucursal
      { wch: 35 }, // Modelo
      { wch: 15 }, // Tipo Toner
      { wch: 10 }, // Cantidad
      { wch: 15 }, // Fecha
      { wch: 12 }  // Estado
    ];
    ws['!cols'] = colWidths;

    // Agregar worksheet al workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Pedidos Pendientes');

    // Generar archivo y descargar
    const fecha = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `pedidos_pendientes_${fecha}.xlsx`);

    Swal.fire({
      icon: 'success',
      title: 'Excel descargado',
      text: `Se exportaron ${pedidosPendientes.length} pedidos pendientes`,
      background: "#2c2c2c",
      color: "#fff",
      confirmButtonColor: '#10B981',
      confirmButtonText: 'Aceptar'
    });
  };

  const resetForm = () => {
    setFormData({
      solicitante: "",
      sucursal: "",
      modelo_impresora: "", 
      tipo_toner: "",
      cantidad: ""
    });
    setCurrentStep(0);
  };

  const cancelForm = () => {
    setFormData({
      solicitante: "",
      sucursal: "",
      modelo_impresora: "", 
      tipo_toner: "",
      cantidad: ""
    });
    setCurrentStep(0);
    setShowForm(false);
  };

  const getEstadoColor = (estado) => {
    switch(estado) {
      case 'aprobado': return 'bg-green-500';
      case 'rechazado': return 'bg-red-500';
      default: return 'bg-yellow-600';
    }
  };

  const getEstadoText = (estado) => {
    switch(estado) {
      case 'aprobado': return 'Procesado';
      case 'rechazado': return 'Cancelado';
      default: return 'Pendiente';
    }
  };

  const renderStepContent = () => {
    const step = steps[currentStep];
    const modelosDisponibles = getModelosPorSucursal();
    
    switch(currentStep) {
      case 0: // Solicitante
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-center mb-6">Solicitante</h2>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Nombre y Apellido
              </label>
              <input
                type="text"
                name="solicitante"
                value={formData.solicitante}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ingresa tu nombre completo"
                required
              />
            </div>
          </div>
        );

      case 1: // Sucursal
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-center mb-6">Sucursal</h2>
            <div className="space-y-3">
              {sucursales.map((sucursal) => (
                <label key={sucursal} className="flex items-center space-x-3 p-3 bg-gray-700 rounded-lg hover:bg-gray-600 cursor-pointer">
                  <input
                    type="radio"
                    name="sucursal"
                    value={sucursal}
                    checked={formData.sucursal === sucursal}
                    onChange={handleInputChange}
                    className="text-blue-500 focus:ring-blue-500"
                    required
                  />
                  <span className="text-white">{sucursal}</span>
                </label>
              ))}
            </div>
          </div>
        );

      case 2: // Modelo
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-center mb-6">Modelo de Impresora</h2>
            {!formData.sucursal ? (
              <div className="text-center p-4 bg-yellow-600 rounded-lg">
                <p className="text-white">Primero debes seleccionar una sucursal</p>
              </div>
            ) : (
              <select
                name="modelo_impresora"
                value={formData.modelo_impresora}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Elige un modelo disponible en {formData.sucursal}</option>
                {modelosDisponibles.map((modelo) => (
                  <option key={modelo} value={modelo}>{modelo}</option>
                ))}
              </select>
            )}
          </div>
        );

      case 3: // Tipo de Toner
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-center mb-6">Tipo de Toner</h2>
            <div className="space-y-3">
              {tiposToner.map((tipo) => (
                <label key={tipo} className="flex items-center space-x-3 p-3 bg-gray-700 rounded-lg hover:bg-gray-600 cursor-pointer">
                  <input
                    type="radio"
                    name="tipo_toner"
                    value={tipo}
                    checked={formData.tipo_toner === tipo}
                    onChange={handleInputChange}
                    className="text-blue-500 focus:ring-blue-500"
                    required
                  />
                  <span className="text-white">{tipo}</span>
                </label>
              ))}
            </div>
          </div>
        );

      case 4: // Cantidad
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-center mb-6">Cantidad</h2>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Cantidad de toners
              </label>
              <input
                type="number"
                name="cantidad"
                value={formData.cantidad}
                onChange={handleInputChange}
                min="1"
                max="10"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ingresa la cantidad"
                required
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Vista de lista de pedidos
  const renderPedidosList = () => (
    <div className="w-full h-full bg-gray-800 rounded-lg shadow-lg p-6 flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
        >
          <IoIosAdd className="text-lg" />
          <span>Hacer Pedido</span>
        </button>
        
        <button
          onClick={descargarExcel}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
        >
          <IoIosDownload className="text-lg" />
          <span>Descargar Excel</span>
        </button>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="text-gray-400 mt-2">Cargando pedidos...</p>
          </div>
        </div>
      ) : pedidos.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <IoIosList className="text-6xl text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">No hay pedidos registrados</p>
            <p className="text-gray-500">Haz clic en "Hacer Pedido" para crear uno nuevo</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="overflow-x-auto flex-1">
            <table className="w-full h-full text-white min-w-full">
              <thead className="bg-gray-700">
                <tr>
                  <th className="py-3 px-4 text-left">Solicitante</th>
                  <th className="py-3 px-4 text-left">Sucursal</th>
                  <th className="py-3 px-4 text-left">Modelo</th>
                  <th className="py-3 px-4 text-left">Tipo</th>
                  <th className="py-3 px-4 text-left">Cantidad</th>
                  <th className="py-3 px-4 text-left">Fecha</th>
                  <th className="py-3 px-4 text-left">Estado</th>
                  <th className="py-3 px-4 text-left">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {pedidos.map((pedido) => (
                  <tr key={pedido.id} className="hover:bg-gray-700 transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap">{pedido.solicitante}</td>
                    <td className="py-3 px-4 whitespace-nowrap">{pedido.sucursal}</td>
                    <td className="py-3 px-4 whitespace-nowrap">{pedido.modelo_impresora}</td>
                    <td className="py-3 px-4 whitespace-nowrap">{pedido.tipo_toner}</td>
                    <td className="py-3 px-4 whitespace-nowrap">{pedido.cantidad}</td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {new Date(pedido.fecha_pedido).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getEstadoColor(pedido.estado)}`}>
                        {getEstadoText(pedido.estado)}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex space-x-2">
                        {/* Solo mostrar botón Procesar si es administrador */}
                        {isAdmin && pedido.estado === 'pendiente' && (
                          <button
                            onClick={() => procesarPedido(pedido.id)}
                            className="flex items-center space-x-1 bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-xs transition-colors"
                            title="Procesar pedido"
                          >
                            <IoIosPlay />
                            <span>Procesar</span>
                          </button>
                        )}
                        
                        {/* Solo mostrar botón Volver a Pendiente si es administrador */}
                        {isAdmin && pedido.estado === 'aprobado' && (
                          <button
                            onClick={() => volverAPendiente(pedido.id)}
                            className="flex items-center space-x-1 bg-yellow-600 hover:bg-yellow-700 text-white px-2 py-1 rounded text-xs transition-colors"
                            title="Volver a pendiente"
                          >
                            <IoIosRefresh />
                            <span>Pendiente</span>
                          </button>
                        )}
                        
                        {/* Botón Eliminar visible para todos los usuarios */}
                        <button
                          onClick={() => eliminarPedido(pedido.id)}
                          className="flex items-center space-x-1 bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-xs transition-colors"
                          title="Eliminar pedido"
                        >
                          <IoIosTrash />
                          <span>Eliminar</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );

  // Vista del formulario de pedidos
  const renderForm = () => (
    <div className="max-w-md mx-auto bg-gray-800 rounded-lg shadow-lg p-6">
      {/* Progress Bar */}
      <div className="flex justify-between mb-6">
        {steps.map((step, index) => (
          <div key={index} className="flex flex-col items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              index <= currentStep ? 'bg-blue-500 text-white' : 'bg-gray-600 text-gray-400'
            }`}>
              {index < currentStep ? (
                <IoIosCheckmarkCircle className="text-lg" />
              ) : (
                index + 1
              )}
            </div>
            <span className="text-xs mt-1 text-gray-400">{step.title}</span>
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className="mb-6">
        {renderStepContent()}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <button
          onClick={prevStep}
          disabled={currentStep === 0}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
            currentStep === 0 
              ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
              : 'bg-gray-700 text-white hover:bg-gray-600'
          }`}
        >
          <IoIosArrowBack />
          <span>Atrás</span>
        </button>

        <div className="flex space-x-2">
          <button
            onClick={cancelForm}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Cancelar
          </button>
          
          <button
            onClick={resetForm}
            className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
          >
            Borrar
          </button>
        </div>

        {currentStep < steps.length - 1 ? (
          <button
            onClick={nextStep}
            disabled={!isStepValid()}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              !isStepValid()
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            <span>Siguiente</span>
            <IoIosArrowForward />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <IoIosCheckmarkCircle />
            <span>Enviar</span>
          </button>
        )}
      </div>
    </div>
  );

  return showForm ? renderForm() : renderPedidosList();
};

export default PedidosSection;