import { NextResponse } from 'next/server';
import { getStudentData } from '@/lib/mathAcademyAPI';

// Evita caché para ver datos reales
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  // Usamos un ID de tu lista que sabemos que debería existir
  const TEST_STUDENT_ID = '29509'; 

  try {
    // 1. Verificar API Key antes de llamar
    const apiKey = process.env.NEXT_PUBLIC_MATH_ACADEMY_API_KEY;
    if (!apiKey) {
        return NextResponse.json({ 
            status: '❌ FALLO DE CONFIGURACIÓN',
            error: 'No se encontró la API Key en las variables de entorno (.env.local)' 
        }, { status: 500 });
    }

    console.log(`🔍 Consultando API para ID: ${TEST_STUDENT_ID}...`);
    const data = await getStudentData(TEST_STUDENT_ID);
    
    // 2. Manejar caso de Estudiante No Encontrado (Aquí fue el error anterior)
    if (!data) {
        return NextResponse.json({ 
            status: '⚠️ API CONECTADA PERO SIN DATOS',
            message: `La API respondió, pero devolvió NULL para el estudiante ${TEST_STUDENT_ID}.`,
            possible_causes: [
                "El ID del estudiante no existe o está inactivo.",
                "La API Key no tiene permisos suficientes.",
                "Math Academy bloqueó la solicitud (Rate Limit)."
            ]
        }, { status: 404 });
    }

    // 3. Si llegamos aquí, TENEMOS DATOS. Analicemos el tiempo.
    return NextResponse.json({
      status: '✅ CONEXIÓN EXITOSA',
      student_name: `${data.firstName} ${data.lastName}`,
      
      // Diagnóstico del tiempo (Aquí veremos si llegan los segundos)
      time_diagnosis: {
          raw_seconds_from_api: data.activity?.time,
          minutes_calculated: Math.round((data.activity?.time || 0) / 60) + ' min',
          is_zero: (data.activity?.time || 0) === 0
      },

      // Verificamos de dónde viene el dato para estar seguros
      debug_sources: {
          totals_time_engaged: data.activity?.totals?.time_engaged,
          totals_timeEngaged: data.activity?.totals?.timeEngaged,
          root_time: data.activity?.time
      }
    });

  } catch (e: any) {
    return NextResponse.json({ 
        status: '❌ ERROR DE SERVIDOR',
        error_message: e.message,
        stack: e.stack
    }, { status: 500 });
  }
}
