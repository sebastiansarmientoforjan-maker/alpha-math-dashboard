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
  timeTotal?: number;
  smartScore?: number;
}

export interface Metrics {
  /**
   * Velocity Score basado en estándar Alpha de 125 XP/semana
   * 100% = 125 XP, 200% = 250 XP
   */
  velocityScore: number;
  
  /**
   * Accuracy Rate (% de respuestas correctas)
   */
  accuracyRate: number | null;
  
  /**
   * Focus Integrity (tiempo productivo / tiempo engaged)
   */
  focusIntegrity: number;
  
  /**
   * Topic con peor desempeño
   */
  nemesisTopic: string;
  
  /**
   * Learning Mastery Probability (LEGACY)
   * 
   * NOTA: Realmente es "Recent Success Rate" (RSR)
   * Proporción de tasks recientes con >80% accuracy
   * NO es una probabilidad bayesiana real
   */
  lmp: number;
  
  /**
   * Knowledge Stability Index
   * 100 - sqrt(variance_of_accuracy)
   * Mide consistencia del desempeño
   */
  ksi: number;
  
  /**
   * Estado de estancamiento detectado
   */
  stallStatus: 'Optimal' | 'Productive Struggle' | 'Frustrated Stall';
  
  /**
   * Proporción de tiempo ocioso (idle time / total time)
   */
  idleRatio: number;
  
  // === LEGACY COMPATIBILITY ===
  consistencyIndex: number;
  stuckScore: number;
  dropoutProbability: number;
  riskStatus: 'Critical' | 'Attention' | 'On Track' | 'Dormant';
  archetype: 'Zombie' | 'Neutral' | 'Flow Master' | 'Grinder' | 'Guesser';
}

export interface DRIMetrics {
  /**
   * Investment ROI (PROXY)
   * 
   * Alpha Protocol define: ΔS (SAT points) / T_min
   * Dashboard usa: XP_awarded / time_seconds
   * 
   * NOTA: Este es un proxy. El iROI real requiere datos de SAT mocks
   * que no están disponibles en Math Academy API
   */
  iROI: number | null;
  
  /**
   * Debt Exposure Ratio
   * Proporción de topics K-8 maestreados durante High School
   * 
   * Alpha Standard: DER > 20% = "remedial mode"
   */
  debtExposure: number | null;
  
  /**
   * Precision Decay Index
   * (Errores finales + 1) / (Errores iniciales + 1)
   * 
   * Alpha Standard: PDI > 1.5 = "Short-Burst Specialist"
   */
  precisionDecay: number | null;
  
  /**
   * Tier de clasificación DRI
   */
  driTier: 'RED' | 'YELLOW' | 'GREEN';
  
  /**
   * Señal específica del estado
   */
  driSignal: string;
  
  /**
   * Clase Tailwind para color del tier
   */
  driColor: string;
  
  /**
   * Risk Score ponderado (0-100)
   * Solo presente si RISK_SCORING_ENABLED = true
   */
  riskScore?: number;
}
