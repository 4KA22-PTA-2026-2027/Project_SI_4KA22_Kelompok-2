const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { app, pool, request, siapkanBasisData, masuk, api, tokenDari } = require('./helpers');

before(siapkanBasisData);
after(() => pool.end());

test('UC-01: login benar menghasilkan token dan peran', async () => {
  const r = await masuk('pemilik', 'Pemilik123');
  assert.equal(r.status, 200);
  assert.ok(r.body.token);
  assert.equal(r.body.pengguna.peran, 'pemilik');
  assert.equal(r.body.pengguna.kata_sandi_hash, undefined, 'hash tidak boleh bocor');
});

test('UC-01 5a: kata sandi salah dan akun tidak ada memakai pesan umum yang sama', async () => {
  const salah = await masuk('pemilik', 'salah');
  const takAda = await masuk('tidak.ada', 'apa saja');
  assert.equal(salah.status, 401);
  assert.equal(takAda.status, 401);
  assert.equal(salah.body.pesan, 'Nama pengguna atau kata sandi salah');
  assert.equal(takAda.body.pesan, salah.body.pesan);
});

test('UC-01: data wajib kosong ditolak dengan pesan per kolom', async () => {
  const r = await masuk('', '');
  assert.equal(r.status, 400);
  assert.equal(r.body.galat.nama_pengguna, 'Nama pengguna wajib diisi');
  assert.equal(r.body.galat.kata_sandi, 'Kata sandi wajib diisi');
});

test('UC-01 5b: akun nonaktif ditolak', async () => {
  const r = await masuk('kasir03', 'Kasir123');
  assert.equal(r.status, 403);
  assert.equal(r.body.pesan, 'Akun dinonaktifkan, hubungi pemilik');
});

test('D-19: halaman login Pemilik menolak akun Kasir dan sebaliknya', async () => {
  assert.equal((await masuk('kasir01', 'Kasir123', 'pemilik')).status, 401);
  assert.equal((await masuk('pemilik', 'Pemilik123', 'kasir')).status, 401);
  assert.equal((await masuk('kasir01', 'Kasir123', 'kasir')).status, 200);
  assert.equal((await masuk('pemilik', 'Pemilik123', 'pemilik')).status, 200);
});

test('UC-01 5c / D-05: 5 kali gagal menunda login 5 menit, berhasil mereset', async () => {
  for (let i = 0; i < 5; i++) assert.equal((await masuk('kasir04', 'salah')).status, 401);
  const [[u]] = await pool.query('SELECT percobaan_gagal, terkunci_sampai FROM pengguna WHERE nama_pengguna = ?', ['kasir04']);
  assert.equal(u.percobaan_gagal, 5);
  assert.ok(u.terkunci_sampai, 'terkunci_sampai harus terisi');
  // walau kata sandi benar, login ditunda
  const tunda = await masuk('kasir04', 'Kasir123');
  assert.equal(tunda.status, 429);
  assert.match(tunda.body.pesan, /Terlalu banyak percobaan, coba lagi dalam [1-5] menit/);
  // simulasi waktu tunda habis
  await pool.query("UPDATE pengguna SET terkunci_sampai = DATE_SUB(NOW(), INTERVAL 1 MINUTE) WHERE nama_pengguna = 'kasir04'");
  const ok = await masuk('kasir04', 'Kasir123');
  assert.equal(ok.status, 200);
  const [[u2]] = await pool.query('SELECT percobaan_gagal, terkunci_sampai, terakhir_aktif FROM pengguna WHERE nama_pengguna = ?', ['kasir04']);
  assert.equal(u2.percobaan_gagal, 0);
  assert.equal(u2.terkunci_sampai, null);
  assert.ok(u2.terakhir_aktif);
});

test('KNF-02: endpoint dilindungi token, token palsu dan akun yang dinonaktifkan ditolak', async () => {
  assert.equal((await request(app).get('/api/beranda')).status, 401);
  assert.equal((await request(app).get('/api/beranda').set('Authorization', 'Bearer palsu')).status, 401);
  const token = await tokenDari('kasir01', 'Kasir123');
  assert.equal((await api(token).get('/api/beranda')).status, 200);
  await pool.query("UPDATE pengguna SET status_aktif = 0 WHERE nama_pengguna = 'kasir01'");
  assert.equal((await api(token).get('/api/beranda')).status, 401, 'token lama akun nonaktif harus ditolak');
  await pool.query("UPDATE pengguna SET status_aktif = 1 WHERE nama_pengguna = 'kasir01'");
});

test('KF-02: kasir tidak boleh mengelola produk dan stok, hanya melihat stok', async () => {
  const kasir = api(await tokenDari('kasir01', 'Kasir123'));
  assert.equal((await kasir.get('/api/produk')).status, 403);
  assert.equal((await kasir.post('/api/aroma', {})).status, 403);
  assert.equal((await kasir.post('/api/stok/ubah', {})).status, 403);
  assert.equal((await kasir.get('/api/stok')).status, 200);
});
