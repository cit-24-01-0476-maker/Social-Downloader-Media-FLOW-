'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Locale, translations } from './translations';

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');

  // Load language preference from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem('mediaflow_locale') as Locale;
    if (saved === 'en' || saved === 'si') {
      setLocaleState(saved);
    }
  }, []);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem('mediaflow_locale', newLocale);
  };

  // Safe dot-notation translation resolver (e.g., t('hero.title'))
  const t = (path: string): string => {
    const keys = path.split('.');
    let result: any = translations[locale];

    for (const key of keys) {
      if (result && key in result) {
        result = result[key];
      } else {
        // Fallback to English if key is missing in Sri Lankan Sinhala dictionary
        let enFallback: any = translations['en'];
        for (const fallbackKey of keys) {
          if (enFallback && fallbackKey in enFallback) {
            enFallback = enFallback[fallbackKey];
          } else {
            return path; // Return raw path as ultimate fallback
          }
        }
        return enFallback;
      }
    }

    return typeof result === 'string' ? result : path;
  };

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
