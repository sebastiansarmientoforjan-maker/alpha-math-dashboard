const API_KEY = process.env.NEXT_PUBLIC_MATH_ACADEMY_API_KEY;
// Usamos la URL beta6, pero la estructura de datos respeta la doc beta 5.1
const BASE_URL = 'https://mathacademy.com/api/beta6'; 

/**
 * Calcula el rango de la "Semana Alpha" (Domingo a Hoy)
 * Esto asegura que las métricas de Velocity y Tiempo sean acumulativas de la semana.
 */
function getWeekRange() {
  const now = new Date();
  const endDate = now.toISOString().split('T')[0]; // Fecha de hoy (YYYY-MM-DD)

  // Retroceder al último domingo
  const startDateObj = new Date(now);
  const day = startDateObj.getDay(); // 0 es Domingo, 6 es Sábado
  const diff = startDateObj.getDate() - day; // Restamos días hasta llegar al domingo
  startDateObj.setDate(diff);
  
  const startDate = startDateObj.toISOString().split('T')[0];

  return { startDate, endDate };
}

export async function getStudentData(studentId: string) {
  if (!API_KEY) return null;

  try {
    // 1. OBTENER PERFIL DEL ESTUDIANTE
    const profileRes = await fetch(`${BASE_URL}/students/${studentId}`, {
      headers: { 'Public-API-Key': API_KEY },
      cache: 'no-store' // Evitar datos viejos
    });
    
    if (!profileRes.ok) return null;
    const { student } = await profileRes.json();

    // 2. CONFIGURAR RANGO DE FECHAS (CRÍTICO PARA MÉTRICAS SEMANALES)
    // Si no enviamos esto, la API devuelve solo "Hoy", lo que causa los ceros.
    const { startDate, endDate } = getWeekRange();

    // 3. OBTENER ACTIVIDAD DE LA SEMANA
    const activityRes = await fetch(`${BASE_URL}/students/${studentId}/activity`, {
      headers: { 
        'Public-API-Key': API_KEY,
        'Start-Date': startDate,
        'End-Date': endDate
      },
      cache: 'no-store'
    });

    // Estructura por defecto segura
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
        
        // =================================================================
        // ESTRATEGIA DE EXTRACCIÓN DE DATOS (Basada en Doc Beta 5.1)
        // =================================================================
        
        // INTENTO 1: Leer 'time' directo del total (según doc) o variantes
        let calculatedTime = t.time ?? t.time_engaged ?? activity.time ?? 0;

        // INTENTO 2 (Plan de Respaldo): Sumar 'timeSpent' de cada tarea
        // Útil si el total viene en 0 pero hay tareas en la lista
        if (calculatedTime === 0 && activity.tasks && activity.tasks.length > 0) {
           calculatedTime = activity.tasks.reduce((acc: number, task: any) => {
             // La doc dice 'timeSpent', pero buscamos variantes por seguridad
             const taskTime = task.timeSpent ?? task.time_spent ?? task.timeTotal ?? 0;
             return acc + taskTime;
           }, 0);
        }

        activityMetrics = {
          xpAwarded: t.xpAwarded ?? t.xp_awarded ?? 0,
          time: calculatedTime, // ✅ Aquí tendremos los segundos reales de la semana
          questions: t.questions || 0,
          questionsCorrect: t.questionsCorrect ?? t.questions_correct ?? 0,
          numTasks: t.numTasks ?? t.num_tasks ?? 0,
          
          // Mapeo de tareas individuales para gráficos y RSR
          tasks: (activity.tasks || []).map((task: any) => ({
             ...task,
             questionsCorrect: task.questionsCorrect ?? task.questions_correct ?? 0,
             timeTotal: task.timeSpent ?? task.time_spent ?? 0,
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
