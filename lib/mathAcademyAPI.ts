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
        activityMetrics = {
          xpAwarded: t.xpAwarded || 0,
          time: t.timeEngaged || 0, // Segundos crudos para lib/metrics
          questions: t.questions || 0,
          questionsCorrect: t.questionsCorrect || 0,
          numTasks: t.numTasks || 0,
          tasks: activity.tasks || [],
          totals: t // Pasamos el objeto completo para capturar timeElapsed
        };
      }
    }

    return { ...student, activity: activityMetrics };
  } catch (error) {
    console.error(`Error fetching student ${studentId}:`, error);
    return null;
  }
}
