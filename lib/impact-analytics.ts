// lib/impact-analytics.ts
// Impact Analytics: Measure intervention effectiveness and student outcomes

import { Student } from '@/types';
import { differenceInDays, addWeeks, subDays, isWithinInterval } from 'date-fns';

export interface MetricsSnapshot {
  studentId: string;
  date: Date;
  rsr: number;
  ksi: number;
  velocity: number;
  riskScore: number;
  dailyXP: number;
}

export interface InterventionImpact {
  studentId: string;
  interventionDate: Date;
  riskAtIntervention: number;
  riskWeek1: number | null;
  riskWeek2: number | null;
  riskWeek4: number | null;
  deltaWeek1: number | null;
  deltaWeek2: number | null;
  deltaWeek4: number | null;
  improved: boolean;
  sustainedImprovement: boolean;
}

export interface CourseCompletionMetrics {
  studentId: string;
  courseId: string;
  startDate: Date;
  completionDate: Date | null;
  daysToComplete: number | null;
  avgDailyXP: number;
  interventionsReceived: number;
  preInterventionRate: number | null;
  postInterventionRate: number | null;
  accelerationFactor: number | null;
}

export interface InterventionEffectiveness {
  objective: string;
  totalInterventions: number;
  successfulInterventions: number;
  avgRiskDecrease: number;
  avgTimeToImprovement: number;
  successRate: number;
  mostEffectiveFor: 'RED' | 'YELLOW' | 'GREEN';
}

export interface CoachPerformance {
  coachName: string;
  totalInterventions: number;
  studentsHelped: number;
  avgRiskDecrease: number;
  successRate: number;
  avgResponseTime: number;
  followUpRate: number;
  topObjective: string;
  impactScore: number;
}

export interface BeforeAfterSnapshot {
  studentId: string;
  interventionDate: Date;
  beforeRSR: number;
  beforeKSI: number;
  beforeVelocity: number;
  beforeDailyXP: number;
  afterRSR: number;
  afterKSI: number;
  afterVelocity: number;
  afterDailyXP: number;
  rsrChange: number;
  ksiChange: number;
  velocityChange: number;
  xpChange: number;
  overallImprovement: boolean;
  improvementScore: number;
}

export interface CohortComparison {
  cohort: 'with_interventions' | 'without_interventions';
  studentCount: number;
  avgCourseCompletionDays: number;
  avgRiskScoreChange: number;
  avgRSRChange: number;
  courseCompletionRate: number;
  attritionRate: number;
}

/**
 * Find the closest snapshot to a target date
 */
function findClosestSnapshot(snapshots: MetricsSnapshot[], targetDate: Date): MetricsSnapshot | null {
  if (snapshots.length === 0) return null;

  return snapshots.reduce((closest, current) => {
    const closestDiff = Math.abs(new Date(closest.date).getTime() - targetDate.getTime());
    const currentDiff = Math.abs(new Date(current.date).getTime() - targetDate.getTime());
    return currentDiff < closestDiff ? current : closest;
  });
}

/**
 * Calculate intervention impact by comparing risk scores before and after
 */
export function calculateInterventionImpact(
  studentId: string,
  interventionDate: Date,
  snapshots: MetricsSnapshot[]
): InterventionImpact {
  // Filter snapshots for this student
  const studentSnapshots = snapshots.filter(s => s.studentId === studentId);

  // Get snapshot at intervention
  const atIntervention = findClosestSnapshot(studentSnapshots, interventionDate);

  // Get snapshots 1, 2, 4 weeks after
  const week1 = findClosestSnapshot(studentSnapshots, addWeeks(interventionDate, 1));
  const week2 = findClosestSnapshot(studentSnapshots, addWeeks(interventionDate, 2));
  const week4 = findClosestSnapshot(studentSnapshots, addWeeks(interventionDate, 4));

  const riskAtIntervention = atIntervention?.riskScore || 0;
  const riskWeek1 = week1?.riskScore || null;
  const riskWeek2 = week2?.riskScore || null;
  const riskWeek4 = week4?.riskScore || null;

  const deltaWeek1 = riskWeek1 !== null ? riskWeek1 - riskAtIntervention : null;
  const deltaWeek2 = riskWeek2 !== null ? riskWeek2 - riskAtIntervention : null;
  const deltaWeek4 = riskWeek4 !== null ? riskWeek4 - riskAtIntervention : null;

  const improved = deltaWeek4 !== null && deltaWeek4 < -15; // 15+ point decrease
  const sustainedImprovement = improved && deltaWeek4 !== null && deltaWeek4 < 0;

  return {
    studentId,
    interventionDate,
    riskAtIntervention,
    riskWeek1,
    riskWeek2,
    riskWeek4,
    deltaWeek1,
    deltaWeek2,
    deltaWeek4,
    improved,
    sustainedImprovement,
  };
}

/**
 * Calculate course completion time and acceleration after intervention
 */
export function calculateCourseCompletionTime(
  student: Student,
  interventions: any[]
): CourseCompletionMetrics {
  const course = student.currentCourse;

  if (!course?.startDate) {
    return {
      studentId: student.id,
      courseId: course?.id || 'unknown',
      startDate: new Date(),
      completionDate: null,
      daysToComplete: null,
      avgDailyXP: 0,
      interventionsReceived: interventions.length,
      preInterventionRate: null,
      postInterventionRate: null,
      accelerationFactor: null,
    };
  }

  const start = new Date(course.startDate);
  const end = course.completionDate ? new Date(course.completionDate) : new Date();
  const days = differenceInDays(end, start);

  const studentInterventions = interventions
    .filter(i => i.studentId === student.id)
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  const firstIntervention = studentInterventions[0];

  let preRate = null;
  let postRate = null;
  let accelerationFactor = null;

  if (firstIntervention) {
    const interventionDate = new Date(firstIntervention.timestamp);

    // Calculate XP rate before intervention
    const preXP = calculateXPRate(student, start, interventionDate);
    const postXP = calculateXPRate(student, interventionDate, end);

    preRate = preXP;
    postRate = postXP;
    accelerationFactor = preRate > 0 ? postRate / preRate : null;
  }

  return {
    studentId: student.id,
    courseId: course.id || 'unknown',
    startDate: start,
    completionDate: course.completionDate ? new Date(course.completionDate) : null,
    daysToComplete: course.completionDate ? days : null,
    avgDailyXP: student.metrics?.dailyXP || 0,
    interventionsReceived: studentInterventions.length,
    preInterventionRate: preRate,
    postInterventionRate: postRate,
    accelerationFactor,
  };
}

/**
 * Calculate XP rate (XP per day) between two dates
 */
function calculateXPRate(student: Student, startDate: Date, endDate: Date): number {
  const days = Math.max(1, differenceInDays(endDate, startDate));

  // Simplified: use current dailyXP as estimate
  // In production, would calculate from xpHistory in activity
  const xpPerDay = student.metrics?.dailyXP || 0;

  return xpPerDay;
}

/**
 * Calculate before/after snapshot for a student intervention
 */
export function calculateBeforeAfterSnapshot(
  studentId: string,
  interventionDate: Date,
  snapshots: MetricsSnapshot[]
): BeforeAfterSnapshot {
  const studentSnapshots = snapshots.filter(s => s.studentId === studentId);

  // Get "before" snapshot (7 days prior to intervention)
  const beforeDate = subDays(interventionDate, 7);
  const beforeSnapshot = findClosestSnapshot(studentSnapshots, beforeDate);

  // Get "after" snapshot (14 days after intervention)
  const afterDate = addWeeks(interventionDate, 2);
  const afterSnapshot = findClosestSnapshot(studentSnapshots, afterDate);

  const beforeRSR = beforeSnapshot?.rsr || 0;
  const beforeKSI = beforeSnapshot?.ksi || 0;
  const beforeVelocity = beforeSnapshot?.velocity || 0;
  const beforeDailyXP = beforeSnapshot?.dailyXP || 0;

  const afterRSR = afterSnapshot?.rsr || 0;
  const afterKSI = afterSnapshot?.ksi || 0;
  const afterVelocity = afterSnapshot?.velocity || 0;
  const afterDailyXP = afterSnapshot?.dailyXP || 0;

  const rsrChange = afterRSR - beforeRSR;
  const ksiChange = afterKSI - beforeKSI;
  const velocityChange = afterVelocity - beforeVelocity;
  const xpChange = afterDailyXP - beforeDailyXP;

  // Count improvements (positive changes)
  const improvements = [rsrChange > 0, ksiChange > 0, velocityChange > 0, xpChange > 0].filter(Boolean).length;
  const overallImprovement = improvements >= 2;

  // Calculate improvement score (0-100)
  const improvementScore = Math.min(100, Math.max(0, (improvements / 4) * 100 + (rsrChange * 50)));

  return {
    studentId,
    interventionDate,
    beforeRSR,
    beforeKSI,
    beforeVelocity,
    beforeDailyXP,
    afterRSR,
    afterKSI,
    afterVelocity,
    afterDailyXP,
    rsrChange,
    ksiChange,
    velocityChange,
    xpChange,
    overallImprovement,
    improvementScore,
  };
}

/**
 * Calculate intervention effectiveness by objective type
 */
export function calculateInterventionEffectiveness(
  interventions: any[],
  impacts: InterventionImpact[]
): InterventionEffectiveness[] {
  const objectives = Array.from(new Set(interventions.map(i => i.objective)));

  return objectives.map(objective => {
    const relevantInterventions = interventions.filter(i => i.objective === objective);
    const relevantImpacts = impacts.filter(impact =>
      relevantInterventions.some(i =>
        i.studentId === impact.studentId &&
        new Date(i.timestamp).getTime() === impact.interventionDate.getTime()
      )
    );

    const successful = relevantImpacts.filter(i => i.improved).length;
    const avgRiskDecrease = relevantImpacts.reduce((sum, i) => sum + (i.deltaWeek4 || 0), 0) / Math.max(1, relevantImpacts.length);

    // Simplified time to improvement calculation
    const avgTimeToImprovement = 14; // Default 14 days

    // Determine most effective tier
    const tierCounts = { RED: 0, YELLOW: 0, GREEN: 0 };
    relevantImpacts.forEach(impact => {
      if (impact.riskAtIntervention >= 60) tierCounts.RED++;
      else if (impact.riskAtIntervention >= 35) tierCounts.YELLOW++;
      else tierCounts.GREEN++;
    });

    const mostEffectiveFor = Object.entries(tierCounts).reduce((a, b) => a[1] > b[1] ? a : b)[0] as 'RED' | 'YELLOW' | 'GREEN';

    return {
      objective,
      totalInterventions: relevantInterventions.length,
      successfulInterventions: successful,
      avgRiskDecrease: Math.abs(avgRiskDecrease),
      avgTimeToImprovement,
      successRate: relevantInterventions.length > 0 ? (successful / relevantInterventions.length) * 100 : 0,
      mostEffectiveFor,
    };
  }).sort((a, b) => b.successRate - a.successRate);
}

/**
 * Calculate coach performance metrics
 */
export function calculateCoachPerformance(
  coaches: string[],
  interventions: any[],
  impacts: InterventionImpact[]
): CoachPerformance[] {
  return coaches.map(coach => {
    const coachInterventions = interventions.filter(i => i.coach === coach);
    const coachImpacts = impacts.filter(impact =>
      coachInterventions.some(i =>
        i.studentId === impact.studentId &&
        new Date(i.timestamp).getTime() === impact.interventionDate.getTime()
      )
    );

    const successful = coachImpacts.filter(i => i.improved).length;
    const avgRiskDecrease = coachImpacts.reduce((sum, i) => sum + Math.abs(i.deltaWeek4 || 0), 0) / Math.max(1, coachImpacts.length);

    // Count unique students helped
    const studentsHelped = new Set(coachInterventions.map(i => i.studentId)).size;

    // Calculate follow-up rate (students with 2+ interventions)
    const studentInterventionCounts = coachInterventions.reduce((acc, i) => {
      acc[i.studentId] = (acc[i.studentId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const followUpCount = Object.values(studentInterventionCounts).filter(count => count >= 2).length;
    const followUpRate = studentsHelped > 0 ? (followUpCount / studentsHelped) * 100 : 0;

    // Find top objective
    const objectiveCounts = coachInterventions.reduce((acc, i) => {
      acc[i.objective] = (acc[i.objective] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topObjective = Object.entries(objectiveCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

    // Calculate impact score (weighted composite)
    const successRate = coachInterventions.length > 0 ? (successful / coachInterventions.length) * 100 : 0;
    const impactScore = (successRate * 0.5) + (avgRiskDecrease * 2) + (followUpRate * 0.3);

    return {
      coachName: coach,
      totalInterventions: coachInterventions.length,
      studentsHelped,
      avgRiskDecrease,
      successRate,
      avgResponseTime: 24, // Placeholder: would calculate from alert timestamps
      followUpRate,
      topObjective,
      impactScore: Math.round(impactScore),
    };
  }).sort((a, b) => b.impactScore - a.impactScore);
}

/**
 * Compare cohorts with and without interventions
 */
export function compareCohorts(
  allStudents: Student[],
  interventions: any[]
): { withInterventions: CohortComparison; withoutInterventions: CohortComparison } {
  const studentsWithInterventions = allStudents.filter(s =>
    interventions.some(i => i.studentId === s.id)
  );

  const studentsWithoutInterventions = allStudents.filter(s =>
    !interventions.some(i => i.studentId === s.id)
  );

  const calculateCohortMetrics = (students: Student[]): CohortComparison => {
    const completedCourses = students.filter(s => s.currentCourse?.completionDate);
    const avgCompletionDays = completedCourses.reduce((sum, s) => {
      if (!s.currentCourse?.startDate || !s.currentCourse?.completionDate) return sum;
      return sum + differenceInDays(
        new Date(s.currentCourse.completionDate),
        new Date(s.currentCourse.startDate)
      );
    }, 0) / Math.max(1, completedCourses.length);

    return {
      cohort: 'with_interventions',
      studentCount: students.length,
      avgCourseCompletionDays: Math.round(avgCompletionDays),
      avgRiskScoreChange: 0, // Would calculate from snapshots
      avgRSRChange: 0, // Would calculate from snapshots
      courseCompletionRate: students.length > 0 ? (completedCourses.length / students.length) * 100 : 0,
      attritionRate: 0, // Would calculate from login history
    };
  };

  const withMetrics = calculateCohortMetrics(studentsWithInterventions);
  const withoutMetrics = calculateCohortMetrics(studentsWithoutInterventions);

  return {
    withInterventions: { ...withMetrics, cohort: 'with_interventions' },
    withoutInterventions: { ...withoutMetrics, cohort: 'without_interventions' },
  };
}
