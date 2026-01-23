'use client';

import { useState, useEffect, useMemo } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { 
  ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell 
} from 'recharts';
import StudentModal from '@/components/StudentModal';
import { calculateTier1Metrics } from '@/lib/metrics';
import { calculateDRIMetrics } from '@/lib/dri-calculus';
import { Student } from '@/types';
import { TOPIC_GRADE_MAP } from '@/lib/grade-maps';

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-900 border border-slate-700 p-3 rounded-lg shadow-2xl text-xs">
        <p className="font-bold text-white mb-1">{data.firstName} {data.lastName}</p>
        <p className="text-indigo-400 font-bold mb-1 uppercase text-[9px]">{data.currentCourse?.name}</p>
        <p className="text-emerald-400">Mastery (LMP): {(data.metrics?.lmp * 100).toFixed(0)}%</p>
        <p className="text-blue-400">Stability (KSI): {data.metrics?.ksi}%</p>
        <p className={`mt-1 font-mono uppercase font-bold ${data.dri.driTier === 'RED' ? 'text-red-500' : data.dri.driTier === 'YELLOW' ? 'text-amber-500' : 'text-emerald-500'}`}>
            {data.dri.driSignal}
        </p>
      </div>
    );
  }
  return null;
};

export default function PanelPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [viewMode, setViewMode] = useState<'TRIAGE' | 'MATRIX' | 'HEATMAP'>('TRIAGE');
  const [search, setSearch] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('ALL');

  useEffect(() => {
    const unsub = onSnapshot(query(collection(db, 'students')), (snapshot) => {
      const data = snapshot.docs.map(doc => {
        const s = { id: doc.id, ...doc.data() } as any;
        const metrics = calculateTier1Metrics(s, s.activity);
        const dri = calculateDRIMetrics({ ...s, metrics });
        return { ...s, metrics, dri };
      }) as Student[];
      setStudents(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const uniqueCourses = useMemo(() => Array.from(new Set(students.map(s => s.currentCourse?.name).filter(Boolean))).sort(), [students]);
  const criticalTopics = Object.keys(TOPIC_GRADE_MAP);

  // --- LÓGICA DEL HEATMAP (Módulo 1 del Reporte) ---
  const heatmapData = useMemo(() => {
    return criticalTopics.map(topic => {
      const courseStats = uniqueCourses.map(course => {
        const relevantStudents = students.filter(s => s.currentCourse?.name === course);
        const masterySum = relevantStudents.reduce((acc, s) => {
          const hasTopic = s.activity.tasks.some(t => t.topic?.name.includes(topic));
          return acc + (hasTopic ? (s.metrics.lmp || 0) : 0.5); // Default 0.5 si no hay datos
        }, 0);
        const avgLMP = masterySum / Math.max(1, relevantStudents.length);
        return { course, avgLMP };
      });
      return { topic, courseStats };
    });
  }, [students, uniqueCourses, criticalTopics]);

  const filtered = useMemo(() => students.filter(s => {
    const nameMatch = `${s.firstName} ${s.lastName}`.toLowerCase().includes(search.toLowerCase());
    const courseMatch = selectedCourse === 'ALL' || s.currentCourse?.name === selectedCourse;
    return nameMatch && courseMatch;
  }), [students, search, selectedCourse]);

  if (loading) return <div className="p-10 bg-black min-h-screen text-emerald-500 font-mono italic animate-pulse tracking-widest uppercase">Initializing DRI Cockpit...</div>;

  return (
    <div className="p-6 bg-[#050505] min-h-screen text-slate-300 font-sans">
      <div className="flex justify-between items-end mb-8 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-3xl font-black uppercase italic text-white tracking-tighter">Alpha Command V3.6</h1>
          <p className="text-[10px] text-indigo-400 font-bold tracking-[0.3em] uppercase">Módulo Estratégico de Brechas de Conocimiento</p>
        </div>
        <div className="flex bg-slate-900/50 p-1 rounded-xl border border-slate-800">
          {['TRIAGE', 'MATRIX', 'HEATMAP'].map(m => (
            <button key={m} onClick={() => setViewMode(m as any)} className={`px-5 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${viewMode === m ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500'}`}>{m}</button>
          ))}
        </div>
      </div>

      <div className="flex gap-4 mb-8">
        <input onChange={e => setSearch(e.target.value)} placeholder="🔎 SEARCH UNIT..." className="flex-1 bg-slate-900/40 border border-slate-800 rounded-2xl px-6 py-4 text-sm focus:border-indigo-500 outline-none font-mono" />
        <select onChange={e => setSelectedCourse(e.target.value)} className="bg-slate-900 border border-slate-800 rounded-2xl px-4 text-[10px] font-black uppercase text-slate-400">
          <option value="ALL">ALL COURSES</option>
          {uniqueCourses.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div className="h-[calc(100vh-280px)]">
        {viewMode === 'TRIAGE' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
            {['RED', 'YELLOW', 'GREEN'].map(tier => (
              <div key={tier} className="flex flex-col bg-slate-900/20 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
                <div className={`p-4 border-b border-slate-800 font-black text-[10px] uppercase tracking-widest ${tier === 'RED' ? 'text-red-500' : tier === 'YELLOW' ? 'text-amber-500' : 'text-emerald-500'}`}>{tier} ZONE</div>
                <div className="p-4 space-y-3 overflow-y-auto custom-scrollbar">
                  {filtered.filter(s => s.dri.driTier === tier).map(s => (
                    <div key={s.id} onClick={() => setSelectedStudent(s)} className="p-4 bg-slate-900/80 rounded-2xl border-l-4 border-current cursor-pointer hover:scale-[1.02] transition-all">
                      <div className="flex justify-between items-start mb-1">
                        <h3 className="font-black text-white text-sm uppercase italic">{s.firstName} {s.lastName}</h3>
                        <span className="text-[10px] font-mono font-bold text-slate-500">{(s.metrics.lmp * 100).toFixed(0)}% LMP</span>
                      </div>
                      <p className="text-[9px] text-slate-500 font-bold uppercase mb-2">{s.currentCourse.name}</p>
                      <div className="flex justify-between text-[10px] font-mono">
                        <span className="text-indigo-400">KSI: {s.metrics.ksi}% Stability</span>
                        <span className="text-red-500">DER: {s.dri.debtExposure}% Debt</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {viewMode === 'MATRIX' && (
          <div className="h-full w-full bg-slate-900/10 border border-slate-800 rounded-[2.5rem] p-8 relative overflow-hidden">
             <div className="absolute top-12 right-12 text-emerald-500/5 font-black text-7xl select-none uppercase italic tracking-tighter">Flow Masters</div>
             <div className="absolute bottom-12 left-12 text-red-500/5 font-black text-7xl select-none uppercase italic tracking-tighter">Stability Leak</div>
             <ResponsiveContainer>
                <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 0 }}>
                   <CartesianGrid stroke="#1e293b" vertical={false} />
                   <XAxis type="number" dataKey="metrics.lmp" name="Mastery" domain={[0, 1]} stroke="#475569" fontSize={10} />
                   <YAxis type="number" dataKey="metrics.ksi" name="Stability" domain={[0, 100]} stroke="#475569" fontSize={10} />
                   <ZAxis type="number" range={[100, 600]} />
                   <Tooltip content={<CustomTooltip />} />
                   <ReferenceLine x={0.7} stroke="#10b981" strokeDasharray="5 5" opacity={0.3} />
                   <ReferenceLine y={60} stroke="#ef4444" strokeDasharray="5 5" opacity={0.3} />
                   <Scatter data={filtered} onClick={n => setSelectedStudent(n.payload)}>
                      {filtered.map((e, i) => <Cell key={i} fill={e.dri.driTier === 'RED' ? '#f43f5e' : e.dri.driTier === 'YELLOW' ? '#f59e0b' : '#10b981'} className="cursor-pointer opacity-60 hover:opacity-100 transition-all duration-300" />)}
                   </Scatter>
                </ScatterChart>
             </ResponsiveContainer>
          </div>
        )}

        {viewMode === 'HEATMAP' && (
          <div className="h-full w-full bg-slate-950 border border-slate-800 rounded-[2.5rem] p-8 overflow-hidden flex flex-col shadow-2xl">
             <div className="mb-6">
                <h2 className="text-xs font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                   <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
                   Knowledge Gap Matrix: Latent Mastery (LMP) vs. Cohorts
                </h2>
             </div>
             <div className="flex-1 overflow-auto custom-scrollbar">
                <table className="w-full border-collapse">
                   <thead>
                      <tr>
                         <th className="sticky top-0 left-0 z-20 bg-slate-950 p-2 text-[8px] font-black text-slate-600 uppercase text-left border-b border-slate-800">Knowledge Component</th>
                         {uniqueCourses.map(course => (
                            <th key={course} className="sticky top-0 z-10 bg-slate-950 p-2 text-[8px] font-black text-slate-500 uppercase border-b border-slate-800 min-w-[80px]">{course}</th>
                         ))}
                      </tr>
                   </thead>
                   <tbody>
                      {heatmapData.map(row => (
                         <tr key={row.topic} className="hover:bg-slate-900/50 transition-colors">
                            <td className="sticky left-0 z-10 bg-slate-950 p-2 text-[9px] font-bold text-slate-400 border-r border-slate-800 uppercase">{row.topic}</td>
                            {row.courseStats.map((cell, idx) => (
                               <td key={idx} className="p-1 border border-slate-900">
                                  <div 
                                     className="h-8 rounded-md flex items-center justify-center text-[10px] font-mono font-black transition-all"
                                     style={{ 
                                        backgroundColor: cell.avgLMP < 0.4 ? 'rgba(239, 68, 68, 0.2)' : cell.avgLMP < 0.7 ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.1)',
                                        color: cell.avgLMP < 0.4 ? '#ef4444' : cell.avgLMP < 0.7 ? '#f59e0b' : '#10b981',
                                        border: `1px solid ${cell.avgLMP < 0.4 ? '#ef444433' : cell.avgLMP < 0.7 ? '#f59e0b33' : '#10b98133'}`
                                     }}
                                  >
                                     {(cell.avgLMP * 100).toFixed(0)}%
                                  </div>
                               </td>
                            ))}
                         </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          </div>
        )}
      </div>

      {selectedStudent && <StudentModal student={selectedStudent} onClose={() => setSelectedStudent(null)} />}
    </div>
  );
}
