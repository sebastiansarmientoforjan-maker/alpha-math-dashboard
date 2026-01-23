'use client';

import { useState, useEffect, useMemo } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { 
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell 
} from 'recharts';
import StudentModal from '@/components/StudentModal';
import { calculateTier1Metrics } from '@/lib/metrics';
import { calculateDRIMetrics } from '@/lib/dri-calculus';
import { Student } from '@/types';
import { TOPIC_GRADE_MAP } from '@/lib/grade-maps';

// Tooltip táctico para la Matriz
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-900 border border-slate-700 p-3 rounded-lg shadow-2xl text-xs">
        <p className="font-bold text-white mb-1">{data.firstName} {data.lastName}</p>
        <p className="text-indigo-400 font-bold mb-1 uppercase text-[9px]">{data.currentCourse?.name}</p>
        <p className="text-emerald-400">Mastery (LMP): {(data.metrics?.lmp * 100).toFixed(0)}%</p>
        <p className="text-blue-400">Stability (KSI): {data.metrics?.ksi}%</p>
        <p className={`mt-1 font-mono uppercase font-bold ${data.dri.driColor}`}>
            {data.dri.driSignal}
        </p>
      </div>
    );
  }
  return null;
};

export default function HomePage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [autoSync, setAutoSync] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  
  const [viewMode, setViewMode] = useState<'TRIAGE' | 'MATRIX' | 'HEATMAP' | 'LOG'>('TRIAGE');
  const [search, setSearch] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('ALL');

  useEffect(() => {
    const unsubStudents = onSnapshot(query(collection(db, 'students')), (snapshot) => {
      const data = snapshot.docs.map(doc => {
        const s = { id: doc.id, ...doc.data() } as any;
        const metrics = calculateTier1Metrics(s, s.activity);
        const dri = calculateDRIMetrics({ ...s, metrics });
        return { ...s, metrics, dri };
      }) as Student[];
      setStudents(data);
      setLoading(false);
    });

    const unsubLogs = onSnapshot(query(collection(db, 'interventions'), orderBy('createdAt', 'desc'), limit(20)), (snapshot) => {
      setLogs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => { unsubStudents(); unsubLogs(); };
  }, []);

  const runUpdateBatch = async () => {
    if (updating) return;
    setUpdating(true);
    try {
      const res = await fetch('/api/update-students');
      const data = await res.json();
      if (data.success) {
        setProgress(data.progress);
        if (autoSync && data.progress < 100) setTimeout(runUpdateBatch, 1500);
        else if (data.progress >= 100) setAutoSync(false);
      }
    } catch (err) { setAutoSync(false); }
    setUpdating(false);
  };

  useEffect(() => { if (autoSync) runUpdateBatch(); }, [autoSync]);

  const uniqueCourses = useMemo(() => Array.from(new Set(students.map(s => s.currentCourse?.name).filter(Boolean))).sort(), [students]);
  const criticalTopics = Object.keys(TOPIC_GRADE_MAP);

  const heatmapData = useMemo(() => {
    return criticalTopics.map(topic => {
      const courseStats = uniqueCourses.map(course => {
        const relevant = students.filter(s => s.currentCourse?.name === course);
        const avgLMP = relevant.reduce((acc, s) => acc + (s.metrics?.lmp || 0), 0) / Math.max(1, relevant.length);
        return { course, avgLMP };
      });
      return { topic, courseStats };
    });
  }, [students, uniqueCourses, criticalTopics]);

  const filtered = useMemo(() => students.filter(s => {
    const nameMatch = `${s.firstName} ${s.lastName} ${s.id}`.toLowerCase().includes(search.toLowerCase());
    const courseMatch = selectedCourse === 'ALL' || s.currentCourse?.name === selectedCourse;
    return nameMatch && courseMatch;
  }), [students, search, selectedCourse]);

  const redZone = useMemo(() => filtered.filter(s => s.dri.driTier === 'RED'), [filtered]);
  const yellowZone = useMemo(() => filtered.filter(s => s.dri.driTier === 'YELLOW' && !redZone.some(r => r.id === s.id)), [filtered, redZone]);
  const greenZone = useMemo(() => filtered.filter(s => !redZone.some(r => r.id === s.id) && !yellowZone.some(y => y.id === s.id)), [filtered, redZone, yellowZone]);

  if (loading) return <div className="p-10 bg-black min-h-screen text-emerald-500 font-mono italic animate-pulse text-center uppercase tracking-widest">DRI Cockpit Initializing...</div>;

  return (
    <div className="p-4 bg-[#050505] min-h-screen text-slate-300 font-sans">
      
      {/* HEADER INTEGRADO */}
      <div className="flex flex-col md:flex-row justify-between items-end mb-8 border-b border-slate-800 pb-6 gap-4">
        <div>
          <h1 className="text-3xl font-black uppercase italic text-white tracking-tighter">DRI COMMAND CENTER</h1>
          <p className="text-[10px] text-indigo-400 font-bold tracking-[0.3em] uppercase">Population Management: {students.length} / 1613</p>
        </div>
        
        <div className="flex flex-col items-end gap-3">
          <div className="flex bg-slate-900/50 p-1 rounded-xl border border-slate-800 font-black text-[10px] uppercase">
            {['TRIAGE', 'MATRIX', 'HEATMAP', 'LOG'].map(m => (
              <button key={m} onClick={() => setViewMode(m as any)} className={`px-4 py-2 rounded-lg transition-all ${viewMode === m ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>{m}</button>
            ))}
          </div>
          
          <div className="flex gap-4 items-center bg-slate-900/40 p-2 px-4 rounded-xl border border-slate-800 relative overflow-hidden">
            {autoSync && <div className="absolute bottom-0 left-0 h-0.5 bg-emerald-500 transition-all duration-700 shadow-[0_0_10px_#10b981]" style={{ width: `${progress}%` }} />}
            <span className="text-[10px] font-mono font-bold text-white">{students.length} / 1613</span>
            <button onClick={() => setAutoSync(!autoSync)} className={`px-4 py-1.5 rounded-lg font-black text-[9px] tracking-widest uppercase transition-all ${autoSync ? 'bg-red-900/50 text-red-500 border border-red-500 animate-pulse' : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-lg'}`}>
              {autoSync ? `STOP SYNC ${progress}%` : '⚡ AUTO SYNC'}
            </button>
          </div>
        </div>
      </div>

      {/* FILTROS */}
      <div className="flex flex-wrap gap-4 mb-8">
        <input onChange={(e) => setSearch(e.target.value)} placeholder="🔎 SEARCH UNIT BY NAME OR ID..." className="flex-1 min-w-[300px] bg-slate-900/40 border border-slate-800 rounded-2xl px-6 py-4 text-sm focus:border-indigo-500 outline-none font-mono transition-all" />
        <select value={selectedCourse} onChange={(e) => setSelectedCourse(e.target.value)} className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-[10px] font-black uppercase text-slate-400 outline-none">
          <option value="ALL">ALL COURSES</option>
          {uniqueCourses.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* CONTENIDO DINÁMICO */}
      <div className="h-[calc(100vh-280px)] overflow-hidden">
        {viewMode === 'TRIAGE' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full animate-in fade-in duration-500">
            {[
                { label: '🚨 Critical Ops', data: redZone, tier: 'RED', border: 'border-red-500' },
                { label: '⚠️ Watch List', data: yellowZone, tier: 'YELLOW', border: 'border-amber-500' },
                { label: '⚡ Stable Units', data: greenZone, tier: 'GREEN', border: 'border-emerald-500' }
            ].map(col => (
              <div key={col.tier} className="flex flex-col bg-slate-900/20 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
                <div className={`p-4 bg-slate-900/40 border-b border-slate-800 font-black text-[10px] uppercase tracking-widest flex justify-between`}>
                  <span className="text-slate-300">{col.label}</span>
                  <span className="bg-slate-800 text-slate-500 px-2 py-0.5 rounded font-mono">{col.data.length} UNITS</span>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                  {col.data.map(s => (
                    <div key={s.id} onClick={() => setSelectedStudent(s)} className={`p-4 bg-slate-900/80 rounded-2xl border-l-4 ${col.border} cursor-pointer hover:scale-[1.02] transition-all group`}>
                      <div className="flex justify-between items-start mb-1">
                        <h3 className="font-black text-white text-sm uppercase italic truncate w-40 group-hover:text-indigo-400">{s.firstName} {s.lastName}</h3>
                        <span className="text-[10px] font-mono font-bold text-slate-500 italic">{(s.metrics.lmp * 100).toFixed(0)}% LMP</span>
                      </div>
                      <p className="text-[9px] text-indigo-400/70 font-bold uppercase mb-3 truncate italic">{s.currentCourse.name}</p>
                      <div className="flex justify-between items-center text-[8px] font-black uppercase font-mono">
                        <span className={s.dri.driColor}>{s.dri.driSignal}</span>
                        <span className="text-slate-600">KSI: {s.metrics.ksi}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {viewMode === 'MATRIX' && (
          <div className="h-full w-full bg-slate-900/10 border border-slate-800 rounded-[2.5rem] p-8 relative overflow-hidden animate-in fade-in duration-500">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis type="number" dataKey="metrics.lmp" name="Mastery" domain={[0, 1]} stroke="#475569" fontSize={10} />
                <YAxis type="number" dataKey="metrics.ksi" name="Stability" domain={[0, 100]} stroke="#475569" fontSize={10} />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine x={0.7} stroke="#10b981" strokeDasharray="5 5" opacity={0.3} />
                <ReferenceLine y={60} stroke="#ef4444" strokeDasharray="5 5" opacity={0.3} />
                <Scatter data={filtered} onClick={(n) => setSelectedStudent(n.payload)}>
                  {filtered.map((e, i) => (
                    <Cell key={i} fill={e.dri.driTier === 'RED' ? '#ef4444' : e.dri.driTier === 'YELLOW' ? '#f59e0b' : '#10b981'} className="cursor-pointer opacity-60 hover:opacity-100 transition-all duration-300" />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        )}

        {viewMode === 'HEATMAP' && (
           <div className="h-full w-full bg-slate-950 border border-slate-800 rounded-[2.5rem] p-8 overflow-hidden flex flex-col shadow-2xl animate-in fade-in duration-500">
              <div className="flex-1 overflow-auto custom-scrollbar">
                 <table className="w-full border-collapse">
                    <thead>
                       <tr>
                          <th className="sticky top-0 left-0 z-20 bg-slate-950 p-2 text-[8px] font-black text-slate-600 uppercase text-left border-b border-slate-800">Knowledge Component</th>
                          {uniqueCourses.map(course => (
                             <th key={course} className="sticky top-0 z-10 bg-slate-950 p-2 text-[8px] font-black text-slate-500 uppercase border-b border-slate-800 min-w-[80px] font-mono">{course}</th>
                          ))}
                       </tr>
                    </thead>
                    <tbody>
                       {heatmapData.map(row => (
                          <tr key={row.topic} className="hover:bg-slate-900/50 transition-colors">
                             <td className="sticky left-0 z-10 bg-slate-950 p-2 text-[9px] font-bold text-slate-400 border-r border-slate-800 uppercase italic">{row.topic}</td>
                             {row.courseStats.map((cell, idx) => (
                                <td key={idx} className="p-1 border border-slate-900">
                                   <div className="h-8 rounded-md flex items-center justify-center text-[10px] font-mono font-black"
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

        {viewMode === 'LOG' && (
           <div className="h-full bg-slate-950 border border-slate-800 rounded-[2.5rem] p-8 overflow-y-auto custom-scrollbar animate-in fade-in duration-500">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {logs.map(log => (
                    <div key={log.id} className="flex items-center justify-between p-5 bg-slate-900/30 rounded-2xl border border-slate-800/50">
                       <div className="flex items-center gap-5">
                          <div className={`w-3 h-3 rounded-full ${log.type === 'coaching' ? 'bg-indigo-500 shadow-[0_0_10px_#6366f1]' : 'bg-red-500 shadow-[0_0_10px_#ef4444]'}`} />
                          <div>
                             <p className="text-sm font-black text-white uppercase italic">{log.studentName}</p>
                             <p className="text-[10px] text-slate-500 font-mono">{log.type} • {log.targetTopic || 'General'}</p>
                          </div>
                       </div>
                       <div className="text-right text-[9px] font-mono text-slate-700">
                          {log.createdAt?.seconds ? new Date(log.createdAt.seconds * 1000).toLocaleString() : 'Syncing...'}
                       </div>
                    </div>
                 ))}
              </div>
           </div>
        )}
      </div>

      {selectedStudent && <StudentModal student={selectedStudent} onClose={() => setSelectedStudent(null)} />}
    </div>
  );
}
