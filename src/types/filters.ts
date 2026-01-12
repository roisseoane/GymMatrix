export type SortOption = 'name' | 'frequency' | 'smart';

export interface FilterState {
  search: string;
  muscleGroup: string | 'All';
  equipment: string | 'All';
  sortBy: SortOption;
}
