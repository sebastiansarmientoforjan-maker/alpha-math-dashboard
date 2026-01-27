'use client';

import { Student } from '@/types';

interface BulkActionsBarProps {
  selectedCount: number;
  selectedStudents: Student[];
  onClear: () => void;
  onExport: () => void;
}

export default function BulkActionsBar({ 
  selectedCount, 
  selectedStudents,
  onClear, 
  onExport 
}: BulkActionsBarProps) {
  // Calculate aggregate stats
  const avgRSR = selectedStudents.length > 0
    ? Math.round(selectedStudents.reduce((sum, s) => sum + (s.metrics.lmp * 100), 0) / selectedStudents.length)
    : 0;
  
  const avgVelocity = selectedStudents.length > 0
    ? Math.round(selectedStudents.reduce((sum, s) => sum + s.metrics.velocityScore, 0) / selectedStudents.length)
    : 0;

  const tierBreakdown = {
    red: selectedStudents.filter(s => s.dri.driTier === 'RED').length,
    yellow: selectedStudents.filter(s => s.dri.driTier === 'YELLOW').length,
    green: selectedStudents.filter(s => s.dri.driTier === 'GREEN').length,
  };

  return (
    <div className="flex-shrink-0 mx-6 mb-2 p-4 bg-indigo-900/30 border border-indigo-500/50 rounded-2xl flex items-center justify-between gap-4 animate-in slide-in-from-top duration-300">
      <div className="flex items-center gap-6">
        {/* Selection Count */}
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-indigo-500 flex items-center justify-center text-white font-black text-lg">
            {selectedCount}
          </div>
          <div>
            <p className="text-sm font-bold text-white">Students Selected</p>
            <p className="text-[10px] text-indigo-300">
              <span className="text-red-400">{tierBreakdown.red} Red</span>
              {' • '}
              <span className="text-amber-400">{tierBreakdown.yellow} Yellow</span>
              {' • '}
              <span className="text-emerald-400">{tierBreakdown.green} Green</span>
            </p>
          </div>
        </div>

        {/* Aggregate Stats */}
        <div className="hidden md:flex items-center gap-4 pl-6 border-l border-indigo-500/30">
          <div className="text-center">
            <p className="text-[9px] text-indigo-300 uppercase">Avg RSR</p>
            <p className="text-lg font-black text-white">{avgRSR}%</p>
          </div>
          <div className="text-center">
            <p className="text-[9px] text-indigo-300 uppercase">Avg Velocity</p>
            <p className="text-lg font-black text-white">{avgVelocity}%</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={onExport}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black uppercase rounded-lg transition-colors flex items-center gap-2"
        >
          <span>📊</span>
          Export CSV
        </button>
        
        <button
          onClick={onClear}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-400 text-[10px] font-black uppercase rounded-lg transition-colors"
        >
          ✕ Clear
        </button>
      </div>
    </div>
  );
}
