const fs = require('fs');
const path = require('path');
const { pool, withTransaction } = require('../config/db');
const m = require('../models/produkModel');
const { badRequest, conflict, notFound } = require('../utils/httpError');
const { teks, bulat, Pemeriksa } = require('../utils/validators');

const rupiah = (n) => 'Rp' + Number(n).toLocaleString('id-ID');
const aktif01 = (v, bawaan = 1) => {
  if (v === undefined || v === null || v === '') return bawaan;
  if (v === 1 || v === '1' || v === true || v === 'aktif') return 1;
  if (v === 0 || v === '0' || v === false || v === 'nonaktif') return 0;
  return NaN;
};

function periksaAroma(body) {
  const v = new Pemeriksa();
  const nama = teks(body.nama_aroma);
  const deskripsi = teks(body.deskripsi_aroma);
  const status = aktif01(body.status_aktif);
  if (!nama) v.tambah('nama_aroma', 'Nama aroma wajib diisi');
  else if (nama.length > 50) v.tambah('nama_aroma', 'Nama aroma maksimal 50 karakter');
  if (deskripsi.length > 255) v.tambah('deskripsi_aroma', 'Deskripsi aroma maksimal 255 karakter');
  if (Number.isNaN(status)) v.tambah('status_aktif', 'Status produk tidak valid');
  v.selesai();
  return { nama_aroma: nama, deskripsi_aroma: deskripsi, status_aktif: status };
}

/** Validasi satu varian ukuran. Pesan mengikuti SDD (5a dan 5b UC-03). */
function periksaVarian(b, prefiks = '') {
  const v = new Pemeriksa();
  const k = (n) => prefiks + n;
  const ukuran = bulat(b.ukuran_ml);
  const jual = bulat(b.harga_jual);
  const modal = bulat(b.harga_modal);
  const batas = b.batas_stok_minimal === undefined || b.batas_stok_minimal === '' ? 5 : bulat(b.batas_stok_minimal);
  const status = aktif01(b.status_aktif);
  if (Number.isNaN(ukuran) || ukuran <= 0 || ukuran > 1000) v.tambah(k('ukuran_ml'), 'Ukuran harus berupa angka lebih dari 0 (ml)');
  if (Number.isNaN(jual) || jual <= 0) v.tambah(k('harga_jual'), 'Harga jual harus lebih dari 0');
  if (Number.isNaN(modal) || modal < 0) v.tambah(k('harga_modal'), 'Harga modal tidak boleh negatif');
  if (Number.isNaN(batas) || batas < 0 || batas > 65535) v.tambah(k('batas_stok_minimal'), 'Stok minimum tidak valid');
  if (Number.isNaN(status)) v.tambah(k('status_aktif'), 'Status tidak valid');
  v.selesai();
  return { ukuran_ml: ukuran, harga_jual: jual, harga_modal: modal, batas_stok_minimal: batas, status_aktif: status };
}

/** KF-05: harga jual harus sama untuk ukuran yang sama pada semua aroma. */
async function pastikanHargaSeragam(conn, ukuran, harga, kecualiId = 0) {
  const lain = await m.hargaAromaLain(conn, ukuran, kecualiId);
  if (lain !== null && lain !== harga) {
    throw conflict(
      `Harga jual ukuran ${ukuran} ml harus ${rupiah(lain)} agar sama dengan aroma lain. Gunakan Ubah Harga Ukuran untuk mengubah semua aroma sekaligus`,
      { harga_jual: 'Harga tidak seragam untuk ukuran ini' }
    );
  }
}

async function daftar(q) {
  const ukuran = q.ukuran ? bulat(q.ukuran) : null;
  const [varian, ringkasan] = await Promise.all([
    m.daftarVarian({ cari: teks(q.cari), status: teks(q.status), ukuran: Number.isNaN(ukuran) ? null : ukuran }),
    m.ringkasanProduk(),
  ]);
  return { ringkasan, produk: varian };
}

async function detail(id) {
  const d = await m.detailAroma(id);
  if (!d) throw notFound('Aroma tidak ditemukan');
  return d;
}

/** UC-03: tambah aroma beserta varian ukurannya dalam satu transaksi. */
async function buatAroma(body) {
  const aroma = periksaAroma(body);
  const daftarVarian = Array.isArray(body.varian) ? body.varian : [];
  if (daftarVarian.length === 0) throw badRequest('Tambahkan minimal satu varian ukuran', { varian: 'Varian ukuran wajib diisi' });
  const varian = daftarVarian.map((x, i) => periksaVarian(x, `varian.${i}.`));
  const unik = new Set(varian.map((x) => x.ukuran_ml));
  if (unik.size !== varian.length) throw conflict('Ukuran tidak boleh kembar untuk aroma yang sama', { varian: 'Ukuran kembar' });

  return withTransaction(async (conn) => {
    if (await m.cariAromaByNama(conn, aroma.nama_aroma)) throw conflict('Aroma sudah terdaftar', { nama_aroma: 'Aroma sudah terdaftar' });
    for (const x of varian) await pastikanHargaSeragam(conn, x.ukuran_ml, x.harga_jual);
    const a = await m.buatAroma(conn, aroma);
    const hasil = [];
    for (const x of varian) hasil.push({ ukuran_ml: x.ukuran_ml, ...(await m.buatVarian(conn, a.id_aroma, x)) });
    // TODO Sprint 3 (KF-27): catat ke riwayat_perubahan lewat Modul Audit
    return { ...a, ...aroma, varian: hasil };
  });
}

async function ubahAroma(id, body) {
  const aroma = periksaAroma(body);
  return withTransaction(async (conn) => {
    if (!(await m.cariAroma(conn, id))) throw notFound('Aroma tidak ditemukan');
    if (await m.cariAromaByNama(conn, aroma.nama_aroma, id)) throw conflict('Aroma sudah terdaftar', { nama_aroma: 'Aroma sudah terdaftar' });
    await m.ubahAroma(conn, id, aroma);
    return { id_aroma: id, ...aroma };
  });
}

async function ubahStatusAroma(id, status) {
  const s = aktif01(status, NaN);
  if (Number.isNaN(s)) throw badRequest('Status tidak valid');
  return withTransaction(async (conn) => {
    if (!(await m.cariAroma(conn, id))) throw notFound('Aroma tidak ditemukan');
    await m.ubahStatusAroma(conn, id, s); // dinonaktifkan, tidak dihapus (D-12)
    return { id_aroma: id, status_aktif: s };
  });
}

/** Tambah Ukuran (5b UC-03: kombinasi aroma dan ukuran tidak boleh kembar). */
async function tambahVarian(id_aroma, body) {
  const v = periksaVarian(body);
  return withTransaction(async (conn) => {
    if (!(await m.cariAroma(conn, id_aroma))) throw notFound('Aroma tidak ditemukan');
    if (await m.cariVarianByUkuran(conn, id_aroma, v.ukuran_ml)) throw conflict('Ukuran sudah ada untuk aroma ini', { ukuran_ml: 'Ukuran sudah ada untuk aroma ini' });
    await pastikanHargaSeragam(conn, v.ukuran_ml, v.harga_jual);
    const hasil = await m.buatVarian(conn, id_aroma, v);
    return { ...hasil, ...v };
  });
}

/** Ubah harga atau batas stok varian. Ukuran tidak diubah (ganti dengan menambah ukuran baru). */
async function ubahVarian(id, body) {
  return withTransaction(async (conn) => {
    const lama = await m.cariProduk(conn, id);
    if (!lama) throw notFound('Produk tidak ditemukan');
    const v = periksaVarian({ ...body, ukuran_ml: lama.ukuran_ml, status_aktif: body.status_aktif ?? lama.status_aktif });
    await pastikanHargaSeragam(conn, lama.ukuran_ml, v.harga_jual, id);
    await m.ubahVarian(conn, id, v);
    return { id_produk: id, ...v }; // berlaku untuk pesanan baru, pesanan lama memakai salinan harga (D-08)
  });
}

async function ubahStatusProduk(id, status) {
  const s = aktif01(status, NaN);
  if (Number.isNaN(s)) throw badRequest('Status tidak valid');
  return withTransaction(async (conn) => {
    if (!(await m.cariProduk(conn, id))) throw notFound('Produk tidak ditemukan');
    await m.ubahStatusProduk(conn, id, s);
    return { id_produk: id, status_aktif: s };
  });
}

/** Mengubah harga jual satu ukuran untuk semua aroma sekaligus agar tetap seragam (KF-05). */
async function ubahHargaUkuran(body) {
  const ukuran = bulat(body.ukuran_ml);
  const harga = bulat(body.harga_jual);
  const v = new Pemeriksa();
  if (Number.isNaN(ukuran) || ukuran <= 0) v.tambah('ukuran_ml', 'Ukuran harus berupa angka lebih dari 0 (ml)');
  if (Number.isNaN(harga) || harga <= 0) v.tambah('harga_jual', 'Harga jual harus lebih dari 0');
  v.selesai();
  return withTransaction(async (conn) => {
    const n = await m.ubahHargaUkuran(conn, ukuran, harga);
    if (n === 0) throw notFound('Tidak ada produk dengan ukuran tersebut');
    return { ukuran_ml: ukuran, harga_jual: harga, produk_terubah: n };
  });
}

/** Foto: periksa isi berkas (bukan hanya tipe yang dikirim klien), lalu simpan jalurnya. */
async function simpanFoto(id, berkas) {
  if (!berkas) throw badRequest('Pilih berkas foto terlebih dahulu', { foto: 'Foto wajib dipilih' });
  const head = Buffer.alloc(8);
  const fd = fs.openSync(berkas.path, 'r'); fs.readSync(fd, head, 0, 8, 0); fs.closeSync(fd);
  const png = head.slice(0, 4).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47]));
  const jpg = head.slice(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]));
  if (!png && !jpg) {
    fs.unlinkSync(berkas.path);
    throw badRequest('Foto harus JPG atau PNG, maksimal 2 MB', { foto: 'Format foto tidak valid' });
  }
  const aroma = await m.cariAroma(pool, id);
  if (!aroma) { fs.unlinkSync(berkas.path); throw notFound('Aroma tidak ditemukan'); }
  const url = '/uploads/aroma/' + path.basename(berkas.path);
  await m.ubahFoto(pool, id, url);
  if (aroma.foto && aroma.foto.startsWith('/uploads/aroma/')) {
    const lama = path.join(__dirname, '..', '..', aroma.foto);
    fs.promises.unlink(lama).catch(() => {});
  }
  return { id_aroma: id, foto: url };
}

module.exports = { daftar, detail, buatAroma, ubahAroma, ubahStatusAroma, tambahVarian, ubahVarian, ubahStatusProduk, ubahHargaUkuran, simpanFoto };
