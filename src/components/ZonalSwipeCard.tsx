import { useState, useRef, useEffect } from 'react';
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
  const [width, setWidth] = useState(0);

  useEffect(() => {
    if (!containerRef.current) return;

    // Initial width
    setWidth(containerRef.current.offsetWidth);

    // Resize observer to keep width updated
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setWidth(entry.contentRect.width);
      }
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const safeWidth = width || 350; // Fallback to avoid 0 divisions/ranges

  // Background colors mapped to drag distance (percentage based)
  const bg = useTransform(x,
    [0, safeWidth * 0.15, safeWidth * 0.45, safeWidth * 0.75],
    ['#171717', '#22c55e', '#eab308', '#ef4444'] // Neutral -> Green -> Yellow -> Red
  );

  const scale = useTransform(x, [0, safeWidth * 0.5], [1, 1.05]);

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
      // Release logic with percentage thresholds
      // 75%+ ~ Red, 45-75% ~ Yellow, 15-45% ~ Green
      if (mx > safeWidth * 0.75) {
        // Red Zone -> RPE 10
        onQuickLog(10);
      } else if (mx > safeWidth * 0.45) {
        // Yellow Zone -> RPE 8.5
        onQuickLog(8.5);
      } else if (mx > safeWidth * 0.15) {
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

  // Derived state for label - reusing the reactive x value would be better but framer value doesn't trigger re-render
  // We can use a simpler approach for the label: rely on the fact that Framer Motion updates don't re-render React components
  // unless we use useTransform/useMotionValue in render.
  // We can use a small component or just accept that the text might lag if we don't bind it properly.
  // Actually, standard React render won't update when x changes unless we force it.
  // But we can use useTransform to get a string? No, motion components accept motion values for style only.
  // For text content, we can use a separate motion component or use onChange.
  // Let's use a simpler text derivation for now that updates on re-renders, but since drag doesn't re-render, text won't update!
  // We must fix this.

  // Solution: Create a Motion component for the text or use `useTransform` to map x to opacity of 3 distinct spans?
  // Or simpler: Map x to text content? Not directly supported.
  // Best: 3 spans with opacity mapped to x.

  const opacityEasy = useTransform(x, [safeWidth * 0.15, safeWidth * 0.25, safeWidth * 0.45], [0, 1, 0]);
  const opacityHard = useTransform(x, [safeWidth * 0.45, safeWidth * 0.55, safeWidth * 0.75], [0, 1, 0]);
  const opacityFail = useTransform(x, [safeWidth * 0.75, safeWidth * 0.85], [0, 1]);

  return (
    <div ref={containerRef} className="relative w-full h-full touch-none select-none rounded-xl overflow-hidden">
      {/* Background Layer (Revealed on Swipe) */}
      <motion.div
        style={{ backgroundColor: bg }}
        className="absolute inset-0 flex items-center justify-start pl-4 rounded-xl z-0"
      >
        <div className="relative font-bold text-lg uppercase tracking-widest text-white/80">
          <motion.span style={{ opacity: opacityEasy, position: 'absolute', left: 0, whiteSpace: 'nowrap' }}>
            {t('swipe_easy')}
          </motion.span>
          <motion.span style={{ opacity: opacityHard, position: 'absolute', left: 0, whiteSpace: 'nowrap' }}>
            {t('swipe_hard')}
          </motion.span>
          <motion.span style={{ opacity: opacityFail, position: 'absolute', left: 0, whiteSpace: 'nowrap' }}>
            {t('swipe_failure')}
          </motion.span>
        </div>
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
