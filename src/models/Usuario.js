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
    dt_ultimoAcceso,
    bool_activo,
    bool_2FA,
    bool_pin,
  }) {
    this.id_usuario = id_usuario;
    this.str_nombre = str_nombre;
    this.str_correo = str_correo;
    this.str_pass = str_pass;
    this.int_rol = int_rol;
    this.int_pin = int_pin;
    this.bool_2FA = bool_2FA;
    this.bool_pin = bool_pin;
    this.dt_ultimoAcceso = dt_ultimoAcceso;
    this.bool_activo = bool_activo;
  }

  // * Método para guardar el usuario en la base de datos
  async guardar() {
    const query = `
      INSERT INTO usuario (str_nombre, str_correo, str_pass, int_rol, int_pin, bool_2FA, bool_pin, dt_ultimoAcceso, bool_activo)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id_usuario
    `;

    const values = [
      this.str_nombre,
      this.str_correo,
      this.str_pass,
      this.int_rol,
      this.int_pin,
      this.bool_2FA,
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
}

module.exports = Usuario;
