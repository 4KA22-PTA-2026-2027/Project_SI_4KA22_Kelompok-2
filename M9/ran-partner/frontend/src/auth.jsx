import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, ambilToken, hapusToken, pasangPenangkapSesi, simpanToken } from './api';

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }) {
  const [pengguna, setPengguna] = useState(null);
  const [siap, setSiap] = useState(false);
  const [info, setInfo] = useState('');

  const keluarLokal = useCallback((pesan) => {
    hapusToken(); setPengguna(null); if (pesan) setInfo(pesan);
  }, []);

  useEffect(() => {
    pasangPenangkapSesi((pesan) => keluarLokal(pesan || 'Sesi berakhir, silakan masuk kembali'));
    if (!ambilToken()) { setSiap(true); return; }
    api.get('/api/auth/saya')
      .then((d) => setPengguna(d.pengguna))
      .catch(() => hapusToken())
      .finally(() => setSiap(true));
  }, [keluarLokal]);

  const masuk = useCallback(async (nama_pengguna, kata_sandi, portal) => {
    const d = await api.post('/api/auth/login', { nama_pengguna, kata_sandi, portal });
    simpanToken(d.token);
    setInfo('');
    setPengguna({ id: d.pengguna.id, nama: d.pengguna.nama, namaPengguna: d.pengguna.nama_pengguna, peran: d.pengguna.peran });
    return d.pengguna;
  }, []);

  const keluar = useCallback(async () => {
    try { await api.post('/api/auth/logout'); } catch { /* sesi diakhiri di klien */ }
    keluarLokal();
  }, [keluarLokal]);

  const nilai = useMemo(() => ({ pengguna, siap, masuk, keluar, info, bersihkanInfo: () => setInfo('') }), [pengguna, siap, masuk, keluar, info]);
  return <Ctx.Provider value={nilai}>{children}</Ctx.Provider>;
}
