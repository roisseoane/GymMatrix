import { useState, useEffect, useCallback } from 'react';
import { DataService } from '../services/DataService';
import type { AppState, ExerciseCatalog, WorkoutLog } from '../types/models';
import { INITIAL_EXERCISES } from '../data/initialExercises';

const INITIAL_STATE: AppState = {
  exercises: {},
  logs: [],
  transitionMap: {},
  activeNextSuggestion: [],
  session: {
    startTime: null,
    totalPausedTime: 0,
    isPaused: false,
    lastPauseStartTime: null,
  },
};

interface UsePersistentStoreResult {
  state: AppState;
  loading: boolean;
  error: string | null;
  saveData: (newState: AppState) => Promise<boolean>;
  addExercise: (exercise: ExerciseCatalog) => Promise<boolean>;
  addLog: (log: WorkoutLog) => Promise<boolean>;
  batchUpdate: (updater: (prevState: AppState) => AppState) => Promise<boolean>;
  clearData: () => void;
}

export function usePersistentStore(): UsePersistentStoreResult {
  const [state, setState] = useState<AppState>(INITIAL_STATE);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Load data on mount
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        // Simulate async if needed, or just run synchronous load
        // LocalStorage is sync, but we treat it as an effect to not block render
        const loadedData = DataService.load();
        if (loadedData) {
          // Merge with INITIAL_STATE to ensure new fields (like transitionMap) exist if loading old data
          setState({ ...INITIAL_STATE, ...loadedData });
        } else {
          // Initialize with seed data if storage is empty
          const seedExercises: Record<number, ExerciseCatalog> = {};
          INITIAL_EXERCISES.forEach(ex => {
            seedExercises[ex.id] = ex;
          });
          const seedState = { ...INITIAL_STATE, exercises: seedExercises };
          setState(seedState);
          DataService.save(seedState);
        }
      } catch (err) {
        setError('Failed to load data.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Generic save function
  const saveData = useCallback(async (newState: AppState): Promise<boolean> => {
    setError(null);
    try {
      // Optimistically update state
      setState(newState);
      // Persist to storage
      DataService.save(newState);
      return true;
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to save data');
      }
      return false;
    }
  }, []);

  // Batch update helper to allow atomic updates based on latest state
  const batchUpdate = useCallback(async (updater: (prevState: AppState) => AppState): Promise<boolean> => {
    setError(null);
    try {
      // Use functional state update to ensure we have the latest state from React

      // We need to use setState's callback to get the latest state safely,
      // but we also need to persist it. Since DataService.save is sync (localStorage),
      // we can do this.

      setState((prev) => {
        const newState = updater(prev);
        try {
            DataService.save(newState);
        } catch (err) {
            console.error("Failed to save during batch update", err);
            // In a real app we might want to revert state here or handle error better
        }
        return newState;
      });

      return true; // We assume optimistic success mostly
    } catch (err) {
       console.error(err);
       return false;
    }
  }, []);

  // Helper to add an exercise
  const addExercise = useCallback(async (exercise: ExerciseCatalog) => {
    return batchUpdate(prev => ({
      ...prev,
      exercises: {
        ...prev.exercises,
        [exercise.id]: exercise,
      },
    }));
  }, [batchUpdate]);

  // Helper to add a log
  const addLog = useCallback(async (log: WorkoutLog) => {
    return batchUpdate(prev => ({
      ...prev,
      logs: [...prev.logs, log],
    }));
  }, [batchUpdate]);

  const clearData = useCallback(() => {
    DataService.clear();
    setState(INITIAL_STATE);
  }, []);

  return {
    state,
    loading,
    error,
    saveData,
    addExercise,
    addLog,
    batchUpdate,
    clearData,
  };
}
