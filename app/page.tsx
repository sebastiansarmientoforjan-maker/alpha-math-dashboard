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
    if (updating) return;
    setUpdating(true);
    console.log("🚀 Iniciando lote...");
    try {
      const res = await fetch('/api/update-students');
      const data = await res.json();
      
      if (data.success) {
        console.log(`✅ Lote completado. Progreso: ${data.currentIndex}/${data.total}`);
        if (autoSync && data.currentIndex < data.total && data.currentIndex !== 0) {
          setTimeout(runUpdateBatch, 2000);
        } else {
          setAutoSync(false);
          console.log("🏁 Proceso finalizado.");
        }
      } else {
        console.error("❌ Error en respuesta del servidor");
        setAutoSync(false);
      }
    } catch (err) {
      console.error("❌ Error de red:", err);
      setAutoSync(false);
    }
    setUpdating(false);
  };

  useEffect(() => {
    if (autoSync && !updating) runUpdateBatch();
  }, [autoSync]);

  const filtered = students.filter(s => 
    `${s.firstName || ''} ${s.lastName || ''}`.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="p-8 bg-slate-950 min-h-screen text-emerald-500 font-mono italic">CONNECTING TO ALPHA CORE...</div>;

  return (
    <div className="p-6 bg-slate-950 min-h-screen text-slate-300 font-sans">
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl mb-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">Database Population Status</h3>
          <span className="text-emerald-500 font-black">{students.length} / 1613</span>
        </div>
        <div className="w-full bg-slate-950 h-3 rounded-full border border-slate-800 overflow-hidden">
          <div className="bg-emerald-500 h-full transition-all duration-500" style={{ width: `${(students.length / 1613) * 100}%` }}></div>
        </div>
        <button 
          onClick={() => setAutoSync(!autoSync)}
          className={`mt-6 w-full py-3 rounded-xl font-black text-xs tracking-widest transition-all ${
            autoSync ? 'bg-red-900 text-white' : 'bg-emerald-600 text-white hover:bg-emerald-500'
          }`}
        >
          {autoSync ? '🛑 STOP AUTO-SYNC' : '▶ START INITIAL POPULATION'}
        </button>
      </div>

      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/80">
          <input 
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search student..." className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs w-64 focus:border-emerald-500 outline-none"
          />
        </div>
        <table className="w-full text-left text-[11px]">
          <thead className="bg-slate-900 text-slate-500 font-bold border-b border-slate-800 uppercase tracking-tighter">
            <tr><th className="p-4">Student</th><th className="p-4">Velocity</th><th className="p-4">Accuracy</th><th className="p-4">Risk</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-800/40">
            {filtered.map((s) => (
              <tr key={s.id} className="hover:bg-slate-800/20">
                <td className="p-4 font-bold">{s.firstName} {s.lastName}</td>
                <td className="p-4 text-emerald-500">{s.metrics?.velocityScore}%</td>
                <td className="p-4">{s.metrics?.accuracyRate}%</td>
                <td className="p-4 font-black">{s.metrics?.dropoutProbability}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
