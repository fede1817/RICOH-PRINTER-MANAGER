import { useState } from "react";
import { usePhoneFormatter } from "./usePhoneFormatter";
import { useRUCValidation } from "./useRUCValidation";
import { excelData } from "../excelData";
import { useAuth } from "../context/AuthContext";

export const useClientData = (getNombreListaPrecioExterno) => {
  const [codCenso, setCodCenso] = useState("");
  const [clienteData, setClienteData] = useState(null);
  const [clienteDataOriginal, setClienteDataOriginal] = useState(null);
  const [errores, setErrores] = useState([]);
  const [advertencias, setAdvertencias] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [mostrarResultado, setMostrarResultado] = useState(false);
  const [validacionRUC, setValidacionRUC] = useState({
    valido: true,
    mensaje: "",
  });
  const [grupoClienteData, setGrupoClienteData] = useState([]);
  const { formatearNumeroParaguayo, formatearRUC } = usePhoneFormatter();
  const { validarRUC, validandoRUC: validandoRUCExternal } = useRUCValidation();
  const { authCredentials } = useAuth();

  // 🔥 NUEVA FUNCIÓN: Cargar grupos de cliente
  const fetchGrupoCliente = async () => {
    try {
      const response = await fetch(
        `https://apps.mobile.com.py:8443/mbusiness/rest/private/grupocliente?codempresa=15`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Basic ${authCredentials}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const data = await response.json();
      setGrupoClienteData(data);
      return data;
    } catch (error) {
      console.error("Error fetching grupo cliente:", error);
      return [];
    }
  };

  // 🔥 NUEVA FUNCIÓN: Obtener valor formateado para SubGrupo 2
  const getSubgrupo2Value = (canaleserp) => {
    if (!canaleserp || !grupoClienteData.length) {
      return canaleserp ? `${canaleserp.nombresubcanal2}` : "No especificado";
    }

    // Buscar el grupo cliente correspondiente
    const grupoCliente = grupoClienteData.find(
      (grupo) => grupo.codgrupoclienteerp === canaleserp.codsubcanalerp2,
    );

    if (grupoCliente) {
      return `${grupoCliente.nombregrupoclienteerp}`;
    }

    // Fallback al nombre original si no se encuentra
    return `${canaleserp.nombresubcanal2}`;
  };

  // 🔥 FUNCIÓN CORREGIDA: Obtener datos del cliente desde el sistema ERP
  const fetchClienteERP = async (codClienteActual) => {
    try {
      console.log("🔍 Consultando cliente ERP:", codClienteActual);

      const response = await fetch(
        `https://apps.mobile.com.py:8443/mbusiness/rest/private/clientes?codempresa=15&codclienteerp=${codClienteActual}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Basic ${authCredentials}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const data = await response.json();

      console.log("📊 Respuesta API Cliente ERP:", data);

      // 🔥 FILTRAR SOLO EL REGISTRO ACTIVO
      const clienteERPActivo = data.find((cliente) => cliente.activo === true);

      if (clienteERPActivo) {
        console.log("✅ Cliente ERP activo encontrado:", {
          codClienteERP: clienteERPActivo.codclienteerp,
          canal: clienteERPActivo.canal,
          activo: clienteERPActivo.activo,
          razonSocial: clienteERPActivo.razonsocial,
        });
        console.log(
          "🔍 Campos del cliente ERP activo:",
          Object.keys(clienteERPActivo),
        );
        console.log(
          "🎯 Canal del cliente ERP activo:",
          clienteERPActivo.canal || "No encontrado",
        );
        console.log(
          "📝 Datos completos del cliente ERP activo:",
          clienteERPActivo,
        );
      } else {
        console.log(
          "⚠️ No se encontró cliente ERP activo con código:",
          codClienteActual,
        );
        // 🔥 SI NO HAY ACTIVO, TOMAR EL PRIMERO COMO FALLBACK
        const clienteFallback = data && data.length > 0 ? data[0] : null;
        if (clienteFallback) {
          console.log(
            "🔄 Usando cliente fallback (primer registro):",
            clienteFallback.canal,
          );
          return clienteFallback;
        }
        return null;
      }

      return clienteERPActivo;
    } catch (error) {
      console.error("❌ Error fetching cliente ERP:", error);
      return null;
    }
  };

  // 🔥 FUNCIÓN MEJORADA PARA VALIDAR CAMBIOS EN ACTUALIZACIONES
  // 🔥 FUNCIÓN MEJORADA PARA VALIDAR CAMBIOS EN ACTUALIZACIONES
  const validarCambiosEnActualizacion = async (
    dataFormateado,
    codClienteActual,
  ) => {
    const errores = [];
    const advertencias = [];

    if (!codClienteActual) {
      console.log("ℹ️ No hay codClienteActual, probablemente es ALTA");
      return { errores, advertencias }; // No hay cliente en ERP = es alta
    }

    console.log(
      "🔍 Iniciando validación de canal para cliente:",
      codClienteActual,
    );
    console.log("📊 Canal en censo:", dataFormateado.canal);

    // 🔥 CONSULTAR DATOS REALES DEL CLIENTE EN EL SISTEMA ERP
    const clienteERP = await fetchClienteERP(codClienteActual);

    if (!clienteERP) {
      console.log("⚠️ No se pudo obtener datos del cliente ERP");
      errores.push(
        "⚠️ No se pudo verificar los datos del cliente en el sistema",
      );
      return { errores, advertencias };
    }

    // 🔥 BUSCAR EL CAMPO CORRECTO DEL CANAL EN LA RESPUESTA
    const canalERP = clienteERP.canal; // Ya viene del registro activo

    console.log("🎯 Canal en sistema ERP (activo):", canalERP);
    console.log("🎯 Canal en censo:", dataFormateado.canal);
    console.log("✅ Estado del registro ERP:", clienteERP.activo);

    // 🔥 VALIDAR QUE EL CANAL COINCIDA CON EL SISTEMA ERP
    if (canalERP && dataFormateado.canal) {
      if (canalERP.toString() !== dataFormateado.canal.toString()) {
        const mensajeError =
          `No se puede cambiar de canal en actualizaciones. ` +
          `Canal en sistema: ${canalERP} (${obtenerNombreCanal(canalERP)}) → ` +
          `Canal en censo: ${dataFormateado.canal} (${obtenerNombreCanal(
            dataFormateado.canal,
          )})`;

        console.log("🚫 Error de validación:", mensajeError);
        errores.push(mensajeError);
      } else {
        console.log("✅ Canal coincide correctamente");
      }
    } else {
      console.log("ℹ️ No se pudo comparar canales:", {
        canalERP,
        canalCenso: dataFormateado.canal,
      });
      advertencias.push(
        "⚠️ No se pudo realizar la validación completa del canal",
      );
    }

    return { errores, advertencias };
  };

  // 🔥 FUNCIÓN AUXILIAR: Obtener nombre del canal por código
  const obtenerNombreCanal = (codigoCanal) => {
    const canales = {
      "01": "Minoristas",
      "02": "Supermercado",
      "09": "Institucional - B2B",
      10: "Mayoristas",
      // Agrega más códigos según necesites
    };
    return canales[codigoCanal] || `Canal ${codigoCanal}`;
  };

  const fetchClienteData = async () => {
    // Asegurarnos de que codCenso sea string
    const codCensoTemp = codCenso ? codCenso.toString() : "";

    if (!codCensoTemp) {
      setErrores(["Por favor, ingrese un código de censo válido"]);
      return;
    }

    // 🔹 RESETEAR ESTADOS ANTES DE NUEVA BÚSQUEDA
    setClienteData(null);
    setClienteDataOriginal(null);
    setErrores([]);
    setAdvertencias([]);
    setMostrarResultado(false);
    setValidacionRUC({ valido: true, mensaje: "" });

    // Corregir el match para manejar números y strings
    let codigoLimpio = codCensoTemp;

    // Solo intentar hacer match si es un string y contiene '/editar/'
    if (typeof codCensoTemp === "string" && codCensoTemp.includes("/editar/")) {
      const match = codCensoTemp.match(/\/editar\/'?(\d+)'?$/);
      codigoLimpio = match ? match[1] : codCensoTemp.trim();
    } else {
      // Si es número o string simple, usar directamente
      codigoLimpio = codCensoTemp.toString().trim();
    }

    setCargando(true);

    try {
      // 🔥 CARGAR GRUPOS DE CLIENTE EN PARALELO
      const [clienteResponse, grupoClienteResponse] = await Promise.all([
        fetch(
          `https://apps.mobile.com.py:8443/mbusiness/rest/private/censo/${codigoLimpio}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Basic ${authCredentials}`,
            },
          },
        ),
        fetchGrupoCliente(), // Cargar grupos de cliente
      ]);

      if (!clienteResponse.ok) {
        if (clienteResponse.status === 401) {
          throw new Error("Autenticación fallida. Verifique sus credenciales.");
        } else if (clienteResponse.status === 404) {
          throw new Error(
            "No se encontró el cliente con el código de censo proporcionado.",
          );
        } else {
          throw new Error(`Error HTTP: ${clienteResponse.status}`);
        }
      }

      const data = await clienteResponse.json();
      setClienteDataOriginal(data);

      const datosFormateados = {
        ...data,
        ruc: formatearRUC(data.ruc),
        celular: formatearNumeroParaguayo(data.celular),
        telefono: formatearNumeroParaguayo(data.telefono),
      };

      setClienteData(datosFormateados);

      console.log("📊 Datos del censo cargados:", {
        codCliente: data.cliente?.codclienteerp,
        canalCenso: data.canal,
        esAlta: !data.cliente?.concatcliente,
      });

      // 🔥 VERIFICAR SI EL ESTADO ES "SYNC" - NO HACER VALIDACIONES
      if (data.estado === "SYNC") {
        setAdvertencias(["✅ Cliente en estado SYNC - Validaciones omitidas"]);
        setMostrarResultado(true);
      } else {
        await validarDatos(data, datosFormateados);
      }

      setCodCenso("");
    } catch (error) {
      console.error("Error fetching data:", error);
      setErrores([`Error al cargar los datos del cliente: ${error.message}`]);
    } finally {
      setCargando(false);
    }
  };

  // Función para validar los datos del cliente
  const validarDatos = async (dataOriginal, dataFormateado) => {
    const nuevosErrores = [];
    const nuevasAdvertencias = [];

    // Determinar si es ALTA o ACTUALIZACIÓN
    const esAlta = !dataFormateado.cliente?.concatcliente;
    const codClienteActual = dataFormateado.cliente?.codclienteerp;

    console.log("🎯 Iniciando validación:", {
      esAlta,
      codClienteActual,
      canalCenso: dataFormateado.canal,
    });

    // 🔥 VALIDAR CAMBIOS EN CANAL CON DATOS REALES DEL ERP
    if (!esAlta && codClienteActual) {
      console.log("🔍 Validando cambios en actualización...");
      const validacionCanal = await validarCambiosEnActualizacion(
        dataFormateado,
        codClienteActual,
      );
      nuevosErrores.push(...validacionCanal.errores);
      nuevasAdvertencias.push(...validacionCanal.advertencias);
    } else {
      console.log("ℹ️ No se valida canal porque:", {
        esAlta,
        codClienteActual,
      });
    }

    // Si hay errores de canal, no continuar con otras validaciones de canal
    const hayErroresDeCanal = nuevosErrores.some((error) =>
      error.includes("canal"),
    );

    // Validar RUC con la API (tu código existente)
    if (dataFormateado.ruc && dataFormateado.ruc.trim() !== "") {
      const rucFormateado = dataFormateado.ruc;

      // Mostrar advertencia si hubo cambios de formato
      if (dataOriginal.ruc !== rucFormateado) {
        nuevasAdvertencias.push(
          `RUC formateado: ${dataOriginal.ruc} → ${rucFormateado}`,
        );
      }

      // Validar formato básico
      const regexRUC = /^(\d{5,8}(-\d{1})?|\d{6,9})$/;
      if (!regexRUC.test(rucFormateado)) {
        nuevosErrores.push(
          "El formato del RUC no es válido. Formatos aceptados: 12345, 1234567 o 1234567-0",
        );
      } else {
        // Validar con API solo si el formato es válido
        try {
          const resultadoValidacion = await validarRUC(
            rucFormateado,
            esAlta,
            codClienteActual,
          );

          // En la función validarDatos dentro de useClientData:
          if (!resultadoValidacion.valido) {
            nuevosErrores.push(resultadoValidacion.mensaje);
          } else {
            // Si es válido y es actualización, mostrar información del cliente
            if (!esAlta && resultadoValidacion.clienteExistente) {
              // 🔥 USAR EL MENSAJE ESPECÍFICO DE LA VALIDACIÓN O CREAR UNO DETALLADO
              if (resultadoValidacion.mensaje) {
                nuevasAdvertencias.push(resultadoValidacion.mensaje);
              } else {
                // Mensaje de respaldo
                nuevasAdvertencias.push(
                  `✅ RUC válido para actualización. Cliente: ${resultadoValidacion.clienteExistente.razonsocial}`,
                );
              }

              // 🔥 AGREGAR INFORMACIÓN ESPECÍFICA SI ESTÁ INACTIVO
              if (
                resultadoValidacion.clienteExistente &&
                !resultadoValidacion.clienteExistente.activo
              ) {
                nuevasAdvertencias.push(
                  "⚠️ ATENCIÓN: El cliente existe pero está INACTIVO. Se requiere reactivación en el sistema.",
                );
              }
            } else if (esAlta) {
              nuevasAdvertencias.push(
                "✅ RUC disponible para alta de nuevo cliente",
              );
            }
          }

          setValidacionRUC(resultadoValidacion);
        } catch (error) {
          nuevasAdvertencias.push(
            `⚠️ No se pudo validar el RUC con el sistema: ${error.message}`,
          );
        }
      }
    } else {
      // Si no hay RUC, advertencia
      nuevasAdvertencias.push("El campo RUC está vacío");
    }

    if (dataFormateado.canal) {
      const canalEnExcel = excelData.find(
        (item) => item.codigo === dataFormateado.canal,
      );

      if (!canalEnExcel) {
        nuevosErrores.push(
          `El canal ${dataFormateado.canal} no existe en la configuración`,
        );
      } else {
        // Validar lista de precios según el canal
        const listasValidas = excelData
          .filter((item) => item.codigo === dataFormateado.canal)
          .map((item) => item.listaPrecio)
          .filter(Boolean);

        if (
          dataFormateado.codlistaprecioerp &&
          !listasValidas.includes(dataFormateado.codlistaprecioerp)
        ) {
          // 🔥 USAR LA FUNCIÓN EXTERNA para obtener el nombre
          nuevosErrores.push(
            `La lista de precio ${getNombreListaPrecioExterno(
              dataFormateado.codlistaprecioerp,
            )} no es válida para el canal ${
              dataFormateado.canaleserp?.nombrecanal
            }`,
          );
        }

        if (dataFormateado.subcanal || dataFormateado.subcanal2) {
          const subcanalValido = excelData.find(
            (item) =>
              item.sucursal === dataFormateado.sucursal.codsucursalerp &&
              item.codigo === dataFormateado.canaleserp.codcanalerp &&
              item.subCanal1 === dataFormateado.canaleserp.nombresubcanal &&
              item.subCanal2 === dataFormateado.canaleserp.nombresubcanal2,
          );

          if (!subcanalValido) {
            nuevosErrores.push(
              `La combinación de subcanales puede no ser válida canal: ${dataFormateado.canaleserp.nombrecanal} subcanal1: ${dataFormateado.canaleserp.nombresubcanal} // subcanal2: ${dataFormateado.canaleserp.nombresubcanal2} `,
            );
          }
        }
      }
    }

    // Validar email
    if (dataFormateado.email) {
      const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!regexEmail.test(dataFormateado.email)) {
        nuevasAdvertencias.push("El formato del email no es válido");
      }
    }

    // Validar datos de contacto
    if (!dataFormateado.celular || dataFormateado.celular.length === 0) {
      nuevasAdvertencias.push("El cliente no tiene celular registrado");
    } else if (
      dataFormateado.celular.length !== 10 ||
      !dataFormateado.celular.startsWith("09")
    ) {
      nuevasAdvertencias.push(
        `El número de celular no tiene formato válido: ${dataFormateado.celular}. Formato esperado: 09XXXXXXXX`,
      );
    }

    if (!dataFormateado.telefono || dataFormateado.telefono.length === 0) {
      nuevasAdvertencias.push("El cliente no tiene teléfono registrado");
    } else if (
      dataFormateado.telefono.length !== 10 ||
      !dataFormateado.telefono.startsWith("09")
    ) {
      nuevasAdvertencias.push(
        `El número de teléfono no tiene formato válido: ${dataFormateado.telefono}. Formato esperado: 09XXXXXXXX`,
      );
    }

    // Mostrar información de formateo para celular y teléfono
    if (
      dataOriginal.celular &&
      dataOriginal.celular !== dataFormateado.celular
    ) {
      nuevasAdvertencias.push(
        `Celular formateado: ${dataOriginal.celular} → ${dataFormateado.celular}`,
      );
    }

    if (
      dataOriginal.telefono &&
      dataOriginal.telefono !== dataFormateado.telefono
    ) {
      nuevasAdvertencias.push(
        `Teléfono formateado: ${dataOriginal.telefono} → ${dataFormateado.telefono}`,
      );
    }

    // Validar coordenadas
    if (!dataFormateado.latitud || !dataFormateado.longitud) {
      nuevasAdvertencias.push(
        "Faltan coordenadas GPS. Son recomendables para ubicar al cliente.",
      );
    }

    // 🔥 NUEVA VALIDACIÓN: Mostrar información mejorada de SubGrupo 2
    if (dataFormateado.canaleserp && grupoClienteData.length > 0) {
      const subgrupo2Value = getSubgrupo2Value(dataFormateado.canaleserp);
      if (
        subgrupo2Value !==
        `${dataFormateado.canaleserp.nombresubcanal2} (${dataFormateado.canaleserp.codsubcanalerp2})`
      ) {
        nuevasAdvertencias.push(
          `SubGrupo 2 mejorado: ${dataFormateado.canaleserp.nombresubcanal2} → ${subgrupo2Value}`,
        );
      }
    }

    // Mostrar tipo de operación (ALTA o ACTUALIZACIÓN)
    if (esAlta) {
      nuevasAdvertencias.push("📝 Operación: ALTA de nuevo cliente");
    } else {
      nuevasAdvertencias.push(
        "✏️ Operación: ACTUALIZACIÓN de cliente existente",
      );
    }

    console.log("📋 Resultado validación:", {
      errores: nuevosErrores,
      advertencias: nuevasAdvertencias,
    });

    setErrores(nuevosErrores);
    setAdvertencias(nuevasAdvertencias);
    setMostrarResultado(true);
  };

  return {
    codCenso,
    setCodCenso,
    clienteData,
    setClienteData,
    clienteDataOriginal,
    errores,
    advertencias,
    cargando,
    mostrarResultado,
    validacionRUC,
    validandoRUC: validandoRUCExternal,
    grupoClienteData,
    getSubgrupo2Value,
    fetchClienteData,
  };
};
