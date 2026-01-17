import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, writeBatch, getDoc, setDoc } from 'firebase/firestore';
import { getStudentData } from '@/lib/mathAcademyAPI';
import { calculateTier1Metrics } from '@/lib/metrics';
import studentIds from '@/lib/student_ids.json'; 

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const stateRef = doc(db, 'system', 'scheduler_state');
    const stateSnap = await getDoc(stateRef);
    let startIndex = stateSnap.exists() ? stateSnap.data().lastIndex || 0 : 0;

    if (startIndex >= studentIds.length) startIndex = 0;

    const endIndex = Math.min(startIndex + 50, studentIds.length);
    const currentBatchIds = studentIds.slice(startIndex, endIndex);

    const updates = await Promise.all(
      currentBatchIds.map(async (id) => {
        try {
          const rawData = await getStudentData(id.toString());
          if (!rawData) return null;
          // Aplicamos el cerebro Tier 1
          const metrics = calculateTier1Metrics(rawData, rawData.activity);
          return { id: id.toString(), data: { ...rawData, metrics, lastUpdated: new Date().toISOString() } };
        } catch (e) { return null; }
      })
    );

    const batch = writeBatch(db);
    updates.forEach((item) => {
      if (item) {
        const studentRef = doc(db, 'students', item.id);
        batch.set(studentRef, item.data, { merge: true });
      }
    });

    await batch.commit();
    const nextIndex = endIndex >= studentIds.length ? 0 : endIndex;
    await setDoc(stateRef, { lastIndex: nextIndex, total: studentIds.length }, { merge: true });

    return NextResponse.json({ success: true, currentIndex: endIndex, total: studentIds.length });
  } catch (error) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
