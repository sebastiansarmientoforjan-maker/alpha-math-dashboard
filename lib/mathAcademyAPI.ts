const API_KEY = process.env.NEXT_PUBLIC_MATH_ACADEMY_API_KEY;
const BASE_URL = 'https://mathacademy.com/api/beta6'; 

/**
 * Calcula el rango de la "Semana Alpha" (Domingo a Hoy)
 */
function getWeekRange() {
  const now = new Date();
  const endDate = now.toISOString().split('T')[0];

  const startDateObj = new Date(now);
  const day = startDateObj.getDay();
  const diff = startDateObj.getDate() - day;
  startDateObj.setDate(diff);
  
  const startDate = startDateObj.toISOString().split('T')[0];

  return { startDate, endDate };
}

export async function getStudentData(studentId: string) {
  if (!API_KEY) return null;

  try {
    // ==========================================
    // 1. OBTENER PERFIL DEL ESTUDIANTE
    // ==========================================
    const profileRes = await fetch(`${BASE_URL}/students/${studentId}`, {
      headers: { 'Public-API-Key': API_KEY },
      cache: 'no-store'
    });
    
    if (!profileRes.ok) return null;
    const { student } = await profileRes.json();

    // ==========================================
    // 2. CONFIGURAR RANGO DE FECHAS
    // ==========================================
    const { startDate, endDate } = getWeekRange();

    // ==========================================
    // 3. OBTENER ACTIVIDAD CON QUERY PARAMS (NO HEADERS)
    // ==========================================
    const activityRes = await fetch(
      `${BASE_URL}/students/${studentId}/activity?startDate=${startDate}&endDate=${endDate}`,
      {
        headers: { 
          'Public-API-Key': API_KEY
        },
        cache: 'no-store'
      }
    );

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
        const totals = activity.totals || {};
        
        // ==========================================
        // EXTRACCIÓN CORRECTA DE TIEMPO (SEGÚN DOC)
        // ==========================================
        let timeEngaged = totals.timeEngaged ?? 0;
        
        // Fallback: Sumar timeSpent de tasks si totals.timeEngaged = 0
        if (timeEngaged === 0 && activity.tasks?.length > 0) {
          timeEngaged = activity.tasks.reduce((acc: number, task: any) => {
            return acc + (task.timeSpent ?? 0);
          }, 0);
        }

        activityMetrics = {
          xpAwarded: totals.xpAwarded ?? 0,
          time: timeEngaged, // ✅ Segundos totales de la semana
          questions: totals.questions ?? 0,
          questionsCorrect: totals.questionsCorrect ?? 0,
          numTasks: totals.numTasks ?? 0,
          
          tasks: (activity.tasks || []).map((task: any) => ({
            ...task,
            questionsCorrect: task.questionsCorrect ?? 0,
            timeTotal: task.timeSpent ?? 0, // ✅ Usar timeSpent
            smartScore: task.smartScore ?? 0
          })),
          
          totals: {
            timeEngaged: timeEngaged,
            timeProductive: totals.timeProductive ?? 0,
            timeElapsed: totals.timeElapsed ?? 0,
            ...totals
          }
        };
      }
    }

    return { ...student, activity: activityMetrics };
  } catch (error) {
    console.error(`Error fetching student ${studentId}:`, error);
    return null;
  }
}
