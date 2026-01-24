'use client';

import { useState, useEffect, useMemo } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { 
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  ReferenceLine, Cell, ReferenceArea 
} from 'recharts';
import StudentModal from '@/components/StudentModal';
import { TriageColumnSkeleton, MatrixSkeleton, HeatmapSkeleton } from '@/components/LoadingSkeleton';
import { calculateTier1Metrics } from '@/lib/metrics';
import { calculateDRIMetrics } from '@/lib/dri-calculus';
import { driColorToHex, kMeansCluster } from '@/lib/color-utils';
import { DRI_CONFIG } from '@/lib/dri-config';
import { Student } from '@/types';
import { TOPIC_GRADE_MAP } from '@/lib/grade-maps';
import { formatDistanceToNow } from 'date-fns';

// ==========================================
// TOOLTIP MEJORADO PARA MATRIZ KEENKT
// ==========================================
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const isCluster = data.members && data.members.length > 1;
    
    if (isCluster) {
      return (
        <div className="bg-slate-900 border border-slate-700 p-4 rounded-lg shadow-2xl text-xs max-w-xs">
          <p className="font-black text-white mb-2 text-lg">📍 Cluster de {data.members.length} estudiantes</p>
          <div className="border-t border-slate-700 pt-2 mt-2">
            <p className="font-bold text-indigo-400 mb-1">Caso más crítico:</p>
            <p className="text-white font-bold">{data.worstStudent.firstName} {data.worstStudent.lastName}</p>
            <p className="text-slate-400 text-[10px] mb-2">{data.worstStudent.currentCourse?.name}</p>
            <p className="text-emerald-400">RSR: {(data.worstStudent.metrics?.lmp * 100).toFixed(0)}%</p>
            <p className="text-blue-400">KSI: {data.worstStudent.metrics?.ksi}%</p>
            <p className="text-amber-400 text-[10px] mt-1">
              Velocity: {data.worstStudent.metrics?.velocityScore}% 
              <span className="text-slate-600"> (de {DRI_CONFIG.ALPHA_WEEKLY_STANDARD} XP)</span>
            </p>
            <p className={`mt-2 font-mono uppercase font-bold text-sm ${data.worstStudent.dri.driColor}`}>
              {data.worstStudent.dri.driSignal}
            </p>
            {data.worstStudent.dri.riskScore !== undefined && (
              <p className="text-[10px] text-slate-500 mt-1">Risk Score: {data.worstStudent.dri.riskScore}/100</p>
            )}
          </div>
        </div>
      );
    }
    
    return (
      <div className="bg-slate-900 border border-slate-700 p-3 rounded-lg shadow-2xl text-xs">
        <p className="font-bold text-white mb-1">{data.firstName} {data.lastName}</p>
        <p className="text-indigo-400 font-bold mb-1 uppercase text-[9px]">{data.currentCourse?.name}</p>
        <p className="text-emerald-400">Recent Success Rate: {(data.metrics?.lmp * 100).toFixed(0)}%</p>
        <p className="text-blue-400">Stability (KSI): {data.metrics?.ksi}%</p>
        <p className="text-amber-400 text-[10px] mt-1">
          Velocity: {data.metrics?.velocityScore}% 
          <span className="text-slate-600"> (de {DRI_CONFIG.ALPHA_WEEKLY_STANDARD} XP)</span>
        </p>
        <p className={`mt-1 font-mono uppercase font-bold ${data.dri.driColor}`}>
          {data.dri.driSignal}
        </p>
        {data.dri.riskScore !== undefined && (
          <p className="text-[10px] text-slate-500 mt-1">Risk Score: {data.dri.riskScore}/100</p>
        )}
      </div>
    );
  }
  return null;
};

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================
export default function HomePage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [autoSync, setAutoSync] = useState(false);
  const [progress, setProgress] = useState(0);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [batchStatus, setBatchStatus] = useState({ current: 0, total: 33, lastStudent: '' });
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  
  const [viewMode, setViewMode] = useState<'TRIAGE' | 'MATRIX' | 'HEATMAP' | 'LOG'>('TRIAGE');
  const [matrixMode, setMatrixMode] = useState<'full' | 'critical'>('critical');
  const [search, setSearch] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('ALL');

  // ==========================================
  // FIREBASE LISTENERS
  // ==========================================
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

    const unsubLogs = onSnapshot(
      query(collection(db, 'interventions'), orderBy('createdAt', 'desc'), limit(20)), 
      (snapshot) => {
        setLogs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }
    );

    return () => { unsubStudents(); unsubLogs(); };
  }, []);

  // ==========================================
  // AUTO-SYNC RECURSIVO
  // ==========================================
  const runUpdateBatch = async () => {
    if (updating) return;
    setUpdating(true);
    setSyncError(null);
    
    try {
      const res = await fetch('/api/update-students');
      if (!res.ok) throw new Error('API failure');
      
      const data = await res.json();
      
      if (data.success) {
        setProgress(data.progress);
        setBatchStatus({
          current: data.currentBatch || Math.ceil(data.nextIndex / 50),
          total: data.totalBatches || 33,
          lastStudent: data.lastStudentName || ''
        });
        
        if (autoSync && data.progress < 100) {
          setTimeout(runUpdateBatch, 1500);
        } else if (data.progress >= 100) {
          setAutoSync(false);
          setLastSync(new Date());
        }
      }
    } catch (err) {
      setSyncError('Sync paused: API unreachable');
      setAutoSync(false);
    }
    
    setUpdating(false);
  };

  useEffect(() => { 
    if (autoSync && !updating) runUpdateBatch(); 
  }, [autoSync]);

  // ==========================================
  // DATOS COMPUTADOS
  // ==========================================
  const uniqueCourses = useMemo(() => 
    Array.from(new Set(students.map(s => s.currentCourse?.name).filter(Boolean))).sort(), 
  [students]);
  
  const criticalTopics = Object.keys(TOPIC_GRADE_MAP);

  // Heatmap con priorización (Top 15 más críticos)
  const heatmapData = useMemo(() => {
    const data = criticalTopics.map(topic => {
      const courseStats = uniqueCourses.map(course => {
        const relevant = students.filter(s => s.currentCourse?.name === course);
        const avgLMP = relevant.reduce((acc, s) => acc + (s.metrics?.lmp || 0), 0) / Math.max(1, relevant.length);
        return { course, avgLMP };
      });
      
      const criticalCourses = courseStats.filter(c => c.avgLMP < 0.4).length;
      
      return { topic, courseStats, criticalCourses };
    });
    
    return data
      .sort((a, b) => b.criticalCourses - a.criticalCourses)
      .slice(0, 15);
  }, [students, uniqueCourses, criticalTopics]);

  // Filtrado
  const filtered = useMemo(() => students.filter(s => {
    const nameMatch = `${s.firstName} ${s.lastName} ${s.id}`.toLowerCase().includes(search.toLowerCase());
    const courseMatch = selectedCourse === 'ALL' || s.currentCourse?.name === selectedCourse;
    return nameMatch && courseMatch;
  }), [students, search, selectedCourse]);

  // Distribución Inclusiva (cada estudiante en solo un tier)
  const redZone = useMemo(() => 
    filtered.filter(s => s.dri.driTier === 'RED'), 
  [filtered]);
  
  const yellowZone = useMemo(() => 
    filtered.filter(s => s.dri.driTier === 'YELLOW' && !redZone.some(r => r.id === s.id)), 
  [filtered, redZone]);
  
  const greenZone = useMemo(() => 
    filtered.filter(s => !redZone.some(r => r.id === s.id) && !yellowZone.some(y => y.id === s.id)), 
  [filtered, redZone, yellowZone]);

  // Matrix data con clustering
  const matrixData = useMemo(() => {
    const baseData = matrixMode === 'critical' 
      ? [...redZone, ...yellowZone]
      : filtered;
    
    if (baseData.length > 200) {
      const clusters = kMeansCluster(baseData, 100, {
        x: (d) => d.metrics.lmp,
        y: (d) => d.metrics.ksi
      });
      
      return clusters.map(c => ({
        ...c.worstStudent,
        metrics: {
          ...c.worstStudent.metrics,
          lmp: c.centroid.x,
          ksi: c.centroid.y
        },
        isCluster: true,
        members: c.members,
        worstStudent: c.worstStudent
      }));
    }
    
    return baseData;
  }, [filtered, redZone, yellowZone, matrixMode]);

  // Estadísticas globales
  const stats = useMemo(() => ({
    total: students.length,
    atRisk: students.filter(s => s.dri.driTier === 'RED').length,
    attention: students.filter(s => s.dri.driTier === 'YELLOW').length,
    onTrack: students.filter(s => s.dri.driTier === 'GREEN').length,
    avgVelocity: Math.round(students.reduce((sum, s) => sum + (s.metrics?.velocityScore || 0), 0) / (students.length || 1)),
    avgRSR: Math.round(students.reduce((sum, s) => sum + ((s.metrics?.lmp || 0) * 100), 0) / (students.length || 1))
  }), [students]);

  if (loading) return (
    <div className="p-10 bg-black min-h-screen text-emerald-500 font-mono italic animate-pulse text-center uppercase tracking-widest">
      DRI COMMAND CENTER INITIALIZING...
    </div>
  );

  return (
    <div className="p-4 bg-[#050505] min-h-screen text-slate-300 font-sans">
      
      {/* ========================================== */}
      {/* HEADER CON SYNC STATUS */}
      {/* ========================================== */}
      <div className="flex flex-col md:flex-row justify-between items-end mb-8 border-b border-slate-800 pb-6 gap-4">
        <div>
          <h1 className="text-3xl font-black uppercase italic text-white tracking-tighter">DRI COMMAND CENTER</h1>
          <p className="text-xs text-indigo-400 font-bold tracking-[0.3em] uppercase">
            V5.0 Alpha Protocol • {students.length} / 1613 Estudiantes
          </p>
          <p className="text-[10px] text-slate-600 mt-1">
            <span className="text-emerald-500 font-mono">{DRI_CONFIG.ALPHA_WEEKLY_STANDARD} XP/semana</span> standard • 
            <span className="text-amber-500 font-mono ml-2">DER &gt; {DRI_CONFIG.DER_CRITICAL_THRESHOLD}%</span> critical • 
            <span className="text-red-500 font-mono ml-2">PDI &gt; {DRI_CONFIG.PDI_CRITICAL_THRESHOLD}</span> fatigue
          </p>
          {lastSync && (
            <p className="text-[10px] text-slate-600 font-mono mt-1">
              Last sync: {formatDistanceToNow(lastSync, { addSuffix: true })}
            </p>
          )}
        </div>
        
        <div className="flex flex-col items-end gap-3">
          {/* View Mode Selector */}
          <div className="flex bg-slate-900/50 p-1 rounded-xl border border-slate-800 font-black text-[10px] uppercase">
            {(['TRIAGE', 'MATRIX', 'HEATMAP', 'LOG'] as const).map(m => (
              <button 
                key={m} 
                onClick={() => setViewMode(m)} 
                className={`px-4 py-2 rounded-lg transition-all ${
                  viewMode === m 
                    ? 'bg-indigo-600 text-white shadow-lg' 
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
          
          {/* Sync Controls */}
          <div className="flex gap-4 items-center bg-slate-900/40 p-2 px-4 rounded-xl border border-slate-800 relative overflow-hidden group">
            {autoSync && (
              <div 
                className="absolute bottom-0 left-0 h-0.5 bg-emerald-500 transition-all duration-700 shadow-[0_0_10px_#10b981]" 
                style={{ width: `${progress}%` }} 
              />
            )}
            <div className="text-[10px] font-mono">
              <div className="font-bold text-white">{students.length} / 1613</div>
              {autoSync && (
                <div className="text-slate-500">
                  Batch {batchStatus.current}/{batchStatus.total}
                  {batchStatus.lastStudent && (
                    <span className="ml-2 text-slate-600">• {batchStatus.lastStudent}</span>
                  )}
                </div>
              )}
            </div>
            <button 
              onClick={() => setAutoSync(!autoSync)} 
              disabled={updating && !autoSync}
              className={`px-4 py-1.5 rounded-lg font-black text-[9px] tracking-widest uppercase transition-all ${
                autoSync 
                  ? 'bg-red-900/50 text-red-500 border border-red-500 animate-pulse' 
                  : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-lg disabled:opacity-50'
              }`}
            >
              {autoSync ? `⏸ STOP ${progress}%` : '⚡ AUTO SYNC'}
            </button>
          </div>
          
          {/* Error Display */}
          {syncError && (
            <div className="bg-red-900/20 border border-red-500/50 px-4 py-2 rounded-lg text-[10px] text-red-400 font-mono">
              {syncError}
            </div>
          )}
        </div>
      </div>

      {/* ========================================== */}
      {/* STATS CARDS */}
      {/* ========================================== */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
        <div className="bg-blue-500/10 border border-blue-500/30 p-4 rounded-xl">
          <div className="text-[10px] font-bold uppercase tracking-wider text-blue-400 mb-1">Total Students</div>
          <div className="text-2xl font-black text-white">{stats.total}</div>
        </div>
        
        <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl">
          <div className="text-[10px] font-bold uppercase tracking-wider text-red-400 mb-1">🔴 At Risk</div>
          <div className="text-2xl font-black text-white">{stats.atRisk}</div>
        </div>
        
        <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-xl">
          <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400 mb-1">🟡 Attention</div>
          <div className="text-2xl font-black text-white">{stats.attention}</div>
        </div>
        
        <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-xl">
          <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 mb-1">🟢 On Track</div>
          <div className="text-2xl font-black text-white">{stats.onTrack}</div>
        </div>
        
        <div className="bg-purple-500/10 border border-purple-500/30 p-4 rounded-xl">
          <div className="text-[10px] font-bold uppercase tracking-wider text-purple-400 mb-1">Avg Velocity</div>
          <div className="text-2xl font-black text-white">{stats.avgVelocity}%</div>
          <div className="text-[9px] text-slate-600 font-mono mt-1">vs {DRI_CONFIG.ALPHA_WEEKLY_STANDARD} XP</div>
        </div>
        
        <div className="bg-indigo-500/10 border border-indigo-500/30 p-4 rounded-xl">
          <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 mb-1">Avg RSR</div>
          <div className="text-2xl font-black text-white">{stats.avgRSR}%</div>
          <div className="text-[9px] text-slate-600 font-mono mt-1">Recent Success</div>
        </div>
      </div>

      {/* ========================================== */}
      {/* FILTROS */}
      {/* ========================================== */}
      <div className="flex flex-wrap gap-4 mb-8">
        <input 
          onChange={(e) => setSearch(e.target.value)} 
          placeholder="🔎 SEARCH UNIT BY NAME OR ID..." 
          className="flex-1 min-w-[300px] bg-slate-900/40 border border-slate-800 rounded-2xl px-6 py-4 text-sm focus:border-indigo-500 outline-none font-mono transition-all" 
        />
        <select 
          value={selectedCourse} 
          onChange={(e) => setSelectedCourse(e.target.value)} 
          className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs font-black uppercase text-slate-400 outline-none"
        >
          <option value="ALL">ALL COURSES</option>
          {uniqueCourses.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
{/* ========================================== */}
      {/* ÁREA DE CONTENIDO DINÁMICO */}
      {/* ========================================== */}
      <div className="h-[calc(100vh-420px)] overflow-hidden">
        
        {/* ==================== TRIAGE VIEW ==================== */}
        {viewMode === 'TRIAGE' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full animate-in fade-in duration-500">
            {[
                { label: '🚨 Critical Ops', data: redZone, tier: 'RED', border: 'border-red-500' },
                { label: '⚠️ Watch List', data: yellowZone, tier: 'YELLOW', border: 'border-amber-500' },
                { label: '⚡ Stable Units', data: greenZone, tier: 'GREEN', border: 'border-emerald-500' }
            ].map(col => (
              <div key={col.tier} className="flex flex-col bg-slate-900/20 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
                <div className={`p-4 bg-slate-900/40 border-b border-slate-800 font-black text-xs uppercase tracking-widest flex justify-between`}>
                  <span className="text-slate-300">{col.label}</span>
                  <span className="bg-slate-800 text-slate-500 px-2 py-0.5 rounded font-mono">{col.data.length} UNITS</span>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                  {col.data.length === 0 ? (
                    <div className="text-center py-20 text-slate-600 italic text-xs">
                      No students in this tier
                    </div>
                  ) : (
                    col.data.map(s => (
                      <div 
                        key={s.id} 
                        onClick={() => setSelectedStudent(s)} 
                        className={`p-4 bg-slate-900/80 rounded-2xl border-l-4 ${col.border} cursor-pointer hover:scale-[1.02] transition-all group shadow-lg`}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <h3 className="font-black text-white text-sm uppercase italic truncate w-40 group-hover:text-indigo-400">
                            {s.firstName} {s.lastName}
                          </h3>
                          <span className="text-[10px] font-mono font-bold text-slate-500 italic">
                            {(s.metrics.lmp * 100).toFixed(0)}% RSR
                          </span>
                        </div>
                        <p className="text-[9px] text-indigo-400/70 font-bold uppercase mb-3 truncate italic">
                          {s.currentCourse.name}
                        </p>
                        <div className="flex justify-between items-center text-[8px] font-black uppercase font-mono">
                          <span className={s.dri.driColor}>{s.dri.driSignal}</span>
                          <span className="text-slate-600">
                            {s.metrics.velocityScore}% v • KSI: {s.metrics.ksi}%
                          </span>
                        </div>
                        {s.dri.riskScore !== undefined && (
                          <div className="mt-2 pt-2 border-t border-slate-800">
                            <div className="flex justify-between items-center text-[9px]">
                              <span className="text-slate-600">Risk Score:</span>
                              <span className={`font-mono font-bold ${
                                s.dri.riskScore >= 60 ? 'text-red-400' : 
                                s.dri.riskScore >= 35 ? 'text-amber-400' : 
                                'text-emerald-400'
                              }`}>
                                {s.dri.riskScore}/100
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ==================== MATRIX VIEW ==================== */}
        {viewMode === 'MATRIX' && (
          <div className="h-full w-full bg-slate-900/10 border border-slate-800 rounded-[2.5rem] p-8 relative overflow-hidden animate-in fade-in duration-500 shadow-2xl">
            {/* Toggle de modo */}
            <div className="absolute top-4 right-4 z-20 flex gap-2">
              <button
                onClick={() => setMatrixMode(m => m === 'full' ? 'critical' : 'full')}
                className="px-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-[10px] font-black uppercase text-slate-300 hover:bg-slate-800 transition-all"
              >
                {matrixMode === 'full' 
                  ? `Show Critical Only (${redZone.length + yellowZone.length})` 
                  : `Show All (${filtered.length})`
                }
              </button>
            </div>

            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 40, right: 30, bottom: 20, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis 
                  type="number" 
                  dataKey="metrics.lmp" 
                  name="RSR" 
                  domain={[0, 1]} 
                  stroke="#475569" 
                  fontSize={10}
                  label={{ 
                    value: 'Recent Success Rate (RSR)', 
                    position: 'insideBottom', 
                    offset: -10, 
                    fill: '#64748b',
                    fontSize: 11
                  }}
                />
                <YAxis 
                  type="number" 
                  dataKey="metrics.ksi" 
                  name="KSI" 
                  domain={[0, 100]} 
                  stroke="#475569" 
                  fontSize={10}
                  label={{ 
                    value: 'Knowledge Stability Index', 
                    angle: -90, 
                    position: 'insideLeft', 
                    fill: '#64748b',
                    fontSize: 11
                  }}
                />
                <Tooltip content={<CustomTooltip />} />
                
                {/* Zonas de intervención */}
                <ReferenceArea 
                  x1={0} x2={0.7} y1={0} y2={60} 
                  fill="#ef4444" 
                  fillOpacity={0.05}
                  label={{ 
                    value: 'CRITICAL ZONE', 
                    position: 'insideTopLeft', 
                    fill: '#ef4444',
                    fontSize: 10,
                    fontWeight: 'bold'
                  }}
                />
                <ReferenceArea 
                  x1={0.7} x2={1} y1={60} y2={100} 
                  fill="#10b981" 
                  fillOpacity={0.05}
                  label={{ 
                    value: 'OPTIMAL ZONE', 
                    position: 'insideTopRight', 
                    fill: '#10b981',
                    fontSize: 10,
                    fontWeight: 'bold'
                  }}
                />
                
                <ReferenceLine x={0.7} stroke="#10b981" strokeDasharray="5 5" opacity={0.3} />
                <ReferenceLine y={60} stroke="#ef4444" strokeDasharray="5 5" opacity={0.3} />
                
                <Scatter data={matrixData} onClick={(n) => setSelectedStudent(n.payload.isCluster ? n.payload.worstStudent : n.payload)}>
                  {matrixData.map((e, i) => {
                    const baseColor = driColorToHex(e.dri.driColor);
                    const isCluster = e.isCluster;
                    
                    return (
                      <Cell 
                        key={i} 
                        fill={baseColor}
                        r={isCluster ? 8 : 5}
                        stroke={isCluster ? '#fff' : 'none'}
                        strokeWidth={isCluster ? 2 : 0}
                        className="cursor-pointer opacity-70 hover:opacity-100 transition-all duration-300" 
                      />
                    );
                  })}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
            
            {/* Leyenda */}
            <div className="absolute bottom-4 left-4 bg-slate-900/90 border border-slate-700 p-4 rounded-xl text-[10px]">
              <p className="font-black text-slate-400 mb-2 uppercase tracking-wider">Legend</p>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-slate-400" />
                  <span className="text-slate-400">Inactive ({students.filter(s => s.dri.driSignal === 'INACTIVE').length})</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <span className="text-red-400">Critical ({stats.atRisk})</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-amber-500" />
                  <span className="text-amber-400">Watch ({stats.attention})</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span className="text-emerald-400">Optimal ({stats.onTrack})</span>
                </div>
                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-700">
                  <div className="w-4 h-4 rounded-full bg-indigo-500 border-2 border-white" />
                  <span className="text-slate-400">Cluster (multiple students)</span>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* ==================== HEATMAP VIEW ==================== */}
        {viewMode === 'HEATMAP' && (
           <div className="h-full w-full bg-slate-950 border border-slate-800 rounded-[2.5rem] p-8 overflow-hidden flex flex-col shadow-2xl animate-in fade-in duration-500">
              <div className="mb-4">
                <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">
                  📊 Top 15 Critical Knowledge Components
                </h3>
                <p className="text-[10px] text-slate-600 font-mono mt-1">
                  Sorted by number of courses with avg RSR &lt; 40%
                </p>
              </div>
              
              <div className="flex-1 overflow-auto custom-scrollbar">
                 <table className="w-full border-collapse">
                    <thead>
                       <tr>
                          <th className="sticky top-0 left-0 z-20 bg-slate-950 p-2 text-[8px] font-black text-slate-600 uppercase text-left border-b border-slate-800">
                            Knowledge Component
                          </th>
                          {uniqueCourses.map(course => (
                             <th key={course} className="sticky top-0 z-10 bg-slate-950 p-2 text-[8px] font-black text-slate-500 uppercase border-b border-slate-800 min-w-[80px] font-mono">
                               {course}
                             </th>
                          ))}
                       </tr>
                    </thead>
                    <tbody>
                       {heatmapData.map(row => (
                          <tr key={row.topic} className="hover:bg-slate-900/50 transition-colors">
                             <td className="sticky left-0 z-10 bg-slate-950 p-2 text-[9px] font-bold text-slate-400 border-r border-slate-800 uppercase italic">
                               {row.topic}
                               <span className="ml-2 text-[8px] text-red-500 font-mono">
                                 ({row.criticalCourses} critical)
                               </span>
                             </td>
                             {row.courseStats.map((cell, idx) => (
                                <td key={idx} className="p-1 border border-slate-900">
                                   <div 
                                     className="h-8 rounded-md flex items-center justify-center text-[10px] font-mono font-black"
                                     style={{ 
                                       backgroundColor: cell.avgLMP < 0.4 ? 'rgba(239, 68, 68, 0.2)' : cell.avgLMP < 0.7 ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.1)',
                                       border: `1px solid ${cell.avgLMP < 0.4 ? '#ef444433' : cell.avgLMP < 0.7 ? '#f59e0b33' : '#10b98133'}`
                                     }}
                                   >
                                     <span style={{ 
                                       color: cell.avgLMP < 0.4 ? '#fca5a5' : cell.avgLMP < 0.7 ? '#fbbf24' : '#6ee7b7',
                                       textShadow: '0 0 2px rgba(0,0,0,0.8)'
                                     }}>
                                       {(cell.avgLMP * 100).toFixed(0)}%
                                     </span>
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

        {/* ==================== LOG VIEW ==================== */}
        {viewMode === 'LOG' && (
           <div className="h-full bg-slate-950 border border-slate-800 rounded-[2.5rem] p-8 overflow-y-auto custom-scrollbar animate-in fade-in duration-500 shadow-2xl">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {logs.map(log => (
                    <div key={log.id} className="flex items-center justify-between p-5 bg-slate-900/30 rounded-2xl border border-slate-800/50 shadow-inner">
                       <div className="flex items-center gap-5">
                          <div className={`w-3 h-3 rounded-full ${
                            log.type === 'coaching' ? 'bg-indigo-500 shadow-[0_0_10px_#6366f1]' : 'bg-red-500 shadow-[0_0_10px_#ef4444]'
                          }`} />
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

      {/* ========================================== */}
      {/* STUDENT MODAL */}
      {/* ========================================== */}
      {selectedStudent && <StudentModal student={selectedStudent} onClose={() => setSelectedStudent(null)} />}
    </div>
  );
}
