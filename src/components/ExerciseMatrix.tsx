import { usePersistentStore } from '../hooks/usePersistentStore';
import { ExerciseCard } from './ExerciseCard';
import { useFilterEngine } from '../hooks/useFilterEngine';
import { FilterBar } from './FilterBar';

export function ExerciseMatrix() {
  const { state, loading } = usePersistentStore();

  const { filteredExercises, filterState, setFilter, options } = useFilterEngine(
    state.exercises,
    state.logs
  );

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

      <FilterBar
        filterState={filterState}
        setFilter={setFilter}
        options={options}
      />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 auto-rows-fr">
        {filteredExercises.map(exercise => (
          <div key={exercise.id} className="h-full">
            <ExerciseCard
              exercise={exercise}
              recentLogs={getMockHistory(exercise.id)}
            />
          </div>
        ))}

        {filteredExercises.length === 0 && (
          <div className="col-span-full text-center py-12 text-muted">
            No exercises found matching criteria.
          </div>
        )}
      </div>
    </div>
  );
}
