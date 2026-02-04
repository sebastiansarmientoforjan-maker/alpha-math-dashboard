'use client';

import { useState, useEffect, useMemo } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { calculateTier1Metrics } from '@/lib/metrics';
import { calculateDRIMetrics } from '@/lib/dri-calculus';
import { Student } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import CoachInterventionModal from '@/components/CoachInterventionModal';
import AlertsDropdown from '@/components/AlertsDropdown';
import FollowUpReminders from '@/components/FollowUpReminders';
import HelpModal from '@/components/HelpModal';

interface Mission {
  student: Student;
  priority: 'RED' | 'AMBER' | 'GREEN';
  reason: string;
  metric: string;
  urgency: number; // 0-100
  triggeredAt: Date;
}

export default function FieldPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
  const [showInterventionModal, setShowInterventionModal] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  // Filter states
  const [priorityFilter, setPriorityFilter] = useState<'ALL' | 'RED' | 'AMBER' | 'GREEN'>('ALL');
  const [dateRange, setDateRange] = useState<'TODAY' | '48H' | 'WEEK' | 'ALL'>('ALL');

  // Firebase real-time connection
  useEffect(() => {
    const unsubscribe = onSnapshot(query(collection(db, 'students')), (snapshot) => {
      const data = snapshot.docs.map(doc => {
        const s = { id: doc.id, ...doc.data() } as any;
        const metrics = calculateTier1Metrics(s, s.activity);
        const dri = calculateDRIMetrics({ ...s, metrics });
        return { ...s, metrics, dri };
      }) as Student[];
      setStudents(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Generate missions from student data
  const allMissions = useMemo(() => {
    const missionList: Mission[] = [];
    const now = new Date();

    students.forEach(student => {
      const rsr = student.metrics.lmp * 100;
      const riskScore = student.dri.riskScore || 0;
      const ksi = student.metrics.ksi || 0;
      const velocity = student.metrics.velocityScore || 0;

      // RED MISSIONS: Critical intervention needed
      if (riskScore >= 60 || rsr < 50) {
        missionList.push({
          student,
          priority: 'RED',
          reason: riskScore >= 60 ? 'CRITICAL RISK LEVEL' : 'LOW MASTERY RATE',
          metric: riskScore >= 60 ? `Risk: ${riskScore}/100` : `RSR: ${rsr.toFixed(0)}%`,
          urgency: riskScore,
          triggeredAt: now,
        });
      }
      // AMBER MISSIONS: Elevated risk or instability
      else if (riskScore >= 35 || ksi < 60) {
        missionList.push({
          student,
          priority: 'AMBER',
          reason: riskScore >= 35 ? 'ELEVATED RISK' : 'KNOWLEDGE INSTABILITY',
          metric: riskScore >= 35 ? `Risk: ${riskScore}/100` : `KSI: ${ksi}%`,
          urgency: riskScore,
          triggeredAt: now,
        });
      }
      // GREEN MISSIONS: Scheduled check-ins for high performers
      else if (rsr >= 85 && velocity >= 80) {
        missionList.push({
          student,
          priority: 'GREEN',
          reason: 'SCHEDULED CHECK-IN',
          metric: `RSR: ${rsr.toFixed(0)}% • V: ${velocity}%`,
          urgency: 0,
          triggeredAt: now,
        });
      }
    });

    return missionList.sort((a, b) => b.urgency - a.urgency);
  }, [students]);

  // Apply filters
  const missions = useMemo(() => {
    let filtered = allMissions;

    // Priority filter
    if (priorityFilter !== 'ALL') {
      filtered = filtered.filter(m => m.priority === priorityFilter);
    }

    // Date range filter (simulated - in production you'd check actual triggeredAt timestamps)
    if (dateRange !== 'ALL') {
      const now = new Date();
      const cutoff = new Date();
      
      if (dateRange === 'TODAY') {
        cutoff.setHours(0, 0, 0, 0);
      } else if (dateRange === '48H') {
        cutoff.setHours(cutoff.getHours() - 48);
      } else if (dateRange === 'WEEK') {
        cutoff.setDate(cutoff.getDate() - 7);
      }
      
      filtered = filtered.filter(m => m.triggeredAt >= cutoff);
    }

    return filtered;
  }, [allMissions, priorityFilter, dateRange]);

  const redMissions = useMemo(() => missions.filter(m => m.priority === 'RED').slice(0, 10), [missions]);
  const amberMissions = useMemo(() => missions.filter(m => m.priority === 'AMBER').slice(0, 10), [missions]);
  const greenMissions = useMemo(() => missions.filter(m => m.priority === 'GREEN').slice(0, 5), [missions]);

  // Clear all filters
  const clearFilters = () => {
    setPriorityFilter('ALL');
    setDateRange('ALL');
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyboard = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in input fields
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      // Clear filters
      if (e.key === 'c' && !selectedMission && !e.ctrlKey && !e.metaKey) {
        if (priorityFilter !== 'ALL' || dateRange !== 'ALL') {
          clearFilters();
        }
      }

      // Help modal
      if (e.key === '?' && !selectedMission) {
        e.preventDefault();
        setShowHelp(true);
      }

      // Escape key
      if (e.key === 'Escape') {
        if (selectedMission) {
          setSelectedMission(null);
        } else if (showHelp) {
          setShowHelp(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyboard);
    return () => window.removeEventListener('keydown', handleKeyboard);
  }, [selectedMission, priorityFilter, dateRange, showHelp]);

  if (loading) {
    return (
      <div className="min-h-screen bg-alpha-navy-bg flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-pulse">⚔️</div>
          <p className="text-alpha-gold font-bold uppercase tracking-widest">
            Loading Field Operations...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-alpha-navy-bg p-6 lg:p-12">
      
      {/* Header */}
      <header className="mb-8 border-b border-white/10 pb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-black text-white uppercase tracking-ultra">
              THE FIELD
            </h1>
            <p className="text-alpha-gold text-[10px] font-bold tracking-widest uppercase mt-1">
              Agent Mode • Tactical Intervention Center
            </p>
          </div>
          <div className="flex items-center gap-4">
            <AlertsDropdown onStudentClick={(studentId) => {
              const mission = missions.find(m => m.student.id === studentId);
              if (mission) setSelectedMission(mission);
            }} />
            
            <FollowUpReminders onStudentClick={(studentId) => {
              const mission = missions.find(m => m.student.id === studentId);
              if (mission) setSelectedMission(mission);
            }} />
            
            <a 
              href="/tower"
              className="px-4 py-2 bg-alpha-navy-light hover:bg-alpha-navy-surface border border-alpha-navy-light text-slate-400 hover:text-alpha-gold text-[10px] font-black uppercase rounded-lg transition-all"
            >
              → The Tower
            </a>
            <a 
              href="/"
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-500 hover:text-white text-[10px] font-black uppercase rounded-lg transition-all"
            >
              ← Legacy Dashboard
            </a>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="glass-card p-4 rounded-xl border-l-4 border-risk-red">
            <div className="text-[9px] text-slate-500 uppercase font-bold mb-1">Red Missions</div>
            <div className="text-3xl font-black text-risk-red">{redMissions.length}</div>
            <div className="text-[8px] text-slate-600 mt-1">Critical intervention required</div>
          </div>
          <div className="glass-card p-4 rounded-xl border-l-4 border-risk-amber">
            <div className="text-[9px] text-slate-500 uppercase font-bold mb-1">Amber Missions</div>
            <div className="text-3xl font-black text-risk-amber">{amberMissions.length}</div>
            <div className="text-[8px] text-slate-600 mt-1">Elevated risk monitoring</div>
          </div>
          <div className="glass-card p-4 rounded-xl border-l-4 border-risk-emerald">
            <div className="text-[9px] text-slate-500 uppercase font-bold mb-1">Green Check-ins</div>
            <div className="text-3xl font-black text-risk-emerald">{greenMissions.length}</div>
            <div className="text-[8px] text-slate-600 mt-1">Scheduled touchpoints</div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-4 items-center flex-wrap">
          {/* Priority Filter Tabs */}
          <div className="flex bg-slate-900/40 rounded-xl p-1 border border-slate-800">
            <button
              onClick={() => setPriorityFilter('ALL')}
              className={`px-4 py-2 text-[10px] font-black uppercase rounded-lg transition-all ${
                priorityFilter === 'ALL' 
                  ? 'bg-alpha-gold text-black' 
                  : 'text-slate-500 hover:text-white'
              }`}
            >
              All Missions
            </button>
            <button
              onClick={() => setPriorityFilter('RED')}
              className={`px-4 py-2 text-[10px] font-black uppercase rounded-lg transition-all ${
                priorityFilter === 'RED' 
                  ? 'bg-risk-red text-white' 
                  : 'text-slate-500 hover:text-risk-red'
              }`}
            >
              🚨 Red Only
            </button>
            <button
              onClick={() => setPriorityFilter('AMBER')}
              className={`px-4 py-2 text-[10px] font-black uppercase rounded-lg transition-all ${
                priorityFilter === 'AMBER' 
                  ? 'bg-risk-amber text-white' 
                  : 'text-slate-500 hover:text-risk-amber'
              }`}
            >
              ⚠️ Amber Only
            </button>
            <button
              onClick={() => setPriorityFilter('GREEN')}
              className={`px-4 py-2 text-[10px] font-black uppercase rounded-lg transition-all ${
                priorityFilter === 'GREEN' 
                  ? 'bg-risk-emerald text-white' 
                  : 'text-slate-500 hover:text-risk-emerald'
              }`}
            >
              ⚡ Green Only
            </button>
          </div>

          {/* Date Range Filter */}
          <select 
            value={dateRange} 
            onChange={(e) => setDateRange(e.target.value as any)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-[10px] font-black uppercase text-slate-400 outline-none hover:border-slate-600 transition-colors"
          >
            <option value="ALL">📅 All Time</option>
            <option value="TODAY">📅 Today</option>
            <option value="48H">📅 Last 48 Hours</option>
            <option value="WEEK">📅 This Week</option>
          </select>

          {/* Active Filter Indicator */}
          {(priorityFilter !== 'ALL' || dateRange !== 'ALL') && (
            <div className="flex items-center gap-2 text-[9px] bg-slate-900/40 px-3 py-2 rounded-xl border border-slate-800">
              <span className="text-slate-500">Showing:</span>
              <span className="text-alpha-gold font-bold">
                {missions.length} of {allMissions.length} missions
              </span>
              <button 
                onClick={() => {
                  setPriorityFilter('ALL');
                  setDateRange('ALL');
                }}
                className="text-slate-500 hover:text-white ml-2"
              >
                Clear filters
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Mission Boards */}
      <div className="space-y-8">
        
        {/* RED MISSIONS */}
        {(priorityFilter === 'ALL' || priorityFilter === 'RED') && redMissions.length > 0 && (
          <section>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-black text-risk-red uppercase flex items-center gap-2">
                🚨 CRITICAL MISSIONS
              </h2>
              <span className="text-[9px] text-slate-600 uppercase">
                {redMissions.length} active
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {redMissions.map(mission => (
                <div 
                  key={mission.student.id}
                  className="glass-card rounded-xl p-4 border-l-4 border-risk-red hover:scale-[1.02] transition-all cursor-pointer group"
                  onClick={() => setSelectedMission(mission)}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-black text-white uppercase text-sm group-hover:text-risk-red transition-colors">
                        {mission.student.firstName} {mission.student.lastName}
                      </h3>
                      <p className="text-[8px] text-slate-500 uppercase mt-1">
                        {mission.student.currentCourse?.name || 'No Course'}
                      </p>
                    </div>
                    <span className="text-risk-red text-2xl">!</span>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <div className="text-[9px] text-risk-red font-bold uppercase">
                      {mission.reason}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {mission.metric}
                    </div>
                    <div className="text-[8px] text-slate-600">
                      Triggered {formatDistanceToNow(mission.triggeredAt, { addSuffix: true })}
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedMission(mission);
                      setShowInterventionModal(true);
                    }}
                    className="w-full px-3 py-2 bg-risk-red hover:bg-risk-red/90 text-white font-black text-[9px] uppercase rounded-lg transition-all"
                  >
                    Log Intervention
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* AMBER MISSIONS */}
        {(priorityFilter === 'ALL' || priorityFilter === 'AMBER') && amberMissions.length > 0 && (
          <section>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-black text-risk-amber uppercase flex items-center gap-2">
                ⚠️ WATCH MISSIONS
              </h2>
              <span className="text-[9px] text-slate-600 uppercase">
                {amberMissions.length} active
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {amberMissions.map(mission => (
                <div 
                  key={mission.student.id}
                  className="glass-card rounded-xl p-4 border-l-4 border-risk-amber hover:scale-[1.02] transition-all cursor-pointer group"
                  onClick={() => setSelectedMission(mission)}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-black text-white uppercase text-sm group-hover:text-risk-amber transition-colors">
                        {mission.student.firstName} {mission.student.lastName}
                      </h3>
                      <p className="text-[8px] text-slate-500 uppercase mt-1">
                        {mission.student.currentCourse?.name || 'No Course'}
                      </p>
                    </div>
                    <span className="text-risk-amber text-2xl">⚠</span>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <div className="text-[9px] text-risk-amber font-bold uppercase">
                      {mission.reason}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {mission.metric}
                    </div>
                    <div className="text-[8px] text-slate-600">
                      Triggered {formatDistanceToNow(mission.triggeredAt, { addSuffix: true })}
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedMission(mission);
                      setShowInterventionModal(true);
                    }}
                    className="w-full px-3 py-2 bg-risk-amber hover:bg-risk-amber/90 text-white font-black text-[9px] uppercase rounded-lg transition-all"
                  >
                    Log Intervention
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* GREEN CHECK-INS */}
        {(priorityFilter === 'ALL' || priorityFilter === 'GREEN') && greenMissions.length > 0 && (
          <section>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-black text-risk-emerald uppercase flex items-center gap-2">
                ⚡ SCHEDULED CHECK-INS
              </h2>
              <span className="text-[9px] text-slate-600 uppercase">
                {greenMissions.length} scheduled
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {greenMissions.map(mission => (
                <div 
                  key={mission.student.id}
                  className="glass-card rounded-xl p-4 border-l-4 border-risk-emerald hover:scale-[1.02] transition-all cursor-pointer group"
                  onClick={() => setSelectedMission(mission)}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-black text-white uppercase text-sm group-hover:text-risk-emerald transition-colors">
                        {mission.student.firstName} {mission.student.lastName}
                      </h3>
                      <p className="text-[8px] text-slate-500 uppercase mt-1">
                        {mission.student.currentCourse?.name || 'No Course'}
                      </p>
                    </div>
                    <span className="text-risk-emerald text-2xl">⚡</span>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <div className="text-[9px] text-risk-emerald font-bold uppercase">
                      {mission.reason}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {mission.metric}
                    </div>
                    <div className="text-[8px] text-slate-600">
                      High performer check-in
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedMission(mission);
                      setShowInterventionModal(true);
                    }}
                    className="w-full px-3 py-2 bg-risk-emerald hover:bg-risk-emerald/90 text-white font-black text-[9px] uppercase rounded-lg transition-all"
                  >
                    Log Check-in
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Empty State */}
        {missions.length === 0 && (
          <div className="glass-card rounded-3xl p-12 text-center">
            <div className="text-6xl mb-4">✓</div>
            <h3 className="text-2xl font-black text-white mb-2">NO ACTIVE MISSIONS</h3>
            <p className="text-slate-500">All students are performing optimally with no interventions needed.</p>
          </div>
        )}

      </div>

      {/* Mission Detail Modal */}
      {selectedMission && !showInterventionModal && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card rounded-3xl p-8 max-w-2xl w-full">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-black text-white uppercase">
                  {selectedMission.student.firstName} {selectedMission.student.lastName}
                </h2>
                <p className="text-alpha-gold text-sm uppercase tracking-widest mt-1">
                  {selectedMission.student.currentCourse?.name || 'No Course'}
                </p>
              </div>
              <button 
                onClick={() => setSelectedMission(null)}
                className="text-slate-500 hover:text-white text-2xl"
              >
                ✕
              </button>
            </div>

            <div className={`p-4 rounded-xl mb-6 border-l-4 ${
              selectedMission.priority === 'RED' ? 'bg-risk-red/10 border-risk-red' :
              selectedMission.priority === 'AMBER' ? 'bg-risk-amber/10 border-risk-amber' :
              'bg-risk-emerald/10 border-risk-emerald'
            }`}>
              <div className={`text-sm font-black uppercase mb-2 ${
                selectedMission.priority === 'RED' ? 'text-risk-red' :
                selectedMission.priority === 'AMBER' ? 'text-risk-amber' :
                'text-risk-emerald'
              }`}>
                {selectedMission.reason}
              </div>
              <div className="text-slate-400 text-xs">{selectedMission.metric}</div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="glass-card p-4 rounded-xl">
                <div className="text-[9px] text-slate-500 uppercase font-bold mb-2">RSR</div>
                <div className="text-3xl font-black text-white">
                  {(selectedMission.student.metrics.lmp * 100).toFixed(0)}%
                </div>
              </div>
              <div className="glass-card p-4 rounded-xl">
                <div className="text-[9px] text-slate-500 uppercase font-bold mb-2">Risk Score</div>
                <div className={`text-3xl font-black ${
                  (selectedMission.student.dri.riskScore || 0) >= 60 ? 'text-risk-red' : 
                  (selectedMission.student.dri.riskScore || 0) >= 35 ? 'text-risk-amber' : 
                  'text-risk-emerald'
                }`}>
                  {selectedMission.student.dri.riskScore || 'N/A'}
                </div>
              </div>
              <div className="glass-card p-4 rounded-xl">
                <div className="text-[9px] text-slate-500 uppercase font-bold mb-2">Velocity</div>
                <div className="text-3xl font-black text-white">
                  {selectedMission.student.metrics.velocityScore}%
                </div>
              </div>
              <div className="glass-card p-4 rounded-xl">
                <div className="text-[9px] text-slate-500 uppercase font-bold mb-2">KSI</div>
                <div className="text-3xl font-black text-white">
                  {selectedMission.student.metrics.ksi !== null ? `${selectedMission.student.metrics.ksi}%` : 'N/A'}
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setSelectedMission(null)}
                className="flex-1 px-4 py-3 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white font-black text-[10px] uppercase rounded-lg transition-all"
              >
                Close
              </button>
              <button 
                onClick={() => setShowInterventionModal(true)}
                className="flex-1 px-4 py-3 bg-alpha-gold hover:bg-alpha-gold/90 text-black font-black text-[10px] uppercase rounded-lg hover:shadow-[0_0_15px_rgba(212,175,53,0.4)] transition-all"
              >
                Log Intervention
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Coach Intervention Modal */}
      {showInterventionModal && selectedMission && (
        <CoachInterventionModal
          student={selectedMission.student}
          onClose={() => {
            setShowInterventionModal(false);
          }}
          onSuccess={() => {
            setShowInterventionModal(false);
          }}
        />
      )}

      {/* Help Modal */}
      {showHelp && <HelpModal mode="field" onClose={() => setShowHelp(false)} />}

    </div>
  );
}
