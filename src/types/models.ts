// Estático: Definición de ejercicio
export interface ExerciseCatalog {
  id: number;
  name: string;
  muscleGroup: string;
  equipment: string;
  tags: string[];
}

// Sub-entidad: Serie individual dentro de un log
export interface WorkoutSet {
  reps: number;
  weight: number;
  rpe?: number; // Rate of Perceived Exertion (1-10)
  restTime?: number; // Rest time in seconds
}

// Dinámico: Registro de un ejercicio en una sesión
export interface WorkoutLog {
  id: string; // Unique ID for the log entry itself (e.g. UUID)
  timestamp: number;
  exerciseId: number; // Reference to ExerciseCatalog.id
  sets: WorkoutSet[];
}

// Estado global de la aplicación para persistencia
export interface AppState {
  exercises: Record<number, ExerciseCatalog>;
  logs: WorkoutLog[];
}
