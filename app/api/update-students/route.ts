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
    const endIndex = Math.min(startIndex + 50, studentIds.length);
    const currentBatchIds = studentIds.slice(startIndex, endIndex);

    console.log(`⚡ SYNC START: Processing ${startIndex} to ${endIndex}...`);

    const updates = await Promise.all(
      currentBatchIds.map(async (id) => {
        try {
          // 1. OBTENER DATOS (Tier 3 Source: API con Tasks)
          const rawData = await getStudentData(id.toString());
          if (!rawData) return null;

          // 2. CALCULAR MÉTRICAS (Tier 4 Brain: Nemesis & Zombies)
          // Al usar la nueva función metrics.ts, esto devuelve nemesisTopic y riskStatus
          const metrics = calculateTier1Metrics(rawData, rawData.activity);

          // 3. LOG DE CONFIRMACIÓN (Solo para ver que funciona en consola)
          if (metrics.nemesisTopic) {
            console.log(`   👹 NEMESIS DETECTED for ID ${id}: "${metrics.nemesisTopic}"`);
          }
          if (metrics.riskStatus === 'Dormant') {
            // console.log(`   💤 DORMANT: ID ${id}`); // Opcional
          }

          // 4. PREPARAR PAYLOAD PARA FIRESTORE
          // Guardamos 'metrics' completo. Esto persiste el Nemesis Topic en la DB.
          // Si la API falla mañana, el dashboard leerá este dato desde Firebase.
          return { 
            id: id.toString(), 
            data: { 
              ...rawData, 
              metrics, // <--- Aquí va la joya (Tier 4 data)
              lastUpdated: new Date().toISOString() 
            } 
          };

        } catch (e) { 
          console.error(`Error processing student ${id}:`, e);
          return null; 
        }
      })
    );

    // 5. COMMIT A LA BASE DE DATOS
    const batch = writeBatch(db);
    let updateCount = 0;

    updates.forEach((item) => {
      if (item) {
        const studentRef = doc(db, 'students', item.id);
        batch.set(studentRef, item.data, { merge: true }); // Merge asegura no borrar datos ajenos
        updateCount++;
      }
    });

    await batch.commit();
    
    // Guardar estado del scheduler
    await setDoc(stateRef, { lastIndex: endIndex, total: studentIds.length }, { merge: true });

    console.log(`✅ BATCH COMPLETE: Updated ${updateCount} students.`);

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
