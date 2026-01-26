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

  // Count by tier for filter buttons
  const tierCounts = useMemo(() => ({
    RED: students.filter(s => s.dri.driTier === 'RED').length,
    YELLOW: students.filter(s => s.dri.driTier === 'YELLOW').length,
    GREEN: students.filter(s => s.dri.driTier === 'GREEN').length,
  }), [students]);

  // Data processing with memoization for performance (1,613 points)
  const data = useMemo(() => {
    return students
      .filter(s => !filterTier || s.dri.driTier === filterTier)
      .map(s => ({
        x: s.metrics.lmp * 100,
        y: s.metrics.ksi,
        z: s.dri.riskScore || 50,
        name: `${s.firstName} ${s.lastName}`,
        tier: s.dri.driTier,
        color: driColorToHex(s.dri.driColor),
        course: s.currentCourse?.name,
        raw: s
      }));
  }, [students, filterTier]);

  // Optimized dot component
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
            Visualizing {data.length} Students • RLM Architecture
          </p>
        </div>
        
        {/* Filter buttons with counters */}
        <div className="flex gap-2 bg-black/40 p-1 rounded-full border border-slate-800">
          {(['RED', 'YELLOW', 'GREEN'] as const).map(t => (
            <button 
              key={t}
              onClick={() => setFilterTier(filterTier === t ? null : t)}
              className={`px-3 py-1 rounded-full text-[9px] font-black transition-all flex items-center gap-1 ${
                filterTier === t 
                  ? 'bg-white text-black' 
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${
                t === 'RED' ? 'bg-red-500' : t === 'YELLOW' ? 'bg-amber-500' : 'bg-emerald-500'
              }`} />
              {t}
              <span className={`text-[8px] px-1 rounded ${
                filterTier === t ? 'bg-black/20' : 'bg-slate-800'
              }`}>
                {tierCounts[t]}
              </span>
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
                  <div className="bg-slate-950 border border-slate-700 p-3 rounded-xl shadow-2xl min-w-[180px]">
                    <p className="text-white font-black uppercase text-[11px] mb-1">{payload[0].payload.name}</p>
                    <p className="text-indigo-400 text-[9px] mb-2 font-bold uppercase">{payload[0].payload.course}</p>
                    <div className="grid grid-cols-2 gap-2 border-t border-slate-800 pt-2">
                      <div className="text-[9px]">
                        <span className="text-slate-500">RSR</span>
                        <span className="text-white font-bold ml-1">{(s.metrics.lmp * 100).toFixed(0)}%</span>
                      </div>
                      <div className="text-[9px]">
                        <span className="text-slate-500">KSI</span>
                        <span className="text-white font-bold ml-1">{s.metrics.ksi}%</span>
                      </div>
                      <div className="text-[9px]">
                        <span className="text-slate-500">Risk</span>
                        <span className="text-red-400 font-bold ml-1">{s.dri.riskScore}</span>
                      </div>
                      <div className="text-[9px]">
                        <span className="text-slate-500">PDI</span>
                        <span className="text-white font-bold ml-1">{s.dri.precisionDecay}x</span>
                      </div>
                    </div>
                    <div className="mt-2 pt-2 border-t border-slate-800 text-[8px] text-slate-600 text-center">
                      Click to view details
                    </div>
                  </div>
                );
              }}
            />
            <Scatter data={data} shape={<CustomDot />} isAnimationActive={false} />
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      {/* Quadrant Legend */}
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
