const fs = require("fs");
const path = require("path");

// Formatear fecha
const formatDate = (date, format = "dd/MM/yyyy") => {
  if (!date) return "";

  const d = new Date(date);
  const day = d.getDate().toString().padStart(2, "0");
  const month = (d.getMonth() + 1).toString().padStart(2, "0");
  const year = d.getFullYear();
  const hours = d.getHours().toString().padStart(2, "0");
  const minutes = d.getMinutes().toString().padStart(2, "0");
  const seconds = d.getSeconds().toString().padStart(2, "0");

  return format
    .replace("dd", day)
    .replace("MM", month)
    .replace("yyyy", year)
    .replace("HH", hours)
    .replace("mm", minutes)
    .replace("ss", seconds);
};

// Formatear bytes a unidades legibles
const formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
};

// Validar IP
const isValidIP = (ip) => {
  const ipv4Regex =
    /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  return ipv4Regex.test(ip);
};

// Validar email
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Sanitizar string (eliminar espacios extras, etc)
const sanitizeString = (str) => {
  if (!str) return "";
  return str.toString().trim().replace(/\s+/g, " ");
};

// Extraer número de serie de respuesta SNMP
const extractSerialNumber = (snmpValue) => {
  if (!snmpValue) return "N/A";

  // Convertir a string y limpiar
  let serial = String(snmpValue)
    .replace(/[^\x20-\x7E]/g, "") // Eliminar caracteres no imprimibles
    .trim();

  return serial || "N/A";
};

// Calcular nivel de tóner (algunas impresoras usan escala 0-100, otras 0-255)
const normalizeTonerLevel = (value, maxValue = 100) => {
  if (value === null || value === undefined) return null;

  const num = parseInt(value, 10);
  if (isNaN(num)) return null;

  // Si el valor es mayor a 100, asumimos que es escala 0-255
  if (num > 100) {
    return Math.round((num / 255) * 100);
  }

  return num;
};

// Obtener extensión de archivo
const getFileExtension = (filename) => {
  return path.extname(filename).toLowerCase();
};

// Verificar si es un tipo de archivo permitido para impresión
const isAllowedPrintFile = (filename) => {
  const allowedExtensions = [".pdf", ".docx", ".txt", ".jpg", ".jpeg", ".png"];
  const ext = getFileExtension(filename);
  return allowedExtensions.includes(ext);
};

// Generar nombre único para archivo
const generateUniqueFilename = (originalname) => {
  const ext = path.extname(originalname);
  const basename = path.basename(originalname, ext);
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);

  return `${basename}_${timestamp}_${random}${ext}`;
};

// Limpiar archivos temporales antiguos
const cleanupTempFiles = (directory, maxAgeHours = 24) => {
  if (!fs.existsSync(directory)) return;

  const files = fs.readdirSync(directory);
  const now = Date.now();
  const maxAgeMs = maxAgeHours * 60 * 60 * 1000;

  files.forEach((file) => {
    const filePath = path.join(directory, file);
    const stats = fs.statSync(filePath);
    const fileAge = now - stats.mtimeMs;

    if (fileAge > maxAgeMs) {
      try {
        fs.unlinkSync(filePath);
        console.log(`🧹 Archivo temporal eliminado: ${file}`);
      } catch (err) {
        console.error(`❌ Error eliminando archivo ${file}:`, err.message);
      }
    }
  });
};

// Logger personalizado
const logger = {
  info: (message, data = {}) => {
    console.log(`ℹ️ [${new Date().toISOString()}] INFO: ${message}`, data);
  },
  success: (message, data = {}) => {
    console.log(`✅ [${new Date().toISOString()}] SUCCESS: ${message}`, data);
  },
  warn: (message, data = {}) => {
    console.warn(`⚠️ [${new Date().toISOString()}] WARN: ${message}`, data);
  },
  error: (message, error = {}) => {
    console.error(`❌ [${new Date().toISOString()}] ERROR: ${message}`, {
      message: error.message,
      stack: error.stack,
      ...error,
    });
  },
  debug: (message, data = {}) => {
    if (process.env.NODE_ENV === "development") {
      console.log(`🐛 [${new Date().toISOString()}] DEBUG: ${message}`, data);
    }
  },
};

// Sleep / Delay
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Parsear latencia de ping a número
const parseLatency = (latencyStr) => {
  if (!latencyStr || latencyStr === "Timeout" || latencyStr === "Error") {
    return null;
  }

  const match = latencyStr.match(/(\d+(?:\.\d+)?)/);
  return match ? parseFloat(match[1]) : null;
};

// Agrupar array por propiedad
const groupBy = (array, key) => {
  return array.reduce((result, item) => {
    const groupKey = item[key];
    if (!result[groupKey]) {
      result[groupKey] = [];
    }
    result[groupKey].push(item);
    return result;
  }, {});
};

module.exports = {
  formatDate,
  formatBytes,
  isValidIP,
  isValidEmail,
  sanitizeString,
  extractSerialNumber,
  normalizeTonerLevel,
  getFileExtension,
  isAllowedPrintFile,
  generateUniqueFilename,
  cleanupTempFiles,
  logger,
  sleep,
  parseLatency,
  groupBy,
};
