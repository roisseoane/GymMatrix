import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '../hooks/useTranslation';
import type { SessionState } from '../types/models';

interface SessionControlCardProps {
  session: SessionState;
  onUpdate: (newSession: SessionState) => void;
}

export function SessionControlCard({ session, onUpdate }: SessionControlCardProps) {
  const { t } = useTranslation();
  const [displayTime, setDisplayTime] = useState(0);

  // Timer Tick
  useEffect(() => {
    if (!session.startTime) {
        setDisplayTime(0);
        return;
    }

    const tick = () => {
      const now = Date.now();
      if (session.isPaused) {
        if (session.lastPauseStartTime) {
             const activeDuration = session.lastPauseStartTime - (session.startTime ?? Date.now()) - session.totalPausedTime;
             setDisplayTime(Math.max(0, activeDuration));
        }
      } else {
        const activeDuration = now - (session.startTime ?? Date.now()) - session.totalPausedTime;
        setDisplayTime(Math.max(0, activeDuration));
      }
    };

    tick(); // Immediate update
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [session.startTime, session.isPaused, session.totalPausedTime, session.lastPauseStartTime]);

  const startSession = useCallback(() => {
    onUpdate({
      ...session,
      startTime: Date.now(),
      totalPausedTime: 0,
      isPaused: false,
      lastPauseStartTime: null,
    });
  }, [session, onUpdate]);

  const togglePause = useCallback(() => {
    const now = Date.now();
    if (session.isPaused) {
      // Resume
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

  const finishSession = useCallback(() => {
    // End session (reset)
    // In a real app we might want to save a summary, but here we just reset as per instructions
    onUpdate({
        ...session,
        startTime: null,
        totalPausedTime: 0,
        isPaused: false,
        lastPauseStartTime: null
    });
  }, [session, onUpdate]);

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

  const isSessionActive = !!session.startTime;

  return (
    <div className="mb-6 w-full">
      <AnimatePresence mode="wait">
        {!isSessionActive ? (
          <motion.button
            key="start-button"
            layoutId="session-control"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full bg-white/5 hover:bg-white/10 border border-white/10 backdrop-blur-md rounded-xl p-6 flex items-center justify-center group transition-colors shadow-lg"
            onClick={startSession}
          >
            <div className="flex flex-col items-center gap-2">
                <span className="text-xl font-bold tracking-widest text-primary group-hover:scale-105 transition-transform">
                    {t('start_session')}
                </span>
                <div className="h-1 w-12 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full w-full bg-primary/50 -translate-x-full group-hover:translate-x-0 transition-transform duration-500 ease-out" />
                </div>
            </div>
          </motion.button>
        ) : (
          <motion.div
            key="active-session"
            layoutId="session-control"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full bg-black/40 border border-white/10 backdrop-blur-md rounded-xl p-4 flex items-center justify-between shadow-lg"
          >
            {/* Timer Section (Left) */}
            <div className="flex items-center gap-4">
                <motion.div
                    className={`relative flex items-center justify-center gap-3 px-5 py-2 rounded-full border transition-colors select-none ${
                        session.isPaused
                            ? 'bg-white/5 border-white/10 text-muted'
                            : 'bg-black/60 border-red-500/30 text-white shadow-[0_0_15px_rgba(239,68,68,0.2)]'
                    }`}
                >
                     {/* REC Dot */}
                    <motion.div
                        animate={!session.isPaused ? { opacity: [1, 0.5, 1] } : { opacity: 0.3 }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className={`w-2.5 h-2.5 rounded-full ${session.isPaused ? 'bg-white/20' : 'bg-red-500'}`}
                    />

                    {/* Time */}
                    <div className="w-[5rem] flex justify-center">
                        <span className={`font-mono text-lg font-bold tracking-wider tabular-nums ${session.isPaused ? 'opacity-50' : ''}`}>
                            {formatTime(displayTime)}
                        </span>
                    </div>
                </motion.div>

                <span className="hidden md:inline text-sm font-medium text-white/50 uppercase tracking-wider">
                    {t('session_active')}
                </span>
            </div>

            {/* Controls (Right) */}
            <div className="flex items-center gap-2">
                {/* Pause Button */}
                <button
                    className={`p-3 rounded-full border transition-all ${
                        session.isPaused
                        ? 'bg-primary/20 border-primary/50 text-primary hover:bg-primary/30'
                        : 'bg-white/5 border-white/10 hover:bg-white/10 text-white'
                    }`}
                    onClick={togglePause}
                    aria-label={session.isPaused ? t('resume_session') : t('pause_session')}
                >
                    {session.isPaused ? (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                            <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
                        </svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                            <path fillRule="evenodd" d="M6.75 5.25a.75.75 0 01.75-.75H9a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H7.5a.75.75 0 01-.75-.75V5.25zm7.5 0A.75.75 0 0115 4.5h1.5a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H15a.75.75 0 01-.75-.75V5.25z" clipRule="evenodd" />
                        </svg>
                    )}
                </button>

                {/* Finish Button */}
                <button
                    className="p-3 rounded-full bg-white/5 border border-white/10 text-muted hover:text-red-400 hover:border-red-500/30 hover:bg-red-500/10 transition-colors"
                    onClick={finishSession}
                    aria-label={t('finish_session')}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                        <path fillRule="evenodd" d="M4.5 7.5a3 3 0 013-3h9a3 3 0 013 3v9a3 3 0 01-3 3h-9a3 3 0 01-3-3v-9z" clipRule="evenodd" />
                    </svg>
                </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
