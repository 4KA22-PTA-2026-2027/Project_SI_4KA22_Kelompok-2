const KUNCI_TOKEN = 'ran_token';

export const simpanToken = (t) => localStorage.setItem(KUNCI_TOKEN, t);
export const ambilToken = () => localStorage.getItem(KUNCI_TOKEN);
export const hapusToken = () => localStorage.removeItem(KUNCI_TOKEN);

let saatSesiBerakhir = () => {};
export const pasangPenangkapSesi = (fn) => { saatSesiBerakhir = fn; };

export class GalatApi extends Error {
  constructor(status, pesan, galat) { super(pesan); this.status = status; this.galat = galat || {}; }
}

async function panggil(metode, url, body, { form } = {}) {
  const headers = {};
  const token = ambilToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  let isi;
  if (form) isi = body;
  else if (body !== undefined) { headers['Content-Type'] = 'application/json'; isi = JSON.stringify(body); }
  let res;
  try {
    res = await fetch(url, { method: metode, headers, body: isi });
  } catch {
    throw new GalatApi(0, 'Koneksi gagal, isian tidak hilang, silakan coba lagi');
  }
  let data = {};
  try { data = await res.json(); } catch { /* respons tanpa isi */ }
  if (!res.ok) {
    if (res.status === 401 && token && !url.includes('/auth/login')) saatSesiBerakhir(data.pesan);
    throw new GalatApi(res.status, data.pesan || 'Terjadi kesalahan, silakan coba lagi', data.galat);
  }
  return data;
}

export const api = {
  get: (u) => panggil('GET', u),
  post: (u, b) => panggil('POST', u, b),
  put: (u, b) => panggil('PUT', u, b),
  patch: (u, b) => panggil('PATCH', u, b),
  unggah: (u, formData) => panggil('POST', u, formData, { form: true }),
};

export const qs = (obj) => {
  const p = new URLSearchParams();
  Object.entries(obj).forEach(([k, v]) => { if (v !== '' && v !== undefined && v !== null) p.set(k, v); });
  const s = p.toString();
  return s ? `?${s}` : '';
};
export const rupiah = (n) => 'Rp' + Number(n || 0).toLocaleString('id-ID');
export const angka = (n) => Number(n || 0).toLocaleString('id-ID');
