const Joi = require('joi');

const configurarPinSchema = Joi.object({
  pin: Joi.string()
    .pattern(/^[0-9]{4,6}$/)
    .required()
    .messages({
      'string.pattern.base': 'El PIN debe contener entre 4 y 6 dígitos numéricos',
      'any.required': 'El PIN es requerido'
    }),
  codigo_otp: Joi.string()
    .pattern(/^[0-9]{6}$/)
    .required()
    .messages({
      'string.pattern.base': 'El código OTP debe ser de 6 dígitos',
      'any.required': 'El código OTP es requerido'
    })
});

const verificarPinSchema = Joi.object({
  pin: Joi.string()
    .pattern(/^[0-9]{4,6}$/)
    .required()
    .messages({
      'string.pattern.base': 'El PIN debe contener entre 4 y 6 dígitos numéricos',
      'any.required': 'El PIN es requerido'
    })
});

module.exports = {
  configurarPinSchema,
  verificarPinSchema
};