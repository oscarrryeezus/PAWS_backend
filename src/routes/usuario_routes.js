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
 *         bool_2FA:
 *           type: boolean
 *           description: Estado de autenticación de dos factores
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
 *           example: "mi_contraseña_segura"
 */

/**
 * @swagger
 * /usuarios/registrar:
 *   post:
 *     summary: Registra un nuevo usuario
 *     tags: [Usuarios]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegistroUsuario'
 *     responses:
 *       201:
 *         description: Usuario registrado exitosamente
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: "Usuario registrado exitosamente"
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
 *         description: Error interno del servidor
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: "Error al registrar usuario"
 */
router.post("/registrar", usuarioController.registrarUsuario);

module.exports = router;
