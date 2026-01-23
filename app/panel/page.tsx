'use client';

import { useState, useEffect, useMemo } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';
import StudentModal from '@/components/StudentModal';
import { calculateScientificMetrics } from '@/lib/metrics';
import { calculateDRIMetrics } from '@/lib/dri-calculus';
import { Student } from '@/types';

export default function PanelPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [viewMode, setViewMode] = useState<'TRIAGE' | 'MATRIX' | 'RADAR'>('TRIAGE');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const unsub = onSnapshot(query(collection(db, 'students')), (snap) => {
      const data = snap.docs.map(doc => {
        const s = { id: doc.id, ...doc.data() } as any;
        const sciMetrics = calculateScientificMetrics(s, s.activity);
        const dri = calculateDRIMetrics({ ...s, metrics: sciMetrics });
        return { ...s, metrics: sciMetrics, dri };
      });
      setStudents(data);
    });
    return () => unsub();
  }, []);

  const filtered = students.filter(s => `${s.firstName} ${s.lastName}`.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-6 bg-[#050505] min-h-screen text-slate-300 font-sans">
      {/* HEADER & NAVIGATION */}
      <div className="flex justify-between items-center mb-8 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-3xl font-black uppercase italic text-white tracking-tighter">Alpha Command V3.0</h1>
          <p className="text-[10px] text-indigo-400 font-bold tracking-[0.3em] uppercase">Intelligence Mode: KeenKT + DRI</p>
        </div>
        <div className="flex bg-slate-900/50 p-1 rounded-xl border border-slate-800">
          {['TRIAGE', 'MATRIX', 'RADAR'].map(m => (
            <button key={m} onClick={() => setViewMode(m as any)} className={`px-5 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${viewMode === m ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}>{m}</button>
          ))}
        </div>
      </div>

      <input onChange={e => setSearch(e.target.value)} placeholder="🔎 SEARCH UNIT..." className="w-full bg-slate-900/40 border border-slate-800 rounded-2xl px-6 py-4 mb-8 text-sm focus:border-indigo-500 outline-none font-mono" />

      {/* RENDER LOGIC */}
      <div className="h-[calc(100vh-280px)]">
        {viewMode === 'TRIAGE' && (
          <div className="grid grid-cols-3 gap-6 h-full">
            {['RED', 'YELLOW', 'GREEN'].map(tier => (
              <div key={tier} className="flex flex-col bg-slate-900/20 border border-slate-800 rounded-3xl overflow-hidden">
                <div className={`p-4 border-b border-slate-800 font-black text-[10px] uppercase tracking-widest ${tier === 'RED' ? 'text-red-500' : tier === 'YELLOW' ? 'text-amber-500' : 'text-emerald-500'}`}>{tier} ZONE</div>
                <div className="p-4 space-y-3 overflow-y-auto custom-scrollbar">
                  {filtered.filter(s => s.dri.driTier === tier).map(s => (
                    <div key={s.id} onClick={() => setSelectedStudent(s)} className="p-4 bg-slate-900/80 rounded-2xl border-l-4 border-current cursor-pointer hover:scale-[1.02] transition-all">
                      <p className="font-black text-white text-sm uppercase italic">{s.firstName} {s.lastName}</p>
                      <p className="text-[9px] text-slate-500 font-bold mb-2">{s.currentCourse.name}</p>
                      <div className="flex justify-between text-[10px] font-mono">
                        <span className="text-indigo-400">KSI: {s.metrics.ksi}%</span>
                        <span className="text-red-500">DER: {s.dri.debtExposure}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {viewMode === 'MATRIX' && (
          <div className="h-full w-full bg-slate-900/10 border border-slate-800 rounded-3xl p-8 relative">
            <ResponsiveContainer>
              <ScatterChart>
                <CartesianGrid stroke="#1e293b" />
                <XAxis type="number" dataKey="metrics.lmp" name="Mastery" domain={[0, 1]} stroke="#475569" fontSize={10} />
                <YAxis type="number" dataKey="metrics.ksi" name="Stability" domain={[0, 100]} stroke="#475569" fontSize={10} />
                <ZAxis type="number" range={[100, 800]} />
                <Tooltip />
                <Scatter data={filtered} onClick={n => setSelectedStudent(n.payload)}>
                  {filtered.map((e, i) => <Cell key={i} fill={e.dri.driTier === 'RED' ? '#f43f5e' : '#6366f1'} className="cursor-pointer" />)}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        )}
        
        {viewMode === 'RADAR' && (
          <div className="h-full bg-slate-900/20 border border-slate-800 rounded-3xl p-8 flex flex-col items-center justify-center">
             <div className="text-indigo-400 font-black text-2xl uppercase italic mb-4 animate-pulse">Intervention Pulse Active</div>
             <p className="text-slate-500 text-xs text-center max-w-md">Analizando estancamientos sistémicos y latencia de ayuda en tiempo real basada en ITS Models[cite: 75].</p>
          </div>
        )}
      </div>

      {selectedStudent && <StudentModal student={selectedStudent} onClose={() => setSelectedStudent(null)} />}
    </div>
  );
}
