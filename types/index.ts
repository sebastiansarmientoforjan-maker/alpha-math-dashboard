export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  currentCourse: {
    name: string;
    grade: number;
    progress: number;
    xpRemaining: number;
  };
  activity: StudentActivity;
  metrics: Metrics;
  dri: DRIMetrics;
  lastUpdated: string;
}

export interface StudentActivity {
  xpAwarded: number;
  time: number;
  questions: number;
  questionsCorrect: number;
  numTasks: number;
  tasks: Task[];
  totals?: {
    timeEngaged: number;
    timeProductive: number;
    timeElapsed: number;
  };
}

export interface Task {
  id: string;
  type: 'Review' | 'Learning';
  topic: { name: string };
  questions: number;
  questionsCorrect: number;
  completedLocal: string;
  smartScore?: number;
}

export interface Metrics {
  velocityScore: number;
  accuracyRate: number | null;
  focusIntegrity: number;
  nemesisTopic: string;
  // --- Psicomotricidad V3.8 (Hallazgos del Reporte) ---
  lmp: number; // Probabilidad de Maestría Latente [cite: 41]
  ksi: number; // Índice de Estabilidad (Incertidumbre NIG) [cite: 30, 35]
  stallStatus: 'Optimal' | 'Productive Struggle' | 'Frustrated Stall'; // [cite: 83, 102]
  idleRatio: number; // [cite: 93]
  // --- Campos de Compatibilidad (Evitan Errores de Vercel) ---
  consistencyIndex: number;
  stuckScore: number;
  dropoutProbability: number;
  riskStatus: 'Critical' | 'Attention' | 'On Track' | 'Dormant';
  archetype: 'Zombie' | 'Neutral' | 'Flow Master' | 'Grinder' | 'Guesser';
}

export interface DRIMetrics {
  iROI: number;
  debtExposure: number; // DER [cite: 51]
  precisionDecay: number; // PDI [cite: 42]
  driTier: 'RED' | 'YELLOW' | 'GREEN';
  driSignal: string;
}
