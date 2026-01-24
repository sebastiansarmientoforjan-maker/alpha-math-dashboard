const API_KEY = process.env.NEXT_PUBLIC_MATH_ACADEMY_API_KEY;
// NOTA: La documentación es Beta 5.1, pero la URL usa beta6. 
// Mantenemos soporte para ambos esquemas de nombres.
const BASE_URL = 'https://mathacademy.com/api/beta6'; 

export async function getStudentData(studentId: string) {
  if (!API_KEY) return null;

  try {
    const profileRes = await fetch(`${BASE_URL}/students/${studentId}`, {
      headers: { 'Public-API-Key': API_KEY },
      cache: 'no-store'
    });
    if (!profileRes.ok) return null;
    const { student } = await profileRes.json();

    const activityRes = await fetch(`${BASE_URL}/students/${studentId}/activity`, {
      headers: { 'Public-API-Key': API_KEY },
      cache: 'no-store'
    });

    let activityMetrics = { 
        xpAwarded: 0, 
        time: 0, 
        questions: 0, 
        questionsCorrect: 0, 
        numTasks: 0, 
        tasks: [] as any[], 
        totals: {} 
    };

    if (activityRes.ok) {
      const { activity } = await activityRes.json();
      if (activity) {
        const t = activity.totals || {};
        
        // 1. INTENTO MAESTRO: Leer 'time' (según Doc Beta 5.1)
        // También buscamos variantes snake_case por si Beta 6 cambió algo.
        let calculatedTime = t.time ?? t.time_engaged ?? activity.time ?? 0;

        // 2. PLAN C: Sumar 'timeSpent' de las tareas (según Doc Beta 5.1)
        // Si el total viene vacío o es 0, lo reconstruimos sumando tarea por tarea.
        if (calculatedTime === 0 && activity.tasks && activity.tasks.length > 0) {
           calculatedTime = activity.tasks.reduce((acc: number, task: any) => {
             // Doc dice: timeSpent. Código viejo buscaba: time_total.
             // Probamos todos:
             const taskTime = task.timeSpent ?? task.time_spent ?? task.timeTotal ?? task.time_total ?? 0;
             return acc + taskTime;
           }, 0);
        }

        activityMetrics = {
          xpAwarded: t.xpAwarded ?? t.xp_awarded ?? 0,
          time: calculatedTime, // ✅ Valor corregido
          questions: t.questions || 0,
          questionsCorrect: t.questionsCorrect ?? t.questions_correct ?? 0,
          numTasks: t.numTasks ?? t.num_tasks ?? 0,
          
          tasks: (activity.tasks || []).map((task: any) => ({
             ...task,
             // Normalizamos nombres según la documentación
             questionsCorrect: task.questionsCorrect ?? task.questions_correct ?? 0,
             timeTotal: task.timeSpent ?? task.time_spent ?? 0, // Usamos timeSpent
             smartScore: task.smart_score ?? task.smartScore ?? 0
          })),
          
          totals: t
        };
      }
    }

    return { ...student, activity: activityMetrics };
  } catch (error) {
    console.error(`Error fetching student ${studentId}:`, error);
    return null;
  }
}
