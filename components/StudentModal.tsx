'use client';

import { useMemo, useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Bar, BarChart } from 'recharts';
import { DRI_CONFIG } from '@/lib/dri-config';

interface StudentModalProps {
  student: any;
  onClose: () => void;
  onNavigate?: (direction: 'prev' | 'next') => void;
  currentIndex?: number;
  totalStudents?: number;
}

export default function StudentModal({ 
  student, 
  onClose, 
  onNavigate,
  currentIndex = -1,
  totalStudents = 0
}: StudentModalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'history'>('overview');

  const tasks = student?.activity?.tasks || [];

  // Keyboard navigation
  useEffect(() => {
    const handleKeyboard = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        onNavigate?.('next');
      }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        onNavigate?.('prev');
      }
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyboard);
    return () => window.removeEventListener('keydown', handleKeyboard);
  }, [onNavigate, onClose]);

  // ==========================================
  // READY TO ACCELERATE (Outer Fringe)
  // ==========================================
  const readyToAccelerate = useMemo((): string[] => {
    const topics = tasks
      .filter((t: any) => (t.questionsCorrect / (t.questions || 1)) > 0.7)
      .map((t: any) => t.topic?.name || 'Unknown Topic');
    return Array.from(new Set(topics)).slice(0, 3) as string[];
  }, [tasks]);

  // ==========================================
  // STRUGGLE TOPICS (Need Intervention)
  // ==========================================
  const struggleTopics = useMemo((): string[] => {
    const topics = tasks
      .filter((t: any) => (t.questionsCorrect / (t.questions || 1)) < 0.5)
      .map((t: any) => t.topic?.name || 'Unknown Topic');
    return Array.from(new Set(topics)).slice(0, 3) as string[];
  }, [tasks]);

  // ==========================================
  // DATA FOR TABLE (Most recent first)
  // ==========================================
  const sortedData = useMemo(() => {
    return tasks.map((t: any, i: number) => {
      const dateObj = new Date(t.completedLocal);
      return {
        id: t.id,
        timestamp: dateObj.getTime(),
        acc: Math.round((t.questionsCorrect / (t.questions || 1)) * 100),
        topic: t.topic?.name || 'Session Task',
        questions: t.questions || 0,
        correct: t.questionsCorrect || 0,
        date: dateObj.toLocaleDateString('en-US', { day: '2-digit', month: '2-digit' }),
        time: Math.round((t.timeTotal || 0) / 60),
        xp: t.xpAwarded || 0
      };
    }).sort((a: any, b: any) => b.timestamp - a.timestamp);
  }, [tasks]);

  // ==========================================
  // DATA FOR CHART (Chronological order)
  // ==========================================
  const chartData = useMemo(() => 
    [...sortedData].reverse().map((d, i) => ({ ...d, i: i + 1 })), 
  [sortedData]);

  // ==========================================
  // WEEKLY ACTIVITY PATTERN
  // ==========================================
  const weeklyPattern = useMemo(() => {
    const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const pattern = daysOfWeek.map(day => ({ day, tasks: 0, xp: 0 }));
    
    tasks.forEach((t: any) => {
      const date = new Date(t.completedLocal);
      const dayIndex = (date.getDay() + 6) % 7;
      pattern[dayIndex].tasks++;
      pattern[dayIndex].xp += t.xpAwarded || 0;
    });
    
    return pattern;
  }, [tasks]);

  const rsrDisplay = isNaN(student.metrics.lmp) ? '0%' : `${(student.metrics.lmp * 100).toFixed(0)}%`;
  const velocityInXP = Math.round((student.metrics.velocityScore / 100) * DRI_CONFIG.ALPHA_WEEKLY_STANDARD);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="bg-[#080808] border border-slate-800 w-full max-w-7xl h-[90vh] rounded-[2.5rem] relative z-10 flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* ========================================== */}
        {/* HEADER */}
        {/* ========================================== */}
        <div className="p-6 border-b border-slate-800 flex justify-between items-start bg-gradient-to-b from-slate-900/50 to-transparent">
          <div className="flex gap-6 items-center flex-1">
            {/* Velocity Badge */}
            <div className={`w-20 h-20 rounded-2xl border-4 flex flex-col items-center justify-center text-2xl font-black italic ${
              student.dri.driTier === 'RED' ? 'border-red-500 text-red-500 bg-red-500/10' : 
              student.dri.driTier === 'YELLOW' ? 'border-amber-500 text-amber-500 bg-amber-500/10' :
              'border-emerald-500 text-emerald-500 bg-emerald-500/10'
            }`}>
              <span className="text-2xl">{student.metrics.velocityScore || 0}</span>
              <span className="text-[8px] opacity-60 uppercase tracking-wider">Velocity</span>
            </div>
            
            <div className="flex-1">
              <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase">
                {student.firstName} {student.lastName}
              </h2>
              
              <div className="flex flex-wrap gap-3 mt-2 font-black text-[10px] uppercase">
                <span className={`px-3 py-1 rounded-full border border-current ${student.dri.driColor}`}>
                  {student.dri.driSignal}
                </span>
                <span className="px-3 py-1 rounded-full border border-indigo-500/30 text-indigo-400 bg-indigo-500/10">
                  {student.currentCourse?.name}
                </span>
                {student.dri.riskScore !== undefined && (
                  <span className={`px-3 py-1 rounded-full border ${
                    student.dri.riskScore >= 60 ? 'border-red-500 text-red-400 bg-red-500/10' :
                    student.dri.riskScore >= 35 ? 'border-amber-500 text-amber-400 bg-amber-500/10' :
                    'border-emerald-500 text-emerald-400 bg-emerald-500/10'
                  }`}>
                    Risk: {student.dri.riskScore}/100
                  </span>
                )}
              </div>
              
              <div className="mt-2 flex gap-4 text-[10px] text-slate-500 font-mono">
                <span>
                  <span className={`font-bold ${
                    student.metrics.velocityScore >= 100 ? 'text-emerald-500' :
                    student.metrics.velocityScore >= 80 ? 'text-amber-400' :
                    'text-red-400'
                  }`}>
                    {velocityInXP} XP
                  </span> / {DRI_CONFIG.ALPHA_WEEKLY_STANDARD} XP weekly
                </span>
                <span className="text-slate-700">•</span>
                <span>{tasks.length} total sessions</span>
                <span className="text-slate-700">•</span>
                <span>{Math.round((student.activity?.time || 0) / 3600)}h engaged</span>
              </div>
            </div>
          </div>
          
          {/* Navigation & Close */}
          <div className="flex items-center gap-2">
            {onNavigate && totalStudents > 1 && (
              <div className="flex items-center gap-1 mr-4">
                <button 
                  onClick={() => onNavigate('prev')}
                  className="w-10 h-10 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors flex items-center justify-center"
                  title="Previous student (←)"
                >
                  ←
                </button>
                <span className="text-[10px] text-slate-600 font-mono px-2">
                  {currentIndex + 1} / {totalStudents}
                </span>
                <button 
                  onClick={() => onNavigate('next')}
                  className="w-10 h-10 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors flex items-center justify-center"
                  title="Next student (→)"
                >
                  →
                </button>
              </div>
            )}
            <button 
              onClick={onClose} 
              className="text-slate-600 hover:text-white text-2xl transition-colors p-2 hover:bg-slate-800 rounded-lg"
              title="Close (Esc)"
            >
              ✕
            </button>
          </div>
        </div>

        {/* ========================================== */}
        {/* TAB NAVIGATION */}
        {/* ========================================== */}
        <div className="px-6 pt-4 border-b border-slate-800/50 flex gap-2">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-t-lg font-black text-[10px] uppercase tracking-widest transition-all ${
              activeTab === 'overview'
                ? 'bg-slate-800 text-white border-t border-x border-slate-700'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            📊 Overview
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-t-lg font-black text-[10px] uppercase tracking-widest transition-all ${
              activeTab === 'history'
                ? 'bg-slate-800 text-white border-t border-x border-slate-700'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            📜 History
          </button>
        </div>

        {/* ========================================== */}
        {/* CONTENT AREA */}
        {/* ========================================== */}
        <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
          
          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-12 gap-6">
              
              {/* LEFT COLUMN: METRICS */}
              <div className="col-span-4 space-y-6">
                
                {/* RSR Card */}
                <div className="p-5 bg-slate-900/40 rounded-2xl border border-slate-800 text-center shadow-inner">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
                    Recent Success Rate (RSR)
                  </p>
                  <p className="text-5xl font-black text-white italic">{rsrDisplay}</p>
                  <p className="text-[9px] text-indigo-400 mt-3 font-bold uppercase italic tracking-widest">
                    {student.metrics.stallStatus || 'Optimal'}
                  </p>
                  <div className="mt-3 pt-3 border-t border-slate-800 text-[9px] text-slate-600">
                    Last {DRI_CONFIG.RSR_RECENT_TASKS_COUNT} tasks • &gt;{DRI_CONFIG.RSR_SUCCESS_THRESHOLD * 100}% threshold
                  </div>
                </div>

                {/* DRI Metrics Grid with expanded labels */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 bg-slate-900/40 rounded-xl border border-slate-800 group">
                    <div className="text-[9px] text-slate-500 uppercase tracking-wider mb-1">
                      KSI
                      <span className="hidden group-hover:inline text-indigo-400 ml-1">(Knowledge Stability)</span>
                    </div>
                    <div className={`text-2xl font-black ${
                      student.metrics.ksi === null ? 'text-slate-600' :
                      student.metrics.ksi < DRI_CONFIG.KSI_CRITICAL_THRESHOLD ? 'text-red-400' :
                      student.metrics.ksi < DRI_CONFIG.KSI_LOW_THRESHOLD ? 'text-amber-400' :
                      'text-blue-400'
                    }`}>
                      {student.metrics.ksi !== null ? `${student.metrics.ksi}%` : 'N/A'}
                    </div>
                  </div>
                  
                  <div className="p-4 bg-slate-900/40 rounded-xl border border-slate-800 group">
                    <div className="text-[9px] text-slate-500 uppercase tracking-wider mb-1">
                      Accuracy
                    </div>
                    <div className={`text-2xl font-black ${
                      (student.metrics.accuracyRate || 0) >= 70 ? 'text-emerald-400' :
                      (student.metrics.accuracyRate || 0) >= 55 ? 'text-amber-400' :
                      'text-red-400'
                    }`}>
                      {student.metrics.accuracyRate || 0}%
                    </div>
                  </div>
                  
                  <div className="p-4 bg-slate-900/40 rounded-xl border border-slate-800 group">
                    <div className="text-[9px] text-slate-500 uppercase tracking-wider mb-1">
                      DER
                      <span className="hidden group-hover:inline text-indigo-400 ml-1">(Debt Exposure)</span>
                    </div>
                    {student.dri.debtExposure !== null ? (
                      <div className={`text-2xl font-black ${
                        student.dri.debtExposure > DRI_CONFIG.DER_SEVERE_THRESHOLD ? 'text-red-400' :
                        student.dri.debtExposure > DRI_CONFIG.DER_CRITICAL_THRESHOLD ? 'text-amber-400' : 
                        'text-emerald-400'
                      }`}>
                        {student.dri.debtExposure}%
                      </div>
                    ) : (
                      <div className="text-sm text-slate-600">No data</div>
                    )}
                  </div>
                  
                  <div className="p-4 bg-slate-900/40 rounded-xl border border-slate-800 group">
                    <div className="text-[9px] text-slate-500 uppercase tracking-wider mb-1">
                      PDI
                      <span className="hidden group-hover:inline text-indigo-400 ml-1">(Precision Decay)</span>
                    </div>
                    {student.dri.precisionDecay !== null ? (
                      <div className={`text-2xl font-black ${
                        student.dri.precisionDecay > DRI_CONFIG.PDI_SEVERE_THRESHOLD ? 'text-red-400' :
                        student.dri.precisionDecay > DRI_CONFIG.PDI_CRITICAL_THRESHOLD ? 'text-amber-400' : 
                        'text-emerald-400'
                      }`}>
                        {student.dri.precisionDecay}x
                      </div>
                    ) : (
                      <div className="text-sm text-slate-600">No data</div>
                    )}
                  </div>
                </div>

                {/* Ready to Accelerate */}
                <div className="bg-indigo-950/20 border border-indigo-500/30 p-5 rounded-2xl">
                  <h3 className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-3 italic flex items-center gap-2">
                    <span>⚡ Ready to Accelerate</span>
                    <span className="px-2 py-0.5 bg-indigo-500/20 rounded text-indigo-300">
                      {readyToAccelerate.length}
                    </span>
                  </h3>
                  <div className="space-y-2">
                    {readyToAccelerate.length > 0 ? readyToAccelerate.map((topic: string, idx: number) => (
                      <div key={idx} className="flex items-center gap-2 p-2 bg-indigo-900/20 rounded-lg border border-indigo-500/10">
                        <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
                        <span className="text-[10px] font-bold text-indigo-200 uppercase truncate italic">{topic}</span>
                      </div>
                    )) : (
                      <p className="text-[10px] text-slate-600 italic font-bold text-center py-4">
                        Consolidating foundation...
                      </p>
                    )}
                  </div>
                </div>

                {/* Struggle Topics */}
                {struggleTopics.length > 0 && (
                  <div className="bg-red-950/20 border border-red-500/30 p-5 rounded-2xl">
                    <h3 className="text-[9px] font-black text-red-400 uppercase tracking-widest mb-3 italic flex items-center gap-2">
                      <span>🚨 Needs Intervention</span>
                      <span className="px-2 py-0.5 bg-red-500/20 rounded text-red-300">
                        {struggleTopics.length}
                      </span>
                    </h3>
                    <div className="space-y-2">
                      {struggleTopics.map((topic: string, idx: number) => (
                        <div key={idx} className="flex items-center gap-2 p-2 bg-red-900/20 rounded-lg border border-red-500/10">
                          <div className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                          <span className="text-[10px] font-bold text-red-200 uppercase truncate italic">{topic}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* RIGHT COLUMN: CHARTS */}
              <div className="col-span-8 space-y-6">
                
                {/* Precision Curve */}
                <div className="bg-slate-900/20 rounded-2xl border border-slate-800 p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] italic">
                      Precision Curve
                    </h3>
                    {chartData.length >= 5 && student.dri.precisionDecay && (
                      <div className="text-[10px] font-mono">
                        PDI: 
                        <span className={`ml-2 font-bold ${
                          student.dri.precisionDecay > DRI_CONFIG.PDI_SEVERE_THRESHOLD ? 'text-red-400' :
                          student.dri.precisionDecay > DRI_CONFIG.PDI_CRITICAL_THRESHOLD ? 'text-amber-400' :
                          'text-emerald-400'
                        }`}>
                          {student.dri.precisionDecay}x
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={chartData} margin={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                      <CartesianGrid stroke="#1e293b" vertical={false} strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="i" 
                        stroke="#475569" 
                        fontSize={10} 
                        label={{ value: 'Session #', position: 'insideBottom', offset: -5, fill: '#64748b' }} 
                      />
                      <YAxis 
                        domain={[0, 110]} 
                        ticks={[0, 25, 50, 75, 100]} 
                        stroke="#475569" 
                        fontSize={10} 
                        label={{ value: 'Accuracy %', angle: -90, position: 'insideLeft', fill: '#64748b' }} 
                      />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '15px' }}
                        labelFormatter={(value) => `Session ${value}`}
                        formatter={(value: any) => [`${value}%`, 'Accuracy']}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="acc" 
                        stroke="#6366f1" 
                        strokeWidth={3} 
                        dot={{ r: 4, fill: '#6366f1' }} 
                        activeDot={{ r: 8 }} 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Weekly Activity Pattern */}
                <div className="bg-slate-900/20 rounded-2xl border border-slate-800 p-6">
                  <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] italic mb-4">
                    Weekly Activity Pattern
                  </h3>
                  
                  <ResponsiveContainer width="100%" height={150}>
                    <BarChart data={weeklyPattern} margin={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                      <CartesianGrid stroke="#1e293b" vertical={false} strokeDasharray="3 3" />
                      <XAxis dataKey="day" stroke="#475569" fontSize={10} />
                      <YAxis 
                        stroke="#475569" 
                        fontSize={10}
                        label={{ value: 'XP Earned', angle: -90, position: 'insideLeft', fill: '#64748b' }}
                      />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '15px' }}
                        formatter={(value: any, name: string) => {
                          if (name === 'xp') return [`${value} XP`, 'Earned'];
                          if (name === 'tasks') return [`${value} tasks`, 'Completed'];
                          return [value, name];
                        }}
                      />
                      <Bar dataKey="xp" fill="#6366f1" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                  
                  <div className="mt-3 flex justify-between text-[9px] text-slate-600">
                    <span>Total weekly XP: <span className="text-indigo-400 font-bold">{weeklyPattern.reduce((sum, d) => sum + d.xp, 0)}</span></span>
                    <span>Avg per active day: <span className="text-emerald-400 font-bold">
                      {Math.round(weeklyPattern.reduce((sum, d) => sum + d.xp, 0) / (weeklyPattern.filter(d => d.tasks > 0).length || 1))}
                    </span></span>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl group">
                    <div className="text-[9px] text-purple-400 uppercase tracking-wider mb-1">
                      Focus
                      <span className="hidden group-hover:inline text-purple-300 ml-1">(Integrity)</span>
                    </div>
                    <div className="text-2xl font-black text-purple-300">
                      {student.metrics.focusIntegrity}%
                    </div>
                  </div>
                  
                  <div className="p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-xl group">
                    <div className="text-[9px] text-cyan-400 uppercase tracking-wider mb-1">
                      iROI
                      <span className="hidden group-hover:inline text-cyan-300 ml-1">(Investment ROI)</span>
                    </div>
                    {student.dri.iROI !== null ? (
                      <div className="text-2xl font-black text-cyan-300">
                        {student.dri.iROI}
                      </div>
                    ) : (
                      <div className="text-sm text-slate-600">N/A</div>
                    )}
                  </div>
                  
                  <div className="p-4 bg-pink-500/10 border border-pink-500/30 rounded-xl">
                    <div className="text-[9px] text-pink-400 uppercase tracking-wider mb-1">Sessions</div>
                    <div className="text-2xl font-black text-pink-300">
                      {tasks.length}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* HISTORY TAB */}
          {activeTab === 'history' && (
            <div className="bg-slate-900/10 rounded-2xl border border-slate-800 overflow-hidden">
              <div className="p-4 bg-slate-900/40 border-b border-slate-800 flex justify-between items-center sticky top-0 z-10">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                  Session History
                </span>
                <span className="text-[9px] text-slate-600 font-mono">
                  {sortedData.length} total sessions
                </span>
              </div>
              
              <div className="max-h-[600px] overflow-y-auto custom-scrollbar">
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 bg-[#080808] z-10">
                    <tr className="text-[9px] font-black text-slate-600 uppercase border-b border-slate-800">
                      <th className="p-4">Date</th>
                      <th className="p-4">Topic / Concept</th>
                      <th className="p-4 text-center">Accuracy</th>
                      <th className="p-4 text-center">Items</th>
                      <th className="p-4 text-center">Time</th>
                      <th className="p-4 text-center">XP</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {sortedData.map((task: any, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-900/30 transition-colors">
                        <td className="p-4 text-[10px] font-mono text-slate-500">{task.date}</td>
                        <td className="p-4 text-[11px] font-bold text-slate-300 uppercase italic truncate max-w-[300px]">
                          {task.topic}
                        </td>
                        <td className="p-4 text-center">
                          <span className={`text-[10px] font-mono font-black px-2 py-1 rounded ${
                            task.acc >= 80 ? 'bg-emerald-500/20 text-emerald-400' : 
                            task.acc >= 50 ? 'bg-amber-500/20 text-amber-400' : 
                            'bg-red-500/20 text-red-400'
                          }`}>
                            {task.acc}%
                          </span>
                        </td>
                        <td className="p-4 text-center text-[10px] font-mono text-slate-500">
                          {task.correct} / {task.questions}
                        </td>
                        <td className="p-4 text-center text-[10px] font-mono text-indigo-400">
                          {task.time} min
                        </td>
                        <td className="p-4 text-center text-[10px] font-mono text-purple-400 font-bold">
                          {task.xp}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
