process.env.NODE_ENV = 'test';
const bcrypt = require('bcryptjs');
const request = require('supertest');
const { inisialisasi } = require('../scripts/db-init');
const { pool } = require('../src/config/db');
const app = require('../src/app');

async function siapkanBasisData() {
  await inisialisasi({ force: true });
  const h = (p) => bcrypt.hashSync(p, 4);
  await pool.query(
    `INSERT INTO pengguna (nama, nama_pengguna, kata_sandi_hash, peran, status_aktif) VALUES
      ('Resta Apriyono','pemilik',?, 'pemilik',1),
      ('Dina Permata','kasir01',?, 'kasir',1),
      ('Kasir Lama','kasir03',?, 'kasir',0),
      ('Kasir Uji Kunci','kasir04',?, 'kasir',1)`,
    [h('Pemilik123'), h('Kasir123'), h('Kasir123'), h('Kasir123')]);
}

async function masuk(nama_pengguna, kata_sandi, portal) {
  const r = await request(app).post('/api/auth/login').send({ nama_pengguna, kata_sandi, portal });
  return r;
}
const tokenDari = async (u, p) => (await masuk(u, p)).body.token;
const api = (token) => ({
  get: (url) => request(app).get(url).set('Authorization', `Bearer ${token}`),
  post: (url, body) => request(app).post(url).set('Authorization', `Bearer ${token}`).send(body),
  put: (url, body) => request(app).put(url).set('Authorization', `Bearer ${token}`).send(body),
  patch: (url, body) => request(app).patch(url).set('Authorization', `Bearer ${token}`).send(body),
});
module.exports = { app, pool, request, siapkanBasisData, masuk, tokenDari, api };
