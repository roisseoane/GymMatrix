import { motion } from 'framer-motion';
import { useTranslation } from '../hooks/useTranslation';
import type { Language } from '../locales';

export function LanguageSelector() {
  const { language, setLanguage } = useTranslation();

  const languages: { code: Language; label: string; Svg: React.FC }[] = [
    {
      code: 'ca',
      label: 'Català',
      Svg: () => (
        <svg viewBox="0 0 60 40" className="w-full h-full object-cover">
          <rect width="60" height="40" fill="#FCDD09" />
          <rect y="5" width="60" height="4" fill="#DA121A" />
          <rect y="14" width="60" height="4" fill="#DA121A" />
          <rect y="23" width="60" height="4" fill="#DA121A" />
          <rect y="32" width="60" height="4" fill="#DA121A" />
        </svg>
      )
    },
    {
      code: 'es',
      label: 'Español',
      Svg: () => (
        <svg viewBox="0 0 60 40" className="w-full h-full object-cover">
          <rect width="60" height="40" fill="#AA151B" />
          <rect y="10" width="60" height="20" fill="#F1BF00" />
        </svg>
      )
    },
    {
      code: 'en',
      label: 'English',
      Svg: () => (
        <svg viewBox="0 0 60 30" className="w-full h-full object-cover">
           <clipPath id="s">
		<path d="M0,0 v30 h60 v-30 z"/>
           </clipPath>
           <clipPath id="t">
		<path d="M30,15 h30 v15 z M0,0 h30 v15 z"/>
           </clipPath>
           <g clipPath="url(#s)">
		<path d="M0,0 v30 h60 v-30 z" fill="#012169"/>
		<path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6"/>
		<path d="M0,0 L60,30 M60,0 L0,30" clipPath="url(#t)" stroke="#C8102E" strokeWidth="4"/>
		<path d="M30,0 v30 M0,15 h60" stroke="#fff" strokeWidth="10"/>
		<path d="M30,0 v30 M0,15 h60" stroke="#C8102E" strokeWidth="6"/>
           </g>
        </svg>
      )
    }
  ];

  return (
    <div className="flex p-1 bg-surface/50 backdrop-blur-md rounded-lg border border-white/5 shadow-inner">
      {languages.map((lang) => (
        <button
          key={lang.code}
          onClick={() => setLanguage(lang.code)}
          className={`
            relative w-8 h-6 md:w-10 md:h-7 mx-0.5 rounded overflow-hidden transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-primary/50
            ${language === lang.code ? 'ring-2 ring-primary shadow-lg scale-105 z-10' : 'opacity-60 hover:opacity-100 hover:scale-110'}
          `}
          title={lang.label}
          aria-label={`Select ${lang.label}`}
        >
          <lang.Svg />
          {language === lang.code && (
            <motion.div
              layoutId="active-lang"
              className="absolute inset-0 bg-primary/10"
              initial={false}
              transition={{ duration: 0.2 }}
            />
          )}
        </button>
      ))}
    </div>
  );
}
