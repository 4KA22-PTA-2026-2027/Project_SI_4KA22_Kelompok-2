import {
  IconBottle,
  IconCheck,
  IconAlertTriangle,
  IconAlertCircle,
  IconSparkles,
} from './icons';

export function Field({ label, galat, petunjuk, icon, children }) {
  return (
    <label className="f">
      <span className="f-label">
        {icon && <span className="f-icon">{icon}</span>}
        <span>{label}</span>
      </span>
      {children}
      {petunjuk && !galat && <div className="petunjuk-teks">{petunjuk}</div>}
      {galat && (
        <div className="pesan-salah">
          <IconAlertCircle size={13} />
          <span>{galat}</span>
        </div>
      )}
    </label>
  );
}

export function Foto({ src, nama, size = 42 }) {
  if (src) {
    return (
      <img
        className="foto-mini"
        src={src}
        alt={nama}
        loading="lazy"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      className="foto-mini placeholder"
      aria-hidden="true"
      style={{ width: size, height: size }}
    >
      <IconBottle size={size * 0.48} className="foto-icon" />
      <span className="foto-inisial">{(nama || '?').slice(0, 1).toUpperCase()}</span>
    </div>
  );
}

const KONDISI = {
  tersedia: {
    kelas: 'hijau',
    teks: 'Tersedia',
    Icon: IconCheck,
  },
  menipis: {
    kelas: 'kuning',
    teks: 'Menipis',
    Icon: IconAlertTriangle,
  },
  habis: {
    kelas: 'merah',
    teks: 'Habis',
    Icon: IconAlertCircle,
  },
};

export function LencanaKondisi({ kondisi }) {
  const cfg = KONDISI[kondisi] || {
    kelas: 'kuning',
    teks: kondisi,
    Icon: IconAlertTriangle,
  };
  const IconComp = cfg.Icon;
  return (
    <span className={`lencana ${cfg.kelas}`}>
      <span className="lencana-dot" />
      <IconComp size={12} />
      <span>{cfg.teks}</span>
    </span>
  );
}

export function LencanaStatus({ aktif }) {
  return (
    <span className={`lencana ${aktif ? 'hijau' : 'merah'}`}>
      <span className="lencana-dot" />
      <span>{aktif ? 'Aktif' : 'Nonaktif'}</span>
    </span>
  );
}

export function Kepala({ judul, sub, icon, kanan, badge }) {
  return (
    <div className="kepala">
      <div className="kepala-info">
        {badge && (
          <div className="kepala-badge">
            <IconSparkles size={12} />
            <span>{badge}</span>
          </div>
        )}
        <div className="kepala-judul-wrap">
          {icon && <span className="kepala-icon">{icon}</span>}
          <h1>{judul}</h1>
        </div>
        {sub && <p className="kepala-sub">{sub}</p>}
      </div>
      {kanan && <div className="kepala-aksi">{kanan}</div>}
    </div>
  );
}

export function StatCard({ judul, nilai, ket, icon, status = 'default' }) {
  return (
    <div className={`kartu kartu-stat kartu-stat-${status}`}>
      <div className="kartu-atas">
        <span className="kartu-judul">{judul}</span>
        {icon && <div className="kartu-icon-wrap">{icon}</div>}
      </div>
      <div className="kartu-nilai">{nilai}</div>
      {ket && <div className="kartu-ket">{ket}</div>}
    </div>
  );
}
