import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { 
  collection, 
  doc, 
  writeBatch, 
  getDoc, 
  setDoc 
} from 'firebase/firestore';
import { getStudentData } from '@/lib/mathAcademyAPI';
import studentIds from '@/lib/student_ids.json'; // Tu lista de 1614 IDs

// CONFIGURACIÓN
const BATCH_SIZE = 50; // Procesamos 50 estudiantes por llamada (seguro para Vercel)

export async function GET() {
  try {
    // 1. Averiguar dónde nos quedamos la última vez
    const stateRef = doc(db, 'system', 'scheduler_state');
    const stateSnap = await getDoc(stateRef);
    
    let startIndex = 0;
    if (stateSnap.exists()) {
      startIndex = stateSnap.data().lastIndex || 0;
    }

    // 2. Calcular el siguiente lote
    // Si llegamos al final, volvemos a empezar (Carrusel infinito)
    if (startIndex >= studentIds.length) {
      startIndex = 0;
    }

    const endIndex = Math.min(startIndex + BATCH_SIZE, studentIds.length);
    const currentBatchIds = studentIds.slice(startIndex, endIndex);

    console.log(`🔄 Procesando lote: ${startIndex} a ${endIndex} (${currentBatchIds.length} estudiantes)`);

    // 3. Obtener datos de Math Academy en PARALELO (Mucho más rápido)
    const updates = await Promise.all(
      currentBatchIds.map(async (id) => {
        try {
          const data = await getStudentData(id.toString());
          return { id: id.toString(), data }; // Guardamos ID y Data
        } catch (error) {
          console.error(`Error con estudiante ${id}:`, error);
          return null; // Si falla uno, no detenemos a los demás
        }
      })
    );

    // 4. Guardar en Firebase (Usando Batch Write para eficiencia)
    const batch = writeBatch(db);
    let successCount = 0;

    updates.forEach((item) => {
      if (item && item.data) {
        const studentRef = doc(db, 'students', item.id);
        
        // Agregamos timestamp de actualización
        const studentData = {
          ...item.data,
          lastUpdated: new Date().toISOString()
        };

        batch.set(studentRef, studentData, { merge: true });
        successCount++;
      }
    });

    await batch.commit();

    // 5. Guardar el nuevo marcador para la próxima vez
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
      totalStudents: studentIds.length
    });

  } catch (error) {
    console.error('🔥 Error crítico en actualización:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
