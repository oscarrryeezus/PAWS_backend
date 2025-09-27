const pool = require("../config/db");
const bcrypt = require("bcryptjs");

class Usuario {
  constructor({
    id_usuario = null,
    str_nombre,
    str_correo,
    str_pass,
    int_rol,
    str_pin,
    str_tokenotp,
    dt_ultimoacceso,
    bool_activo,
    bool_otp,
    bool_pin,
  }) {
    this.id_usuario = id_usuario;
    this.str_nombre = str_nombre;
    this.str_correo = str_correo;
    this.str_pass = str_pass;
    this.int_rol = int_rol;
    this.str_pin = str_pin;
    this.str_tokenotp = str_tokenotp;
    this.bool_otp = bool_otp;
    this.bool_pin = bool_pin;
    this.dt_ultimoacceso = dt_ultimoacceso;
    this.bool_activo = bool_activo;
  }

  // * Método para guardar el usuario en la base de datos
  async guardar() {
    const query = `
      INSERT INTO usuario (str_nombre, str_correo, str_pass, int_rol, str_pin, str_tokenotp, bool_otp, bool_pin, dt_ultimoacceso, bool_activo, str_ubicacion)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING id_usuario
    `;

    const values = [
      this.str_nombre,
      this.str_correo,
      this.str_pass,
      this.int_rol,
      this.str_pin,
      this.str_tokenotp,
      this.bool_otp,
      this.bool_pin,
      this.dt_ultimoacceso,
      this.bool_activo,
      "PENDIENTE",
    ];

    try {
      const result = await pool.query(query, values);
      this.id_usuario = result.rows[0].id_usuario;
      return this;
    } catch (error) {
      throw new Error(`Error al guardar usuario: ${error.message}`);
    }
  }

  // * Metodo para actualizar el ultimo acceso del usuarios
  static async actualizarAcceso(id_usuario) {
    const query = `
      UPDATE usuario 
      SET dt_ultimoacceso = NOW()
      WHERE id_usuario = $1
      RETURNING *
    `;

    try {
      const result = await pool.query(query, [id_usuario]);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Error al actualizar el acceso: ${error.message}`);
    }
  }

  // * Método estático para buscar usuario por email
  static async buscarPorEmail(email) {
    const query = "SELECT * FROM usuario WHERE str_correo = $1";
    try {
      const result = await pool.query(query, [email]);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Error al buscar usuario: ${error.message}`);
    }
  }

  // * Método estático para buscar usuario por ID
  static async buscarPorId(id) {
    const query = "SELECT * FROM usuario WHERE id_usuario = $1";
    try {
      const result = await pool.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Error al buscar usuario: ${error.message}`);
    }
  }

  // * Método para activar cuenta y habilitar OTP
  async activarCuentaYOTP() {
    const query = `
      UPDATE usuario 
      SET bool_otp = TRUE, dt_ultimoacceso = NOW()
      WHERE id_usuario = $1
      RETURNING *
    `;
    try {
      const result = await pool.query(query, [this.id_usuario]);
      if (result.rows.length > 0) {
        // ? Actualizar propiedades del objeto
        this.bool_otp = true;
        this.dt_ultimoacceso = result.rows[0].dt_ultimoacceso;
      }
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Error al activar cuenta: ${error.message}`);
    }
  }

  // * Método para actualizar token OTP
  async actualizarTokenOTP(nuevoToken) {
    const query = `
      UPDATE usuario 
      SET str_tokenotp = $1
      WHERE id_usuario = $2
      RETURNING *
    `;
    try {
      const result = await pool.query(query, [nuevoToken, this.id_usuario]);
      if (result.rows.length > 0) {
        this.str_tokenotp = nuevoToken;
      }
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Error al actualizar token OTP: ${error.message}`);
    }
  }

  // * Metodo para Actualizar la contraseña una vez validado el codigo
  static async actualizarPassword(correo, nuevaPass) {
    const query = `
    UPDATE usuario
    SET str_pass = $1
    WHERE str_correo = $2
    RETURNING *
  `;
    try {
      const result = await pool.query(query, [nuevaPass, correo]);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Error al actualizar contraseña: ${error.message}`);
    }
  }

  // * Metodo para actualizar la ubicacion cuando un usuario inicia sesion
  static async actualizarGeolocalizacion(correo, str_ubicacion) {
    const query = `
      UPDATE usuario 
      SET str_ubicacion = $1
      WHERE str_correo = $2
      RETURNING *
    `;

    try {
      const result = await pool.query(query, [str_ubicacion, correo]);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Error al actualizar str_ubicacion: ${error.message}`);
    }
  }

  // * =================== MÉTODOS PARA PIN ===================

  /**
   * Configura un nuevo PIN para el usuario
   * @param {string} correo - Email del usuario
   * @param {string} pinEncriptado - PIN encriptado
   * @returns {Promise<Object|null>} Usuario actualizado
   */
  static async configurarPin(correo, pinEncriptado) {
    const fechaExpiracion = new Date();
    fechaExpiracion.setDate(fechaExpiracion.getDate() + 15); // 15 días

    const query = `
      UPDATE usuario 
      SET str_pin = $1, 
          bool_pin = true,
          dt_pin_expiracion = $2,
          bool_pin_usado = false,
          dt_ultimoAcceso = NOW()
      WHERE str_correo = $3 
        AND bool_activo = true 
        AND bool_otp = true
      RETURNING *
    `;

    try {
      const result = await pool.query(query, [
        pinEncriptado,
        fechaExpiracion,
        correo,
      ]);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Error al configurar PIN: ${error.message}`);
    }
  }

  /**
   * Obtiene el estado del PIN de un usuario
   * @param {string} correo - Email del usuario
   * @returns {Promise<Object|null>} Estado del PIN
   */
  static async obtenerEstadoPin(correo) {
    const query = `
      SELECT 
        str_correo,
        CASE 
          WHEN str_pin IS NULL THEN 'sin_configurar'
          WHEN bool_pin = false THEN 'desactivado'
          WHEN dt_pin_expiracion < NOW() THEN 'expirado'
          WHEN bool_pin_usado = true THEN 'usado'
          ELSE 'activo'
        END as estado_pin,
        dt_pin_expiracion,
        bool_pin_usado,
        CASE 
          WHEN dt_pin_expiracion > NOW() THEN 
            EXTRACT(DAY FROM (dt_pin_expiracion - NOW()))
          ELSE 0
        END as dias_restantes,
        dt_ultimoAcceso
      FROM usuario 
      WHERE str_correo = $1
    `;

    try {
      const result = await pool.query(query, [correo]);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Error al obtener estado del PIN: ${error.message}`);
    }
  }

  /**
   * Busca un usuario con PIN activo para verificación
   * @param {string} correo - Email del usuario
   * @returns {Promise<Object|null>} Usuario con PIN activo
   */
  static async buscarUsuarioConPinActivo(correo) {
    const query = `
      SELECT * FROM usuario 
      WHERE str_correo = $1 
        AND bool_activo = true 
        AND bool_pin = true 
        AND str_pin IS NOT NULL
        AND dt_pin_expiracion > NOW()
        AND (bool_pin_usado = false OR bool_pin_usado IS NULL)
    `;

    try {
      const result = await pool.query(query, [correo]);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(
        `Error al buscar usuario con PIN activo: ${error.message}`
      );
    }
  }

  /**
   * Marca el PIN como usado (un solo uso)
   * @param {string} correo - Email del usuario
   * @returns {Promise<Object|null>} Usuario actualizado
   */
  static async marcarPinComoUsado(correo) {
    const query = `
      UPDATE usuario 
      SET bool_pin_usado = true,
          bool_pin = false,
          dt_ultimoAcceso = NOW()
      WHERE str_correo = $1 
        AND bool_pin = true 
        AND str_pin IS NOT NULL
        AND dt_pin_expiracion > NOW()
      RETURNING *
    `;

    try {
      const result = await pool.query(query, [correo]);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Error al marcar PIN como usado: ${error.message}`);
    }
  }

  /**
   * Limpia PINs expirados (para el job de limpieza)
   * @returns {Promise<number>} Número de PINs limpiados
   */
  static async limpiarPinesExpirados() {
    const query = `
      UPDATE usuario 
      SET str_pin = NULL,
          bool_pin = false,
          bool_pin_usado = false,
          dt_pin_expiracion = NULL
      WHERE dt_pin_expiracion < NOW() 
         OR bool_pin_usado = true
    `;

    try {
      const result = await pool.query(query);
      return result.rowCount;
    } catch (error) {
      throw new Error(`Error al limpiar PINs expirados: ${error.message}`);
    }
  }

  /**
   * Obtiene estadísticas de PINs para monitoreo
   * @returns {Promise<Object>} Estadísticas de PINs
   */
  static async obtenerEstadisticasPines() {
    const query = `
      SELECT 
        COUNT(*) as total_usuarios,
        COUNT(CASE WHEN str_pin IS NOT NULL THEN 1 END) as usuarios_con_pin,
        COUNT(CASE WHEN bool_pin = true AND dt_pin_expiracion > NOW() THEN 1 END) as pines_activos,
        COUNT(CASE WHEN dt_pin_expiracion < NOW() THEN 1 END) as pines_expirados,
        COUNT(CASE WHEN bool_pin_usado = true THEN 1 END) as pines_usados
      FROM usuario
    `;

    try {
      const result = await pool.query(query);
      return result.rows[0];
    } catch (error) {
      throw new Error(
        `Error al obtener estadísticas de PINs: ${error.message}`
      );
    }
  }
}

module.exports = Usuario;
