import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, writeBatch, getDoc, setDoc } from 'firebase/firestore';
import { getStudentData } from '@/lib/mathAcademyAPI';
import { calculateTier1Metrics } from '@/lib/metrics';
import studentIds from '@/lib/student_ids.json'; 

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    // 1. Verificación de Integridad de IDs
    if (!studentIds || !Array.isArray(studentIds)) {
      throw new Error("El archivo student_ids.json no es un array válido");
    }

    const stateRef = doc(db, 'system', 'scheduler_state');
    const stateSnap = await getDoc(stateRef);
    let startIndex = stateSnap.exists() ? stateSnap.data().lastIndex || 0 : 0;

    if (startIndex >= studentIds.length) startIndex = 0;

    // Procesamos lotes de 50 para seguridad (100 escrituras totales)
    const endIndex = Math.min(startIndex + 50, studentIds.length);
    const currentBatchIds = studentIds.slice(startIndex, endIndex);

    console.log(`⚡ SYNC BATCH: Processing indices ${startIndex} to ${endIndex}...`);

    // 2. Procesamiento Paralelo con Protección de Errores
    const updates = await Promise.all(
      currentBatchIds.map(async (id) => {
        try {
          const rawData = await getStudentData(id.toString());
          
          // Validación crítica: Si no hay datos o actividad, saltamos para no romper el lote
          if (!rawData) return null;

          // Aseguramos que activity tenga estructura válida
          const activityData = rawData.activity || { tasks: [], totals: {} };

          // Cálculo de métricas científicas (LMP, KSI, DER)
          const metrics = calculateTier1Metrics(rawData, activityData);
          
          return { 
            id: id.toString(), 
            data: { 
              ...rawData, // IMPORTANTE: Esto incluye 'activity' y 'tasks'
              activity: activityData, // Refuerzo explícito
              metrics, 
              lastUpdated: new Date().toISOString() 
            } 
          };
        } catch (e) {
          console.error(`Skipping student ${id} due to fetch error:`, e);
          return null;
        }
      })
    );

    // 3. Escritura en Lote (Batch)
    const batch = writeBatch(db);
    let updateCount = 0;
    const todayStr = new Date().toISOString().split('T')[0];

    updates.forEach((item) => {
      if (item) {
        // A. Perfil Principal (Para el Dashboard en tiempo real)
        const studentRef = doc(db, 'students', item.id);
        batch.set(studentRef, item.data, { merge: true });
        
        // B. Historial Diario (Para tendencias y análisis PDI)
        const historyRef = doc(db, 'students', item.id, 'history', todayStr);
        batch.set(historyRef, {
            date: todayStr,
            timestamp: new Date().toISOString(),
            metrics: {
              ksi: item.data.metrics.ksi,
              lmp: item.data.metrics.lmp,
              accuracyRate: item.data.metrics.accuracyRate,
              velocityScore: item.data.metrics.velocityScore,
              stallStatus: item.data.metrics.stallStatus
            },
            courseName: item.data.currentCourse?.name || 'Unknown'
        }, { merge: true });

        updateCount++;
      }
    });

    await batch.commit();
    
    // 4. Actualización del puntero
    await setDoc(stateRef, { 
      lastIndex: endIndex, 
      total: studentIds.length,
      lastSync: new Date().toISOString()
    }, { merge: true });

    return NextResponse.json({ 
      success: true, 
      progress: Math.round((endIndex / studentIds.length) * 100),
      count: updateCount,
      nextIndex: endIndex
    });

  } catch (error: any) {
    console.error("CRITICAL SYNC ERROR:", error.message);
    return NextResponse.json({ 
      success: false, 
      error: error.message || "Internal Server Error" 
    }, { status: 500 });
  }
}
