import { motion } from 'framer-motion';
import { RIR_OPTIONS } from '../data/constants';

interface RIRSliderProps {
  value: number;
  onChange: (val: number) => void;
}

export function RIRSlider({ value, onChange }: RIRSliderProps) {
  const currentOption = RIR_OPTIONS.find(opt => opt.value === value) || RIR_OPTIONS[3];

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-2">
        <label className="text-xs text-muted uppercase font-bold">Esfuerzo (RIR)</label>
        <span
          className="text-sm font-bold transition-colors duration-300"
          style={{ color: currentOption.color }}
        >
          {currentOption.label}
        </span>
      </div>

      <div className="relative h-12 bg-surface border border-white/10 rounded-xl overflow-hidden touch-none flex items-center px-2">
        {/* Background Track Gradient */}
        <div className="absolute inset-0 opacity-20 bg-gradient-to-r from-red-500 via-yellow-500 to-green-500" />

        {/* Slider Thumb Area */}
        <input
          type="range"
          min="0"
          max="3"
          step="1"
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
        />

        {/* Visual Indicators */}
        <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 flex justify-between pointer-events-none z-10">
          {RIR_OPTIONS.map((opt) => (
            <div
              key={opt.value}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${opt.value === value ? 'scale-150 bg-white' : 'bg-white/30'}`}
            />
          ))}
        </div>

        {/* Active Thumb Visualization (optional, simpler to rely on labels/glow for now or custom div) */}
        <motion.div
          className="absolute h-full top-0 bg-white/10 pointer-events-none transition-all duration-300"
          style={{
            left: `${(value / 3) * 100}%`,
            width: '25%', // roughly covers one section? No, simpler to just glow the container
            transform: 'translateX(-50%)' // Hard to align perfectly with range input without fixed width px.
            // Let's stick to the container glow effect requested in the prompt instead of a complex thumb
          }}
        />
      </div>

      <p className="text-[10px] text-muted mt-1 text-right">Desliza para ajustar</p>
    </div>
  );
}
