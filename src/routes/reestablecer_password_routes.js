const express = require("express");
const router = express.Router();
const usuarioController = require("../controllers/usuario_controller");

/**
 * @swagger
 * components:
 *   schemas:
 *     RecuperarPassword:
 *       type: object
 *       required:
 *         - str_correo
 *       properties:
 *         str_correo:
 *           type: string
 *           format: email
 *           description: Correo electrónico del usuario registrado
 *           example: "juan@ejemplo.com"
 *
 *     RestablecerPassword:
 *       type: object
 *       required:
 *         - str_correo
 *         - token
 *         - nueva_pass
 *       properties:
 *         str_correo:
 *           type: string
 *           format: email
 *           description: Correo electrónico del usuario
 *           example: "juan@ejemplo.com"
 *         codigo:
 *           type: string
 *           description: Token temporal enviado al correo
 *           example: "870904"
 *         nueva_pass:
 *           type: string
 *           description: Nueva contraseña con validación de seguridad
 *           example: "NuevoPass123!"
 */

/**
 * @swagger
 * /restablecerPassword/solicitarRecuperarPassword:
 *   post:
 *     summary: Solicita restablecimiento de contraseña
 *     description: Envía un token temporal al correo del usuario registrado.
 *     tags: [Usuarios]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RecuperarPassword'
 *     responses:
 *       200:
 *         description: Token enviado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mensaje:
 *                   type: string
 *                   example: "Se ha enviado un correo con las instrucciones de recuperación"
 *       400:
 *         description: Error de validación
 *       404:
 *         description: Usuario no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.post("/solicitarRecuperarPassword", usuarioController.solicitarRecuperacionPassword);

/**
 * @swagger
 * /restablecerPassword/restablecerPassword:
 *   post:
 *     summary: Restablece la contraseña del usuario
 *     description: Permite cambiar la contraseña usando el token recibido en el correo.
 *     tags: [Usuarios]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RestablecerPassword'
 *     responses:
 *       200:
 *         description: Contraseña actualizada correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mensaje:
 *                   type: string
 *                   example: "Contraseña actualizada correctamente"
 *       400:
 *         description: Error de validación
 *       401:
 *         description: Token inválido o expirado
 *       404:
 *         description: Usuario no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.post("/restablecerPassword", usuarioController.restablecerPassword);

module.exports = router;
