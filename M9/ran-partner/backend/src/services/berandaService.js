const stok = require('../models/stokModel');
const produk = require('../models/produkModel');

/**
 * Beranda sesuai peran (UC-01). Pada Sprint 1 yang tersedia adalah ringkasan stok dan aroma.
 * Ringkasan penjualan dan pembayaran ditambahkan pada Sprint 2 dan 3.
 */
async function ringkasan(pengguna) {
  const [s, p] = await Promise.all([stok.ringkasanStok(), produk.ringkasanProduk()]);
  return { peran: pengguna.peran, stok: s, produk: p };
}
module.exports = { ringkasan };
