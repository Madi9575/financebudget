import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Fingerprint, Delete } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

interface LockScreenProps {
  onUnlock: () => void;
}

const PIN_KEY = 'infinance_pin';

export default function LockScreen({ onUnlock }: LockScreenProps) {
  const { t } = useLanguage();
  const [entered, setEntered] = useState('');
  const [error, setError] = useState(false);
  const [shaking, setShaking] = useState(false);

  const storedPin = localStorage.getItem(PIN_KEY);

  const handleDigit = useCallback((digit: string) => {
    setError(false);
    const next = entered + digit;
    if (next.length === 4) {
      if (next === storedPin) {
        onUnlock();
      } else {
        setShaking(true);
        setError(true);
        setTimeout(() => { setEntered(''); setShaking(false); }, 600);
      }
    } else {
      setEntered(next);
    }
  }, [entered, storedPin, onUnlock]);

  const handleDelete = useCallback(() => {
    setEntered(prev => prev.slice(0, -1));
    setError(false);
  }, []);

  const handleBiometrics = useCallback(async () => {
    if (!('credentials' in navigator)) {
      onUnlock();
      return;
    }
    try {
      const cred = await navigator.credentials.get({
        publicKey: {
          challenge: new Uint8Array(32),
          timeout: 60000,
          rpId: window.location.hostname,
          userVerification: 'required',
          allowCredentials: [],
        },
      } as CredentialRequestOptions);
      if (cred) onUnlock();
    } catch {
      onUnlock();
    }
  }, [onUnlock]);

  const digits = ['1','2','3','4','5','6','7','8','9','bio','0','del'];

  return (
    <div className="min-h-screen bg-zinc-50 flex justify-center">
      <div className="w-full max-w-md flex flex-col items-center justify-center px-10 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="w-16 h-16 rounded-2xl bg-zinc-900 flex items-center justify-center mx-auto mb-5">
            <span className="text-white text-2xl font-light">$</span>
          </div>
          <h1 className="text-zinc-900 font-medium text-lg mb-1">{t('welcomeBack')}</h1>
          <p className="text-zinc-400 text-sm">{t('enterPin')}</p>
        </motion.div>

        <motion.div
          animate={shaking ? { x: [-12, 12, -8, 8, -4, 4, 0] } : {}}
          transition={{ duration: 0.5 }}
          className="flex gap-4 mb-5"
        >
          {[0,1,2,3].map(i => (
            <div
              key={i}
              className={`w-3.5 h-3.5 rounded-full transition-all ${
                error
                  ? 'bg-rose-500'
                  : entered.length > i
                  ? 'bg-zinc-900'
                  : 'bg-zinc-200'
              }`}
            />
          ))}
        </motion.div>

        {error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-rose-500 text-xs mb-4"
          >
            {t('wrongPin')}
          </motion.p>
        )}

        <div className="grid grid-cols-3 gap-4 mt-8 w-full max-w-[260px]">
          {digits.map(d => {
            if (d === 'bio') {
              return (
                <button
                  key={d}
                  onClick={handleBiometrics}
                  className="w-full aspect-square rounded-2xl bg-white border border-zinc-100 flex items-center justify-center"
                >
                  <Fingerprint size={22} className="text-zinc-500" />
                </button>
              );
            }
            if (d === 'del') {
              return (
                <button
                  key={d}
                  onClick={handleDelete}
                  className="w-full aspect-square rounded-2xl flex items-center justify-center"
                >
                  <Delete size={20} className="text-zinc-400" />
                </button>
              );
            }
            return (
              <motion.button
                key={d}
                whileTap={{ scale: 0.9, backgroundColor: '#e4e4e7' }}
                onClick={() => handleDigit(d)}
                className="w-full aspect-square rounded-2xl bg-white border border-zinc-100 flex items-center justify-center text-zinc-900 text-xl font-medium shadow-sm"
              >
                {d}
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
