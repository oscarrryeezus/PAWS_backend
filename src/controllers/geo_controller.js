const axios = require("axios");
const Usuario = require("../models/Usuario");

exports.test_geolocalizacion = async (req, res) => {
    Usuario.actualizarSesion('false', 'sillymoser6@ysosirius.com')
    return res.status(200).json({mensaje: "LISTOOO"})
};