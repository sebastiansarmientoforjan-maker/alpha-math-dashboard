'use client';

import { useState, useEffect, useMemo } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { 
  BarChart, Bar, XAxis, ResponsiveContainer, Cell, LabelList,
  PieChart, Pie
} from 'recharts';
// Importamos el nuevo componente (Asegúrate de haberlo creado en src/components/StudentModal.tsx)
import StudentModal from '@/components/StudentModal';

export default function PanelPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoSync, setAutoSync] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('ALL'); 
  const [selectedStudent, setSelectedStudent] = useState<any>(null); // <--- ESTADO PARA EL MODAL
  const [syncStatus, setSyncStatus] = useState({ current: 0, total: 1613 });

  // --- DATA LOADING ---
  useEffect(() => {
    const q = query(collection(db, 'students'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setStudents(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // --- SYNC LOGIC ---
  const runUpdateBatch = async (isFirstRun = false) => {
    try {
      const url = isFirstRun ? '/api/update-students?reset=true' : '/api/update-students';
      const res = await fetch(url);
      const data = await res.json();
      
      if (data.success) {
        setSyncStatus({ current: data.currentIndex, total: data.total });
        if (data.currentIndex < data.total && autoSync) {
          setTimeout(() => runUpdateBatch(false), 1000);
        } else {
          setAutoSync(false);
        }
      }
    } catch (err) { setAutoSync(false); }
  };

  useEffect(() => {
    if (autoSync) runUpdateBatch(true);
  }, [autoSync]);

  // --- EXTRAER CURSOS ÚNICOS ---
  const uniqueCourses = useMemo(() => {
    const courses = new Set(students.map(s => s.currentCourse?.name).filter(Boolean));
    return Array.from(courses).sort();
  }, [students]);

  // --- FILTRADO AVANZADO ---
  const filtered = students.filter(s => {
    const rawName = `${s.firstName} ${s.lastName}`;
    const searchTerm = search.toLowerCase();
    
    const matchesSearch = rawName.toLowerCase().includes(searchTerm) || (s.id || '').toString().includes(searchTerm);
    const matchesCourse = selectedCourse === 'ALL' || s.currentCourse?.name === selectedCourse;

    return matchesSearch && matchesCourse;
  });

  // --- CHART DATA PREPARATION ---
  const riskData = [
    { name: 'Crit', value: filtered.filter(s => s.metrics?.riskStatus === 'Critical').length, color: '#ef4444' }, 
    { name: 'Attn', value: filtered.filter(s => s.metrics?.riskStatus === 'Attention').length, color: '#f59e0b' },
    { name: 'OK', value: filtered.filter(s => s.metrics?.riskStatus === 'On Track').length, color: '#10b981' }, 
    { name: 'Zzz', value: filtered.filter(s => s.metrics?.riskStatus === 'Dormant').length, color: '#475569' }, 
  ];

  if (loading) return <div className="p-8 bg-slate-950 min-h-screen text-emerald-500 font-mono italic animate-pulse">RECALIBRATING ALPHA CORE...</div>;

  return (
    <div className="p-6 bg-slate-950 min-h-screen text-slate-300 font-sans">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tighter text-white italic">Alpha Command Center V2</h1>
          <p className="text-[10px] text-slate-500 tracking-widest uppercase mt-1">Phase 2: Deep Dive Intelligence</p>
        </div>
        
        <div className="flex gap-4 items-center flex-wrap justify-end">
            
            {/* SELECTOR DE CURSO */}
            <select 
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-xs rounded-lg px-3 py-2 outline-none focus:border-emerald-500 text-slate-300 font-bold"
            >
              <option value="ALL">ALL COURSES ({students.length})</option>
              {uniqueCourses.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            <div className="text-right">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Live Sync</div>
                <div className="text-emerald-500 font-mono font-bold">{syncStatus.current} / {syncStatus.total}</div>
            </div>
            <button 
            onClick={() => setAutoSync(!autoSync)}
            className={`px-6 py-2 rounded-lg font-black text-[10px] tracking-widest transition-all ${
                autoSync ? 'bg-red-900/50 text-red-500 animate-pulse border border-red-500' : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-lg shadow-emerald-900/20'
            }`}
            >
            {autoSync ? '🛑 STOP' : '⚡ SYNC DATA'}
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* LEFT COLUMN (TABLE + KPI) */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* KPI CARDS */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-red-500/5 border border-red-500/20 p-4 rounded-xl">
              <p className="text-[9px] font-black text-red-500 uppercase tracking-widest">Critical</p>
              <h2 className="text-3xl font-black text-white">{riskData[0].value}</h2>
            </div>
            <div className="bg-amber-500/5 border border-amber-500/20 p-4 rounded-xl">
              <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest">Attention</p>
              <h2 className="text-3xl font-black text-white">{riskData[1].value}</h2>
            </div>
             <div className="bg-emerald-500/5 border border-emerald-500/20 p-4 rounded-xl">
              <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Active</p>
              <h2 className="text-3xl font-black text-white">{riskData[2].value}</h2>
            </div>
            <div className="bg-slate-800/50 border border-slate-700 p-4 rounded-xl">
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Dormant</p>
              <h2 className="text-3xl font-black text-slate-400">{riskData[3].value}</h2>
            </div>
          </div>

          {/* TABLE */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-md min-h-[600px]">
            <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/80">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">
                Active Registry ({filtered.length})
              </h3>
              <input 
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..." 
                className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs w-64 focus:border-emerald-500 outline-none transition-colors"
              />
            </div>
            
            <div className="overflow-x-auto max-h-[600px]">
              <table className="w-full text-left text-[10px]">
                <thead className="sticky top-0 bg-slate-900 z-10 text-slate-500 font-bold border-b border-slate-800 uppercase tracking-tighter">
                  <tr>
                    <th className="p-3">Student</th>
                    <th className="p-3">Course</th>
                    <th className="p-3 text-center">XP/min</th>
                    <th className="p-3 text-center">Velocity</th>
                    <th className="p-3 text-center">Gap</th>
                    <th className="p-3 text-center">Acc</th>
                    <th className="p-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {filtered.map((s) => {
                    const displayName = `${s.firstName} ${s.lastName}`;
                    const m = s.metrics || {};
                    const isDormant = m.riskStatus === 'Dormant';
                    
                    return (
                      <tr 
                        key={s.id} 
                        onClick={() => setSelectedStudent(s)} // <--- CLICK INTERACTIVO
                        className={`hover:bg-slate-800/50 transition-colors group cursor-pointer ${isDormant ? 'opacity-50 grayscale' : ''}`}
                      >
                        <td className="p-3">
                          <div className={`font-bold text-[11px] ${isDormant ? 'text-slate-500' : 'text-white'} group-hover:text-emerald-400 transition-colors`}>
                            {displayName}
                          </div>
                        </td>

                        <td className="p-3 text-slate-400">
                           <div className="font-bold truncate w-28">{s.currentCourse?.name || 'No Course'}</div>
                        </td>

                        <td className="p-3 text-center font-mono text-slate-500">
                           {m.efficiencyRatio || '-'}
                        </td>
                        
                        <td className="p-3 text-center">
                           {isDormant ? (
                             <span className="text-slate-700 font-bold">-</span>
                           ) : (
                             <div className="w-16 bg-slate-800 h-1.5 rounded-full overflow-hidden mx-auto">
                               <div className={`h-full ${m.velocityScore >= 50 ? 'bg-emerald-500' : 'bg-red-500'}`} style={{ width: `${m.velocityScore}%` }}></div>
                             </div>
                           )}
                        </td>

                        <td className="p-3 text-center">
                           {!isDormant && m.contentGap > 5 ? (
                             <span className="bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded font-bold">HIGH</span>
                           ) : (
                             <span className="text-slate-700">-</span>
                           )}
                        </td>

                        <td className={`p-3 text-center font-bold ${m.accuracyRate === null ? 'text-slate-700' : (m.accuracyRate < 60 ? 'text-red-400' : 'text-emerald-400')}`}>
                            {m.accuracyRate === null ? '-' : `${m.accuracyRate}%`}
                        </td>
                        
                        <td className="p-3 text-center">
                          <span className={`px-2 py-0.5 rounded font-black text-[9px] uppercase 
                            ${m.riskStatus === 'Critical' ? 'bg-red-900/40 text-red-500' : 
                              m.riskStatus === 'Attention' ? 'bg-amber-900/40 text-amber-500' :
                              m.riskStatus === 'Dormant' ? 'bg-slate-800 text-slate-500' : 'text-emerald-500'}`}>
                            {m.riskStatus || 'OK'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (VISUAL INTELLIGENCE) */}
        <div className="space-y-6">
          
          {/* RISK CHART */}
          <div className="bg-slate-900/50 border border-slate-800 p-5 rounded-2xl backdrop-blur-md">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Risk Composition ({selectedCourse === 'ALL' ? 'ALL' : 'Filtered'})</h3>
            <div className="h-32 w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={riskData} cx="50%" cy="50%" innerRadius={30} outerRadius={50} paddingAngle={2} dataKey="value">
                    {riskData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none flex-col">
                <span className="text-xl font-black text-white">{filtered.length}</span>
                <span className="text-[8px] text-slate-500 uppercase">Students</span>
              </div>
            </div>
          </div>
          
           {/* GOD MODE DIAGNOSTICS */}
          <div className="bg-slate-900/50 border border-indigo-500/30 p-5 rounded-2xl backdrop-blur-md relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-indigo-500/20 px-2 py-1 text-[8px] font-bold text-indigo-300 rounded-bl-lg">TIER 4 ACTIVE</div>
            <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-4">Psychometric Profiling</h3>

            <div className="space-y-3">
              {/* ZOMBIE MODE DETECTOR */}
              <div className="flex justify-between items-center text-[9px] border-b border-slate-800 pb-2">
                 <div className="flex flex-col">
                   <span className="text-slate-400 font-bold">Low Focus Integrity ("Zombies")</span>
                   <span className="text-[8px] text-slate-600">Engaged but unproductive</span>
                 </div>
                 <span className="text-white font-bold bg-slate-800 px-2 py-1 rounded">
                   {filtered.filter(s => s.metrics?.focusIntegrity < 40 && s.metrics?.efficiencyRatio > 0).length}
                 </span>
              </div>

              {/* NEMESIS LIST */}
              <div>
                 <div className="text-[9px] text-slate-400 mb-2">Top Nemesis Topics (Blockers):</div>
                 <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                   {filtered
                      .filter(s => s.metrics?.nemesisTopic && s.metrics?.riskStatus !== 'Dormant')
                      .slice(0, 5) 
                      .map(s => (
                     <div key={s.id} className="text-[9px] bg-slate-800 p-2 rounded border-l-2 border-indigo-500 flex flex-col gap-1 hover:bg-slate-700 transition-colors">
                       <div className="flex justify-between items-center">
                          <span className="text-white font-bold truncate w-24">{s.firstName} {s.lastName}</span>
                          <span className="text-red-400 font-mono text-[8px] bg-red-900/20 px-1 rounded">ACC: {Math.round(s.metrics?.accuracyRate || 0)}%</span>
                       </div>
                       <span className="text-indigo-300 truncate italic">"{s.metrics?.nemesisTopic}"</span>
                     </div>
                   ))}
                 </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* --- MODAL LAYER (STUDENT DOSSIER) --- */}
      {selectedStudent && (
        <StudentModal 
          student={selectedStudent} 
          onClose={() => setSelectedStudent(null)} 
        />
      )}

    </div>
  );
}
