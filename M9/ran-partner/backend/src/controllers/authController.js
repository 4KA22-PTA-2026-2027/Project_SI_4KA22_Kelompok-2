const service = require('../services/authService');

exports.login = async (req, res) => {
  res.json(await service.login(req.body || {}));
};
// Token bersifat stateless: sesi diakhiri di klien dengan menghapus token (SDD 7, logout)
exports.logout = (_req, res) => res.json({ pesan: 'Anda telah keluar' });
exports.saya = (req, res) => res.json({ pengguna: req.pengguna });
