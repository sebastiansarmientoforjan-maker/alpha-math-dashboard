import { Metrics } from '@/types';
import { DRI_CONFIG } from './dri-config';

export function calculateTier1Metrics(student: any, activity: any): Metrics {
  const tasks = activity?.tasks || [];
  const totals = activity?.totals || {};

  // ==========================================
  // NORMALIZACIÓN TEMPORAL CORRECTA
  // ==========================================
  // ✅ CORRECCIÓN: Leer directamente de totals.timeEngaged
  const rawTimeSeconds = totals.timeEngaged ?? 0;
  
  const timeEngaged = Math.round(rawTimeSeconds / 60); // Convertir a minutos
  const timeProductive = Math.round((totals.timeProductive || 0) / 60);
  const timeElapsed = Math.round((totals.timeElapsed || 0) / 60);
  
  const questions = totals.questions || 0;
  const accuracyRate = questions > 0 
    ? Math.round(((totals.questionsCorrect || 0) / questions) * 100) 
    : null;

  // ==========================================
  // VELOCITY SCORE (ESTÁNDAR ALPHA: 125 XP/SEMANA)
  // ==========================================
  const xpAwarded = totals.xpAwarded || 0;
  
  const velocityScore = Math.min(
    Math.round((xpAwarded / DRI_CONFIG.ALPHA_WEEKLY_STANDARD) * 100),
    DRI_CONFIG.VELOCITY_CAP
  );

  // ==========================================
  // RSR (RECENT SUCCESS RATE)
  // ==========================================
  const recentTasks = tasks.slice(0, DRI_CONFIG.RSR_RECENT_TASKS_COUNT);
  const recentSuccessRate = recentTasks.length > 0
    ? recentTasks.filter((t: any) => 
        (t.questionsCorrect / (t.questions || 1)) > DRI_CONFIG.RSR_SUCCESS_THRESHOLD
      ).length / recentTasks.length
    : 0;
  
  const lmp = parseFloat(recentSuccessRate.toFixed(2));

  // ==========================================
  // KSI (KNOWLEDGE STABILITY INDEX)
  // ==========================================
  let ksi: number | null = null;

  if (tasks.length > 0) {
    const accuracies: number[] = tasks.map((t: any) => 
      (t.questionsCorrect / (t.questions || 1)) * 100
    );
    
    const meanAcc = accuracies.reduce((a: number, b: number) => a + b, 0) / accuracies.length;
    
    if (meanAcc > 0) {
      const variance = accuracies.reduce((a: number, b: number) => 
        a + Math.pow(b - meanAcc, 2), 0
      ) / accuracies.length;
      
      let calculatedKsi = Math.max(0, parseFloat((100 - Math.sqrt(variance)).toFixed(2)));

      if (meanAcc < 30) {
        calculatedKsi = Math.round(calculatedKsi * (meanAcc / 100));
      }

      ksi = calculatedKsi;
    }
  }

  // ==========================================
  // STALL DETECTION
  // ==========================================
  const idleRatio = timeElapsed > 0 
    ? (timeElapsed - timeEngaged) / timeElapsed 
    : 0;
  
  const challengeZoneFailure = tasks.some((t: any) => 
    (t.smartScore || 0) > 80 && (t.questionsCorrect / (t.questions || 1)) < 0.2
  );
  
  let stallStatus: Metrics['stallStatus'] = 'Optimal';
  if (challengeZoneFailure && idleRatio > 0.4) {
    stallStatus = 'Frustrated Stall';
  } else if (accuracyRate !== null && accuracyRate < 60 && idleRatio < 0.2) {
    stallStatus = 'Productive Struggle';
  }

  // ==========================================
  // FOCUS INTEGRITY
  // ==========================================
  const focusIntegrity = timeEngaged > 0 
    ? Math.round((timeProductive / timeEngaged) * 100) 
    : 0;

  // ==========================================
  // NEMESIS TOPIC
  // ==========================================
  const nemesisTopic = tasks.find((t: any) => 
    t.questions > 2 && (t.questionsCorrect / (t.questions || 1)) < 0.6
  )?.topic?.name || "";

  // ==========================================
  // LEGACY COMPATIBILITY
  // ==========================================
  const consistencyIndex = velocityScore > 50 ? 0.9 : 0.3;
  const stuckScore = lmp < 0.3 ? 90 : 0;
  const dropoutProbability = velocityScore < 30 ? 60 : 10;
  
  const riskStatus = (velocityScore < 30 || stallStatus === 'Frustrated Stall') 
    ? 'Critical' 
    : 'On Track';
  
  const archetype = (timeEngaged > 0 && (timeProductive / timeEngaged) < 0.4) 
    ? 'Zombie' 
    : 'Neutral';

  return {
    velocityScore,
    accuracyRate,
    focusIntegrity,
    nemesisTopic,
    lmp,
    ksi,
    stallStatus,
    idleRatio: parseFloat(idleRatio.toFixed(2)),
    consistencyIndex,
    stuckScore,
    dropoutProbability,
    riskStatus,
    archetype
  };
}

export function calculateScientificMetrics(student: any, activity: any): Metrics {
  return calculateTier1Metrics(student, activity);
}
