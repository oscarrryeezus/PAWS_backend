const crypto = require("crypto");
const bcrypt = require("bcryptjs");

/**
 * Servicio para manejo de PINs de un solo uso con encriptación
 * Duración: 15 días desde la creación
 * Uso único: Se marca como usado después de usar
 */
class PinService {
  constructor() {
    this.SALT_ROUNDS = 12; // Alta seguridad para PINs
    this.PIN_EXPIRY_DAYS = 15; // 15 días de validez
    this.PIN_LENGTH = 6; // PIN de 6 dígitos
    this.ALGORITHM = "aes-256-cbc";
  }

  /**
   * Genera un PIN aleatorio de 6 dígitos
   * @returns {string} PIN numérico de 6 dígitos
   */
  generarPinAleatorio() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Encripta un PIN usando bcrypt con salt alto
   * @param {string} pin - PIN en texto plano
   * @returns {Promise<string>} PIN encriptado
   */
  async encriptarPin(pin) {
    try {
      const salt = await bcrypt.genSalt(this.SALT_ROUNDS);
      const hashedPin = await bcrypt.hash(pin + process.env.JWT_SECRET, salt);
      return hashedPin;
    } catch (error) {
      throw new Error(`Error al encriptar PIN: ${error.message}`);
    }
  }

  /**
   * Verifica si un PIN coincide con el hash almacenado
   * @param {string} pin - PIN en texto plano
   * @param {string} hashedPin - PIN encriptado almacenado
   * @returns {Promise<boolean>} True si coincide
   */
  async verificarPin(pin, hashedPin) {
    try {
      return await bcrypt.compare(pin + process.env.JWT_SECRET, hashedPin);
    } catch (error) {
      throw new Error(`Error al verificar PIN: ${error.message}`);
    }
  }

  /**
   * Calcula la fecha de expiración del PIN (15 días desde hoy)
   * @returns {Date} Fecha de expiración
   */
  calcularFechaExpiracion() {
    const ahora = new Date();
    const expiracion = new Date(ahora);
    expiracion.setDate(ahora.getDate() + this.PIN_EXPIRY_DAYS);
    return expiracion;
  }

  /**
   * Verifica si un PIN ha expirado
   * @param {Date} fechaExpiracion - Fecha de expiración del PIN
   * @returns {boolean} True si ha expirado
   */
  estaExpirado(fechaExpiracion) {
    return new Date() > new Date(fechaExpiracion);
  }

  /**
   * Calcula los días restantes antes de que expire el PIN
   * @param {Date} fechaExpiracion - Fecha de expiración del PIN
   * @returns {number} Días restantes (puede ser negativo si ya expiró)
   */
  diasRestantes(fechaExpiracion) {
    const ahora = new Date();
    const expira = new Date(fechaExpiracion);
    const diferencia = expira.getTime() - ahora.getTime();
    return Math.ceil(diferencia / (1000 * 60 * 60 * 24));
  }

  /**
   * Genera un token único para identificar el PIN (para usar offline)
   * @param {string} correo - Email del usuario
   * @param {string} pin - PIN generado
   * @returns {string} Token único para almacenamiento local
   */
  generarTokenOffline(correo, pin) {
    const data = `${correo}-${pin}-${Date.now()}`;
    return crypto.createHash("sha256").update(data).digest("hex");
  }

  /**
   * Genera datos encriptados para almacenamiento offline seguro
   * @param {string} correo - Email del usuario
   * @param {string} pin - PIN en texto plano
   * @returns {Object} Datos encriptados para almacenamiento local
   */
  generarDatosOffline(correo, pin) {
    try {
      const key = crypto.scryptSync(process.env.JWT_SECRET, "salt", 32);
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv(this.ALGORITHM, key, iv);

      const data = JSON.stringify({
        correo,
        pin,
        timestamp: Date.now(),
        expires: this.calcularFechaExpiracion().getTime(),
      });

      let encrypted = cipher.update(data, "utf8", "hex");
      encrypted += cipher.final("hex");

      return {
        encrypted_data: encrypted,
        iv: iv.toString("hex"),
        token: this.generarTokenOffline(correo, pin),
      };
    } catch (error) {
      throw new Error(`Error al generar datos offline: ${error.message}`);
    }
  }

  /**
   * Descifra datos offline (para validación en el backend si es necesario)
   * @param {Object} datosEncriptados - Datos encriptados offline
   * @returns {Object} Datos descifrados
   */
  descifrarDatosOffline(datosEncriptados) {
    try {
      const { encrypted_data, iv } = datosEncriptados;

      const key = crypto.scryptSync(process.env.JWT_SECRET, "salt", 32);
      const decipher = crypto.createDecipheriv(
        this.ALGORITHM,
        key,
        Buffer.from(iv, "hex")
      );

      let decrypted = decipher.update(encrypted_data, "hex", "utf8");
      decrypted += decipher.final("utf8");

      return JSON.parse(decrypted);
    } catch (error) {
      throw new Error(`Error al descifrar datos offline: ${error.message}`);
    }
  }

  /**
   * Valida el formato de un PIN
   * @param {string} pin - PIN a validar
   * @returns {boolean} True si el formato es válido
   */
  validarFormatoPin(pin) {
    const pinRegex = /^\d{6}$/;
    return pinRegex.test(pin);
  }

  /**
   * Genera datos completos para un nuevo PIN
   * @param {string} correo - Email del usuario
   * @returns {Object} Objeto con PIN, hash, fechas y token
   */
  async crearPinCompleto(correo) {
    try {
      const pinTextoPlano = this.generarPinAleatorio();
      const pinEncriptado = await this.encriptarPin(pinTextoPlano);
      const fechaCreacion = new Date();
      const fechaExpiracion = this.calcularFechaExpiracion();
      const datosOffline = this.generarDatosOffline(correo, pinTextoPlano);

      return {
        pin_texto_plano: pinTextoPlano, // Solo para respuesta inicial
        pin_encriptado: pinEncriptado, // Para almacenar en BD
        fecha_creacion: fechaCreacion,
        fecha_expiracion: fechaExpiracion,
        datos_offline: datosOffline,
        dias_validez: this.PIN_EXPIRY_DAYS,
        usado: false,
      };
    } catch (error) {
      throw new Error(`Error al crear PIN completo: ${error.message}`);
    }
  }

  /**
   * Valida que un usuario tenga permisos para configurar PIN
   * @param {Object} usuario - Datos del usuario
   * @returns {Object} Resultado de la validación
   */
  validarPermisosPin(usuario) {
    if (!usuario) {
      return {
        valido: false,
        mensaje: "Usuario no encontrado",
      };
    }

    if (!usuario.bool_activo) {
      return {
        valido: false,
        mensaje: "La cuenta debe estar activa para configurar PIN",
      };
    }

    if (!usuario.bool_otp) {
      return {
        valido: false,
        mensaje: "Debe tener OTP configurado para usar PIN",
      };
    }

    return {
      valido: true,
      mensaje: "Usuario válido para configurar PIN",
    };
  }
}

// Singleton
const pinService = new PinService();

module.exports = pinService;
