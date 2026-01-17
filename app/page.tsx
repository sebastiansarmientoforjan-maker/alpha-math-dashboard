'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query } from 'firebase/firestore';

export default function DashboardPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'students'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setStudents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleManualUpdate = async () => {
    setUpdating(true);
    try {
      const res = await fetch('/api/update-students');
      const data = await res.json();
      console.log("Update Success", data);
    } catch (err) {
      console.error("Update Failed", err);
    }
    setUpdating(false);
  };

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
      
      {/* HEADER & MANUAL SYNC */}
      <div className="flex justify-between items-center mb-8 border-b border-slate-800 pb-6">
        <h1 className="text-xl font-black uppercase tracking-tighter text-white italic">Alpha Command Center</h1>
        <button 
          onClick={handleManualUpdate}
          disabled={updating}
          className={`px-6 py-2 rounded-full font-bold text-[10px] tracking-widest transition-all ${
            updating ? 'bg-slate-800 text-slate-500' : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
          }`}
        >
          {updating ? '🔄 SYNCING BATCH...' : '⚡ MANUAL REFRESH (100 IDS)'}
        </button>
      </div>

      {/* TIER 1 ALERTS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl">
          <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest">At Risk</p>
          <h2 className="text-3xl font-black">{stats.atRisk}</h2>
        </div>
        <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-xl">
          <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">Attention</p>
          <h2 className="text-3xl font-black">{stats.attention}</h2>
        </div>
        <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-xl">
          <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">On Track</p>
          <h2 className="text-3xl font-black">{stats.onTrack}</h2>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="p-4 bg-slate-900/80 border-b border-slate-800 flex justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Student Registry</span>
            <input 
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter..." className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs outline-none focus:border-emerald-500"
            />
          </div>
          <div className="overflow-x-auto max-h-[600px]">
            <table className="w-full text-left text-[11px]">
              <thead className="bg-slate-900 text-slate-500 font-bold border-b border-slate-800">
                <tr>
                  <th className="p-4">STUDENT</th>
                  <th className="p-4">VELOCITY</th>
                  <th className="p-4">CONSISTENCY</th>
                  <th className="p-4">ACCURACY</th>
                  <th className="p-4">STUCK</th>
                  <th className="p-4 text-right">DROPOUT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-4 font-bold">{s.firstName} {s.lastName}</td>
                    <td className="p-4 text-emerald-500">{s.metrics?.velocityScore || 0}%</td>
                    <td className="p-4">{s.metrics?.consistencyIndex > 0.8 ? '🟢 HIGH' : '🟡 MID'}</td>
                    <td className="p-4 font-bold">{s.metrics?.accuracyRate || 0}%</td>
                    <td className="p-4"><span className="bg-slate-800 px-2 py-0.5 rounded text-slate-500">{s.metrics?.stuckScore || 0}</span></td>
                    <td className="p-4 text-right font-black text-red-500/70">{s.metrics?.dropoutProbability || 0}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* SIDE PANEL */}
        <div className="space-y-6">
          <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-2xl">
            <h3 className="text-[10px] font-bold text-slate-500 uppercase mb-4 tracking-widest">Top 5 Stuck</h3>
            {students.sort((a,b) => (b.metrics?.stuckScore || 0) - (a.metrics?.stuckScore || 0)).slice(0,5).map(s => (
              <div key={s.id} className="text-[10px] flex justify-between mb-2 border-l border-red-500 pl-2">
                <span>{s.firstName}</span>
                <span className="text-red-500 font-bold">{s.metrics?.stuckScore}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
