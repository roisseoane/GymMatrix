import { useState } from 'react';
import { translations } from '../locales';
import type { Language } from '../locales';

const STORAGE_KEY = 'app_language';

export type TranslationKey = keyof typeof translations.ca;

export function useTranslation() {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'ca' || saved === 'es' || saved === 'en') {
      return saved as Language;
    }
    return 'ca'; // Default
  });

  const setLanguage = (lang: Language) => {
    localStorage.setItem(STORAGE_KEY, lang);
    setLanguageState(lang);
  };

  const t = (key: string): string => {
    // We cast key to any because dynamic keys from exercise names might not match TranslationKey perfectly in strict typing scenarios
    // without complex generics, and we want to allow string pass-through.
    const langDict = translations[language] as Record<string, string>;
    const value = langDict[key];
    if (value) return value;

    // Fallback to ca
    const fallbackDict = translations['ca'] as Record<string, string>;
    const fallback = fallbackDict[key];
    if (fallback) return fallback;

    return key;
  };

  return { t, language, setLanguage };
}
