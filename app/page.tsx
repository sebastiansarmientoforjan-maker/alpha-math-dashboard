'use client';

import { useState, useEffect, useMemo } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { 
  ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell
} from 'recharts';
import StudentModal from '@/components/StudentModal';
import { calculateDRIMetrics } from '@/lib/dri-calculus';
import { Student } from '@/types';

// Tooltip táctico para la Matriz
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-900 border border-slate-700 p-3 rounded-lg shadow-2xl text-xs">
        <p className="font-bold text-white mb-1">{data.firstName} {data.lastName}</p>
        <p className="text-emerald-400">Velocity: {data.metrics?.velocityScore}%</p>
        <p className="text-blue-400">Accuracy: {data.metrics?.accuracyRate}%</p>
        <p className={`mt-1 font-mono uppercase font-bold ${
            data.dri.driTier === 'RED' ? 'text-red-500' : 
            data.dri.driTier === 'YELLOW' ? 'text-amber-500' : 'text-emerald-500'
        }`}>
            {data.dri.driSignal}
        </p>
      </div>
    );
  }
  return null;
};

export default function PanelPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'COLUMNS' | 'MATRIX' | 'LOG'>('COLUMNS');

  // --- ESCUCHA DE DATOS (ESTUDIANTES E INTERVENCIONES) ---
  useEffect(() => {
    const qStudents = query(collection(db, 'students'));
    const unsubStudents = onSnapshot(qStudents, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Student[];
      setStudents(data);
      setLoading(false);
    });

    const qLogs = query(collection(db, 'interventions'), orderBy('createdAt', 'desc'), limit(20));
    const unsubLogs = onSnapshot(qLogs, (snapshot) => {
      setLogs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => { unsubStudents(); unsubLogs(); };
  }, []);

  // --- PROCESAMIENTO DRI TIER 5 ---
  const processedStudents = useMemo(() => {
    return students.map(s => ({
       ...s,
       dri: calculateDRIMetrics(s)
    }));
  }, [students]);

  // --- FILTRADO Y TRIAJE ---
  const filtered = processedStudents.filter(s => 
     `${s.firstName} ${s.lastName}`.toLowerCase().includes(search.toLowerCase())
  );

  const redZone = filtered.filter(s => s.dri.driTier === 'RED');
  const yellowZone = filtered.filter(s => s.dri.driTier === 'YELLOW');
  const greenZone = filtered.filter(s => s.dri.driTier === 'GREEN');

  if (loading) return <div className="p-10 bg-black min-h-screen text-emerald-500 font-mono italic animate-pulse">INITIALIZING DRI COCKPIT...</div>;

  return (
    <div className="p-4 bg-[#050505] min-h-screen text-slate-300 font-sans">
      
      {/* HEADER: SISTEMA DE SIGNOS VITALES */}
      <div className="flex flex-col md:flex-row justify-between items-end mb-6 border-b border-slate-800 pb-4 gap-4">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tighter text-white italic">DRI COMMAND v2.5</h1>
          <p className="text-[10px] text-slate-500 tracking-widest uppercase mt-1 font-bold">Direct Instruction Triage Protocol</p>
        </div>
        
        <div className="flex items-center gap-4">
           {/* SWITCH DE VISTA (PASO 4) */}
           <div className="flex bg-slate-900/50 p-1 rounded-xl border border-slate-800">
              <button onClick={() => setViewMode('COLUMNS')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${viewMode === 'COLUMNS' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>Triaje</button>
              <button onClick={() => setViewMode('MATRIX')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${viewMode === 'MATRIX' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>Matriz</button>
              <button onClick={() => setViewMode('LOG')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${viewMode === 'LOG' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>Logs</button>
           </div>

           <div className="flex gap-4 border-l border-slate-800 pl-4">
              <div className="text-right">
                <div className="text-[9px] text-red-600 uppercase font-black">Red Zone</div>
                <div className="text-xl font-mono font-bold text-red-500">{redZone.length}</div>
              </div>
              <div className="text-right">
                <div className="text-[9px] text-emerald-600 uppercase font-black">Total Active</div>
                <div className="text-xl font-mono font-bold text-white">{students.length}</div>
              </div>
           </div>
        </div>
      </div>

      {/* FILTRO GLOBAL */}
      <div className="mb-6">
        <input 
          onChange={(e) => setSearch(e.target.value)}
          placeholder="🔎 SEARCH UNIT BY ID OR NAME..." 
          className="w-full bg-slate-900/40 border border-slate-800 rounded-2xl px-5 py-4 text-sm focus:border-indigo-500 outline-none transition-all text-white font-mono placeholder:text-slate-700"
        />
      </div>

      {/* CONTENT AREA: REVELACIÓN PROGRESIVA */}
      <div className="h-[calc(100vh-230px)]">
        {viewMode === 'COLUMNS' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
            {/* COLUMNA ROJA: ACCIÓN INMEDIATA (PASO 3) */}
            <div className="flex flex-col bg-red-950/5 border border-red-900/20 rounded-3xl overflow-hidden shadow-2xl shadow-red-900/10">
               <div className="p-5 bg-red-950/20 border-b border-red-900/20 flex justify-between items-center">
                  <h2 className="text-xs font-black text-red-500 uppercase tracking-widest">🚨 Critical Ops</h2>
                  <span className="bg-red-500 text-black text-[10px] font-black px-2 py-0.5 rounded-md">{redZone.length}</span>
               </div>
               <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                  {redZone.map(s => (
                     <div key={s.id} onClick={() => setSelectedStudent(s)} className="bg-slate-900/80 p-4 rounded-2xl border-l-4 border-red-500 cursor-pointer hover:scale-[1.02] transition-all group">
                        <div className="flex justify-between items-start mb-2">
                           <h3 className="font-black text-white text-sm tracking-tight group-hover:text-red-400">{s.firstName} {s.lastName}</h3>
                           <span className="text-[10px] font-mono font-bold text-slate-500">{s.metrics?.velocityScore}% VEL</span>
                        </div>
                        <div className="text-[10px] uppercase font-black text-red-400 bg-red-900/30 px-2 py-1 rounded inline-block">
                           {s.dri.driSignal}
                        </div>
                     </div>
                  ))}
               </div>
            </div>

            {/* COLUMNA AMARILLA: VIGILANCIA */}
            <div className="flex flex-col bg-amber-950/5 border border-amber-900/20 rounded-3xl overflow-hidden">
               <div className="p-5 bg-amber-950/20 border-b border-amber-900/20 flex justify-between items-center">
                  <h2 className="text-xs font-black text-amber-500 uppercase tracking-widest">⚠️ Watch List</h2>
               </div>
               <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                  {yellowZone.map(s => (
                     <div key={s.id} onClick={() => setSelectedStudent(s)} className="bg-slate-900/60 p-4 rounded-2xl border-l-4 border-amber-500 cursor-pointer hover:bg-slate-900 transition-all group">
                        <div className="flex justify-between items-start mb-2">
                           <h3 className="font-bold text-slate-300 text-sm italic">{s.firstName} {s.lastName}</h3>
                           <span className="text-[10px] font-mono text-amber-500/50">iROI: {s.dri.iROI}</span>
                        </div>
                        <div className="text-[9px] text-amber-400/70 font-bold uppercase">{s.dri.driSignal}</div>
                     </div>
                  ))}
               </div>
            </div>

            {/* COLUMNA VERDE: HONORS */}
            <div className="flex flex-col bg-emerald-950/5 border border-emerald-900/20 rounded-3xl overflow-hidden opacity-60">
               <div className="p-5 bg-emerald-950/20 border-b border-emerald-900/20">
                  <h2 className="text-xs font-black text-emerald-500 uppercase tracking-widest">⚡ Honors Track</h2>
               </div>
               <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                  {greenZone.map(s => (
                     <div key={s.id} onClick={() => setSelectedStudent(s)} className="bg-slate-900/30 p-3 rounded-xl border border-slate-800 cursor-pointer hover:border-emerald-500/50 transition-all flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-500">{s.firstName} {s.lastName}</span>
                        <span className="text-[10px] font-mono text-emerald-500">{s.metrics?.accuracyRate}%</span>
                     </div>
                  ))}
               </div>
            </div>
          </div>
        )}

        {viewMode === 'MATRIX' && (
          <div className="h-full w-full bg-slate-900/10 border border-slate-800 rounded-3xl p-6 relative">
             <div className="absolute top-8 right-8 text-emerald-500/10 font-black text-6xl select-none uppercase italic">Flow Masters</div>
             <div className="absolute bottom-8 left-8 text-red-500/10 font-black text-6xl select-none uppercase italic">Critical Debt</div>
             
             <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 0 }}>
                   <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                   <XAxis type="number" dataKey="metrics.velocityScore" name="Velocity" unit="%" domain={[0, 100]} stroke="#475569" fontSize={10} />
                   <YAxis type="number" dataKey="metrics.accuracyRate" name="Accuracy" unit="%" domain={[0, 100]} stroke="#475569" fontSize={10} />
                   <ZAxis type="number" range={[100, 500]} />
                   <Tooltip content={<CustomTooltip />} />
                   <ReferenceLine x={50} stroke="#ef4444" strokeDasharray="5 5" opacity={0.3} />
                   <ReferenceLine y={60} stroke="#ef4444" strokeDasharray="5 5" opacity={0.3} />
                   <Scatter data={filtered} onClick={(n) => setSelectedStudent(n.payload)}>
                      {filtered.map((e, i) => (
                         <Cell key={i} fill={e.dri.driTier === 'RED' ? '#ef4444' : e.dri.driTier === 'YELLOW' ? '#f59e0b' : '#10b981'} className="cursor-pointer hover:opacity-100 opacity-60 transition-all" />
                      ))}
                   </Scatter>
                </ScatterChart>
             </ResponsiveContainer>
          </div>
        )}

        {viewMode === 'LOG' && (
           <div className="h-full bg-slate-950 border border-slate-800 rounded-3xl p-6 overflow-y-auto custom-scrollbar">
              <h2 className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-6">📡 RECENT FIELD INTERVENTIONS</h2>
              <div className="space-y-3">
                 {logs.map(log => (
                    <div key={log.id} className="flex items-center justify-between p-4 bg-slate-900/50 rounded-2xl border border-slate-800/50">
                       <div className="flex items-center gap-4">
                          <div className={`w-2 h-2 rounded-full ${log.type === 'coaching' ? 'bg-indigo-500' : 'bg-red-500'}`} />
                          <div>
                             <p className="text-sm font-bold text-white uppercase italic">{log.studentName}</p>
                             <p className="text-[10px] text-slate-500 font-mono">{log.type} • {log.targetTopic || 'General Performance'}</p>
                          </div>
                       </div>
                       <span className="text-[9px] font-mono text-slate-700 uppercase">{new Date(log.createdAt?.seconds * 1000).toLocaleTimeString()}</span>
                    </div>
                 ))}
              </div>
           </div>
        )}
      </div>

      {selectedStudent && (
        <StudentModal student={selectedStudent} onClose={() => setSelectedStudent(null)} />
      )}
    </div>
  );
}
