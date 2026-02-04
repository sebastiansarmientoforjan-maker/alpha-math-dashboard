// ============================================
// ALPHA MATH COMMAND v7.0 - DEMO PAGE
// ============================================
// Demo page to test RadarView (Zone A) with mock data

'use client';

import { useEffect, useState } from 'react';
import { useCommandStore, EnrichedStudent } from '@/lib/command-store';
import RadarView from '@/components/command/RadarView';

export default function CommandDemoPage() {
  const { students, loading, error, loadData } = useCommandStore();
  const [selectedStudent, setSelectedStudent] = useState<EnrichedStudent | null>(null);

  // Load data on mount
  useEffect(() => {
    if (students.length === 0 && !loading) {
      console.log('🚀 Loading Command v7 data...');
      loadData();
    }
  }, [students.length, loading, loadData]);

  // Handle student click from radar
  const handleStudentClick = (student: EnrichedStudent) => {
    console.log('📍 Student clicked:', student.firstName, student.lastName);
    setSelectedStudent(student);
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-pulse">🎯</div>
          <p className="text-[#66FCF1] font-black text-xl uppercase tracking-widest">
            Initializing Command v7...
          </p>
          <p className="text-slate-500 text-sm mt-2">
            Loading 1,600 students and computing metrics
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <p className="text-red-400 font-black text-xl uppercase tracking-widest mb-2">
            Error Loading Data
          </p>
          <p className="text-slate-500 text-sm">{error}</p>
          <button
            onClick={() => loadData()}
            className="mt-4 px-6 py-2 bg-[#66FCF1] text-black font-black text-sm uppercase rounded-lg hover:bg-[#66FCF1]/90 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] p-8">
      {/* Header */}
      <header className="mb-8 border-b border-slate-800 pb-6">
        <h1 className="text-4xl font-black text-white uppercase tracking-ultra mb-2">
          ALPHA MATH COMMAND v7.0
        </h1>
        <p className="text-[#66FCF1] text-sm uppercase tracking-widest">
          Demo: Radar View (Zone A) • {students.length} Students Loaded
        </p>
      </header>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Radar View - Zone A (Main) */}
        <div className="lg:col-span-2 h-[800px]">
          <RadarView students={students} onStudentClick={handleStudentClick} />
        </div>

        {/* Student Detail Panel (Right) */}
        <div className="lg:col-span-1">
          {selectedStudent ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <div className="mb-4 pb-4 border-b border-slate-700">
                <h3 className="text-xl font-black text-white uppercase">
                  {selectedStudent.firstName} {selectedStudent.lastName}
                </h3>
                <p className="text-slate-400 text-xs uppercase tracking-widest mt-1">
                  {selectedStudent.currentCourse}
                </p>
                <p className="text-slate-500 text-[10px] uppercase mt-1">
                  {selectedStudent.campus} • ID: {selectedStudent.id}
                </p>
              </div>

              {/* Metrics */}
              <div className="space-y-4">
                <div>
                  <label className="text-slate-500 text-[10px] uppercase font-bold mb-2 block">
                    Progress
                  </label>
                  <div className="text-3xl font-black text-white">
                    {selectedStudent.progress.toFixed(1)}%
                  </div>
                </div>

                <div>
                  <label className="text-slate-500 text-[10px] uppercase font-bold mb-2 block">
                    Velocity Status
                  </label>
                  <div
                    className={`text-2xl font-black ${
                      selectedStudent.velocity.status === 'RED_SHIFT'
                        ? 'text-red-400'
                        : selectedStudent.velocity.status === 'BLUE_SHIFT'
                        ? 'text-blue-400'
                        : 'text-green-400'
                    }`}
                  >
                    {selectedStudent.velocity.status}
                  </div>
                  <div className="text-sm text-slate-400 mt-1">
                    Current: {selectedStudent.metrics.velocity.toFixed(2)}% / week
                  </div>
                  <div className="text-sm text-slate-400">
                    Required: {selectedStudent.velocity.requiredRate.toFixed(2)}% / week
                  </div>
                </div>

                <div>
                  <label className="text-slate-500 text-[10px] uppercase font-bold mb-2 block">
                    Risk Score
                  </label>
                  <div
                    className={`text-3xl font-black ${
                      selectedStudent.riskScore >= 60
                        ? 'text-red-400'
                        : selectedStudent.riskScore >= 35
                        ? 'text-amber-400'
                        : 'text-green-400'
                    }`}
                  >
                    {selectedStudent.riskScore.toFixed(0)}
                  </div>
                </div>

                <div>
                  <label className="text-slate-500 text-[10px] uppercase font-bold mb-2 block">
                    Urgency Score
                  </label>
                  <div className="text-3xl font-black text-[#66FCF1]">
                    {selectedStudent.urgencyScore}
                  </div>
                </div>

                {/* Mastery Latencies */}
                <div>
                  <label className="text-slate-500 text-[10px] uppercase font-bold mb-2 block">
                    Mastery Latencies
                  </label>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {Object.entries(selectedStudent.masteryLatencies).slice(0, 5).map(([topic, latency]) => (
                      <div key={topic} className="flex justify-between text-xs">
                        <span className="text-slate-400 truncate mr-2">{topic}</span>
                        <span
                          className={`font-bold ${
                            latency.status === 'BLOCKED'
                              ? 'text-red-400'
                              : latency.status === 'HIGH_FRICTION'
                              ? 'text-amber-400'
                              : 'text-green-400'
                          }`}
                        >
                          {latency.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Intervention History */}
                {selectedStudent.interventionHistory.length > 0 && (
                  <div>
                    <label className="text-slate-500 text-[10px] uppercase font-bold mb-2 block">
                      Intervention History
                    </label>
                    <div className="text-sm text-slate-400">
                      {selectedStudent.interventionHistory.length} interventions recorded
                    </div>
                    <div className="text-xs text-[#66FCF1] mt-1">
                      Last: {selectedStudent.interventionHistory[0].dri} ({selectedStudent.interventionHistory[0].level})
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={() => setSelectedStudent(null)}
                className="mt-6 w-full px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white font-black text-xs uppercase rounded-lg transition"
              >
                Close
              </button>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center">
              <div className="text-6xl mb-4 opacity-30">📡</div>
              <p className="text-slate-500 text-sm uppercase tracking-widest">
                Click a student on the radar
              </p>
              <p className="text-slate-600 text-xs mt-2">
                Select any dot to view detailed metrics
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
