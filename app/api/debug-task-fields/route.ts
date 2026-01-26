import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

const BASE_URL = 'https://mathacademy.com/api/beta6';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const studentId = searchParams.get('studentId') || '29509';
  const API_KEY = process.env.NEXT_PUBLIC_MATH_ACADEMY_API_KEY;

  if (!API_KEY) {
    return NextResponse.json({ error: 'Missing API Key' }, { status: 500 });
  }

  const now = new Date(Date.now());
  const endDateObj = new Date(now.getTime());
  endDateObj.setDate(endDateObj.getDate() + 1);
  const endDate = endDateObj.toISOString().split('T')[0];

  const startDateObj = new Date(now.getTime());
  startDateObj.setDate(startDateObj.getDate() - 30);
  const startDate = startDateObj.toISOString().split('T')[0];

  try {
    const res = await fetch(`${BASE_URL}/students/${studentId}/activity`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Public-API-Key': API_KEY,
        'Start-Date': startDate,
        'End-Date': endDate
      },
      cache: 'no-store'
    });

    if (!res.ok) {
      return NextResponse.json({ 
        error: `API Error: ${res.status}`,
        statusText: res.statusText 
      }, { status: res.status });
    }

    const data = await res.json();
    const activity = data?.activity || data;
    const tasks = activity?.tasks || [];

    const sampleTasks = tasks.slice(0, 3).map((task: any, index: number) => ({
      taskIndex: index,
      allFields: Object.keys(task),
      rawData: task,
      possibleTimeFields: {
        timeSpent: task.timeSpent,
        timeTotal: task.timeTotal,
        time: task.time,
        duration: task.duration,
        timeEngaged: task.timeEngaged,
        timeElapsed: task.timeElapsed,
        seconds: task.seconds,
        minutes: task.minutes
      }
    }));

    return NextResponse.json({
      diagnostic: 'Task Fields Analysis',
      studentId,
      dateRange: { startDate, endDate },
      totalTasks: tasks.length,
      totalsStructure: {
        allFields: Object.keys(activity?.totals || {}),
        rawTotals: activity?.totals
      },
      sampleTasks,
      firstTaskAllData: tasks[0] || 'No tasks found'
    });

  } catch (e: any) {
    return NextResponse.json({ 
      error: e.message,
      stack: e.stack 
    }, { status: 500 });
  }
}
```

Luego haz commit, push y redeploy. Una vez funcionando, visita:
```
https://TU-DOMINIO.vercel.app/api/debug-task-fields?studentId=29509
