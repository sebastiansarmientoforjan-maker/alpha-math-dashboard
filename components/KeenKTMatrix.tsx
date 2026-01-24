'use client';

import React, { useMemo, useState } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { driColorToHex } from '@/lib/color-utils';
import { Student } from '@/types';

interface MatrixProps {
  students: Student[];
  onStudentClick: (student: Student) => void;
}

export default function KeenKTMatrix({ students, onStudentClick }: MatrixProps) {
  const [filterTier, setFilterTier] = useState<'RED' | 'YELLOW' | 'GREEN' | null>(null);

  // Procesamiento de datos con Memoización para Performance (1,613 puntos)
  const data = useMemo(() => {
    return students
      .filter(s => !filterTier || s.dri.driTier === filterTier)
      .map(s => ({
        x: s.metrics.lmp * 100, // Mastery (Eje X)
        y: s.metrics.ksi,       // Stability (Eje Y)
        z: s.dri.riskScore || 50,
        name: `${s.firstName} ${s.lastName}`,
        tier: s.dri.driTier,
        color: driColorToHex(s.dri.driColor),
        course: s.currentCourse?.name,
        raw: s
      }));
  }, [students, filterTier]);

  // Componente de Punto Optimizado
  const CustomDot = (props: any) => {
    const { cx, cy, payload } = props;
    const isCritical = payload.tier === 'RED';
    
    return (
      <g>
        {isCritical && (
          <circle cx={cx} cy={cy} r={8} fill={payload.color} fillOpacity={0.2}>
            <animate attributeName="r" values="6;12;6" dur="2s" repeatCount="indefinite" />
          </circle>
        )}
        <circle 
          cx={cx} cy={cy} r={isCritical ? 5 : 3.5} 
          fill={payload.color} 
          fillOpacity={isCritical ? 1 : 0.6}
          className="cursor-pointer hover:stroke-white stroke-1 transition-all"
          onClick={() => onStudentClick(payload.raw)}
        />
      </g>
    );
  };

  return (
    <div className="h-full w-full flex flex-col bg-slate-900/10 border border-slate-800 rounded-[2.5rem] p-6 backdrop-blur-sm">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-black italic text-white uppercase tracking-tighter">KeenKT Strategy Matrix</h2>
          <p className="text-[10px] text-slate-500 font-bold tracking-widest uppercase">
            Visualizing {data.length} Units • Architecture RLM
          </p>
        </div>
        
        {/* Filtros de Navegación */}
        <div className="flex gap-2 bg-black/40 p-1 rounded-full border border-slate-800">
          {(['RED', 'YELLOW', 'GREEN'] as const).map(t => (
            <button 
              key={t}
              onClick={() => setFilterTier(filterTier === t ? null : t)}
              className={`px-4 py-1 rounded-full text-[9px] font-black transition-all ${
                filterTier === t 
                  ? 'bg-white text-black' 
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 min-h-[450px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} opacity={0.5} />
            <XAxis 
              type="number" dataKey="x" name="Mastery" unit="%" 
              domain={[0, 100]} stroke="#475569" fontSize={10} tick={{fill: '#475569'}}
              label={{ value: 'MASTERY (RSR %)', position: 'insideBottomRight', offset: -10, fill: '#64748b', fontSize: 9, fontWeight: 'bold' }}
            />
            <YAxis 
              type="number" dataKey="y" name="Stability" unit="%" 
              domain={[0, 100]} stroke="#475569" fontSize={10} tick={{fill: '#475569'}}
              label={{ value: 'STABILITY (KSI %)', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 9, fontWeight: 'bold' }}
            />
            <ZAxis type="number" dataKey="z" range={[50, 400]} />
            
            <Tooltip 
              cursor={{ strokeDasharray: '3 3', stroke: '#334155' }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const s = payload[0].payload.raw;
                return (
                  <div className="bg-slate-950 border border-slate-700 p-3 rounded-xl shadow-2xl">
                    <p className="text-white font-black uppercase text-[11px] mb-1">{payload[0].payload.name}</p>
                    <p className="text-indigo-400 text-[9px] mb-2 font-bold uppercase">{payload[0].payload.course}</p>
                    <div className="space-y-1 border-t border-slate-800 pt-2">
                       <div className="flex justify-between gap-4 text-[9px]">
                          <span className="text-slate-500 font-bold uppercase">Risk Score</span>
                          <span className="text-red-400 font-black">{s.dri.riskScore}</span>
                       </div>
                       <div className="flex justify-between gap-4 text-[9px]">
                          <span className="text-slate-500 font-bold uppercase">PDI</span>
                          <span className="text-white font-black">{s.dri.precisionDecay}x</span>
                       </div>
                    </div>
                  </div>
                );
              }}
            />
            <Scatter data={data} shape={<CustomDot />} isAnimationActive={false} />
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      {/* Leyenda de Cuadrantes */}
      <div className="mt-4 grid grid-cols-2 gap-4 border-t border-slate-800 pt-4">
          <div className="text-[8px] text-slate-600 uppercase font-bold tracking-tighter">
            Top-Right: <span className="text-emerald-500">Mastery Flow (Optimal)</span>
          </div>
          <div className="text-[8px] text-slate-600 uppercase font-bold tracking-tighter">
            Bottom-Left: <span className="text-red-500">Critical Debt (Intervene)</span>
          </div>
      </div>
    </div>
  );
}
