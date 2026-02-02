import { Student } from '@/types';
import { GroupDimension, GroupStats } from '@/lib/student-dimensions';

/**
 * Calcula estadísticas agregadas para un grupo de estudiantes
 */
export function calculateGroupStats(
  students: Student[],
  groupName: string
): GroupStats {
  const validStudents = students.filter(s => 
    s.metrics && s.dri && s.currentCourse
  );

  if (validStudents.length === 0) {
    return {
      group: groupName,
      count: 0,
      avgRSR: 0,
      avgVelocity: 0,
      avgKSI: 0,
      avgRiskScore: 0,
      avgAccuracy: 0,
      avgEfficiency: 0,
      redCount: 0,
      yellowCount: 0,
      greenCount: 0,
      p25_RSR: 0,
      median_RSR: 0,
      p75_RSR: 0,
      hasInsufficientData: true,
    };
  }

  const average = (values: number[]) => 
    values.length > 0 
      ? values.reduce((sum, v) => sum + v, 0) / values.length 
      : 0;

  const percentile = (values: number[], p: number) => {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  };

  const rsrValues = validStudents.map(s => (s.metrics.lmp || 0) * 100);
  
  const avgRSR = average(rsrValues);
  const avgVelocity = average(
    validStudents.map(s => s.metrics.velocityScore || 0)
  );
  
  // FIX CRÍTICO: Filtrar primero los estudiantes con KSI válido
  const avgKSI = average(
    validStudents
      .filter((s) => s.metrics.ksi !== null && typeof s.metrics.ksi === 'number')
      .map((s) => s.metrics.ksi!)
  );
  
  // FIX CRÍTICO: Filtrar primero los estudiantes con riskScore válido
  const avgRiskScore = average(
    validStudents
      .filter((s) => s.dri && typeof s.dri.riskScore === 'number')
      .map((s) => s.dri.riskScore!)
  );
  
  const avgAccuracy = average(
    validStudents.map((s) => s.metrics.accuracyRate || 0)
  );
  
  const avgEfficiency = average(
    validStudents.map((s) => s.metrics.efficiencyRate || 0)
  );

  const redCount = validStudents.filter(s => s.dri.driTier === 'RED').length;
  const yellowCount = validStudents.filter(s => s.dri.driTier === 'YELLOW').length;
  const greenCount = validStudents.filter(s => s.dri.driTier === 'GREEN').length;

  return {
    group: groupName,
    count: validStudents.length,
    avgRSR,
    avgVelocity,
    avgKSI,
    avgRiskScore,
    avgAccuracy,
    avgEfficiency,
    redCount,
    yellowCount,
    greenCount,
    p25_RSR: percentile(rsrValues, 25),
    median_RSR: percentile(rsrValues, 50),
    p75_RSR: percentile(rsrValues, 75),
    hasInsufficientData: validStudents.length < 5,
  };
}

/**
 * Agrupa estudiantes por dimensión y calcula stats para cada grupo
 */
export function groupStudentsByDimension(
  students: Student[],
  dimension: GroupDimension
): GroupStats[] {
  const groups = new Map<string, Student[]>();

  students.forEach(student => {
    let groupKey: string;

    switch (dimension) {
      case 'campus':
        groupKey = student.dimensions?.campusDisplayName || 'Online (No Campus)';
        break;
      case 'grade':
        groupKey = student.dimensions?.grade 
          ? `Grade ${student.dimensions.grade}` 
          : 'Unassigned';
        break;
      case 'guide':
        groupKey = student.dimensions?.guide || 'No guide';
        break;
      default:
        groupKey = 'Unknown';
    }

    if (!groups.has(groupKey)) {
      groups.set(groupKey, []);
    }
    groups.get(groupKey)!.push(student);
  });

  const stats: GroupStats[] = [];
  groups.forEach((groupStudents, groupName) => {
    stats.push(calculateGroupStats(groupStudents, groupName));
  });

  return stats.sort((a, b) => b.count - a.count);
}

/**
 * Ordena grupos por cantidad de estudiantes (descendente)
 */
export function sortGroupsByCount(groups: GroupStats[]): GroupStats[] {
  return [...groups].sort((a, b) => b.count - a.count);
}

/**
 * Genera un resumen textual de las estadísticas de un grupo
 */
export function generateGroupSummary(stats: GroupStats): string {
  if (stats.hasInsufficientData) {
    return `${stats.group}: Only ${stats.count} students - insufficient data for meaningful analysis.`;
  }

  const riskLevel = stats.avgRiskScore >= 60 ? 'HIGH RISK' : 
                   stats.avgRiskScore >= 35 ? 'MODERATE RISK' : 
                   'LOW RISK';

  const tierDistribution = `${stats.redCount} critical, ${stats.yellowCount} watch, ${stats.greenCount} optimal`;

  return `${stats.group} (n=${stats.count}): ${riskLevel}
    • Avg RSR: ${stats.avgRSR.toFixed(1)}% (median: ${stats.median_RSR.toFixed(1)}%)
    • Avg Velocity: ${stats.avgVelocity.toFixed(1)}%
    • Avg Risk Score: ${stats.avgRiskScore.toFixed(1)}/100
    • Distribution: ${tierDistribution}`;
}

/**
 * Compara dos grupos y retorna insights
 */
export function compareGroups(group1: GroupStats, group2: GroupStats): string[] {
  const insights: string[] = [];

  const rsrDiff = Math.abs(group1.avgRSR - group2.avgRSR);
  if (rsrDiff > 10) {
    const better = group1.avgRSR > group2.avgRSR ? group1.group : group2.group;
    insights.push(`📊 RSR Gap: ${better} outperforms by ${rsrDiff.toFixed(1)}%`);
  }

  const riskDiff = Math.abs(group1.avgRiskScore - group2.avgRiskScore);
  if (riskDiff > 15) {
    const better = group1.avgRiskScore < group2.avgRiskScore ? group1.group : group2.group;
    insights.push(`⚠️ Risk Gap: ${better} has ${riskDiff.toFixed(1)} points lower risk`);
  }

  const velocityDiff = Math.abs(group1.avgVelocity - group2.avgVelocity);
  if (velocityDiff > 15) {
    const better = group1.avgVelocity > group2.avgVelocity ? group1.group : group2.group;
    insights.push(`⚡ Velocity Gap: ${better} shows ${velocityDiff.toFixed(1)}% higher engagement`);
  }

  return insights;
}
