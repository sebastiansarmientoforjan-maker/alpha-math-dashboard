'use client';

import { useState, useEffect, useMemo } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';
import StudentModal from '@/components/StudentModal';
import { calculateTier1Metrics } from '@/lib/metrics';
import { calculateDRIMetrics } from '@/lib/dri-calculus';
import { Student } from '@/types';

export default function PanelPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [viewMode, setViewMode] = useState<'TRIAGE' | 'MATRIX' | 'LOG'>('TRIAGE');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [search, setSearch] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('ALL');

  useEffect(() => {
    const unsub = onSnapshot(query(collection(db, 'students')), (snap) => {
      const data = snap.docs.map(doc => {
        const s = { id: doc.id, ...doc.data() } as any;
        const metrics = calculateTier1Metrics(s, s.activity);
        const dri = calculateDRIMetrics({ ...s, metrics });
        return { ...s, metrics, dri };
      });
      setStudents(data);
    });
    return () => unsub();
  }, []);

  const uniqueCourses = useMemo(() => Array.from(new Set(students.map(s => s.currentCourse?.name).filter(Boolean))).sort(), [students]);

  const filtered = useMemo(() => students.filter(s => {
    const nameMatch = `${s.firstName} ${s.lastName}`.toLowerCase().includes(search.toLowerCase());
    const courseMatch = selectedCourse === 'ALL' || s.currentCourse?.name === selectedCourse;
    return nameMatch && courseMatch;
  }), [students, search, selectedCourse]);

  return (
    <div className="p-6 bg-[#050505] min-h-screen text-slate-300 font-sans">
      <div className="flex justify-between items-end mb-8 border-b border-slate-800 pb-6 gap-4">
        <div>
          <h1 className="text-3xl font-black uppercase italic text-white tracking-tighter">Alpha Command V3.3</h1>
          <p className="text-[10px] text-indigo-400 font-bold tracking-[0.3em] uppercase">Intelligence Mode: KeenKT + DRI Triage</p>
        </div>
        <div className="flex bg-slate-900/50 p-1 rounded-xl border border-slate-800">
          {['TRIAGE', 'MATRIX', 'LOG'].map(m => (
            <button key={m} onClick={() => setViewMode(m as any)} className={`px-5 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${viewMode === m ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500'}`}>{m}</button>
          ))}
        </div>
      </div>

      <div className="flex gap-4 mb-8">
        <input onChange={e => setSearch(e.target.value)} placeholder="🔎 SEARCH UNIT..." className="flex-1 bg-slate-900/40 border border-slate-800 rounded-2xl px-6 py-4 text-sm focus:border-indigo-500 outline-none font-mono" />
        <select onChange={e => setSelectedCourse(e.target.value)} className="bg-slate-900 border border-slate-800 rounded-2xl px-4 text-[10px] font-black uppercase text-slate-400">
          <option value="ALL">ALL COURSES</option>
          {uniqueCourses.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div className="h-[calc(100vh-280px)]">
        {viewMode === 'TRIAGE' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
            {['RED', 'YELLOW', 'GREEN'].map(tier => (
              <div key={tier} className="flex flex-col bg-slate-900/20 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
                <div className={`p-4 border-b border-slate-800 font-black text-[10px] uppercase tracking-widest ${tier === 'RED' ? 'text-red-500' : tier === 'YELLOW' ? 'text-amber-500' : 'text-emerald-500'}`}>{tier} ZONE - {filtered.filter(s => s.dri.driTier === tier).length} UNITS</div>
                <div className="p-4 space-y-3 overflow-y-auto custom-scrollbar">
                  {filtered.filter(s => s.dri.driTier === tier).map(s => (
                    <div key={s.id} onClick={() => setSelectedStudent(s)} className="p-4 bg-slate-900/80 rounded-2xl border-l-4 border-current cursor-pointer hover:scale-[1.02] transition-all">
                      <div className="flex justify-between items-start mb-1">
                        <h3 className="font-black text-white text-sm uppercase italic">{s.firstName} {s.lastName}</h3>
                        <span className="text-[10px] font-mono font-bold text-slate-500">{(s.metrics.lmp * 100).toFixed(0)}% LMP</span>
                      </div>
                      <p className="text-[9px] text-slate-500 font-bold uppercase mb-2">{s.currentCourse.name}</p>
                      <div className="flex justify-between text-[10px] font-mono">
                        <span className="text-indigo-400">KSI: {s.metrics.ksi}% Stability</span>
                        <span className="text-red-500">DER: {s.dri.debtExposure}% Debt</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {viewMode === 'MATRIX' && (
          <div className="h-full w-full bg-slate-900/10 border border-slate-800 rounded-[2.5rem] p-8 relative overflow-hidden">
            <div className="absolute top-12 right-12 text-emerald-500/5 font-black text-7xl select-none uppercase italic tracking-tighter">Flow Masters</div>
            <div className="absolute bottom-12 left-12 text-red-500/5 font-black text-7xl select-none uppercase italic tracking-tighter">Stability Leak</div>
            <ResponsiveContainer>
              <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 0 }}>
                <CartesianGrid stroke="#1e293b" vertical={false} />
                <XAxis type="number" dataKey="metrics.lmp" name="Mastery" domain={[0, 1]} stroke="#475569" fontSize={10} />
                <YAxis type="number" dataKey="metrics.ksi" name="Stability" domain={[0, 100]} stroke="#475569" fontSize={10} />
                <ZAxis type="number" range={[100, 600]} />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                <ReferenceLine x={0.7} stroke="#10b981" strokeDasharray="5 5" opacity={0.3} />
                <ReferenceLine y={60} stroke="#ef4444" strokeDasharray="5 5" opacity={0.3} />
                <Scatter data={filtered} onClick={n => setSelectedStudent(n.payload)}>
                  {filtered.map((e, i) => <Cell key={i} fill={e.dri.driTier === 'RED' ? '#f43f5e' : e.dri.driTier === 'YELLOW' ? '#f59e0b' : '#10b981'} className="cursor-pointer opacity-60 hover:opacity-100 transition-all duration-300" />)}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {selectedStudent && <StudentModal student={selectedStudent} onClose={() => setSelectedStudent(null)} />}
    </div>
  );
}
