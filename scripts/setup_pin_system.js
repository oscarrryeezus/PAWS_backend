#!/usr/bin/env node

/**
 * 🚀 Script de Configuración Inicial - Sistema PIN
 * Configura automáticamente el sistema de PIN en el backend PAWS
 */

const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");
require("dotenv").config();

console.log("🔐 PAWS Backend - Configuración Sistema PIN");
console.log("=".repeat(50));

class PinSystemSetup {
  constructor() {
    this.pool = new Pool({
      user: process.env.DB_USER,
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      password: process.env.DB_PASSWORD,
      port: process.env.DB_PORT,
    });
  }

  /**
   * Verificar dependencias del sistema
   */
  async verificarDependencias() {
    console.log("📋 Verificando dependencias...");

    const dependencias = ["bcrypt", "joi", "node-cron", "jsonwebtoken"];
    const package_json = JSON.parse(fs.readFileSync("package.json", "utf8"));

    const faltantes = dependencias.filter(
      (dep) =>
        !package_json.dependencies[dep] && !package_json.devDependencies[dep]
    );

    if (faltantes.length > 0) {
      console.log("❌ Dependencias faltantes:", faltantes.join(", "));
      console.log("💡 Ejecuta: npm install", faltantes.join(" "));
      return false;
    }

    console.log("✅ Todas las dependencias están instaladas");
    return true;
  }

  /**
   * Verificar variables de entorno
   */
  verificarVariablesEntorno() {
    console.log("🔧 Verificando variables de entorno...");

    const requeridas = [
      "JWT_SECRET",
      "DB_USER",
      "DB_HOST",
      "DB_NAME",
      "DB_PASSWORD",
      "DB_PORT",
    ];

    const faltantes = requeridas.filter((variable) => !process.env[variable]);

    if (faltantes.length > 0) {
      console.log("❌ Variables de entorno faltantes:", faltantes.join(", "));
      console.log("💡 Agrega estas variables a tu archivo .env");
      return false;
    }

    console.log("✅ Variables de entorno configuradas correctamente");
    return true;
  }

  /**
   * Ejecutar migración de base de datos
   */
  async ejecutarMigracion() {
    console.log("🗄️ Ejecutando migración de base de datos...");

    try {
      const migrationPath = path.join(
        __dirname,
        "..",
        "migrations",
        "add_pin_fields.sql"
      );

      if (!fs.existsSync(migrationPath)) {
        console.log("❌ Archivo de migración no encontrado:", migrationPath);
        return false;
      }

      const migrationSQL = fs.readFileSync(migrationPath, "utf8");
      const client = await this.pool.connect();

      try {
        // Verificar si las columnas ya existen
        const checkResult = await client.query(`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = 'usuario' 
          AND column_name IN ('dt_pin_expiracion', 'bool_pin_usado')
        `);

        if (checkResult.rows.length === 2) {
          console.log("✅ Las columnas PIN ya existen en la base de datos");
          return true;
        }

        // Ejecutar migración
        await client.query(migrationSQL);
        console.log("✅ Migración ejecutada exitosamente");

        // Verificar que las columnas se crearon
        const verifyResult = await client.query(`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = 'usuario' 
          AND column_name IN ('dt_pin_expiracion', 'bool_pin_usado')
        `);

        if (verifyResult.rows.length === 2) {
          console.log("✅ Columnas PIN creadas correctamente");
          return true;
        } else {
          console.log("❌ Error: Las columnas no se crearon correctamente");
          return false;
        }
      } finally {
        client.release();
      }
    } catch (error) {
      console.log("❌ Error al ejecutar migración:", error.message);
      return false;
    }
  }

  /**
   * Verificar archivos del sistema PIN
   */
  verificarArchivos() {
    console.log("📁 Verificando archivos del sistema PIN...");

    const archivosRequeridos = [
      "src/services/pin_service.js",
      "src/services/pin_cleanup_job.js",
      "src/validators/pin_validator.js",
      "migrations/add_pin_fields.sql",
    ];

    const faltantes = archivosRequeridos.filter(
      (archivo) => !fs.existsSync(path.join(__dirname, "..", archivo))
    );

    if (faltantes.length > 0) {
      console.log("❌ Archivos faltantes:", faltantes.join(", "));
      return false;
    }

    console.log("✅ Todos los archivos del sistema PIN están presentes");
    return true;
  }

  /**
   * Verificar modelo Usuario actualizado
   */
  verificarModeloUsuarioActualizado() {
    console.log("🏗️ Verificando modelo Usuario...");

    const modeloPath = path.join(
      __dirname,
      "..",
      "src",
      "models",
      "Usuario.js"
    );

    if (!fs.existsSync(modeloPath)) {
      console.log("❌ Archivo Usuario.js no encontrado");
      return false;
    }

    const contenido = fs.readFileSync(modeloPath, "utf8");

    const metodosPIN = [
      "configurarPin",
      "obtenerEstadoPin",
      "buscarUsuarioConPinActivo",
      "marcarPinComoUsado",
      "limpiarPinesExpirados",
    ];

    const faltantes = metodosPIN.filter(
      (metodo) => !contenido.includes(metodo)
    );

    if (faltantes.length > 0) {
      console.log(
        "❌ Métodos PIN faltantes en Usuario.js:",
        faltantes.join(", ")
      );
      return false;
    }

    console.log("✅ Modelo Usuario actualizado con métodos PIN");
    return true;
  }

  /**
   * Verificar controlador actualizado
   */
  verificarControladorActualizado() {
    console.log("🎮 Verificando controlador Usuario...");

    const controllerPath = path.join(
      __dirname,
      "..",
      "src",
      "controllers",
      "usuario_controller.js"
    );

    if (!fs.existsSync(controllerPath)) {
      console.log("❌ Archivo usuario_controller.js no encontrado");
      return false;
    }

    const contenido = fs.readFileSync(controllerPath, "utf8");

    const metodosPIN = ["configurarPin", "usarPin", "obtenerEstadoPin"];

    const faltantes = metodosPIN.filter(
      (metodo) => !contenido.includes(metodo)
    );

    if (faltantes.length > 0) {
      console.log(
        "❌ Métodos PIN faltantes en usuario_controller.js:",
        faltantes.join(", ")
      );
      return false;
    }

    console.log("✅ Controlador Usuario actualizado con endpoints PIN");
    return true;
  }

  /**
   * Verificar rutas PIN
   */
  verificarRutas() {
    console.log("🛣️ Verificando rutas PIN...");

    const rutasPath = path.join(
      __dirname,
      "..",
      "src",
      "routes",
      "usuario_routes.js"
    );

    if (!fs.existsSync(rutasPath)) {
      console.log("❌ Archivo usuario_routes.js no encontrado");
      return false;
    }

    const contenido = fs.readFileSync(rutasPath, "utf8");

    const rutasPIN = ["configurar-pin", "usar-pin", "estado-pin"];

    const faltantes = rutasPIN.filter((ruta) => !contenido.includes(ruta));

    if (faltantes.length > 0) {
      console.log("❌ Rutas PIN faltantes:", faltantes.join(", "));
      return false;
    }

    console.log("✅ Rutas PIN configuradas correctamente");
    return true;
  }

  /**
   * Probar conexión a base de datos
   */
  async probarConexionBD() {
    console.log("🔌 Probando conexión a base de datos...");

    try {
      const client = await this.pool.connect();
      await client.query("SELECT NOW()");
      client.release();
      console.log("✅ Conexión a base de datos exitosa");
      return true;
    } catch (error) {
      console.log("❌ Error de conexión a BD:", error.message);
      return false;
    }
  }

  /**
   * Crear usuario de prueba
   */
  async crearUsuarioPrueba() {
    console.log("👤 Creando usuario de prueba...");

    try {
      const client = await this.pool.connect();

      const correoTest = "test_pin@paws.com";

      // Verificar si el usuario ya existe
      const existeResult = await client.query(
        "SELECT str_correo FROM usuario WHERE str_correo = $1",
        [correoTest]
      );

      if (existeResult.rows.length > 0) {
        console.log("✅ Usuario de prueba ya existe");
        client.release();
        return true;
      }

      // Crear usuario de prueba
      await client.query(
        `
        INSERT INTO usuario (
          str_correo,
          str_nombre_usuario,
          str_nombre,
          str_apellido,
          str_contrasena,
          bool_activo
        ) VALUES ($1, $2, $3, $4, $5, $6)
      `,
        [
          correoTest,
          "test_pin_user",
          "Usuario",
          "Prueba PIN",
          "$2b$12$dummy.hash.for.testing",
          true,
        ]
      );

      client.release();
      console.log("✅ Usuario de prueba creado:", correoTest);
      return true;
    } catch (error) {
      console.log("❌ Error al crear usuario de prueba:", error.message);
      return false;
    }
  }

  /**
   * Generar reporte de configuración
   */
  generarReporte(resultados) {
    console.log("\n" + "=".repeat(50));
    console.log("📊 REPORTE DE CONFIGURACIÓN");
    console.log("=".repeat(50));

    const checks = [
      { nombre: "Dependencias", resultado: resultados.dependencias },
      { nombre: "Variables de Entorno", resultado: resultados.variables },
      { nombre: "Archivos del Sistema", resultado: resultados.archivos },
      { nombre: "Modelo Usuario", resultado: resultados.modelo },
      { nombre: "Controlador Usuario", resultado: resultados.controlador },
      { nombre: "Rutas PIN", resultado: resultados.rutas },
      { nombre: "Conexión BD", resultado: resultados.conexion },
      { nombre: "Migración BD", resultado: resultados.migracion },
      { nombre: "Usuario de Prueba", resultado: resultados.usuarioPrueba },
    ];

    checks.forEach((check) => {
      const icono = check.resultado ? "✅" : "❌";
      console.log(`${icono} ${check.nombre}`);
    });

    const exitosos = checks.filter((c) => c.resultado).length;
    const total = checks.length;

    console.log("\n" + "=".repeat(50));
    console.log(`📈 RESULTADO: ${exitosos}/${total} checks exitosos`);

    if (exitosos === total) {
      console.log("🎉 ¡Sistema PIN configurado correctamente!");
      console.log("💡 Puedes iniciar el servidor con: npm start");
      console.log("📖 Documentación disponible en: docs/PIN_SYSTEM.md");
      console.log("🧪 Ejecutar tests con: npm test");
    } else {
      console.log("⚠️  Se encontraron problemas en la configuración.");
      console.log(
        "💡 Revisa los errores anteriores y ejecuta el script nuevamente."
      );
    }
  }

  /**
   * Ejecutar configuración completa
   */
  async ejecutar() {
    const resultados = {};

    try {
      resultados.dependencias = await this.verificarDependencias();
      resultados.variables = this.verificarVariablesEntorno();
      resultados.archivos = this.verificarArchivos();
      resultados.modelo = this.verificarModeloUsuarioActualizado();
      resultados.controlador = this.verificarControladorActualizado();
      resultados.rutas = this.verificarRutas();
      resultados.conexion = await this.probarConexionBD();
      resultados.migracion = await this.ejecutarMigracion();
      resultados.usuarioPrueba = await this.crearUsuarioPrueba();

      this.generarReporte(resultados);
    } catch (error) {
      console.log("❌ Error durante la configuración:", error.message);
    } finally {
      await this.pool.end();
    }
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  const setup = new PinSystemSetup();
  setup.ejecutar();
}

module.exports = PinSystemSetup;
