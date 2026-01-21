import { motion } from 'framer-motion';

interface BottomNavigationProps {
  currentView: 'library' | 'calendar';
  onChange: (view: 'library' | 'calendar') => void;
}

export function BottomNavigation({ currentView, onChange }: BottomNavigationProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-[60] bg-black/80 backdrop-blur-xl border-t border-white/10 pb-safe">
      <div className="flex justify-around items-center h-16 max-w-md mx-auto">
        <NavButton
          isActive={currentView === 'library'}
          onClick={() => onChange('library')}
          label="Library"
          icon={(
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
            </svg>
          )}
        />

        <NavButton
          isActive={currentView === 'calendar'}
          onClick={() => onChange('calendar')}
          label="Calendar"
          icon={(
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
            </svg>
          )}
        />
      </div>
    </div>
  );
}

interface NavButtonProps {
  isActive: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}

function NavButton({ isActive, onClick, icon, label }: NavButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`relative flex flex-col items-center justify-center w-full h-full transition-colors duration-200 ${isActive ? 'text-primary' : 'text-muted hover:text-white'}`}
    >
      <div className="relative">
        {icon}
        {isActive && (
          <motion.div
            layoutId="nav-glow"
            className="absolute inset-0 bg-primary/20 blur-lg rounded-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          />
        )}
      </div>
      <span className="text-[10px] font-medium mt-1">{label}</span>

      {isActive && (
        <motion.div
          layoutId="nav-indicator"
          className="absolute -top-1 w-8 h-1 bg-primary rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]"
        />
      )}
    </button>
  );
}
