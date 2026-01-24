const API_KEY = process.env.NEXT_PUBLIC_MATH_ACADEMY_API_KEY;
const BASE_URL = 'https://mathacademy.com/api/beta6'; 

export async function getStudentData(studentId: string) {
  if (!API_KEY) return null;

  try {
    const profileRes = await fetch(`${BASE_URL}/students/${studentId}`, {
      headers: { 'Public-API-Key': API_KEY },
      cache: 'no-store' // 🔥 Forzamos a no usar caché para traer datos frescos
    });
    
    if (!profileRes.ok) return null;
    const { student } = await profileRes.json();

    const activityRes = await fetch(`${BASE_URL}/students/${studentId}/activity`, {
      headers: { 'Public-API-Key': API_KEY },
      cache: 'no-store' // 🔥 Importante: datos en tiempo real
    });

    // Valores por defecto
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
        
        // 🕵️‍♂️ BUSQUEDA PROFUNDA DE TIEMPO
        // 1. Intentar en totals.time_engaged (snake_case)
        // 2. Intentar en totals.timeEngaged (camelCase)
        // 3. Intentar en raíz activity.time_engaged
        // 4. Intentar sumar el tiempo de todas las tareas individuales
        
        let calculatedTime = t.time_engaged ?? t.timeEngaged ?? activity.time_engaged ?? 0;
        
        // Si sigue siendo 0, sumamos manualmente las tareas (Plan C)
        if (calculatedTime === 0 && activity.tasks && activity.tasks.length > 0) {
           calculatedTime = activity.tasks.reduce((acc: number, task: any) => {
             return acc + (task.time_total || task.timeTotal || 0);
           }, 0);
        }

        activityMetrics = {
          xpAwarded: t.xp_awarded ?? t.xpAwarded ?? 0,
          time: calculatedTime, // ✅ Aquí va el valor rescatado
          questions: t.questions || 0,
          questionsCorrect: t.questions_correct ?? t.questionsCorrect ?? 0,
          numTasks: t.num_tasks ?? t.numTasks ?? 0,
          tasks: (activity.tasks || []).map((task: any) => ({
             ...task,
             questionsCorrect: task.questions_correct ?? task.questionsCorrect ?? 0,
             timeTotal: task.time_total ?? task.timeTotal ?? 0,
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
