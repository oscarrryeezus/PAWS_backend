const axios = require("axios");

class Geolocalización {
    /**
     * Obtiene la Latitud y Longitud del usuario que realiza la petición del login
     * @return {object} - Localizacion, Precision, codigo de exito
     */

    static async obtenerGeolocalizacion() {
        try {
            // ? API Key desde .env
            const apiKey = process.env.GOOGLE_API_KEY;

            // ? Datos mínimos que Google necesita.
            // ? Puedes enriquecer esto con información real desde el cliente
            const body = {
                considerIp: true,
            };

            // ? Petición a la API de Google
            const response = await axios.post(
                `https://www.googleapis.com/geolocation/v1/geolocate?key=${apiKey}`,
                body
            );

            return {
                location: response.data.location,
                accuracy: response.data.accuracy,
                codigo: 0,
            };
        } catch (error) {
            console.error(error.response?.data || error.message);
            return {
                error: "Error al obtener la ubicación desde Google",
                codigo: 1
            };
        }
    }
}

module.exports = Geolocalización;