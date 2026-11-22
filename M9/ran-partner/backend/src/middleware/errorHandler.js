const { HttpError } = require('../utils/httpError');

// eslint-disable-next-line no-unused-vars
function errorHandler(err, _req, res, _next) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ pesan: err.message, galat: err.galat });
  }
  if (err && err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ pesan: 'Foto harus JPG atau PNG, maksimal 2 MB', galat: { foto: 'Foto terlalu besar' } });
  }
  if (err && err.type === 'entity.parse.failed') {
    return res.status(400).json({ pesan: 'Format data tidak valid' });
  }
  if (err && err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({ pesan: 'Data sudah ada (duplikat)' });
  }
  console.error('[galat tak terduga]', err);
  res.status(500).json({ pesan: 'Terjadi kesalahan pada server, silakan coba lagi' });
}
module.exports = errorHandler;
