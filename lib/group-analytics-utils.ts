import { Student } from '@/types';
import { GroupStats, GroupDimension } from '@/lib/student-dimensions';

// Helper: Calculate average of an array of numbers
const average = (numbers: number[]): number => {
  if (numbers.length === 0) return 0;
  return numbers.reduce((acc, curr) => acc + curr, 0) / numbers.length;
};

// Helper: Calculate percentile from sorted array
const getPercentile = (sortedData: number[], percentile: number): number => {
  if (sortedData.length === 0) return 0;
  const index = (percentile / 100) * (sortedData.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index - lower;
  
  if (upper >= sortedData.length) return sortedData[lower];
  return sortedData[lower] * (1 - weight) + sortedData[upper] * weight;
};

/**
 * Calculates aggregated statistics for a specific group of students
 * Maintains full statistical fidelity (Percentiles, Efficiency, Accuracy)
 */
export const calculateGroupStats = (groupName: string, students: Student[]): GroupStats => {
  const validStudents = students;

  // 1. Core Metrics Arrays
  // LMP/RSR is stored as 0-1 decimal in student object, converting to 0-100 for stats
  const rsrValues = validStudents.map((s) => (s.metrics?.lmp || 0) * 100).sort((a, b) => a - b);
  
  // 2. Calculate Averages
  const avgRSR = average(rsrValues);
  
  // Usamos velocityScore como la métrica de "Eficiencia/Velocidad" ya que efficiencyRate no existe en el tipo base
  const avgVelocity = average(
    validStudents.map((s) => s.metrics?.velocityScore || 0)
  );
  
  // Mapeamos efficiency a velocity para mantener la estructura de datos completa
  const avgEfficiency = avgVelocity; 

  const avgAccuracy = average(
    validStudents.map((s) => s.metrics?.accuracyRate || 0)
  );

  const avgKSI = average(
    validStudents
      .filter((s) => s.metrics?.ksi !== null && s.metrics?.ksi !== undefined)
      .map((s) => s.metrics!.ksi!)
  );

  const avgRiskScore = average(
    validStudents.map((s) => s.dri?.riskScore || 0)
  );

  // 3. Calculate Percentiles (Quartiles) for Box Plots
  const p25_RSR = getPercentile(rsrValues, 25);
  const median_RSR = getPercentile(rsrValues, 50);
  const p75_RSR = getPercentile(rsrValues, 75);

  // 4. Count Tiers
  const redCount = validStudents.filter((s) => s.dri?.driTier === 'RED').length;
  const yellowCount = validStudents.filter((s) => s.dri?.driTier === 'YELLOW').length;
  const greenCount = validStudents.filter((s) => s.dri?.driTier === 'GREEN').length;

  return {
    group: groupName,
    count: validStudents.length,
    
    // Core Averages
    avgRSR,
    avgVelocity,
    avgKSI,
    avgRiskScore,
    
    // Detailed Stats (Restaurados)
    avgAccuracy,
    avgEfficiency, // Mapeado a Velocity
    p25_RSR,
    median_RSR,
    p75_RSR,

    // Tiers
    redCount,
    yellowCount,
    greenCount,
    
    hasInsufficientData: validStudents.length < 3,
  };
};

/**
 * Groups students by a specific dimension and returns full stats
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

  return Object.keys(groups)
    .map((groupName) => calculateGroupStats(groupName, groups[groupName]))
    .sort((a, b) => b.count - a.count);
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
