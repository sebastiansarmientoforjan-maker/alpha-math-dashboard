// lib/mathAcademyAPI.ts
const API_KEY = process.env.NEXT_PUBLIC_MATH_ACADEMY_API_KEY;
const BASE_URL = 'https://mathacademy.com/api/beta6'; 

export async function getStudentData(studentId: string) {
  if (!API_KEY) {
    console.error('API Key missing');
    return null;
  }

  try {
    // ---------------------------------------------------------
    // 1. LLAMADA DE PERFIL
    // ---------------------------------------------------------
    const profileRes = await fetch(`${BASE_URL}/students/${studentId}`, {
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Public-API-Key': API_KEY 
      }
    });
    
    if (!profileRes.ok) {
      console.warn(`Profile ${studentId} failed`);
      return null; 
    }
    
    const profileData = await profileRes.json();
    const student = profileData.student;

    // ---------------------------------------------------------
    // 2. LLAMADA DE ACTIVIDAD
    // ---------------------------------------------------------
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7); // Últimos 7 días

    const endStr = endDate.toISOString().split('T')[0];
    const startStr = startDate.toISOString().split('T')[0];

    const activityRes = await fetch(`${BASE_URL}/students/${studentId}/activity`, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Public-API-Key': API_KEY,
        'Start-Date': startStr,
        'End-Date': endStr
      }
    });

    // Inicializamos con array de tasks vacío para evitar errores
    let activityMetrics = {
      xpAwarded: 0,
      time: 0, // Minutos
      questions: 0,
      questionsCorrect: 0,
      numTasks: 0,
      tasks: [] as any[] // <--- AQUÍ ESTÁ LA CLAVE PARA TIER 4
    };

    if (activityRes.ok) {
      const activityData = await activityRes.json();
      
      if (activityData.result && activityData.activity) {
        const act = activityData.activity;
        const t = act.totals || {}; // Totales generales
        
        // Usamos timeEngaged (tiempo real activo)
        const seconds = t.timeEngaged || t.timeProductive || t.timeElapsed || 0;

        activityMetrics = {
          xpAwarded: t.xpAwarded || 0,
          time: Math.round(seconds / 60), 
          questions: t.questions || 0,
          questionsCorrect: t.questionsCorrect || 0,
          numTasks: t.numTasks || 0,
          // GUARDAMOS LA LISTA DE TAREAS CRUDA 👇
          tasks: act.tasks || [] 
        };
      }
    } else {
        console.warn(`Activity Error ${studentId}: ${activityRes.status}`);
    }

    // 3. FUSIÓN
    return {
      ...student,
      activity: activityMetrics 
    };

  } catch (error) {
    console.error(`Exception fetching student ${studentId}:`, error);
    return null;
  }
}
