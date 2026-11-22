import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, angka, qs, rupiah } from '../api';
import Dialog from '../components/Dialog';
import { useToast } from '../components/Toast';
import { Field, Foto, Kepala, LencanaStatus, StatCard } from '../components/ui';
import {
  IconBottle,
  IconPlus,
  IconTag,
  IconSearch,
  IconFilter,
  IconPencil,
  IconLayers,
  IconAlertCircle,
  IconCheck,
  IconX,
  IconInfo,
} from '../components/icons';

/** L-05 Daftar Produk (UC-03). Satu baris mewakili satu aroma pada satu ukuran. */
export default function Produk() {
  const toast = useToast();
  const [data, setData] = useState(null);
  const [cari, setCari] = useState('');
  const [status, setStatus] = useState('');
  const [galat, setGalat] = useState('');
  const [harga, setHarga] = useState(null); // dialog ubah harga per ukuran
  const [memuat, setMemuat] = useState(false);

  const muat = useCallback(() => {
    setMemuat(true);
    api
      .get('/api/produk' + qs({ cari, status }))
      .then((d) => {
        setData(d);
        setGalat('');
      })
      .catch((e) => setGalat(e.message))
      .finally(() => setMemuat(false));
  }, [cari, status]);

  useEffect(() => {
    const t = setTimeout(muat, 200);
    return () => clearTimeout(t);
  }, [muat]);

  const ukuranAda = data
    ? [...new Set(data.produk.map((p) => p.ukuran_ml))].sort((a, b) => a - b)
    : [];
  const r = data?.ringkasan;

  async function simpanHarga() {
    const jual = Number.parseInt(harga.jual, 10);
    if (!harga.ukuran)
      return setHarga({ ...harga, galat: 'Pilih ukuran terlebih dahulu' });
    if (!(jual > 0))
      return setHarga({ ...harga, galat: 'Harga jual harus lebih dari 0' });

    try {
      const d = await api.patch('/api/produk/harga-ukuran', {
        ukuran_ml: Number(harga.ukuran),
        harga_jual: jual,
      });
      toast(`Harga ${d.ukuran_ml} ml diperbarui untuk ${d.produk_terubah} produk`);
      setHarga(null);
      muat();
    } catch (e) {
      setHarga({ ...harga, galat: e.message });
    }
  }

  return (
    <div className="halaman-produk">
      <Kepala
        judul="Daftar Produk"
        sub="Kelola aroma, deskripsi, ukuran, harga jual, harga modal, dan status produk."
        icon={<IconBottle size={22} />}
        kanan={
          <div className="baris-tombol">
            <button
              className="btn garis btn-icon"
              onClick={() => setHarga({ ukuran: '', jual: '', galat: '' })}
            >
              <IconTag size={15} />
              <span>Ubah Harga Ukuran</span>
            </button>
            <Link className="btn btn-icon" to="/produk/baru">
              <IconPlus size={16} />
              <span>+ Tambah Produk</span>
            </Link>
          </div>
        }
      />

      {galat && (
        <div className="kotak-galat">
          <IconAlertCircle size={18} />
          <span>{galat}</span>
        </div>
      )}

      {r && (
        <div className="kisi-kartu">
          <StatCard
            judul="Jenis Aroma"
            nilai={String(r.jenis_aroma).padStart(2, '0')}
            ket="Produk yang terdaftar"
            icon={<IconBottle size={20} />}
            status="gold"
          />
          <StatCard
            judul="Varian Ukuran"
            nilai={String(r.varian_ukuran).padStart(2, '0')}
            ket="Ukuran botol aktif"
            icon={<IconLayers size={20} />}
            status="emerald"
          />
          <StatCard
            judul="Produk Nonaktif"
            nilai={String(r.produk_nonaktif).padStart(2, '0')}
            ket="Tidak ditampilkan untuk transaksi baru"
            icon={<IconAlertCircle size={20} />}
            status={r.produk_nonaktif > 0 ? 'amber' : 'default'}
          />
        </div>
      )}

      <div className="panel">
        <div className="panel-kepala-bar">
          <div className="panel-judul-wrap">
            <span className="panel-icon-circle emas">
              <IconBottle size={18} />
            </span>
            <div>
              <h2>Daftar Produk</h2>
              <p className="redup">
                Kelola aroma, deskripsi, ukuran, harga jual, harga modal, dan status produk.
              </p>
            </div>
          </div>
          {data && (
            <span className="lencana netral">
              Total {data.produk.length} Varian
            </span>
          )}
        </div>

        {/* Toolbar Pencarian & Filter */}
        <div className="bar-alat">
          <div className="input-icon-wrap cari-wrap">
            <IconSearch size={16} className="input-inner-icon" />
            <input
              type="search"
              placeholder="Cari nama aroma..."
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
            <IconFilter size={15} className="input-inner-icon" />
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              aria-label="Filter status produk"
            >
              <option value="">Status: Semua</option>
              <option value="aktif">Aktif</option>
              <option value="nonaktif">Nonaktif</option>
            </select>
          </div>
        </div>

        {data && data.produk.length === 0 && (
          <div className="kosong-elegan">
            <div className="kosong-icon-wrap">
              <IconBottle size={36} />
            </div>
            <h3>Belum ada produk</h3>
            <p>
              {cari || status
                ? 'Tidak ada produk yang cocok dengan kriteria filter Anda.'
                : 'Belum ada produk. Tekan Tambah Produk untuk memulai.'}
            </p>
            {!cari && !status && (
              <Link className="btn btn-icon" to="/produk/baru" style={{ marginTop: 14 }}>
                <IconPlus size={16} />
                <span>+ Tambah Produk</span>
              </Link>
            )}
          </div>
        )}

        {data && data.produk.length > 0 && (
          <>
            <div className="wadah-tabel tampil-desktop">
              <table className="tabel">
                <thead>
                  <tr>
                    <th style={{ width: 110 }}>Kode</th>
                    <th>Aroma</th>
                    <th>Keterangan aroma</th>
                    <th style={{ width: 90 }}>Ukuran</th>
                    <th className="angka">Harga jual</th>
                    <th className="angka">Harga modal</th>
                    <th style={{ width: 110 }}>Status</th>
                    <th style={{ width: 80, textAlign: 'right' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {data.produk.map((p) => (
                    <tr key={p.id_produk}>
                      <td>
                        <span className="kode-pill">{p.kode_produk}</span>
                      </td>
                      <td>
                        <div className="aroma-sel">
                          <Foto src={p.foto} nama={p.nama_aroma} size={42} />
                          <div>
                            <div className="aroma-nama">{p.nama_aroma}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="aroma-deskripsi">
                          {p.deskripsi_aroma ? (
                            <span>{p.deskripsi_aroma}</span>
                          ) : (
                            <span className="teks-redup">-</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className="badge-ml">{p.ukuran_ml} ml</span>
                      </td>
                      <td className="angka">
                        <strong className="teks-emas">{rupiah(p.harga_jual)}</strong>
                      </td>
                      <td className="angka">
                        <span className="teks-redup">{rupiah(p.harga_modal)}</span>
                      </td>
                      <td>
                        <LencanaStatus aktif={p.aktif} />
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <Link
                          className="btn garis kecil btn-icon"
                          to={`/produk/aroma/${p.id_aroma}`}
                          title={`Edit aroma ${p.nama_aroma}`}
                        >
                          <IconPencil size={13} />
                          <span>Edit</span>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Tampilan Ponsel (Mobile Cards) */}
            <div className="tampil-ponsel">
              {data.produk.map((p) => (
                <div className="kartu-item-mobile" key={p.id_produk}>
                  <div className="kartu-item-mobile-header">
                    <div className="aroma-sel">
                      <Foto src={p.foto} nama={p.nama_aroma} size={44} />
                      <div>
                        <div className="aroma-nama">{p.nama_aroma}</div>
                        <div className="kode-pill kecil">{p.kode_produk}</div>
                      </div>
                    </div>
                    <LencanaStatus aktif={p.aktif} />
                  </div>

                  {p.deskripsi_aroma && (
                    <div className="aroma-deskripsi-mobile">
                      "{p.deskripsi_aroma}"
                    </div>
                  )}

                  <div className="grid-detail-mobile">
                    <div className="detail-kolom">
                      <span className="detail-label">Ukuran</span>
                      <strong className="detail-nilai badge-ml">{p.ukuran_ml} ml</strong>
                    </div>
                    <div className="detail-kolom">
                      <span className="detail-label">Harga jual</span>
                      <strong className="detail-nilai teks-emas">{rupiah(p.harga_jual)}</strong>
                    </div>
                    <div className="detail-kolom">
                      <span className="detail-label">Harga modal</span>
                      <span className="detail-nilai teks-redup">{rupiah(p.harga_modal)}</span>
                    </div>
                    <div className="detail-kolom">
                      <span className="detail-label">Stok</span>
                      <strong className="detail-nilai">{angka(p.stok)}</strong>
                    </div>
                  </div>

                  <div className="kartu-item-mobile-footer">
                    <Link
                      className="btn garis kecil btn-icon"
                      to={`/produk/aroma/${p.id_aroma}`}
                    >
                      <IconPencil size={13} />
                      <span>Edit</span>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        <div className="info-catatan-kf">
          <IconInfo size={16} />
          <span>
            Harga jual berlaku sama untuk ukuran yang sama pada setiap aroma. Harga PO ditambahkan Rp5.000 sesuai ketentuan.
          </span>
        </div>
      </div>

      {/* Modal Dialog Ubah Harga Ukuran (KF-05) */}
      {harga && (
        <Dialog
          judul="Ubah Harga Ukuran"
          icon={<IconTag size={20} />}
          onTutup={() => setHarga(null)}
          aksi={
            <>
              <button className="btn garis" onClick={() => setHarga(null)}>
                Batal
              </button>
              <button className="btn btn-icon" onClick={simpanHarga}>
                <IconCheck size={15} />
                <span>Simpan</span>
              </button>
            </>
          }
        >
          <div className="dialog-penjelasan">
            <p>
              Mengubah harga jual satu ukuran untuk semua aroma sekaligus agar tetap seragam (KF-05). Berlaku untuk pesanan baru.
            </p>
          </div>

          {harga.galat && (
            <div className="kotak-galat">
              <IconAlertCircle size={16} />
              <span>{harga.galat}</span>
            </div>
          )}

          <Field label="Ukuran" icon={<IconLayers size={14} />}>
            <select
              value={harga.ukuran}
              onChange={(e) => setHarga({ ...harga, ukuran: e.target.value })}
            >
              <option value="">Pilih ukuran</option>
              {ukuranAda.map((u) => (
                <option key={u} value={u}>
                  {u} ml
                </option>
              ))}
            </select>
          </Field>

          <Field
            label="Harga jual baru (Rp)"
            icon={<IconTag size={14} />}
          >
            <input
              type="number"
              min="1"
              value={harga.jual}
              onChange={(e) => setHarga({ ...harga, jual: e.target.value })}
            />
          </Field>
        </Dialog>
      )}
    </div>
  );
}
