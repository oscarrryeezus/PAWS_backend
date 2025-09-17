const pool = require("../config/db");
const bcrypt = require("bcryptjs");

class Usuario {
  constructor({
    id_usuario = null,
    str_nombre,
    str_correo,
    str_pass,
    int_rol,
    int_pin,
    str_tokenOTP,
    dt_ultimoAcceso,
    bool_activo,
    bool_OTP,
    bool_pin,
  }) {
    this.id_usuario = id_usuario;
    this.str_nombre = str_nombre;
    this.str_correo = str_correo;
    this.str_pass = str_pass;
    this.int_rol = int_rol;
    this.int_pin = int_pin;
    this.str_tokenOTP = str_tokenOTP;
    this.bool_OTP = bool_OTP;
    this.bool_pin = bool_pin;
    this.dt_ultimoAcceso = dt_ultimoAcceso;
    this.bool_activo = bool_activo;
  }

  // * Método para guardar el usuario en la base de datos
  async guardar() {
    const query = `
      INSERT INTO usuario (str_nombre, str_correo, str_pass, int_rol, int_pin, str_tokenOTP, bool_OTP, bool_pin, dt_ultimoAcceso, bool_activo)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id_usuario
    `;

    const values = [
      this.str_nombre,
      this.str_correo,
      this.str_pass,
      this.int_rol,
      this.int_pin,
      this.str_tokenOTP,
      this.bool_OTP,
      this.bool_pin,
      this.dt_ultimoAcceso,
      this.bool_activo,
    ];

    try {
      const result = await pool.query(query, values);
      this.id_usuario = result.rows[0].id_usuario;
      return this;
    } catch (error) {
      throw new Error(`Error al guardar usuario: ${error.message}`);
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
      SET bool_OTP = TRUE, dt_ultimoAcceso = NOW()
      WHERE id_usuario = $1
      RETURNING *
    `;
    try {
      const result = await pool.query(query, [this.id_usuario]);
      if (result.rows.length > 0) {
        // ? Actualizar propiedades del objeto
        this.bool_OTP = true;
        this.dt_ultimoAcceso = result.rows[0].dt_ultimoAcceso;
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
      SET str_tokenOTP = $1
      WHERE id_usuario = $2
      RETURNING *
    `;
    try {
      const result = await pool.query(query, [nuevoToken, this.id_usuario]);
      if (result.rows.length > 0) {
        this.str_tokenOTP = nuevoToken;
      }
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Error al actualizar token OTP: ${error.message}`);
    }
  }
}

module.exports = Usuario;
