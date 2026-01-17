export interface Tier1Metrics {
  velocityScore: number;      // Cumplimiento de meta semanal (XP real vs meta del estudiante)
  consistencyIndex: number;   // Días activos / 7 días
  stuckScore: number;         // Nivel de bloqueo (tiempo alto + progreso bajo)
  dropoutProbability: number; // Probabilidad de abandono (sistema de puntos)
  accuracyRate: number;       // Precisión de respuestas correctas
}

export function calculateTier1Metrics(student: any, activity: any): Tier1Metrics {
  const schedule = student?.schedule || {};
  const currentCourse = student?.currentCourse || {};
  
  // Calcular meta semanal REAL del estudiante
  const weeklyGoal = (schedule.monGoal || 0) + 
                     (schedule.tueGoal || 0) + 
                     (schedule.wedGoal || 0) + 
                     (schedule.thuGoal || 0) + 
                     (schedule.friGoal || 0) + 
                     (schedule.satGoal || 0) + 
                     (schedule.sunGoal || 0);
  
  const weeklyXP = activity?.xpAwarded || 0;
  const timeWeekMin = Math.round((activity?.time || 0) / 60);
  const questions = activity?.questions || 0;
  const questionsCorrect = activity?.questionsCorrect || 0;
  const tasks = activity?.numTasks || 0;
  
  // Progreso del curso actual (%)
  const courseProgress = Math.round((currentCourse.progress || 0) * 100);
  
  // 1. VELOCITY SCORE (XP real / Meta semanal) * 100
  const velocityScore = weeklyGoal > 0 
    ? Math.min(Math.round((weeklyXP / weeklyGoal) * 100), 100)
    : 0;
  
  // 2. ACCURACY RATE (Precisión de respuestas)
  const accuracyRate = questions > 0 
    ? Math.round((questionsCorrect / questions) * 100)
    : 0;
  
  // 3. CONSISTENCY INDEX (Estimación de días activos basada en XP)
  // Si cumple >80% meta = probablemente activo 5-7 días
  // Si cumple 50-80% = probablemente activo 3-5 días
  // Si cumple <50% = probablemente activo 0-3 días
  let consistencyIndex = 0;
  if (weeklyXP === 0) {
    consistencyIndex = 0; // Sin actividad
  } else if (velocityScore >= 80) {
    consistencyIndex = 0.9; // Alta consistencia
  } else if (velocityScore >= 50) {
    consistencyIndex = 0.6; // Media consistencia
  } else {
    consistencyIndex = 0.3; // Baja consistencia
  }
  
  // 4. STUCK SCORE (Alto tiempo + Bajo progreso = Bloqueado)
  // Fórmula: Si invierte mucho tiempo pero no avanza = stuck
  let stuckScore = 0;
  if (timeWeekMin > 200 && courseProgress < 30) {
    stuckScore = 80; // Muy bloqueado
  } else if (timeWeekMin > 100 && weeklyXP < 100) {
    stuckScore = 60; // Bloqueado moderado
  } else if (tasks > 8 && accuracyRate < 65) {
    stuckScore = 40; // Bloqueado leve (muchos intentos, baja accuracy)
  }
  
  // 5. DROPOUT PROBABILITY (Sistema de puntos de riesgo)
  let dropoutRisk = 0;
  
  // Factor 1: Velocidad baja = riesgo alto
  if (velocityScore < 30) dropoutRisk += 40;
  else if (velocityScore < 50) dropoutRisk += 20;
  
  // Factor 2: Inconsistencia = riesgo alto
  if (consistencyIndex < 0.3) dropoutRisk += 40;
  else if (consistencyIndex < 0.6) dropoutRisk += 20;
  
  // Factor 3: Accuracy baja = frustración
  if (accuracyRate < 55 && weeklyXP > 0) dropoutRisk += 20;
  
  // Factor 4: Stuck alto = riesgo adicional
  if (stuckScore > 60) dropoutRisk += 10;
  
  return {
    velocityScore: Math.round(velocityScore),
    consistencyIndex: Math.round(consistencyIndex * 100) / 100, // Mantener decimal
    stuckScore: Math.round(stuckScore),
    dropoutProbability: Math.min(dropoutRisk, 100),
    accuracyRate: Math.round(accuracyRate),
  };
}
