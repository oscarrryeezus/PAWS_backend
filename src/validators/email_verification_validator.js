const Joi = require("joi");

// Esquema para verificación de código de email
const verificarCodigoEmailSchema = Joi.object({
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .required()
    .max(30)
    .messages({
      "string.email": "El correo electrónico debe tener un formato válido",
      "any.required": "El correo electrónico es obligatorio",
      "string.max": "El correo electrónico no puede exceder los 30 caracteres",
    }),

  codigo: Joi.string()
    .pattern(/^\d{6}$/)
    .required()
    .messages({
      "string.pattern.base": "El código debe ser de exactamente 6 dígitos",
      "any.required": "El código de verificación es obligatorio",
    }),
});

// Middleware de validación para verificar código de email
const validarVerificacionCodigoEmail = (req, res, next) => {
  const { error } = verificarCodigoEmailSchema.validate(req.body, {
    abortEarly: false,
  });

  if (error) {
    const errores = error.details.map((detail) => detail.message);
    return res.status(400).json({
      mensaje: "Error de validación",
      errores: errores,
    });
  }

  next();
};

module.exports = {
  verificarCodigoEmailSchema,
  validarVerificacionCodigoEmail,
};
