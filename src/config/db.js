const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.URL_CONNECT,
});

pool.connect()
  .then(() => console.log("✅ Conectado a PostgreSQL"))
  .catch(err => console.error("❌ Error de conexión:", err));

module.exports = pool;
