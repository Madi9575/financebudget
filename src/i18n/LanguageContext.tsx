import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Language, translations, TranslationKey, localeMap, CurrencyCode, currencyOptions } from './translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
  locale: string;
  currency: CurrencyCode;
  currencySymbol: string;
  setCurrency: (currency: CurrencyCode) => void;
  formatMoney: (amount: number, options?: Intl.NumberFormatOptions) => string;
  formatDate: (date: string | Date, options?: Intl.DateTimeFormatOptions) => string;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

const STORAGE_KEY = 'ego_language';
const CURRENCY_KEY = 'ego_currency';

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Language | null;
    return stored && stored in translations ? stored : 'Français';
  });
  const [currency, setCurrencyState] = useState<CurrencyCode>(() => {
    const stored = localStorage.getItem(CURRENCY_KEY) as CurrencyCode | null;
    return stored && currencyOptions.some(option => option.code === stored) ? stored : 'EUR';
  });

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem(STORAGE_KEY, lang);
  }, []);

  const setCurrency = useCallback((nextCurrency: CurrencyCode) => {
    setCurrencyState(nextCurrency);
    localStorage.setItem(CURRENCY_KEY, nextCurrency);
  }, []);

  const t = useCallback(
    (key: TranslationKey): string => {
      const value = translations[language][key];
      return typeof value === 'string' ? value : (value as unknown as string);
    },
    [language]
  );

  const locale = localeMap[language];
  const currencySymbol = currencyOptions.find(option => option.code === currency)?.symbol ?? currency;

  const formatMoney = useCallback(
    (amount: number, options?: Intl.NumberFormatOptions) => {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        maximumFractionDigits: Number.isInteger(amount) ? 0 : 2,
        ...options,
      }).format(amount);
    },
    [currency, locale]
  );

  const formatDate = useCallback(
    (date: string | Date, options?: Intl.DateTimeFormatOptions) => {
      const d = typeof date === 'string' ? new Date(date) : date;
      return d.toLocaleDateString(locale, options);
    },
    [locale]
  );

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, locale, currency, currencySymbol, setCurrency, formatMoney, formatDate }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
