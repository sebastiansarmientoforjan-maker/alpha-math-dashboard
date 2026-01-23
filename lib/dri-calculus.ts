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
  
  // Si no hay tareas, devolvemos estado neutral
  if (!tasks || tasks.length === 0) {
      return { 
          iROI: 0, 
          debtExposure: 0, 
          precisionDecay: 1, 
          reMasteryFriction: 0, 
          driTier: 'GREEN', 
          driSignal: 'No Data' 
      };
  }

  // Ordenar cronológicamente (antiguo -> nuevo) para análisis de fatiga
  // Agregamos chequeo de seguridad para fechas nulas
  const sortedTasks = [...tasks].sort((a, b) => {
    const dateA = a.completedLocal ? new Date(a.completedLocal).getTime() : 0;
    const dateB = b.completedLocal ? new Date(b.completedLocal).getTime() : 0;
    return dateA - dateB;
  });

  // 1. iROI (Instructional ROI)
  const totalMin = (student.activity?.time || 1);
  const totalXP = student.activity?.xpAwarded || 0;
  const iROI = totalMin > 0 ? parseFloat((totalXP / totalMin).toFixed(2)) : 0;

  // 2. ACADEMIC DEBT (DER)
  let kBelow = 0;
  let kTotal = 0;
  
  sortedTasks.forEach(t => {
      // 🛡️ FIX DE SEGURIDAD: Chequeamos que t.topic exista
      if (t.questions > 0 && (t.questionsCorrect / t.questions) > 0.8) {
          kTotal++;
          const topicName = t.topic?.name || ""; // <--- AQUÍ ESTABA EL ERROR (Ahora es seguro)
          const courseName = student.currentCourse?.name || "";
          
          if (topicName) {
              const grade = getTopicGrade(courseName, topicName);
              if (grade === 'K-8') kBelow++;
          }
      }
  });
  
  const debtExposure = kTotal > 0 ? Math.round((kBelow / kTotal) * 100) : 0;

  // 3. PRECISION DECAY (PDI)
  const slice = Math.max(1, Math.ceil(sortedTasks.length * 0.3));
  const startTasks = sortedTasks.slice(0, slice);
  const endTasks = sortedTasks.slice(-slice);

  const startErr = startTasks.reduce((acc, t) => acc + (t.questions - t.questionsCorrect), 0);
  const endErr = endTasks.reduce((acc, t) => acc + (t.questions - t.questionsCorrect), 0);
  
  // Evitamos división por cero sumando 1
  const precisionDecay = parseFloat(((endErr + 1) / (startErr + 1)).toFixed(2));

  // 4. CLASIFICACIÓN DRI (Triaje)
  let driTier: 'RED' | 'YELLOW' | 'GREEN' = 'GREEN';
  let driSignal = "Optimal Flow";

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
  } else if (iROI > 10) { 
      driTier = 'GREEN';
      driSignal = "High ROI Leader";
  }

  return {
      iROI,
      debtExposure,
      precisionDecay,
      reMasteryFriction: 0,
      driTier,
      driSignal
  };
}
