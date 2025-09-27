const express = require("express");
const router = express.Router();
const usuarioController = require("../controllers/usuario_controller");

/**
 * @swagger
 * components:
 *   schemas:
 *     Usuario:
 *       type: object
 *       properties:
 *         id_usuario:
 *           type: integer
 *           description: ID único del usuario
 *         str_nombre:
 *           type: string
 *           description: Nombre completo del usuario
 *         str_correo:
 *           type: string
 *           format: email
 *           description: Email del usuario
 *         int_rol:
 *           type: integer
 *           description: Rol del usuario (1 = usuario normal)
 *         bool_activo:
 *           type: boolean
 *           description: Estado de activación del usuario
 *         str_tokenOTP:
 *           type: string
 *           description: Token OTP del usuario
 *         bool_OTP:
 *           type: boolean
 *           description: Estado de autenticación OTP (One-Time Password)
 *         dt_ultimoAcceso:
 *           type: string
 *           format: date-time
 *           description: Fecha y hora del último acceso
 *     RegistroUsuario:
 *       type: object
 *       required:
 *         - str_nombre
 *         - str_correo
 *         - str_pass
 *       properties:
 *         str_nombre:
 *           type: string
 *           description: Nombre completo del usuario
 *           example: "Juan Pérez"
 *         str_correo:
 *           type: string
 *           format: email
 *           description: Email del usuario
 *           example: "juan@ejemplo.com"
 *         str_pass:
 *           type: string
 *           description: Contraseña del usuario
 *           example: "MiPassword123!"
 *     VerificarEmail:
 *       type: object
 *       required:
 *         - email
 *         - codigo
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: Email del usuario que se registró
 *           example: "juan@ejemplo.com"
 *         codigo:
 *           type: string
 *           pattern: '^[0-9]{6}$'
 *           description: Código de 6 dígitos recibido por email
 *           example: "123456"
 *     VerificarOTP:
 *       type: object
 *       required:
 *         - str_correo
 *         - codigo_otp
 *       properties:
 *         str_correo:
 *           type: string
 *           format: email
 *           description: Email del usuario que se registró
 *           example: "juan@ejemplo.com"
 *         codigo_otp:
 *           type: string
 *           pattern: '^[0-9]{6}$'
 *           description: Código de 6 dígitos del authenticator
 *           example: "123456"
 */

/**
 * @swagger
 * /usuarios/registrar:
 *   post:
 *     summary: Inicia el registro de un nuevo usuario
 *     description: Registra datos del usuario y envía código de verificación de 6 dígitos por email
 *     tags: [Usuarios]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegistroUsuario'
 *     responses:
 *       200:
 *         description: Registro iniciado, código de verificación enviado por email
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mensaje:
 *                   type: string
 *                   example: "Registro iniciado exitosamente. Revisa tu correo electrónico para obtener el código de verificación de 6 dígitos."
 *                 correo:
 *                   type: string
 *                   example: "juan@ejemplo.com"
 *                 siguiente_paso:
 *                   type: string
 *                   example: "Usar el endpoint /usuarios/verificar-email con tu email y el código de 6 dígitos"
 *                 tiempo_expiracion:
 *                   type: string
 *                   example: "15 minutos"
 *       400:
 *         description: Error de validación o email duplicado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "El email ya está registrado"
 *       500:
 *         description: Error interno del servidor o problema enviando email
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "No se pudo enviar el código de verificación"
 */
router.post("/registrar", usuarioController.registrarUsuario);

/**
 * @swagger
 * /usuarios/verificar-email:
 *   post:
 *     summary: Verifica el código de email de 6 dígitos
 *     description: Valida el código enviado por email y genera configuración OTP para el authenticator
 *     tags: [Usuarios]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/VerificarEmail'
 *     responses:
 *       200:
 *         description: Email verificado exitosamente, configuración OTP generada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mensaje:
 *                   type: string
 *                   example: "¡Email verificado exitosamente! Ahora configura tu autenticación de dos factores (2FA)."
 *                 correo:
 *                   type: string
 *                   example: "juan@ejemplo.com"
 *                 configuracion_otp:
 *                   type: object
 *                   properties:
 *                     codigo_manual:
 *                       type: string
 *                       example: "JBSWY3DPEHPK3PXP"
 *                     url_configuracion:
 *                       type: string
 *                       example: "otpauth://totp/PAWS%20-%20Juan%20P%C3%A9rez:juan@ejemplo.com?secret=JBSWY3DPEHPK3PXP&issuer=PAWS%20Backend"
 *                     qr_code:
 *                       type: string
 *                       description: "Código QR en formato base64"
 *                     instrucciones:
 *                       type: string
 *                       example: "Escanea el código QR con Google Authenticator o Microsoft Authenticator..."
 *                     tiempo_expiracion:
 *                       type: string
 *                       example: "15 minutos"
 *                 siguiente_paso:
 *                   type: string
 *                   example: "Usar el endpoint /usuarios/verificar-otp con tu email y el código de 6 dígitos del authenticator"
 *       400:
 *         description: Error de validación o código incorrecto
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Código incorrecto"
 *                 intentos_restantes:
 *                   type: integer
 *                   example: 2
 *       404:
 *         description: Registro no encontrado o expirado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "No se encontró un registro pendiente para este email o ha expirado"
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Error al verificar el código de email"
 */
router.post("/verificar-email", usuarioController.verificarEmail);

/**
 * @swagger
 * /usuarios/verificar-otp:
 *   post:
 *     summary: Verifica código OTP del authenticator y completa el registro
 *     description: Valida el código del Google/Microsoft Authenticator y guarda el usuario en la base de datos (requiere verificación previa de email)
 *     tags: [Usuarios]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/VerificarOTP'
 *     responses:
 *       200:
 *         description: Registro completado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mensaje:
 *                   type: string
 *                   example: "¡Registro completado exitosamente! Tu cuenta está activa y lista para usar."
 *                 usuario:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     nombre:
 *                       type: string
 *                       example: "Juan Pérez"
 *                     correo:
 *                       type: string
 *                       example: "juan@ejemplo.com"
 *                     activo:
 *                       type: boolean
 *                       example: true
 *                     otp_habilitado:
 *                       type: boolean
 *                       example: true
 *                     fecha_registro:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Error de validación, código inválido o email no verificado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Código OTP inválido o expirado o email no verificado"
 *       404:
 *         description: Usuario no encontrado o registro expirado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "No se encontró un registro pendiente para este email o ha expirado"
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Error al completar el registro"
 */
router.post("/verificar-otp", usuarioController.verificarOTP);

/**
 * @swagger
 * components:
 *   schemas:
 *     ConfigurarPin:
 *       type: object
 *       required:
 *         - str_correo
 *         - codigo_otp
 *       properties:
 *         str_correo:
 *           type: string
 *           format: email
 *           description: Email del usuario
 *           example: "juan@ejemplo.com"
 *         codigo_otp:
 *           type: string
 *           pattern: '^[0-9]{6}$'
 *           description: Código OTP de Google/Microsoft Authenticator
 *           example: "123456"
 *     UsarPin:
 *       type: object
 *       required:
 *         - str_correo
 *         - pin
 *       properties:
 *         str_correo:
 *           type: string
 *           format: email
 *           description: Email del usuario
 *           example: "juan@ejemplo.com"
 *         pin:
 *           type: string
 *           pattern: '^[0-9]{6}$'
 *           description: PIN de 6 dígitos generado
 *           example: "987654"
 */

/**
 * @swagger
 * /usuarios/configurar-pin:
 *   post:
 *     summary: Configura un PIN de un solo uso
 *     description: Genera y configura un PIN encriptado que dura 15 días y es de un solo uso. Requiere verificación OTP.
 *     tags: [PIN]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ConfigurarPin'
 *     responses:
 *       201:
 *         description: PIN configurado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mensaje:
 *                   type: string
 *                   example: "PIN configurado exitosamente"
 *                 pin:
 *                   type: object
 *                   properties:
 *                     codigo:
 *                       type: string
 *                       example: "987654"
 *                     expira_en:
 *                       type: string
 *                       example: "15 días"
 *                     uso_unico:
 *                       type: boolean
 *                       example: true
 *                 almacenamiento_offline:
 *                   type: object
 *                   description: "Datos encriptados para almacenamiento local seguro"
 *       400:
 *         description: Error de validación o PIN ya existe
 *       404:
 *         description: Usuario no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.post("/configurar-pin", usuarioController.configurarPin);

/**
 * @swagger
 * /usuarios/usar-pin:
 *   post:
 *     summary: Usa un PIN de un solo uso
 *     description: Verifica y consume un PIN activo. El PIN se marca como usado después de la verificación exitosa.
 *     tags: [PIN]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UsarPin'
 *     responses:
 *       200:
 *         description: PIN usado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mensaje:
 *                   type: string
 *                   example: "PIN usado exitosamente"
 *                 acceso:
 *                   type: object
 *                   properties:
 *                     autorizado:
 *                       type: boolean
 *                       example: true
 *                     token_temporal:
 *                       type: string
 *                       description: "JWT token válido por 1 hora"
 *                     valido_por:
 *                       type: string
 *                       example: "1 hora"
 *                 estado_pin:
 *                   type: object
 *                   properties:
 *                     usado:
 *                       type: boolean
 *                       example: true
 *                     disponible:
 *                       type: boolean
 *                       example: false
 *       400:
 *         description: PIN incorrecto o inválido
 *       404:
 *         description: PIN no encontrado o expirado
 *       500:
 *         description: Error interno del servidor
 */
router.post("/usar-pin", usuarioController.usarPin);

/**
 * @swagger
 * /usuarios/estado-pin/{correo}:
 *   get:
 *     summary: Obtiene el estado del PIN de un usuario
 *     description: Consulta el estado actual del PIN (activo, usado, expirado, etc.)
 *     tags: [PIN]
 *     parameters:
 *       - in: path
 *         name: correo
 *         required: true
 *         schema:
 *           type: string
 *           format: email
 *         description: Email del usuario
 *         example: "juan@ejemplo.com"
 *     responses:
 *       200:
 *         description: Estado del PIN obtenido exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 estado_pin:
 *                   type: object
 *                   properties:
 *                     correo:
 *                       type: string
 *                       example: "juan@ejemplo.com"
 *                     estado:
 *                       type: string
 *                       enum: [sin_configurar, activo, usado, expirado, desactivado]
 *                       example: "activo"
 *                     expira_en:
 *                       type: string
 *                       example: "12 días"
 *                     acciones_disponibles:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["Usar PIN"]
 *                 configuracion:
 *                   type: object
 *                   properties:
 *                     duracion_dias:
 *                       type: integer
 *                       example: 15
 *                     uso_unico:
 *                       type: boolean
 *                       example: true
 *                     requiere_otp:
 *                       type: boolean
 *                       example: true
 *       404:
 *         description: Usuario no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.get("/estado-pin/:correo", usuarioController.obtenerEstadoPin);

module.exports = router;
