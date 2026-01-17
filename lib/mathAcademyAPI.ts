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
      // Intentamos fallback con x-api-key si Public-API-Key falla en este endpoint
      console.warn(`Profile ${studentId} failed with Public-API-Key, trying generic...`);
      return null; 
    }
    
    const profileData = await profileRes.json();
    const student = profileData.student;

    // ---------------------------------------------------------
    // 2. LLAMADA DE ACTIVIDAD (Ajustada al JSON Real)
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
        'Public-API-Key': API_KEY, // Header correcto según tu prueba
        'Start-Date': startStr,    // Header correcto según tu prueba
        'End-Date': endStr         // Header correcto según tu prueba
      }
    });

    let activityMetrics = {
      xpAwarded: 0,
      time: 0, // Minutos
      questions: 0,
      questionsCorrect: 0,
      numTasks: 0
    };

    if (activityRes.ok) {
      const activityData = await activityRes.json();
      
      // Mapeo exacto basado en tu JSON Beta 6
      if (activityData.result && activityData.activity && activityData.activity.totals) {
        const t = activityData.activity.totals;
        
        // DECISIÓN CRÍTICA: Usamos 'timeEngaged' (tiempo activo)
        // Si es null, usamos 'timeProductive'. Viene en SEGUNDOS.
        const seconds = t.timeEngaged || t.timeProductive || t.timeElapsed || 0;

        activityMetrics = {
          xpAwarded: t.xpAwarded || 0,
          time: Math.round(seconds / 60), // Convertimos Segundos -> Minutos
          questions: t.questions || 0,
          questionsCorrect: t.questionsCorrect || 0,
          numTasks: t.numTasks || 0
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
