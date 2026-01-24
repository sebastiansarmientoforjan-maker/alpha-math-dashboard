import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const BASE_URL = 'https://mathacademy.com/api/beta6';

export async function GET(request: Request) {
  const API_KEY = process.env.NEXT_PUBLIC_MATH_ACADEMY_API_KEY;

  if (!API_KEY) {
    return NextResponse.json({ error: 'Falta API Key' }, { status: 500 });
  }

  try {
    // 1. INTENTO DE DESCUBRIMIENTO: Pedir la lista completa
    // Probamos el endpoint estándar de colección
    console.log('📡 Intentando descubrir estudiantes activos...');
    
    const res = await fetch(`${BASE_URL}/students`, {
      headers: { 'Public-API-Key': API_KEY },
      cache: 'no-store'
    });

    if (!res.ok) {
        return NextResponse.json({
            status: '❌ ERROR EN DESCUBRIMIENTO',
            code: res.status,
            statusText: res.statusText,
            message: 'No se pudo obtener la lista de estudiantes. Revisa permisos de la API Key.'
        }, { status: res.status });
    }

    const data = await res.json();

    // 2. Analizar qué devolvió la API
    // A veces devuelve { students: [...] } o directamente [...]
    const studentList = Array.isArray(data) ? data : (data.students || []);

    if (studentList.length === 0) {
        return NextResponse.json({
            status: '⚠️ API VACÍA',
            message: 'La API respondió OK, pero la lista de estudiantes está vacía.',
            suggestion: 'Tu API Key podría ser válida pero no tener estudiantes asignados.'
        });
    }

    // 3. ÉXITO: Tomamos el primer estudiante REAL para probar sus datos
    const realStudent = studentList[0];
    
    return NextResponse.json({
      status: '✅ DESCUBRIMIENTO EXITOSO',
      count: studentList.length,
      
      // Muestra IDs reales para que actualices tu JSON
      first_5_ids: studentList.slice(0, 5).map((s: any) => s.id),
      
      // Muestra la estructura del primer estudiante para ver dónde está el tiempo
      sample_student: {
          id: realStudent.id,
          name: `${realStudent.first_name || realStudent.firstName} ${realStudent.last_name || realStudent.lastName}`,
          // Aquí veremos si los datos vienen en la lista o si hay que pedir detalle
          has_activity_data: !!realStudent.activity, 
          raw_data_keys: Object.keys(realStudent)
      }
    });

  } catch (e: any) {
    return NextResponse.json({ 
        status: '❌ ERROR DE CONEXIÓN',
        error: e.message 
    }, { status: 500 });
  }
}
