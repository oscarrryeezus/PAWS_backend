const Usuario = require("../models/Usuario");
const bcrypt = require("bcryptjs");
const Joi = require("joi");
require("dotenv").config();

// ! Esquema de validación con Joi
const usuarioSchema = Joi.object({
  str_nombre: Joi.string().required(),
  str_correo: Joi.string().email().required(),
  str_pass: Joi.string().required(),
});

exports.registrarUsuario = async (req, res) => {
  // ? Validar el body
  const { error, value } = usuarioSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  try {
    // ? Verificar si el email ya existe
    const usuarioExistente = await Usuario.buscarPorEmail(value.str_correo);
    if (usuarioExistente) {
      return res.status(400).json({ error: "El email ya está registrado" });
    }

    // ? Encriptar la contraseña con bcrypt y la palabra secreta
    const salt = await bcrypt.genSalt(10);
    const secret = process.env.JWT_SECRET;
    const hash = await bcrypt.hash(value.str_pass + secret, salt);

    const nuevoUsuario = new Usuario({
      id_usuario: null,
      str_nombre: value.str_nombre,
      str_correo: value.str_correo,
      str_pass: hash,
      int_rol: 1, // ? Por defecto sin permisos de admin
      int_pin: null,
      str_tokenOTP: "PENDIENTE",
      bool_OTP: false,
      bool_pin: false,
      dt_ultimoAcceso: new Date(),
      bool_activo: false,
    });

    await nuevoUsuario.guardar();
    res.status(201).send("Usuario registrado exitosamente");
  } catch (error) {
    console.error("Error al registrar usuario:", error);
    res.status(500).send("Error al registrar usuario");
  }
};
