import { useContext } from 'react';
import { translations } from '../locales';
import { LanguageContext } from '../context/LanguageContext';

export type TranslationKey = keyof typeof translations.ca;

export function useTranslation() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }

  const { language, setLanguage } = context;

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
