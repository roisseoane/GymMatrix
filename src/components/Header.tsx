import { motion, AnimatePresence } from 'framer-motion';
import { LanguageSelector } from './LanguageSelector';
import { useTranslation } from '../hooks/useTranslation';

interface HeaderProps {
  currentView: 'library' | 'calendar';
  onNavigate: (view: 'library' | 'calendar') => void;
  onOpenDailyLog: () => void;
}

export function Header({ currentView, onNavigate, onOpenDailyLog }: HeaderProps) {
  const { t } = useTranslation();

  // Simple mapping since 'calendar' key might be missing in locales
  const title = currentView === 'library'
    ? t('library')
    : (t('calendar') === 'calendar' ? (t('library') === 'Biblioteca' ? 'Calendario' : 'Calendar') : t('calendar'));

  return (
    <div className="relative flex justify-between items-center h-full">
      <div className="flex flex-col gap-1 z-10 cursor-grab active:cursor-grabbing touch-none select-none">
        <h1 className="text-3xl font-bold text-text tracking-tight overflow-hidden relative min-w-[150px]">
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={currentView}
              className="block"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              drag="x"
              dragConstraints={{ left: 0, right: 100 }}
              dragElastic={0.1}
              onDragEnd={(_, info) => {
                // Trigger only if dragging right > 50px AND currently in library
                if (info.offset.x > 50 && currentView === 'library') {
                  onNavigate('calendar');
                }
              }}
              whileTap={{ scale: 0.95 }}
            >
              {title}
            </motion.span>
          </AnimatePresence>
        </h1>
      </div>

      <div className="flex items-center gap-4 z-10">
        <button
            onClick={onOpenDailyLog}
            className="p-2 rounded-xl bg-white/5 border border-white/10 text-muted hover:text-white hover:bg-white/10 transition-colors"
            aria-label={t('todays_session')}
        >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        </button>
        <LanguageSelector />
      </div>
    </div>
  );
}
