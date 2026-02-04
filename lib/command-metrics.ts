// ============================================
// ALPHA MATH COMMAND v7.0 - METRICS LIBRARY
// ============================================
// STRICT MODE: Hardened logic matching ALPHA_MATH_COMMAND_V7_FINAL_PROMPT.md
// Part 1: Core Philosophy & Metrics - "Physics of Learning"

import {
  MasteryLatency,
  Velocity,
  SpinDetection,
  ActivityLog,
  MathAcademyStudent,
} from '@/types/command';

// ============================================
// METRIC 1: MASTERY LATENCY (STRICT)
// ============================================

/**
 * STRICT RULE: Calculate time between first exposure and mastery
 *
 * CRITICAL THRESHOLDS (EXACT):
 * - LOW_LATENCY: < 30 minutes (flow state)
 * - HIGH_FRICTION: 30-120 minutes (needs attention)
 * - BLOCKED: > 120 minutes (RED ALERT - MUST TRIGGER)
 *
 * @param student - Student with activity logs
 * @param topic - Specific topic/concept to analyze
 * @returns MasteryLatency with STRICT status enforcement
 */
export function calculateMasteryLatency(
  student: MathAcademyStudent,
  topic: string
): MasteryLatency {
  // Filter activity logs for this specific topic
  const topicLogs = student.activity.filter(log => log.topic === topic);

  if (topicLogs.length === 0) {
    // No activity on this topic yet - return safe default
    return {
      studentId: student.id,
      concept: topic,
      firstExposure: new Date(),
      masteryAchieved: null,
      deltaTime: 0,
      status: 'LOW_LATENCY',
    };
  }

  // Sort by timestamp to find first exposure
  const sortedLogs = [...topicLogs].sort(
    (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
  );

  const firstExposure = sortedLogs[0].timestamp;

  // Find mastery point: first time accuracy >= 90%
  const masteryLog = sortedLogs.find(log => log.accuracy >= 0.9);

  if (!masteryLog) {
    // Still working on mastery - calculate time elapsed so far
    const now = new Date();
    const deltaMinutes = (now.getTime() - firstExposure.getTime()) / (1000 * 60);
    const deltaHours = deltaMinutes / 60;

    // STRICT RULE 1: Apply EXACT thresholds in minutes
    let status: 'LOW_LATENCY' | 'HIGH_FRICTION' | 'BLOCKED';
    if (deltaMinutes < 30) {
      // Flow state: < 30 minutes
      status = 'LOW_LATENCY';
    } else if (deltaMinutes <= 120) {
      // Friction: 30-120 minutes
      status = 'HIGH_FRICTION';
    } else {
      // CRITICAL: > 120 minutes = BLOCKED (MUST trigger)
      status = 'BLOCKED';
    }

    return {
      studentId: student.id,
      concept: topic,
      firstExposure,
      masteryAchieved: null,
      deltaTime: deltaHours,
      status,
    };
  }

  // Mastery achieved - calculate final latency
  const masteryAchieved = masteryLog.timestamp;
  const deltaMinutes =
    (masteryAchieved.getTime() - firstExposure.getTime()) / (1000 * 60);
  const deltaHours = deltaMinutes / 60;

  // STRICT RULE 1: Apply EXACT thresholds even for completed mastery
  let status: 'LOW_LATENCY' | 'HIGH_FRICTION' | 'BLOCKED';
  if (deltaMinutes < 30) {
    status = 'LOW_LATENCY';
  } else if (deltaMinutes <= 120) {
    status = 'HIGH_FRICTION';
  } else {
    // Even if mastered, took too long = BLOCKED
    status = 'BLOCKED';
  }

  return {
    studentId: student.id,
    concept: topic,
    firstExposure,
    masteryAchieved,
    deltaTime: deltaHours,
    status,
  };
}

// ============================================
// METRIC 2: VELOCITY - DOPPLER EFFECT (STRICT)
// ============================================

/**
 * STRICT RULE: Calculate velocity using Doppler Effect analogy
 *
 * EXACT THRESHOLDS:
 * - BLUE_SHIFT: currentRate > requiredRate * 1.2 (ahead of schedule)
 * - ON_TRACK: requiredRate * 0.8 <= currentRate <= requiredRate * 1.2
 * - RED_SHIFT: currentRate < requiredRate * 0.8 (MUST TRIGGER)
 *
 * @param student - Student with current progress
 * @param targetCompletionDate - When course should be finished
 * @returns Velocity with STRICT status enforcement
 */
export function calculateVelocity(
  student: MathAcademyStudent,
  targetCompletionDate: Date
): Velocity {
  const currentProgress = student.progress; // % (0-100)
  const remainingProgress = 100 - currentProgress;

  // Calculate required rate to finish on time
  const now = new Date();
  const daysRemaining = Math.max(
    1,
    (targetCompletionDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );
  const weeksRemaining = daysRemaining / 7;

  // Required rate: % per week needed to finish on time
  const requiredRate = remainingProgress / weeksRemaining;

  // Current rate from student metrics (velocity = % per week)
  const currentRate = student.metrics.velocity;

  // STRICT RULE 2: Apply EXACT Doppler thresholds
  let status: 'BLUE_SHIFT' | 'ON_TRACK' | 'RED_SHIFT';

  if (currentRate > requiredRate * 1.2) {
    // Ahead of schedule by > 20%
    status = 'BLUE_SHIFT';
  } else if (currentRate < requiredRate * 0.8) {
    // CRITICAL: Behind schedule by > 20% = RED_SHIFT (MUST TRIGGER)
    status = 'RED_SHIFT';
  } else {
    // Within ±20% tolerance
    status = 'ON_TRACK';
  }

  // Predict completion date based on current velocity
  const weeksToCompletion = remainingProgress / Math.max(0.1, currentRate);
  const predictedCompletion = new Date(
    now.getTime() + weeksToCompletion * 7 * 24 * 60 * 60 * 1000
  );

  // Calculate days off track (negative if ahead)
  const daysOffTrack = Math.round(
    (predictedCompletion.getTime() - targetCompletionDate.getTime()) /
      (1000 * 60 * 60 * 24)
  );

  return {
    studentId: student.id,
    currentRate,
    requiredRate,
    status,
    predictedCompletion,
    daysOffTrack,
  };
}

// ============================================
// METRIC 3: SPIN DETECTION (STRICT)
// ============================================

/**
 * STRICT RULE: Detect productive vs unproductive struggle
 *
 * CLASSIFICATION:
 * - PRODUCTIVE: accuracyGradient > 0 OR resourceAccess > 0
 * - UNPRODUCTIVE: accuracyGradient ≤ 0 AND resourceAccess === 0
 *
 * INTERVENTION TRIGGER:
 * - Required if: UNPRODUCTIVE + attempts > 3
 *
 * @param student - Student with activity logs
 * @param topic - Topic to analyze for spin
 * @returns SpinDetection with STRICT intervention flag
 */
export function detectSpin(
  student: MathAcademyStudent,
  topic: string
): SpinDetection {
  // Filter activity logs for this topic
  const topicLogs = student.activity.filter(log => log.topic === topic);

  if (topicLogs.length === 0) {
    // No activity - no spin detected
    return {
      studentId: student.id,
      concept: topic,
      attempts: 0,
      accuracyGradient: 0,
      resourceAccess: 0,
      spinType: 'PRODUCTIVE',
      interventionRequired: false,
    };
  }

  // Sort by timestamp
  const sortedLogs = [...topicLogs].sort(
    (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
  );

  // Total attempts
  const totalAttempts = sortedLogs.reduce((sum, log) => sum + log.attempts, 0);

  // Calculate accuracy gradient (slope of last 5 attempts)
  const recentLogs = sortedLogs.slice(-5);
  let accuracyGradient = 0;

  if (recentLogs.length >= 2) {
    // Simple linear regression slope: gradient = (n*ΣXY - ΣX*ΣY) / (n*ΣX² - (ΣX)²)
    const n = recentLogs.length;
    const sumX = recentLogs.reduce((sum, _, i) => sum + i, 0);
    const sumY = recentLogs.reduce((sum, log) => sum + log.accuracy, 0);
    const sumXY = recentLogs.reduce((sum, log, i) => sum + i * log.accuracy, 0);
    const sumX2 = recentLogs.reduce((sum, _, i) => sum + i * i, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = n * sumX2 - sumX * sumX;

    if (denominator !== 0) {
      accuracyGradient = numerator / denominator;
    }
  }

  // Count resource access (hints + videos)
  const resourceAccess = sortedLogs.reduce(
    (sum, log) => sum + log.hintsUsed + (log.videoWatched ? 1 : 0),
    0
  );

  // STRICT RULE 3: Classification based on gradient AND resource usage
  let spinType: 'PRODUCTIVE' | 'UNPRODUCTIVE';
  let interventionRequired = false;

  if (accuracyGradient > 0 || resourceAccess > 0) {
    // Positive gradient OR using resources = productive struggle (good!)
    spinType = 'PRODUCTIVE';
    interventionRequired = false;
  } else {
    // Flat/negative gradient AND no resource access = unproductive spin (bad!)
    spinType = 'UNPRODUCTIVE';

    // STRICT TRIGGER: Require intervention if > 3 attempts with no progress
    interventionRequired = totalAttempts > 3;
  }

  return {
    studentId: student.id,
    concept: topic,
    attempts: totalAttempts,
    accuracyGradient,
    resourceAccess,
    spinType,
    interventionRequired,
  };
}

// ============================================
// HELPER FUNCTIONS (STRICT)
// ============================================

/**
 * Calculate urgency score for triage queue sorting
 * Combines multiple risk factors into single 0-100 score
 *
 * WEIGHTING (STRICT):
 * - BLOCKED: +40 points
 * - HIGH_FRICTION: +20 points
 * - RED_SHIFT: +30 points
 * - UNPRODUCTIVE spin requiring intervention: +30 points
 *
 * @param masteryLatency - Current mastery latency
 * @param velocity - Current velocity status
 * @param spin - Current spin detection
 * @returns Urgency score (0-100, higher = more urgent)
 */
export function computeUrgencyScore(
  masteryLatency: MasteryLatency,
  velocity: Velocity,
  spin: SpinDetection
): number {
  let score = 0;

  // Mastery Latency contribution (0-40 points)
  if (masteryLatency.status === 'BLOCKED') {
    score += 40; // Critical: > 120 minutes stuck
  } else if (masteryLatency.status === 'HIGH_FRICTION') {
    score += 20; // Warning: 30-120 minutes
  }
  // LOW_LATENCY adds 0 points

  // Velocity contribution (0-30 points)
  if (velocity.status === 'RED_SHIFT') {
    score += 30; // Critical: < 80% required rate
  } else if (velocity.status === 'BLUE_SHIFT') {
    score -= 10; // Bonus for being ahead (can go negative)
  }
  // ON_TRACK adds 0 points

  // Spin contribution (0-30 points)
  if (spin.interventionRequired) {
    score += 30; // Unproductive spin detected
  }

  // Clamp to 0-100 range (strict bounds)
  return Math.max(0, Math.min(100, score));
}

/**
 * Predict course completion date based on current velocity
 *
 * @param student - Student with current progress and velocity
 * @returns Predicted completion date
 */
export function predictCompletion(student: MathAcademyStudent): Date {
  const remainingProgress = 100 - student.progress;
  const currentRate = student.metrics.velocity;

  // Avoid division by zero (minimum 0.1% per week)
  const weeksToCompletion = remainingProgress / Math.max(0.1, currentRate);

  const now = new Date();
  const predictedDate = new Date(
    now.getTime() + weeksToCompletion * 7 * 24 * 60 * 60 * 1000
  );

  return predictedDate;
}
