import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, writeBatch, getDoc, setDoc } from 'firebase/firestore';
import { getStudentData } from '@/lib/mathAcademyAPI';
import { calculateTier1Metrics } from '@/lib/metrics';
import studentIds from '@/lib/student_ids.json'; 

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const shouldReset = searchParams.get('reset') === 'true';

    // 1. GESTIÓN DE ESTADO DEL SCHEDULER (Para recorrer los 1613 IDs)
    const stateRef = doc(db, 'system', 'scheduler_state');
    let startIndex = 0;
    
    if (!shouldReset) {
       const stateSnap = await getDoc(stateRef);
       startIndex = stateSnap.exists() ? stateSnap.data().lastIndex || 0 : 0;
    }

    // Reiniciar si llegamos al final de la lista
    if (startIndex >= studentIds.length) startIndex = 0;

    // 2. DEFINICIÓN DEL LOTE (50 alumnos = 100 escrituras en Firestore)
    const endIndex = Math.min(startIndex + 50, studentIds.length);
    const currentBatchIds = studentIds.slice(startIndex, endIndex);

    console.log(`⚡ SYNC START: Processing ${startIndex} to ${endIndex} of ${studentIds.length}...`);

    // 3. OBTENCIÓN Y PROCESAMIENTO PSICOMÉTRICO
    const updates = await Promise.all(
      currentBatchIds.map(async (id) => {
        try {
          const rawData = await getStudentData(id.toString());
          if (!rawData) return null;

          // Cálculo de métricas V4.1 (KSI, LMP, DER, etc.)
          const metrics = calculateTier1Metrics(rawData, rawData.activity);

          return { 
            id: id.toString(), 
            data: { 
              ...rawData, 
              metrics, 
              lastUpdated: new Date().toISOString() 
            } 
          };

        } catch (e) { 
          console.error(`Error processing student ${id}:`, e);
          return null; 
        }
      })
    );

    // 4. FASE DE ESCRITURA ATÓMICA (BATCH)
    const batch = writeBatch(db);
    let updateCount = 0;
    const todayStr = new Date().toISOString().split('T')[0]; // Formato YYYY-MM-DD

    updates.forEach((item) => {
      if (item) {
        // A. Actualizar Perfil Principal (Para el Triaje en tiempo real)
        const studentRef = doc(db, 'students', item.id);
        batch.set(studentRef, item.data, { merge: true });

        // B. Guardar Instantánea Histórica (Para análisis de tendencias/PDI)
        const historyRef = doc(db, 'students', item.id, 'history', todayStr);
        
        const historySnapshot = {
          date: todayStr,
          timestamp: new Date().toISOString(),
          metrics: {
              velocityScore: item.data.metrics.velocityScore,
              accuracyRate: item.data.metrics.accuracyRate,
              riskStatus: item.data.metrics.riskStatus,
              ksi: item.data.metrics.ksi,
              lmp: item.data.metrics.lmp,
              stallStatus: item.data.metrics.stallStatus
          },
          courseName: item.data.currentCourse?.name || 'Unknown'
        };

        batch.set(historyRef, historySnapshot, { merge: true });
        updateCount++;
      }
    });

    await batch.commit();
    
    // 5. ACTUALIZAR PUNTERO DEL SCHEDULER
    await setDoc(stateRef, { 
      lastIndex: endIndex, 
      total: studentIds.length,
      lastSync: new Date().toISOString() 
    }, { merge: true });

    console.log(`✅ BATCH COMPLETE: Updated ${updateCount} profiles.`);

    return NextResponse.json({ 
      success: true, 
      currentIndex: endIndex, 
      total: studentIds.length,
      progress: Math.round((endIndex / studentIds.length) * 100),
      updatedInThisBatch: updateCount
    });

  } catch (error) {
    console.error("Critical Sync Error:", error);
    return NextResponse.json({ success: false, error: "Internal Error" }, { status: 500 });
  }
}
