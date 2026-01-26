/**
 * Math Academy API Wrapper
 * 
 * NOTAS DE DEBUGGING (2026-01-24):
 * - getWeekRange() DEBE ejecutarse en runtime, NO en build time
 * - Todos los fetch DEBEN tener cache: 'no-store'
 * - Agregado logging para diagnóstico
 */

const API_KEY = process.env.NEXT_PUBLIC_MATH_ACADEMY_API_KEY;
const BASE_URL = 'https://mathacademy.com/api/beta6';

/**
 * Calcula el rango de fechas para la API.
 * IMPORTANTE: Esta función se ejecuta en cada request, NO en build time.
 * 
 * @returns {{ startDate: string, endDate: string }} Rango de 30 días
 */
function getWeekRange(): { startDate: string; endDate: string } {
  // Usar Date.now() explícitamente para evitar optimizaciones de compilador
  const now = new Date(Date.now());
  
  // End date: mañana (para incluir hoy completo)
  const endDateObj = new Date(now.getTime());
  endDateObj.setDate(endDateObj.getDate() + 1);
  const endDate = endDateObj.toISOString().split('T')[0];

  // Start date: 30 días atrás
  const startDateObj = new Date(now.getTime());
  startDateObj.setDate(startDateObj.getDate() - 30);
  const startDate = startDateObj.toISOString().split('T')[0];

  // LOG para debugging - remover en producción estable
  console.log(`[mathAcademyAPI] getWeekRange() executed at runtime:`, {
    calculatedAt: now.toISOString(),
    startDate,
    endDate,
    daysDiff: Math.round((endDateObj.getTime() - startDateObj.getTime()) / (1000 * 60 * 60 * 24))
  });

  return { startDate, endDate };
}

export async function getStudentData(studentId: string) {
  if (!API_KEY) {
    console.error('[mathAcademyAPI] Missing API_KEY');
    return null;
  }

  try {
    // ============================================
    // 1. FETCH PROFILE
    // ============================================
    const profileRes = await fetch(`${BASE_URL}/students/${studentId}`, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Public-API-Key': API_KEY
      },
      cache: 'no-store',
      next: { revalidate: 0 }
    });
    
    if (!profileRes.ok) {
      console.error(`[mathAcademyAPI] Profile fetch failed for ${studentId}:`, profileRes.status);
      return null;
    }
    
    const profileData = await profileRes.json();
    if (!profileData?.result || !profileData?.student) {
      console.error(`[mathAcademyAPI] Invalid profile data for ${studentId}`);
      return null;
    }
    
    const student = profileData.student;
    
    // ============================================
    // 2. CALCULAR FECHAS EN RUNTIME
    // ============================================
    const { startDate, endDate } = getWeekRange();

    // ============================================
    // 3. FETCH ACTIVITY CON HEADERS DINÁMICOS
    // ============================================
    const activityRes = await fetch(`${BASE_URL}/students/${studentId}/activity`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Public-API-Key': API_KEY,
        'Start-Date': startDate,
        'End-Date': endDate
      },
      cache: 'no-store',
      next: { revalidate: 0 }
    });

    console.log(`[mathAcademyAPI] Activity request for ${studentId}:`, {
      url: `${BASE_URL}/students/${studentId}/activity`,
      headers: { 'Start-Date': startDate, 'End-Date': endDate },
      status: activityRes.status
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
      const activityData = await activityRes.json();
      const activity = activityData?.activity || activityData;
      
      if (activity) {
        const totals = activity.totals || {};
        const tasks = activity.tasks || [];
        
        let timeEngaged = totals.timeEngaged ?? 0;
        
        if (timeEngaged === 0 && tasks.length > 0) {
          timeEngaged = tasks.reduce((acc: number, task: any) => {
            return acc + (task.timeSpent ?? 0);
          }, 0);
        }

        activityMetrics = {
          xpAwarded: totals.xpAwarded ?? 0,
          time: timeEngaged,
          questions: totals.questions ?? 0,
          questionsCorrect: totals.questionsCorrect ?? 0,
          numTasks: totals.numTasks ?? tasks.length,
          
          tasks: tasks.map((task: any) => ({
            id: task.id,
            type: task.type,
            topic: task.topic,
            questions: task.questions ?? 0,
            questionsCorrect: task.questionsCorrect ?? 0,
            completedLocal: task.completedLocal,
            timeTotal: task.timeSpent ?? 0,
            smartScore: task.smartScore ?? 0,
            xpAwarded: task.xpAwarded ?? 0
          })),
          
          totals: {
            timeEngaged: timeEngaged,
            timeProductive: totals.timeProductive ?? 0,
            timeElapsed: totals.timeElapsed ?? 0,
            xpAwarded: totals.xpAwarded ?? 0,
            questions: totals.questions ?? 0,
            questionsCorrect: totals.questionsCorrect ?? 0,
            numTasks: totals.numTasks ?? tasks.length
          }
        };

        console.log(`[mathAcademyAPI] Activity data for ${studentId}:`, {
          tasksCount: tasks.length,
          timeEngaged,
          xpAwarded: totals.xpAwarded ?? 0,
          dateRange: { startDate, endDate }
        });
      }
    } else {
      console.error(`[mathAcademyAPI] Activity fetch failed for ${studentId}:`, activityRes.status);
    }

    return { ...student, activity: activityMetrics };
    
  } catch (error) {
    console.error(`[mathAcademyAPI] Error fetching student ${studentId}:`, error);
    return null;
  }
}

export function debugGetWeekRange() {
  return getWeekRange();
}
