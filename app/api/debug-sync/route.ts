import { NextResponse } from 'next/server';
import { getStudentData } from '@/lib/mathAcademyAPI';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  // ID de Zoey sacado de tu captura (o usa uno que sepas que tiene actividad)
  const TEST_STUDENT_ID = '17191'; // Reemplaza con un ID real si este no es Zoey

  try {
    const rawData = await getStudentData(TEST_STUDENT_ID);
    
    return NextResponse.json({
      status: 'Debug Check',
      student: rawData.firstName + ' ' + rawData.lastName,
      // Aquí veremos si la API está mandando el tiempo y si nuestro mapeo funciona
      time_check: {
        raw_seconds_in_api: rawData.activity.time, 
        minutes_converted: Math.round(rawData.activity.time / 60) + ' min',
        tasks_count: rawData.activity.tasks.length
      },
      full_data: rawData
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
