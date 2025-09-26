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

  static async traerTodoAlv() {
    const query = "SELECT * FROM usuario"
    try {
      const result = await pool.query(query);
      return result.rows || null;
    } catch (error) {
      throw new Error(`Error al buscar usuario: ${error.message}`);
    }
  }

  // * Metodo para actualizar el ultimo acceso del usuarios
  static async actualizarAcceso(id_usuario) {
    const query = `
      UPDATE usuario 
      SET dt_ultimoAcceso = NOW()
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

// Pin Un Solo Uso
// * Método para configurar el PIN
static async configurarPin(userId, pinEncriptado) {
  const query = `
    UPDATE usuario 
    SET one_time_pin = $1, 
        pin_expires_at = NOW() + INTERVAL '30 days',
        pin_used = FALSE,
        pin_created_at = NOW(),
        bool_pin = TRUE
    WHERE id_usuario = $2
    RETURNING *
  `;
  
  try {
    const result = await pool.query(query, [pinEncriptado, userId]);
    return result.rows[0] || null;
  } catch (error) {
    throw new Error(`Error al configurar PIN: ${error.message}`);
  }
}

// * Método para invalidar PIN después de uso
static async invalidarPin(userId) {
  const query = `
    UPDATE usuario 
    SET one_time_pin = NULL, 
        pin_expires_at = NULL,
        pin_used = TRUE,
        bool_pin = FALSE
    WHERE id_usuario = $1
    RETURNING *
  `;
  
  try {
    const result = await pool.query(query, [userId]);
    return result.rows[0] || null;
  } catch (error) {
    throw new Error(`Error al invalidar PIN: ${error.message}`);
  }
}

// * Método para verificar PIN
static async verificarPin(userId, pin) {
  const query = `
    SELECT one_time_pin, pin_expires_at, pin_used 
    FROM usuario 
    WHERE id_usuario = $1
  `;
  
  try {
    const result = await pool.query(query, [userId]);
    const user = result.rows[0];
    
    if (!user || !user.one_time_pin) {
      return { valido: false, motivo: 'PIN no configurado' };
    }
    
    if (user.pin_used) {
      return { valido: false, motivo: 'PIN ya fue utilizado' };
    }
    
    if (new Date() > new Date(user.pin_expires_at)) {
      return { valido: false, motivo: 'PIN expirado' };
    }
    
    // Verificar el PIN con bcrypt
    const esValido = await bcrypt.compare(pin, user.one_time_pin);
    return { 
      valido: esValido, 
      motivo: esValido ? 'PIN válido' : 'PIN incorrecto' 
    };
    
  } catch (error) {
    throw new Error(`Error al verificar PIN: ${error.message}`);
  }
}

// * Método para obtener información del PIN
static async obtenerInfoPin(userId) {
  const query = `
    SELECT pin_expires_at, pin_used, pin_created_at, bool_pin
    FROM usuario 
    WHERE id_usuario = $1
  `;
  
  try {
    const result = await pool.query(query, [userId]);
    return result.rows[0] || null;
  } catch (error) {
    throw new Error(`Error al obtener información del PIN: ${error.message}`);
  }
}
}
module.exports = Usuario;
