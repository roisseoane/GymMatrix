import { motion } from 'framer-motion';
import { useTranslation } from '../hooks/useTranslation';

interface SmartInsightBadgeProps {
  suggestion: string | null;
}

export function SmartInsightBadge({ suggestion }: SmartInsightBadgeProps) {
  const { t } = useTranslation();

  if (!suggestion) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10, height: 0, marginBottom: 0 }}
      animate={{ opacity: 1, y: 0, height: 'auto', marginBottom: 12 }}
      exit={{ opacity: 0, y: -5, height: 0, marginBottom: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="w-full overflow-hidden"
    >
      <div className="flex items-center w-full px-3 py-1.5 rounded-md bg-cyan-500/10 border border-cyan-500/20 backdrop-blur-sm shadow-[0_0_10px_rgba(6,182,212,0.1)]">
        <p className="text-xs text-cyan-400 truncate w-full">
          <span className="font-normal opacity-80 mr-1.5 tracking-wider uppercase text-[10px]">{t('suggestion') || 'SUGERENCIA'}:</span>
          <span className="font-bold tracking-wide text-sm">{suggestion}</span>
        </p>
      </div>
    </motion.div>
  );
}
