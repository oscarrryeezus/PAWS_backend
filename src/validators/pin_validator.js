const Joi = require("joi");

/**
 * Validadores para el sistema de PIN de un solo uso
 * Incluye esquemas para configurar, usar y obtener estado del PIN
 */

// Esquema para configurar un nuevo PIN
const configurarPinSchema = Joi.object({
  str_correo: Joi.string()
    .email({ tlds: { allow: false } })
    .max(30)
    .required()
    .messages({
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

// Esquema para usar un PIN existente
const usarPinSchema = Joi.object({
  str_correo: Joi.string()
    .email({ tlds: { allow: false } })
    .max(30)
    .required()
    .messages({
      "string.base": "El correo debe ser una cadena de texto",
      "string.empty": "El correo es obligatorio",
      "any.required": "El correo es obligatorio",
      "string.max": "El correo no puede exceder los 30 caracteres",
      "string.email": "El correo debe tener un formato válido",
    }),

  pin: Joi.string()
    .pattern(/^\d{6}$/)
    .required()
    .messages({
      "string.base": "El PIN debe ser una cadena de texto",
      "string.empty": "El PIN es obligatorio",
      "any.required": "El PIN es obligatorio",
      "string.pattern.base":
        "El PIN debe ser de exactamente 6 dígitos numéricos",
    }),
});

// Esquema para usar PIN con datos offline
const usarPinOfflineSchema = Joi.object({
  datos_offline: Joi.object({
    encrypted_data: Joi.string().required().messages({
      "string.base": "Los datos encriptados deben ser una cadena de texto",
      "string.empty": "Los datos encriptados son obligatorios",
      "any.required": "Los datos encriptados son obligatorios",
    }),

    iv: Joi.string()
      .length(32)
      .pattern(/^[a-f0-9]{32}$/)
      .required()
      .messages({
        "string.base": "El IV debe ser una cadena de texto",
        "string.empty": "El IV es obligatorio",
        "any.required": "El IV es obligatorio",
        "string.length": "El IV debe tener exactamente 32 caracteres",
        "string.pattern.base": "El IV debe ser hexadecimal válido",
      }),

    token: Joi.string()
      .length(64)
      .pattern(/^[a-f0-9]{64}$/)
      .required()
      .messages({
        "string.base": "El token debe ser una cadena de texto",
        "string.empty": "El token es obligatorio",
        "any.required": "El token es obligatorio",
        "string.length": "El token debe tener exactamente 64 caracteres",
        "string.pattern.base": "El token debe ser hexadecimal válido",
      }),
  }).required(),

  pin: Joi.string()
    .pattern(/^\d{6}$/)
    .required()
    .messages({
      "string.base": "El PIN debe ser una cadena de texto",
      "string.empty": "El PIN es obligatorio",
      "any.required": "El PIN es obligatorio",
      "string.pattern.base":
        "El PIN debe ser de exactamente 6 dígitos numéricos",
    }),
});

// Esquema para obtener estado del PIN
const obtenerEstadoPinSchema = Joi.object({
  str_correo: Joi.string()
    .email({ tlds: { allow: false } })
    .max(30)
    .required()
    .messages({
      "string.base": "El correo debe ser una cadena de texto",
      "string.empty": "El correo es obligatorio",
      "any.required": "El correo es obligatorio",
      "string.max": "El correo no puede exceder los 30 caracteres",
      "string.email": "El correo debe tener un formato válido",
    }),
});

// Middleware de validación para configurar PIN
const validarConfigurarPin = (req, res, next) => {
  const { error } = configurarPinSchema.validate(req.body, {
    abortEarly: false,
  });

  if (error) {
    const errores = error.details.map((detail) => detail.message);
    return res.status(400).json({
      mensaje: "Error de validación al configurar PIN",
      errores: errores,
    });
  }

  next();
};

// Middleware de validación para usar PIN
const validarUsarPin = (req, res, next) => {
  const { error } = usarPinSchema.validate(req.body, { abortEarly: false });

  if (error) {
    const errores = error.details.map((detail) => detail.message);
    return res.status(400).json({
      mensaje: "Error de validación al usar PIN",
      errores: errores,
    });
  }

  next();
};

// Middleware de validación para usar PIN offline
const validarUsarPinOffline = (req, res, next) => {
  const { error } = usarPinOfflineSchema.validate(req.body, {
    abortEarly: false,
  });

  if (error) {
    const errores = error.details.map((detail) => detail.message);
    return res.status(400).json({
      mensaje: "Error de validación al usar PIN offline",
      errores: errores,
    });
  }

  next();
};

// Middleware de validación para obtener estado
const validarObtenerEstadoPin = (req, res, next) => {
  const { error } = obtenerEstadoPinSchema.validate(req.body, {
    abortEarly: false,
  });

  if (error) {
    const errores = error.details.map((detail) => detail.message);
    return res.status(400).json({
      mensaje: "Error de validación al obtener estado del PIN",
      errores: errores,
    });
  }

  next();
};

// Validación para parámetros de ruta (GET requests)
const validarCorreoParam = (req, res, next) => {
  const correoSchema = Joi.string()
    .email({ tlds: { allow: false } })
    .max(30)
    .required()
    .messages({
      "string.email": "El correo debe tener un formato válido",
      "any.required": "El correo es obligatorio",
      "string.max": "El correo no puede exceder los 30 caracteres",
    });

  const { error } = correoSchema.validate(req.params.correo);

  if (error) {
    return res.status(400).json({
      mensaje: "Error de validación en parámetro de correo",
      error: error.details[0].message,
    });
  }

  next();
};

module.exports = {
  // Esquemas
  configurarPinSchema,
  usarPinSchema,
  usarPinOfflineSchema,
  obtenerEstadoPinSchema,

  // Middlewares
  validarConfigurarPin,
  validarUsarPin,
  validarUsarPinOffline,
  validarObtenerEstadoPin,
  validarCorreoParam,
};
