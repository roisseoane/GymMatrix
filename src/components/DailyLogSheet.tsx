import { motion, AnimatePresence } from 'framer-motion';
import { usePersistentStore } from '../hooks/usePersistentStore';
import { useTranslation } from '../hooks/useTranslation';
import { useMemo, useEffect } from 'react';

interface DailyLogSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DailyLogSheet({ isOpen, onClose }: DailyLogSheetProps) {
  const { state } = usePersistentStore();
  const { t } = useTranslation();

  // Disable body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const todaysLogs = useMemo(() => {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

    // Get logs from today
    const logs = state.logs.filter(log => log.timestamp >= startOfDay);

    // Group by exercise to show summary
    const grouped = new Map();
    logs.forEach(log => {
      if (!grouped.has(log.exerciseId)) {
        grouped.set(log.exerciseId, {
          count: 0,
          sets: 0,
          totalWeight: 0,
          lastLog: log
        });
      }
      const entry = grouped.get(log.exerciseId);
      entry.count += 1;
      entry.sets += log.sets.length;
      // Simple metric: max weight used
      log.sets.forEach(s => {
          if (s.subSets && s.subSets.length > 0) {
            s.subSets.forEach(sub => {
                if (sub.weight > entry.totalWeight) entry.totalWeight = sub.weight;
            });
          } else {
             // Legacy support
             const leg = s as unknown as { weight: number };
             if (leg.weight && leg.weight > entry.totalWeight) entry.totalWeight = leg.weight;
          }
      });
    });

    return Array.from(grouped.entries()).map(([id, data]) => ({
      id,
      ...data
    }));
  }, [state.logs]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Side Sheet */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-y-0 right-0 w-full max-w-sm bg-surface border-l border-white/10 shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/5">
              <h2 className="text-xl font-bold text-text">{t('todays_session')}</h2>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-white/5 text-muted hover:text-white transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4">
              {todaysLogs.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted opacity-50">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-16 h-16 mb-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-sm font-bold uppercase tracking-wider">{t('no_logs_yet')}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {todaysLogs.map(({ id, sets, totalWeight }) => {
                    const exercise = state.exercises[id];
                    if (!exercise) return null;

                    return (
                      <div key={id} className="bg-background border border-white/5 rounded-xl p-4 flex items-center justify-between">
                         <div className="flex flex-col">
                            <span className="font-bold text-text">{t(exercise.name)}</span>
                            <span className="text-xs text-muted font-mono mt-1">{t(exercise.muscleGroup)}</span>
                         </div>
                         <div className="flex flex-col items-end gap-1">
                             <div className="px-2 py-1 rounded-md bg-white/5 text-xs font-bold text-primary">
                                 {sets} {t('sets')}
                             </div>
                             {totalWeight > 0 && (
                                 <span className="text-[10px] text-muted font-mono">
                                     Max: {totalWeight}kg
                                 </span>
                             )}
                         </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer Summary */}
            <div className="p-6 border-t border-white/5 bg-black/20">
                 <div className="flex justify-between items-center text-sm">
                     <span className="text-muted font-bold uppercase">{t('total_volume')}</span>
                     <span className="text-text font-bold font-mono">
                        {todaysLogs.reduce((acc, curr) => acc + curr.sets, 0)} {t('sets')}
                     </span>
                 </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
