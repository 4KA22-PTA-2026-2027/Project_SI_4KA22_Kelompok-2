const { badRequest } = require('./httpError');

const teks = (v) => (typeof v === 'string' ? v.trim() : '');
const bulat = (v) => {
  if (typeof v === 'number' && Number.isInteger(v)) return v;
  if (typeof v === 'string' && /^-?\d+$/.test(v.trim())) return Number(v.trim());
  return NaN;
};

/** Mengumpulkan galat per kolom lalu melempar satu HttpError 400. */
class Pemeriksa {
  constructor() { this.galat = {}; }
  tambah(kolom, pesan) { if (!this.galat[kolom]) this.galat[kolom] = pesan; }
  selesai() {
    const kunci = Object.keys(this.galat);
    if (kunci.length) throw badRequest(this.galat[kunci[0]], this.galat);
  }
}

const NAMA_PENGGUNA_RE = /^[A-Za-z0-9._-]{4,20}$/;
const UKURAN_UMUM_ML = [3, 8, 15, 20, 30, 50, 100];

module.exports = { teks, bulat, Pemeriksa, NAMA_PENGGUNA_RE, UKURAN_UMUM_ML };
