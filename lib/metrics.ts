import { Metrics } from '@/types';

export function calculateScientificMetrics(student: any, activity: any): Metrics {
  const tasks = activity?.tasks || [];
  const totals = activity?.totals || {};
  
  // 1. LMP: Probabilidad de Maestría Latente [cite: 41]
  const recentTasks = tasks.slice(0, 10);
  const correctRecent = recentTasks.filter((t: any) => (t.questionsCorrect / t.questions) > 0.8).length;
  const lmp = correctRecent / Math.max(1, recentTasks.length);

  // 2. KSI: Índice de Estabilidad (Basado en NIG/Variancia) [cite: 35, 92]
  const accuracies = tasks.map((t: any) => (t.questionsCorrect / t.questions) * 100);
  const meanAcc = accuracies.reduce((a, b) => a + b, 0) / (accuracies.length || 1);
  const variance = accuracies.reduce((a, b) => a + Math.pow(b - meanAcc, 2), 0) / (accuracies.length || 1);
  const ksi = Math.max(0, 100 - Math.sqrt(variance)); // A mayor volatilidad, menor estabilidad

  // 3. Stall Detection: Lucha vs Frustración [cite: 83, 101]
  const idleRatio = (totals.timeElapsed - totals.timeEngaged) / (totals.timeElapsed || 1);
  const challengeZoneFailure = tasks.some((t: any) => t.smartScore > 80 && (t.questionsCorrect / t.questions) < 0.2);
  
  let stallStatus: Metrics['stallStatus'] = 'Optimal';
  if (challengeZoneFailure && idleRatio > 0.4) {
    stallStatus = 'Frustrated Stall'; // [cite: 102]
  } else if (accuracies.some(a => a < 60) && idleRatio < 0.2) {
    stallStatus = 'Productive Struggle'; // [cite: 84]
  }

  return {
    ...student.metrics,
    lmp: parseFloat(lmp.toFixed(2)),
    ksi: parseFloat(ksi.toFixed(2)),
    stallStatus,
    idleRatio: parseFloat(idleRatio.toFixed(2))
  };
}
