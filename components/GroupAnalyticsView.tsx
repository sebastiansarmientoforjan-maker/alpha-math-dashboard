'use client';

import { useState, useMemo } from 'react';
import { Student } from '@/types';
import {
  GroupDimension,
  GROUP_DIMENSIONS,
  GroupStats,
  DIMENSION_COLORS,
} from '@/lib/student-dimensions';
import {
  groupStudentsByDimension,
  calculateGroupStats,
  sortGroupsByCount,
  generateGroupSummary,
} from '@/lib/group-analytics-utils';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';

interface GroupAnalyticsViewProps {
  students: Student[];
}

export default function GroupAnalyticsView({
  students,
}: GroupAnalyticsViewProps) {
  const [selectedDimension, setSelectedDimension] =
    useState<GroupDimension>('campus');

  // Agrupar estudiantes por dimensión seleccionada
  const groupedData = useMemo(() => {
    const grouped = groupStudentsByDimension(students, selectedDimension);
    console.log('🔍 Grouped Data:', {
      dimension: selectedDimension,
      groups: Object.keys(grouped),
      counts: Object.entries(grouped).map(([k, v]) => `${k}: ${v.length}`),
    });
    return grouped;
  }, [students, selectedDimension]);

  // Calcular estadísticas para cada grupo
  const statsData = useMemo(() => {
    const stats = Object.entries(groupedData).map(([group, groupStudents]) =>
      calculateGroupStats(group, groupStudents)
    );
    // Ordenar por count descendente
    const sorted = stats.sort((a, b) => b.count - a.count);
    console.log('📊 Stats Data:', sorted.map(s => ({
      group: s.group,
      count: s.count,
      avgRSR: s.avgRSR,
      redCount: s.redCount,
    })));
    return sorted;
  }, [groupedData]);

  // Datos para gráficos
  const tierDistributionData = useMemo(() => {
    const data = statsData.map((stat) => ({
      name: stat.group,
      Red: stat.redCount,
      Yellow: stat.yellowCount,
      Green: stat.greenCount,
    }));
    console.log('📊 Tier Distribution Data:', data);
    return data;
  }, [statsData]);

  const pieData = useMemo(() => {
    const data = statsData.map((stat) => ({
      name: stat.group,
      value: stat.count,
    }));
    console.log('🥧 Pie Data:', data);
    return data;
  }, [statsData]);

  const radarData = useMemo(() => {
    // Top 5 grupos por tamaño
    const data = statsData.slice(0, 5).map((stat) => ({
      group: stat.group.length > 15 ? stat.group.substring(0, 12) + '...' : stat.group,
      RSR: Math.round(stat.avgRSR),
      Velocity: Math.round(stat.avgVelocity),
      KSI: Math.round(stat.avgKSI),
      'Risk Score': Math.round(stat.avgRiskScore),
    }));
    console.log('🎯 Radar Data:', data);
    return data;
  }, [statsData]);

  const dimensionConfig = GROUP_DIMENSIONS.find(
    (d) => d.value === selectedDimension
  )!;

  // Debug: verificar si hay datos
  console.log('👥 Total Students:', students.length);
  console.log('📦 Grouped Data Keys:', Object.keys(groupedData));
  console.log('📈 Stats Data Length:', statsData.length);

  if (students.length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-950 border border-slate-800 rounded-3xl p-8">
        <div className="text-center">
          <p className="text-slate-500 text-lg">No students data available</p>
        </div>
      </div>
    );
  }

  if (statsData.length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-950 border border-slate-800 rounded-3xl p-8">
        <div className="text-center">
          <p className="text-slate-500 text-lg">No groups found for dimension: {selectedDimension}</p>
          <p className="text-slate-600 text-sm mt-2">Check console for details</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-slate-950 border border-slate-800 rounded-3xl p-8 overflow-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            <span>{dimensionConfig.icon}</span>
            Group Analytics
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {dimensionConfig.description}
          </p>
        </div>

        {/* Dimension Selector */}
        <select
          value={selectedDimension}
          onChange={(e) =>
            setSelectedDimension(e.target.value as GroupDimension)
          }
          className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white hover:border-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
        >
          {GROUP_DIMENSIONS.map((dim) => (
            <option key={dim.value} value={dim.value}>
              {dim.icon} {dim.label} ({dim.groups} groups)
            </option>
          ))}
        </select>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-500 mb-1">Total Students</div>
          <div className="text-2xl font-black text-white">{students.length}</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-500 mb-1">Groups</div>
          <div className="text-2xl font-black text-white">
            {statsData.length}
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-500 mb-1">Avg RSR</div>
          <div className="text-2xl font-black text-white">
            {(
              statsData.reduce((acc, s) => acc + s.avgRSR * s.count, 0) /
              students.length
            ).toFixed(1)}
            %
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-500 mb-1">Avg Velocity</div>
          <div className="text-2xl font-black text-white">
            {(
              statsData.reduce((acc, s) => acc + s.avgVelocity * s.count, 0) /
              students.length
            ).toFixed(1)}
            %
          </div>
        </div>
      </div>

      {/* Charts Grid - ALTURA FIJA */}
      <div className="grid grid-cols-2 gap-6 h-[600px]">
        {/* Bar Chart: Tier Distribution */}
        <ChartCard title="Distribution by Tier">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={tierDistributionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis
                dataKey="name"
                stroke="#94a3b8"
                tick={{ fontSize: 10 }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
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
              <Bar dataKey="Red" stackId="a" fill="#ef4444" />
              <Bar dataKey="Yellow" stackId="a" fill="#f59e0b" />
              <Bar dataKey="Green" stackId="a" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Pie Chart: Student Distribution */}
        <ChartCard title="Student Distribution">
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={(entry) => `${entry.name} (${entry.value})`}
                style={{ fontSize: '10px' }}
              >
                {pieData.map((entry, index) => {
                  const color =
                    DIMENSION_COLORS[entry.name] ||
                    `hsl(${(index * 360) / pieData.length}, 70%, 60%)`;
                  return <Cell key={`cell-${index}`} fill={color} />;
                })}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Radar Chart: Metrics Comparison */}
        <ChartCard title="Metrics Comparison (Top 5 Groups)">
          <ResponsiveContainer width="100%" height={250}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#334155" />
              <PolarAngleAxis dataKey="group" stroke="#94a3b8" tick={{ fontSize: 10 }} />
              <PolarRadiusAxis stroke="#94a3b8" tick={{ fontSize: 10 }} />
              {radarData.length > 0 &&
                Object.keys(radarData[0])
                  .filter((key) => key !== 'group')
                  .map((key, index) => (
                    <Radar
                      key={key}
                      name={key}
                      dataKey={key}
                      stroke={`hsl(${(index * 360) / 4}, 70%, 60%)`}
                      fill={`hsl(${(index * 360) / 4}, 70%, 60%)`}
                      fillOpacity={0.3}
                    />
                  ))}
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Table: Summary Statistics */}
        <ChartCard title="Summary Statistics">
          <div className="h-[250px] overflow-y-auto custom-scrollbar">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-slate-900 z-10">
                <tr className="border-b border-slate-700">
                  <th className="text-left p-2 font-black">Group</th>
                  <th className="text-center p-2 font-black">N</th>
                  <th className="text-center p-2 font-black">RSR</th>
                  <th className="text-center p-2 font-black">Vel</th>
                  <th className="text-center p-2 font-black">Risk</th>
                  <th className="text-center p-2 font-black">Tier</th>
                </tr>
              </thead>
              <tbody>
                {statsData.map((stat, index) => (
                  <tr
                    key={stat.group}
                    className={`border-b border-slate-800 hover:bg-slate-900/50 transition-colors ${
                      stat.hasInsufficientData ? 'opacity-60' : ''
                    }`}
                  >
                    <td className="p-2 font-bold text-white">
                      {stat.group}
                      {stat.hasInsufficientData && (
                        <span className="ml-2 text-xs text-amber-500">⚠️</span>
                      )}
                    </td>
                    <td className="text-center p-2 text-slate-300">
                      {stat.count}
                    </td>
                    <td className="text-center p-2 text-slate-300">
                      {stat.avgRSR.toFixed(0)}%
                    </td>
                    <td className="text-center p-2 text-slate-300">
                      {stat.avgVelocity.toFixed(0)}%
                    </td>
                    <td className="text-center p-2 text-slate-300">
                      {stat.avgRiskScore.toFixed(0)}
                    </td>
                    <td className="text-center p-2">
                      <div className="flex gap-1 justify-center">
                        {stat.redCount > 0 && (
                          <span className="text-red-500 text-[10px]">
                            🔴{stat.redCount}
                          </span>
                        )}
                        {stat.yellowCount > 0 && (
                          <span className="text-amber-500 text-[10px]">
                            🟡{stat.yellowCount}
                          </span>
                        )}
                        {stat.greenCount > 0 && (
                          <span className="text-emerald-500 text-[10px]">
                            🟢{stat.greenCount}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ChartCard>
      </div>

      {/* Export Button */}
      <div className="mt-6 flex justify-end">
        <button
          onClick={() => {
            // TODO: Implement PDF export
            alert('PDF export coming soon!');
          }}
          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase rounded-xl transition-colors flex items-center gap-2"
        >
          <span>📄</span>
          Export Group Report PDF
        </button>
      </div>
    </div>
  );
}

// Chart Card Component
function ChartCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
      <h3 className="text-sm font-black text-white mb-4">{title}</h3>
      {children}
    </div>
  );
}
