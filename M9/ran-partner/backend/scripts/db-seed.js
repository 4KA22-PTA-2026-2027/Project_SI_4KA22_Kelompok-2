// Mengisi data awal: akun pemilik dan kasir. Tambahkan --contoh untuk aroma, produk, dan stok CONTOH.
// Data contoh hanya untuk pengembangan. Ganti dengan daftar aroma dan harga asli dari klien.
const bcrypt = require('bcryptjs');
const env = require('../src/config/env');
const { pool, withTransaction } = require('../src/config/db');
const produk = require('../src/models/produkModel');

async function buatAkun(conn, { nama, nama_pengguna, kata_sandi, peran }) {
  const [ada] = await conn.query('SELECT id_pengguna FROM pengguna WHERE nama_pengguna = ?', [nama_pengguna]);
  if (ada[0]) return { id: ada[0].id_pengguna, baru: false };
  const hash = await bcrypt.hash(kata_sandi, 10);
  const [r] = await conn.query(
    'INSERT INTO pengguna (nama, nama_pengguna, kata_sandi_hash, peran, status_aktif) VALUES (?, ?, ?, ?, 1)',
    [nama, nama_pengguna, hash, peran]);
  return { id: r.insertId, baru: true };
}

async function seedAkun(opsi = {}) {
  const o = {
    pemilik: { nama: 'Resta Apriyono', nama_pengguna: process.env.SEED_OWNER_USER || 'pemilik', kata_sandi: process.env.SEED_OWNER_PASS || 'Ganti123', peran: 'pemilik' },
    kasir: { nama: 'Kasir Utama', nama_pengguna: process.env.SEED_KASIR_USER || 'kasir01', kata_sandi: process.env.SEED_KASIR_PASS || 'Ganti123', peran: 'kasir' },
    ...opsi,
  };
  return withTransaction(async (conn) => ({ pemilik: await buatAkun(conn, o.pemilik), kasir: await buatAkun(conn, o.kasir) }));
}

const CONTOH = [
  { nama: 'Amber Noir', desk: 'Woody, amber, hangat', stok: { 30: 42, 50: 8 } },
  { nama: 'Velvet Bloom', desk: 'Floral, powdery, lembut', stok: { 30: 4, 50: 12 } },
  { nama: 'Ocean Mist', desk: 'Fresh, aquatic, bersih', stok: { 30: 20, 50: 0 } },
  { nama: 'Midnight Oud', desk: 'Oud, spicy, intens', stok: { 30: 15, 50: 9 } },
];
const HARGA = { 30: [55000, 28000], 50: [85000, 42000] }; // [jual, modal], CONTOH

async function seedContoh(idPemilik) {
  return withTransaction(async (conn) => {
    let dibuat = 0;
    for (const c of CONTOH) {
      if (await produk.cariAromaByNama(conn, c.nama)) continue;
      const a = await produk.buatAroma(conn, { nama_aroma: c.nama, deskripsi_aroma: c.desk, status_aktif: 1 });
      for (const [uk, stok] of Object.entries(c.stok)) {
        const v = await produk.buatVarian(conn, a.id_aroma, { ukuran_ml: Number(uk), harga_jual: HARGA[uk][0], harga_modal: HARGA[uk][1], batas_stok_minimal: 5, status_aktif: 1 });
        if (stok > 0) {
          await conn.query('UPDATE produk SET stok = ? WHERE id_produk = ?', [stok, v.id_produk]);
          await conn.query(
            `INSERT INTO mutasi_stok (id_produk, id_pengguna, jenis, jumlah, stok_sesudah, alasan) VALUES (?, ?, 'masuk', ?, ?, 'Stok awal (data contoh)')`,
            [v.id_produk, idPemilik, stok, stok]);
        }
      }
      dibuat++;
    }
    return dibuat;
  });
}

module.exports = { seedAkun, seedContoh };

if (require.main === module) {
  (async () => {
    const a = await seedAkun();
    console.log(`Akun pemilik: ${a.pemilik.baru ? 'dibuat' : 'sudah ada'}, akun kasir: ${a.kasir.baru ? 'dibuat' : 'sudah ada'}`);
    if (process.argv.includes('--contoh')) console.log(`Aroma contoh dibuat: ${await seedContoh(a.pemilik.id)}`);
    if (env.nodeEnv === 'production') console.warn('PERINGATAN: ganti kata sandi bawaan segera.');
    await pool.end();
  })().catch((e) => { console.error('Gagal:', e.message); process.exit(1); });
}
