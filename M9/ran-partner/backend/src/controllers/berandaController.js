const s = require('../services/berandaService');
exports.beranda = async (req, res) => res.json(await s.ringkasan(req.pengguna));
