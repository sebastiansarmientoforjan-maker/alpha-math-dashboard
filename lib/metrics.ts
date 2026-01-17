export interface Tier1Metrics {
  velocityScore: number;      // Indica si cumple metas de XP
  consistencyIndex: number;   // Detecta abandono o intermitencia
  stuckScore: number;         // Identifica estudiantes atascados
  dropoutProbability: number; // Sistema de alerta temprana
  accuracyRate: number;       // Comprensión básica del contenido
}

export function calculateTier1Metrics(student: any, activity: any): Tier1Metrics {
  // 1. ACCURACY RATE: Precisión básica (%)
  const accuracy = activity?.questions > 0 
    ? (activity.questionsCorrect / activity.questions) * 100 
    : 0;

  // 2. VELOCITY SCORE: Cumplimiento de meta semanal
  // Basado en una meta estándar de 200 XP semanales
  const weeklyXP = activity?.xpAwarded || 0;
  const velocity = Math.min((weeklyXP / 200) * 100, 100);

  // 3. STUCK SCORE: Basado en volumen de tareas sin acierto
  // Si tiene muchas tareas (>10) pero baja precisión, el puntaje de "atascado" sube
  const tasks = activity?.numTasks || 0;
  let stuck = 0;
  if (tasks > 10 && accuracy < 65) {
    stuck = Math.min((tasks / 20) * 100, 100);
  }

  // 4. CONSISTENCY INDEX: Estabilidad en el tiempo
  // Evaluamos si el XP es constante. 1 = Muy consistente, 0 = Inactivo
  const consistency = weeklyXP > 0 ? (weeklyXP > 150 ? 1 : 0.6) : 0;

  // 5. DROPOUT PROBABILITY: Probabilidad de abandono
  // Calculado mediante la combinación de Velocity, Consistency y Accuracy
  let riskPoints = 0;
  if (velocity < 30) riskPoints += 40;   // No está avanzando
  if (consistency < 0.5) riskPoints += 40; // No se conecta
  if (accuracy < 50) riskPoints += 20;    // Frustración por fallos
  
  const dropout = Math.min(riskPoints, 100);

  return {
    accuracyRate: Math.round(accuracy),
    velocityScore: Math.round(velocity),
    stuckScore: Math.round(stuck),
    consistencyIndex: consistency,
    dropoutProbability: dropout
  };
}
