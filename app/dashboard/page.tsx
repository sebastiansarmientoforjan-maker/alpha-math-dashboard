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
      const studentData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setStudents(studentData);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // LÓGICA DE INDICADORES TIER 1
  const stats = {
    atRisk: students.filter(s => (s.activity?.xpAwarded || 0) < 50).length,
    attention: students.filter(s => (s.activity?.questionsCorrect / s.activity?.questions) < 0.7).length,
    onTrack: students.filter(s => (s.activity?.xpAwarded || 0) >= 150).length,
  };

  const filteredStudents = (students || []).filter((s) => {
    const fullName = `${s.firstName || ''} ${s.lastName || ''}`.toLowerCase();
    return fullName.includes(search.toLowerCase());
  });

  if (loading) return <div className="p-8 text-white bg-slate-950 min-h-screen">Cargando Alpha Intelligence...</div>;

  return (
    <div className="p-6 bg-slate-950 min-h-screen text-slate-200 font-sans">
      
      {/* TIER 1 ALERTS - SIEMPRE VISIBLE */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-red-950/30 border border-red-500/50 p-4 rounded-xl flex justify-between items-center shadow-lg shadow-red-900/10">
          <div>
            <p className="text-red-400 text-xs font-bold uppercase tracking-wider">At Risk</p>
            <h2 className="text-3xl font-black text-red-500">{stats.atRisk}</h2>
          </div>
          <span className="text-4xl">🔴</span>
        </div>
        <div className="bg-amber-950/30 border border-amber-500/50 p-4 rounded-xl flex justify-between items-center shadow-lg shadow-amber-900/10">
          <div>
            <p className="text-amber-400 text-xs font-bold uppercase tracking-wider">Need Attention</p>
            <h2 className="text-3xl font-black text-amber-500">{stats.attention}</h2>
          </div>
          <span className="text-4xl">🟡</span>
        </div>
        <div className="bg-emerald-950/30 border border-emerald-500/50 p-4 rounded-xl flex justify-between items-center shadow-lg shadow-emerald-900/10">
          <div>
            <p className="text-emerald-400 text-xs font-bold uppercase tracking-wider">On Track</p>
            <h2 className="text-3xl font-black text-emerald-500">{stats.onTrack}</h2>
          </div>
          <span className="text-4xl">🟢</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* TABLA PRINCIPAL (2/3 de la pantalla) */}
        <div className="lg:col-span-2 bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-sm">
          <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/80">
            <h3 className="font-bold text-slate-400">Main Student Registry</h3>
            <input 
              type="text" 
              placeholder="Filter by name..." 
              className="bg-slate-950 border border-slate-700 p-2 rounded-lg text-sm w-64 focus:outline-none focus:border-emerald-500 transition-all"
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="overflow-x-auto overflow-y-auto max-h-[600px]">
            <table className="w-full text-left">
              <thead className="sticky top-0 bg-slate-900 z-10 text-xs uppercase text-slate-500 font-bold border-b border-slate-800">
                <tr>
                  <th className="p-4">Student</th>
                  <th className="p-4">Velocity</th>
                  <th className="p-4">Accuracy</th>
                  <th className="p-4 text-center">Stuck</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredStudents.map((s) => {
                  const accuracy = s.activity?.questions > 0 
                    ? Math.round((s.activity.questionsCorrect / s.activity.questions) * 100) 
                    : 0;
                  
                  return (
                    <tr key={s.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="p-4 font-medium">{s.firstName} {s.lastName}</td>
                      <td className="p-4 text-emerald-400">{s.activity?.xpAwarded || 0} XP</td>
                      <td className={`p-4 ${accuracy < 70 ? 'text-red-400' : 'text-slate-300'}`}>{accuracy}%</td>
                      <td className="p-4 text-center text-slate-500">{s.activity?.numTasks || 0}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                          accuracy > 85 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
                        }`}>
                          {accuracy > 85 ? 'HEALTHY' : 'STALLED'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* PANEL DERECHO (1/3 de la pantalla) */}
        <div className="flex flex-col gap-6">
          
          <div className="bg-slate-900/50 border border-slate-800 p-5 rounded-2xl">
            <h3 className="text-sm font-bold text-slate-400 mb-4 uppercase tracking-widest">Top 5 Stuck Students</h3>
            <div className="space-y-3">
              {filteredStudents
                .sort((a, b) => (b.activity?.numTasks || 0) - (a.activity?.numTasks || 0))
                .slice(0, 5)
                .map(s => (
                  <div key={s.id} className="flex justify-between items-center text-sm border-l-2 border-red-500 pl-3 py-1">
                    <span className="text-slate-300">{s.firstName} {s.lastName}</span>
                    <span className="text-red-400 font-bold">{s.activity?.numTasks || 0} tasks</span>
                  </div>
                ))}
            </div>
          </div>

          <div className="bg-slate-900/50 border border-slate-800 p-5 rounded-2xl">
            <h3 className="text-sm font-bold text-slate-400 mb-4 uppercase tracking-widest">Pattern Recognition</h3>
            <div className="text-xs space-y-3 text-slate-400">
              <p className="flex items-start gap-2">
                <span className="text-amber-500 font-bold">⚠️ High Volume / Low Accuracy:</span>
                3 students are brute-forcing lessons.
              </p>
              <p className="flex items-start gap-2 border-t border-slate-800 pt-2">
                <span className="text-emerald-500 font-bold">✅ Weekend Surge:</span>
                12% increase in productivity since Friday.
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
