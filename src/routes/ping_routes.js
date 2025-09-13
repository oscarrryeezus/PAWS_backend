const express = require("express");
const router = express.Router();

/**
 * @swagger
 * /ping:
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
 *               example: "Que rollo pollo"
 */
router.get("/", (req, res) => {
  res.send("Que rollo pollo");
});

module.exports = router;
