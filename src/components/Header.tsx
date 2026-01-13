import { LanguageSelector } from './LanguageSelector';
import { useTranslation } from '../hooks/useTranslation';
import { AutomaticRestTimer } from './AutomaticRestTimer';
import { GlobalTimer } from './GlobalTimer';
import type { SessionState } from '../types/models';

interface HeaderProps {
  title?: string;
  lastLogTimestamp?: number | null;
  session?: SessionState;
  onSessionUpdate?: (newSession: SessionState) => void;
}

export function Header({ title, lastLogTimestamp, session, onSessionUpdate }: HeaderProps) {
  const { t } = useTranslation();

  return (
    <div className="flex justify-between items-center mb-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold text-text tracking-tight">
            {title || t('library')}
        </h1>
        {lastLogTimestamp && (
             <div className="md:hidden">
                <AutomaticRestTimer lastLogTimestamp={lastLogTimestamp} />
             </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        {session && onSessionUpdate && (
          <div className="mr-2">
            <GlobalTimer session={session} onUpdate={onSessionUpdate} />
          </div>
        )}
        {lastLogTimestamp && (
            <div className="hidden md:block">
                <AutomaticRestTimer lastLogTimestamp={lastLogTimestamp} />
            </div>
        )}
        <LanguageSelector />
      </div>
    </div>
  );
}
