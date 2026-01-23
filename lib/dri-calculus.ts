import { Student } from '@/types';
import { getTopicGrade } from './grade-maps';

export function calculateDRIMetrics(student: Student) {
  const tasks = student.activity?.tasks || [];
  const sorted = [...tasks].sort((a, b) => new Date(a.completedLocal).getTime() - new Date(b.completedLocal).getTime());

  // DER: Deuda Académica (Basado en EMD Rigor)
  let kBelow = 0, kTotal = 0;
  tasks.forEach(t => {
    if (t.topic?.name && (t.questionsCorrect / (t.questions || 1)) > 0.8) {
      kTotal++;
      if (getTopicGrade(student.currentCourse?.name, t.topic.name) === 'K-8') kBelow++;
    }
  });
  const debtExposure = kTotal > 0 ? Math.round((kBelow / kTotal) * 100) : 0;

  // PDI: Precision Decay (Fatiga)
  const slice = Math.max(1, Math.ceil(sorted.length * 0.3));
  const startErr = sorted.slice(0, slice).reduce((acc, t) => acc + (t.questions - (t.questionsCorrect || 0)), 0);
  const endErr = sorted.slice(-slice).reduce((acc, t) => acc + (t.questions - (t.questionsCorrect || 0)), 0);
  const precisionDecay = parseFloat(((endErr + 1) / (startErr + 1)).toFixed(2));

  // LÓGICA DE TIERS Y SEÑALES
  let driTier: 'RED' | 'YELLOW' | 'GREEN' = 'GREEN';
  let driSignal = 'Flowing';
  let driColor = 'text-emerald-500';

  // 1. Caso de Inactividad (Seguridad para el reporte de Middle School)
  // Si no hay tareas o el esfuerzo y avance son nulos
  if (tasks.length === 0 || (student.metrics?.velocityScore === 0 && student.metrics?.lmp === 0)) {
    driTier = 'RED'; // Se mantiene en Red Zone para llamar la atención del DRI
    driSignal = 'INACTIVE';
    driColor = 'text-slate-500'; // Gris para diferenciar de un error académico real
  } 
  // 2. Casos de Riesgo Académico
  else if (debtExposure > 25 || student.metrics?.stallStatus === 'Frustrated Stall' || student.metrics?.velocityScore < 30) {
    driTier = 'RED';
    driSignal = 'Critical Debt';
    driColor = 'text-red-500';
  } 
  else if (precisionDecay > 1.4 || (student.metrics?.ksi || 100) < 60) {
    driTier = 'YELLOW';
    driSignal = 'Stability Risk';
    driColor = 'text-amber-500';
  } else {
    driColor = 'text-emerald-500';
  }

  return { 
    iROI: parseFloat(((student.activity?.xpAwarded || 0) / (student.activity?.time || 1)).toFixed(2)), 
    debtExposure, 
    precisionDecay, 
    driTier, 
    driSignal,
    driColor // Nueva propiedad para que el Dashboard y Modal sepan qué color usar
  };
}
