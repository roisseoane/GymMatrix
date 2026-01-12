import { LanguageSelector } from './LanguageSelector';
import { useTranslation } from '../hooks/useTranslation';

interface HeaderProps {
  title?: string;
}

export function Header({ title }: HeaderProps) {
  const { t } = useTranslation();

  return (
    <div className="flex justify-between items-center mb-6">
      <h1 className="text-3xl font-bold text-text tracking-tight">
        {title || t('library')}
      </h1>
      <LanguageSelector />
    </div>
  );
}
