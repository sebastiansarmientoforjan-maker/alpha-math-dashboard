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
  dri: DRIMetrics; // Tier 5
  lastUpdated: string;
}

export interface StudentActivity {
  xpAwarded: number;
  time: number; // Minutos
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
  smartScore?: number; // Para lógica IXL/KeenKT
  analysis?: { timeEngaged: number };
}

export interface Metrics {
  velocityScore: number;
  accuracyRate: number | null;
  focusIntegrity: number;
  nemesisTopic: string;
  // --- Psicomotricidad V3.0 ---
  lmp: number; // Latent Mastery Probability [cite: 41]
  ksi: number; // Knowledge Stability Index [cite: 35]
  stallStatus: 'Optimal' | 'Productive Struggle' | 'Frustrated Stall'; // [cite: 83]
  idleRatio: number; // [cite: 93]
}

export interface DRIMetrics {
  iROI: number;
  debtExposure: number; // DER
  precisionDecay: number; // PDI
  driTier: 'RED' | 'YELLOW' | 'GREEN';
  driSignal: string;
}
