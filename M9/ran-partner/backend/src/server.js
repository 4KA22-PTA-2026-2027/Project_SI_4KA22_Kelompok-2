const env = require('./config/env');
const app = require('./app');
const { pool } = require('./config/db');

async function mulai() {
  try {
    await pool.query('SELECT 1');
  } catch (err) {
    console.error('Tidak dapat terhubung ke basis data:', err.message);
    console.error('Periksa DB_HOST, DB_USER, DB_PASSWORD, DB_NAME pada .env dan pastikan MySQL berjalan.');
    process.exit(1);
  }
  app.listen(env.port, () => console.log(`RAN Partner API berjalan di http://localhost:${env.port}`));
}
mulai();
