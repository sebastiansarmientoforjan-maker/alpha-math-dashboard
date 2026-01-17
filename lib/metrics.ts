export function calculateTier1Metrics(student: any, activity: any) {
  const accuracy = activity?.questions > 0 ? (activity.questionsCorrect / activity.questions) * 100 : 0;
  const weeklyXP = activity?.xpAwarded || 0;
  const velocity = Math.min((weeklyXP / 200) * 100, 100);
  const tasks = activity?.numTasks || 0;
  const stuck = (tasks > 8 && accuracy < 65) ? Math.min((tasks / 15) * 100, 100) : 0;
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
