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
        <p className="text-indigo-400 font-bold mb-1 uppercase text-[9px]">{data.currentCourse?.name}</p>
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
  
  // ESTADOS DE FILTRADO
  const [search, setSearch] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('ALL');
  const [minDebt, setMinDebt] = useState(0);
  const [viewMode, setViewMode] = useState<'COLUMNS' | 'MATRIX' | 'LOG'>('COLUMNS');

  // --- CARGA DE DATOS ---
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

  // --- LÓGICA DE FILTRADO AVANZADO ---
  const uniqueCourses = useMemo(() => {
    return Array.from(new Set(students.map(s => s.currentCourse?.name).filter(Boolean))).sort();
  }, [students]);

  const filtered = useMemo(() => {
    return processedStudents.filter(s => {
      const nameMatch = `${s.firstName} ${s.lastName}`.toLowerCase().includes(search.toLowerCase());
      const courseMatch = selectedCourse === 'ALL' || s.currentCourse?.name === selectedCourse;
      const debtMatch = s.dri.debtExposure >= minDebt;
      return nameMatch && courseMatch && debtMatch;
    });
  }, [processedStudents, search, selectedCourse, minDebt]);

  const redZone = filtered.filter(s => s.dri.driTier === 'RED');
  const yellowZone = filtered.filter(s => s.dri.driTier === 'YELLOW');
  const greenZone = filtered.filter(s => s.dri.driTier === 'GREEN');

  if (loading) return <div className="p-10 bg-black min-h-screen text-emerald-500 font-mono italic animate-pulse">INITIALIZING DRI COCKPIT...</div>;

  return (
    <div className="p-4 bg-[#050505] min-h-screen text-slate-300 font-sans">
      
      {/* HEADER TÁCTICO */}
      <div className="flex flex-col md:flex-row justify-between items-end mb-6 border-b border-slate-800 pb-4 gap-4">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tighter text-white italic">DRI COMMAND v2.6</h1>
          <p className="text-[10px] text-slate-500 tracking-widest uppercase mt-1 font-bold">Protocolo de Triaje de Instrucción Directa</p>
        </div>
        
        <div className="flex items-center gap-4">
           <div className="flex bg-slate-900/50 p-1 rounded-xl border border-slate-800">
              <button onClick={() => setViewMode('COLUMNS')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${viewMode === 'COLUMNS' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}>Triaje</button>
              <button onClick={() => setViewMode('MATRIX')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${viewMode === 'MATRIX' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}>Matriz</button>
              <button onClick={() => setViewMode('LOG')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${viewMode === 'LOG' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}>Logs</button>
           </div>
        </div>
      </div>

      {/* BARRA DE FILTROS AVANZADA */}
      <div className="flex flex-wrap gap-4 mb-6 items-center">
          <div className="flex-1 min-w-[300px]">
              <input 
                onChange={(e) => setSearch(e.target.value)}
                placeholder="🔎 BUSCAR UNIDAD POR NOMBRE..." 
                className="w-full bg-slate-900/40 border border-slate-800 rounded-2xl px-5 py-3 text-xs focus:border-indigo-500 outline-none text-white font-mono placeholder:text-slate-700"
              />
          </div>
          
          <select 
              value={selectedCourse} 
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-[10px] font-black uppercase text-slate-400 outline-none focus:border-indigo-500 transition-all"
          >
              <option value="ALL">TODOS LOS CURSOS</option>
              {uniqueCourses.map(course => (
                  <option key={course} value={course}>{course}</option>
              ))}
          </select>

          <div className="flex items-center gap-4 bg-slate-900/40 border border-slate-800 rounded-xl px-5 py-2">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Min Deuda (DER):</span>
              <input 
                  type="range" min="0" max="100" value={minDebt} 
                  onChange={(e) => setMinDebt(parseInt(e.target.value))}
                  className="w-24 accent-indigo-500 cursor-pointer"
              />
              <span className="text-xs font-mono font-bold text-indigo-400">{minDebt}%</span>
          </div>
      </div>

      {/* ÁREA DE CONTENIDO PRINCIPAL */}
      <div className="h-[calc(100vh-250px)]">
        {viewMode === 'COLUMNS' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
            
            {/* RED ZONE */}
            <div className="flex flex-col bg-red-950/5 border border-red-900/20 rounded-3xl overflow-hidden shadow-2xl shadow-red-950/10">
               <div className="p-5 bg-red-950/20 border-b border-red-900/20 flex justify-between items-center">
                  <h2 className="text-xs font-black text-red-500 uppercase tracking-widest">🚨 Critical Ops</h2>
                  <span className="bg-red-500 text-black text-[10px] font-black px-2 py-0.5 rounded-md">{redZone.length}</span>
               </div>
               <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                  {redZone.map(s => (
                     <div key={s.id} onClick={() => setSelectedStudent(s)} className="bg-slate-900/80 p-4 rounded-2xl border-l-4 border-red-500 cursor-pointer hover:scale-[1.02] transition-all group">
                        <div className="flex justify-between items-start mb-1">
                           <h3 className="font-black text-white text-sm tracking-tight group-hover:text-red-400">{s.firstName} {s.lastName}</h3>
                           <span className="text-[10px] font-mono font-bold text-red-500/50">{s.dri.debtExposure}% DER</span>
                        </div>
                        <p className="text-[9px] text-slate-500 uppercase font-bold mb-2">{s.currentCourse?.name}</p>
                        <div className="text-[9px] uppercase font-black text-red-400 bg-red-900/30 px-2 py-1 rounded inline-block tracking-tighter">
                           {s.dri.driSignal}
                        </div>
                     </div>
                  ))}
               </div>
            </div>

            {/* YELLOW ZONE */}
            <div className="flex flex-col bg-amber-950/5 border border-amber-900/20 rounded-3xl overflow-hidden">
               <div className="p-5 bg-amber-950/20 border-b border-amber-900/20 flex justify-between items-center">
                  <h2 className="text-xs font-black text-amber-500 uppercase tracking-widest">⚠️ Watch List</h2>
               </div>
               <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                  {yellowZone.map(s => (
                     <div key={s.id} onClick={() => setSelectedStudent(s)} className="bg-slate-900/60 p-4 rounded-2xl border-l-4 border-amber-500 cursor-pointer hover:bg-slate-900 transition-all">
                        <div className="flex justify-between items-start mb-1">
                           <h3 className="font-bold text-slate-200 text-sm italic">{s.firstName} {s.lastName}</h3>
                           <span className="text-[10px] font-mono text-amber-500/50">iROI: {s.dri.iROI}</span>
                        </div>
                        <p className="text-[9px] text-slate-600 font-bold uppercase mb-2">{s.currentCourse?.name}</p>
                        <div className="text-[9px] text-amber-400/70 font-black uppercase tracking-tighter">{s.dri.driSignal}</div>
                     </div>
                  ))}
               </div>
            </div>

            {/* GREEN ZONE */}
            <div className="flex flex-col bg-emerald-950/5 border border-emerald-900/20 rounded-3xl overflow-hidden opacity-60">
               <div className="p-5 bg-emerald-950/20 border-b border-emerald-900/20 flex justify-between items-center">
                  <h2 className="text-xs font-black text-emerald-500 uppercase tracking-widest">⚡ Honors Track</h2>
               </div>
               <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                  {greenZone.map(s => (
                     <div key={s.id} onClick={() => setSelectedStudent(s)} className="bg-slate-900/30 p-3 rounded-xl border border-slate-800 cursor-pointer hover:border-emerald-500/50 transition-all flex justify-between items-center group">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-slate-500 group-hover:text-emerald-400">{s.firstName} {s.lastName}</span>
                          <span className="text-[8px] text-slate-700 uppercase">{s.currentCourse?.name}</span>
                        </div>
                        <span className="text-[10px] font-mono text-emerald-500 font-black">{s.metrics?.accuracyRate}%</span>
                     </div>
                  ))}
               </div>
            </div>
          </div>
        )}

        {viewMode === 'MATRIX' && (
          <div className="h-full w-full bg-slate-900/10 border border-slate-800 rounded-[2.5rem] p-8 relative overflow-hidden">
             <div className="absolute top-12 right-12 text-emerald-500/5 font-black text-7xl select-none uppercase italic tracking-tighter">Flow Masters</div>
             <div className="absolute bottom-12 left-12 text-red-500/5 font-black text-7xl select-none uppercase italic tracking-tighter">Academic Debt</div>
             
             <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 0 }}>
                   <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                   <XAxis type="number" dataKey="metrics.velocityScore" name="Velocity" unit="%" domain={[0, 100]} stroke="#475569" fontSize={10} />
                   <YAxis type="number" dataKey="metrics.accuracyRate" name="Accuracy" unit="%" domain={[0, 100]} stroke="#475569" fontSize={10} />
                   <ZAxis type="number" range={[100, 600]} />
                   <Tooltip content={<CustomTooltip />} />
                   <ReferenceLine x={50} stroke="#ef4444" strokeDasharray="5 5" opacity={0.2} />
                   <ReferenceLine y={60} stroke="#ef4444" strokeDasharray="5 5" opacity={0.2} />
                   <Scatter data={filtered} onClick={(n) => setSelectedStudent(n.payload)}>
                      {filtered.map((e, i) => (
                         <Cell key={i} 
                           fill={e.dri.driTier === 'RED' ? '#ef4444' : e.dri.driTier === 'YELLOW' ? '#f59e0b' : '#10b981'} 
                           className="cursor-pointer hover:opacity-100 opacity-50 transition-all duration-300" 
                         />
                      ))}
                   </Scatter>
                </ScatterChart>
             </ResponsiveContainer>
          </div>
        )}

        {viewMode === 'LOG' && (
           <div className="h-full bg-slate-950 border border-slate-800 rounded-[2.5rem] p-8 overflow-y-auto custom-scrollbar">
              <h2 className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-8 flex items-center gap-3">
                 <span className="w-2 h-2 bg-indigo-500 animate-pulse rounded-full" />
                 Historial de Intervenciones en Campo
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {logs.map(log => (
                    <div key={log.id} className="flex items-center justify-between p-5 bg-slate-900/30 rounded-2xl border border-slate-800/50 hover:border-indigo-500/30 transition-all">
                       <div className="flex items-center gap-5">
                          <div className={`w-3 h-3 rounded-full ${log.type === 'coaching' ? 'bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]' : 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]'}`} />
                          <div>
                             <p className="text-sm font-black text-white uppercase italic tracking-tight">{log.studentName}</p>
                             <p className="text-[10px] text-slate-500 font-mono font-bold">{log.type} • {log.targetTopic || 'Estrategia General'}</p>
                          </div>
                       </div>
                       <div className="text-right">
                          <span className="text-[9px] font-mono text-slate-700 block uppercase">{new Date(log.createdAt?.seconds * 1000).toLocaleDateString()}</span>
                          <span className="text-[9px] font-mono text-slate-500 uppercase">{new Date(log.createdAt?.seconds * 1000).toLocaleTimeString()}</span>
                       </div>
                    </div>
                 ))}
                 {logs.length === 0 && <div className="col-span-2 text-center py-20 text-slate-800 font-black uppercase italic tracking-widest">Sin registros activos</div>}
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
