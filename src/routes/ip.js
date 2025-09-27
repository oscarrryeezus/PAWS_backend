const express = require("express");
const router = express.Router();
const ip = require('../controllers/geo_controller')

/**
 * @swagger
 * /obtenerIp:
 *   get:
 *     summary: Verifica que el servidor responde
 *     tags: [Sistema]
 *     responses:
 *       200:
 *         description: Servidor funcionando correctamente
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: "nigganigganigganigganigganigganigganigganigganigganigganigganigganigga"
 */
router.get("/", ip.test_geolocalizacion);

module.exports = router;