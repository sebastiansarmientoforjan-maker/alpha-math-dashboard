// ============================================
// ALPHA MATH COMMAND v7.0 - TYPE DEFINITIONS
// ============================================
// Core types for Command & Control dashboard
// Based on ALPHA_MATH_COMMAND_V7_FINAL_PROMPT.md
// Part 3.1: Data Integration Architecture

// Import InterventionRecord from main types
import { InterventionRecord } from './index';

/**
 * Activity log entry from MathAcademy platform
 * Captures granular student interaction with topics
 */
export interface ActivityLog {
  timestamp: Date;
  topic: string;
  attempts: number;
  accuracy: number;
  timeSpent: number; // minutes
  hintsUsed: number;
  videoWatched: boolean;
}

/**
 * Student data structure from MathAcademy API
 * Extended with Command v7 metrics
 */
export interface MathAcademyStudent {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  campus: string; // Austin, SF, Miami, Online
  currentCourse: string;
  progress: number; // % completion (0-100)
  activity: ActivityLog[];
  metrics: {
    rsr: number; // Recent Success Rate (LMP)
    ksi: number; // Knowledge Stability Index
    velocity: number; // XP per week
    dailyXP: number;
  };
  riskScore: number; // 0-100 composite risk score
  interventionHistory: InterventionRecord[]; // Track all DRI interventions
  lastUpdated: string;
}

/**
 * Root data structure from MathAcademy API
 */
export interface MathAcademyData {
  students: MathAcademyStudent[];
}

// ============================================
// COMMAND v7 METRICS (Part 1)
// ============================================

/**
 * METRIC 1: Mastery Latency
 * Time between first concept exposure and verified mastery (>90% accuracy)
 *
 * Thresholds:
 * - LOW_LATENCY: < 30 mins (flow state)
 * - HIGH_FRICTION: 30-120 mins (needs attention)
 * - BLOCKED: > 120 mins (RED ALERT)
 */
export interface MasteryLatency {
  studentId: string;
  concept: string;
  firstExposure: Date;
  masteryAchieved: Date | null;
  deltaTime: number; // hours
  status: 'LOW_LATENCY' | 'HIGH_FRICTION' | 'BLOCKED';
}

/**
 * METRIC 2: Velocity & The Doppler Effect
 * Course progress rate compared to required rate
 *
 * Status:
 * - BLUE_SHIFT: currentRate > requiredRate * 1.2 (ahead)
 * - ON_TRACK: within 20% of required
 * - RED_SHIFT: currentRate < requiredRate * 0.8 (behind)
 */
export interface Velocity {
  studentId: string;
  currentRate: number; // % course per week
  requiredRate: number; // to finish on time
  status: 'BLUE_SHIFT' | 'ON_TRACK' | 'RED_SHIFT';
  predictedCompletion: Date;
  daysOffTrack: number; // negative if ahead
}

/**
 * METRIC 3: Spin Detection
 * Productive vs Unproductive Struggle
 *
 * Productive: attempts increase, gradient > 0, resources used
 * Unproductive: attempts increase, gradient ≤ 0, no resources
 */
export interface SpinDetection {
  studentId: string;
  concept: string;
  attempts: number;
  accuracyGradient: number; // slope of last 5 attempts
  resourceAccess: number; // hints, videos viewed
  spinType: 'PRODUCTIVE' | 'UNPRODUCTIVE';
  interventionRequired: boolean;
}

// ============================================
// SUPPORTING TYPES
// ============================================

/**
 * Intervention levels for JITAI system
 */
export enum InterventionLevel {
  LEVEL_0_BASE = 'Passive monitoring',
  LEVEL_1_HINT = 'Auto-hint in app',
  LEVEL_2_MESSAGE = 'DRI sends motivational text',
  LEVEL_3_PEER = 'Pair with peer tutor',
  LEVEL_4_RESCUE = 'Physical intervention by Guide/DRI'
}

/**
 * Triage queue item for urgent interventions
 */
export interface TriageItem {
  studentId: string;
  name: string;
  urgency: number; // 0-100
  reason: 'SPIN_DETECTED' | 'INACTIVE' | 'MASTERY_FAILED' | 'RED_SHIFTED';
  description: string;
  timeInState: number; // minutes
  suggestedAction: InterventionLevel;
}
