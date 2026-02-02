'use client';

import { useState, useEffect, useMemo } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface CampusSnapshot {
  totalStudents: number;
  avgRSR: number;
  avgVelocity: number;
  avgKSI: number;
  avgRiskScore: number;
  tierDistribution: { RED: number; YELLOW: number; GREEN: number };
  avgDER: number | null;
  avgPDI: number | null;
}

interface DashboardSnapshot {
  date: string;
  timestamp: any;
  global: CampusSnapshot & {
    topTopics: { topic: string; avgRSR: number; studentCount: number }[];
    bottomTopics: { topic: string; avgRSR: number; studentCount: number }[];
  };
  campuses: Record<string, CampusSnapshot>;
  studentsProcessed: number;
}

type TrendRange = 4 | 8 | 12;
type ViewMode = 'global' | 'campus';

export default function DashboardTrendsView() {
  const [snapshots, setSnapshots] = useState<DashboardSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<TrendRange>(8);
  const [viewMode, setViewMode] = useState<ViewMode>('global');
  const [selectedCampus, setSelectedCampus] = useState<string>('');

  // Fetch snapshots
  useEffect(() => {
    const fetchSnapshots = async () => {
      setLoading(true);
      try {
        const q = query(
          collection(db, 'dashboard_snapshots'),
          orderBy('date', 'desc'),
          limit(12)
        );
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate?.() || new Date(doc.data().date),
        })) as DashboardSnapshot[];
        
        setSnapshots(data.reverse()); // Oldest to newest for charts
      } catch (error) {
        console.error('Error fetching snapshots:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSnapshots();
  }, []);

  // Get available campuses
  const availableCampuses = useMemo(() => {
    if (snapshots.length === 0) return [];
    const latest = snapshots[snapshots.length - 1];
    return Object.keys(latest?.campuses || {}).sort();
  }, [snapshots]);

  // Set default campus
  useEffect(() => {
    if (availableCampuses.length > 0 && !selectedCampus) {
      setSelectedCampus(availableCampuses[0]);
    }
  }, [availableCampuses, selectedCampus]);

  // Filter snapshots by range
  const filteredSnapshots = useMemo(() => {
    return snapshots.slice(-range);
  }, [snapshots, range]);

  // Prepare chart data with safety checks
  const chartData = useMemo(() => {
    return filteredSnapshots.map(snap => {
      const dataSource = viewMode === 'global' 
        ? snap.global 
        : (snap.campuses && snap.campuses[selectedCampus]) || snap.global;

      // Safety check for undefined dataSource
      if (!dataSource) {
        return {
          date: new Date(snap.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          fullDate: snap.date,
          RSR: 0,
          Velocity: 0,
          KSI: 0,
          Risk: 0,
          RED: 0,
          YELLOW: 0,
          GREEN: 0,
          Total: 0,
        };
      }

      return {
        date: new Date(snap.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        fullDate: snap.date,
        RSR: dataSource.avgRSR || 0,
        Velocity: dataSource.avgVelocity || 0,
        KSI: dataSource.avgKSI || 0,
        Risk: dataSource.avgRiskScore || 0,
        RED: (dataSource.tierDistribution && dataSource.tierDistribution.RED) || 0,
        YELLOW: (dataSource.tierDistribution && dataSource.tierDistribution.YELLOW) || 0,
        GREEN: (dataSource.tierDistribution && dataSource.tierDistribution.GREEN) || 0,
        Total: dataSource.totalStudents || 0,
      };
    });
  }, [filteredSnapshots, viewMode, selectedCampus]);

  // Calculate deltas with safety checks
  const deltas = useMemo(() => {
    if (chartData.length < 2) return null;
    const latest = chartData[chartData.length - 1];
    const previous = chartData[chartData.length - 2];
    
    // Safety check for undefined values
    if (!latest || !previous) return null;

    return {
      RSR: (latest.RSR || 0) - (previous.RSR || 0),
      Velocity: (latest.Velocity || 0) - (previous.Velocity || 0),
      KSI: (latest.KSI || 0) - (previous.KSI || 0),
      Risk: (latest.Risk || 0) - (previous.Risk || 0),
      RED: (latest.RED || 0) - (previous.RED || 0),
      YELLOW: (latest.YELLOW || 0) - (previous.YELLOW || 0),
      GREEN: (latest.GREEN || 0) - (previous.GREEN || 0),
    };
  }, [chartData]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-950 border border-slate-800 rounded-3xl">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500 text-sm">Loading trends data...</p>
        </div>
      </div>
    );
  }

  if (snapshots.length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-950 border border-slate-800 rounded-3xl p-8">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">📊</div>
          <h3 className="text-xl font-black text-white mb-2">No Historical Data</h3>
          <p className="text-sm text-slate-500 mb-4">
            Dashboard snapshots are captured automatically every Monday. 
            Come back next week to see your first trends!
          </p>
          <p className="text-xs text-slate-600">
            Or manually trigger: <code className="bg-slate-800 px-2 py-1 rounded">GET /api/capture-dashboard-snapshot</code>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-slate-950 border border-slate-800 rounded-3xl p-8 overflow-auto custom-scrollbar">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            📈 Performance Trends
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {viewMode === 'global' ? 'All Students' : `${selectedCampus}`} • Last {range} weeks
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setViewMode('global')}
              className={`px-4 py-2 rounded-lg text-xs font-black uppercase transition-all ${
                viewMode === 'global'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              🌍 Global
            </button>
            <button
              onClick={() => setViewMode('campus')}
              className={`px-4 py-2 rounded-lg text-xs font-black uppercase transition-all ${
                viewMode === 'campus'
                  ? 'bg-purple-600 text-white'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              📍 Campus
            </button>
          </div>

          {/* Campus Selector */}
          {viewMode === 'campus' && availableCampuses.length > 0 && (
            <select
              value={selectedCampus}
              onChange={(e) => setSelectedCampus(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white hover:border-slate-600 focus:outline-none focus:border-indigo-500"
            >
              {availableCampuses.map(campus => (
                <option key={campus} value={campus}>{campus}</option>
              ))}
            </select>
          )}

          {/* Range Selector */}
          <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800">
            {[4, 8, 12].map(weeks => (
              <button
                key={weeks}
                onClick={() => setRange(weeks as TrendRange)}
                className={`px-3 py-2 rounded-lg text-xs font-black transition-all ${
                  range === weeks
                    ? 'bg-slate-700 text-white'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {weeks}W
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Delta Cards */}
      {deltas && (
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Avg RSR', value: deltas.RSR, suffix: '%', positive: deltas.RSR > 0 },
            { label: 'Avg Velocity', value: deltas.Velocity, suffix: '%', positive: deltas.Velocity > 0 },
            { label: 'Avg KSI', value: deltas.KSI, suffix: '%', positive: deltas.KSI > 0 },
            { label: 'Risk Score', value: deltas.Risk, suffix: '', positive: deltas.Risk < 0 },
          ].map(metric => (
            <div key={metric.label} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <div className="text-xs text-slate-500 mb-1">{metric.label}</div>
              <div className={`text-2xl font-black ${
                metric.positive ? 'text-emerald-400' : 'text-red-400'
              }`}>
                {metric.value > 0 ? '+' : ''}{Math.round(metric.value)}{metric.suffix}
              </div>
              <div className="text-xs text-slate-600 mt-1">vs last week</div>
            </div>
          ))}
        </div>
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        
        {/* Metrics Over Time */}
        <ChartCard title="Key Metrics Trend">
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="date" stroke="#94a3b8" tick={{ fontSize: 10 }} />
              <YAxis stroke="#94a3b8" tick={{ fontSize: 10 }} domain={[0, 100]} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Line type="monotone" dataKey="RSR" stroke="#6366f1" strokeWidth={2} name="RSR %" />
              <Line type="monotone" dataKey="Velocity" stroke="#8b5cf6" strokeWidth={2} name="Velocity %" />
              <Line type="monotone" dataKey="KSI" stroke="#06b6d4" strokeWidth={2} name="KSI %" />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Risk Score Trend */}
        <ChartCard title="Risk Score Trend">
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="date" stroke="#94a3b8" tick={{ fontSize: 10 }} />
              <YAxis stroke="#94a3b8" tick={{ fontSize: 10 }} domain={[0, 100]} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Line 
                type="monotone" 
                dataKey="Risk" 
                stroke="#ef4444" 
                strokeWidth={3}
                dot={{ r: 4, fill: '#ef4444' }}
                name="Risk Score"
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Tier Distribution Over Time */}
        <ChartCard title="Tier Distribution">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="date" stroke="#94a3b8" tick={{ fontSize: 10 }} />
              <YAxis stroke="#94a3b8" tick={{ fontSize: 10 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Bar dataKey="RED" stackId="a" fill="#ef4444" name="🔴 RED" />
              <Bar dataKey="YELLOW" stackId="a" fill="#f59e0b" name="🟡 YELLOW" />
              <Bar dataKey="GREEN" stackId="a" fill="#10b981" name="🟢 GREEN" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Student Count */}
        <ChartCard title="Total Students">
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="date" stroke="#94a3b8" tick={{ fontSize: 10 }} />
              <YAxis stroke="#94a3b8" tick={{ fontSize: 10 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
              <Line 
                type="monotone" 
                dataKey="Total" 
                stroke="#10b981" 
                strokeWidth={3}
                dot={{ r: 4, fill: '#10b981' }}
                name="Total Students"
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Comparison Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-800">
          <h3 className="text-sm font-black text-white">Week-by-Week Comparison</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-950">
              <tr className="border-b border-slate-800">
                <th className="text-left p-3 font-black text-slate-400">Week</th>
                <th className="text-center p-3 font-black text-slate-400">RSR</th>
                <th className="text-center p-3 font-black text-slate-400">Velocity</th>
                <th className="text-center p-3 font-black text-slate-400">KSI</th>
                <th className="text-center p-3 font-black text-slate-400">Risk</th>
                <th className="text-center p-3 font-black text-slate-400">🔴 RED</th>
                <th className="text-center p-3 font-black text-slate-400">🟡 YELLOW</th>
                <th className="text-center p-3 font-black text-slate-400">🟢 GREEN</th>
                <th className="text-center p-3 font-black text-slate-400">Total</th>
              </tr>
            </thead>
            <tbody>
              {chartData.map((week, index) => (
                <tr key={week.fullDate} className="border-b border-slate-800 hover:bg-slate-900/50">
                  <td className="p-3 font-bold text-white">{week.date}</td>
                  <td className="text-center p-3 text-slate-300">{Math.round(week.RSR)}%</td>
                  <td className="text-center p-3 text-slate-300">{Math.round(week.Velocity)}%</td>
                  <td className="text-center p-3 text-slate-300">{Math.round(week.KSI)}%</td>
                  <td className="text-center p-3">
                    <span className={`font-bold ${
                      week.Risk >= 60 ? 'text-red-400' :
                      week.Risk >= 35 ? 'text-amber-400' :
                      'text-emerald-400'
                    }`}>{Math.round(week.Risk)}</span>
                  </td>
                  <td className="text-center p-3 text-red-400 font-bold">{week.RED}</td>
                  <td className="text-center p-3 text-amber-400 font-bold">{week.YELLOW}</td>
                  <td className="text-center p-3 text-emerald-400 font-bold">{week.GREEN}</td>
                  <td className="text-center p-3 text-slate-300">{week.Total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
      <h3 className="text-sm font-black text-white mb-4">{title}</h3>
      {children}
    </div>
  );
}
