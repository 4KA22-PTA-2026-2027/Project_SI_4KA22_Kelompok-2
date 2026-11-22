// Membuat basis data dan 11 tabel dari database/ran_partner_schema.sql
// Pemakaian: npm run db:init            (menolak bila tabel sudah ada)
//            npm run db:init -- --force (HAPUS dan buat ulang semua tabel, hanya untuk pengembangan)
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const env = require('../src/config/env');

async function inisialisasi({ force = false } = {}) {
  const sql = fs.readFileSync(path.join(__dirname, '..', '..', 'database', 'ran_partner_schema.sql'), 'utf8')
    .replace(/\bran_partnerrr\b/g, env.db.database);
  const conn = await mysql.createConnection({
    host: env.db.host, port: env.db.port, user: env.db.user, password: env.db.password, multipleStatements: true,
  });
  try {
    const [ada] = await conn.query(
      'SELECT COUNT(*) AS n FROM information_schema.tables WHERE table_schema = ?', [env.db.database]);
    if (ada[0].n > 0 && !force) {
      throw new Error(`Basis data "${env.db.database}" sudah berisi ${ada[0].n} tabel. Jalankan dengan --force bila memang ingin menghapus dan membuat ulang (SEMUA DATA HILANG).`);
    }
    await conn.query(sql);
    const [t] = await conn.query('SELECT COUNT(*) AS n FROM information_schema.tables WHERE table_schema = ?', [env.db.database]);
    return t[0].n;
  } finally {
    await conn.end();
  }
}

module.exports = { inisialisasi };

if (require.main === module) {
  inisialisasi({ force: process.argv.includes('--force') })
    .then((n) => console.log(`Selesai: basis data "${env.db.database}" memiliki ${n} tabel.`))
    .catch((e) => { console.error('Gagal:', e.message); process.exit(1); });
}
