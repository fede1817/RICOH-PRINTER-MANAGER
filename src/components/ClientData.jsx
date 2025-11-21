import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import SelectBuscable from './SelectBuscable';
import "./Censo.css"; // Cambiar por Validator.css

const ClientData = ({ 
  clienteData, 
  clienteDataOriginal, 
  copiarTexto, 
  getNombreListaPrecio, 
  getNombreVendedor, 
  getNombreSupervisor, 
  listasPrecio,
  vendedores,  
  supervisores,
  getSubgrupo2Value,
  onEdit 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);

  // 🔥 NUEVO ESTADO para rastrear cambios
  const [camposModificados, setCamposModificados] = useState(new Set());
  const [clienteERP, setClienteERP] = useState(null);

  // 🔥 NUEVOS ESTADOS PARA LOS SELECTS DE CANALES
  const [canalesData, setCanalesData] = useState([]);
  const [gruposUnicos, setGruposUnicos] = useState([]);
  const [subgrupos1Filtrados, setSubgrupos1Filtrados] = useState([]);
  const [subgrupos2Filtrados, setSubgrupos2Filtrados] = useState([]);

  // 🔥 NUEVOS ESTADOS PARA ZONAS Y SUBZONAS
  const [zonasData, setZonasData] = useState([]);
  const [zonasUnicas, setZonasUnicas] = useState([]);
  const [subzonasFiltradas, setSubzonasFiltradas] = useState([]);

  // 🔥 OPCIONES PARA DÍAS DE VISITA
  const opcionesDiasVisita = [
    { value: "0", label: "Domingo" },
    { value: "1", label: "Lunes" },
    { value: "2", label: "Martes" },
    { value: "3", label: "Miércoles" },
    { value: "4", label: "Jueves" },
    { value: "5", label: "Viernes" },
    { value: "6", label: "Sábado" }
  ];

  // 🔥 FUNCIÓN PARA OBTENER EL NOMBRE DEL DÍA
  const obtenerNombreDiaVisita = (codigoDia) => {
    const dia = opcionesDiasVisita.find(d => d.value === codigoDia?.toString());
    return dia ? dia.label : `Día ${codigoDia}`;
  };

  // 🔥 FUNCIÓN PARA OBTENER EL VALOR NUMÉRICO PARA COPIAR
  const getValorDiaVisitaParaCopiar = (diaData) => {
    return diaData?.diavisita?.toString() || "";
  };

  // 🔥 FUNCIÓN PARA MOSTRAR EL DÍA EN MODO VISTA
  const getFieldValueDiaVisita = (data) => {
    return obtenerNombreDiaVisita(data.diavisita) || "No especificado";
  };

  // 🔥 FUNCIÓN PARA OBTENER DATOS DE ZONAS Y SUBZONAS
  const fetchZonasData = async () => {
    try {
      const credentials = btoa(`${"federico.britez@surcomercial.com.py"}:${"Surcomercial.fb"}`);
      
      const response = await fetch(
        `https://apps.mobile.com.py:8443/mbusiness/rest/private/zonaserp?codempresa=15`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${credentials}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setZonasData(data);
        
        // Extraer zonas únicas
        const zonasUnicas = [...new Set(data.map(item => ({
          codzonaerp: item.codzonaerp,
          nombrezona: item.nombrezona
        })))].filter((item, index, self) => 
          index === self.findIndex(t => t.codzonaerp === item.codzonaerp)
        );
        
        setZonasUnicas(zonasUnicas);
        console.log("📊 Datos de zonas cargados:", zonasUnicas);
      }
    } catch (error) {
      console.error("Error cargando datos de zonas:", error);
    }
  };

  // 🔥 FILTRAR SUBZONAS CUANDO CAMBIA LA ZONA
  useEffect(() => {
    if (formData.codzonaerp && zonasData.length > 0) {
      const subzonas = zonasData
        .filter(item => item.codzonaerp === formData.codzonaerp)
        .map(item => ({
          codsubzonaerp: item.codsubzonaerp,
          nombresubzona: item.nombresubzona
        }))
        .filter((item, index, self) => 
          index === self.findIndex(t => t.codsubzonaerp === item.codsubzonaerp)
        );
      
      setSubzonasFiltradas(subzonas);
      
      // Si solo hay una subzona, seleccionarla automáticamente
      if (subzonas.length === 1 && !formData.codsubzonaerp) {
        setFormData(prev => ({
          ...prev,
          codsubzonaerp: subzonas[0].codsubzonaerp
        }));
      }
    } else {
      setSubzonasFiltradas([]);
    }
  }, [formData.codzonaerp, zonasData]);

  // 🔥 FUNCIÓN MEJORADA PARA OBTENER DATOS REALES DEL CLIENTE DESDE EL ERP
  const fetchClienteERP = async (codClienteERP) => {
    if (!codClienteERP) {
      console.log("⚠️ No hay código de cliente ERP para buscar");
      return null;
    }

    try {
      const credentials = btoa(`${"federico.britez@surcomercial.com.py"}:${"Surcomercial.fb"}`);
      
      console.log("🔍 Buscando cliente en ERP:", codClienteERP);

      const response = await fetch(
        `https://apps.mobile.com.py:8443/mbusiness/rest/private/clientes?codempresa=15&codclienteerp=${codClienteERP}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${credentials}`
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const data = await response.json();
      console.log("📊 Respuesta API Cliente ERP:", data);

      // Buscar el cliente activo o tomar el primero
      const clienteActivo = data.find(cliente => cliente.activo === true) || data[0];
      
      if (clienteActivo) {
        console.log("✅ Cliente ERP encontrado:", {
          codCliente: clienteActivo.codclienteerp,
          razonSocial: clienteActivo.razonsocial,
          canal: clienteActivo.canal,
          zonaerp: clienteActivo.zonaerp,
          codzonaerp: clienteActivo.codzonaerp,
          zonaserp: clienteActivo.zonaserp,
          activo: clienteActivo.activo
        });
        return clienteActivo;
      }

      console.log("❌ No se encontró cliente en ERP");
      return null;
    } catch (error) {
      console.error("Error fetching cliente ERP:", error);
      return null;
    }
  };

  // 🔥 FUNCIÓN MEJORADA PARA DETECTAR CAMBIOS ENTRE CENSO Y ERP
  const detectarCambios = async (datosCenso) => {
    console.log("🔍 Iniciando detección de cambios...");
    
    const cambios = new Set();

    // Solo detectar cambios si es una actualización (tiene cliente en ERP)
    const esActualizacion = clienteData?.cliente?.concatcliente;
    const codClienteERP = clienteData?.cliente?.codclienteerp;

    console.log("📊 Información del cliente:", {
      esActualizacion,
      codClienteERP,
      datosCenso: datosCenso
    });

    if (!esActualizacion || !codClienteERP) {
      console.log("ℹ️ Es un ALTA de cliente nuevo, no hay cambios que detectar");
      setCamposModificados(cambios);
      return;
    }

    // 🔥 OBTENER DATOS REALES DEL ERP
    const clienteSistema = await fetchClienteERP(codClienteERP);
    
    if (!clienteSistema) {
      console.log("⚠️ No se pudieron obtener datos del sistema ERP");
      setCamposModificados(cambios);
      return;
    }

    setClienteERP(clienteSistema);

    // 🔥 FUNCIÓN AUXILIAR PARA NORMALIZAR VALORES
    const normalizarValor = (valor) => {
      if (valor === null || valor === undefined || valor === 'undefined') return '';
      return valor.toString().trim();
    };

    // 🔥 CAMPOS A COMPARAR ENTRE CENSO Y SISTEMA
    const camposAComparar = [
      'razonsocial', 'ruc', 'direccion', 'telefono', 'celular', 
      'email', 'codlistaprecioerp', 'codvendedorerp', 'codsupervisorerp',
      'diavisita', 'frecuencia', 'latitud', 'longitud', 'canal'
    ];

    console.log("🔄 Comparando campos entre Censo y Sistema ERP:");

    camposAComparar.forEach(campo => {
      const valorSistema = clienteSistema[campo] || '';
      const valorCenso = datosCenso[campo] || '';
      
      // Normalizar valores para comparación
      const sistemaNormalizado = normalizarValor(valorSistema);
      const censoNormalizado = normalizarValor(valorCenso);
      
      console.log(`📊 ${campo}:`, {
        sistema: sistemaNormalizado,
        censo: censoNormalizado,
        sonDiferentes: sistemaNormalizado !== censoNormalizado
      });
      
      if (sistemaNormalizado !== censoNormalizado) {
        cambios.add(campo);
        console.log(`🔄 CAMBIO DETECTADO en ${campo}: "${sistemaNormalizado}" → "${censoNormalizado}"`);
      }
    });

    // 🔥 COMPARACIÓN ESPECIAL PARA ZONA
    const zonaSistema = clienteSistema.zonaerp || clienteSistema.codzonaerp;
    const zonaCenso = datosCenso.codzonaerp;

    console.log("🔍 Comparando zonas:", {
      sistema: zonaSistema,
      censo: zonaCenso,
      sonDiferentes: normalizarValor(zonaSistema) !== normalizarValor(zonaCenso)
    });

    if (normalizarValor(zonaSistema) !== normalizarValor(zonaCenso)) {
      cambios.add('codzonaerp');
      console.log(`🔄 CAMBIO DETECTADO en zona: "${zonaSistema}" → "${zonaCenso}"`);
    }

    // 🔥 COMPARACIÓN ESPECIAL PARA SUBZONA
    console.log("🔍 Buscando datos de subzona del sistema...");
    
    let subzonaSistema = '';
    let subzonaCenso = datosCenso.codsubzonaerp || '';

    // Estrategia 1: Buscar en zonaserp del cliente del sistema
    if (clienteSistema.zonaserp) {
      subzonaSistema = clienteSistema.zonaserp.codsubzonaerp || '';
      console.log("📊 Subzona obtenida de zonaserp:", subzonaSistema);
    } 
    // Estrategia 2: Buscar en zonasData usando el zonaerp del sistema
    else if (zonaSistema && zonasData.length > 0) {
      const zonasDelSistema = zonasData.filter(zona => 
        normalizarValor(zona.codzonaerp) === normalizarValor(zonaSistema)
      );
      if (zonasDelSistema.length > 0) {
        // Tomar la primera subzona como referencia
        subzonaSistema = zonasDelSistema[0].codsubzonaerp || '';
        console.log("📊 Subzona obtenida de zonasData:", subzonaSistema);
      }
    }

    console.log("🔍 Comparando subzonas:", {
      sistema: subzonaSistema,
      censo: subzonaCenso,
      sonDiferentes: normalizarValor(subzonaSistema) !== normalizarValor(subzonaCenso)
    });

    if (normalizarValor(subzonaSistema) !== normalizarValor(subzonaCenso)) {
      cambios.add('codsubzonaerp');
      console.log(`🔄 CAMBIO DETECTADO en subzona: "${subzonaSistema}" → "${subzonaCenso}"`);
    }

    console.log("🎯 Campos modificados encontrados:", Array.from(cambios));
    setCamposModificados(cambios);
  };

  // 🔥 FUNCIÓN PARA OBTENER CLASE CSS SEGÚN CAMBIO
  const getClaseCambio = (campo) => {
    const tieneCambio = camposModificados.has(campo);
    return tieneCambio ? 'validator-campo-modificado' : '';
  };

  // Inicializar formData cuando cambien los datos del cliente
  useEffect(() => {
    if (clienteData) {
      console.log("🔄 Inicializando formData con datos del censo:", clienteData);
      
      const nuevosDatos = {
        estado: clienteData.estado || "TEMP",
        razonsocial: clienteData.razonsocial || "",
        ruc: clienteData.ruc || "",
        direccion: clienteData.direccion || "",
        telefono: clienteData.telefono || "",
        celular: clienteData.celular || "",
        email: clienteData.email || "",
        codlistaprecioerp: clienteData.codlistaprecioerp || "",
        codvendedorerp: clienteData.codvendedorerp || "",
        codsupervisorerp: clienteData.codsupervisorerp || "",
        diavisita: clienteData.diavisita || "",
        frecuencia: clienteData.frecuencia || "",
        latitud: clienteData.latitud || "",
        longitud: clienteData.longitud || "",
        canal: clienteData.canal || "",
        subcanal: clienteData.subcanal || "",
        subcanal2: clienteData.subcanal2 || "",
        // 🔥 CAMPOS DE ZONA Y SUBZONA
        codzonaerp: clienteData.zonaserp?.codzonaerp || clienteData.codzonaerp || "",
        codsubzonaerp: clienteData.zonaserp?.codsubzonaerp || clienteData.codsubzonaerp || "",
      };
      
      setFormData(nuevosDatos);
      // Detectar cambios entre censo y sistema ERP
      detectarCambios(nuevosDatos);
    }
  }, [clienteData]);

  // 🔥 ACTUALIZAR DETECCIÓN DE CAMBIOS CUANDO CAMBIA formData (en edición)
  useEffect(() => {
    if (isEditing && clienteERP) {
      console.log("🔄 Modo edición - detectando cambios con datos del sistema");
      detectarCambios(formData);
    }
  }, [formData, isEditing]);

  // 🔥 CARGAR DATOS DE CANALES Y ZONAS AL INICIAR
  useEffect(() => {
    const fetchCanalesData = async () => {
      try {
        const credentials = btoa(`${"federico.britez@surcomercial.com.py"}:${"Surcomercial.fb"}`);
        
        const response = await fetch(
          `https://apps.mobile.com.py:8443/mbusiness/rest/private/canaleserp?codempresa=15`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Basic ${credentials}`
            }
          }
        );

        if (response.ok) {
          const data = await response.json();
          setCanalesData(data);
          
          // Extraer grupos únicos
          const grupos = [...new Set(data.map(item => ({
            codcanalerp: item.codcanalerp,
            nombrecanal: item.nombrecanal
          })))].filter((item, index, self) => 
            index === self.findIndex(t => t.codcanalerp === item.codcanalerp)
          );
          
          setGruposUnicos(grupos);
        }
      } catch (error) {
        console.error("Error cargando datos de canales:", error);
      }
    };

    fetchCanalesData();
    fetchZonasData();
  }, []);

  // 🔥 FILTRAR SUBGRUPOS CUANDO CAMBIA EL GRUPO
  useEffect(() => {
    if (formData.canal && canalesData.length > 0) {
      const subgrupos1 = canalesData
        .filter(item => item.codcanalerp === formData.canal)
        .map(item => ({
          codsubcanalerp: item.codsubcanalerp,
          nombresubcanal: item.nombresubcanal
        }))
        .filter((item, index, self) => 
          index === self.findIndex(t => t.codsubcanalerp === item.codsubcanalerp)
        );
      
      setSubgrupos1Filtrados(subgrupos1);
      setSubgrupos2Filtrados([]);
    }
  }, [formData.canal, canalesData]);

  // 🔥 FILTRAR SUBGRUPOS2 CUANDO CAMBIA SUBGRUPO1
  useEffect(() => {
    if (formData.canal && formData.subcanal && canalesData.length > 0) {
      const subgrupos2 = canalesData
        .filter(item => 
          item.codcanalerp === formData.canal && 
          item.codsubcanalerp === formData.subcanal
        )
        .map(item => ({
          codsubcanalerp2: item.codsubcanalerp2,
          nombresubcanal2: item.nombresubcanal2
        }));
      
      setSubgrupos2Filtrados(subgrupos2);
    }
  }, [formData.canal, formData.subcanal, canalesData]);

  // 🔥 FUNCIÓN PARA MOSTRAR VALOR ANTERIOR DEL SISTEMA
  const mostrarValorAnterior = (campo) => {
    if (!isEditing || !clienteERP) return null;
    
    const normalizarValor = (valor) => {
      if (valor === null || valor === undefined || valor === 'undefined') return '';
      return valor.toString().trim();
    };

    if (campo === 'codzonaerp') {
      const zonaSistema = normalizarValor(clienteERP.zonaerp || clienteERP.codzonaerp);
      const zonaCenso = normalizarValor(formData.codzonaerp);
      
      if (zonaSistema !== zonaCenso) {
        const zonaSistemaData = zonasData.find(zona => 
          normalizarValor(zona.codzonaerp) === zonaSistema
        );
        const nombreZonaSistema = zonaSistemaData ? zonaSistemaData.nombrezona : zonaSistema;
        
        return <span className="validator-cambio-texto"> (sistema: {nombreZonaSistema || 'vacío'})</span>;
      }
      return null;
    }
    
    if (campo === 'codsubzonaerp') {
      let subzonaSistema = '';
      let nombreSubzonaSistema = '';

      if (clienteERP.zonaserp) {
        subzonaSistema = normalizarValor(clienteERP.zonaserp.codsubzonaerp);
        nombreSubzonaSistema = clienteERP.zonaserp.nombresubzona || subzonaSistema;
      } else {
        const zonaSistema = normalizarValor(clienteERP.zonaerp || clienteERP.codzonaerp);
        if (zonaSistema && zonasData.length > 0) {
          const zonasDelSistema = zonasData.filter(zona => 
            normalizarValor(zona.codzonaerp) === zonaSistema
          );
          if (zonasDelSistema.length > 0) {
            subzonaSistema = normalizarValor(zonasDelSistema[0].codsubzonaerp);
            nombreSubzonaSistema = zonasDelSistema[0].nombresubzona || subzonaSistema;
          }
        }
      }

      const subzonaCenso = normalizarValor(formData.codsubzonaerp);
      
      if (subzonaSistema !== subzonaCenso) {
        return <span className="validator-cambio-texto"> (sistema: {nombreSubzonaSistema || subzonaSistema || 'vacío'})</span>;
      }
      return null;
    }

    if (campo === 'diavisita') {
      const valorSistema = normalizarValor(clienteERP[campo]);
      const valorCenso = normalizarValor(formData[campo]);
      
      if (valorSistema !== valorCenso) {
        const nombreDiaSistema = obtenerNombreDiaVisita(valorSistema);
        return <span className="validator-cambio-texto"> (sistema: {nombreDiaSistema || 'vacío'})</span>;
      }
      return null;
    }
    
    const valorSistema = normalizarValor(clienteERP[campo]);
    const valorCenso = normalizarValor(formData[campo]);
    
    if (valorSistema !== valorCenso) {
      return <span className="validator-cambio-texto"> (sistema: {valorSistema || 'vacío'})</span>;
    }
    return null;
  };

  const guardarDatosEnAPI = async (datos) => {
    try {
      const credentials = btoa(`${"federico.britez@surcomercial.com.py"}:${"Surcomercial.fb"}`);
      
      const canalSeleccionado = canalesData.find(item => 
        item.codcanalerp === datos.canal && 
        item.codsubcanalerp === datos.subcanal && 
        item.codsubcanalerp2 === datos.subcanal2
      );

      const zonaSeleccionada = zonasData.find(item => 
        item.codzonaerp === datos.codzonaerp && 
        item.codsubzonaerp === datos.codsubzonaerp
      );

      const payload = {
        codclientecenso: clienteData.codclientecenso,
        codempresa: 15,
        nroclienteerp: clienteData.nroclienteerp || 0,
        codsucursal: clienteData.sucursal?.codsucursal || null,
        
        // Datos del cliente editables
        ruc: datos.ruc,
        razonsocial: datos.razonsocial,
        direccion: datos.direccion,
        contacto: clienteData.contacto || null,
        telefono: datos.telefono,
        celular: datos.celular,
        email: datos.email,
        estado: datos.estado,
        
        // Coordenadas editables
        latitud: datos.latitud ? parseFloat(datos.latitud) : null,
        longitud: datos.longitud ? parseFloat(datos.longitud) : null,
        
        // Campos comerciales editables
        codlistaprecioerp: datos.codlistaprecioerp,
        codvendedorerp: datos.codvendedorerp,
        codsupervisorerp: datos.codsupervisorerp,
        diavisita: datos.diavisita ? parseInt(datos.diavisita) : null,
        frecuencia: datos.frecuencia ? parseInt(datos.frecuencia) : null,
        
        // Campos de canales
        canal: datos.canal || clienteData.canal,
        subcanal: datos.subcanal || clienteData.subcanal,
        subcanal2: datos.subcanal2 || clienteData.subcanal2,
        codcanalerp: datos.canal || clienteData.canaleserp?.codcanalerp,
        
        codzonaerp: datos.codzonaerp || clienteData.zonaserp?.codzonaerp,
        
        gpsactivo: clienteData.gpsactivo !== undefined ? clienteData.gpsactivo : true,
        precision: clienteData.precision || "GPS",
        tipored: clienteData.tipored || "3G",
        fechaenvio: clienteData.fechaenvio,
        fecha: clienteData.fecha,
        recorrido: clienteData.recorrido,
        obs: clienteData.obs || "",
        censoimg: clienteData.censoimg,
        clientesimg: clienteData.clientesimg || [],
        aprobado: datos.estado === "APROBADO",
        codempresaerp: "PY02",
        codsucursalerp: clienteData.sucursal?.codsucursalerp || "S101",
        codclienteerp: clienteData.codclienteerp || "0",
        codzonaerp: datos.codzonaerp || clienteData.zonaserp?.codzonaerp || null,
        clienteabc: clienteData.clienteabc || "",
        uid: clienteData.uid,
        codgrupoformaventaerp: clienteData.codgrupoformaventaerp || "CD",
        codbocaerp: clienteData.codbocaerp || "2100",
        codclientepadre: clienteData.codclientepadre || "0",
        codclientesap: clienteData.codclientesap,
        retornosap: clienteData.retornosap,
        nombrevendedor: clienteData.nombrevendedor,
        nombresupervisor: clienteData.nombresupervisor,
        
        sucursal: clienteData.sucursal,
        cliente: clienteData.cliente,
        codusuario: clienteData.codusuario,
        usuario: clienteData.usuario,
        
        zonaserp: zonaSeleccionada || clienteData.zonaserp,
        canaleserp: canalSeleccionado || clienteData.canaleserp
      };

      console.log("Enviando datos a API:", payload);

      const response = await fetch(
        `https://apps.mobile.com.py:8443/mbusiness/rest/private/censo`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${credentials}`
          },
          body: JSON.stringify(payload)
        }
      );
      
      if (response.ok) {
        await Swal.fire({
          title: '¡Éxito!',
          text: 'Datos guardados correctamente',
          icon: 'success',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#3b82f6',
          timer: 3000,
          timerProgressBar: true
        });
        
        return { 
          success: true,
          message: "Datos guardados correctamente"
        };
      } else {
        const errorText = await response.text();
        
        await Swal.fire({
          title: 'Error',
          text: `Error ${response.status}: ${errorText || 'Error del servidor'}`,
          icon: 'error',
          confirmButtonText: 'Entendido',
          confirmButtonColor: '#ef4444'
        });
        
        throw new Error(`Error HTTP ${response.status}: ${errorText}`);
      }
      
    } catch (error) {
      console.error("Error en API:", error);
      
      await Swal.fire({
        title: 'Error de conexión',
        text: error.message,
        icon: 'error',
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#ef4444'
      });
      
      return {
        success: false,
        message: error.message
      };
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    let formattedValue = value;
    if (name === 'razonsocial' || name === 'direccion') {
      formattedValue = value.toUpperCase();
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: formattedValue
    }));
  };

  const handleSelectChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleStartEdit = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    if (clienteData) {
      const datosOriginales = {
        estado: clienteData.estado || "TEMP",
        razonsocial: clienteData.razonsocial || "",
        ruc: clienteData.ruc || "",
        direccion: clienteData.direccion || "",
        telefono: clienteData.telefono || "",
        celular: clienteData.celular || "",
        email: clienteData.email || "",
        codlistaprecioerp: clienteData.codlistaprecioerp || "",
        codvendedorerp: clienteData.codvendedorerp || "",
        codsupervisorerp: clienteData.codsupervisorerp || "",
        diavisita: clienteData.diavisita || "",
        frecuencia: clienteData.frecuencia || "",
        latitud: clienteData.latitud || "",
        longitud: clienteData.longitud || "",
        canal: clienteData.canal || "",
        subcanal: clienteData.subcanal || "",
        subcanal2: clienteData.subcanal2 || "",
        codzonaerp: clienteData.zonaserp?.codzonaerp || clienteData.codzonaerp || "",
        codsubzonaerp: clienteData.zonaserp?.codsubzonaerp || clienteData.codsubzonaerp || "",
      };
      
      setFormData(datosOriginales);
      setCamposModificados(new Set());
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const datosFormateados = {
        ...formData,
        razonsocial: formData.razonsocial ? formData.razonsocial.toUpperCase().trim() : "",
        direccion: formData.direccion ? formData.direccion.toUpperCase().trim() : "",
        ruc: formData.ruc ? formData.ruc.trim() : "",
        telefono: formData.telefono ? formData.telefono.trim() : "",
        celular: formData.celular ? formData.celular.trim() : "",
        email: formData.email ? formData.email.trim().toLowerCase() : "",
        estado: formData.estado || "TEMP",
        latitud: formData.latitud ? formData.latitud.toString() : "",
        longitud: formData.longitud ? formData.longitud.toString() : "",
        diavisita: formData.diavisita ? formData.diavisita.toString() : "",
        frecuencia: formData.frecuencia ? formData.frecuencia.toString() : "",
        canal: formData.canal || clienteData.canal,
        subcanal: formData.subcanal || clienteData.subcanal,
        subcanal2: formData.subcanal2 || clienteData.subcanal2,
        codzonaerp: formData.codzonaerp || clienteData.zonaserp?.codzonaerp,
        codsubzonaerp: formData.codsubzonaerp || clienteData.zonaserp?.codsubzonaerp,
      };
      
      console.log("Datos formateados para guardar:", datosFormateados);
      
      const resultado = await guardarDatosEnAPI(datosFormateados);
      
      if (resultado.success) {
        const canalSeleccionado = canalesData.find(item => 
          item.codcanalerp === datosFormateados.canal && 
          item.codsubcanalerp === datosFormateados.subcanal && 
          item.codsubcanalerp2 === datosFormateados.subcanal2
        );

        const zonaSeleccionada = zonasData.find(item => 
          item.codzonaerp === datosFormateados.codzonaerp && 
          item.codsubzonaerp === datosFormateados.codsubzonaerp
        );

        const datosActualizados = {
          ...clienteData,
          ...datosFormateados,
          sucursal: clienteData.sucursal,
          zonaserp: zonaSeleccionada || clienteData.zonaserp,
          canaleserp: canalSeleccionado || clienteData.canaleserp,
          usuario: clienteData.usuario
        };
        
        onEdit(datosActualizados);
        setIsEditing(false);
        setCamposModificados(new Set());
      } else {
        throw new Error(resultado.message);
      }
      
    } catch (error) {
      console.error("Error al guardar:", error);
    } finally {
      setLoading(false);
    }
  };

  const extraerRUC = (ruc) => {
    if (!ruc) return "";

    const rucLimpio = ruc.toString().replace(/\s/g, "");

    if (rucLimpio.includes("-")) {
      return rucLimpio.split("-")[0];
    }

    if (
      rucLimpio.length === 6 ||
      rucLimpio.length === 8 ||
      rucLimpio.length === 9
    ) {
      return rucLimpio.substring(0, rucLimpio.length - 1);
    }

    return rucLimpio;
  };

  const getValorParaCopiar = (fieldName, data) => {
    switch (fieldName) {
      case "codlistaprecioerp":
        return data.codlistaprecioerp || "";
      case "codvendedorerp":
        return data.codvendedorerp || "";
      case "codsupervisorerp":
        return data.codsupervisorerp || "";
      case "canal":
        return data.canal || "";
      case "subcanal":
        return data.subcanal || "";
      case "subcanal2":
        return data.subcanal2 || "";
      case "codzonaerp":
        return data.zonaserp?.codzonaerp || data.codzonaerp || "";
      case "codsubzonaerp":
        return data.zonaserp?.codsubzonaerp || data.codsubzonaerp || "";
      case "razonsocial":
        return data.razonsocial ? data.razonsocial.toUpperCase() : "";
      case "direccion":
        return data.direccion ? data.direccion.toUpperCase() : "";
      case "ruc":
        return extraerRUC(data.ruc);
      case "diavisita":
        return getValorDiaVisitaParaCopiar(data);
      default:
        return data[fieldName] || "";
    }
  };

  // 🔥 RENDERIZAR CAMPO EDITABLE CON DETECCIÓN DE CAMBIOS
  const renderField = (label, fieldName, type = "text", options = []) => {
    const claseCambio = getClaseCambio(fieldName);
    
    if (isEditing) {
      if (type === "select") {
        return (
          <div className={`validator-data-row editable ${claseCambio}`}>
            <span className="validator-label">{label}</span>
            <div className="validator-edit-field-container">
              <SelectBuscable
                value={formData[fieldName] || ""}
                onChange={(nuevoValor) => {
                  handleSelectChange({
                    target: {
                      name: fieldName,
                      value: nuevoValor
                    }
                  });
                }}
                options={options}
                placeholder="Buscar..."
              />
              {mostrarValorAnterior(fieldName)}
            </div>
          </div>
        );
      }

      if (fieldName === "estado") {
        const opcionesEstado = [
          { value: "TEMP", label: "TEMP" },
          { value: "APROBADO", label: "APROBADO" },
          { value: "PENDIENTE", label: "PENDIENTE" },
          { value: "RECHAZADO", label: "RECHAZADO" }
        ];
        
        return (
          <div className={`validator-data-row editable ${claseCambio}`}>
            <span className="validator-label">{label}</span>
            <div className="validator-edit-field-container">
              <SelectBuscable
                value={formData[fieldName] || "TEMP"}
                onChange={(nuevoValor) => {
                  handleSelectChange({
                    target: {
                      name: fieldName,
                      value: nuevoValor
                    }
                  });
                }}
                options={opcionesEstado}
                placeholder="Seleccionar estado..."
              />
              {mostrarValorAnterior(fieldName)}
            </div>
          </div>
        );
      }

      if (fieldName === "diavisita") {
        return (
          <div className={`validator-data-row editable ${claseCambio}`}>
            <span className="validator-label">{label}</span>
            <div className="validator-edit-field-container">
              <SelectBuscable
                value={formData[fieldName] || ""}
                onChange={(nuevoValor) => {
                  handleSelectChange({
                    target: {
                      name: fieldName,
                      value: nuevoValor
                    }
                  });
                }}
                options={opcionesDiasVisita}
                placeholder="Seleccionar día..."
              />
              {mostrarValorAnterior(fieldName)}
            </div>
          </div>
        );
      }

      return (
        <div className={`validator-data-row editable ${claseCambio}`}>
          <span className="validator-label">{label}</span>
          <div className="validator-edit-field-container">
            <input
              type={type}
              name={fieldName}
              value={formData[fieldName] || ""}
              onChange={handleInputChange}
              className="validator-edit-input"
              style={{ 
                textTransform: (fieldName === 'razonsocial' || fieldName === 'direccion') ? 'uppercase' : 'none' 
              }}
            />
            {mostrarValorAnterior(fieldName)}
          </div>
        </div>
      );
    }

    // Modo solo lectura
    return (
      <DataRow
        label={label}
        value={getFieldValue(fieldName, clienteData) || "No especificado"}
        originalValue={clienteERP && getFieldValue(fieldName, { ...clienteERP, zonaserp: clienteData.zonaserp })}
        onCopy={() => copiarTexto(getValorParaCopiar(fieldName, clienteData))}
        showOriginal={clienteERP && getFieldValue(fieldName, { ...clienteERP, zonaserp: clienteData.zonaserp }) !== getFieldValue(fieldName, clienteData)}
        tieneCambios={camposModificados.has(fieldName)}
      />
    );
  };

  const getFieldValue = (fieldName, data) => {
    switch (fieldName) {
      case "razonsocial":
        return data.razonsocial ? data.razonsocial.toUpperCase() : "";
      case "direccion":
        return data.direccion ? data.direccion.toUpperCase() : "";
      case "codlistaprecioerp":
        return getNombreListaPrecio(data.codlistaprecioerp);
      case "codvendedorerp":
        return getNombreVendedor(data.codvendedorerp);
      case "codsupervisorerp":
        return getNombreSupervisor(data.codsupervisorerp);
      case "canal":
        return data.canaleserp ? `${data.canaleserp.nombrecanal}` : data.canal || "No especificado";
      case "subcanal":
        return data.canaleserp ? `${data.canaleserp.nombresubcanal}` : data.subcanal || "No especificado";
      case "subcanal2":
        if (getSubgrupo2Value && data.canaleserp) {
          return getSubgrupo2Value(data.canaleserp);
        }
        return data.canaleserp ? `${data.canaleserp.nombresubcanal2}` : data.subcanal2 || "No especificado";
      case "codzonaerp":
        return data.zonaserp ? data.zonaserp.nombrezona : data.codzonaerp || "No especificado";
      case "codsubzonaerp":
        if (data.zonaserp) {
          return data.zonaserp.nombresubzona || data.zonaserp.codsubzonaerp || "No especificado";
        }
        return data.codsubzonaerp || "No especificado";
      case "diavisita":
        return getFieldValueDiaVisita(data);
      default:
        return data[fieldName];
    }
  };

  return (
    <div className="validator-client-data-container">
      <div className="validator-client-data-header">
        {isEditing ? (
          <div className="validator-edit-actions">
            <button className="validator-cancel-button" onClick={handleCancelEdit} disabled={loading}>
              Cancelar
            </button>
            <button className="validator-save-button" onClick={handleSave} disabled={loading}>
              {loading ? "Guardando..." : "Guardar Cambios"}
            </button>
          </div>
        ) : (
          <div className="validator-view-actions">
            <button className="validator-edit-button" onClick={handleStartEdit}>
              <i className="fas fa-edit"></i>
              Editar Datos
            </button>
            {camposModificados.size > 0 && (
              <div className="validator-cambios-indicator">
                <span className="validator-cambios-badge">
                  {camposModificados.size} campo(s) diferente(s) vs sistema
                </span>
                <div className="validator-leyenda-cambios">
                  <div className="validator-leyenda-item">
                    <div className="validator-color-muestra validator-campo-modificado"></div>
                    <span>Diferente del sistema</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="validator-data-grid">
        {/* Estado (editable) */}
        {renderField("Estado:", "estado", "select", [
          { value: "TEMP", label: "TEMP" },
          { value: "APROBADO", label: "APROBADO" },
          { value: "PENDIENTE", label: "PENDIENTE" },
          { value: "RECHAZADO", label: "RECHAZADO" }
        ])}

        {/* Campos editables */}
        {renderField("Celular:", "celular", "text")}
        {renderField("Razón Social:", "razonsocial", "text")}
        {renderField("Teléfono:", "telefono", "text")}
        {renderField("RUC:", "ruc", "text")}
        {renderField("Dirección:", "direccion", "text")}

        {/* Sucursal (solo lectura) */}
        <DataRow
          label="Sucursal:"
          value={`${clienteData.sucursal.codsucursalerp}, ${clienteData.sucursal.nombresucursal}`}
          onCopy={() => copiarTexto(clienteData.sucursal.codsucursalerp)}
          tieneCambios={false}
        />

        {/* Más campos editables */}
        {renderField("(CALLE 5)Latitud:", "latitud", "text")}
        {renderField("Lista de Precio:", "codlistaprecioerp", "select", 
          (listasPrecio || []).map(lista => ({
            value: lista.codlistaprecioerp,
            label: lista.nombrelistaprecio
          }))
        )}
        {renderField("(CALLE 3)Longitud:", "longitud", "text")}
        
        {/* 🔥 DÍA DE VISITA - ESPECIAL */}
        {isEditing ? (
          renderField("Dia de Visita:", "diavisita", "select", opcionesDiasVisita)
        ) : (
          <DataRow
            label="Dia de Visita:"
            value={getFieldValueDiaVisita(clienteData)}
            originalValue={clienteERP && obtenerNombreDiaVisita(clienteERP.diavisita)}
            onCopy={() => copiarTexto(getValorDiaVisitaParaCopiar(clienteData))}
            showOriginal={clienteERP && clienteERP.diavisita !== clienteData.diavisita}
            tieneCambios={camposModificados.has("diavisita")}
          />
        )}

        {/* 🔥 GRUPO (EDITABLE CON SELECT) */}
        {isEditing ? (
          <div className={`validator-data-row editable ${getClaseCambio("canal")}`}>
            <span className="validator-label">Grupo:</span>
            <div className="validator-edit-field-container">
              <SelectBuscable
                value={formData.canal || ""}
                onChange={(nuevoValor) => {
                  handleSelectChange({
                    target: {
                      name: "canal",
                      value: nuevoValor
                    }
                  });
                  setFormData(prev => ({
                    ...prev,
                    subcanal: "",
                    subcanal2: ""
                  }));
                }}
                options={gruposUnicos.map(grupo => ({
                  value: grupo.codcanalerp,
                  label: grupo.nombrecanal
                }))}
                placeholder="Buscar grupo..."
              />
              {mostrarValorAnterior("canal")}
            </div>
          </div>
        ) : (
          <DataRow
            label="Grupo:"
            value={getFieldValue("canal", clienteData)}
            onCopy={() => copiarTexto(getValorParaCopiar("canal", clienteData))}
            tieneCambios={camposModificados.has("canal")}
          />
        )}

        {/* Vendedor (editable con select) */}
        {renderField("Vendedor:", "codvendedorerp", "select", 
          (vendedores || []).map(vendedor => ({
            value: vendedor.codvendedorerp,
            label: `${vendedor.codvendedorerp} - ${vendedor.nombrevendedor}`
          }))
        )}
        
        {/* 🔥 SUBGRUPO 1 (EDITABLE CON SELECT) */}
        {isEditing ? (
          <div className={`validator-data-row editable ${getClaseCambio("subcanal")}`}>
            <span className="validator-label">SubGrupo 1:</span>
            <div className="validator-edit-field-container">
              <SelectBuscable
                value={formData.subcanal || ""}
                onChange={(nuevoValor) => {
                  handleSelectChange({
                    target: {
                      name: "subcanal",
                      value: nuevoValor
                    }
                  });
                  setFormData(prev => ({
                    ...prev,
                    subcanal2: ""
                  }));
                }}
                options={subgrupos1Filtrados.map(subgrupo => ({
                  value: subgrupo.codsubcanalerp,
                  label: subgrupo.nombresubcanal
                }))}
                placeholder={formData.canal ? "Buscar subgrupo 1..." : "Seleccione un grupo primero"}
                disabled={!formData.canal}
              />
              {mostrarValorAnterior("subcanal")}
            </div>
          </div>
        ) : (
          <DataRow
            label="SubGrupo 1:"
            value={getFieldValue("subcanal", clienteData)}
            onCopy={() => copiarTexto(getValorParaCopiar("subcanal", clienteData))}
            tieneCambios={camposModificados.has("subcanal")}
          />
        )}

        {/* Supervisor (editable con select) */}
        {renderField("Supervisor:", "codsupervisorerp", "select", 
          (supervisores || []).map(supervisor => ({
            value: supervisor.codsupervisorerp,
            label: `${supervisor.codsupervisorerp} - ${supervisor.nombresupervisor}`
          }))
        )}

        {/* 🔥 SUBGRUPO 2 (EDITABLE CON SELECT) */}
        {isEditing ? (
          <div className={`validator-data-row editable ${getClaseCambio("subcanal2")}`}>
            <span className="validator-label">SubGrupo 2:</span>
            <div className="validator-edit-field-container">
              <SelectBuscable
                value={formData.subcanal2 || ""}
                onChange={(nuevoValor) => {
                  handleSelectChange({
                    target: {
                      name: "subcanal2",
                      value: nuevoValor
                    }
                  });
                }}
                options={subgrupos2Filtrados.map(subgrupo => ({
                  value: subgrupo.codsubcanalerp2,
                  label: subgrupo.nombresubcanal2
                }))}
                placeholder={formData.subcanal ? "Buscar subgrupo 2..." : "Seleccione un subgrupo 1 primero"}
                disabled={!formData.subcanal}
              />
              {mostrarValorAnterior("subcanal2")}
            </div>
          </div>
        ) : (
          <DataRow
            label="SubGrupo 2:"
            value={getFieldValue("subcanal2", clienteData)}
            onCopy={() => copiarTexto(getValorParaCopiar("subcanal2", clienteData))}
            tieneCambios={camposModificados.has("subcanal2")}
          />
        )}

        {/* Más campos editables */}
        {renderField("Frecuencia:", "frecuencia", "text")}
        {renderField("Email:", "email", "email")}

        {/* Tipo (solo lectura) */}
        <DataRow
          label="Tipo:"
          value={
            clienteData.cliente?.concatcliente
              ? `${clienteData.cliente.codclienteerp}-CLIENTE PARA ACTUALIZACIÓN`
              : "CLIENTE PARA ALTA"
          }
          onCopy={() => copiarTexto(
            clienteData.cliente?.concatcliente 
              ? clienteData.cliente.codclienteerp 
              : "CLIENTE PARA ALTA"
          )}
          tieneCambios={false}
        />

         {/* 🔥 ZONA (EDITABLE CON SELECT) */}
        {isEditing ? (
          <div className={`validator-data-row editable ${getClaseCambio("codzonaerp")}`}>
            <span className="validator-label">Zona:</span>
            <div className="validator-edit-field-container">
              <SelectBuscable
                value={formData.codzonaerp || ""}
                onChange={(nuevoValor) => {
                  handleSelectChange({
                    target: {
                      name: "codzonaerp",
                      value: nuevoValor
                    }
                  });
                  setFormData(prev => ({
                    ...prev,
                    codsubzonaerp: ""
                  }));
                }}
                options={zonasUnicas.map(zona => ({
                  value: zona.codzonaerp,
                  label: zona.nombrezona
                }))}
                placeholder="Buscar zona..."
              />
              {mostrarValorAnterior("codzonaerp")}
            </div>
          </div>
        ) : (
          <DataRow
            label="Zona:"
            value={getFieldValue("codzonaerp", clienteData)}
            onCopy={() => copiarTexto(getValorParaCopiar("codzonaerp", clienteData))}
            tieneCambios={camposModificados.has("codzonaerp")}
          />
        )}

         {/* Código SAP (solo lectura) */}
        <DataRow
          label="COD RETORNO SAP:"
          value={clienteData.codclientesap}
          onCopy={() => copiarTexto(clienteData.codclientesap)}
          tieneCambios={false}
        />

         {isEditing ? (
          <div className={`validator-data-row editable ${getClaseCambio("codsubzonaerp")}`}>
            <span className="validator-label">Subzona:</span>
            <div className="validator-edit-field-container">
              <SelectBuscable
                value={formData.codsubzonaerp || ""}
                onChange={(nuevoValor) => {
                  handleSelectChange({
                    target: {
                      name: "codsubzonaerp",
                      value: nuevoValor
                    }
                  });
                }}
                options={subzonasFiltradas.map(subzona => ({
                  value: subzona.codsubzonaerp,
                  label: subzona.nombresubzona
                }))}
                placeholder={formData.codzonaerp ? "Buscar subzona..." : "Seleccione una zona primero"}
                disabled={!formData.codzonaerp}
              />
              {mostrarValorAnterior("codsubzonaerp")}
            </div>
          </div>
        ) : (
          <DataRow
            label="Subzona:"
            value={getFieldValue("codsubzonaerp", clienteData)}
            onCopy={() => copiarTexto(getValorParaCopiar("codsubzonaerp", clienteData))}
            tieneCambios={camposModificados.has("codsubzonaerp")}
          />
        )}

        {/* Retorno SAP (solo lectura) */}
        <DataRow
          label="RETORNO SAP:"
          value={clienteData.retornosap}
          tieneCambios={false}
        />
      </div>
    </div>
  );
};

// 🔥 COMPONENTE DataRow ACTUALIZADO
const DataRow = ({ label, value, originalValue, onCopy, showOriginal, tieneCambios }) => (
  <div className={`validator-data-row ${tieneCambios ? 'validator-campo-modificado' : ''}`}>
    <span className="validator-label">{label}</span>
    <span
      className="validator-value"
      style={{ cursor: onCopy ? "pointer" : "default" }}
      onClick={onCopy}
    >
      {value}
      {showOriginal && originalValue && (
        <span className="validator-original-value">
          (sistema: <span className="validator-original-text">{originalValue}</span>)
        </span>
      )}
    </span>
  </div>
); 

export default ClientData;