const Joi = require("joi");

// * Esquema de validaciiónes con el Joi
const usuarioSchema = Joi.object({
  // ? Nombre: mínimo 3 letras, solo letras y espacios, sin caracteres especiales, máximo 30 caracteres
  str_nombre: Joi.string()
    .min(3)
    .max(30)
    .pattern(/^[A-Za-zÁÉÍÓÚáéíóúÑñ ]+$/)
    .required()
    .messages({
      "string.base": "El nombre debe ser una cadena de texto",
      "string.empty": "El nombre es obligatorio",
      "any.required": "El nombre es obligatorio",
      "string.min": "El nombre debe tener al menos 3 letras",
      "string.pattern.base": "El nombre solo puede contener letras y espacios",
      "string.max": "El nombre no puede exceder los 30 caracteres",
    }),
  // ? Email: máximo 30 caracteres, formato email, sin comillas dobles ni simples
  str_correo: Joi.string().email().max(30).required().messages({
    "string.base": "El correo debe ser una cadena de texto",
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
      "string.base": "La contraseña debe ser una cadena de texto",
      "string.empty": "La contraseña es obligatoria",
      "any.required": "La contraseña es obligatoria",
      "string.min": "La contraseña debe tener al menos 8 caracteres",
      "string.max": "La contraseña no puede exceder los 30 caracteres",
      "string.pattern.base":
        "La contraseña debe incluir letras, números y al menos un carácter especial",
    }),
});

module.exports = { usuarioSchema };
