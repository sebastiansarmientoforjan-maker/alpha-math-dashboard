export interface Tier1Metrics {
  velocityScore: number;      // % cumplimiento de meta semanal
  consistencyIndex: number;   // Estabilidad (1 = alta, 0 = nula)
  stuckScore: number;         // Nivel de bloqueo
  dropoutProbability: number; // Probabilidad de abandono
  accuracyRate: number;       // Precisión total
}

export function calculateTier1Metrics(student: any, activity: any): Tier1Metrics {
  // 1. Accuracy Rate
  const accuracy = activity?.questions > 0 
    ? (activity.questionsCorrect / activity.questions) * 100 
    : 0;

  // 2. Velocity Score (Meta: 200 XP/semana)
  const weeklyXP = activity?.xpAwarded || 0;
  const velocity = Math.min((weeklyXP / 200) * 100, 100);

  // 3. Stuck Score
  const tasks = activity?.numTasks || 0;
  let stuck = 0;
  if (tasks > 8 && accuracy < 65) {
    stuck = Math.min((tasks / 15) * 100, 100);
  }

  // 4. Consistency Index
  const consistency = weeklyXP > 0 ? (weeklyXP > 150 ? 1 : 0.6) : 0;

  // 5. Dropout Probability
  let risk = 0;
  if (velocity < 30) risk += 40;
  if (consistency < 0.5) risk += 40;
  if (accuracy < 55) risk += 20;

  return {
    accuracyRate: Math.round(accuracy),
    velocityScore: Math.round(velocity),
    stuckScore: Math.round(stuck),
    consistencyIndex: consistency,
    dropoutProbability: Math.min(risk, 100)
  };
}
