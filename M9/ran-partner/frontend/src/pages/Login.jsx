import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../auth';
import { Field } from '../components/ui';
import {
  IconUser,
  IconLock,
  IconEye,
  IconEyeOff,
  IconArrowRight,
  IconAlertCircle,
  IconInfo,
} from '../components/icons';

/** L-01 Login. Dua halaman (Kasir dan Pemilik) memakai satu endpoint, peran diperiksa di backend (D-19). */
export default function Login({ portal }) {
  const { pengguna, masuk, info } = useAuth();
  const [nama, setNama] = useState('');
  const [sandi, setSandi] = useState('');
  const [lihatSandi, setLihatSandi] = useState(false);
  const [galat, setGalat] = useState({});
  const [pesan, setPesan] = useState('');
  const [proses, setProses] = useState(false);
  const adalahPemilik = portal === 'pemilik';

  if (pengguna) return <Navigate to="/beranda" replace />;

  async function kirim(e) {
    e.preventDefault();
    const g = {};
    if (!nama.trim()) g.nama_pengguna = 'Nama pengguna wajib diisi';
    if (!sandi) g.kata_sandi = 'Kata sandi wajib diisi';
    setGalat(g);
    setPesan('');
    if (Object.keys(g).length) return;
    setProses(true);
    try {
      await masuk(nama.trim(), sandi, portal);
    } catch (err) {
      setGalat(err.galat || {});
      setPesan(err.message);
    } finally {
      setProses(false);
    }
  }

  return (
    <div className="login-wadah">
      {/* Sisi Kiri: Gambar Produk Parfum sesuai SDD Gambar 6.2 & 6.3 */}
      <div className="login-showcase" aria-hidden="true">
        <img
          src="/assets/login-perfume.svg"
          alt="RAN Partner Perfume Bottle"
          className="login-perfume-img"
        />
      </div>

      {/* Sisi Kanan: Form Login sesuai SDD Gambar 6.2 & 6.3 */}
      <div className="login-form-sisi">
        <div className="login-brand-header">
          <img
            src="/assets/logo-gold.png"
            alt="Logo Resmi RAN Partner"
            className="login-official-logo"
          />
        </div>
        <form className="kartu-login-luxury" onSubmit={kirim} noValidate>
          <div className="login-header">
            <h1 className="login-judul">Selamat Datang</h1>
            <p className="login-sub">Masuk untuk melanjutkan</p>
          </div>

          {info && (
            <div className="kotak-info">
              <IconInfo size={16} />
              <span>{info}</span>
            </div>
          )}

          {pesan && (
            <div className="kotak-galat" role="alert">
              <IconAlertCircle size={16} />
              <span>{pesan}</span>
            </div>
          )}

          <Field label="Username" galat={galat.nama_pengguna} icon={<IconUser size={14} />}>
            <div className="input-with-icon">
              <input
                type="text"
                autoComplete="username"
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                className={galat.nama_pengguna ? 'salah' : ''}
                autoFocus
              />
            </div>
          </Field>

          <Field label="Password" galat={galat.kata_sandi} icon={<IconLock size={14} />}>
            <div className="input-password-wrap">
              <input
                type={lihatSandi ? 'text' : 'password'}
                autoComplete="current-password"
                value={sandi}
                onChange={(e) => setSandi(e.target.value)}
                className={galat.kata_sandi ? 'salah' : ''}
              />
              <button
                type="button"
                className="tombol-toggle-sandi"
                onClick={() => setLihatSandi(!lihatSandi)}
                aria-label={lihatSandi ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
              >
                {lihatSandi ? <IconEyeOff size={16} /> : <IconEye size={16} />}
              </button>
            </div>
          </Field>

          <button className="btn blok btn-login-submit" disabled={proses}>
            <span>{proses ? 'MEMERIKSA...' : 'MASUK'}</span>
            <IconArrowRight size={16} />
          </button>
        </form>

        <div className="login-footer-switcher">
          <Link
            className="btn garis btn-switch-portal"
            to={adalahPemilik ? '/login' : '/login-pemilik'}
          >
            {adalahPemilik ? 'Login sebagai Kasir' : 'Login sebagai Pemilik'}
          </Link>
        </div>
      </div>
    </div>
  );
}
