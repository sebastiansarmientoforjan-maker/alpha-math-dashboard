'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query } from 'firebase/firestore';

export default function DashboardPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoSync, setAutoSync] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'students'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setStudents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Función de Auto-Sync
  const runSync = async () => {
    if (!autoSync) return;
    try {
      const res = await fetch('/api/update-students');
      const data = await res.json();
      if (data.success && data.currentIndex < data.total && data.currentIndex !== 0) {
        setTimeout(runSync, 2000);
      } else {
        setAutoSync(false);
      }
    } catch (e) { setAutoSync(false); }
  };

  useEffect(() => { if (autoSync) runSync(); }, [autoSync]);

  // Indicadores TIER 1
  const stats = {
    atRisk: students.filter(s => (s.metrics?.dropoutProbability || 0) > 60).length,
    attention: students.filter(s => (s.metrics?.stuckScore || 0) > 40).length,
    onTrack: students.filter(s => (s.metrics?.velocityScore || 0) > 70).length,
  };

  const filtered = students.filter(s => 
    `${s.firstName} ${s.lastName}`.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="p-8 bg-slate-950 min-h-screen text-emerald-500 font-mono italic">LOADING ALPHA COMMAND CENTER...</div>;

  return (
    <div className="p-6 bg-slate-950 min-h-screen text-slate-300 font-sans">
      
      {/* 1. TIER 1 ALERTS - TOP BAR */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-red-500/5 border border-red-500/20 p-5 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-1">Critical At Risk</p>
            <h2 className="text-4xl font-black text-white">{stats.atRisk}</h2>
          </div>
          <span className="text-4xl">🔴</span>
        </div>
        <div className="bg-amber-500/5 border border-amber-500/20 p-5 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-1">Need Attention</p>
            <h2 className="text-4xl font-black text-white">{stats.attention}</h2>
          </div>
          <span className="text-4xl">🟡</span>
        </div>
        <div className="bg-emerald-500/5 border border-emerald-500/20 p-5 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">On Track</p>
            <h2 className="text-4xl font-black text-white">{stats.onTrack}</h2>
          </div>
          <span className="text-4xl">🟢</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* 2. TABLA PRINCIPAL (3/4) */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-md">
            <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-900/60">
              <button 
                onClick={() => setAutoSync(!autoSync)}
                className={`px-4 py-2 rounded-lg font-black text-[10px] tracking-widest transition-all ${
                  autoSync ? 'bg-red-900 text-white animate-pulse' : 'bg-emerald-600 text-white hover:bg-emerald-500'
                }`}
              >
                {autoSync ? 'STOP AUTO-SYNC' : 'START SYNC (1613 IDS)'}
              </button>
              <input 
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search Identity..." 
                className="bg-slate-950 border border-slate-700 px-4 py-2 rounded-xl text-xs w-64 outline-none focus:border-emerald-500"
              />
            </div>

            <div className="overflow-x-auto max-h-[700px]">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-slate-900/95 z-10 text-slate-500 font-bold border-b border-slate-800">
                  <tr>
                    <th className="p-5 uppercase tracking-widest">Student Identity</th>
                    <th className="p-5 text-center">Velocity Score</th>
                    <th className="p-5 text-center">Consistency</th>
                    <th className="p-5 text-center">Accuracy</th>
                    <th className="p-5 text-center">Stuck Score</th>
                    <th className="p-5 text-right">Dropout Risk</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {filtered.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-800/30 transition-colors group">
                      <td className="p-5">
                        <div className="font-bold text-slate-100">{s.firstName} {s.lastName}</div>
                        <div className="text-[10px] text-slate-600 font-mono">{s.id}</div>
                      </td>
                      <td className="p-5 text-center font-mono text-emerald-500">{s.metrics?.velocityScore}%</td>
                      <td className="p-5 text-center font-mono">{s.metrics?.consistencyIndex > 0.8 ? '🟢 HIGH' : '🟡 MID'}</td>
                      <td className={`p-5 text-center font-black ${s.metrics?.accuracyRate < 65 ? 'text-red-400' : 'text-slate-300'}`}>{s.metrics?.accuracyRate}%</td>
                      <td className="p-5 text-center"><span className="bg-slate-800 px-3 py-1 rounded-lg text-slate-500 font-mono">{s.metrics?.stuckScore}</span></td>
                      <td className="p-5 text-right font-black text-red-500/70">{s.metrics?.dropoutProbability}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* 3. PANEL DERECHO (1/4) */}
        <div className="space-y-6">
          <div className="bg-slate-900/40 border border-slate-800 p-5 rounded-2xl backdrop-blur-md">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Top 5 Stuck Score</h3>
            {students.sort((a,b) => (b.metrics?.stuckScore || 0) - (a.metrics?.stuckScore || 0)).slice(0,5).map(s => (
              <div key={s.id} className="text-[11px] flex justify-between mb-3 border-l-2 border-red-500 pl-3">
                <span className="font-bold text-slate-300">{s.firstName}</span>
                <span className="text-red-500 font-mono">{s.metrics?.stuckScore}</span>
              </div>
            ))}
          </div>

          <div className="bg-slate-900/40 border border-slate-800 p-5 rounded-2xl backdrop-blur-md">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Pattern Recognition</h3>
            <div className="text-[11px] space-y-4 text-slate-400 italic">
              <p>⚠️ System detected {stats.attention} students with low accuracy patterns.</p>
              <p>🔥 Weekend Sync recommended for high-velocity students.</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
