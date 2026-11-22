class HttpError extends Error {
  constructor(status, pesan, galat) {
    super(pesan);
    this.status = status;
    this.galat = galat; // objek { field: pesan } untuk galat validasi
  }
}
const badRequest = (pesan, galat) => new HttpError(400, pesan, galat);
const unauthorized = (pesan = 'Nama pengguna atau kata sandi salah') => new HttpError(401, pesan);
const forbidden = (pesan = 'Anda tidak memiliki akses ke fitur ini') => new HttpError(403, pesan);
const notFound = (pesan = 'Data tidak ditemukan') => new HttpError(404, pesan);
const conflict = (pesan, galat) => new HttpError(409, pesan, galat);
module.exports = { HttpError, badRequest, unauthorized, forbidden, notFound, conflict };
