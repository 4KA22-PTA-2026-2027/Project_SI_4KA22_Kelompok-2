import { IconX } from './icons';

export default function Dialog({ judul, children, aksi, onTutup, icon }) {
  return (
    <div className="latar" onClick={onTutup} role="presentation">
      <div
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-label={judul}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="dialog-header">
          <div className="dialog-header-title">
            {icon && <span className="dialog-icon">{icon}</span>}
            <h3>{judul}</h3>
          </div>
          <button
            type="button"
            className="dialog-close-btn"
            onClick={onTutup}
            aria-label="Tutup dialog"
          >
            <IconX size={18} />
          </button>
        </div>
        <div className="dialog-body">{children}</div>
        {aksi && <div className="aksi">{aksi}</div>}
      </div>
    </div>
  );
}
