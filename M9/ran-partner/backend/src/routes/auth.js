const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const c = require('../controllers/authController');
const { wajibMasuk } = require('../middleware/auth');
const env = require('../config/env');

// Lapisan tambahan di luar penundaan akun: batasi permintaan login per alamat IP
const batasLogin = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: env.isTest ? 10000 : 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { pesan: 'Terlalu banyak permintaan, coba lagi beberapa menit lagi' },
});

router.post('/login', batasLogin, c.login);
router.post('/logout', wajibMasuk, c.logout);
router.get('/saya', wajibMasuk, c.saya);
module.exports = router;
