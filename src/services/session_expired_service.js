const cron = require("node-cron");
const cacheService = require("./cache_service");
const Usuario = require("./Usuario"); // asegúrate de importar tu modelo/servicio

// Ejecutar cada minuto
cron.schedule("* * * * *", async () => {
  const ahora = Date.now();

  // Listar todas las sesiones activas
  const sesiones = cacheService.list();

  for (const sesion of sesiones) {
    const { key, minutosRestantes } = sesion;

    if (minutosRestantes <= 0) {
      // ? Extraer el correo desde la key (asumiendo que tiene formato "correoEXPIRACION-SESION")
      const correo = key.replace("EXPIRACION-SESION", "");

      cacheService.delete(key);

      // ? Actualizar estado activo en DB
      try {
        await Usuario.actualizarSesion('false', correo);
        console.log(`Sesión de ${correo} eliminada y estado activo actualizado.`);
      } catch (err) {
        console.error(`Error al actualizar sesión de ${correo}:`, err);
      }
    } else {
      // ? Mostrar tiempo restante en minutos y segundos
      const expiracionMs = cacheService.get(key).expiresAt - ahora;
      const minutos = Math.floor(expiracionMs / 60000);
      const segundos = Math.floor((expiracionMs % 60000) / 1000);

      console.log(`Sesión ${key} activa: ${minutos} min ${segundos} seg restantes`);
    }
  }
});
