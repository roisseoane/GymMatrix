import { useCallback } from 'react';
import { SmartRoutingEngine } from '../services/SmartRoutingEngine';
import type { AppState } from '../types/models';

/**
 * Hook to interface with the SmartRoutingEngine.
 * Provides methods to record transitions and get exercise suggestions.
 *
 * @param state The current application state.
 * @param saveData Function to persist the updated state.
 */
export function useSmartRouting(
  state: AppState,
  saveData: (newState: AppState) => Promise<boolean>
) {
  const recordTransition = useCallback(
    async (fromId: number, toId: number) => {
      try {
        const newMap = SmartRoutingEngine.recordTransition(
          state.transitionMap,
          fromId,
          toId
        );

        await saveData({
          ...state,
          transitionMap: newMap
        });
      } catch (error) {
        console.error('Failed to record transition:', error);
      }
    },
    [state, saveData]
  );

  const getSuggestion = useCallback(
    (lastExerciseId: number) => {
      return SmartRoutingEngine.getSuggestion(state, lastExerciseId);
    },
    [state]
  );

  return {
    recordTransition,
    getSuggestion
  };
}
