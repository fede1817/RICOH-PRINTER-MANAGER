const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  user: process.env.DB_USER || "postgres",
  host: process.env.DB_HOST || "192.168.8.166",
  database: process.env.DB_NAME || "impresoras",
  password: process.env.DB_PASSWORD || "123",
  port: process.env.DB_PORT || 5432,
});

module.exports = pool;
