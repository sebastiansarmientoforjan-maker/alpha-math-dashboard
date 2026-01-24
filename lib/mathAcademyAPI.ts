const API_KEY = process.env.NEXT_PUBLIC_MATH_ACADEMY_API_KEY;
const BASE_URL = 'https://mathacademy.com/api/beta6'; 

export async function getStudentData(studentId: string) {
  if (!API_KEY) return null;

  try {
    const profileRes = await fetch(`${BASE_URL}/students/${studentId}`, {
      headers: { 'Public-API-Key': API_KEY }
    });
    if (!profileRes.ok) return null;
    const { student } = await profileRes.json();

    const activityRes = await fetch(`${BASE_URL}/students/${studentId}/activity`, {
      headers: { 'Public-API-Key': API_KEY }
    });

    let activityMetrics = { xpAwarded: 0, time: 0, questions: 0, questionsCorrect: 0, numTasks: 0, tasks: [] as any[], totals: {} };

    if (activityRes.ok) {
      const { activity } = await activityRes.json();
      if (activity) {
        const t = activity.totals || {};
        
        // SOLUCIÓN: Mapeo robusto (Snake Case -> Camel Case) para capturar el tiempo real
        activityMetrics = {
          xpAwarded: t.xp_awarded ?? t.xpAwarded ?? 0,
          time: t.time_engaged ?? t.timeEngaged ?? 0, // Captura correcta de segundos
          questions: t.questions || 0,
          questionsCorrect: t.questions_correct ?? t.questionsCorrect ?? 0,
          numTasks: t.num_tasks ?? t.numTasks ?? 0,
          
          // Mapeo de tareas individuales
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
