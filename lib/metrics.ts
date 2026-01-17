export interface Tier1Metrics {
  velocityScore: number;      // Cumplimiento de meta (Meta: 200 XP/semana)
  consistencyIndex: number;   // Estabilidad (1=Alta, 0.6=Media, 0=Nula)
  stuckScore: number;         // Nivel de bloqueo (Tareas intentadas vs fallos)
  dropoutProbability: number; // Probabilidad de abandono (Alerta temprana)
  accuracyRate: number;       // Precisión de comprensión
}

export function calculateTier1Metrics(student: any, activity: any): Tier1Metrics {
  // 1. Accuracy (Precisión de respuestas)
  const accuracy = activity?.questions > 0 
    ? (activity.questionsCorrect / activity.questions) * 100 
    : 0;

  // 2. Velocity (XP Semanal vs 200 XP objetivo)
  const weeklyXP = activity?.xpAwarded || 0;
  const velocity = Math.min((weeklyXP / 200) * 100, 100);

  // 3. Stuck Score (Bloqueo: Muchas tareas con baja precisión)
  const tasks = activity?.numTasks || 0;
  const stuck = (tasks > 8 && accuracy < 65) 
    ? Math.min((tasks / 15) * 100, 100) 
    : 0;

  // 4. Consistency Index (Simple: Actividad vs Inactividad)
  const consistency = weeklyXP > 0 ? (weeklyXP > 150 ? 1 : 0.6) : 0;

  // 5. Dropout Probability (Algoritmo de riesgo acumulado)
  let risk = 0;
  if (velocity < 30) risk += 40;       // No avanza
  if (consistency < 0.5) risk += 40;   // No se conecta
  if (accuracy < 55) risk += 20;       // Se frustra
  
  return {
    accuracyRate: Math.round(accuracy),
    velocityScore: Math.round(velocity),
    stuckScore: Math.round(stuck),
    consistencyIndex: consistency,
    dropoutProbability: Math.min(risk, 100)
  };
}
