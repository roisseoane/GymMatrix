import type { WorkoutLog } from '../types/models';

export interface ExerciseStats {
  lastLogTimestamp: number;
  totalLogs: number;
}

export type ExerciseStatsMap = Record<number, ExerciseStats>;

/**
 * Calculates statistics for all exercises based on logs.
 * Optimized to run once when logs change.
 */
export function calculateExerciseStats(logs: WorkoutLog[]): ExerciseStatsMap {
  const stats: ExerciseStatsMap = {};

  for (const log of logs) {
    if (!stats[log.exerciseId]) {
      stats[log.exerciseId] = { lastLogTimestamp: 0, totalLogs: 0 };
    }

    const entry = stats[log.exerciseId];
    entry.totalLogs += 1;
    if (log.timestamp > entry.lastLogTimestamp) {
      entry.lastLogTimestamp = log.timestamp;
    }
  }

  return stats;
}

/**
 * Smart Sorting Algorithm.
 *
 * Heuristic:
 * - Prioritize exercises not done recently (High Recency Score).
 * - Give some weight to frequently done exercises (Habit Score), but with diminishing returns.
 * - New exercises (never done) get a high boost to encourage trying them.
 */
export function calculateSmartScore(stats: ExerciseStats | undefined): number {
  if (!stats || stats.totalLogs === 0) {
    // Never done: Give a high base score to surface new exercises,
    // but maybe below "very urgent" skipped exercises.
    // Let's say equivalent to 60 days of neglect.
    return 100;
  }

  const now = Date.now();
  const msPerDay = 24 * 60 * 60 * 1000;
  const daysSinceLast = (now - stats.lastLogTimestamp) / msPerDay;

  // Recency Component: Linear growth. 1 point per day.
  // Cap at 60 days to prevent infinite growth overshadowing everything.
  const recencyScore = Math.min(daysSinceLast, 60) * 2;

  // Frequency Component: Logarithmic growth.
  // We want popular exercises to be slightly higher, but not dominate simply because they are old favorites.
  // log2(1) = 0, log2(2) = 1, log2(32) = 5.
  const frequencyScore = Math.log2(stats.totalLogs + 1) * 5;

  // Total Score
  return recencyScore + frequencyScore;
}
