const API_KEY = process.env.NEXT_PUBLIC_MATH_ACADEMY_API_KEY;
const BASE_URL = 'https://mathacademy.com/api/beta6';

/**
 * Calcula el rango de la "Semana Alpha" (Domingo a Hoy)
 * Añade padding de ±1 día para evitar problemas de zona horaria
 */
function getWeekRange() {
  const now = new Date();
  const endDateObj = new Date(now);
  endDateObj.setDate(endDateObj.getDate() + 1); // Padding +1
  const endDate = endDateObj.toISOString().split('T')[0];

  const startDateObj = new Date(now);
  const day = startDateObj.getDay();
  startDateObj.setDate(startDateObj.getDate() - day - 1); // Domingo - 1 día
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
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Public-API-Key': API_KEY
      },
      cache: 'no-store'
    });
    
    if (!profileRes.ok) return null;
    
    const profileData = await profileRes.json();
    
    // Validar estructura de respuesta
    if (!profileData?.result || !profileData?.student) return null;
    
    const student = profileData.student;

    // ==========================================
    // 2. OBTENER ACTIVIDAD CON HEADERS (COMO PYTHON)
    // ==========================================
    const { startDate, endDate } = getWeekRange();

    const activityRes = await fetch(`${BASE_URL}/students/${studentId}/activity`, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Public-API-Key': API_KEY,
        'Start-Date': startDate,  // ✅ Headers como en Python
        'End-Date': endDate
      },
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
      const activityData = await activityRes.json();
      
      // ==========================================
      // ESTRUCTURA CORRECTA (SIN WRAPPER "activity")
      // ==========================================
      const activity = activityData?.activity || activityData;
      
      if (activity) {
        const totals = activity.totals || {};
        const tasks = activity.tasks || [];
        
        // ==========================================
        // EXTRACCIÓN DE TIEMPO
        // ==========================================
        // Estrategia 1: Leer de totals
        let timeEngaged = totals.timeEngaged ?? 0;
        
        // Estrategia 2 (fallback): Sumar timeSpent de tasks
        if (timeEngaged === 0 && tasks.length > 0) {
          timeEngaged = tasks.reduce((acc: number, task: any) => {
            return acc + (task.timeSpent ?? 0);
          }, 0);
        }

        activityMetrics = {
          xpAwarded: totals.xpAwarded ?? 0,
          time: timeEngaged, // ✅ Tiempo en segundos
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
      }
    }

    return { ...student, activity: activityMetrics };
    
  } catch (error) {
    console.error(`Error fetching student ${studentId}:`, error);
    return null;
  }
}
