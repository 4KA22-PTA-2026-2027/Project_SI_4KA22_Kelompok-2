const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const env = require('../config/env');
const model = require('../models/penggunaModel');
const { unauthorized, forbidden, HttpError } = require('../utils/httpError');
const { teks, Pemeriksa } = require('../utils/validators');

// Hash pembanding agar waktu respons sama walau nama pengguna tidak ada
const HASH_PALSU = bcrypt.hashSync('tidak-dipakai', 10);

/**
 * UC-01 Masuk ke Sistem. Urutan mengikuti sequence diagram SDD Gambar 3.2.
 * portal: 'kasir' atau 'pemilik' (halaman login yang dipakai, D-19). Peran tetap ditentukan akun.
 */
async function login({ nama_pengguna, kata_sandi, portal }) {
  const v = new Pemeriksa();
  const nama = teks(nama_pengguna);
  if (!nama) v.tambah('nama_pengguna', 'Nama pengguna wajib diisi');
  if (!kata_sandi) v.tambah('kata_sandi', 'Kata sandi wajib diisi');
  v.selesai();

  const akun = await model.cariByNamaPengguna(nama);
  if (!akun) {
    await bcrypt.compare(String(kata_sandi), HASH_PALSU);
    throw unauthorized();
  }
  if (akun.status_aktif !== 1) throw forbidden('Akun dinonaktifkan, hubungi pemilik'); // 5b
  if (akun.terkunci) {
    throw new HttpError(429, `Terlalu banyak percobaan, coba lagi dalam ${akun.sisa_menit} menit`); // 5c
  }

  const cocok = await bcrypt.compare(String(kata_sandi), akun.kata_sandi_hash);
  if (!cocok) {
    await model.catatGagal(akun.id_pengguna, env.maxPercobaanGagal, env.menitTunda);
    throw unauthorized(); // 5a: pesan umum
  }
  // Halaman login Pemilik menolak akun Kasir dan sebaliknya, dengan pesan umum (D-19)
  if ((portal === 'pemilik' || portal === 'kasir') && portal !== akun.peran) throw unauthorized();

  await model.catatBerhasil(akun.id_pengguna);
  const token = jwt.sign({ sub: akun.id_pengguna, peran: akun.peran }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });
  return {
    token,
    pengguna: { id: akun.id_pengguna, nama: akun.nama, nama_pengguna: akun.nama_pengguna, peran: akun.peran },
  };
}

module.exports = { login };
