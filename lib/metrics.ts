export interface Metrics {
  // TIER 1 (Críticos)
  velocityScore: number;
  consistencyIndex: number;
  stuckScore: number;
  dropoutProbability: number;
  accuracyRate: number;
  
  // TIER 2 (Eficiencia)
  efficiencyRatio: number;
  coldStartDays: number;
  momentumScore: number;
  
  // TIER 3 (Diagnóstico Fino)
  timePerQuestion: number; // Minutos promedio por pregunta
  contentGap: number;      // Dificultad del contenido (> 5 es bloqueo)
  balanceScore: number;    // -1 (Subtrabajo) a +1 (Sobrecarga)
  burnoutRisk: boolean;    // Detecta fatiga cognitiva
  sessionQuality: number;  // Relación precisión/tiempo
}

export function calculateTier1Metrics(student: any, activity: any): Metrics {
  const schedule = student?.schedule || {};
  const currentCourse = student?.currentCourse || {};
  
  const weeklyGoal = (schedule.monGoal || 0) + (schedule.tueGoal || 0) + (schedule.wedGoal || 0) + 
                     (schedule.thuGoal || 0) + (schedule.friGoal || 0) + (schedule.satGoal || 0) + (schedule.sunGoal || 0);
  
  const weeklyXP = activity?.xpAwarded || 0;
  const timeMinutes = activity?.time || 0;
  const questions = activity?.questions || 0;
  const questionsCorrect = activity?.questionsCorrect || 0;
  const tasks = activity?.numTasks || 0;
  const courseProgress = (currentCourse.progress || 0) * 100;
  
  // --- TIER 1 ---
  const velocityScore = weeklyGoal > 0 
    ? Math.min(Math.round((weeklyXP / weeklyGoal) * 100), 100)
    : (weeklyXP > 0 ? 100 : 0);
  
  const accuracyRate = questions > 0 
    ? Math.round((questionsCorrect / questions) * 100)
    : 0;
  
  let consistencyIndex = 0;
  if (weeklyXP === 0) consistencyIndex = 0;
  else if (velocityScore >= 80) consistencyIndex = 0.9;
  else if (velocityScore >= 50) consistencyIndex = 0.6;
  else consistencyIndex = 0.3;
  
  let stuckScore = 0;
  if (timeMinutes > 180 && weeklyXP === 0) stuckScore = 80;
  else if (timeMinutes > 60 && weeklyXP < 20) stuckScore = 60;
  else if (tasks > 8 && accuracyRate < 60) stuckScore = 50;
  
  // --- TIER 2 ---
  // XP por Minuto (Productividad)
  const efficiencyRatio = timeMinutes > 0 
    ? parseFloat((weeklyXP / timeMinutes).toFixed(1)) 
    : 0; 

  let coldStartDays = 0;
  if (weeklyXP === 0) coldStartDays = 7;
  else if (weeklyXP < 50) coldStartDays = 3;

  const momentumScore = 1.0; 

  // --- TIER 3 (NUEVO) ---

  // 1. TIME PER QUESTION (Minutos)
  // Diagnóstico: Muy alto = Gap conceptual. Muy bajo = Adivinando?
  const timePerQuestion = questions > 0 
    ? parseFloat((timeMinutes / questions).toFixed(1)) 
    : 0;

  // 2. CONTENT GAP DETECTOR
  // Fórmula sugerida: (Tiempo * 2) / Progreso% (ajustada para escala)
  // Si invierte mucho tiempo y el % sube poco, el GAP es alto.
  const contentGap = courseProgress > 0.1 
    ? parseFloat(((timeMinutes * 0.1) / courseProgress).toFixed(1)) 
    : (timeMinutes > 60 ? 10 : 0); // Si lleva 1h y progreso 0, gap máximo

  // 3. BALANCE SCORE (Calidad de Vida)
  // Fórmula: (XP Real / Meta) - 1.
  // 0 = Equilibrio. > 0.5 = Sobrecarga. < -0.5 = Subutilización.
  const balanceScore = weeklyGoal > 0 
    ? parseFloat(((weeklyXP / weeklyGoal) - 1).toFixed(1))
    : 0;

  // 4. BURNOUT RISK (Predictivo)
  // Criterio: Más de 10 horas (600 min) Y Precisión bajando (< 60%)
  const burnoutRisk = timeMinutes > 600 && accuracyRate < 60;

  // 5. SESSION QUALITY
  // Calidad vs Rapidez
  const sessionQuality = parseFloat(((accuracyRate / 100) * timePerQuestion).toFixed(1));

  // --- DROPOUT PROBABILITY (INTEGRADO) ---
  let dropoutRisk = 0;
  if (velocityScore < 30) dropoutRisk += 30;
  if (consistencyIndex < 0.3) dropoutRisk += 20;
  if (accuracyRate < 55 && weeklyXP > 0) dropoutRisk += 20;
  if (stuckScore > 60) dropoutRisk += 15;
  if (coldStartDays >= 7) dropoutRisk += 15;
  if (burnoutRisk) dropoutRisk += 10; // Extra riesgo si hay burnout
  
  return {
    velocityScore: Math.round(velocityScore),
    consistencyIndex: Math.round(consistencyIndex * 100) / 100,
    stuckScore: Math.round(stuckScore),
    dropoutProbability: Math.min(dropoutRisk, 100),
    accuracyRate: Math.round(accuracyRate),
    efficiencyRatio,
    coldStartDays,
    momentumScore,
    // New Tier 3
    timePerQuestion,
    contentGap,
    balanceScore,
    burnoutRisk,
    sessionQuality
  };
}
