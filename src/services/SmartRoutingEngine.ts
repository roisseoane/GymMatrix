import { generateContextKey } from '../utils/transitionUtils';
import type { TransitionMap, AppState } from '../types/models';

export class SmartRoutingEngine {
  private static BASE_WEIGHT = 1;
  private static INCREMENT = 1;
  private static MIN_LOGS_FOR_SUGGESTION = 30;

  /**
   * Updates the transition map with a new transition.
   * Increments the weight for the from->to connection in the current time context.
   *
   * @param currentMap The current TransitionMap from the state.
   * @param fromId The ID of the exercise just completed (or previous).
   * @param toId The ID of the exercise currently being started/logged.
   * @returns A new deep-cloned TransitionMap with the updated weights.
   */
  static recordTransition(
    currentMap: TransitionMap,
    fromId: number,
    toId: number
  ): TransitionMap {
    const key = generateContextKey();

    // Deep clone to avoid mutation of the original state object
    const newMap: TransitionMap = JSON.parse(JSON.stringify(currentMap));

    if (!newMap[key]) {
      newMap[key] = {};
    }
    if (!newMap[key][fromId]) {
      newMap[key][fromId] = {};
    }

    if (!newMap[key][fromId][toId]) {
      newMap[key][fromId][toId] = this.BASE_WEIGHT;
    } else {
      newMap[key][fromId][toId] += this.INCREMENT;
    }

    return newMap;
  }

  /**
   * Suggests the next exercise based on the last completed exercise and current context.
   *
   * @param state The global AppState containing logs and transitionMap.
   * @param lastExerciseId The ID of the last completed exercise.
   * @returns The ID of the suggested exercise, or null if no suggestion is available or data is insufficient.
   */
  static getSuggestion(
    state: AppState,
    lastExerciseId: number
  ): number | null {
    // Safety Guard: Require a minimum amount of historical data before making predictions
    if (state.logs.length < this.MIN_LOGS_FOR_SUGGESTION) {
      return null;
    }

    const key = generateContextKey();
    const transitions = state.transitionMap[key]?.[lastExerciseId];

    if (!transitions) {
      return null;
    }

    let bestId: number | null = null;
    let maxWeight = -1;

    for (const [toIdStr, weight] of Object.entries(transitions)) {
      if (weight > maxWeight) {
        maxWeight = weight;
        bestId = Number(toIdStr);
      }
    }

    return bestId;
  }
}
