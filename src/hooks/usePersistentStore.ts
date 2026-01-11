import { useState, useEffect, useCallback } from 'react';
import { DataService } from '../services/DataService';
import type { AppState, ExerciseCatalog, WorkoutLog } from '../types/models';

const INITIAL_STATE: AppState = {
  exercises: {},
  logs: [],
};

interface UsePersistentStoreResult {
  state: AppState;
  loading: boolean;
  error: string | null;
  saveData: (newState: AppState) => Promise<boolean>;
  addExercise: (exercise: ExerciseCatalog) => Promise<boolean>;
  addLog: (log: WorkoutLog) => Promise<boolean>;
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
          setState(loadedData);
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

  // Helper to add an exercise
  const addExercise = useCallback(async (exercise: ExerciseCatalog) => {
    const newState = {
      ...state,
      exercises: {
        ...state.exercises,
        [exercise.id]: exercise,
      },
    };
    return saveData(newState);
  }, [state, saveData]);

  // Helper to add a log
  const addLog = useCallback(async (log: WorkoutLog) => {
    const newState = {
      ...state,
      logs: [...state.logs, log],
    };
    return saveData(newState);
  }, [state, saveData]);

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
    clearData,
  };
}
