const router = require('express').Router();
const { wajibMasuk, wajibPeran } = require('../middleware/auth');
const { unggahFoto } = require('../middleware/upload');
const produk = require('../controllers/produkController');
const stok = require('../controllers/stokController');
const beranda = require('../controllers/berandaController');

const pemilik = wajibPeran('pemilik');
const semua = wajibPeran('pemilik', 'kasir'); // pemilik mewarisi hak kasir (D-20)

router.get('/health', (_req, res) => res.json({ status: 'ok' }));
router.use('/auth', require('./auth'));

// Semua endpoint di bawah ini wajib masuk (token JWT) dan dicek perannya
router.use(wajibMasuk);
router.get('/beranda', semua, beranda.beranda);

// UC-03 Kelola Produk dan Harga (pemilik)
router.get('/produk', pemilik, produk.daftar);
router.patch('/produk/harga-ukuran', pemilik, produk.hargaUkuran);
router.put('/produk/:id', pemilik, produk.ubahVarian);
router.patch('/produk/:id/status', pemilik, produk.statusProduk);
router.get('/aroma/:id', pemilik, produk.detailAroma);
router.post('/aroma', pemilik, produk.buatAroma);
router.put('/aroma/:id', pemilik, produk.ubahAroma);
router.patch('/aroma/:id/status', pemilik, produk.statusAroma);
router.post('/aroma/:id/varian', pemilik, produk.tambahVarian);
router.post('/aroma/:id/foto', pemilik, unggahFoto, produk.fotoAroma);

// UC-04 Kelola Stok (pemilik mengubah, kasir hanya melihat)
router.get('/stok', semua, stok.daftar);
router.post('/stok/ubah', pemilik, stok.ubah);
router.get('/stok/:id/mutasi', semua, stok.riwayat);

router.use((_req, res) => res.status(404).json({ pesan: 'Endpoint tidak ditemukan' }));
module.exports = router;
