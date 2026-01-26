import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

const BASE_URL = 'https://mathacademy.com/api/beta6';

const TEST_IDS = [
  '29509', '29437', '29441', '29442', '29494', '20848', '10866', 
  '21931', '22729', '21936', '21949', '21958', '30668', '30679',
  '21799', '21833', '21971', '21972', '21961', '21962', '21947'
];

export async function GET(request: Request) {
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

  const results: any[] = [];

  for (const studentId of TEST_IDS) {
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

      if (res.ok) {
        const data = await res.json();
        const activity = data?.activity || data;
        const tasks = activity?.tasks || [];
        const totals = activity?.totals || {};

        if (tasks.length > 0) {
          results.push({
            studentId,
            tasksCount: tasks.length,
            timeEngaged: totals.timeEngaged || 0,
            xpAwarded: totals.xpAwarded || 0,
            firstTask: tasks[0]
          });
        }
      }
    } catch (e) {
      continue;
    }

    if (results.length >= 3) break;
  }

  return NextResponse.json({
    diagnostic: 'Find Active Students',
    dateRange: { startDate, endDate },
    studentsChecked: TEST_IDS.length,
    activeStudentsFound: results.length,
    activeStudents: results
  });
}
