export function Sparkline({ data }: { data: number[] }) {
  if (!data || data.length < 2) {
    return <div className="h-8 w-full bg-surface/30 rounded opacity-20" />;
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const height = 32;
  const width = 100;
  const step = width / (data.length - 1);

  const points = data.map((val, i) => {
    const x = i * step;
    const normalized = (val - min) / range;
    const y = height - (normalized * height);
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-8 stroke-primary fill-none stroke-2 overflow-visible">
      <polyline points={points} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
