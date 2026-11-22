const { pool } = require('../config/db');

/** Mengambil akun beserta status penundaan login yang dihitung oleh basis data (menghindari beda zona waktu). */
async function cariByNamaPengguna(nama) {
  const [rows] = await pool.query(
    `SELECT id_pengguna, nama, nama_pengguna, kata_sandi_hash, peran, status_aktif, percobaan_gagal,
            (terkunci_sampai IS NOT NULL AND terkunci_sampai > NOW()) AS terkunci,
            GREATEST(1, CEIL(TIMESTAMPDIFF(SECOND, NOW(), terkunci_sampai) / 60)) AS sisa_menit
       FROM pengguna WHERE nama_pengguna = ?`,
    [nama]
  );
  return rows[0] || null;
}

/** percobaan_gagal naik 1 (maksimal 5). Setelah naik, bila sudah mencapai batas maka terkunci_sampai
 *  diisi sekarang + menit tunda. Dua langkah terpisah agar hasilnya tidak bergantung urutan evaluasi SET. */
async function catatGagal(id, batas, menitTunda) {
  await pool.query('UPDATE pengguna SET percobaan_gagal = LEAST(percobaan_gagal + 1, ?) WHERE id_pengguna = ?', [batas, id]);
  await pool.query(
    'UPDATE pengguna SET terkunci_sampai = DATE_ADD(NOW(), INTERVAL ? MINUTE) WHERE id_pengguna = ? AND percobaan_gagal >= ?',
    [menitTunda, id, batas]
  );
}

async function catatBerhasil(id) {
  await pool.query(
    'UPDATE pengguna SET percobaan_gagal = 0, terkunci_sampai = NULL, terakhir_aktif = NOW() WHERE id_pengguna = ?',
    [id]
  );
}

module.exports = { cariByNamaPengguna, catatGagal, catatBerhasil };
