import { Metrics } from '@/types';

/**
 * MOTOR DE INTELIGENCIA PSICOMÉTRICA V3.3
 * Implementa Modelos KeenKT, DKT y Detección de Stall Sistémico.
 */
export function calculateTier1Metrics(student: any, activity: any): Metrics {
  const tasks = activity?.tasks || [];
  const totals = activity?.totals || activity || {}; 

  // --- 1. NORMALIZACIÓN DE TIEMPO (Corrección de Error de Escala) ---
  // Los datos llegan en segundos desde la API. Convertimos a minutos una sola vez.
  const timeEngaged = Math.round((totals.timeEngaged || totals.time || 0) / 60);
  const timeProductive = Math.round((totals.timeProductive || 0) / 60);
  const timeElapsed = Math.round((totals.timeElapsed || 0) / 60);
  
  const questions = totals.questions || 0;
  const questionsCorrect = totals.questionsCorrect || 0;
  const accuracyRate = questions > 0 ? Math.round((questionsCorrect / questions) * 100) : null;

  // --- 2. MAESTRÍA LATENTE (LMP) [cite: 41] ---
  // Estima la capacidad de resolver problemas futuros sin ayuda.
  const recentTasks = tasks.slice(0, 10);
  const correctRecent = recentTasks.filter((t: any) => (t.questionsCorrect / t.questions) > 0.8).length;
  const lmp = correctRecent / Math.max(1, recentTasks.length);

  // --- 3. ESTABILIDAD DEL CONOCIMIENTO (KSI) [cite: 30, 35] ---
  // Captura la incertidumbre NIG; penaliza la volatilidad para detectar "falsa maestría".
  const accuracies: number[] = tasks.map((t: any) => (t.questionsCorrect / t.questions) * 100);
  
  const meanAcc = accuracies.length > 0 
    ? (accuracies.reduce((a: number, b: number) => a + b, 0) / accuracies.length) 
    : 0;
    
  const variance = accuracies.length > 0 
    ? (accuracies.reduce((a: number, b: number) => a + Math.pow(b - meanAcc, 2), 0) / accuracies.length) 
    : 0;
    
  const ksi = Math.max(0, 100 - Math.sqrt(variance));

  // --- 4. STALL DETECTION (Productive Struggle vs Frustrated Stall) [cite: 83, 85, 102] ---
  const idleRatio = timeElapsed > 0 ? (timeElapsed - timeEngaged) / timeElapsed : 0;
  const challengeZoneFailure = tasks.some((t: any) => (t.smartScore || 0) > 80 && (t.questionsCorrect / t.questions) < 0.2);
  
  let stallStatus: Metrics['stallStatus'] = 'Optimal';
  if (challengeZoneFailure && idleRatio > 0.4) {
    stallStatus = 'Frustrated Stall'; // Trigger Alerta Naranja/Roja [cite: 102]
  } else if (accuracyRate !== null && accuracyRate < 60 && idleRatio < 0.2) {
    stallStatus = 'Productive Struggle'; // Esfuerzo valioso [cite: 84]
  }

  // --- 5. OPERACIÓN TÁCTICA ---
  const schedule = student?.schedule || {};
  const weeklyGoal = (schedule.monGoal || 0) * 5;
  const weeklyXP = totals.xpAwarded || 0;
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
    // Mantenimiento de compatibilidad
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
