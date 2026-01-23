import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, writeBatch, getDoc, setDoc } from 'firebase/firestore';
import { getStudentData } from '@/lib/mathAcademyAPI';
import { calculateTier1Metrics } from '@/lib/metrics';
import studentIds from '@/lib/student_ids.json'; 

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    // 1. Verificar integridad de la lista de IDs
    if (!studentIds || !Array.isArray(studentIds)) {
      throw new Error("ID List (student_ids.json) is missing or invalid.");
    }

    const stateRef = doc(db, 'system', 'scheduler_state');
    const stateSnap = await getDoc(stateRef);
    let startIndex = stateSnap.exists() ? stateSnap.data().lastIndex || 0 : 0;

    if (startIndex >= studentIds.length) startIndex = 0;

    const endIndex = Math.min(startIndex + 50, studentIds.length);
    const currentBatchIds = studentIds.slice(startIndex, endIndex);

    // 2. Procesamiento de Lote
    const updates = await Promise.all(
      currentBatchIds.map(async (id) => {
        try {
          const rawData = await getStudentData(id.toString());
          if (!rawData) return null;
          const metrics = calculateTier1Metrics(rawData, rawData.activity);
          return { id: id.toString(), data: { ...rawData, metrics, lastUpdated: new Date().toISOString() } };
        } catch (e) { 
          console.error(`Error fetching ID ${id}:`, e);
          return null; 
        }
      })
    );

    // 3. Escritura en Batch (Protección de Cuota)
    const batch = writeBatch(db);
    let updateCount = 0;
    const todayStr = new Date().toISOString().split('T')[0];

    updates.forEach((item) => {
      if (item) {
        const ref = doc(db, 'students', item.id);
        batch.set(ref, item.data, { merge: true });
        
        // Historial diario para PDI y DER
        const historyRef = doc(db, 'students', item.id, 'history', todayStr);
        batch.set(historyRef, {
            date: todayStr,
            metrics: item.data.metrics,
            courseName: item.data.currentCourse?.name
        }, { merge: true });

        updateCount++;
      }
    });

    await batch.commit();
    
    // 4. Actualización del puntero del sistema
    await setDoc(stateRef, { lastIndex: endIndex, total: studentIds.length }, { merge: true });

    return NextResponse.json({ 
      success: true, 
      progress: Math.round((endIndex / studentIds.length) * 100),
      updated: updateCount
    });

  } catch (error: any) {
    console.error("CRITICAL SYNC ERROR:", error.message);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
