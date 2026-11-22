# RAN Partner, Sprint 1

Website Penjualan dan Pembukuan RAN Partner. Sprint 1 (Minggu 9) sesuai SDD v1.2 Bagian 10.2:
**UC-01 Masuk ke Sistem, UC-03 Kelola Produk dan Harga, UC-04 Kelola Stok**
(KF-01, KF-02, KF-04 sampai KF-07, serta KNF-02, KNF-05, KNF-08, KNF-09).

Teknologi: React (Vite) + Node.js Express + MySQL 8 (JWT, bcrypt, query berparameter).

## 1. Persiapan lingkungan (sekali saja)

| Alat | Versi | Cek |
|---|---|---|
| Node.js | LTS (diuji pada 22) | `node -v` |
| MySQL | 8.x (diuji pada MariaDB 10.11, kompatibel) | `mysql --version` |
| Git | terbaru | `git --version` |

1. Buat basis data dan pengguna khusus aplikasi (jangan memakai root):
   ```sql
   CREATE DATABASE ran_partner CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   CREATE USER 'ran_app'@'localhost' IDENTIFIED BY 'kata_sandi_kuat';
   GRANT SELECT, INSERT, UPDATE, DELETE ON ran_partner.* TO 'ran_app'@'localhost';
   ```
   Untuk menjalankan `db:init` dan pengujian otomatis, akun yang dipakai juga perlu hak `CREATE`, `DROP`, `INDEX`, `REFERENCES`
   (pakai akun pengembangan, bukan akun aplikasi produksi).
2. Backend:
   ```bash
   cd backend
   cp .env.example .env        # isi DB_USER, DB_PASSWORD, JWT_SECRET
   npm install
   npm run db:init             # membuat 11 tabel (menolak bila tabel sudah ada)
   npm run db:seed -- --contoh # akun pemilik + kasir + 4 aroma CONTOH (hapus --contoh untuk akun saja)
   npm run dev                 # API di http://localhost:5000
   ```
3. Frontend (terminal lain):
   ```bash
   cd frontend
   npm install
   npm run dev                 # http://localhost:5173 (proxy /api ke port 5000)
   ```
4. Masuk dengan akun dari `.env` (`SEED_OWNER_USER` / `SEED_KASIR_USER`, bawaan `pemilik` dan `kasir01`, kata sandi `Ganti123`).
   Halaman Pemilik: `/login-pemilik`. Halaman Kasir: `/login`.

## 2. Pengujian

```bash
cd backend && npm test   # 20 pengujian otomatis, memakai basis data terpisah ran_partner_test
```
Pengujian membuat ulang `ran_partner_test` setiap kali dijalankan dan tidak menyentuh data `ran_partner`.
Cakupan: login, pesan umum, penundaan 5 kali gagal, akun nonaktif, pemisahan halaman login, hak akses per peran,
validasi produk, harga seragam (KF-05), foto palsu ditolak, mutasi stok, stok tidak negatif, perubahan stok bersamaan.

## 3. Produksi (Hostinger)

```bash
cd frontend && npm run build
cp -r dist ../backend/public    # backend menyajikan frontend dari folder public
cd ../backend && npm install --omit=dev && NODE_ENV=production node src/server.js
```
Pastikan paket hosting mendukung Node.js dan MySQL (risiko R-08), HTTPS aktif, `JWT_SECRET` unik, dan kata sandi bawaan diganti.

## 4. Ketertelusuran Sprint 1

| Kebutuhan | Endpoint | Layar | Pengujian |
|---|---|---|---|
| KF-01 Login | `POST /api/auth/login`, `/logout`, `GET /api/auth/saya` | L-01 | `auth.test.js` |
| KF-02 Hak akses | middleware `wajibMasuk`, `wajibPeran` | menu per peran | `auth.test.js` |
| KF-04 Kelola produk | `GET /api/produk`, `POST/PUT /api/aroma`, `PUT /api/produk/:id`, status, foto | L-05, L-06 | `produk-stok.test.js` |
| KF-05 Harga seragam | validasi di `produkService`, `PATCH /api/produk/harga-ukuran` | L-05, L-06 | `produk-stok.test.js` |
| KF-06 Lihat stok, menipis atau habis | `GET /api/stok`, `GET /api/beranda` | L-02, L-07 | `produk-stok.test.js` |
| KF-07 Tambah dan koreksi stok | `POST /api/stok/ubah`, `GET /api/stok/:id/mutasi` | L-08 | `produk-stok.test.js` |
| KNF-02 Keamanan | bcrypt, JWT 30 menit, helmet, batas login, upload tervalidasi | semua | `auth.test.js` |
| KNF-09 Integritas stok | transaksi + `SELECT ... FOR UPDATE`, CHECK, tabel `mutasi_stok` | L-07, L-08 | `produk-stok.test.js` |

Belum dikerjakan (sesuai rencana): KF-03 kelola akun (Sprint 3), KF-27 audit (Sprint 3, titik sambung diberi `TODO`),
Katalog dan Transaksi (Sprint 2).

## 5. Keputusan teknis dan catatan

- **bcryptjs**, bukan `bcrypt` native, agar pemasangan di hosting bersama tidak gagal (SDD 10.1). Format hash tetap bcrypt.
- Kode `ARN-nnn` dan `PRD-nnn` dibuat otomatis dari id.
- Perubahan harga satu varian ditolak bila berbeda dari aroma lain pada ukuran yang sama. Gunakan tombol **Ubah Harga Ukuran**.
- Foto: JPG atau PNG maksimal 2 MB, isi berkas diperiksa (bukan hanya tipe yang dikirim).
- **Data aroma contoh** pada `db:seed --contoh` hanya untuk pengembangan. Ganti dengan daftar 17 aroma dan harga asli klien.
- Desain **mobile** menampilkan menu Katalog dan Transaksi pada panel Pemilik. Menu itu sudah dipasang di aplikasi
  (aktif pada Sprint 2). SDD D-20 dan Bagian 6.5 nomor 7 perlu disesuaikan dengan desain mobile.
