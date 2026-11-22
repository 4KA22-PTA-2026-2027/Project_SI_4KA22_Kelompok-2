import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../auth';
import Dialog from './Dialog';
import {
  IconHome,
  IconCatalog,
  IconBag,
  IconCreditCard,
  IconHistory,
  IconReceipt,
  IconBarChart,
  IconBoxes,
  IconBottle,
  IconUsers,
  IconLogOut,
  IconCrown,
  IconShield,
} from './icons';

// Menu mengikuti SDD 6.1. Halaman bertanda "siap: false" dikerjakan pada sprint berikutnya.
export const MENU = {
  kasir: [
    { to: '/beranda', teks: 'Beranda', siap: true, icon: IconHome },
    { to: '/katalog', teks: 'Katalog', siap: false, icon: IconCatalog },
    { to: '/transaksi', teks: 'Transaksi', siap: false, icon: IconBag },
    { to: '/pembayaran', teks: 'Pembayaran', siap: false, icon: IconCreditCard },
    { to: '/riwayat', teks: 'Riwayat Transaksi', siap: false, icon: IconHistory },
    { to: '/pengeluaran', teks: 'Pengeluaran', siap: false, icon: IconReceipt },
    { to: '/rekap', teks: 'Rekap Harian', siap: false, icon: IconBarChart },
    { to: '/stok', teks: 'Stok', siap: true, icon: IconBoxes },
  ],
  pemilik: [
    { to: '/beranda', teks: 'Beranda', siap: true, icon: IconHome },
    { to: '/katalog', teks: 'Katalog', siap: false, icon: IconCatalog },
    { to: '/transaksi', teks: 'Transaksi', siap: false, icon: IconBag },
    { to: '/riwayat', teks: 'Riwayat Pesanan', siap: false, icon: IconHistory },
    { to: '/pengeluaran', teks: 'Pengeluaran', siap: false, icon: IconReceipt },
    { to: '/stok', teks: 'Stok', siap: true, icon: IconBoxes },
    { to: '/produk', teks: 'Produk', siap: true, icon: IconBottle },
    { to: '/rekapan', teks: 'Rekapan', siap: false, icon: IconBarChart },
    { to: '/pengguna', teks: 'Pengguna', siap: false, icon: IconUsers },
  ],
};

export default function Layout() {
  const { pengguna, keluar } = useAuth();
  const [konfirmasi, setKonfirmasi] = useState(false);
  const menu = MENU[pengguna.peran] || [];
  const adalahPemilik = pengguna.peran === 'pemilik';
  const labelPeran = adalahPemilik ? 'PANEL PEMILIK' : 'MENU KASIR';

  return (
    <div className="app">
      <aside className="sisi" aria-label="Navigasi Utama">
        {/* Brand Header sesuai SDD Gambar 6.5 & 6.6 */}
        <div className="merek-wadah">
          <div className="merek-logo">
            <img
              src="/assets/logo-icon-gold.png"
              alt="Logo Resmi RAN Partner"
              className="logo-crest-img"
            />
          </div>
          <div className="merek-teks">
            <div className="merek">RAN PARTNER</div>
            <div className="sub-merek">{labelPeran}</div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="menu" aria-label="Menu navigasi">
          <div className="menu-label">{labelPeran}</div>
          {menu.map((m) => {
            const IconComponent = m.icon || IconBottle;
            return (
              <NavLink
                key={m.to}
                to={m.to}
                className={({ isActive }) =>
                  'menu-item' + (isActive ? ' aktif' : '') + (m.siap ? '' : ' segera')
                }
              >
                <span className="menu-icon-wrap">
                  <IconComponent size={18} />
                </span>
                <span className="menu-teks">{m.teks}</span>
                {!m.siap && <span className="segera-pill">Sprint {m.to === '/riwayat' || m.to === '/rekap' || m.to === '/rekapan' || m.to === '/pengguna' ? '3' : '2'}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* User Card & Logout in Footer */}
        <div className="sisi-footer">
          <div className="user-card">
            <div className="user-avatar">
              {adalahPemilik ? <IconCrown size={15} /> : <IconShield size={15} />}
            </div>
            <div className="user-detail">
              <span className="user-name">{pengguna.nama}</span>
              <span className="user-role">{pengguna.peran}</span>
            </div>
          </div>
          <button
            type="button"
            className="tombol-keluar"
            onClick={() => setKonfirmasi(true)}
            aria-label="Keluar dari akun"
          >
            <IconLogOut size={16} />
            <span>Keluar</span>
          </button>
        </div>
      </aside>

      <div className="konten-wadah">
        {/* Mobile Header */}
        <header className="bar-atas">
          <div className="baris">
            <div className="merek-wadah-mobile">
              <img
                src="/assets/logo-icon-gold.png"
                alt="Logo Resmi RAN Partner"
                className="logo-crest-img-mobile"
              />
              <div>
                <div className="merek" style={{ fontSize: 16 }}>RAN PARTNER</div>
                <div className="sub-merek" style={{ fontSize: 10 }}>{labelPeran}</div>
              </div>
            </div>
            <div className="pengguna-info-mobile">
              <span className="pengguna-badge-mobile">
                {adalahPemilik ? <IconCrown size={11} /> : <IconShield size={11} />}
                {pengguna.peran}
              </span>
              <span className="pengguna-nama-mobile">{pengguna.nama}</span>
            </div>
          </div>
          <nav className="chip-menu" aria-label="Menu navigasi mobile">
            {menu.map((m) => {
              const IconComponent = m.icon || IconBottle;
              return (
                <NavLink
                  key={m.to}
                  to={m.to}
                  className={({ isActive }) => 'chip-item' + (isActive ? ' aktif' : '') + (m.siap ? '' : ' segera')}
                >
                  <IconComponent size={14} />
                  <span>{m.teks}</span>
                  {!m.siap && <small className="chip-dot">•</small>}
                </NavLink>
              );
            })}
            <button
              type="button"
              className="chip-item chip-keluar"
              onClick={() => setKonfirmasi(true)}
            >
              <IconLogOut size={14} />
              <span>Keluar</span>
            </button>
          </nav>
        </header>

        <main className="konten">
          <Outlet />
        </main>
      </div>

      {konfirmasi && (
        <Dialog
          judul="Konfirmasi Keluar"
          onTutup={() => setKonfirmasi(false)}
          aksi={
            <>
              <button className="btn garis" onClick={() => setKonfirmasi(false)}>
                Batal
              </button>
              <button className="btn bahaya-solid" onClick={keluar}>
                <IconLogOut size={15} />
                <span>Keluar Sekarang</span>
              </button>
            </>
          }
        >
          <p>
            Apakah Anda yakin ingin keluar dari akun RAN PARTNER? Pastikan transaksi yang sedang dikerjakan sudah tersimpan.
          </p>
        </Dialog>
      )}
    </div>
  );
}
