import { useState, useRef } from 'react';
import { useDrag } from '@use-gesture/react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { ExerciseCard } from './ExerciseCard';
import type { ExerciseCatalog } from '../types/models';
import { useTranslation } from '../hooks/useTranslation';

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
  const { t } = useTranslation();
  const x = useMotionValue(0);
  const [swiping, setSwiping] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Background colors mapped to drag distance
  const bg = useTransform(x,
    [0, 100, 200, 300],
    ['#171717', '#22c55e', '#eab308', '#ef4444'] // Default -> Green -> Yellow -> Red
  );

  const scale = useTransform(x, [0, 200], [1, 1.05]);

  const bind = useDrag(({ active, movement: [mx, my], cancel }) => {
    // Conflict resolution: Cancel if initial Y movement > 10px
    if (active && Math.abs(my) > 10) {
      cancel();
      return;
    }

    setSwiping(active);

    if (active) {
      x.set(mx);
    } else {
      const width = containerRef.current?.offsetWidth || 350;
      // Release logic with percentage thresholds
      // 70% ~ Red, 45% ~ Yellow, 20% ~ Green
      if (mx > width * 0.7) {
        // Red Zone -> RPE 10
        onQuickLog(10);
      } else if (mx > width * 0.45) {
        // Yellow Zone -> RPE 8.5
        onQuickLog(8.5);
      } else if (mx > width * 0.2) {
        // Green Zone -> RPE 7
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
    <div ref={containerRef} className="relative w-full h-full touch-none select-none rounded-xl overflow-hidden">
      {/* Background Layer (Revealed on Swipe) */}
      <motion.div
        style={{ backgroundColor: bg }}
        className="absolute inset-0 flex items-center justify-start pl-4 rounded-xl z-0"
      >
        <span className="text-white font-bold text-lg uppercase tracking-widest opacity-80">
          {x.get() > 250 ? t('swipe_failure') : x.get() > 150 ? t('swipe_hard') : x.get() > 80 ? t('swipe_easy') : ''}
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
