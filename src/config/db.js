const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.URL_CONNECT, // postgres://user:password@host:port/dbname
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

pool.connect()
  .then(() => console.log("✅ Conectado a PostgreSQL"))
  .catch(err => console.error("❌ Error de conexión a PostgreSQL:", err));

module.exports = pool;
