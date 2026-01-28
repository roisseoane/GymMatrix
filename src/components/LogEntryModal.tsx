import { useState, useEffect } from 'react';
import { type ExerciseCatalog, type WorkoutLog } from '../types/models';
import { SuccessCheckmark } from './SuccessCheckmark';
import { AnimatePresence, motion } from 'framer-motion';
import { RIRSlider } from './RIRSlider';
import { RIR_OPTIONS } from '../data/constants';
import { useTranslation } from '../hooks/useTranslation';

interface LogEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  exercise: ExerciseCatalog | null;
  lastLog?: WorkoutLog;
  onSave: (log: WorkoutLog) => Promise<boolean>;
  onUpdateExercise?: (exercise: ExerciseCatalog) => Promise<void>;
}

interface TempSet {
  id: string;
  weight: number;
  reps: number;
  rir: number;
}

export function LogEntryModal({ isOpen, onClose, exercise, lastLog, onSave, onUpdateExercise }: LogEntryModalProps) {
  const { t } = useTranslation();

  // Current Input State
  const [currentWeight, setCurrentWeight] = useState<string>('');
  const [currentReps, setCurrentReps] = useState<string>('');
  const [baseWeight, setBaseWeight] = useState<string>('0');
  const [rirValue, setRirValue] = useState<number>(3); // Default to '3+' (Relaxed)

  // List of added sets
  const [addedSeries, setAddedSeries] = useState<TempSet[]>([]);

  const [isSuccess, setIsSuccess] = useState(false);
  const [isAlreadyLogged, setIsAlreadyLogged] = useState(false);

  const currentRIR = RIR_OPTIONS.find(o => o.value === rirValue) || RIR_OPTIONS[3];

  // Lock Body Scroll when Open
  useEffect(() => {
    if (isOpen) {
        document.body.style.overflow = 'hidden';
    }
  }, [isOpen]);

  // Safety cleanup on unmount
  useEffect(() => {
    return () => {
        document.body.style.overflow = '';
    };
  }, []);

  // Reset or Pre-fill form when exercise changes or modal opens
  useEffect(() => {
    if (isOpen) {
      // Initialize base weight from exercise definition
      const initialBase = exercise?.baseWeight?.toString() || '0';
      setBaseWeight(initialBase);
      setAddedSeries([]);
      setIsSuccess(false);
      setIsAlreadyLogged(false);

      // Check if logged today
      let isToday = false;
      if (lastLog) {
          const now = new Date();
          const logDate = new Date(lastLog.timestamp);
          isToday = now.getDate() === logDate.getDate() &&
                    now.getMonth() === logDate.getMonth() &&
                    now.getFullYear() === logDate.getFullYear();
      }

      if (isToday && lastLog && lastLog.series) {
          // Already logged today: Show read-only view
          setIsAlreadyLogged(true);
          // Add temporary IDs to existing series for rendering consistency
          setAddedSeries(lastLog.series.map(s => ({ ...s, id: crypto.randomUUID() })));
          // Clear inputs
          setCurrentWeight('');
          setCurrentReps('');
      } else if (lastLog && lastLog.series && lastLog.series.length > 0) {
          // Previous log (not today): Smart Carry-over
          const lastSet = lastLog.series[lastLog.series.length - 1];
          const base = parseFloat(initialBase) || 0;
          const added = Math.max(0, lastSet.weight - base);

          setCurrentWeight(added.toString());
          setCurrentReps(lastSet.reps.toString());
          setRirValue(lastSet.rir);
      } else {
          // Default clear
          setCurrentWeight('');
          setCurrentReps('');
          setRirValue(3);
      }
    }
  }, [isOpen, exercise, lastLog]);

  const isInputValid = () => {
      const w = parseFloat(currentWeight);
      const r = parseFloat(currentReps);
      return !isNaN(w) && w >= 0 && !isNaN(r) && r > 0;
  };

  const handleAddSet = () => {
    if (!isInputValid() || isAlreadyLogged) return;

    const baseVal = parseFloat(baseWeight) || 0;
    const totalWeight = parseFloat(currentWeight) + baseVal;

    setAddedSeries(prev => [...prev, {
        id: crypto.randomUUID(),
        weight: totalWeight,
        reps: parseFloat(currentReps),
        rir: rirValue
    }]);

    // Clear inputs after adding to prepare for next set
    setCurrentWeight('');
    setCurrentReps('');
    setRirValue(3); // Reset RIR to default
  };

  const handleRemoveSet = (id: string) => {
    setAddedSeries(prev => prev.filter(s => s.id !== id));
  };

  const handleUpdateSet = (id: string, field: keyof TempSet, value: number) => {
    setAddedSeries(prev => prev.map(s => {
      if (s.id === id) {
        return { ...s, [field]: value };
      }
      return s;
    }));
  };

  const handleSaveLog = async () => {
    if (addedSeries.length === 0 || !exercise || isAlreadyLogged) return;

    // Check if base weight changed and update exercise definition
    const baseVal = parseFloat(baseWeight) || 0;
    if (onUpdateExercise && baseVal !== (exercise.baseWeight || 0)) {
        await onUpdateExercise({ ...exercise, baseWeight: baseVal });
    }

    // Strip IDs before saving to match WorkoutLog model
    const cleanSeries = addedSeries.map(s => ({
      weight: s.weight,
      reps: s.reps,
      rir: s.rir
    }));

    const log: WorkoutLog = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      exerciseId: exercise.id,
      series: cleanSeries
    };

    await onSave(log);
    setIsSuccess(true);
    setTimeout(() => {
      onClose();
    }, 1500);
  };

  const getVisualMode = () => {
    // Simplified visual mode based on RIR only
    return `${currentRIR.glow} border-white/10`;
  };

  return (
    <AnimatePresence onExitComplete={() => { document.body.style.overflow = ''; }}>
      {isOpen && exercise && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center pointer-events-none">
          {/* Backdrop - Event Insulation */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto"
            onClick={onClose}
          />

          {/* Modal Content - Bottom Sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{
              y: "100%",
              transition: { duration: 0.25, ease: "easeIn" }
            }}
            transition={{ type: "spring", damping: 25, stiffness: 300, mass: 0.8 }}
            style={{ willChange: 'transform' }}
            className={`relative w-full max-w-lg bg-surface border-t rounded-t-2xl shadow-2xl p-6 pb-12 pointer-events-auto transition-all duration-300 ${getVisualMode()}`}
          >
            {isSuccess ? (
              <SuccessCheckmark />
            ) : (
              <>
                {/* Close Handle - Interactive */}
                <div
                  className="w-full flex items-center justify-center py-4 -mt-4 mb-2 cursor-pointer touch-manipulation"
                  onClick={onClose}
                  aria-label="Close modal"
                >
                  <div className="w-12 h-1 bg-white/10 rounded-full" />
                </div>

                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-text mb-0 leading-none">{t(exercise.name)}</h2>
                        <p className="text-muted text-xs uppercase tracking-wider font-bold mt-1">{t('log_workout')}</p>
                    </div>
                </div>

                {/* Vertical List of Added Series */}
                {addedSeries.length > 0 && (
                    <div className="mb-6 space-y-2">
                        {addedSeries.map((s, idx) => (
                            <div key={s.id} className="flex justify-between items-center bg-white/5 rounded-lg p-3 border border-white/10 gap-3">
                                <div className="flex items-center gap-2 flex-1">
                                    <span className="text-text font-bold text-sm w-12 shrink-0">Set {idx + 1}</span>

                                    {/* Controlled Weight Input */}
                                    <div className="relative w-16">
                                        <input
                                            type="number"
                                            value={s.weight}
                                            disabled={isAlreadyLogged}
                                            onChange={(e) => handleUpdateSet(s.id, 'weight', parseFloat(e.target.value))}
                                            className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-center text-text font-bold text-sm focus:outline-none focus:border-primary"
                                        />
                                        <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[10px] text-muted pointer-events-none">kg</span>
                                    </div>

                                    <span className="text-muted text-xs">x</span>

                                    {/* Controlled Reps Input */}
                                    <div className="relative w-14">
                                        <input
                                            type="number"
                                            value={s.reps}
                                            disabled={isAlreadyLogged}
                                            onChange={(e) => handleUpdateSet(s.id, 'reps', parseFloat(e.target.value))}
                                            className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-center text-text font-bold text-sm focus:outline-none focus:border-primary"
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    {/* RIR Display/Edit - simplified as small input */}
                                    <div className="flex flex-col items-center">
                                        <span className="text-[10px] text-muted uppercase font-bold">RIR</span>
                                        <input
                                            type="number"
                                            value={s.rir}
                                            disabled={isAlreadyLogged}
                                            onChange={(e) => handleUpdateSet(s.id, 'rir', parseFloat(e.target.value))}
                                            className="w-10 bg-white/5 border border-white/10 rounded px-1 py-1 text-center text-xs text-muted font-bold focus:outline-none focus:border-primary"
                                        />
                                    </div>

                                    {/* Delete Button */}
                                    {!isAlreadyLogged && (
                                        <button
                                            onClick={() => handleRemoveSet(s.id)}
                                            className="p-2 rounded-full hover:bg-red-500/20 text-muted hover:text-red-500 transition-colors ml-1"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                            </svg>
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <div className="flex flex-col gap-3 mb-6">
                      <div className="grid grid-cols-2 gap-4">
                        {/* Weight */}
                        <div className="relative flex flex-col gap-2">
                             <div className="flex justify-between items-end mb-1">
                               <label className="block text-xs text-muted uppercase font-bold">{t('weight_kg')}</label>
                               <div className="flex items-center gap-1">
                                  <span className="text-[10px] text-muted uppercase font-bold">Base:</span>
                                  <input
                                    type="number"
                                    value={baseWeight}
                                    onChange={(e) => setBaseWeight(e.target.value)}
                                    className="w-10 bg-transparent border-b border-white/10 text-right text-xs text-muted focus:outline-none focus:border-white/30 p-0"
                                    placeholder="0"
                                  />
                               </div>
                             </div>

                          <div className="relative">
                              <input
                                type="number"
                                value={currentWeight}
                                onChange={e => setCurrentWeight(e.target.value)}
                                placeholder="0"
                                disabled={isAlreadyLogged}
                                className={`w-full bg-background border border-white/10 rounded-xl p-3 text-2xl font-bold text-text text-center focus:border-primary focus:outline-none placeholder-white/5 ${isAlreadyLogged ? 'opacity-50 cursor-not-allowed' : ''}`}
                              />
                               {/* Plate Assistant */}
                               {parseFloat(currentWeight) > 0 && (
                                <div className="absolute top-1 right-2 pointer-events-none opacity-50">
                                   <span className="text-[10px] text-muted font-mono">
                                     +{(parseFloat(currentWeight) / 2).toFixed(1).replace('.0','')}/s
                                   </span>
                                </div>
                              )}
                          </div>
                        </div>

                        {/* Reps */}
                        <div>
                          <label className="block text-xs text-muted uppercase font-bold mb-1">{t('reps')}</label>
                          <input
                            type="number"
                            value={currentReps}
                            onChange={e => setCurrentReps(e.target.value)}
                            placeholder="0"
                            disabled={isAlreadyLogged}
                            className={`w-full bg-background border border-white/10 rounded-xl p-3 text-2xl font-bold text-text text-center focus:border-primary focus:outline-none placeholder-white/5 ${isAlreadyLogged ? 'opacity-50 cursor-not-allowed' : ''}`}
                          />
                        </div>
                      </div>
                </div>

        {/* RIR Slider */}
        <div className="mb-6">
            <RIRSlider value={rirValue} onChange={setRirValue} />
        </div>

        {/* Add Set Button */}
        <button
          onClick={handleAddSet}
          disabled={!isInputValid() || isAlreadyLogged}
          className={`
            w-full py-3 rounded-xl text-md font-bold tracking-wide uppercase transition-all mb-4
            ${isInputValid() && !isAlreadyLogged
              ? 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
              : 'bg-white/5 text-muted cursor-not-allowed border border-white/5'}
          `}
        >
          {t('add_set') || 'AFEGIR SÈRIE'}
        </button>

        {/* Save Log Button */}
        <button
          onClick={handleSaveLog}
          disabled={addedSeries.length === 0 || isAlreadyLogged}
          className={`
            w-full py-4 rounded-xl text-lg font-bold tracking-wide uppercase transition-all
            ${addedSeries.length > 0 && !isAlreadyLogged
              ? 'bg-primary text-white shadow-lg shadow-primary/20 hover:bg-primary/90 hover:scale-[1.02]'
              : 'bg-white/5 text-white/20 cursor-not-allowed'}
          `}
        >
          {isAlreadyLogged ? (t('exercise_already_logged') || 'EXERCICI JA REGISTRAT') : t('save_log')}
        </button>
              </>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
