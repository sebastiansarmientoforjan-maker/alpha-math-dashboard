'use client';

import { useState, useEffect, useMemo } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { 
  ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell
} from 'recharts';
import StudentModal from '@/components/StudentModal';
import { calculateDRIMetrics } from '@/lib/dri-calculus';
import { Student } from '@/types';

// Componente para el Tooltip personalizado del gráfico
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-900 border border-slate-700 p-3 rounded-lg shadow-xl text-xs">
        <p className="font-bold text-white mb-1">{data.firstName} {data.lastName}</p>
        <p className="text-emerald-400">Vel: {data.metrics?.velocityScore}%</p>
        <p className="text-blue-400">Acc: {data.metrics?.accuracyRate}%</p>
        <p className={`mt-1 font-mono uppercase ${
            data.dri.driTier === 'RED' ? 'text-red-500' : 
            data.dri.driTier === 'YELLOW' ? 'text-amber-500' : 'text-slate-500'
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
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'COLUMNS' | 'MATRIX'>('COLUMNS'); // <--- NUEVO ESTADO

  // --- DATA LOADING ---
  useEffect(() => {
    const q = query(collection(db, 'students'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Student[];
      setStudents(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // --- PROCESAMIENTO DRI EN TIEMPO REAL ---
  const processedStudents = useMemo(() => {
    return students.map(s => {
       const dri = calculateDRIMetrics(s);
       return { ...s, dri };
    });
  }, [students]);

  // --- FILTRADO ---
  const filtered = processedStudents.filter(s => {
     const name = `${s.firstName} ${s.lastName}`.toLowerCase();
     return name.includes(search.toLowerCase());
  });

  const redZone = filtered.filter(s => s.dri.driTier === 'RED');
  const yellowZone = filtered.filter(s => s.dri.driTier === 'YELLOW');
  const greenZone = filtered.filter(s => s.dri.driTier === 'GREEN');

  if (loading) return <div className="p-10 bg-black min-h-screen text-emerald-500 font-mono italic animate-pulse">BOOTING DRI ENGINE...</div>;

  return (
    <div className="p-4 bg-[#050505] min-h-screen text-slate-300 font-sans">
      
      {/* HEADER TÁCTICO */}
      <div className="flex flex-col md:flex-row justify-between items-end mb-6 border-b border-slate-800 pb-4 gap-4">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tighter text-white italic">DRI COMMAND v2.2</h1>
          <p className="text-[10px] text-slate-500 tracking-widest uppercase mt-1">Direct Instruction Triage Protocol</p>
        </div>
        
        <div className="flex items-center gap-6">
           {/* VIEW TOGGLE */}
           <div className="flex bg-slate-900/50 p-1 rounded-lg border border-slate-800">
              <button 
                onClick={() => setViewMode('COLUMNS')}
                className={`px-4 py-1.5 rounded text-xs font-bold uppercase transition-all ${viewMode === 'COLUMNS' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
              >
                📋 Triage Lists
              </button>
              <button 
                onClick={() => setViewMode('MATRIX')}
                className={`px-4 py-1.5 rounded text-xs font-bold uppercase transition-all ${viewMode === 'MATRIX' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
              >
                💠 Matrix Map
              </button>
           </div>

           {/* STATS */}
           <div className="text-right border-l border-slate-800 pl-6">
              <div className="text-[9px] text-slate-600 uppercase font-bold">Critical Load</div>
              <div className="text-xl font-mono font-bold text-red-500">{redZone.length} <span className="text-xs text-red-900/50">Units</span></div>
           </div>
        </div>
      </div>

      {/* SEARCH BAR */}
      <div className="mb-6">
        <input 
          onChange={(e) => setSearch(e.target.value)}
          placeholder="🔎 Filter units by ID or Name..." 
          className="w-full bg-slate-900/50 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 outline-none transition-colors text-white font-mono"
        />
      </div>

      {/* --- CONTENT AREA --- */}
      
      {viewMode === 'MATRIX' ? (
        // --- VISTA 1: MATRIX MAP (SCATTER PLOT) ---
        <div className="h-[calc(100vh-250px)] w-full bg-slate-900/20 border border-slate-800 rounded-2xl p-4 relative overflow-hidden">
            {/* Etiquetas de Cuadrantes */}
            <div className="absolute top-4 right-4 text-emerald-500/20 font-black text-4xl select-none pointer-events-none">FLOW</div>
            <div className="absolute bottom-4 right-4 text-amber-500/20 font-black text-4xl select-none pointer-events-none">RUSH</div>
            <div className="absolute bottom-4 left-4 text-red-500/20 font-black text-4xl select-none pointer-events-none">STUCK</div>
            <div className="absolute top-4 left-4 text-blue-500/20 font-black text-4xl select-none pointer-events-none">SAFE</div>

            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis 
                  type="number" 
                  dataKey="metrics.velocityScore" 
                  name="Velocity" 
                  unit="%" 
                  domain={[0, 120]} 
                  stroke="#64748b" 
                  label={{ value: 'Velocity (Speed)', position: 'insideBottom', offset: -10, fill: '#64748b', fontSize: 10 }}
                />
                <YAxis 
                  type="number" 
                  dataKey="metrics.accuracyRate" 
                  name="Accuracy" 
                  unit="%" 
                  domain={[0, 100]} 
                  stroke="#64748b"
                  label={{ value: 'Accuracy (Quality)', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 10 }}
                />
                <ZAxis type="number" range={[50, 400]} /> {/* Tamaño de burbuja */}
                <Tooltip cursor={{ strokeDasharray: '3 3' }} content={<CustomTooltip />} />
                
                {/* Líneas de Referencia (Cruces) */}
                <ReferenceLine x={50} stroke="#475569" strokeDasharray="5 5" />
                <ReferenceLine y={60} stroke="#475569" strokeDasharray="5 5" />

                <Scatter name="Students" data={filtered} onClick={(node) => setSelectedStudent(node.payload)}>
                  {filtered.map((entry, index) => {
                    // Colores por DRI Tier
                    let fill = '#94a3b8'; // Default Slate
                    if (entry.dri.driTier === 'RED') fill = '#ef4444';
                    else if (entry.dri.driTier === 'YELLOW') fill = '#f59e0b';
                    else if (entry.dri.driTier === 'GREEN') fill = '#10b981';
                    
                    return <Cell key={`cell-${index}`} fill={fill} fillOpacity={0.6} stroke={fill} cursor="pointer" />;
                  })}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
        </div>
      ) : (
        // --- VISTA 2: TRIAGE COLUMNS (LISTS) ---
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-250px)]">
          
          {/* COLUMNA 1: RED ZONE */}
          <div className="flex flex-col bg-red-950/5 border border-red-900/20 rounded-2xl overflow-hidden">
             <div className="p-4 bg-red-950/20 border-b border-red-900/20 flex justify-between items-center">
                <h2 className="text-xs font-black text-red-500 uppercase tracking-widest flex items-center gap-2">
                   🔴 Critical Ops
                </h2>
                <span className="bg-red-500 text-black text-[10px] font-bold px-2 py-0.5 rounded-full">{redZone.length}</span>
             </div>
             <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
                {redZone.map(s => (
                   <div key={s.id} onClick={() => setSelectedStudent(s)} className="bg-slate-900/80 p-3 rounded-xl border-l-4 border-red-500 cursor-pointer hover:bg-slate-800 transition-all group relative overflow-hidden">
                      <div className="flex justify-between items-start mb-1">
                         <h3 className="font-bold text-white text-sm group-hover:text-red-400">{s.firstName} {s.lastName}</h3>
                         <span className="text-[10px] font-mono text-slate-500">{s.metrics?.velocityScore}% Vel</span>
                      </div>
                      <div className="flex justify-between items-center">
                         <span className="text-[10px] uppercase font-bold text-red-400 bg-red-900/20 px-2 py-0.5 rounded">
                           {s.dri.driSignal}
                         </span>
                         {s.metrics?.nemesisTopic && <span className="text-[10px] text-slate-500 italic truncate max-w-[100px]">"{s.metrics.nemesisTopic}"</span>}
                      </div>
                   </div>
                ))}
                {redZone.length === 0 && <div className="text-center text-slate-600 text-xs py-10">System Clean. No critical alerts.</div>}
             </div>
          </div>

          {/* COLUMNA 2: YELLOW ZONE */}
          <div className="flex flex-col bg-amber-950/5 border border-amber-900/20 rounded-2xl overflow-hidden">
             <div className="p-4 bg-amber-950/20 border-b border-amber-900/20 flex justify-between items-center">
                <h2 className="text-xs font-black text-amber-500 uppercase tracking-widest flex items-center gap-2">
                   ⚠️ Watch List
                </h2>
                <span className="bg-amber-500 text-black text-[10px] font-bold px-2 py-0.5 rounded-full">{yellowZone.length}</span>
             </div>
             <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
                {yellowZone.map(s => (
                   <div key={s.id} onClick={() => setSelectedStudent(s)} className="bg-slate-900/80 p-3 rounded-xl border-l-4 border-amber-500 cursor-pointer hover:bg-slate-800 transition-all group">
                      <div className="flex justify-between items-start mb-1">
                         <h3 className="font-bold text-slate-200 text-sm">{s.firstName} {s.lastName}</h3>
                         <span className="text-[10px] font-mono text-amber-500/50">ROI: {s.dri.iROI}</span>
                      </div>
                      <div className="text-[10px] text-amber-400 font-mono flex justify-between">
                         <span>{s.dri.driSignal}</span>
                         {s.dri.precisionDecay > 1.2 && <span>Fatigue: {s.dri.precisionDecay}x</span>}
                      </div>
                   </div>
                ))}
             </div>
          </div>

          {/* COLUMNA 3: GREEN ZONE */}
          <div className="flex flex-col bg-emerald-950/5 border border-emerald-900/20 rounded-2xl overflow-hidden">
             <div className="p-4 bg-emerald-950/20 border-b border-emerald-900/20 flex justify-between items-center">
                <h2 className="text-xs font-black text-emerald-500 uppercase tracking-widest flex items-center gap-2">
                   ⚡ Honors Track
                </h2>
                <span className="bg-emerald-500 text-black text-[10px] font-bold px-2 py-0.5 rounded-full">{greenZone.length}</span>
             </div>
             <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
                {greenZone.map(s => (
                   <div key={s.id} onClick={() => setSelectedStudent(s)} className="bg-slate-900/50 p-2 rounded-lg border border-slate-800 cursor-pointer hover:border-emerald-500/50 transition-all flex justify-between items-center opacity-70 hover:opacity-100">
                      <div>
                         <div className="font-bold text-slate-300 text-xs">{s.firstName} {s.lastName}</div>
                         <div className="text-[9px] text-emerald-600 uppercase font-bold tracking-wider">Flowing</div>
                      </div>
                      <div className="text-right">
                         <div className="text-[10px] font-mono text-emerald-400">{s.metrics?.velocityScore}%</div>
                         <div className="text-[8px] text-slate-600">Vel</div>
                      </div>
                   </div>
                ))}
             </div>
          </div>

        </div>
      )}

      {/* MODAL LAYER */}
      {selectedStudent && (
        <StudentModal 
          student={selectedStudent} 
          onClose={() => setSelectedStudent(null)} 
        />
      )}

    </div>
  );
}
