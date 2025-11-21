// hooks/useRUCValidation.js
import { useState } from "react";

export const useRUCValidation = () => {
  const [validandoRUC, setValidandoRUC] = useState(false);
  const [errorRUC, setErrorRUC] = useState("");

  const getAuthHeaders = () => {
    const credentials = btoa(
      `${"federico.britez@surcomercial.com.py"}:${"Surcomercial.fb"}`
    );
    return {
      "Content-Type": "application/json",
      Authorization: `Basic ${credentials}`,
    };
  };

  // 🔥 FUNCIÓN MEJORADA: Buscar cliente por RUC priorizando activos
  const buscarClientePorRUC = async (ruc) => {
    setValidandoRUC(true);
    setErrorRUC("");

    try {
      const rucBase = extraerRUCBase(ruc);

      const response = await fetch(
        `https://apps.mobile.com.py:8443/mbusiness/rest/private/clientes?codempresa=15&codclienteerp=&razonsocial=&ruc=${encodeURIComponent(
          rucBase
        )}&codsucursal=0&codcanalerp=`,
        {
          method: "GET",
          headers: getAuthHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const data = await response.json();

      console.log("📊 Resultados API RUC:", data);

      // 🔥 BUSCAR PRIMERO EL CLIENTE ACTIVO
      if (data && data.length > 0) {
        // Priorizar cliente activo
        const clienteActivo = data.find((cliente) => cliente.activo === true);

        if (clienteActivo) {
          console.log("✅ Cliente ACTIVO encontrado:", {
            codCliente: clienteActivo.codclienteerp,
            activo: clienteActivo.activo,
            razonSocial: clienteActivo.razonsocial,
            canal: clienteActivo.canal,
          });
          return clienteActivo;
        }

        // Si no hay activo, tomar el primero (que será inactivo)
        const clienteInactivo = data[0];
        console.log("⚠️ Cliente INACTIVO encontrado:", {
          codCliente: clienteInactivo.codclienteerp,
          activo: clienteInactivo.activo,
          razonSocial: clienteInactivo.razonsocial,
          canal: clienteInactivo.canal,
        });
        return clienteInactivo;
      }

      console.log("❌ No se encontró cliente con RUC:", rucBase);
      return null; // No se encontró cliente
    } catch (error) {
      console.error("Error buscando cliente por RUC:", error);
      setErrorRUC(`Error al validar RUC: ${error.message}`);
      throw error;
    } finally {
      setValidandoRUC(false);
    }
  };

  // 🔥 FUNCIÓN PRINCIPAL DE VALIDACIÓN MEJORADA
  const validarRUC = async (ruc, esAlta = true, codClienteActual = null) => {
    const rucBase = extraerRUCBase(ruc);

    if (!rucBase) {
      return { valido: true }; // RUC vacío no se valida
    }

    try {
      const clienteExistente = await buscarClientePorRUC(rucBase);

      // 🔥 DETERMINAR ESTADO DEL CLIENTE (maneja null)
      let estadoCliente = "";
      if (clienteExistente) {
        estadoCliente = clienteExistente.activo
          ? "Cliente activo"
          : "Cliente inactivo";
      }

      if (esAlta) {
        // Para ALTA: No debe existir el cliente (ni activo ni inactivo)
        if (clienteExistente) {
          return {
            valido: false,
            mensaje: `El RUC ${ruc} ya existe en el sistema. Cliente: ${
              clienteExistente.razonsocial || "N/A"
            } (Código: ${
              clienteExistente.codclienteerp || "N/A"
            } - ${estadoCliente})`,
            clienteExistente,
          };
        }
        return { valido: true };
      } else {
        // Para ACTUALIZACIÓN: Debe existir el cliente y coincidir
        if (!clienteExistente) {
          return {
            valido: false,
            mensaje: `El RUC ${ruc} no existe en el sistema. No se puede cambiar de CI en las actualizaciones.`,
          };
        }

        // Verificar si el RUC pertenece al mismo cliente (si tenemos codClienteActual)
        if (
          codClienteActual &&
          clienteExistente.codclienteerp !== codClienteActual.toString()
        ) {
          return {
            valido: false,
            mensaje: `No se puede cambiar el RUC. El RUC ${ruc} pertenece a otro cliente (${
              clienteExistente.razonsocial || "N/A"
            } - ${
              clienteExistente.codclienteerp || "N/A"
            } - ${estadoCliente}).`,
          };
        }

        // 🔥 AGREGAR INFORMACIÓN DETALLADA SOBRE EL ESTADO
        let mensajeAdicional = "";
        if (clienteExistente.activo) {
          mensajeAdicional = " ✅ Cliente activo";
        } else {
          mensajeAdicional = " ⚠️ Cliente INACTIVO - necesita reactivación";
        }

        return {
          valido: true,
          clienteExistente,
          mensaje: `✅ RUC válido para actualización.${mensajeAdicional}`,
        };
      }
    } catch (error) {
      return {
        valido: false,
        mensaje: `Error al validar RUC: ${error.message}`,
      };
    }
  };

  return {
    validandoRUC,
    errorRUC,
    validarRUC,
    buscarClientePorRUC,
    resetError: () => setErrorRUC(""),
  };
};

// Función para extraer RUC base (sin dígito verificador)
const extraerRUCBase = (ruc) => {
  if (!ruc) return "";

  const rucLimpio = ruc.toString().replace(/\s/g, "");

  // Si tiene guión, tomar solo la parte antes del guión
  if (rucLimpio.includes("-")) {
    return rucLimpio.split("-")[0];
  }

  // Si no tiene guión pero tiene longitud que sugiere dígito verificador incluido
  if (
    rucLimpio.length === 6 ||
    rucLimpio.length === 8 ||
    rucLimpio.length === 9
  ) {
    return rucLimpio.substring(0, rucLimpio.length - 1);
  }

  // Para otros casos, devolver completo
  return rucLimpio;
};
