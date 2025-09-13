const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const usuarioRoutes = require("./routes/usuario_routes");
const pingRoutes = require("./routes/ping_routes");
require("dotenv").config();

class Server {
  constructor() {
    this.app = express();
    this.PORT = process.env.PORT || 3000;
    this.configurarVista();
    this.configurarMiddlewares();
    this.configurarRutas();
    this.configurarSwagger();
  }

  configurarVista() {
    this.app.set("view engine", "ejs");
    this.app.set("views", "./src/views");
  }

  configurarMiddlewares() {
    this.app.use(bodyParser.urlencoded({ extended: true }));
    this.app.use(bodyParser.json());
  }

  configurarRutas() {
    // Rutas
    this.app.use("/ping", pingRoutes);
    this.app.use("/usuarios", usuarioRoutes);
  }

  configurarSwagger() {
    const { swaggerUi, swaggerDocs } = require("./config/swagger");
    this.app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));
  }

  iniciar() {
    this.app.listen(this.PORT, () => {
      console.log(`🚀 Servidor corriendo en http://localhost:${this.PORT}`);
      console.log(
        `📄 Documentación Swagger disponible en http://localhost:${this.PORT}/docs`
      );
      console.log(
        `👥 Gestión de usuarios disponible en http://localhost:${this.PORT}/usuarios`
      );
    });
  }
}

const server = new Server();
server.iniciar();
