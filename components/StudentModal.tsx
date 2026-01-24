'use client';

import { useMemo, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function StudentModal({ student, onClose }: { student: any; onClose: () => void }) {
  const [loading, setLoading] = useState(false);

  const tasks = student?.activity?.tasks || [];

  const readyToAccelerate = useMemo((): string[] => {
    const topics = tasks
      .filter((t: any) => (t.questionsCorrect / (t.questions || 1)) > 0.7)
      .map((t: any) => t.topic?.name || 'Unknown Topic');
    return Array.from(new Set(topics)).slice(0, 3) as string[];
  }, [tasks]);

  const sortedData = useMemo(() => {
    return tasks.map((t: any, i: number) => {
      const dateObj = new Date(t.completedLocal);
      return {
        id: t.id,
        timestamp: dateObj.getTime(),
        acc: Math.round((t.questionsCorrect / (t.questions || 1)) * 100),
        topic: t.topic?.name || 'Session Task',
        questions: t.questions || 0,
        correct: t.questionsCorrect || 0,
        date: dateObj.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit' }),
        time: Math.round((t.timeTotal || 0) / 60)
      };
    }).sort((a: any, b: any) => b.timestamp - a.timestamp);
  }, [tasks]);

  const chartData = useMemo(() => 
    [...sortedData].reverse().map((d, i) => ({ ...d, i: i + 1 })), 
  [sortedData]);

  const lmpDisplay = isNaN(student.metrics.lmp) ? '0%' : `${(student.metrics.lmp * 100).toFixed(0)}%`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl p-4">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="bg-[#080808] border border-slate-800 w-full max-w-6xl h-[90vh] rounded-[2.5rem] relative z-10 flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* HEADER */}
        <div className="p-8 border-b border-slate-800 flex justify-between items-start bg-slate-900/30">
          <div className="flex gap-8 items-center">
             <div className={`w-20 h-20 rounded-full border-4 flex items-center justify-center text-2xl font-black italic ${
               student.dri.driTier === 'RED' ? 'border-red-500 text-red-500' : 'border-emerald-500 text-emerald-500'
             }`}>
               {student.metrics.velocityScore || 0}
             </div>
             <div>
                <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase">
                  {student.firstName} {student.lastName}
                </h2>
                <div className="flex gap-4 mt-2 font-black text-[10px] uppercase">
                  {/* ✅ SOLUCIÓN: Usar driColor directamente */}
                  <span className={`px-3 py-1 rounded-full border border-current ${student.dri.driColor}`}>
                    {student.dri.driSignal}
                  </span>
                  <span className="text-slate-500 self-center">{student.currentCourse?.name}</span>
                </div>
             </div>
          </div>
          <button onClick={onClose} className="text-slate-600 hover:text-white text-2xl transition-colors">✕</button>
        </div>

        <div className="flex-1 p-8 grid grid-cols-12 gap-10 overflow-y-auto custom-scrollbar">
          {/* COL IZQUIERDA: DIAGNÓSTICO */}
          <div className="col-span-4 space-y-8">
             <div className="p-6 bg-slate-900/40 rounded-3xl border border-slate-800 text-center shadow-inner">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Mastery Probability (LMP)</p>
                <p className="text-5xl font-black text-white italic">{lmpDisplay}</p>
                <p className="text-[9px] text-indigo-400 mt-4 font-bold uppercase italic tracking-widest">
                  Estado: {student.metrics.stallStatus || 'Optimal'}
                </p>
             </div>

             <div className="bg-indigo-950/20 border border-indigo-500/30 p-6 rounded-3xl">
                <h3 className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-4 italic">
                  ⚡ Aceleración (Outer Fringe)
                </h3>
                <div className="space-y-2">
                   {readyToAccelerate.length > 0 ? readyToAccelerate.map((topic: string, idx: number) => (
                      <div key={idx} className="flex items-center gap-3 p-2 bg-indigo-900/20 rounded-xl border border-indigo-500/10">
                         <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
                         <span className="text-[10px] font-bold text-indigo-200 uppercase truncate italic">{topic}</span>
                      </div>
                   )) : <p className="text-[10px] text-slate-600 italic font-bold">Consolidando base...</p>}
                </div>
             </div>
             
             {/* ✅ NUEVO: Métricas DRI */}
             <div className="bg-slate-900/40 border border-slate-800 p-6 rounded-3xl">
                <h3 className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-4">
                  📊 DRI Metrics
                </h3>
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">iROI:</span>
                    <span className="font-mono font-bold text-white">{student.dri.iROI}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Debt Exposure:</span>
                    <span className={`font-mono font-bold ${student.dri.debtExposure > 25 ? 'text-red-400' : 'text-emerald-400'}`}>
                      {student.dri.debtExposure}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Precision Decay:</span>
                    <span className={`font-mono font-bold ${student.dri.precisionDecay > 1.4 ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {student.dri.precisionDecay}x
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">KSI:</span>
                    <span className="font-mono font-bold text-blue-400">{student.metrics.ksi}%</span>
                  </div>
                </div>
             </div>
          </div>

          {/* COL DERECHA: GRÁFICO Y LISTA */}
          <div className="col-span-8 space-y-8">
            <div className="bg-slate-900/20 rounded-[2.5rem] border border-slate-800 p-8">
               <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] mb-8 italic">
                 Curva de Precisión - Últimas {chartData.length} Sesiones
               </h3>
               <ResponsiveContainer width="100%" height={250}>
                 <LineChart data={chartData} margin={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                   <CartesianGrid stroke="#1e293b" vertical={false} strokeDasharray="3 3" />
                   <XAxis dataKey="i" stroke="#475569" fontSize={10} label={{ value: 'Session #', position: 'insideBottom', offset: -5 }} />
                   <YAxis domain={[0, 110]} ticks={[0, 25, 50, 75, 100]} stroke="#475569" fontSize={10} label={{ value: 'Accuracy %', angle: -90, position: 'insideLeft' }} />
                   <Tooltip 
                     contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '15px' }}
                     labelFormatter={(value) => `Session ${value}`}
                     formatter={(value: any) => [`${value}%`, 'Accuracy']}
                   />
                   <Line type="monotone" dataKey="acc" stroke="#6366f1" strokeWidth={3} dot={{ r: 4, fill: '#6366f1' }} activeDot={{ r: 8 }} />
                 </LineChart>
               </ResponsiveContainer>
            </div>

            {/* TABLA DE SESIONES */}
            <div className="bg-slate-900/10 rounded-3xl border border-slate-800 overflow-hidden">
               <div className="p-4 bg-slate-900/40 border-b border-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-500">
                  Historial de Sesiones (Recientes Primero)
               </div>
               <div className="max-h-60 overflow-y-auto custom-scrollbar">
                  <table className="w-full text-left border-collapse">
                     <thead className="sticky top-0 bg-[#080808] z-10">
                        <tr className="text-[9px] font-black text-slate-600 uppercase border-b border-slate-800">
                           <th className="p-4">Fecha</th>
                           <th className="p-4">Tópico / Concepto</th>
                           <th className="p-4 text-center">Precisión</th>
                           <th className="p-4 text-center">Ítems</th>
                           <th className="p-4 text-center">Tiempo</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-800/50">
                        {sortedData.slice(0, 20).map((task: any, idx: number) => (
                           <tr key={idx} className="hover:bg-slate-900/30 transition-colors">
                              <td className="p-4 text-[10px] font-mono text-slate-500">{task.date}</td>
                              <td className="p-4 text-[11px] font-bold text-slate-300 uppercase italic truncate max-w-[250px]">
                                {task.topic}
                              </td>
                              <td className="p-4 text-center">
                                 <span className={`text-[10px] font-mono font-black ${
                                   task.acc >= 80 ? 'text-emerald-500' : task.acc >= 50 ? 'text-amber-500' : 'text-red-500'
                                 }`}>
                                    {task.acc}%
                                 </span>
                              </td>
                              <td className="p-4 text-center text-[10px] font-mono text-slate-500">
                                 {task.correct} / {task.questions}
                              </td>
                              <td className="p-4 text-center text-[10px] font-mono text-indigo-400">
                                 {task.time} min
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
