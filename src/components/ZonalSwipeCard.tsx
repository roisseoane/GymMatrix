import { useState } from 'react';
import { useDrag } from '@use-gesture/react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { ExerciseCard } from './ExerciseCard';
import type { ExerciseCatalog } from '../types/models';

interface ZonalSwipeCardProps {
  exercise: ExerciseCatalog;
  recentLogs?: number[];
  isCompletedToday?: boolean;
  suggestion?: string | null;
  onClick?: () => void;
  onQuickLog: (rpe: number) => void;
}

export function ZonalSwipeCard({
  exercise,
  recentLogs,
  isCompletedToday,
  suggestion,
  onClick,
  onQuickLog
}: ZonalSwipeCardProps) {
  const x = useMotionValue(0);
  const [swiping, setSwiping] = useState(false);

  // Background colors mapped to drag distance
  const bg = useTransform(x,
    [0, 100, 200, 300],
    ['#171717', '#22c55e', '#eab308', '#ef4444'] // Default -> Green -> Yellow -> Red
  );

  const scale = useTransform(x, [0, 200], [1, 1.05]);

  const bind = useDrag(({ active, movement: [mx] }) => {
    setSwiping(active);

    // Thresholds (assuming card width ~350px for mobile, let's use fixed pixels or percentages)
    // 30% ~ 100px, 60% ~ 200px, 90% ~ 300px
    if (active) {
      x.set(mx);
    } else {
      // Release logic
      if (mx > 250) {
        // Red Zone (90%+) -> RPE 10
        onQuickLog(10);
      } else if (mx > 150) {
        // Yellow Zone (60%+) -> RPE 8.5
        onQuickLog(8.5);
      } else if (mx > 80) {
        // Green Zone (30%+) -> RPE 7
        onQuickLog(7);
      }

      // Reset
      animate(x, 0, { type: 'spring', stiffness: 300, damping: 20 });
    }
  }, {
    axis: 'x',
    filterTaps: true,
    bounds: { left: 0 }, // Only swipe right
    rubberband: true
  });

  return (
    <div className="relative w-full h-full touch-none select-none rounded-xl overflow-hidden">
      {/* Background Layer (Revealed on Swipe) */}
      <motion.div
        style={{ backgroundColor: bg }}
        className="absolute inset-0 flex items-center justify-start pl-4 rounded-xl z-0"
      >
        <span className="text-white font-bold text-lg uppercase tracking-widest opacity-80">
          {x.get() > 250 ? 'Failure' : x.get() > 150 ? 'Hard' : x.get() > 80 ? 'Easy' : ''}
        </span>
      </motion.div>

      {/* Foreground Card */}
      <motion.div
        {...bind() as unknown as import('framer-motion').MotionProps}
        style={{ x, scale }}
        className="relative z-10 h-full bg-surface rounded-xl shadow-sm"
        // Prevent click when swiping
        onClick={() => {
          if (!swiping && x.get() === 0) {
            onClick?.();
          }
        }}
      >
        <ExerciseCard
          exercise={exercise}
          recentLogs={recentLogs}
          isCompletedToday={isCompletedToday}
          suggestion={suggestion}
          // We handle click in the wrapper
          onClick={undefined}
        />
      </motion.div>
    </div>
  );
}
