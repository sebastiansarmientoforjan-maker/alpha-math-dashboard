import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const BASE_URL = 'https://mathacademy.com/api/beta6';

export async function GET(request: Request) {
  const API_KEY = process.env.NEXT_PUBLIC_MATH_ACADEMY_API_KEY;
  const { searchParams } = new URL(request.url);
  const studentId = searchParams.get('studentId') || '29509'; // Primer ID de tu lista

  if (!API_KEY) {
    return NextResponse.json({ error: 'Falta API Key' }, { status: 500 });
  }

  try {
    // Calcular rango de fechas (Domingo a Hoy)
    const now = new Date();
    const endDate = now.toISOString().split('T')[0];
    
    const startDateObj = new Date(now);
    const day = startDateObj.getDay();
    startDateObj.setDate(startDateObj.getDate() - day);
    const startDate = startDateObj.toISOString().split('T')[0];

    console.log('📅 Rango de fechas:', { startDate, endDate });

    // Obtener actividad CON query params
    const activityRes = await fetch(
      `${BASE_URL}/students/${studentId}/activity?startDate=${startDate}&endDate=${endDate}`,
      {
        headers: { 
          'Public-API-Key': API_KEY
        },
        cache: 'no-store'
      }
    );

    if (!activityRes.ok) {
      return NextResponse.json({
        status: '❌ ERROR',
        code: activityRes.status,
        message: 'No se pudo obtener actividad del estudiante'
      }, { status: activityRes.status });
    }

    const { activity } = await activityRes.json();

    // Análisis detallado
    const totals = activity?.totals || {};
    const tasks = activity?.tasks || [];

    const timeFromTotals = totals.timeEngaged ?? 0;
    const timeFromTasks = tasks.reduce((acc: number, t: any) => acc + (t.timeSpent ?? 0), 0);

    return NextResponse.json({
      status: '✅ ANÁLISIS DE TIEMPO',
      studentId,
      dateRange: { startDate, endDate },
      
      // Tiempo desde totals
      timeFromTotals: {
        seconds: timeFromTotals,
        minutes: Math.round(timeFromTotals / 60),
        hours: (timeFromTotals / 3600).toFixed(2)
      },
      
      // Tiempo sumando tasks
      timeFromTasks: {
        seconds: timeFromTasks,
        minutes: Math.round(timeFromTasks / 60),
        hours: (timeFromTasks / 3600).toFixed(2)
      },
      
      // Otros campos disponibles
      otherFields: {
        xpAwarded: totals.xpAwarded ?? 0,
        numTasks: totals.numTasks ?? 0,
        questions: totals.questions ?? 0,
        questionsCorrect: totals.questionsCorrect ?? 0
      },
      
      // Muestra de tasks
      sampleTasks: tasks.slice(0, 3).map((t: any) => ({
        topic: t.topic?.name,
        timeSpent: t.timeSpent,
        questions: t.questions,
        questionsCorrect: t.questionsCorrect,
        completedLocal: t.completedLocal
      })),
      
      // Estructura completa de totals
      rawTotalsKeys: Object.keys(totals)
    });

  } catch (e: any) {
    return NextResponse.json({ 
      status: '❌ ERROR',
      error: e.message 
    }, { status: 500 });
  }
}
