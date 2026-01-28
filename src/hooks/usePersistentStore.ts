import { useState, useEffect, useCallback } from 'react';
import { DataService } from '../services/DataService';
import type { AppState, ExerciseCatalog, WorkoutLog } from '../types/models';
import { INITIAL_EXERCISES } from '../data/initialExercises';
import { INITIAL_STATE } from '../data/constants';

interface UsePersistentStoreResult {
  state: AppState;
  loading: boolean;
  error: string | null;
  saveData: (newState: AppState) => Promise<boolean>;
  addExercise: (exercise: ExerciseCatalog) => Promise<boolean>;
  addLog: (log: WorkoutLog) => Promise<boolean>;
  removeLog: (logId: string) => Promise<boolean>;
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
        // 1. Rebuild the exercise map from current source code logic
        // This ensures that regardless of what's in storage, we use the latest exercise definitions/IDs
        const currentExerciseMap: Record<number, ExerciseCatalog> = {};
        INITIAL_EXERCISES.forEach(ex => {
          currentExerciseMap[ex.id] = ex;
        });

        // 2. Load existing data
        // LocalStorage is sync, but we treat it as an effect to not block render
        const loadedData = DataService.load();

        let finalState: AppState;

        if (loadedData) {
          // 3a. If data exists, implement SMART MERGE of exercises
          // Goal: Update static definitions (name, tags) from catalog, but PRESERVE user customizations (baseWeight)
          const mergedExercises = { ...loadedData.exercises };

          INITIAL_EXERCISES.forEach(catalogEx => {
            const existing = mergedExercises[catalogEx.id];
            if (existing) {
              // Update static fields, keep dynamic ones
              mergedExercises[catalogEx.id] = {
                ...existing,
                name: catalogEx.name,
                muscleGroup: catalogEx.muscleGroup,
                equipment: catalogEx.equipment,
                tags: catalogEx.tags,
                // baseWeight comes from 'existing', so we don't overwrite it
              };
            } else {
              // New exercise in catalog
              mergedExercises[catalogEx.id] = catalogEx;
            }
          });

          finalState = {
            ...INITIAL_STATE,
            ...loadedData,
            exercises: mergedExercises
          };
        } else {
          // 3b. If no data, initialize fresh with the current exercises
          finalState = {
            ...INITIAL_STATE,
            exercises: currentExerciseMap
          };
        }

        // 4. Update state and Persist immediately
        // This effectively "migrates" the storage to the new ID structure on first load
        setState(finalState);
        DataService.save(finalState);

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

  // Helper to remove a log
  const removeLog = useCallback(async (logId: string) => {
    return batchUpdate(prev => ({
      ...prev,
      logs: prev.logs.filter(log => log.id !== logId),
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
    removeLog,
    batchUpdate,
    clearData,
  };
}
