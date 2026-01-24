import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, writeBatch, getDoc, setDoc } from 'firebase/firestore';
import { getStudentData } from '@/lib/mathAcademyAPI';
import { calculateTier1Metrics } from '@/lib/metrics';
import studentIds from '@/lib/student_ids.json'; 

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
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

          const metrics = calculateTier1Metrics(rawData, rawData.activity || { tasks: [] });

          return { 
            id: id.toString(), 
            data: { 
              ...rawData, 
              metrics, 
              lastUpdated: new Date().toISOString() 
            },
            studentName: `${rawData.firstName} ${rawData.lastName}` // ✅ NUEVO: Para feedback
          };
        } catch (e) { return null; }
      })
    );

    const batch = writeBatch(db);
    const todayStr = new Date().toISOString().split('T')[0];
    let lastStudentName = '';

    updates.forEach((item) => {
      if (item) {
        const ref = doc(db, 'students', item.id);
        batch.set(ref, item.data, { merge: true });
        
        const historyRef = doc(db, 'students', item.id, 'history', todayStr);
        batch.set(historyRef, {
            date: todayStr,
            metrics: item.data.metrics,
            courseName: item.data.currentCourse?.name
        }, { merge: true });
        
        lastStudentName = item.studentName; // ✅ NUEVO
      }
    });

    await batch.commit();
    await setDoc(stateRef, { 
      lastIndex: endIndex, 
      total: studentIds.length,
      lastUpdated: new Date().toISOString() // ✅ NUEVO
    }, { merge: true });

    return NextResponse.json({ 
      success: true, 
      progress: Math.round((endIndex / studentIds.length) * 100),
      nextIndex: endIndex,
      lastStudentName, // ✅ NUEVO
      batchSize: currentBatchIds.length,
      currentBatch: Math.ceil(endIndex / 50),
      totalBatches: Math.ceil(studentIds.length / 50)
    });

  } catch (error: any) {
    console.error('Update students error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message,
      progress: 0
    }, { status: 500 });
  }
}
