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
 *     summary: Inicia sesión en el sistema
 *     description: Valida correo y contraseña contra la base de datos. Si son correctos, genera un token JWT.
 *     tags: [Usuarios]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginUsuario'
 *     responses:
 *       200:
 *         description: Inicio de sesión exitoso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mensaje:
 *                   type: string
 *                   example: "Inicio de sesión exitoso"
 *                 token:
 *                   type: string
 *                   description: Token JWT válido por 2 horas
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
 *                     rol:
 *                       type: integer
 *                       example: 1
 *                     otp_habilitado:
 *                       type: boolean
 *                       example: true
 *                     ultimo_acceso:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-09-17T15:30:00Z"
 *       400:
 *         description: Error de validación en correo o contraseña
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Correo o contraseña incorrectos"
 *       403:
 *         description: Cuenta inactiva
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "La cuenta no está activa. Verifica tu correo y OTP."
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Error interno al iniciar sesión"
 */
router.post("/", usuarioController.login);

module.exports = router;
