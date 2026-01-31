import { StudentDimensions } from '@/lib/student-dimensions';

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
  
  // ⭐ NUEVO: Dimensiones de agrupación (FASE 3 - Group Analytics)
  dimensions?: StudentDimensions | null;
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
  velocityScore: number;
  accuracyRate: number | null;
  focusIntegrity: number;
  nemesisTopic: string;
  lmp: number;
  ksi: number | null;
  stallStatus: 'Optimal' | 'Productive Struggle' | 'Frustrated Stall';
  idleRatio: number;
  consistencyIndex: number;
  stuckScore: number;
  dropoutProbability: number;
  riskStatus: 'Critical' | 'Attention' | 'On Track' | 'Dormant';
  archetype: 'Zombie' | 'Neutral' | 'Flow Master' | 'Grinder' | 'Guesser';
}

export interface DRIMetrics {
  iROI: number | null;
  debtExposure: number | null;
  precisionDecay: number | null;
  driTier: 'RED' | 'YELLOW' | 'GREEN';
  driSignal: string;
  driColor: string;
  riskScore?: number;
}

// ==========================================
// ALERT TYPES - FASE 1A
// ==========================================

export type DRITier = 'RED' | 'YELLOW' | 'GREEN';
export type TierChangeDirection = 'improved' | 'worsened';
export type AlertType = 'tier_change' | 'inactivity' | 'velocity_drop' | 'custom';
export type AlertStatus = 'pending' | 'acknowledged' | 'resolved' | 'dismissed';

export interface AlertMetricsSnapshot {
  rsr: number;
  ksi: number | null;
  velocity: number;
  riskScore: number;
  der: number | null;
  pdi: number | null;
}

export interface AlertPreviousMetrics {
  rsr: number;
  ksi: number | null;
  velocity: number;
  riskScore: number;
}

export interface Alert {
  id?: string;
  studentId: string;
  studentName: string;
  studentCourse: string;
  type: AlertType;
  previousTier: DRITier;
  newTier: DRITier;
  direction: TierChangeDirection;
  metricsSnapshot: AlertMetricsSnapshot;
  previousMetrics: AlertPreviousMetrics;
  status: AlertStatus;
  acknowledged: boolean;
  acknowledgedAt: Date | null;
  acknowledgedBy: string | null;
  emailSent: boolean;
  emailSentAt: Date | null;
  emailRecipient?: string;
  createdAt: Date;
  syncBatchId: string;
  notes?: string;
  resolvedAt?: Date;
  resolvedBy?: string;
}

export interface CreateAlertInput {
  studentId: string;
  studentName: string;
  studentCourse: string;
  type?: AlertType;
  previousTier: DRITier;
  newTier: DRITier;
  metricsSnapshot: AlertMetricsSnapshot;
  previousMetrics: AlertPreviousMetrics;
  syncBatchId: string;
}

export interface AlertFilters {
  acknowledged?: boolean;
  status?: AlertStatus;
  type?: AlertType;
  studentId?: string;
  direction?: TierChangeDirection;
  tier?: DRITier;
  dateFrom?: Date;
  dateTo?: Date;
  limit?: number;
}

export interface AlertsSummary {
  total: number;
  pending: number;
  acknowledged: number;
  byDirection: {
    improved: number;
    worsened: number;
  };
  byTier: {
    toRed: number;
    toYellow: number;
    toGreen: number;
  };
  recentAlerts: Alert[];
}

// ==========================================
// INTERVENTION TRACKING TYPES - FASE 1B
// ==========================================

export type TrackingPeriod = '2_weeks' | '4_weeks' | '8_weeks';
export type TrackingStatus = 'active' | 'completed' | 'cancelled';
export type TrackingOutcome = 'improved' | 'stable' | 'worsened' | 'pending';

export interface MetricsSnapshot {
  rsr: number;
  ksi: number | null;
  velocity: number;
  riskScore: number;
  der: number | null;
  pdi: number | null;
  tier: DRITier;
  capturedAt: Date;
}

export interface InterventionTracking {
  id?: string;
  studentId: string;
  studentName: string;
  studentCourse: string;
  
  // Intervención vinculada (opcional)
  interventionId?: string;
  interventionType: string;
  interventionNotes?: string;
  
  // Configuración del tracking
  period: TrackingPeriod;
  status: TrackingStatus;
  
  // Snapshots de métricas
  baselineSnapshot: MetricsSnapshot;
  weeklySnapshots: MetricsSnapshot[];
  
  // Resultado
  outcome: TrackingOutcome;
  outcomeDetails?: {
    rsrDelta: number;
    ksiDelta: number | null;
    velocityDelta: number;
    riskScoreDelta: number;
    tierChange: string | null;
  };
  
  // Metadata
  createdAt: Date;
  createdBy: string;
  completedAt?: Date;
  nextSnapshotDate: Date;
}

export interface CreateTrackingInput {
  studentId: string;
  studentName: string;
  studentCourse: string;
  interventionId?: string;
  interventionType: string;
  interventionNotes?: string;
  period: TrackingPeriod;
  createdBy: string;
}
