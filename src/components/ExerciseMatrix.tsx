import { useState, useCallback } from 'react';
import { usePersistentStore } from '../hooks/usePersistentStore';
import { ExerciseCard } from './ExerciseCard';
import { useFilterEngine } from '../hooks/useFilterEngine';
import { FilterBar } from './FilterBar';
import { LogEntryModal } from './LogEntryModal';
import type { ExerciseCatalog } from '../types/models';
import { LayoutGroup, AnimatePresence, motion } from 'framer-motion';

export function ExerciseMatrix() {
  const { state, loading, addLog } = usePersistentStore();
  const [selectedExercise, setSelectedExercise] = useState<ExerciseCatalog | null>(null);

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

  if (loading) {
    return (
      <div className="p-8 text-center text-muted animate-pulse">
        Loading exercises...
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 pb-24">
      <h1 className="text-3xl font-bold text-text mb-6 tracking-tight">Library</h1>

      <FilterBar
        filterState={filterState}
        setFilter={setFilter}
        options={options}
      />

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
                <ExerciseCard
                  exercise={exercise}
                  recentLogs={getExerciseHistory(exercise.id)}
                  isCompletedToday={isCompletedToday(exercise.id)}
                  onClick={() => setSelectedExercise(exercise)}
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
