/**
 * DEBUG ENDPOINT: Verificar cálculo de fechas en runtime
 * Uso: GET /api/debug-dates?studentId=29509
 */

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

  // CALCULAR FECHAS EN ESTE MOMENTO
  const now = new Date(Date.now());
  const serverTimestamp = now.toISOString();
  
  const endDateObj = new Date(now.getTime());
  endDateObj.setDate(endDateObj.getDate() + 1);
  const endDate = endDateObj.toISOString().split('T')[0];

  const startDateObj = new Date(now.getTime());
  startDateObj.setDate(startDateObj.getDate() - 30);
  const startDate = startDateObj.toISOString().split('T')[0];

  const daysDiff = Math.round((endDateObj.getTime() - startDateObj.getTime()) / (1000 * 60 * 60 * 24));

  // TEST REQUEST A LA API
  let apiResponse: any = null;
  let apiError: string | null = null;

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
      
      apiResponse = {
        status: res.status,
        tasksCount: activity?.tasks?.length || 0,
        totals: activity?.totals || {},
        firstTaskDate: activity?.tasks?.[0]?.completedLocal || null,
        lastTaskDate: activity?.tasks?.slice(-1)?.[0]?.completedLocal || null
      };
    } else {
      apiError = `HTTP ${res.status}: ${res.statusText}`;
    }
  } catch (e: any) {
    apiError = e.message;
  }

  return NextResponse.json({
    diagnostic: 'Date Calculation Runtime Test',
    
    serverInfo: {
      timestamp: serverTimestamp,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      nodeVersion: process.version
    },
    
    calculatedDates: {
      startDate,
      endDate,
      daysDiff,
      expectedDays: 31,
      isCorrect: daysDiff === 31
    },
    
    headersUsed: {
      'Start-Date': startDate,
      'End-Date': endDate
    },
    
    apiTest: {
      studentId,
      url: `${BASE_URL}/students/${studentId}/activity`,
      response: apiResponse,
      error: apiError
    },
    
    cacheCheck: {
      note: 'If dates change on each request, cache is properly disabled',
      requestId: Math.random().toString(36).substring(7)
    }
  });
}
