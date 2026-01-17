'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query } from 'firebase/firestore';
// Importamos los gráficos
import { 
  BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie
} from 'recharts';

// FUNCIÓN: Extraer nombre real del email
function getNameFromEmail(email: string): string {
  if (!email) return '';
  const localPart = email.split('@')[0];
  const parts = localPart.split(/[._-]/);
  const capitalizedParts = parts.map(part => 
    part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
  );
  return capitalizedParts.join(' ');
}

export default function PanelPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoSync, setAutoSync] = useState(false);
  const [search, setSearch] = useState('');
  const [syncStatus, setSyncStatus] = useState({ current: 0, total: 1613 });

  // --- DATA LOADING & SYNC ---
  useEffect(() => {
    const q = query(collection(db, 'students'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setStudents(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

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

  // --- INTELIGENCIA VISUAL (Cálculos) ---
  
  // 1. Velocity Distribution (Barras)
  const velocityData = [
    { name: 'Critical', count: students.filter(s => (s.metrics?.velocityScore || 0) <= 20).length },
    { name: 'Low', count: students.filter(s => (s.metrics?.velocityScore || 0) > 20 && (s.metrics?.velocityScore || 0) <= 50).length },
    { name: 'Medium', count: students.filter(s => (s.metrics?.velocityScore || 0) > 50 && (s.metrics?.velocityScore || 0) <= 80).length },
    { name: 'High', count: students.filter(s => (s.metrics?.velocityScore || 0) > 80).length },
  ];

  // 2. Risk Composition (Dona)
  const riskData = [
    { name: 'Critical', value: students.filter(s => (s.metrics?.dropoutProbability || 0) > 60).length, color: '#ef4444' }, 
    { name: 'Attention', value: students.filter(s => (s.metrics?.dropoutProbability || 0) >= 40 && (s.metrics?.dropoutProbability || 0) <= 60).length, color: '#f59e0b' },
    { name: 'Healthy', value: students.filter(s => (s.metrics?.dropoutProbability || 0) < 40).length, color: '#10b981' }, 
  ];

  const filtered = students.filter(s => {
    const realName = getNameFromEmail(s.email || '');
    const rawName = `${s.firstName} ${s.lastName}`;
    const searchTerm = search.toLowerCase();
    return realName.toLowerCase().includes(searchTerm) || rawName.toLowerCase().includes(searchTerm);
  });

  if (loading) return <div className="p-8 bg-slate-950 min-h-screen text-emerald-500 font-mono italic animate-pulse">LOADING VISUAL INTELLIGENCE...</div>;

  return (
    <div className="p-6 bg-slate-950 min-h-screen text-slate-300 font-sans">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tighter text-white italic">Alpha Command Center V2</h1>
          <p className="text-[10px] text-slate-500 tracking-widest uppercase mt-1">Real-time Educational Intelligence</p>
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
        
        {/* COLUMNA IZQUIERDA (TABLA) */}
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

          {/* TABLA PRINCIPAL */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-md min-h-[600px]">
            <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/80">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">Active Registry</h3>
              <input 
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search Identity..." 
                className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs w-64 focus:border-emerald-500 outline-none transition-colors"
              />
            </div>
            
            <div className="overflow-x-auto max-h-[600px]">
              <table className="w-full text-left text-[10px]">
                <thead className="sticky top-0 bg-slate-900 z-10 text-slate-500 font-bold border-b border-slate-800 uppercase tracking-tighter">
                  <tr>
                    <th className="p-3">Student</th>
                    <th className="p-3">Course</th>
                    <th className="p-3 text-center">Progress</th>
                    <th className="p-3 text-center">XP</th>
                    <th className="p-3 text-center">Velocity</th>
                    <th className="p-3 text-center">Consistency</th>
                    <th className="p-3 text-center">Acc</th>
                    <th className="p-3 text-center">Stuck</th>
                    <th className="p-3 text-center">Risk</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {filtered.map((s) => {
                    const realName = getNameFromEmail(s.email || '');
                    const displayName = realName || `${s.firstName} ${s.lastName}`;
                    const m = s.metrics || {};
                    return (
                      <tr key={s.id} className="hover:bg-slate-800/30 transition-colors group">
                        <td className="p-3">
                          <div className="font-bold text-slate-200 group-hover:text-emerald-400">{displayName}</div>
                          <div className="text-[9px] text-slate-600 font-mono">{s.email?.split('@')[0]}</div>
                        </td>
                        <td className="p-3 text-slate-400">
                          <div className="font-bold truncate w-24">{s.currentCourse?.name}</div>
                        </td>
                        <td className="p-3 text-center font-mono text-slate-300">{Math.round((s.currentCourse?.progress || 0) * 100)}%</td>
                        <td className="p-3 text-center font-mono text-slate-500">{s.activity?.xpAwarded || 0}</td>
                        <td className="p-3 text-center">
                          <div className="w-16 bg-slate-800 h-1.5 rounded-full overflow-hidden mx-auto">
                            <div className={`h-full ${m.velocityScore >= 50 ? 'bg-emerald-500' : 'bg-red-500'}`} style={{ width: `${m.velocityScore}%` }}></div>
                          </div>
                          <span className="text-[9px]">{m.velocityScore}%</span>
                        </td>
                        <td className="p-3 text-center">
                           <span className={m.consistencyIndex > 0.8 ? 'text-emerald-500' : 'text-slate-600'}>
                             {m.consistencyIndex > 0.8 ? '● HIGH' : '○ LOW'}
                           </span>
                        </td>
                        <td className={`p-3 text-center font-bold ${m.accuracyRate < 60 ? 'text-red-400' : 'text-emerald-400'}`}>{m.accuracyRate}%</td>
                        <td className="p-3 text-center">
                           {m.stuckScore > 30 && <span className="bg-red-500 text-white px-1.5 py-0.5 rounded font-bold">{m.stuckScore}</span>}
                        </td>
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

        {/* COLUMNA DERECHA (INTELIGENCIA VISUAL) */}
        <div className="space-y-6">
          
          {/* 1. CHART: RISK DISTRIBUTION (DONA) */}
          <div className="bg-slate-900/50 border border-slate-800 p-5 rounded-2xl backdrop-blur-md">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Risk Composition</h3>
            <div className="h-40 w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={riskData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={60}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {riskData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', fontSize: '10px' }}
                    itemStyle={{ color: '#fff' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center">
                  <span className="block text-2xl font-black text-white">{students.length}</span>
                  <span className="text-[8px] text-slate-500 uppercase">Total</span>
                </div>
              </div>
            </div>
            <div className="flex justify-between text-[9px] text-slate-400 mt-2 px-2">
              <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500"></div> Crit</span>
              <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-amber-500"></div> Attn</span>
              <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> OK</span>
            </div>
          </div>

          {/* 2. CHART: VELOCITY CURVE (BARRAS) */}
          <div className="bg-slate-900/50 border border-slate-800 p-5 rounded-2xl backdrop-blur-md">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Velocity Curve</h3>
            <div className="h-32 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={velocityData}>
                  <XAxis dataKey="name" hide />
                  <Tooltip 
                    cursor={{fill: '#1e293b'}}
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', fontSize: '10px' }}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {velocityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 3 ? '#10b981' : index === 0 ? '#ef4444' : '#64748b'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 3. LIST: TOP STUCK */}
          <div className="bg-slate-900/50 border border-slate-800 p-5 rounded-2xl backdrop-blur-md">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">🚨 Stuck Alert (Top 5)</h3>
            <div className="space-y-3">
              {students
                .sort((a, b) => (b.metrics?.stuckScore || 0) - (a.metrics?.stuckScore || 0))
                .slice(0, 5)
                .map((s) => (
                  <div key={s.id} className="flex justify-between items-center text-[10px] border-l-2 border-red-500 pl-3 bg-red-500/5 p-2 rounded">
                    <div>
                        <div className="text-slate-300 font-bold truncate w-24">{getNameFromEmail(s.email || '')}</div>
                        <div className="text-[8px] text-slate-500">{s.currentCourse?.name}</div>
                    </div>
                    <span className="text-red-400 font-black text-lg">{s.metrics?.stuckScore}</span>
                  </div>
                ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
