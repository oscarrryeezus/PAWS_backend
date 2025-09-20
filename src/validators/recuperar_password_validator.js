const Joi = require("joi")

// * Esquema para recuperar solicitar recuperar la contraseña (solo correo )
const solicitarRecuperacionPasswordSchema = Joi.object({
  str_correo: Joi.string().email().max(30).required().messages({
    "string.base": "El correo debe ser una cadena de texto",
    "string.empty": "El correo es obligatorio",
    "any.required": "El correo es obligatorio",
    "string.max": "El correo no puede exceder los 30 caracteres",
    "string.email": "El correo debe tener un formato válido",
  })
});

const reestablecerPasswordSchema = Joi.object({
  str_correo: Joi.string().email().max(30).required().messages({
    "string.base": "El correo debe ser una cadena de texto",
    "string.empty": "El correo es obligatorio",
    "any.required": "El correo es obligatorio",
    "string.max": "El correo no puede exceder los 30 caracteres",
    "string.email": "El correo debe tener un formato válido",
  }),

  codigo: Joi.string()
    .length(6)
    .pattern(/^\d{6}$/)
    .required()
    .messages({
      "string.base": "El código debe ser una cadena de texto",
      "string.empty": "El código es obligatorio",
      "any.required": "El código es obligatorio",
      "string.length": "El código debe tener exactamente 6 dígitos",
      "string.pattern.base": "El código debe contener solo números",
    }),

  nueva_pass: Joi.string()
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

module.exports = { solicitarRecuperacionPasswordSchema, reestablecerPasswordSchema }