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

    const stateRef = doc(db, 'system', 'scheduler_state');
    
    let startIndex = 0;
    
    if (!shouldReset) {
       const stateSnap = await getDoc(stateRef);
       startIndex = stateSnap.exists() ? stateSnap.data().lastIndex || 0 : 0;
    }

    if (startIndex >= studentIds.length) startIndex = 0;

    // Procesamos lote de 50 estudiantes
    // Nota: Ahora haremos 2 escrituras por estudiante (Perfil + Historial),
    // así que el batch de 50 genera 100 escrituras. El límite de Firestore es 500, así que estamos seguros.
    const endIndex = Math.min(startIndex + 50, studentIds.length);
    const currentBatchIds = studentIds.slice(startIndex, endIndex);

    console.log(`⚡ SYNC START: Processing ${startIndex} to ${endIndex}...`);

    const updates = await Promise.all(
      currentBatchIds.map(async (id) => {
        try {
          const rawData = await getStudentData(id.toString());
          if (!rawData) return null;

          const metrics = calculateTier1Metrics(rawData, rawData.activity);

          // LOGS DE CONFIRMACIÓN
          if (metrics.nemesisTopic) {
            console.log(`   👹 NEMESIS: ID ${id} -> "${metrics.nemesisTopic}"`);
          }

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

    // --- FASE DE ESCRITURA (BATCH) ---
    const batch = writeBatch(db);
    let updateCount = 0;
    const todayStr = new Date().toISOString().split('T')[0]; // Formato YYYY-MM-DD

    updates.forEach((item) => {
      if (item) {
        // 1. Actualizar Estado Actual (Para el Dashboard en tiempo real)
        const studentRef = doc(db, 'students', item.id);
        batch.set(studentRef, item.data, { merge: true });

        // 2. Guardar Snapshot Histórico (Para "Trend Sparklines") [NUEVO]
        // Guardamos en la sub-colección 'history' usando la fecha como ID.
        // Esto asegura que solo haya un registro por día (idempotencia).
        const historyRef = doc(db, 'students', item.id, 'history', todayStr);
        
        // Guardamos solo lo vital para tendencias (ahorrar espacio)
        const historySnapshot = {
          date: todayStr,
          timestamp: new Date().toISOString(),
          metrics: {
             velocityScore: item.data.metrics.velocityScore,
             accuracyRate: item.data.metrics.accuracyRate,
             riskStatus: item.data.metrics.riskStatus,
             efficiencyRatio: item.data.metrics.efficiencyRatio,
             contentGap: item.data.metrics.contentGap
          },
          courseName: item.data.currentCourse?.name || 'Unknown'
        };

        batch.set(historyRef, historySnapshot, { merge: true });

        updateCount++;
      }
    });

    await batch.commit();
    
    // Guardar estado del scheduler
    await setDoc(stateRef, { lastIndex: endIndex, total: studentIds.length }, { merge: true });

    console.log(`✅ BATCH COMPLETE: Updated ${updateCount} profiles + history entries.`);

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
