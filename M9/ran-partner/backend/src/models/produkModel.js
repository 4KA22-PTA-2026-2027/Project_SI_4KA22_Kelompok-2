const crypto = require('crypto');
const { pool } = require('../config/db');

const pad = (n, p) => String(n).padStart(p, '0');

/* ---------------- aroma ---------------- */
async function buatAroma(conn, { nama_aroma, deskripsi_aroma, status_aktif }) {
  // Kode sementara agar kolom UNIQUE terpenuhi, lalu diganti ARN-nnn dari id (D-15)
  const sementara = 'TMP-' + crypto.randomBytes(3).toString('hex');
  const [r] = await conn.query(
    'INSERT INTO aroma (kode_aroma, nama_aroma, deskripsi_aroma, status_aktif) VALUES (?, ?, ?, ?)',
    [sementara, nama_aroma, deskripsi_aroma || null, status_aktif]
  );
  const kode = 'ARN-' + pad(r.insertId, 3);
  await conn.query('UPDATE aroma SET kode_aroma = ? WHERE id_aroma = ?', [kode, r.insertId]);
  return { id_aroma: r.insertId, kode_aroma: kode };
}

async function cariAroma(conn, id) {
  const [rows] = await conn.query('SELECT * FROM aroma WHERE id_aroma = ?', [id]);
  return rows[0] || null;
}
async function cariAromaByNama(conn, nama, kecualiId = 0) {
  const [rows] = await conn.query('SELECT id_aroma FROM aroma WHERE nama_aroma = ? AND id_aroma <> ?', [nama, kecualiId]);
  return rows[0] || null;
}
async function ubahAroma(conn, id, { nama_aroma, deskripsi_aroma, status_aktif }) {
  await conn.query(
    'UPDATE aroma SET nama_aroma = ?, deskripsi_aroma = ?, status_aktif = ? WHERE id_aroma = ?',
    [nama_aroma, deskripsi_aroma || null, status_aktif, id]
  );
}
async function ubahStatusAroma(conn, id, status) {
  await conn.query('UPDATE aroma SET status_aktif = ? WHERE id_aroma = ?', [status, id]);
}
async function ubahFoto(conn, id, foto) {
  await conn.query('UPDATE aroma SET foto = ? WHERE id_aroma = ?', [foto, id]);
}

/* ---------------- produk (varian ukuran) ---------------- */
async function buatVarian(conn, id_aroma, v) {
  const sementara = 'TMP-' + crypto.randomBytes(4).toString('hex');
  const [r] = await conn.query(
    `INSERT INTO produk (kode_produk, id_aroma, ukuran_ml, harga_jual, harga_modal, stok, batas_stok_minimal, status_aktif)
     VALUES (?, ?, ?, ?, ?, 0, ?, ?)`,
    [sementara, id_aroma, v.ukuran_ml, v.harga_jual, v.harga_modal, v.batas_stok_minimal, v.status_aktif]
  );
  const kode = 'PRD-' + pad(r.insertId, 3);
  await conn.query('UPDATE produk SET kode_produk = ? WHERE id_produk = ?', [kode, r.insertId]);
  return { id_produk: r.insertId, kode_produk: kode };
}
async function cariProduk(conn, id) {
  const [rows] = await conn.query('SELECT * FROM produk WHERE id_produk = ?', [id]);
  return rows[0] || null;
}
async function cariVarianByUkuran(conn, id_aroma, ukuran_ml, kecualiId = 0) {
  const [rows] = await conn.query(
    'SELECT id_produk FROM produk WHERE id_aroma = ? AND ukuran_ml = ? AND id_produk <> ?',
    [id_aroma, ukuran_ml, kecualiId]
  );
  return rows[0] || null;
}
/** Harga jual aktif milik aroma lain pada ukuran yang sama (untuk KF-05). */
async function hargaAromaLain(conn, ukuran_ml, kecualiId = 0) {
  const [rows] = await conn.query(
    `SELECT DISTINCT p.harga_jual FROM produk p
      WHERE p.ukuran_ml = ? AND p.id_produk <> ? AND p.status_aktif = 1 LIMIT 1`,
    [ukuran_ml, kecualiId]
  );
  return rows[0] ? rows[0].harga_jual : null;
}
async function ubahVarian(conn, id, v) {
  await conn.query(
    'UPDATE produk SET harga_jual = ?, harga_modal = ?, batas_stok_minimal = ?, status_aktif = ? WHERE id_produk = ?',
    [v.harga_jual, v.harga_modal, v.batas_stok_minimal, v.status_aktif, id]
  );
}
async function ubahStatusProduk(conn, id, status) {
  await conn.query('UPDATE produk SET status_aktif = ? WHERE id_produk = ?', [status, id]);
}
async function ubahHargaUkuran(conn, ukuran_ml, harga_jual) {
  const [r] = await conn.query('UPDATE produk SET harga_jual = ? WHERE ukuran_ml = ?', [harga_jual, ukuran_ml]);
  return r.affectedRows;
}

/* ---------------- kueri tampilan ---------------- */
async function daftarVarian({ cari, status, ukuran }) {
  const where = []; const par = [];
  if (cari) { where.push('(a.nama_aroma LIKE ? OR a.kode_aroma LIKE ? OR p.kode_produk LIKE ?)'); par.push(`%${cari}%`, `%${cari}%`, `%${cari}%`); }
  if (status === 'aktif') where.push('(p.status_aktif = 1 AND a.status_aktif = 1)');
  if (status === 'nonaktif') where.push('(p.status_aktif = 0 OR a.status_aktif = 0)');
  if (ukuran) { where.push('p.ukuran_ml = ?'); par.push(ukuran); }
  const [rows] = await pool.query(
    `SELECT p.id_produk, p.kode_produk, a.id_aroma, a.kode_aroma, a.nama_aroma, a.deskripsi_aroma, a.foto,
            p.ukuran_ml, p.harga_jual, p.harga_modal, p.stok, p.batas_stok_minimal,
            p.status_aktif AS varian_aktif, a.status_aktif AS aroma_aktif,
            (p.status_aktif = 1 AND a.status_aktif = 1) AS aktif
       FROM produk p JOIN aroma a ON a.id_aroma = p.id_aroma
       ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
      ORDER BY a.nama_aroma, p.ukuran_ml`,
    par
  );
  return rows.map((r) => ({ ...r, aktif: Number(r.aktif) === 1 }));
}

async function ringkasanProduk() {
  const [[a]] = await pool.query('SELECT COUNT(*) AS jenis_aroma FROM aroma');
  const [[u]] = await pool.query(
    `SELECT COUNT(DISTINCT p.ukuran_ml) AS varian_ukuran FROM produk p JOIN aroma a ON a.id_aroma = p.id_aroma
      WHERE p.status_aktif = 1 AND a.status_aktif = 1`
  );
  const [[n]] = await pool.query(
    `SELECT COUNT(*) AS produk_nonaktif FROM produk p JOIN aroma a ON a.id_aroma = p.id_aroma
      WHERE p.status_aktif = 0 OR a.status_aktif = 0`
  );
  return { jenis_aroma: a.jenis_aroma, varian_ukuran: u.varian_ukuran, produk_nonaktif: n.produk_nonaktif };
}

async function detailAroma(id) {
  const aroma = await cariAroma(pool, id);
  if (!aroma) return null;
  const [varian] = await pool.query(
    `SELECT id_produk, kode_produk, ukuran_ml, harga_jual, harga_modal, stok, batas_stok_minimal, status_aktif
       FROM produk WHERE id_aroma = ? ORDER BY ukuran_ml`, [id]);
  return { ...aroma, varian };
}

module.exports = {
  buatAroma, cariAroma, cariAromaByNama, ubahAroma, ubahStatusAroma, ubahFoto,
  buatVarian, cariProduk, cariVarianByUkuran, hargaAromaLain, ubahVarian, ubahStatusProduk, ubahHargaUkuran,
  daftarVarian, ringkasanProduk, detailAroma,
};
