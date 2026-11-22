import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { api } from '../api';
import { useToast } from '../components/Toast';
import { Field, Foto, Kepala } from '../components/ui';
import {
  IconBoxes,
  IconBottle,
  IconSliders,
  IconArrowLeft,
  IconCheck,
  IconAlertCircle,
  IconPlus,
  IconMinus,
  IconArrowDown,
  IconArrowUp,
} from '../components/icons';

/** L-08 Tambah / Koreksi Stok (UC-04). Alasan wajib pada setiap perubahan, stok tidak boleh negatif. */
export default function StokForm() {
  const [params] = useSearchParams();
  const nav = useNavigate();
  const toast = useToast();
  const [daftar, setDaftar] = useState([]);
  const [idProduk, setIdProduk] = useState(params.get('produk') || '');
  const [arah, setArah] = useState('');
  const [jumlah, setJumlah] = useState(1);
  const [alasan, setAlasan] = useState('');
  const [galat, setGalat] = useState({});
  const [pesan, setPesan] = useState('');
  const [proses, setProses] = useState(false);

  useEffect(() => {
    api
      .get('/api/stok')
      .then((d) => setDaftar(d.stok))
      .catch((e) => setPesan(e.message));
  }, []);

  const dipilih = useMemo(
    () => daftar.find((s) => String(s.id_produk) === String(idProduk)),
    [daftar, idProduk]
  );
  const jml = Number.parseInt(jumlah, 10) || 0;
  const sesudah = dipilih
    ? dipilih.stok + (arah === 'tambah' ? jml : arah === 'kurangi' ? -jml : 0)
    : null;

  async function simpan(e) {
    e.preventDefault();
    const g = {};
    if (!idProduk) g.id_produk = 'Pilih produk terlebih dahulu';
    if (!arah) g.arah = 'Pilih tambah atau kurangi stok';
    if (!(jml > 0)) g.jumlah = 'Jumlah harus lebih dari 0';
    else if (arah === 'kurangi' && dipilih && jml > dipilih.stok)
      g.jumlah = 'Stok tidak boleh negatif';
    if (!alasan.trim()) g.alasan = 'Alasan perubahan wajib diisi';

    setGalat(g);
    setPesan('');
    if (Object.keys(g).length) return;

    setProses(true);
    try {
      const d = await api.post('/api/stok/ubah', {
        id_produk: Number(idProduk),
        arah,
        jumlah: jml,
        alasan: alasan.trim(),
      });
      toast(`Stok berhasil diperbarui menjadi ${d.stok_sesudah} botol`);
      nav('/stok');
    } catch (err) {
      setGalat(err.galat || {});
      setPesan(err.message);
    } finally {
      setProses(false);
    }
  }

  return (
    <div className="halaman-stok-form">
      <div className="nav-kembali-bar">
        <Link to="/stok" className="btn-kembali">
          <IconArrowLeft size={16} />
          <span>Kembali ke Stok</span>
        </Link>
      </div>

      <Kepala
        judul="Tambah / Koreksi Stok"
        sub="Pilih tindakan stok dengan jelas. Setiap perubahan wajib memiliki alasan dan tercatat."
        icon={<IconSliders size={22} />}
      />

      <form className="panel form-koreksi-panel" onSubmit={simpan} noValidate>
        {pesan && (
          <div className="kotak-galat" role="alert">
            <IconAlertCircle size={18} />
            <span>{pesan}</span>
          </div>
        )}

        {/* 1. Pilih Produk */}
        <div className="langkah-bagian">
          <div className="langkah-header">
            <span className="langkah-angka">1</span>
            <div className="langkah-teks">
              <h3>Pilih Produk</h3>
            </div>
          </div>

          <Field galat={galat.id_produk} label="Produk" icon={<IconBottle size={14} />}>
            <select
              value={idProduk}
              onChange={(e) => setIdProduk(e.target.value)}
              className={galat.id_produk ? 'salah' : ''}
            >
              <option value="">Pilih produk</option>
              {daftar.map((s) => (
                <option key={s.id_produk} value={s.id_produk}>
                  {s.nama_aroma} • {s.ukuran_ml} ml • {s.kode_produk}
                </option>
              ))}
            </select>
          </Field>

          {dipilih && (
            <div className="kartu-pratinjau-produk">
              <Foto src={dipilih.foto} nama={dipilih.nama_aroma} size={54} />
              <div className="pratinjau-info">
                <div className="pratinjau-nama">{dipilih.nama_aroma}</div>
                <div className="pratinjau-meta">
                  <span className="badge-ml">{dipilih.ukuran_ml} ml</span>
                  <span className="pemisah">•</span>
                  <span>{dipilih.kode_produk}</span>
                  <span className="pemisah">•</span>
                  <span>stok saat ini <strong>{dipilih.stok}</strong></span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 2. Tentukan Perubahan */}
        <div className="langkah-bagian">
          <div className="langkah-header">
            <span className="langkah-angka">2</span>
            <div className="langkah-teks">
              <h3>Tentukan Perubahan</h3>
            </div>
          </div>

          <div className="pilihan-ubah-luxury" role="group" aria-label="Jenis perubahan">
            <button
              type="button"
              className={'tombol-arah tambah' + (arah === 'tambah' ? ' pilih' : '')}
              onClick={() => setArah('tambah')}
            >
              <div className="arah-icon-wrap">
                <IconArrowDown size={20} />
              </div>
              <div className="arah-info">
                <strong>+ TAMBAH STOK</strong>
              </div>
            </button>

            <button
              type="button"
              className={'tombol-arah kurangi' + (arah === 'kurangi' ? ' pilih' : '')}
              onClick={() => setArah('kurangi')}
            >
              <div className="arah-icon-wrap">
                <IconArrowUp size={20} />
              </div>
              <div className="arah-info">
                <strong>− KURANGI STOK</strong>
              </div>
            </button>
          </div>
          {galat.arah && (
            <div className="pesan-salah">
              <IconAlertCircle size={13} />
              <span>{galat.arah}</span>
            </div>
          )}
        </div>

        {/* 3. Masukkan Jumlah */}
        <div className="langkah-bagian">
          <div className="langkah-header">
            <span className="langkah-angka">3</span>
            <div className="langkah-teks">
              <h3>Masukkan Jumlah</h3>
            </div>
          </div>

          <div className="kisi-form" style={{ alignItems: 'flex-start' }}>
            <Field galat={galat.jumlah} label="Jumlah (botol)" icon={<IconBoxes size={14} />}>
              <div className="stepper-luxury">
                <button
                  type="button"
                  aria-label="Kurangi jumlah"
                  onClick={() => setJumlah(Math.max(1, jml - 1))}
                >
                  <IconMinus size={18} />
                </button>
                <input
                  type="number"
                  min="1"
                  value={jumlah}
                  onChange={(e) => setJumlah(e.target.value)}
                  className={galat.jumlah ? 'salah' : ''}
                />
                <button
                  type="button"
                  aria-label="Tambah jumlah"
                  onClick={() => setJumlah(jml + 1)}
                >
                  <IconPlus size={18} />
                </button>
              </div>
            </Field>

            <div className="dua-kartu-proyeksi">
              <div className="kartu-proyeksi">
                <span className="proyeksi-label">Stok sebelum</span>
                <span className="proyeksi-angka">{dipilih ? dipilih.stok : '-'}</span>
              </div>
              <div className="kartu-proyeksi hasil">
                <span className="proyeksi-label">Stok sesudah</span>
                <span
                  className="proyeksi-angka"
                  style={{
                    color:
                      sesudah !== null && sesudah < 0
                        ? 'var(--merah)'
                        : 'var(--hijau)',
                  }}
                >
                  {sesudah === null || !arah ? '-' : sesudah}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 4. Alasan Perubahan */}
        <div className="langkah-bagian">
          <div className="langkah-header">
            <span className="langkah-angka">4</span>
            <div className="langkah-teks">
              <h3>Alasan Perubahan</h3>
            </div>
          </div>

          <Field
            galat={galat.alasan}
            label="Alasan"
          >
            <input
              type="text"
              value={alasan}
              maxLength={255}
              onChange={(e) => setAlasan(e.target.value)}
              placeholder="Contoh: Stok masuk dari pengadaan supplier"
              className={galat.alasan ? 'salah' : ''}
            />
          </Field>
        </div>

        <p className="redup">
          Catatan: stok tidak boleh negatif. Untuk Kurangi, sistem memeriksa stok tersedia sebelum menyimpan.
        </p>

        <div className="panel-aksi-footer">
          <button type="button" className="btn garis btn-icon" onClick={() => nav('/stok')}>
            <IconArrowLeft size={16} />
            <span>Batal</span>
          </button>
          <button className="btn btn-icon" disabled={proses}>
            <IconCheck size={16} />
            <span>{proses ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
