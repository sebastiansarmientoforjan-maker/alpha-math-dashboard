export interface Tier1Metrics {
  velocityScore: number;
  consistencyIndex: number;
  stuckScore: number;
  dropoutProbability: number;
  accuracyRate: number;
}

export function calculateTier1Metrics(student: any, activity: any): Tier1Metrics {
  const schedule = student?.schedule || {};
  const currentCourse = student?.currentCourse || {};
  
  // 1. Calcular Meta Semanal Real (Sumando objetivos diarios)
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
  const courseProgress = Math.round((currentCourse.progress || 0) * 100);
  
  // 2. VELOCITY SCORE (Basado en meta personal)
  // Si no tiene meta (0), asumimos 100% si hizo algo, o 0 si no.
  const velocityScore = weeklyGoal > 0 
    ? Math.min(Math.round((weeklyXP / weeklyGoal) * 100), 100)
    : (weeklyXP > 0 ? 100 : 0);
  
  // 3. ACCURACY RATE
  const accuracyRate = questions > 0 
    ? Math.round((questionsCorrect / questions) * 100)
    : 0;
  
  // 4. CONSISTENCY INDEX
  let consistencyIndex = 0;
  if (weeklyXP === 0) consistencyIndex = 0;
  else if (velocityScore >= 80) consistencyIndex = 0.9;
  else if (velocityScore >= 50) consistencyIndex = 0.6;
  else consistencyIndex = 0.3;
  
  // 5. STUCK SCORE
  let stuckScore = 0;
  if (timeWeekMin > 200 && courseProgress < 30) stuckScore = 80;
  else if (timeWeekMin > 100 && weeklyXP < 100) stuckScore = 60;
  else if (tasks > 8 && accuracyRate < 65) stuckScore = 40;
  
  // 6. DROPOUT PROBABILITY (Algoritmo Multi-factor)
  let dropoutRisk = 0;
  if (velocityScore < 30) dropoutRisk += 40;
  else if (velocityScore < 50) dropoutRisk += 20;
  
  if (consistencyIndex < 0.3) dropoutRisk += 40;
  else if (consistencyIndex < 0.6) dropoutRisk += 20;
  
  if (accuracyRate < 55 && weeklyXP > 0) dropoutRisk += 20;
  if (stuckScore > 60) dropoutRisk += 10;
  
  return {
    velocityScore: Math.round(velocityScore),
    consistencyIndex: Math.round(consistencyIndex * 100) / 100,
    stuckScore: Math.round(stuckScore),
    dropoutProbability: Math.min(dropoutRisk, 100),
    accuracyRate: Math.round(accuracyRate),
  };
}
