const Joi = require("joi");

// * Esquema para validar código OTP
const otpSchema = Joi.object({
  str_correo: Joi.string().email().max(30).required().messages({
    "string.base": "El correo debe ser una cadena de texto",
    "string.empty": "El correo es obligatorio",
    "any.required": "El correo es obligatorio",
    "string.max": "El correo no puede exceder los 30 caracteres",
    "string.email": "El correo debe tener un formato válido",
  }),
  codigo_otp: Joi.string()
    .pattern(/^\d{6}$/)
    .required()
    .messages({
      "string.base": "El código OTP debe ser una cadena de texto",
      "string.empty": "El código OTP es obligatorio",
      "any.required": "El código OTP es obligatorio",
      "string.pattern.base": "El código OTP debe ser de 6 dígitos numéricos",
    }),
});

module.exports = { otpSchema };
