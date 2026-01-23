'use client';

import { useMemo, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function StudentModal({ student, onClose }: { student: any; onClose: () => void }) {
  const [loading, setLoading] = useState(false);

  const chartData = useMemo(() => student.activity.tasks.map((t: any, i: number) => ({
    i: i + 1, 
    acc: Math.round((t.questionsCorrect / t.questions) * 100),
    topic: t.topic?.name
  })), [student]);

  const logIntervention = async (type: string) => {
    setLoading(true);
    try {
      await fetch('/api/interventions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: student.id,
          studentName: `${student.firstName} ${student.lastName}`,
          type,
          targetTopic: student.metrics.nemesisTopic,
          createdBy: 'DRI_COMMAND'
        })
      });
      onClose();
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="bg-[#080808] border border-slate-800 w-full max-w-6xl h-[90vh] rounded-[2.5rem] relative z-10 flex flex-col shadow-2xl overflow-hidden">
        
        {/* HEADER: SIGNOS VITALES PSICOMÉTRICOS */}
        <div className="p-8 border-b border-slate-800 flex justify-between items-start bg-slate-900/30">
          <div className="flex gap-8 items-center">
             <div className="relative">
                <div className={`w-20 h-20 rounded-full border-4 flex items-center justify-center text-2xl font-black italic ${student.dri.driTier === 'RED' ? 'border-red-500 text-red-500' : 'border-emerald-500 text-emerald-500'}`}>
                  {student.metrics.velocityScore}
                </div>
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-slate-900 px-2 py-0.5 rounded text-[8px] font-black uppercase text-slate-500 border border-slate-800 tracking-tighter">Velocity</div>
             </div>
             <div>
                <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase">{student.firstName} {student.lastName}</h2>
                <div className="flex gap-4 mt-2">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${student.dri.driTier === 'RED' ? 'bg-red-500/10 text-red-500 border-red-500/50' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/50'}`}>
                    {student.dri.driSignal}
                  </span>
                  <span className="text-slate-500 font-mono text-[10px] self-center uppercase tracking-widest">{student.currentCourse.name}</span>
                </div>
             </div>
          </div>
          <button onClick={onClose} className="text-slate-600 hover:text-white text-2xl transition-transform hover:rotate-90">✕</button>
        </div>

        <div className="flex-1 p-8 grid grid-cols-12 gap-10 overflow-y-auto custom-scrollbar">
          
          {/* COL IZQUIERDA: DIAGNÓSTICO DRI */}
          <div className="col-span-4 space-y-8">
             <section>
                <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-4">Composición de Carga (DER)</h3>
                <div className="bg-slate-900/40 p-6 rounded-3xl border border-slate-800">
                   <div className="flex justify-between items-end mb-4">
                      <span className="text-xs font-bold text-slate-500">Academic Debt</span>
                      <span className={`text-4xl font-mono font-black ${student.dri.debtExposure > 25 ? 'text-red-500' : 'text-slate-200'}`}>{student.dri.debtExposure}%</span>
                   </div>
                   <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div className={`h-full transition-all duration-1000 ${student.dri.debtExposure > 25 ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${student.dri.debtExposure}%` }} />
                   </div>
                   <p className="text-[9px] text-slate-600 mt-4 leading-relaxed uppercase font-bold tracking-tighter italic">
                      {student.dri.debtExposure > 25 ? "⚠️ Atrapado en niveles inferiores. Requiere puente pedagógico." : "✅ Niveles alineados con el rigor de High School."}
                   </p>
                </div>
             </section>

             <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-900/40 p-4 rounded-3xl border border-slate-800 text-center">
                   <p className="text-[9px] font-black text-slate-500 uppercase mb-1">KSI Stability</p>
                   <p className="text-xl font-black text-white">{student.metrics.ksi}%</p>
                </div>
                <div className="bg-slate-900/40 p-4 rounded-3xl border border-slate-800 text-center">
                   <p className="text-[9px] font-black text-slate-500 uppercase mb-1">Fatiga (PDI)</p>
                   <p className={`text-xl font-black ${student.dri.precisionDecay > 1.4 ? 'text-amber-500' : 'text-white'}`}>{student.dri.precisionDecay}x</p>
                </div>
             </div>

             <div className="space-y-3 pt-6 border-t border-slate-800">
                <button 
                  disabled={loading}
                  onClick={() => logIntervention('coaching')}
                  className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-indigo-900/20 disabled:opacity-50"
                >
                  Registrar Coaching DRI
                </button>
                <button 
                  disabled={loading}
                  onClick={() => logIntervention('nemesis_intervention')}
                  className="w-full py-5 bg-transparent border-2 border-slate-800 text-slate-500 hover:border-red-500/50 hover:text-red-500 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50"
                >
                  Limpiar Bloqueo (Némesis)
                </button>
             </div>
          </div>

          {/* COL DERECHA: TREND ANALYSIS (PDI) */}
          <div className="col-span-8 space-y-8">
            <section className="h-72 bg-slate-900/20 rounded-[2.5rem] border border-slate-800 p-8 relative">
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-6">Análisis de Decaimiento de Precisión (7 Días)</h3>
              <ResponsiveContainer width="100%" height="80%">
                <LineChart data={chartData}>
                  <CartesianGrid stroke="#1e293b" vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="i" stroke="#475569" fontSize={10} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} stroke="#475569" fontSize={10} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', fontSize: '10px' }} />
                  <Line type="monotone" dataKey="acc" stroke="#6366f1" strokeWidth={5} dot={{ r: 6, fill: '#6366f1', strokeWidth: 0 }} activeDot={{ r: 10 }} />
                </LineChart>
              </ResponsiveContainer>
              <div className="absolute top-8 right-8 text-[9px] font-mono font-black text-indigo-500/50 uppercase italic tracking-widest">Latent Mastery Prob: {(student.metrics.lmp * 100).toFixed(0)}%</div>
            </section>

            <section>
               <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                 <span className="w-2 h-2 bg-indigo-500 rounded-full" /> Auditoría de Tareas (Últimos Eventos)
               </h3>
               <div className="grid grid-cols-1 gap-2 max-h-56 overflow-y-auto pr-4 custom-scrollbar">
                  {chartData.slice().reverse().map((t, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-slate-900/30 border border-slate-800/50 rounded-2xl hover:border-slate-700 transition-colors">
                       <span className="text-[10px] font-bold text-slate-400 truncate w-72 uppercase tracking-tighter italic">{t.topic}</span>
                       <div className="flex items-center gap-6">
                          <span className={`text-xs font-mono font-black ${t.acc < 60 ? 'text-red-500' : 'text-emerald-500'}`}>{t.acc}%</span>
                          <div className={`w-2 h-2 rounded-full ${t.acc < 60 ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 'bg-emerald-500'}`} />
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
