import { generateContextKey } from '../utils/transitionUtils';
import type { TransitionMap, AppState } from '../types/models';

export class SmartRoutingEngine {
  private static BASE_WEIGHT = 1;
  private static INCREMENT = 1;
  private static REINFORCEMENT_FACTOR = 1.5;
  private static PENALTY_FACTOR = 0.9;
  private static MIN_LOGS_FOR_SUGGESTION = 30;

  /**
   * Updates the transition map based on behavioral feedback.
   * - If the user followed the suggestion: Boosts the weight (Reinforcement).
   * - If the user ignored the suggestion: Penalizes the suggestion and records the actual path.
   *
   * @param currentMap The current TransitionMap.
   * @param fromId The ID of the previous exercise.
   * @param actualToId The ID of the exercise actually selected by the user.
   * @param suggestedToId The ID of the exercise that was suggested (if any).
   * @returns A new deep-cloned TransitionMap.
   */
  static processFeedback(
    currentMap: TransitionMap,
    fromId: number,
    actualToId: number,
    suggestedToId?: number | null
  ): TransitionMap {
    const key = generateContextKey();
    const newMap: TransitionMap = JSON.parse(JSON.stringify(currentMap));

    // Ensure structure exists
    if (!newMap[key]) newMap[key] = {};
    if (!newMap[key][fromId]) newMap[key][fromId] = {};

    const transitions = newMap[key][fromId];

    // Case 1: User followed suggestion (Reinforcement)
    if (suggestedToId && actualToId === suggestedToId) {
      if (!transitions[actualToId]) {
        transitions[actualToId] = this.BASE_WEIGHT * this.REINFORCEMENT_FACTOR;
      } else {
        transitions[actualToId] += (this.INCREMENT * this.REINFORCEMENT_FACTOR);
      }
    }
    // Case 2: User ignored suggestion (Penalty + New Record)
    else {
      // Penalize the ignored suggestion if it exists
      if (suggestedToId && transitions[suggestedToId]) {
        transitions[suggestedToId] *= this.PENALTY_FACTOR;
      }

      // Record the actual transition (Standard)
      if (!transitions[actualToId]) {
        transitions[actualToId] = this.BASE_WEIGHT;
      } else {
        transitions[actualToId] += this.INCREMENT;
      }
    }

    return newMap;
  }

  /**
   * Updates the transition map with a new transition (Standard mode).
   * @deprecated Use processFeedback instead for learning capabilities.
   */
  static recordTransition(
    currentMap: TransitionMap,
    fromId: number,
    toId: number
  ): TransitionMap {
    return this.processFeedback(currentMap, fromId, toId, null);
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
