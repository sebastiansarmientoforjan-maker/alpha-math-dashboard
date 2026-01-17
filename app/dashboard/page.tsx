'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query } from 'firebase/firestore';

// FUNCIÓN CLAVE: Extraer nombre real del email
function getNameFromEmail(email: string): string {
  if (!email) return '';
  const localPart = email.split('@')[0]; // "kavin.lopez"
  const parts = localPart.split(/[._-]/); // ["kavin", "lopez"]
  const capitalizedParts = parts.map(part => 
    part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
  );
  return capitalizedParts.join(' '); // "Kavin Lopez"
}

export default function DashboardPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [autoSync, setAutoSync] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'students'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setStudents(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const runUpdateBatch = async () => {
    setUpdating(true);
    try {
      const res = await fetch('/api/update-students');
      const data = await res.json();
      if (data.success && autoSync && data.progress < 100) {
        setTimeout(runUpdateBatch, 1500); 
      } else if (data.progress >= 100) {
        setAutoSync(false);
      }
    } catch (err) { setAutoSync(false); }
    setUpdating(false);
  };

  useEffect(() => {
    if (autoSync && !updating) runUpdateBatch();
  }, [autoSync]);

  // Cálculos Globales
  const stats = {
    atRisk: students.filter(s => (s.metrics?.dropoutProbability || 0) > 60).length,
    attention: students.filter(s => (s.metrics?.dropoutProbability || 0) >= 40 && (s.metrics?.dropoutProbability || 0) <= 60).length,
    onTrack: students.filter(s => (s.metrics?.dropoutProbability || 0) < 40).length,
    total: students.length
  };

  const filtered = students.filter(s => {
    const realName = getNameFromEmail(s.email || '');
    const rawName = `${s.firstName} ${s.lastName}`;
    const searchTerm = search.toLowerCase();
    return realName.toLowerCase().includes(searchTerm) || rawName.toLowerCase().includes(searchTerm);
  });

  if (loading) return <div className="p-8 bg-slate-950 min-h-screen text-emerald-500 font-mono italic animate-pulse">CONNECTING TO ALPHA COMMAND CENTER...</div>;

  return (
    <div className="p-6 bg-slate-950 min-h-screen text-slate-300 font-sans">
      
      {/* HEADER & SYNC */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-2xl font-black uppercase tracking-tighter text-white italic">Alpha Command Center</h1>
        <div className="flex gap-4 items-center">
            <div className="text-right">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Database Sync</div>
                <div className="text-emerald-500 font-mono font-bold">{stats.total} / 1613</div>
            </div>
            <button 
            onClick={() => setAutoSync(!autoSync)}
            className={`px-6 py-2 rounded-lg font-black text-[10px] tracking-widest transition-all ${
                autoSync ? 'bg-red-900/50 text-red-500 animate-pulse border border-red-500' : 'bg-emerald-600 text-white hover:bg-emerald-500'
            }`}
            >
            {autoSync ? '🛑 STOP SYNC' : '⚡ AUTO SYNC'}
            </button>
        </div>
      </div>

      {/* METRIC CARDS (Panel Superior) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-red-500/5 border border-red-500/20 p-4 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-1">Critical: At Risk</p>
            <h2 className="text-4xl font-black text-white">{stats.atRisk}</h2>
          </div>
          <div className="text-right text-xs text-red-400/50">High Dropout<br/>Probability</div>
        </div>
        <div className="bg-amber-500/5 border border-amber-500/20 p-4 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-1">Attention Needed</p>
            <h2 className="text-4xl font-black text-white">{stats.attention}</h2>
          </div>
          <div className="text-right text-xs text-amber-400/50">Stuck or<br/>Inconsistent</div>
        </div>
        <div className="bg-emerald-500/5 border border-emerald-500/20 p-4 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">On Track</p>
            <h2 className="text-4xl font-black text-white">{stats.onTrack}</h2>
          </div>
          <div className="text-right text-xs text-emerald-400/50">Optimal<br/>Performance</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* TABLA PRINCIPAL - 9 COLUMNAS */}
        <div className="lg:col-span-3 bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-md">
          <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/80">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">Student Registry</h3>
            <input 
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search Name..." 
              className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs w-64 focus:border-emerald-500 outline-none transition-colors"
            />
          </div>
          
          <div className="overflow-x-auto max-h-[700px]">
            <table className="w-full text-left text-[11px]">
              <thead className="sticky top-0 bg-slate-900 z-10 text-slate-500 font-bold border-b border-slate-800 uppercase tracking-tighter">
                <tr>
                  <th className="p-3">Student</th>
                  <th className="p-3">Course</th>
                  <th className="p-3 text-center">Progress</th>
                  <th className="p-3 text-center">XP Week</th>
                  <th className="p-3 text-center">Velocity</th>
                  <th className="p-3 text-center">Consistency</th>
                  <th className="p-3 text-center">Accuracy</th>
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
                      {/* 1. STUDENT */}
                      <td className="p-3">
                        <div className="font-bold text-slate-200 group-hover:text-emerald-400 transition-colors">{displayName}</div>
                        <div className="text-[9px] text-slate-600 font-mono">{s.email || s.id}</div>
                      </td>
                      
                      {/* 2. COURSE */}
                      <td className="p-3 text-slate-400">
                        <div className="font-bold">{s.currentCourse?.name || 'N/A'}</div>
                        <div className="text-[9px]">Grade {s.currentCourse?.grade || '?'}</div>
                      </td>

                      {/* 3. PROGRESS */}
                      <td className="p-3 text-center">
                        <div className="font-bold text-slate-200">{Math.round((s.currentCourse?.progress || 0) * 100)}%</div>
                        <div className="text-[9px] text-slate-600">{s.currentCourse?.xpRemaining || 0} XP left</div>
                      </td>

                      {/* 4. XP WEEK */}
                      <td className="p-3 text-center font-mono text-slate-300">
                        {s.activity?.xpAwarded || 0}
                      </td>

                      {/* 5. VELOCITY */}
                      <td className="p-3 text-center">
                        <span className={`px-2 py-1 rounded text-[10px] font-bold ${
                          m.velocityScore >= 80 ? 'bg-emerald-500/10 text-emerald-400' :
                          m.velocityScore >= 50 ? 'bg-amber-500/10 text-amber-400' :
                          'bg-red-500/10 text-red-400'
                        }`}>
                          {m.velocityScore}%
                        </span>
                      </td>

                      {/* 6. CONSISTENCY */}
                      <td className="p-3 text-center text-[10px] font-bold">
                         <span className={
                          m.consistencyIndex > 0.8 ? 'text-emerald-400' :
                          m.consistencyIndex > 0.5 ? 'text-amber-400' : 'text-red-400'
                         }>
                           {m.consistencyIndex > 0.8 ? 'HIGH' : m.consistencyIndex > 0.5 ? 'MED' : 'LOW'}
                         </span>
                      </td>

                      {/* 7. ACCURACY */}
                      <td className="p-3 text-center">
                         <span className={`font-bold ${
                          m.accuracyRate >= 70 ? 'text-emerald-400' :
                          m.accuracyRate >= 55 ? 'text-amber-400' : 'text-red-400'
                         }`}>
                           {m.accuracyRate}%
                         </span>
                      </td>

                      {/* 8. STUCK */}
                      <td className="p-3 text-center">
                         {m.stuckScore > 30 ? (
                           <span className="bg-red-500/20 text-red-400 px-2 py-0.5 rounded text-[10px] font-bold">{m.stuckScore}</span>
                         ) : (
                           <span className="text-slate-600 text-[10px]">-</span>
                         )}
                      </td>

                      {/* 9. RISK */}
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black border ${
                          m.dropoutProbability > 60 ? 'bg-red-900/40 text-red-400 border-red-500/30' :
                          m.dropoutProbability > 40 ? 'bg-amber-900/40 text-amber-400 border-amber-500/30' :
                          'text-slate-600 border-transparent'
                        }`}>
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

        {/* PANEL DERECHO (Side Analysis) */}
        <div className="space-y-6">
          <div className="bg-slate-900/50 border border-slate-800 p-5 rounded-2xl backdrop-blur-md">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">🚨 Top Stuck Students</h3>
            <div className="space-y-3">
              {students
                .sort((a, b) => (b.metrics?.stuckScore || 0) - (a.metrics?.stuckScore || 0))
                .slice(0, 5)
                .map((s) => (
                  <div key={s.id} className="flex justify-between items-center text-[10px] border-l-2 border-red-500 pl-3">
                    <span className="text-slate-300 font-bold truncate w-24">{getNameFromEmail(s.email || '')}</span>
                    <span className="text-red-400 font-black">{s.metrics?.stuckScore}</span>
                  </div>
                ))}
            </div>
          </div>

          <div className="bg-slate-900/50 border border-slate-800 p-5 rounded-2xl backdrop-blur-md">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">⚠️ High Dropout Risk</h3>
             <div className="space-y-2">
              {students
                .filter(s => (s.metrics?.dropoutProbability || 0) > 80)
                .slice(0, 5)
                .map((s) => (
                   <div key={s.id} className="flex justify-between items-center p-2 bg-red-500/10 rounded border border-red-500/20">
                     <span className="text-[10px] text-red-200 font-bold truncate">{getNameFromEmail(s.email || '')}</span>
                     <span className="text-xs text-red-500 font-black">{s.metrics?.dropoutProbability}%</span>
                   </div>
                ))}
             </div>
          </div>
        </div>

      </div>
    </div>
  );
}
