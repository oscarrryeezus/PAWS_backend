const pool = require("../config/db");
const bcrypt = require("bcryptjs");

class Usuario {
  constructor(id, nombre, email, password, rol) {
    this.id = id;
    this.nombre = nombre;
    this.email = email;
    this.password = password;
    this.rol = rol;
  }

  // Listar todos los usuarios
  static async listar() {
    const result = await pool.query("SELECT id, nombre, email, rol FROM usuarios ORDER BY id");
    return result.rows;
  }

  // Crear un nuevo usuario
  static async crear(nombre, email, password, rol) {
    const hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      "INSERT INTO usuarios (nombre, email, password, rol) VALUES ($1, $2, $3, $4) RETURNING id",
      [nombre, email, hash, rol]
    );
    return result.rows[0];
  }
}

module.exports = Usuario;
