import { useLocation, Link } from 'react-router-dom';
import { MENU } from '../components/Layout';
import { useAuth } from '../auth';
import { Kepala } from '../components/ui';
import {
  IconSparkles,
  IconArrowRight,
  IconBottle,
  IconReceipt,
  IconCreditCard,
  IconHistory,
  IconBarChart,
  IconUsers,
  IconClock,
} from '../components/icons';

const SPRINT_INFO = {
  '/katalog': {
    sprint: 2,
    icon: IconBottle,
    deskripsi: 'Katalog interaktif untuk menampilkan koleksi botol parfum berdasarkan aroma olfaktori, ukuran ml, dan ketersediaan stok.',
    fitur: ['Grid katalog aroma dengan foto resolusi tinggi', 'Filter berdasarkan karakter wewangian (woody, floral, fresh)', 'Pilihan ukuran botol (30ml, 50ml, 100ml) langsung ke pesanan'],
  },
  '/transaksi': {
    sprint: 2,
    icon: IconReceipt,
    deskripsi: 'Point of Sale (POS) kasir untuk melayani pesanan ready stock dan pencatatan pesanan Pre-Order (PO) parfum.',
    fitur: ['Keranjang belanja kasir cepat dan responsif', 'Penghitungan otomatis harga seragam dan biaya PO (+Rp5.000)', 'Cetak bukti transaksi dan struk pesanan'],
  },
  '/pembayaran': {
    sprint: 2,
    icon: IconCreditCard,
    deskripsi: 'Pencatatan kas masuk, pembayaran lunas, uang muka (DP) pesanan PO, dan pelunasan saat pengambilan.',
    fitur: ['Metode pembayaran tunai & transfer bank', 'Pencatatan DP pre-order parfum', 'Validasi status lunas sebelum botol diserahkan'],
  },
  '/riwayat': {
    sprint: 3,
    icon: IconHistory,
    deskripsi: 'Arsip seluruh riwayat pesanan pelanggan dan mutasi transaksi kasir harian.',
    fitur: ['Pencarian berdasarkan nomor struk dan tanggal transaksi', 'Riwayat detail pesanan per aroma', 'Opsi cetak ulang struk penjualan'],
  },
  '/pengeluaran': {
    sprint: 2,
    icon: IconReceipt,
    deskripsi: 'Pencatatan beban operasional outlet parfum (seperti kemasan, botol tester, biaya logistik, dan perlengkapan).',
    fitur: ['Kategori pengeluaran operasional', 'Bukti pengeluaran kas outlet', 'Integrasi langsung ke rekapitulasi kasir'],
  },
  '/rekap': {
    sprint: 3,
    icon: IconBarChart,
    deskripsi: 'Penutupan kasir harian dan serah terima kas antar shift kasir.',
    fitur: ['Rekonsiliasi uang kas fisik vs total penjualan sistem', 'Ringkasan omset per metode bayar', 'Pencatatan selisih kas harian'],
  },
  '/rekapan': {
    sprint: 3,
    icon: IconBarChart,
    deskripsi: 'Laporan keuangan dan performa penjualan untuk pemilik usaha.',
    fitur: ['Laporan laba rugi dan margin per varian aroma', 'Aroma parfum terlaris (Best Seller)', 'Ekspor rekapitulasi ke format spreadsheet'],
  },
  '/pengguna': {
    sprint: 3,
    icon: IconUsers,
    deskripsi: 'Manajemen akun kasir dan hak akses portal operasional RAN Partner.',
    fitur: ['Pendaftaran akun kasir baru', 'Reset kata sandi dan status aktif/nonaktif akun', 'Audit log aktivitas pengguna (KF-27)'],
  },
};

/** Penampung elegan untuk menu yang dikerjakan pada Sprint 2 dan 3 (SDD 10.2). */
export default function Segera() {
  const { pathname } = useLocation();
  const { pengguna } = useAuth();
  const item = (MENU[pengguna.peran] || []).find((m) => m.to === pathname);
  const info = SPRINT_INFO[pathname] || {
    sprint: '2 atau 3',
    icon: IconSparkles,
    deskripsi: 'Fitur operasional ini sedang dalam tahap perancangan dan persiapan pengembangan.',
    fitur: ['Implementasi sesuai SDD Bagian 10.2', 'Integrasi mulus dengan modul produk dan stok'],
  };
  const IconComp = info.icon;

  return (
    <div className="halaman-segera">
      <Kepala
        judul={item ? item.teks : 'Halaman Sistem'}
        sub="Modul terencana dalam roadmap pengembangan RAN Partner"
        icon={<IconComp size={22} />}
        badge={`Rilis: Sprint ${info.sprint}`}
      />

      <div className="panel panel-segera-preview">
        <div className="segera-hero">
          <div className="segera-icon-large">
            <IconComp size={48} />
          </div>
          <div className="segera-badge-pill">
            <IconClock size={13} />
            <span>TERSEDIA PADA SPRINT {info.sprint}</span>
          </div>
          <h2>Modul {item ? item.teks : 'Ini'} Sedang Dipersiapkan</h2>
          <p className="segera-desc">{info.deskripsi}</p>
        </div>

        <div className="segera-rencana-fitur">
          <h3>Fitur Utama yang Akan Hadir:</h3>
          <div className="kisi-fitur-segera">
            {info.fitur.map((f, i) => (
              <div className="kartu-fitur-segera" key={i}>
                <span className="fitur-nomor">0{i + 1}</span>
                <span className="fitur-teks">{f}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="segera-footer-nav">
          <p className="redup">
            Saat ini Sprint 1 berfokus pada autentikasi, manajemen master produk, penetapan harga seragam, dan pemantauan stok fisik.
          </p>
          <div className="segera-tombol-grup">
            <Link className="btn garis kecil btn-icon" to="/beranda">
              <span>Kembali ke Beranda</span>
            </Link>
            <Link className="btn kecil btn-icon" to="/stok">
              <span>Buka Menu Stok</span>
              <IconArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
