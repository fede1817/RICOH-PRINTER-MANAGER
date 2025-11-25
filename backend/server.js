const express = require("express");
const cors = require("cors");
const snmp = require("net-snmp");
const { Pool } = require("pg");
const ping = require("ping");
const multer = require("multer");
const { exec } = require("child_process");
const net = require("net");
const fs = require("fs");
const path = require("path");
const { PDFDocument } = require("pdf-lib");
const upload = multer({ dest: "uploads/" }); // carpeta temporal

const app = express();
const PORT = 3001;
app.use(cors());
app.use(express.json());

const pool = new Pool({
  user: "postgres",
  host: "192.168.8.166",
  database: "impresoras",
  password: "123",
  port: 5432,
});

// OIDs SNMP comunes para impresoras Ricoh
const oids = [
  "1.3.6.1.2.1.43.11.1.1.9.1.1", // Toner negro
  "1.3.6.1.2.1.43.5.1.1.17.1", // Número de serie
  "1.3.6.1.2.1.43.10.2.1.4.1.1", // Contador total de páginas
];

const nodemailer = require("nodemailer");

// 🔧 NUEVA FUNCIÓN: Verificar estado de conexión de una impresora
async function verificarEstadoImpresora(ip) {
  try {
    // Intentar ping primero
    const pingResult = await ping.promise.probe(ip, { timeout: 3 });

    if (!pingResult.alive) {
      return { estado: "desconectada", ultima_verificacion: new Date() };
    }

    // Si responde al ping, intentar conexión SNMP para confirmar
    const snmpResult = await new Promise((resolve) => {
      const session = snmp.createSession(ip, "public", { timeout: 3000 });

      session.get(["1.3.6.1.2.1.1.1.0"], (error, varbinds) => {
        if (error) {
          resolve({ estado: "desconectada", ultima_verificacion: new Date() });
        } else {
          resolve({ estado: "conectada", ultima_verificacion: new Date() });
        }
        session.close();
      });
    });

    return snmpResult;
  } catch (error) {
    console.error(`❌ Error verificando estado de ${ip}:`, error);
    return { estado: "desconectada", ultima_verificacion: new Date() };
  }
}

// 🔧 NUEVA RUTA: Verificar estado de una impresora específica
app.get("/api/impresoras/:id/status", async (req, res) => {
  try {
    const { id } = req.params;

    // Buscar impresora en la BD
    const result = await pool.query("SELECT * FROM impresoras WHERE id = $1", [
      id,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Impresora no encontrada" });
    }

    const impresora = result.rows[0];

    // Verificar estado
    const estado = await verificarEstadoImpresora(impresora.ip);

    // Actualizar en la base de datos
    await pool.query(
      "UPDATE impresoras SET estado = $1, ultima_verificacion = $2 WHERE id = $3",
      [estado.estado, estado.ultima_verificacion, id]
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
});

// 🔧 NUEVA RUTA: Verificar estado de TODAS las impresoras
app.get("/api/impresoras/status", async (req, res) => {
  try {
    const { rows: impresoras } = await pool.query("SELECT * FROM impresoras");
    const resultados = [];

    // Verificar estado de cada impresora (con límite de tiempo)
    for (const impresora of impresoras) {
      try {
        const estado = await Promise.race([
          verificarEstadoImpresora(impresora.ip),
          new Promise(
            (_, reject) => setTimeout(() => reject(new Error("Timeout")), 40000) // 40 segundos timeout
          ),
        ]);

        // Actualizar en la base de datos
        await pool.query(
          "UPDATE impresoras SET estado = $1, ultima_verificacion = $2 WHERE id = $3",
          [estado.estado, estado.ultima_verificacion, impresora.id]
        );

        resultados.push({
          id: impresora.id,
          estado: estado.estado,
          ultima_verificacion: estado.ultima_verificacion,
        });
      } catch (error) {
        console.error(`❌ Error con impresora ${impresora.ip}:`, error);

        // En caso de error, marcar como desconectada
        await pool.query(
          "UPDATE impresoras SET estado = $1, ultima_verificacion = $2 WHERE id = $3",
          ["desconectada", new Date(), impresora.id]
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
});

// Convertir Word a PDF con LibreOffice
function convertWordToPdf(inputPath, outputDir) {
  return new Promise((resolve, reject) => {
    // 🔹 Ruta absoluta al ejecutable de LibreOffice
    const libreOfficePath = `"C:\\Program Files\\LibreOffice\\program\\soffice.exe"`;

    const command = `${libreOfficePath} --headless --convert-to pdf "${inputPath}" --outdir "${outputDir}"`;

    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error("❌ Error en conversión:", stderr);
        return reject(error);
      }
      console.log("📄 Conversión salida:", stdout);

      const outputFile = path.join(
        outputDir,
        path.basename(inputPath, path.extname(inputPath)) + ".pdf"
      );
      resolve(outputFile);
    });
  });
}

// Enviar archivo a impresora por puerto RAW 9100
function sendToPrinter(printerIp, filePath) {
  return new Promise((resolve, reject) => {
    const client = new net.Socket();
    client.connect(9100, printerIp, () => {
      console.log(`📡 Conectado a impresora ${printerIp}`);
      const fileStream = fs.createReadStream(filePath);

      fileStream.on("data", (chunk) => client.write(chunk));
      fileStream.on("end", () => {
        console.log("✅ Archivo enviado a impresora");
        client.end();
        resolve();
      });
    });

    client.on("error", (err) => {
      reject(new Error("Error al imprimir: " + err.message));
    });
  });
}

// 🖨 Enviar archivo a imprimir
app.post(
  "/api/impresoras/:id/print",
  upload.single("file"),
  async (req, res) => {
    try {
      const { id } = req.params;

      // Buscar impresora en la BD
      const result = await pool.query(
        "SELECT * FROM impresoras WHERE id = $1",
        [id]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Impresora no encontrada" });
      }
      const impresora = result.rows[0];

      let filePath = req.file.path;
      let isTempPdf = false;

      // Si es Word (.docx), convertir a PDF primero
      if (
        req.file.mimetype ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      ) {
        console.log("📄 Documento Word detectado, convirtiendo a PDF...");
        filePath = await convertWordToPdf(filePath, "uploads/");
        isTempPdf = true; // marcar para borrar luego
      }

      // Reescalar a A4 si es PDF
      if (req.file.mimetype.includes("pdf") || isTempPdf) {
        const pdfBytes = fs.readFileSync(filePath);
        const pdfDoc = await PDFDocument.load(pdfBytes);

        const a4Width = 595.28; // puntos
        const a4Height = 841.89;

        pdfDoc.getPages().forEach((page) => {
          page.setSize(a4Width, a4Height);
        });

        const a4PdfBytes = await pdfDoc.save();
        fs.writeFileSync(filePath, a4PdfBytes);
        console.log("📄 PDF reescalado a A4");
      }

      // Enviar a la impresora
      await sendToPrinter(impresora.ip, filePath);

      res.json({ success: true, message: "Archivo enviado a imprimir en A4" });

      // Borrar archivo temporal si es Word convertido
      if (isTempPdf) fs.unlink(filePath, () => {});
    } catch (error) {
      console.error("❌ Error en impresión:", error);
      res.status(500).json({ error: "Error al imprimir: " + error.message });
    }
  }
);

const transporter = nodemailer.createTransport({
  host: "mail.surcomercial.com.py", // ejemplo: mail.zimbra.tuempresa.com
  port: 587,
  secure: false, // usa true si tienes SSL en puerto 465
  auth: {
    user: "federico.britez@surcomercial.com.py", // correo desde donde se envía
    pass: "Surcomercial.fbb",
  },
});

function consultarToner(ip) {
  return new Promise((resolve) => {
    const session = snmp.createSession(ip, "public", { timeout: 3000 });

    session.get(oids, (error, varbinds) => {
      if (error) {
        resolve({ error: true, mensaje: "SNMP Error: " + error.message });
      } else {
        const tonerRaw = varbinds[0]?.value;
        const numeroSerieRaw = varbinds[1]?.value;
        const contadorRaw = varbinds[2]?.value;

        const toner =
          tonerRaw !== null && !isNaN(tonerRaw) ? parseInt(tonerRaw, 10) : null;
        const numero_serie = numeroSerieRaw
          ? String(numeroSerieRaw).trim()
          : null;
        const contador =
          contadorRaw !== null && !isNaN(contadorRaw)
            ? parseInt(contadorRaw, 10)
            : null;

        resolve({ toner, numero_serie, contador, error: false });
      }

      session.close();
    });
  });
}

// 🟢 Actualiza SNMP cada 5 minutos y guarda en BD
setInterval(async () => {
  try {
    const { rows: impresoras } = await pool.query("SELECT * FROM impresoras");

    for (const impresora of impresoras) {
      const resultado = await consultarToner(impresora.ip);

      if (!resultado.error && resultado.toner !== null) {
        const tonerActual = resultado.toner;
        const tonerAnterior = impresora.toner_anterior;
        const ahora = new Date();
        const ultimaAlerta = impresora.ultima_alerta;
        const pasaron7Dias =
          !ultimaAlerta ||
          ahora - new Date(ultimaAlerta) > 7 * 24 * 60 * 60 * 1000;

        // ACTUALIZACIÓN DE TÓNER Y CONTADOR
        // Reemplaza la lógica de detección de cambio de tóner con esto:
        if (tonerAnterior !== null) {
          const diferencia = Math.abs(tonerActual - tonerAnterior);

          // Detectar cambio de tóner: aumento significativo (más del 50%)
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
              [
                tonerActual,
                resultado.numero_serie,
                resultado.contador,
                impresora.id,
              ]
            );
            console.log(
              `🔄 Cambio de tóner detectado en ${impresora.ip}: ${tonerAnterior}% → ${tonerActual}%`
            );
          } else if (diferencia > 5) {
            // Actualizar solo si hay cambio significativo
            await pool.query(
              `UPDATE impresoras SET
                toner_anterior = $1,
                numero_serie = $2,
                contador_paginas = $3
            WHERE id = $4`,
              [
                tonerActual,
                resultado.numero_serie,
                resultado.contador,
                impresora.id,
              ]
            );
          }
        } else {
          // Primera lectura, solo establecer valores iniciales
          await pool.query(
            `UPDATE impresoras SET
            toner_anterior = $1,
            numero_serie = $2,
            contador_paginas = $3
        WHERE id = $4`,
            [
              tonerActual,
              resultado.numero_serie,
              resultado.contador,
              impresora.id,
            ]
          );
        }

        // ENVÍO DE CORREO SI EL TÓNER ES BAJO
        if (
          tonerActual !== null &&
          tonerActual > 0 &&
          tonerActual <= 20 &&
          pasaron7Dias
        ) {
          const correoDestino = "bryan.medina@surcomercial.com.py"; // Cambiar si se requiere

          const info = {
            modelo: impresora.modelo,
            numero_serie: resultado.numero_serie ?? "N/A",
            contador_total: resultado.contador ?? "N/A",
            sucursal: impresora.sucursal || "Sucursal Desconocida",
            direccion: impresora.direccion || "Dirección no especificada",
            telefono: "0987 200316",
            correo: "bryan.medina@surcomercial.com.py",
            tipo: impresora.tipo,
          };

          const htmlBody = `
            <h3>⚠ Nivel bajo de tóner detectado ${tonerActual}%</h3>
            <h3>⚠ tipo ${impresora.tipo}</h3>
            <h3>⚠ ip: ${impresora.ip}</h3>
            <ul>
              <li><strong>Sucursal:</strong> ${info.sucursal}</li>
              <li><strong>Dirección:</strong> ${info.direccion}</li>
              <li><strong>Modelo:</strong> ${info.modelo}</li>
              <li><strong>N° de serie:</strong> ${info.numero_serie}</li>
              <li><strong>Contador total:</strong> ${info.contador_total}</li>
              <li><strong>Teléfono:</strong> ${info.telefono}</li>
              <li><strong>Correo:</strong> ${info.correo}</li>
            </ul>
          `;

          await transporter.sendMail({
            from: '"Alerta de Tóner" <federico.britez@surcomercial.com.py>',
            to: correoDestino,
            cc: ["federico.britez@surcomercial.com.py"],
            subject: `🖨 Tóner bajo en ${info.sucursal} - ${info.modelo} - ${info.tipo}`,
            html: htmlBody,
          });

          await pool.query(
            `UPDATE impresoras SET ultima_alerta = NOW() WHERE id = $1`,
            [impresora.id]
          );

          console.log(
            `📧 Alerta enviada para ${info.modelo} (${info.sucursal})`
          );
        }
      }
    }

    console.log("✅ SNMP actualizado");
  } catch (error) {
    console.error("❌ Error en actualización SNMP:", error);
  }
}, 5 * 60 * 1000); // cada 5 minutos

// 🔵 Agregar impresora
app.post("/api/impresoras", async (req, res) => {
  const { ip, sucursal, modelo, drivers_url, tipo, toner_reserva, direccion } =
    req.body;

  try {
    const snmpData = await consultarToner(ip);

    const toner = snmpData.toner ?? 0; // Si no hay SNMP, inicializa con 0
    const numero_serie = snmpData.numero_serie ?? "";
    const contador = snmpData.contador ?? 0;

    // Verificar estado inicial
    const estadoInicial = await verificarEstadoImpresora(ip);

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
      ]
    );

    res.status(201).json({
      message: "Impresora agregada con lectura SNMP inicial",
      toner_inicial: toner,
      estado: estadoInicial.estado,
    });
  } catch (err) {
    console.error("❌ Error al agregar impresora:", err);
    res.status(500).json({ error: "Error al insertar impresora" });
  }
});

// 🟢 Obtener impresoras (desde BD, no SNMP en tiempo real)
app.get("/api/toners", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM impresoras ORDER BY id");
    res.json({ impresoras: result.rows });
  } catch (error) {
    console.error("❌ Error consultando BD:", error);
    res.status(500).json({ error: "Error al obtener impresoras" });
  }
});

// 🟠 Editar impresora
app.put("/api/impresoras/:id", async (req, res) => {
  const { id } = req.params;
  const { ip, sucursal, modelo, drivers_url, tipo, toner_reserva, direccion } =
    req.body;

  try {
    const result = await pool.query(
      `UPDATE impresoras SET 
        ip = $1, sucursal = $2, modelo = $3, drivers_url = $4, tipo = $5, 
        toner_reserva = $6, direccion = $7
       WHERE id = $8 RETURNING *`,
      [ip, sucursal, modelo, drivers_url, tipo, toner_reserva, direccion, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Impresora no encontrada" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("❌ Error al editar impresora:", error);
    res.status(500).json({ error: "Error al editar impresora" });
  }
});

// 🔴 Eliminar impresora
app.delete("/api/impresoras/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      "DELETE FROM impresoras WHERE id = $1 RETURNING *",
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Impresora no encontrada" });
    }
    res.json({ mensaje: "Impresora eliminada correctamente" });
  } catch (error) {
    console.error("❌ Error al eliminar impresora:", error);
    res.status(500).json({ error: "Error al eliminar impresora" });
  }
});

// 📦 Registrar pedido
app.put("/api/pedido", async (req, res) => {
  const { impresora_id } = req.body;

  try {
    await pool.query(
      `UPDATE impresoras SET 
        ultimo_pedido_fecha = NOW(),
        toner_reserva = toner_reserva + 1
       WHERE id = $1`,
      [impresora_id]
    );
    res.status(200).json({ message: "Pedido registrado correctamente" });
  } catch (error) {
    console.error("❌ Error en el pedido:", error);
    res.status(500).json({ error: "Error al registrar pedido" });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
});

// 📊 ping
// app.post("/ping", async (req, res) => {
//   const { host } = req.body;

//   if (!host) {
//     return res.status(400).json({ error: "Debes enviar un host o IP" });
//   }

//   try {
//     const result = await ping.promise.probe(host, { timeout: 5 });
//     res.json({
//       host: result.host,
//       alive: result.alive,
//       time: result.time,
//     });
//   } catch (error) {
//     res.status(500).json({ error: "Error al hacer ping" });
//   }
// });
// 🟢 Obtener todos los servidores/equipos de red
app.get("/api/servidores", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM servidores ORDER BY id");
    res.json({ servidores: result.rows });
  } catch (error) {
    console.error("❌ Error consultando servidores:", error);
    res.status(500).json({ error: "Error al obtener servidores" });
  }
});

// 🟢 Obtener servidor por ID
app.get("/api/servidores/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query("SELECT * FROM servidores WHERE id = $1", [
      id,
    ]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Servidor no encontrado" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error("❌ Error consultando servidor:", error);
    res.status(500).json({ error: "Error al obtener servidor" });
  }
});

// 🟢 Agregar nuevo servidor/equipo
app.post("/api/servidores", async (req, res) => {
  const { ip, sucursal, nombre, tipo } = req.body;

  if (!ip || !sucursal) {
    return res.status(400).json({ error: "IP y Sucursal son requeridos" });
  }

  try {
    // Verificar si la IP ya existe
    const existing = await pool.query(
      "SELECT id FROM servidores WHERE ip = $1",
      [ip]
    );
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: "La IP ya existe en el sistema" });
    }

    // Hacer ping para verificar estado inicial
    const pingResult = await ping.promise.probe(ip, { timeout: 5 });

    const result = await pool.query(
      `INSERT INTO servidores (ip, sucursal, nombre, tipo, estado, latencia, ultima_verificacion) 
       VALUES ($1, $2, $3, $4, $5, $6, NOW()) RETURNING *`,
      [
        ip,
        sucursal,
        nombre || `Equipo ${ip}`,
        tipo || "servidor",
        pingResult.alive ? "activo" : "inactivo",
        pingResult.alive ? `${pingResult.time}ms` : "Timeout",
      ]
    );

    res.status(201).json({
      message: "Servidor agregado correctamente",
      servidor: result.rows[0],
    });
  } catch (error) {
    console.error("❌ Error al agregar servidor:", error);
    res.status(500).json({ error: "Error al agregar servidor" });
  }
});

// 🟠 Actualizar servidor
app.put("/api/servidores/:id", async (req, res) => {
  const { id } = req.params;
  const { ip, sucursal, nombre, tipo } = req.body;

  try {
    const result = await pool.query(
      `UPDATE servidores SET 
        ip = $1, sucursal = $2, nombre = $3, tipo = $4, updated_at = NOW()
       WHERE id = $5 RETURNING *`,
      [ip, sucursal, nombre, tipo, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Servidor no encontrado" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("❌ Error al actualizar servidor:", error);
    res.status(500).json({ error: "Error al actualizar servidor" });
  }
});

// 🔴 Eliminar servidor
app.delete("/api/servidores/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      "DELETE FROM servidores WHERE id = $1 RETURNING *",
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Servidor no encontrado" });
    }
    res.json({ mensaje: "Servidor eliminado correctamente" });
  } catch (error) {
    console.error("❌ Error al eliminar servidor:", error);
    res.status(500).json({ error: "Error al eliminar servidor" });
  }
});

// 🔄 Verificar estado de un servidor específico (Ping)
app.post("/api/servidores/:id/verificar", async (req, res) => {
  const { id } = req.params;

  try {
    // Obtener datos del servidor
    const serverResult = await pool.query(
      "SELECT * FROM servidores WHERE id = $1",
      [id]
    );
    if (serverResult.rows.length === 0) {
      return res.status(404).json({ error: "Servidor no encontrado" });
    }

    const servidor = serverResult.rows[0];

    // Hacer ping
    const pingResult = await ping.promise.probe(servidor.ip, { timeout: 5 });

    // Actualizar estado en la base de datos
    await pool.query(
      `UPDATE servidores SET 
        estado = $1, 
        latencia = $2, 
        ultima_verificacion = NOW() 
       WHERE id = $3`,
      [
        pingResult.alive ? "activo" : "inactivo",
        pingResult.alive ? `${pingResult.time}ms` : "Timeout",
        id,
      ]
    );

    res.json({
      servidor: servidor.ip,
      estado: pingResult.alive ? "activo" : "inactivo",
      latencia: pingResult.alive ? `${pingResult.time}ms` : "Timeout",
      timestamp: new Date().toISOString(), // ✅ siempre válido
    });
  } catch (error) {
    console.error("❌ Error al verificar servidor:", error);
    res.status(500).json({ error: "Error al verificar servidor" });
  }
});

// 🔄 Verificar estado de todos los servidores
app.post("/api/servidores/verificar-todos", async (req, res) => {
  try {
    const { rows: servidores } = await pool.query("SELECT * FROM servidores");
    const resultados = [];

    for (const servidor of servidores) {
      try {
        const pingResult = await ping.promise.probe(servidor.ip, {
          timeout: 5,
        });

        await pool.query(
          `UPDATE servidores SET 
            estado = $1, 
            latencia = $2, 
            ultima_verificacion = NOW() 
           WHERE id = $3`,
          [
            pingResult.alive ? "activo" : "inactivo",
            pingResult.alive ? `${pingResult.time}ms` : "Timeout",
            servidor.id,
          ]
        );

        resultados.push({
          id: servidor.id,
          ip: servidor.ip,
          estado: pingResult.alive ? "activo" : "inactivo",
          latencia: pingResult.alive ? `${pingResult.time}ms` : "Timeout",
          success: true,
        });
      } catch (error) {
        resultados.push({
          id: servidor.id,
          ip: servidor.ip,
          estado: "inactivo",
          latencia: "Error",
          success: false,
          error: error.message,
        });
      }
    }

    res.json({
      message: "Verificación completada",
      resultados,
    });
  } catch (error) {
    console.error("❌ Error al verificar todos los servidores:", error);
    res.status(500).json({ error: "Error en la verificación masiva" });
  }
});

// 📊 Estadísticas de servidores
app.get("/api/servidores-estadisticas", async (req, res) => {
  try {
    const totalResult = await pool.query("SELECT COUNT(*) FROM servidores");
    const activosResult = await pool.query(
      "SELECT COUNT(*) FROM servidores WHERE estado = 'activo'"
    );
    const inactivosResult = await pool.query(
      "SELECT COUNT(*) FROM servidores WHERE estado = 'inactivo'"
    );

    const porTipoResult = await pool.query(`
      SELECT tipo, COUNT(*) as cantidad 
      FROM servidores 
      GROUP BY tipo
    `);

    const estadisticas = {
      total: parseInt(totalResult.rows[0].count),
      activos: parseInt(activosResult.rows[0].count),
      inactivos: parseInt(inactivosResult.rows[0].count),
      porcentajeSalud:
        totalResult.rows[0].count > 0
          ? Math.round(
              (parseInt(activosResult.rows[0].count) /
                parseInt(totalResult.rows[0].count)) *
                100
            )
          : 0,
      porTipo: porTipoResult.rows,
    };

    res.json(estadisticas);
  } catch (error) {
    console.error("❌ Error obteniendo estadísticas:", error);
    res.status(500).json({ error: "Error al obtener estadísticas" });
  }
});

// 🔄 Actualización automática cada 5 minutos
setInterval(async () => {
  try {
    console.log("🔄 Iniciando actualización automática de servidores...");

    const { rows: servidores } = await pool.query("SELECT * FROM servidores");
    const resultados = [];

    for (const servidor of servidores) {
      try {
        const pingResult = await ping.promise.probe(servidor.ip, {
          timeout: 5,
        });

        await pool.query(
          `UPDATE servidores SET 
            estado = $1, 
            latencia = $2, 
            ultima_verificacion = NOW() 
           WHERE id = $3`,
          [
            pingResult.alive ? "activo" : "inactivo",
            pingResult.alive ? `${pingResult.time}ms` : "Timeout",
            servidor.id,
          ]
        );

        resultados.push({
          id: servidor.id,
          ip: servidor.ip,
          estado: pingResult.alive ? "activo" : "inactivo",
          latencia: pingResult.alive ? `${pingResult.time}ms` : "Timeout",
          success: true,
        });

        console.log(
          `✅ ${servidor.ip} - ${pingResult.alive ? "Activo" : "Inactivo"}`
        );
      } catch (error) {
        await pool.query(
          `UPDATE servidores SET 
            estado = 'inactivo', 
            latencia = 'Error', 
            ultima_verificacion = NOW() 
           WHERE id = $1`,
          [servidor.id]
        );

        resultados.push({
          id: servidor.id,
          ip: servidor.ip,
          estado: "inactivo",
          latencia: "Error",
          success: false,
          error: error.message,
        });

        console.log(`❌ ${servidor.ip} - Error: ${error.message}`);
      }
    }

    const exitosos = resultados.filter((r) => r.success).length;
    const total = resultados.length;
    console.log(
      `📊 Actualización completada: ${exitosos}/${total} servidores activos`
    );
  } catch (error) {
    console.error("❌ Error en actualización automática:", error);
  }
}, 5 * 60 * 1000); // 5 minutos

console.log("🕐 Actualización automática programada cada 5 minutos");

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🟢 Servidor activo en http://localhost:${PORT}`);
});

// En tu servidor, para PostgreSQL:
app.post("/api/pedidos", async (req, res) => {
  try {
    const { solicitante, sucursal, modelo_impresora, tipo_toner, cantidad } =
      req.body;

    const query = `
      INSERT INTO pedidos (solicitante, sucursal, modelo_impresora, tipo_toner, cantidad)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id
    `;

    const result = await pool.query(query, [
      solicitante,
      sucursal,
      modelo_impresora,
      tipo_toner,
      cantidad,
    ]);

    res.json({ success: true, id: result.rows[0].id });
  } catch (error) {
    console.error("Error al crear pedido:", error);
    res
      .status(500)
      .json({ success: false, error: "Error interno del servidor" });
  }
});

// GET /api/pedidos - Obtener todos los pedidos
app.get("/api/pedidos", async (req, res) => {
  try {
    // Para PostgreSQL
    const query = `
      SELECT * FROM pedidos 
      ORDER BY fecha_pedido DESC
    `;

    const result = await pool.query(query);

    res.json({
      success: true,
      pedidos: result.rows,
    });
  } catch (error) {
    console.error("Error al obtener pedidos:", error);
    res.status(500).json({
      success: false,
      error: "Error interno del servidor",
    });
  }
});

// Procesar pedido (cambiar estado a 'aprobado')
app.put("/api/pedidos/:id/procesar", async (req, res) => {
  const pedidoId = req.params.id;

  try {
    // Verificar si el pedido existe
    const pedidoCheck = await pool.query(
      "SELECT * FROM pedidos WHERE id = $1",
      [pedidoId]
    );

    if (pedidoCheck.rows.length === 0) {
      return res.status(404).json({ error: "Pedido no encontrado" });
    }

    // Actualizar estado a 'aprobado'
    await pool.query("UPDATE pedidos SET estado = $1 WHERE id = $2", [
      "aprobado",
      pedidoId,
    ]);

    res.json({ message: "Pedido procesado exitosamente" });
  } catch (err) {
    console.error("Error al procesar pedido:", err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Cancelar pedido (cambiar estado a 'rechazado')
app.put("/api/pedidos/:id/pendiente", async (req, res) => {
  const pedidoId = req.params.id;

  try {
    // Verificar si el pedido existe
    const pedidoCheck = await pool.query(
      "SELECT * FROM pedidos WHERE id = $1",
      [pedidoId]
    );

    if (pedidoCheck.rows.length === 0) {
      return res.status(404).json({ error: "Pedido no encontrado" });
    }

    // Actualizar estado a 'pendiente'
    await pool.query("UPDATE pedidos SET estado = $1 WHERE id = $2", [
      "pendiente",
      pedidoId,
    ]);

    res.json({ message: "Pedido actualizado a pendiente exitosamente" });
  } catch (err) {
    console.error("Error al actualizar pedido:", err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Eliminar pedido
app.delete("/api/pedidos/:id", async (req, res) => {
  const pedidoId = req.params.id;

  try {
    // Verificar si el pedido existe
    const pedidoCheck = await pool.query(
      "SELECT * FROM pedidos WHERE id = $1",
      [pedidoId]
    );

    if (pedidoCheck.rows.length === 0) {
      return res.status(404).json({ error: "Pedido no encontrado" });
    }

    // Eliminar pedido
    await pool.query("DELETE FROM pedidos WHERE id = $1", [pedidoId]);

    res.json({ message: "Pedido eliminado exitosamente" });
  } catch (err) {
    console.error("Error al eliminar pedido:", err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});
