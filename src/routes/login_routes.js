const express = require("express");
const router = express.Router();
const usuarioController = require("../controllers/usuario_controller");

/**
 * @swagger
 * components:
 *   schemas:
 *     LoginUsuario:
 *       type: object
 *       required:
 *         - str_correo
 *         - str_pass
 *       properties:
 *         str_correo:
 *           type: string
 *           format: email
 *           description: Email del usuario
 *           example: "juan@ejemplo.com"
 *         str_pass:
 *           type: string
 *           description: Contraseña del usuario
 *           example: "MiPassword123!"
 */

/**
 * @swagger
 * /login:
 *   post:
 *     summary: Inicia sesión en el sistema y envía código OTP al correo
 *     description: Valida correo y contraseña. Si son correctos, envía un código OTP al correo y devuelve un mensaje.
 *     tags: [Usuarios]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginUsuario'
 *     responses:
 *       200:
 *         description: Código OTP enviado al correo
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mensaje:
 *                   type: string
 *                   example: "Código enviado con éxito a su correo. Favor de verificar su bandeja de entrada"
 *                 correo:
 *                   type: string
 *                   example: "juan@ejemplo.com"
 *       400:
 *         description: Error de validación
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "El correo es obligatorio"
 *       401:
 *         description: Credenciales incorrectas
 *       403:
 *         description: Cuenta inactiva
 *       500:
 *         description: Error interno del servidor
 */
router.post("/", usuarioController.login);

/**
 * @swagger
 * /login/validar-otp:
 *   post:
 *     summary: Valida el código OTP enviado al correo y genera JWT
 *     description: Permite completar el login usando el código OTP recibido por correo.
 *     tags: [Usuarios]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - str_correo
 *               - codigo
 *             properties:
 *               str_correo:
 *                 type: string
 *                 format: email
 *                 example: "juan@ejemplo.com"
 *               codigo:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Código correcto, login completado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mensaje:
 *                   type: string
 *                   example: "Código correcto"
 *                 token:
 *                   type: string
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                 usuario:
 *                   type: object
 *                   properties:
 *                     nombre:
 *                       type: string
 *                       example: "Juan Pérez"
 *                     correo:
 *                       type: string
 *                       example: "juan@ejemplo.com"
 *                     rol:
 *                       type: integer
 *                       example: 1
 *                     ip:
 *                       type: string
 *                       example: "::1"
 *                     ubicacion:
 *                       type: string
 *                       example: "Ubicación no disponible"
 *       400:
 *         description: Código inválido o expirado
 *       401:
 *         description: Usuario no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.post("/validar-otp", usuarioController.validarLoginOTP);

module.exports = router;
