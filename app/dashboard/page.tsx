'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query } from 'firebase/firestore';

export default function DashboardPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [autoSync, setAutoSync] = useState(false);
  const [search, setSearch] = useState('');
  const [syncInfo, setSyncInfo] = useState({ current: 0, total: 1613, percent: 0 });

  // 1. Escuchar la base de datos
  useEffect(() => {
    const q = query(collection(db, 'students'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setStudents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 2. Lógica de actualización (Batching)
  const runUpdateBatch = async () => {
    setUpdating(true);
    try {
      const res = await fetch('/api/update-students');
      const data = await res.json();
      if (data.success) {
        setSyncInfo({ 
          current: data.currentIndex, 
          total: data.totalStudents, 
          percent: data.progress 
        });
        
        // Si el modo Auto-Sync está activo y no hemos llegado al 100%, pedir otro lote
        if (autoSync && data.progress < 100) {
          setTimeout(runUpdateBatch, 1500); // Esperar 1.5 seg entre lotes para no saturar
        } else {
          setAutoSync(false); // Detener si llegó al final
        }
      }
    } catch (err) {
      setAutoSync(false);
    }
    setUpdating(false);
  };

  // 3. Trigger inicial del Auto-Sync
  useEffect(() => {
    if (autoSync && !updating) {
      runUpdateBatch();
    }
  }, [autoSync]);

  const stats = {
    atRisk: students.filter(s => (s.metrics?.dropoutProbability || 0) > 60).length,
    attention: students.filter(s => (s.metrics?.stuckScore || 0) > 40).length,
    onTrack: students.filter(s => (s.metrics?.velocityScore || 0) > 70).length,
  };

  const filtered = students.filter(s => 
    `${s.firstName} ${s.lastName}`.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="p-8 bg-slate-950 min-h-screen text-emerald-500 font-mono">INITIALIZING ALPHA SYSTEM...</div>;

  return (
    <div className="p-6 bg-slate-950 min-h-screen text-slate-300 font-sans">
      
      {/* TIER 1 ALERTS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-red-500/10 border border-red-500/30 p-6 rounded-2xl">
          <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest mb-1">🔴 Critical: At Risk</p>
          <h2 className="text-4xl font-black text-white">{stats.atRisk}</h2>
        </div>
        <div className="bg-amber-500/10 border border-amber-500/30 p-6 rounded-2xl">
          <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest mb-1">🟡 Need Attention</p>
          <h2 className="text-4xl font-black text-white">{stats.attention}</h2>
        </div>
        <div className="bg-emerald-500/10 border border-emerald-500/30 p-6 rounded-2xl">
          <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-1">🟢 On Track</p>
          <h2 className="text-4xl font-black text-white">{stats.onTrack}</h2>
        </div>
      </div>

      {/* SYNC CONTROL PANEL */}
      <div className="bg-slate-900/80 border border-slate-700 p-6 rounded-2xl mb-8 backdrop-blur-md">
        <div className="flex justify-between items-end mb-4">
          <div>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Sync Progress (1613 Students)</h3>
            <p className="text-2xl font-black text-white">
              {syncInfo.current} <span className="text-slate-600">/ {syncInfo.total}</span>
            </p>
          </div>
          <div className="text-right font-mono font-bold text-emerald-500 text-2xl">
            {syncInfo.percent}%
          </div>
        </div>
        
        <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden border border-slate-700">
          <div 
            className="bg-emerald-500 h-full transition-all duration-1000 shadow-[0_0_15px_rgba(16,185,129,0.4)]"
            style={{ width: `${syncInfo.percent}%` }}
          ></div>
        </div>

        <div className="flex gap-4 mt-6">
          <button 
            onClick={() => setAutoSync(true)}
            disabled={updating || autoSync}
            className={`flex-1 py-3 rounded-xl font-black text-xs tracking-widest transition-all ${
              autoSync ? 'bg-emerald-500 text-white animate-pulse' : 'bg-white text-black hover:bg-emerald-500 hover:text-white'
            }`}
          >
            {autoSync ? '🚀 RUNNING AUTO-PILOT...' : '▶ START AUTO-SYNC'}
          </button>
          
          <button 
            onClick={() => setAutoSync(false)}
            className="px-8 py-3 bg-slate-800 text-slate-400 rounded-xl font-bold text-xs hover:bg-red-900/30 hover:text-red-500 transition-all"
          >
            STOP
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* TABLA PRINCIPAL */}
        <div className="lg:col-span-3 bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex justify-between bg-slate-900/80 items-center">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">Tier 1 Monitoring</h3>
            <input 
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter by name..." 
              className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs w-64 outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
          <div className="overflow-x-auto max-h-[600px]">
            <table className="w-full text-left text-[11px]">
              <thead className="bg-slate-900 text-slate-500 font-bold border-b border-slate-800 sticky top-0">
                <tr>
                  <th className="p-4">STUDENT</th>
                  <th className="p-4">VELOCITY</th>
                  <th className="p-4 text-center">CONSISTENCY</th>
                  <th className="p-4 text-center">ACCURACY</th>
                  <th className="p-4 text-center">STUCK</th>
                  <th className="p-4 text-right">DROPOUT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-slate-200">{s.firstName} {s.lastName}</div>
                      <div className="text-[9px] text-slate-600 font-mono">{s.id}</div>
                    </td>
                    <td className="p-4">
                      <div className="w-20 bg-slate-800 h-1 rounded-full mb-1">
                        <div className="bg-emerald-500 h-full" style={{width: `${s.metrics?.velocityScore || 0}%`}}></div>
                      </div>
                      <span className="text-emerald-500 font-mono">{s.metrics?.velocityScore || 0}%</span>
                    </td>
                    <td className="p-4 text-center font-mono">
                      {s.metrics?.consistencyIndex > 0.8 ? '🟢 HIGH' : '🟡 MID'}
                    </td>
                    <td className={`p-4 text-center font-black ${s.metrics?.accuracyRate < 65 ? 'text-red-400' : 'text-slate-300'}`}>
                      {s.metrics?.accuracyRate || 0}%
                    </td>
                    <td className="p-4 text-center font-mono text-slate-500">{s.metrics?.stuckScore || 0}</td>
                    <td className="p-4 text-right font-black text-red-500/70">{s.metrics?.dropoutProbability || 0}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* PANEL DERECHO */}
        <div className="space-y-6">
          <div className="bg-slate-900/50 border border-slate-800 p-5 rounded-2xl">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Top 5 Stuck Score</h3>
            {students.sort((a,b) => (b.metrics?.stuckScore || 0) - (a.metrics?.stuckScore || 0)).slice(0,5).map(s => (
              <div key={s.id} className="text-[10px] flex justify-between mb-2 border-l-2 border-red-500 pl-3">
                <span className="font-bold text-slate-300">{s.firstName}</span>
                <span className="text-red-500 font-mono">{s.metrics?.stuckScore}</span>
              </div>
            ))}
          </div>
          
          <div className="bg-slate-900/50 border border-slate-800 p-5 rounded-2xl text-[10px] text-slate-400 italic">
            <p className="mb-2">⚠️ System detected {stats.attention} students with low accuracy patterns.</p>
            <p>🔥 Weekend Sync recommended for high-velocity students.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
