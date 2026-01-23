'use client';

import { useMemo, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function StudentModal({ student, onClose }: { student: any; onClose: () => void }) {
  const [loading, setLoading] = useState(false);

  const tasks = student?.activity?.tasks || [];

  // Tipamos explícitamente como string[] para evitar el error de 'unknown'
  const readyToAccelerate = useMemo((): string[] => {
    const topics = tasks
      .filter((t: any) => (t.questionsCorrect / (t.questions || 1)) > 0.7)
      .map((t: any) => t.topic?.name || 'Unknown Topic');
    return Array.from(new Set(topics)).slice(0, 3) as string[];
  }, [tasks]);

  const chartData = useMemo(() => tasks.map((t: any, i: number) => ({
    i: i + 1, 
    acc: Math.round((t.questionsCorrect / (t.questions || 1)) * 100),
    topic: t.topic?.name || 'Task'
  })), [tasks]);

  const lmpDisplay = isNaN(student.metrics.lmp) ? '0%' : `${(student.metrics.lmp * 100).toFixed(0)}%`;

  const logIntervention = async (type: string) => {
    setLoading(true);
    try {
      await fetch('/api/interventions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: student.id, studentName: `${student.firstName} ${student.lastName}`,
          type, targetTopic: student.metrics.nemesisTopic, createdBy: 'DRI_COMMAND'
        })
      });
      onClose();
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl p-4">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="bg-[#080808] border border-slate-800 w-full max-w-6xl h-[90vh] rounded-[2.5rem] relative z-10 flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        <div className="p-8 border-b border-slate-800 flex justify-between items-start bg-slate-900/30">
          <div className="flex gap-8 items-center">
             <div className="w-20 h-20 rounded-full border-4 flex items-center justify-center text-2xl font-black italic border-emerald-500 text-emerald-500">
               {student.metrics.velocityScore || 0}
             </div>
             <div>
                <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase">{student.firstName} {student.lastName}</h2>
                <div className="flex gap-4 mt-2 font-black text-[10px] uppercase">
                  <span className={`px-3 py-1 rounded-full border ${student.dri.driTier === 'RED' ? 'bg-red-500/10 text-red-500 border-red-500/50' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/50'}`}>
                    {student.dri.driSignal}
                  </span>
                  <span className="text-slate-500 self-center">{student.currentCourse?.name}</span>
                </div>
             </div>
          </div>
          <button onClick={onClose} className="text-slate-600 hover:text-white text-2xl transition-transform hover:rotate-90">✕</button>
        </div>

        <div className="flex-1 p-8 grid grid-cols-12 gap-10 overflow-y-auto custom-scrollbar">
          <div className="col-span-4 space-y-8">
             <div className="p-6 bg-slate-900/40 rounded-3xl border border-slate-800 text-center">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Mastery Probability (LMP)</p>
                <p className="text-5xl font-black text-white italic">{lmpDisplay}</p>
                <p className="text-[9px] text-indigo-400 mt-4 font-bold uppercase italic">ESTADO: {student.metrics.stallStatus || 'OPTIMAL'}</p>
             </div>

             <div className="bg-indigo-950/20 border border-indigo-500/30 p-6 rounded-3xl">
                <h3 className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-4 italic">⚡ Aceleración (Outer Fringe)</h3>
                <div className="space-y-2">
                   {readyToAccelerate.length > 0 ? readyToAccelerate.map((topic: string, idx: number) => (
                      <div key={idx} className="flex items-center gap-3 p-2 bg-indigo-900/20 rounded-xl border border-indigo-500/10">
                         <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
                         <span className="text-[10px] font-bold text-indigo-200 uppercase truncate italic">{topic}</span>
                      </div>
                   )) : <p className="text-[10px] text-slate-600 italic font-bold">Consolidando base...</p>}
                </div>
             </div>
             
             <button disabled={loading} onClick={() => logIntervention('coaching')} className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">
                Registrar Intervención
             </button>
          </div>

          <div className="col-span-8 bg-slate-900/20 rounded-[2.5rem] border border-slate-800 p-8">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-8 italic">Curva de Precisión</h3>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={chartData} margin={{ bottom: 20, left: 10 }}>
                <CartesianGrid stroke="#1e293b" vertical={false} />
                <XAxis dataKey="i" stroke="#475569" fontSize={10} label={{ value: 'Sesiones Recientes', position: 'insideBottom', offset: -10, fill: '#475569', fontSize: 9, fontWeight: 'bold' }} />
                <YAxis domain={[0, 100]} stroke="#475569" fontSize={10} label={{ value: '% Precisión', angle: -90, position: 'insideLeft', fill: '#475569', fontSize: 9, fontWeight: 'bold' }} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '15px' }} />
                <Line type="monotone" dataKey="acc" stroke="#6366f1" strokeWidth={5} dot={{ r: 4, fill: '#6366f1' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
