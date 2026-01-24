import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const BASE_URL = 'https://mathacademy.com/api/beta6';

export async function GET(request: Request) {
  const API_KEY = process.env.NEXT_PUBLIC_MATH_ACADEMY_API_KEY;
  const { searchParams } = new URL(request.url);
  const studentId = searchParams.get('studentId') || '29509';

  if (!API_KEY) {
    return NextResponse.json({ error: 'Falta API Key' }, { status: 500 });
  }

  try {
    // Calcular rango con padding
    const now = new Date();
    const endDateObj = new Date(now);
    endDateObj.setDate(endDateObj.getDate() + 1);
    const endDate = endDateObj.toISOString().split('T')[0];
    
    const startDateObj = new Date(now);
    const day = startDateObj.getDay();
    startDateObj.setDate(startDateObj.getDate() - day - 1);
    const startDate = startDateObj.toISOString().split('T')[0];

    console.log('📅 Rango (con padding):', { startDate, endDate });

    // ==========================================
    // REQUEST CON HEADERS (COMO PYTHON)
    // ==========================================
    const activityRes = await fetch(
      `${BASE_URL}/students/${studentId}/activity`,
      {
        headers: { 
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Public-API-Key': API_KEY,
          'Start-Date': startDate,
          'End-Date': endDate
        },
        cache: 'no-store'
      }
    );

    if (!activityRes.ok) {
      return NextResponse.json({
        status: '❌ ERROR',
        code: activityRes.status,
        statusText: activityRes.statusText
      }, { status: activityRes.status });
    }

    const rawData = await activityRes.json();

    // ==========================================
    // ANÁLISIS DE ESTRUCTURA
    // ==========================================
    const activity = rawData?.activity || rawData;
    const totals = activity?.totals || {};
    const tasks = activity?.tasks || [];

    const timeFromTotals = totals.timeEngaged ?? 0;
    const timeFromTasks = tasks.reduce((acc: number, t: any) => 
      acc + (t.timeSpent ?? 0), 0
    );

    return NextResponse.json({
      status: '✅ ANÁLISIS COMPLETO',
      studentId,
      dateRange: { startDate, endDate },
      
      // Estructura raw
      rawStructure: {
        hasActivityWrapper: !!rawData?.activity,
        topLevelKeys: Object.keys(rawData),
        activityKeys: Object.keys(activity || {})
      },
      
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
        hours: (timeFromTasks / 3600).toFixed(2),
        numTasks: tasks.length
      },
      
      // Totals disponibles
      totalsAvailable: {
        xpAwarded: totals.xpAwarded ?? 0,
        numTasks: totals.numTasks ?? 0,
        questions: totals.questions ?? 0,
        questionsCorrect: totals.questionsCorrect ?? 0,
        timeEngaged: totals.timeEngaged ?? 0,
        timeProductive: totals.timeProductive ?? 0,
        timeElapsed: totals.timeElapsed ?? 0
      },
      
      // Muestra de 3 tasks
      sampleTasks: tasks.slice(0, 3).map((t: any) => ({
        topic: t.topic?.name,
        timeSpent: t.timeSpent,
        xpAwarded: t.xpAwarded,
        completedLocal: t.completedLocal,
        accuracy: `${t.questionsCorrect}/${t.questions}`
      }))
    });

  } catch (e: any) {
    return NextResponse.json({ 
      status: '❌ EXCEPTION',
      error: e.message,
      stack: e.stack
    }, { status: 500 });
  }
}
