'use client';

import { useState, useEffect, useMemo } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query } from 'firebase/firestore';
import StudentModal from '@/components/StudentModal';
import { calculateDRIMetrics } from '@/lib/dri-calculus';
import { Student } from '@/types';

export default function PanelPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [search, setSearch] = useState('');

  // --- DATA LOADING ---
  useEffect(() => {
    const q = query(collection(db, 'students'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Student[];
      setStudents(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // --- PROCESAMIENTO DRI EN TIEMPO REAL ---
  const processedStudents = useMemo(() => {
    return students.map(s => {
       const dri = calculateDRIMetrics(s);
       return { ...s, dri };
    });
  }, [students]);

  // --- FILTRADO POR BÚSQUEDA ---
  const filtered = processedStudents.filter(s => {
     const name = `${s.firstName} ${s.lastName}`.toLowerCase();
     return name.includes(search.toLowerCase());
  });

  // --- SEPARACIÓN EN CUBETAS DE TRIAJE (BUCKETS) ---
  const redZone = filtered.filter(s => s.dri.driTier === 'RED');
  const yellowZone = filtered.filter(s => s.dri.driTier === 'YELLOW');
  const greenZone = filtered.filter(s => s.dri.driTier === 'GREEN');

  if (loading) return <div className="p-10 bg-black min-h-screen text-emerald-500 font-mono italic animate-pulse">BOOTING DRI ENGINE...</div>;

  return (
    <div className="p-4 bg-[#050505] min-h-screen text-slate-300 font-sans">
      
      {/* HEADER TÁCTICO */}
      <div className="flex justify-between items-end mb-8 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tighter text-white italic">DRI COMMAND v2.1</h1>
          <p className="text-[10px] text-slate-500 tracking-widest uppercase mt-1">Direct Instruction Triage Protocol</p>
        </div>
        <div className="flex gap-4">
           {/* STATS VITALES */}
           <div className="text-right">
              <div className="text-[9px] text-slate-600 uppercase font-bold">System Load</div>
              <div className="text-xl font-mono font-bold text-white">{students.length} <span className="text-xs text-slate-500">Units</span></div>
           </div>
           <div className="text-right">
              <div className="text-[9px] text-red-900 uppercase font-bold">Critical Load</div>
              <div className="text-xl font-mono font-bold text-red-500">{redZone.length} <span className="text-xs text-red-900/50">Units</span></div>
           </div>
        </div>
      </div>

      {/* BARRA DE BÚSQUEDA GLOBAL */}
      <div className="mb-6">
        <input 
          onChange={(e) => setSearch(e.target.value)}
          placeholder="🔎 Filter by ID or Name..." 
          className="w-full bg-slate-900/50 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 outline-none transition-colors text-white font-mono"
        />
      </div>

      {/* --- TRIAGE COLUMNS (THE NEW UX) --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
        
        {/* COLUMNA 1: RED ZONE (ACCIÓN INMEDIATA) */}
        <div className="flex flex-col bg-red-950/5 border border-red-900/20 rounded-2xl overflow-hidden">
           <div className="p-4 bg-red-950/20 border-b border-red-900/20 flex justify-between items-center">
              <h2 className="text-xs font-black text-red-500 uppercase tracking-widest flex items-center gap-2">
                 🔴 Critical Ops
              </h2>
              <span className="bg-red-500 text-black text-[10px] font-bold px-2 py-0.5 rounded-full">{redZone.length}</span>
           </div>
           <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {redZone.map(s => (
                 <div key={s.id} onClick={() => setSelectedStudent(s)} className="bg-slate-900/80 p-3 rounded-xl border-l-4 border-red-500 cursor-pointer hover:bg-slate-800 transition-all group relative overflow-hidden">
                    <div className="flex justify-between items-start mb-1">
                       <h3 className="font-bold text-white text-sm group-hover:text-red-400">{s.firstName} {s.lastName}</h3>
                       <span className="text-[10px] font-mono text-slate-500">{s.metrics?.velocityScore}% Vel</span>
                    </div>
                    <div className="flex justify-between items-center">
                       <span className="text-[10px] uppercase font-bold text-red-400 bg-red-900/20 px-2 py-0.5 rounded">
                         {s.dri.driSignal}
                       </span>
                       {s.metrics?.nemesisTopic && <span className="text-[10px] text-slate-500 italic truncate max-w-[100px]">"{s.metrics.nemesisTopic}"</span>}
                    </div>
                 </div>
              ))}
              {redZone.length === 0 && <div className="text-center text-slate-600 text-xs py-10">No critical alerts.</div>}
           </div>
        </div>

        {/* COLUMNA 2: YELLOW ZONE (VIGILANCIA) */}
        <div className="flex flex-col bg-amber-950/5 border border-amber-900/20 rounded-2xl overflow-hidden">
           <div className="p-4 bg-amber-950/20 border-b border-amber-900/20 flex justify-between items-center">
              <h2 className="text-xs font-black text-amber-500 uppercase tracking-widest flex items-center gap-2">
                 ⚠️ Watch List
              </h2>
              <span className="bg-amber-500 text-black text-[10px] font-bold px-2 py-0.5 rounded-full">{yellowZone.length}</span>
           </div>
           <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {yellowZone.map(s => (
                 <div key={s.id} onClick={() => setSelectedStudent(s)} className="bg-slate-900/80 p-3 rounded-xl border-l-4 border-amber-500 cursor-pointer hover:bg-slate-800 transition-all group">
                    <div className="flex justify-between items-start mb-1">
                       <h3 className="font-bold text-slate-200 text-sm">{s.firstName} {s.lastName}</h3>
                       <span className="text-[10px] font-mono text-amber-500/50">ROI: {s.dri.iROI}</span>
                    </div>
                    <div className="text-[10px] text-amber-400 font-mono">
                       Signal: {s.dri.driSignal}
                    </div>
                    {s.dri.precisionDecay > 1.2 && (
                       <div className="w-full bg-slate-800 h-1 mt-2 rounded-full overflow-hidden">
                          <div className="bg-amber-500 h-full" style={{width: `${(s.dri.precisionDecay - 1) * 100}%`}}></div>
                       </div>
                    )}
                 </div>
              ))}
           </div>
        </div>

        {/* COLUMNA 3: GREEN ZONE (FLOW) */}
        <div className="flex flex-col bg-emerald-950/5 border border-emerald-900/20 rounded-2xl overflow-hidden">
           <div className="p-4 bg-emerald-950/20 border-b border-emerald-900/20 flex justify-between items-center">
              <h2 className="text-xs font-black text-emerald-500 uppercase tracking-widest flex items-center gap-2">
                 ⚡ Honors Track
              </h2>
              <span className="bg-emerald-500 text-black text-[10px] font-bold px-2 py-0.5 rounded-full">{greenZone.length}</span>
           </div>
           <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {greenZone.map(s => (
                 <div key={s.id} onClick={() => setSelectedStudent(s)} className="bg-slate-900/50 p-2 rounded-lg border border-slate-800 cursor-pointer hover:border-emerald-500/50 transition-all flex justify-between items-center opacity-70 hover:opacity-100">
                    <div>
                       <div className="font-bold text-slate-300 text-xs">{s.firstName} {s.lastName}</div>
                       <div className="text-[9px] text-emerald-600 uppercase font-bold tracking-wider">Flowing</div>
                    </div>
                    <div className="text-right">
                       <div className="text-[10px] font-mono text-emerald-400">{s.metrics?.velocityScore}%</div>
                       <div className="text-[8px] text-slate-600">Vel</div>
                    </div>
                 </div>
              ))}
           </div>
        </div>

      </div>

      {/* MODAL LAYER */}
      {selectedStudent && (
        <StudentModal 
          student={selectedStudent} 
          onClose={() => setSelectedStudent(null)} 
        />
      )}

    </div>
  );
}
