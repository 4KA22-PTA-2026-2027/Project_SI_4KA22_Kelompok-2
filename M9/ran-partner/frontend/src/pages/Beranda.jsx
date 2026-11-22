import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, angka } from '../api';
import { useAuth } from '../auth';
import { Foto, Kepala, LencanaKondisi, StatCard } from '../components/ui';
import {
  IconBoxes,
  IconAlertTriangle,
  IconAlertCircle,
  IconBottle,
  IconArrowRight,
  IconCheckCircle,
  IconSliders,
  IconCrown,
  IconShield,
  IconReceipt,
  IconCreditCard,
  IconBarChart,
} from '../components/icons';

/** L-02 Beranda sesuai peran. Sprint 1: ringkasan stok dan peringatan stok (KF-06). */
export default function Beranda() {
  const { pengguna } = useAuth();
  const [data, setData] = useState(null);
  const [perhatian, setPerhatian] = useState([]);
  const [galat, setGalat] = useState('');
  const [memuat, setMemuat] = useState(true);

  useEffect(() => {
    let batal = false;
    setMemuat(true);
    Promise.all([
      api.get('/api/beranda'),
      api.get('/api/stok?kondisi=habis'),
      api.get('/api/stok?kondisi=menipis'),
    ])
      .then(([b, habis, menipis]) => {
        if (!batal) {
          setData(b);
          setPerhatian([...habis.stok, ...menipis.stok]);
          setMemuat(false);
        }
      })
      .catch((e) => {
        if (!batal) {
          setGalat(e.message);
          setMemuat(false);
        }
      });
    return () => {
      batal = true;
    };
  }, []);

  const pemilik = pengguna.peran === 'pemilik';

  return (
    <div className="halaman-beranda">
      {/* Banner Ringkasan Atas */}
      <div className="banner-atelier">
        <div className="banner-konten">
          <div className="banner-badge">
            {pemilik ? <IconCrown size={13} /> : <IconShield size={13} />}
            <span>PORTAL OPERASIONAL {pengguna.peran.toUpperCase()}</span>
          </div>
          <h1 className="banner-judul">
            Selamat Datang, <span className="teks-emas">{pengguna.nama}</span>
          </h1>
          <p className="banner-sub">
            {pemilik
              ? 'Pantau pergerakan persediaan, aroma aktif, dan kesiapan operasional koleksi parfum RAN Partner.'
              : 'Pantau ketersediaan stok fisik dan varian parfum sebelum melayani pesanan pelanggan.'}
          </p>
        </div>
        <div className="banner-visual-wrap" aria-hidden="true">
          <img
            src="/assets/beranda-banner.svg"
            alt="RAN Partner Perfume"
            className="banner-visual-img"
          />
        </div>
      </div>

      <Kepala
        judul="Beranda"
        sub={
          pemilik
            ? 'Ringkasan usaha dan peringatan stok'
            : 'Ringkasan aktivitas operasional hari ini'
        }
        kanan={
          <div className="pengguna-info">
            <b>{pengguna.peran.toUpperCase()}</b>
            {pengguna.nama}
          </div>
        }
      />

      {galat && (
        <div className="kotak-galat">
          <IconAlertCircle size={18} />
          <span>{galat}</span>
        </div>
      )}

      {memuat && !data && (
        <div className="panel panel-memuat">
          <IconBottle size={36} className="animasi-putar" />
          <p>Memuat ringkasan data inventaris...</p>
        </div>
      )}

      {data && (
        <>
          <div className="kisi-kartu">
            <StatCard
              judul="Total Unit Stok"
              nilai={angka(data.stok.total_unit)}
              ket={`${data.stok.jumlah_varian} varian • ${data.stok.jumlah_aroma} aroma aktif`}
              icon={<IconBoxes size={22} />}
              status="gold"
            />
            <StatCard
              judul="Stok Menipis"
              nilai={String(data.stok.menipis).padStart(2, '0')}
              ket="Stok lebih dari 0 dan mencapai batas minimum"
              icon={<IconAlertTriangle size={22} />}
              status="amber"
            />
            <StatCard
              judul="Stok Habis"
              nilai={String(data.stok.habis).padStart(2, '0')}
              ket="Perlu pengadaan ulang"
              icon={<IconAlertCircle size={22} />}
              status="crimson"
            />
            {pemilik && (
              <StatCard
                judul="Jenis Aroma"
                nilai={String(data.produk.jenis_aroma).padStart(2, '0')}
                ket={`${data.produk.produk_nonaktif} varian nonaktif`}
                icon={<IconBottle size={22} />}
                status="emerald"
              />
            )}
          </div>

          {/* Section: Stok Perlu Diperiksa */}
          <div className="panel panel-perhatian">
            <div className="panel-kepala-bar">
              <div className="panel-judul-wrap">
                <span className="panel-icon-circle amber">
                  <IconAlertTriangle size={18} />
                </span>
                <div>
                  <h2>Stok perlu diperiksa</h2>
                  <p className="redup">
                    Varian yang habis atau sudah mencapai batas minimum persediaan.
                  </p>
                </div>
              </div>
              <span className="lencana-hitung">
                {perhatian.length} Item
              </span>
            </div>

            {perhatian.length === 0 ? (
              <div className="kosong-elegan">
                <div className="kosong-icon-wrap hijau">
                  <IconCheckCircle size={32} />
                </div>
                <h3>Semua stok dalam kondisi aman</h3>
                <p>Tidak ada varian parfum yang habis atau mencapai batas minimum stok.</p>
              </div>
            ) : (
              <div className="daftar-perhatian">
                {perhatian.map((s) => (
                  <div className="kartu-item-stok" key={s.id_produk}>
                    <div className="item-kiri">
                      <Foto src={s.foto} nama={s.nama_aroma} size={46} />
                      <div className="item-deskripsi">
                        <div className="item-nama">{s.nama_aroma}</div>
                        <div className="item-meta">
                          <span className="badge-ml">{s.ukuran_ml} ml</span>
                          <span className="pemisah">•</span>
                          <span>
                            Sisa: <strong className={s.stok === 0 ? 'teks-merah' : 'teks-kuning'}>{s.stok} botol</strong>
                          </span>
                          <span className="pemisah">•</span>
                          <span className="teks-redup">Minimum: {s.batas_stok_minimal} botol</span>
                        </div>
                      </div>
                    </div>
                    <div className="item-kanan">
                      <LencanaKondisi kondisi={s.kondisi} />
                      {pemilik && (
                        <Link
                          className="btn garis kecil btn-icon"
                          to={`/stok/ubah?produk=${s.id_produk}`}
                          title="Koreksi stok produk ini"
                        >
                          <IconSliders size={13} />
                          <span>Ubah</span>
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="panel-footer-aksi">
              <Link className="btn garis kecil btn-icon" to="/stok">
                <span>Buka daftar stok</span>
                <IconArrowRight size={14} />
              </Link>
            </div>
          </div>

          {/* Section: Ringkasan Penjualan dan Pembayaran (Roadmap Sprint 2 & 3 sesuai SDD 10.2) */}
          <div className="panel panel-roadmap">
            <div className="panel-kepala-bar">
              <div className="panel-judul-wrap">
                <span className="panel-icon-circle emas">
                  <IconReceipt size={18} />
                </span>
                <div>
                  <h2>Ringkasan penjualan dan pembayaran</h2>
                  <p className="redup">
                    Transaksi hari ini, penjualan, dan pembayaran tertunda akan tampil di sini setelah Sprint 2 dan 3.
                  </p>
                </div>
              </div>
              <span className="lencana netral">Sprint 2 & 3</span>
            </div>

            <div className="roadmap-grid">
              <div className="roadmap-card">
                <div className="roadmap-icon">
                  <IconReceipt size={20} />
                </div>
                <div className="roadmap-info">
                  <div className="roadmap-titel">Katalog dan Transaksi POS</div>
                  <div className="roadmap-desc">Pencatatan pesanan Ready dan PO dengan harga seragam dan bukti WhatsApp.</div>
                  <span className="badge-sprint">Sprint 2</span>
                </div>
              </div>
              <div className="roadmap-card">
                <div className="roadmap-icon">
                  <IconCreditCard size={20} />
                </div>
                <div className="roadmap-info">
                  <div className="roadmap-titel">Pembayaran dan Pengeluaran</div>
                  <div className="roadmap-desc">Pencatatan kas masuk Tunai, QRIS Midtrans, Transfer, dan Tempo.</div>
                  <span className="badge-sprint">Sprint 2</span>
                </div>
              </div>
              <div className="roadmap-card">
                <div className="roadmap-icon">
                  <IconBarChart size={20} />
                </div>
                <div className="roadmap-info">
                  <div className="roadmap-titel">Rekap Harian dan Riwayat</div>
                  <div className="roadmap-desc">Penyusunan otomatis total penjualan, modal, pengeluaran, dan untung harian.</div>
                  <span className="badge-sprint">Sprint 3</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
