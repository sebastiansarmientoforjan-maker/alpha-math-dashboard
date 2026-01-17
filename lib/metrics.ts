export interface Metrics {
  // TIER 1
  velocityScore: number;
  consistencyIndex: number;
  stuckScore: number;
  dropoutProbability: number;
  accuracyRate: number;
  
  // TIER 2
  efficiencyRatio: number; // Progreso % por Hora invertida
  coldStartDays: number;   // Días estimados sin actividad
  momentumScore: number;   // Tendencia (Placeholder por ahora)
}

export function calculateTier1Metrics(student: any, activity: any): Metrics {
  const schedule = student?.schedule || {};
  const currentCourse = student?.currentCourse || {};
  
  // --- TIER 1 DATA ---
  const weeklyGoal = (schedule.monGoal || 0) + (schedule.tueGoal || 0) + (schedule.wedGoal || 0) + 
                     (schedule.thuGoal || 0) + (schedule.friGoal || 0) + (schedule.satGoal || 0) + (schedule.sunGoal || 0);
  
  const weeklyXP = activity?.xpAwarded || 0;
  const timeWeekMin = Math.round((activity?.time || 0) / 60); // Horas si dividimos por 60
  const hoursInvested = (activity?.time || 0) / 60;
  const questions = activity?.questions || 0;
  const questionsCorrect = activity?.questionsCorrect || 0;
  const tasks = activity?.numTasks || 0;
  const courseProgress = (currentCourse.progress || 0) * 100; // 0-100 scale
  
  // 1. VELOCITY SCORE
  const velocityScore = weeklyGoal > 0 
    ? Math.min(Math.round((weeklyXP / weeklyGoal) * 100), 100)
    : (weeklyXP > 0 ? 100 : 0);
  
  // 2. ACCURACY RATE
  const accuracyRate = questions > 0 
    ? Math.round((questionsCorrect / questions) * 100)
    : 0;
  
  // 3. CONSISTENCY INDEX
  let consistencyIndex = 0;
  if (weeklyXP === 0) consistencyIndex = 0;
  else if (velocityScore >= 80) consistencyIndex = 0.9;
  else if (velocityScore >= 50) consistencyIndex = 0.6;
  else consistencyIndex = 0.3;
  
  // 4. STUCK SCORE
  let stuckScore = 0;
  if (timeWeekMin > 200 && courseProgress < 5) stuckScore = 80; // Mucho tiempo, poco avance
  else if (tasks > 8 && accuracyRate < 60) stuckScore = 50;     // Muchos intentos, fallos
  
  // --- TIER 2 CALCULATIONS ---

  // 6. EFFICIENCY RATIO (Puntos de Progreso ganados por Hora invertida)
  // Fórmula: % Progreso / Horas. Ej: Avanzó 2% en 1 hora = Ratio 2.0
  // Protegemos división por cero
  const efficiencyRatio = hoursInvested > 0.5 
    ? parseFloat((courseProgress / hoursInvested).toFixed(2)) 
    : 0; 

  // 7. COLD START (Estimación de inactividad)
  // Si no tiene XP esta semana, asumimos 7 días inactivo (Riesgo alto)
  // Si tiene XP pero muy poca, asumimos 3 días.
  let coldStartDays = 0;
  if (weeklyXP === 0) coldStartDays = 7;
  else if (weeklyXP < 50) coldStartDays = 3;

  // 8. MOMENTUM SCORE (Placeholder)
  // Requiere comparar con la semana anterior. Por ahora asumimos "Estable".
  const momentumScore = 1.0; 

  // 5. DROPOUT PROBABILITY (Actualizado con Tier 2)
  let dropoutRisk = 0;
  if (velocityScore < 30) dropoutRisk += 30;
  if (consistencyIndex < 0.3) dropoutRisk += 20;
  if (accuracyRate < 55 && weeklyXP > 0) dropoutRisk += 20;
  if (stuckScore > 60) dropoutRisk += 15;
  if (coldStartDays >= 7) dropoutRisk += 15; // Penalización por inactividad total
  
  return {
    velocityScore: Math.round(velocityScore),
    consistencyIndex: Math.round(consistencyIndex * 100) / 100,
    stuckScore: Math.round(stuckScore),
    dropoutProbability: Math.min(dropoutRisk, 100),
    accuracyRate: Math.round(accuracyRate),
    efficiencyRatio,
    coldStartDays,
    momentumScore
  };
}
