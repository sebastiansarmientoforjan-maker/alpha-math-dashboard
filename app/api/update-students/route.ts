import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, writeBatch, getDoc, setDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { getStudentData } from '@/lib/mathAcademyAPI';
import { calculateTier1Metrics } from '@/lib/metrics';
import { calculateDRIMetrics } from '@/lib/dri-calculus';
import studentIds from '@/lib/student_ids.json'; 

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;
export const runtime = 'nodejs';
export const maxDuration = 60;

type DRITier = 'RED' | 'YELLOW' | 'GREEN';

interface TierChangeAlert {
  studentId: string;
  studentName: string;
  studentCourse: string;
  previousTier: DRITier;
  newTier: DRITier;
  direction: 'improved' | 'worsened';
  metricsSnapshot: {
    rsr: number;
    ksi: number | null;
    velocity: number;
    riskScore: number;
    der: number | null;
    pdi: number | null;
  };
  previousMetrics: {
    rsr: number;
    ksi: number | null;
    velocity: number;
    riskScore: number;
  };
  acknowledged: boolean;
  acknowledgedAt: null;
  acknowledgedBy: null;
  emailSent: boolean;
  emailSentAt: null;
  createdAt: ReturnType<typeof serverTimestamp>;
  syncBatchId: string;
}

function getChangeDirection(previousTier: DRITier, newTier: DRITier): 'improved' | 'worsened' {
  const tierOrder: Record<DRITier, number> = { 'RED': 0, 'YELLOW': 1, 'GREEN': 2 };
  return tierOrder[newTier] > tierOrder[previousTier] ? 'improved' : 'worsened';
}

async function createTierChangeAlert(
  studentId: string,
  studentName: string,
  studentCourse: string,
  previousTier: DRITier,
  newTier: DRITier,
  currentMetrics: any,
  currentDRI: any,
  previousMetrics: any,
  syncBatchId: string
): Promise<void> {
  const alert: TierChangeAlert = {
    studentId,
    studentName,
    studentCourse,
    previousTier,
    newTier,
    direction: getChangeDirection(previousTier, newTier),
    metricsSnapshot: {
      rsr: currentMetrics.lmp || 0,
      ksi: currentMetrics.ksi,
      velocity: currentMetrics.velocityScore || 0,
      riskScore: currentDRI.riskScore || 0,
      der: currentDRI.debtExposure,
      pdi: currentDRI.precisionDecay,
    },
    previousMetrics: {
      rsr: previousMetrics?.lmp || 0,
      ksi: previousMetrics?.ksi || null,
      velocity: previousMetrics?.velocityScore || 0,
      riskScore: previousMetrics?.riskScore || 0,
    },
    acknowledged: false,
    acknowledgedAt: null,
    acknowledgedBy: null,
    emailSent: false,
    emailSentAt: null,
    createdAt: serverTimestamp(),
    syncBatchId,
  };

  try {
    await addDoc(collection(db, 'alerts'), alert);
    console.log(`[ALERT] Tier change: ${studentName} ${previousTier} → ${newTier}`);
  } catch (error) {
    console.error(`[ALERT] Failed to create alert for ${studentName}:`, error);
  }
}

export async function GET(request: Request) {
  const requestTimestamp = new Date().toISOString();
  const syncBatchId = `sync_${Date.now()}`;
  console.log(`[update-students] Request started at ${requestTimestamp}, batchId: ${syncBatchId}`);

  try {
    const stateRef = doc(db, 'system', 'scheduler_state');
    const stateSnap = await getDoc(stateRef);
    let startIndex = stateSnap.exists() ? stateSnap.data().lastIndex || 0 : 0;

    if (startIndex >= studentIds.length) startIndex = 0;

    const endIndex = Math.min(startIndex + 50, studentIds.length);
    const currentBatchIds = studentIds.slice(startIndex, endIndex);

    console.log(`[update-students] Processing batch: ${startIndex} to ${endIndex} (${currentBatchIds.length} students)`);

    const alertsCreated: string[] = [];

    const updates = await Promise.all(
      currentBatchIds.map(async (id) => {
        try {
          const studentRef = doc(db, 'students', id.toString());
          const existingDoc = await getDoc(studentRef);
          const existingData = existingDoc.exists() ? existingDoc.data() : null;
          const previousTier: DRITier | null = existingData?.dri?.driTier || null;
          const previousMetrics = existingData?.metrics || null;
          const previousRiskScore = existingData?.dri?.riskScore || 0;

          const rawData = await getStudentData(id.toString());
          if (!rawData) {
            console.warn(`[update-students] No data for student ${id}`);
            return null;
          }

          const metrics = calculateTier1Metrics(rawData, rawData.activity || { tasks: [] });
          const dri = calculateDRIMetrics({ ...rawData, metrics });

          const newTier: DRITier = dri.driTier;

          if (previousTier && previousTier !== newTier) {
            await createTierChangeAlert(
              id.toString(),
              `${rawData.firstName} ${rawData.lastName}`,
              rawData.currentCourse?.name || 'Unknown',
              previousTier,
              newTier,
              metrics,
              dri,
              { ...previousMetrics, riskScore: previousRiskScore },
              syncBatchId
            );
            alertsCreated.push(`${rawData.firstName} ${rawData.lastName}: ${previousTier} → ${newTier}`);
          }

          return { 
            id: id.toString(), 
            data: { 
              ...rawData, 
              metrics,
              dri,
              lastUpdated: new Date().toISOString() 
            },
            studentName: `${rawData.firstName} ${rawData.lastName}`
          };
        } catch (e) {
          console.error(`[update-students] Error processing student ${id}:`, e);
          return null;
        }
      })
    );

    const batch = writeBatch(db);
    const todayStr = new Date().toISOString().split('T')[0];
    let lastStudentName = '';
    let successCount = 0;

    updates.forEach((item) => {
      if (item) {
        const ref = doc(db, 'students', item.id);
        batch.set(ref, item.data, { merge: true });
        
        const historyRef = doc(db, 'students', item.id, 'history', todayStr);
        batch.set(historyRef, {
            date: todayStr,
            metrics: item.data.metrics,
            dri: item.data.dri,
            courseName: item.data.currentCourse?.name
        }, { merge: true });
        
        lastStudentName = item.studentName;
        successCount++;
      }
    });

    await batch.commit();
    
    await setDoc(stateRef, { 
      lastIndex: endIndex, 
      total: studentIds.length,
      lastUpdated: new Date().toISOString(),
      lastBatchSuccess: successCount,
      lastSyncBatchId: syncBatchId,
      alertsCreatedThisBatch: alertsCreated.length
    }, { merge: true });

    const progress = Math.round((endIndex / studentIds.length) * 100);

    console.log(`[update-students] Batch completed: ${successCount}/${currentBatchIds.length} successful, progress: ${progress}%, alerts: ${alertsCreated.length}`);

    return NextResponse.json({ 
      success: true, 
      progress,
      nextIndex: endIndex,
      lastStudentName,
      batchSize: currentBatchIds.length,
      successCount,
      currentBatch: Math.ceil(endIndex / 50),
      totalBatches: Math.ceil(studentIds.length / 50),
      timestamp: requestTimestamp,
      syncBatchId,
      alertsCreated: alertsCreated.length,
      alerts: alertsCreated
    });

  } catch (error: any) {
    console.error('[update-students] Fatal error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message,
      progress: 0,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
