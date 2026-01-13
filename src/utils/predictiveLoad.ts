import { type WorkoutLog, SetType } from '../types/models';

/**
 * Calculates a load suggestion based on the last session's RPE and Fatigue status.
 * Logic:
 * - If isFatigued: Reduce weight by 10% (CNS Deload).
 * - Else (Standard):
 *   - RPE <= 7: Increase weight by ~2.5% OR add 1 rep. (We defaults to weight increase for now).
 *   - RPE >= 9: Maintain weight and reps.
 *   - RPE 8: Maintain (Sweet spot).
 */
export function calculateSuggestion(logs: WorkoutLog[], exerciseId: number, isFatigued: boolean): string | null {
  // 1. Get logs for this exercise, sorted by date desc
  const exerciseLogs = logs
    .filter(l => l.exerciseId === exerciseId)
    .sort((a, b) => b.timestamp - a.timestamp);

  if (exerciseLogs.length === 0) return null;

  const lastLog = exerciseLogs[0];
  if (!lastLog.sets || lastLog.sets.length === 0) return null;

  // 2. Find the "Top Set" (Highest Weight, then Highest Reps)
  // We exclude WARMUP sets from progression calculation to avoid biasing strength predictions.
  // Using isWarmup flag or fallback to type.
  const validSets = lastLog.sets.filter(s => {
      if (s.isWarmup) return false;
      if (s.type === SetType.WARMUP) return false;
      return true;
  });

  if (validSets.length === 0) {
    // Fallback if only warmup sets exist (rare but possible)
    return null;
  }

  // Flatten sets into a comparable format for sorting.
  // Using subSets[0] as the representative for the set, as per instruction "if isDropSet is false, only process the first element"
  // Even if it is a drop set, the top weight is usually the first subset.
  // Handles legacy data fallback.
  const flatSets = validSets.map(s => {
      // Safe access for legacy structure
      if (!s.subSets || s.subSets.length === 0) {
          const oldSet = s as unknown as { weight: number; reps: number; rpe?: number };
          return {
              weight: oldSet.weight,
              reps: oldSet.reps,
              rpe: oldSet.rpe
          };
      }
      const first = s.subSets[0];
      return {
          weight: first.weight,
          reps: first.reps,
          rpe: first.rpe
      };
  });

  // We assume the user wants to progress their top set.
  const topSet = [...flatSets].sort((a, b) => {
    if (a.weight !== b.weight) return b.weight - a.weight;
    return b.reps - a.reps;
  })[0];

  const { weight, reps, rpe } = topSet;

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
