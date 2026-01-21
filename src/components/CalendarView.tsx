import { motion } from 'framer-motion';
import { Header } from './Header';

export function CalendarView() {
  // Placeholder data for calendar grid
  const days = Array.from({ length: 35 }, (_, i) => i + 1);

  return (
    <div className="container mx-auto p-4 pb-24">
      {/* Reusing the sticky header pattern from ExerciseMatrix for consistency */}
      <div className="sticky top-0 z-50 bg-black/80 backdrop-blur-md pb-2 -mx-4 px-4 pt-4 border-b border-white/5 mb-4 shadow-xl shadow-black/20">
        <Header title="Calendar" />
        {/* Placeholder for future calendar controls (Month selector, etc) */}
        <div className="flex gap-2 pb-2 overflow-x-auto text-sm text-muted">
          <span className="px-3 py-1 bg-white/10 rounded-full text-white">October 2023</span>
          <span className="px-3 py-1 bg-transparent border border-white/10 rounded-full">Month</span>
          <span className="px-3 py-1 bg-transparent border border-white/10 rounded-full">Week</span>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-7 gap-2"
      >
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center text-xs text-muted font-bold py-2">
            {day}
          </div>
        ))}

        {days.map(day => (
          <div
            key={day}
            className={`
              aspect-square rounded-xl border border-white/5 p-2 flex flex-col justify-between
              ${day === 15 ? 'bg-primary/20 border-primary/50' : 'bg-surface hover:bg-white/5'}
            `}
          >
            <span className={`text-sm ${day === 15 ? 'text-primary font-bold' : 'text-muted'}`}>
              {day <= 31 ? day : ''}
            </span>

            {/* Simulation of a workout dot */}
            {day % 3 === 0 && day <= 31 && (
              <div className="w-1.5 h-1.5 rounded-full bg-secondary self-end" />
            )}
          </div>
        ))}
      </motion.div>

      <div className="mt-8 p-6 rounded-2xl bg-surface border border-white/5 text-center">
        <h3 className="text-lg font-bold text-white mb-2">Upcoming Features</h3>
        <p className="text-muted">Calendar logic and history view coming soon.</p>
      </div>
    </div>
  );
}
