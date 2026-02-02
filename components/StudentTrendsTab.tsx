'use client';

import { useState, useEffect, useMemo } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Student } from '@/types';

interface StudentHistorySnapshot {
  date: string;
  metrics: {
    lmp: number;
    ksi: number | null;
    velocityScore: number;
    accuracyRate: number;
  };
  dri: {
    riskScore: number;
    driTier: 'RED' | 'YELLOW' | 'GREEN';
    debtExposure: number | null;
    precisionDecay: number | null;
  };
  courseName?: string;
}

interface StudentTrendsTabProps {
  student: Student;
}

type TrendRange = 4 | 8 | 12;

export default function StudentTrendsTab({ student }: StudentTrendsTabProps) {
  const [history, setHistory] = useState<StudentHistorySnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<TrendRange>(8);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const q = query(
          collection(db, `students/${student.id}/history`),
          orderBy('date', 'desc'),
          limit(12)
        );
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => doc.data() as StudentHistorySnapshot);
        setHistory(data.reverse()); // Oldest to newest
      } catch (error) {
        console.error('Error fetching student history:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [student.id]);

  const filteredHistory = useMemo(() => {
    return history.slice(-range);
  }, [history, range]);

  // SOLUCIÓN APLICADA AQUÍ: Optional Chaining (?.) para evitar el crash
  const chartData = useMemo(() => {
    return filteredHistory.map(snap => ({
      date: new Date(snap.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      fullDate: snap.date,
      // Protegemos el acceso a metrics
      RSR: Math.round((snap.metrics?.lmp || 0) * 100),
      KSI: snap.metrics?.ksi || 0,
      Velocity: snap.metrics?.velocityScore || 0,
      Accuracy: snap.metrics?.accuracyRate || 0,
      // Protegemos el acceso a dri (esto arregla el error "reading 'riskScore'")
      Risk: snap.dri?.riskScore || 0,
      Tier: snap.dri?.driTier,
      DER: snap.dri?.debtExposure,
      PDI: snap.dri?.precisionDecay,
    }));
  }, [filteredHistory]);

  const trends = useMemo(() => {
    if (chartData.length < 2) return null;
    const latest = chartData[chartData.length - 1];
    const previous = chartData[0]; // Compare to first point in range

    const calculateTrend = (current: number, past: number) => {
      const delta = current - past;
      if (Math.abs(delta) < 2) return 'stable';
      return delta > 0 ? 'up' : 'down';
    };

    return {
      RSR: { value: latest.RSR - previous.RSR, trend: calculateTrend(latest.RSR, previous.RSR) },
      KSI: { value: latest.KSI - previous.KSI, trend: calculateTrend(latest.KSI, previous.KSI) },
      Velocity: { value: latest.Velocity - previous.Velocity, trend: calculateTrend(latest.Velocity, previous.Velocity) },
      Risk: { value: latest.Risk - previous.Risk, trend: calculateTrend(previous.Risk, latest.Risk) }, // Inverted
    };
  }, [chartData]);

  const getTrendIcon = (trend: string) => {
    if (trend === 'up') return '↗';
    if (trend === 'down') return '↘';
    return '→';
  };

  const getTrendColor = (trend: string, metricName: string) => {
    if (trend === 'stable') return 'text-slate-500';
    
    // For Risk, down is good
    if (metricName === 'Risk') {
      return trend === 'down' ? 'text-emerald-400' : 'text-red-400';
    }
    
    // For others, up is good
    return trend === 'up' ? 'text-emerald-400' : 'text-red-400';
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center py-20">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500 text-sm">Loading trends...</p>
        </div>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="h-full flex items-center justify-center py-20">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">📊</div>
          <h3 className="text-xl font-black text-white mb-2">No Historical Data</h3>
          <p className="text-sm text-slate-500 mb-4">
            Historical snapshots are saved daily. Check back tomorrow to see {student.firstName}'s first trend data!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Header with Range Selector */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-black text-white">Performance Trends</h3>
          <p className="text-xs text-slate-500">Last {range} weeks of data</p>
        </div>
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

      {/* Trend Indicators */}
      {trends && (
        <div className="grid grid-cols-4 gap-4">
          {Object.entries(trends).map(([key, data]) => (
            <div key={key} className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
              <div className="text-xs text-slate-500 mb-1">{key}</div>
              <div className="flex items-baseline gap-2">
                <span className={`text-2xl font-black ${getTrendColor(data.trend, key)}`}>
                  {getTrendIcon(data.trend)}
                </span>
                <span className={`text-lg font-bold ${getTrendColor(data.trend, key)}`}>
                  {data.value > 0 ? '+' : ''}{data.value}{key === 'Risk' ? '' : '%'}
                </span>
              </div>
              <div className="text-xs text-slate-600 mt-1">{range}W trend</div>
            </div>
          ))}
        </div>
      )}

      {/* Main Metrics Chart */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
        <h4 className="text-sm font-black text-white mb-4">Core Metrics</h4>
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
      </div>

      {/* Risk Score Chart */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
        <h4 className="text-sm font-black text-white mb-4">Risk Score Trend</h4>
        <ResponsiveContainer width="100%" height={200}>
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
      </div>

      {/* Historical Data Table */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-800">
          <h4 className="text-sm font-black text-white">Historical Snapshots</h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-950">
              <tr className="border-b border-slate-800">
                <th className="text-left p-3 font-black text-slate-400">Date</th>
                <th className="text-center p-3 font-black text-slate-400">RSR</th>
                <th className="text-center p-3 font-black text-slate-400">Velocity</th>
                <th className="text-center p-3 font-black text-slate-400">KSI</th>
                <th className="text-center p-3 font-black text-slate-400">Risk</th>
                <th className="text-center p-3 font-black text-slate-400">Tier</th>
                <th className="text-center p-3 font-black text-slate-400">DER</th>
                <th className="text-center p-3 font-black text-slate-400">PDI</th>
              </tr>
            </thead>
            <tbody>
              {chartData.map((snap) => (
                <tr key={snap.fullDate} className="border-b border-slate-800 hover:bg-slate-900/50">
                  <td className="p-3 font-bold text-white">{snap.date}</td>
                  <td className="text-center p-3 text-slate-300">{snap.RSR}%</td>
                  <td className="text-center p-3 text-slate-300">{snap.Velocity}%</td>
                  <td className="text-center p-3 text-slate-300">{snap.KSI}%</td>
                  <td className="text-center p-3">
                    <span className={`font-bold ${
                      snap.Risk >= 60 ? 'text-red-400' : 
                      snap.Risk >= 35 ? 'text-amber-400' : 
                      'text-emerald-400'
                    }`}>{snap.Risk}</span>
                  </td>
                  <td className="text-center p-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                      snap.Tier === 'RED' ? 'bg-red-900/30 text-red-400' : 
                      snap.Tier === 'YELLOW' ? 'bg-amber-900/30 text-amber-400' : 
                      'bg-emerald-900/30 text-emerald-400'
                    }`}>
                      {snap.Tier}
                    </span>
                  </td>
                  <td className="text-center p-3 text-slate-300">{snap.DER !== null ? `${snap.DER}%` : 'N/A'}</td>
                  <td className="text-center p-3 text-slate-300">{snap.PDI !== null ? `${snap.PDI}x` : 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
