// lib/dri-calculus.ts
import { Student, Task } from '@/types';
import { getTopicGrade } from './grade-maps';

export interface DRIMetrics {
  iROI: number;        
  debtExposure: number;   
  precisionDecay: number;    
  reMasteryFriction: number; 
  driTier: 'RED' | 'YELLOW' | 'GREEN';
  driSignal: string;
}

export function calculateDRIMetrics(student: Student): DRIMetrics {
  const tasks = student.activity?.tasks || [];
  if (tasks.length === 0) {
      return { iROI: 0, debtExposure: 0, precisionDecay: 1, reMasteryFriction: 0, driTier: 'GREEN', driSignal: 'No Data' };
  }

  // Ordenar cronológicamente (antiguo -> nuevo) para análisis de fatiga
  const sortedTasks = [...tasks].sort((a, b) => 
    new Date(a.completedLocal).getTime() - new Date(b.completedLocal).getTime()
  );

  // 1. iROI (Instructional ROI)
  // XP ganado por minuto invertido.
  const totalMin = (student.activity?.time || 1);
  const totalXP = student.activity?.xpAwarded || 0;
  const iROI = parseFloat((totalXP / totalMin).toFixed(2));

  // 2. ACADEMIC DEBT (DER)
  // % de temas dominados que son nivel K-8
  let kBelow = 0;
  let kTotal = 0;
  sortedTasks.forEach(t => {
      if ((t.questionsCorrect / t.questions) > 0.8) {
          kTotal++;
          const grade = getTopicGrade(student.currentCourse?.name || '', t.topic.name);
          if (grade === 'K-8') kBelow++;
      }
  });
  const debtExposure = kTotal > 0 ? Math.round((kBelow / kTotal) * 100) : 0;

  // 3. PRECISION DECAY (PDI)
  // Comparamos errores al inicio vs final de la ventana de actividad
  const slice = Math.ceil(sortedTasks.length * 0.3); // Top 30% vs Bottom 30%
  const startTasks = sortedTasks.slice(0, slice);
  const endTasks = sortedTasks.slice(-slice);

  const startErr = startTasks.reduce((acc, t) => acc + (t.questions - t.questionsCorrect), 0);
  const endErr = endTasks.reduce((acc, t) => acc + (t.questions - t.questionsCorrect), 0);
  
  // Si errores al final > errores al inicio, hay fatiga.
  const precisionDecay = parseFloat(((endErr + 1) / (startErr + 1)).toFixed(2));

  // 4. CLASIFICACIÓN DRI (Triaje)
  let driTier: 'RED' | 'YELLOW' | 'GREEN' = 'GREEN';
  let driSignal = "Optimal Flow";

  // Lógica de Prioridad DRI
  if (debtExposure > 30) {
      driTier = 'RED';
      driSignal = `Academic Debt (${debtExposure}%)`;
  } else if (student.metrics?.nemesisTopic) {
      driTier = 'RED';
      driSignal = "Active Blockage";
  } else if (precisionDecay > 1.5) {
      driTier = 'YELLOW';
      driSignal = `Cognitive Fatigue (${precisionDecay}x)`;
  } else if (student.metrics?.archetype === 'Grinder') {
      driTier = 'YELLOW';
      driSignal = "High Effort / Low Acc";
  } else if (iROI > 10) { // Arbitrario, ajustar según datos reales
      driTier = 'GREEN';
      driSignal = "High ROI Leader";
  }

  return {
      iROI,
      debtExposure,
      precisionDecay,
      reMasteryFriction: 0, // Simplificado por ahora
      driTier,
      driSignal
  };
}
