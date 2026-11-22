const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { pool, siapkanBasisData, api, tokenDari, request, app } = require('./helpers');

let owner, kasir;
const varian = (ukuran, jual = 85000, modal = 42000) => ({ ukuran_ml: ukuran, harga_jual: jual, harga_modal: modal, batas_stok_minimal: 5 });

before(async () => {
  await siapkanBasisData();
  owner = api(await tokenDari('pemilik', 'Pemilik123'));
  kasir = api(await tokenDari('kasir01', 'Kasir123'));
});
after(() => pool.end());

test('UC-03: tambah aroma dengan varian menghasilkan kode ARN dan PRD otomatis', async () => {
  const r = await owner.post('/api/aroma', { nama_aroma: 'Amber Noir', deskripsi_aroma: 'Woody, amber', varian: [varian(50), varian(30, 55000, 28000)] });
  assert.equal(r.status, 201);
  assert.equal(r.body.kode_aroma, 'ARN-001');
  assert.deepEqual(r.body.varian.map((v) => v.kode_produk), ['PRD-001', 'PRD-002']);
  const d = await owner.get(`/api/aroma/${r.body.id_aroma}`);
  assert.equal(d.body.varian.length, 2);
  assert.equal(d.body.varian[0].stok, 0, 'stok awal 0, diisi lewat menu Stok');
});

test('UC-03 validasi: nama wajib, harga > 0, modal tidak negatif, ukuran valid', async () => {
  let r = await owner.post('/api/aroma', { nama_aroma: '', varian: [varian(50)] });
  assert.equal(r.status, 400); assert.equal(r.body.galat.nama_aroma, 'Nama aroma wajib diisi');
  r = await owner.post('/api/aroma', { nama_aroma: 'Uji', varian: [{ ...varian(50), harga_jual: 0 }] });
  assert.equal(r.status, 400); assert.equal(r.body.pesan, 'Harga jual harus lebih dari 0');
  r = await owner.post('/api/aroma', { nama_aroma: 'Uji', varian: [{ ...varian(50), harga_modal: -1 }] });
  assert.equal(r.status, 400); assert.equal(r.body.pesan, 'Harga modal tidak boleh negatif');
  r = await owner.post('/api/aroma', { nama_aroma: 'Uji', varian: [] });
  assert.equal(r.status, 400);
  r = await owner.post('/api/aroma', { nama_aroma: 'Uji', varian: [varian(50), varian(50)] });
  assert.equal(r.status, 409);
});

test('UC-03 5b: nama aroma dan kombinasi aroma-ukuran tidak boleh kembar', async () => {
  let r = await owner.post('/api/aroma', { nama_aroma: 'Amber Noir', varian: [varian(50)] });
  assert.equal(r.status, 409); assert.equal(r.body.pesan, 'Aroma sudah terdaftar');
  r = await owner.post('/api/aroma/1/varian', varian(50));
  assert.equal(r.status, 409); assert.equal(r.body.pesan, 'Ukuran sudah ada untuk aroma ini');
  r = await owner.post('/api/aroma/1/varian', varian(100, 145000, 72000));
  assert.equal(r.status, 201); assert.equal(r.body.kode_produk, 'PRD-003');
});

test('KF-05: harga jual harus sama untuk ukuran yang sama pada semua aroma', async () => {
  let r = await owner.post('/api/aroma', { nama_aroma: 'Velvet Bloom', varian: [varian(50, 90000)] });
  assert.equal(r.status, 409);
  assert.match(r.body.pesan, /Harga jual ukuran 50 ml harus Rp85\.000/);
  r = await owner.post('/api/aroma', { nama_aroma: 'Velvet Bloom', varian: [varian(50, 85000)] });
  assert.equal(r.status, 201);
  // ubah harga satu varian saja ditolak, ubah massal diterima dan tetap seragam
  assert.equal((await owner.put('/api/produk/1', { harga_jual: 88000, harga_modal: 42000 })).status, 409);
  const massal = await owner.patch('/api/produk/harga-ukuran', { ukuran_ml: 50, harga_jual: 88000 });
  assert.equal(massal.status, 200); assert.equal(massal.body.produk_terubah, 2);
  const [rows] = await pool.query('SELECT DISTINCT harga_jual FROM produk WHERE ukuran_ml = 50');
  assert.equal(rows.length, 1); assert.equal(rows[0].harga_jual, 88000);
});

test('UC-03 3b: nonaktifkan produk (tidak dihapus) dan filter status pada daftar', async () => {
  const off = await owner.patch('/api/produk/2/status', { status_aktif: 0 });
  assert.equal(off.status, 200);
  const semua = await owner.get('/api/produk');
  assert.ok(semua.body.produk.find((p) => p.id_produk === 2), 'varian nonaktif tetap ada di basis data');
  const nonaktif = await owner.get('/api/produk?status=nonaktif');
  assert.deepEqual(nonaktif.body.produk.map((p) => p.id_produk), [2]);
  assert.equal(semua.body.ringkasan.produk_nonaktif, 1);
  await owner.patch('/api/produk/2/status', { status_aktif: 1 });
});

test('UC-03: foto aroma menolak berkas yang bukan gambar walau mengaku PNG', async () => {
  const palsu = await request(app).post('/api/aroma/1/foto').set('Authorization', 'Bearer ' + (await tokenDari('pemilik', 'Pemilik123')))
    .attach('foto', Buffer.from('ini bukan gambar'), { filename: 'x.png', contentType: 'image/png' });
  assert.equal(palsu.status, 400);
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
  const ok = await request(app).post('/api/aroma/1/foto').set('Authorization', 'Bearer ' + (await tokenDari('pemilik', 'Pemilik123')))
    .attach('foto', png, { filename: 'a.png', contentType: 'image/png' });
  assert.equal(ok.status, 200); assert.match(ok.body.foto, /^\/uploads\/aroma\/aroma-1-.+\.png$/);
  const bukanGambar = await request(app).post('/api/aroma/1/foto').set('Authorization', 'Bearer ' + (await tokenDari('pemilik', 'Pemilik123')))
    .attach('foto', Buffer.from('x'), { filename: 'x.txt', contentType: 'text/plain' });
  assert.equal(bukanGambar.status, 400);
});

test('UC-04: tambah stok mencatat mutasi masuk dengan stok_sesudah benar', async () => {
  const r = await owner.post('/api/stok/ubah', { id_produk: 1, arah: 'tambah', jumlah: 10, alasan: 'Stok masuk dari pengadaan supplier' });
  assert.equal(r.status, 200);
  assert.equal(r.body.stok_sebelum, 0); assert.equal(r.body.stok_sesudah, 10);
  const [[m]] = await pool.query('SELECT jenis, jumlah, stok_sesudah, alasan FROM mutasi_stok WHERE id_mutasi = ?', [r.body.id_mutasi]);
  assert.equal(m.jenis, 'masuk'); assert.equal(m.jumlah, 10); assert.equal(m.stok_sesudah, 10);
});

test('UC-04: kurangi stok menjadi koreksi bernilai negatif, tidak boleh membuat stok negatif (KNF-09)', async () => {
  const r = await owner.post('/api/stok/ubah', { id_produk: 1, arah: 'kurangi', jumlah: 3, alasan: 'Botol pecah' });
  assert.equal(r.status, 200); assert.equal(r.body.stok_sesudah, 7); assert.equal(r.body.selisih, -3);
  const [[m]] = await pool.query('SELECT jenis, jumlah FROM mutasi_stok WHERE id_mutasi = ?', [r.body.id_mutasi]);
  assert.equal(m.jenis, 'koreksi'); assert.equal(m.jumlah, -3);
  const lebih = await owner.post('/api/stok/ubah', { id_produk: 1, arah: 'kurangi', jumlah: 8, alasan: 'Salah hitung' });
  assert.equal(lebih.status, 400); assert.match(lebih.body.pesan, /Stok tidak boleh negatif/);
  const [[p]] = await pool.query('SELECT stok FROM produk WHERE id_produk = 1');
  assert.equal(p.stok, 7, 'stok tidak berubah saat permintaan ditolak');
  const [[n]] = await pool.query('SELECT COUNT(*) AS n FROM mutasi_stok WHERE id_produk = 1');
  assert.equal(n.n, 2, 'tidak ada mutasi untuk permintaan yang ditolak');
});

test('UC-04 validasi: jumlah > 0, alasan wajib, arah dipilih', async () => {
  let r = await owner.post('/api/stok/ubah', { id_produk: 1, arah: 'tambah', jumlah: 0, alasan: 'x' });
  assert.equal(r.body.galat.jumlah, 'Jumlah harus lebih dari 0');
  r = await owner.post('/api/stok/ubah', { id_produk: 1, arah: 'tambah', jumlah: 5, alasan: '  ' });
  assert.equal(r.body.galat.alasan, 'Alasan perubahan wajib diisi');
  r = await owner.post('/api/stok/ubah', { id_produk: 1, jumlah: 5, alasan: 'x' });
  assert.equal(r.status, 400);
  r = await owner.post('/api/stok/ubah', { id_produk: 999, arah: 'tambah', jumlah: 5, alasan: 'x' });
  assert.equal(r.status, 404);
});

test('KNF-09: dua perubahan stok bersamaan tidak saling menimpa', async () => {
  const hasil = await Promise.all(Array.from({ length: 10 }, () =>
    owner.post('/api/stok/ubah', { id_produk: 3, arah: 'tambah', jumlah: 1, alasan: 'uji paralel' })));
  assert.ok(hasil.every((h) => h.status === 200));
  const [[p]] = await pool.query('SELECT stok FROM produk WHERE id_produk = 3');
  assert.equal(p.stok, 10);
  const [[s]] = await pool.query('SELECT SUM(jumlah) AS total FROM mutasi_stok WHERE id_produk = 3');
  assert.equal(Number(s.total), 10, 'stok sama dengan jumlah seluruh mutasi');
});

test('KF-06: kondisi stok (batas 5): 0 habis, 4 dan 5 menipis, 6 tersedia', async () => {
  const set = async (id, stok) => pool.query('UPDATE produk SET stok = ?, batas_stok_minimal = 5 WHERE id_produk = ?', [stok, id]);
  await set(1, 0); await set(2, 4); await set(3, 5); await set(4, 6);
  const r = await kasir.get('/api/stok');
  assert.equal(r.status, 200);
  const k = Object.fromEntries(r.body.stok.map((s) => [s.id_produk, s.kondisi]));
  assert.deepEqual([k[1], k[2], k[3], k[4]], ['habis', 'menipis', 'menipis', 'tersedia']);
  assert.equal(r.body.ringkasan.habis, 1); assert.equal(r.body.ringkasan.menipis, 2);
  assert.equal(r.body.ringkasan.total_unit, 15);
  const f = await kasir.get('/api/stok?kondisi=menipis');
  assert.deepEqual(f.body.stok.map((s) => s.id_produk), [2, 3]);
});

test('Stok: riwayat mutasi dapat dilihat dan beranda memuat ringkasan', async () => {
  const m = await kasir.get('/api/stok/1/mutasi');
  assert.equal(m.status, 200); assert.ok(m.body.mutasi.length >= 2);
  const b = await kasir.get('/api/beranda');
  assert.equal(b.body.peran, 'kasir'); assert.ok('stok' in b.body);
});
