import { Metrics } from '@/types';

export function calculateTier1Metrics(student: any, activity: any): Metrics {
  const tasks = activity?.tasks || [];
  const totals = activity?.totals || activity || {}; 

  // --- Normalización y Base ---
  const schedule = student?.schedule || {};
  const weeklyGoal = (schedule.monGoal || 0) * 5;
  const weeklyXP = totals.xpAwarded || 0;
  
  const timeEngaged = Math.round((totals.timeEngaged || totals.time || 0) / 60);
  const timeProductive = Math.round((totals.timeProductive || 0) / 60);
  const timeElapsed = Math.round((totals.timeElapsed || 0) / 60);
  
  const questions = totals.questions || 0;
  const questionsCorrect = totals.questionsCorrect || 0;
  const accuracyRate = questions > 0 ? Math.round((questionsCorrect / questions) * 100) : null;

  // --- Inteligencia Psicométrica KeenKT ---
  const recentTasks = tasks.slice(0, 10);
  const correctRecent = recentTasks.filter((t: any) => (t.questionsCorrect / t.questions) > 0.8).length;
  const lmp = correctRecent / Math.max(1, recentTasks.length); // [cite: 41]

  const accuracies: number[] = tasks.map((t: any) => (t.questionsCorrect / t.questions) * 100);
  const meanAcc = accuracies.length > 0 ? (accuracies.reduce((a: number, b: number) => a + b, 0) / accuracies.length) : 0;
  const variance = accuracies.length > 0 ? (accuracies.reduce((a: number, b: number) => a + Math.pow(b - meanAcc, 2), 0) / accuracies.length) : 0;
  const ksi = Math.max(0, 100 - Math.sqrt(variance)); // [cite: 30]

  // --- Detección de Stall (Pseudocódigo DRI) ---
  const idleRatio = timeElapsed > 0 ? (timeElapsed - timeEngaged) / timeElapsed : 0; // [cite: 93]
  const challengeZoneFailure = tasks.some((t: any) => (t.smartScore || 0) > 80 && (t.questionsCorrect / t.questions) < 0.2);
  
  let stallStatus: Metrics['stallStatus'] = 'Optimal';
  if (challengeZoneFailure && idleRatio > 0.4) {
    stallStatus = 'Frustrated Stall'; // [cite: 102]
  } else if (accuracyRate !== null && accuracyRate < 60 && idleRatio < 0.2) {
    stallStatus = 'Productive Struggle'; // [cite: 84]
  }

  const velocityScore = weeklyGoal > 0 ? Math.min(Math.round((weeklyXP / weeklyGoal) * 100), 100) : 0;

  return {
    velocityScore,
    accuracyRate,
    focusIntegrity: timeEngaged > 0 ? Math.round((timeProductive / timeEngaged) * 100) : 0,
    lmp: parseFloat(lmp.toFixed(2)),
    ksi: parseFloat(ksi.toFixed(2)),
    stallStatus,
    idleRatio: parseFloat(idleRatio.toFixed(2)),
    nemesisTopic: tasks.find((t: any) => t.questions > 2 && (t.questionsCorrect / t.questions) < 0.6)?.topic?.name || "",
    consistencyIndex: velocityScore > 50 ? 0.9 : 0.3,
    stuckScore: lmp < 0.3 ? 90 : 0,
    dropoutProbability: velocityScore < 30 ? 60 : 10,
    riskStatus: (velocityScore < 30 || stallStatus === 'Frustrated Stall') ? 'Critical' : 'On Track',
    archetype: (timeEngaged > 0 && (timeProductive / timeEngaged) < 0.4) ? 'Zombie' : 'Neutral'
  };
}

export function calculateScientificMetrics(student: any, activity: any): Metrics {
  return calculateTier1Metrics(student, activity);
}
