import { useState, useMemo } from 'react';
import type { ExerciseCatalog, WorkoutLog } from '../types/models';
import type { FilterState } from '../types/filters';
import { calculateExerciseStats, calculateSmartScore } from '../utils/smartSort';

export function useFilterEngine(
  exercises: Record<number, ExerciseCatalog>,
  logs: WorkoutLog[],
  suggestedId?: number | null
) {
  const [filterState, setFilterState] = useState<FilterState>({
    search: '',
    muscleGroup: 'All',
    equipment: 'All',
    sortBy: 'smart',
  });

  // 1. Calculate Stats (Memoized)
  const statsMap = useMemo(() => calculateExerciseStats(logs), [logs]);

  // 2. Derive Unique Options for Dropdowns
  const options = useMemo(() => {
    const muscles = new Set<string>();
    const equipment = new Set<string>();
    Object.values(exercises).forEach(ex => {
      muscles.add(ex.muscleGroup);
      equipment.add(ex.equipment);
    });
    return {
      muscles: ['All', ...Array.from(muscles).sort()],
      equipment: ['All', ...Array.from(equipment).sort()],
    };
  }, [exercises]);

  // 3. Filter and Sort (Memoized)
  const filteredExercises = useMemo(() => {
    let result = Object.values(exercises);

    // Filter: Search
    if (filterState.search) {
      const q = filterState.search.toLowerCase();
      result = result.filter(ex => ex.name.toLowerCase().includes(q));
    }

    // Filter: Muscle Group
    if (filterState.muscleGroup !== 'All') {
      result = result.filter(ex => ex.muscleGroup === filterState.muscleGroup);
    }

    // Filter: Equipment
    if (filterState.equipment !== 'All') {
      result = result.filter(ex => ex.equipment === filterState.equipment);
    }

    // Sort
    result.sort((a, b) => {
      // Priority 0: Suggested Exercise
      if (suggestedId) {
        if (a.id === suggestedId) return -1;
        if (b.id === suggestedId) return 1;
      }

      const statsA = statsMap[a.id];
      const statsB = statsMap[b.id];

      switch (filterState.sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);

        case 'frequency':
          // Higher frequency first
          return (statsB?.totalLogs || 0) - (statsA?.totalLogs || 0);

        case 'smart': {
          // Higher smart score first
          const scoreA = calculateSmartScore(statsA);
          const scoreB = calculateSmartScore(statsB);
          return scoreB - scoreA;
        }

        default:
          return 0;
      }
    });

    return result;
  }, [exercises, filterState, statsMap, suggestedId]);

  const setFilter = (key: keyof FilterState, value: string) => {
    setFilterState(prev => ({ ...prev, [key]: value }));
  };

  return {
    filterState,
    setFilter,
    filteredExercises,
    options,
    statsMap
  };
}
