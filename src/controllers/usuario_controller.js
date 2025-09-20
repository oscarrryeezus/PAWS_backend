const Usuario = require("../models/Usuario");

exports.listarUsuarios = async (req, res) => {
  try {
    const usuarios = await Usuario.listar();
    res.render("usuarios", { usuarios });
  } catch (err) {
    res.status(500).send("Error al listar usuarios");
  }
};

exports.formNuevoUsuario = (req, res) => {
  res.render("nuevoUsuario");
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

//Metodo para generar y asignar un PIN de un solo uso
const bcrypt = require("bcryptjs");
const Usuario = require("../models/Usuario");

exports.setOneTimePin = async (req, res) => {
  try {
    const { email, pin } = req.body;

    // 1. Buscar usuario
    const user = await Usuario.findOne({ email });
    if (!user) {
      return res.status(404).json({ msg: "Usuario no encontrado" });
    }

    // 2. Hashear el PIN antes de guardarlo
    const salt = await bcrypt.genSalt(10);
    const hashedPin = await bcrypt.hash(pin, salt);

    // 3. Guardar el PIN con fecha de vencimiento (30 días)
    user.oneTimePin = hashedPin;
    user.pinExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await user.save();

    res.json({ msg: "PIN configurado con éxito, válido por 30 días" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error del servidor" });
  }
};


