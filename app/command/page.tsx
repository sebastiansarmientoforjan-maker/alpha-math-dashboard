// ============================================
// ALPHA MATH COMMAND v7.0 - COMMAND TOWER
// ============================================
// STRICT MODE: Single Pane of Glass with The Oracle
// Part 6 (Executive Summary) + Part 5 (The Oracle)

'use client';

import { useEffect, useMemo } from 'react';
import { useCommandStore, useFilteredStudents, EnrichedStudent } from '@/lib/command-store';
import RadarView from '@/components/command/RadarView';
import TriageQueue from '@/components/command/TriageQueue';
import DeepDivePanel from '@/components/command/DeepDivePanel';

// ============================================
// COMMAND TOWER COMPONENT
// ============================================

export default function CommandTowerPage() {
  const {
    loading,
    error,
    loadData,
    oracleQuery,
    campusFilter,
    selectedStudentId,
    setOracleQuery,
    setCampusFilter,
    setSelectedStudent,
    getStudentById,
  } = useCommandStore();

  // Get filtered students (applies Oracle query + campus filter)
  const filteredStudents = useFilteredStudents();

  // Get selected student for DeepDivePanel
  const selectedStudent = selectedStudentId ? getStudentById(selectedStudentId) : null;

  // Load data on mount
  useEffect(() => {
    if (filteredStudents.length === 0 && !loading) {
      console.log('🚀 Initializing Command Tower...');
      loadData();
    }
  }, [filteredStudents.length, loading, loadData]);

  // Statistics for header
  const stats = useMemo(() => {
    const critical = filteredStudents.filter(s => s.urgencyScore >= 60).length;
    const redShift = filteredStudents.filter(s => s.velocity.status === 'RED_SHIFT').length;
    const blocked = filteredStudents.filter(s =>
      Object.values(s.masteryLatencies).some(m => m.status === 'BLOCKED')
    ).length;

    return { total: filteredStudents.length, critical, redShift, blocked };
  }, [filteredStudents]);

  // Handle student click from Radar or Triage
  const handleStudentClick = (student: EnrichedStudent) => {
    console.log('📍 Opening Deep Dive for:', student.firstName, student.lastName);
    setSelectedStudent(student.id);
  };

  // Handle DeepDivePanel close
  const handleCloseDeepDive = () => {
    setSelectedStudent(null);
  };

  // Handle Oracle input change
  const handleOracleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setOracleQuery(e.target.value);
  };

  // Handle Campus filter change
  const handleCampusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setCampusFilter(value === 'all' ? null : value);
  };

  // Loading state
  if (loading) {
    return (
      <div className="h-screen w-screen bg-[#050505] flex items-center justify-center">
        <div className="text-center">
          <div className="text-7xl mb-6 animate-pulse">🎯</div>
          <h1 className="text-[#66FCF1] font-black text-3xl uppercase tracking-ultra mb-3">
            COMMAND TOWER ONLINE
          </h1>
          <p className="text-slate-500 text-sm uppercase tracking-widest">
            Loading 1,600 students • Computing metrics
          </p>
          <div className="mt-6 flex justify-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#66FCF1] animate-pulse" />
            <div className="w-2 h-2 rounded-full bg-[#66FCF1] animate-pulse delay-100" />
            <div className="w-2 h-2 rounded-full bg-[#66FCF1] animate-pulse delay-200" />
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="h-screen w-screen bg-[#050505] flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-7xl mb-6">❌</div>
          <h1 className="text-red-400 font-black text-2xl uppercase tracking-ultra mb-3">
            SYSTEM ERROR
          </h1>
          <p className="text-slate-500 text-sm mb-6">{error}</p>
          <button
            onClick={() => loadData()}
            className="px-6 py-3 bg-red-900/30 hover:bg-red-900/50 border border-red-900/50 text-red-400 hover:text-red-300 font-black text-sm uppercase rounded-lg transition-colors"
          >
            🔄 Retry Connection
          </button>
        </div>
      </div>
    );
  }

  // Main Command Tower UI
  return (
    <div className="h-screen w-screen overflow-hidden bg-[#050505] flex flex-col font-sans">
      {/* ============================================
          HEADER - THE ORACLE + CAMPUS SWITCHER
          ============================================ */}
      <header className="h-[60px] border-b border-white/10 flex items-center px-6 gap-6">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="text-2xl">🎯</div>
          <div>
            <h1 className="text-white font-black text-sm uppercase tracking-ultra leading-none">
              COMMAND v7
            </h1>
            <p className="text-[#66FCF1] text-[9px] uppercase tracking-widest">
              Single Pane of Glass
            </p>
          </div>
        </div>

        {/* THE ORACLE - Terminal-style search */}
        <div className="flex-1 max-w-2xl relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#66FCF1] text-sm">
            &gt;
          </div>
          <input
            type="text"
            value={oracleQuery}
            onChange={handleOracleChange}
            placeholder='Type "Critical", "Blocked", "Red Shift", or student name...'
            className="w-full h-10 bg-slate-900/50 border border-slate-800 rounded-lg pl-8 pr-4 text-white text-sm font-mono placeholder:text-slate-600 focus:outline-none focus:border-[#66FCF1] transition-colors"
          />
          {oracleQuery && (
            <button
              onClick={() => setOracleQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors text-xs"
            >
              ✕
            </button>
          )}
        </div>

        {/* Statistics */}
        <div className="flex items-center gap-4 text-[10px]">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-slate-400">
              <span className="text-red-400 font-bold font-mono">{stats.critical}</span> CRITICAL
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-red-400" />
            <span className="text-slate-400">
              <span className="text-red-400 font-bold font-mono">{stats.redShift}</span> RED SHIFT
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-cyan-400" />
            <span className="text-slate-400">
              <span className="text-cyan-400 font-bold font-mono">{stats.blocked}</span> BLOCKED
            </span>
          </div>
        </div>

        {/* Campus Switcher */}
        <div className="flex items-center gap-2">
          <span className="text-slate-500 text-[10px] uppercase tracking-widest">Campus:</span>
          <select
            value={campusFilter || 'all'}
            onChange={handleCampusChange}
            className="h-9 px-3 bg-slate-900/50 border border-slate-800 rounded-lg text-white text-xs font-bold uppercase tracking-wide focus:outline-none focus:border-[#66FCF1] transition-colors cursor-pointer"
          >
            <option value="all">All Campuses</option>
            <option value="Austin">Austin</option>
            <option value="SF">SF</option>
            <option value="Miami">Miami</option>
          </select>
        </div>
      </header>

      {/* ============================================
          BODY - RADAR (LEFT) + TRIAGE (RIGHT)
          ============================================ */}
      <div className="flex-1 flex overflow-hidden">
        {/* ZONE A: RADAR VIEW (Left - Flex-1) */}
        <div className="flex-1 border-r border-white/10 p-6 overflow-hidden">
          <RadarView students={filteredStudents} onStudentClick={handleStudentClick} />
        </div>

        {/* ZONE B: TRIAGE QUEUE (Right - Fixed 350px) */}
        <div className="w-[350px] p-6 overflow-hidden">
          <TriageQueue students={filteredStudents} onStudentSelect={handleStudentClick} maxVisible={15} />
        </div>
      </div>

      {/* ============================================
          ZONE C: DEEP DIVE PANEL (Overlay from bottom)
          ============================================ */}
      {selectedStudent && (
        <DeepDivePanel student={selectedStudent} onClose={handleCloseDeepDive} />
      )}
    </div>
  );
}
