// ============================================
// ALPHA MATH COMMAND v7.0 - TRIAGE QUEUE (ZONE B)
// ============================================
// STRICT MODE: Right sidebar with urgency-sorted students
// Part 2.2 (Triage Queue) + JITAI intervention dispatch

'use client';

import { useMemo } from 'react';
import { EnrichedStudent } from '@/lib/command-store';
import { formatDistanceToNow } from 'date-fns';

// ============================================
// TYPES
// ============================================

interface TriageQueueProps {
  students: EnrichedStudent[];
  onStudentSelect?: (student: EnrichedStudent) => void;
  maxVisible?: number;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Calculate "time stuck" for student
 * Uses most critical blocked mastery latency or defaults to hours since last update
 */
function calculateTimeStuck(student: EnrichedStudent): number {
  // Find BLOCKED mastery latencies
  const blockedLatencies = Object.values(student.masteryLatencies).filter(
    (latency) => latency.status === 'BLOCKED'
  );

  if (blockedLatencies.length > 0) {
    // Use the worst blocked time
    const worstLatency = blockedLatencies.reduce((worst, current) =>
      current.deltaTime > worst.deltaTime ? current : worst
    );
    return worstLatency.deltaTime * 60; // Convert hours to minutes
  }

  // Fallback: Time since last update
  const lastUpdate = new Date(student.lastUpdated);
  const now = new Date();
  const minutesSinceUpdate = (now.getTime() - lastUpdate.getTime()) / (1000 * 60);
  return minutesSinceUpdate;
}

/**
 * Format time stuck as human-readable string
 */
function formatTimeStuck(minutes: number): string {
  if (minutes < 60) {
    return `${Math.round(minutes)}m`;
  } else if (minutes < 1440) {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  } else {
    const days = Math.floor(minutes / 1440);
    return `${days}d`;
  }
}

/**
 * Get urgency color based on risk score
 */
function getUrgencyColor(riskScore: number): string {
  if (riskScore >= 80) return '#FF003C'; // Red Neon - Critical
  if (riskScore >= 60) return '#F79F1F'; // Amber - High
  if (riskScore >= 40) return '#F59E0B'; // Yellow - Medium
  return '#66FCF1'; // Cyan - Normal
}

/**
 * Get reason label for alert
 */
function getAlertReason(student: EnrichedStudent): string {
  // Check for BLOCKED mastery
  const hasBlocked = Object.values(student.masteryLatencies).some(
    (latency) => latency.status === 'BLOCKED'
  );
  if (hasBlocked) return 'MASTERY BLOCKED';

  // Check velocity status
  if (student.velocity.status === 'RED_SHIFT') return 'RED SHIFT VELOCITY';

  // Check for unproductive spin
  const hasUnproductiveSpin = Object.values(student.spinDetections).some(
    (spin) => spin.interventionRequired
  );
  if (hasUnproductiveSpin) return 'UNPRODUCTIVE SPIN';

  // Default
  return 'HIGH RISK SCORE';
}

// ============================================
// TRIAGE QUEUE COMPONENT
// ============================================

export default function TriageQueue({
  students,
  onStudentSelect,
  maxVisible = 10,
}: TriageQueueProps) {
  // STRICT ORDERING: Sort by riskScore DESCENDING (critical first)
  const sortedStudents = useMemo(() => {
    return [...students]
      .sort((a, b) => b.riskScore - a.riskScore) // DESCENDING by riskScore
      .slice(0, maxVisible);
  }, [students, maxVisible]);

  // Calculate time stuck for each student
  const studentsWithTimeStuck = useMemo(() => {
    return sortedStudents.map((student) => ({
      student,
      timeStuckMinutes: calculateTimeStuck(student),
    }));
  }, [sortedStudents]);

  // Statistics
  const criticalCount = students.filter((s) => s.riskScore >= 60).length;
  const totalCount = students.length;

  /**
   * Handle "Summon" button click
   * Logs to console and dispatches intervention
   */
  const handleSummon = (student: EnrichedStudent) => {
    console.log(`🚨 Dispatching Guide to [${student.id}]`);
    console.log(`   Student: ${student.firstName} ${student.lastName}`);
    console.log(`   Risk Score: ${student.riskScore}`);
    console.log(`   Campus: ${student.campus}`);
    console.log(`   Urgency: ${student.urgencyScore}`);

    // Optional: Call parent handler
    if (onStudentSelect) {
      onStudentSelect(student);
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#050505]">
      {/* Header */}
      <div className="mb-4 pb-4 border-b border-slate-800">
        <h2 className="text-xl font-black text-white uppercase tracking-ultra mb-2">
          TRIAGE QUEUE
        </h2>
        <p className="text-slate-500 text-[9px] uppercase tracking-widest">
          Zone B: Actionable Alerts • Sorted by Risk
        </p>

        {/* Stats */}
        <div className="flex items-center gap-3 mt-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-[10px] text-slate-400">
              <span className="text-red-400 font-bold">{criticalCount}</span> CRITICAL
            </span>
          </div>
          <span className="text-slate-700">•</span>
          <span className="text-[10px] text-slate-500">
            {totalCount} Total
          </span>
        </div>
      </div>

      {/* Queue List */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-2">
        {studentsWithTimeStuck.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-3 opacity-30">✅</div>
            <p className="text-slate-500 text-sm uppercase tracking-widest">
              Clean Board
            </p>
            <p className="text-slate-600 text-xs mt-1">No critical alerts</p>
          </div>
        ) : (
          studentsWithTimeStuck.map(({ student, timeStuckMinutes }, index) => {
            const urgencyColor = getUrgencyColor(student.riskScore);
            const alertReason = getAlertReason(student);

            return (
              <div
                key={student.id}
                className="bg-slate-900 border border-slate-800 rounded-xl p-3 hover:border-slate-700 transition-colors cursor-pointer"
                onClick={() => onStudentSelect && onStudentSelect(student)}
              >
                {/* Urgency Indicator */}
                <div
                  className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl"
                  style={{ backgroundColor: urgencyColor }}
                />

                {/* Rank Badge */}
                <div className="flex items-start gap-3">
                  <div
                    className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs"
                    style={{
                      backgroundColor: `${urgencyColor}20`,
                      color: urgencyColor,
                    }}
                  >
                    #{index + 1}
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Student Name */}
                    <h4 className="text-white font-black text-sm uppercase truncate">
                      {student.firstName} {student.lastName}
                    </h4>

                    {/* Course & Campus */}
                    <p className="text-slate-500 text-[9px] uppercase tracking-widest mt-0.5">
                      {student.currentCourse} • {student.campus}
                    </p>

                    {/* Alert Reason */}
                    <div className="mt-2">
                      <span
                        className="text-[8px] px-2 py-0.5 rounded font-bold uppercase"
                        style={{
                          backgroundColor: `${urgencyColor}20`,
                          color: urgencyColor,
                        }}
                      >
                        {alertReason}
                      </span>
                    </div>

                    {/* Time Stuck */}
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-slate-600 text-[9px] uppercase">
                        Time Stuck:
                      </span>
                      <span className="text-slate-400 font-bold text-[10px]">
                        {formatTimeStuck(timeStuckMinutes)}
                      </span>
                    </div>

                    {/* Metrics Row */}
                    <div className="flex items-center gap-3 mt-2 text-[9px]">
                      <div className="flex items-center gap-1">
                        <span className="text-slate-600">Risk:</span>
                        <span className="text-white font-bold">
                          {student.riskScore.toFixed(0)}
                        </span>
                      </div>
                      <span className="text-slate-700">•</span>
                      <div className="flex items-center gap-1">
                        <span className="text-slate-600">Velocity:</span>
                        <span
                          className={`font-bold ${
                            student.velocity.status === 'RED_SHIFT'
                              ? 'text-red-400'
                              : student.velocity.status === 'BLUE_SHIFT'
                              ? 'text-blue-400'
                              : 'text-green-400'
                          }`}
                        >
                          {student.metrics.velocity.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSummon(student);
                    }}
                    className="flex-1 px-3 py-1.5 bg-red-900/30 hover:bg-red-900/50 text-red-400 hover:text-red-300 font-black text-[9px] uppercase rounded-lg transition-colors border border-red-900/50"
                  >
                    🔔 Summon
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      console.log(`📱 Dispatching Guide to [${student.id}]`);
                    }}
                    className="flex-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-300 font-black text-[9px] uppercase rounded-lg transition-colors"
                  >
                    📱 Dispatch
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      {studentsWithTimeStuck.length > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-800">
          <p className="text-slate-600 text-[9px] uppercase tracking-widest text-center">
            Showing top {studentsWithTimeStuck.length} of {totalCount} students
          </p>
        </div>
      )}
    </div>
  );
}
