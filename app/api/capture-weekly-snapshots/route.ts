import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, updateDoc, doc, getDoc } from 'firebase/firestore';
import { TrackingStatus, MetricsSnapshot } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  const now = new Date();
  const results = {
    processed: 0,
    snapshotsCaptured: 0,
    completed: 0,
    errors: [] as string[],
  };

  try {
    // Obtener todos los trackings activos
    const trackingsQuery = query(
      collection(db, 'intervention_tracking'),
      where('status', '==', 'active' as TrackingStatus)
    );

    const trackingsSnapshot = await getDocs(trackingsQuery);

    if (trackingsSnapshot.empty) {
      return NextResponse.json({
        success: true,
        message: 'No active trackings to process',
        ...results,
      });
    }

    for (const trackingDoc of trackingsSnapshot.docs) {
      results.processed++;
      const tracking = trackingDoc.data();
      const trackingId = trackingDoc.id;

      try {
        // Verificar si es momento de capturar (nextSnapshotDate <= now)
        const nextSnapshotDate = tracking.nextSnapshotDate?.toDate?.() || new Date(tracking.nextSnapshotDate);
        
        if (nextSnapshotDate > now) {
          continue; // No es momento de capturar aún
        }

        // Obtener datos actuales del estudiante
        const studentDoc = await getDoc(doc(db, 'students', tracking.studentId));
        
        if (!studentDoc.exists()) {
          results.errors.push(`Student ${tracking.studentId} not found`);
          continue;
        }

        const student = studentDoc.data();

        // Crear nuevo snapshot
        const newSnapshot: MetricsSnapshot = {
          rsr: student.metrics?.lmp || 0,
          ksi: student.metrics?.ksi || null,
          velocity: student.metrics?.velocityScore || 0,
          riskScore: student.dri?.riskScore || 0,
          der: student.dri?.debtExposure || null,
          pdi: student.dri?.precisionDecay || null,
          tier: student.dri?.driTier || 'GREEN',
          capturedAt: now,
        };

        // Agregar snapshot al array
        const weeklySnapshots = [...(tracking.weeklySnapshots || []), newSnapshot];

        // Calcular próxima fecha de snapshot (7 días)
        const nextDate = new Date(now);
        nextDate.setDate(nextDate.getDate() + 7);

        // Determinar si el tracking está completo
        const periodWeeks = parseInt(tracking.period.split('_')[0]); // '4_weeks' -> 4
        const isComplete = weeklySnapshots.length >= periodWeeks;

        // Calcular outcome si está completo
        let updateData: any = {
          weeklySnapshots,
          nextSnapshotDate: nextDate,
        };

        if (isComplete) {
          const baseline = tracking.baselineSnapshot;
          const final = newSnapshot;

          const rsrDelta = (final.rsr - baseline.rsr) * 100;
          const ksiDelta = (baseline.ksi !== null && final.ksi !== null) 
            ? final.ksi - baseline.ksi 
            : null;
          const velocityDelta = final.velocity - baseline.velocity;
          const riskScoreDelta = final.riskScore - baseline.riskScore;
          const tierChange = baseline.tier !== final.tier 
            ? `${baseline.tier} → ${final.tier}` 
            : null;

          // Determinar outcome basado en métricas clave
          let outcome: 'improved' | 'stable' | 'worsened' = 'stable';
          
          // Mejoró si: RSR subió >5% O riskScore bajó >10 O tier mejoró
          if (rsrDelta > 5 || riskScoreDelta < -10 || 
              (tierChange && (baseline.tier === 'RED' && final.tier !== 'RED'))) {
            outcome = 'improved';
          }
          // Empeoró si: RSR bajó >5% O riskScore subió >10 O tier empeoró
          else if (rsrDelta < -5 || riskScoreDelta > 10 ||
              (tierChange && (final.tier === 'RED' && baseline.tier !== 'RED'))) {
            outcome = 'worsened';
          }

          updateData = {
            ...updateData,
            status: 'completed' as TrackingStatus,
            completedAt: now,
            outcome,
            outcomeDetails: {
              rsrDelta: Math.round(rsrDelta * 10) / 10,
              ksiDelta,
              velocityDelta,
              riskScoreDelta,
              tierChange,
            },
          };

          results.completed++;
        }

        // Actualizar documento
        await updateDoc(doc(db, 'intervention_tracking', trackingId), updateData);
        results.snapshotsCaptured++;

      } catch (err: any) {
        results.errors.push(`Tracking ${trackingId}: ${err.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${results.processed} trackings`,
      ...results,
    });

  } catch (error: any) {
    console.error('[SNAPSHOTS] Fatal error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      ...results,
    }, { status: 500 });
  }
}
