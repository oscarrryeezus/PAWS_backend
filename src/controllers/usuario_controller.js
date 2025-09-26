const Usuario = require("../models/Usuario");
const bcrypt = require("bcryptjs");
const { usuarioSchema } = require("../validators/usuario_validator");
const { otpSchema } = require("../validators/otp_validator");
const OTPService = require("../services/otp_service");
const EmailService = require("../services/email_service");
const cacheService = require("../services/cache_service");
const emailVerificationService = require("../services/email_verification_service");
const { loginSchema } = require("../validators/login_validator");
const jwt = require('jsonwebtoken');
const { solicitarRecuperacionPasswordSchema, reestablecerPasswordSchema } = require("../validators/recuperar_password_validator");
require("dotenv").config();


exports.registrarUsuario = async (req, res) => {
  // ? Validar el body
  const { error, value } = usuarioSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  try {
    // ? Verificar si el email ya existe en la base de datos
    const usuarioExistente = await Usuario.buscarPorEmail(value.str_correo);
    if (usuarioExistente) {
      return res.status(400).json({ error: "El email ya está registrado" });
    }

    // ? Verificar si ya hay un registro pendiente para este email
    const registroPendiente = cacheService.get(value.str_correo);
    if (registroPendiente) {
      return res.status(400).json({
        error:
          "Ya existe un registro pendiente para este email. Verifica tu código de email o espera 15 minutos para intentar nuevamente.",
      });
    }

    // ? Encriptar la contraseña con bcrypt y la palabra secreta
    const salt = await bcrypt.genSalt(10);
    const secret = process.env.JWT_SECRET;
    const hash = await bcrypt.hash(value.str_pass + secret, salt);

    // ? Guardar datos temporalmente en cache (NO en base de datos todavía)
    const datosTemporales = {
      str_nombre: value.str_nombre,
      str_correo: value.str_correo,
      str_pass: hash,
      int_rol: 1,
      int_pin: null,
      bool_OTP: false, // Se habilitará después de la verificación completa
      bool_pin: false,
      dt_ultimoAcceso: new Date(),
      bool_activo: false, // Se activará después de verificar email y OTP
      timestamp: new Date().toISOString(),
      email_verificado: false, // Nuevo campo para controlar flujo
    };

    cacheService.set(value.str_correo, datosTemporales);

    // ? Generar y enviar código de verificación de email
    const codigoVerificacion =
      emailVerificationService.generateVerificationCode(value.str_correo);

    const emailService = new EmailService();
    try {
      await emailService.enviarCodigoVerificacion(
        value.str_correo,
        value.str_nombre,
        codigoVerificacion
      );
    } catch (emailError) {
      console.error(
        "Error al enviar código de verificación:",
        emailError.message
      );
      // Limpiar cache si falla el envío de email
      cacheService.delete(value.str_correo);
      return res.status(500).json({
        error:
          "No se pudo enviar el código de verificación. Intenta nuevamente.",
      });
    }

    // ? Responder con confirmación de envío de código
    res.status(200).json({
      mensaje:
        "Registro iniciado exitosamente. Revisa tu correo electrónico para obtener el código de verificación de 6 dígitos.",
      correo: value.str_correo,
      siguiente_paso:
        "Usar el endpoint /usuarios/verificar-email con tu email y el código de 6 dígitos",
      tiempo_expiracion: "15 minutos",
    });
  } catch (error) {
    console.error("Error al iniciar registro:", error);
    res.status(500).json({ error: "Error al iniciar registro" });
  }
};

exports.verificarEmail = async (req, res) => {
  // ? Validar el body con Joi
  const { error, value } =
    require("../validators/email_verification_validator").verificarCodigoEmailSchema.validate(
      req.body
    );
  if (error) {
    return res.status(400).json({
      error: error.details[0].message,
      errores: error.details.map((detail) => detail.message),
    });
  }

  const { email, codigo } = value;

  try {
    // ? Buscar datos temporales en cache
    const datosTemporales = cacheService.get(email);
    if (!datosTemporales) {
      return res.status(404).json({
        error:
          "No se encontró un registro pendiente para este email o ha expirado. Inicia el registro nuevamente.",
      });
    }

    // ? Verificar si ya se verificó el email
    if (datosTemporales.email_verificado) {
      return res.status(400).json({
        error:
          "Este email ya fue verificado. Usa el endpoint /usuarios/verificar-otp para completar tu registro.",
      });
    }

    // ? Verificar el código de email
    const verificacionResult = emailVerificationService.verifyCode(
      email,
      codigo
    );

    if (!verificacionResult.success) {
      return res.status(400).json({
        error: verificacionResult.message,
        intentos_restantes: verificacionResult.attemptsLeft || 0,
      });
    }

    // ? Email verificado exitosamente - generar OTP
    const otpData = await OTPService.generarSecreto(
      datosTemporales.str_nombre,
      email
    );

    // ? Actualizar datos temporales con token OTP y marcar email como verificado
    const datosActualizados = {
      ...datosTemporales,
      str_tokenOTP: otpData.secreto,
      email_verificado: true,
      timestamp: new Date().toISOString(),
    };

    cacheService.set(email, datosActualizados);

    // ? Responder con datos para configurar el authenticator
    res.status(200).json({
      mensaje:
        "¡Email verificado exitosamente! Ahora configura tu autenticación de dos factores (2FA).",
      correo: email,
      configuracion_otp: {
        codigo_manual: otpData.secreto,
        url_configuracion: otpData.url_manual,
        qr_code: otpData.qr_code,
        instrucciones:
          "Escanea el código QR con Google Authenticator o Microsoft Authenticator, o ingresa el código manual. Luego usa el endpoint /usuarios/verificar-otp para completar tu registro.",
        tiempo_expiracion: "15 minutos",
      },
      siguiente_paso:
        "Usar el endpoint /usuarios/verificar-otp con tu email y el código de 6 dígitos del authenticator",
    });
  } catch (error) {
    console.error("Error al verificar email:", error);
    res.status(500).json({ error: "Error al verificar el código de email" });
  }
};

exports.crearUsuario = async (req, res) => {
  const { nombre, email, password, rol } = req.body;
  try {
    await Usuario.crear(nombre, email, password, rol);
    res.redirect("/usuarios");
  } catch (err) {
    res.status(500).send("Error al crear usuario");
  }
};

//Pin de un solo uso
// En usuario_controller.js - reemplaza el método setOneTimePin:
exports.configurarPin = async (req, res) => {
  try {
    // Validar entrada
    const { error, value } = require("../validators/pin_validator").configurarPinSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { pin, codigo_otp } = value;
    const userId = req.user.id;
    const userEmail = req.user.email; // Asumiendo que tienes el email en el token

    // 1. Verificar código OTP primero
    const usuario = await Usuario.buscarPorId(userId);
    if (!usuario) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    // Verificar OTP (necesitas implementar esta función)
    const otpValido = OTPService.verificarCodigo(usuario.str_tokenOTP, codigo_otp);
    if (!otpValido) {
      return res.status(400).json({ error: "Código OTP inválido" });
    }

    // 2. Encriptar el PIN
    const salt = await bcrypt.genSalt(10);
    const hashedPin = await bcrypt.hash(pin, salt);

    // 3. Guardar en base de datos
    await Usuario.configurarPin(userId, hashedPin);

    // 4. Preparar respuesta con información de expiración
    const pinInfo = await Usuario.obtenerInfoPin(userId);
    
    res.status(200).json({
      mensaje: "PIN configurado exitosamente",
      detalles: {
        expiracion: pinInfo.pin_expires_at,
        vigencia: "30 días desde la configuración",
        instrucciones: "El PIN se invalidará automáticamente después del primer uso o al expirar"
      }
    });

  } catch (error) {
    console.error("Error al configurar PIN:", error);
    res.status(500).json({ error: "Error del servidor al configurar PIN" });
  }
};

// * Método para verificar y usar el PIN
exports.verificarPin = async (req, res) => {
  try {
    const { error, value } = require("../validators/pin_validator").verificarPinSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { pin } = value;
    const userId = req.user.id;

    // Verificar el PIN
    const resultado = await Usuario.verificarPin(userId, pin);

    if (!resultado.valido) {
      return res.status(400).json({ 
        error: `PIN inválido: ${resultado.motivo}` 
      });
    }

    // PIN válido - invalidarlo inmediatamente
    await Usuario.invalidarPin(userId);

    res.json({
      mensaje: "PIN verificado exitosamente",
      acceso: "Permitido",
      nota: "El PIN ha sido invalidado y no podrá ser usado nuevamente"
    });

  } catch (error) {
    console.error("Error al verificar PIN:", error);
    res.status(500).json({ error: "Error del servidor al verificar PIN" });
  }
};

// * Método para obtener estado del PIN
exports.obtenerEstadoPin = async (req, res) => {
  try {
    const userId = req.user.id;
    const pinInfo = await Usuario.obtenerInfoPin(userId);

    if (!pinInfo || !pinInfo.pin_expires_at) {
      return res.json({ 
        estado: "No configurado",
        mensaje: "No hay PIN configurado para este usuario" 
      });
    }

    const ahora = new Date();
    const expiracion = new Date(pinInfo.pin_expires_at);
    const expirado = ahora > expiracion;

    res.json({
      estado: pinInfo.pin_used ? "Utilizado" : expirado ? "Expirado" : "Activo",
      configurado: pinInfo.pin_created_at,
      expira: pinInfo.pin_expires_at,
      utilizado: pinInfo.pin_used,
      dias_restantes: expirado ? 0 : Math.ceil((expiracion - ahora) / (1000 * 60 * 60 * 24))
    });

  } catch (error) {
    console.error("Error al obtener estado del PIN:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
};

