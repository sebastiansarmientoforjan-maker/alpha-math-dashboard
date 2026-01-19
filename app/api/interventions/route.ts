import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { studentId, studentName, type, targetTopic, notes } = body;
    
    if (!studentId || !type) {
      return NextResponse.json({ success: false, error: 'Missing fields' }, { status: 400 });
    }
    
    const intervention = {
      studentId,
      studentName,
      type,
      targetTopic: targetTopic || undefined,
      notes: notes || '',
      createdBy: 'DRI',
      createdAt: new Date().toISOString(),
      status: 'pending'
    };
    
    const docRef = await adminDb.collection('interventions').add(intervention);
    
    return NextResponse.json({ success: true, interventionId: docRef.id });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Error' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const snapshot = await adminDb.collection('interventions')
      .orderBy('createdAt', 'desc')
      .limit(100)
      .get();
    
    const interventions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    return NextResponse.json({ success: true, interventions });
  } catch (error) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
