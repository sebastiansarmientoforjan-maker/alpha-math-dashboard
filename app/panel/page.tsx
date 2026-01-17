'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { 
  BarChart, Bar, XAxis, ResponsiveContainer, Cell, LabelList,
  PieChart, Pie
} from 'recharts';

export default function PanelPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoSync, setAutoSync] = useState(false);
  const [search, setSearch] = useState('');
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

  // --- CHART DATA ---
  const velocityData = [
    { name: 'Critical', count: students.filter(s => (s.metrics?.velocityScore || 0) <= 20).length, fill: '#ef4444' },
    { name: 'Low', count: students.filter(s => (s.metrics?.velocityScore || 0) > 20 && (s.metrics?.velocityScore || 0) <= 50).length, fill: '#f59e0b' },
    { name: 'Med', count: students.filter(s => (s.metrics?.velocityScore || 0) > 50 && (s.metrics?.velocityScore || 0) <= 80).length, fill: '#64748b' },
    { name: 'High', count: students.filter(s => (s.metrics?.velocityScore || 0) > 80).length, fill: '#10b981' },
  ];

  const riskData = [
    { name: 'Crit', value: students.filter(s => (s.metrics?.dropoutProbability || 0) > 60).length, color: '#ef4444' }, 
    { name: 'Attn', value: students.filter(s => (s.metrics?.dropoutProbability || 0) >= 40 && (s.metrics?.dropoutProbability || 0) <= 60).length, color: '#f59e0b' },
    { name: 'OK', value: students.filter(s => (s.metrics?.dropoutProbability || 0) < 40).length, color: '#10b981' }, 
  ];

  const filtered = students.filter(s => {
    const rawName = `${s.firstName} ${s.lastName}`;
    const searchTerm = search.toLowerCase();
    return rawName.toLowerCase().includes(searchTerm) || (s.id || '').toString().includes(searchTerm);
  });

  if (loading) return <div className="p-8 bg-slate-950 min-h-screen text-emerald-500 font-mono italic animate-pulse">INITIALIZING TIER 3 INTELLIGENCE...</div>;

  return (
    <div className="p-6 bg-slate-950 min-h-screen text-slate-300 font-sans">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tighter text-white italic">Alpha Command Center V2</h1>
          <p className="text-[10px] text-slate-500 tracking-widest uppercase mt-1">Full Spectrum Intelligence (Tier 1-3)</p>
        </div>
        
        <div className="flex gap-4 items-center">
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
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-red-500/5 border border-red-500/20 p-4 rounded-xl">
              <p className="text-[9px] font-black text-red-500 uppercase tracking-widest">Critical Risk</p>
              <h2 className="text-3xl font-black text-white">{riskData[0].value}</h2>
            </div>
            <div className="bg-amber-500/5 border border-amber-500/20 p-4 rounded-xl">
              <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest">Attention</p>
              <h2 className="text-3xl font-black text-white">{riskData[1].value}</h2>
            </div>
             <div className="bg-emerald-500/5 border border-emerald-500/20 p-4 rounded-xl">
              <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">On Track</p>
              <h2 className="text-3xl font-black text-white">{riskData[2].value}</h2>
            </div>
          </div>

          {/* TABLE - AHORA CON MÉTRICAS TIER 3 */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-md min-h-[600px]">
            <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/80">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">Active Registry</h3>
              <input 
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search Student..." 
                className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs w-64 focus:border-emerald-500 outline-none transition-colors"
              />
            </div>
            
            <div className="overflow-x-auto max-h-[600px]">
              <table className="w-full text-left text-[10px]">
                <thead className="sticky top-0 bg-slate-900 z-10 text-slate-500 font-bold border-b border-slate-800 uppercase tracking-tighter">
                  <tr>
                    <th className="p-3">Student</th>
                    <th className="p-3 text-center">XP/min</th> {/* TIER 2 */}
                    <th className="p-3 text-center">Velocity</th>
                    <th className="p-3 text-center">Time/Q</th> {/* TIER 3 */}
                    <th className="p-3 text-center">Gap</th>    {/* TIER 3 */}
                    <th className="p-3 text-center">Acc</th>
                    <th className="p-3 text-center">Risk</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {filtered.map((s) => {
                    const displayName = `${s.firstName} ${s.lastName}`;
                    const m = s.metrics || {};
                    const hasData = m.velocityScore !== undefined;
                    
                    return (
                      <tr key={s.id} className="hover:bg-slate-800/30 transition-colors group">
                        <td className="p-3">
                          <div className="font-bold text-[11px] text-white group-hover:text-emerald-400 transition-colors">
                            {displayName}
                          </div>
                          <div className="text-[9px] text-slate-600 font-mono truncate w-32">{s.currentCourse?.name}</div>
                        </td>

                        {/* EFFICIENCY (XP/min) */}
                        <td className="p-3 text-center font-mono">
                           <span className={m.efficiencyRatio > 1.0 ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                             {hasData ? m.efficiencyRatio : '-'}
                           </span>
                        </td>
                        
                        {/* VELOCITY */}
                        <td className="p-3 text-center">
                          <div className="w-16 bg-slate-800 h-1.5 rounded-full overflow-hidden mx-auto mb-1">
                            <div className={`h-full ${m.velocityScore >= 50 ? 'bg-emerald-500' : 'bg-red-500'}`} style={{ width: `${m.velocityScore}%` }}></div>
                          </div>
                          <span className="text-[9px]">{m.velocityScore}%</span>
                        </td>

                        {/* TIER 3: TIME PER QUESTION */}
                        <td className="p-3 text-center text-slate-400">
                           {hasData ? `${m.timePerQuestion}m` : '-'}
                        </td>

                        {/* TIER 3: CONTENT GAP */}
                        <td className="p-3 text-center">
                           {m.contentGap > 5 ? (
                             <span className="bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded font-bold">HIGH</span>
                           ) : (
                             <span className="text-slate-600 text-[9px]">OK</span>
                           )}
                        </td>

                        <td className={`p-3 text-center font-bold ${m.accuracyRate < 60 ? 'text-red-400' : 'text-emerald-400'}`}>{m.accuracyRate}%</td>
                        
                        <td className="p-3 text-center">
                          <span className={`px-2 py-0.5 rounded font-black ${m.dropoutProbability > 60 ? 'bg-red-900/40 text-red-500' : 'text-slate-600'}`}>
                            {m.dropoutProbability}%
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
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Risk Composition</h3>
            <div className="h-32 w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={riskData} cx="50%" cy="50%" innerRadius={30} outerRadius={50} paddingAngle={5} dataKey="value">
                    {riskData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="text-xl font-black text-white">{students.length}</span>
              </div>
            </div>
          </div>

          {/* VELOCITY CHART */}
          <div className="bg-slate-900/50 border border-slate-800 p-5 rounded-2xl backdrop-blur-md">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Velocity Curve</h3>
            <div className="h-32 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={velocityData}>
                  <XAxis dataKey="name" tick={{fontSize: 9, fill: '#64748b'}} interval={0} axisLine={false} tickLine={false} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {velocityData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                    <LabelList dataKey="count" position="top" fill="#94a3b8" fontSize={10} fontWeight="bold" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* PATTERN RECOGNITION (NUEVO) */}
          <div className="bg-slate-900/50 border border-slate-800 p-5 rounded-2xl backdrop-blur-md">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">🧠 Pattern Recognition</h3>
            
            {/* BURNOUT LIST */}
            <div className="mb-4">
               <div className="text-[9px] text-red-400 font-bold mb-2 flex items-center gap-2">
                 🔥 BURNOUT RISK ({students.filter(s => s.metrics?.burnoutRisk).length})
               </div>
               <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
                 {students.filter(s => s.metrics?.burnoutRisk).slice(0, 5).map(s => (
                   <div key={s.id} className="text-[9px] bg-red-500/10 p-1.5 rounded text-red-200 border border-red-500/20">
                     {s.firstName} {s.lastName}
                   </div>
                 ))}
               </div>
            </div>

            {/* CONTENT GAPS */}
            <div>
               <div className="text-[9px] text-amber-400 font-bold mb-2 flex items-center gap-2">
                 🧩 CONTENT GAPS ({students.filter(s => (s.metrics?.contentGap || 0) > 5).length})
               </div>
               <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
                 {students.filter(s => (s.metrics?.contentGap || 0) > 5).slice(0, 5).map(s => (
                   <div key={s.id} className="text-[9px] bg-amber-500/10 p-1.5 rounded text-amber-200 border border-amber-500/20 flex justify-between">
                     <span>{s.firstName} {s.lastName}</span>
                     <span className="font-bold">{s.metrics?.contentGap}</span>
                   </div>
                 ))}
               </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
