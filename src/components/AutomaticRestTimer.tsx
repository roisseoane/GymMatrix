import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface AutomaticRestTimerProps {
  lastLogTimestamp: number | null;
  optimalRestTime?: number; // defaults to 90s
}

export function AutomaticRestTimer({ lastLogTimestamp, optimalRestTime = 90 }: AutomaticRestTimerProps) {
  const [elapsed, setElapsed] = useState(0);
  const [isOptimal, setIsOptimal] = useState(false);
  const notifiedRef = useRef<number | null>(null);

  useEffect(() => {
    if (!lastLogTimestamp) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const diffInSeconds = Math.floor((now - lastLogTimestamp) / 1000);
      setElapsed(diffInSeconds);

      // Trigger notification exactly once when we cross the threshold
      if (diffInSeconds >= optimalRestTime && diffInSeconds < optimalRestTime + 2) {
        if (notifiedRef.current !== lastLogTimestamp) {
            // Haptic feedback
            if (navigator.vibrate) {
                navigator.vibrate(200);
            }
            setIsOptimal(true);
            notifiedRef.current = lastLogTimestamp;

            // Turn off pulse after animation
            setTimeout(() => setIsOptimal(false), 3000);
        }
      }

      // Reset notification ref if timestamp changes (already handled by dependency but good for safety)
    }, 1000);

    return () => clearInterval(interval);
  }, [lastLogTimestamp, optimalRestTime]);

  // Reset local state if timestamp changes
  useEffect(() => {
    notifiedRef.current = null;
    setIsOptimal(false);
    // Initial calculation to avoid 1s delay
    if (lastLogTimestamp) {
        setElapsed(Math.floor((Date.now() - lastLogTimestamp) / 1000));
    }
  }, [lastLogTimestamp]);

  if (!lastLogTimestamp) return null;

  // Hide if more than 60 mins
  if (elapsed > 3600) return null;

  // Format MM:SS
  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;
  const timeString = `${mins}:${secs.toString().padStart(2, '0')}`;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -5 }}
        animate={{
            opacity: 1,
            y: 0,
            scale: isOptimal ? [1, 1.2, 1] : 1,
            color: isOptimal ? '#22c55e' : '#9ca3af' // Green-500 vs Gray-400
        }}
        exit={{ opacity: 0 }}
        transition={{
            type: "spring",
            stiffness: 500,
            damping: 30,
            color: { duration: 0.5 }
        }}
        className="flex items-center gap-2 bg-white/5 px-3 py-1 rounded-full border border-white/5 backdrop-blur-sm"
      >
        <span className="text-xs font-bold font-mono tracking-wider">
          {timeString}
        </span>
        {isOptimal && (
            <motion.div
                layoutId="timer-pulse"
                className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.8)]"
            />
        )}
      </motion.div>
    </AnimatePresence>
  );
}
