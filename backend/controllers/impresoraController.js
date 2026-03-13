const pool = require("../config/database");
const snmp = require("net-snmp"); // 👈 FALTABA ESTA IMPORTACIÓN
const snmpService = require("../services/snmpService");
const pingService = require("../services/pingService");
const emailService = require("../services/emailService");
const printerService = require("../services/printerService");

class ImpresoraController {
  // Obtener todas las impresoras
  async getAll(req, res) {
    try {
      const result = await pool.query("SELECT * FROM impresoras ORDER BY id");
      res.json({ impresoras: result.rows });
    } catch (error) {
      console.error("❌ Error consultando BD:", error);
      res.status(500).json({ error: "Error al obtener impresoras" });
    }
  }

  // Agregar nueva impresora
  async create(req, res) {
    const {
      ip,
      sucursal,
      modelo,
      drivers_url,
      tipo,
      toner_reserva,
      direccion,
    } = req.body;

    try {
      const snmpData = await snmpService.consultarToner(ip);
      const toner = snmpData.toner ?? 0;
      const numero_serie = snmpData.numero_serie ?? "";
      const contador = snmpData.contador ?? 0;
      const estadoInicial = await pingService.verificarEstadoImpresora(ip);

      await pool.query(
        `INSERT INTO impresoras
          (ip, sucursal, modelo, drivers_url, tipo, toner_reserva, direccion,
           cambios_toner, toner_anterior, numero_serie, contador_paginas, estado, ultima_verificacion)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 0, $8, $9, $10, $11, $12)`,
        [
          ip,
          sucursal,
          modelo,
          drivers_url,
          tipo,
          toner_reserva,
          direccion,
          toner,
          numero_serie,
          contador,
          estadoInicial.estado,
          estadoInicial.ultima_verificacion,
        ],
      );

      res
        .status(201)
        .json({
          message: "Impresora agregada con lectura SNMP inicial",
          toner_inicial: toner,
          estado: estadoInicial.estado,
        });
    } catch (err) {
      console.error("❌ Error al agregar impresora:", err);
      res.status(500).json({ error: "Error al insertar impresora" });
    }
  }

  // Actualizar impresora
  async update(req, res) {
    const { id } = req.params;
    const {
      ip,
      sucursal,
      modelo,
      drivers_url,
      tipo,
      toner_reserva,
      direccion,
    } = req.body;

    try {
      const result = await pool.query(
        `UPDATE impresoras SET
          ip = $1, sucursal = $2, modelo = $3, drivers_url = $4, tipo = $5,
          toner_reserva = $6, direccion = $7
         WHERE id = $8 RETURNING *`,
        [ip, sucursal, modelo, drivers_url, tipo, toner_reserva, direccion, id],
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Impresora no encontrada" });
      }

      res.json(result.rows[0]);
    } catch (error) {
      console.error("❌ Error al editar impresora:", error);
      res.status(500).json({ error: "Error al editar impresora" });
    }
  }

  // Eliminar impresora
  async delete(req, res) {
    const { id } = req.params;
    try {
      const result = await pool.query(
        "DELETE FROM impresoras WHERE id = $1 RETURNING *",
        [id],
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Impresora no encontrada" });
      }
      res.json({ mensaje: "Impresora eliminada correctamente" });
    } catch (error) {
      console.error("❌ Error al eliminar impresora:", error);
      res.status(500).json({ error: "Error al eliminar impresora" });
    }
  }

  // Verificar estado de una impresora
  async getStatus(req, res) {
    try {
      const { id } = req.params;
      const result = await pool.query(
        "SELECT * FROM impresoras WHERE id = $1",
        [id],
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Impresora no encontrada" });
      }

      const impresora = result.rows[0];
      const estado = await pingService.verificarEstadoImpresora(impresora.ip);

      await pool.query(
        "UPDATE impresoras SET estado = $1, ultima_verificacion = $2 WHERE id = $3",
        [estado.estado, estado.ultima_verificacion, id],
      );

      res.json({
        id: parseInt(id),
        estado: estado.estado,
        ultima_verificacion: estado.ultima_verificacion,
      });
    } catch (error) {
      console.error("❌ Error verificando estado:", error);
      res
        .status(500)
        .json({ error: "Error al verificar estado: " + error.message });
    }
  }

  // Verificar estado de todas las impresoras
  async getAllStatus(req, res) {
    try {
      const { rows: impresoras } = await pool.query("SELECT * FROM impresoras");
      const resultados = [];

      for (const impresora of impresoras) {
        try {
          const estado = await Promise.race([
            pingService.verificarEstadoImpresora(impresora.ip),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error("Timeout")), 40000),
            ),
          ]);

          await pool.query(
            "UPDATE impresoras SET estado = $1, ultima_verificacion = $2 WHERE id = $3",
            [estado.estado, estado.ultima_verificacion, impresora.id],
          );

          resultados.push({
            id: impresora.id,
            estado: estado.estado,
            ultima_verificacion: estado.ultima_verificacion,
          });
        } catch (error) {
          await pool.query(
            "UPDATE impresoras SET estado = $1, ultima_verificacion = $2 WHERE id = $3",
            ["desconectada", new Date(), impresora.id],
          );
          resultados.push({
            id: impresora.id,
            estado: "desconectada",
            ultima_verificacion: new Date(),
          });
        }
      }

      res.json(resultados);
    } catch (error) {
      console.error("❌ Error verificando estados:", error);
      res
        .status(500)
        .json({ error: "Error al verificar estados: " + error.message });
    }
  }

  // Reiniciar impresora
  async reboot(req, res) {
    try {
      const { id } = req.params;
      const { tipo = "warm", community_write = "private" } = req.body;

      const result = await pool.query(
        "SELECT ip, modelo, sucursal FROM impresoras WHERE id = $1",
        [id],
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Impresora no encontrada" });
      }

      const impresora = result.rows[0];
      const estadoActual = await pingService.verificarEstadoImpresora(
        impresora.ip,
      );

      if (estadoActual.estado === "desconectada") {
        return res.status(400).json({
          error: "Impresora desconectada",
          ip: impresora.ip,
          estado: "desconectada",
        });
      }

      const snmpCheck = await snmpService.verificarSNMPEscritura(
        impresora.ip,
        community_write,
      );

      if (!snmpCheck.habilitado) {
        return res.status(403).json({
          error: "SNMP de escritura no habilitado",
          ip: impresora.ip,
          community_probada: community_write,
        });
      }

      const resultado = await snmpService.reiniciarImpresora(
        impresora.ip,
        community_write,
        tipo,
      );

      res.json({
        id: parseInt(id),
        ip: impresora.ip,
        modelo: impresora.modelo,
        sucursal: impresora.sucursal,
        reinicio: resultado,
        estado_previo: estadoActual.estado,
        timestamp: new Date(),
      });
    } catch (error) {
      console.error("❌ Error en reinicio:", error);
      res.status(500).json({
        error: "Error al reiniciar impresora: " + error.message,
        detalle: error.message,
      });
    }
  }

  // Verificar SNMP
  async checkSNMP(req, res) {
    try {
      const { id } = req.params;
      const { community_write = "private" } = req.query;

      const result = await pool.query(
        "SELECT ip, modelo, estado FROM impresoras WHERE id = $1",
        [id],
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Impresora no encontrada" });
      }

      const impresora = result.rows[0];
      const estado = await pingService.verificarEstadoImpresora(impresora.ip);

      if (estado.estado === "desconectada") {
        return res.json({
          id: parseInt(id),
          ip: impresora.ip,
          estado: "desconectada",
          snmp_escritura: "no verificable",
          mensaje: "Impresora no responde",
        });
      }

      // 👇 AHORA snmp ESTÁ IMPORTADO Y FUNCIONA
      const sessionRead = snmp.createSession(impresora.ip, "public", {
        timeout: 3000,
      });

      const lecturaSNMP = await new Promise((resolve) => {
        sessionRead.get(["1.3.6.1.2.1.1.1.0"], (error, varbinds) => {
          sessionRead.close();
          resolve({ habilitado: !error, error: error?.message });
        });
      });

      const escrituraSNMP = await snmpService.verificarSNMPEscritura(
        impresora.ip,
        community_write,
      );

      res.json({
        id: parseInt(id),
        ip: impresora.ip,
        modelo: impresora.modelo,
        estado: estado.estado,
        snmp_lectura: {
          habilitado: lecturaSNMP.habilitado,
          community: "public",
        },
        snmp_escritura: escrituraSNMP,
        recomendacion: escrituraSNMP.habilitado
          ? "Listo para reinicios remotos"
          : "Configurar SNMP write en la impresora",
      });
    } catch (error) {
      console.error("❌ Error verificando SNMP:", error);
      res
        .status(500)
        .json({ error: "Error al verificar SNMP: " + error.message });
    }
  }

  // Obtener toners de color
  async getColorToners(req, res) {
    try {
      const { id } = req.params;
      const result = await pool.query(
        "SELECT ip FROM impresoras WHERE id = $1",
        [id],
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Impresora no encontrada" });
      }

      const { ip } = result.rows[0];
      const tonerData = await snmpService.consultarColorToners(ip);

      if (tonerData.error) {
        return res.status(500).json({ error: "No se pudieron obtener los niveles de toner a color", detalle: tonerData.mensaje });
      }

      res.json(tonerData);
    } catch (error) {
      console.error("❌ Error al obtener toners de color:", error);
      res.status(500).json({ error: "Error obteniendo toners: " + error.message });
    }
  }

  // Imprimir archivo
  async print(req, res) {
    try {
      const { id } = req.params;
      const result = await pool.query(
        "SELECT * FROM impresoras WHERE id = $1",
        [id],
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Impresora no encontrada" });
      }

      const impresora = result.rows[0];
      let filePath = req.file.path;
      let isTempPdf = false;

      if (
        req.file.mimetype ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      ) {
        console.log("📄 Documento Word detectado, convirtiendo a PDF...");
        filePath = await printerService.convertWordToPdf(filePath, "uploads/");
        isTempPdf = true;
      }

      if (req.file.mimetype.includes("pdf") || isTempPdf) {
        await printerService.resizeToA4(filePath);
      }

      await printerService.sendToPrinter(impresora.ip, filePath);
      res.json({ success: true, message: "Archivo enviado a imprimir en A4" });

      if (isTempPdf) printerService.cleanupFile(filePath);
    } catch (error) {
      console.error("❌ Error en impresión:", error);
      res.status(500).json({ error: "Error al imprimir: " + error.message });
    }
  }
}

module.exports = new ImpresoraController();
