const path = require('path');
const crypto = require('crypto');
const multer = require('multer');

const DIR = path.join(__dirname, '..', '..', 'uploads', 'aroma');
const EKSTENSI = { 'image/jpeg': '.jpg', 'image/png': '.png' };

const simpan = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, DIR),
  filename: (req, file, cb) => cb(null, `aroma-${req.params.id}-${crypto.randomBytes(6).toString('hex')}${EKSTENSI[file.mimetype]}`),
});

/** Foto JPG atau PNG maksimal 2 MB (SDD 5.4, tabel aroma). Isi berkas diperiksa lagi di service. */
const unggahFoto = multer({
  storage: simpan,
  limits: { fileSize: 2 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (!EKSTENSI[file.mimetype]) {
      const { badRequest } = require('../utils/httpError');
      return cb(badRequest('Foto harus JPG atau PNG, maksimal 2 MB', { foto: 'Format foto tidak valid' }));
    }
    cb(null, true);
  },
}).single('foto');

module.exports = { unggahFoto, DIR };
