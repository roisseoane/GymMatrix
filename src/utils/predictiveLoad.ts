import { type WorkoutLog } from '../types/models';

/**
 * Calculates a load suggestion based on the last session's RPE and Fatigue status.
 * Logic:
 * - If isFatigued: Reduce weight by 10% (CNS Deload).
 * - Else (Standard):
 *   - RPE <= 7 (RIR >= 3): Increase weight by ~2.5% OR add 1 rep. (We defaults to weight increase for now).
 *   - RPE >= 9 (RIR <= 1): Maintain weight and reps.
 *   - RPE 8 (RIR 2): Maintain (Sweet spot).
 */
export function calculateSuggestion(logs: WorkoutLog[], exerciseId: number, isFatigued: boolean): string | null {
  // 1. Get logs for this exercise, sorted by date desc
  const exerciseLogs = logs
    .filter(l => l.exerciseId === exerciseId)
    .sort((a, b) => b.timestamp - a.timestamp);

  if (exerciseLogs.length === 0) return null;

  const lastLog = exerciseLogs[0];
  if (!lastLog.series || lastLog.series.length === 0) return null;

  // 2. Find the "Top Set" (Highest Weight, then Highest Reps)
  // We rely on the new series model.
  const topSet = [...lastLog.series].sort((a, b) => {
    if (a.weight !== b.weight) return b.weight - a.weight;
    return b.reps - a.reps;
  })[0];

  const { weight, reps, rir } = topSet;

  // Convert RIR to RPE for heuristic logic logic
  // RPE = 10 - RIR (Approx)
  const rpe = 10 - rir;

  // Priority check: Fatigue / CNS Deload
  if (isFatigued) {
    const deloadWeight = weight * 0.90;
    const roundedDeload = Math.round(deloadWeight * 2) / 2;
    return `${roundedDeload}kg x ${reps} (CNS Deload)`;
  }

  // If no RPE recorded, default to maintain
  if (rpe === undefined || rpe === null) {
    return `${weight}kg x ${reps}`;
  }

  // 3. Apply Heuristics (Standard Progression)
  if (rpe <= 7) {
    // Increase load
    // 2.5% increase, rounded to nearest 1.25 (standard plate math) or just 1 decimal.
    // Let's just do simple 2.5% and format nicely.
    const newWeight = weight * 1.025;
    // Round to nearest 0.5kg
    const roundedWeight = Math.round(newWeight * 2) / 2;
    return `${roundedWeight}kg x ${reps}`;
  } else if (rpe >= 9) {
    // Maintain (or reduce, but we'll suggest maintain for now to not be discouraging)
    return `${weight}kg x ${reps}`;
  } else {
    // RPE 7.5 - 8.5 -> Maintain
    return `${weight}kg x ${reps}`;
  }
}
