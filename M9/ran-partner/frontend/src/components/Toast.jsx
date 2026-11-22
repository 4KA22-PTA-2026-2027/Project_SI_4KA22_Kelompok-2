import { createContext, useCallback, useContext, useState } from 'react';
import { IconCheckCircle, IconAlertCircle } from './icons';

const Ctx = createContext(() => {});
export const useToast = () => useContext(Ctx);

export function ToastProvider({ children }) {
  const [t, setT] = useState(null);
  const tampil = useCallback((pesan, galat = false) => {
    setT({ pesan, galat });
    setTimeout(() => setT(null), 4000);
  }, []);

  return (
    <Ctx.Provider value={tampil}>
      {children}
      {t && (
        <div className={'toast' + (t.galat ? ' galat' : '')} role="status">
          <span className="toast-icon">
            {t.galat ? <IconAlertCircle size={18} /> : <IconCheckCircle size={18} />}
          </span>
          <span className="toast-pesan">{t.pesan}</span>
        </div>
      )}
    </Ctx.Provider>
  );
}
