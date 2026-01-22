// Estático: Definición de ejercicio
export interface ExerciseCatalog {
  id: number;
  name: string;
  muscleGroup: string;
  equipment: string;
  tags: string[];
  baseWeight?: number; // Weight of the equipment itself (e.g., bar weight)
}

export const SetType = {
  WARMUP: 'WARMUP',
  NORMAL: 'NORMAL',
  DROPSET: 'DROPSET',
  FAILURE: 'FAILURE'
} as const;

export type SetType = typeof SetType[keyof typeof SetType];

export interface SubSet {
  weight: number;
  reps: number;
  rpe?: number;
}

// Dinámico: Registro de un ejercicio en una sesión
export interface WorkoutLog {
  id: string; // Unique ID for the log entry itself (e.g. UUID)
  timestamp: number;
  exerciseId: number; // Reference to ExerciseCatalog.id
  series: Array<{
    weight: number;
    reps: number;
    rir: number;
  }>;
}

// Estructura de pesos de transición: contextKey -> fromExerciseId -> toExerciseId -> weight
export interface TransitionMap {
  [contextKey: string]: {
    [fromExerciseId: number]: {
      [toExerciseId: number]: number;
    };
  };
}

export interface SessionMetadata {
  duration: string; // Format hh:mm:ss
  completed: boolean;
}

// Estado global de la aplicación para persistencia
export interface AppState {
  exercises: Record<number, ExerciseCatalog>;
  logs: WorkoutLog[];
  transitionMap: TransitionMap;
  activeNextSuggestion?: number[] | null;
  sessionMetadata: Record<string, SessionMetadata>; // Key: YYYY-MM-DD
}
