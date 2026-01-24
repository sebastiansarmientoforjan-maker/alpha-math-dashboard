'use client';

import { useMemo, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DRI_CONFIG } from '@/lib/dri-config';

export default function StudentModal({ student, onClose }: { student: any; onClose: () => void }) {
  const [loading, setLoading] = useState(false);

  const tasks = student?.activity?.tasks || [];

  // ==========================================
  // READY TO ACCELERATE (Outer Fringe)
  // ==========================================
  const readyToAccelerate = useMemo((): string[] => {
    const topics = tasks
      .filter((t: any) => (t.questionsCorrect / (t.questions || 1)) > 0.7)
      .map((t: any) => t.topic?.name || 'Unknown Topic');
    return Array.from(new Set(topics)).slice(0, 3) as string[];
  }, [tasks]);

  // ==========================================
  // DATOS PARA TABLA (Más reciente primero)
  // ==========================================
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

  // ==========================================
  // DATOS PARA GRÁFICO (Orden cronológico)
  // ==========================================
  const chartData = useMemo(() => 
    [...sortedData].reverse().map((d, i) => ({ ...d, i: i + 1 })), 
  [sortedData]);

  const rsrDisplay = isNaN(student.metrics.lmp) ? '0%' : `${(student.metrics.lmp * 100).toFixed(0)}%`;

  // ==========================================
  // CALCULAR VELOCITY EN XP REALES
  // ==========================================
  const velocityInXP = Math.round((student.metrics.velocityScore / 100) * DRI_CONFIG.ALPHA_WEEKLY_STANDARD);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl p-4">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="bg-[#080808] border border-slate-800 w-full max-w-6xl h-[90vh] rounded-[2.5rem] relative z-10 flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* ========================================== */}
        {/* HEADER */}
        {/* ========================================== */}
        <div className="p-8 border-b border-slate-800 flex justify-between items-start bg-slate-900/30">
          <div className="flex gap-8 items-center">
             {/* Velocity Badge */}
             <div className={`w-20 h-20 rounded-full border-4 flex items-center justify-center text-2xl font-black italic ${
               student.dri.driTier === 'RED' ? 'border-red-500 text-red-500' : 
               student.dri.driTier === 'YELLOW' ? 'border-amber-500 text-amber-500' :
               'border-emerald-500 text-emerald-500'
             }`}>
               {student.metrics.velocityScore || 0}
             </div>
             
             <div>
                <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase">
                  {student.firstName} {student.lastName}
                </h2>
                
                <div className="flex gap-4 mt-2 font-black text-[10px] uppercase">
                  {/* DRI Signal Badge */}
                  <span className={`px-3 py-1 rounded-full border border-current ${student.dri.driColor}`}>
                    {student.dri.driSignal}
                  </span>
                  
                  {/* Course Badge */}
                  <span className="text-slate-500 self-center">{student.currentCourse?.name}</span>
                  
                  {/* Risk Score Badge (si está disponible) */}
                  {student.dri.riskScore !== undefined && (
                    <span className={`px-3 py-1 rounded-full border ${
                      student.dri.riskScore >= 60 ? 'border-red-500 text-red-400' :
                      student.dri.riskScore >= 35 ? 'border-amber-500 text-amber-400' :
                      'border-emerald-500 text-emerald-400'
                    }`}>
                      Risk: {student.dri.riskScore}/100
                    </span>
                  )}
                </div>
                
                {/* Velocity en XP reales */}
                <div className="mt-2 text-[10px] text-slate-600 font-mono">
                  {velocityInXP} XP / {DRI_CONFIG.ALPHA_WEEKLY_STANDARD} XP semanal • 
                  <span className={`ml-2 ${
                    student.metrics.velocityScore >= 100 ? 'text-emerald-500' :
                    student.metrics.velocityScore >= 80 ? 'text-amber-400' :
                    'text-red-400'
                  }`}>
                    {student.metrics.velocityScore}% velocity
                  </span>
                </div>
             </div>
          </div>
          
          <button onClick={onClose} className="text-slate-600 hover:text-white text-2xl transition-colors">✕</button>
        </div>

        <div className="flex-1 p-8 grid grid-cols-12 gap-10 overflow-y-auto custom-scrollbar">
          
          {/* ========================================== */}
          {/* COL IZQUIERDA: DIAGNÓSTICO */}
          {/* ========================================== */}
          <div className="col-span-4 space-y-8">
             
             {/* RSR Card */}
             <div className="p-6 bg-slate-900/40 rounded-3xl border border-slate-800 text-center shadow-inner">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
                  Recent Success Rate (RSR)
                </p>
                <p className="text-5xl font-black text-white italic">{rsrDisplay}</p>
                <p className="text-[9px] text-indigo-400 mt-4 font-bold uppercase italic tracking-widest">
                  Estado: {student.metrics.stallStatus || 'Optimal'}
                </p>
                <p className="text-[8px] text-slate-600 mt-2">
                  Last {DRI_CONFIG.RSR_RECENT_TASKS_COUNT} tasks • &gt;{DRI_CONFIG.RSR_SUCCESS_THRESHOLD * 100}% threshold
                </p>
             </div>

             {/* Outer Fringe (Acceleration) */}
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
             
             {/* DRI Metrics Card */}
             <div className="bg-slate-900/40 border border-slate-800 p-6 rounded-3xl">
                <h3 className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-4">
                  📊 DRI Metrics (Alpha Protocol)
                </h3>
                <div className="space-y-3 text-xs">
                  
                  {/* iROI */}
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">iROI:</span>
                    {student.dri.iROI !== null ? (
                      <span className="font-mono font-bold text-white">{student.dri.iROI}</span>
                    ) : (
                      <span className="text-slate-600 text-[10px]">No data</span>
                    )}
                  </div>
                  
                  {/* DER */}
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">
                      Debt Exposure:
                      <span className="text-[9px] text-slate-700 ml-1">(&gt;{DRI_CONFIG.DER_CRITICAL_THRESHOLD}%)</span>
                    </span>
                    {student.dri.debtExposure !== null ? (
                      <span className={`font-mono font-bold ${
                        student.dri.debtExposure > DRI_CONFIG.DER_SEVERE_THRESHOLD ? 'text-red-400' :
                        student.dri.debtExposure > DRI_CONFIG.DER_CRITICAL_THRESHOLD ? 'text-amber-400' : 
                        'text-emerald-400'
                      }`}>
                        {student.dri.debtExposure}%
                      </span>
                    ) : (
                      <span className="text-slate-600 text-[10px]">Insufficient data</span>
                    )}
                  </div>
                  
                  {/* PDI */}
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">
                      Precision Decay:
                      <span className="text-[9px] text-slate-700 ml-1">(&gt;{DRI_CONFIG.PDI_CRITICAL_THRESHOLD})</span>
                    </span>
                    {student.dri.precisionDecay !== null ? (
                      <span className={`font-mono font-bold ${
                        student.dri.precisionDecay > DRI_CONFIG.PDI_SEVERE_THRESHOLD ? 'text-red-400' :
                        student.dri.precisionDecay > DRI_CONFIG.PDI_CRITICAL_THRESHOLD ? 'text-amber-400' : 
                        'text-emerald-400'
                      }`}>
                        {student.dri.precisionDecay}x
                      </span>
                    ) : (
                      <span className="text-slate-600 text-[10px]">No data</span>
                    )}
                  </div>
                  
                  {/* KSI */}
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">
                      KSI:
                      <span className="text-[9px] text-slate-700 ml-1">(&lt;{DRI_CONFIG.KSI_LOW_THRESHOLD}%)</span>
                    </span>
                    <span className={`font-mono font-bold ${
                      student.metrics.ksi < DRI_CONFIG.KSI_CRITICAL_THRESHOLD ? 'text-red-400' :
                      student.metrics.ksi < DRI_CONFIG.KSI_LOW_THRESHOLD ? 'text-amber-400' :
                      'text-blue-400'
                    }`}>
                      {student.metrics.ksi}%
                    </span>
                  </div>
                  
                  {/* Accuracy */}
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Accuracy:</span>
                    <span className={`font-mono font-bold ${
                      (student.metrics.accuracyRate || 0) >= 70 ? 'text-emerald-400' :
                      (student.metrics.accuracyRate || 0) >= 55 ? 'text-amber-400' :
                      'text-red-400'
                    }`}>
                      {student.metrics.accuracyRate || 0}%
                    </span>
                  </div>
                  
                  {/* Focus Integrity */}
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Focus Integrity:</span>
                    <span className="font-mono font-bold text-purple-400">
                      {student.metrics.focusIntegrity}%
                    </span>
                  </div>
                </div>
             </div>
          </div>

          {/* ========================================== */}
          {/* COL DERECHA: GRÁFICO Y TABLA */}
          {/* ========================================== */}
          <div className="col-span-8 space-y-8">
            
            {/* Gráfico de Precisión */}
            <div className="bg-slate-900/20 rounded-[2.5rem] border border-slate-800 p-8">
               <div className="flex justify-between items-center mb-6">
                 <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] italic">
                   Curva de Precisión - Últimas {chartData.length} Sesiones
                 </h3>
                 {chartData.length >= 5 && (
                   <div className="text-[10px] text-slate-600 font-mono">
                     PDI: {student.dri.precisionDecay ? 
                       <span className={
                         student.dri.precisionDecay > DRI_CONFIG.PDI_SEVERE_THRESHOLD ? 'text-red-400' :
                         student.dri.precisionDecay > DRI_CONFIG.PDI_CRITICAL_THRESHOLD ? 'text-amber-400' :
                         'text-emerald-400'
                       }>
                         {student.dri.precisionDecay}x
                       </span>
                       : 'N/A'
                     }
                   </div>
                 )}
               </div>
               
               <ResponsiveContainer width="100%" height={250}>
                 <LineChart data={chartData} margin={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                   <CartesianGrid stroke="#1e293b" vertical={false} strokeDasharray="3 3" />
                   <XAxis 
                     dataKey="i" 
                     stroke="#475569" 
                     fontSize={10} 
                     label={{ value: 'Session #', position: 'insideBottom', offset: -5, fill: '#64748b' }} 
                   />
                   <YAxis 
                     domain={[0, 110]} 
                     ticks={[0, 25, 50, 75, 100]} 
                     stroke="#475569" 
                     fontSize={10} 
                     label={{ value: 'Accuracy %', angle: -90, position: 'insideLeft', fill: '#64748b' }} 
                   />
                   <Tooltip 
                     contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '15px' }}
                     labelFormatter={(value) => `Session ${value}`}
                     formatter={(value: any, name: string) => {
                       if (name === 'acc') return [`${value}%`, 'Accuracy'];
                       return [value, name];
                     }}
                   />
                   <Line 
                     type="monotone" 
                     dataKey="acc" 
                     stroke="#6366f1" 
                     strokeWidth={3} 
                     dot={{ r: 4, fill: '#6366f1' }} 
                     activeDot={{ r: 8 }} 
                   />
                 </LineChart>
               </ResponsiveContainer>
            </div>

            {/* Tabla de Sesiones */}
            <div className="bg-slate-900/10 rounded-3xl border border-slate-800 overflow-hidden">
               <div className="p-4 bg-slate-900/40 border-b border-slate-800 flex justify-between items-center">
                 <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                   Historial de Sesiones (Recientes Primero)
                 </span>
                 <span className="text-[9px] text-slate-600 font-mono">
                   Total: {sortedData.length} sessions
                 </span>
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
                        {sortedData.slice(0, 30).map((task: any, idx: number) => (
                           <tr key={idx} className="hover:bg-slate-900/30 transition-colors">
                              <td className="p-4 text-[10px] font-mono text-slate-500">{task.date}</td>
                              <td className="p-4 text-[11px] font-bold text-slate-300 uppercase italic truncate max-w-[250px]">
                                {task.topic}
                              </td>
                              <td className="p-4 text-center">
                                 <span className={`text-[10px] font-mono font-black ${
                                   task.acc >= 80 ? 'text-emerald-500' : 
                                   task.acc >= 50 ? 'text-amber-500' : 
                                   'text-red-500'
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
