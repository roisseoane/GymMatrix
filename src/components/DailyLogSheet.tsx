import { motion, AnimatePresence } from 'framer-motion';
import { usePersistentStore } from '../hooks/usePersistentStore';
import { useTranslation } from '../hooks/useTranslation';
import { useMemo, useEffect, useState } from 'react';
import { SuccessCheckmark } from './SuccessCheckmark';

interface DailyLogSheetProps {
  isOpen: boolean;
  onClose: () => void;
  date?: Date; // Optional date to show history
}

export function DailyLogSheet({ isOpen, onClose, date }: DailyLogSheetProps) {
  const { state, batchUpdate, removeLog } = usePersistentStore();
  const { t } = useTranslation();

  const [isFinishing, setIsFinishing] = useState(false);
  const [duration, setDuration] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const targetDate = useMemo(() => date || new Date(), [date]);
  const isToday = useMemo(() => {
    const now = new Date();
    return targetDate.getDate() === now.getDate() &&
           targetDate.getMonth() === now.getMonth() &&
           targetDate.getFullYear() === now.getFullYear();
  }, [targetDate]);

  // Disable body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      // Reset local state when opened
      setIsFinishing(false);
      setDuration('');
      setIsSuccess(false);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Format date key as local date string YYYY-MM-DD
  const dateKey = useMemo(() => {
    const offset = targetDate.getTimezoneOffset();
    const localDate = new Date(targetDate.getTime() - (offset * 60 * 1000));
    return localDate.toISOString().split('T')[0];
  }, [targetDate]);

  const todaysLogs = useMemo(() => {
    const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate()).getTime();
    const endOfDay = startOfDay + 86400000; // +24 hours

    // Get logs for the target date
    const logs = state.logs.filter(log => log.timestamp >= startOfDay && log.timestamp < endOfDay);

    // Group by exercise to show summary
    const grouped = new Map();
    logs.forEach(log => {
      if (!grouped.has(log.exerciseId)) {
        grouped.set(log.exerciseId, {
          count: 0,
          sets: 0,
          totalWeight: 0,
          logIds: [] // Track all log IDs
        });
      }
      const entry = grouped.get(log.exerciseId);
      entry.count += 1;
      entry.sets += log.sets.length;
      entry.logIds.push(log.id);

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

    return Array.from(grouped.entries()).map(([exerciseId, data]) => ({
      exerciseId: Number(exerciseId),
      ...data
    }));
  }, [state.logs, targetDate]);

  // Swipe handler
  const handleSwipeDelete = async (logIds: string[]) => {
      for (const id of logIds) {
          await removeLog(id);
      }
  };

  const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '');

    // Mask logic: hh:mm:ss
    if (val.length > 6) val = val.slice(0, 6);

    let formatted = val;
    if (val.length > 2) {
      formatted = `${val.slice(0, 2)}:${val.slice(2)}`;
    }
    if (val.length > 4) {
      formatted = `${formatted.slice(0, 5)}:${val.slice(4)}`;
    }

    setDuration(formatted);
  };

  const handleFinishSession = async () => {
    if (duration.length < 8) return; // Simple validation for full hh:mm:ss

    await batchUpdate(prev => ({
        ...prev,
        sessionMetadata: {
            ...prev.sessionMetadata,
            [dateKey]: {
                duration: duration,
                completed: true
            }
        }
    }));

    setIsSuccess(true);
    setTimeout(() => {
        onClose();
    }, 1500);
  };

  const isSessionFinished = !!state.sessionMetadata?.[dateKey]?.completed;
  // If already finished, maybe show the time?
  const savedDuration = state.sessionMetadata?.[dateKey]?.duration;

  // Format header date
  const headerTitle = isToday
    ? t('todays_session')
    : targetDate.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' });

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
              <h2 className="text-xl font-bold text-text capitalize">{headerTitle}</h2>
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
            <div className="flex-1 overflow-y-auto p-4 overflow-x-hidden">
              {todaysLogs.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted opacity-50">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-16 h-16 mb-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-sm font-bold uppercase tracking-wider">{t('no_logs_yet')}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <AnimatePresence mode="popLayout">
                    {todaysLogs.map(({ exerciseId, sets, totalWeight, logIds }) => {
                      const exercise = state.exercises[exerciseId];
                      if (!exercise) return null;

                      return (
                        <motion.div
                            key={exerciseId}
                            layout
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                            className="relative group"
                        >
                            {/* Background Trash Icon */}
                            <div className="absolute inset-0 bg-red-500/20 rounded-xl flex items-center justify-end px-4 z-0">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-red-500">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                </svg>
                            </div>

                            {/* Swipeable Item */}
                            <motion.div
                                drag="x"
                                dragConstraints={{ right: 0, left: 0 }}
                                dragElastic={0.1}
                                onDragEnd={(_e, info) => {
                                    // Threshold: 40% of screen width (approx 150px on mobile, or calculate dynamically)
                                    // Use a fixed pixel threshold for simplicity, e.g., 100px or relative to width
                                    // The prompt says "at least 40% of the screen width"
                                    const threshold = window.innerWidth * 0.4;
                                    if (info.offset.x < -threshold) {
                                        handleSwipeDelete(logIds);
                                    }
                                }}
                                style={{ touchAction: 'pan-y' }}
                                className="relative bg-background border border-white/5 rounded-xl p-4 flex items-center justify-between z-10"
                            >
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
                            </motion.div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* Footer Summary */}
            <div className="p-6 border-t border-white/5 bg-black/20 flex flex-col gap-4">
                 <div className="flex justify-between items-center text-sm">
                     <span className="text-muted font-bold uppercase">{t('total_volume')}</span>
                     <span className="text-text font-bold font-mono">
                        {todaysLogs.reduce((acc, curr) => acc + curr.sets, 0)} {t('sets')}
                     </span>
                 </div>

                 {/* Session Finish Action - Only show if it is today or if we allow editing past sessions (allowing for now) */}
                 {isSuccess ? (
                    <div className="flex justify-center py-4">
                        <SuccessCheckmark />
                    </div>
                 ) : isSessionFinished && !isFinishing ? (
                    <div className="flex justify-between items-center p-3 bg-primary/10 border border-primary/20 rounded-xl">
                         <span className="text-primary font-bold uppercase text-xs">{t('session_active')}</span>
                         <span className="text-text font-mono font-bold">{savedDuration}</span>
                    </div>
                 ) : (
                    <div className="mt-2">
                        <AnimatePresence mode='wait'>
                            {!isFinishing ? (
                                <motion.button
                                    key="finish-btn"
                                    layout
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    onClick={() => setIsFinishing(true)}
                                    className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-text font-bold uppercase tracking-wide hover:bg-white/10 transition-colors"
                                >
                                    {t('finish_workout')}
                                </motion.button>
                            ) : (
                                <motion.div
                                    key="input-area"
                                    layout
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="flex flex-col gap-3"
                                >
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={duration}
                                            onChange={handleDurationChange}
                                            placeholder={t('session_duration_placeholder')}
                                            className="w-full bg-background border border-white/10 rounded-xl p-3 text-2xl font-bold text-text text-center focus:border-primary focus:outline-none placeholder-white/5 font-mono"
                                            maxLength={8}
                                            autoFocus
                                        />
                                    </div>

                                    <button
                                        onClick={handleFinishSession}
                                        disabled={duration.length < 8}
                                        className={`w-full py-3 rounded-xl font-bold uppercase tracking-wide transition-all ${
                                            duration.length === 8
                                            ? 'bg-green-500 text-white shadow-lg shadow-green-500/20 hover:bg-green-600'
                                            : 'bg-white/5 text-muted cursor-not-allowed'
                                        }`}
                                    >
                                        {t('save_session_time')}
                                    </button>

                                    <button
                                        onClick={() => setIsFinishing(false)}
                                        className="text-xs text-muted uppercase font-bold text-center mt-1 hover:text-white"
                                    >
                                        {t('cancel')}
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                 )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
