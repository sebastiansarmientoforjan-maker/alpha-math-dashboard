export interface Metrics {
  // TIER 1, 2, 3
  velocityScore: number;
  consistencyIndex: number;
  stuckScore: number;
  dropoutProbability: number;
  accuracyRate: number | null; // AHORA PUEDE SER NULL
  efficiencyRatio: number;
  coldStartDays: number;
  momentumScore: number;
  timePerQuestion: number;
  contentGap: number;
  balanceScore: number;
  burnoutRisk: boolean;
  sessionQuality: number;
  
  // TIER 4
  focusIntegrity: number;
  nemesisTopic: string;
  reviewAccuracy: number;
  microStalls: number;
  
  // NUEVO ESTADO DE RIESGO
  riskStatus: 'Critical' | 'Attention' | 'On Track' | 'Dormant'; 
}

export function calculateTier1Metrics(student: any, activity: any): Metrics {
  const schedule = student?.schedule || {};
  
  // Extraemos Totals y Tasks
  const totals = activity?.totals || activity || {}; 
  const tasks = activity?.tasks || [];   

  // Datos base
  const weeklyGoal = (schedule.monGoal || 0) * 5; 
  const weeklyXP = totals.xpAwarded || 0;
  
  // Tiempos (En minutos)
  const timeEngaged = Math.round((totals.timeEngaged || totals.time || 0) / 60);
  const timeProductive = Math.round((totals.timeProductive || 0) / 60);
  const timeElapsed = Math.round((totals.timeElapsed || 0) / 60);
  
  const questions = totals.questions || 0;
  const questionsCorrect = totals.questionsCorrect || 0;
  
  // --- CORRECCIÓN 1: ACCURACY NULL ---
  // Si no hay preguntas, es null (no 0%)
  const accuracyRate = questions > 0 
    ? Math.round((questionsCorrect / questions) * 100) 
    : null;
    
  const numTasks = totals.numTasks || 0;

  // --- TIER 4 CÁLCULOS ---
  const focusIntegrity = timeEngaged > 0 
    ? Math.round((timeProductive / timeEngaged) * 100) 
    : 0;

  let nemesisTopic = "";
  let lowestAcc = 100;
  
  if (tasks && tasks.length > 0) {
      tasks.forEach((t: any) => {
        if (t.questions > 2) {
          const taskAcc = (t.questionsCorrect / t.questions) * 100;
          if (taskAcc < 60 && taskAcc < lowestAcc) {
            lowestAcc = taskAcc;
            nemesisTopic = t.topic?.name || "Unknown Topic";
          }
        }
      });
  }

  const reviewTasks = tasks.filter((t: any) => t.type === 'Review');
  let reviewCorrect = 0;
  let reviewTotal = 0;
  reviewTasks.forEach((t: any) => {
    reviewCorrect += t.questionsCorrect || 0;
    reviewTotal += t.questions || 0;
  });
  const reviewAccuracy = reviewTotal > 0 
    ? Math.round((reviewCorrect / reviewTotal) * 100) 
    : -1;

  const totalWastedMin = timeElapsed - timeEngaged;
  const microStalls = numTasks > 0 ? Math.round(totalWastedMin / numTasks) : 0;

  // --- RETORNO Y CLASIFICACIÓN ---
  const velocityScore = weeklyGoal > 0 ? Math.min(Math.round((weeklyXP / weeklyGoal) * 100), 100) : 0;
  const efficiencyRatio = timeEngaged > 0 ? parseFloat((weeklyXP / timeEngaged).toFixed(2)) : 0;
  const timePerQuestion = questions > 0 ? parseFloat((timeEngaged / questions).toFixed(1)) : 0;
  
  const contentGap = nemesisTopic !== "" ? 10 : (timePerQuestion > 5 ? 5 : 0);

  // --- CORRECCIÓN 2: LÓGICA DE RIESGO (DORMANT) ---
  let riskStatus: Metrics['riskStatus'] = 'On Track';
  let dropoutRisk = 0;

  // 1. Si está INACTIVO (0 XP o 0 Tiempo) -> DORMANT (Gris)
  if (weeklyXP === 0 || timeEngaged === 0) {
      riskStatus = 'Dormant';
      dropoutRisk = 0; // No lo marcamos como riesgo de deserción académica, sino inactividad
  } 
  // 2. Si está ACTIVO, aplicamos lógica académica
  else {
      // Cálculo de riesgo normal
      if (velocityScore < 30) dropoutRisk += 30;
      if (velocityScore > 50) dropoutRisk = 0; // Reset si va bien
      if ((accuracyRate || 100) < 55) dropoutRisk += 20;
      if (nemesisTopic !== "") dropoutRisk += 20;

      // Clasificación
      if (velocityScore < 30 || contentGap > 5 || dropoutRisk > 50) {
          riskStatus = 'Critical';
      } else if (velocityScore < 60) {
          riskStatus = 'Attention';
      }
  }

  return {
    velocityScore,
    consistencyIndex: velocityScore > 50 ? 0.9 : 0.3,
    stuckScore: nemesisTopic !== "" ? 90 : 0,
    dropoutProbability: Math.min(dropoutRisk, 100),
    accuracyRate, // Ahora puede ser null
    efficiencyRatio,
    coldStartDays: weeklyXP === 0 ? 7 : 0,
    momentumScore: 1.0,
    timePerQuestion,
    contentGap,
    balanceScore: 0,
    burnoutRisk: timeEngaged > 120 && focusIntegrity < 40,
    sessionQuality: 0,
    focusIntegrity,
    nemesisTopic,
    reviewAccuracy,
    microStalls,
    riskStatus // Nueva propiedad
  };
}
