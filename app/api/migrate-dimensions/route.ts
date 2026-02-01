/**
 * API Route: Migrate Student Dimensions
 * 
 * Esta ruta permite migrar las dimensiones de los 81 estudiantes
 * ejecutándola UNA VEZ desde el navegador.
 * 
 * Uso:
 *   1. Deploy este archivo a Vercel
 *   2. Visita: https://tu-app.vercel.app/api/migrate-dimensions
 *   3. Espera la respuesta JSON confirmando la migración
 * 
 * IMPORTANTE: Esta ruta debería ser protegida en producción
 * (agregar authentication o eliminarla después de usarla)
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, updateDoc, getDoc } from 'firebase/firestore';

// Datos de dimensiones de los 81 estudiantes (del Excel)
const DIMENSIONS_DATA: Record<string, {
  campusDisplayName: string;
  campus: string;
  grade: number;
  guide: string | null;
}> = {
  "6619": { "campusDisplayName": "Alpha Austin", "campus": "Alpha High School", "grade": 9, "guide": "Emily Findley" },
  "11890": { "campusDisplayName": "Alpha Austin", "campus": "Alpha High School", "grade": 9, "guide": "Effy Phillips" },
  "24003": { "campusDisplayName": "Alpha SF", "campus": "Alpha School San Francisco", "grade": 11, "guide": "Cameron Sorsby" },
  "21965": { "campusDisplayName": "Alpha Austin", "campus": "Alpha High School", "grade": 9, "guide": "Effy Phillips" },
  "22878": { "campusDisplayName": "Alpha Miami", "campus": "Alpha School Miami", "grade": 9, "guide": "Jebin Justin" },
  "22792": { "campusDisplayName": "Alpha Austin", "campus": "Alpha High School", "grade": 9, "guide": "Emily Findley" },
  "29509": { "campusDisplayName": "Alpha Austin", "campus": "Alpha High School", "grade": 11, "guide": "Cameron Sorsby" },
  "28885": { "campusDisplayName": "Alpha Austin", "campus": "Alpha High School", "grade": 11, "guide": "Cameron Sorsby" },
  "22891": { "campusDisplayName": "Alpha Austin", "campus": "Alpha High School", "grade": 9, "guide": null },
  "22773": { "campusDisplayName": "Alpha Austin", "campus": "Alpha High School", "grade": 9, "guide": null },
  "22923": { "campusDisplayName": "Alpha Austin", "campus": "Alpha High School", "grade": 9, "guide": "Effy Phillips" },
  "28786": { "campusDisplayName": "Alpha Austin", "campus": "Alpha High School", "grade": 9, "guide": "Logan higuera" },
  "29458": { "campusDisplayName": "Alpha Austin", "campus": "Alpha High School", "grade": 11, "guide": "Jebin Justin" },
  "28743": { "campusDisplayName": "Alpha Austin", "campus": "Alpha High School", "grade": 9, "guide": null },
  "28741": { "campusDisplayName": "Alpha Austin", "campus": "Alpha High School", "grade": 9, "guide": "Logan higuera" },
  "28746": { "campusDisplayName": "Alpha Austin", "campus": "Alpha High School", "grade": 9, "guide": "Chloe Belvin" },
  "28754": { "campusDisplayName": "Alpha Austin", "campus": "Alpha High School", "grade": 9, "guide": "Chloe Belvin" },
  "28861": { "campusDisplayName": "Alpha Austin", "campus": "Alpha High School", "grade": 11, "guide": "Cameron Sorsby" },
  "28793": { "campusDisplayName": "Alpha Austin", "campus": "Alpha High School", "grade": 9, "guide": "Emily Findley" },
  "28792": { "campusDisplayName": "Alpha Austin", "campus": "Alpha High School", "grade": 9, "guide": "Chloe Belvin" },
  "28748": { "campusDisplayName": "Alpha Austin", "campus": "Alpha High School", "grade": 9, "guide": null },
  "28751": { "campusDisplayName": "Alpha Austin", "campus": "Alpha High School", "grade": 9, "guide": "Effy Phillips" },
  "28750": { "campusDisplayName": "Alpha Austin", "campus": "Alpha High School", "grade": 9, "guide": "Emily Findley" },
  "28780": { "campusDisplayName": "Alpha Austin", "campus": "Alpha High School", "grade": 9, "guide": "Logan higuera" },
  "28791": { "campusDisplayName": "Alpha Austin", "campus": "Alpha High School", "grade": 9, "guide": "Emily Findley" },
  "28752": { "campusDisplayName": "Alpha Austin", "campus": "Alpha High School", "grade": 9, "guide": "Logan higuera" },
  "28790": { "campusDisplayName": "Alpha Austin", "campus": "Alpha High School", "grade": 9, "guide": "Jebin Justin" },
  "28788": { "campusDisplayName": "Alpha Austin", "campus": "Alpha High School", "grade": 9, "guide": "Logan higuera" },
  "28789": { "campusDisplayName": "Alpha Austin", "campus": "Alpha High School", "grade": 9, "guide": "Jebin Justin" },
  "28787": { "campusDisplayName": "Alpha Austin", "campus": "Alpha High School", "grade": 9, "guide": "Emily Findley" },
  "28775": { "campusDisplayName": "Alpha Austin", "campus": "Alpha High School", "grade": 10, "guide": null },
  "28892": { "campusDisplayName": "Alpha Austin", "campus": "Alpha High School", "grade": 11, "guide": "Jebin Justin" },
  "28747": { "campusDisplayName": "Alpha Austin", "campus": "Alpha High School", "grade": 9, "guide": "Emily Findley" },
  "28755": { "campusDisplayName": "Alpha Austin", "campus": "Alpha High School", "grade": 9, "guide": null },
  "28756": { "campusDisplayName": "Alpha Austin", "campus": "Alpha High School", "grade": 9, "guide": "Logan higuera" },
  "28794": { "campusDisplayName": "Alpha Austin", "campus": "Alpha High School", "grade": 9, "guide": "Effy Phillips" },
  "28796": { "campusDisplayName": "Alpha Austin", "campus": "Alpha High School", "grade": 9, "guide": "Effy Phillips" },
  "28783": { "campusDisplayName": "Alpha Austin", "campus": "Alpha High School", "grade": 9, "guide": null },
  "28745": { "campusDisplayName": "Alpha Austin", "campus": "Alpha High School", "grade": 9, "guide": "Chloe Belvin" },
  "28744": { "campusDisplayName": "Alpha Austin", "campus": "Alpha High School", "grade": 9, "guide": "Jebin Justin" },
  "28777": { "campusDisplayName": "Alpha Austin", "campus": "Alpha High School", "grade": 9, "guide": "Effy Phillips" },
  "28779": { "campusDisplayName": "Alpha Austin", "campus": "Alpha High School", "grade": 9, "guide": "Logan higuera" },
  "28749": { "campusDisplayName": "Alpha Austin", "campus": "Alpha High School", "grade": 9, "guide": "Chloe Belvin" },
  "28781": { "campusDisplayName": "Alpha Austin", "campus": "Alpha High School", "grade": 9, "guide": null },
  "28795": { "campusDisplayName": "Alpha Austin", "campus": "Alpha High School", "grade": 9, "guide": "Chloe Belvin" },
  "28772": { "campusDisplayName": "Alpha Austin", "campus": "Alpha High School", "grade": 10, "guide": null },
  "28782": { "campusDisplayName": "Alpha Austin", "campus": "Alpha High School", "grade": 9, "guide": null },
  "28784": { "campusDisplayName": "Alpha Austin", "campus": "Alpha High School", "grade": 9, "guide": "Effy Phillips" },
  "28778": { "campusDisplayName": "Alpha Austin", "campus": "Alpha High School", "grade": 9, "guide": "Emily Findley" },
  "28785": { "campusDisplayName": "Alpha Austin", "campus": "Alpha High School", "grade": 9, "guide": "Jebin Justin" },
  "28753": { "campusDisplayName": "Alpha Austin", "campus": "Alpha High School", "grade": 9, "guide": "Chloe Belvin" },
  "23043": { "campusDisplayName": "Alpha Miami", "campus": "Alpha School Miami", "grade": 10, "guide": "Jebin Justin" },
  "22774": { "campusDisplayName": "Alpha Miami", "campus": "Alpha School Miami", "grade": 9, "guide": "Jebin Justin" },
  "22783": { "campusDisplayName": "Alpha Miami", "campus": "Alpha School Miami", "grade": 9, "guide": "Jebin Justin" },
  "22903": { "campusDisplayName": "Alpha Miami", "campus": "Alpha School Miami", "grade": 10, "guide": "Jebin Justin" },
  "22832": { "campusDisplayName": "Alpha Miami", "campus": "Alpha School Miami", "grade": 10, "guide": "Jebin Justin" },
  "22784": { "campusDisplayName": "Alpha Miami", "campus": "Alpha School Miami", "grade": 10, "guide": "Jebin Justin" },
  "22902": { "campusDisplayName": "Alpha Miami", "campus": "Alpha School Miami", "grade": 10, "guide": "Jebin Justin" },
  "22804": { "campusDisplayName": "Alpha Miami", "campus": "Alpha School Miami", "grade": 10, "guide": "Jebin Justin" },
  "22899": { "campusDisplayName": "Alpha Miami", "campus": "Alpha School Miami", "grade": 10, "guide": "Jebin Justin" },
  "14877": { "campusDisplayName": "Strata HS", "campus": "Strata", "grade": 10, "guide": null },
  "28756": { "campusDisplayName": "Strata HS", "campus": "Strata", "grade": 11, "guide": null },
  "14876": { "campusDisplayName": "Strata HS", "campus": "Strata", "grade": 10, "guide": null },
  "14875": { "campusDisplayName": "Strata HS", "campus": "Strata", "grade": 10, "guide": null },
  "15143": { "campusDisplayName": "Strata HS", "campus": "Strata", "grade": 10, "guide": null },
  "15145": { "campusDisplayName": "Strata HS", "campus": "Strata", "grade": 10, "guide": null },
  "15159": { "campusDisplayName": "Strata HS", "campus": "Strata", "grade": 10, "guide": null },
  "14870": { "campusDisplayName": "Strata HS", "campus": "Strata", "grade": 12, "guide": null },
  "15160": { "campusDisplayName": "Strata HS", "campus": "Strata", "grade": 10, "guide": null },
  "14871": { "campusDisplayName": "Strata HS", "campus": "Strata", "grade": 12, "guide": null },
  "14883": { "campusDisplayName": "Strata HS", "campus": "Strata", "grade": 12, "guide": null },
  "14878": { "campusDisplayName": "Strata HS", "campus": "Strata", "grade": 11, "guide": null },
  "15144": { "campusDisplayName": "Strata HS", "campus": "Strata", "grade": 10, "guide": null },
  "14873": { "campusDisplayName": "Strata HS", "campus": "Strata", "grade": 11, "guide": null },
  "14874": { "campusDisplayName": "Strata HS", "campus": "Strata", "grade": 11, "guide": null },
  "14872": { "campusDisplayName": "Strata HS", "campus": "Strata", "grade": 12, "guide": null },
  "14881": { "campusDisplayName": "Strata HS", "campus": "Strata", "grade": 12, "guide": null },
  "14884": { "campusDisplayName": "Strata HS", "campus": "Strata", "grade": 12, "guide": null },
  "14882": { "campusDisplayName": "Strata HS", "campus": "Strata", "grade": 12, "guide": null },
  "14879": { "campusDisplayName": "Strata HS", "campus": "Strata", "grade": 8, "guide": null },
  "27716": { "campusDisplayName": "GT School", "campus": "GT School", "grade": 11, "guide": null },
  "31279": { "campusDisplayName": "Alpha SB", "campus": "Alpha School Santa Barbara", "grade": 12, "guide": "Cameron Sorsby" }
};

export async function GET(request: NextRequest) {
  const results = {
    success: 0,
    errors: 0,
    notFound: 0,
    details: [] as any[],
  };

  try {
    // Procesar cada estudiante
    for (const [studentId, dimensions] of Object.entries(DIMENSIONS_DATA)) {
      try {
        const studentRef = doc(db, 'students', studentId);
        
        // Verificar que el estudiante existe
        const studentSnap = await getDoc(studentRef);
        
        if (!studentSnap.exists()) {
          results.notFound++;
          results.details.push({
            studentId,
            status: 'not_found',
            message: 'Student not found in Firestore',
          });
          continue;
        }

        // Actualizar dimensiones
        await updateDoc(studentRef, {
          dimensions: {
            ...dimensions,
            hasCompleteDimensions: true,
            lastDimensionsUpdate: new Date().toISOString(),
          },
          updatedAt: new Date().toISOString(),
        });

        results.success++;
        results.details.push({
          studentId,
          status: 'success',
          campus: dimensions.campusDisplayName,
        });

      } catch (error: any) {
        results.errors++;
        results.details.push({
          studentId,
          status: 'error',
          message: error.message,
        });
      }
    }

    // Resumen final
    return NextResponse.json({
      success: true,
      summary: {
        total: Object.keys(DIMENSIONS_DATA).length,
        successful: results.success,
        errors: results.errors,
        notFound: results.notFound,
      },
      details: results.details,
      message: `Migration complete! ${results.success}/${Object.keys(DIMENSIONS_DATA).length} students updated.`,
    });

  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        message: 'Migration failed',
      },
      { status: 500 }
    );
  }
}
