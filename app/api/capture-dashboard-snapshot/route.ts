import { NextResponse } from 'next/server';
// IMPORTANTE: Cambiamos a la instancia Admin para tener privilegios de escritura root
import { db } from '@/lib/firebase-admin'; 
import { calculateTier1Metrics } from '@/lib/metrics';
import { calculateDRIMetrics } from '@/lib/dri-calculus';
import { getStudentDimension } from '@/lib/student-dimensions';

export const dynamic = 'force-dynamic';

interface CampusSnapshot {
  totalStudents: number;
  avgRSR: number;
  avgVelocity: number;
  avgKSI: number;
  avgRiskScore: number;
  tierDistribution: { RED: number; YELLOW: number; GREEN: number };
  avgDER: number | null;
  avgPDI: number | null;
}

interface TopicScore {
  topic: string;
  avgRSR: number;
  studentCount: number;
}

interface DashboardSnapshot {
  date: string;
  timestamp: Date;
  global: CampusSnapshot & {
    topTopics: TopicScore[];
    bottomTopics: TopicScore[];
  };
  campuses: Record<string, CampusSnapshot>;
  capturedAt: Date;
  studentsProcessed: number;
}

export async function GET() {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  
  // Inicializamos el objeto de resultados
  const results = {
    success: false,
    date: dateStr,
    studentsProcessed: 0,
    snapshotId: '',
    error: null as string | null,
  };

  try {
    console.log(`[SNAPSHOT] Starting dashboard snapshot for ${dateStr} using Admin SDK`);

    // 1. Obtener estudiantes usando sintaxis Admin SDK
    const studentsRef = db.collection('students');
    const studentsSnapshot = await studentsRef.get();
    
    const students = studentsSnapshot.docs.map(doc => {
      const data = doc.data();
      const metrics = calculateTier1Metrics(data, data.activity);
      
      // Cálculo de DRI con cast para cumplir interfaz
      const dri = calculateDRIMetrics({ id: doc.id, ...data, metrics } as any);
      
      return {
        id: doc.id,
        ...data,
        metrics,
        dri,
        campus: getStudentDimension(doc.id, 'campus'),
      };
    });

    results.studentsProcessed = students.length;

    // 2. Calcular métricas globales
    const globalMetrics = calculateSnapshotMetrics(students);

    // 3. Calcular métricas por campus
    const campuses: Record<string, CampusSnapshot> = {};
    const campusGroups = students.reduce((acc, s) => {
      const campus = s.campus || 'Online (No Campus)';
      if (!acc[campus]) acc[campus] = [];
      acc[campus].push(s);
      return acc;
    }, {} as Record<string, any[]>);

    for (const [campusName, campusStudents] of Object.entries(campusGroups)) {
      campuses[campusName] = calculateSnapshotMetrics(campusStudents);
    }

    // 4. Top/Bottom topics
    const topicScores = calculateTopicScores(students);
    const sortedTopics = topicScores.sort((a, b) => b.avgRSR - a.avgRSR);

    // 5. Construir snapshot
    const snapshot: DashboardSnapshot = {
      date: dateStr,
      timestamp: now,
      global: {
        ...globalMetrics,
        topTopics: sortedTopics.slice(0, 10),
        bottomTopics: sortedTopics.slice(-10).reverse(),
      },
      campuses,
      capturedAt: now,
      studentsProcessed: students.length,
    };

    // 6. Guardar en Firestore usando Admin SDK
    await db.collection('dashboard_snapshots').doc(dateStr).set({
      ...snapshot,
      // Admin SDK prefiere Dates nativos o Timestamps explícitos
      capturedAt: new Date(), 
    });

    results.success = true;
    results.snapshotId = dateStr;

    console.log(`[SNAPSHOT] ✅ Snapshot saved: ${dateStr}, ${students.length} students`);

    return NextResponse.json({
      ...results,
      preview: {
        global: snapshot.global,
        campusCount: Object.keys(campuses).length,
      },
    });

  } catch (error: any) {
    console.error('[SNAPSHOT] Fatal error:', error);
    results.error = error.message;
    // Forzamos success a false en caso de error
    results.success = false;
    
    return NextResponse.json({
      ...results,
    }, { status: 500 });
  }
}

// ==========================================
// HELPER FUNCTIONS
// ==========================================

function calculateSnapshotMetrics(students: any[]): CampusSnapshot {
  if (students.length === 0) {
    return {
      totalStudents: 0,
      avgRSR: 0,
      avgVelocity: 0,
      avgKSI: 0,
      avgRiskScore: 0,
      tierDistribution: { RED: 0, YELLOW: 0, GREEN: 0 },
      avgDER: null,
      avgPDI: null,
    };
  }

  const validKSI = students.filter(s => s.metrics?.ksi !== null);
  const validDER = students.filter(s => s.dri?.debtExposure !== null);
  const validPDI = students.filter(s => s.dri?.precisionDecay !== null);

  return {
    totalStudents: students.length,
    avgRSR: Math.round(
      students.reduce((sum, s) => sum + (s.metrics?.lmp || 0) * 100, 0) / students.length
    ),
    avgVelocity: Math.round(
      students.reduce((sum, s) => sum + (s.metrics?.velocityScore || 0), 0) / students.length
    ),
    avgKSI: validKSI.length > 0
      ? Math.round(validKSI.reduce((sum, s) => sum + (s.metrics?.ksi || 0), 0) / validKSI.length)
      : 0,
    avgRiskScore: Math.round(
      students.reduce((sum, s) => sum + (s.dri?.riskScore || 0), 0) / students.length
    ),
    tierDistribution: {
      RED: students.filter(s => s.dri?.driTier === 'RED').length,
      YELLOW: students.filter(s => s.dri?.driTier === 'YELLOW').length,
      GREEN: students.filter(s => s.dri?.driTier === 'GREEN').length,
    },
    avgDER: validDER.length > 0
      ? Math.round(validDER.reduce((sum, s) => sum + (s.dri?.debtExposure || 0), 0) / validDER.length)
      : null,
    avgPDI: validPDI.length > 0
      ? parseFloat((validPDI.reduce((sum, s) => sum + (s.dri?.precisionDecay || 0), 0) / validPDI.length).toFixed(2))
      : null,
  };
}

function calculateTopicScores(students: any[]): TopicScore[] {
  const topicMap = new Map<string, { totalRSR: number; count: number }>();

  students.forEach(student => {
    const tasks = student.activity?.tasks || [];
    tasks.forEach((task: any) => {
      const topicName = task.topic?.name;
      if (!topicName) return;

      const accuracy = task.questionsCorrect / (task.questions || 1);
      if (accuracy > 0.8) {
        const existing = topicMap.get(topicName) || { totalRSR: 0, count: 0 };
        topicMap.set(topicName, {
          totalRSR: existing.totalRSR + accuracy,
          count: existing.count + 1,
        });
      }
    });
  });

  return Array.from(topicMap.entries())
    .map(([topic, data]) => ({
      topic,
      avgRSR: Math.round((data.totalRSR / data.count) * 100),
      studentCount: data.count,
    }))
    .filter(t => t.studentCount >= 5);
}
