import { Student } from '@/types';
import { getTopicGrade } from './grade-maps';
import { DRI_CONFIG } from './dri-config';

/**
 * Calcula métricas DRI (Direct Instruction) según Alpha Protocol
 * 
 * MÉTRICAS IMPLEMENTADAS:
 * - DER (Debt Exposure Ratio): Proporción de deuda académica K-8
 * - PDI (Precision Decay Index): Fatiga/degradación de precisión
 * - iROI (Investment ROI): Productividad (XP por segundo)
 * - Risk Scoring: Sistema ponderado de clasificación
 * 
 * FUENTES:
 * - Technical Calculation Protocol: Math DRI Metrics
 * - Automation Threshold Roadmap
 * 
 * @param student - Objeto Student con metrics ya calculados
 * @returns DRIMetrics con tier, signal, color, y scores
 */
export function calculateDRIMetrics(student: Student) {
  const tasks = student.activity?.tasks || [];
  
  // ==========================================
  // FASE 1: DETECCIÓN DE INACTIVIDAD
  // ==========================================
  const lastActivityDate = tasks.length > 0 
    ? new Date(tasks[0].completedLocal) 
    : null;
  
  const daysSinceActivity = lastActivityDate 
    ? Math.floor((Date.now() - lastActivityDate.getTime()) / (1000 * 60 * 60 * 24))
    : Infinity;

  if (daysSinceActivity > DRI_CONFIG.INACTIVITY_DAYS_THRESHOLD) {
    return {
      iROI: null,
      debtExposure: null,
      precisionDecay: null,
      driTier: 'RED' as const,
      driSignal: 'INACTIVE',
      driColor: 'text-slate-400',
      riskScore: 100
    };
  }

  // ==========================================
  // FASE 2: DER (DEBT EXPOSURE RATIO)
  // ==========================================
  const sorted = [...tasks].sort((a, b) => 
    new Date(a.completedLocal).getTime() - new Date(b.completedLocal).getTime()
  );

  let kBelow = 0, kTotal = 0;
  
  tasks.forEach(t => {
    const accuracy = t.questionsCorrect / (t.questions || 1);
    
    // Solo contar tasks con accuracy > threshold
    if (t.topic?.name && accuracy > DRI_CONFIG.DER_MASTERY_THRESHOLD) {
      kTotal++;
      
      const topicGrade = getTopicGrade(student.currentCourse?.name, t.topic.name);
      if (topicGrade === 'K-8') {
        kBelow++;
      }
    }
  });

  // Requiere mínimo de tasks para calcular DER confiable
  const debtExposure = kTotal >= DRI_CONFIG.DER_MIN_TASKS 
    ? Math.round((kBelow / kTotal) * 100) 
    : null;

  // ==========================================
  // FASE 3: PDI (PRECISION DECAY INDEX)
  // ==========================================
  const windowSize = Math.min(
    Math.max(5, Math.ceil(sorted.length * 0.3)), 
    DRI_CONFIG.PDI_WINDOW_SIZE
  );

  const calculateErrors = (taskSlice: any[]) => {
    return taskSlice.reduce((acc, t) => {
      const actualErr = t.questions - (t.questionsCorrect || 0);
      
      if (DRI_CONFIG.PDI_NORMALIZE_DIFFICULTY) {
        const grade = getTopicGrade(student.currentCourse?.name, t.topic?.name || '');
        const difficulty = DRI_CONFIG.TOPIC_DIFFICULTY[grade] || 1.0;
        const expectedErr = t.questions * (1 - (1 / difficulty));
        return acc + (actualErr / Math.max(expectedErr, 1));
      }
      
      return acc + actualErr;
    }, 0);
  };

  const startErr = calculateErrors(sorted.slice(0, windowSize));
  const endErr = calculateErrors(sorted.slice(-windowSize));
  const precisionDecay = parseFloat(((endErr + 1) / (startErr + 1)).toFixed(2));

  // ==========================================
  // FASE 4: iROI (INVESTMENT ROI)
  // ==========================================
  const xpAwarded = student.activity?.xpAwarded || 0;
  const time = student.activity?.time || 0;
  
  const iROI = time > 0 
    ? parseFloat((xpAwarded / time).toFixed(2))
    : null;

  // ==========================================
  // FASE 5: RISK SCORING SYSTEM (PONDERADO)
  // ==========================================
  if (DRI_CONFIG.RISK_SCORING_ENABLED) {
    let riskScore = 0;
    
    // Factor 1: Debt Exposure (30%)
    if (debtExposure !== null) {
      if (debtExposure > DRI_CONFIG.DER_SEVERE_THRESHOLD) {
        riskScore += DRI_CONFIG.RISK_WEIGHTS.DEBT_EXPOSURE;
      } else if (debtExposure > DRI_CONFIG.DER_CRITICAL_THRESHOLD) {
        riskScore += Math.round(DRI_CONFIG.RISK_WEIGHTS.DEBT_EXPOSURE * 0.67);
      } else if (debtExposure > 10) {
        riskScore += Math.round(DRI_CONFIG.RISK_WEIGHTS.DEBT_EXPOSURE * 0.33);
      }
    }
    
    // Factor 2: Velocity (25%)
    const velocity = student.metrics?.velocityScore || 0;
    if (velocity < 20) {
      riskScore += DRI_CONFIG.RISK_WEIGHTS.VELOCITY;
    } else if (velocity < 50) {
      riskScore += Math.round(DRI_CONFIG.RISK_WEIGHTS.VELOCITY * 0.6);
    } else if (velocity < 80) {
      riskScore += Math.round(DRI_CONFIG.RISK_WEIGHTS.VELOCITY * 0.2);
    }
    
    // Factor 3: Precision Decay (20%)
    if (precisionDecay > DRI_CONFIG.PDI_SEVERE_THRESHOLD) {
      riskScore += DRI_CONFIG.RISK_WEIGHTS.PRECISION_DECAY;
    } else if (precisionDecay > DRI_CONFIG.PDI_CRITICAL_THRESHOLD) {
      riskScore += Math.round(DRI_CONFIG.RISK_WEIGHTS.PRECISION_DECAY * 0.5);
    }
    
    // Factor 4: KSI (15%)
    const ksi = student.metrics?.ksi || 100;
    if (ksi < DRI_CONFIG.KSI_CRITICAL_THRESHOLD) {
      riskScore += DRI_CONFIG.RISK_WEIGHTS.STABILITY;
    } else if (ksi < DRI_CONFIG.KSI_LOW_THRESHOLD) {
      riskScore += Math.round(DRI_CONFIG.RISK_WEIGHTS.STABILITY * 0.53);
    }
    
    // Factor 5: Stall Status (10%)
    if (student.metrics?.stallStatus === 'Frustrated Stall') {
      riskScore += DRI_CONFIG.RISK_WEIGHTS.STALL_STATUS;
    }
    
    riskScore = Math.min(riskScore, 100);
    
    // ==========================================
    // CLASIFICACIÓN FINAL
    // ==========================================
    let driTier: 'RED' | 'YELLOW' | 'GREEN';
    let driSignal: string;
    let driColor: string;
    
    if (riskScore >= DRI_CONFIG.RISK_RED_THRESHOLD) {
      driTier = 'RED';
      
      // Determinar señal específica
      if (debtExposure && debtExposure > DRI_CONFIG.DER_CRITICAL_THRESHOLD) {
        driSignal = 'Critical Debt';
      } else if (velocity < 30) {
        driSignal = 'Low Velocity';
      } else {
        driSignal = 'High Risk';
      }
      
      driColor = 'text-red-500';
      
    } else if (riskScore >= DRI_CONFIG.RISK_YELLOW_THRESHOLD) {
      driTier = 'YELLOW';
      
      // Determinar señal específica
      if (precisionDecay > DRI_CONFIG.PDI_CRITICAL_THRESHOLD) {
        driSignal = 'Fatigue Risk';
      } else if (ksi < DRI_CONFIG.KSI_LOW_THRESHOLD) {
        driSignal = 'Stability Risk';
      } else {
        driSignal = 'Watch List';
      }
      
      driColor = 'text-amber-500';
      
    } else {
      driTier = 'GREEN';
      driSignal = 'Flowing';
      driColor = 'text-emerald-500';
    }
    
    return { 
      iROI, 
      debtExposure, 
      precisionDecay, 
      driTier, 
      driSignal,
      driColor,
      riskScore
    };
  }

  // ==========================================
  // FALLBACK: LEGACY LOGIC (SI RISK SCORING DESACTIVADO)
  // ==========================================
  let driTier: 'RED' | 'YELLOW' | 'GREEN' = 'GREEN';
  let driSignal = 'Flowing';
  let driColor = 'text-emerald-500';

  if (
    (debtExposure !== null && debtExposure > DRI_CONFIG.DER_CRITICAL_THRESHOLD) ||
    student.metrics?.stallStatus === 'Frustrated Stall' ||
    (student.metrics?.velocityScore || 0) < 30
  ) {
    driTier = 'RED';
    driSignal = 'Critical Debt';
    driColor = 'text-red-500';
  } else if (
    precisionDecay > DRI_CONFIG.PDI_CRITICAL_THRESHOLD ||
    (student.metrics?.ksi || 100) < DRI_CONFIG.KSI_LOW_THRESHOLD
  ) {
    driTier = 'YELLOW';
    driSignal = 'Stability Risk';
    driColor = 'text-amber-500';
  }

  return { 
    iROI, 
    debtExposure, 
    precisionDecay, 
    driTier, 
    driSignal,
    driColor,
    riskScore: undefined
  };
}
