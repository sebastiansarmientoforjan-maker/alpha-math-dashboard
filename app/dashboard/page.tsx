'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query } from 'firebase/firestore';

export default function DashboardPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoSync, setAutoSync] = useState(false);
  const [search, setSearch] = useState('');
  const [courseFilter, setCourseFilter] = useState('ALL');

  useEffect(() => {
    const q = query(collection(db, 'students'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setStudents(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const runSync = async () => {
    if (!autoSync) return;
    try {
      const res = await fetch('/api/update-students');
      const data = await res.json();
      if (data.success && data.currentIndex < data.total && data.currentIndex !== 0) {
        setTimeout(runSync, 2000);
      } else {
        setAutoSync(false);
      }
    } catch (e) { 
      setAutoSync(false); 
    }
  };

  useEffect(() => { 
    if (autoSync) runSync(); 
  }, [autoSync]);

  const stats = {
    total: students.length,
    atRisk: students.filter(s => (s.metrics?.dropoutProbability || 0) > 60).length,
    attention: students.filter(s => (s.metrics?.stuckScore || 0) > 40).length,
    onTrack: students.filter(s => (s.metrics?.velocityScore || 0) > 70).length,
    avgVelocity: Math.round(students.reduce((sum, s) => sum + (s.metrics?.velocityScore || 0), 0) / (students.length || 1)),
    avgAccuracy: Math.round(students.reduce((sum, s) => sum + (s.metrics?.accuracyRate || 0), 0) / (students.length || 1)),
  };

  const courses = Array.from(new Set(students.map(s => s.currentCourse?.name).filter(Boolean)));

  const filtered = students.filter(s => {
    const matchesSearch = `${s.firstName} ${s.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
                         s.id.toString().includes(search);
    const matchesCourse = courseFilter === 'ALL' || s.currentCourse?.name === courseFilter;
    return matchesSearch && matchesCourse;
  });

  if (loading) {
    return (
      <div className="p-8 bg-slate-950 min-h-screen text-emerald-500 font-mono italic flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🦅</div>
          <div className="text-xl">LOADING ALPHA COMMAND CENTER...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-950 min-h-screen">
      <div className="bg-slate-900/40 border-b border-slate-800 p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-black text-white mb-1">🦅 ALPHA COMMAND CENTER</h1>
            <p className="text-xs text-slate-500 font-mono">Math Academy Real-Time Analytics • Senior Section</p>
          </div>
          <button 
            onClick={() => setAutoSync(!autoSync)}
            className={`px-6 py-3 rounded-lg font-black text-xs tracking-widest transition-all ${
              autoSync 
                ? 'bg-red-900 text-white animate-pulse' 
                : 'bg-emerald-600 text-white hover:bg-emerald-500'
            }`}
          >
            {autoSync ? '⏸ STOP SYNC' : '▶ START SYNC'}
          </button>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
          <MetricCard title="Total Students" value={stats.total} color="blue" />
          <MetricCard title="🔴 At Risk" value={stats.atRisk} color="red" />
          <MetricCard title="🟡 Attention" value={stats.attention} color="amber" />
          <MetricCard title="🟢 On Track" value={stats.onTrack} color="emerald" />
          <MetricCard title="Avg Velocity" value={`${stats.avgVelocity}%`} color="blue" />
          <MetricCard title="Avg Accuracy" value={`${stats.avgAccuracy}%`} color="purple" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 space-y-4">
            <div className="flex gap-4">
              <input 
                onChange={(e) => setSearch(e.target.value)}
                placeholder="🔍 Search student..." 
                className="flex-1 bg-slate-900 border border-slate-800 px-4 py-2 rounded-lg text-sm text-white outline-none focus:border-emerald-500"
              />
              <select
                value={courseFilter}
                onChange={(e) => setCourseFilter(e.target.value)}
                className="bg-slate-900 border border-slate-800 px-4 py-2 rounded-lg text-sm text-white outline-none focus:border-emerald-500"
              >
                <option value="ALL">All Courses</option>
                {courses.map(course => (
                  <option key={course} value={course}>{course}</option>
                ))}
              </select>
            </div>

            <div className="bg-slate-900/40 border border-slate-800 rounded-lg overflow-hidden">
              <div className="overflow-x-auto max-h-[700px]">
                <table className="w-full text-left text-xs">
                  <thead className="sticky top-0 bg-slate-900 z-10 text-slate-500 font-bold border-b border-slate-800">
                    <tr>
                      <th className="p-4 uppercase tracking-wider">Student</th>
                      <th className="p-4 uppercase tracking-wider">Course</th>
                      <th className="p-4 text-center uppercase tracking-wider">Progress</th>
                      <th className="p-4 text-center uppercase tracking-wider">XP Week</th>
                      <th className="p-4 text-center uppercase tracking-wider">Velocity</th>
                      <th className="p-4 text-center uppercase tracking-wider">Accuracy</th>
                      <th className="p-4 text-center uppercase tracking-wider">Stuck</th>
                      <th className="p-4 text-center uppercase tracking-wider">Risk</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {filtered.map((s) => {
                      const metrics = s.metrics || {};
                      const course = s.currentCourse || {};
                      const activity = s.activity || {};
                      
                      return (
                        <tr key={s.id} className="hover:bg-slate-800/30 transition-colors">
                          <td className="p-4">
                            <div className="font-semibold text-slate-200">{s.firstName} {s.lastName}</div>
                            <div className="text-[10px] text-slate-600 font-mono">ID: {s.id}</div>
                          </td>
                          <td className="p-4">
                            <div className="text-slate-300 font-medium">{course.name || 'N/A'}</div>
                            <div className="text-[10px] text-slate-600">Grade: {course.grade || 'N/A'}</div>
                          </td>
                          <td className="p-4 text-center">
                            <div className="text-white font-mono">
                              {Math.round((course.progress || 0) * 100)}%
                            </div>
                            <div className="text-[10px] text-slate-600">
                              {course.xpRemaining || 0} XP left
                            </div>
                          </td>
                          <td className="p-4 text-center">
                            <div className="font-mono text-emerald-400">
                              {activity.xpAwarded || 0}
                            </div>
                          </td>
                          <td className="p-4 text-center">
                            <VelocityBadge score={metrics.velocityScore} />
                          </td>
                          <td className="p-4 text-center">
                            <AccuracyBadge score={metrics.accuracyRate} />
                          </td>
                          <td className="p-4 text-center">
                            <StuckBadge score={metrics.stuckScore} />
                          </td>
                          <td className="p-4 text-center">
                            <RiskBadge score={metrics.dropoutProbability} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="p-4 border-t border-slate-800 bg-slate-900/60 text-xs text-slate-500">
                Showing {filtered.length} of {students.length} students
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-slate-900/40 border border-slate-800 p-5 rounded-lg">
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">
                🚨 Top Stuck Students
              </h3>
              {students
                .filter(s => (s.metrics?.stuckScore || 0) > 0)
                .sort((a, b) => (b.metrics?.stuckScore || 0) - (a.metrics?.stuckScore || 0))
                .slice(0, 5)
                .map(s => (
                  <div key={s.id} className="mb-3 pb-3 border-b border-slate-800 last:border-0">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-slate-300 text-xs">
                        {s.firstName} {s.lastName}
                      </span>
                      <span className="text-red-500 font-mono text-sm font-black">
                        {s.metrics?.stuckScore}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-600">
                      {s.currentCourse?.name || 'N/A'}
                    </div>
                  </div>
                ))}
            </div>

            <div className="bg-red-900/10 border border-red-900/30 p-5 rounded-lg">
              <h3 className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-4">
                ⚠️ High Dropout Risk
              </h3>
              {students
                .filter(s => (s.metrics?.dropoutProbability || 0) > 60)
                .slice(0, 5)
                .map(s => (
                  <div key={s.id} className="mb-3 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-300 font-semibold">
                        {s.firstName}
                      </span>
                      <span className="text-red-400 font-mono font-bold">
                        {s.metrics?.dropoutProbability}%
                      </span>
                    </div>
                  </div>
                ))}
            </div>

            <div className="bg-slate-900/40 border border-slate-800 p-5 rounded-lg">
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">
                🎯 Pattern Recognition
              </h3>
              <div className="text-[11px] space-y-3 text-slate-400">
                <p>⚠️ {stats.attention} students showing stuck patterns</p>
                <p>🔥 {stats.atRisk} students at critical risk level</p>
                <p>✅ {stats.onTrack} students on track with goals</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, color }: any) {
  const colors: any = {
    blue: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
    red: 'bg-red-500/10 border-red-500/30 text-red-400',
    amber: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
    emerald: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
    purple: 'bg-purple-500/10 border-purple-500/30 text-purple-400',
  };

  return (
    <div className={`border p-4 rounded-lg ${colors[color]}`}>
      <div className="text-[10px] font-bold uppercase tracking-wider opacity-70 mb-1">
        {title}
      </div>
      <div className="text-2xl font-black">{value}</div>
    </div>
  );
}

function VelocityBadge({ score }: { score: number }) {
  if (score >= 80) return <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded font-mono font-bold">{score}%</span>;
  if (score >= 50) return <span className="px-2 py-1 bg-amber-500/20 text-amber-400 rounded font-mono font-bold">{score}%</span>;
  return <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded font-mono font-bold">{score}%</span>;
}

function AccuracyBadge({ score }: { score: number }) {
  if (score >= 70) return <span className="text-emerald-400 font-mono font-bold">{score}%</span>;
  if (score >= 55) return <span className="text-amber-400 font-mono font-bold">{score}%</span>;
  return <span className="text-red-400 font-mono font-bold">{score}%</span>;
}

function StuckBadge({ score }: { score: number }) {
  if (score > 60) return <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded font-mono font-bold">{score}</span>;
  if (score > 30) return <span className="px-2 py-1 bg-amber-500/20 text-amber-400 rounded font-mono font-bold">{score}</span>;
  return <span className="text-slate-600 font-mono">{score}</span>;
}

function RiskBadge({ score }: { score: number }) {
  if (score > 60) return <span className="px-2 py-1 bg-red-900/40 text-red-400 rounded font-mono font-black">{score}%</span>;
  if (score > 40) return <span className="px-2 py-1 bg-amber-900/40 text-amber-400 rounded font-mono font-bold">{score}%</span>;
  return <span className="text-slate-600 font-mono">{score}%</span>;
}
