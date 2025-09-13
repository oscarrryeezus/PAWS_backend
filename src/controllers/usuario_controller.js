const Usuario = require("../models/Usuario");
const bcrypt = require("bcryptjs");
const Joi = require("joi");
require("dotenv").config();

// ! Esquema de validación con Joi
const usuarioSchema = Joi.object({
  // ? Nombre: mínimo 3 letras, solo letras y espacios, sin caracteres especiales, máximo 30 caracteres
  str_nombre: Joi.string()
    .min(3)
    .max(30)
    .pattern(/^[A-Za-zÁÉÍÓÚáéíóúÑñ ]+$/)
    .required()
    .messages({
      "string.empty": "El nombre es obligatorio",
      "any.required": "El nombre es obligatorio",
      "string.min": "El nombre debe tener al menos 3 letras",
      "string.pattern.base": "El nombre solo puede contener letras y espacios",
      "string.max": "El nombre no puede exceder los 30 caracteres",
    }),
  // ? Email: máximo 30 caracteres, formato email, sin comillas dobles ni simples
  str_correo: Joi.string().email().max(30).required().messages({
    "string.empty": "El correo es obligatorio",
    "any.required": "El correo es obligatorio",
    "string.max": "El correo no puede exceder los 30 caracteres",
    "string.email": "El correo debe tener un formato válido",
  }),
  // ? Contraseña: mínimo 8 caracteres, máximo 30, debe incluir letras, números y caracteres especiales, sin comillas dobles ni simples
  str_pass: Joi.string()
    .min(8)
    .max(30)
    .pattern(/^(?=.*[a-zA-Z])(?=.*\d)(?=.*[^a-zA-Z\d]).{8,30}$/)
    .required()
    .messages({
      "string.empty": "La contraseña es obligatoria",
      "any.required": "La contraseña es obligatoria",
      "string.min": "La contraseña debe tener al menos 8 caracteres",
      "string.max": "La contraseña no puede exceder los 30 caracteres",
    }),
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
