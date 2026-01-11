import { usePersistentStore } from '../hooks/usePersistentStore';
import { ExerciseCard } from './ExerciseCard';
import { useMemo } from 'react';

export function ExerciseMatrix() {
  const { state, loading } = usePersistentStore();

  const exercises = useMemo(() => {
    return Object.values(state.exercises).sort((a, b) => a.name.localeCompare(b.name));
  }, [state.exercises]);

  // Mock data generator for visualization purposes (since we have no real logs yet)
  const getMockHistory = (id: number) => {
    // Generate deterministic random-ish data based on ID
    const base = (id * 13) % 50 + 50;
    return [base, base + 5, base + 2, base + 8, base + 10];
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-muted animate-pulse">
        Loading exercises...
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold text-text mb-6 tracking-tight">Library</h1>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 auto-rows-fr">
        {exercises.map(exercise => (
          <div key={exercise.id} className="h-full">
            <ExerciseCard
              exercise={exercise}
              recentLogs={getMockHistory(exercise.id)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
