const geoip = require('geoip-lite');

exports.test_geolocalizacion = async (req, res) => {
    try {
        const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress;
        const geo = geoip.lookup(ip);
        return res.status(200).json({
            ip,
            geo, 
            codigo: 0
        })
    } catch (error) {
        return res.status(404).json({
            error: "este show no jala jaja"
        })
    }
}