const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const usuarioRoutes = require("./routes/usuario_routes");
const pingRoutes = require("./routes/ping_routes");
const loginRoutes = require("../src/routes/login_routes");
const restablecerPassword = require("../src/routes/reestablecer_password_routes");
const cors = require("cors");

const ip = require("./routes/ip");
const pinCleanupJob = require("./services/pin_cleanup_job");

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

    // ? Configuracion de cors PERMITE PETICIONES DE CUALQUIER IP
    this.app.use(
      cors({
        origin: "*",
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization", "Accept"],
      })
    );

    this.app.options("*", cors());

    // ? Middleware para manejar errores de parseo JSON
    // ? Esto es una validación extra para capturar errores de JSON mal formateado por si las dudas
    this.app.use((err, req, res, next) => {
      if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
        return res.status(400).json({
          error:
            "El formato del JSON es inválido. Verifica que no haya caracteres prohibidos o comillas.",
        });
      }
      next(err);
    });
  }

  configurarRutas() {
    // ? Rutas
    this.app.use("/ping", pingRoutes);
    this.app.use("/usuarios", usuarioRoutes);
    this.app.use("/login", loginRoutes);
    this.app.use("/restablecerPassword", restablecerPassword);
    this.app.use("/obtenerIp", ip);
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
      console.log(`✅ Conectado a PostgreSQL`);

      // Iniciar job de limpieza de PINs
      pinCleanupJob.start();
    });
  }
}

const server = new Server();
server.iniciar();
