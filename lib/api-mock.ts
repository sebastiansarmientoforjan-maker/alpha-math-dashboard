// ============================================
// ALPHA MATH COMMAND v7.0 - API MOCK DATA
// ============================================
// STRICT MODE: Simulates 1,600 students with injected critical states
// Part 7.4 (Firebase Schema) + Part 2 (Scale: 1,600 students)

import { MathAcademyStudent, ActivityLog, InterventionRecord } from '@/types/command';

// ============================================
// CONFIGURATION
// ============================================

const TOTAL_STUDENTS = 1600;
const CRITICAL_PERCENTAGE = 0.1; // 10% critical state
const INTERVENTION_HISTORY_PERCENTAGE = 0.2; // 20% with velocity recovery data

const CAMPUSES = ['Austin', 'San Francisco', 'Miami', 'Online'];
const COURSES = [
  'Algebra I',
  'Geometry',
  'Algebra II',
  'Pre-Calculus',
  'Calculus AB',
  'Calculus BC',
  'Statistics',
];

const TOPICS = [
  'Linear Equations',
  'Quadratic Equations',
  'Polynomials',
  'Logarithms',
  'Trigonometry',
  'Derivatives',
  'Integrals',
  'Limits',
  'Series',
  'Probability',
  'Statistics',
  'Matrices',
  'Vectors',
  'Complex Numbers',
  'Conic Sections',
];

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Generate random number within range
 */
function randomRange(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

/**
 * Generate random integer within range
 */
function randomInt(min: number, max: number): number {
  return Math.floor(randomRange(min, max));
}

/**
 * Pick random item from array
 */
function randomPick<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Generate realistic activity log for a topic
 * @param topic - Topic name
 * @param hoursAgo - How many hours ago this activity occurred
 * @param isCritical - Whether this should show critical patterns
 */
function generateActivityLog(
  topic: string,
  hoursAgo: number,
  isCritical: boolean
): ActivityLog {
  const timestamp = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);

  if (isCritical) {
    // Critical: Low accuracy, many attempts, no resources
    return {
      timestamp,
      topic,
      attempts: randomInt(5, 15), // Many attempts
      accuracy: randomRange(0.2, 0.5), // Low accuracy
      timeSpent: randomRange(30, 180), // 30-180 minutes (BLOCKED territory)
      hintsUsed: 0, // No resources used
      videoWatched: false,
    };
  } else {
    // Normal: Good accuracy, reasonable attempts, some resources
    return {
      timestamp,
      topic,
      attempts: randomInt(1, 5),
      accuracy: randomRange(0.7, 0.95),
      timeSpent: randomRange(10, 60),
      hintsUsed: randomInt(0, 3),
      videoWatched: Math.random() > 0.7,
    };
  }
}

/**
 * Generate intervention history with velocity recovery data
 * CRITICAL: This data is used to measure intervention effectiveness
 */
function generateInterventionHistory(): InterventionRecord[] {
  const history: InterventionRecord[] = [];
  const interventionCount = randomInt(2, 5); // 2-5 interventions

  for (let i = 0; i < interventionCount; i++) {
    const daysAgo = randomInt(7, 90); // 1 week to 3 months ago
    const timestamp = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);

    // Velocity before intervention (typically low if intervention needed)
    const velocityBefore = randomRange(0.5, 1.5); // Below required rate

    // Velocity 24h after intervention (should improve)
    const recoveryFactor = randomRange(1.2, 2.0); // 20-100% improvement
    const velocityAfter = velocityBefore * recoveryFactor;

    // Success if velocity improved by at least 20%
    const successful = velocityAfter > velocityBefore * 1.2;

    const levels = ['LEVEL_1_HINT', 'LEVEL_2_MESSAGE', 'LEVEL_3_PEER', 'LEVEL_4_RESCUE'] as const;
    const reasons = [
      'SPIN_DETECTED',
      'VELOCITY_DROP',
      'MASTERY_BLOCKED',
      'INACTIVE_ALERT',
    ];

    history.push({
      id: `intervention_${timestamp.getTime()}_${i}`,
      timestamp,
      dri: randomPick(['Coach Sarah', 'Coach Mike', 'Coach Emma', 'Coach David']),
      level: randomPick(levels),
      reason: randomPick(reasons),
      action: 'Peer tutoring session arranged',
      topic: randomPick(TOPICS),
      velocityBefore,
      velocityAfter,
      successful,
      notes: successful ? 'Velocity recovered successfully' : 'Partial improvement observed',
    });
  }

  return history.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
}

// ============================================
// STUDENT GENERATION
// ============================================

/**
 * Generate a single student with realistic data
 * @param index - Student index (0-1599)
 * @param isCritical - Force critical state
 * @param hasInterventionHistory - Include velocity recovery data
 */
function generateStudent(
  index: number,
  isCritical: boolean,
  hasInterventionHistory: boolean
): MathAcademyStudent {
  const id = `student_${String(index).padStart(4, '0')}`;
  const firstName = `Student${index}`;
  const lastName = `Last${index}`;
  const campus = randomPick(CAMPUSES);
  const course = randomPick(COURSES);

  // Progress and velocity
  const progress = isCritical ? randomRange(10, 40) : randomRange(30, 95);
  const velocity = isCritical
    ? randomRange(0.3, 0.7) // < 0.8 = RED_SHIFT
    : randomRange(1.0, 3.0); // Normal or BLUE_SHIFT

  // Metrics
  const rsr = isCritical ? randomRange(30, 60) : randomRange(70, 95);
  const ksi = isCritical ? randomRange(40, 70) : randomRange(70, 95);
  const dailyXP = isCritical ? randomRange(50, 150) : randomRange(200, 500);

  // Generate activity logs
  const activityCount = randomInt(5, 20);
  const activity: ActivityLog[] = [];

  for (let i = 0; i < activityCount; i++) {
    const hoursAgo = randomRange(1, 168); // Last week
    activity.push(generateActivityLog(randomPick(TOPICS), hoursAgo, isCritical));
  }

  // Risk score (0-100)
  const riskScore = isCritical ? randomRange(60, 95) : randomRange(10, 50);

  // Intervention history (20% of students)
  const interventionHistory = hasInterventionHistory ? generateInterventionHistory() : [];

  return {
    id,
    firstName,
    lastName,
    email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@alpha.school`,
    campus,
    currentCourse: course,
    progress,
    activity,
    metrics: {
      rsr,
      ksi,
      velocity,
      dailyXP,
    },
    riskScore,
    interventionHistory,
    lastUpdated: new Date().toISOString(),
  };
}

// ============================================
// API MOCK FUNCTIONS
// ============================================

/**
 * Fetch all students with injected critical states
 *
 * DATA INJECTION:
 * - 10% (160 students) have CRITICAL state
 * - 20% (320 students) have interventionHistory with velocity recovery data
 *
 * CRITICAL STATE criteria:
 * - Velocity < 0.8 (RED_SHIFT)
 * - OR MasteryLatency > 120 minutes (BLOCKED)
 *
 * @returns Array of 1,600 students
 */
export async function fetchStudents(): Promise<MathAcademyStudent[]> {
  console.log('🔄 Generating 1,600 mock students...');

  const students: MathAcademyStudent[] = [];

  // Calculate counts
  const criticalCount = Math.floor(TOTAL_STUDENTS * CRITICAL_PERCENTAGE);
  const interventionHistoryCount = Math.floor(TOTAL_STUDENTS * INTERVENTION_HISTORY_PERCENTAGE);

  // Shuffle indices for random distribution
  const indices = Array.from({ length: TOTAL_STUDENTS }, (_, i) => i);
  const shuffled = indices.sort(() => Math.random() - 0.5);

  // Assign critical and intervention history flags
  const criticalIndices = new Set(shuffled.slice(0, criticalCount));
  const interventionIndices = new Set(shuffled.slice(criticalCount, criticalCount + interventionHistoryCount));

  // Generate all students
  for (let i = 0; i < TOTAL_STUDENTS; i++) {
    const isCritical = criticalIndices.has(i);
    const hasInterventionHistory = interventionIndices.has(i);

    students.push(generateStudent(i, isCritical, hasInterventionHistory));
  }

  console.log('✅ Generated 1,600 students:');
  console.log(`   - ${criticalCount} (${CRITICAL_PERCENTAGE * 100}%) in CRITICAL state`);
  console.log(`   - ${interventionHistoryCount} (${INTERVENTION_HISTORY_PERCENTAGE * 100}%) with velocity recovery data`);

  return students;
}

/**
 * Fetch students by campus (for filtering)
 */
export async function fetchStudentsByCampus(campus: string): Promise<MathAcademyStudent[]> {
  const allStudents = await fetchStudents();
  return allStudents.filter(s => s.campus === campus);
}

/**
 * Fetch critical students only
 */
export async function fetchCriticalStudents(): Promise<MathAcademyStudent[]> {
  const allStudents = await fetchStudents();
  return allStudents.filter(s => s.riskScore >= 60);
}

/**
 * Get available campuses
 */
export function getAvailableCampuses(): string[] {
  return [...CAMPUSES];
}

/**
 * Get mock statistics for dashboard
 */
export async function getMockStatistics() {
  const students = await fetchStudents();

  const critical = students.filter(s => s.riskScore >= 60).length;
  const withInterventions = students.filter(s => s.interventionHistory.length > 0).length;

  const avgVelocity = students.reduce((sum, s) => sum + s.metrics.velocity, 0) / students.length;
  const avgProgress = students.reduce((sum, s) => sum + s.progress, 0) / students.length;

  return {
    totalStudents: students.length,
    criticalStudents: critical,
    studentsWithInterventions: withInterventions,
    averageVelocity: avgVelocity.toFixed(2),
    averageProgress: avgProgress.toFixed(1),
    campuses: CAMPUSES,
  };
}
