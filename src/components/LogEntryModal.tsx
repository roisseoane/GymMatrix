import { useState, useEffect } from 'react';
import type { ExerciseCatalog, WorkoutLog, WorkoutSet } from '../types/models';

interface LogEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  exercise: ExerciseCatalog | null;
  onSave: (log: WorkoutLog) => Promise<boolean>;
}

export function LogEntryModal({ isOpen, onClose, exercise, onSave }: LogEntryModalProps) {
  const [setsCount, setSetsCount] = useState<number>(3);
  const [reps, setReps] = useState<string>('');
  const [weight, setWeight] = useState<string>('');
  const [rpe, setRpe] = useState<string>('');
  const [rest, setRest] = useState<string>('');

  // Reset form when exercise changes or modal opens
  useEffect(() => {
    if (isOpen) {
      const reset = () => {
        setSetsCount(3);
        setReps('');
        setWeight('');
        setRpe('');
        setRest('');
      };
      reset();
    }
  }, [isOpen, exercise]);

  const w = parseFloat(weight);
  const r = parseFloat(reps);
  const isValid = !isNaN(w) && w > 0 && !isNaN(r) && r > 0 && setsCount > 0;

  if (!isOpen || !exercise) return null;

  const handleSubmit = async () => {
    if (!isValid) return;

    const set: WorkoutSet = {
      reps: parseFloat(reps),
      weight: parseFloat(weight),
      rpe: rpe ? parseFloat(rpe) : undefined,
      restTime: rest ? parseFloat(rest) : undefined
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
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Content - Bottom Sheet */}
      <div className="relative w-full max-w-lg bg-surface border-t border-white/10 rounded-t-2xl shadow-2xl p-6 animate-slide-up">
        <div className="w-12 h-1 bg-white/10 rounded-full mx-auto mb-6" />

        <h2 className="text-2xl font-bold text-text mb-1">{exercise.name}</h2>
        <p className="text-muted text-sm mb-6 uppercase tracking-wider font-bold">Log Workout</p>

        <div className="grid grid-cols-2 gap-4 mb-4">
          {/* Weight */}
          <div className="col-span-1">
            <label className="block text-xs text-muted uppercase font-bold mb-1">Weight (kg)</label>
            <input
              type="number"
              value={weight}
              onChange={e => setWeight(e.target.value)}
              placeholder="0"
              className="w-full bg-background border border-white/10 rounded-xl p-4 text-3xl font-bold text-text text-center focus:border-primary focus:outline-none placeholder-white/5"
            />
          </div>

          {/* Reps */}
          <div className="col-span-1">
            <label className="block text-xs text-muted uppercase font-bold mb-1">Reps</label>
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
           <label className="block text-xs text-muted uppercase font-bold mb-1">Sets</label>
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
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div>
            <label className="block text-xs text-muted uppercase font-bold mb-1">RPE (1-10)</label>
            <input
              type="number"
              min="1"
              max="10"
              value={rpe}
              onChange={e => setRpe(e.target.value)}
              className="w-full bg-background border border-white/10 rounded-lg p-3 text-lg text-text focus:border-primary focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs text-muted uppercase font-bold mb-1">Rest (sec)</label>
            <input
              type="number"
              value={rest}
              onChange={e => setRest(e.target.value)}
              className="w-full bg-background border border-white/10 rounded-lg p-3 text-lg text-text focus:border-primary focus:outline-none"
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
          Save Log
        </button>
      </div>
    </div>
  );
}
