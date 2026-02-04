'use client';

import { useState, useEffect, useMemo } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { calculateTier1Metrics } from '@/lib/metrics';
import { calculateDRIMetrics } from '@/lib/dri-calculus';
import { Student } from '@/types';
import {
  calculateInterventionImpact,
  calculateInterventionEffectiveness,
  calculateCoachPerformance,
  calculateBeforeAfterSnapshot,
  compareCohorts,
  InterventionImpact,
  InterventionEffectiveness,
  CoachPerformance,
} from '@/lib/impact-analytics';
import { subMonths, format } from 'date-fns';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ReferenceLine, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';

interface Intervention {
  id: string;
  studentId: string;
  coach: string;
  objective: string;
  notes: string;
  timestamp: Date;
}

export default function ImpactAnalyticsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [dateRange, setDateRange] = useState<[Date, Date]>([
    subMonths(new Date(), 3),
    new Date(),
  ]);
  const [selectedCoach, setSelectedCoach] = useState<string>('ALL');
  const [selectedTier, setSelectedTier] = useState<string>('ALL');
  const [selectedCampus, setSelectedCampus] = useState<string>('ALL');

  // Firebase real-time connections
  useEffect(() => {
    const unsubStudents = onSnapshot(query(collection(db, 'students')), (snapshot) => {
      const data = snapshot.docs.map(doc => {
        const s = { id: doc.id, ...doc.data() } as any;
        const metrics = calculateTier1Metrics(s, s.activity);
        const dri = calculateDRIMetrics({ ...s, metrics });
        return { ...s, metrics, dri };
      }) as Student[];
      setStudents(data);
    });

    const unsubInterventions = onSnapshot(query(collection(db, 'interventions')), (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() || new Date(),
      })) as Intervention[];
      setInterventions(data);
      setLoading(false);
    });

    return () => {
      unsubStudents();
      unsubInterventions();
    };
  }, []);

  // Calculate unique campuses
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

  // Filter students by campus
  const filteredStudents = useMemo(() => {
    if (selectedCampus === 'ALL') return students;

    return students.filter(s => {
      if (selectedCampus === 'Online (No Campus)') {
        return !s.dimensions?.campusDisplayName;
      } else {
        return s.dimensions?.campusDisplayName === selectedCampus;
      }
    });
  }, [students, selectedCampus]);

  // Filter interventions by campus (based on student's campus)
  const filteredInterventions = useMemo(() => {
    if (selectedCampus === 'ALL') return interventions;

    const filteredStudentIds = new Set(filteredStudents.map(s => s.id));
    return interventions.filter(i => filteredStudentIds.has(i.studentId));
  }, [interventions, filteredStudents, selectedCampus]);

  // Generate mock snapshots for demo (in production, these would come from metrics_snapshots collection)
  const mockSnapshots = useMemo(() => {
    const snapshots: any[] = [];
    filteredStudents.forEach(student => {
      for (let i = 0; i < 30; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        snapshots.push({
          studentId: student.id,
          date,
          rsr: student.metrics.lmp * 100 + (Math.random() - 0.5) * 10,
          ksi: student.metrics.ksi || 70 + (Math.random() - 0.5) * 15,
          velocity: student.metrics.velocityScore + (Math.random() - 0.5) * 20,
          riskScore: (student.dri.riskScore || 50) + (Math.random() - 0.5) * 15,
        });
      }
    });
    return snapshots;
  }, [filteredStudents]);

  // Calculate impacts
  const impacts = useMemo(() => {
    return filteredInterventions.map(intervention =>
      calculateInterventionImpact(
        intervention.studentId,
        intervention.timestamp,
        mockSnapshots
      )
    );
  }, [filteredInterventions, mockSnapshots]);

  // Calculate effectiveness by objective
  const effectiveness = useMemo(() =>
    calculateInterventionEffectiveness(filteredInterventions, impacts),
    [filteredInterventions, impacts]
  );

  // Calculate coach performance
  const uniqueCoaches = useMemo(() =>
    Array.from(new Set(filteredInterventions.map(i => i.coach))),
    [filteredInterventions]
  );

  const coachPerformance = useMemo(() =>
    calculateCoachPerformance(uniqueCoaches, filteredInterventions, impacts),
    [uniqueCoaches, filteredInterventions, impacts]
  );

  // Calculate cohort comparison
  const cohortComparison = useMemo(() =>
    compareCohorts(filteredStudents, filteredInterventions),
    [filteredStudents, filteredInterventions]
  );

  // Summary metrics
  const summary = useMemo(() => {
    const successful = impacts.filter(i => i.improved).length;
    const avgRiskDecrease = impacts
      .filter(i => i.deltaWeek4 !== null && i.deltaWeek4 < 0)
      .reduce((sum, i) => sum + Math.abs(i.deltaWeek4!), 0) / Math.max(1, successful);

    return {
      totalInterventions: filteredInterventions.length,
      successRate: filteredInterventions.length > 0 ? (successful / filteredInterventions.length) * 100 : 0,
      avgRiskDecrease: Math.round(avgRiskDecrease),
    };
  }, [filteredInterventions, impacts]);

  // Risk trajectory data for chart
  const trajectoryData = useMemo(() => {
    const weeks = [0, 1, 2, 4];
    return weeks.map(week => {
      const avgRisk = impacts.reduce((sum, i) => {
        if (week === 0) return sum + i.riskAtIntervention;
        if (week === 1 && i.riskWeek1) return sum + i.riskWeek1;
        if (week === 2 && i.riskWeek2) return sum + i.riskWeek2;
        if (week === 4 && i.riskWeek4) return sum + i.riskWeek4;
        return sum;
      }, 0) / Math.max(1, impacts.length);

      return {
        week: week === 0 ? 'At Intervention' : `Week ${week}`,
        avgRiskScore: Math.round(avgRisk),
      };
    });
  }, [impacts]);

  if (loading) {
    return (
      <div className="min-h-screen bg-alpha-navy-bg flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-pulse">📊</div>
          <p className="text-alpha-gold font-bold uppercase tracking-widest">
            Loading Impact Analytics...
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
              IMPACT ANALYTICS
            </h1>
            <p className="text-alpha-gold text-[10px] font-bold tracking-widest uppercase mt-1">
              Intervention Effectiveness & Coach Performance
            </p>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="/tower"
              className="px-4 py-2 bg-alpha-navy-light hover:bg-alpha-navy-surface border border-alpha-navy-light text-slate-400 hover:text-alpha-gold text-[10px] font-black uppercase rounded-lg transition-all"
            >
              → The Tower
            </a>
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

        {/* Filters */}
        <div className="flex gap-4 items-center flex-wrap">
          <select
            value={selectedCoach}
            onChange={(e) => setSelectedCoach(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-[10px] font-black uppercase text-slate-400 outline-none hover:border-slate-600 transition-colors"
          >
            <option value="ALL">👤 ALL COACHES</option>
            {uniqueCoaches.map(coach => (
              <option key={coach} value={coach}>{coach}</option>
            ))}
          </select>

          <select
            value={selectedCampus}
            onChange={(e) => setSelectedCampus(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-[10px] font-black uppercase text-slate-400 outline-none hover:border-slate-600 transition-colors"
          >
            <option value="ALL">📍 ALL CAMPUSES</option>
            {uniqueCampuses.map(campus => (
              <option key={campus} value={campus}>{campus}</option>
            ))}
          </select>

          <select
            value={selectedTier}
            onChange={(e) => setSelectedTier(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-[10px] font-black uppercase text-slate-400 outline-none hover:border-slate-600 transition-colors"
          >
            <option value="ALL">🚦 ALL TIERS</option>
            <option value="RED">🚨 RED ONLY</option>
            <option value="YELLOW">⚠️ YELLOW ONLY</option>
            <option value="GREEN">⚡ GREEN ONLY</option>
          </select>

          <div className="text-[9px] text-slate-500 uppercase tracking-widest">
            Last 3 months • {filteredInterventions.length} interventions
          </div>
        </div>
      </header>

      {/* Summary Metrics */}
      <section className="mb-8">
        <h2 className="text-xl font-black text-white uppercase mb-4">SUMMARY METRICS</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="glass-card p-6 rounded-xl border-l-4 border-alpha-gold">
            <div className="text-[9px] text-slate-500 uppercase font-bold mb-2">Total Interventions</div>
            <div className="text-4xl font-black text-alpha-gold">{summary.totalInterventions}</div>
            <div className="text-[8px] text-slate-600 mt-1">All logged interventions</div>
          </div>
          <div className="glass-card p-6 rounded-xl border-l-4 border-risk-emerald">
            <div className="text-[9px] text-slate-500 uppercase font-bold mb-2">Success Rate</div>
            <div className="text-4xl font-black text-risk-emerald">{summary.successRate.toFixed(0)}%</div>
            <div className="text-[8px] text-slate-600 mt-1">Students showing improvement</div>
          </div>
          <div className="glass-card p-6 rounded-xl border-l-4 border-indigo-500">
            <div className="text-[9px] text-slate-500 uppercase font-bold mb-2">Avg Risk Decrease</div>
            <div className="text-4xl font-black text-indigo-400">-{summary.avgRiskDecrease} pts</div>
            <div className="text-[8px] text-slate-600 mt-1">Average improvement magnitude</div>
          </div>
        </div>
      </section>

      {/* Intervention Effectiveness */}
      <section className="mb-8">
        <h2 className="text-xl font-black text-white uppercase mb-4">🎯 INTERVENTION EFFECTIVENESS</h2>
        <div className="glass-card rounded-2xl p-6">
          <div className="space-y-3">
            {effectiveness.slice(0, 6).map((item, idx) => (
              <div key={idx} className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="text-[11px] text-white font-bold mb-1">{item.objective}</div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-slate-800 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full bg-risk-emerald"
                        style={{ width: `${item.successRate}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono min-w-[60px]">
                      {item.successRate.toFixed(0)}% ({item.totalInterventions})
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Coach Leaderboard */}
      <section className="mb-8">
        <h2 className="text-xl font-black text-white uppercase mb-4">👥 COACH LEADERBOARD</h2>
        <div className="glass-card rounded-2xl p-6">
          <div className="space-y-3">
            {coachPerformance.slice(0, 10).map((coach, idx) => (
              <div key={idx} className="flex items-center gap-4 p-3 bg-slate-900/40 rounded-xl">
                <div className="text-2xl font-black text-alpha-gold min-w-[40px]">
                  #{idx + 1}
                </div>
                <div className="flex-1">
                  <div className="text-[12px] text-white font-bold">{coach.coachName}</div>
                  <div className="text-[10px] text-slate-500">
                    {coach.successRate.toFixed(0)}% success • {coach.studentsHelped} students
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-slate-500 uppercase">Impact Score</div>
                  <div className="text-xl font-black text-alpha-gold">{coach.impactScore}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Risk Score Trajectory Chart */}
      <section className="mb-8">
        <h2 className="text-xl font-black text-white uppercase mb-4">📊 RISK SCORE TRAJECTORY</h2>
        <div className="glass-card rounded-2xl p-6 h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trajectoryData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="week" stroke="#94a3b8" style={{ fontSize: '10px' }} />
              <YAxis domain={[0, 100]} stroke="#94a3b8" style={{ fontSize: '10px' }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px' }}
                labelStyle={{ color: '#d4af35', fontWeight: 'bold' }}
              />
              <ReferenceLine y={60} stroke="#fa4238" strokeDasharray="3 3" label={{ value: 'Red Threshold', position: 'right', fill: '#fa4238', fontSize: 10 }} />
              <ReferenceLine y={35} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: 'Yellow Threshold', position: 'right', fill: '#f59e0b', fontSize: 10 }} />
              <Line type="monotone" dataKey="avgRiskScore" stroke="#d4af35" strokeWidth={3} dot={{ fill: '#d4af35', r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Cohort Comparison */}
      <section className="mb-8">
        <h2 className="text-xl font-black text-white uppercase mb-4">🔬 COHORT ANALYSIS</h2>
        <div className="glass-card rounded-2xl p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* With Interventions */}
            <div className="p-4 bg-emerald-950/20 border border-emerald-500/30 rounded-xl">
              <h3 className="text-[11px] font-black text-emerald-400 uppercase mb-4">With Interventions</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-slate-400">Students:</span>
                  <span className="text-lg font-black text-white">{cohortComparison.withInterventions.studentCount}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-slate-400">Avg Days to Complete:</span>
                  <span className="text-lg font-black text-emerald-400">{cohortComparison.withInterventions.avgCourseCompletionDays}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-slate-400">Completion Rate:</span>
                  <span className="text-lg font-black text-emerald-400">{cohortComparison.withInterventions.courseCompletionRate.toFixed(0)}%</span>
                </div>
              </div>
            </div>

            {/* Without Interventions */}
            <div className="p-4 bg-slate-900/40 border border-slate-700 rounded-xl">
              <h3 className="text-[11px] font-black text-slate-400 uppercase mb-4">Without Interventions</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-slate-400">Students:</span>
                  <span className="text-lg font-black text-white">{cohortComparison.withoutInterventions.studentCount}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-slate-400">Avg Days to Complete:</span>
                  <span className="text-lg font-black text-slate-400">{cohortComparison.withoutInterventions.avgCourseCompletionDays}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-slate-400">Completion Rate:</span>
                  <span className="text-lg font-black text-slate-400">{cohortComparison.withoutInterventions.courseCompletionRate.toFixed(0)}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Improvement Percentage */}
          {cohortComparison.withoutInterventions.avgCourseCompletionDays > 0 && (
            <div className="mt-4 p-4 bg-alpha-gold-dim border border-alpha-gold/30 rounded-xl text-center">
              <div className="text-[10px] text-alpha-gold uppercase font-bold mb-1">Improvement</div>
              <div className="text-3xl font-black text-alpha-gold">
                {(((cohortComparison.withoutInterventions.avgCourseCompletionDays - cohortComparison.withInterventions.avgCourseCompletionDays) / cohortComparison.withoutInterventions.avgCourseCompletionDays) * 100).toFixed(0)}%
              </div>
              <div className="text-[9px] text-slate-500 mt-1">faster completion with interventions</div>
            </div>
          )}
        </div>
      </section>

      {/* Key Insights */}
      <section>
        <h2 className="text-xl font-black text-white uppercase mb-4">💡 KEY INSIGHTS</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="glass-card p-4 rounded-xl border-l-4 border-emerald-500">
            <div className="text-[10px] text-emerald-400 font-bold uppercase mb-2">Most Effective Intervention</div>
            <div className="text-lg font-black text-white mb-1">{effectiveness[0]?.objective || 'N/A'}</div>
            <div className="text-[9px] text-slate-500">{effectiveness[0]?.successRate.toFixed(0)}% success rate with {effectiveness[0]?.totalInterventions} interventions</div>
          </div>

          <div className="glass-card p-4 rounded-xl border-l-4 border-alpha-gold">
            <div className="text-[10px] text-alpha-gold font-bold uppercase mb-2">Top Performing Coach</div>
            <div className="text-lg font-black text-white mb-1">{coachPerformance[0]?.coachName || 'N/A'}</div>
            <div className="text-[9px] text-slate-500">{coachPerformance[0]?.successRate.toFixed(0)}% success rate • {coachPerformance[0]?.studentsHelped} students helped</div>
          </div>

          <div className="glass-card p-4 rounded-xl border-l-4 border-indigo-500">
            <div className="text-[10px] text-indigo-400 font-bold uppercase mb-2">Average Risk Reduction</div>
            <div className="text-lg font-black text-white mb-1">-{summary.avgRiskDecrease} points</div>
            <div className="text-[9px] text-slate-500">Across all successful interventions</div>
          </div>

          <div className="glass-card p-4 rounded-xl border-l-4 border-purple-500">
            <div className="text-[10px] text-purple-400 font-bold uppercase mb-2">Intervention Coverage</div>
            <div className="text-lg font-black text-white mb-1">{cohortComparison.withInterventions.studentCount} students</div>
            <div className="text-[9px] text-slate-500">{((cohortComparison.withInterventions.studentCount / Math.max(1, filteredStudents.length)) * 100).toFixed(0)}% of total students</div>
          </div>
        </div>
      </section>
    </div>
  );
}
