'use client';

import { useState, useMemo, useEffect } from 'react';
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
import { generateGroupReportPDF } from '@/lib/group-report-pdf';
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
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [drillDownTier, setDrillDownTier] = useState<'RED' | 'YELLOW' | 'GREEN' | null>(null);

  // Handle ESC key to close drill-down modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedGroup) {
        closeDrillDown();
      }
    };
    
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [selectedGroup]);

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
      RSR: Math.round(stat.avgRSR || 0),
      Velocity: Math.round(stat.avgVelocity || 0),
      KSI: Math.round(stat.avgKSI || 0),
      'Risk Score': Math.round(stat.avgRiskScore || 0),
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

  // Handlers para interactividad
  const handleBarClick = (data: any) => {
    if (data && data.activePayload && data.activePayload[0]) {
      const groupName = data.activePayload[0].payload.name;
      setSelectedGroup(groupName);
      console.log('📊 Selected group:', groupName);
    }
  };

  const handlePieClick = (data: any) => {
    if (data && data.name) {
      setSelectedGroup(data.name);
      console.log('🥧 Selected group from pie:', data.name);
    }
  };

  const handleTierClick = (tier: 'RED' | 'YELLOW' | 'GREEN', groupName: string) => {
    setSelectedGroup(groupName);
    setDrillDownTier(tier);
    console.log('🎯 Drill down:', { group: groupName, tier });
  };

  const closeDrillDown = () => {
    setSelectedGroup(null);
    setDrillDownTier(null);
  };

  // Obtener estudiantes del grupo seleccionado
  const drillDownStudents = selectedGroup ? groupedData[selectedGroup] || [] : [];
  const filteredDrillDownStudents = drillDownTier
    ? drillDownStudents.filter(s => s.dri?.driTier === drillDownTier)
    : drillDownStudents;

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

        <div className="flex items-center gap-3">
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

          {/* Export PDF Button */}
          <button
            onClick={async () => {
              try {
                await generateGroupReportPDF({
                  dimension: selectedDimension,
                  dimensionLabel: dimensionConfig.label,
                  stats: statsData,
                  students: students,
                  includeStudentPages: false,
                });
              } catch (error) {
                console.error('PDF generation error:', error);
                alert('Error generating PDF. Check console for details.');
              }
            }}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase rounded-xl transition-all flex items-center gap-2 shadow-lg hover:shadow-indigo-500/50 hover:scale-105"
          >
            <span>📄</span>
            Export PDF
          </button>
        </div>
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
            <BarChart data={tierDistributionData} onClick={handleBarClick}>
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
                cursor={{ fill: 'rgba(99, 102, 241, 0.1)' }}
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Bar dataKey="Red" stackId="a" fill="#ef4444" cursor="pointer" />
              <Bar dataKey="Yellow" stackId="a" fill="#f59e0b" cursor="pointer" />
              <Bar dataKey="Green" stackId="a" fill="#10b981" cursor="pointer" />
            </BarChart>
          </ResponsiveContainer>
          <p className="text-[10px] text-slate-600 italic mt-2">Click on a bar to view students</p>
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
                onClick={handlePieClick}
                cursor="pointer"
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
          <p className="text-[10px] text-slate-600 italic mt-2">Click on a segment to view students</p>
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
                      {(stat.avgRSR || 0).toFixed(0)}%
                    </td>
                    <td className="text-center p-2 text-slate-300">
                      {(stat.avgVelocity || 0).toFixed(0)}%
                    </td>
                    <td className="text-center p-2 text-slate-300">
                      {(stat.avgRiskScore || 0).toFixed(0)}
                    </td>
                    <td className="text-center p-2">
                      <div className="flex gap-1 justify-center">
                        {stat.redCount > 0 && (
                          <button
                            onClick={() => handleTierClick('RED', stat.group)}
                            className="text-red-500 text-[10px] hover:bg-red-900/20 px-1 rounded transition-colors cursor-pointer"
                          >
                            🔴{stat.redCount}
                          </button>
                        )}
                        {stat.yellowCount > 0 && (
                          <button
                            onClick={() => handleTierClick('YELLOW', stat.group)}
                            className="text-amber-500 text-[10px] hover:bg-amber-900/20 px-1 rounded transition-colors cursor-pointer"
                          >
                            🟡{stat.yellowCount}
                          </button>
                        )}
                        {stat.greenCount > 0 && (
                          <button
                            onClick={() => handleTierClick('GREEN', stat.group)}
                            className="text-emerald-500 text-[10px] hover:bg-emerald-900/20 px-1 rounded transition-colors cursor-pointer"
                          >
                            🟢{stat.greenCount}
                          </button>
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

      {/* Drill-Down Modal */}
      {selectedGroup && (
        <div 
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-8"
          onClick={closeDrillDown}
        >
          <div 
            className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-black text-white flex items-center gap-2">
                  {selectedGroup}
                  {drillDownTier && (
                    <span className={`text-sm px-2 py-1 rounded ${
                      drillDownTier === 'RED' ? 'bg-red-900/30 text-red-400' :
                      drillDownTier === 'YELLOW' ? 'bg-amber-900/30 text-amber-400' :
                      'bg-emerald-900/30 text-emerald-400'
                    }`}>
                      {drillDownTier} Tier Only
                    </span>
                  )}
                </h3>
                <p className="text-sm text-slate-400 mt-1">
                  {filteredDrillDownStudents.length} students
                  {drillDownTier && ` (filtered from ${drillDownStudents.length} total)`}
                </p>
              </div>
              <button
                onClick={closeDrillDown}
                className="text-slate-400 hover:text-white transition-colors text-2xl"
              >
                ×
              </button>
            </div>

            {/* Students List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-slate-900 z-10">
                  <tr className="border-b border-slate-700">
                    <th className="text-left p-2 font-black">Student</th>
                    <th className="text-center p-2 font-black">RSR</th>
                    <th className="text-center p-2 font-black">Velocity</th>
                    <th className="text-center p-2 font-black">KSI</th>
                    <th className="text-center p-2 font-black">Risk</th>
                    <th className="text-center p-2 font-black">Tier</th>
                    <th className="text-left p-2 font-black">Course</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDrillDownStudents.map((student) => (
                    <tr
                      key={student.id}
                      className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="p-2 text-white font-bold">
                        {student.firstName} {student.lastName}
                      </td>
                      <td className="text-center p-2 text-slate-300">
                        {(student.metrics.lmp * 100).toFixed(0)}%
                      </td>
                      <td className="text-center p-2 text-slate-300">
                        {student.metrics.velocityScore}%
                      </td>
                      <td className="text-center p-2 text-slate-300">
                        {student.metrics.ksi !== null ? `${student.metrics.ksi}%` : 'N/A'}
                      </td>
                      <td className="text-center p-2">
                        <span className={`font-bold ${
                          (student.dri?.riskScore || 0) >= 60 ? 'text-red-400' :
                          (student.dri?.riskScore || 0) >= 35 ? 'text-amber-400' :
                          'text-emerald-400'
                        }`}>
                          {student.dri?.riskScore || 0}
                        </span>
                      </td>
                      <td className="text-center p-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                          student.dri?.driTier === 'RED' ? 'bg-red-900/30 text-red-400' :
                          student.dri?.driTier === 'YELLOW' ? 'bg-amber-900/30 text-amber-400' :
                          'bg-emerald-900/30 text-emerald-400'
                        }`}>
                          {student.dri?.driTier}
                        </span>
                      </td>
                      <td className="p-2 text-slate-400 truncate max-w-[200px]">
                        {student.currentCourse?.name || 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredDrillDownStudents.length === 0 && (
                <div className="text-center py-12 text-slate-500">
                  No students found in this category
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="mt-4 pt-4 border-t border-slate-800 flex justify-between items-center">
              <div className="text-xs text-slate-500">
                Press ESC or click outside to close
              </div>
              <button
                onClick={closeDrillDown}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-black uppercase rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
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
