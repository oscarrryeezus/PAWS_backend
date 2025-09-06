const express = require("express");
const swaggerUi = require("swagger-ui-express");
const YAML = require("yamljs");
const path = require("path");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

// 🔹 Cargar definición desde src/config/swagger.yaml
const swaggerPath = path.join(__dirname, "config", "swagger.yaml");
const swaggerDocument = YAML.load(swaggerPath);

// 🔹 Servir la UI en /docs
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}/docs`);
});
