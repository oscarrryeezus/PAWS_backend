/**
 * Servicio para generar y validar códigos de verificación de email
 */
class EmailVerificationService {
  constructor() {
    // Almacenar códigos temporalmente (en producción usar Redis)
    this.codes = new Map();
    // Limpiar códigos expirados cada 5 minutos
    setInterval(() => this.cleanExpiredCodes(), 5 * 60 * 1000);
  }

  /**
   * Genera un código de 6 dígitos para verificación de email
   * @param {string} email - Email del usuario
   * @returns {string} Código de 6 dígitos
   */
  generateVerificationCode(email) {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutos

    this.codes.set(email, {
      code,
      expiresAt,
      attempts: 0,
    });

    console.log(`Código de verificación generado para ${email}: ${code}`);
    return code;
  }

  /**
   * Verifica un código de verificación de email
   * @param {string} email - Email del usuario
   * @param {string} code - Código a verificar
   * @returns {object} Resultado de la verificación
   */
  verifyCode(email, code) {
    const storedData = this.codes.get(email);

    if (!storedData) {
      return {
        success: false,
        message: "Código no encontrado o expirado",
      };
    }

    if (Date.now() > storedData.expiresAt) {
      this.codes.delete(email);
      return {
        success: false,
        message: "Código expirado",
      };
    }

    // Incrementar intentos
    storedData.attempts++;

    // Máximo 3 intentos
    if (storedData.attempts > 3) {
      this.codes.delete(email);
      return {
        success: false,
        message: "Máximo de intentos excedido",
      };
    }

    if (storedData.code !== code) {
      return {
        success: false,
        message: "Código incorrecto",
        attemptsLeft: 3 - storedData.attempts,
      };
    }

    // Código correcto - eliminar de la memoria
    this.codes.delete(email);

    return {
      success: true,
      message: "Email verificado correctamente",
    };
  }

  /**
   * Limpia códigos expirados
   */
  cleanExpiredCodes() {
    const now = Date.now();
    for (const [email, data] of this.codes.entries()) {
      if (now > data.expiresAt) {
        this.codes.delete(email);
      }
    }
  }

  /**
   * Elimina manualmente un código
   * @param {string} email - Email del usuario
   */
  deleteCode(email) {
    this.codes.delete(email);
  }
}

// Singleton
const emailVerificationService = new EmailVerificationService();

module.exports = emailVerificationService;
