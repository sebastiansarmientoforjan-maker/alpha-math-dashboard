export interface Tier1Metrics {
  velocityScore: number;
  consistencyIndex: number;
  stuckScore: number;
  dropoutProbability: number;
  accuracyRate: number;
}

export function calculateTier1Metrics(student: any, activity: any): Tier1Metrics {
  const accuracy = activity?.questions > 0 
    ? (activity.questionsCorrect / activity.questions) * 100 
    : 0;

  const weeklyXP = activity?.xpAwarded || 0;
  const velocity = Math.min((weeklyXP / 200) * 100, 100);

  const tasks = activity?.numTasks || 0;
  let stuck = 0;
  if (tasks > 8 && accuracy < 65) {
    stuck = Math.min((tasks / 15) * 100, 100);
  }

  const consistency = weeklyXP > 0 ? (weeklyXP > 150 ? 1 : 0.6) : 0;

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
