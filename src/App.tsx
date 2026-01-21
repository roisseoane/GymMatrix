import { useState } from 'react';
import { ExerciseMatrix } from './components/ExerciseMatrix';
import { CalendarView } from './components/CalendarView';
import { BottomNavigation } from './components/BottomNavigation';
import { AnimatePresence, motion } from 'framer-motion';

type ViewType = 'library' | 'calendar';

const variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? '100%' : '-100%',
    opacity: 0,
    position: 'absolute' as const,
    width: '100%'
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1,
    position: 'relative' as const,
    width: '100%'
  },
  exit: (direction: number) => ({
    zIndex: 0,
    x: direction < 0 ? '100%' : '-100%',
    opacity: 0,
    position: 'absolute' as const,
    width: '100%'
  })
};

function App() {
  const [currentView, setCurrentView] = useState<ViewType>('library');
  const [direction, setDirection] = useState(0);

  const handleViewChange = (newView: ViewType) => {
    if (newView === currentView) return;
    // library = 0, calendar = 1
    const newIndex = newView === 'library' ? 0 : 1;
    const oldIndex = currentView === 'library' ? 0 : 1;
    setDirection(newIndex - oldIndex);
    setCurrentView(newView);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-background text-text relative overflow-x-hidden">
      {/* Main Content Area with Transitions */}
      <AnimatePresence mode="popLayout" initial={false} custom={direction}>
        <motion.div
          key={currentView}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            x: { type: "spring", stiffness: 300, damping: 30 },
            opacity: { duration: 0.2 }
          }}
          className="w-full min-h-screen"
        >
          {currentView === 'library' ? <ExerciseMatrix /> : <CalendarView />}
        </motion.div>
      </AnimatePresence>

      {/* Navigation Bar */}
      <BottomNavigation currentView={currentView} onChange={handleViewChange} />
    </div>
  );
}

export default App;
