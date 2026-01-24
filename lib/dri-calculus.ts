import { Student } from '@/types';
import { getTopicGrade } from './grade-maps';
import { DRI_CONFIG } from './dri-config';

/**
 * Calcula métricas DRI (Direct Instruction) según Alpha Protocol
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
    if (t.topic?.name && accuracy > DRI_CONFIG.DER_MASTERY_THRESHOLD) {
      kTotal++;
      const topicGrade = getTopicGrade(student.currentCourse?.name, t.topic.name);
      if (topicGrade === 'K-8') {
        kBelow++;
      }
    }
  });

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
  // FASE 5: RISK SCORING SYSTEM (PONDERADO + RSR GATEKEEPER)
  // ==========================================
  let riskScore = 0;
  let driTier: 'RED' | 'YELLOW' | 'GREEN';
  let driSignal: string;
  let driColor: string;

  // 1. Calcular Risk Score Base (Indicadores generales)
  if (DRI_CONFIG.RISK_SCORING_ENABLED) {
    if (debtExposure !== null) {
      if (debtExposure > DRI_CONFIG.DER_SEVERE_THRESHOLD) riskScore += DRI_CONFIG.RISK_WEIGHTS.DEBT_EXPOSURE;
      else if (debtExposure > DRI_CONFIG.DER_CRITICAL_THRESHOLD) riskScore += Math.round(DRI_CONFIG.RISK_WEIGHTS.DEBT_EXPOSURE * 0.67);
      else if (debtExposure > 10) riskScore += Math.round(DRI_CONFIG.RISK_WEIGHTS.DEBT_EXPOSURE * 0.33);
    }
    
    const velocity = student.metrics?.velocityScore || 0;
    if (velocity < 20) riskScore += DRI_CONFIG.RISK_WEIGHTS.VELOCITY;
    else if (velocity < 50) riskScore += Math.round(DRI_CONFIG.RISK_WEIGHTS.VELOCITY * 0.6);
    else if (velocity < 80) riskScore += Math.round(DRI_CONFIG.RISK_WEIGHTS.VELOCITY * 0.2);
    
    if (precisionDecay > DRI_CONFIG.PDI_SEVERE_THRESHOLD) riskScore += DRI_CONFIG.RISK_WEIGHTS.PRECISION_DECAY;
    else if (precisionDecay > DRI_CONFIG.PDI_CRITICAL_THRESHOLD) riskScore += Math.round(DRI_CONFIG.RISK_WEIGHTS.PRECISION_DECAY * 0.5);
    
    const ksi = student.metrics?.ksi || 100;
    if (ksi < DRI_CONFIG.KSI_CRITICAL_THRESHOLD) riskScore += DRI_CONFIG.RISK_WEIGHTS.STABILITY;
    else if (ksi < DRI_CONFIG.KSI_LOW_THRESHOLD) riskScore += Math.round(DRI_CONFIG.RISK_WEIGHTS.STABILITY * 0.53);
    
    if (student.metrics?.stallStatus === 'Frustrated Stall') riskScore += DRI_CONFIG.RISK_WEIGHTS.STALL_STATUS;
    
    riskScore = Math.min(riskScore, 100);
  }

  // 2. LÓGICA DE CLASIFICACIÓN CON RSR GATEKEEPER
  const rsr = (student.metrics.lmp || 0) * 100; // RSR en porcentaje

  if (rsr < 60) {
    // CASO: RSR Crítico (< 60%)
    if (riskScore >= DRI_CONFIG.RISK_YELLOW_THRESHOLD) {
       // SUB-CASO: Otros indicadores malos (Risk Score alto) -> ROJO
       driTier = 'RED';
       driSignal = 'Critical Failure';
       driColor = 'text-red-500';
       riskScore = Math.max(riskScore, 75); // Forzar score de riesgo alto
    } else {
       // SUB-CASO: Otros indicadores buenos (Risk Score bajo) -> AMARILLO
       driTier = 'YELLOW';
       driSignal = 'Low Accuracy';
       driColor = 'text-amber-500';
       riskScore = Math.max(riskScore, 45); // Forzar score de advertencia
    }
  } else {
    // CASO: RSR Saludable (>= 60%) -> Usar lógica estándar por Score
    if (riskScore >= DRI_CONFIG.RISK_RED_THRESHOLD) {
      driTier = 'RED';
      driSignal = 'High Risk';
      driColor = 'text-red-500';
    } else if (riskScore >= DRI_CONFIG.RISK_YELLOW_THRESHOLD) {
      driTier = 'YELLOW';
      driSignal = 'Watch List';
      driColor = 'text-amber-500';
    } else {
      driTier = 'GREEN';
      driSignal = 'Flowing';
      driColor = 'text-emerald-500';
    }
  }

  // Refinamiento de señal para casos específicos estándar
  if (driTier === 'RED' && !driSignal.includes('Critical')) {
     if (debtExposure && debtExposure > DRI_CONFIG.DER_CRITICAL_THRESHOLD) driSignal = 'Critical Debt';
     else if ((student.metrics?.velocityScore || 0) < 30) driSignal = 'Low Velocity';
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
