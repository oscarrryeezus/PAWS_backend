const Usuario = require("../models/Usuario");
const bcrypt = require("bcryptjs");
const { usuarioSchema } = require("../validators/usuario_validator");
const { otpSchema } = require("../validators/otp_validator");
const OTPService = require("../services/otp_service");
const EmailService = require("../services/email_service");
const cacheService = require("../services/cache_service");
const emailVerificationService = require("../services/email_verification_service");
const { loginSchema, otpLoginVerifierSchema } = require("../validators/login_validator");
const jwt = require('jsonwebtoken');
const geoip = require("geoip-lite");
const { solicitarRecuperacionPasswordSchema, reestablecerPasswordSchema } = require("../validators/recuperar_password_validator");
const Geolocalización = require("../services/geolocalizacion_service");
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

exports.verificarOTP = async (req, res) => {
  // ? Validar el body con Joi
  const { error, value } = otpSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  const { str_correo, codigo_otp } = value;

  try {
    // ? Buscar datos temporales en cache
    const datosTemporales = cacheService.get(str_correo);
    if (!datosTemporales) {
      return res.status(404).json({
        error:
          "No se encontró un registro pendiente para este email o ha expirado. Inicia el registro nuevamente.",
      });
    }

    // ? Verificar que el email haya sido verificado primero
    if (!datosTemporales.email_verificado) {
      return res.status(400).json({
        error:
          "Debes verificar tu email primero usando el código de 6 dígitos. Usa el endpoint /usuarios/verificar-email.",
      });
    }

    // ? Verificar que existe el token OTP
    if (!datosTemporales.str_tokenOTP) {
      return res.status(400).json({
        error: "No se encontró configuración OTP. Verifica tu email primero.",
      });
    }

    // ? Verificar el código OTP
    const esValido = OTPService.verificarToken(
      codigo_otp,
      datosTemporales.str_tokenOTP
    );
    if (!esValido) {
      return res.status(400).json({ error: "Código OTP inválido o expirado" });
    }

    // ? AHORA sí guardamos en la base de datos
    const nuevoUsuario = new Usuario({
      id_usuario: null,
      str_nombre: datosTemporales.str_nombre,
      str_correo: datosTemporales.str_correo,
      str_pass: datosTemporales.str_pass,
      int_rol: datosTemporales.int_rol,
      int_pin: datosTemporales.int_pin,
      str_tokenOTP: datosTemporales.str_tokenOTP,
      bool_OTP: true, // Habilitado desde el registro
      bool_pin: datosTemporales.bool_pin,
      dt_ultimoAcceso: new Date(),
      bool_activo: true, // Activo desde el registro
    });

    await nuevoUsuario.guardar();

    // ? Eliminar datos temporales del cache
    cacheService.delete(str_correo);

    res.status(201).json({
      mensaje:
        "¡Registro completado exitosamente! Tu cuenta está activa y lista para usar.",
      usuario: {
        id: nuevoUsuario.id_usuario,
        nombre: nuevoUsuario.str_nombre,
        correo: nuevoUsuario.str_correo,
        activo: true,
        otp_habilitado: true,
        fecha_registro: nuevoUsuario.dt_ultimoAcceso,
      },
    });
  } catch (error) {
    console.error("Error al verificar OTP:", error);
    res.status(500).json({ error: "Error al completar el registro" });
  }
};

exports.login = async (req, res) => {
  try {
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: error.details[0].message,
        errores: error.details.map((d) => d.message),
      });
    }

    const { str_correo, str_pass } = value;

    if (!str_correo || !str_pass) {
      return res
        .status(200)
        .json({ error: "Correo y contraseña son requeridos" });
    }

    const usuario = await Usuario.buscarPorEmail(str_correo);
    if (!usuario) {
      return res
        .status(200)
        .json({ error: "El usuario no existe" });
    }

    // ? Comparar contraseñas 
    const secret = process.env.JWT_SECRET;
    const contrasenaValida = await bcrypt.compare(
      str_pass + secret,
      usuario.str_pass
    );

    // ? Contraseña no valida 
    if (!contrasenaValida) {
      return res
        .status(200)
        .json({ error: "Correo o contraseña incorrectos {Password}" });
    }

    if (usuario.bool_activo) {
      const ahora = Date.now(); // timestamp actual en ms
      const fecha_sesion = cacheService.get(str_correo + "EXPIRACION-SESION");

      if (fecha_sesion) {
        const tiempoRestanteMs = fecha_sesion - ahora;

        if (tiempoRestanteMs > 0) {
          const minutos = Math.floor(tiempoRestanteMs / 60000);
          const segundos = Math.floor((tiempoRestanteMs % 60000) / 1000);

          return res.status(200).json({
            error: "Ya existe una sesion activa.",
            codigo: 1,
            Expiracion: `${minutos} min ${segundos} seg`,
          });
        }
      }
    }

    // ? Generar código de 6 digitos
    const codigo = Math.floor(100000 + Math.random() * 900000).toString();

    // ? Guardar en cache (correo -> código)
    cacheService.set(str_correo + "LOGIN", { codigo });

    // ? Enviar correo
    const email_service = new EmailService();
    await email_service.enviarCodigoVerificacion(
      str_correo,
      usuario.str_nombre,
      codigo
    );

    // ? Obtener IP y geolocalización
    const res_geo = await Geolocalización.obtenerGeolocalizacion();
    const { location } = res_geo
    await Usuario.actualizarGeolocalizacion(str_correo, JSON.stringify(location))

    res.status(200).json({
      mensaje: "Codigo enviado con exito a su correo. Favor de verificar su bandeja de entrada",
      codigo: codigo,
    });
  } catch (error) {
    console.error("Error al iniciar sesión: ", error);
    res.status(500).json({ error: "Error al iniciar sesión" });
  }
};

exports.validarLoginOTP = async (req, res) => {

  try {
    // ? Validar entrada con JOI
    const { error, value } = otpLoginVerifierSchema.validate(req.body)
    if (error) {
      return res.status(400).json({
        error: error.details[0].message,
        errores: error.details.map((d) => d.message)
      });
    }

    const { str_correo, codigo } = value;

    if (!str_correo || !codigo) {
      return res.status(400).json({ error: "Correo, código y nueva contraseña son requeridos" });
    }

    const usuario = await Usuario.buscarPorEmail(str_correo);
    if (!usuario) {
      return res
        .status(401)
        .json({ error: "El usuario no existe" });
    }

    // ? Buscar codigo en cache
    const datosCache = cacheService.get(str_correo + "LOGIN");
    if (!datosCache) {
      return res.status(200).json({ error: "Codigo expirado o no solicitado", codigo: 1 });
    }

    // ? Verificar codigo
    if (datosCache.codigo !== codigo) {
      return res.status(400).json({ error: "Código inválido" });
    }

    // ? Generar JWT
    const secret = process.env.JWT_SECRET;
    const token = jwt.sign(
      {
        id: usuario.id_usuario,
        correo: usuario.str_correo,
        rol: usuario.int_rol,
      },
      secret,
      { expiresIn: "5m" }
    );

    await Usuario.actualizarAcceso(usuario.id_usuario);

    cacheService.delete(str_correo + "LOGIN")

    await Usuario.actualizarSesion('true', str_correo)

    const ahora = Date.now();
    const duracionSesion = 5 * 60 * 1000; // 5 minutos

    // ? Guardamos el tiempo exacto en que expira la sesión
    const expiracionSesion = ahora + duracionSesion;
    cacheService.set(str_correo + "EXPIRACION-SESION", expiracionSesion);

    // ? Calcular minutos y segundos para la respuesta
    const minutos = Math.floor(duracionSesion / 60000);
    const segundos = Math.floor((duracionSesion % 60000) / 1000);

    return res.status(200).json({
      mensaje: "Codigo correcto",
      token,
      user: {
        correo: usuario.str_correo,
        nombre: usuario.str_nombre,
      },
      Expiracion: `${minutos} min ${segundos} seg`,
    });


  } catch (error) {
    console.error("Error en verificar otp de login:", error);
    res.status(500).json({ error: "Error al verificar el otp de login" });
  }
}

exports.solicitarRecuperacionPassword = async (req, res) => {
  try {
    // ? Validar entrada con JOI
    const { error, value } = solicitarRecuperacionPasswordSchema.validate(req.body)
    if (error) {
      return res.status(400).json({
        error: error.details[0].message,
        errores: error.details.map((d) => d.message)
      });
    }

    const { str_correo } = value;

    if (!str_correo) {
      return res.status(400).json({ error: "El correo es obligatorio" })
    }

    // ? Verificar que el usuario exista
    const usuario = await Usuario.buscarPorEmail(str_correo)
    if (!usuario) {
      return res.status(404).json({ error: "No existe cuenta con ese correo" })
    }

    // ? Generar código de 6 digitos
    const codigo = Math.floor(100000 + Math.random() * 900000).toString();

    // ? Guardar en cache (correo -> código)
    cacheService.set(str_correo, { codigo });

    // ? Enviar correo
    const email_service = new EmailService();
    await email_service.enviarCodigoVerificacion(
      str_correo,
      usuario.str_nombre,
      codigo
    );

    console.log({ "Codigo": codigo })

    // ? Mandar respuesta matona
    res.status(200).json({
      mensaje: "Se ha enviado un código de verificación a tu correo",
      correo: str_correo,
      tiempo_expiracion: "15 minutos",
      siguiente_paso: "Usar /usuarios/reestablecer-password con correo, código y nueva contraseña"
    });

  } catch (error) {
    console.error("Error en solicitarRecuperacionPassword:", error);
    res.status(500).json({ error: "Error al solicitar recuperación de contraseña" });
  }
}

exports.restablecerPassword = async (req, res) => {
  try {
    // ? Validar entrada con JOI
    const { error, value } = reestablecerPasswordSchema.validate(req.body)
    if (error) {
      return res.status(400).json({
        error: error.details[0].message,
        errores: error.details.map((d) => d.message)
      });
    }

    const { str_correo, codigo, nueva_pass } = value;

    if (!str_correo || !codigo || !nueva_pass) {
      return res.status(400).json({ error: "Correo, código y nueva contraseña son requeridos" });
    }

    // ? Verificar que el usuario exista 
    const usuario = await Usuario.buscarPorEmail(str_correo);
    if (!usuario) {
      return res
        .status(200)
        .json({ error: "El usuario no existe" });
    }

    // ? Buscar codigo en cache
    const datosCache = cacheService.get(str_correo);
    if (!datosCache) {
      return res.status(400).json({ error: "Codigo expirado o no solicitado" });
    }

    // ? Verificar codigo
    if (datosCache.codigo !== codigo) {
      return res.status(400).json({ error: "Código inválido" });
    }

    // ? Encriptar la contraseña 
    const salt = await bcrypt.genSalt(10);
    const secret = process.env.JWT_SECRET;
    const hash = await bcrypt.hash(nueva_pass + secret, salt)

    // ? Actualizar contraseña en BD
    const result = await Usuario.actualizarPassword(str_correo, hash);
    if (!result) {
      return res.status(500).json({ error: "No se pudo actualizar la contraseña" })
    }

    // ? Eliminar cache
    cacheService.delete(str_correo);

    res.status(200).json({
      mensaje: "Contraseña reestablecida exitosamente. Ya puedes iniciar sesión con la nueva contraseña."
    });

  } catch (error) {
    console.error("Error en reestablecerPassword:", error);
    res.status(500).json({ error: "Error al reestablecer contraseña" });
  }
}