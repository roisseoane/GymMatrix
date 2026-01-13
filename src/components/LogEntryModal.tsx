import { useState, useEffect } from 'react';
import { type ExerciseCatalog, type WorkoutLog, type WorkoutSet, SetType, type SubSet } from '../types/models';
import { SuccessCheckmark } from './SuccessCheckmark';
import { AnimatePresence, motion, type PanInfo } from 'framer-motion';
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
  const [isRestExpanded, setIsRestExpanded] = useState(false);

  const currentRIR = RIR_OPTIONS.find(o => o.value === rirValue) || RIR_OPTIONS[3];

  // Reset or Pre-fill form when exercise changes or modal opens
  useEffect(() => {
    if (isOpen) {
      if (lastLog && lastLog.sets.length > 0) {
        // Carry-over logic from previous log
        const lastSet = lastLog.sets[lastLog.sets.length - 1];
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSetsCount(1); // Default to adding 1 set when continuing

        // Handle migration from old format if needed, though typescript should enforce new format if possible.
        // Assuming lastSet conforms to new WorkoutSet interface after refactor.
        // If the store persists old data, we might have runtime issues unless we migrate data.
        // For now assuming compatible structure or fresh data.
        // Note: The previous steps updated the interface, but existing JSON in localStorage might be old.
        // Robustness check:
        const firstSubSet = lastSet.subSets?.[0];

        if (firstSubSet) {
             setReps(firstSubSet.reps.toString());
             setWeight(firstSubSet.weight.toString());
             // Map RPE back to RIR slider value
             const matchedRIR = RIR_OPTIONS.find(opt => opt.rpe === firstSubSet.rpe);
             setRirValue(matchedRIR ? matchedRIR.value : 3);
        }

        setRest(lastSet.restTime ? lastSet.restTime.toString() : '');
        setSetType(lastSet.type || SetType.NORMAL);
        setIsRestExpanded(!!lastSet.restTime);
      } else {
        // Default reset
        setSetsCount(3);
        setReps('');
        setWeight('');
        setRirValue(3);
        setRest('');
        setSetType(SetType.NORMAL);
        setIsRestExpanded(false);
      }
      setIsSuccess(false);
    }
  }, [isOpen, exercise, lastLog]);

  const w = parseFloat(weight);
  const r = parseFloat(reps);
  const isValid = !isNaN(w) && w > 0 && !isNaN(r) && r > 0 && setsCount > 0;

  const handleSubmit = async () => {
    if (!isValid || !exercise) return;

    const subSet: SubSet = {
        reps: parseFloat(reps),
        weight: parseFloat(weight),
        rpe: currentRIR.rpe
    };

    const set: WorkoutSet = {
      subSets: [subSet],
      isDropSet: false, // Default to false for single-entry modal
      isWarmup: setType === SetType.WARMUP,
      restTime: rest ? parseFloat(rest) : undefined,
      type: setType
    };

    // Better deep copy to avoid reference issues if logic mutates subsets later
    const setsDeep = Array.from({ length: setsCount }, () => ({
        ...set,
        subSets: set.subSets.map(s => ({ ...s }))
    }));

    const log: WorkoutLog = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      exerciseId: exercise.id,
      sets: setsDeep
    };

    await onSave(log);
    setIsSuccess(true);
    setTimeout(() => {
      onClose();
    }, 1500);
  };

  const onDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.y > 150 || info.velocity.y > 300) {
      onClose();
    }
  };

  const getVisualMode = () => {
    if (setType === SetType.WARMUP) {
      return "shadow-blue-500/50 border-blue-500/50";
    }
    if (setType === SetType.FAILURE || setType === SetType.DROPSET) {
      return "shadow-red-500/50 border-red-500/50";
    }
    return `${currentRIR.glow} border-white/10`;
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
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={{ top: 0, bottom: 0.2 }}
            onDragEnd={onDragEnd}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className={`relative w-full max-w-lg bg-surface border-t rounded-t-2xl shadow-2xl p-6 pointer-events-auto transition-all duration-300 ${getVisualMode()}`}
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
            <div className="flex items-center justify-between mb-1">
                <label className="block text-xs text-muted uppercase font-bold">{t('rest_sec')}</label>
                {!isRestExpanded && (
                    <button
                        onClick={() => setIsRestExpanded(true)}
                        className="p-1 rounded hover:bg-white/10 text-muted transition-colors"
                    >
                         {/* Minimalist Hourglass Icon */}
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                        </svg>
                    </button>
                )}
            </div>

            <AnimatePresence>
                {isRestExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <input
                            type="number"
                            value={rest}
                            onChange={e => setRest(e.target.value)}
                            placeholder={t('optional')}
                            className="w-full bg-background border border-white/10 rounded-lg p-3 text-lg text-text focus:border-primary focus:outline-none placeholder-white/5"
                            autoFocus
                        />
                    </motion.div>
                )}
            </AnimatePresence>
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
