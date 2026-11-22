const jwt = require('jsonwebtoken');
const env = require('../config/env');
const { pool } = require('../config/db');
const { unauthorized, forbidden } = require('../utils/httpError');

/** Memeriksa token JWT, lalu memastikan akun masih ada dan aktif (KNF-02). */
async function wajibMasuk(req, _res, next) {
  const header = req.headers.authorization || '';
  const [skema, token] = header.split(' ');
  if (skema !== 'Bearer' || !token) throw unauthorized('Silakan masuk terlebih dahulu');
  let payload;
  try {
    payload = jwt.verify(token, env.jwtSecret);
  } catch {
    throw unauthorized('Sesi berakhir, silakan masuk kembali');
  }
  const [rows] = await pool.query(
    'SELECT id_pengguna, nama, nama_pengguna, peran, status_aktif FROM pengguna WHERE id_pengguna = ?',
    [payload.sub]
  );
  const akun = rows[0];
  if (!akun || akun.status_aktif !== 1) throw unauthorized('Sesi berakhir, silakan masuk kembali');
  req.pengguna = { id: akun.id_pengguna, nama: akun.nama, namaPengguna: akun.nama_pengguna, peran: akun.peran };
  next();
}

/** Pemeriksaan peran di backend pada setiap endpoint (SDD D-04). */
const wajibPeran = (...peran) => (req, _res, next) => {
  if (!req.pengguna || !peran.includes(req.pengguna.peran)) throw forbidden();
  next();
};

module.exports = { wajibMasuk, wajibPeran };
