import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import type { SessionState } from '../types/models';

interface GlobalTimerProps {
  session: SessionState;
  onUpdate: (newSession: SessionState) => void;
}

export function GlobalTimer({ session, onUpdate }: GlobalTimerProps) {
  const [displayTime, setDisplayTime] = useState(0);
  const pressTimerRef = useRef<number | null>(null);

  // Auto-start session if not active
  useEffect(() => {
    if (session.startTime === null) {
      onUpdate({
        ...session,
        startTime: Date.now(),
        totalPausedTime: 0,
        isPaused: false,
        lastPauseStartTime: null,
      });
    }
  }, [session.startTime, onUpdate, session]);

  // Timer Tick
  useEffect(() => {
    if (!session.startTime) return;

    const tick = () => {
      const now = Date.now();
      if (session.isPaused) {
        // If paused, display time is fixed at the moment of pause
        // elapsed = (lastPauseStart - startTime) - totalPausedTime
        if (session.lastPauseStartTime) {
             const activeDuration = session.lastPauseStartTime - (session.startTime ?? Date.now()) - session.totalPausedTime;
             setDisplayTime(Math.max(0, activeDuration));
        }
      } else {
        // elapsed = (now - startTime) - totalPausedTime
        const activeDuration = now - (session.startTime ?? Date.now()) - session.totalPausedTime;
        setDisplayTime(Math.max(0, activeDuration));
      }
    };

    tick(); // Immediate update
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [session.startTime, session.isPaused, session.totalPausedTime, session.lastPauseStartTime]);

  const togglePause = useCallback(() => {
    const now = Date.now();
    if (session.isPaused) {
      // Resume
      // Calculate how long we were paused
      const pauseDuration = now - (session.lastPauseStartTime || now);
      onUpdate({
        ...session,
        isPaused: false,
        totalPausedTime: session.totalPausedTime + pauseDuration,
        lastPauseStartTime: null,
      });
    } else {
      // Pause
      onUpdate({
        ...session,
        isPaused: true,
        lastPauseStartTime: now,
      });
    }
  }, [session, onUpdate]);

  const handlePointerDown = () => {
    pressTimerRef.current = setTimeout(() => {
        // Haptic feedback
        if (navigator.vibrate) navigator.vibrate(50);
        togglePause();
    }, 800) as unknown as number; // Force cast for browser compatibility
  };

  const handlePointerUp = () => {
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
  };

  // Format MM:SS or HH:MM:SS
  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="relative">
        <motion.button
            className={`relative flex items-center justify-center gap-2 px-4 py-2 rounded-full border transition-colors select-none ${
                session.isPaused
                    ? 'bg-white/5 border-white/10 text-muted'
                    : 'bg-black/40 border-red-500/30 text-white backdrop-blur-sm'
            }`}
            animate={!session.isPaused ? {
                boxShadow: [
                    "0 0 0px rgba(239, 68, 68, 0)",
                    "0 0 10px rgba(239, 68, 68, 0.3)",
                    "0 0 0px rgba(239, 68, 68, 0)"
                ]
            } : {
                boxShadow: "none"
            }}
            transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
            }}
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            onClick={() => {
                // Prevent click if we want strict long press, but user said "toque largo o un icono"
                // Let's add an explicit small icon for click inside
            }}
        >
             {/* REC Dot */}
            <motion.div
                animate={!session.isPaused ? { opacity: [1, 0.5, 1] } : { opacity: 0.3 }}
                transition={{ duration: 2, repeat: Infinity }}
                className={`w-2 h-2 rounded-full ${session.isPaused ? 'bg-white/20' : 'bg-red-500'}`}
            />

            {/* Time - Fixed Width Container for Stability */}
            <div className="w-[4.5rem] flex justify-center">
                <span className={`font-mono font-bold tracking-wider tabular-nums text-center ${session.isPaused ? 'opacity-50' : ''}`}>
                    {formatTime(displayTime)}
                </span>
            </div>

            {/* Divider */}
            <div className="w-px h-4 bg-white/10 mx-1" />

            {/* Pause/Play Icon (Clickable) */}
            <div
                className="cursor-pointer p-1 -m-1 hover:text-primary transition-colors z-10"
                onClick={(e) => {
                    e.stopPropagation();
                    togglePause();
                }}
            >
                {session.isPaused ? (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                        <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
                    </svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                        <path fillRule="evenodd" d="M6.75 5.25a.75.75 0 01.75-.75H9a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H7.5a.75.75 0 01-.75-.75V5.25zm7.5 0A.75.75 0 0115 4.5h1.5a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H15a.75.75 0 01-.75-.75V5.25z" clipRule="evenodd" />
                    </svg>
                )}
            </div>

        </motion.button>
    </div>
  );
}
