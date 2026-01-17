export interface Metrics {
  // TIER 1, 2, 3
  velocityScore: number;
  consistencyIndex: number;
  stuckScore: number;
  dropoutProbability: number;
  accuracyRate: number;
  efficiencyRatio: number;
  coldStartDays: number;
  momentumScore: number;
  timePerQuestion: number;
  contentGap: number;
  balanceScore: number;
  burnoutRisk: boolean;
  sessionQuality: number;
  
  // TIER 4 (NUEVOS)
  focusIntegrity: number;
  nemesisTopic: string;
  reviewAccuracy: number;
  microStalls: number;
}

export function calculateTier1Metrics(student: any, activity: any): Metrics {
  const schedule = student?.schedule || {};
  const currentCourse = student?.currentCourse || {};
  
  // Extraemos Totals y Tasks (Ahora sí vienen de tu nueva API)
  const totals = activity?.totals || activity || {}; 
  const tasks = activity?.tasks || [];   

  // Datos base
  const weeklyGoal = (schedule.monGoal || 0) * 5; 
  const weeklyXP = totals.xpAwarded || 0;
  
  // Tiempos (En minutos)
  // Usamos timeEngaged si existe, sino time (fallback)
  const timeEngaged = Math.round((totals.timeEngaged || totals.time || 0) / 60);
  const timeProductive = Math.round((totals.timeProductive || 0) / 60);
  const timeElapsed = Math.round((totals.timeElapsed || 0) / 60);
  
  const questions = totals.questions || 0;
  const questionsCorrect = totals.questionsCorrect || 0;
  const accuracyRate = questions > 0 ? Math.round((questionsCorrect / questions) * 100) : 0;
  const numTasks = totals.numTasks || 0;

  // --- TIER 4: CÁLCULOS PSICOMÉTRICOS ---

  // 1. FOCUS INTEGRITY (Zombies)
  const focusIntegrity = timeEngaged > 0 
    ? Math.round((timeProductive / timeEngaged) * 100) 
    : 0;

  // 2. NEMESIS TOPIC (Bloqueos)
  let nemesisTopic = "";
  let lowestAcc = 100;
  
  // Recorremos las tareas reales
  if (tasks && tasks.length > 0) {
      tasks.forEach((t: any) => {
        // Solo tareas con suficientes preguntas para ser válidas
        if (t.questions > 2) {
          const taskAcc = (t.questionsCorrect / t.questions) * 100;
          // Si falló mucho (< 60%) es candidato a Nemesis
          if (taskAcc < 60 && taskAcc < lowestAcc) {
            lowestAcc = taskAcc;
            nemesisTopic = t.topic?.name || "Unknown Topic";
          }
        }
      });
  }

  // 3. REVIEW ACCURACY
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

  // 4. MICRO STALLS
  const totalWastedMin = timeElapsed - timeEngaged;
  const microStalls = numTasks > 0 
    ? Math.round(totalWastedMin / numTasks) 
    : 0;

  // --- RETORNO COMPLETO ---
  const velocityScore = weeklyGoal > 0 ? Math.min(Math.round((weeklyXP / weeklyGoal) * 100), 100) : 0;
  // Eficiencia usando timeEngaged (más preciso)
  const efficiencyRatio = timeEngaged > 0 ? parseFloat((weeklyXP / timeEngaged).toFixed(2)) : 0;
  const timePerQuestion = questions > 0 ? parseFloat((timeEngaged / questions).toFixed(1)) : 0;
  
  // Content Gap Ahora depende del Nemesis (10 = Crítico, 5 = Alerta, 0 = Bien)
  const contentGap = nemesisTopic !== "" ? 10 : (timePerQuestion > 5 ? 5 : 0);

  return {
    velocityScore,
    consistencyIndex: velocityScore > 50 ? 0.9 : 0.3,
    stuckScore: nemesisTopic !== "" ? 90 : 0,
    dropoutProbability: accuracyRate < 50 ? 80 : 20,
    accuracyRate,
    efficiencyRatio,
    coldStartDays: weeklyXP === 0 ? 7 : 0,
    momentumScore: 1.0,
    timePerQuestion,
    contentGap,
    balanceScore: 0,
    burnoutRisk: timeEngaged > 120 && focusIntegrity < 40,
    sessionQuality: 0,
    
    // TIER 4
    focusIntegrity,
    nemesisTopic,
    reviewAccuracy,
    microStalls
  };
}
