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

  useEffect(() => {
    const q = query(collection(db, 'students'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setStudents(data);
      setSyncInfo(prev => ({ ...prev, current: data.length, percent: Math.round((data.length / 1613) * 100) }));
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

  const filtered = students.filter(s => 
    `${s.firstName} ${s.lastName}`.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="p-8 bg-slate-950 min-h-screen text-emerald-500 font-mono italic animate-pulse">BOOTING ALPHA COMMAND CENTER...</div>;

  return (
    <div className="p-6 bg-slate-950 min-h-screen text-slate-300 font-sans">
      
      {/* BARRA DE PROGRESO DE CARGA TOTAL */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl mb-8 shadow-2xl">
        <div className="flex justify-between items-end mb-4">
          <div>
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-2">Total Database Population</h3>
            <p className="text-3xl font-black text-white">{students.length} <span className="text-slate-700">/ 1613</span></p>
          </div>
          <div className="text-right">
            <span className="text-emerald-500 font-black text-2xl">{Math.round((students.length / 1613) * 100)}%</span>
          </div>
        </div>
        <div className="w-full bg-slate-950 h-4 rounded-full border border-slate-800 p-1">
          <div 
            className="bg-gradient-to-r from-emerald-600 to-emerald-400 h-full rounded-full shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all duration-500"
            style={{ width: `${(students.length / 1613) * 100}%` }}
          ></div>
        </div>
        <button 
          onClick={() => setAutoSync(!autoSync)}
          className={`mt-6 w-full py-3 rounded-xl font-black text-xs tracking-widest transition-all ${
            autoSync ? 'bg-red-900/20 text-red-500 border border-red-500/50' : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-lg shadow-emerald-600/20'
          }`}
        >
          {autoSync ? '🛑 STOP AUTO-SYNC' : '▶ START INITIAL POPULATION (AUTO-PILOT)'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/80">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">Student Registry</h3>
            <input 
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter by name..." className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs w-64 focus:border-emerald-500 outline-none"
            />
          </div>
          <div className="overflow-x-auto max-h-[600px]">
            <table className="w-full text-left text-[11px]">
              <thead className="bg-slate-900 text-slate-500 font-bold border-b border-slate-800 sticky top-0">
                <tr>
                  <th className="p-4">STUDENT</th>
                  <th className="p-4">VELOCITY</th>
                  <th className="p-4">ACCURACY</th>
                  <th className="p-4">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-800/20 transition-colors group">
                    <td className="p-4">
                      <div className="font-bold text-slate-100 group-hover:text-emerald-400 transition-colors">{s.firstName} {s.lastName}</div>
                      <div className="text-[9px] text-slate-600 font-mono uppercase">{s.id}</div>
                    </td>
                    <td className="p-4 font-mono text-emerald-500">{s.metrics?.velocityScore || 0}%</td>
                    <td className="p-4 font-mono">{s.metrics?.accuracyRate || 0}%</td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                        (s.metrics?.dropoutProbability || 0) > 60 ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'
                      }`}>
                        {(s.metrics?.dropoutProbability || 0) > 60 ? 'CRITICAL' : 'HEALTHY'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
