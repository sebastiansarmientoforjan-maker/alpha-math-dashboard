'use client';

import { useState, useMemo } from 'react';
import { calculateDRIMetrics } from '@/lib/dri-calculus';

export default function StudentModal({ student, onClose }: { student: any; onClose: () => void }) {
  const [submitting, setSubmitting] = useState(false);
  
  // Calculamos las métricas DRI "al vuelo" para asegurar que estén frescas
  // (Aunque ya vienen pre-calculadas en el panel, esto es doble seguridad)
  const dri = useMemo(() => calculateDRIMetrics(student), [student]);
  const m = student.metrics || {};
  const tasks = student.activity?.tasks || [];

  // Ordenar tareas: Más recientes arriba para el historial visual
  const sortedTasks = [...tasks].sort((a: any, b: any) => {
    const dateA = a.completedLocal ? new Date(a.completedLocal).getTime() : 0;
    const dateB = b.completedLocal ? new Date(b.completedLocal).getTime() : 0;
    return dateB - dateA;
  });

  const createIntervention = async (type: string) => {
    setSubmitting(true);
    try {
      await fetch('/api/interventions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: student.id,
          studentName: `${student.firstName} ${student.lastName}`,
          type,
          targetTopic: type === 'nemesis_intervention' ? m.nemesisTopic : undefined,
          createdBy: 'DRI'
        })
      });
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  if (!student) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />

      <div className="bg-[#0a0a0a] border border-slate-800 w-full max-w-5xl max-h-[90vh] overflow-hidden rounded-2xl shadow-2xl relative flex flex-col z-10">
        
        {/* --- HEADER TÁCTICO --- */}
        <div className="p-6 border-b border-slate-800 bg-[#0f0f0f] flex justify-between items-start shrink-0">
          <div className="flex gap-5 items-center">
            {/* Velocity Gauge */}
            <div className="relative w-16 h-16 flex items-center justify-center">
                <div className={`absolute inset-0 rounded-full border-4 opacity-20 ${m.velocityScore < 50 ? 'border-red-500' : 'border-emerald-500'}`}></div>
                <div className={`text-2xl font-black ${m.velocityScore < 50 ? 'text-red-500' : 'text-emerald-500'}`}>{m.velocityScore}</div>
                <div className="absolute -bottom-2 text-[9px] font-bold uppercase tracking-widest text-slate-500 bg-[#0f0f0f] px-1">Vel</div>
            </div>
            
            <div>
              <h2 className="text-3xl font-black text-white tracking-tighter uppercase italic">
                {student.firstName} {student.lastName}
              </h2>
              <div className="flex gap-2 mt-2">
                 <span className="px-2 py-0.5 bg-slate-800 border border-slate-700 rounded text-[10px] text-slate-400 font-mono">
                    ID: {student.id}
                 </span>
                 <span className="px-2 py-0.5 bg-indigo-900/30 border border-indigo-500/30 rounded text-[10px] text-indigo-300 font-bold uppercase">
                    {student.currentCourse?.name}
                 </span>
              </div>
            </div>
          </div>

          {/* DRI ARCHETYPE BADGE */}
          <div className="text-right">
             <div className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">DRI Diagnosis</div>
             <div className={`text-sm font-black uppercase px-3 py-1 rounded border ${
                 dri.driTier === 'RED' ? 'bg-red-500/10 text-red-500 border-red-500/50' : 
                 dri.driTier === 'YELLOW' ? 'bg-amber-500/10 text-amber-500 border-amber-500/50' : 
                 'bg-emerald-500/10 text-emerald-500 border-emerald-500/50'
             }`}>
                {dri.driSignal}
             </div>
          </div>
          
          <button onClick={onClose} className="absolute top-4 right-4 text-slate-600 hover:text-white transition-colors">✕</button>
        </div>

        {/* --- MAIN CONTENT GRID --- */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* LEFT COL: TIER 5 METRICS (NUEVO) */}
          <div className="space-y-6">
            
            {/* 1. ACADEMIC DEBT (DER) */}
            <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 relative overflow-hidden">
                <div className="flex justify-between items-end mb-2">
                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Academic Debt (DER)</h3>
                    <span className={`text-2xl font-mono font-bold ${dri.debtExposure > 20 ? 'text-red-500' : 'text-slate-300'}`}>
                        {dri.debtExposure}%
                    </span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div className={`h-full ${dri.debtExposure > 20 ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(dri.debtExposure, 100)}%` }}></div>
                </div>
                <p className="text-[9px] text-slate-600 mt-2">
                    {dri.debtExposure > 20 
                        ? "⚠️ High remedial load. Student is spending >20% time on K-8 topics." 
                        : "✅ Healthy ratio. Focus is primarily on HS syllabus."}
                </p>
            </div>

            {/* 2. COGNITIVE FATIGUE (PDI) */}
            <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                <div className="flex justify-between items-end mb-2">
                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Precision Decay (PDI)</h3>
                    <span className={`text-2xl font-mono font-bold ${dri.precisionDecay > 1.5 ? 'text-amber-500' : 'text-slate-300'}`}>
                        {dri.precisionDecay}x
                    </span>
                </div>
                <p className="text-[9px] text-slate-600">
                    {dri.precisionDecay > 1.5 
                        ? "⚠️ Fatigue Detected. Error rate spikes significantly at end of session." 
                        : "✅ Stable Stamina. Consistency maintained throughout session."}
                </p>
            </div>

            {/* 3. INSTRUCTIONAL ROI */}
            <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                <div className="flex justify-between items-end mb-2">
                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Instructional ROI</h3>
                    <span className="text-2xl font-mono font-bold text-yellow-500">
                        {dri.iROI}
                    </span>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-800">
                    <div>
                        <div className="text-[8px] text-slate-600 uppercase">Focus Integrity</div>
                        <div className={`font-bold ${m.focusIntegrity < 40 ? 'text-red-500' : 'text-white'}`}>{m.focusIntegrity}%</div>
                    </div>
                    <div>
                        <div className="text-[8px] text-slate-600 uppercase">Accuracy</div>
                        <div className="font-bold text-white">{m.accuracyRate}%</div>
                    </div>
                </div>
            </div>

            {/* ACTION PANEL */}
            <div className="space-y-2 pt-4">
                <button 
                    onClick={() => createIntervention('coaching')}
                    disabled={submitting}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold uppercase tracking-widest transition-all"
                >
                    💬 Log Coaching Session
                </button>
                {m.nemesisTopic && (
                    <button 
                        onClick={() => createIntervention('nemesis_intervention')}
                        disabled={submitting}
                        className="w-full py-3 bg-red-900/50 hover:bg-red-900/80 border border-red-500/30 text-red-200 rounded-lg text-xs font-bold uppercase tracking-widest transition-all"
                    >
                        👹 Clear Nemesis Block
                    </button>
                )}
            </div>

          </div>

          {/* RIGHT COL: TIMELINE (HISTORIAL) */}
          <div className="lg:col-span-2 bg-slate-900/20 rounded-xl border border-slate-800 p-4 flex flex-col">
             <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 flex justify-between">
                <span>Session Timeline</span>
                <span>{tasks.length} Tasks Analyzed</span>
             </h3>

             <div className="flex-1 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                {sortedTasks.length === 0 ? (
                    <div className="text-center py-20 text-slate-700 italic text-xs">No recent data available for analysis.</div>
                ) : (
                    sortedTasks.map((task: any) => {
                        const acc = Math.round((task.questionsCorrect / task.questions) * 100);
                        const isFail = acc < 60;
                        const minutes = Math.round((task.analysis?.timeEngaged || 0) / 60);
                        
                        return (
                            <div key={task.id} className="flex items-center gap-4 p-3 rounded-lg bg-[#0f0f0f] border border-slate-800 hover:border-slate-600 transition-colors">
                                {/* Type Indicator */}
                                <div className={`w-1 h-8 rounded-full ${task.type === 'Review' ? 'bg-indigo-500' : 'bg-emerald-500'}`}></div>
                                
                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between">
                                        <h4 className="text-xs font-bold text-slate-300 truncate">{task.topic?.name || 'Unknown Topic'}</h4>
                                        <span className={`text-xs font-mono font-bold ${isFail ? 'text-red-500' : 'text-emerald-500'}`}>
                                            {acc}%
                                        </span>
                                    </div>
                                    <div className="flex gap-3 mt-1">
                                        <span className="text-[10px] text-slate-600 flex items-center gap-1">
                                            ⏱ {minutes}m
                                        </span>
                                        <span className="text-[10px] text-slate-600 flex items-center gap-1">
                                            ❓ {task.questionsCorrect}/{task.questions}
                                        </span>
                                        <span className="text-[10px] text-slate-600 font-mono">
                                            {task.completedLocal?.split(' ')[0]}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
             </div>
          </div>

        </div>
      </div>
    </div>
  );
}
