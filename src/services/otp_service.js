const speakeasy = require("speakeasy");
const qrcode = require("qrcode");

class OTPService {
  /**
   * Genera un secreto único para el usuario y devuelve el secreto y el código QR/URL
   * @param {string} nombre - Nombre del usuario
   * @param {string} correo - Correo del usuario
   * @returns {object} - Secreto, URL manual y código QR en base64
   */
  static async generarSecreto(nombre, correo) {
    try {
      // Generar secreto único
      const secret = speakeasy.generateSecret({
        name: `PAWS - ${nombre}`,
        account: correo,
        issuer: "PAWS Backend",
        length: 32,
      });

      // Generar código QR como imagen en base64
      const qrCodeDataURL = await qrcode.toDataURL(secret.otpauth_url);

      return {
        secreto: secret.base32, // Para guardar en BD
        url_manual: secret.otpauth_url, // Para entrada manual
        qr_code: qrCodeDataURL, // Para mostrar QR
      };
    } catch (error) {
      throw new Error(`Error al generar secreto OTP: ${error.message}`);
    }
  }

  /**
   * Verifica si el código OTP ingresado por el usuario es válido
   * @param {string} token - Código de 6 dígitos del usuario
   * @param {string} secreto - Secreto guardado en la base de datos
   * @returns {boolean} - True si es válido, false si no
   */
  static verificarToken(token, secreto) {
    try {
      return speakeasy.totp.verify({
        secret: secreto,
        encoding: "base32",
        token: token,
        window: 2, // Permite 2 ventanas de tiempo (±30 segundos)
      });
    } catch (error) {
      throw new Error(`Error al verificar token OTP: ${error.message}`);
    }
  }

  /**
   * Genera un token actual para testing (útil para desarrollo)
   * @param {string} secreto - Secreto guardado en la base de datos
   * @returns {string} - Token de 6 dígitos actual
   */
  static generarTokenActual(secreto) {
    return speakeasy.totp({
      secret: secreto,
      encoding: "base32",
    });
  }
}

module.exports = OTPService;
