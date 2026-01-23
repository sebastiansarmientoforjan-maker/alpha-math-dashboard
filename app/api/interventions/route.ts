import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { studentId, studentName, type, targetTopic, createdBy } = body;

    const docRef = await addDoc(collection(db, 'interventions'), {
      studentId,
      studentName,
      type, // 'coaching', 'nemesis_intervention', 'remedial_plan'
      targetTopic,
      status: 'active',
      createdAt: serverTimestamp(),
      createdBy: createdBy || 'DRI_COMMAND'
    });

    return NextResponse.json({ id: docRef.id, message: 'Intervención registrada con éxito' });
  } catch (error) {
    console.error('Error en API Interventions:', error);
    return NextResponse.json({ error: 'Failed to log intervention' }, { status: 500 });
  }
}
