'use client';

import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function StudentModal({ student, onClose }: { student: any; onClose: () => void }) {
  const chartData = useMemo(() => student.activity.tasks.map((t: any, i: number) => ({
    i: i + 1, acc: Math.round((t.questionsCorrect / t.questions) * 100)
  })), [student]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="bg-[#080808] border border-slate-800 w-full max-w-5xl h-[85vh] rounded-[2.5rem] relative z-10 flex flex-col shadow-2xl overflow-hidden">
        <div className="p-8 border-b border-slate-800 flex justify-between items-start bg-slate-900/30">
          <div>
            <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase">{student.firstName} {student.lastName}</h2>
            <div className="flex gap-4 mt-2">
              <span className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/30 rounded-full text-[10px] font-black text-indigo-400 uppercase">KSI: {student.metrics.ksi}% Stability</span>
              <span className="px-3 py-1 bg-red-500/10 border border-red-500/30 rounded-full text-[10px] font-black text-red-400 uppercase">DER: {student.dri.debtExposure}% Debt</span>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-600 hover:text-white text-2xl">✕</button>
        </div>

        <div className="flex-1 p-8 grid grid-cols-12 gap-8 overflow-y-auto">
          <div className="col-span-4 space-y-6">
             <div className="p-6 bg-slate-900/40 rounded-3xl border border-slate-800 text-center">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Mastery Probability (LMP)</p>
                <p className="text-5xl font-black text-white italic">{(student.metrics.lmp * 100).toFixed(0)}%</p>
                <p className="text-[9px] text-indigo-400 mt-4 font-bold">ESTADO: {student.metrics.stallStatus}</p>
             </div>
             <div className="p-6 bg-slate-900/40 rounded-3xl border border-slate-800">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Tactical Intervention</p>
                <button className="w-full py-4 bg-indigo-600 rounded-2xl text-[10px] font-black uppercase tracking-widest mb-2 shadow-lg shadow-indigo-900/20">Assign Remedial Task</button>
                <button className="w-full py-4 border border-slate-700 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400">Flag for Follow-up</button>
             </div>
          </div>

          <div className="col-span-8 bg-slate-900/20 rounded-[2rem] border border-slate-800 p-8">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-8">Precision Decay Analysis (Real-time PDI)</p>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={chartData}>
                <CartesianGrid stroke="#1e293b" vertical={false} />
                <XAxis dataKey="i" stroke="#475569" fontSize={10} />
                <YAxis domain={[0, 100]} stroke="#475569" fontSize={10} />
                <Tooltip />
                <Line type="monotone" dataKey="acc" stroke="#6366f1" strokeWidth={4} dot={{r: 4, fill: '#6366f1'}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
