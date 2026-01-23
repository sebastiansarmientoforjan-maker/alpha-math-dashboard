'use client';

import { useState, useEffect, useMemo } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import StudentModal from '@/components/StudentModal';
import { calculateTier1Metrics } from '@/lib/metrics';
import { calculateDRIMetrics } from '@/lib/dri-calculus';
import { Student } from '@/types';

export default function HomePage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [autoSync, setAutoSync] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  
  const [search, setSearch] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('ALL');

  // --- ESCUCHA DE DATOS ---
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

  // --- MOTOR DE SINCRONIZACIÓN AUTO-RECURSIVO ---
  const runUpdateBatch = async () => {
    if (updating) return;
    setUpdating(true);
    try {
      const res = await fetch('/api/update-students');
      const data = await res.json();
      if (data.success) {
        setProgress(data.progress);
        if (autoSync && data.progress < 100) {
          setTimeout(runUpdateBatch, 1500); 
        } else if (data.progress >= 100) {
          setAutoSync(false);
        }
      }
    } catch (err) { setAutoSync(false); }
    setUpdating(false);
  };

  useEffect(() => { if (autoSync) runUpdateBatch(); }, [autoSync]);

  // --- LÓGICA DE FILTRADO DISTRIBUTIVA (PARA LOS 1613) ---
  const uniqueCourses = useMemo(() => 
    Array.from(new Set(students.map(s => s.currentCourse?.name).filter(Boolean))).sort()
  , [students]);

  const filtered = useMemo(() => students.filter(s => {
    const nameMatch = `${s.firstName} ${s.lastName} ${s.id}`.toLowerCase().includes(search.toLowerCase());
    const courseMatch = selectedCourse === 'ALL' || s.currentCourse?.name === selectedCourse;
    return nameMatch && courseMatch;
  }), [students, search, selectedCourse]);

  // 1. ZONA CRÍTICA: Prioridad Roja o Velocidad insuficiente
  const redZone = useMemo(() => filtered.filter(s => 
    s.dri.driTier === 'RED' || (s.metrics.velocityScore || 0) < 30
  ), [filtered]);

  // 2. ZONA DE VIGILANCIA: Riesgo Amarillo o Inestabilidad (KSI < 75)
  const yellowZone = useMemo(() => filtered.filter(s => 
    (s.dri.driTier === 'YELLOW' || (s.metrics.ksi || 0) < 75) && 
    !redZone.some(r => r.id === s.id)
  ), [filtered, redZone]);

  // 3. ZONA ESTABLE: El resto de la población (Incluso si no son "Honors" explícitos)
  const greenZone = useMemo(() => filtered.filter(s => 
    !redZone.some(r => r.id === s.id) && 
    !yellowZone.some(y => y.id === s.id)
  ), [filtered, redZone, yellowZone]);

  if (loading) return <div className="p-10 bg-black min-h-screen text-emerald-500 font-mono italic animate-pulse text-center">DRI COMMAND CENTER INITIALIZING...</div>;

  return (
    <div className="p-6 bg-[#050505] min-h-screen text-slate-300 font-sans">
      
      {/* HEADER CON CONTROL DE POBLACIÓN */}
      <div className="mb-8 border-b border-slate-800 pb-6 flex flex-col md:flex-row justify-between items-center gap-6">
         <div>
            <h1 className="text-3xl font-black uppercase italic text-white tracking-tighter">DRI COMMAND V4.2</h1>
            <p className="text-[10px] text-indigo-400 font-bold tracking-[0.3em] uppercase mt-1">Population Management: {students.length} / 1613</p>
         </div>
         
         <div className="flex gap-4 items-center bg-slate-900/40 p-3 px-5 rounded-2xl border border-slate-800 relative overflow-hidden">
            {autoSync && <div className="absolute bottom-0 left-0 h-1 bg-emerald-500 transition-all duration-700 shadow-[0_0_10px_#10b981]" style={{ width: `${progress}%` }} />}
            <button 
              onClick={() => setAutoSync(!autoSync)} 
              className={`px-6 py-2 rounded-xl font-black text-[10px] tracking-widest transition-all ${autoSync ? 'bg-red-900/50 text-red-500 border border-red-500 animate-pulse' : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-lg'}`}
            >
               {autoSync ? `SYNCING ${progress}%` : '⚡ START AUTO SYNC'}
            </button>
         </div>
      </div>

      {/* FILTROS TÁCTICOS */}
      <div className="flex flex-wrap gap-4 mb-8">
        <input 
          onChange={e => setSearch(e.target.value)} 
          placeholder="🔎 SEARCH UNIT BY NAME OR ID..." 
          className="flex-1 min-w-[300px] bg-slate-900/40 border border-slate-800 rounded-2xl px-6 py-4 text-sm outline-none font-mono focus:border-indigo-500 transition-all" 
        />
        <select 
          value={selectedCourse} 
          onChange={e => setSelectedCourse(e.target.value)}
          className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-[10px] font-black uppercase text-slate-400 outline-none"
        >
          <option value="ALL">ALL COURSES</option>
          {uniqueCourses.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* SISTEMA DE TRIAJE TOTAL */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-320px)]">
        {[
          { id: 'RED', label: '🚨 Critical Ops', data: redZone, color: 'text-red-500', border: 'border-red-500' },
          { id: 'YELLOW', label: '⚠️ Watch List', data: yellowZone, color: 'text-amber-500', border: 'border-amber-500' },
          { id: 'GREEN', label: '⚡ Stable / Honors', data: greenZone, color: 'text-emerald-500', border: 'border-emerald-500' }
        ].map(col => (
          <div key={col.id} className="flex flex-col bg-slate-900/20 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
            <div className="p-4 flex justify-between items-center bg-slate-900/40 border-b border-slate-800 font-black text-[10px] uppercase tracking-widest">
               <span className={col.color}>{col.label}</span>
               <span className="bg-slate-800 text-slate-500 px-2 py-0.5 rounded font-mono">{col.data.length} UNITS</span>
            </div>
            <div className="p-4 space-y-3 overflow-y-auto custom-scrollbar flex-1">
              {col.data.map(s => (
                <div key={s.id} onClick={() => setSelectedStudent(s)} className={`p-4 bg-slate-900/80 rounded-2xl border-l-4 ${col.border} cursor-pointer hover:scale-[1.02] transition-all group`}>
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-black text-white text-sm uppercase italic truncate w-40 group-hover:text-indigo-400">{s.firstName} {s.lastName}</h3>
                    <span className="text-[10px] font-mono font-bold text-slate-500 italic">{(s.metrics.lmp * 100).toFixed(0)}% LMP</span>
                  </div>
                  <p className="text-[9px] text-indigo-400/70 font-bold uppercase mb-2 truncate">{s.currentCourse.name}</p>
                  <div className="flex justify-between text-[8px] font-black uppercase font-mono">
                    <span className={col.color}>{s.dri.driSignal}</span>
                    <span className="text-slate-600">KSI: {s.metrics.ksi}%</span>
                  </div>
                </div>
              ))}
              {col.data.length === 0 && (
                <div className="h-full flex items-center justify-center text-[10px] font-black uppercase text-slate-800 tracking-widest italic">Clear Zone</div>
              )}
            </div>
          </div>
        ))}
      </div>

      {selectedStudent && <StudentModal student={selectedStudent} onClose={() => setSelectedStudent(null)} />}
    </div>
  );
}
