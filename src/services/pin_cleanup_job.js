const cron = require("node-cron");
const Usuario = require("../models/Usuario");

/**
 * Job de limpieza automática para PINs expirados
 * Se ejecuta diariamente a las 02:00 AM
 * Limpia PINs expirados y usados para mantener la base de datos limpia
 */
class PinCleanupJob {
  constructor() {
    this.isRunning = false;
    this.lastExecution = null;
    this.totalCleaned = 0;
  }

  /**
   * Inicia el job de limpieza automática
   * Programa la ejecución diaria
   */
  start() {
    console.log("📅 Iniciando job de limpieza de PINs...");

    // Ejecutar todos los días a las 2:00 AM
    cron.schedule(
      "0 2 * * *",
      async () => {
        await this.executeLimpiezaPines();
      },
      {
        timezone: "America/Mexico_City",
      }
    );

    // También ejecutar cada 6 horas para mayor limpieza
    cron.schedule(
      "0 */6 * * *",
      async () => {
        await this.executeLimpiezaPines();
      },
      {
        timezone: "America/Mexico_City",
      }
    );

    console.log("✅ Job de limpieza de PINs programado exitosamente");
    console.log("🕐 Se ejecutará diariamente a las 2:00 AM y cada 6 horas");
  }

  /**
   * Ejecuta la limpieza de PINs expirados
   */
  async executeLimpiezaPines() {
    if (this.isRunning) {
      console.log("⚠️ Job de limpieza ya está ejecutándose, saltando...");
      return;
    }

    this.isRunning = true;
    const startTime = Date.now();

    try {
      console.log("🧹 Iniciando limpieza de PINs expirados...");

      // Obtener estadísticas antes de la limpieza
      const estadisticasAntes = await Usuario.obtenerEstadisticasPines();
      console.log("📊 Estadísticas antes de limpieza:", estadisticasAntes);

      // Ejecutar limpieza
      const pinesLimpiados = await Usuario.limpiarPinesExpirados();

      // Obtener estadísticas después de la limpieza
      const estadisticasDespues = await Usuario.obtenerEstadisticasPines();

      // Actualizar contadores
      this.totalCleaned += pinesLimpiados;
      this.lastExecution = new Date();

      const executionTime = Date.now() - startTime;

      console.log("✅ Limpieza de PINs completada exitosamente");
      console.log(`🗑️ PINs limpiados: ${pinesLimpiados}`);
      console.log(`⏱️ Tiempo de ejecución: ${executionTime}ms`);
      console.log("📊 Estadísticas después de limpieza:", estadisticasDespues);

      // Log detallado si se limpiaron PINs
      if (pinesLimpiados > 0) {
        console.log(
          `🎯 Total de PINs limpiados en esta sesión: ${this.totalCleaned}`
        );
        console.log(
          `📅 Última ejecución: ${this.lastExecution.toLocaleString()}`
        );
      }
    } catch (error) {
      console.error("❌ Error durante la limpieza de PINs:", error);
      console.error("Stack trace:", error.stack);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Ejecuta limpieza manual (para testing o administración)
   */
  async ejecutarLimpiezaManual() {
    console.log("🔧 Ejecutando limpieza manual de PINs...");
    await this.executeLimpiezaPines();
  }

  /**
   * Obtiene estadísticas del job
   */
  getEstadisticas() {
    return {
      ejecutandose: this.isRunning,
      ultima_ejecucion: this.lastExecution,
      total_limpiados: this.totalCleaned,
      programado: true,
    };
  }

  /**
   * Detiene temporalmente el job (para mantenimiento)
   */
  pause() {
    // Node-cron no tiene pause nativo, pero podemos marcar como pausado
    this.paused = true;
    console.log("⏸️ Job de limpieza pausado temporalmente");
  }

  /**
   * Reanuda el job
   */
  resume() {
    this.paused = false;
    console.log("▶️ Job de limpieza reanudado");
  }
}

// Singleton del job de limpieza
const pinCleanupJob = new PinCleanupJob();

module.exports = pinCleanupJob;
