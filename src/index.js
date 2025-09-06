const express = require("express");
const swaggerUi = require("swagger-ui-express");
const YAML = require("yamljs");
const path = require("path");
const bodyParser = require("body-parser");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

// 🔹 Configuración EJS (MVC)
app.set("view engine", "ejs");
app.set("views", "./src/views");

// 🔹 Middlewares
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// 🔹 Rutas de usuarios (MVC)
const usuarioRoutes = require("./routes/usuario_routes");
app.use("/usuarios", usuarioRoutes);

// 🔹 Swagger UI en /docs
const swaggerPath = path.join(__dirname, "config", "swagger.yaml");
const swaggerDocument = YAML.load(swaggerPath);
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// 🔹 Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`📄 Documentación Swagger disponible en http://localhost:${PORT}/docs`);
  console.log(`👥 Gestión de usuarios disponible en http://localhost:${PORT}/usuarios`);
});
