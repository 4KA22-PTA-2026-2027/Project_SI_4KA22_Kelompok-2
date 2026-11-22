import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth';
import { ToastProvider } from './components/Toast';
import Layout, { MENU } from './components/Layout';
import Login from './pages/Login';
import Beranda from './pages/Beranda';
import Produk from './pages/Produk';
import ProdukForm from './pages/ProdukForm';
import Stok from './pages/Stok';
import StokForm from './pages/StokForm';
import Segera from './pages/Segera';

function Terlindungi() {
  const { pengguna, siap } = useAuth();
  if (!siap) return <div className="kosong" style={{ padding: 60 }}>Memuat...</div>;
  if (!pengguna) return <Navigate to="/login" replace />;
  return <Layout />;
}
/** Rute khusus pemilik. Pemeriksaan sebenarnya tetap di backend (KNF-02), ini hanya merapikan antarmuka. */
function KhususPemilik({ children }) {
  const { pengguna } = useAuth();
  return pengguna.peran === 'pemilik' ? children : <Navigate to="/beranda" replace />;
}

export default function App() {
  const segera = [...new Set(Object.values(MENU).flat().filter((m) => !m.siap).map((m) => m.to))];
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            <Route path="/login" element={<Login portal="kasir" />} />
            <Route path="/login-pemilik" element={<Login portal="pemilik" />} />
            <Route element={<Terlindungi />}>
              <Route path="/beranda" element={<Beranda />} />
              <Route path="/stok" element={<Stok />} />
              <Route path="/stok/ubah" element={<KhususPemilik><StokForm /></KhususPemilik>} />
              <Route path="/produk" element={<KhususPemilik><Produk /></KhususPemilik>} />
              <Route path="/produk/baru" element={<KhususPemilik><ProdukForm /></KhususPemilik>} />
              <Route path="/produk/aroma/:id" element={<KhususPemilik><ProdukForm /></KhususPemilik>} />
              {segera.map((p) => <Route key={p} path={p} element={<Segera />} />)}
            </Route>
            <Route path="*" element={<Navigate to="/beranda" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
