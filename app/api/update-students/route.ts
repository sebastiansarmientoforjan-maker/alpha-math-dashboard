import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, writeBatch, getDoc, setDoc } from 'firebase/firestore';
import { getStudentData } from '@/lib/mathAcademyAPI';
import { calculateTier1Metrics } from '@/lib/metrics';
import studentIds from '@/lib/student_ids.json'; 

export const dynamic = 'force-dynamic';

export async function GET(request: Request) { // Añadimos request
  try {
    const { searchParams } = new URL(request.url);
    const shouldReset = searchParams.get('reset') === 'true';

    const stateRef = doc(db, 'system', 'scheduler_state');
    
    let startIndex = 0;
    
    if (!shouldReset) {
       const stateSnap = await getDoc(stateRef);
       startIndex = stateSnap.exists() ? stateSnap.data().lastIndex || 0 : 0;
    }

    // Si ya terminamos y no es reset, o si el índice se pasó, reiniciamos visualmente a 0
    if (startIndex >= studentIds.length) startIndex = 0;

    // Procesamos 50 estudiantes
    const endIndex = Math.min(startIndex + 50, studentIds.length);
    const currentBatchIds = studentIds.slice(startIndex, endIndex);

    const updates = await Promise.all(
      currentBatchIds.map(async (id) => {
        try {
          const rawData = await getStudentData(id.toString());
          if (!rawData) return null;
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
    
    // Guardamos dónde quedamos. Si llegamos al final, guardamos el final.
    // El frontend decidirá detenerse cuando vea que currentIndex == total.
    await setDoc(stateRef, { lastIndex: endIndex, total: studentIds.length }, { merge: true });

    return NextResponse.json({ 
      success: true, 
      currentIndex: endIndex, // Retornamos dónde quedamos (ej: 50, 100... 1613)
      total: studentIds.length,
      progress: Math.round((endIndex / studentIds.length) * 100)
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Internal Error" }, { status: 500 });
  }
}
