// ============================================
// ALPHA MATH COMMAND v7.0 - METRICS LIBRARY
// ============================================
// Pure calculation functions for Command & Control metrics
// Based on ALPHA_MATH_COMMAND_V7_FINAL_PROMPT.md Part 1

import {
  MasteryLatency,
  Velocity,
  SpinDetection,
  ActivityLog,
  MathAcademyStudent,
} from '@/types/command';

// ============================================
// METRIC 1: MASTERY LATENCY
// ============================================

/**
 * Calculate time between first exposure and mastery achievement
 *
 * @param student - Student with activity logs
 * @param topic - Specific topic/concept to analyze
 * @returns MasteryLatency object with status
 *
 * Thresholds:
 * - LOW_LATENCY: < 30 mins (flow state)
 * - HIGH_FRICTION: 30-120 mins (needs attention)
 * - BLOCKED: > 120 mins (RED ALERT)
 */
export function calculateMasteryLatency(
  student: MathAcademyStudent,
  topic: string
): MasteryLatency {
  // Filter activity logs for this specific topic
  const topicLogs = student.activity.filter(log => log.topic === topic);

  if (topicLogs.length === 0) {
    // No activity on this topic yet
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
    const deltaHours = (now.getTime() - firstExposure.getTime()) / (1000 * 60 * 60);

    let status: 'LOW_LATENCY' | 'HIGH_FRICTION' | 'BLOCKED';
    if (deltaHours < 0.5) {
      status = 'LOW_LATENCY';
    } else if (deltaHours < 2) {
      status = 'HIGH_FRICTION';
    } else {
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
  const deltaHours =
    (masteryAchieved.getTime() - firstExposure.getTime()) / (1000 * 60 * 60);

  let status: 'LOW_LATENCY' | 'HIGH_FRICTION' | 'BLOCKED';
  if (deltaHours < 0.5) {
    status = 'LOW_LATENCY';
  } else if (deltaHours < 2) {
    status = 'HIGH_FRICTION';
  } else {
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
// METRIC 2: VELOCITY (DOPPLER EFFECT)
// ============================================

/**
 * Calculate student velocity vs required rate (Doppler Effect)
 *
 * @param student - Student with current progress
 * @param targetCompletionDate - When course should be finished
 * @returns Velocity object with RED_SHIFT/ON_TRACK/BLUE_SHIFT status
 *
 * Status:
 * - BLUE_SHIFT: ahead of schedule (> 120% required rate)
 * - ON_TRACK: within 20% of required rate
 * - RED_SHIFT: behind schedule (< 80% required rate)
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

  // Current rate from student metrics (velocity = XP per week)
  // Convert to % per week based on current course
  const currentRate = student.metrics.velocity;

  // Determine status using Doppler Effect analogy
  let status: 'BLUE_SHIFT' | 'ON_TRACK' | 'RED_SHIFT';
  if (currentRate > requiredRate * 1.2) {
    status = 'BLUE_SHIFT'; // Ahead of schedule
  } else if (currentRate < requiredRate * 0.8) {
    status = 'RED_SHIFT'; // Behind schedule
  } else {
    status = 'ON_TRACK'; // Within tolerance
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
// METRIC 3: SPIN DETECTION
// ============================================

/**
 * Detect productive vs unproductive struggle (spin)
 *
 * @param student - Student with activity logs
 * @param topic - Topic to analyze for spin
 * @returns SpinDetection object with intervention flag
 *
 * Productive Spin:
 * - Attempts increase, accuracy gradient > 0, resources used
 *
 * Unproductive Spin:
 * - Attempts increase, accuracy gradient ≤ 0, no resources accessed
 * - Triggers intervention requirement
 */
export function detectSpin(
  student: MathAcademyStudent,
  topic: string
): SpinDetection {
  // Filter activity logs for this topic
  const topicLogs = student.activity.filter(log => log.topic === topic);

  if (topicLogs.length === 0) {
    // No activity - no spin
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
    // Simple linear regression slope
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

  // Determine spin type
  let spinType: 'PRODUCTIVE' | 'UNPRODUCTIVE';
  let interventionRequired = false;

  if (accuracyGradient > 0 || resourceAccess > 0) {
    // Positive gradient or using resources = productive struggle
    spinType = 'PRODUCTIVE';
    interventionRequired = false;
  } else {
    // Flat/negative gradient with no resource access = unproductive spin
    spinType = 'UNPRODUCTIVE';
    // Require intervention if attempts > 3 and no progress
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
// HELPER FUNCTIONS
// ============================================

/**
 * Calculate urgency score for triage queue sorting
 * Combines multiple risk factors into single 0-100 score
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
    score += 40;
  } else if (masteryLatency.status === 'HIGH_FRICTION') {
    score += 20;
  }

  // Velocity contribution (0-30 points)
  if (velocity.status === 'RED_SHIFT') {
    score += 30;
  } else if (velocity.status === 'ON_TRACK') {
    score += 0;
  } else {
    score -= 10; // Bonus for being ahead
  }

  // Spin contribution (0-30 points)
  if (spin.interventionRequired) {
    score += 30;
  }

  // Clamp to 0-100 range
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

  // Avoid division by zero
  const weeksToCompletion = remainingProgress / Math.max(0.1, currentRate);

  const now = new Date();
  const predictedDate = new Date(
    now.getTime() + weeksToCompletion * 7 * 24 * 60 * 60 * 1000
  );

  return predictedDate;
}
