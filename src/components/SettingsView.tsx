import { useState } from 'react';
import { User, Bell, Shield, Globe, HelpCircle, LogOut, ChevronRight, RefreshCcw, Lock, Check, Coins } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../i18n/LanguageContext';
import { Language, currencyOptions, CurrencyCode } from '../i18n/translations';
import { sanitizeEmail, sanitizeText } from '../utils/security';

interface SettingsViewProps {
  onReset: () => void;
}

const languages: Language[] = ['Français', 'English', 'Español', 'Deutsch'];

const PROFILE_KEY = 'infinance_profile';

export default function SettingsView({ onReset }: SettingsViewProps) {
  const { t, language, setLanguage, currency, setCurrency } = useLanguage();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [pinCode, setPinCode] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  const [profile, setProfile] = useState(() => {
    try {
      const stored = localStorage.getItem(PROFILE_KEY);
      if (stored) return JSON.parse(stored);
    } catch {}
    return { name: 'Mon Espace', email: 'utilisateur@email.com' };
  });
  const [editName, setEditName] = useState(profile.name);
  const [editEmail, setEditEmail] = useState(profile.email);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const handleSetPin = () => {
    if (pinCode.length === 4) {
      localStorage.setItem('infinance_pin', pinCode);
      showToast(t('pinSaved'));
      setShowPinModal(false);
      setPinCode('');
    }
  };

  const handleProfileSave = () => {
    const newProfile = {
      name: sanitizeText(editName || profile.name, 60),
      email: sanitizeEmail(editEmail || profile.email, 120),
    };
    setProfile(newProfile);
    localStorage.setItem(PROFILE_KEY, JSON.stringify(newProfile));
    showToast(t('dataUpdated'));
    setShowProfileModal(false);
  };

  const openProfileModal = () => {
    setEditName(profile.name);
    setEditEmail(profile.email);
    setShowProfileModal(true);
  };

  const sections = [
    {
      title: t('account'),
      items: [
        { icon: User, label: t('profile'), subtitle: profile.name, action: openProfileModal },
        {
          icon: Bell,
          label: t('notifications'),
          subtitle: notificationsEnabled ? t('enabled') : t('disabled'),
          toggle: true,
          toggled: notificationsEnabled,
          action: () => setNotificationsEnabled(p => !p),
        },
        { icon: Shield, label: t('security'), subtitle: t('pinCode'), action: () => setShowPinModal(true) },
      ],
    },
    {
      title: t('preferences'),
      items: [
        { icon: Globe, label: t('language'), subtitle: language, action: () => setShowLanguageModal(true) },
        { icon: Coins, label: t('currency'), subtitle: currency, action: () => setShowCurrencyModal(true) },
        { icon: RefreshCcw, label: t('reset'), subtitle: t('resetDescription'), action: onReset },
      ],
    },
    {
      title: t('support'),
      items: [
        { icon: HelpCircle, label: t('helpFaq'), subtitle: t('helpCenter'), action: () => {} },
      ],
    },
  ];

  return (
    <div className="pb-24">
      <div className="px-5 pt-8 pb-6">
        <div className="mb-6">
          <p className="text-zinc-400 text-xs uppercase tracking-widest mb-1">{t('parameters')}</p>
          <h1 className="text-zinc-900 font-medium text-lg">{t('settings')}</h1>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-zinc-900 rounded-xl p-5 mb-6 cursor-pointer"
          onClick={openProfileModal}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center text-xl">
              👤
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium text-sm truncate">{profile.name}</p>
              <p className="text-zinc-400 text-xs truncate">{profile.email}</p>
            </div>
            <ChevronRight size={16} className="text-zinc-500" />
          </div>
        </motion.div>
      </div>

      <div className="px-5">
        {sections.map((section, si) => (
          <div key={section.title} className="mb-6">
            <p className="text-zinc-400 text-[10px] uppercase tracking-widest mb-3">{section.title}</p>
            <div className="bg-white rounded-xl border border-zinc-100 overflow-hidden divide-y divide-zinc-50">
              {section.items.map((item, ii) => (
                <motion.button
                  key={item.label}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: (si * 3 + ii) * 0.04 }}
                  onClick={item.action}
                  className="w-full flex items-center gap-3 p-4 hover:bg-zinc-50 transition-colors text-left"
                >
                  <div className="w-9 h-9 rounded-lg bg-zinc-50 flex items-center justify-center">
                    <item.icon size={16} className="text-zinc-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-zinc-900 font-medium text-sm">{item.label}</p>
                    <p className="text-zinc-400 text-xs truncate">{item.subtitle}</p>
                  </div>
                  {'toggle' in item && item.toggle ? (
                    <div
                      className={`w-10 h-5 rounded-full p-0.5 transition-colors flex items-center ${
                        item.toggled ? 'bg-zinc-900' : 'bg-zinc-200'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${
                          item.toggled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </div>
                  ) : (
                    <ChevronRight size={14} className="text-zinc-300" />
                  )}
                </motion.button>
              ))}
            </div>
          </div>
        ))}

        <motion.button
          whileTap={{ scale: 0.98 }}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-zinc-50 border border-zinc-200 text-zinc-600 font-medium text-sm mb-6"
        >
          <LogOut size={14} />
          {t('logout')}
        </motion.button>

        <p className="text-center text-zinc-300 text-[10px] uppercase tracking-widest">InFinance v1.0</p>
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed bottom-28 left-1/2 -translate-x-1/2 z-[60] bg-zinc-900 text-white text-xs px-4 py-2.5 rounded-full shadow-lg flex items-center gap-2"
          >
            <Check size={12} />
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Language Modal */}
      <AnimatePresence>
        {showLanguageModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/50"
            onClick={() => setShowLanguageModal(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-full max-w-md bg-white rounded-t-2xl p-6 pb-28"
              onClick={e => e.stopPropagation()}
            >
              <div className="w-10 h-1 bg-zinc-200 rounded-full mx-auto mb-6" />
              <h3 className="text-zinc-900 font-medium text-base mb-5">{t('chooseLanguage')}</h3>
              <div className="space-y-2">
                {languages.map(lang => (
                  <button
                    key={lang}
                    onClick={() => {
                      setLanguage(lang);
                      setShowLanguageModal(false);
                    }}
                    className={`w-full p-4 rounded-xl text-left transition-colors flex items-center justify-between ${
                      language === lang ? 'bg-zinc-900 text-white' : 'bg-zinc-50 text-zinc-700'
                    }`}
                  >
                    <span className="text-sm font-medium">{lang}</span>
                    {language === lang && <Check size={16} />}
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Currency Modal */}
      <AnimatePresence>
        {showCurrencyModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/50"
            onClick={() => setShowCurrencyModal(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="max-h-[80vh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-white p-6 pb-28"
              onClick={e => e.stopPropagation()}
            >
              <div className="mx-auto mb-6 h-1 w-10 rounded-full bg-zinc-200" />
              <h3 className="mb-5 text-base font-medium text-zinc-900">{t('chooseCurrency')}</h3>
              <div className="space-y-2">
                {currencyOptions.map(option => (
                  <button
                    key={option.code}
                    onClick={() => {
                      setCurrency(option.code as CurrencyCode);
                      setShowCurrencyModal(false);
                    }}
                    className={`flex w-full items-center justify-between rounded-xl p-4 text-left transition-colors ${
                      currency === option.code ? 'bg-zinc-900 text-white' : 'bg-zinc-50 text-zinc-700'
                    }`}
                  >
                    <span>
                      <span className="block text-sm font-medium">{option.code}</span>
                      <span className={`block text-xs ${currency === option.code ? 'text-zinc-300' : 'text-zinc-400'}`}>
                        {option.label} · {option.symbol}
                      </span>
                    </span>
                    {currency === option.code && <Check size={16} />}
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PIN Modal */}
      <AnimatePresence>
        {showPinModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/50"
            onClick={() => setShowPinModal(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-full max-w-md bg-white rounded-t-2xl p-6 pb-28"
              onClick={e => e.stopPropagation()}
            >
              <div className="w-10 h-1 bg-zinc-200 rounded-full mx-auto mb-6" />
              <div className="flex items-center gap-3 mb-3">
                <Lock size={20} className="text-zinc-700" />
                <h3 className="text-zinc-900 font-medium text-base">{t('definePin')}</h3>
              </div>
              <p className="text-zinc-500 text-sm mb-5">{t('pinDescription')}</p>
              <input
                type="password"
                inputMode="numeric"
                maxLength={4}
                placeholder="••••"
                value={pinCode}
                onChange={e => setPinCode(e.target.value.replace(/\D/g, ''))}
                className="w-full bg-zinc-50 rounded-xl px-4 py-4 text-center text-2xl tracking-[0.5em] text-zinc-900 mb-5 border border-zinc-200 focus:outline-none focus:border-zinc-400"
                autoFocus
              />
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={handleSetPin}
                disabled={pinCode.length !== 4}
                className="w-full bg-zinc-900 disabled:bg-zinc-300 text-white py-3.5 rounded-xl font-medium text-sm"
              >
                {t('savePin')}
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Profile Modal */}
      <AnimatePresence>
        {showProfileModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/50"
            onClick={() => setShowProfileModal(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-full max-w-md bg-white rounded-t-2xl p-6 pb-28"
              onClick={e => e.stopPropagation()}
            >
              <div className="w-10 h-1 bg-zinc-200 rounded-full mx-auto mb-6" />
              <h3 className="text-zinc-900 font-medium text-base mb-5">{t('editProfile')}</h3>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="text-zinc-500 text-xs font-medium mb-1.5 block">{t('name')}</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    className="w-full bg-zinc-50 rounded-xl px-4 py-3 text-zinc-900 text-sm border border-zinc-200 focus:outline-none focus:border-zinc-400"
                  />
                </div>
                <div>
                  <label className="text-zinc-500 text-xs font-medium mb-1.5 block">{t('email')}</label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={e => setEditEmail(e.target.value)}
                    className="w-full bg-zinc-50 rounded-xl px-4 py-3 text-zinc-900 text-sm border border-zinc-200 focus:outline-none focus:border-zinc-400"
                  />
                </div>
              </div>

              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={handleProfileSave}
                className="w-full bg-zinc-900 text-white py-3.5 rounded-xl font-medium text-sm mb-3"
              >
                {t('save')}
              </motion.button>
              <button
                onClick={() => setShowProfileModal(false)}
                className="w-full text-zinc-500 text-sm py-2"
              >
                {t('cancel')}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
