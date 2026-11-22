import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, angka, qs } from '../api';
import { useAuth } from '../auth';
import Dialog from '../components/Dialog';
import { Foto, Kepala, LencanaKondisi, StatCard } from '../components/ui';
import {
  IconBoxes,
  IconSliders,
  IconHistory,
  IconSearch,
  IconFilter,
  IconLayers,
  IconAlertTriangle,
  IconAlertCircle,
  IconInfo,
  IconClock,
  IconUser,
  IconArrowDown,
  IconArrowUp,
  IconX,
} from '../components/icons';

/** L-07 Daftar Stok. Pemilik dapat mengubah, kasir hanya melihat (SRS UC-04). */
export default function Stok() {
  const { pengguna } = useAuth();
  const pemilik = pengguna.peran === 'pemilik';
  const [data, setData] = useState(null);
  const [cari, setCari] = useState('');
  const [ukuran, setUkuran] = useState('');
  const [kondisi, setKondisi] = useState('');
  const [galat, setGalat] = useState('');
  const [riwayat, setRiwayat] = useState(null);
  const [memuat, setMemuat] = useState(false);

  const muat = useCallback(() => {
    setMemuat(true);
    api
      .get('/api/stok' + qs({ cari, ukuran, kondisi }))
      .then((d) => {
        setData(d);
        setGalat('');
      })
      .catch((e) => setGalat(e.message))
      .finally(() => setMemuat(false));
  }, [cari, ukuran, kondisi]);

  useEffect(() => {
    const t = setTimeout(muat, 200);
    return () => clearTimeout(t);
  }, [muat]);

  async function bukaRiwayat(s) {
    try {
      const d = await api.get(`/api/stok/${s.id_produk}/mutasi`);
      setRiwayat({ s, mutasi: d.mutasi });
    } catch (e) {
      setGalat(e.message);
    }
  }

  const daftarUkuran = data
    ? [...new Set(data.stok.map((s) => s.ukuran_ml))].sort((a, b) => a - b)
    : [];
  const r = data?.ringkasan;

  return (
    <div className="halaman-stok">
      <Kepala
        judul={pemilik ? 'Manajemen Stok' : 'Stok'}
        sub="Pantau persediaan berdasarkan aroma dan ukuran. Foto mengikuti data Produk; unggah atau ganti melalui Form Produk."
        icon={<IconBoxes size={22} />}
        kanan={
          pemilik && (
            <Link className="btn btn-icon" to="/stok/ubah">
              <IconSliders size={16} />
              <span>+ Koreksi Stok</span>
            </Link>
          )
        }
      />

      {!pemilik && (
        <div className="kotak-info">
          <IconInfo size={18} />
          <div>
            <b>Kasir - hanya lihat.</b> Perubahan stok dilakukan oleh pemilik.
          </div>
        </div>
      )}

      {galat && (
        <div className="kotak-galat">
          <IconAlertCircle size={18} />
          <span>{galat}</span>
        </div>
      )}

      {r && (
        <div className="kisi-kartu">
          <StatCard
            judul="Total Unit Tersedia"
            nilai={angka(r.total_unit)}
            ket="Akumulasi seluruh ukuran"
            icon={<IconBoxes size={20} />}
            status="gold"
          />
          <StatCard
            judul="Stok Menipis"
            nilai={String(r.menipis).padStart(2, '0')}
            ket="Mencapai batas minimum"
            icon={<IconAlertTriangle size={20} />}
            status="amber"
          />
          <StatCard
            judul="Aroma Habis"
            nilai={String(r.habis).padStart(2, '0')}
            ket="Perlu pengadaan"
            icon={<IconAlertCircle size={20} />}
            status="crimson"
          />
        </div>
      )}

      <div className="panel">
        <div className="panel-kepala-bar">
          <div className="panel-judul-wrap">
            <span className="panel-icon-circle emas">
              <IconBoxes size={18} />
            </span>
            <div>
              <h2>Manajemen Stok</h2>
              <p className="redup">
                Pantau persediaan berdasarkan aroma dan ukuran.
              </p>
            </div>
          </div>
          {data && (
            <span className="lencana netral">
              {data.stok.length} Varian
            </span>
          )}
        </div>

        {/* Toolbar Filter */}
        <div className="bar-alat">
          <div className="input-icon-wrap cari-wrap">
            <IconSearch size={16} className="input-inner-icon" />
            <input
              type="search"
              placeholder="Cari aroma..."
              value={cari}
              onChange={(e) => setCari(e.target.value)}
              aria-label="Cari aroma"
            />
            {cari && (
              <button
                type="button"
                className="input-clear-btn"
                onClick={() => setCari('')}
                aria-label="Hapus pencarian"
              >
                <IconX size={14} />
              </button>
            )}
          </div>

          <div className="input-icon-wrap filter-select-wrap">
            <IconLayers size={15} className="input-inner-icon" />
            <select
              value={ukuran}
              onChange={(e) => setUkuran(e.target.value)}
              aria-label="Filter ukuran"
            >
              <option value="">Filter ukuran: Semua</option>
              {daftarUkuran.map((u) => (
                <option key={u} value={u}>
                  {u} ml
                </option>
              ))}
            </select>
          </div>

          <div className="input-icon-wrap filter-select-wrap">
            <IconFilter size={15} className="input-inner-icon" />
            <select
              value={kondisi}
              onChange={(e) => setKondisi(e.target.value)}
              aria-label="Status stok"
            >
              <option value="">Status stok: Semua</option>
              <option value="tersedia">Tersedia</option>
              <option value="menipis">Menipis</option>
              <option value="habis">Habis</option>
            </select>
          </div>
        </div>

        {data && data.stok.length === 0 && (
          <div className="kosong-elegan">
            <div className="kosong-icon-wrap">
              <IconBoxes size={36} />
            </div>
            <h3>Data tidak ditemukan</h3>
            <p>
              {cari || ukuran || kondisi
                ? 'Tidak ada varian aroma yang cocok dengan filter.'
                : 'Belum ada data stok.'}
            </p>
          </div>
        )}

        {data && data.stok.length > 0 && (
          <>
            <div className="wadah-tabel tampil-desktop">
              <table className="tabel">
                <thead>
                  <tr>
                    <th>Aroma</th>
                    <th style={{ width: 100 }}>Ukuran</th>
                    <th className="angka" style={{ width: 140 }}>Stok saat ini</th>
                    <th className="angka" style={{ width: 120 }}>Minimum</th>
                    <th style={{ width: 120 }}>Kondisi</th>
                    <th style={{ width: 160, textAlign: 'right' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {data.stok.map((s) => (
                    <tr key={s.id_produk}>
                      <td>
                        <div className="aroma-sel">
                          <Foto src={s.foto} nama={s.nama_aroma} size={42} />
                          <div>
                            <div className="aroma-nama">{s.nama_aroma}</div>
                            <div className="kode-pill kecil">{s.kode_produk}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="badge-ml">{s.ukuran_ml} ml</span>
                      </td>
                      <td className="angka">
                        <span
                          className={`angka-stok-cell ${
                            s.stok === 0
                              ? 'teks-merah'
                              : s.stok <= s.batas_stok_minimal
                              ? 'teks-kuning'
                              : 'teks-emas'
                          }`}
                        >
                          {angka(s.stok)}
                        </span>
                      </td>
                      <td className="angka">
                        <span className="teks-redup">{s.batas_stok_minimal}</span>
                      </td>
                      <td>
                        <LencanaKondisi kondisi={s.kondisi} />
                      </td>
                      <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <div className="aksi-grup-tabel">
                          <button
                            type="button"
                            className="btn garis kecil btn-icon"
                            onClick={() => bukaRiwayat(s)}
                            title="Riwayat mutasi stok"
                          >
                            <IconHistory size={13} />
                            <span>Riwayat</span>
                          </button>
                          {pemilik && (
                            <Link
                              className="btn garis kecil btn-icon"
                              to={`/stok/ubah?produk=${s.id_produk}`}
                              title="Ubah stok"
                            >
                              <IconSliders size={13} />
                              <span>Ubah</span>
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Tampilan Ponsel (Mobile Cards) */}
            <div className="tampil-ponsel">
              {data.stok.map((s) => (
                <div className="kartu-item-mobile" key={s.id_produk}>
                  <div className="kartu-item-mobile-header">
                    <div className="aroma-sel">
                      <Foto src={s.foto} nama={s.nama_aroma} size={44} />
                      <div>
                        <div className="aroma-nama">{s.nama_aroma}</div>
                        <div className="kode-pill kecil">{s.kode_produk}</div>
                      </div>
                    </div>
                    <LencanaKondisi kondisi={s.kondisi} />
                  </div>

                  <div className="grid-detail-mobile">
                    <div className="detail-kolom">
                      <span className="detail-label">Ukuran</span>
                      <strong className="detail-nilai badge-ml">{s.ukuran_ml} ml</strong>
                    </div>
                    <div className="detail-kolom">
                      <span className="detail-label">Stok saat ini</span>
                      <strong
                        className={`detail-nilai ${
                          s.stok === 0 ? 'teks-merah' : s.stok <= s.batas_stok_minimal ? 'teks-kuning' : 'teks-emas'
                        }`}
                      >
                        {angka(s.stok)} botol
                      </strong>
                    </div>
                    <div className="detail-kolom">
                      <span className="detail-label">Minimum</span>
                      <span className="detail-nilai teks-redup">{s.batas_stok_minimal}</span>
                    </div>
                  </div>

                  <div className="kartu-item-mobile-footer">
                    <button
                      type="button"
                      className="btn garis kecil btn-icon"
                      onClick={() => bukaRiwayat(s)}
                    >
                      <IconHistory size={13} />
                      <span>Riwayat</span>
                    </button>
                    {pemilik && (
                      <Link
                        className="btn garis kecil btn-icon"
                        to={`/stok/ubah?produk=${s.id_produk}`}
                      >
                        <IconSliders size={13} />
                        <span>Ubah</span>
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        <div className="info-catatan-kf">
          <IconInfo size={16} />
          <span>
            Stok berkurang saat pesanan siap dipenuhi. Pembatalan mengembalikan stok. Stok PO belum dipotong sebelum barang tersedia.
          </span>
        </div>
      </div>

      {/* Dialog Riwayat Mutasi Stok */}
      {riwayat && (
        <Dialog
          judul={`Riwayat stok: ${riwayat.s.nama_aroma} ${riwayat.s.ukuran_ml} ml`}
          icon={<IconHistory size={20} />}
          onTutup={() => setRiwayat(null)}
          aksi={
            <button className="btn" onClick={() => setRiwayat(null)}>
              Tutup
            </button>
          }
        >
          <div className="dialog-mutasi-header">
            <Foto src={riwayat.s.foto} nama={riwayat.s.nama_aroma} size={48} />
            <div>
              <div className="mutasi-nama">{riwayat.s.nama_aroma}</div>
              <div className="mutasi-meta">
                <span>{riwayat.s.ukuran_ml} ml</span>
                <span className="pemisah">•</span>
                <span>{riwayat.s.kode_produk}</span>
                <span className="pemisah">•</span>
                <span>Stok saat ini: <strong>{riwayat.s.stok}</strong></span>
              </div>
            </div>
          </div>

          <div className="daftar-mutasi-wadah">
            {riwayat.mutasi.length === 0 ? (
              <div className="kosong-elegan">
                <IconHistory size={32} />
                <p>Belum ada mutasi stok.</p>
              </div>
            ) : (
              riwayat.mutasi.map((m) => {
                const masuk = m.jumlah > 0;
                return (
                  <div className="kartu-mutasi-item" key={m.id_mutasi}>
                    <div className="mutasi-baris-atas">
                      <div className="mutasi-jenis-tag">
                        {masuk ? (
                          <span className="icon-panah masuk">
                            <IconArrowDown size={14} />
                          </span>
                        ) : (
                          <span className="icon-panah keluar">
                            <IconArrowUp size={14} />
                          </span>
                        )}
                        <strong>{m.jenis}</strong>
                      </div>
                      <div className={`mutasi-jumlah ${masuk ? 'teks-hijau' : 'teks-merah'}`}>
                        {masuk ? `+${m.jumlah}` : m.jumlah}
                      </div>
                    </div>

                    <div className="mutasi-alasan">{m.alasan}</div>

                    <div className="mutasi-baris-bawah">
                      <div className="mutasi-meta-item">
                        <IconClock size={12} />
                        <span>{m.tanggal.slice(0, 16)}</span>
                      </div>
                      <div className="mutasi-meta-item">
                        <IconUser size={12} />
                        <span>Oleh: {m.pelaku}</span>
                      </div>
                      <div className="mutasi-meta-item">
                        <span>Stok sesudah: <strong>{m.stok_sesudah}</strong></span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Dialog>
      )}
    </div>
  );
}
