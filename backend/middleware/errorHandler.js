// Middleware para manejo centralizado de errores
const errorHandler = (err, req, res, next) => {
  console.error("❌ Error:", err.stack);

  // Error de validación
  if (err.name === "ValidationError") {
    return res.status(400).json({
      error: "Error de validación",
      detalles: err.message,
      timestamp: new Date().toISOString(),
    });
  }

  // Error de base de datos
  if (err.code) {
    // Errores de PostgreSQL
    const pgErrors = {
      23505: "Registro duplicado",
      23503: "Violación de clave foránea",
      "42P01": "Tabla no existe",
      "28P01": "Error de autenticación",
    };

    if (pgErrors[err.code]) {
      return res.status(400).json({
        error: "Error de base de datos",
        detalles: pgErrors[err.code],
        codigo: err.code,
        timestamp: new Date().toISOString(),
      });
    }
  }

  // Error de archivo no encontrado
  if (err.code === "ENOENT") {
    return res.status(404).json({
      error: "Archivo no encontrado",
      detalles: err.message,
      timestamp: new Date().toISOString(),
    });
  }

  // Error de timeout
  if (err.message.includes("timeout") || err.message.includes("Timeout")) {
    return res.status(408).json({
      error: "Tiempo de espera agotado",
      detalles: "La operación excedió el tiempo límite",
      timestamp: new Date().toISOString(),
    });
  }

  // Error de conexión SNMP
  if (err.message.includes("SNMP")) {
    return res.status(503).json({
      error: "Error de comunicación SNMP",
      detalles: err.message,
      timestamp: new Date().toISOString(),
    });
  }

  // Error de impresión
  if (err.message.includes("imprimir")) {
    return res.status(500).json({
      error: "Error al imprimir",
      detalles: err.message,
      timestamp: new Date().toISOString(),
    });
  }

  // Error por defecto (500)
  res.status(500).json({
    error: "Error interno del servidor",
    detalles:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Ocurrió un error inesperado",
    timestamp: new Date().toISOString(),
  });
};

// Middleware para rutas no encontradas (404)
const notFoundHandler = (req, res) => {
  res.status(404).json({
    error: "Ruta no encontrada",
    metodo: req.method,
    url: req.originalUrl,
    timestamp: new Date().toISOString(),
  });
};

module.exports = {
  errorHandler,
  notFoundHandler,
};
