import type { ExerciseCatalog } from '../types/models';
import { Sparkline } from './Sparkline';
import { motion } from 'framer-motion';
import { useTranslation } from '../hooks/useTranslation';

interface ExerciseCardProps {
  exercise: ExerciseCatalog;
  recentLogs?: number[]; // Array of recent max weights or volumes
  isCompletedToday?: boolean;
  suggestion?: string | null;
  onClick?: () => void;
}

export function ExerciseCard({ exercise, recentLogs = [], isCompletedToday = false, suggestion, onClick }: ExerciseCardProps) {
  const { t } = useTranslation();

  return (
    <motion.div
      layout
      whileTap={{ scale: 0.95 }}
      transition={{ duration: 0.2 }}
      onClick={onClick}
      className={`
        group relative flex flex-col justify-between p-4 h-full
        bg-surface/50 backdrop-blur-md
        border ${isCompletedToday ? 'border-primary/50 bg-primary/5' : 'border-white/5'}
        rounded-xl
        hover:bg-surface/70 hover:shadow-lg hover:shadow-primary/10
        cursor-pointer
      `}
    >
      <div>
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-semibold text-text tracking-tight leading-tight">
            {t(exercise.name)}
          </h3>
          {isCompletedToday && (
            <span className="text-primary text-xs font-bold uppercase tracking-wider bg-primary/10 px-2 py-0.5 rounded-full">
              {t('done')}
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5 mb-4">
          {exercise.tags.slice(0, 3).map(tag => (
            <span key={tag} className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-white/5 text-muted border border-white/5">
              {t(tag)}
            </span>
          ))}
          {exercise.tags.length > 3 && (
            <span className="text-[10px] text-muted px-1">+{exercise.tags.length - 3}</span>
          )}
        </div>

        {suggestion && (
          <div className="absolute top-4 right-4 text-right">
             <span className="block text-[10px] text-muted/50 uppercase font-mono tracking-widest">{t('suggestion')}</span>
             <span className="block text-xs text-primary/80 font-mono font-bold">{suggestion}</span>
          </div>
        )}
      </div>

      <div className="mt-auto pt-2">
        <Sparkline data={recentLogs} />
        {recentLogs.length > 0 && (
          <div className="flex justify-between items-end mt-1">
             <span className="text-xs text-muted">{t('last')}: {recentLogs[recentLogs.length - 1]}kg</span>
             <span className="text-xs text-primary font-medium">{t('progress')}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
