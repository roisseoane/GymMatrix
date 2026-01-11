import type { FilterState } from '../types/filters';

interface FilterBarProps {
  filterState: FilterState;
  setFilter: (key: keyof FilterState, value: string) => void;
  options: {
    muscles: string[];
    equipment: string[];
  };
}

export function FilterBar({ filterState, setFilter, options }: FilterBarProps) {
  return (
    <div className="sticky top-0 z-10 py-4 bg-background/80 backdrop-blur-md border-b border-white/5 mb-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        {/* Search */}
        <input
          type="text"
          placeholder="Search exercises..."
          value={filterState.search}
          onChange={(e) => setFilter('search', e.target.value)}
          className="bg-surface border border-white/10 rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:border-primary w-full md:w-64"
        />

        {/* Filters Group */}
        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
          {/* Muscle Filter */}
          <select
            value={filterState.muscleGroup}
            onChange={(e) => setFilter('muscleGroup', e.target.value)}
            className="bg-surface border border-white/10 rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:border-primary cursor-pointer min-w-[120px]"
          >
            {options.muscles.map(opt => (
              <option key={opt} value={opt}>{opt === 'All' ? 'All Muscles' : opt}</option>
            ))}
          </select>

          {/* Equipment Filter */}
          <select
            value={filterState.equipment}
            onChange={(e) => setFilter('equipment', e.target.value)}
            className="bg-surface border border-white/10 rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:border-primary cursor-pointer min-w-[120px]"
          >
            {options.equipment.map(opt => (
              <option key={opt} value={opt}>{opt === 'All' ? 'All Equipment' : opt}</option>
            ))}
          </select>

          {/* Sort Option */}
          <select
            value={filterState.sortBy}
            onChange={(e) => setFilter('sortBy', e.target.value)}
            className="bg-surface border border-white/10 rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:border-primary cursor-pointer min-w-[120px]"
          >
            <option value="smart">Smart Sort</option>
            <option value="frequency">Frequency</option>
            <option value="name">Name</option>
          </select>
        </div>
      </div>
    </div>
  );
}
