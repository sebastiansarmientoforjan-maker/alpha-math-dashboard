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
    const now = new Date();
    const endDateObj = new Date(now);
    endDateObj.setDate(endDateObj.getDate() + 1);
    const endDate = endDateObj.toISOString().split('T')[0];
    
    const startDateObj = new Date(now);
    startDateObj.setDate(startDateObj.getDate() - 30); // Últimos 30 días
    const startDate = startDateObj.toISOString().split('T')[0];

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
        code: activityRes.status
      }, { status: activityRes.status });
    }

    const rawData = await activityRes.json();
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
      timeFromTotals: {
        seconds: timeFromTotals,
        minutes: Math.round(timeFromTotals / 60),
        hours: (timeFromTotals / 3600).toFixed(2)
      },
      timeFromTasks: {
        seconds: timeFromTasks,
        minutes: Math.round(timeFromTasks / 60),
        hours: (timeFromTasks / 3600).toFixed(2),
        numTasks: tasks.length
      },
      totalsAvailable: {
        xpAwarded: totals.xpAwarded ?? 0,
        numTasks: totals.numTasks ?? 0,
        timeEngaged: totals.timeEngaged ?? 0
      },
      sampleTasks: tasks.slice(0, 3).map((t: any) => ({
        topic: t.topic?.name,
        timeSpent: t.timeSpent,
        completedLocal: t.completedLocal
      }))
    });

  } catch (e: any) {
    return NextResponse.json({ 
      status: '❌ EXCEPTION',
      error: e.message
    }, { status: 500 });
  }
}
