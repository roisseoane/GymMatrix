import { useState, useCallback } from 'react';
import { usePersistentStore } from '../hooks/usePersistentStore';
import { useFilterEngine } from '../hooks/useFilterEngine';
import { FilterBar } from './FilterBar';
import { Header } from './Header';
import { LogEntryModal } from './LogEntryModal';
import type { ExerciseCatalog } from '../types/models';
import { LayoutGroup, AnimatePresence, motion } from 'framer-motion';
import { calculateSuggestion } from '../utils/predictiveLoad';
import { ZonalSwipeCard } from './ZonalSwipeCard';
import { checkFatigue } from '../utils/fatigueMonitor';
import type { WorkoutLog, WorkoutSet } from '../types/models';

export function ExerciseMatrix() {
  const { state, loading, addLog } = usePersistentStore();
  const [selectedExercise, setSelectedExercise] = useState<ExerciseCatalog | null>(null);
  const [fatigueAlert, setFatigueAlert] = useState<string | null>(null);

  // Use state for current time to be pure
  // Initialize lazily to avoid impure call warning, though Date.now() in initializer is generally safe for initial state
  const [now] = useState(() => Date.now());

  const { filteredExercises, filterState, setFilter, options } = useFilterEngine(
    state.exercises,
    state.logs
  );

  // Helper to extract log history for an exercise
  const getExerciseHistory = useCallback((exerciseId: number) => {
    return state.logs
      .filter(log => log.exerciseId === exerciseId)
      .sort((a, b) => a.timestamp - b.timestamp)
      .map(log => {
         // Return max weight of the session
         return Math.max(...log.sets.map(s => s.weight));
      });
  }, [state.logs]);

  // Helper to check if exercise was done today
  const isCompletedToday = useCallback((exerciseId: number) => {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    return state.logs.some(log => log.exerciseId === exerciseId && log.timestamp >= startOfDay);
  }, [state.logs]);

  const handleQuickLog = async (exercise: ExerciseCatalog, rpe: number) => {
    // Clone last log logic
    const exerciseLogs = state.logs
      .filter(l => l.exerciseId === exercise.id)
      .sort((a, b) => b.timestamp - a.timestamp);

    if (exerciseLogs.length === 0) return; // Cannot quick log without history

    const lastLog = exerciseLogs[0];
    const newSets: WorkoutSet[] = lastLog.sets.map(s => ({
      ...s,
      rpe // Update RPE
    }));

    const timestamp = new Date().getTime();
    const newLog: WorkoutLog = {
      id: crypto.randomUUID(),
      timestamp: timestamp,
      exerciseId: exercise.id,
      sets: newSets
    };

    // Check Fatigue
    const isFatigued = checkFatigue(state.logs, exercise.id, newLog.timestamp);
    if (isFatigued) {
      setFatigueAlert(`CNS Alert: High latency detected for ${exercise.name}. Suggesting deload.`);
      setTimeout(() => setFatigueAlert(null), 4000);
    }

    await addLog(newLog);
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-muted animate-pulse">
        Loading exercises...
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 pb-24">
      <Header />

      <FilterBar
        filterState={filterState}
        setFilter={setFilter}
        options={options}
      />

      {fatigueAlert && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="fixed top-24 right-4 z-50 bg-red-500/90 text-white px-4 py-2 rounded-lg shadow-lg backdrop-blur-md border border-red-400 font-bold"
        >
          {fatigueAlert}
        </motion.div>
      )}

      <LayoutGroup>
        <motion.div layout className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 auto-rows-fr">
          <AnimatePresence>
            {filteredExercises.map(exercise => (
              <motion.div
                layout
                key={exercise.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
                className="h-full"
              >
                <ZonalSwipeCard
                  exercise={exercise}
                  recentLogs={getExerciseHistory(exercise.id)}
                  isCompletedToday={isCompletedToday(exercise.id)}
                  suggestion={calculateSuggestion(state.logs, exercise.id, checkFatigue(state.logs, exercise.id, now))}
                  onClick={() => setSelectedExercise(exercise)}
                  onQuickLog={(rpe) => handleQuickLog(exercise, rpe)}
                />
              </motion.div>
            ))}
          </AnimatePresence>

          {filteredExercises.length === 0 && (
            <div className="col-span-full text-center py-12 text-muted">
              No exercises found matching criteria.
            </div>
          )}
        </motion.div>
      </LayoutGroup>

      <LogEntryModal
        isOpen={!!selectedExercise}
        exercise={selectedExercise}
        onClose={() => setSelectedExercise(null)}
        onSave={addLog}
      />
    </div>
  );
}
