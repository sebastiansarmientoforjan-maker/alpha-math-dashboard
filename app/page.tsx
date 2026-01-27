'use client';

import { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import KeenKTMatrix from '@/components/KeenKTMatrix';
import StudentModal from '@/components/StudentModal';
import HelpModal from '@/components/HelpModal';
import BulkActionsBar from '@/components/BulkActionsBar';
import { calculateTier1Metrics } from '@/lib/metrics';
import { calculateDRIMetrics } from '@/lib/dri-calculus';
import { DRI_CONFIG } from '@/lib/dri-config';
import { Student } from '@/types';
import { TOPIC_GRADE_MAP } from '@/lib/grade-maps';
import { formatDistanceToNow } from 'date-fns';

// ==========================================
// METRIC CARD COMPONENT WITH TOOLTIP
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
// STUDENT CARD MEMOIZED WITH SELECTION
// ==========================================
interface StudentCardProps {
  student: Student;
  onClick: () => void;
  borderColor: string;
  isSelected: boolean;
  onSelect: (id: string, selected: boolean) => void;
  selectionMode: boolean;
}

const StudentCard = memo(({ student, onClick, borderColor, isSelected, onSelect, selectionMode }: StudentCardProps) => {
  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(student.id, !isSelected);
  };

  return (
    <div 
      onClick={onClick}
      className={`p-4 bg-slate-900/80 rounded-2xl border-l-4 ${borderColor} cursor-pointer hover:scale-[1.02] transition-all group shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${isSelected ? 'ring-2 ring-indigo-500 bg-indigo-900/20' : ''}`}
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
    >
      <div className="flex justify-between items-start mb-1">
        <div className="flex items-center gap-2">
          {selectionMode && (
            <div 
              onClick={handleCheckboxClick}
              className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all cursor-pointer ${
                isSelected 
                  ? 'bg-indigo-500 border-indigo-500 text-white' 
                  : 'border-slate-600 hover:border-indigo-400'
              }`}
            >
              {isSelected && <span className="text-xs">✓</span>}
            </div>
          )}
          <h3 className="font-black text-white text-sm uppercase italic truncate w-36 group-hover:text-indigo-400">
            {student.firstName} {student.lastName}
          </h3>
        </div>
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
          {student.metrics.velocityScore}% v • KSI: {student.metrics.ksi !== null ? student.metrics.ksi + '%' : 'N/A'}
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
    prev.dri.riskScore === next.dri.riskScore &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.selectionMode === nextProps.selectionMode
  );
});

StudentCard.displayName = 'StudentCard';

// ==========================================
// COLUMN LOADING SKELETON
// ==========================================
function ColumnSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-28 bg-slate-800/50 rounded-2xl border border-slate-800/30" />
      ))}
    </div>
  );
}

// ==========================================
// ERROR BANNER COMPONENT
// ==========================================
interface ErrorBannerProps {
  message: string;
  onRetry: () => void;
  onDismiss: () => void;
}

function ErrorBanner({ message, onRetry, onDismiss }: ErrorBannerProps) {
  return (
    <div className="bg-red-900/30 border border-red-500/50 px-4 py-3 rounded-xl flex items-center justify-between gap-4 animate-in slide-in-from-top duration-300">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center text-red-400">
          ⚠️
        </div>
        <div>
          <p className="text-sm font-bold text-red-400">{message}</p>
          <p className="text-[10px] text-red-400/70">Check your connection and try again</p>
        </div>
      </div>
      <div className="flex gap-2">
        <button 
          onClick={onRetry}
          className="px-4 py-2 bg-red-500 hover:bg-red-400 text-white text-[10px] font-black uppercase rounded-lg transition-colors"
        >
          ↻ Retry
        </button>
        <button 
          onClick={onDismiss}
          className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-400 text-[10px] font-black uppercase rounded-lg transition-colors"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

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
  const [selectedStudentIndex, setSelectedStudentIndex] = useState<number>(-1);
  
  // Column refresh states
  const [refreshingColumns, setRefreshingColumns] = useState<Set<string>>(new Set());
  
  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectionMode, setSelectionMode] = useState(false);
  
  // Help Modal
  const [showHelp, setShowHelp] = useState(false);
  
  // ETA Tracking
  const [syncStartTime, setSyncStartTime] = useState<number | null>(null);
  const [eta, setEta] = useState<number | null>(null);
  const [avgBatchTime, setAvgBatchTime] = useState<number | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  
  const [viewMode, setViewMode] = useState<'TRIAGE' | 'MATRIX' | 'HEATMAP' | 'LOG'>('TRIAGE');
  const [search, setSearch] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('ALL');

  // ==========================================
  // KEYBOARD SHORTCUTS
  // ==========================================
  useEffect(() => {
    const handleKeyboard = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.key === '1' && !selectedStudent) setViewMode('TRIAGE');
      if (e.key === '2' && !selectedStudent) setViewMode('MATRIX');
      if (e.key === '3' && !selectedStudent) setViewMode('HEATMAP');
      if (e.key === '4' && !selectedStudent) setViewMode('LOG');
      
      if (e.key === 'Escape') {
        if (selectedStudent) {
          setSelectedStudent(null);
          setSelectedStudentIndex(-1);
        } else if (selectionMode) {
          setSelectionMode(false);
          setSelectedIds(new Set());
        }
      }
      
      if (e.key === '/' && !selectedStudent) {
        e.preventDefault();
        const searchInput = document.querySelector('input[placeholder*="SEARCH"]') as HTMLInputElement;
        searchInput?.focus();
      }
      
      if (e.key === '?' && !selectedStudent) {
        e.preventDefault();
        setShowHelp(true);
      }
      
      // Bulk select shortcut: Ctrl/Cmd + A
      if ((e.ctrlKey || e.metaKey) && e.key === 'a' && viewMode === 'TRIAGE' && !selectedStudent) {
        e.preventDefault();
        if (!selectionMode) {
          setSelectionMode(true);
        }
        // Select all visible students
        const allIds = new Set(filteredForNavigation.map(s => s.id));
        setSelectedIds(allIds);
      }
      
      if (selectedStudent && filteredForNavigation.length > 0) {
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
          e.preventDefault();
          navigateStudent('next');
        }
        if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
          e.preventDefault();
          navigateStudent('prev');
        }
      }
    };

    window.addEventListener('keydown', handleKeyboard);
    return () => window.removeEventListener('keydown', handleKeyboard);
  }, [selectedStudent, selectedStudentIndex, selectionMode, viewMode]);

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
      
      // Clear column refreshing states when data updates
      setRefreshingColumns(new Set());
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
  // BATCH SYNC WITH PREDICTIVE ETA
  // ==========================================
  const runUpdateBatch = async () => {
    if (updating || isPaused) return;
    setUpdating(true);
    setSyncError(null);
    
    // Set refreshing state for all columns
    setRefreshingColumns(new Set(['RED', 'YELLOW', 'GREEN']));
    
    if (!syncStartTime) {
      setSyncStartTime(Date.now());
    }
    
    try {
      const res = await fetch('/api/update-students');
      if (!res.ok) {
        throw new Error(`Server returned ${res.status}: ${res.statusText}`);
      }
      
      const data = await res.json();
      
      if (data.success) {
        setProgress(data.progress);
        setBatchStatus({
          current: data.currentBatch || Math.ceil(data.nextIndex / 50),
          total: data.totalBatches || 33,
          lastStudent: data.lastStudentName || ''
        });
        
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
          setRefreshingColumns(new Set());
        }
      } else {
        throw new Error(data.error || 'Unknown error occurred');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Connection failed';
      setSyncError(`Sync failed: ${errorMessage}`);
      setAutoSync(false);
      setSyncStartTime(null);
      setEta(null);
      setRefreshingColumns(new Set());
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
  // STOP SYNC WITH CONFIRMATION
  // ==========================================
  const handleStopSync = () => {
    if (progress > 0 && progress < 100) {
      const remainingStudents = Math.round((100 - progress) / 100 * 1613);
      const confirmed = window.confirm(
        `Sync is ${progress}% complete.\n\nStopping now will leave approximately ${remainingStudents} students with outdated data.\n\nAre you sure you want to stop?`
      );
      if (!confirmed) return;
    }
    setAutoSync(false);
    setIsPaused(false);
    setRefreshingColumns(new Set());
  };

  // ==========================================
  // RETRY SYNC
  // ==========================================
  const handleRetrySync = () => {
    setSyncError(null);
    setAutoSync(true);
  };

  // ==========================================
  // BULK SELECTION HANDLERS
  // ==========================================
  const handleSelectStudent = useCallback((id: string, selected: boolean) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(id);
      } else {
        newSet.delete(id);
      }
      return newSet;
    });
  }, []);

  const handleSelectAll = useCallback((tier: 'RED' | 'YELLOW' | 'GREEN') => {
    const tierStudents = tier === 'RED' ? redZone : tier === 'YELLOW' ? yellowZone : greenZone;
    const tierIds = tierStudents.map(s => s.id);
    
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      const allSelected = tierIds.every(id => newSet.has(id));
      
      if (allSelected) {
        tierIds.forEach(id => newSet.delete(id));
      } else {
        tierIds.forEach(id => newSet.add(id));
      }
      return newSet;
    });
  }, []);

  const handleClearSelection = useCallback(() => {
    setSelectedIds(new Set());
    setSelectionMode(false);
  }, []);

  const handleExportSelected = useCallback(() => {
    const selectedStudents = students.filter(s => selectedIds.has(s.id));
    const csvContent = [
      ['ID', 'Name', 'Course', 'RSR', 'KSI', 'Velocity', 'Risk Score', 'Tier'].join(','),
      ...selectedStudents.map(s => [
        s.id,
        `${s.firstName} ${s.lastName}`,
        s.currentCourse?.name || 'N/A',
        `${(s.metrics.lmp * 100).toFixed(0)}%`,
        s.metrics.ksi !== null ? `${s.metrics.ksi}%` : 'N/A',
        `${s.metrics.velocityScore}%`,
        s.dri.riskScore || 'N/A',
        s.dri.driTier
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `students-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [selectedIds, students]);

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

  const filteredForNavigation = useMemo(() => [...redZone, ...yellowZone, ...greenZone], [redZone, yellowZone, greenZone]);

  const stats = useMemo(() => ({
    total: students.length,
    atRisk: students.filter(s => s.dri.driTier === 'RED').length,
    attention: students.filter(s => s.dri.driTier === 'YELLOW').length,
    onTrack: students.filter(s => s.dri.driTier === 'GREEN').length,
    avgVelocity: Math.round(students.reduce((sum, s) => sum + (s.metrics?.velocityScore || 0), 0) / (students.length || 1)),
    avgRSR: Math.round(students.reduce((sum, s) => sum + ((s.metrics?.lmp || 0) * 100), 0) / (students.length || 1))
  }), [students]);

  const trends = { atRisk: -5, attention: 2, onTrack: 3, avgVelocity: -2 };

  // ==========================================
  // STUDENT NAVIGATION
  // ==========================================
  const navigateStudent = useCallback((direction: 'prev' | 'next') => {
    if (filteredForNavigation.length === 0) return;
    
    let newIndex = selectedStudentIndex;
    
    if (direction === 'next') {
      newIndex = selectedStudentIndex < filteredForNavigation.length - 1 
        ? selectedStudentIndex + 1 
        : 0;
    } else {
      newIndex = selectedStudentIndex > 0 
        ? selectedStudentIndex - 1 
        : filteredForNavigation.length - 1;
    }
    
    setSelectedStudentIndex(newIndex);
    setSelectedStudent(filteredForNavigation[newIndex]);
  }, [filteredForNavigation, selectedStudentIndex]);

  const handleStudentClick = useCallback((student: Student) => {
    if (selectionMode) {
      handleSelectStudent(student.id, !selectedIds.has(student.id));
    } else {
      const index = filteredForNavigation.findIndex(s => s.id === student.id);
      setSelectedStudentIndex(index);
      setSelectedStudent(student);
    }
  }, [filteredForNavigation, selectionMode, selectedIds, handleSelectStudent]);

  // Get selected students data
  const selectedStudentsData = useMemo(() => 
    students.filter(s => selectedIds.has(s.id)),
  [students, selectedIds]);

  if (loading) return (
    <div className="p-10 bg-black min-h-screen text-emerald-500 font-mono italic animate-pulse text-center uppercase tracking-widest">
      DRI COMMAND CENTER INITIALIZING...
    </div>
  );

  return (
    <div className="flex flex-col h-screen bg-[#050505] text-slate-300 font-sans overflow-hidden">
      
      {/* ========================================== */}
      {/* HEADER SECTION */}
      {/* ========================================== */}
      <div className="flex-shrink-0 p-6 pb-0 space-y-4">
        
        {/* ERROR BANNER */}
        {syncError && (
          <ErrorBanner 
            message={syncError}
            onRetry={handleRetrySync}
            onDismiss={() => setSyncError(null)}
          />
        )}
        
        {/* TOP BAR */}
        <div className="flex flex-col md:flex-row justify-between items-end border-b border-slate-800 pb-4 gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-black uppercase italic text-white tracking-tighter">DRI COMMAND CENTER</h1>
              <button 
                onClick={() => setShowHelp(true)}
                className="w-8 h-8 rounded-full border border-slate-700 text-slate-500 hover:text-white hover:border-indigo-500 transition-all flex items-center justify-center text-sm font-bold"
                title="Help & Keyboard Shortcuts (?)"
              >
                ?
              </button>
            </div>
            <p className="text-xs text-indigo-400 font-bold tracking-[0.3em] uppercase">
              V5.2 Alpha Protocol • {students.length} / 1613 Students
            </p>
            
            <div className="flex gap-4 mt-2 text-[10px] text-slate-600 font-mono flex-wrap">
              <span>Avg RSR: <span className="text-emerald-500 font-bold">{stats.avgRSR}%</span></span>
              <span className="text-slate-700">•</span>
              <span>Standard: <span className="text-indigo-500 font-bold">{DRI_CONFIG.ALPHA_WEEKLY_STANDARD} XP/week</span></span>
              <span className="text-slate-700">•</span>
              <span>DER &gt; <span className="text-amber-500 font-bold">{DRI_CONFIG.DER_CRITICAL_THRESHOLD}%</span></span>
            </div>
            
            {lastSync && (
              <p className="text-[10px] text-emerald-600 font-mono mt-1">
                ✓ Last sync: {formatDistanceToNow(lastSync, { addSuffix: true })}
              </p>
            )}
          </div>
          
          <div className="flex flex-col items-end gap-3">
            {/* VIEW TOGGLE WITH KEYBOARD HINTS */}
            <div className="flex bg-slate-900/50 p-1 rounded-xl border border-slate-800 font-black text-[10px] uppercase">
              {(['TRIAGE', 'MATRIX', 'HEATMAP', 'LOG'] as const).map((m, i) => (
                <button 
                  key={m} 
                  onClick={() => setViewMode(m)} 
                  className={`px-4 py-2 rounded-lg transition-all flex items-center gap-1 ${
                    viewMode === m 
                      ? 'bg-indigo-600 text-white shadow-lg' 
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {m}
                  <kbd className={`text-[8px] px-1 rounded ${viewMode === m ? 'bg-indigo-500' : 'bg-slate-800'}`}>{i + 1}</kbd>
                </button>
              ))}
            </div>
            
            {/* SYNC STATUS */}
            <div className="flex gap-4 items-center bg-slate-900/40 p-3 px-4 rounded-xl border border-slate-800 relative overflow-hidden group min-w-[320px]">
              {autoSync && <div className="absolute bottom-0 left-0 h-0.5 bg-emerald-500 transition-all duration-700 shadow-[0_0_10px_#10b981]" style={{ width: `${progress}%` }} />}
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
                    {batchStatus.lastStudent && <div className="text-slate-600 truncate max-w-[180px]">→ {batchStatus.lastStudent}</div>}
                    {eta !== null && eta > 0 && (
                      <div className="text-indigo-400 font-bold mt-1 flex items-center gap-1">
                        <span>ETA: {Math.floor(eta / 60)}:{(eta % 60).toString().padStart(2, '0')}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                {autoSync && (
                  <button 
                    onClick={() => setIsPaused(!isPaused)} 
                    className="px-3 py-1.5 rounded-lg font-black text-[9px] tracking-widest uppercase bg-slate-800 text-slate-400 hover:bg-slate-700 border border-slate-700"
                  >
                    {isPaused ? '▶' : '⏸'}
                  </button>
                )}
                <button 
                  onClick={() => autoSync ? handleStopSync() : setAutoSync(true)} 
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
          </div>
        </div>

        {/* METRICS ROW */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard 
            title={`🔴 Critical (${redZone.length})`} 
            value={stats.atRisk} 
            color="red" 
            subtitle={`${((stats.atRisk/stats.total)*100).toFixed(1)}% of total`} 
            tooltip="Risk Score ≥ 60, or DER > 20%, or RSR < 60%" 
            trend={trends.atRisk} 
          />
          <MetricCard 
            title={`🟡 Watch (${yellowZone.length})`} 
            value={stats.attention} 
            color="amber" 
            subtitle={`${((stats.attention/stats.total)*100).toFixed(1)}% of total`} 
            tooltip="Risk Score 35-59, or PDI > 1.5" 
            trend={trends.attention} 
          />
          <MetricCard 
            title={`🟢 Optimal (${greenZone.length})`} 
            value={stats.onTrack} 
            color="emerald" 
            subtitle={`${((stats.onTrack/stats.total)*100).toFixed(1)}% of total`} 
            tooltip="Risk Score < 35 with stable metrics" 
            trend={trends.onTrack} 
          />
          <MetricCard 
            title="Performance" 
            value={`${stats.avgVelocity}%`} 
            color="purple" 
            subtitle={`${Math.round((stats.avgVelocity / 100) * DRI_CONFIG.ALPHA_WEEKLY_STANDARD)} XP/week avg`} 
            tooltip="Average velocity across all students" 
            trend={trends.avgVelocity} 
          />
        </div>

        {/* SEARCH & FILTER ROW */}
        <div className="flex flex-wrap gap-4 items-center">
          <div className="relative flex-1 min-w-[300px]">
            <input 
              onChange={(e) => setSearch(e.target.value)} 
              placeholder="🔎 SEARCH STUDENT BY NAME OR ID..." 
              className="w-full bg-slate-900/40 border border-slate-800 rounded-2xl px-6 py-4 text-sm focus:border-indigo-500 outline-none font-mono transition-all" 
            />
            <kbd className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-slate-600 bg-slate-800 px-2 py-1 rounded">/</kbd>
          </div>
          
          {viewMode === 'TRIAGE' && (
            <button
              onClick={() => {
                setSelectionMode(!selectionMode);
                if (selectionMode) setSelectedIds(new Set());
              }}
              className={`px-4 py-3 rounded-xl font-black text-[10px] uppercase tracking-wider transition-all ${
                selectionMode 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-slate-900 border border-slate-800 text-slate-500 hover:text-white hover:border-indigo-500'
              }`}
            >
              {selectionMode ? '✓ Selection Mode ON' : '☐ Select Multiple'}
            </button>
          )}
          
          {viewMode !== 'MATRIX' && (
            <select 
              value={selectedCourse} 
              onChange={(e) => setSelectedCourse(e.target.value)} 
              className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-xs font-black uppercase text-slate-400 outline-none"
            >
              <option value="ALL">ALL COURSES</option>
              {uniqueCourses.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          )}
        </div>
      </div>

      {/* ========================================== */}
      {/* BULK ACTIONS BAR */}
      {/* ========================================== */}
      {selectionMode && selectedIds.size > 0 && (
        <BulkActionsBar
          selectedCount={selectedIds.size}
          selectedStudents={selectedStudentsData}
          onClear={handleClearSelection}
          onExport={handleExportSelected}
        />
      )}

      {/* ========================================== */}
      {/* DYNAMIC CONTENT AREA */}
      {/* ========================================== */}
      <div className="flex-1 min-h-0 p-6 pt-4">
        
        {/* TRIAGE VIEW */}
        {viewMode === 'TRIAGE' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full animate-in fade-in duration-500">
            {[
              { label: '🚨 Critical Ops', data: redZone, tier: 'RED' as const, border: 'border-red-500' },
              { label: '⚠️ Watch List', data: yellowZone, tier: 'YELLOW' as const, border: 'border-amber-500' },
              { label: '⚡ Stable Units', data: greenZone, tier: 'GREEN' as const, border: 'border-emerald-500' }
            ].map(col => {
              const isRefreshing = refreshingColumns.has(col.tier);
              const allSelected = col.data.length > 0 && col.data.every(s => selectedIds.has(s.id));
              const someSelected = col.data.some(s => selectedIds.has(s.id));
              
              return (
                <div key={col.tier} className="flex flex-col bg-slate-900/20 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl h-full">
                  <div className="flex-shrink-0 p-4 bg-slate-900/40 border-b border-slate-800 font-black text-xs uppercase tracking-widest flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      {selectionMode && (
                        <button
                          onClick={() => handleSelectAll(col.tier)}
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                            allSelected 
                              ? 'bg-indigo-500 border-indigo-500 text-white' 
                              : someSelected
                                ? 'bg-indigo-500/50 border-indigo-500 text-white'
                                : 'border-slate-600 hover:border-indigo-400'
                          }`}
                        >
                          {(allSelected || someSelected) && <span className="text-xs">✓</span>}
                        </button>
                      )}
                      <span className="text-slate-300">{col.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {isRefreshing && (
                        <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                      )}
                      <span className="bg-slate-800 text-slate-500 px-2 py-0.5 rounded font-mono">{col.data.length}</span>
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                    {isRefreshing && col.data.length === 0 ? (
                      <ColumnSkeleton />
                    ) : col.data.length === 0 ? (
                      <div className="text-center py-20 text-slate-600 italic text-xs">No students in this tier</div>
                    ) : (
                      col.data.map(s => (
                        <StudentCard 
                          key={s.id} 
                          student={s} 
                          onClick={() => handleStudentClick(s)} 
                          borderColor={col.border}
                          isSelected={selectedIds.has(s.id)}
                          onSelect={handleSelectStudent}
                          selectionMode={selectionMode}
                        />
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* MATRIX VIEW */}
        {viewMode === 'MATRIX' && (
          <div className="h-full w-full animate-in zoom-in-95 duration-300">
            <KeenKTMatrix 
              students={filtered} 
              onStudentClick={handleStudentClick} 
            />
          </div>
        )}

        {/* HEATMAP VIEW */}
        {viewMode === 'HEATMAP' && (
          <div className="h-full w-full bg-slate-950 border border-slate-800 rounded-[2.5rem] p-8 overflow-hidden flex flex-col shadow-2xl animate-in fade-in duration-500">
            <div className="flex-shrink-0 mb-6 flex justify-between items-end">
              <div>
                <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  📊 Top 15 Critical Knowledge Components
                  <span className="px-2 py-0.5 bg-red-900/30 border border-red-500/50 rounded text-[9px] text-red-400 font-black">PRIORITIZED</span>
                </h3>
                <p className="text-[10px] text-slate-600 font-mono mt-1">Sorted by number of courses with avg RSR &lt; 40% • Top 3 highlighted</p>
              </div>
              <div className="flex items-center gap-4 text-[9px] text-slate-600">
                <div className="flex items-center gap-1.5"><div className="w-3 h-1.5 rounded-full bg-gradient-to-r from-red-500 to-amber-500" /><span>High Priority</span></div>
                <div className="flex items-center gap-1.5"><div className="w-3 h-1.5 rounded-full bg-slate-700" /><span>Low Priority</span></div>
              </div>
            </div>
            <div className="flex-1 overflow-auto custom-scrollbar">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="sticky top-0 left-0 z-20 bg-slate-950 p-3 text-[8px] font-black text-slate-600 uppercase text-left border-b border-slate-800 min-w-[200px]">Knowledge Component</th>
                    {uniqueCourses.map(course => (
                      <th key={course} className="sticky top-0 z-10 bg-slate-950 p-3 text-[8px] font-black text-slate-500 uppercase border-b border-slate-800 min-w-[90px] font-mono">{course}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {heatmapData.map((row, rowIndex) => (
                    <tr key={row.topic} className="hover:bg-slate-900/50 transition-colors group">
                      <td className="sticky left-0 z-10 bg-slate-950 p-3 border-r border-slate-800">
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0 w-16 h-1.5 rounded-full bg-slate-800/50 overflow-hidden relative group-hover:w-20 transition-all">
                            <div className="h-full bg-gradient-to-r from-red-500 via-amber-500 to-emerald-500 transition-all" style={{ width: `${Math.min((row.criticalCourses / uniqueCourses.length) * 100, 100)}%` }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold text-slate-300 uppercase italic truncate">{row.topic}</span>
                              {rowIndex < 3 && (
                                <span className="px-1.5 py-0.5 bg-red-900/40 border border-red-500/60 rounded text-[8px] font-black uppercase text-red-300">
                                  TOP {rowIndex + 1}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      {row.courseStats.map((cell, idx) => (
                        <td key={idx} className="p-2 border border-slate-900">
                          <div 
                            className="h-10 rounded-md flex items-center justify-center text-[10px] font-mono font-black transition-all hover:scale-105 cursor-help" 
                            style={{ 
                              backgroundColor: cell.avgLMP < 0.4 ? 'rgba(239, 68, 68, 0.2)' : cell.avgLMP < 0.7 ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.1)', 
                              border: `1px solid ${cell.avgLMP < 0.4 ? '#ef444433' : cell.avgLMP < 0.7 ? '#f59e0b33' : '#10b98133'}` 
                            }}
                          >
                            <span style={{ color: cell.avgLMP < 0.4 ? '#fca5a5' : cell.avgLMP < 0.7 ? '#fbbf24' : '#6ee7b7' }}>
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

        {/* LOG VIEW */}
        {viewMode === 'LOG' && (
          <div className="h-full bg-slate-950 border border-slate-800 rounded-[2.5rem] p-8 overflow-y-auto custom-scrollbar animate-in fade-in duration-500 shadow-2xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {logs.map(log => (
                <div key={log.id} className="flex items-center justify-between p-5 bg-slate-900/30 rounded-2xl border border-slate-800/50 shadow-inner">
                  <div className="flex items-center gap-5">
                    <div className={`w-3 h-3 rounded-full ${log.type === 'coaching' ? 'bg-indigo-500 shadow-[0_0_10px_#6366f1]' : 'bg-red-500 shadow-[0_0_10px_#ef4444]'}`} />
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

      {/* STUDENT MODAL WITH NAVIGATION */}
      {selectedStudent && (
        <StudentModal 
          student={selectedStudent} 
          onClose={() => {
            setSelectedStudent(null);
            setSelectedStudentIndex(-1);
          }}
          onNavigate={navigateStudent}
          currentIndex={selectedStudentIndex}
          totalStudents={filteredForNavigation.length}
        />
      )}
      
      {/* HELP MODAL */}
      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
    </div>
  );
}
