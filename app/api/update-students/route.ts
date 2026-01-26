import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, writeBatch, getDoc, setDoc } from 'firebase/firestore';
import { getStudentData } from '@/lib/mathAcademyAPI';
import { calculateTier1Metrics } from '@/lib/metrics';
import studentIds from '@/lib/student_ids.json'; 

// ============================================
// CONFIGURACIÓN CRÍTICA PARA NEXT.JS 14
// ============================================
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;
export const runtime = 'nodejs';
export const maxDuration = 60;

// ============================================
// HANDLER PRINCIPAL
// ============================================
export async function GET(request: Request) {
  const requestTimestamp = new Date().toISOString();
  console.log(`[update-students] Request started at ${requestTimestamp}`);

  try {
    const stateRef = doc(db, 'system', 'scheduler_state');
    const stateSnap = await getDoc(stateRef);
    let startIndex = stateSnap.exists() ? stateSnap.data().lastIndex || 0 : 0;

    if (startIndex >= studentIds.length) startIndex = 0;

    const endIndex = Math.min(startIndex + 50, studentIds.length);
    const currentBatchIds = studentIds.slice(startIndex, endIndex);

    console.log(`[update-students] Processing batch: ${startIndex} to ${endIndex} (${currentBatchIds.length} students)`);

    const updates = await Promise.all(
      currentBatchIds.map(async (id) => {
        try {
          const rawData = await getStudentData(id.toString());
          if (!rawData) {
            console.warn(`[update-students] No data for student ${id}`);
            return null;
          }

          const metrics = calculateTier1Metrics(rawData, rawData.activity || { tasks: [] });

          return { 
            id: id.toString(), 
            data: { 
              ...rawData, 
              metrics, 
              lastUpdated: new Date().toISOString() 
            },
            studentName: `${rawData.firstName} ${rawData.lastName}`
          };
        } catch (e) {
          console.error(`[update-students] Error processing student ${id}:`, e);
          return null;
        }
      })
    );

    const batch = writeBatch(db);
    const todayStr = new Date().toISOString().split('T')[0];
    let lastStudentName = '';
    let successCount = 0;

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
        
        lastStudentName = item.studentName;
        successCount++;
      }
    });

    await batch.commit();
    
    await setDoc(stateRef, { 
      lastIndex: endIndex, 
      total: studentIds.length,
      lastUpdated: new Date().toISOString(),
      lastBatchSuccess: successCount
    }, { merge: true });

    const progress = Math.round((endIndex / studentIds.length) * 100);

    console.log(`[update-students] Batch completed: ${successCount}/${currentBatchIds.length} successful, progress: ${progress}%`);

    return NextResponse.json({ 
      success: true, 
      progress,
      nextIndex: endIndex,
      lastStudentName,
      batchSize: currentBatchIds.length,
      successCount,
      currentBatch: Math.ceil(endIndex / 50),
      totalBatches: Math.ceil(studentIds.length / 50),
      timestamp: requestTimestamp
    });

  } catch (error: any) {
    console.error('[update-students] Fatal error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message,
      progress: 0,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
