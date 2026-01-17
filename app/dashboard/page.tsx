'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';

export default function DashboardPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'students'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setStudents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const stats = {
    atRisk: students.filter(s => (s.metrics?.dropoutProbability || 0) > 60).length,
    attention: students.filter(s => (s.metrics?.stuckScore || 0) > 40).length,
    onTrack: students.filter(s => (s.metrics?.velocityScore || 0) > 70).length,
  };

  const filtered = students.filter(s => 
    `${s.firstName} ${s.lastName}`.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="p-8 bg-slate-950 min-h-screen text-emerald-500 font-mono">LOADING ALPHA SYSTEM...</div>;

  return (
    <div className="p-6 bg-slate-950 min-h-screen text-slate-300 font-sans">
      
      {/* TIER 1 ALERTS - TOP BAR */}
      <div className="flex gap-4 mb-8 overflow-x-auto pb-2">
        <div className="min-w-[250px] bg-red-500/10 border border-red-500/50 p-4 rounded-xl shadow-lg shadow-red-500/5">
          <p className="text-[10px] font-bold text-red-500 uppercase tracking-[0.2em]">🔴 At Risk</p>
          <h2 className="text-3xl font-black text-white">{stats.atRisk} <span className="text-sm font-normal text-slate-500">students</span></h2>
        </div>
        <div className="min-w-[250px] bg-amber-500/10 border border-amber-500/50 p-4 rounded-xl shadow-lg shadow-amber-500/5">
          <p className="text-[10px] font-bold text-amber-500 uppercase tracking-[0.2em]">🟡 Need Attention</p>
          <h2 className="text-3xl font-black text-white">{stats.attention} <span className="text-sm font-normal text-slate-500">students</span></h2>
        </div>
        <div className="min-w-[250px] bg-emerald-500/10 border border-emerald-500/50 p-4 rounded-xl shadow-lg shadow-emerald-500/5">
          <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-[0.2em]">🟢 On Track</p>
          <h2 className="text-3xl font-black text-white">{stats.onTrack} <span className="text-sm font-normal text-slate-500">students</span></h2>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* TABLA PRINCIPAL - 3/4 COLUMNAS */}
        <div className="lg:col-span-3 bg-slate-900/50 border border-slate-800 rounded-2xl">
          <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/30">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">Student Monitoring</h3>
            <input 
              type="text" placeholder="Search ID or Name..." 
              className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs w-64 outline-none focus:ring-1 focus:ring-emerald-500"
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="overflow-x-auto max-h-[600px]">
            <table className="w-full text-left text-[11px]">
              <thead className="sticky top-0 bg-slate-900 text-slate-500 font-bold border-b border-slate-800">
                <tr>
                  <th className="p-4">STUDENT</th>
                  <th className="p-4">VELOCITY</th>
                  <th className="p-4">CONSISTENCY</th>
                  <th className="p-4">ACCURACY</th>
                  <th className="p-4">STUCK</th>
                  <th className="p-4 text-right">DROPOUT RISK</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-800/20 transition-colors">
                    <td className="p-4 font-bold text-slate-200">{s.firstName} {s.lastName} <br/><span className="font-normal text-slate-600 text-[9px] uppercase tracking-tighter">{s.id}</span></td>
                    <td className="p-4">
                      <div className="w-24 bg-slate-800 h-1 rounded-full overflow-hidden mb-1">
                        <div className="bg-emerald-500 h-full" style={{width: `${s.metrics?.velocityScore || 0}%`}}></div>
                      </div>
                      <span className="font-mono text-emerald-500">{s.metrics?.velocityScore || 0}%</span>
                    </td>
                    <td className="p-4 font-mono">{s.metrics?.consistencyIndex > 0.8 ? '🟢 HIGH' : '🟡 MID'}</td>
                    <td className={`p-4 font-bold ${s.metrics?.accuracyRate < 65 ? 'text-red-400' : 'text-slate-300'}`}>{s.metrics?.accuracyRate || 0}%</td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded ${s.metrics?.stuckScore > 50 ? 'bg-red-500/20 text-red-500' : 'bg-slate-800 text-slate-500'}`}>
                        {s.metrics?.stuckScore || 0}
                      </span>
                    </td>
                    <td className="p-4 text-right font-black text-slate-400">{s.metrics?.dropoutProbability || 0}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* PANEL DERECHO - 1/4 COLUMNAS */}
        <div className="space-y-6">
          <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-2xl">
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-4">Top 5 Stuck</h3>
            <div className="space-y-3">
              {students.sort((a,b) => (b.metrics?.stuckScore || 0) - (a.metrics?.stuckScore || 0)).slice(0,5).map(s => (
                <div key={s.id} className="flex justify-between items-center text-[10px] border-l border-red-500 pl-2">
                  <span className="text-slate-300 font-bold">{s.firstName}</span>
                  <span className="text-red-400">{s.metrics?.stuckScore} SCORE</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-2xl">
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-4">Pattern Recognition</h3>
            <div className="text-[10px] space-y-3 text-slate-400 italic">
              <p>⚠️ {stats.attention} students showing signs of "Brute Force" learning.</p>
              <p>📉 General accuracy dropped 4% vs last update.</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
