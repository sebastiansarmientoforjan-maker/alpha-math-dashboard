import { Student } from '@/types';
import { GroupStats, GroupDimension } from '@/lib/student-dimensions';

// Helper: Calculate average of an array of numbers
const average = (numbers: number[]): number => {
  if (numbers.length === 0) return 0;
  return numbers.reduce((acc, curr) => acc + curr, 0) / numbers.length;
};

/**
 * Calculates aggregated statistics for a specific group of students
 */
export const calculateGroupStats = (groupName: string, students: Student[]): GroupStats => {
  const validStudents = students;

  // Calculate Averages
  const avgRSR = average(
    validStudents.map((s) => (s.metrics?.lmp || 0) * 100)
  );

  // CORRECCIÓN: Usamos velocityScore en lugar de efficiencyRate
  const avgVelocity = average(
    validStudents.map((s) => s.metrics?.velocityScore || 0)
  );

  const avgKSI = average(
    validStudents
      .filter((s) => s.metrics?.ksi !== null && s.metrics?.ksi !== undefined)
      .map((s) => s.metrics!.ksi!)
  );

  const avgRiskScore = average(
    validStudents.map((s) => s.dri?.riskScore || 0)
  );

  // Count Tiers
  const redCount = validStudents.filter((s) => s.dri?.driTier === 'RED').length;
  const yellowCount = validStudents.filter((s) => s.dri?.driTier === 'YELLOW').length;
  const greenCount = validStudents.filter((s) => s.dri?.driTier === 'GREEN').length;

  return {
    group: groupName,
    count: validStudents.length,
    avgRSR,
    avgVelocity,
    avgKSI,
    avgRiskScore,
    redCount,
    yellowCount,
    greenCount,
    hasInsufficientData: validStudents.length < 3, // Flag groups with low data
  };
};

/**
 * Groups students by a specific dimension (campus, grade, etc.) and returns stats for each group
 */
export const groupStudentsByDimension = (
  students: Student[],
  dimension: GroupDimension
): GroupStats[] => {
  const groups: Record<string, Student[]> = {};

  students.forEach((student) => {
    let key = 'Unknown';

    switch (dimension) {
      case 'campus':
        key = student.dimensions?.campusDisplayName || 'Online (No Campus)';
        break;
      case 'grade':
        key = student.dimensions?.grade
          ? `Grade ${student.dimensions.grade}`
          : 'Unassigned';
        break;
      case 'guide':
        key = student.dimensions?.guide || 'No Guide';
        break;
      case 'course':
        key = student.currentCourse?.name || 'No Course';
        break;
      default:
        key = 'Unknown';
    }

    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(student);
  });

  // Calculate stats for each group
  return Object.keys(groups)
    .map((groupName) => calculateGroupStats(groupName, groups[groupName]))
    .sort((a, b) => b.count - a.count); // Default sort by population
  };

export const sortGroupsByCount = (stats: GroupStats[]) => {
  return [...stats].sort((a, b) => b.count - a.count);
};

export const generateGroupSummary = (stats: GroupStats[]) => {
  const totalStudents = stats.reduce((acc, s) => acc + s.count, 0);
  const weightedAvgRSR = stats.reduce((acc, s) => acc + (s.avgRSR * s.count), 0) / (totalStudents || 1);

  return {
    totalStudents,
    totalGroups: stats.length,
    globalRSR: weightedAvgRSR
  };
};
