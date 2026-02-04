// ============================================
// ALPHA MATH COMMAND v7.0 - RADAR VIEW (ZONE A)
// ============================================
// STRICT MODE: Air Traffic Control scatter plot for 1,600 students
// Part 2.1 (Zone A) + Executive Context (ATC Metaphor)

'use client';

import { useState, useMemo } from 'react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceArea,
  Cell,
} from 'recharts';
import { EnrichedStudent } from '@/lib/command-store';

// ============================================
// TYPES
// ============================================

interface RadarViewProps {
  students: EnrichedStudent[];
  onStudentClick?: (student: EnrichedStudent) => void;
}

interface RadarDataPoint {
  student: EnrichedStudent;
  x: number; // courseProgress (0-100)
  y: number; // velocity (0-3.5)
  color: string; // Point color
  size: number; // Point radius
  isBlocked: boolean; // Triggers pulse animation
  isRedShift: boolean; // Behind schedule
}

// ============================================
// CONFIGURATION
// ============================================

const COLORS = {
  VANTABLACK: '#050505', // Background
  CYAN_NEON: '#66FCF1', // Normal students
  RED_NEON: '#FF003C', // Critical students
  MATRIX_GREEN: 'rgba(5, 196, 107, 0.1)', // Glide path
  GRID: 'rgba(69, 162, 158, 0.1)', // Grid lines
  TEXT: '#94a3b8', // Axis labels
};

const GLIDE_PATH = {
  MIN_VELOCITY: 0.8, // Lower bound of ideal trajectory
  MAX_VELOCITY: 1.5, // Upper bound of ideal trajectory
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Check if student is BLOCKED (MasteryLatency > 120 minutes)
 */
function isStudentBlocked(student: EnrichedStudent): boolean {
  return Object.values(student.masteryLatencies).some(
    (latency) => latency.status === 'BLOCKED'
  );
}

/**
 * Transform students into radar data points
 */
function transformToRadarData(students: EnrichedStudent[]): RadarDataPoint[] {
  return students.map((student) => {
    const isBlocked = isStudentBlocked(student);
    const isRedShift = student.velocity.status === 'RED_SHIFT';
    const isCritical = student.riskScore > 50;

    // Color logic
    let color = COLORS.CYAN_NEON; // Default: Normal
    if (isCritical || isBlocked) {
      color = COLORS.RED_NEON; // Critical: Red
    }

    // Size proportional to risk score
    const size = 4 + (student.riskScore / 100) * 6; // 4-10px radius

    return {
      student,
      x: student.progress,
      y: student.metrics.velocity,
      color,
      size,
      isBlocked,
      isRedShift,
    };
  });
}

// ============================================
// CUSTOM DOT COMPONENT
// ============================================

interface CustomDotProps {
  cx: number;
  cy: number;
  payload: RadarDataPoint;
}

/**
 * Custom dot with pulse animation for BLOCKED students
 */
function CustomDot({ cx, cy, payload }: CustomDotProps) {
  const { color, size, isBlocked } = payload;

  return (
    <g>
      {/* Pulse ring for BLOCKED students */}
      {isBlocked && (
        <circle
          cx={cx}
          cy={cy}
          r={size * 2}
          fill="none"
          stroke={color}
          strokeWidth={2}
          opacity={0.6}
          className="radar-pulse"
        />
      )}

      {/* Main dot */}
      <circle
        cx={cx}
        cy={cy}
        r={size}
        fill={color}
        stroke={isBlocked ? color : 'transparent'}
        strokeWidth={2}
        className={isBlocked ? 'radar-dot-blocked' : 'radar-dot'}
        style={{ cursor: 'pointer' }}
      />
    </g>
  );
}

// ============================================
// CUSTOM TOOLTIP
// ============================================

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
}

/**
 * Flight card tooltip showing student details
 */
function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  const data = payload[0].payload as RadarDataPoint;
  const { student } = data;

  return (
    <div
      className="bg-slate-900 border border-slate-700 rounded-lg p-3 shadow-2xl"
      style={{ minWidth: '200px' }}
    >
      {/* Header */}
      <div className="mb-2 pb-2 border-b border-slate-700">
        <h4 className="text-white font-black text-sm uppercase">
          {student.firstName} {student.lastName}
        </h4>
        <p className="text-slate-400 text-[10px] uppercase tracking-widest mt-1">
          {student.currentCourse}
        </p>
      </div>

      {/* Metrics */}
      <div className="space-y-1.5 text-[10px]">
        <div className="flex justify-between">
          <span className="text-slate-500">Progress:</span>
          <span className="text-white font-bold">{student.progress.toFixed(1)}%</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Velocity:</span>
          <span
            className={`font-bold ${
              student.velocity.status === 'RED_SHIFT'
                ? 'text-red-400'
                : student.velocity.status === 'BLUE_SHIFT'
                ? 'text-blue-400'
                : 'text-green-400'
            }`}
          >
            {student.metrics.velocity.toFixed(2)}% / week
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Risk Score:</span>
          <span
            className={`font-bold ${
              student.riskScore >= 60
                ? 'text-red-400'
                : student.riskScore >= 35
                ? 'text-amber-400'
                : 'text-green-400'
            }`}
          >
            {student.riskScore.toFixed(0)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Campus:</span>
          <span className="text-white font-bold">{student.campus}</span>
        </div>

        {/* Status badges */}
        <div className="flex flex-wrap gap-1 mt-2 pt-2 border-t border-slate-700">
          {data.isBlocked && (
            <span className="text-[8px] px-1.5 py-0.5 bg-red-900/30 text-red-400 rounded uppercase font-bold">
              🚨 BLOCKED
            </span>
          )}
          {data.isRedShift && (
            <span className="text-[8px] px-1.5 py-0.5 bg-red-900/30 text-red-400 rounded uppercase font-bold">
              RED SHIFT
            </span>
          )}
          {student.velocity.status === 'BLUE_SHIFT' && (
            <span className="text-[8px] px-1.5 py-0.5 bg-blue-900/30 text-blue-400 rounded uppercase font-bold">
              BLUE SHIFT
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================
// RADAR VIEW COMPONENT
// ============================================

export default function RadarView({ students, onStudentClick }: RadarViewProps) {
  const [hoveredStudent, setHoveredStudent] = useState<string | null>(null);

  // Transform students to radar data points
  const radarData = useMemo(() => transformToRadarData(students), [students]);

  // Statistics
  const stats = useMemo(() => {
    const blocked = radarData.filter((d) => d.isBlocked).length;
    const redShift = radarData.filter((d) => d.isRedShift).length;
    const critical = radarData.filter((d) => d.student.riskScore >= 60).length;

    return { blocked, redShift, critical };
  }, [radarData]);

  // Handle dot click
  const handleDotClick = (data: any) => {
    if (data && data.payload && onStudentClick) {
      const point = data.payload as RadarDataPoint;
      onStudentClick(point.student);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="mb-4">
        <h2 className="text-2xl font-black text-white uppercase tracking-ultra mb-2">
          THE RADAR
        </h2>
        <p className="text-slate-500 text-[10px] uppercase tracking-widest">
          Zone A: Air Traffic Control • {radarData.length} Students Active
        </p>

        {/* Stats Bar */}
        <div className="flex gap-4 mt-3 text-[10px]">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-slate-400">
              <span className="text-red-400 font-bold">{stats.blocked}</span> BLOCKED
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-400" />
            <span className="text-slate-400">
              <span className="text-red-400 font-bold">{stats.redShift}</span> RED SHIFT
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-cyan-400" />
            <span className="text-slate-400">
              <span className="text-cyan-400 font-bold">{stats.critical}</span> CRITICAL
            </span>
          </div>
        </div>
      </div>

      {/* Radar Chart */}
      <div className="flex-1 relative" style={{ background: COLORS.VANTABLACK }}>
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 20, right: 20, bottom: 40, left: 60 }}>
            {/* Grid */}
            <CartesianGrid strokeDasharray="3 3" stroke={COLORS.GRID} />

            {/* X Axis: Course Progress */}
            <XAxis
              type="number"
              dataKey="x"
              name="Progress"
              unit="%"
              domain={[0, 100]}
              stroke={COLORS.TEXT}
              tick={{ fontSize: 10, fill: COLORS.TEXT }}
              label={{
                value: 'COURSE PROGRESS (%)',
                position: 'bottom',
                style: {
                  fontSize: 10,
                  fill: COLORS.TEXT,
                  fontWeight: 'bold',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                },
              }}
            />

            {/* Y Axis: Velocity */}
            <YAxis
              type="number"
              dataKey="y"
              name="Velocity"
              unit="% / week"
              domain={[0, 3.5]}
              stroke={COLORS.TEXT}
              tick={{ fontSize: 10, fill: COLORS.TEXT }}
              label={{
                value: 'CURRENT VELOCITY (% / WEEK)',
                angle: -90,
                position: 'insideLeft',
                style: {
                  fontSize: 10,
                  fill: COLORS.TEXT,
                  fontWeight: 'bold',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                },
              }}
            />

            {/* THE GLIDE PATH - Ideal Trajectory Zone */}
            <ReferenceArea
              y1={GLIDE_PATH.MIN_VELOCITY}
              y2={GLIDE_PATH.MAX_VELOCITY}
              fill={COLORS.MATRIX_GREEN}
              fillOpacity={1}
              label={{
                value: 'GLIDE PATH',
                position: 'top',
                style: {
                  fontSize: 8,
                  fill: '#05C46B',
                  fontWeight: 'bold',
                  letterSpacing: '0.15em',
                },
              }}
            />

            {/* Tooltip */}
            <Tooltip content={<CustomTooltip />} cursor={false} />

            {/* Student Dots */}
            <Scatter
              data={radarData}
              onClick={handleDotClick}
              shape={<CustomDot cx={0} cy={0} payload={radarData[0]} />}
            />
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      {/* CSS for pulse animation */}
      <style jsx>{`
        :global(.radar-pulse) {
          animation: radar-pulse-animation 2s ease-in-out infinite;
        }

        @keyframes radar-pulse-animation {
          0%,
          100% {
            opacity: 0.6;
            transform: scale(1);
          }
          50% {
            opacity: 0;
            transform: scale(1.5);
          }
        }

        :global(.radar-dot-blocked) {
          animation: radar-dot-pulse 1.5s ease-in-out infinite;
        }

        @keyframes radar-dot-pulse {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.4;
          }
        }

        :global(.radar-dot) {
          transition: opacity 0.2s ease;
        }

        :global(.radar-dot:hover),
        :global(.radar-dot-blocked:hover) {
          opacity: 0.8;
        }
      `}</style>
    </div>
  );
}
