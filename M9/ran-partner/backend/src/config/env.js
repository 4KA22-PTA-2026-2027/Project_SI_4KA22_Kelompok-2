const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env'), quiet: true });

const isTest = process.env.NODE_ENV === 'test';

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  isTest,
  port: Number(process.env.PORT || 5000),
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    // Pengujian otomatis memakai basis data terpisah agar data asli aman
    database: isTest ? (process.env.DB_NAME_TEST || 'ran_partner_test') : (process.env.DB_NAME || 'ran_partnerrr'),
  },
  jwtSecret: process.env.JWT_SECRET || '',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '30m',
  appBaseUrl: process.env.APP_BASE_URL || 'http://localhost:5173',
  // Aturan penundaan login (SDD D-05)
  maxPercobaanGagal: 5,
  menitTunda: 5,
};

if (!env.jwtSecret || env.jwtSecret.length < 16) {
  if (isTest) env.jwtSecret = 'rahasia-khusus-pengujian-otomatis';
  else {
    console.error('JWT_SECRET belum diisi atau terlalu pendek. Isi pada berkas .env (lihat .env.example).');
    process.exit(1);
  }
}
module.exports = env;
