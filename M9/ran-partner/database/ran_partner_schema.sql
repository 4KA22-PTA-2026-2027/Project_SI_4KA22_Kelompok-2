-- =====================================================================
-- RAN Partner : skema basis data MySQL 8.x (SDD versi 1.2)
-- Urutan pembuatan tabel mengikuti ketergantungan kunci asing (FK).
-- Jalankan:  mysql -u root -p < ran_partner_schema.sql
-- =====================================================================
CREATE DATABASE IF NOT EXISTS ran_partnerrr
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE ran_partnerrr;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS log_notifikasi, riwayat_perubahan, pengeluaran, mutasi_stok,
  pembayaran, penyerahan, detail_pesanan, pesanan, produk, aroma, pengguna;
SET FOREIGN_KEY_CHECKS = 1;

-- 1. pengguna ---------------------------------------------------------
CREATE TABLE pengguna (
  id_pengguna      INT UNSIGNED NOT NULL AUTO_INCREMENT,
  nama             VARCHAR(100) NOT NULL,
  nama_pengguna    VARCHAR(20)  NOT NULL,
  kata_sandi_hash  CHAR(60)     NOT NULL,
  peran            ENUM('pemilik','kasir') NOT NULL,
  no_whatsapp      VARCHAR(15)  NULL,
  email            VARCHAR(100) NULL,
  status_aktif     TINYINT(1)   NOT NULL DEFAULT 1,
  percobaan_gagal  TINYINT UNSIGNED NOT NULL DEFAULT 0,
  terkunci_sampai  DATETIME     NULL,
  terakhir_aktif   DATETIME     NULL,
  dibuat_pada      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id_pengguna),
  UNIQUE KEY uk_pengguna_nama_pengguna (nama_pengguna),
  CONSTRAINT ck_pengguna_username CHECK (CHAR_LENGTH(nama_pengguna) >= 4),
  CONSTRAINT ck_pengguna_status   CHECK (status_aktif IN (0,1)),
  CONSTRAINT ck_pengguna_gagal    CHECK (percobaan_gagal <= 5)
) ENGINE=InnoDB;

-- 2. aroma ------------------------------------------------------------
CREATE TABLE aroma (
  id_aroma         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  kode_aroma       VARCHAR(10)  NOT NULL,
  nama_aroma       VARCHAR(50)  NOT NULL,
  deskripsi_aroma  VARCHAR(255) NULL,
  foto             VARCHAR(255) NULL,
  status_aktif     TINYINT(1)   NOT NULL DEFAULT 1,
  PRIMARY KEY (id_aroma),
  UNIQUE KEY uk_aroma_kode (kode_aroma),
  UNIQUE KEY uk_aroma_nama (nama_aroma),
  CONSTRAINT ck_aroma_status CHECK (status_aktif IN (0,1))
) ENGINE=InnoDB;

-- 3. produk (varian ukuran per aroma) ---------------------------------
CREATE TABLE produk (
  id_produk          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  kode_produk        VARCHAR(12)  NOT NULL,
  id_aroma           INT UNSIGNED NOT NULL,
  ukuran_ml          SMALLINT UNSIGNED NOT NULL,
  harga_jual         INT UNSIGNED NOT NULL,
  harga_modal        INT UNSIGNED NOT NULL,
  stok               INT UNSIGNED NOT NULL DEFAULT 0,
  batas_stok_minimal SMALLINT UNSIGNED NOT NULL DEFAULT 5,
  status_aktif       TINYINT(1)   NOT NULL DEFAULT 1,
  PRIMARY KEY (id_produk),
  UNIQUE KEY uk_produk_kode (kode_produk),
  UNIQUE KEY uk_produk_aroma_ukuran (id_aroma, ukuran_ml),
  CONSTRAINT fk_produk_aroma FOREIGN KEY (id_aroma) REFERENCES aroma (id_aroma),
  CONSTRAINT ck_produk_ukuran CHECK (ukuran_ml > 0),
  CONSTRAINT ck_produk_jual   CHECK (harga_jual > 0),
  CONSTRAINT ck_produk_status CHECK (status_aktif IN (0,1))
) ENGINE=InnoDB;

-- 4. pesanan ----------------------------------------------------------
CREATE TABLE pesanan (
  no_pesanan     VARCHAR(20)  NOT NULL,
  tanggal        DATETIME     NOT NULL,
  nama_pembeli   VARCHAR(100) NOT NULL,
  kontak         VARCHAR(15)  NOT NULL,
  jenis_pembeli  TINYINT(1)   NOT NULL,
  tipe           TINYINT(1)   NOT NULL,
  status_pesanan ENUM('baru','dipacking','dikirim','diambil','selesai','dibatalkan') NOT NULL DEFAULT 'baru',
  metode_bayar   ENUM('tunai','qris','transfer','tempo') NOT NULL,
  status_bayar   TINYINT(1)   NOT NULL DEFAULT 0,
  total          INT UNSIGNED NOT NULL,
  keuntungan     INT          NOT NULL,
  catatan        VARCHAR(255) NULL,
  catatan_tempo  VARCHAR(255) NULL,
  alasan_batal   VARCHAR(255) NULL,
  jatuh_tempo    DATE         NULL,
  token_bukti    CHAR(64)     NOT NULL,
  id_pengguna    INT UNSIGNED NOT NULL,
  PRIMARY KEY (no_pesanan),
  UNIQUE KEY uk_pesanan_token (token_bukti),
  KEY ix_pesanan_tanggal (tanggal),
  KEY ix_pesanan_kontak (kontak),
  CONSTRAINT fk_pesanan_pengguna FOREIGN KEY (id_pengguna) REFERENCES pengguna (id_pengguna),
  CONSTRAINT ck_pesanan_jenis  CHECK (jenis_pembeli IN (0,1)),
  CONSTRAINT ck_pesanan_tipe   CHECK (tipe IN (0,1)),
  CONSTRAINT ck_pesanan_bayar  CHECK (status_bayar IN (0,1)),
  CONSTRAINT ck_pesanan_batal  CHECK (status_pesanan <> 'dibatalkan' OR alasan_batal IS NOT NULL)
) ENGINE=InnoDB;

-- 5. detail_pesanan ---------------------------------------------------
CREATE TABLE detail_pesanan (
  id_detail    INT UNSIGNED NOT NULL AUTO_INCREMENT,
  no_pesanan   VARCHAR(20)  NOT NULL,
  id_produk    INT UNSIGNED NOT NULL,
  jumlah       SMALLINT UNSIGNED NOT NULL,
  harga_satuan INT UNSIGNED NOT NULL,
  harga_modal  INT UNSIGNED NOT NULL,
  PRIMARY KEY (id_detail),
  UNIQUE KEY uk_detail_pesanan_produk (no_pesanan, id_produk),
  CONSTRAINT fk_detail_pesanan FOREIGN KEY (no_pesanan) REFERENCES pesanan (no_pesanan),
  CONSTRAINT fk_detail_produk  FOREIGN KEY (id_produk)  REFERENCES produk (id_produk),
  CONSTRAINT ck_detail_jumlah CHECK (jumlah > 0)
) ENGINE=InnoDB;

-- 6. penyerahan -------------------------------------------------------
CREATE TABLE penyerahan (
  id_penyerahan INT UNSIGNED NOT NULL AUTO_INCREMENT,
  no_pesanan    VARCHAR(20)  NOT NULL,
  cara_serah    ENUM('cod','kurir','ambil_di_toko') NOT NULL,
  lokasi_cod    VARCHAR(100) NULL,
  kurir         VARCHAR(30)  NULL,
  no_resi       VARCHAR(30)  NULL,
  alamat        VARCHAR(255) NULL,
  ongkos_kirim  INT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (id_penyerahan),
  UNIQUE KEY uk_penyerahan_pesanan (no_pesanan),
  CONSTRAINT fk_penyerahan_pesanan FOREIGN KEY (no_pesanan) REFERENCES pesanan (no_pesanan)
) ENGINE=InnoDB;

-- 7. pembayaran -------------------------------------------------------
CREATE TABLE pembayaran (
  id_pembayaran      INT UNSIGNED NOT NULL AUTO_INCREMENT,
  no_pesanan         VARCHAR(20)  NOT NULL,
  tanggal            DATETIME     NOT NULL,
  metode             ENUM('tunai','qris','transfer') NOT NULL,
  jumlah             INT UNSIGNED NOT NULL,
  uang_diterima      INT UNSIGNED NULL,
  sumber             ENUM('manual','otomatis') NOT NULL DEFAULT 'manual',
  status             ENUM('menunggu','berhasil','gagal') NOT NULL DEFAULT 'menunggu',
  referensi_midtrans VARCHAR(100) NULL,
  kedaluwarsa_pada   DATETIME     NULL,
  id_pengguna        INT UNSIGNED NULL,
  PRIMARY KEY (id_pembayaran),
  UNIQUE KEY uk_pembayaran_midtrans (referensi_midtrans),
  KEY ix_pembayaran_pesanan (no_pesanan),
  KEY ix_pembayaran_tanggal (tanggal),
  CONSTRAINT fk_pembayaran_pesanan  FOREIGN KEY (no_pesanan)  REFERENCES pesanan (no_pesanan),
  CONSTRAINT fk_pembayaran_pengguna FOREIGN KEY (id_pengguna) REFERENCES pengguna (id_pengguna),
  CONSTRAINT ck_pembayaran_jumlah CHECK (jumlah > 0)
) ENGINE=InnoDB;

-- 8. mutasi_stok ------------------------------------------------------
CREATE TABLE mutasi_stok (
  id_mutasi    INT UNSIGNED NOT NULL AUTO_INCREMENT,
  id_produk    INT UNSIGNED NOT NULL,
  no_pesanan   VARCHAR(20)  NULL,
  id_pengguna  INT UNSIGNED NOT NULL,
  jenis        ENUM('masuk','keluar','koreksi','pembatalan') NOT NULL,
  jumlah       INT          NOT NULL,
  stok_sesudah INT UNSIGNED NOT NULL,
  tanggal      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  alasan       VARCHAR(255) NOT NULL,
  PRIMARY KEY (id_mutasi),
  KEY ix_mutasi_produk (id_produk, tanggal),
  CONSTRAINT fk_mutasi_produk   FOREIGN KEY (id_produk)   REFERENCES produk (id_produk),
  CONSTRAINT fk_mutasi_pesanan  FOREIGN KEY (no_pesanan)  REFERENCES pesanan (no_pesanan),
  CONSTRAINT fk_mutasi_pengguna FOREIGN KEY (id_pengguna) REFERENCES pengguna (id_pengguna),
  CONSTRAINT ck_mutasi_jumlah CHECK (jumlah <> 0)
) ENGINE=InnoDB;

-- 9. pengeluaran ------------------------------------------------------
CREATE TABLE pengeluaran (
  id_pengeluaran INT UNSIGNED NOT NULL AUTO_INCREMENT,
  tanggal        DATE         NOT NULL,
  keperluan      VARCHAR(100) NOT NULL,
  keterangan     VARCHAR(255) NULL,
  jumlah         INT UNSIGNED NOT NULL,
  status_bayar   TINYINT(1)   NOT NULL DEFAULT 1,
  id_pengguna    INT UNSIGNED NOT NULL,
  PRIMARY KEY (id_pengeluaran),
  KEY ix_pengeluaran_tanggal (tanggal),
  CONSTRAINT fk_pengeluaran_pengguna FOREIGN KEY (id_pengguna) REFERENCES pengguna (id_pengguna),
  CONSTRAINT ck_pengeluaran_jumlah CHECK (jumlah > 0),
  CONSTRAINT ck_pengeluaran_bayar  CHECK (status_bayar IN (0,1))
) ENGINE=InnoDB;

-- 10. riwayat_perubahan (jejak audit, rujukan entitas bersifat umum) ---
CREATE TABLE riwayat_perubahan (
  id_riwayat  INT UNSIGNED NOT NULL AUTO_INCREMENT,
  entitas     ENUM('pengguna','aroma','produk','stok','pesanan','pengeluaran') NOT NULL,
  id_entitas  VARCHAR(20)  NOT NULL,
  data_lama   JSON         NULL,
  data_baru   JSON         NULL,
  alasan      VARCHAR(255) NULL,
  id_pengguna INT UNSIGNED NOT NULL,
  waktu       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id_riwayat),
  KEY ix_riwayat_entitas (entitas, id_entitas),
  CONSTRAINT fk_riwayat_pengguna FOREIGN KEY (id_pengguna) REFERENCES pengguna (id_pengguna)
) ENGINE=InnoDB;

-- 11. log_notifikasi (webhook Midtrans, tanpa FK karena order_id bisa tidak valid)
CREATE TABLE log_notifikasi (
  id_log   INT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_id VARCHAR(50)  NULL,
  payload  JSON         NOT NULL,
  hasil    ENUM('diproses','ganda','tidak_valid','diabaikan') NOT NULL,
  waktu    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id_log),
  KEY ix_log_order (order_id)
) ENGINE=InnoDB;
