import { LanguageSelector } from './LanguageSelector';
import { useTranslation } from '../hooks/useTranslation';

interface HeaderProps {
  title?: string;
  onOpenDailyLog?: () => void;
}

export function Header({ title, onOpenDailyLog }: HeaderProps) {
  const { t } = useTranslation();

  return (
    <div className="relative flex justify-between items-center mb-6">
      <div className="flex flex-col gap-1 z-10">
        <h1 className="text-3xl font-bold text-text tracking-tight">
            {title || t('library')}
        </h1>
      </div>

      <div className="flex items-center gap-4 z-10">
        {onOpenDailyLog && (
            <button
                onClick={onOpenDailyLog}
                className="p-2 rounded-xl bg-white/5 border border-white/10 text-muted hover:text-white hover:bg-white/10 transition-colors"
                aria-label={t('todays_session')}
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            </button>
        )}
        <LanguageSelector />
      </div>
    </div>
  );
}
