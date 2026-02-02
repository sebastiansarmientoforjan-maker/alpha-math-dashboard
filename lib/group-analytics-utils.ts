/**
 * Utilidades para Group Analytics
 * Funciones para agrupar estudiantes y calcular estadísticas agregadas
 */

import { Student } from '@/types';
import { GroupDimension, GroupStats, StudentDimensions } from './student-dimensions';

/**
 * Agrupa estudiantes por una dimensión específica
 */
export function groupStudentsByDimension(
  students: Student[],
  dimension: GroupDimension
): Record<string, Student[]> {
  const groups: Record<string, Student[]> = {};

  students.forEach((student) => {
    let groupKey: string;

    // Manejar estudiantes sin dimensiones (Online - No Campus)
    if (!student.dimensions) {
      groupKey =
        dimension === 'campus' ? 'Online (No Campus)' : 'Unassigned';
    } else {
      // Obtener valor de la dimensión
      switch (dimension) {
        case 'campus':
          groupKey = student.dimensions.campusDisplayName;
          break;

        case 'grade':
          groupKey = `Grade ${student.dimensions.grade}`;
          break;

        case 'guide':
          groupKey = student.dimensions.guide || 'No guide';
          break;

        default:
          groupKey = 'Unknown';
      }
    }

    if (!groups[groupKey]) groups[groupKey] = [];
    groups[groupKey].push(student);
  });

  return groups;
}

/**
 * Calcula estadísticas agregadas para un grupo de estudiantes
 */
export function calculateGroupStats(
  group: string,
  students: Student[]
): GroupStats {
  const count = students.length;

  // Filtrar estudiantes con métricas válidas
  const validStudents = students.filter(
    (s) =>
      s.metrics &&
      typeof s.metrics.lmp === 'number' &&
      typeof s.metrics.velocityScore === 'number'
  );

  if (validStudents.length === 0) {
    return {
      group,
      count,
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

  // Calcular promedios
  const avgRSR = average(validStudents.map((s) => s.metrics.lmp * 100));
  const avgVelocity = average(
    validStudents.map((s) => s.metrics.velocityScore)
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
    validStudents.map((s) => s.metrics.focusIntegrity || 0)
  );

  // Contar por tier
  const redCount = students.filter((s) => s.dri?.driTier === 'RED').length;
  const yellowCount = students.filter(
    (s) => s.dri?.driTier === 'YELLOW'
  ).length;
  const greenCount = students.filter((s) => s.dri?.driTier === 'GREEN').length;

  // Calcular percentiles de RSR
  const rsrValues = validStudents
    .map((s) => s.metrics.lmp * 100)
    .sort((a, b) => a - b);
  const p25_RSR = percentile(rsrValues, 25);
  const median_RSR = percentile(rsrValues, 50);
  const p75_RSR = percentile(rsrValues, 75);

  return {
    group,
    count,
    avgRSR,
    avgVelocity,
    avgKSI,
    avgRiskScore,
    avgAccuracy,
    avgEfficiency,
    redCount,
    yellowCount,
    greenCount,
    p25_RSR,
    median_RSR,
    p75_RSR,
    hasInsufficientData: count < 5, // Flag si hay menos de 5 estudiantes
  };
}

/**
 * Calcula el promedio de un array de números
 */
function average(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  const sum = numbers.reduce((acc, n) => acc + n, 0);
  return sum / numbers.length;
}

/**
 * Calcula un percentil de un array de números ordenados
 */
function percentile(sortedNumbers: number[], p: number): number {
  if (sortedNumbers.length === 0) return 0;
  const index = (p / 100) * (sortedNumbers.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index % 1;

  if (upper >= sortedNumbers.length) return sortedNumbers[lower];
  return sortedNumbers[lower] * (1 - weight) + sortedNumbers[upper] * weight;
}

/**
 * Ordena grupos por count (descendente)
 */
export function sortGroupsByCount(
  groups: Record<string, Student[]>
): [string, Student[]][] {
  return Object.entries(groups).sort((a, b) => b[1].length - a[1].length);
}

/**
 * Obtiene el label amigable para un grupo
 */
export function getGroupLabel(dimension: GroupDimension, groupKey: string): string {
  // Para campus y guide, usar el nombre directamente
  if (dimension === 'campus' || dimension === 'guide') {
    return groupKey;
  }
  
  // Para grade, ya viene formateado como "Grade X"
  if (dimension === 'grade') {
    return groupKey;
  }
  
  return groupKey;
}

/**
 * Filtra grupos con datos insuficientes (< 5 estudiantes)
 * Retorna [grupos válidos, grupos insuficientes]
 */
export function filterGroupsBySize(
  groups: Record<string, Student[]>,
  minSize: number = 5
): [Record<string, Student[]>, Record<string, Student[]>] {
  const valid: Record<string, Student[]> = {};
  const insufficient: Record<string, Student[]> = {};

  Object.entries(groups).forEach(([key, students]) => {
    if (students.length >= minSize) {
      valid[key] = students;
    } else {
      insufficient[key] = students;
    }
  });

  return [valid, insufficient];
}

/**
 * Genera un resumen de texto para un grupo
 */
export function generateGroupSummary(stats: GroupStats): string {
  const insights: string[] = [];

  // Performance general
  if (stats.avgRSR >= 75) {
    insights.push('Strong RSR performance');
  } else if (stats.avgRSR < 60) {
    insights.push('RSR needs attention');
  }

  // Velocity
  if (stats.avgVelocity >= 85) {
    insights.push('Excellent velocity');
  } else if (stats.avgVelocity < 70) {
    insights.push('Low velocity');
  }

  // Risk distribution
  const riskPercentage = (stats.redCount / stats.count) * 100;
  if (riskPercentage > 20) {
    insights.push(`${stats.redCount} at-risk students (${riskPercentage.toFixed(0)}%)`);
  }

  // Data quality
  if (stats.hasInsufficientData) {
    insights.push('⚠️ Small sample size');
  }

  return insights.length > 0 ? insights.join(' • ') : 'Normal performance';
}

/**
 * Compara dos grupos y retorna diferencias
 */
export function compareGroups(
  stats1: GroupStats,
  stats2: GroupStats
): {
  rsrDelta: number;
  velocityDelta: number;
  riskDelta: number;
  countDelta: number;
} {
  return {
    rsrDelta: stats1.avgRSR - stats2.avgRSR,
    velocityDelta: stats1.avgVelocity - stats2.avgVelocity,
    riskDelta: stats1.avgRiskScore - stats2.avgRiskScore,
    countDelta: stats1.count - stats2.count,
  };
}
