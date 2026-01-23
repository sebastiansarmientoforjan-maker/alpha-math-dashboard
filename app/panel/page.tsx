'use client';

import { useState, useEffect, useMemo } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query } from 'firebase/firestore';
import StudentModal from '@/components/StudentModal';
import { calculateTier1Metrics } from '@/lib/metrics';
import { calculateDRIMetrics } from '@/lib/dri-calculus';
import { Student } from '@/types';

export default function PanelPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const unsub = onSnapshot(query(collection(db, 'students')), (snapshot) => {
      const data = snapshot.docs.map(doc => {
        const s = { id: doc.id, ...doc.data() } as any;
        const metrics = calculateTier1Metrics(s, s.activity);
        const dri = calculateDRIMetrics({ ...s, metrics });
        return { ...s, metrics, dri };
      }) as Student[];
      setStudents(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const filtered = useMemo(() => students.filter(s => 
    `${s.firstName} ${s.lastName}`.toLowerCase().includes(search.toLowerCase())
  ), [students, search]);

  const redZone = filtered.filter(s => s.dri.driTier === 'RED');
  const yellowZone = filtered.filter(s => s.dri.driTier === 'YELLOW');
  const greenZone = filtered.filter(s => s.dri.driTier === 'GREEN' && (s.metrics?.accuracyRate || 0) > 0);

  if (loading) return <div className="p-10 bg-black min-h-screen text-emerald-500 font-mono italic animate-pulse tracking-widest uppercase">DRI Cockpit Initializing...</div>;

  return (
    <div className="p-6 bg-[#050505] min-h-screen text-slate-300 font-sans">
      <div className="mb-8 border-b border-slate-800 pb-6 flex justify-between items-end">
         <div>
            <h1 className="text-3xl font-black uppercase italic text-white tracking-tighter">DRI COMMAND V3.8</h1>
            <p className="text-[10px] text-indigo-400 font-bold tracking-[0.3em] uppercase mt-1">Direct Instruction Triage Protocol</p>
         </div>
      </div>

      <input onChange={e => setSearch(e.target.value)} placeholder="🔎 SEARCH UNIT BY NAME..." className="w-full bg-slate-900/40 border border-slate-800 rounded-2xl px-6 py-4 mb-8 text-sm focus:border-indigo-500 outline-none font-mono" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-280px)]">
        {[
          { id: 'RED', label: '🚨 Critical Ops', data: redZone, color: 'text-red-500', border: 'border-red-500' },
          { id: 'YELLOW', label: '⚠️ Watch List', data: yellowZone, color: 'text-amber-500', border: 'border-amber-500' },
          { id: 'GREEN', label: '⚡ Honors Track', data: greenZone, color: 'text-emerald-500', border: 'border-emerald-500' }
        ].map(column => (
          <div key={column.id} className="flex flex-col bg-slate-900/20 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
            <div className="p-4 flex justify-between items-center bg-slate-900/40 border-b border-slate-800">
               <h2 className={`font-black text-[10px] uppercase tracking-widest ${column.color}`}>{column.label}</h2>
               <span className="bg-slate-800 text-slate-400 text-[9px] px-2 py-1 rounded font-mono font-black">{column.data.length} ALUMNOS</span>
            </div>
            <div className="p-4 space-y-3 overflow-y-auto custom-scrollbar">
              {column.data.map(s => (
                <div key={s.id} onClick={() => setSelectedStudent(s)} className={`p-4 bg-slate-900/80 rounded-2xl border-l-4 ${column.border} cursor-pointer hover:scale-[1.02] transition-all`}>
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-black text-white text-sm uppercase italic truncate w-40">{s.firstName} {s.lastName}</h3>
                    <span className="text-[10px] font-mono font-bold text-slate-500 italic">{(s.metrics.lmp * 100).toFixed(0)}% LMP</span>
                  </div>
                  <p className="text-[9px] text-indigo-400/70 font-bold uppercase mb-2">{s.currentCourse.name}</p>
                  <div className="flex justify-between text-[10px] font-mono">
                    <span className="text-slate-600 uppercase text-[8px] font-black">Status: <span className={column.color}>{s.dri.driSignal}</span></span>
                    <span className="text-slate-600 italic">KSI: {s.metrics.ksi}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      {selectedStudent && <StudentModal student={selectedStudent} onClose={() => setSelectedStudent(null)} />}
    </div>
  );
}
