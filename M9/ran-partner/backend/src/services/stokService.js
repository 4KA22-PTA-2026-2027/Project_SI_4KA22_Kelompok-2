const { withTransaction } = require('../config/db');
const m = require('../models/stokModel');
const { badRequest, notFound } = require('../utils/httpError');
const { teks, bulat, Pemeriksa } = require('../utils/validators');

const KONDISI = ['tersedia', 'menipis', 'habis'];

async function daftar(q) {
  const ukuran = q.ukuran ? bulat(q.ukuran) : null;
  const kondisi = KONDISI.includes(q.kondisi) ? q.kondisi : null;
  const [stok, ringkasan] = await Promise.all([
    m.daftarStok({ cari: teks(q.cari), ukuran: Number.isNaN(ukuran) ? null : ukuran, kondisi }),
    m.ringkasanStok(),
  ]);
  return { ringkasan, stok };
}

/**
 * UC-04 Tambah atau Kurangi Stok (KF-07, KNF-09).
 * Tambah menghasilkan mutasi 'masuk'. Kurangi menghasilkan mutasi 'koreksi' bernilai negatif.
 * Alasan wajib pada setiap perubahan (5b UC-04) dan stok tidak boleh negatif.
 */
async function ubah(body, pengguna) {
  const v = new Pemeriksa();
  const id = bulat(body.id_produk);
  const jumlah = bulat(body.jumlah);
  const alasan = teks(body.alasan);
  if (Number.isNaN(id) || id <= 0) v.tambah('id_produk', 'Pilih produk terlebih dahulu');
  if (body.arah !== 'tambah' && body.arah !== 'kurangi') v.tambah('arah', 'Pilih tambah atau kurangi stok');
  if (Number.isNaN(jumlah) || jumlah <= 0) v.tambah('jumlah', 'Jumlah harus lebih dari 0');
  if (!alasan) v.tambah('alasan', 'Alasan perubahan wajib diisi');
  else if (alasan.length > 255) v.tambah('alasan', 'Alasan maksimal 255 karakter');
  v.selesai();

  return withTransaction(async (conn) => {
    const p = await m.kunciProduk(conn, id);
    if (!p) throw notFound('Produk tidak ditemukan');
    if (p.status_aktif !== 1) throw badRequest('Produk nonaktif, aktifkan dulu sebelum mengubah stok', { id_produk: 'Produk nonaktif' });
    const sebelum = p.stok;
    const selisih = body.arah === 'tambah' ? jumlah : -jumlah;
    const sesudah = sebelum + selisih;
    if (sesudah < 0) {
      throw badRequest(`Stok tidak boleh negatif, stok saat ini ${sebelum} botol`, { jumlah: 'Stok tidak boleh negatif' });
    }
    await m.setStok(conn, id, sesudah);
    const id_mutasi = await m.tulisMutasi(conn, {
      id_produk: id, id_pengguna: pengguna.id,
      jenis: body.arah === 'tambah' ? 'masuk' : 'koreksi',
      jumlah: selisih, stok_sesudah: sesudah, alasan,
    });
    // TODO Sprint 3 (KF-27): catat ke riwayat_perubahan lewat Modul Audit
    return { id_mutasi, id_produk: id, stok_sebelum: sebelum, stok_sesudah: sesudah, selisih };
  });
}

async function riwayat(id_produk) {
  const id = bulat(id_produk);
  if (Number.isNaN(id)) throw badRequest('Produk tidak valid');
  return { mutasi: await m.riwayatMutasi(id) };
}

module.exports = { daftar, ubah, riwayat };
