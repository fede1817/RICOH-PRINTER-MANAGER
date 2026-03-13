const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  user: process.env.DB_USER || "postgres",
  host: process.env.DB_HOST || "192.168.8.166",
  database: process.env.DB_NAME || "impresoras",
  password: process.env.DB_PASSWORD || "123",
  port: process.env.DB_PORT || 5432,
});

// Fix timezone: asegurar que base de datos registre NOW() en hora local argentina
pool.on('connect', client => {
  client.query("SET TIMEZONE='America/Argentina/Buenos_Aires';");
});

module.exports = pool;
