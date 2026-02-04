'use client';

import { useState, useEffect, useMemo } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { calculateTier1Metrics } from '@/lib/metrics';
import { calculateDRIMetrics } from '@/lib/dri-calculus';
import { Student } from '@/types';
import Tooltip from '@/components/Tooltip';
import KeenKTMatrix from '@/components/KeenKTMatrix';
import CoachInterventionModal from '@/components/CoachInterventionModal';
import AlertsDropdown from '@/components/AlertsDropdown';
import FollowUpReminders from '@/components/FollowUpReminders';
import { TOPIC_GRADE_MAP } from '@/lib/grade-maps';
import HelpModal from '@/components/HelpModal';
import BulkActionsBar from '@/components/BulkActionsBar';

const METRIC_TOOLTIPS = {
  rsr: 'Recent Success Rate: Proportion of recent tasks with >80% accuracy',
  ksi: 'Knowledge Stability Index: Consistency of performance over time',
  velocity: 'Weekly XP Progress: % of weekly XP goal achieved',
  risk: 'Risk Score: Composite score from multiple risk factors (0-100)',
};

interface StudentCardProps {
  student: Student;
  onClick: () => void;
  selectionMode?: boolean;
  isSelected?: boolean;
  onSelect?: (studentId: string, selected: boolean) => void;
}

function StudentCard({ student, onClick, selectionMode = false, isSelected = false, onSelect }: StudentCardProps) {
  const handleClick = () => {
    if (selectionMode && onSelect) {
      onSelect(student.id, !isSelected);
    } else {
      onClick();
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`p-3 glass-card rounded-xl cursor-pointer hover:scale-[1.02] transition-all group relative ${
        isSelected ? 'border-2 border-indigo-500 bg-indigo-500/10' : 'hover:border-alpha-gold'
      }`}
    >
      {selectionMode && (
        <div className="absolute top-2 right-2 z-10">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => {
              e.stopPropagation();
              onSelect?.(student.id, e.target.checked);
            }}
            className="w-4 h-4 rounded border-2 border-slate-600 bg-slate-900 checked:bg-indigo-500 checked:border-indigo-500 cursor-pointer"
          />
        </div>
      )}
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-black text-white text-sm uppercase italic truncate group-hover:text-alpha-gold transition-colors pr-6">
          {student.firstName} {student.lastName}
        </h3>
        <Tooltip content={METRIC_TOOLTIPS.rsr}>
          <span className="text-[10px] font-mono font-bold text-slate-500 italic cursor-help">
            {(student.metrics.lmp * 100).toFixed(0)}% RSR
          </span>
        </Tooltip>
      </div>
      
      <p className="text-[9px] text-slate-400 font-bold uppercase mb-2 truncate">
        {student.currentCourse?.name || 'No Course'}
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
        <div className="mt-2 pt-2 border-t border-slate-800/50">
          <div className="flex justify-between items-center text-[9px]">
            <span className="text-slate-600">Risk:</span>
            <Tooltip content={METRIC_TOOLTIPS.risk}>
              <span className={`font-mono font-bold cursor-help ${
                student.dri.riskScore >= 60 ? 'text-risk-red' : 
                student.dri.riskScore >= 35 ? 'text-risk-amber' : 
                'text-risk-emerald'
              }`}>
                {student.dri.riskScore}/100
              </span>
            </Tooltip>
          </div>
        </div>
      )}
    </div>
  );
}

function ColumnSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-24 bg-slate-800/30 rounded-xl" />
      ))}
    </div>
  );
}

// Active Filters Indicator Component
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
      <button onClick={onClearAll} className="text-slate-500 hover:text-slate-300 ml-2" title="Clear all filters">Clear all</button>
    </div>
  );
}

export default function TowerPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedStudentIndex, setSelectedStudentIndex] = useState(-1);
  const [showInterventionModal, setShowInterventionModal] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  // View mode state
  const [viewMode, setViewMode] = useState<'MATRIX' | 'TRIAGE' | 'HEATMAP'>('TRIAGE');

  // Bulk selection state
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Filter states
  const [search, setSearch] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('ALL');
  const [selectedCampus, setSelectedCampus] = useState('ALL');
  const [selectedGrade, setSelectedGrade] = useState('ALL');
  const [selectedGuide, setSelectedGuide] = useState('ALL');

  // Firebase real-time connection
  useEffect(() => {
    const unsubscribe = onSnapshot(query(collection(db, 'students')), (snapshot) => {
      const data = snapshot.docs.map(doc => {
        const s = { id: doc.id, ...doc.data() } as any;
        const metrics = calculateTier1Metrics(s, s.activity);
        const dri = calculateDRIMetrics({ ...s, metrics });
        return { ...s, metrics, dri };
      }) as Student[];
      setStudents(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Get unique values for dropdowns
  const uniqueCourses = useMemo(() => 
    Array.from(new Set(students.map(s => s.currentCourse?.name).filter(Boolean))).sort()
  , [students]);
  
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

  // Heatmap data calculation
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

  // Filtered students
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

  // Triage Stack: Separate by risk tier from FILTERED students
  const redZone = useMemo(() => 
    filtered.filter(s => s.dri.driTier === 'RED')
      .sort((a, b) => (b.dri.riskScore || 0) - (a.dri.riskScore || 0))
  , [filtered]);

  const yellowZone = useMemo(() => 
    filtered.filter(s => s.dri.driTier === 'YELLOW')
      .sort((a, b) => (b.dri.riskScore || 0) - (a.dri.riskScore || 0))
  , [filtered]);

  const greenZone = useMemo(() =>
    filtered.filter(s => !redZone.some(r => r.id === s.id) && !yellowZone.some(y => y.id === s.id))
      .sort((a, b) => (a.metrics.lmp - b.metrics.lmp))
  , [filtered, redZone, yellowZone]);

  // For student navigation in modal
  const filteredForNavigation = useMemo(() => [...redZone, ...yellowZone, ...greenZone], [redZone, yellowZone, greenZone]);

  const stats = useMemo(() => ({
    total: filtered.length,
    critical: redZone.length,
    watch: yellowZone.length,
    optimal: greenZone.length,
    avgRiskScore: Math.round(filtered.reduce((sum, s) => sum + (s.dri.riskScore || 0), 0) / Math.max(filtered.length, 1)),
  }), [filtered, redZone, yellowZone, greenZone]);

  const clearFilters = () => {
    setSearch('');
    setSelectedCourse('ALL');
    setSelectedCampus('ALL');
    setSelectedGrade('ALL');
    setSelectedGuide('ALL');
  };

  // Selection handlers
  const handleSelectStudent = (studentId: string, selected: boolean) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (selected) newSet.add(studentId);
      else newSet.delete(studentId);
      return newSet;
    });
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
    setSelectionMode(false);
  };

  // CSV export
  const exportToCSV = () => {
    const selectedStudentsData = students.filter(s => selectedIds.has(s.id));
    const headers = ['ID', 'First Name', 'Last Name', 'Course', 'RSR', 'Risk Score', 'Velocity', 'KSI', 'DRI Tier', 'DRI Signal'];
    const rows = selectedStudentsData.map(s => [
      s.id,
      s.firstName,
      s.lastName,
      s.currentCourse?.name || 'N/A',
      (s.metrics.lmp * 100).toFixed(1) + '%',
      s.dri.riskScore || 'N/A',
      s.metrics.velocityScore + '%',
      s.metrics.ksi !== null ? s.metrics.ksi + '%' : 'N/A',
      s.dri.driTier,
      s.dri.driSignal
    ]);
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tower-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Navigate between students in modal
  const navigateStudent = (direction: 'prev' | 'next') => {
    if (filteredForNavigation.length === 0) return;
    let newIndex = selectedStudentIndex;
    if (direction === 'next') {
      newIndex = selectedStudentIndex < filteredForNavigation.length - 1 ? selectedStudentIndex + 1 : 0;
    } else {
      newIndex = selectedStudentIndex > 0 ? selectedStudentIndex - 1 : filteredForNavigation.length - 1;
    }
    setSelectedStudentIndex(newIndex);
    setSelectedStudent(filteredForNavigation[newIndex]);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyboard = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in input fields
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      // View mode shortcuts
      if (e.key === '1' && !selectedStudent) setViewMode('MATRIX');
      if (e.key === '2' && !selectedStudent) setViewMode('TRIAGE');
      if (e.key === '3' && !selectedStudent) setViewMode('HEATMAP');

      // Selection mode toggle
      if (e.key === 's' && !selectedStudent && !e.ctrlKey && !e.metaKey) {
        setSelectionMode(prev => !prev);
        if (selectionMode) setSelectedIds(new Set());
      }

      // Select all in Triage view
      if ((e.ctrlKey || e.metaKey) && e.key === 'a' && viewMode === 'TRIAGE' && !selectedStudent) {
        e.preventDefault();
        if (!selectionMode) setSelectionMode(true);
        setSelectedIds(new Set(filteredForNavigation.map(s => s.id)));
      }

      // Clear filters
      if (e.key === 'c' && !selectedStudent && !e.ctrlKey && !e.metaKey) {
        if (search || selectedCourse !== 'ALL' || selectedCampus !== 'ALL' || selectedGrade !== 'ALL' || selectedGuide !== 'ALL') {
          clearFilters();
        }
      }

      // Help modal
      if (e.key === '?' && !selectedStudent) {
        e.preventDefault();
        setShowHelp(true);
      }

      // Escape key
      if (e.key === 'Escape') {
        if (selectedStudent) {
          setSelectedStudent(null);
          setSelectedStudentIndex(-1);
        } else if (selectionMode) {
          setSelectionMode(false);
          setSelectedIds(new Set());
        } else if (showHelp) {
          setShowHelp(false);
        }
      }

      // Student navigation in modal
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
  }, [selectedStudent, selectedStudentIndex, viewMode, search, selectedCourse, selectedCampus, selectedGrade, selectedGuide, showHelp, selectionMode, filteredForNavigation]);

  if (loading) {
    return (
      <div className="min-h-screen bg-alpha-navy-bg flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-pulse">🏰</div>
          <p className="text-alpha-gold font-bold uppercase tracking-widest">
            Initializing Tower...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-alpha-navy-bg p-6 lg:p-12">
      
      {/* Header */}
      <header className="mb-8 border-b border-white/10 pb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-black text-white uppercase tracking-ultra">
              THE TOWER
            </h1>
            <p className="text-alpha-gold text-[10px] font-bold tracking-widest uppercase mt-1">
              Strategic Analytics • {students.length} Students • {filtered.length} Filtered
            </p>
          </div>
          <div className="flex items-center gap-4">
            <AlertsDropdown onStudentClick={(studentId) => {
              const student = students.find(s => s.id === studentId);
              if (student) setSelectedStudent(student);
            }} />
            
            <FollowUpReminders onStudentClick={(studentId) => {
              const student = students.find(s => s.id === studentId);
              if (student) setSelectedStudent(student);
            }} />
            
            <a 
              href="/field"
              className="px-4 py-2 bg-alpha-navy-light hover:bg-alpha-navy-surface border border-alpha-navy-light text-slate-400 hover:text-alpha-gold text-[10px] font-black uppercase rounded-lg transition-all"
            >
              → The Field
            </a>
            <a 
              href="/"
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-500 hover:text-white text-[10px] font-black uppercase rounded-lg transition-all"
            >
              ← Legacy Dashboard
            </a>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="glass-card p-3 rounded-xl border-l-4 border-risk-red">
            <div className="text-[9px] text-slate-500 uppercase font-bold mb-1">Critical</div>
            <div className="text-2xl font-black text-risk-red">{stats.critical}</div>
            <div className="text-[8px] text-slate-600 mt-1">{((stats.critical/Math.max(stats.total, 1))*100).toFixed(1)}%</div>
          </div>
          <div className="glass-card p-3 rounded-xl border-l-4 border-risk-amber">
            <div className="text-[9px] text-slate-500 uppercase font-bold mb-1">Watch</div>
            <div className="text-2xl font-black text-risk-amber">{stats.watch}</div>
            <div className="text-[8px] text-slate-600 mt-1">{((stats.watch/Math.max(stats.total, 1))*100).toFixed(1)}%</div>
          </div>
          <div className="glass-card p-3 rounded-xl border-l-4 border-risk-emerald">
            <div className="text-[9px] text-slate-500 uppercase font-bold mb-1">Optimal</div>
            <div className="text-2xl font-black text-risk-emerald">{stats.optimal}</div>
            <div className="text-[8px] text-slate-600 mt-1">{((stats.optimal/Math.max(stats.total, 1))*100).toFixed(1)}%</div>
          </div>
          <div className="glass-card p-3 rounded-xl border-l-4 border-alpha-gold">
            <div className="text-[9px] text-slate-500 uppercase font-bold mb-1">Avg Risk</div>
            <div className="text-2xl font-black text-alpha-gold">{stats.avgRiskScore}</div>
            <div className="text-[8px] text-slate-600 mt-1">of 100</div>
          </div>
        </div>

        {/* Filters Row */}
        <div className="flex flex-wrap gap-3 items-center mb-4">
          <div className="relative flex-1 min-w-[280px]">
            <input 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              placeholder="🔎 SEARCH STUDENT..." 
              className="w-full bg-slate-900/40 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-alpha-gold outline-none font-mono transition-all"
            />
          </div>
          
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

        {/* Active Filters Indicator */}
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

        {/* View Mode Toggle */}
        <div className="flex gap-2 mt-6 items-center">
          {/* Selection Mode Toggle */}
          <button
            onClick={() => {
              setSelectionMode(prev => !prev);
              if (selectionMode) setSelectedIds(new Set());
            }}
            className={`px-4 py-2 text-[10px] font-black uppercase rounded-lg transition-all ${
              selectionMode
                ? 'bg-indigo-600 text-white border-2 border-indigo-500'
                : 'bg-slate-900 text-slate-500 hover:text-white border border-slate-800'
            }`}
          >
            {selectionMode ? '✓ Selection Mode' : '☐ Select'}
          </button>

          <div className="w-px h-6 bg-slate-800" />

          <button
            onClick={() => setViewMode('MATRIX')}
            className={`px-4 py-2 text-[10px] font-black uppercase rounded-lg transition-all ${
              viewMode === 'MATRIX'
                ? 'bg-alpha-gold text-black'
                : 'bg-slate-900 text-slate-500 hover:text-white border border-slate-800'
            }`}
          >
            📊 Matrix
          </button>
          <button
            onClick={() => setViewMode('TRIAGE')}
            className={`px-4 py-2 text-[10px] font-black uppercase rounded-lg transition-all ${
              viewMode === 'TRIAGE'
                ? 'bg-alpha-gold text-black'
                : 'bg-slate-900 text-slate-500 hover:text-white border border-slate-800'
            }`}
          >
            🏥 Triage
          </button>
          <button
            onClick={() => setViewMode('HEATMAP')}
            className={`px-4 py-2 text-[10px] font-black uppercase rounded-lg transition-all ${
              viewMode === 'HEATMAP'
                ? 'bg-alpha-gold text-black'
                : 'bg-slate-900 text-slate-500 hover:text-white border border-slate-800'
            }`}
          >
            🔥 Heatmap
          </button>
        </div>
      </header>

      {/* Bulk Actions Bar */}
      {selectionMode && selectedIds.size > 0 && (
        <BulkActionsBar
          selectedCount={selectedIds.size}
          selectedStudents={students.filter(s => selectedIds.has(s.id))}
          onClear={clearSelection}
          onExport={exportToCSV}
        />
      )}

      {/* Matrix Section */}
      {viewMode === 'MATRIX' && (
        <section className="mb-12">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-black text-white uppercase">
              MASTERY VS. CONSISTENCY
            </h2>
            <div className="text-[9px] text-slate-600 uppercase tracking-widest">
              Interactive scatter plot • {filtered.length} students plotted
            </div>
          </div>
          <div className="glass-card rounded-3xl p-4 h-[700px] overflow-hidden">
            <KeenKTMatrix students={filtered} onStudentClick={(student) => setSelectedStudent(student)} />
          </div>
        </section>
      )}

      {/* Triage Stack */}
      {viewMode === 'TRIAGE' && (
        <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-black text-white uppercase">
            TRIAGE STACK
          </h2>
          <div className="text-[9px] text-slate-600 uppercase tracking-widest">
            Real-time • Auto-sorted by risk score
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Red Zone */}
          <div className="glass-card rounded-2xl overflow-hidden border-l-4 border-risk-red">
            <div className="p-4 bg-risk-red/10 border-b border-risk-red/30">
              <div className="flex justify-between items-center">
                <h3 className="text-risk-red font-black text-sm uppercase flex items-center gap-2">
                  🚨 CRITICAL
                </h3>
                <span className="bg-risk-red/20 text-risk-red px-2 py-1 rounded text-[9px] font-black">
                  {redZone.length}
                </span>
              </div>
              <p className="text-[8px] text-risk-red/70 mt-1">Risk Score ≥ 60 • Immediate action required</p>
            </div>
            <div className="p-4 max-h-[600px] overflow-y-auto custom-scrollbar space-y-3">
              {loading ? (
                <ColumnSkeleton />
              ) : redZone.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-4xl mb-2">✓</div>
                  <p className="text-slate-600 text-xs italic">No critical students</p>
                </div>
              ) : (
                redZone.map(student => (
                  <StudentCard
                    key={student.id}
                    student={student}
                    onClick={() => {
                      setSelectedStudentIndex(filteredForNavigation.findIndex(s => s.id === student.id));
                      setSelectedStudent(student);
                    }}
                    selectionMode={selectionMode}
                    isSelected={selectedIds.has(student.id)}
                    onSelect={handleSelectStudent}
                  />
                ))
              )}
            </div>
          </div>

          {/* Amber Zone */}
          <div className="glass-card rounded-2xl overflow-hidden border-l-4 border-risk-amber">
            <div className="p-4 bg-risk-amber/10 border-b border-risk-amber/30">
              <div className="flex justify-between items-center">
                <h3 className="text-risk-amber font-black text-sm uppercase flex items-center gap-2">
                  ⚠️ WATCH
                </h3>
                <span className="bg-risk-amber/20 text-risk-amber px-2 py-1 rounded text-[9px] font-black">
                  {yellowZone.length}
                </span>
              </div>
              <p className="text-[8px] text-risk-amber/70 mt-1">Risk Score 35-59 • Monitor closely</p>
            </div>
            <div className="p-4 max-h-[600px] overflow-y-auto custom-scrollbar space-y-3">
              {loading ? (
                <ColumnSkeleton />
              ) : yellowZone.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-4xl mb-2">✓</div>
                  <p className="text-slate-600 text-xs italic">No students on watch</p>
                </div>
              ) : (
                yellowZone.map(student => (
                  <StudentCard
                    key={student.id}
                    student={student}
                    onClick={() => {
                      setSelectedStudentIndex(filteredForNavigation.findIndex(s => s.id === student.id));
                      setSelectedStudent(student);
                    }}
                    selectionMode={selectionMode}
                    isSelected={selectedIds.has(student.id)}
                    onSelect={handleSelectStudent}
                  />
                ))
              )}
            </div>
          </div>

          {/* Green Zone */}
          <div className="glass-card rounded-2xl overflow-hidden border-l-4 border-risk-emerald">
            <div className="p-4 bg-risk-emerald/10 border-b border-risk-emerald/30">
              <div className="flex justify-between items-center">
                <h3 className="text-risk-emerald font-black text-sm uppercase flex items-center gap-2">
                  ⚡ OPTIMAL
                </h3>
                <span className="bg-risk-emerald/20 text-risk-emerald px-2 py-1 rounded text-[9px] font-black">
                  {greenZone.length}
                </span>
              </div>
              <p className="text-[8px] text-risk-emerald/70 mt-1">Risk Score &lt; 35 • Stable performance</p>
            </div>
            <div className="p-4 max-h-[600px] overflow-y-auto custom-scrollbar space-y-3">
              {loading ? (
                <ColumnSkeleton />
              ) : greenZone.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-4xl mb-2">⚠️</div>
                  <p className="text-slate-600 text-xs italic">No optimal students</p>
                </div>
              ) : (
                greenZone.slice(0, 50).map(student => (
                  <StudentCard
                    key={student.id}
                    student={student}
                    onClick={() => {
                      setSelectedStudentIndex(filteredForNavigation.findIndex(s => s.id === student.id));
                      setSelectedStudent(student);
                    }}
                    selectionMode={selectionMode}
                    isSelected={selectedIds.has(student.id)}
                    onSelect={handleSelectStudent}
                  />
                ))
              )}
              {greenZone.length > 50 && (
                <div className="text-center py-4 border-t border-slate-800">
                  <p className="text-[9px] text-slate-600">
                    +{greenZone.length - 50} more students
                  </p>
                </div>
              )}
            </div>
          </div>

        </div>
        </section>
      )}

      {/* Heatmap View */}
      {viewMode === 'HEATMAP' && (
        <section>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-black text-white uppercase">
              KNOWLEDGE COMPONENT HEATMAP
            </h2>
            <div className="text-[9px] text-slate-600 uppercase tracking-widest">
              Top 15 critical topics • Color-coded by avg RSR
            </div>
          </div>
          <div className="glass-card rounded-3xl p-8 overflow-hidden flex flex-col h-[700px]">
            <div className="flex-shrink-0 mb-6 flex justify-between items-end">
              <div>
                <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  📊 Top 15 Critical Knowledge Components
                  <span className="px-2 py-0.5 bg-red-900/30 border border-red-500/50 rounded text-[9px] text-red-400 font-black">PRIORITIZED</span>
                </h3>
                <p className="text-[10px] text-slate-600 font-mono mt-1">Sorted by courses with avg RSR &lt; 40%</p>
              </div>
              <div className="flex items-center gap-4 text-[9px] text-slate-600">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-1.5 rounded-full bg-gradient-to-r from-red-500 to-amber-500" />
                  <span>High Risk</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-1.5 rounded-full bg-slate-700" />
                  <span>Low Risk</span>
                </div>
              </div>
            </div>
            <div className="flex-1 overflow-auto custom-scrollbar">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="sticky top-0 left-0 z-20 bg-slate-950 p-3 text-[8px] font-black text-slate-600 uppercase text-left border-b border-slate-800 min-w-[200px]">Component</th>
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
                          <div className="flex-shrink-0 w-16 h-1.5 rounded-full bg-slate-800/50 overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-red-500 via-amber-500 to-emerald-500"
                              style={{ width: `${Math.min((row.criticalCourses / uniqueCourses.length) * 100, 100)}%` }}
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-slate-300 uppercase italic truncate">{row.topic}</span>
                            {rowIndex < 3 && (
                              <span className="px-1.5 py-0.5 bg-red-900/40 border border-red-500/60 rounded text-[8px] font-black text-red-300">
                                #{rowIndex + 1}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      {row.courseStats.map((cell, idx) => (
                        <td key={idx} className="p-2 border border-slate-900">
                          <Tooltip content={`${cell.course}: ${(cell.avgLMP * 100).toFixed(1)}% avg RSR`}>
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
                          </Tooltip>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* Student Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card rounded-3xl p-8 max-w-2xl w-full">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-black text-white uppercase">
                  {selectedStudent.firstName} {selectedStudent.lastName}
                </h2>
                <p className="text-alpha-gold text-sm uppercase tracking-widest mt-1">
                  {selectedStudent.currentCourse?.name || 'No Course'}
                </p>
              </div>
              <button 
                onClick={() => setSelectedStudent(null)}
                className="text-slate-500 hover:text-white text-2xl"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="glass-card p-4 rounded-xl">
                <div className="text-[9px] text-slate-500 uppercase font-bold mb-2">RSR</div>
                <div className="text-3xl font-black text-white">{(selectedStudent.metrics.lmp * 100).toFixed(0)}%</div>
              </div>
              <div className="glass-card p-4 rounded-xl">
                <div className="text-[9px] text-slate-500 uppercase font-bold mb-2">Risk Score</div>
                <div className={`text-3xl font-black ${
                  (selectedStudent.dri.riskScore || 0) >= 60 ? 'text-risk-red' : 
                  (selectedStudent.dri.riskScore || 0) >= 35 ? 'text-risk-amber' : 
                  'text-risk-emerald'
                }`}>{selectedStudent.dri.riskScore || 'N/A'}</div>
              </div>
              <div className="glass-card p-4 rounded-xl">
                <div className="text-[9px] text-slate-500 uppercase font-bold mb-2">Velocity</div>
                <div className="text-3xl font-black text-white">{selectedStudent.metrics.velocityScore}%</div>
              </div>
              <div className="glass-card p-4 rounded-xl">
                <div className="text-[9px] text-slate-500 uppercase font-bold mb-2">KSI</div>
                <div className="text-3xl font-black text-white">
                  {selectedStudent.metrics.ksi !== null ? `${selectedStudent.metrics.ksi}%` : 'N/A'}
                </div>
              </div>
            </div>

            {/* DRI Signal */}
            <div className="glass-card p-4 rounded-xl mb-6">
              <div className="text-[9px] text-slate-500 uppercase font-bold mb-2">DRI Signal</div>
              <div className="flex items-center gap-3">
                <span className={`text-2xl font-black ${selectedStudent.dri.driColor}`}>
                  {selectedStudent.dri.driSignal}
                </span>
                <span className="text-slate-600 text-sm">
                  Tier: {selectedStudent.dri.driTier}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button 
                onClick={() => setSelectedStudent(null)}
                className="flex-1 px-4 py-3 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white font-black text-[10px] uppercase rounded-lg transition-all"
              >
                Close
              </button>
              <button 
                onClick={() => {
                  setShowInterventionModal(true);
                }}
                className="flex-1 px-4 py-3 bg-alpha-gold hover:bg-alpha-gold/90 text-black font-black text-[10px] uppercase rounded-lg hover:shadow-[0_0_15px_rgba(212,175,53,0.4)] transition-all"
              >
                Log Intervention
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Coach Intervention Modal */}
      {showInterventionModal && selectedStudent && (
        <CoachInterventionModal
          student={selectedStudent}
          onClose={() => {
            setShowInterventionModal(false);
          }}
          onSuccess={() => {
            setShowInterventionModal(false);
          }}
        />
      )}

      {/* Help Modal */}
      {showHelp && <HelpModal mode="tower" onClose={() => setShowHelp(false)} />}

    </div>
  );
}
