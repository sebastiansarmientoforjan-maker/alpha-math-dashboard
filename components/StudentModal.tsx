'use client';

import { useState, useMemo } from 'react';
import { calculateDRIMetrics } from '@/lib/dri-calculus';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function StudentModal({ student, onClose }: { student: any; onClose: () => void }) {
  const [submitting, setSubmitting] = useState(false);
  
  const dri = useMemo(() => calculateDRIMetrics(student), [student]);
  const m = student.metrics || {};
  const tasks = student.activity?.tasks || [];

  // Datos para el gráfico de fatiga (PDI)
  const chartData = useMemo(() => {
    return [...tasks]
      .sort((a: any, b: any) => new Date(a.completedLocal).getTime() - new Date(b.completedLocal).getTime())
      .map((t: any, index: number) => ({
        index: index + 1,
        acc: Math.round((t.questionsCorrect / t.questions) * 100),
        topic: t.topic?.name
      }));
  }, [tasks]);

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
          createdBy: 'DRI_COMMAND'
        })
      });
      onClose();
    } catch (error) { console.error(error); } finally { setSubmitting(false); }
  };

  if (!student) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 animate-in fade-in zoom-in duration-200">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="bg-[#080808] border border-slate-800 w-full max-w-6xl max-h-[92vh] overflow-hidden rounded-[2.5rem] shadow-[0_0_50px_-12px_rgba(79,70,229,0.5)] relative flex flex-col z-10">
        
        {/* HEADER HOLOGRÁFICO */}
        <div className="p-8 border-b border-slate-800 bg-gradient-to-r from-slate-900/50 to-transparent flex justify-between items-start">
          <div className="flex gap-6 items-center">
            <div className="relative">
              <div className={`w-20 h-20 rounded-full border-4 flex items-center justify-center text-2xl font-black italic ${m.velocityScore < 50 ? 'border-red-500 text-red-500' : 'border-emerald-500 text-emerald-500'}`}>
                {m.velocityScore}
              </div>
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-slate-900 px-2 py-0.5 rounded text-[8px] font-black uppercase text-slate-500 border border-slate-800">Velocidad</div>
            </div>
            
            <div>
              <h2 className="text-4xl font-black text-white tracking-tighter uppercase italic">{student.firstName} {student.lastName}</h2>
              <div className="flex gap-3 mt-2">
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${dri.driTier === 'RED' ? 'bg-red-500/10 text-red-500 border-red-500/50' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/50'}`}>
                  {dri.driSignal}
                </span>
                <span className="text-slate-500 font-mono text-xs self-center">COURSE: {student.currentCourse?.name}</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white text-2xl p-2 transition-transform hover:rotate-90">✕</button>
        </div>

        {/* CONTENIDO TÁCTICO */}
        <div className="flex-1 overflow-y-auto p-8 grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* COL IZQUIERDA: DRI DIAGNOSTICS (Lógica de Deuda) */}
          <div className="lg:col-span-4 space-y-8">
            <section>
              <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-4">Composición de Carga (DER)</h3>
              <div className="bg-slate-900/40 p-5 rounded-3xl border border-slate-800 shadow-inner">
                <div className="flex justify-between items-end mb-3">
                  <span className="text-xs font-bold text-slate-400">Academic Debt</span>
                  <span className={`text-3xl font-mono font-black ${dri.debtExposure > 20 ? 'text-red-500' : 'text-slate-200'}`}>{dri.debtExposure}%</span>
                </div>
                <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div className={`h-full transition-all duration-1000 ${dri.debtExposure > 20 ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${dri.debtExposure}%` }} />
                </div>
                <p className="text-[9px] text-slate-600 mt-4 leading-relaxed">
                  {dri.debtExposure > 20 
                    ? "ATENCIÓN: El alumno está atrapado en conceptos de K-8. Requiere puente pedagógico inmediato." 
                    : "NIVEL ÓPTIMO: El esfuerzo está centrado en estándares de Secundaria."}
                </p>
              </div>
            </section>

            <section>
              <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-4">Eficiencia Energética</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-900/40 p-4 rounded-3xl border border-slate-800">
                  <div className="text-[8px] text-slate-500 uppercase mb-1">PDI (Fatiga)</div>
                  <div className="text-xl font-black text-white">{dri.precisionDecay}x</div>
                </div>
                <div className="bg-slate-900/40 p-4 rounded-3xl border border-slate-800">
                  <div className="text-[8px] text-slate-500 uppercase mb-1">ROI (XP/min)</div>
                  <div className="text-xl font-black text-alpha-gold">{dri.iROI}</div>
                </div>
              </div>
            </section>

            <div className="space-y-3 pt-6">
              <button onClick={() => createIntervention('coaching')} className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-indigo-900/20">Registrar Coaching</button>
              {m.nemesisTopic && (
                <button onClick={() => createIntervention('nemesis_intervention')} className="w-full py-4 bg-transparent border-2 border-red-500/50 text-red-500 hover:bg-red-500 hover:text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">Limpiar Bloqueo</button>
              )}
            </div>
          </div>

          {/* COL DERECHA: TREND ANALYSIS (PDI VISUAL) */}
          <div className="lg:col-span-8 space-y-8">
            <section className="h-64 bg-slate-900/20 rounded-[2rem] border border-slate-800 p-6">
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-6">Curva de Precisión (Fatiga en Tiempo Real)</h3>
              <ResponsiveContainer width="100%" height="80%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="index" stroke="#475569" fontSize={10} />
                  <YAxis domain={[0, 100]} stroke="#475569" fontSize={10} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f8fafc' }}
                    itemStyle={{ color: '#818cf8', fontSize: '10px', fontWeight: 'bold' }}
                  />
                  <Line type="monotone" dataKey="acc" stroke="#6366f1" strokeWidth={4} dot={{ r: 4, fill: '#6366f1' }} activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            </section>

            <section>
               <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Registro de Campo (Últimas Tareas)</h3>
               <div className="space-y-2 max-h-60 overflow-y-auto pr-4 custom-scrollbar">
                  {chartData.reverse().map((t, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-slate-900/30 border border-slate-800/50 rounded-2xl">
                       <span className="text-[10px] font-bold text-slate-400 truncate w-64">{t.topic}</span>
                       <div className="flex items-center gap-4">
                          <span className={`text-xs font-mono font-black ${t.acc < 60 ? 'text-red-500' : 'text-emerald-500'}`}>{t.acc}%</span>
                          <div className={`w-2 h-2 rounded-full ${t.acc < 60 ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'bg-emerald-500'}`} />
                       </div>
                    </div>
                  ))}
               </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
