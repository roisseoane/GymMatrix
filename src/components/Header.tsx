import { motion, AnimatePresence } from 'framer-motion';
import { LanguageSelector } from './LanguageSelector';
import { useTranslation } from '../hooks/useTranslation';

interface HeaderProps {
  currentView: 'library' | 'calendar';
  onViewChange: (view: 'library' | 'calendar') => void;
  onOpenDailyLog: () => void;
}

export function Header({ currentView, onViewChange, onOpenDailyLog }: HeaderProps) {
  const { t } = useTranslation();

  // Simple mapping since 'calendar' key might be missing in locales
  const title = currentView === 'library'
    ? t('library')
    : (t('calendar') === 'calendar' ? (t('library') === 'Biblioteca' ? 'Calendario' : 'Calendar') : t('calendar'));

  // Variants for title animation based on view direction
  const variants = {
    enter: (view: 'library' | 'calendar') => ({
      x: view === 'library' ? 50 : -50,
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1
    },
    exit: (view: 'library' | 'calendar') => ({
      x: view === 'library' ? 50 : -50,
      opacity: 0
    })
  };

  return (
    <div className="relative flex justify-between items-center h-full">
      <div className="flex flex-col gap-1 z-10 cursor-grab active:cursor-grabbing touch-none select-none">
        <h1 className="text-3xl font-bold text-text tracking-tight overflow-hidden relative min-w-[150px]">
          <AnimatePresence mode="wait" initial={false} custom={currentView}>
            <motion.div
              key={currentView}
              custom={currentView}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.2 }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.2}
              onDragEnd={(_, info) => {
                const { x } = info.offset;
                if (x > 30) {
                  onViewChange('calendar');
                } else if (x < -30) {
                  onViewChange('library');
                }
              }}
              whileTap={{ scale: 0.95 }}
              className="w-full h-full block"
            >
              {title}
            </motion.div>
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
