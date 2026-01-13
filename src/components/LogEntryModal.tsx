import { useState, useEffect } from 'react';
import { type ExerciseCatalog, type WorkoutLog, type WorkoutSet, SetType } from '../types/models';
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
}

export function LogEntryModal({ isOpen, onClose, exercise, lastLog, onSave }: LogEntryModalProps) {
  const { t } = useTranslation();
  const [setsCount, setSetsCount] = useState<number>(3);
  const [reps, setReps] = useState<string>('');
  const [weight, setWeight] = useState<string>('');
  const [rirValue, setRirValue] = useState<number>(3); // Default to '3+' (Relaxed)
  const [rest, setRest] = useState<string>('');
  const [setType, setSetType] = useState<SetType>(SetType.NORMAL);
  const [isSuccess, setIsSuccess] = useState(false);

  const currentRIR = RIR_OPTIONS.find(o => o.value === rirValue) || RIR_OPTIONS[3];

  // Reset or Pre-fill form when exercise changes or modal opens
  useEffect(() => {
    if (isOpen) {
      if (lastLog && lastLog.sets.length > 0) {
        // Carry-over logic from previous log
        const lastSet = lastLog.sets[lastLog.sets.length - 1];
        setSetsCount(1); // Default to adding 1 set when continuing
        setReps(lastSet.reps.toString());
        setWeight(lastSet.weight.toString());

        // Map RPE back to RIR slider value
        // RIR_OPTIONS: 10->0, 9.5->1, 8.5->2, 7->3
        const matchedRIR = RIR_OPTIONS.find(opt => opt.rpe === lastSet.rpe);
        setRirValue(matchedRIR ? matchedRIR.value : 3);

        setRest(lastSet.restTime ? lastSet.restTime.toString() : '');
        setSetType(lastSet.type || SetType.NORMAL);
      } else {
        // Default reset
        setSetsCount(3);
        setReps('');
        setWeight('');
        setRirValue(3);
        setRest('');
        setSetType(SetType.NORMAL);
      }
      setIsSuccess(false);
    }
  }, [isOpen, exercise, lastLog]);

  const w = parseFloat(weight);
  const r = parseFloat(reps);
  const isValid = !isNaN(w) && w > 0 && !isNaN(r) && r > 0 && setsCount > 0;

  const handleSubmit = async () => {
    if (!isValid || !exercise) return;

    const set: WorkoutSet = {
      reps: parseFloat(reps),
      weight: parseFloat(weight),
      rpe: currentRIR.rpe,
      restTime: rest ? parseFloat(rest) : undefined,
      type: setType
    };

    // Generate N identical sets for this log
    const sets: WorkoutSet[] = Array.from({ length: setsCount }, () => ({ ...set }));

    const log: WorkoutLog = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      exerciseId: exercise.id,
      sets: sets
    };

    await onSave(log);
    setIsSuccess(true);
    setTimeout(() => {
      onClose();
    }, 1500);
  };

  return (
    <AnimatePresence>
      {isOpen && exercise && (
        <div className="fixed inset-0 z-50 flex items-end justify-center pointer-events-none">
          {/* Backdrop */}
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
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className={`relative w-full max-w-lg bg-surface border-t border-white/10 rounded-t-2xl shadow-2xl p-6 pointer-events-auto transition-shadow duration-300 ${currentRIR.glow}`}
          >
            {isSuccess ? (
              <SuccessCheckmark />
            ) : (
              <>
                <div className="w-12 h-1 bg-white/10 rounded-full mx-auto mb-6" />

                <h2 className="text-2xl font-bold text-text mb-1">{t(exercise.name)}</h2>
        <p className="text-muted text-sm mb-6 uppercase tracking-wider font-bold">{t('log_workout')}</p>

        <div className="grid grid-cols-2 gap-4 mb-4">
          {/* Weight */}
          <div className="col-span-1 flex flex-col">
            <label className="block text-xs text-muted uppercase font-bold mb-1">{t('weight_kg')}</label>
            <input
              type="number"
              value={weight}
              onChange={e => setWeight(e.target.value)}
              placeholder="0"
              className="w-full bg-background border border-white/10 rounded-xl p-4 text-3xl font-bold text-text text-center focus:border-primary focus:outline-none placeholder-white/5"
            />
            {exercise && exercise.baseWeight !== undefined && exercise.baseWeight > 0 && parseFloat(weight) > exercise.baseWeight && (
              <div className="mt-2 text-center">
                 <span className="inline-block bg-white/5 rounded px-2 py-1 text-xs text-muted font-mono">
                   +{((parseFloat(weight) - exercise.baseWeight) / 2).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })} kg/side
                 </span>
              </div>
            )}
          </div>

          {/* Reps */}
          <div className="col-span-1">
            <label className="block text-xs text-muted uppercase font-bold mb-1">{t('reps')}</label>
            <input
              type="number"
              value={reps}
              onChange={e => setReps(e.target.value)}
              placeholder="0"
              className="w-full bg-background border border-white/10 rounded-xl p-4 text-3xl font-bold text-text text-center focus:border-primary focus:outline-none placeholder-white/5"
            />
          </div>
        </div>

        <div className="mb-6">
           <label className="block text-xs text-muted uppercase font-bold mb-1">{t('sets')}</label>
           <div className="flex items-center justify-between bg-background border border-white/10 rounded-xl p-2">
             <button
               onClick={() => setSetsCount(Math.max(1, setsCount - 1))}
               className="w-12 h-12 flex items-center justify-center bg-surface rounded-lg text-text hover:bg-white/5 text-xl font-bold"
             >-</button>
             <span className="text-2xl font-bold text-text">{setsCount}</span>
             <button
               onClick={() => setSetsCount(setsCount + 1)}
               className="w-12 h-12 flex items-center justify-center bg-surface rounded-lg text-text hover:bg-white/5 text-xl font-bold"
             >+</button>
           </div>
        </div>

        {/* Optional Fields */}
        <div className="grid grid-cols-1 gap-4 mb-8">
          <div className="mb-2">
            <RIRSlider value={rirValue} onChange={setRirValue} />
          </div>

          <div>
            <label className="block text-xs text-muted uppercase font-bold mb-2">{t('set_type')}</label>
            <div className="flex w-full bg-white/5 rounded-xl p-1 gap-1">
              {Object.values(SetType).map((type) => (
                <button
                  key={type}
                  onClick={() => setSetType(type)}
                  className={`
                    flex-1 py-2 rounded-lg text-xs font-bold transition-all
                    ${setType === type
                      ? 'bg-white/10 text-white shadow-sm ring-1 ring-white/5'
                      : 'text-muted hover:text-white hover:bg-white/5'}
                  `}
                >
                  {t(type.toLowerCase())}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs text-muted uppercase font-bold mb-1">{t('rest_sec')}</label>
            <input
              type="number"
              value={rest}
              onChange={e => setRest(e.target.value)}
              placeholder={t('optional')}
              className="w-full bg-background border border-white/10 rounded-lg p-3 text-lg text-text focus:border-primary focus:outline-none placeholder-white/5"
            />
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={!isValid}
          className={`
            w-full py-4 rounded-xl text-lg font-bold tracking-wide uppercase transition-all
            ${isValid
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
