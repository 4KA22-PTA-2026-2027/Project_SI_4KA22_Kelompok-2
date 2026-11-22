import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { api, rupiah } from '../api';
import Dialog from '../components/Dialog';
import { useToast } from '../components/Toast';
import { Field, Foto, Kepala } from '../components/ui';
import {
  IconBottle,
  IconLayers,
  IconCamera,
  IconUpload,
  IconPlus,
  IconTrash,
  IconCheck,
  IconArrowLeft,
  IconAlertCircle,
  IconTag,
  IconSliders,
} from '../components/icons';

const UKURAN_UMUM = [3, 8, 15, 20, 30, 50, 100];
const barisBaru = () => ({
  kunci: Math.random().toString(36).slice(2),
  ukuran_ml: '',
  harga_jual: '',
  harga_modal: '',
  batas_stok_minimal: '5',
});

function periksaBaris(b) {
  const g = {};
  const u = Number(b.ukuran_ml),
    j = Number(b.harga_jual),
    m = b.harga_modal === '' ? NaN : Number(b.harga_modal);
  if (!(Number.isInteger(u) && u > 0)) g.ukuran_ml = 'Ukuran harus berupa angka lebih dari 0 (ml)';
  if (!(Number.isInteger(j) && j > 0)) g.harga_jual = 'Harga jual harus lebih dari 0';
  if (!(Number.isInteger(m) && m >= 0)) g.harga_modal = 'Harga modal tidak boleh negatif';
  return g;
}

/** L-06 Form Produk (tambah atau edit aroma) dan Tambah Ukuran (UC-03). */
export default function ProdukForm() {
  const { id } = useParams();
  const edit = Boolean(id);
  const nav = useNavigate();
  const toast = useToast();
  const berkas = useRef(null);
  const [nama, setNama] = useState('');
  const [deskripsi, setDeskripsi] = useState('');
  const [aktif, setAktif] = useState('1');
  const [foto, setFoto] = useState(null); // URL foto tersimpan
  const [pilihFoto, setPilihFoto] = useState(null); // berkas baru yang dipilih
  const [kode, setKode] = useState('');
  const [baris, setBaris] = useState(edit ? [] : [barisBaru()]);
  const [galat, setGalat] = useState({});
  const [pesan, setPesan] = useState('');
  const [proses, setProses] = useState(false);
  const [dialog, setDialog] = useState(null);

  async function muat() {
    const d = await api.get(`/api/aroma/${id}`);
    setNama(d.nama_aroma);
    setDeskripsi(d.deskripsi_aroma || '');
    setAktif(String(d.status_aktif));
    setFoto(d.foto);
    setKode(d.kode_aroma);
    setBaris(
      d.varian.map((v) => ({
        kunci: 'v' + v.id_produk,
        id_produk: v.id_produk,
        kode: v.kode_produk,
        ukuran_ml: String(v.ukuran_ml),
        harga_jual: String(v.harga_jual),
        harga_modal: String(v.harga_modal),
        batas_stok_minimal: String(v.batas_stok_minimal),
        status_aktif: v.status_aktif,
        stok: v.stok,
      }))
    );
  }

  useEffect(() => {
    if (edit) muat().catch((e) => setPesan(e.message));
    /* eslint-disable-next-line */
  }, [id]);

  const ubahBaris = (kunci, kolom, nilai) =>
    setBaris((b) => b.map((x) => (x.kunci === kunci ? { ...x, [kolom]: nilai } : x)));
  const pesanBaris = (i, kolom) => galat[`varian.${i}.${kolom}`];

  async function unggahFoto(idAroma) {
    if (!pilihFoto) return;
    const f = new FormData();
    f.append('foto', pilihFoto);
    await api.unggah(`/api/aroma/${idAroma}/foto`, f);
  }

  async function simpan(e) {
    e.preventDefault();
    const g = {};
    if (!nama.trim()) g.nama_aroma = 'Nama aroma wajib diisi';
    baris.forEach((b, i) => {
      Object.entries(periksaBaris(b)).forEach(([k, v]) => {
        g[`varian.${i}.${k}`] = v;
      });
    });
    if (!edit && baris.length === 0) g.varian = 'Tambahkan minimal satu varian ukuran';
    const ukuran = baris.map((b) => Number(b.ukuran_ml));
    if (new Set(ukuran).size !== ukuran.length)
      g.varian = 'Ukuran tidak boleh kembar untuk aroma yang sama';
    setGalat(g);
    setPesan('');
    if (Object.keys(g).length) {
      setPesan(Object.values(g)[0]);
      return;
    }
    setProses(true);
    try {
      if (!edit) {
        const d = await api.post('/api/aroma', {
          nama_aroma: nama.trim(),
          deskripsi_aroma: deskripsi.trim(),
          status_aktif: Number(aktif),
          varian: baris.map((b) => ({
            ukuran_ml: Number(b.ukuran_ml),
            harga_jual: Number(b.harga_jual),
            harga_modal: Number(b.harga_modal),
            batas_stok_minimal: Number(b.batas_stok_minimal || 5),
          })),
        });
        try {
          await unggahFoto(d.id_aroma);
        } catch (err) {
          toast('Produk tersimpan, tetapi foto gagal: ' + err.message, true);
          nav(`/produk/aroma/${d.id_aroma}`);
          return;
        }
      } else {
        await api.put(`/api/aroma/${id}`, {
          nama_aroma: nama.trim(),
          deskripsi_aroma: deskripsi.trim(),
          status_aktif: Number(aktif),
        });
        for (const b of baris) {
          await api.put(`/api/produk/${b.id_produk}`, {
            harga_jual: Number(b.harga_jual),
            harga_modal: Number(b.harga_modal),
            batas_stok_minimal: Number(b.batas_stok_minimal || 5),
            status_aktif: b.status_aktif,
          });
        }
        await unggahFoto(id);
      }
      toast('Produk berhasil disimpan');
      nav('/produk');
    } catch (err) {
      setGalat(err.galat || {});
      setPesan(err.message);
    } finally {
      setProses(false);
    }
  }

  /* ---- dialog Tambah Ukuran (mode edit) ---- */
  async function simpanUkuran() {
    const b = dialog.baris;
    const g = periksaBaris(b);
    if (Object.keys(g).length) return setDialog({ ...dialog, galat: g });
    try {
      await api.post(`/api/aroma/${id}/varian`, {
        ukuran_ml: Number(b.ukuran_ml),
        harga_jual: Number(b.harga_jual),
        harga_modal: Number(b.harga_modal),
        batas_stok_minimal: Number(b.batas_stok_minimal || 5),
      });
      toast('Ukuran berhasil ditambahkan. Stok awal diisi lewat menu Stok');
      setDialog(null);
      await muat();
    } catch (err) {
      setDialog({
        ...dialog,
        galat: err.galat && Object.keys(err.galat).length ? err.galat : { umum: err.message },
      });
    }
  }

  return (
    <div className="halaman-produk-form">
      <div className="nav-kembali-bar">
        <Link to="/produk" className="btn-kembali">
          <IconArrowLeft size={16} />
          <span>Kembali ke Daftar Produk</span>
        </Link>
      </div>

      <Kepala
        judul={edit ? 'Edit Produk' : 'Form Produk'}
        sub={
          edit
            ? 'Ubah informasi aroma, ukuran, harga, dan foto produk.'
            : 'Lengkapi informasi aroma dan setiap ukuran produk yang dijual.'
        }
        icon={<IconBottle size={22} />}
      />

      <form onSubmit={simpan} noValidate>
        {pesan && (
          <div className="kotak-galat" role="alert">
            <IconAlertCircle size={18} />
            <span>{pesan}</span>
          </div>
        )}

        {/* Informasi Aroma */}
        <div className="panel">
          <div className="panel-kepala-bar">
            <div className="panel-judul-wrap">
              <span className="panel-icon-circle emas">
                <IconBottle size={18} />
              </span>
              <div>
                <h2>Informasi Aroma</h2>
              </div>
            </div>
          </div>

          <div className="kisi-form" style={{ marginTop: 12 }}>
            <Field label="Nama aroma" galat={galat.nama_aroma} icon={<IconBottle size={14} />}>
              <input
                type="text"
                value={nama}
                maxLength={50}
                onChange={(e) => setNama(e.target.value)}
                className={galat.nama_aroma ? 'salah' : ''}
              />
            </Field>

            <Field label="Status produk" icon={<IconSliders size={14} />}>
              <select value={aktif} onChange={(e) => setAktif(e.target.value)}>
                <option value="1">Aktif</option>
                <option value="0">Nonaktif</option>
              </select>
            </Field>

            <Field label="Deskripsi aroma" galat={galat.deskripsi_aroma}>
              <textarea
                rows={3}
                value={deskripsi}
                maxLength={255}
                onChange={(e) => setDeskripsi(e.target.value)}
                placeholder="Contoh: Woody, amber, hangat dengan karakter elegan untuk malam."
              />
            </Field>

            <Field label="Foto produk" galat={galat.foto} icon={<IconCamera size={14} />}>
              <div className="kotak-unggah-foto">
                <Foto
                  src={pilihFoto ? URL.createObjectURL(pilihFoto) : foto}
                  nama={nama}
                  size={54}
                />
                <div className="unggah-detail">
                  <div className="unggah-judul">
                    {pilihFoto ? pilihFoto.name : 'Foto ini tampil pada Produk, Stok, dan Pesanan.'}
                  </div>
                  <div className="unggah-ket">JPG atau PNG, maksimal 2 MB.</div>
                </div>
                <button
                  type="button"
                  className="btn garis kecil btn-icon"
                  onClick={() => berkas.current.click()}
                >
                  <IconUpload size={14} />
                  <span>↑ Upload / Ganti Gambar</span>
                </button>
                <input
                  ref={berkas}
                  type="file"
                  accept="image/jpeg,image/png"
                  hidden
                  onChange={(e) => {
                    const f = e.target.files[0];
                    if (f && f.size > 2 * 1024 * 1024) {
                      setGalat({ ...galat, foto: 'Foto harus JPG atau PNG, maksimal 2 MB' });
                      return;
                    }
                    setGalat({ ...galat, foto: '' });
                    setPilihFoto(f || null);
                  }}
                />
              </div>
            </Field>
          </div>
        </div>

        {/* Varian ukuran dan harga */}
        <div className="panel">
          <div className="panel-kepala-bar">
            <div className="panel-judul-wrap">
              <span className="panel-icon-circle hijau">
                <IconLayers size={18} />
              </span>
              <div>
                <h2>Varian ukuran dan harga</h2>
                <p className="redup">
                  Stok awal diinput lewat menu Stok. Stok minimum menentukan kapan tanda Menipis muncul. Harga jual sama untuk ukuran yang sama pada semua aroma.
                </p>
              </div>
            </div>
          </div>

          {galat.varian && (
            <div className="pesan-salah-blok">
              <IconAlertCircle size={15} />
              <span>{galat.varian}</span>
            </div>
          )}

          <datalist id="ukuran-umum">
            {UKURAN_UMUM.map((u) => (
              <option key={u} value={u} />
            ))}
          </datalist>

          <div className="daftar-varian-wadah">
            {baris.map((b, i) => (
              <div className="kartu-varian-baris" key={b.kunci}>
                <div className="varian-baris-header">
                  <div className="varian-urutan-badge">
                    <IconBottle size={13} />
                    <span>
                      {edit ? `${b.kode} • stok ${b.stok} • ${rupiah(b.harga_jual)}` : `Ukuran ke-${i + 1}`}
                    </span>
                  </div>
                  {edit ? (
                    <label className="switch-aktif-label">
                      <input
                        type="checkbox"
                        checked={b.status_aktif === 1}
                        onChange={(e) =>
                          ubahBaris(b.kunci, 'status_aktif', e.target.checked ? 1 : 0)
                        }
                      />
                      <span>Varian aktif</span>
                    </label>
                  ) : (
                    baris.length > 1 && (
                      <button
                        type="button"
                        className="btn bahaya kecil btn-icon"
                        onClick={() => setBaris(baris.filter((x) => x.kunci !== b.kunci))}
                        title="Hapus baris"
                      >
                        <IconTrash size={13} />
                        <span>Hapus baris</span>
                      </button>
                    )
                  )}
                </div>

                <div className="kisi-form-varian">
                  <Field label="Ukuran (ml)" galat={pesanBaris(i, 'ukuran_ml')}>
                    <input
                      type="number"
                      min="1"
                      list="ukuran-umum"
                      value={b.ukuran_ml}
                      disabled={edit}
                      onChange={(e) => ubahBaris(b.kunci, 'ukuran_ml', e.target.value)}
                      className={pesanBaris(i, 'ukuran_ml') ? 'salah' : ''}
                    />
                  </Field>

                  <Field label="Harga jual (Rp)" galat={pesanBaris(i, 'harga_jual')}>
                    <input
                      type="number"
                      min="1"
                      value={b.harga_jual}
                      onChange={(e) => ubahBaris(b.kunci, 'harga_jual', e.target.value)}
                      className={pesanBaris(i, 'harga_jual') ? 'salah' : ''}
                    />
                  </Field>

                  <Field label="Harga modal (Rp)" galat={pesanBaris(i, 'harga_modal')}>
                    <input
                      type="number"
                      min="0"
                      value={b.harga_modal}
                      onChange={(e) => ubahBaris(b.kunci, 'harga_modal', e.target.value)}
                      className={pesanBaris(i, 'harga_modal') ? 'salah' : ''}
                    />
                  </Field>

                  <Field label="Stok minimum">
                    <input
                      type="number"
                      min="0"
                      value={b.batas_stok_minimal}
                      onChange={(e) => ubahBaris(b.kunci, 'batas_stok_minimal', e.target.value)}
                    />
                  </Field>
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 16 }}>
            <button
              type="button"
              className="btn garis btn-icon"
              onClick={() =>
                edit ? setDialog({ baris: barisBaru(), galat: {} }) : setBaris([...baris, barisBaru()])
              }
            >
              <IconPlus size={15} />
              <span>+ Tambah Ukuran</span>
            </button>
          </div>

          <p className="redup" style={{ marginTop: 12 }}>
            Catatan: harga PO ditambahkan Rp5.000 dari harga normal. Stok dikelola per aroma dan ukuran.
          </p>
        </div>

        {/* Footer Tombol Simpan / Batal */}
        <div className="panel-aksi-footer">
          <button type="button" className="btn garis btn-icon" onClick={() => nav('/produk')}>
            <IconArrowLeft size={16} />
            <span>Batal</span>
          </button>
          <button className="btn btn-icon" disabled={proses}>
            <IconCheck size={16} />
            <span>{proses ? 'Menyimpan...' : edit ? 'Simpan Perubahan' : 'Simpan Produk'}</span>
          </button>
        </div>
      </form>

      {/* Modal Dialog Tambah Ukuran saat mode Edit */}
      {dialog && (
        <Dialog
          judul="Tambah Ukuran"
          icon={<IconLayers size={20} />}
          onTutup={() => setDialog(null)}
          aksi={
            <>
              <button className="btn garis" onClick={() => setDialog(null)}>
                Batal
              </button>
              <button className="btn btn-icon" onClick={simpanUkuran}>
                <IconCheck size={15} />
                <span>Simpan Ukuran</span>
              </button>
            </>
          }
        >
          <div className="dialog-penjelasan">
            <p>
              Ukuran tidak boleh duplikat untuk aroma yang sama. Harga dan stok harus bernilai valid; stok awal diinput melalui menu Stok.
            </p>
          </div>

          {dialog.galat.umum && (
            <div className="kotak-galat">
              <IconAlertCircle size={16} />
              <span>{dialog.galat.umum}</span>
            </div>
          )}

          {[
            ['ukuran_ml', 'Ukuran (ml)', 'Contoh: 150', <IconLayers size={14} />],
            ['harga_jual', 'Harga jual (Rp)', 'Contoh: 195000', <IconTag size={14} />],
            ['harga_modal', 'Harga modal (Rp)', 'Contoh: 98000', <IconTag size={14} />],
            ['batas_stok_minimal', 'Stok minimum', 'Contoh: 3', <IconSliders size={14} />],
          ].map(([k, label, ph, iconElem]) => (
            <Field key={k} label={label} galat={dialog.galat[k]} icon={iconElem}>
              <input
                type="number"
                min="0"
                placeholder={ph}
                value={dialog.baris[k]}
                list={k === 'ukuran_ml' ? 'ukuran-umum' : undefined}
                onChange={(e) =>
                  setDialog({
                    ...dialog,
                    baris: { ...dialog.baris, [k]: e.target.value },
                  })
                }
              />
            </Field>
          ))}
          <datalist id="ukuran-umum">
            {UKURAN_UMUM.map((u) => (
              <option key={u} value={u} />
            ))}
          </datalist>
        </Dialog>
      )}
    </div>
  );
}
