'use client';

import { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import KeenKTMatrix from '@/components/KeenKTMatrix';
import StudentModal from '@/components/StudentModal';
import HelpModal from '@/components/HelpModal';
import BulkActionsBar from '@/components/BulkActionsBar';
import Tooltip from '@/components/Tooltip';
import AlertsDropdown from '@/components/AlertsDropdown';
import FollowUpReminders from '@/components/FollowUpReminders';
import LogViewWithTabs from '@/components/LogViewWithTabs';
import GroupAnalyticsView from '@/components/GroupAnalyticsView';
import DashboardTrendsView from '@/components/DashboardTrendsView';
import { calculateTier1Metrics } from '@/lib/metrics';
import { calculateDRIMetrics } from '@/lib/dri-calculus';
import { DRI_CONFIG } from '@/lib/dri-config';
import { Student } from '@/types';
import { TOPIC_GRADE_MAP } from '@/lib/grade-maps';
import { formatDistanceToNow } from 'date-fns';

const METRIC_TOOLTIPS = {
  rsr: 'Recent Success Rate: Proportion of recent tasks with >80% accuracy',
  ksi: 'Knowledge Stability Index: Consistency of performance over time',
  der: 'Debt Exposure Ratio: % of K-8 topics mastered during High School',
  pdi: 'Precision Decay Index: Ratio of recent errors to early errors',
  iroi: 'Investment ROI: XP earned per second of engagement',
  velocity: 'Weekly XP Progress: % of weekly XP goal achieved',
  risk: 'Risk Score: Composite score from multiple risk factors (0-100)',
  accuracy: 'Overall accuracy rate across all completed tasks',
  focus: 'Focus Integrity: Measure of sustained attention during sessions',
};

interface MetricCardProps {
  title: string;
  value: string | number;
  color: 'red' | 'amber' | 'emerald' | 'blue' | 'purple' | 'gold';
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
    purple: 'bg-purple-500/10 border-purple-500/30 text-purple-400',
    gold: 'bg-alpha-gold-dim border-alpha-gold/30 text-alpha-gold'
  };

  const activeClass = colorClasses[color] || colorClasses['blue'];

  return (
    <div 
      className={`relative border p-4 rounded-xl ${activeClass} transition-all hover:scale-[1.02] ${tooltip ? 'cursor-help' : ''}`}
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
      className={`p-4 bg-slate-900/80 rounded-2xl border-l-4 ${borderColor} cursor-pointer hover:scale-[1.02] transition-all group shadow-lg focus:outline-none focus:ring-2 focus:ring-alpha-gold ${isSelected ? 'ring-2 ring-alpha-gold bg-alpha-gold-dim' : ''}`}
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
                  ? 'bg-alpha-gold border-alpha-gold text-black' 
                  : 'border-slate-600 hover:border-alpha-gold'
              }`}
            >
              {isSelected && <span className="text-xs font-black">✓</span>}
            </div>
          )}
          <h3 className="font-black text-white text-sm uppercase italic truncate w-36 group-hover:text-alpha-gold transition-colors">
            {student.firstName} {student.lastName}
          </h3>
        </div>
        <Tooltip content={METRIC_TOOLTIPS.rsr}>
          <span className="text-[10px] font-mono font-bold text-slate-500 italic cursor-help">
            {(student.metrics.lmp * 100).toFixed(0)}% RSR
          </span>
        </Tooltip>
      </div>
      <p className="text-[9px] text-slate-400 font-bold uppercase mb-3 truncate italic">
        {student.currentCourse.name}
      </p>
      <div className="flex justify-between items-center text-[8px] font-black uppercase font-mono">
        <span className={student.dri.driColor}>{student.dri.driSignal}</span>
        <div className="flex items-center gap-2 text-slate-600">
          <Tooltip content={METRIC_TOOLTIPS.velocity}>
            <span className="cursor-help">{student.metrics.velocityScore}% v</span>
          </Tooltip>
          <span>•</span>
          <Tooltip content={METRIC_TOOLTIPS.ksi}>
            <span className="cursor-help">KSI: {student.metrics.ksi !== null ? student.metrics.ksi + '%' : 'N/A'}</span>
          </Tooltip>
        </div>
      </div>
      {student.dri.riskScore !== undefined && (
        <div className="mt-2 pt-2 border-t border-slate-800">
          <div className="flex justify-between items-center text-[9px]">
            <span className="text-slate-600">Risk:</span>
            <Tooltip content={METRIC_TOOLTIPS.risk}>
              <span className={`font-mono font-bold cursor-help ${
                student.dri.riskScore >= 60 ? 'text-red-400' : 
                student.dri.riskScore >= 35 ? 'text-amber-400' : 
                'text-emerald-400'
              }`}>
                {student.dri.riskScore}/100
              </span>
            </Tooltip>
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

function ColumnSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-28 bg-slate-800/50 rounded-2xl border border-slate-800/30" />
      ))}
    </div>
  );
}

interface ErrorBannerProps {
  message: string;
  onRetry: () => void;
  onDismiss: () => void;
}

function ErrorBanner({ message, onRetry, onDismiss }: ErrorBannerProps) {
  return (
    <div className="bg-red-900/30 border border-red-500/50 px-4 py-3 rounded-xl flex items-center justify-between gap-4 animate-in slide-in-from-top duration-300">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center text-red-400">⚠️</div>
        <div>
          <p className="text-sm font-bold text-red-400">{message}</p>
          <p className="text-[10px] text-red-400/70">Check your connection and try again</p>
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={onRetry} className="px-4 py-2 bg-red-500 hover:bg-red-400 text-white text-[10px] font-black uppercase rounded-lg transition-colors">↻ Retry</button>
        <button onClick={onDismiss} className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-400 text-[10px] font-black uppercase rounded-lg transition-colors">✕</button>
      </div>
    </div>
  );
}

function CompactHeader({ isCompact, onToggle }: { isCompact: boolean; onToggle: () => void; }) {
  return (
    <button onClick={onToggle} className="text-[9px] text-slate-600 hover:text-slate-400 transition-colors flex items-center gap-1" title={isCompact ? "Expand header" : "Compact header"}>
      {isCompact ? '⊞ Expand' : '⊟ Compact'}
    </button>
  );
}

function ActiveFiltersIndicator({ 
  search, 
  course,
  campus,
  grade,
  guide,
  onClearSearch, 
  onClearCourse,
  onClearCampus,
  onClearGrade,
  onClearGuide,
  onClearAll 
}: { 
  search: string; 
  course: string;
  campus: string;
  grade: string;
  guide: string;
  onClearSearch: () => void; 
  onClearCourse: () => void;
  onClearCampus: () => void;
  onClearGrade: () => void;
  onClearGuide: () => void;
  onClearAll: () => void; 
}) {
  const hasFilters = search || course !== 'ALL' || campus !== 'ALL' || grade !== 'ALL' || guide !== 'ALL';
  
  if (!hasFilters) return null;
  
  return (
    <div className="flex items-center gap-2 text-[9px] bg-slate-900/40 px-3 py-2 rounded-xl border border-slate-800 flex-wrap">
      <span className="text-slate-500">Active filters:</span>
      {search && (
        <span className="px-2 py-0.5 bg-alpha-navy border border-alpha-navy-light rounded-full text-blue-200 flex items-center gap-1">
          🔎 "{search.length > 15 ? search.substring(0, 15) + '...' : search}"
          <button onClick={onClearSearch} className="hover:text-white ml-1 text-[8px]">✕</button>
        </span>
      )}
      {course !== 'ALL' && (
        <span className="px-2 py-0.5 bg-purple-500/20 border border-purple-500/30 rounded-full text-purple-300 flex items-center gap-1">
          📚 {course}
          <button onClick={onClearCourse} className="hover:text-white ml-1 text-[8px]">✕</button>
        </span>
      )}
      {campus !== 'ALL' && (
        <span className="px-2 py-0.5 bg-blue-500/20 border border-blue-500/30 rounded-full text-blue-300 flex items-center gap-1">
          📍 {campus}
          <button onClick={onClearCampus} className="hover:text-white ml-1 text-[8px]">✕</button>
        </span>
      )}
      {grade !== 'ALL' && (
        <span className="px-2 py-0.5 bg-emerald-500/20 border border-emerald-500/30 rounded-full text-emerald-300 flex items-center gap-1">
          🎓 {grade}
          <button onClick={onClearGrade} className="hover:text-white ml-1 text-[8px]">✕</button>
        </span>
      )}
      {guide !== 'ALL' && (
        <span className="px-2 py-0.5 bg-amber-500/20 border border-amber-500/30 rounded-full text-amber-300 flex items-center gap-1">
          👤 {guide}
          <button onClick={onClearGuide} className="hover:text-white ml-1 text-[8px]">✕</button>
        </span>
      )}
      <button onClick={onClearAll} className="text-slate-500 hover:text-slate-300 ml-2" title="Clear all filters (c)">Clear all</button>
    </div>
  );
}

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
  const [refreshingColumns, setRefreshingColumns] = useState<Set<string>>(new Set());
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectionMode, setSelectionMode] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [compactHeader, setCompactHeader] = useState(false);
  const [syncStartTime, setSyncStartTime] = useState<number | null>(null);
  const [eta, setEta] = useState<number | null>(null);
  const [avgBatchTime, setAvgBatchTime] = useState<number | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [viewMode, setViewMode] = useState<'TRIAGE' | 'MATRIX' | 'HEATMAP' | 'LOG' | 'GROUP' | 'TRENDS'>('TRIAGE');
  
  const [search, setSearch] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('ALL');
  const [selectedCampus, setSelectedCampus] = useState('ALL');
  const [selectedGrade, setSelectedGrade] = useState('ALL');
  const [selectedGuide, setSelectedGuide] = useState('ALL');

  useEffect(() => {
    const handleKeyboard = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === '1' && !selectedStudent) setViewMode('TRIAGE');
      if (e.key === '2' && !selectedStudent) setViewMode('MATRIX');
      if (e.key === '3' && !selectedStudent) setViewMode('HEATMAP');
      if (e.key === '4' && !selectedStudent) setViewMode('LOG');
      if (e.key === '5' && !selectedStudent) setViewMode('GROUP');
      if (e.key === '6' && !selectedStudent) setViewMode('TRENDS');
      if (e.key === 'Escape') {
        if (selectedStudent) { setSelectedStudent(null); setSelectedStudentIndex(-1); }
        else if (selectionMode) { setSelectionMode(false); setSelectedIds(new Set()); }
      }
      if (e.key === '/' && !selectedStudent) { e.preventDefault(); (document.querySelector('input[placeholder*="SEARCH"]') as HTMLInputElement)?.focus(); }
      if (e.key === '?' && !selectedStudent) { e.preventDefault(); setShowHelp(true); }
      if (e.key === 'h' && !selectedStudent) setCompactHeader(prev => !prev);
      if (e.key === 'c' && !selectedStudent && !e.ctrlKey && !e.metaKey) { 
        if (search || selectedCourse !== 'ALL' || selectedCampus !== 'ALL' || selectedGrade !== 'ALL' || selectedGuide !== 'ALL') { 
          setSearch(''); 
          setSelectedCourse('ALL');
          setSelectedCampus('ALL');
          setSelectedGrade('ALL');
          setSelectedGuide('ALL');
        } 
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'a' && viewMode === 'TRIAGE' && !selectedStudent) {
        e.preventDefault();
        if (!selectionMode) setSelectionMode(true);
        setSelectedIds(new Set(filteredForNavigation.map(s => s.id)));
      }
      if (selectedStudent && filteredForNavigation.length > 0) {
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); navigateStudent('next'); }
        if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); navigateStudent('prev'); }
      }
    };
    window.addEventListener('keydown', handleKeyboard);
    return () => window.removeEventListener('keydown', handleKeyboard);
  }, [selectedStudent, selectedStudentIndex, selectionMode, viewMode, search, selectedCourse, selectedCampus, selectedGrade, selectedGuide]);

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
      setRefreshingColumns(new Set());
    });
    const unsubLogs = onSnapshot(query(collection(db, 'interventions'), orderBy('createdAt', 'desc'), limit(20)), (snapshot) => {
      setLogs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => { unsubStudents(); unsubLogs(); };
  }, []);

  const runUpdateBatch = async () => {
    if (updating || isPaused) return;
    setUpdating(true);
    setSyncError(null);
    setRefreshingColumns(new Set(['RED', 'YELLOW', 'GREEN']));
    if (!syncStartTime) setSyncStartTime(Date.now());
    try {
      const res = await fetch('/api/update-students');
      if (!res.ok) throw new Error(`Server returned ${res.status}: ${res.statusText}`);
      const data = await res.json();
      if (data.success) {
        setProgress(data.progress);
        setBatchStatus({ current: data.currentBatch || Math.ceil(data.nextIndex / 50), total: data.totalBatches || 33, lastStudent: data.lastStudentName || '' });
        if (batchStatus.current > 0 && syncStartTime) {
          const elapsedTime = Date.now() - syncStartTime;
          const completedBatches = batchStatus.current;
          const currentAvgTime = elapsedTime / completedBatches;
          setAvgBatchTime(prev => prev === null ? currentAvgTime : (prev * 0.7) + (currentAvgTime * 0.3));
          const remainingBatches = batchStatus.total - completedBatches;
          setEta(Math.ceil((avgBatchTime || currentAvgTime) * remainingBatches / 1000));
        }
        if (autoSync && data.progress < 100) setTimeout(runUpdateBatch, 1500);
        else if (data.progress >= 100) { setAutoSync(false); setLastSync(new Date()); setSyncStartTime(null); setEta(null); setAvgBatchTime(null); setRefreshingColumns(new Set()); }
      } else throw new Error(data.error || 'Unknown error occurred');
    } catch (err: any) {
      setSyncError(`Sync failed: ${err.message || 'Connection failed'}`);
      setAutoSync(false); setSyncStartTime(null); setEta(null); setRefreshingColumns(new Set());
    }
    setUpdating(false);
  };

  useEffect(() => { if (autoSync && !updating && !isPaused) runUpdateBatch(); }, [autoSync, isPaused]);
  useEffect(() => { if (!autoSync) { setSyncStartTime(null); setEta(null); setAvgBatchTime(null); } }, [autoSync]);

  const handleStopSync = () => {
    if (progress > 0 && progress < 100) {
      const remainingStudents = Math.round((100 - progress) / 100 * 1613);
      if (!window.confirm(`Sync is ${progress}% complete.\n\nStopping now will leave approximately ${remainingStudents} students with outdated data.\n\nAre you sure you want to stop?`)) return;
    }
    setAutoSync(false); setIsPaused(false); setRefreshingColumns(new Set());
  };

  const handleRetrySync = () => { setSyncError(null); setAutoSync(true); };

  const handleSelectStudent = useCallback((id: string, selected: boolean) => {
    setSelectedIds(prev => { const newSet = new Set(prev); selected ? newSet.add(id) : newSet.delete(id); return newSet; });
  }, []);

  const handleSelectAll = useCallback((tier: 'RED' | 'YELLOW' | 'GREEN') => {
    const tierStudents = tier === 'RED' ? redZone : tier === 'YELLOW' ? yellowZone : greenZone;
    const tierIds = tierStudents.map(s => s.id);
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      const allSelected = tierIds.every(id => newSet.has(id));
      tierIds.forEach(id => allSelected ? newSet.delete(id) : newSet.add(id));
      return newSet;
    });
  }, []);

  const handleClearSelection = useCallback(() => { setSelectedIds(new Set()); setSelectionMode(false); }, []);

  const handleExportSelected = useCallback(() => {
    const selectedStudents = students.filter(s => selectedIds.has(s.id));
    const csvContent = [
      ['ID', 'Name', 'Course', 'Campus', 'Grade', 'Guide', 'RSR', 'KSI', 'Velocity', 'Risk Score', 'Tier'].join(','),
      ...selectedStudents.map(s => [
        s.id, 
        `${s.firstName} ${s.lastName}`, 
        s.currentCourse?.name || 'N/A',
        s.dimensions?.campusDisplayName || 'Online',
        s.dimensions?.grade || 'N/A',
        s.dimensions?.guide || 'No Guide',
        `${(s.metrics.lmp * 100).toFixed(0)}%`, 
        s.metrics.ksi !== null ? `${s.metrics.ksi}%` : 'N/A', 
        `${s.metrics.velocityScore}%`, 
        s.dri.riskScore || 'N/A', 
        s.dri.driTier
      ].join(','))
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `students-export-${new Date().toISOString().split('T')[0]}.csv`; a.click();
    URL.revokeObjectURL(url);
  }, [selectedIds, students]);

  const clearFilters = useCallback(() => { 
    setSearch(''); 
    setSelectedCourse('ALL');
    setSelectedCampus('ALL');
    setSelectedGrade('ALL');
    setSelectedGuide('ALL');
  }, []);

  const uniqueCourses = useMemo(() => Array.from(new Set(students.map(s => s.currentCourse?.name).filter(Boolean))).sort(), [students]);
  
  const uniqueCampuses = useMemo(() => {
    const campuses = new Set<string>();
    students.forEach(s => {
      if (s.dimensions?.campusDisplayName) {
        campuses.add(s.dimensions.campusDisplayName);
      } else {
        campuses.add('Online (No Campus)');
      }
    });
    return Array.from(campuses).sort();
  }, [students]);

  const uniqueGrades = useMemo(() => {
    const grades = new Set<string>();
    students.forEach(s => {
      if (s.dimensions?.grade) {
        grades.add(`Grade ${s.dimensions.grade}`);
      }
    });
    return Array.from(grades).sort();
  }, [students]);

  const uniqueGuides = useMemo(() => {
    const guides = new Set<string>();
    students.forEach(s => {
      if (s.dimensions?.guide) {
        guides.add(s.dimensions.guide);
      } else if (s.dimensions) {
        guides.add('No Guide');
      }
    });
    return Array.from(guides).sort();
  }, [students]);

  const criticalTopics = Object.keys(TOPIC_GRADE_MAP);

  const heatmapData = useMemo(() => {
    const data = criticalTopics.map(topic => {
      const courseStats = uniqueCourses.map(course => {
        const relevant = students.filter(s => s.currentCourse?.name === course);
        const avgLMP = relevant.reduce((acc, s) => acc + (s.metrics?.lmp || 0), 0) / Math.max(1, relevant.length);
        return { course, avgLMP };
      });
      return { topic, courseStats, criticalCourses: courseStats.filter(c => c.avgLMP < 0.4).length };
    });
    return data.sort((a, b) => b.criticalCourses - a.criticalCourses).slice(0, 15);
  }, [students, uniqueCourses, criticalTopics]);

  const filtered = useMemo(() => students.filter(s => {
    const nameMatch = `${s.firstName} ${s.lastName} ${s.id}`.toLowerCase().includes(search.toLowerCase());
    const courseMatch = selectedCourse === 'ALL' || s.currentCourse?.name === selectedCourse;
    
    let campusMatch = selectedCampus === 'ALL';
    if (!campusMatch) {
      if (selectedCampus === 'Online (No Campus)') {
        campusMatch = !s.dimensions?.campusDisplayName;
      } else {
        campusMatch = s.dimensions?.campusDisplayName === selectedCampus;
      }
    }
    
    let gradeMatch = selectedGrade === 'ALL';
    if (!gradeMatch) {
      const gradeNum = parseInt(selectedGrade.replace('Grade ', ''));
      gradeMatch = s.dimensions?.grade === gradeNum;
    }
    
    let guideMatch = selectedGuide === 'ALL';
    if (!guideMatch) {
      if (selectedGuide === 'No Guide') {
        guideMatch = !s.dimensions?.guide;
      } else {
        guideMatch = s.dimensions?.guide === selectedGuide;
      }
    }
    
    return nameMatch && courseMatch && campusMatch && gradeMatch && guideMatch;
  }), [students, search, selectedCourse, selectedCampus, selectedGrade, selectedGuide]);

  const redZone = useMemo(() => filtered.filter(s => s.dri.driTier === 'RED'), [filtered]);
  const yellowZone = useMemo(() => filtered.filter(s => s.dri.driTier === 'YELLOW' && !redZone.some(r => r.id === s.id)), [filtered, redZone]);
  const greenZone = useMemo(() => filtered.filter(s => !redZone.some(r => r.id === s.id) && !yellowZone.some(y => y.id === s.id)), [filtered, redZone, yellowZone]);
  const filteredForNavigation = useMemo(() => [...redZone, ...yellowZone, ...greenZone], [redZone, yellowZone, greenZone]);

  const stats = useMemo(() => ({
    total: filtered.length,
    atRisk: redZone.length,
    attention: yellowZone.length,
    onTrack: greenZone.length,
    avgVelocity: Math.round(filtered.reduce((sum, s) => sum + (s.metrics?.velocityScore || 0), 0) / (filtered.length || 1)),
    avgRSR: Math.round(filtered.reduce((sum, s) => sum + ((s.metrics?.lmp || 0) * 100), 0) / (filtered.length || 1))
  }), [filtered, redZone, yellowZone, greenZone]);

  const trends = { atRisk: -5, attention: 2, onTrack: 3, avgVelocity: -2 };

  const navigateStudent = useCallback((direction: 'prev' | 'next') => {
    if (filteredForNavigation.length === 0) return;
    let newIndex = selectedStudentIndex;
    if (direction === 'next') newIndex = selectedStudentIndex < filteredForNavigation.length - 1 ? selectedStudentIndex + 1 : 0;
    else newIndex = selectedStudentIndex > 0 ? selectedStudentIndex - 1 : filteredForNavigation.length - 1;
    setSelectedStudentIndex(newIndex);
    setSelectedStudent(filteredForNavigation[newIndex]);
  }, [filteredForNavigation, selectedStudentIndex]);

  const handleStudentClick = useCallback((student: Student) => {
    if (selectionMode) handleSelectStudent(student.id, !selectedIds.has(student.id));
    else { setSelectedStudentIndex(filteredForNavigation.findIndex(s => s.id === student.id)); setSelectedStudent(student); }
  }, [filteredForNavigation, selectionMode, selectedIds, handleSelectStudent]);

  const selectedStudentsData = useMemo(() => students.filter(s => selectedIds.has(s.id)), [students, selectedIds]);

  if (loading) return <div className="p-10 bg-alpha-navy-bg min-h-screen text-alpha-gold font-mono italic animate-pulse text-center uppercase tracking-widest">DRI COMMAND CENTER INITIALIZING...</div>;

  return (
    <div className="flex flex-col h-screen bg-alpha-navy-bg text-slate-300 font-sans overflow-hidden">
      <div className={`flex-shrink-0 p-6 pb-0 space-y-4 transition-all duration-300 ${compactHeader ? 'space-y-2' : ''}`}>
        {syncError && <ErrorBanner message={syncError} onRetry={handleRetrySync} onDismiss={() => setSyncError(null)} />}
        <div className={`flex flex-col md:flex-row justify-between items-end border-b border-slate-800 pb-4 gap-4 ${compactHeader ? 'pb-2' : ''}`}>
          <div className="flex items-center gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className={`font-black uppercase italic text-white tracking-tighter transition-all ${compactHeader ? 'text-xl' : 'text-3xl'}`}>
                  DRI COMMAND <span className="text-alpha-gold">CENTER</span>
                </h1>
                
                {/* ALERTAS */}
                <AlertsDropdown onStudentClick={(studentId) => {
                  const student = students.find(s => s.id === studentId);
                  if (student) { setSelectedStudentIndex(filteredForNavigation.findIndex(s => s.id === studentId)); setSelectedStudent(student); }
                }} />
                
                {/* NUEVO: FOLLOW-UP REMINDERS */}
                <FollowUpReminders onStudentClick={(studentId) => {
                  const student = students.find(s => s.id === studentId);
                  if (student) { setSelectedStudentIndex(filteredForNavigation.findIndex(s => s.id === studentId)); setSelectedStudent(student); }
                }} />

                <button onClick={() => setShowHelp(true)} className="w-7 h-7 rounded-full border border-slate-700 text-slate-500 hover:text-white hover:border-alpha-gold transition-all flex items-center justify-center text-xs font-bold" title="Help & Keyboard Shortcuts (?)">?</button>
                <CompactHeader isCompact={compactHeader} onToggle={() => setCompactHeader(!compactHeader)} />
              </div>
              {!compactHeader && (
                <>
                  <p className="text-xs text-alpha-gold font-bold tracking-[0.3em] uppercase">V5.5 Alpha • {students.length} Students • {filtered.length} Filtered</p>
                  <div className="flex gap-3 mt-1 text-[9px] text-slate-600 font-mono flex-wrap">
                    <Tooltip content={METRIC_TOOLTIPS.rsr}><span className="cursor-help">RSR: <span className="text-emerald-500 font-bold">{stats.avgRSR}%</span></span></Tooltip>
                    <span className="text-slate-700">•</span>
                    <span>Std: <span className="text-alpha-gold font-bold">{DRI_CONFIG.ALPHA_WEEKLY_STANDARD} XP/wk</span></span>
                  </div>
                </>
              )}
              {lastSync && <p className={`text-emerald-600 font-mono ${compactHeader ? 'text-[8px]' : 'text-[10px] mt-1'}`}>✓ Synced {formatDistanceToNow(lastSync, { addSuffix: true })}</p>}
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className={`flex bg-slate-900/50 p-1 rounded-xl border border-slate-800 font-black uppercase ${compactHeader ? 'text-[8px]' : 'text-[10px]'}`}>
              {(['TRIAGE', 'MATRIX', 'HEATMAP', 'LOG', 'GROUP', 'TRENDS'] as const).map((m, i) => (
                <button key={m} onClick={() => setViewMode(m)} className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${viewMode === m ? 'bg-alpha-gold text-black shadow-lg shadow-alpha-gold/20' : 'text-slate-500 hover:text-slate-300'}`}>
                  {m}<kbd className={`text-[7px] px-1 rounded ${viewMode === m ? 'bg-black/20 text-black' : 'bg-slate-800'}`}>{i + 1}</kbd>
                </button>
              ))}
            </div>
            <div className={`flex gap-3 items-center bg-slate-900/40 px-3 rounded-xl border border-slate-800 relative overflow-hidden ${compactHeader ? 'py-1.5' : 'py-2'}`}>
              {autoSync && <div className="absolute bottom-0 left-0 h-0.5 bg-emerald-500 transition-all duration-700" style={{ width: `${progress}%` }} />}
              <div className="text-[9px] font-mono">
                <span className="text-white font-bold">{students.length}</span><span className="text-slate-600">/1613</span>
                {autoSync && <span className="ml-2 text-slate-500">B{batchStatus.current}/{batchStatus.total}{eta && <span className="text-alpha-gold ml-1">~{Math.floor(eta / 60)}m</span>}</span>}
              </div>
              <div className="flex gap-1">
                {autoSync && <button onClick={() => setIsPaused(!isPaused)} className="px-2 py-1 rounded text-[8px] bg-slate-800 text-slate-400 hover:bg-slate-700">{isPaused ? '▶' : '⏸'}</button>}
                <button onClick={() => autoSync ? handleStopSync() : setAutoSync(true)} disabled={updating && !autoSync} className={`px-3 py-1 rounded text-[8px] font-black uppercase transition-all ${autoSync ? 'bg-red-900/50 text-red-500 border border-red-500' : 'bg-emerald-600 text-white hover:bg-emerald-500'}`}>{autoSync ? 'STOP' : 'SYNC'}</button>
              </div>
            </div>
          </div>
        </div>
        {!compactHeader && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <MetricCard title="🔴 Critical" value={stats.atRisk} color="red" subtitle={`${((stats.atRisk/Math.max(stats.total, 1))*100).toFixed(1)}%`} tooltip="Risk Score ≥ 60, DER > 20%, or RSR < 60%" trend={trends.atRisk} />
            <MetricCard title="🟡 Watch" value={stats.attention} color="amber" subtitle={`${((stats.attention/Math.max(stats.total, 1))*100).toFixed(1)}%`} tooltip="Risk Score 35-59, or PDI > 1.5" trend={trends.attention} />
            <MetricCard title="🟢 Optimal" value={stats.onTrack} color="emerald" subtitle={`${((stats.onTrack/Math.max(stats.total, 1))*100).toFixed(1)}%`} tooltip="Risk Score < 35 with stable metrics" trend={trends.onTrack} />
            <MetricCard title="Avg Velocity" value={`${stats.avgVelocity}%`} color="gold" subtitle={`${Math.round((stats.avgVelocity / 100) * DRI_CONFIG.ALPHA_WEEKLY_STANDARD)} XP/wk`} tooltip={METRIC_TOOLTIPS.velocity} trend={trends.avgVelocity} />
          </div>
        )}
        
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[280px]">
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="🔎 SEARCH STUDENT..." className={`w-full bg-slate-900/40 border border-slate-800 rounded-xl px-4 text-sm focus:border-alpha-gold outline-none font-mono transition-all ${compactHeader ? 'py-2' : 'py-3'}`} />
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] text-slate-600 bg-slate-800 px-1.5 py-0.5 rounded">/</kbd>
          </div>
          
          {viewMode === 'TRIAGE' && (
            <button onClick={() => { setSelectionMode(!selectionMode); if (selectionMode) setSelectedIds(new Set()); }} className={`px-3 py-2 rounded-xl font-black text-[9px] uppercase tracking-wider transition-all ${selectionMode ? 'bg-alpha-gold text-black' : 'bg-slate-900 border border-slate-800 text-slate-500 hover:text-white hover:border-alpha-gold'}`}>{selectionMode ? '✓ Selecting' : '☐ Select'}</button>
          )}
          
          <select value={selectedCampus} onChange={(e) => setSelectedCampus(e.target.value)} className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-[10px] font-black uppercase text-slate-400 outline-none hover:border-slate-600 transition-colors">
            <option value="ALL">📍 ALL CAMPUSES</option>
            {uniqueCampuses.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          
          <select value={selectedGrade} onChange={(e) => setSelectedGrade(e.target.value)} className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-[10px] font-black uppercase text-slate-400 outline-none hover:border-slate-600 transition-colors">
            <option value="ALL">🎓 ALL GRADES</option>
            {uniqueGrades.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
          
          <select value={selectedGuide} onChange={(e) => setSelectedGuide(e.target.value)} className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-[10px] font-black uppercase text-slate-400 outline-none hover:border-slate-600 transition-colors">
            <option value="ALL">👤 ALL GUIDES</option>
            {uniqueGuides.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
          
          <select value={selectedCourse} onChange={(e) => setSelectedCourse(e.target.value)} className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-[10px] font-black uppercase text-slate-400 outline-none hover:border-slate-600 transition-colors">
            <option value="ALL">📚 ALL COURSES</option>
            {uniqueCourses.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        
        <ActiveFiltersIndicator 
          search={search} 
          course={selectedCourse}
          campus={selectedCampus}
          grade={selectedGrade}
          guide={selectedGuide}
          onClearSearch={() => setSearch('')} 
          onClearCourse={() => setSelectedCourse('ALL')}
          onClearCampus={() => setSelectedCampus('ALL')}
          onClearGrade={() => setSelectedGrade('ALL')}
          onClearGuide={() => setSelectedGuide('ALL')}
          onClearAll={clearFilters} 
        />
      </div>

      {selectionMode && selectedIds.size > 0 && <BulkActionsBar selectedCount={selectedIds.size} selectedStudents={selectedStudentsData} onClear={handleClearSelection} onExport={handleExportSelected} />}

      <div className="flex-1 min-h-0 p-6 pt-4">
        {viewMode === 'TRIAGE' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full animate-in fade-in duration-500">
            {[
              { label: '🚨 Critical', data: redZone, tier: 'RED' as const, border: 'border-red-500' },
              { label: '⚠️ Watch', data: yellowZone, tier: 'YELLOW' as const, border: 'border-amber-500' },
              { label: '⚡ Optimal', data: greenZone, tier: 'GREEN' as const, border: 'border-emerald-500' }
            ].map(col => {
              const isRefreshing = refreshingColumns.has(col.tier);
              const allSelected = col.data.length > 0 && col.data.every(s => selectedIds.has(s.id));
              const someSelected = col.data.some(s => selectedIds.has(s.id));
              return (
                <div key={col.tier} className="flex flex-col bg-slate-900/20 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl h-full">
                  <div className="flex-shrink-0 p-3 bg-slate-900/40 border-b border-slate-800 font-black text-xs uppercase tracking-widest flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      {selectionMode && (
                        <button onClick={() => handleSelectAll(col.tier)} className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${allSelected ? 'bg-alpha-gold border-alpha-gold text-black' : someSelected ? 'bg-alpha-gold/50 border-alpha-gold text-black' : 'border-slate-600 hover:border-alpha-gold'}`}>
                          {(allSelected || someSelected) && <span className="text-[8px]">✓</span>}
                        </button>
                      )}
                      <span className="text-slate-300">{col.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {isRefreshing && <div className="w-3 h-3 border-2 border-alpha-gold border-t-transparent rounded-full animate-spin" />}
                      <span className="bg-slate-800 text-slate-500 px-2 py-0.5 rounded text-[9px] font-mono">{col.data.length}</span>
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                    {isRefreshing && col.data.length === 0 ? <ColumnSkeleton /> : col.data.length === 0 ? (
                      <div className="text-center py-20 text-slate-600 italic text-xs">{(search || selectedCourse !== 'ALL' || selectedCampus !== 'ALL' || selectedGrade !== 'ALL' || selectedGuide !== 'ALL') ? 'No students match filters' : 'No students'}</div>
                    ) : col.data.map(s => <StudentCard key={s.id} student={s} onClick={() => handleStudentClick(s)} borderColor={col.border} isSelected={selectedIds.has(s.id)} onSelect={handleSelectStudent} selectionMode={selectionMode} />)}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {viewMode === 'MATRIX' && <div className="h-full w-full animate-in zoom-in-95 duration-300"><KeenKTMatrix students={filtered} onStudentClick={handleStudentClick} /></div>}

        {viewMode === 'HEATMAP' && (
          <div className="h-full w-full bg-slate-950 border border-slate-800 rounded-[2.5rem] p-8 overflow-hidden flex flex-col shadow-2xl animate-in fade-in duration-500">
            <div className="flex-shrink-0 mb-6 flex justify-between items-end">
              <div>
                <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">📊 Top 15 Critical Knowledge Components<span className="px-2 py-0.5 bg-red-900/30 border border-red-500/50 rounded text-[9px] text-red-400 font-black">PRIORITIZED</span></h3>
                <p className="text-[10px] text-slate-600 font-mono mt-1">Sorted by courses with avg RSR &lt; 40%</p>
              </div>
              <div className="flex items-center gap-4 text-[9px] text-slate-600">
                <div className="flex items-center gap-1.5"><div className="w-3 h-1.5 rounded-full bg-gradient-to-r from-red-500 to-amber-500" /><span>High</span></div>
                <div className="flex items-center gap-1.5"><div className="w-3 h-1.5 rounded-full bg-slate-700" /><span>Low</span></div>
              </div>
            </div>
            <div className="flex-1 overflow-auto custom-scrollbar">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="sticky top-0 left-0 z-20 bg-slate-950 p-3 text-[8px] font-black text-slate-600 uppercase text-left border-b border-slate-800 min-w-[200px]">Component</th>
                    {uniqueCourses.map(course => <th key={course} className="sticky top-0 z-10 bg-slate-950 p-3 text-[8px] font-black text-slate-500 uppercase border-b border-slate-800 min-w-[90px] font-mono">{course}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {heatmapData.map((row, rowIndex) => (
                    <tr key={row.topic} className="hover:bg-slate-900/50 transition-colors group">
                      <td className="sticky left-0 z-10 bg-slate-950 p-3 border-r border-slate-800">
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0 w-16 h-1.5 rounded-full bg-slate-800/50 overflow-hidden"><div className="h-full bg-gradient-to-r from-red-500 via-amber-500 to-emerald-500" style={{ width: `${Math.min((row.criticalCourses / uniqueCourses.length) * 100, 100)}%` }} /></div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-slate-300 uppercase italic truncate">{row.topic}</span>
                            {rowIndex < 3 && <span className="px-1.5 py-0.5 bg-red-900/40 border border-red-500/60 rounded text-[8px] font-black text-red-300">#{rowIndex + 1}</span>}
                          </div>
                        </div>
                      </td>
                      {row.courseStats.map((cell, idx) => (
                        <td key={idx} className="p-2 border border-slate-900">
                          <Tooltip content={`${cell.course}: ${(cell.avgLMP * 100).toFixed(1)}% avg RSR`}>
                            <div className="h-10 rounded-md flex items-center justify-center text-[10px] font-mono font-black transition-all hover:scale-105 cursor-help" style={{ backgroundColor: cell.avgLMP < 0.4 ? 'rgba(239, 68, 68, 0.2)' : cell.avgLMP < 0.7 ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.1)', border: `1px solid ${cell.avgLMP < 0.4 ? '#ef444433' : cell.avgLMP < 0.7 ? '#f59e0b33' : '#10b98133'}` }}>
                              <span style={{ color: cell.avgLMP < 0.4 ? '#fca5a5' : cell.avgLMP < 0.7 ? '#fbbf24' : '#6ee7b7' }}>{(cell.avgLMP * 100).toFixed(0)}%</span>
                            </div>
                          </Tooltip>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {viewMode === 'LOG' && <LogViewWithTabs logs={logs} />}

        {viewMode === 'GROUP' && <GroupAnalyticsView students={filtered} />}

        {viewMode === 'TRENDS' && <DashboardTrendsView />}
      </div>

      {selectedStudent && <StudentModal student={selectedStudent} onClose={() => { setSelectedStudent(null); setSelectedStudentIndex(-1); }} onNavigate={navigateStudent} currentIndex={selectedStudentIndex} totalStudents={filteredForNavigation.length} />}
      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
    </div>
  );
}
