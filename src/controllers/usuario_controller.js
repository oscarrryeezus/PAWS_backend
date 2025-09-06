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
