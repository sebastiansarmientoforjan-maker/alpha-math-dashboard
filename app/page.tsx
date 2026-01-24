'use client';

import { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { 
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  ReferenceLine, Cell, ReferenceArea 
} from 'recharts';
import StudentModal from '@/components/StudentModal';
import { calculateTier1Metrics } from '@/lib/metrics';
import { calculateDRIMetrics } from '@/lib/dri-calculus';
import { driColorToHex, kMeansCluster } from '@/lib/color-utils';
import { DRI_CONFIG } from '@/lib/dri-config';
import { Student } from '@/types';
import { TOPIC_GRADE_MAP } from '@/lib/grade-maps';
import { formatDistanceToNow } from 'date-fns';

// ==========================================
// METRIC CARD COMPONENT CON TOOLTIP
// ==========================================
interface MetricCardProps {
  title: string;
  value: string | number;
  color: 'red' | 'amber' | 'emerald' | 'blue' | 'purple';
  subtitle?: string;
  tooltip?: string;
  trend?: number;
}

function MetricCard({ title, value, color, subtitle, tooltip, trend }: MetricCardProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  
  const colorClasses = {
    red: 'bg-red-500/10 border-red-500/30 text-red-400',
    amber: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
    emerald: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
    blue: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
    purple: 'bg-purple-500/10 border-purple-500/30 text-purple-400'
  };

  return (
    <div 
      className={`relative border p-4 rounded-xl ${colorClasses[color]} transition-all hover:scale-[1.02] ${tooltip ? 'cursor-help' : ''}`}
      onMouseEnter={() => tooltip && setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div className="text-[10px] font-bold uppercase tracking-wider opacity-70 mb-1 flex items-center justify-between">
        <span>{title}</span>
        {trend !== undefined && (
          <span className={`text-xs font-black ${trend > 0 ? 'text-emerald-400' : trend < 0 ? 'text-red-400' : 'text-slate-600'}`}>
            {trend > 0 ? '↗' : trend < 0 ? '↘' : '→'} {Math.abs(trend)}%
          </span>
        )}
      </div>
      
      <div className="text-2xl font-black">{value}</div>
      
      {subtitle && <div className="text-[9px] opacity-60 mt-1">{subtitle}</div>}
      
      {showTooltip && tooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-[10px] text-slate-300 whitespace-nowrap z-50 shadow-2xl animate-in fade-in duration-200">
          {tooltip}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-slate-900" />
        </div>
      )}
    </div>
  );
}

// ==========================================
// STUDENT CARD MEMOIZADO
// ==========================================
const StudentCard = memo(({ student, onClick, borderColor }: { student: Student; onClick: () => void; borderColor: string }) => {
  return (
    <div 
      onClick={onClick}
      className={`p-4 bg-slate-900/80 rounded-2xl border-l-4 ${borderColor} cursor-pointer hover:scale-[1.02] transition-all group shadow-lg`}
    >
      <div className="flex justify-between items-start mb-1">
        <h3 className="font-black text-white text-sm uppercase italic truncate w-40 group-hover:text-indigo-400">
          {student.firstName} {student.lastName}
        </h3>
        <span className="text-[10px] font-mono font-bold text-slate-500 italic">
          {(student.metrics.lmp * 100).toFixed(0)}% RSR
        </span>
      </div>
      
      <p className="text-[9px] text-indigo-400/70 font-bold uppercase mb-3 truncate italic">
        {student.currentCourse.name}
      </p>
      
      <div className="flex justify-between items-center text-[8px] font-black uppercase font-mono">
        <span className={student.dri.driColor}>{student.dri.driSignal}</span>
        <span className="text-slate-600">
          {student.metrics.velocityScore}% v • KSI: {student.metrics.ksi}%
        </span>
      </div>
      
      {student.dri.riskScore !== undefined && (
        <div className="mt-2 pt-2 border-t border-slate-800">
          <div className="flex justify-between items-center text-[9px]">
            <span className="text-slate-600">Risk:</span>
            <span className={`font-mono font-bold ${
              student.dri.riskScore >= 60 ? 'text-red-400' : 
              student.dri.riskScore >= 35 ? 'text-amber-400' : 
              'text-emerald-400'
            }`}>
              {student.dri.riskScore}/100
            </span>
          </div>
        </div>
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  const prev = prevProps.student;
  const next = nextProps.student;
  
  return (
    prev.id === next.id &&
    prev.metrics.velocityScore === next.metrics.velocityScore &&
    prev.metrics.lmp === next.metrics.lmp &&
    prev.metrics.ksi === next.metrics.ksi &&
    prev.dri.driTier === next.dri.driTier &&
    prev.dri.driSignal === next.dri.driSignal &&
    prev.dri.riskScore === next.dri.riskScore
  );
});

StudentCard.displayName = 'StudentCard';

// ==========================================
// CUSTOM TOOLTIP OPTIMIZADO
// ==========================================
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const isCluster = data.members && data.members.length > 1;
    
    if (isCluster) {
      return (
        <div className="bg-slate-900/95 border border-slate-700 p-3 rounded-xl shadow-2xl backdrop-blur-md max-w-xs">
          <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-700">
            <p className="font-black text-white text-sm">📍 {data.members.length} estudiantes</p>
          </div>
          
          <div className="space-y-1">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider">Caso más crítico:</p>
            <p className="text-white font-bold text-xs">{data.worstStudent.firstName} {data.worstStudent.lastName}</p>
            
            <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 mt-2 pt-2 border-t border-slate-700/50">
              <div className="flex justify-between items-center">
                <span className="text-[9px] text-slate-500">RSR:</span>
                <span className="text-emerald-400 font-mono font-bold text-[10px]">
                  {(data.worstStudent.metrics?.lmp * 100).toFixed(0)}%
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-[9px] text-slate-500">KSI:</span>
                <span className="text-blue-400 font-mono font-bold text-[10px]">
                  {data.worstStudent.metrics?.ksi}%
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-[9px] text-slate-500">V:</span>
                <span className="text-amber-400 font-mono font-bold text-[10px]">
                  {data.worstStudent.metrics?.velocityScore}%
                </span>
              </div>
              
              {data.worstStudent.dri.riskScore !== undefined && (
                <div className="flex justify-between items-center">
                  <span className="text-[9px] text-slate-500">Risk:</span>
                  <span className={`font-mono font-bold text-[10px] ${
                    data.worstStudent.dri.riskScore >= 60 ? 'text-red-400' :
                    data.worstStudent.dri.riskScore >= 35 ? 'text-amber-400' :
                    'text-emerald-400'
                  }`}>
                    {data.worstStudent.dri.riskScore}
                  </span>
                </div>
              )}
            </div>
            
            <div className="mt-2 pt-2 border-t border-slate-700/50">
              <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${data.worstStudent.dri.driColor}`}>
                {data.worstStudent.dri.driSignal}
              </span>
            </div>
          </div>
        </div>
      );
    }
    
    return (
      <div className="bg-slate-900/95 border border-slate-700 p-3 rounded-xl shadow-2xl backdrop-blur-md">
        <div className="flex items-center justify-between gap-3 mb-2 pb-2 border-b border-slate-700/50">
          <div>
            <p className="font-black text-white text-xs leading-tight">{data.firstName} {data.lastName}</p>
            <p className="text-indigo-400/70 text-[9px] font-bold uppercase mt-0.5">{data.currentCourse?.name}</p>
          </div>
          <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase whitespace-nowrap ${data.dri.driColor}`}>
            {data.dri.driSignal}
          </span>
        </div>
        
        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
          <div className="flex justify-between items-center">
            <span className="text-[9px] text-slate-500">RSR:</span>
            <span className="text-emerald-400 font-mono font-bold text-[10px]">
              {(data.metrics?.lmp * 100).toFixed(0)}%
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-[9px] text-slate-500">KSI:</span>
            <span className="text-blue-400 font-mono font-bold text-[10px]">
              {data.metrics?.ksi}%
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-[9px] text-slate-500">V:</span>
            <span className="text-amber-400 font-mono font-bold text-[10px]">
              {data.metrics?.velocityScore}%
            </span>
          </div>
          
          {data.dri.riskScore !== undefined && (
            <div className="flex justify-between items-center">
              <span className="text-[9px] text-slate-500">Risk:</span>
              <span className={`font-mono font-bold text-[10px] ${
                data.dri.riskScore >= 60 ? 'text-red-400' :
                data.dri.riskScore >= 35 ? 'text-amber-400' :
                'text-emerald-400'
              }`}>
                {data.dri.riskScore}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }
  return null;
};

// ==========================================
// MAIN COMPONENT
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
  
  // ETA Tracking
  const [syncStartTime, setSyncStartTime] = useState<number | null>(null);
  const [eta, setEta] = useState<number | null>(null);
  const [avgBatchTime, setAvgBatchTime] = useState<number | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  
  const [viewMode, setViewMode] = useState<'TRIAGE' | 'MATRIX' | 'HEATMAP' | 'LOG'>('TRIAGE');
  const [matrixMode, setMatrixMode] = useState<'full' | 'critical'>('critical');
  const [search, setSearch] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('ALL');
  
  // Matrix filters
  const [tierFilter, setTierFilter] = useState<'RED' | 'YELLOW' | 'GREEN' | null>(null);
  const [derFilter, setDerFilter] = useState<string | null>(null);

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
  // BATCH SYNC CON ETA PREDICTIVO
  // ==========================================
  const runUpdateBatch = async () => {
    if (updating || isPaused) return;
    setUpdating(true);
    setSyncError(null);
    
    if (!syncStartTime) {
      setSyncStartTime(Date.now());
    }
    
    try {
      const batchStartTime = Date.now();
      const res = await fetch('/api/update-students');
      if (!res.ok) throw new Error('API failure');
      
      const data = await res.json();
      const batchDuration = Date.now() - batchStartTime;
      
      if (data.success) {
        setProgress(data.progress);
        setBatchStatus({
          current: data.currentBatch || Math.ceil(data.nextIndex / 50),
          total: data.totalBatches || 33,
          lastStudent: data.lastStudentName || ''
        });
        
        // Calcular ETA
        if (batchStatus.current > 0 && syncStartTime) {
          const elapsedTime = Date.now() - syncStartTime;
          const completedBatches = batchStatus.current;
          const currentAvgTime = elapsedTime / completedBatches;
          
          setAvgBatchTime(prev => {
            if (prev === null) return currentAvgTime;
            return (prev * 0.7) + (currentAvgTime * 0.3);
          });
          
          const remainingBatches = batchStatus.total - completedBatches;
          const estimatedRemaining = (avgBatchTime || currentAvgTime) * remainingBatches;
          setEta(Math.ceil(estimatedRemaining / 1000));
        }
        
        if (autoSync && data.progress < 100) {
          setTimeout(runUpdateBatch, 1500);
        } else if (data.progress >= 100) {
          setAutoSync(false);
          setLastSync(new Date());
          setSyncStartTime(null);
          setEta(null);
          setAvgBatchTime(null);
        }
      }
    } catch (err) {
      setSyncError('Sync paused: API unreachable');
      setAutoSync(false);
      setSyncStartTime(null);
      setEta(null);
    }
    
    setUpdating(false);
  };

  useEffect(() => { 
    if (autoSync && !updating && !isPaused) runUpdateBatch(); 
  }, [autoSync, isPaused]);

  useEffect(() => {
    if (!autoSync) {
      setSyncStartTime(null);
      setEta(null);
      setAvgBatchTime(null);
    }
  }, [autoSync]);

  // ==========================================
  // COMPUTED DATA
  // ==========================================
  const uniqueCourses = useMemo(() => 
    Array.from(new Set(students.map(s => s.currentCourse?.name).filter(Boolean))).sort(), 
  [students]);
  
  const criticalTopics = Object.keys(TOPIC_GRADE_MAP);

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
    
    return data.sort((a, b) => b.criticalCourses - a.criticalCourses).slice(0, 15);
  }, [students, uniqueCourses, criticalTopics]);

  const filtered = useMemo(() => students.filter(s => {
    const nameMatch = `${s.firstName} ${s.lastName} ${s.id}`.toLowerCase().includes(search.toLowerCase());
    const courseMatch = selectedCourse === 'ALL' || s.currentCourse?.name === selectedCourse;
    return nameMatch && courseMatch;
  }), [students, search, selectedCourse]);

  const redZone = useMemo(() => filtered.filter(s => s.dri.driTier === 'RED'), [filtered]);
  const yellowZone = useMemo(() => filtered.filter(s => s.dri.driTier === 'YELLOW' && !redZone.some(r => r.id === s.id)), [filtered, redZone]);
  const greenZone = useMemo(() => filtered.filter(s => !redZone.some(r => r.id === s.id) && !yellowZone.some(y => y.id === s.id)), [filtered, redZone, yellowZone]);

  const matrixData = useMemo(() => {
    let baseData = matrixMode === 'critical' ? [...redZone, ...yellowZone] : filtered;
    
    // Apply filters
    if (tierFilter) {
      baseData = baseData.filter(s => s.dri.driTier === tierFilter);
    }
    if (derFilter) {
      const [min, max] = derFilter.split('-').map(Number);
      baseData = baseData.filter(s => {
        if (s.dri.debtExposure === null) return false;
        return s.dri.debtExposure >= min && s.dri.debtExposure < max;
      });
    }
    
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
  }, [filtered, redZone, yellowZone, matrixMode, tierFilter, derFilter]);

  const stats = useMemo(() => ({
    total: students.length,
    atRisk: students.filter(s => s.dri.driTier === 'RED').length,
    attention: students.filter(s => s.dri.driTier === 'YELLOW').length,
    onTrack: students.filter(s => s.dri.driTier === 'GREEN').length,
    avgVelocity: Math.round(students.reduce((sum, s) => sum + (s.metrics?.velocityScore || 0), 0) / (students.length || 1)),
    avgRSR: Math.round(students.reduce((sum, s) => sum + ((s.metrics?.lmp || 0) * 100), 0) / (students.length || 1))
  }), [students]);

  // Mock trends (replace with real data from history)
  const trends = {
    atRisk: -5,
    attention: 2,
    onTrack: 3,
    avgVelocity: -2
  };

  if (loading) return (
    <div className="p-10 bg-black min-h-screen text-emerald-500 font-mono italic animate-pulse text-center uppercase tracking-widest">
      DRI COMMAND CENTER INITIALIZING...
    </div>
  );

  return (
    <div className="p-4 bg-[#050505] min-h-screen text-slate-300 font-sans">
      
      {/* ========================================== */}
      {/* HEADER */}
      {/* ========================================== */}
      <div className="flex flex-col md:flex-row justify-between items-end mb-6 border-b border-slate-800 pb-6 gap-4">
        <div>
          <h1 className="text-3xl font-black uppercase italic text-white tracking-tighter">DRI COMMAND CENTER</h1>
          <p className="text-xs text-indigo-400 font-bold tracking-[0.3em] uppercase">
            V5.0 Alpha Protocol • {students.length} / 1613 Estudiantes
          </p>
          
          <div className="flex gap-4 mt-2 text-[10px] text-slate-600 font-mono flex-wrap">
            <span>
              Avg RSR: <span className="text-emerald-500 font-bold">{stats.avgRSR}%</span>
            </span>
            <span className="text-slate-700">•</span>
            <span>
              Standard: <span className="text-indigo-500 font-bold">{DRI_CONFIG.ALPHA_WEEKLY_STANDARD} XP/week</span>
            </span>
            <span className="text-slate-700">•</span>
            <span>
              DER &gt; <span className="text-amber-500 font-bold">{DRI_CONFIG.DER_CRITICAL_THRESHOLD}%</span>
            </span>
            <span className="text-slate-700">•</span>
            <span>
              PDI &gt; <span className="text-red-500 font-bold">{DRI_CONFIG.PDI_CRITICAL_THRESHOLD}</span>
            </span>
          </div>
          
          {lastSync && (
            <p className="text-[10px] text-slate-600 font-mono mt-1">
              Last sync: {formatDistanceToNow(lastSync, { addSuffix: true })}
            </p>
          )}
        </div>
        
        <div className="flex flex-col items-end gap-3">
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
          
          <div className="flex gap-4 items-center bg-slate-900/40 p-3 px-4 rounded-xl border border-slate-800 relative overflow-hidden group min-w-[320px]">
            {autoSync && (
              <div 
                className="absolute bottom-0 left-0 h-0.5 bg-emerald-500 transition-all duration-700 shadow-[0_0_10px_#10b981]" 
                style={{ width: `${progress}%` }} 
              />
            )}
            
            <div className="text-[10px] font-mono flex-1">
              <div className="font-bold text-white flex items-center justify-between">
                <span>{students.length} / 1613</span>
                {autoSync && <span className="text-emerald-500 animate-pulse">●</span>}
              </div>
              
              {autoSync && (
                <div className="text-slate-500 mt-0.5 space-y-0.5">
                  <div className="flex justify-between items-center">
                    <span>Batch {batchStatus.current}/{batchStatus.total}</span>
                    <span className="text-white font-bold">{progress}%</span>
                  </div>
                  
                  {batchStatus.lastStudent && (
                    <div className="text-slate-600 truncate max-w-[180px]">
                      → {batchStatus.lastStudent}
                    </div>
                  )}
                  
                  {eta !== null && eta > 0 && (
                    <div className="text-indigo-400 font-bold mt-1 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>
                        ETA: {Math.floor(eta / 60)}:{(eta % 60).toString().padStart(2, '0')}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div className="flex gap-2">
              {autoSync && (
                <button 
                  onClick={() => setIsPaused(!isPaused)}
                  className="px-3 py-1.5 rounded-lg font-black text-[9px] tracking-widest uppercase transition-all bg-slate-800 text-slate-400 hover:bg-slate-700 border border-slate-700"
                  title={isPaused ? 'Resume sync' : 'Pause sync'}
                >
                  {isPaused ? '▶' : '⏸'}
                </button>
              )}
              
              <button 
                onClick={() => setAutoSync(!autoSync)} 
                disabled={updating && !autoSync}
                className={`px-4 py-1.5 rounded-lg font-black text-[9px] tracking-widest uppercase transition-all ${
                  autoSync 
                    ? 'bg-red-900/50 text-red-500 border border-red-500 animate-pulse' 
                    : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-lg disabled:opacity-50'
                }`}
              >
                {autoSync ? '🛑 STOP' : '⚡ AUTO SYNC'}
              </button>
            </div>
          </div>
          
          {isPaused && (
            <div className="bg-amber-900/20 border border-amber-500/50 px-4 py-2 rounded-lg text-[10px] text-amber-400 font-mono flex items-center gap-2">
              <span className="animate-pulse">⏸</span>
              <span>Sync paused • Click resume to continue</span>
            </div>
          )}
          
          {syncError && (
            <div className="bg-red-900/20 border border-red-500/50 px-4 py-2 rounded-lg text-[10px] text-red-400 font-mono flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{syncError}</span>
            </div>
          )}
        </div>
      </div>

      {/* ========================================== */}
      {/* STATS CARDS */}
      {/* ========================================== */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <MetricCard 
          title="🔴 Critical"
          value={stats.atRisk}
          color="red"
          subtitle={`${((stats.atRisk/stats.total)*100).toFixed(1)}% of total`}
          tooltip="Students with Risk Score ≥ 60 or DER > 20%"
          trend={trends.atRisk}
        />
        
        <MetricCard 
          title="🟡 Watch"
          value={stats.attention}
          color="amber"
          subtitle={`${((stats.attention/stats.total)*100).toFixed(1)}% of total`}
          tooltip="Students with Risk Score 35-59 or PDI > 1.5"
          trend={trends.attention}
        />
        
        <MetricCard 
          title="🟢 Optimal"
          value={stats.onTrack}
          color="emerald"
          subtitle={`${((stats.onTrack/stats.total)*100).toFixed(1)}% of total`}
          tooltip="Students with Risk Score < 35 and stable metrics"
          trend={trends.onTrack}
        />
        
        <MetricCard 
          title="Performance"
          value={`${stats.avgVelocity}%`}
          color="purple"
          subtitle={`${Math.round((stats.avgVelocity / 100) * DRI_CONFIG.ALPHA_WEEKLY_STANDARD)} XP/week avg`}
          tooltip={`Average velocity across all students (100% = ${DRI_CONFIG.ALPHA_WEEKLY_STANDARD} XP)`}
          trend={trends.avgVelocity}
        />
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
      {/* CONTENT AREA */}
      {/* ========================================== */}
      <div className="h-[calc(100vh-460px)] overflow-hidden">
        
        {/* TRIAGE VIEW */}
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
                      <StudentCard 
                        key={s.id}
                        student={s}
                        onClick={() => setSelectedStudent(s)}
                        borderColor={col.border}
                      />
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* MATRIX VIEW */}
        {viewMode === 'MATRIX' && (
          <div className="h-full w-full bg-slate-900/10 border border-slate-800 rounded-[2.5rem] p-8 relative overflow-hidden animate-in fade-in duration-500 shadow-2xl">
            
            <div className="absolute top-4 right-4 z-20 flex flex-wrap gap-2 max-w-2xl">
              <button
                onClick={() => setMatrixMode(m => m === 'full' ? 'critical' : 'full')}
                className="px-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-[10px] font-black uppercase text-slate-300 hover:bg-slate-800 transition-all whitespace-nowrap"
              >
                {matrixMode === 'full' 
                  ? `Critical Only (${redZone.length + yellowZone.length})` 
                  : `Show All (${filtered.length})`
                }
              </button>
              
              <select 
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-[10px] font-black uppercase text-slate-300 outline-none hover:bg-slate-800 transition-all"
              >
                <option value="ALL">All Courses</option>
                {uniqueCourses.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              
              <select 
                value={tierFilter || 'ALL'}
                onChange={(e) => setTierFilter(e.target.value === 'ALL' ? null : e.target.value as any)}
                className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-[10px] font-black uppercase text-slate-300 outline-none hover:bg-slate-800 transition-all"
              >
                <option value="ALL">All Tiers</option>
                <option value="RED">🔴 Critical</option>
                <option value="YELLOW">🟡 Watch</option>
                <option value="GREEN">🟢 Optimal</option>
              </select>
              
              <select 
                value={derFilter || 'ALL'}
                onChange={(e) => setDerFilter(e.target.value === 'ALL' ? null : e.target.value)}
                className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-[10px] font-black uppercase text-slate-300 outline-none hover:bg-slate-800 transition-all"
              >
                <option value="ALL">All DER</option>
                <option value="0-20">DER: 0-20%</option>
                <option value="20-40">DER: 20-40%</option>
                <option value="40-100">DER: &gt;40%</option>
              </select>
            </div>

            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 60, right: 30, bottom: 20, left: 0 }}>
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
                
                <ReferenceArea 
                  x1={0} x2={0.7} y1={0} y2={60} 
                  fill="#ef4444" 
                  fillOpacity={0.05}
                  label={{ 
                    value: '🚨 CRITICAL ZONE', 
                    position: 'insideTopLeft', 
                    fill: '#ef4444',
                    fontSize: 11,
                    fontWeight: 'bold',
                    offset: 10
                  }}
                />
                
                <ReferenceArea 
                  x1={0.7} x2={1} y1={60} y2={100} 
                  fill="#10b981" 
                  fillOpacity={0.05}
                  label={{ 
                    value: '✅ OPTIMAL ZONE', 
                    position: 'insideTopRight', 
                    fill: '#10b981',
                    fontSize: 11,
                    fontWeight: 'bold',
                    offset: 10
                  }}
                />
                
                <ReferenceLine 
                  x={0.7} 
                  stroke="#10b981" 
                  strokeDasharray="5 5" 
                  opacity={0.4}
                  label={{ 
                    value: 'RSR 70%', 
                    position: 'top',
                    fill: '#10b981',
                    fontSize: 9
                  }}
                />
                
                <ReferenceLine 
                  y={60} 
                  stroke="#ef4444" 
                  strokeDasharray="5 5" 
                  opacity={0.4}
                  label={{ 
                    value: 'KSI 60%', 
                    position: 'right',
                    fill: '#ef4444',
                    fontSize: 9
                  }}
                />
                
                <Scatter 
                  data={matrixData} 
                  onClick={(data) => {
                    const student = data.payload.isCluster ? data.payload.worstStudent : data.payload;
                    setSelectedStudent(student);
                  }}
                >
                  {matrixData.map((e, i) => {
                    const baseColor = driColorToHex(e.dri.driColor);
                    const isCluster = e.isCluster;
                    
                    let opacity = 0.7;
                    if (selectedCourse !== 'ALL' && e.currentCourse?.name !== selectedCourse) opacity = 0.15;
                    if (tierFilter && e.dri.driTier !== tierFilter) opacity = 0.15;
                    if (derFilter && e.dri.debtExposure !== null) {
                      const [min, max] = derFilter.split('-').map(Number);
                      if (e.dri.debtExposure < min || e.dri.debtExposure >= max) opacity = 0.15;
                    }
                    
                    return (
                      <Cell 
                        key={i} 
                        fill={baseColor}
                        fillOpacity={opacity}
                        r={isCluster ? 9 : 5}
                        stroke={isCluster ? '#fff' : opacity > 0.5 ? baseColor : 'none'}
                        strokeWidth={isCluster ? 2 : 0}
                        className="cursor-pointer hover:opacity-100 transition-all duration-300" 
                      />
                    );
                  })}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
            
            <div className="absolute bottom-4 left-4 bg-slate-900/95 border border-slate-700 p-4 rounded-xl text-[10px] backdrop-blur-md">
              <p className="font-black text-slate-400 mb-3 uppercase tracking-wider">Legend</p>
              
              <div className="space-y-2">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-slate-400" />
                    <span className="text-slate-400">Inactive</span>
                    <span className="text-slate-600 text-[9px] ml-auto">
                      ({students.filter(s => s.dri.driSignal === 'INACTIVE').length})
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <span className="text-red-400">Critical</span>
                    <span className="text-slate-600 text-[9px] ml-auto">({stats.atRisk})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-amber-500" />
                    <span className="text-amber-400">Watch</span>
                    <span className="text-slate-600 text-[9px] ml-auto">({stats.attention})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
                    <span className="text-emerald-400">Optimal</span>
                    <span className="text-slate-600 text-[9px] ml-auto">({stats.onTrack})</span>
                  </div>
                </div>
                
                <div className="border-t border-slate-700/50 my-2" />
                
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-indigo-500 border-2 border-white" />
                  <span className="text-slate-400">Cluster</span>
                  <span className="text-slate-600 text-[9px] ml-auto">(multiple)</span>
                </div>
                
                {(selectedCourse !== 'ALL' || tierFilter || derFilter) && (
                  <>
                    <div className="border-t border-slate-700/50 my-2" />
                    <div className="space-y-1">
                      <p className="text-slate-500 text-[9px] uppercase tracking-wider mb-1">Active Filters:</p>
                      {selectedCourse !== 'ALL' && (
                        <div className="text-indigo-400 text-[9px]">• Course: {selectedCourse}</div>
                      )}
                      {tierFilter && (
                        <div className="text-indigo-400 text-[9px]">• Tier: {tierFilter}</div>
                      )}
                      {derFilter && (
                        <div className="text-indigo-400 text-[9px]">• DER: {derFilter}%</div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
            
            <div className="absolute top-4 left-4 bg-slate-900/95 border border-slate-700 p-3 rounded-xl text-[10px] backdrop-blur-md">
              <p className="font-black text-slate-400 mb-2 uppercase tracking-wider">Visible</p>
              <div className="space-y-1">
                <div className="flex justify-between gap-4">
                  <span className="text-slate-500">Students:</span>
                  <span className="text-white font-mono font-bold">{matrixData.length}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-slate-500">Clusters:</span>
                  <span className="text-indigo-400 font-mono font-bold">
                    {matrixData.filter(d => d.isCluster).length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* HEATMAP VIEW */}
        {viewMode === 'HEATMAP' && (
           <div className="h-full w-full bg-slate-950 border border-slate-800 rounded-[2.5rem] p-8 overflow-hidden flex flex-col shadow-2xl animate-in fade-in duration-500">
              <div className="mb-6 flex justify-between items-end">
                <div>
                  <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    📊 Top 15 Critical Knowledge Components
                    <span className="px-2 py-0.5 bg-red-900/30 border border-red-500/50 rounded text-[9px] text-red-400 font-black">
                      PRIORITIZED
                    </span>
                  </h3>
                  <p className="text-[10px] text-slate-600 font-mono mt-1">
                    Sorted by number of courses with avg RSR &lt; 40% • Top 3 highlighted
                  </p>
                </div>
                
                <div className="flex items-center gap-4 text-[9px] text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-1.5 rounded-full bg-gradient-to-r from-red-500 to-amber-500" />
                    <span>High Priority</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-1.5 rounded-full bg-slate-700" />
                    <span>Low Priority</span>
                  </div>
                </div>
              </div>
              
              <div className="flex-1 overflow-auto custom-scrollbar">
                 <table className="w-full border-collapse">
                    <thead>
                       <tr>
                          <th className="sticky top-0 left-0 z-20 bg-slate-950 p-3 text-[8px] font-black text-slate-600 uppercase text-left border-b border-slate-800 min-w-[200px]">
                            Knowledge Component
                          </th>
                          {uniqueCourses.map(course => (
                             <th key={course} className="sticky top-0 z-10 bg-slate-950 p-3 text-[8px] font-black text-slate-500 uppercase border-b border-slate-800 min-w-[90px] font-mono">
                               {course}
                             </th>
                          ))}
                       </tr>
                    </thead>
                    <tbody>
                        {heatmapData.map((row, rowIndex) => (
                          <tr key={row.topic} className="hover:bg-slate-900/50 transition-colors group">
                             <td className="sticky left-0 z-10 bg-slate-950 p-3 border-r border-slate-800">
                               <div className="flex items-center gap-3">
                                 <div className="flex-shrink-0 w-16 h-1.5 rounded-full bg-slate-800/50 overflow-hidden relative group-hover:w-20 transition-all">
                                   <div 
                                     className="h-full bg-gradient-to-r from-red-500 via-amber-500 to-emerald-500 transition-all"
                                     style={{ 
                                       width: `${Math.min((row.criticalCourses / uniqueCourses.length) * 100, 100)}%`,
                                       background: row.criticalCourses > uniqueCourses.length * 0.3 
                                         ? 'linear-gradient(to right, #ef4444, #f59e0b)' 
                                         : row.criticalCourses > 0
                                         ? 'linear-gradient(to right, #f59e0b, #10b981)'
                                         : '#10b981'
                                     }}
                                   />
                                   
                                   <div className="absolute left-0 top-full mt-1 hidden group-hover:block bg-slate-900 border border-slate-700 px-2 py-1 rounded text-[9px] whitespace-nowrap shadow-xl z-50">
                                     {row.criticalCourses} / {uniqueCourses.length} courses critical
                                   </div>
                                 </div>
                                 
                                 <div className="flex-1 min-w-0">
                                   <div className="flex items-center gap-2">
                                     <span className="text-[10px] font-bold text-slate-300 uppercase italic truncate">
                                       {row.topic}
                                     </span>
                                     
                                     {rowIndex < 3 && (
                                       <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase whitespace-nowrap ${
                                         rowIndex === 0 ? 'bg-red-900/40 border border-red-500/60 text-red-300' :
                                         rowIndex === 1 ? 'bg-amber-900/40 border border-amber-500/60 text-amber-300' :
                                         'bg-yellow-900/40 border border-yellow-500/60 text-yellow-300'
                                       }`}>
                                         TOP {rowIndex + 1}
                                       </span>
                                     )}
                                   </div>
                                   
                                   <span className={`text-[9px] font-mono mt-0.5 block ${
                                     row.criticalCourses > uniqueCourses.length * 0.3 ? 'text-red-500' :
                                     row.criticalCourses > 0 ? 'text-amber-500' :
                                     'text-emerald-500'
                                   }`}>
                                     {row.criticalCourses === 0 ? 'No issues' : `${row.criticalCourses} critical course${row.criticalCourses > 1 ? 's' : ''}`}
                                   </span>
                                 </div>
                               </div>
                             </td>
                             
                             {row.courseStats.map((cell, idx) => (
                                <td key={idx} className="p-2 border border-slate-900">
                                   <div 
                                     className="h-10 rounded-md flex items-center justify-center text-[10px] font-mono font-black transition-all hover:scale-105 cursor-help group/cell"
                                     style={{ 
                                       backgroundColor: cell.avgLMP < 0.4 ? 'rgba(239, 68, 68, 0.2)' : 
                                                        cell.avgLMP < 0.7 ? 'rgba(245, 158, 11, 0.15)' : 
                                                        'rgba(16, 185, 129, 0.1)',
                                       border: `1px solid ${cell.avgLMP < 0.4 ? '#ef444433' : 
                                                             cell.avgLMP < 0.7 ? '#f59e0b33' : 
                                                             '#10b98133'}`
                                     }}
                                   >
                                     <span style={{ 
                                       color: cell.avgLMP < 0.4 ? '#fca5a5' : 
                                              cell.avgLMP < 0.7 ? '#fbbf24' : 
                                              '#6ee7b7',
                                       textShadow: '0 0 2px rgba(0,0,0,0.8)'
                                     }}>
                                       {(cell.avgLMP * 100).toFixed(0)}%
                                     </span>
                                     
                                     <div className="absolute hidden group-hover/cell:block bg-slate-900 border border-slate-700 px-2 py-1 rounded text-[9px] -translate-y-12 whitespace-nowrap shadow-xl z-50">
                                       {cell.course}: {(cell.avgLMP * 100).toFixed(1)}% avg
                                     </div>
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

        {/* LOG VIEW */}
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

      {selectedStudent && <StudentModal student={selectedStudent} onClose={() => setSelectedStudent(null)} />}
    </div>
  );
}
