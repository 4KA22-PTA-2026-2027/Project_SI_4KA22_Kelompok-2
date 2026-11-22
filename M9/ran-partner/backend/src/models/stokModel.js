const { pool } = require('../config/db');

/** Kondisi stok dihitung di SQL: habis bila 0, menipis bila 1 sampai batas minimum (SDD 5.4). */
const KONDISI_SQL = `CASE WHEN p.stok = 0 THEN 'habis' WHEN p.stok <= p.batas_stok_minimal THEN 'menipis' ELSE 'tersedia' END`;

async function daftarStok({ cari, ukuran, kondisi }) {
  const where = ['p.status_aktif = 1', 'a.status_aktif = 1']; const par = [];
  if (cari) { where.push('a.nama_aroma LIKE ?'); par.push(`%${cari}%`); }
  if (ukuran) { where.push('p.ukuran_ml = ?'); par.push(ukuran); }
  const [rows] = await pool.query(
    `SELECT p.id_produk, p.kode_produk, a.id_aroma, a.nama_aroma, a.foto, p.ukuran_ml,
            p.stok, p.batas_stok_minimal, ${KONDISI_SQL} AS kondisi
       FROM produk p JOIN aroma a ON a.id_aroma = p.id_aroma
      WHERE ${where.join(' AND ')}
      ORDER BY a.nama_aroma, p.ukuran_ml`,
    par
  );
  return kondisi ? rows.filter((r) => r.kondisi === kondisi) : rows;
}

async function ringkasanStok() {
  const [[r]] = await pool.query(
    `SELECT COALESCE(SUM(p.stok), 0) AS total_unit,
            COUNT(*) AS jumlah_varian,
            COUNT(DISTINCT a.id_aroma) AS jumlah_aroma,
            COALESCE(SUM(p.stok > 0 AND p.stok <= p.batas_stok_minimal), 0) AS menipis,
            COALESCE(SUM(p.stok = 0), 0) AS habis
       FROM produk p JOIN aroma a ON a.id_aroma = p.id_aroma
      WHERE p.status_aktif = 1 AND a.status_aktif = 1`
  );
  return {
    total_unit: Number(r.total_unit), jumlah_varian: Number(r.jumlah_varian), jumlah_aroma: Number(r.jumlah_aroma),
    menipis: Number(r.menipis), habis: Number(r.habis),
  };
}

/** Mengunci baris produk selama transaksi agar dua perubahan stok tidak saling menimpa. */
async function kunciProduk(conn, id) {
  const [rows] = await conn.query(
    `SELECT p.id_produk, p.stok, p.status_aktif, a.nama_aroma, p.ukuran_ml
       FROM produk p JOIN aroma a ON a.id_aroma = p.id_aroma WHERE p.id_produk = ? FOR UPDATE`, [id]);
  return rows[0] || null;
}
async function setStok(conn, id, stok) {
  await conn.query('UPDATE produk SET stok = ? WHERE id_produk = ?', [stok, id]);
}
async function tulisMutasi(conn, m) {
  const [r] = await conn.query(
    `INSERT INTO mutasi_stok (id_produk, no_pesanan, id_pengguna, jenis, jumlah, stok_sesudah, alasan)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [m.id_produk, m.no_pesanan || null, m.id_pengguna, m.jenis, m.jumlah, m.stok_sesudah, m.alasan]
  );
  return r.insertId;
}
async function riwayatMutasi(id_produk, batas = 50) {
  const [rows] = await pool.query(
    `SELECT m.id_mutasi, m.jenis, m.jumlah, m.stok_sesudah, m.tanggal, m.alasan, m.no_pesanan, u.nama AS pelaku
       FROM mutasi_stok m JOIN pengguna u ON u.id_pengguna = m.id_pengguna
      WHERE m.id_produk = ? ORDER BY m.id_mutasi DESC LIMIT ?`, [id_produk, batas]);
  return rows;
}

module.exports = { daftarStok, ringkasanStok, kunciProduk, setStok, tulisMutasi, riwayatMutasi };
