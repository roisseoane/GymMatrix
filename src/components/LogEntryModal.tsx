import { useState, useEffect } from 'react';
import { type ExerciseCatalog, type WorkoutLog, type WorkoutSet, SetType, type SubSet } from '../types/models';
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

export function LogEntryModal({ isOpen, onClose, exercise, lastLog, onSave, onUpdateExercise }: LogEntryModalProps) {
  const { t } = useTranslation();
  const [setsCount, setSetsCount] = useState<number>(3);
  const [rows, setRows] = useState<Array<{ weight: string, reps: string }>>([{ weight: '', reps: '' }]);
  const [baseWeight, setBaseWeight] = useState<string>('0');
  const [rirValue, setRirValue] = useState<number>(3); // Default to '3+' (Relaxed)
  const [rest, setRest] = useState<string>('');

  const [isWarmup, setIsWarmup] = useState(false);
  const [isDropSet, setIsDropSet] = useState(false);

  const [isSuccess, setIsSuccess] = useState(false);
  const [isRestExpanded, setIsRestExpanded] = useState(false);

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

      if (lastLog && lastLog.sets.length > 0) {
        // Carry-over logic from previous log
        const lastSet = lastLog.sets[lastLog.sets.length - 1];
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSetsCount(1); // Default to adding 1 set when continuing

        // Migration/Compatibility logic
        let initialRows = [{ weight: '', reps: '' }];
        if (lastSet.subSets && lastSet.subSets.length > 0) {
          initialRows = lastSet.subSets.map(s => {
            const total = s.weight;
            const base = parseFloat(initialBase) || 0;
            // Provide the "Added Weight" (Plates) by subtracting base
            const added = Math.max(0, total - base);
            return {
              weight: added.toString(),
              reps: s.reps.toString()
            };
          });
        } else {
          // Fallback for old data structure (safe casting using unknown to match previous logic without any)
          const oldSet = lastSet as unknown as { weight: number; reps: number; rpe: number };
          if (oldSet.weight !== undefined) {
             const total = oldSet.weight;
             const base = parseFloat(initialBase) || 0;
             const added = Math.max(0, total - base);
             initialRows = [{
                weight: added.toString(),
                reps: oldSet.reps.toString()
             }];
          }
        }
        setRows(initialRows);

        // Map RPE back to RIR slider value
        // Use the first subset's RPE or legacy RPE
        const oldSet = lastSet as unknown as { rpe: number };
        const legacyRpe = oldSet.rpe;
        const firstRpe = lastSet.subSets?.[0]?.rpe ?? legacyRpe;
        const matchedRIR = RIR_OPTIONS.find(opt => opt.rpe === firstRpe);
        setRirValue(matchedRIR ? matchedRIR.value : 3);

        setRest(lastSet.restTime ? lastSet.restTime.toString() : '');

        // Determine flags
        const type = lastSet.type;
        setIsWarmup(lastSet.isWarmup || type === SetType.WARMUP);
        setIsDropSet(lastSet.isDropSet || type === SetType.DROPSET || type === SetType.FAILURE); // Consider failure as drop? No, separate concept but maybe useful context.
        // Stick to explicit flags if available, fallback to type.

        setIsRestExpanded(!!lastSet.restTime);
      } else {
        // Default reset
        setSetsCount(3);
        setRows([{ weight: '', reps: '' }]);
        setRirValue(3);
        setRest('');
        setIsWarmup(false);
        setIsDropSet(false);
        setIsRestExpanded(false);
      }
      setIsSuccess(false);
    }
  }, [isOpen, exercise, lastLog]);

  const effectiveRows = isDropSet ? rows : [rows[0]];
  const isValid = effectiveRows.every(r => {
      const w = parseFloat(r.weight);
      const rep = parseFloat(r.reps);
      return !isNaN(w) && w > 0 && !isNaN(rep) && rep > 0;
  }) && setsCount > 0;

  const handleSubmit = async () => {
    if (!isValid || !exercise) return;

    const baseVal = parseFloat(baseWeight) || 0;

    // Check if base weight changed and update exercise definition
    if (onUpdateExercise && baseVal !== (exercise.baseWeight || 0)) {
        await onUpdateExercise({ ...exercise, baseWeight: baseVal });
    }

    // Filter valid rows just in case, though validation prevents submit
    const validRows = effectiveRows.filter(r => r.weight && r.reps);

    const subSets: SubSet[] = validRows.map(r => ({
        reps: parseFloat(r.reps),
        // Save Total Weight (Base + Added)
        weight: parseFloat(r.weight) + baseVal,
        rpe: currentRIR.rpe
    }));

    // Determine type for backward compatibility / display
    let type: SetType = SetType.NORMAL;
    if (isWarmup) type = SetType.WARMUP;
    else if (isDropSet) type = SetType.DROPSET;
    // else if (currentRIR.value === 0) type = SetType.FAILURE; // Optional inference

    const set: WorkoutSet = {
      subSets: subSets,
      isDropSet: isDropSet,
      isWarmup: isWarmup,
      restTime: rest ? parseFloat(rest) : undefined,
      type: type
    };

    // Deep copy for multiple sets
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

  const updateRow = (index: number, field: 'weight' | 'reps', value: string) => {
    const newRows = [...rows];
    newRows[index] = { ...newRows[index], [field]: value };
    setRows(newRows);
  };

  const addRow = () => {
    if (rows.length < 4) {
      // Auto-fill new row with previous row's values (smart defaults)
      const lastRow = rows[rows.length - 1];
      // Usually drop set means weight goes down. Maybe suggest 80%?
      // For now just copy or empty. Let's copy weight but expect changes.
      // User says "dynamic rows", let's leave empty or previous.
      // Copying allows faster adjustment.
      setRows([...rows, { ...lastRow }]);
    }
  };

  const getVisualMode = () => {
    if (isWarmup) {
      return "shadow-blue-500/50 border-blue-500/50 bg-blue-500/10";
    }
    if (isDropSet || currentRIR.value === 0) {
      return "shadow-red-500/50 border-red-500/50 bg-red-500/20";
    }
    return `${currentRIR.glow} border-white/10`;
  };

  return (
    <AnimatePresence onExitComplete={() => { document.body.style.overflow = ''; }}>
      {isOpen && exercise && (
        <div className="fixed inset-0 z-50 flex items-end justify-center pointer-events-none">
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
            className={`relative w-full max-w-lg bg-surface border-t rounded-t-2xl shadow-2xl p-6 pointer-events-auto transition-all duration-300 ${getVisualMode()}`}
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
                    {/* Discrete Toggles */}
                    <div className="flex gap-2">
                         <button
                           onClick={() => { setIsWarmup(!isWarmup); if(!isWarmup) setIsDropSet(false); }}
                           className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all border ${isWarmup ? 'bg-blue-500/20 border-blue-500 text-blue-400' : 'bg-white/5 border-transparent text-muted hover:bg-white/10'}`}
                         >
                            {t('warmup')}
                         </button>
                         <button
                           onClick={() => { setIsDropSet(!isDropSet); if(!isDropSet) setIsWarmup(false); }}
                           className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all border ${isDropSet ? 'bg-red-500/20 border-red-500 text-red-400' : 'bg-white/5 border-transparent text-muted hover:bg-white/10'}`}
                         >
                            {t('dropset')}
                         </button>
                    </div>
                </div>

                <div className="flex flex-col gap-3 mb-6">
                  {/* Dynamic Rows */}
                  {(isDropSet ? rows : [rows[0]]).map((row, index) => (
                      <div key={index} className="grid grid-cols-2 gap-4">
                        {/* Weight */}
                        <div className="relative flex flex-col gap-2">
                           {/* Label & Base Weight Config */}
                           {index === 0 && (
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
                           )}

                          <div className="relative">
                              <input
                                type="number"
                                value={row.weight}
                                onChange={e => updateRow(index, 'weight', e.target.value)}
                                placeholder="0"
                                className="w-full bg-background border border-white/10 rounded-xl p-3 text-2xl font-bold text-text text-center focus:border-primary focus:outline-none placeholder-white/5"
                              />
                               {/* Plate Assistant: Now calculates directly from input (Added Weight) */}
                               {index === 0 && parseFloat(row.weight) > 0 && (
                                <div className="absolute top-1 right-2 pointer-events-none opacity-50">
                                   <span className="text-[10px] text-muted font-mono">
                                     +{(parseFloat(row.weight) / 2).toFixed(1).replace('.0','')}/s
                                   </span>
                                </div>
                              )}
                          </div>
                        </div>

                        {/* Reps */}
                        <div>
                           {index === 0 && <label className="block text-xs text-muted uppercase font-bold mb-1">{t('reps')}</label>}
                          <input
                            type="number"
                            value={row.reps}
                            onChange={e => updateRow(index, 'reps', e.target.value)}
                            placeholder="0"
                            className="w-full bg-background border border-white/10 rounded-xl p-3 text-2xl font-bold text-text text-center focus:border-primary focus:outline-none placeholder-white/5"
                          />
                        </div>
                      </div>
                  ))}

                  {/* Add Row Button */}
                  {isDropSet && rows.length < 4 && (
                      <button
                        onClick={addRow}
                        className="flex items-center justify-center w-full py-2 rounded-xl border border-dashed border-white/20 text-muted hover:bg-white/5 hover:text-white transition-colors text-sm font-bold uppercase tracking-wide"
                      >
                          + Drop
                      </button>
                  )}
                </div>

        {/* Minimal Sets & RIR & Rest Cluster */}
        <div className="grid grid-cols-1 gap-4 mb-6">
          <div className="flex items-center gap-4">
             {/* Sets Count (Compact) */}
             <div className="flex items-center bg-background border border-white/10 rounded-xl p-1 shrink-0">
                 <button onClick={() => setSetsCount(Math.max(1, setsCount - 1))} className="w-8 h-10 flex items-center justify-center hover:bg-white/5 rounded text-muted font-bold">-</button>
                 <div className="flex flex-col items-center px-2 w-10">
                    <span className="text-xl font-bold text-text leading-none">{setsCount}</span>
                    <span className="text-[8px] text-muted uppercase font-bold">Sets</span>
                 </div>
                 <button onClick={() => setSetsCount(setsCount + 1)} className="w-8 h-10 flex items-center justify-center hover:bg-white/5 rounded text-muted font-bold">+</button>
             </div>

             {/* RIR Slider (Always Visible, Flexible width) */}
             <div className="flex-1">
                <RIRSlider value={rirValue} onChange={setRirValue} />
             </div>
          </div>

          {/* Rest Time (Collapsible) */}
          <div className="flex flex-col">
            <div className="flex justify-end">
                {!isRestExpanded && (
                    <button
                        onClick={() => setIsRestExpanded(true)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 text-muted hover:text-white transition-all text-xs font-bold uppercase"
                    >
                         <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 2h12v4l-6 6 6 6v4H6v-4l6-6-6-6V2z" />
                        </svg>
                        <span>{t('rest_sec')}</span>
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
                         <div className="flex items-center gap-2 bg-background border border-white/10 rounded-lg p-2">
                             <span className="text-xs text-muted uppercase font-bold pl-2">{t('rest_sec')}</span>
                            <input
                                type="number"
                                value={rest}
                                onChange={e => setRest(e.target.value)}
                                placeholder="90"
                                className="flex-1 bg-transparent text-right text-lg text-text focus:outline-none placeholder-white/5 font-bold"
                                autoFocus
                            />
                        </div>
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
