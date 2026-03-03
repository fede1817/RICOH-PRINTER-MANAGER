const pool = require("./config/database");
const snmpService = require("./services/snmpService");
const pingService = require("./services/pingService");
const emailService = require("./services/emailService");

// Actualización de tóner cada 5 minutos
setInterval(
  async () => {
    try {
      console.log("🔄 Iniciando actualización SNMP de impresoras...");
      const { rows: impresoras } = await pool.query("SELECT * FROM impresoras");

      for (const impresora of impresoras) {
        const resultado = await snmpService.consultarToner(impresora.ip);

        if (!resultado.error && resultado.toner !== null) {
          await actualizarTonerImpresora(impresora, resultado);
        }
      }

      console.log("✅ SNMP actualizado");
    } catch (error) {
      console.error("❌ Error en actualización SNMP:", error);
    }
  },
  5 * 60 * 1000,
); // cada 5 minutos

// Actualización de servidores cada 5 minutos
setInterval(
  async () => {
    try {
      console.log("🔄 Iniciando actualización automática de servidores...");

      const { rows: servidores } = await pool.query("SELECT * FROM servidores");

      for (const servidor of servidores) {
        try {
          const pingResult = await pingService.verificarServidor(servidor.ip);

          await pool.query(
            `UPDATE servidores SET
            estado = $1,
            latencia = $2,
            ultima_verificacion = NOW()
           WHERE id = $3`,
            [
              pingResult.alive ? "activo" : "inactivo",
              pingResult.time,
              servidor.id,
            ],
          );

          console.log(
            `✅ ${servidor.ip} - ${pingResult.alive ? "Activo" : "Inactivo"}`,
          );
        } catch (error) {
          await pool.query(
            `UPDATE servidores SET
            estado = 'inactivo',
            latencia = 'Error',
            ultima_verificacion = NOW()
           WHERE id = $1`,
            [servidor.id],
          );

          console.log(`❌ ${servidor.ip} - Error: ${error.message}`);
        }
      }
    } catch (error) {
      console.error("❌ Error en actualización automática:", error);
    }
  },
  5 * 60 * 1000,
); // 5 minutos

// Función auxiliar para actualizar tóner
async function actualizarTonerImpresora(impresora, resultado) {
  const tonerActual = resultado.toner;
  const tonerAnterior = impresora.toner_anterior;
  const ahora = new Date();
  const ultimaAlerta = impresora.ultima_alerta;
  const pasaron7Dias =
    !ultimaAlerta || ahora - new Date(ultimaAlerta) > 7 * 24 * 60 * 60 * 1000;

  if (tonerAnterior !== null) {
    const diferencia = Math.abs(tonerActual - tonerAnterior);

    if (tonerActual > tonerAnterior && diferencia > 50) {
      await pool.query(
        `UPDATE impresoras SET
          cambios_toner = cambios_toner + 1,
          fecha_ultimo_cambio = NOW(),
          toner_anterior = $1,
          toner_reserva = GREATEST(toner_reserva - 1, 0),
          numero_serie = $2,
          contador_paginas = $3
        WHERE id = $4`,
        [tonerActual, resultado.numero_serie, resultado.contador, impresora.id],
      );
      console.log(
        `🔄 Cambio de tóner detectado en ${impresora.ip}: ${tonerAnterior}% → ${tonerActual}%`,
      );
    } else if (diferencia > 5) {
      await pool.query(
        `UPDATE impresoras SET
          toner_anterior = $1,
          numero_serie = $2,
          contador_paginas = $3
        WHERE id = $4`,
        [tonerActual, resultado.numero_serie, resultado.contador, impresora.id],
      );
    }
  } else {
    await pool.query(
      `UPDATE impresoras SET
        toner_anterior = $1,
        numero_serie = $2,
        contador_paginas = $3
      WHERE id = $4`,
      [tonerActual, resultado.numero_serie, resultado.contador, impresora.id],
    );
  }

  // Enviar alerta si tóner bajo
  if (
    tonerActual !== null &&
    tonerActual > 0 &&
    tonerActual <= 20 &&
    pasaron7Dias
  ) {
    await emailService.enviarAlertaTonerBajo(impresora, tonerActual, resultado);
  }
}

console.log("🕐 Tareas programadas iniciadas (cada 5 minutos)");

module.exports = {}; // Exportar vacío, solo para iniciar los intervalos
