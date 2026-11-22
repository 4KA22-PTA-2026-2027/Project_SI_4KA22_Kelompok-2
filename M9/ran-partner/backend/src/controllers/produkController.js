const s = require('../services/produkService');
const id = (req) => Number(req.params.id);

exports.daftar = async (req, res) => res.json(await s.daftar(req.query));
exports.detailAroma = async (req, res) => res.json(await s.detail(id(req)));
exports.buatAroma = async (req, res) => res.status(201).json({ pesan: 'Produk berhasil disimpan', ...(await s.buatAroma(req.body || {})) });
exports.ubahAroma = async (req, res) => res.json({ pesan: 'Produk berhasil disimpan', ...(await s.ubahAroma(id(req), req.body || {})) });
exports.statusAroma = async (req, res) => res.json({ pesan: 'Status aroma diperbarui', ...(await s.ubahStatusAroma(id(req), (req.body || {}).status_aktif)) });
exports.fotoAroma = async (req, res) => res.json({ pesan: 'Foto berhasil diunggah', ...(await s.simpanFoto(id(req), req.file)) });
exports.tambahVarian = async (req, res) => res.status(201).json({ pesan: 'Ukuran berhasil ditambahkan', ...(await s.tambahVarian(id(req), req.body || {})) });
exports.ubahVarian = async (req, res) => res.json({ pesan: 'Produk berhasil disimpan', ...(await s.ubahVarian(id(req), req.body || {})) });
exports.statusProduk = async (req, res) => res.json({ pesan: 'Status produk diperbarui', ...(await s.ubahStatusProduk(id(req), (req.body || {}).status_aktif)) });
exports.hargaUkuran = async (req, res) => res.json({ pesan: 'Harga ukuran diperbarui untuk semua aroma', ...(await s.ubahHargaUkuran(req.body || {})) });
