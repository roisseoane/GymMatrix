import { useState, useRef, useEffect } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { ExerciseCard } from './ExerciseCard';
import type { ExerciseCatalog } from '../types/models';
import { useTranslation } from '../hooks/useTranslation';

interface ZonalSwipeCardProps {
  exercise: ExerciseCatalog;
  recentLogs?: number[];
  isCompletedToday?: boolean;
  isSuggested?: boolean;
  isLastLogWarmup?: boolean;
  suggestion?: string | null;
  onClick?: () => void;
  onQuickLog: (rpe: number) => void;
}

export function ZonalSwipeCard({
  exercise,
  recentLogs,
  isCompletedToday,
  isSuggested,
  isLastLogWarmup,
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

  const opacityEasy = useTransform(x, [safeWidth * 0.15, safeWidth * 0.25, safeWidth * 0.45], [0, 1, 0]);
  const opacityHard = useTransform(x, [safeWidth * 0.45, safeWidth * 0.55, safeWidth * 0.75], [0, 1, 0]);
  const opacityFail = useTransform(x, [safeWidth * 0.75, safeWidth * 0.85], [0, 1]);

  return (
    <div ref={containerRef} className="relative w-full h-full select-none rounded-xl overflow-hidden">
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
        layout="position"
        drag="x"
        dragDirectionLock
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={{ right: 1, left: 0.05 }}
        dragMomentum={false}
        dragTransition={{ bounceStiffness: 300, bounceDamping: 20 }}
        onDragStart={() => setSwiping(true)}
        onDragEnd={() => {
          setSwiping(false);
          const currentX = x.get();
          // Release logic with percentage thresholds
          if (currentX > safeWidth * 0.75) {
            onQuickLog(10);
          } else if (currentX > safeWidth * 0.45) {
            onQuickLog(8.5);
          } else if (currentX > safeWidth * 0.15) {
            onQuickLog(7);
          }
        }}
        style={{ x, scale, touchAction: 'pan-y' }}
        animate={isSuggested ? {
          boxShadow: [
            "0 0 0 1px rgba(6,182,212,0.3)",
            "0 0 0 3px rgba(6,182,212,0.6)",
            "0 0 0 1px rgba(6,182,212,0.3)"
          ]
        } : {}}
        transition={isSuggested ? {
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        } : undefined}
        className={`relative z-10 h-full bg-surface rounded-xl shadow-sm ${isSuggested ? 'border border-cyan-500/50' : ''} ${isLastLogWarmup ? 'bg-blue-500/5 border-blue-500/20' : ''}`}
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
      {/* Suggested Badge */}
        {isSuggested && (
          <div className="absolute top-2 right-2 bg-cyan-500/20 text-cyan-400 text-[10px] font-bold px-2 py-0.5 rounded border border-cyan-500/40 shadow-[0_0_10px_rgba(6,182,212,0.2)]">
            {t('suggested_next')}
          </div>
        )}
      </motion.div>
    </div>
  );
}
