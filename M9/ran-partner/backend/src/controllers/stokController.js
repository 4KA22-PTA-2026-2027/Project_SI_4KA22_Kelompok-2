const s = require('../services/stokService');
exports.daftar = async (req, res) => res.json(await s.daftar(req.query));
exports.ubah = async (req, res) => res.json({ pesan: 'Stok berhasil diperbarui', ...(await s.ubah(req.body || {}, req.pengguna)) });
exports.riwayat = async (req, res) => res.json(await s.riwayat(req.params.id));
