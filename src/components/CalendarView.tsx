import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { usePersistentStore } from '../hooks/usePersistentStore';
import { MUSCLE_COLORS } from '../data/constants';
import { DailyLogSheet } from './DailyLogSheet';

// Helper to get days in a month
function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

// Helper to get day of week for the 1st of the month (0=Sun, 6=Sat)
function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

interface DayData {
  day: number;
  hasLog: boolean;
  predominantMuscle?: string;
  count: number;
}

interface MonthData {
  year: number;
  month: number;
  days: DayData[];
  offset: number; // Empty cells before 1st
}

export function CalendarView() {
  const { state } = usePersistentStore();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Generate last 12 months + current
  const months = useMemo(() => {
    const result: MonthData[] = [];
    const today = new Date();

    // Generate current month and 11 previous months
    for (let i = 0; i < 12; i++) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const year = d.getFullYear();
      const month = d.getMonth();
      const numDays = getDaysInMonth(year, month);
      const offset = getFirstDayOfMonth(year, month);

      const days: DayData[] = [];
      for (let day = 1; day <= numDays; day++) {
        // Check logs for this day
        // Optimization: This loop runs 12 * 30 = 360 times.
        // Filtering logs (potentially large array) inside this loop is O(N*M).
        // We should pre-process logs into a Map outside.
        // But for now, let's defer that optimization to the next hook.
        days.push({ day, hasLog: false, count: 0 });
      }

      result.push({ year, month, days, offset });
    }
    return result;
  }, []); // Only runs once on mount essentially

  // Pre-process logs into a Map<YYYY-MM-DD, { count, muscle }>
  const logMap = useMemo(() => {
    const map = new Map<string, { count: number, muscles: Record<string, number> }>();

    state.logs.forEach(log => {
      const date = new Date(log.timestamp);
      const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`; // Local date key logic matches usage

      if (!map.has(key)) {
        map.set(key, { count: 0, muscles: {} });
      }

      const entry = map.get(key)!;
      entry.count++;

      const exercise = state.exercises[log.exerciseId];
      if (exercise) {
        entry.muscles[exercise.muscleGroup] = (entry.muscles[exercise.muscleGroup] || 0) + 1;
      }
    });

    return map;
  }, [state.logs, state.exercises]);

  return (
    <div className="container mx-auto p-4">
      {/* Sticky Header for Calendar Controls */}
      <div className="sticky top-[80px] z-40 bg-black/80 backdrop-blur-md pb-2 -mx-4 px-4 pt-2 border-b border-white/5 mb-4 shadow-xl shadow-black/20">
         <div className="flex justify-between items-center h-8">
            <span className="text-sm font-bold text-muted uppercase tracking-wider">History</span>
         </div>
      </div>

      <div className="flex flex-col gap-8 will-change-transform">
        {months.map((m) => (
          <div key={`${m.year}-${m.month}`} className="flex flex-col gap-2">
            <h3 className="text-lg font-bold text-white px-1">
              {new Date(m.year, m.month).toLocaleString(undefined, { month: 'long', year: 'numeric' })}
            </h3>

            <div className="grid grid-cols-7 gap-2">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                <div key={i} className="text-center text-xs text-muted font-bold py-1">
                  {d}
                </div>
              ))}

              {/* Offset for first day */}
              {Array.from({ length: m.offset }).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}

              {/* Days */}
              {m.days.map((d) => {
                const key = `${m.year}-${m.month}-${d.day}`;
                const logData = logMap.get(key);
                const hasLog = !!logData;

                // Determine predominant muscle
                let predominantMuscle = '';
                if (logData) {
                    let maxCount = 0;
                    Object.entries(logData.muscles).forEach(([muscle, count]) => {
                        if (count > maxCount) {
                            maxCount = count;
                            predominantMuscle = muscle;
                        }
                    });
                }

                const auraColor = predominantMuscle && MUSCLE_COLORS[predominantMuscle]
                    ? MUSCLE_COLORS[predominantMuscle]
                    : 'rgba(255, 255, 255, 0.1)';

                return (
                  <motion.button
                    key={d.day}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                        if (hasLog) {
                           setSelectedDate(new Date(m.year, m.month, d.day));
                        }
                    }}
                    className={`
                      aspect-square rounded-xl border relative overflow-hidden flex flex-col justify-between p-1.5 transition-colors
                      ${hasLog ? 'bg-surface border-white/10 hover:bg-white/5 cursor-pointer' : 'bg-transparent border-transparent opacity-50 cursor-default'}
                    `}
                  >
                     <span className={`text-xs font-bold z-10 ${hasLog ? 'text-white' : 'text-muted'}`}>
                        {d.day}
                     </span>

                     {hasLog && (
                        <>
                            {/* Predominant Muscle Aura */}
                            <div
                                className="absolute inset-0 opacity-40 blur-xl"
                                style={{ backgroundColor: auraColor }}
                            />

                            {/* Dot Indicator */}
                            <div
                                className="w-1.5 h-1.5 rounded-full self-end z-10 shadow-[0_0_5px_rgba(255,255,255,0.5)]"
                                style={{ backgroundColor: auraColor.replace('0.3', '1') }}
                            />
                        </>
                     )}
                  </motion.button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <DailyLogSheet
        isOpen={!!selectedDate}
        onClose={() => setSelectedDate(null)}
        date={selectedDate || undefined}
      />
    </div>
  );
}
