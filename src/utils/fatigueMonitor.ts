import type { WorkoutLog } from '../types/models';

/**
 * Checks if the user is showing signs of Central Nervous System (CNS) fatigue.
 * Logic:
 * - Calculates the average time gap between workouts for this specific exercise.
 * - If the current gap (since last log) is significantly longer (> 1.2x avg),
 *   it implies higher recovery needs or "laziness" which we treat as fatigue context.
 *   (Note: Real CNS fatigue is complex; this is a simplified heuristic based on prompt requirements about "latency").
 */
export function checkFatigue(logs: WorkoutLog[], exerciseId: number, currentTimestamp: number): boolean {
  const exerciseLogs = logs
    .filter(l => l.exerciseId === exerciseId)
    .sort((a, b) => a.timestamp - b.timestamp);

  if (exerciseLogs.length < 2) return false;

  // Calculate historic gaps
  let totalGap = 0;
  let gapCount = 0;

  for (let i = 1; i < exerciseLogs.length; i++) {
    const gap = exerciseLogs[i].timestamp - exerciseLogs[i - 1].timestamp;
    // Filter out huge gaps (e.g. > 14 days) which might be breaks, not recovery latency
    if (gap < 14 * 24 * 60 * 60 * 1000) {
      totalGap += gap;
      gapCount++;
    }
  }

  if (gapCount === 0) return false;

  const avgGap = totalGap / gapCount;
  const lastLogTime = exerciseLogs[exerciseLogs.length - 1].timestamp;
  const currentGap = currentTimestamp - lastLogTime;

  // Threshold: 20% exceeding average
  return currentGap > avgGap * 1.2;
}
