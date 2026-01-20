import { LanguageSelector } from './LanguageSelector';
import { useTranslation } from '../hooks/useTranslation';

interface HeaderProps {
  title?: string;
}

export function Header({ title }: HeaderProps) {
  const { t } = useTranslation();

  return (
    <div className="relative flex justify-between items-center mb-6">
      <div className="flex flex-col gap-1 z-10">
        <h1 className="text-3xl font-bold text-text tracking-tight">
            {title || t('library')}
        </h1>
      </div>

      <div className="flex items-center gap-4 z-10">
        <LanguageSelector />
      </div>
    </div>
  );
}
