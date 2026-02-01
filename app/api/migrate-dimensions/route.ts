import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, updateDoc, getDoc } from 'firebase/firestore';

// Datos de dimensiones de los 81 estudiantes (del Excel) - SIN DUPLICADOS
const DIMENSIONS_DATA: Record<string, {
  campusDisplayName: string;
  campus: string;
  grade: number;
  guide: string | null;
}> = {
  "6619": { "campusDisplayName": "Alpha Austin", "campus": "Alpha High School", "grade": 9, "guide": "Emily Findley" },
  "11890": { "campusDisplayName": "Alpha Austin", "campus": "Alpha High School", "grade": 9, "guide": "Effy Phillips" },
  "24003": { "campusDisplayName": "Alpha SF", "campus": "Alpha School San Francisco", "grade": 11, "guide": "Cameron Sorsby" },
  "5440": { "campusDisplayName": "Alpha Austin", "campus": "Alpha High School", "grade": 12, "guide": "Cameron Sorsby" },
  "23887": { "campusDisplayName": "Strata HS", "campus": "Strata", "grade": 11, "guide": null },
  "6620": { "campusDisplayName": "Alpha Austin", "campus": "Alpha High School", "grade": 9, "guide": "Emily Findley" },
  "18487": { "campusDisplayName": "Alpha Austin", "campus": "Alpha High School", "grade": 11, "guide": "Chloe Belvin" },
  "17693": { "campusDisplayName": "Alpha Austin", "campus": "Alpha High School", "grade": 10, "guide": "Effy Phillips" },
  "27426": { "campusDisplayName": "Alpha Austin", "campus": "Alpha High School", "grade": 10, "guide": "Jebin Justin" },
  "17725": { "campusDisplayName": "Alpha Austin", "campus": "Alpha High School", "grade": 9, "guide": "Jebin Justin" },
  "5430": { "campusDisplayName": "Alpha Austin", "campus": "Alpha High School", "grade": 11, "guide": "Cameron Sorsby" },
  "10385": { "campusDisplayName": "Alpha Austin", "campus": "Alpha High School", "grade": 9, "guide": "Effy Phillips" },
  "22354": { "campusDisplayName": "Alpha Miami", "campus": "Alpha School Miami", "grade": 9, "guide": "Logan higuera" },
  "6911": { "campusDisplayName": "Alpha Austin", "campus": "Alpha High School", "grade": 9, "guide": "Effy Phillips" },
  "22599": { "campusDisplayName": "Strata HS", "campus": "Strata", "grade": 9, "guide": null },
  "5431": { "campusDisplayName": "Alpha Austin", "campus": "Alpha High School", "grade": 11, "guide": "Emily Findley" },
  "23439": { "campusDisplayName": "Strata HS", "campus": "Strata", "grade": 9, "guide": null },
  "27418": { "campusDisplayName": "Strata HS", "campus": "Strata", "grade": 10, "guide": null },
  "5432": { "campusDisplayName": "Alpha Austin", "campus": "Alpha High School", "grade": 11, "guide": "Emily Findley" },
  "22598": { "campusDisplayName": "Strata HS", "campus": "Strata", "grade": 9, "guide": null },
  "27868": { "campusDisplayName": "Strata HS", "campus": "Strata", "grade": 8, "guide": null },
  "8245": { "campusDisplayName": "Alpha Austin", "campus": "Alpha High School", "grade": 10, "guide": "Chloe Belvin" },
  "9018": { "campusDisplayName": "Alpha Austin", "campus": "Alpha High School", "grade": 11, "guide": "Cameron Sorsby" },
  "5437": { "campusDisplayName": "Alpha Austin", "campus": "Alpha High School", "grade": 12, "guide": "Cameron Sorsby" },
  "5433": { "campusDisplayName": "Alpha Austin", "campus": "Alpha High School", "grade": 12, "guide": "Jebin Justin" },
  "5425": { "campusDisplayName": "Alpha Austin", "campus": "Alpha High School", "grade": 10, "guide": "Chloe Belvin" },
  "14801": { "campusDisplayName": "Alpha Austin", "campus": "Alpha High School", "grade": 9, "guide": "Chloe Belvin" },
  "20131": { "campusDisplayName": "Alpha Miami", "campus": "Alpha School Miami", "grade": 10, "guide": "Emily Findley" },
  "17901": { "campusDisplayName": "Alpha Austin", "campus": "Alpha High School", "grade": 9, "guide": "Jebin Justin" },
  "16616": { "campusDisplayName": "Alpha Austin", "campus": "Alpha High School", "grade": 11, "guide": "Effy Phillips" },
  "6622": { "campusDisplayName": "Alpha Austin", "campus": "Alpha High School", "grade": 9, "guide": "Cameron Sorsby" },
  "21809": { "campusDisplayName": "Alpha Austin", "campus": "Alpha High School", "grade": 9, "guide": "Jebin Justin" },
  "6912": { "campusDisplayName": "Alpha Austin", "campus": "Alpha High School", "grade": 9, "guide": "Jebin Justin" },
  "21843": { "campusDisplayName": "Alpha Miami", "campus": "Alpha School Miami", "grade": 9, "guide": "Logan higuera" },
  "23440": { "campusDisplayName": "Strata HS", "campus": "Strata", "grade": 10, "guide": null },
  "30653": { "campusDisplayName": "Strata HS", "campus": "Strata", "grade": 11, "guide": null },
  "21841": { "campusDisplayName": "Alpha Miami", "campus": "Alpha School Miami", "grade": 9, "guide": "Logan higuera" },
  "22600": { "campusDisplayName": "Strata HS", "campus": "Strata", "grade": 9, "guide": null },
  "5426": { "campusDisplayName": "Alpha Austin", "campus": "Alpha High School", "grade": 10, "guide": "Cameron Sorsby" },
  "22614": { "campusDisplayName": "Strata HS", "campus": "Strata", "grade": 10, "guide": null },
  "13625": { "campusDisplayName": "Alpha Austin", "campus": "Alpha High School", "grade": 9, "guide": "Emily Findley" },
  "5504": { "campusDisplayName": "GT School", "campus": "GT School", "grade": 9, "guide": null },
  "23109": { "campusDisplayName": "Strata HS", "campus": "Strata", "grade": 10, "guide": null },
  "17357": { "campusDisplayName": "Alpha Austin", "campus": "Alpha High School", "grade": 11, "guide": "Emily Findley" },
  "21477": { "campusDisplayName": "Alpha Austin", "campus": "Alpha High School", "grade": 9, "guide": "Effy Phillips" },
  "21815": { "campusDisplayName": "Alpha Miami", "campus": "Alpha School Miami", "grade": 10, "guide": "Logan higuera" },
  "21842": { "campusDisplayName": "Alpha Miami", "campus": "Alpha School Miami", "grade": 9, "guide": "Logan higuera" },
  "30640": { "campusDisplayName": "Strata HS", "campus": "Strata", "grade": 11, "guide": null },
  "10258": { "campusDisplayName": "Alpha Austin", "campus": "Alpha High School", "grade": 10, "guide": "Effy Phillips" },
  "30704": { "campusDisplayName": "Strata HS", "campus": "Strata", "grade": 9, "guide": null },
  "17000": { "campusDisplayName": "Alpha Austin", "campus": "Alpha High School", "grade": 10, "guide": "Effy Phillips" },
  "24943": { "campusDisplayName": "Strata HS", "campus": "Strata", "grade": 9, "guide": null },
  "21884": { "campusDisplayName": "Alpha SB", "campus": "Alpha School Santa Barbara", "grade": 9, "guide": "Jebin Justin" },
  "5428": { "campusDisplayName": "Alpha Austin", "campus": "Alpha High School", "grade": 10, "guide": "Emily Findley" },
  "19828": { "campusDisplayName": "Alpha Miami", "campus": "Alpha School Miami", "grade": 9, "guide": "Logan higuera" },
  "5438": { "campusDisplayName": "Alpha Austin", "campus": "Alpha High School", "grade": 12, "guide": null },
  "5434": { "campusDisplayName": "Alpha Austin", "campus": "Alpha High School", "grade": 12, "guide": "Cameron Sorsby" },
  "21808": { "campusDisplayName": "Alpha Austin", "campus": "Alpha High School", "grade": 11, "guide": "Chloe Belvin" },
  "17026": { "campusDisplayName": "Alpha Austin", "campus": "Alpha High School", "grade": 11, "guide": "Emily Findley" },
  "17191": { "campusDisplayName": "Alpha Austin", "campus": "Alpha High School", "grade": 9, "guide": "Emily Findley" },
  "5427": { "campusDisplayName": "Alpha Austin", "campus": "Alpha High School", "grade": 10, "guide": "Effy Phillips" },
  "16786": { "campusDisplayName": "Alpha Austin", "campus": "Alpha High School", "grade": 10, "guide": "Emily Findley" },
  "13262": { "campusDisplayName": "Alpha Austin", "campus": "Alpha High School", "grade": 11, "guide": "Chloe Belvin" },
  "22601": { "campusDisplayName": "Strata HS", "campus": "Strata", "grade": 9, "guide": null },
  "22352": { "campusDisplayName": "Alpha Austin", "campus": "Alpha High School", "grade": 9, "guide": "Emily Findley" },
  "5441": { "campusDisplayName": "Alpha Austin", "campus": "Alpha High School", "grade": 12, "guide": "Cameron Sorsby" },
  "23441": { "campusDisplayName": "Strata HS", "campus": "Strata", "grade": 9, "guide": null },
  "20875": { "campusDisplayName": "Alpha Austin", "campus": "Alpha High School", "grade": 9, "guide": "Jebin Justin" },
  "24015": { "campusDisplayName": "Alpha Austin", "campus": "Alpha High School", "grade": 10, "guide": "Cameron Sorsby" },
  "5435": { "campusDisplayName": "Alpha Austin", "campus": "Alpha High School", "grade": 11, "guide": "Chloe Belvin" },
  "22603": { "campusDisplayName": "Strata HS", "campus": "Strata", "grade": 9, "guide": null },
  "5439": { "campusDisplayName": "Alpha Austin", "campus": "Alpha High School", "grade": 12, "guide": "Cameron Sorsby" },
  "17295": { "campusDisplayName": "Alpha Austin", "campus": "Alpha High School", "grade": 11, "guide": "Emily Findley" },
  "13077": { "campusDisplayName": "Alpha Austin", "campus": "Alpha High School", "grade": 10, "guide": "Effy Phillips" },
  "21807": { "campusDisplayName": "Alpha Austin", "campus": "Alpha High School", "grade": 10, "guide": "Chloe Belvin" },
  "16513": { "campusDisplayName": "Alpha Miami", "campus": "Alpha School Miami", "grade": 9, "guide": "Logan higuera" },
  "22602": { "campusDisplayName": "Strata HS", "campus": "Strata", "grade": 9, "guide": null },
  "8244": { "campusDisplayName": "Alpha Austin", "campus": "Alpha High School", "grade": 12, "guide": null },
  "17356": { "campusDisplayName": "Alpha Austin", "campus": "Alpha High School", "grade": 9, "guide": "Jebin Justin" },
  "11975": { "campusDisplayName": "Alpha Austin", "campus": "Alpha High School", "grade": 9, "guide": "Jebin Justin" },
  "26593": { "campusDisplayName": "Alpha Miami", "campus": "Alpha School Miami", "grade": 9, "guide": "Logan higuera" }
};

export async function GET(request: NextRequest) {
  const results = {
    success: 0,
    errors: 0,
    notFound: 0,
    details: [] as any[],
  };

  try {
    for (const [studentId, dimensions] of Object.entries(DIMENSIONS_DATA)) {
      try {
        const studentRef = doc(db, 'students', studentId);
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
