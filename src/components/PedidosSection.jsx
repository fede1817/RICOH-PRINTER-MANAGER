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
  IoIosArrowUp,
  IoIosArrowDown,
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
    cantidad: "",
    toner_modelo: "" // 🔥 NUEVO CAMPO PARA EL MODELO DE TONER
  });
  const [pedidos, setPedidos] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // 🔥 ESTADOS PARA PAGINACIÓN Y ORDENAMIENTO
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: 'ascending'
  });

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
    'CENT',
    "CDE",
    "ENC",
    "CAAG",
    'PJC',
    'SANT',
    'MIS',
    'CONC',
  ];

  // 🔥 MAPEO COMPLETO DE MODELOS DE IMPRESORA A TONERS
const modelosYToners = {
  "HP LaserJet Pro MFP M135w": {
    modelos: ["HP LaserJet Pro MFP M135w"],
    toner: "HP 105A (W1105A)",
    tipo: "Blanco y negro"
  },
  "HP LaserJet P1102w": {
    modelos: ["HP LaserJet P1102w"],
    toner: "HP 85A (CE285A)",
    tipo: "Blanco y negro"
  },
  "HP LaserJet M111w": {
    modelos: ["HP LaserJet M111w"],
    toner: "HP 150A (W1500A)",
    tipo: "Blanco y negro"
  },
  "HP LaserJet Pro M107w": {
    modelos: ["HP LaserJet Pro M107w"],
    toner: "HP 105A (W1105A)",
    tipo: "Blanco y negro"
  },
  "HP LaserJet Pro MFP M201": {
    modelos: ["HP LaserJet Pro MFP M201", "HP LaserJet Pro M201"],
    toner: "HP 83A (CF283A)",
    tipo: "Blanco y negro"
  },
  "HP DESKJET INK ADVANTAGE 3775": {
    modelos: ["HP DESKJET INK ADVANTAGE 3775"],
    toner: "HP 664 (F6U19AL)",
    tipo: "Color"
  },
  "HP LaserJet Pro M203": {
    modelos: ["HP LaserJet Pro M203"],
    toner: "HP 83A (CF283A)",
    tipo: "Blanco y negro"
  },
  "HP LaserJet Pl 102w": {
    modelos: ["HP LaserJet P1102w", "HP LaserJet PL 102w"],
    toner: "HP 85A (CE285A)",
    tipo: "Blanco y negro"
  },
  "HP DESKJET 2130": {
    modelos: ["HP DESKJET 2130"],
    toner: "HP 664 (F6U19AL)",
    tipo: "Color"
  },
  "HP DESKJET 2700": {
    modelos: ["HP DESKJET 2700"],
    toner: "HP 667",
    tipo: "Color"
  },

  // 🔥 NUEVO — modelo que pediste
  "HP LaserJet Pro M127FN": {
    modelos: ["HP LaserJet Pro M127FN"],
    toner: "HP 83A",
    tipo: "Blanco y negro"
  },

  "HP Deskjet Ink Advantage 2375": {
    modelos: ["HP Deskjet Ink Advantage 2375"],
    toner: "HP 667",
    tipo: "Color"
  },
  "HP LaserJet Pro M203dw": {
    modelos: ["HP LaserJet Pro M203dw"],
    toner: "HP 30A",
    tipo: "Blanco y negro"
  },
  "HP DeskJet 2775": {
    modelos: ["HP DeskJet 2775"],
    toner: "HP 667",
    tipo: "Color"
  },
  "HP LaserJet Pro M102w": {
    modelos: ["HP LaserJet Pro M102w"],
    toner: "HP 17A (CF217A)", // CORREGIDO
    tipo: "Blanco y negro"
  },
  "HP LaserJet Pro M201dw": {
    modelos: ["HP LaserJet Pro M201dw"],
    toner: "HP 83A (CF283A)",
    tipo: "Blanco y negro"
  },

  // 🔥 NUEVO — HP DeskJet Ink Advantage 3635
  "HP DeskJet Ink Advantage 3635": {
    modelos: ["HP DeskJet Ink Advantage 3635"],
    toner: "HP 664 (F6U19AL)",
    tipo: "Color"
  },
  "HP LaserJet M111a": {
    modelos: ["HP LaserJet M111a"],
    toner: "HP 150A (W1500A)",
    tipo: "Blanco y negro"
  }
};




  // 🔥 FUNCIÓN PARA OBTENER INFORMACIÓN DEL TONER SEGÚN EL MODELO
  const getTonerInfo = (modeloImpresora) => {
    for (const [key, value] of Object.entries(modelosYToners)) {
      if (value.modelos.includes(modeloImpresora)) {
        return {
          toner: value.toner,
          tipo: value.tipo
        };
      }
    }
    return {
      toner: "No especificado",
      tipo: "Blanco y negro"
    };
  };

  // Objeto que mapea cada sucursal con sus modelos de impresora (actualizado con los modelos correctos)
  const modelosPorSucursal = {
    "CENT": [
      "HP LaserJet M111a",
    ],
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
      "HP LaserJet P1102w",
      "HP DESKJET 2130",
      "HP DESKJET 2700",
      "HP LaserJet Pro M127FN"
    ],
    "SANT": [
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

  // 🔥 ACTUALIZAR TONER AUTOMÁTICAMENTE CUANDO CAMBIA EL MODELO
  useEffect(() => {
    if (formData.modelo_impresora) {
      const tonerInfo = getTonerInfo(formData.modelo_impresora);
      setFormData(prev => ({
        ...prev,
        toner_modelo: tonerInfo.toner,
        tipo_toner: tonerInfo.tipo
      }));
    }
  }, [formData.modelo_impresora]);

  // 🔥 FUNCIONES DE PAGINACIÓN Y ORDENAMIENTO
  const handleSort = (key) => {
    let direction = 'ascending';
    
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    } else if (sortConfig.key === key && sortConfig.direction === 'descending') {
      setSortConfig({ key: null, direction: 'ascending' });
      return;
    }
    
    setSortConfig({ key, direction });
    setCurrentPage(1); // Volver a la primera página al ordenar
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) {
      return <IoIosArrowUp className="opacity-30" />;
    }
    return sortConfig.direction === 'ascending' 
      ? <IoIosArrowUp className="text-blue-400" />
      : <IoIosArrowDown className="text-blue-400" />;
  };

  const sortData = (data) => {
    if (!sortConfig.key) return data;

    const sortedData = [...data].sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      // Manejo especial para fechas
      if (sortConfig.key === 'fecha_pedido') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }

      // Manejo especial para cantidades numéricas
      if (sortConfig.key === 'cantidad') {
        aValue = parseInt(aValue);
        bValue = parseInt(bValue);
      }

      // Manejo especial para estado
      if (sortConfig.key === 'estado') {
        const estadoOrden = { 'pendiente': 1, 'aprobado': 2, 'rechazado': 3 };
        aValue = estadoOrden[aValue] || 0;
        bValue = estadoOrden[bValue] || 0;
      }

      // Convertir a string para comparación case-insensitive si no es número
      if (typeof aValue !== 'number') {
        aValue = String(aValue || '').toLowerCase();
        bValue = String(bValue || '').toLowerCase();
      }

      // Comparar
      if (aValue < bValue) {
        return sortConfig.direction === 'ascending' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'ascending' ? 1 : -1;
      }
      return 0;
    });

    return sortedData;
  };

  // 🔥 CALCULAR DATOS PAGINADOS
  const sortedPedidos = sortData(pedidos);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sortedPedidos.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(sortedPedidos.length / itemsPerPage);

  // 🔥 FUNCIÓN PARA CAMBIAR PÁGINA
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // 🔥 FUNCIÓN PARA CAMBIAR ITEMS POR PÁGINA
  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1); // Volver a la primera página
  };

  // 🔥 GENERAR BOTONES DE PAGINACIÓN
  const renderPaginationButtons = () => {
    const buttons = [];
    const maxVisiblePages = 5;

    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    // Ajustar startPage si estamos cerca del final
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    // Botón anterior
    buttons.push(
      <button
        key="prev"
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-3 py-1 bg-gray-700 rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <IoIosArrowBack className="inline" />
      </button>
    );

    // Primera página y puntos suspensivos si es necesario
    if (startPage > 1) {
      buttons.push(
        <button
          key={1}
          onClick={() => handlePageChange(1)}
          className="px-3 py-1 bg-gray-700 rounded hover:bg-gray-600"
        >
          1
        </button>
      );
      if (startPage > 2) {
        buttons.push(
          <span key="ellipsis1" className="px-2 py-1">
            ...
          </span>
        );
      }
    }

    // Páginas visibles
    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`px-3 py-1 rounded ${
            currentPage === i 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-700 hover:bg-gray-600'
          }`}
        >
          {i}
        </button>
      );
    }

    // Última página y puntos suspensivos si es necesario
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        buttons.push(
          <span key="ellipsis2" className="px-2 py-1">
            ...
          </span>
        );
      }
      buttons.push(
        <button
          key={totalPages}
          onClick={() => handlePageChange(totalPages)}
          className="px-3 py-1 bg-gray-700 rounded hover:bg-gray-600"
        >
          {totalPages}
        </button>
      );
    }

    // Botón siguiente
    buttons.push(
      <button
        key="next"
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-3 py-1 bg-gray-700 rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <IoIosArrowForward className="inline" />
      </button>
    );

    return buttons;
  };

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
        modelo_impresora: "",
        toner_modelo: "",
        tipo_toner: ""
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
        background: "#2c2c2c",
        color: "#fff",
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
      // 🔥 INCLUIR EL MODELO DE TONER EN EL ENVÍO
      const datosEnvio = {
        ...formData,
        toner_modelo: formData.toner_modelo || getTonerInfo(formData.modelo_impresora).toner
      };

      const response = await fetch(`${urls}/api/pedidos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(datosEnvio),
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
          cantidad: "",
          toner_modelo: ""
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

    // 🔥 INCLUIR EL MODELO DE TONER EN EL EXCEL
    const datosExcel = pedidosPendientes.map(pedido => ({
      'SOLICITANTE': pedido.solicitante.toUpperCase(),
      'SUCURSAL': pedido.sucursal,
      'MODELO DE IMPRESORA': pedido.modelo_impresora,
      'MODELO DE TONER': pedido.toner_modelo || getTonerInfo(pedido.modelo_impresora).toner,
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
        if (C === 5) { // Columna de cantidad (ahora en posición 5 por la nueva columna)
          ws[cellAddress].s.alignment = { horizontal: "center", vertical: "center" };
        }
      }
    }
    
    // 🔥 AJUSTAR ANCHOS DE COLUMNAS CON LA NUEVA COLUMNA
    const colWidths = [
      { wch: 20 }, // Solicitante
      { wch: 10 }, // Sucursal
      { wch: 35 }, // Modelo Impresora
      { wch: 25 }, // Modelo Toner 🔥 NUEVA COLUMNA
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
      cantidad: "",
      toner_modelo: ""
    });
    setCurrentStep(0);
  };

  const cancelForm = () => {
    setFormData({
      solicitante: "",
      sucursal: "",
      modelo_impresora: "", 
      tipo_toner: "",
      cantidad: "",
      toner_modelo: ""
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
    const tonerInfo = formData.modelo_impresora ? getTonerInfo(formData.modelo_impresora) : null;
    
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
              <div className="space-y-4">
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
                
                {formData.modelo_impresora && tonerInfo && (
                  <div className="p-3 bg-blue-900 rounded-lg border border-blue-700">
                    <div className="flex items-center space-x-2 text-sm">
                      <span className="text-blue-300 font-semibold">Toner asignado:</span>
                      <span className="text-white">{tonerInfo.toner}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm mt-1">
                      <span className="text-blue-300 font-semibold">Tipo:</span>
                      <span className="text-white">{tonerInfo.tipo}</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );

      case 3: // Tipo de Toner
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-center mb-6">Confirmar Tipo de Toner</h2>
            {formData.modelo_impresora && tonerInfo ? (
              <div className="space-y-3">
                <div className="p-4 bg-gray-700 rounded-lg">
                  <div className="text-center mb-3">
                    <p className="text-lg font-semibold text-white">Modelo: {formData.modelo_impresora}</p>
                    <p className="text-blue-300 mt-1">Toner: {tonerInfo.toner}</p>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="flex items-center space-x-3 p-3 bg-gray-600 rounded-lg cursor-pointer">
                      <input
                        type="radio"
                        name="tipo_toner"
                        value={tonerInfo.tipo}
                        checked={formData.tipo_toner === tonerInfo.tipo}
                        onChange={handleInputChange}
                        className="text-blue-500 focus:ring-blue-500"
                        required
                      />
                      <span className="text-white">{tonerInfo.tipo} (Recomendado)</span>
                    </label>
                    
                    {tonerInfo.tipo === "Blanco y negro" && (
                      <label className="flex items-center space-x-3 p-3 bg-gray-600 rounded-lg cursor-pointer">
                        <input
                          type="radio"
                          name="tipo_toner"
                          value="Color"
                          checked={formData.tipo_toner === "Color"}
                          onChange={handleInputChange}
                          className="text-blue-500 focus:ring-blue-500"
                        />
                        <span className="text-white">Color</span>
                      </label>
                    )}
                    {tonerInfo.tipo === "Color" && (
                      <label className="flex items-center space-x-3 p-3 bg-gray-600 rounded-lg cursor-pointer">
                        <input
                          type="radio"
                          name="tipo_toner"
                          value="Blanco y negro"
                          checked={formData.tipo_toner === "Blanco y negro"}
                          onChange={handleInputChange}
                          className="text-blue-500 focus:ring-blue-500"
                        />
                        <span className="text-white">Blanco y negro</span>
                      </label>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center p-4 bg-yellow-600 rounded-lg">
                <p className="text-white">Primero debes seleccionar un modelo de impresora</p>
              </div>
            )}
          </div>
        );

      case 4: // Cantidad
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-center mb-6">Cantidad</h2>
            {formData.modelo_impresora && tonerInfo && (
              <div className="p-3 bg-blue-900 rounded-lg border border-blue-700 mb-4">
                <div className="text-center">
                  <p className="text-white font-semibold">{formData.modelo_impresora}</p>
                  <p className="text-blue-300 text-sm">Toner: {tonerInfo.toner}</p>
                  <p className="text-blue-300 text-sm">Tipo: {formData.tipo_toner}</p>
                </div>
              </div>
            )}
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

  // 🔥 VISTA COMPACTA PERO CON FUENTES MÁS GRANDES
  const renderPedidosList = () => (
    <div className="w-full h-full bg-gray-800 rounded-lg shadow-lg p-4 flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
          title="Hacer nuevo pedido"
        >
          <IoIosAdd className="text-lg" />
          <span className="text-sm">Nuevo Pedido</span>
        </button>
        
        <button
          onClick={descargarExcel}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
          title="Descargar Excel de pedidos pendientes"
        >
          <IoIosDownload className="text-lg" />
          <span className="text-sm">Exportar Excel</span>
        </button>
      </div>

      {/* 🔥 CONTROLES DE PAGINACIÓN SUPERIOR */}
      {pedidos.length > 0 && (
        <div className="flex justify-between items-center mb-3 p-3 bg-gray-700 rounded">
          <div className="text-gray-300 text-sm">
            Mostrando {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, sortedPedidos.length)} de {sortedPedidos.length} pedidos
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <label className="text-gray-300 text-sm">Mostrar:</label>
              <select
                value={itemsPerPage}
                onChange={handleItemsPerPageChange}
                className="bg-gray-600 text-white rounded px-2 py-1 text-sm"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
            
            <div className="flex space-x-1">
              {renderPaginationButtons()}
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mx-auto"></div>
            <p className="text-gray-400 mt-2 text-sm">Cargando pedidos...</p>
          </div>
        </div>
      ) : pedidos.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <IoIosList className="text-5xl text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">No hay pedidos registrados</p>
            <p className="text-gray-500 text-sm mt-1">Haz clic en "Nuevo Pedido" para crear uno</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="overflow-x-auto flex-1">
            <table className="w-full h-full text-white min-w-full">
              <thead className="bg-gray-700">
                <tr>
                  <th 
                    className="py-3 px-3 text-left cursor-pointer hover:bg-gray-600 transition-colors"
                    onClick={() => handleSort('solicitante')}
                    title="Ordenar por solicitante"
                  >
                    <div className="flex items-center space-x-1">
                      <span className="text-sm font-medium">Solicitante</span>
                      {getSortIcon('solicitante')}
                    </div>
                  </th>
                  <th 
                    className="py-3 px-3 text-left cursor-pointer hover:bg-gray-600 transition-colors"
                    onClick={() => handleSort('sucursal')}
                    title="Ordenar por sucursal"
                  >
                    <div className="flex items-center space-x-1">
                      <span className="text-sm font-medium">Sucursal</span>
                      {getSortIcon('sucursal')}
                    </div>
                  </th>
                  <th 
                    className="py-3 px-3 text-left cursor-pointer hover:bg-gray-600 transition-colors"
                    onClick={() => handleSort('modelo_impresora')}
                    title="Ordenar por modelo"
                  >
                    <div className="flex items-center space-x-1">
                      <span className="text-sm font-medium">Modelo</span>
                      {getSortIcon('modelo_impresora')}
                    </div>
                  </th>
                  <th 
                    className="py-3 px-3 text-left cursor-pointer hover:bg-gray-600 transition-colors"
                    onClick={() => handleSort('toner_modelo')}
                    title="Ordenar por toner"
                  >
                    <div className="flex items-center space-x-1">
                      <span className="text-sm font-medium">Toner</span>
                      {getSortIcon('toner_modelo')}
                    </div>
                  </th>
                  <th 
                    className="py-3 px-3 text-left cursor-pointer hover:bg-gray-600 transition-colors"
                    onClick={() => handleSort('tipo_toner')}
                    title="Ordenar por tipo"
                  >
                    <div className="flex items-center space-x-1">
                      <span className="text-sm font-medium">Tipo</span>
                      {getSortIcon('tipo_toner')}
                    </div>
                  </th>
                  <th 
                    className="py-3 px-3 text-left cursor-pointer hover:bg-gray-600 transition-colors"
                    onClick={() => handleSort('cantidad')}
                    title="Ordenar por cantidad"
                  >
                    <div className="flex items-center space-x-1">
                      <span className="text-sm font-medium">Cant.</span>
                      {getSortIcon('cantidad')}
                    </div>
                  </th>
                  <th 
                    className="py-3 px-3 text-left cursor-pointer hover:bg-gray-600 transition-colors"
                    onClick={() => handleSort('fecha_pedido')}
                    title="Ordenar por fecha"
                  >
                    <div className="flex items-center space-x-1">
                      <span className="text-sm font-medium">Fecha</span>
                      {getSortIcon('fecha_pedido')}
                    </div>
                  </th>
                  <th 
                    className="py-3 px-3 text-left cursor-pointer hover:bg-gray-600 transition-colors"
                    onClick={() => handleSort('estado')}
                    title="Ordenar por estado"
                  >
                    <div className="flex items-center space-x-1">
                      <span className="text-sm font-medium">Estado</span>
                      {getSortIcon('estado')}
                    </div>
                  </th>
                  <th className="py-3 px-3 text-left text-sm font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {currentItems.map((pedido) => {
                  const tonerInfo = getTonerInfo(pedido.modelo_impresora);
                  return (
                    <tr key={pedido.id} className="hover:bg-gray-700 transition-colors">
                      <td className="py-3 px-3 whitespace-nowrap text-sm">{pedido.solicitante}</td>
                      <td className="py-3 px-3 whitespace-nowrap text-sm">{pedido.sucursal}</td>
                      <td className="py-3 px-3 whitespace-nowrap text-sm">{pedido.modelo_impresora}</td>
                      <td className="py-3 px-3 whitespace-nowrap text-sm text-blue-300 font-medium">
                        {pedido.toner_modelo || tonerInfo.toner}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap text-sm">{pedido.tipo_toner}</td>
                      <td className="py-3 px-3 whitespace-nowrap text-sm text-center">{pedido.cantidad}</td>
                      <td className="py-3 px-3 whitespace-nowrap text-sm">
                        {new Date(pedido.fecha_pedido).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getEstadoColor(pedido.estado)}`}>
                          {getEstadoText(pedido.estado)}
                        </span>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="flex space-x-2">
                          {/* 🔥 BOTONES CON ICONOS MÁS GRANDES */}
                          {isAdmin && pedido.estado === 'pendiente' && (
                            <button
                              onClick={() => procesarPedido(pedido.id)}
                              className="p-2 bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
                              title="Procesar pedido"
                            >
                              <IoIosPlay className="text-base" />
                            </button>
                          )}
                          
                          {isAdmin && pedido.estado === 'aprobado' && (
                            <button
                              onClick={() => volverAPendiente(pedido.id)}
                              className="p-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded transition-colors"
                              title="Volver a pendiente"
                            >
                              <IoIosRefresh className="text-base" />
                            </button>
                          )}
                          
                          <button
                            onClick={() => eliminarPedido(pedido.id)}
                            className="p-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                            title="Eliminar pedido"
                          >
                            <IoIosTrash className="text-base" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* 🔥 CONTROLES DE PAGINACIÓN INFERIOR */}
          {pedidos.length > 0 && (
            <div className="flex justify-between items-center mt-3 p-3 bg-gray-700 rounded">
              <div className="text-gray-300 text-sm">
                Página {currentPage} de {totalPages} - {sortedPedidos.length} pedidos totales
              </div>
              
              <div className="flex space-x-1">
                {renderPaginationButtons()}
              </div>

              <div className="flex items-center space-x-2">
                <label className="text-gray-300 text-sm">Mostrar:</label>
                <select
                  value={itemsPerPage}
                  onChange={handleItemsPerPageChange}
                  className="bg-gray-600 text-white rounded px-2 py-1 text-sm"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  // Vista del formulario de pedidos (sin cambios)
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