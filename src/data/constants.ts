export const RIR_OPTIONS = [
  { value: 0, label: 'Fallo total', color: '#ef4444', glow: 'shadow-red-500/50', rpe: 10 },
  { value: 1, label: 'Casi fallo', color: '#f97316', glow: 'shadow-orange-500/50', rpe: 9.5 },
  { value: 2, label: '1-2 más', color: '#eab308', glow: 'shadow-yellow-500/50', rpe: 8.5 },
  { value: 3, label: '3 o más', color: '#22c55e', glow: 'shadow-green-500/50', rpe: 7 },
];

export const MUSCLE_COLORS: Record<string, string> = {
  Chest: 'rgba(59, 130, 246, 0.3)', // Blue-500
  Back: 'rgba(168, 85, 247, 0.3)', // Purple-500
  Shoulders: 'rgba(249, 115, 22, 0.3)', // Orange-500
  Arms: 'rgba(52, 211, 153, 0.3)', // Emerald-400 (Mint Green)
  Biceps: 'rgba(52, 211, 153, 0.3)', // Mint Green
  Triceps: 'rgba(52, 211, 153, 0.3)', // Mint Green
  Legs: 'rgba(239, 68, 68, 0.3)', // Red-500
  Glute: 'rgba(236, 72, 153, 0.3)', // Pink-500
  Core: 'rgba(107, 114, 128, 0.3)', // Gray-500
};
