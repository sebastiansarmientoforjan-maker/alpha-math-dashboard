import { Student } from '@/types';
import { getTopicGrade } from './grade-maps';

export function calculateDRIMetrics(student: Student) {
  const tasks = student.activity?.tasks || [];
  const sorted = [...tasks].sort((a, b) => new Date(a.completedLocal).getTime() - new Date(b.completedLocal).getTime());

  // DER: Deuda Académica (Basado en EMD Rigor) [cite: 51, 144]
  let kBelow = 0, kTotal = 0;
  tasks.forEach(t => {
    if (t.topic?.name && (t.questionsCorrect / t.questions) > 0.8) {
      kTotal++;
      if (getTopicGrade(student.currentCourse?.name, t.topic.name) === 'K-8') kBelow++;
    }
  });
  const debtExposure = kTotal > 0 ? Math.round((kBelow / kTotal) * 100) : 0;

  // PDI: Precision Decay (Fatiga) [cite: 42]
  const slice = Math.max(1, Math.ceil(sorted.length * 0.3));
  const startErr = sorted.slice(0, slice).reduce((acc, t) => acc + (t.questions - t.questionsCorrect), 0);
  const endErr = sorted.slice(-slice).reduce((acc, t) => acc + (t.questions - t.questionsCorrect), 0);
  const precisionDecay = parseFloat(((endErr + 1) / (startErr + 1)).toFixed(2));

  let driTier: 'RED' | 'YELLOW' | 'GREEN' = 'GREEN';
  if (debtExposure > 25 || student.metrics?.stallStatus === 'Frustrated Stall') driTier = 'RED';
  else if (precisionDecay > 1.4 || (student.metrics?.ksi || 100) < 60) driTier = 'YELLOW';

  return { 
    iROI: parseFloat(((student.activity?.xpAwarded || 0) / (student.activity?.time || 1)).toFixed(2)), 
    debtExposure, 
    precisionDecay, 
    driTier, 
    driSignal: driTier === 'RED' ? 'Critical Debt' : driTier === 'YELLOW' ? 'Stability Risk' : 'Flowing' 
  };
}
