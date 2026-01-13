import { useCallback } from 'react';
import { SmartRoutingEngine } from '../services/SmartRoutingEngine';
import type { AppState, TransitionMap } from '../types/models';

/**
 * Hook to interface with the SmartRoutingEngine.
 * Provides methods to record transitions and get exercise suggestions.
 *
 * @param state The current application state.
 */
export function useSmartRouting() {

  // Pure helper to get new map
  const getUpdatedMap = useCallback(
    (currentMap: TransitionMap, fromId: number, toId: number, suggestedId?: number | null) => {
      return SmartRoutingEngine.processFeedback(currentMap, fromId, toId, suggestedId);
    },
    []
  );

  const getSuggestion = useCallback(
    (currentState: AppState, lastExerciseId: number) => {
      return SmartRoutingEngine.getSuggestion(currentState, lastExerciseId);
    },
    []
  );

  return {
    getUpdatedMap,
    getSuggestion
  };
}
