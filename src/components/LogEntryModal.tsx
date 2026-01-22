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

      if (lastLog && lastLog.series && lastLog.series.length > 0) {
          // Smart Carry-over: pre-fill input with LAST set values
          const lastSet = lastLog.series[lastLog.series.length - 1];
          const base = parseFloat(initialBase) || 0;
          const added = Math.max(0, lastSet.weight - base);

          setCurrentWeight(added.toString());
          setCurrentReps(lastSet.reps.toString());

          // Map RPE/RIR back if needed, or stick to default
          setRirValue(lastSet.rir); // Assuming simple mapping if rir stored directly
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
    if (!isInputValid()) return;

    const baseVal = parseFloat(baseWeight) || 0;
    const totalWeight = parseFloat(currentWeight) + baseVal;

    setAddedSeries(prev => [...prev, {
        weight: totalWeight,
        reps: parseFloat(currentReps),
        rir: rirValue
    }]);

    // Optional: Clear reps but keep weight? Or keep both for rapid entry?
    // User often does same weight/reps. Let's keep values.
    // If they want to change, they can.
  };

  const handleSaveLog = async () => {
    if (addedSeries.length === 0 || !exercise) return;

    // Check if base weight changed and update exercise definition
    const baseVal = parseFloat(baseWeight) || 0;
    if (onUpdateExercise && baseVal !== (exercise.baseWeight || 0)) {
        await onUpdateExercise({ ...exercise, baseWeight: baseVal });
    }

    const log: WorkoutLog = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      exerciseId: exercise.id,
      series: addedSeries
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
                            <div key={idx} className="flex justify-between items-center bg-white/5 rounded-lg p-3 border border-white/10">
                                <div className="flex items-baseline gap-2">
                                    <span className="text-text font-bold text-lg">Set {idx + 1}</span>
                                    <span className="text-muted text-sm">{s.weight}kg x {s.reps}</span>
                                </div>
                                <div className="text-xs font-bold px-2 py-1 rounded bg-white/10 text-muted">
                                    RIR {s.rir}
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
                                className="w-full bg-background border border-white/10 rounded-xl p-3 text-2xl font-bold text-text text-center focus:border-primary focus:outline-none placeholder-white/5"
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
                            className="w-full bg-background border border-white/10 rounded-xl p-3 text-2xl font-bold text-text text-center focus:border-primary focus:outline-none placeholder-white/5"
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
          disabled={!isInputValid()}
          className={`
            w-full py-3 rounded-xl text-md font-bold tracking-wide uppercase transition-all mb-4
            ${isInputValid()
              ? 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
              : 'bg-white/5 text-muted cursor-not-allowed border border-white/5'}
          `}
        >
          {t('add_set') || 'AFEGIR SÈRIE'}
        </button>

        {/* Save Log Button */}
        <button
          onClick={handleSaveLog}
          disabled={addedSeries.length === 0}
          className={`
            w-full py-4 rounded-xl text-lg font-bold tracking-wide uppercase transition-all
            ${addedSeries.length > 0
              ? 'bg-primary text-white shadow-lg shadow-primary/20 hover:bg-primary/90 hover:scale-[1.02]'
              : 'bg-white/5 text-white/20 cursor-not-allowed'}
          `}
        >
          {t('save_log')}
        </button>
              </>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
