// ============================================
// ALPHA MATH COMMAND v7.0 - DEEP DIVE PANEL (ZONE C)
// ============================================
// STRICT MODE: Bottom/Modal panel with intervention effectiveness tracking
// Part 2.3 (Deep Dive) + Velocity Recovery Visualization

'use client';

import { useMemo } from 'react';
import { EnrichedStudent } from '@/lib/command-store';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, ReferenceLine } from 'recharts';

// ============================================
// TYPES
// ============================================

interface DeepDivePanelProps {
  student: EnrichedStudent | null;
  onClose: () => void;
}

interface SparklineDataPoint {
  index: number;
  accuracy: number;
  timestamp: Date;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Calculate velocity recovery from last intervention
 * CRITICAL: This measures intervention effectiveness
 */
function calculateVelocityRecovery(student: EnrichedStudent): {
  hasIntervention: boolean;
  recovery: number;
  velocityBefore: number;
  velocityAfter: number;
  successful: boolean;
  interventionDate: Date | null;
} {
  if (student.interventionHistory.length === 0) {
    return {
      hasIntervention: false,
      recovery: 0,
      velocityBefore: 0,
      velocityAfter: 0,
      successful: false,
      interventionDate: null,
    };
  }

  // Get last intervention (most recent)
  const lastIntervention = student.interventionHistory[0];

  const velocityBefore = lastIntervention.velocityBefore || 0;
  const velocityAfter = lastIntervention.velocityAfter || 0;
  const recovery = velocityAfter - velocityBefore;
  const successful = recovery > 0;

  return {
    hasIntervention: true,
    recovery,
    velocityBefore,
    velocityAfter,
    successful,
    interventionDate: lastIntervention.timestamp,
  };
}

/**
 * Generate sparkline data from last 10 activity logs
 */
function generateSparklineData(student: EnrichedStudent): {
  data: SparklineDataPoint[];
  interventionIndex: number | null;
} {
  // Get last 10 activity logs sorted by timestamp
  const recentActivity = [...student.activity]
    .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
    .slice(-10);

  const data: SparklineDataPoint[] = recentActivity.map((log, index) => ({
    index,
    accuracy: log.accuracy * 100, // Convert to percentage
    timestamp: log.timestamp,
  }));

  // Find intervention index if any intervention occurred during this period
  let interventionIndex: number | null = null;

  if (student.interventionHistory.length > 0) {
    const lastIntervention = student.interventionHistory[0];
    const interventionTime = lastIntervention.timestamp.getTime();

    // Find closest data point to intervention time
    let closestIndex = -1;
    let closestDiff = Infinity;

    data.forEach((point, idx) => {
      const diff = Math.abs(point.timestamp.getTime() - interventionTime);
      if (diff < closestDiff) {
        closestDiff = diff;
        closestIndex = idx;
      }
    });

    // Only mark if intervention was within activity period
    if (closestIndex >= 0 && closestDiff < 7 * 24 * 60 * 60 * 1000) {
      // Within 7 days
      interventionIndex = closestIndex;
    }
  }

  return { data, interventionIndex };
}

/**
 * Get status color based on mastery latency
 */
function getLatencyColor(status: 'LOW_LATENCY' | 'HIGH_FRICTION' | 'BLOCKED'): string {
  switch (status) {
    case 'BLOCKED':
      return '#FF003C'; // Red Neon
    case 'HIGH_FRICTION':
      return '#F79F1F'; // Amber
    case 'LOW_LATENCY':
      return '#05C46B'; // Matrix Green
  }
}

// ============================================
// DEEP DIVE PANEL COMPONENT
// ============================================

export default function DeepDivePanel({ student, onClose }: DeepDivePanelProps) {
  // Don't render if no student selected
  if (!student) return null;

  // Calculate velocity recovery
  const velocityRecovery = useMemo(
    () => calculateVelocityRecovery(student),
    [student]
  );

  // Generate sparkline data
  const { data: sparklineData, interventionIndex } = useMemo(
    () => generateSparklineData(student),
    [student]
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-end justify-center">
      <div
        className="w-full max-w-7xl bg-slate-900 border-t border-slate-800 rounded-t-3xl p-8 animate-slide-up"
        style={{ maxHeight: '70vh', overflowY: 'auto' }}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-6 pb-6 border-b border-slate-800">
          <div>
            <h2 className="text-3xl font-black text-white uppercase tracking-ultra mb-2">
              {student.firstName} {student.lastName}
            </h2>
            <p className="text-slate-400 text-sm uppercase tracking-widest">
              {student.currentCourse} • {student.campus} • ID: {student.id}
            </p>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white font-black text-xs uppercase rounded-lg transition"
          >
            Close
          </button>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Column 1: Sparkline & Velocity Recovery */}
          <div className="lg:col-span-2 space-y-6">
            {/* Velocity Recovery KPI */}
            {velocityRecovery.hasIntervention && (
              <div
                className={`p-6 rounded-2xl border-2 ${
                  velocityRecovery.successful
                    ? 'bg-green-950/20 border-green-900/50'
                    : 'bg-red-950/20 border-red-900/50'
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-black text-white uppercase tracking-widest">
                    🎯 Velocity Recovery Analysis
                  </h3>
                  <span
                    className={`text-xs px-3 py-1 rounded-full font-bold uppercase ${
                      velocityRecovery.successful
                        ? 'bg-green-900/50 text-green-400'
                        : 'bg-red-900/50 text-red-400'
                    }`}
                  >
                    {velocityRecovery.successful ? '✅ Successful' : '❌ Needs Follow-Up'}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-slate-500 text-[10px] uppercase tracking-widest mb-1">
                      Before Intervention
                    </p>
                    <p className="text-2xl font-black text-white font-mono">
                      {velocityRecovery.velocityBefore.toFixed(2)}
                    </p>
                    <p className="text-slate-600 text-xs">% per week</p>
                  </div>

                  <div>
                    <p className="text-slate-500 text-[10px] uppercase tracking-widest mb-1">
                      After 24h
                    </p>
                    <p className="text-2xl font-black text-white font-mono">
                      {velocityRecovery.velocityAfter.toFixed(2)}
                    </p>
                    <p className="text-slate-600 text-xs">% per week</p>
                  </div>

                  <div>
                    <p className="text-slate-500 text-[10px] uppercase tracking-widest mb-1">
                      Velocity Recovery
                    </p>
                    <p
                      className={`text-3xl font-black font-mono ${
                        velocityRecovery.recovery > 0 ? 'text-green-400' : 'text-red-400'
                      }`}
                    >
                      {velocityRecovery.recovery > 0 ? '+' : ''}
                      {velocityRecovery.recovery.toFixed(2)}
                    </p>
                    <p
                      className={`text-xs font-bold font-mono ${
                        velocityRecovery.recovery > 0 ? 'text-green-500' : 'text-red-500'
                      }`}
                    >
                      {velocityRecovery.recovery > 0
                        ? `+${((velocityRecovery.recovery / velocityRecovery.velocityBefore) * 100).toFixed(0)}% improvement`
                        : `${((velocityRecovery.recovery / velocityRecovery.velocityBefore) * 100).toFixed(0)}% decline`}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Sparkline: Last 10 Attempts */}
            <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-6">
              <h3 className="text-sm font-black text-white uppercase tracking-widest mb-4">
                📊 Performance Trajectory (Last 10 Attempts)
              </h3>

              {sparklineData.length > 0 ? (
                <div className="h-48 relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={sparklineData}>
                      <XAxis
                        dataKey="index"
                        stroke="#475569"
                        tick={{ fontSize: 10, fill: '#64748b' }}
                      />
                      <YAxis
                        domain={[0, 100]}
                        stroke="#475569"
                        tick={{ fontSize: 10, fill: '#64748b' }}
                        label={{
                          value: 'Accuracy (%)',
                          angle: -90,
                          position: 'insideLeft',
                          style: { fontSize: 10, fill: '#64748b' },
                        }}
                      />

                      {/* Intervention Marker - Vertical Dashed Line */}
                      {interventionIndex !== null && (
                        <ReferenceLine
                          x={interventionIndex}
                          stroke="#F79F1F"
                          strokeDasharray="5 5"
                          strokeWidth={2}
                          label={{
                            value: '🎯 INTERVENTION',
                            position: 'top',
                            style: {
                              fontSize: 10,
                              fill: '#F79F1F',
                              fontWeight: 'bold',
                            },
                          }}
                        />
                      )}

                      {/* Accuracy Line */}
                      <Line
                        type="monotone"
                        dataKey="accuracy"
                        stroke="#66FCF1"
                        strokeWidth={3}
                        dot={{ fill: '#66FCF1', r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>

                  {interventionIndex !== null && (
                    <p className="text-slate-500 text-xs mt-2 text-center">
                      🎯 Last intervention occurred at attempt #{interventionIndex + 1}
                    </p>
                  )}
                </div>
              ) : (
                <div className="h-48 flex items-center justify-center">
                  <p className="text-slate-600 text-sm">No activity data available</p>
                </div>
              )}
            </div>
          </div>

          {/* Column 2: Mastery Latencies & Metrics */}
          <div className="space-y-6">
            {/* Core Metrics */}
            <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-4">
              <h3 className="text-xs font-black text-white uppercase tracking-widest mb-3">
                Core Metrics
              </h3>

              <div className="space-y-3">
                <div>
                  <p className="text-slate-600 text-[9px] uppercase mb-1">Progress</p>
                  <p className="text-xl font-black text-white font-mono">
                    {student.progress.toFixed(1)}%
                  </p>
                </div>

                <div>
                  <p className="text-slate-600 text-[9px] uppercase mb-1">Risk Score</p>
                  <p
                    className={`text-xl font-black font-mono ${
                      student.riskScore >= 60
                        ? 'text-red-400'
                        : student.riskScore >= 35
                        ? 'text-amber-400'
                        : 'text-green-400'
                    }`}
                  >
                    {student.riskScore.toFixed(0)}
                  </p>
                </div>

                <div>
                  <p className="text-slate-600 text-[9px] uppercase mb-1">
                    Urgency Score
                  </p>
                  <p className="text-xl font-black text-[#66FCF1] font-mono">
                    {student.urgencyScore}
                  </p>
                </div>

                <div>
                  <p className="text-slate-600 text-[9px] uppercase mb-1">
                    Velocity Status
                  </p>
                  <p
                    className={`text-sm font-black ${
                      student.velocity.status === 'RED_SHIFT'
                        ? 'text-red-400'
                        : student.velocity.status === 'BLUE_SHIFT'
                        ? 'text-blue-400'
                        : 'text-green-400'
                    }`}
                  >
                    {student.velocity.status}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5 font-mono">
                    {student.metrics.velocity.toFixed(2)}% / week
                  </p>
                </div>
              </div>
            </div>

            {/* Mastery Latencies */}
            <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-4">
              <h3 className="text-xs font-black text-white uppercase tracking-widest mb-3">
                Mastery Latencies
              </h3>

              <div className="space-y-2 max-h-48 overflow-y-auto">
                {Object.entries(student.masteryLatencies)
                  .slice(0, 8)
                  .map(([topic, latency]) => (
                    <div
                      key={topic}
                      className="flex items-center justify-between text-[10px] p-2 bg-slate-900/50 rounded-lg"
                    >
                      <span className="text-slate-400 truncate mr-2">{topic}</span>
                      <span
                        className="font-bold px-2 py-0.5 rounded uppercase"
                        style={{
                          color: getLatencyColor(latency.status),
                          backgroundColor: `${getLatencyColor(latency.status)}20`,
                        }}
                      >
                        {latency.status === 'BLOCKED'
                          ? '🚨 BLOCKED'
                          : latency.status === 'HIGH_FRICTION'
                          ? '⚠️ FRICTION'
                          : '✅ FLOW'}
                      </span>
                    </div>
                  ))}
              </div>
            </div>

            {/* Intervention History */}
            {student.interventionHistory.length > 0 && (
              <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-4">
                <h3 className="text-xs font-black text-white uppercase tracking-widest mb-3">
                  Intervention History
                </h3>

                <div className="space-y-2">
                  {student.interventionHistory.slice(0, 3).map((intervention, idx) => (
                    <div
                      key={intervention.id}
                      className="p-2 bg-slate-900/50 rounded-lg text-[10px]"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-slate-400">
                          {intervention.timestamp.toLocaleDateString()}
                        </span>
                        <span
                          className={`font-bold px-2 py-0.5 rounded ${
                            intervention.successful
                              ? 'bg-green-900/30 text-green-400'
                              : 'bg-red-900/30 text-red-400'
                          }`}
                        >
                          {intervention.successful ? '✅' : '❌'}
                        </span>
                      </div>
                      <p className="text-white font-bold">{intervention.dri}</p>
                      <p className="text-slate-500 text-[9px] mt-1">
                        {intervention.level} • {intervention.reason}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CSS Animation */}
      <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
