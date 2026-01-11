import type { ExerciseCatalog } from '../types/models';
import { Sparkline } from './Sparkline';

interface ExerciseCardProps {
  exercise: ExerciseCatalog;
  recentLogs?: number[]; // Array of recent max weights or volumes
}

export function ExerciseCard({ exercise, recentLogs = [] }: ExerciseCardProps) {
  return (
    <div className="
      group relative flex flex-col justify-between p-4 h-full
      bg-surface/50 backdrop-blur-md
      border border-white/5
      rounded-xl
      transition-all duration-300
      hover:bg-surface/70 hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/10
      cursor-pointer
    ">
      <div>
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-semibold text-text tracking-tight leading-tight">
            {exercise.name}
          </h3>
        </div>

        <div className="flex flex-wrap gap-1.5 mb-4">
          {exercise.tags.slice(0, 3).map(tag => (
            <span key={tag} className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-white/5 text-muted border border-white/5">
              {tag}
            </span>
          ))}
          {exercise.tags.length > 3 && (
            <span className="text-[10px] text-muted px-1">+{exercise.tags.length - 3}</span>
          )}
        </div>
      </div>

      <div className="mt-auto pt-2">
        <Sparkline data={recentLogs} />
        {recentLogs.length > 0 && (
          <div className="flex justify-between items-end mt-1">
             <span className="text-xs text-muted">Last: {recentLogs[recentLogs.length - 1]}kg</span>
             <span className="text-xs text-primary font-medium">Progress</span>
          </div>
        )}
      </div>
    </div>
  );
}
