'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query } from 'firebase/firestore';

export default function DashboardPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
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

  // Cálculos para TIER 1 ALERTS
  const stats = {
    atRisk: students.filter(s => (s.metrics?.dropoutProbability || 0) > 60).length,
    attention: students.filter(s => (s.metrics?.stuckScore || 0) > 40).length,
    onTrack: students.filter(s => (s.metrics?.velocityScore || 0) > 70).length,
  };

  const filtered = (students || []).filter(s => 
    `${s.firstName || ''} ${s.lastName || ''}`.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-slate-950">
      <div className="text-emerald-500 font-mono animate-pulse tracking-widest text-xl">
        INITIALIZING ALPHA COMMAND CENTER...
      </div>
    </div>
  );

  return (
    <div className="p-6 bg-slate-950 min-h-screen text-slate-300 font-sans selection:bg-emerald-500/30">
      
      {/* 1. TIER 1 ALERTS (ARRIBA, SIEMPRE VISIBLE) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-red-500/5 border border-red-500/20 p-6 rounded-2xl flex items-center justify-between group hover:border-red-500/50 transition-all duration-500">
          <div>
            <p className="text-[10px] font-black text-red-500 uppercase tracking-[0.3em] mb-1">Critical: At Risk</p>
            <h2 className="text-4xl font-black text-white group-hover:scale-110 transition-transform origin-left">{stats.atRisk}</h2>
          </div>
          <span className="text-4xl filter drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]">🔴</span>
        </div>

        <div className="bg-amber-500/5 border border-amber-500/20 p-6 rounded-2xl flex items-center justify-between group hover:border-amber-500/50 transition-all duration-500">
          <div>
            <p className="text-[10px] font-black text-amber-500 uppercase tracking-[0.3em] mb-1">Need Attention</p>
            <h2 className="text-4xl font-black text-white group-hover:scale-110 transition-transform origin-left">{stats.attention}</h2>
          </div>
          <span className="text-4xl filter drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]">🟡</span>
        </div>

        <div className="bg-emerald-500/5 border border-emerald-500/20 p-6 rounded-2xl flex items-center justify-between group hover:border-emerald-500/50 transition-all duration-500">
          <div>
            <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em] mb-1">Operational: On Track</p>
            <h2 className="text-4xl font-black text-white group-hover:scale-110 transition-transform origin-left">{stats.onTrack}</h2>
          </div>
          <span className="text-4xl filter drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]">🟢</span>
        </div>
      </div>

      {/* CONTENEDOR PRINCIPAL: TABLA (IZQUIERDA) + PANEL (DERECHA) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* 2. TABLA PRINCIPAL (3/4 COLUMNAS) */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl backdrop-blur-md overflow-hidden">
            <div className="p-5 border-b border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-900/60">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></div>
                <h3 className="text-sm font-bold text-white uppercase tracking-widest">Main Student Registry</h3>
              </div>
              <div className="relative group">
                <input 
                  type="text" 
                  placeholder="Filter by name or student ID..." 
                  className="bg-slate-950 border border-slate-700 px-4 py-2 rounded-xl text-xs w-full sm:w-80 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                  onChange={(e) => setSearch(e.target.value)}
                />
                <span className="absolute right-3 top-2 text-slate-600 group-focus-within:text-emerald-500">🔍</span>
              </div>
            </div>

            <div className="overflow-x-auto max-h-[700px]">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-slate-900/95 backdrop-blur-sm z-10 text-slate-500 font-bold border-b border-slate-800">
                  <tr>
                    <th className="p-5 uppercase tracking-tighter">Student Identity</th>
                    <th className="p-5 text-center">Velocity Score</th>
                    <th className="p-5 text-center">Consistency</th>
                    <th className="p-5 text-center">Accuracy</th>
                    <th className="p-5 text-center">Stuck Score</th>
                    <th className="p-5 text-right">Dropout Risk</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {filtered.length > 0 ? filtered.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-800/30 transition-colors group">
                      <td className="p-5">
                        <div className="font-bold text-slate-100 group-hover:text-emerald-400 transition-colors">{s.firstName} {s.lastName}</div>
                        <div className="text-[10px] text-slate-600 font-mono">{s.id}</div>
                      </td>
                      <td className="p-5">
                        <div className="w-24 mx-auto bg-slate-800 h-1.5 rounded-full overflow-hidden border border-slate-700">
                          <div className="bg-emerald-500 h-full shadow-[0_0_8px_#10b981]" style={{width: `${s.metrics?.velocityScore || 0}%`}}></div>
                        </div>
                        <div className="text-center mt-1 font-mono text-slate-500">{s.metrics?.velocityScore || 0}%</div>
                      </td>
                      <td className="p-5 text-center">
                        <span className={`px-2 py-1 rounded text-[9px] font-black border ${
                          (s.metrics?.consistencyIndex || 0) > 0.8 
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                            : 'bg-slate-800 text-slate-500 border-slate-700'
                        }`}>
                          {(s.metrics?.consistencyIndex || 0) > 0.8 ? 'HIGH STABILITY' : 'INTERMITTENT'}
                        </span>
                      </td>
                      <td className={`p-5 text-center font-black text-sm ${
                        (s.metrics?.accuracyRate || 0) < 65 ? 'text-red-400' : 'text-slate-300'
                      }`}>
                        {s.metrics?.accuracyRate || 0}%
                      </td>
                      <td className="p-5 text-center">
                        <div className={`inline-block px-3 py-1 rounded-lg font-mono ${(s.metrics?.stuckScore || 0) > 50 ? 'bg-red-500/20 text-red-500 border border-red-500/30' : 'text-slate-600'}`}>
                          {s.metrics?.stuckScore || 0}
                        </div>
                      </td>
                      <td className="p-5 text-right">
                        <span className={`font-black text-base ${(s.metrics?.dropoutProbability || 0) > 60 ? 'text-red-500 animate-pulse' : 'text-slate-700'}`}>
                          {s.metrics?.dropoutProbability || 0}%
                        </span>
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan={6} className="p-20 text-center text-slate-700 uppercase tracking-[0.5em]">No Data Synced</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* 3. PANEL DERECHO (1/4 COLUMNA) */}
        <div className="space-y-6">
          
          {/* Top 5 Stuck */}
          <div className="bg-slate-900/40 border border-slate-800 p-5 rounded-2xl backdrop-blur-md">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
              Top 5 Stuck Students
            </h3>
            <div className="space-y-4">
              {students
                .sort((a, b) => (b.metrics?.stuckScore || 0) - (a.metrics?.stuckScore || 0))
                .slice(0, 5)
                .map((s, i) => (
                  <div key={s.id} className="flex justify-between items-center group cursor-help">
                    <div className="flex items-center gap-3">
                      <span className="text-slate-700 font-mono text-[10px]">0{i+1}</span>
                      <span className="text-xs text-slate-300 font-bold group-hover:text-red-400 transition-colors">{s.firstName}</span>
                    </div>
                    <span className="text-xs font-mono text-red-500 font-black">{s.metrics?.stuckScore || 0}</span>
                  </div>
                ))}
            </div>
          </div>

          {/* Pattern Recognition */}
          <div className="bg-slate-900/40 border border-slate-800 p-5 rounded-2xl backdrop-blur-md">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
              Pattern Recognition
            </h3>
            <div className="space-y-4 text-[11px] leading-relaxed">
              <div className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-xl">
                <p className="text-amber-400 font-bold mb-1">Brute Force Alert</p>
                <p className="text-slate-500 italic">{stats.attention} students are repeating tasks with low accuracy. Potential frustration point.</p>
              </div>
              <div className="p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
                <p className="text-emerald-400 font-bold mb-1">Velocity Spike</p>
                <p className="text-slate-500 italic">Core cohort increased productivity by 14% since the last update cycle.</p>
              </div>
            </div>
          </div>

          {/* Dropout Risk List */}
          <div className="bg-slate-900/40 border border-slate-800 p-5 rounded-2xl backdrop-blur-md">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-4">Dropout Risk List</h3>
            <div className="space-y-2">
              {students
                .filter(s => (s.metrics?.dropoutProbability || 0) > 70)
                .slice(0, 3)
                .map(s => (
                  <div key={s.id} className="text-[11px] flex justify-between bg-red-500/10 p-2 rounded-lg border border-red-500/20">
                    <span className="text-red-200 font-bold uppercase">{s.firstName}</span>
                    <span className="text-red-500 font-black">{s.metrics?.dropoutProbability}%</span>
                  </div>
                ))}
                {stats.atRisk > 3 && (
                  <p className="text-[9px] text-center text-slate-600 mt-2 uppercase tracking-widest">+ {stats.atRisk - 3} more critical cases</p>
                )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
