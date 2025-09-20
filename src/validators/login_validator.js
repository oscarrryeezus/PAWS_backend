const Joi = require("joi")

// * Esquema para login (solo correo + contraseña)
const loginSchema = Joi.object({
  str_correo: Joi.string().email().max(30).required().messages({
    "string.base": "El correo debe ser una cadena de texto",
    "string.empty": "El correo es obligatorio",
    "any.required": "El correo es obligatorio",
    "string.max": "El correo no puede exceder los 30 caracteres",
    "string.email": "El correo debe tener un formato válido",
  }),

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

module.exports = { loginSchema }