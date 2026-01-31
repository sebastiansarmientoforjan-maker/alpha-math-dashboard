/**
 * Tipos para las dimensiones de agrupación de estudiantes
 * 
 * Solo los estudiantes con campus asignado tendrán estas dimensiones.
 * Los ~1,530 estudiantes restantes tendrán dimensions: null y se 
 * agruparán como "Online (No Campus)"
 */

// Dimensiones disponibles para agrupación
export type GroupDimension = 
  | 'campus'    // 7 grupos (6 físicos + 1 online)
  | 'grade'     // 5 grupos (8-12)
  | 'guide';    // 7 grupos (6 guides + unassigned)

// Estructura de dimensiones de un estudiante
export interface StudentDimensions {
  // Campus
  campusDisplayName: string;  // "Alpha Austin", "Strata HS", etc.
  campus: string;             // "Alpha High School", "Strata", etc.
  
  // Grade
  grade: number;              // 8, 9, 10, 11, 12
  
  // Guide (puede ser null si no asignado)
  guide: string | null;       // "Emily Findley", "Cameron Sorsby", etc.
  
  // Metadata
  hasCompleteDimensions: boolean;
  lastDimensionsUpdate: string; // ISO timestamp
}

// Configuración de dimensiones para el selector UI
export interface DimensionConfig {
  value: GroupDimension;
  label: string;
  icon: string;
  groups: number;
  priority: number;
  description: string;
  warning?: boolean;
  warningMessage?: string;
}

// Opciones de dimensiones (ordenadas por prioridad)
export const GROUP_DIMENSIONS: DimensionConfig[] = [
  {
    value: 'campus',
    label: 'By Campus',
    icon: '📍',
    groups: 7,
    priority: 1,
    description: 'Compare performance across physical campus locations',
  },
  {
    value: 'grade',
    label: 'By Grade',
    icon: '🎓',
    groups: 5,
    priority: 2,
    description: 'Compare performance by academic year level',
  },
  {
    value: 'guide',
    label: 'By Guide',
    icon: '👤',
    groups: 7,
    priority: 3,
    description: 'Compare effectiveness across different guides/mentors',
  },
];

// Estadísticas agregadas por grupo
export interface GroupStats {
  group: string;
  count: number;
  
  // Promedios de métricas
  avgRSR: number;
  avgVelocity: number;
  avgKSI: number;
  avgRiskScore: number;
  avgAccuracy: number;
  avgEfficiency: number;
  
  // Distribución por Tier DRI
  redCount: number;
  yellowCount: number;
  greenCount: number;
  
  // Percentiles (para box plots)
  p25_RSR: number;
  median_RSR: number;
  p75_RSR: number;
  
  // Flags
  hasInsufficientData: boolean;  // true si < 5 estudiantes
}

// Mapeo de valores de dimensión a labels amigables
export const DIMENSION_LABELS: Record<string, string> = {
  // Campus
  'Alpha Austin': 'Alpha Austin',
  'Strata HS': 'Strata HS',
  'Alpha Miami': 'Alpha Miami',
  'Alpha SF': 'Alpha SF',
  'Alpha SB': 'Alpha SB',
  'GT School': 'GT School',
  'Online (No Campus)': 'Online (No Campus)',
  
  // Grades
  'Grade 8': 'Grade 8',
  'Grade 9': 'Grade 9',
  'Grade 10': 'Grade 10',
  'Grade 11': 'Grade 11',
  'Grade 12': 'Grade 12',
  'Unassigned': 'No Grade Assigned',
  
  // Guides
  'Emily Findley': 'Emily Findley',
  'Cameron Sorsby': 'Cameron Sorsby',
  'Effy Phillips': 'Effy Phillips',
  'Jebin Justin': 'Jebin Justin',
  'Chloe Belvin': 'Chloe Belvin',
  'Logan higuera': 'Logan higuera',
  'No guide': 'No Guide Assigned',
};

// Colores para visualizaciones por dimensión
export const DIMENSION_COLORS: Record<string, string> = {
  // Campus colors
  'Alpha Austin': '#3b82f6',     // blue-500
  'Strata HS': '#8b5cf6',        // violet-500
  'Alpha Miami': '#ec4899',      // pink-500
  'Alpha SF': '#f59e0b',         // amber-500
  'Alpha SB': '#10b981',         // emerald-500
  'GT School': '#06b6d4',        // cyan-500
  'Online (No Campus)': '#6b7280', // gray-500
  
  // Grade colors (gradiente)
  'Grade 8': '#ddd6fe',          // violet-200
  'Grade 9': '#c4b5fd',          // violet-300
  'Grade 10': '#a78bfa',         // violet-400
  'Grade 11': '#8b5cf6',         // violet-500
  'Grade 12': '#7c3aed',         // violet-600
  
  // Guide colors (variedad)
  'Emily Findley': '#f43f5e',    // rose-500
  'Cameron Sorsby': '#3b82f6',   // blue-500
  'Effy Phillips': '#8b5cf6',    // violet-500
  'Jebin Justin': '#10b981',     // emerald-500
  'Chloe Belvin': '#f59e0b',     // amber-500
  'Logan higuera': '#06b6d4',    // cyan-500
  'No guide': '#6b7280',         // gray-500
};
