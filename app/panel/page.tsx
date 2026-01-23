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

// Tooltip para la Matriz KeenKT
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-900 border border-slate-700 p-3 rounded-lg shadow-2xl text-xs">
        <p className="font-bold text-white mb-1">{data.firstName} {data.lastName}</p>
        <p className="text-indigo-400 font-bold mb-1 uppercase text-[9px]">{data.currentCourse?.name}</p>
        <p className="text-emerald-400">Mastery (LMP): {(data.metrics?.lmp * 100).toFixed(0)}%</p>
        <p className="text-blue-400">Stability (KSI): {data.metrics?.ksi}%</p>
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
  
  // Estados de Navegación y Filtro
  const [viewMode, setViewMode] = useState<'TRIAGE' | 'MATRIX' | 'RADAR' | 'LOG'>('TRIAGE');
  const [search, setSearch] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('ALL');

  useEffect(() => {
    // Escucha de Estudiantes con cálculo de métricas KeenKT y DRI
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

    // Escucha de Intervenciones Recientes
    const unsubLogs = onSnapshot(query(collection(db, 'interventions'), orderBy('createdAt', 'desc'), limit(20)), (snapshot) => {
      setLogs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => { unsubStudents(); unsubLogs(); };
  }, []);

  // Filtros dinámicos
  const uniqueCourses = useMemo(() => Array.from(new Set(students.map(s => s.currentCourse?.name).filter(Boolean))).sort(), [students]);

  const filtered = useMemo(() => {
    return students.filter(s => {
      const nameMatch = `${s.firstName} ${s.lastName}`.toLowerCase().includes(search.toLowerCase());
      const courseMatch = selectedCourse === 'ALL' || s.currentCourse?.name === selectedCourse;
      return nameMatch && courseMatch;
    });
  }, [students, search, selectedCourse]);

  if (loading) return <div className="p-10 bg-black min-h-screen text-emerald-500 font-mono italic animate-pulse">DRI COMMAND CENTER INITIALIZING...</div>;

  return (
    <div className="p-4 bg-[#050505] min-h-screen text-slate-300 font-sans">
      
      {/* HEADER DINÁMICO */}
      <div className="flex flex-col md:flex-row justify-between items-end mb-8 border-b border-slate-800 pb-6 gap-4">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tighter text-white italic">DRI COMMAND v3.0</h1>
          <p className="text-[10px] text-indigo-400 font-bold tracking-[0.3em] uppercase">Intelligence Mode: KeenKT + DRI</p>
        </div>
        
        <div className="flex bg-slate-900/50 p-1 rounded-xl border border-slate-800">
          {['TRIAGE', 'MATRIX', 'RADAR', 'LOG'].map(m => (
            <button 
              key={m} 
              onClick={() => setViewMode(m as any)} 
              className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${viewMode === m ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500'}`}
            >
              {m === 'TRIAGE' ? 'Triaje' : m === 'MATRIX' ? 'Matriz' : m === 'RADAR' ? 'Radar' : 'Logs'}
            </button>
          ))}
        </div>
      </div>

      {/* CONTROLES DE FILTRADO */}
      <div className="flex flex-wrap gap-4 mb-8">
        <input 
          onChange={(e) => setSearch(e.target.value)}
          placeholder="🔎 BUSCAR ESTUDIANTE..." 
          className="flex-1 min-w-[300px] bg-slate-900/40 border border-slate-800 rounded-2xl px-6 py-4 text-sm focus:border-indigo-500 outline-none font-mono"
        />
        <select 
          value={selectedCourse} 
          onChange={(e) => setSelectedCourse(e.target.value)}
          className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-[10px] font-black uppercase text-slate-400"
        >
          <option value="ALL">TODOS LOS CURSOS</option>
          {uniqueCourses.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div className="h-[calc(100vh-280px)]">
        {/* VISTA 1: COLUMNAS DE TRIAJE (Tier 5 DRI) */}
        {viewMode === 'TRIAGE' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
            {['RED', 'YELLOW', 'GREEN'].map(tier => (
              <div key={tier} className="flex flex-col bg-slate-900/20 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
                <div className={`p-4 bg-slate-900/40 border-b border-slate-800 font-black text-[10px] uppercase tracking-widest ${tier === 'RED' ? 'text-red-500' : tier === 'YELLOW' ? 'text-amber-500' : 'text-emerald-500'}`}>
                  {tier} ZONE - {filtered.filter(s => s.dri.driTier === tier).length} UNITS
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                  {filtered.filter(s => s.dri.driTier === tier).map(s => (
                    <div key={s.id} onClick={() => setSelectedStudent(s)} className="p-4 bg-slate-900/80 rounded-2xl border-l-4 border-current cursor-pointer hover:scale-[1.02] transition-all">
                      <div className="flex justify-between items-start mb-1">
                        <h3 className="font-black text-white text-sm italic uppercase">{s.firstName} {s.lastName}</h3>
                        <span className="text-[10px] font-mono font-bold text-slate-500">{(s.metrics.lmp * 100).toFixed(0)}% LMP</span>
                      </div>
                      <p className="text-[9px] text-slate-600 font-bold uppercase mb-3">{s.currentCourse?.name}</p>
                      <div className="flex justify-between items-center text-[10px] font-mono">
                        <span className={`px-2 py-0.5 rounded font-black ${s.dri.driTier === 'RED' ? 'bg-red-500/10 text-red-400' : 'bg-slate-800 text-slate-400'}`}>
                          {s.dri.driSignal}
                        </span>
                        <span className="text-indigo-400">KSI: {s.metrics.ksi}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* VISTA 2: MATRIZ KEENKT (Rigor vs Estabilidad) */}
        {viewMode === 'MATRIX' && (
          <div className="h-full w-full bg-slate-900/10 border border-slate-800 rounded-[2.5rem] p-8 relative overflow-hidden">
            <div className="absolute top-12 right-12 text-emerald-500/5 font-black text-7xl select-none uppercase italic tracking-tighter">Flow Masters</div>
            <div className="absolute bottom-12 left-12 text-red-500/5 font-black text-7xl select-none uppercase italic tracking-tighter">Inestabilidad NIG</div>
            
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis type="number" dataKey="metrics.lmp" name="Mastery (LMP)" domain={[0, 1]} stroke="#475569" fontSize={10} />
                <YAxis type="number" dataKey="metrics.ksi" name="Stability (KSI)" domain={[0, 100]} stroke="#475569" fontSize={10} />
                <ZAxis type="number" range={[100, 600]} />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine x={0.7} stroke="#10b981" strokeDasharray="5 5" opacity={0.3} />
                <ReferenceLine y={60} stroke="#ef4444" strokeDasharray="5 5" opacity={0.3} />
                <Scatter data={filtered} onClick={(n) => setSelectedStudent(n.payload)}>
                  {filtered.map((e, i) => (
                    <Cell 
                      key={i} 
                      fill={e.dri.driTier === 'RED' ? '#ef4444' : e.dri.driTier === 'YELLOW' ? '#f59e0b' : '#10b981'} 
                      className="cursor-pointer opacity-60 hover:opacity-100 transition-all duration-300" 
                    />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* VISTA 3: INTERVENTION RADAR (Work Stalls) */}
        {viewMode === 'RADAR' && (
          <div className="h-full bg-slate-900/20 border border-slate-800 rounded-[2.5rem] p-8 flex flex-col items-center justify-center relative overflow-hidden">
             <div className="text-indigo-400 font-black text-2xl uppercase italic mb-4 animate-pulse">Radar de Orquestación Activo</div>
             <p className="text-slate-500 text-xs text-center max-w-md leading-relaxed">
               Detectando automáticamente estados de <b>Frustrated Stall</b> y <b>Productive Struggle</b> basándose en la latencia de ayuda e incertidumbre Nigel.
             </p>
             {/* Burbujas decorativas animadas que simulan el radar */}
             <div className="absolute inset-0 pointer-events-none opacity-10">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 border border-indigo-500 rounded-full animate-ping" />
             </div>
          </div>
        )}

        {/* VISTA 4: INTERVENTION LOGS */}
        {viewMode === 'LOG' && (
           <div className="h-full bg-slate-950 border border-slate-800 rounded-[2.5rem] p-8 overflow-y-auto custom-scrollbar">
              <h2 className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-8 flex items-center gap-3">
                 <span className="w-2 h-2 bg-indigo-500 animate-pulse rounded-full" />
                 Historial de Intervenciones DRI
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {logs.map(log => (
                    <div key={log.id} className="flex items-center justify-between p-5 bg-slate-900/30 rounded-2xl border border-slate-800/50">
                       <div className="flex items-center gap-5">
                          <div className={`w-3 h-3 rounded-full ${log.type === 'coaching' ? 'bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]' : 'bg-red-500'}`} />
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
                 {logs.length === 0 && <div className="col-span-2 text-center py-20 text-slate-800 uppercase italic tracking-widest">Sin registros activos</div>}
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
