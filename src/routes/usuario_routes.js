const express = require("express");
const router = express.Router();
const usuarioController = require("../controllers/usuario_controller");

router.get("/", usuarioController.listarUsuarios);
router.get("/nuevo", usuarioController.formNuevoUsuario);
router.post("/nuevo", usuarioController.crearUsuario);

module.exports = router;
