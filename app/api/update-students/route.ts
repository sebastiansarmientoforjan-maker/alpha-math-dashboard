import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { 
  doc, 
  writeBatch, 
  getDoc, 
  setDoc 
} from 'firebase/firestore';
import { getStudentData } from '@/lib/mathAcademyAPI';
import studentIds from '@/lib/student_ids.json'; 

const BATCH_SIZE = 50; 

export async function GET() {
  try {
    const stateRef = doc(db, 'system', 'scheduler_state');
    const stateSnap = await getDoc(stateRef);
    
    let startIndex = 0;
    if (stateSnap.exists()) {
      startIndex = stateSnap.data().lastIndex || 0;
    }

    if (startIndex >= studentIds.length) {
      startIndex = 0;
    }

    const endIndex = Math.min(startIndex + BATCH_SIZE, studentIds.length);
    const currentBatchIds = studentIds.slice(startIndex, endIndex);

    const updates = await Promise.all(
      currentBatchIds.map(async (id) => {
        try {
          const data = await getStudentData(id.toString());
          return { id: id.toString(), data };
        } catch (error) {
          return null; 
        }
      })
    );

    const batch = writeBatch(db);
    let successCount = 0;

    updates.forEach((item) => {
      if (item && item.data) {
        const studentRef = doc(db, 'students', item.id);
        const studentData = {
          ...item.data,
          lastUpdated: new Date().toISOString()
        };
        batch.set(studentRef, studentData, { merge: true });
        successCount++;
      }
    });

    await batch.commit();

    const nextIndex = endIndex >= studentIds.length ? 0 : endIndex;
    await setDoc(stateRef, { 
      lastIndex: nextIndex,
      lastRun: new Date().toISOString(),
      totalStudents: studentIds.length
    });

    return NextResponse.json({
      success: true,
      processed: successCount,
      range: { start: startIndex, end: endIndex },
      nextIndex: nextIndex,
      progress: `${Math.round((endIndex / studentIds.length) * 100)}%`
    });

  } catch (error) {
    return NextResponse.json({ success: false, error: 'Error interno' }, { status: 500 });
  }
}
