'use client';

import { useState, useEffect, useMemo } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { calculateTier1Metrics } from '@/lib/metrics';
import { calculateDRIMetrics } from '@/lib/dri-calculus';
import { Student } from '@/types';
import Tooltip from '@/components/Tooltip';
import KeenKTMatrix from '@/components/KeenKTMatrix';

const METRIC_TOOLTIPS = {
  rsr: 'Recent Success Rate: Proportion of recent tasks with >80% accuracy',
  ksi: 'Knowledge Stability Index: Consistency of performance over time',
  velocity: 'Weekly XP Progress: % of weekly XP goal achieved',
  risk: 'Risk Score: Composite score from multiple risk factors (0-100)',
};

interface StudentCardProps {
  student: Student;
  onClick: () => void;
}

function StudentCard({ student, onClick }: StudentCardProps) {
  return (
    <div 
      onClick={onClick}
      className="p-3 glass-card rounded-xl cursor-pointer hover:scale-[1.02] hover:border-alpha-gold transition-all group"
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-black text-white text-sm uppercase italic truncate group-hover:text-alpha-gold transition-colors">
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

export default function TowerPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

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

  // Triage Stack: Separate students by risk tier
  const redZone = useMemo(() => 
    students.filter(s => s.dri.driTier === 'RED')
      .sort((a, b) => (b.dri.riskScore || 0) - (a.dri.riskScore || 0))
  , [students]);

  const yellowZone = useMemo(() => 
    students.filter(s => s.dri.driTier === 'YELLOW')
      .sort((a, b) => (b.dri.riskScore || 0) - (a.dri.riskScore || 0))
  , [students]);

  const greenZone = useMemo(() => 
    students.filter(s => !redZone.some(r => r.id === s.id) && !yellowZone.some(y => y.id === s.id))
      .sort((a, b) => (a.metrics.lmp - b.metrics.lmp)) // Lowest RSR first for monitoring
  , [students, redZone, yellowZone]);

  const stats = useMemo(() => ({
    total: students.length,
    critical: redZone.length,
    watch: yellowZone.length,
    optimal: greenZone.length,
    avgRiskScore: Math.round(students.reduce((sum, s) => sum + (s.dri.riskScore || 0), 0) / Math.max(students.length, 1)),
  }), [students, redZone, yellowZone, greenZone]);

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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-white uppercase tracking-ultra">
              THE TOWER
            </h1>
            <p className="text-alpha-gold text-[10px] font-bold tracking-widest uppercase mt-1">
              Strategic Analytics • {students.length} Students
            </p>
          </div>
          <div className="flex items-center gap-4">
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
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
      </header>

      {/* Matrix Section - REAL COMPONENT */}
      <section className="mb-12">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-black text-white uppercase">
            MASTERY VS. CONSISTENCY
          </h2>
          <div className="text-[9px] text-slate-600 uppercase tracking-widest">
            Interactive scatter plot • {students.length} students plotted
          </div>
        </div>
        <div className="glass-card rounded-3xl p-4 h-[700px] overflow-hidden">
          <KeenKTMatrix students={students} onStudentClick={(student) => setSelectedStudent(student)} />
        </div>
      </section>

      {/* Triage Stack - REAL DATA */}
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
          
          {/* Red Zone - CRITICAL */}
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
                    onClick={() => setSelectedStudent(student)}
                  />
                ))
              )}
            </div>
          </div>

          {/* Amber Zone - WATCH */}
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
                    onClick={() => setSelectedStudent(student)}
                  />
                ))
              )}
            </div>
          </div>

          {/* Green Zone - OPTIMAL */}
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
                greenZone.slice(0, 50).map(student => ( // Show top 50 to avoid performance issues
                  <StudentCard 
                    key={student.id} 
                    student={student} 
                    onClick={() => setSelectedStudent(student)}
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

      {/* Simple Student Modal (placeholder) */}
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

            <div className="grid grid-cols-2 gap-4">
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

            <div className="mt-6 pt-6 border-t border-slate-800">
              <p className="text-[9px] text-slate-600 text-center">
                Full StudentModal integration in Phase 3.3
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
