import { useState, useCallback } from 'react';
import { usePersistentStore } from '../hooks/usePersistentStore';
import { useFilterEngine } from '../hooks/useFilterEngine';
import { useSmartRouting } from '../hooks/useSmartRouting';
import { FilterBar } from './FilterBar';
import { Header } from './Header';
import { LogEntryModal } from './LogEntryModal';
import { DailyLogSheet } from './DailyLogSheet';
import type { ExerciseCatalog } from '../types/models';
import { LayoutGroup, AnimatePresence, motion } from 'framer-motion';
import { calculateSuggestion } from '../utils/predictiveLoad';
import { ZonalSwipeCard } from './ZonalSwipeCard';
import { checkFatigue } from '../utils/fatigueMonitor';
import type { WorkoutLog, WorkoutSet } from '../types/models';

export function ExerciseMatrix() {
  const { state, loading, batchUpdate, addExercise } = usePersistentStore();
  const { getUpdatedMap, getSuggestion } = useSmartRouting();
  const [selectedExercise, setSelectedExercise] = useState<ExerciseCatalog | null>(null);
  const [isDailyLogOpen, setIsDailyLogOpen] = useState(false);
  const [fatigueAlert, setFatigueAlert] = useState<string | null>(null);

  // Use state for current time to be pure
  // Initialize lazily to avoid impure call warning, though Date.now() in initializer is generally safe for initial state
  const [now] = useState(() => Date.now());

  const { filteredExercises, filterState, setFilter, options } = useFilterEngine(
    state.exercises,
    state.logs,
    state.activeNextSuggestion
  );

  // Helper to extract log history for an exercise
  const getExerciseHistory = useCallback((exerciseId: number) => {
    return state.logs
      .filter(log => log.exerciseId === exerciseId)
      .sort((a, b) => a.timestamp - b.timestamp)
      .map(log => {
         // Return max weight of the session
         // Handle subSets structure: assume subSets[0] is primary for graph unless advanced logic needed
         return Math.max(...log.sets.map(s => {
             if (s.subSets && s.subSets.length > 0) return s.subSets[0].weight;
             // Fallback for legacy data
             const legacySet = s as unknown as { weight: number };
             return legacySet.weight || 0;
         }));
      });
  }, [state.logs]);

  // Helper to check if exercise was done today
  const isCompletedToday = useCallback((exerciseId: number) => {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    return state.logs.some(log => log.exerciseId === exerciseId && log.timestamp >= startOfDay);
  }, [state.logs]);

  // Shared logic for processing a new log (Quick Log or Modal Save)
  const processLogUpdate = useCallback(async (newLog: WorkoutLog) => {
    // Atomic update
    return batchUpdate(prevState => {
      // 1. Identify previous log for transition recording
      const sortedLogs = [...prevState.logs].sort((a, b) => b.timestamp - a.timestamp);
      const previousLog = sortedLogs.length > 0 ? sortedLogs[0] : null;

      let newMap = prevState.transitionMap;
      if (previousLog) {
        // Record transition: Previous -> New
        // Use the first (dominant) suggestion for feedback logic
        const dominantSuggestion = prevState.activeNextSuggestion ? prevState.activeNextSuggestion[0] : null;
        newMap = getUpdatedMap(
          prevState.transitionMap,
          previousLog.exerciseId,
          newLog.exerciseId,
          dominantSuggestion
        );
      }

      // 2. Add Log
      const newLogs = [...prevState.logs, newLog];

      // 3. Proactive Suggestion (based on new state context)
      // Note: getSuggestion checks historical logs. We just added one, but check requires 30+.
      // We pass the potentially updated logs to getSuggestion if it took state, but getSuggestion takes "state".
      // We construct a temporary state for the suggestion engine.
      const tempState = { ...prevState, logs: newLogs, transitionMap: newMap };
      const suggestion = getSuggestion(tempState, newLog.exerciseId);

      return {
        ...prevState,
        logs: newLogs,
        transitionMap: newMap,
        activeNextSuggestion: suggestion
      };
    });
  }, [batchUpdate, getUpdatedMap, getSuggestion]);

  const handleQuickLog = async (exercise: ExerciseCatalog, rpe: number) => {
    // Clone last log logic
    const exerciseLogs = state.logs
      .filter(l => l.exerciseId === exercise.id)
      .sort((a, b) => b.timestamp - a.timestamp);

    if (exerciseLogs.length === 0) return; // Cannot quick log without history

    const lastLog = exerciseLogs[0];
    const newSets: WorkoutSet[] = lastLog.sets.map(s => {
      // Legacy handling
      let currentSubSets = s.subSets;
      if (!currentSubSets || currentSubSets.length === 0) {
          const oldSet = s as unknown as { weight: number; reps: number; rpe: number };
          currentSubSets = [{
              weight: oldSet.weight,
              reps: oldSet.reps,
              rpe: oldSet.rpe
          }];
      }

      return {
        ...s,
        subSets: currentSubSets.map(sub => ({ ...sub, rpe }))
      };
    });

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

    return processLogUpdate(newLog);
  };

  // Enhanced save handler for modal
  // This function performs the "double action" atomically
  const handleModalSave = useCallback(async (log: WorkoutLog) => {
    return processLogUpdate(log);
  }, [processLogUpdate]);

  const handleUpdateExercise = useCallback(async (exercise: ExerciseCatalog) => {
    await addExercise(exercise);
  }, [addExercise]);

  if (loading) {
    return (
      <div className="p-8 text-center text-muted animate-pulse">
        Loading exercises...
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 pb-24">
      <div className="sticky top-0 z-50 bg-black/80 backdrop-blur-md pb-2 -mx-4 px-4 pt-4 border-b border-white/5 mb-4 shadow-xl shadow-black/20">
        <Header onOpenDailyLog={() => setIsDailyLogOpen(true)} />

        <FilterBar
          filterState={filterState}
          setFilter={setFilter}
          options={options}
        />
      </div>

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
                  isSuggested={state.activeNextSuggestion ? state.activeNextSuggestion[0] === exercise.id : false}
                  isLastLogWarmup={(() => {
                      const logs = state.logs.filter(l => l.exerciseId === exercise.id).sort((a, b) => b.timestamp - a.timestamp);
                      if (logs.length === 0 || !logs[0].sets || logs[0].sets.length === 0) return false;
                      // Check if the last set was a warmup
                      const lastSet = logs[0].sets[logs[0].sets.length - 1];
                      // Legacy check included via SetType or isWarmup flag
                      return lastSet.isWarmup || lastSet.type === 'WARMUP';
                  })()}
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
        lastLog={selectedExercise ? state.logs.filter(l => l.exerciseId === selectedExercise.id).sort((a, b) => b.timestamp - a.timestamp)[0] : undefined}
        onClose={() => setSelectedExercise(null)}
        onSave={handleModalSave}
        onUpdateExercise={handleUpdateExercise}
      />

      <DailyLogSheet
        isOpen={isDailyLogOpen}
        onClose={() => setIsDailyLogOpen(false)}
      />
    </div>
  );
}
