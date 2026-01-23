'use client';

import { useMemo, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function StudentModal({ student, onClose }: { student: any; onClose: () => void }) {
  const [loading, setLoading] = useState(false);

  // 1. Extracción Segura de Tareas (Evita pantalla blanca si no hay historial)
  const tasks = student?.activity?.tasks || [];

  // 2. Preparación de Datos para Gráfico (Evita NaN en divisiones)
  const chartData = useMemo(() => tasks.map((t: any, i: number) => ({
    i: i + 1, 
    acc: Math.round((t.questionsCorrect / (t.questions || 1)) * 100),
    topic: t.topic?.name || 'Práctica General'
  })), [tasks]);

  // 3. Cálculo de Outer Fringe (Aceleración)
  const readyToAccelerate = useMemo(() => {
    const highMasteryTasks = tasks
      .filter((t: any) => (t.questionsCorrect / (t.questions || 1)) > 0.8)
      .map((t: any) => t.topic?.name);
    return Array.from(new Set(highMasteryTasks)).slice(0, 3); // Top 3 candidatos
  }, [tasks]);

  // 4. Fallback visual para LMP
  const lmpValue = (student.metrics?.lmp && !isNaN(student.metrics.lmp)) 
    ? (student.metrics.lmp * 100).toFixed(0) 
    : '0';

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
          targetTopic: student.metrics.nemesisTopic || 'General Coaching',
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
        
        {/* HEADER */}
        <div className="p-8 border-b border-slate-800 flex justify-between items-start bg-slate-900/30">
          <div className="flex gap-8 items-center">
             <div className="w-20 h-20 rounded-full border-4 flex items-center justify-center text-2xl font-black italic border-emerald-500 text-emerald-500 bg-slate-900">
               {student.metrics?.velocityScore || 0}
             </div>
             <div>
                <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase">{student.firstName} {student.lastName}</h2>
                <div className="flex gap-4 mt-2 font-black text-[10px] uppercase tracking-widest">
                  <span className={`px-3 py-1 rounded-full border ${student.dri.driTier === 'RED' ? 'bg-red-500/10 text-red-500 border-red-500/50' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/50'}`}>
                    {student.dri.driSignal}
                  </span>
                  <span className="text-slate-500 self-center">{student.currentCourse?.name || 'Sin Asignación'}</span>
                </div>
             </div>
          </div>
          <button onClick={onClose} className="text-slate-600 hover:text-white text-2xl transition-transform hover:rotate-90">✕</button>
        </div>

        <div className="flex-1 p-8 grid grid-cols-12 gap-10 overflow-y-auto custom-scrollbar">
          
          {/* COLUMNA IZQUIERDA: DIAGNÓSTICO */}
          <div className="col-span-4 space-y-8">
             <div className="p-6 bg-slate-900/40 rounded-3xl border border-slate-800 text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-50" />
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Mastery Probability (LMP)</p>
                <p className="text-6xl font-black text-white italic tracking-tighter">{lmpValue}%</p>
                <p className={`text-[9px] mt-4 font-bold uppercase italic tracking-widest ${student.metrics?.stallStatus === 'Optimal' ? 'text-emerald-500' : 'text-amber-500'}`}>
                   ESTADO: {student.metrics?.stallStatus || 'ANALYZING...'}
                </p>
             </div>

             {/* MÓDULO OUTER FRINGE */}
             <div className="bg-indigo-950/10 border border-indigo-500/20 p-6 rounded-3xl">
                <h3 className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-4 italic flex items-center gap-2">
                   <span className="w-1.5 h-1.5 bg-indigo-
