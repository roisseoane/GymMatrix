/**
 * Generates a context key for the transition engine based on the current date and time.
 * Key format: "day-timeWindow"
 * - day: 0-6 (Sunday-Saturday)
 * - timeWindow: 0-5 (4-hour blocks: 0-4, 4-8, 8-12, 12-16, 16-20, 20-24)
 *
 * @param date Optional date object, defaults to now.
 * @returns A string key representing the temporal context.
 */
export function generateContextKey(date: Date = new Date()): string {
  const day = date.getDay(); // 0-6
  const hour = date.getHours(); // 0-23
  const timeWindow = Math.floor(hour / 4); // 0-5
  return `${day}-${timeWindow}`;
}
