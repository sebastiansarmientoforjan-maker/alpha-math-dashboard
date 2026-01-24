// lib/dri-config.ts
// Configuración centralizada de estándares Alpha y umbrales DRI

/**
 * Alpha School Standards & DRI Configuration
 * 
 * Basado en:
 * - Technical Calculation Protocol: Math DRI Metrics
 * - Automation Threshold Roadmap
 * - Academic Audit Report 2024-2025
 */

export const DRI_CONFIG = {
  // ==========================================
  // VELOCITY STANDARDS (Alpha Protocol)
  // ==========================================
  
  /**
   * Estándar semanal Alpha: 25 XP/día × 5 días útiles
   * Fuente: Technical Protocol - Mastery Density formula
   */
  ALPHA_WEEKLY_STANDARD: 125,
  
  /**
   * Estándar diario Alpha
   */
  ALPHA_DAILY_STANDARD: 25,
  
  /**
   * Cap máximo de velocity para evitar outliers
   */
  VELOCITY_CAP: 200,
  
  // ==========================================
  // DER (DEBT EXPOSURE RATIO)
  // ==========================================
  
  /**
   * Umbral de accuracy para considerar un topic "maestreado"
   * Alpha requiere 100%, pero 65% es proxy razonable para análisis
   */
  DER_MASTERY_THRESHOLD: 0.65,
  
  /**
   * Mínimo de tasks necesarios para calcular DER confiable
   */
  DER_MIN_TASKS: 5,
  
  /**
   * Umbral crítico de deuda académica
   * Fuente: Technical Protocol - "If DER > 20%, student is in remedial mode"
   */
  DER_CRITICAL_THRESHOLD: 20,
  
  /**
   * Umbral severo de deuda (alerta máxima)
   */
  DER_SEVERE_THRESHOLD: 40,
  
  // ==========================================
  // PDI (PRECISION DECAY INDEX)
  // ==========================================
  
  /**
   * Tamaño de ventana para calcular errores (sesiones)
   */
  PDI_WINDOW_SIZE: 10,
  
  /**
   * Umbral crítico de precision decay
   * Fuente: Technical Protocol - "PDI > 1.5 suggests Short-Burst Specialist"
   */
  PDI_CRITICAL_THRESHOLD: 1.5,
  
  /**
   * Umbral severo de decay (fatiga extrema)
   */
  PDI_SEVERE_THRESHOLD: 2.0,
  
  /**
   * Activar normalización por dificultad de topic
   */
  PDI_NORMALIZE_DIFFICULTY: true,
  
  /**
   * Factores de dificultad por nivel
   */
  TOPIC_DIFFICULTY: {
    'K-8': 0.7,  // 30% error esperado
    'HS': 1.0,   // 50% error esperado (baseline)
    'AP': 1.3    // 65% error esperado
  } as Record<string, number>,
  
  // ==========================================
  // INACTIVIDAD
  // ==========================================
  
  /**
   * Días sin actividad para marcar como INACTIVE
   */
  INACTIVITY_DAYS_THRESHOLD: 7,
  
  // ==========================================
  // iROI (INVESTMENT ROI)
  // ==========================================
  
  /**
   * Umbral mínimo de productividad (XP por segundo)
   * Estudiante con >1 hora y <0.3 XP/s está estancado
   */
  iROI_LOW_PRODUCTIVITY_THRESHOLD: 0.3,
  
  /**
   * Tiempo mínimo (segundos) para validar baja productividad
   */
  iROI_MIN_TIME_FOR_EVAL: 3600, // 1 hora
  
  // ==========================================
  // RISK SCORING (Sistema Ponderado)
  // ==========================================
  
  /**
   * Activar sistema de scoring ponderado vs umbrales binarios
   */
  RISK_SCORING_ENABLED: true,
  
  /**
   * Pesos de factores de riesgo (deben sumar 100)
   */
  RISK_WEIGHTS: {
    DEBT_EXPOSURE: 30,
    VELOCITY: 25,
    PRECISION_DECAY: 20,
    STABILITY: 15,
    STALL_STATUS: 10
  },
  
  /**
   * Umbral para clasificación RED
   */
  RISK_RED_THRESHOLD: 60,
  
  /**
   * Umbral para clasificación YELLOW
   */
  RISK_YELLOW_THRESHOLD: 35,
  
  // ==========================================
  // KSI (KNOWLEDGE STABILITY INDEX)
  // ==========================================
  
  /**
   * Umbral de estabilidad crítica
   */
  KSI_CRITICAL_THRESHOLD: 50,
  
  /**
   * Umbral de estabilidad baja
   */
  KSI_LOW_THRESHOLD: 60,
  
  // ==========================================
  // MASTERY (Recent Success Rate)
  // ==========================================
  
  /**
   * Umbral de accuracy para considerar una task "exitosa"
   */
  RSR_SUCCESS_THRESHOLD: 0.8,
  
  /**
   * Número de tasks recientes a evaluar
   */
  RSR_RECENT_TASKS_COUNT: 10
  
} as const;

/**
 * Type helper para acceso type-safe
 */
export type DRIConfigKey = keyof typeof DRI_CONFIG;
