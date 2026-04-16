const express = require("express");
const cors = require("cors");
require("dotenv").config();

const impresoraRoutes = require("./routes/impresoraRoutes");
const pedidoRoutes = require("./routes/pedidoRoutes");
const servidorRoutes = require("./routes/servidorRoutes");
const perifericoRoutes = require("./routes/perifericoRoutes");
const emailRoutes = require("./routes/emailRoutes");
const scheduler = require("./scheduler");
const { errorHandler, notFoundHandler } = require("./middleware/errorHandler"); // 👈 IMPORTAR

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json());

// Rutas
app.use("/api/impresoras", impresoraRoutes);
app.use("/api/pedidos", pedidoRoutes);
app.use("/api/servidores", servidorRoutes);
app.use("/api", emailRoutes);
app.use("/api/perifericos", perifericoRoutes);

// Ruta de ping simple
app.post("/ping", async (req, res) => {
  const { host } = req.body;
  if (!host)
    return res.status(400).json({ error: "Debes enviar un host o IP" });

  try {
    const ping = require("ping");
    const result = await ping.promise.probe(host, { timeout: 5 });
    res.json({ host: result.host, alive: result.alive, time: result.time });
  } catch (error) {
    res.status(500).json({ error: "Error al hacer ping" });
  }
});

// Middleware para rutas no encontradas (404) - 👈 AGREGAR
app.use(notFoundHandler);

// Middleware de manejo de errores (debe ir al final) - 👈 AGREGAR
app.use(errorHandler);

// Iniciar servidor
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  console.log(`🌐 Accesible en http://localhost:${PORT}`);
});

module.exports = app;
