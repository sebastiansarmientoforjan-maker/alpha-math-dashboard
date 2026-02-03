'use client';

import { useState, useEffect, useMemo } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { calculateTier1Metrics } from '@/lib/metrics';
import { calculateDRIMetrics } from '@/lib/dri-calculus';
import { Student } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import CoachInterventionModal from '@/components/CoachInterventionModal';

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
  const missions = useMemo(() => {
    const missionList: Mission[] = [];
    const now = new Date();

    students.forEach(student => {
      const rsr = student.metrics.lmp * 100;
      const riskScore = student.dri.riskScore || 0;
      const ksi = student.metrics.ksi;

      // RED MISSIONS: Critical interventions
      if (riskScore >= 60 || rsr < 50) {
        missionList.push({
          student,
          priority: 'RED',
          reason: riskScore >= 60 ? 'CRITICAL RISK LEVEL' : 'RSR BELOW THRESHOLD',
          metric: riskScore >= 60 ? `Risk: ${riskScore}/100` : `RSR: ${rsr.toFixed(0)}%`,
          urgency: riskScore,
          triggeredAt: new Date(now.getTime() - Math.random() * 3600000 * 24), // Random within 24h
        });
      }
      // AMBER MISSIONS: Watch list
      else if (riskScore >= 35 || (ksi !== null && ksi < 60)) {
        missionList.push({
          student,
          priority: 'AMBER',
          reason: riskScore >= 35 ? 'ELEVATED RISK' : 'KNOWLEDGE INSTABILITY',
          metric: riskScore >= 35 ? `Risk: ${riskScore}/100` : `KSI: ${ksi}%`,
          urgency: riskScore,
          triggeredAt: new Date(now.getTime() - Math.random() * 3600000 * 48), // Random within 48h
        });
      }
      // GREEN MISSIONS: Scheduled check-ins for top performers
      else if (rsr >= 85 && student.metrics.velocityScore >= 80) {
        missionList.push({
          student,
          priority: 'GREEN',
          reason: 'SCHEDULED CHECK-IN',
          metric: `RSR: ${rsr.toFixed(0)}% • V: ${student.metrics.velocityScore}%`,
          urgency: 0,
          triggeredAt: new Date(now.getTime() - Math.random() * 3600000 * 72), // Random within 72h
        });
      }
    });

    // Sort by urgency (highest first)
    return missionList.sort((a, b) => b.urgency - a.urgency);
  }, [students]);

  // Group missions by priority
  const redMissions = useMemo(() => missions.filter(m => m.priority === 'RED').slice(0, 10), [missions]);
  const amberMissions = useMemo(() => missions.filter(m => m.priority === 'AMBER').slice(0, 10), [missions]);
  const greenMissions = useMemo(() => missions.filter(m => m.priority === 'GREEN').slice(0, 5), [missions]);

  if (loading) {
    return (
      <div className="min-h-screen bg-alpha-navy-bg flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-pulse">⚔️</div>
          <p className="text-alpha-gold font-bold uppercase tracking-widest">
            Loading Tactical Operations...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-alpha-navy-bg">
      
      {/* Header */}
      <header className="border-b border-white/10 p-6">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div>
            <h1 className="text-2xl font-black text-white uppercase tracking-ultra">
              THE FIELD
            </h1>
            <p className="text-alpha-gold text-[9px] font-bold tracking-widest uppercase mt-1">
              Tactical Intervention Center • {missions.length} Active Missions
            </p>
          </div>
          <div className="flex items-center gap-4">
            <a 
              href="/tower"
              className="px-4 py-2 bg-alpha-navy-light hover:bg-alpha-navy-surface border border-alpha-navy-light text-slate-400 hover:text-alpha-gold text-[10px] font-black uppercase rounded-lg transition-all"
            >
              ← The Tower
            </a>
            <a 
              href="/"
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-500 hover:text-white text-[10px] font-black uppercase rounded-lg transition-all"
            >
              ← Legacy Dashboard
            </a>
          </div>
        </div>
      </header>

      {/* Stats Bar */}
      <div className="border-b border-white/10 p-4 bg-slate-900/20">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6 text-[10px] font-mono">
            <div>
              <span className="text-slate-600">RED MISSIONS:</span>
              <span className="text-risk-red font-black ml-2">{redMissions.length}</span>
            </div>
            <div>
              <span className="text-slate-600">AMBER MISSIONS:</span>
              <span className="text-risk-amber font-black ml-2">{amberMissions.length}</span>
            </div>
            <div>
              <span className="text-slate-600">GREEN CHECK-INS:</span>
              <span className="text-risk-emerald font-black ml-2">{greenMissions.length}</span>
            </div>
          </div>
          <div className="text-[9px] text-slate-600 uppercase tracking-widest">
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </div>
        </div>
      </div>

      {/* Mission Queue */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        
        {/* Red Missions */}
        {redMissions.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-xl font-black text-risk-red uppercase tracking-wider">
                🚨 CRITICAL MISSIONS
              </h2>
              <span className="px-2 py-1 bg-risk-red/20 text-risk-red text-[9px] font-black rounded">
                {redMissions.length} URGENT
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {redMissions.map((mission, idx) => (
                <MissionCard 
                  key={`red-${mission.student.id}-${idx}`} 
                  mission={mission} 
                  onClick={() => setSelectedMission(mission)}
                  onLogIntervention={() => {
                    setSelectedMission(mission);
                    setShowInterventionModal(true);
                  }}
                />
              ))}
            </div>
          </section>
        )}

        {/* Amber Missions */}
        {amberMissions.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-xl font-black text-risk-amber uppercase tracking-wider">
                ⚠️ WATCH MISSIONS
              </h2>
              <span className="px-2 py-1 bg-risk-amber/20 text-risk-amber text-[9px] font-black rounded">
                {amberMissions.length} MONITORING
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {amberMissions.map((mission, idx) => (
                <MissionCard 
                  key={`amber-${mission.student.id}-${idx}`} 
                  mission={mission} 
                  onClick={() => setSelectedMission(mission)}
                  onLogIntervention={() => {
                    setSelectedMission(mission);
                    setShowInterventionModal(true);
                  }}
                />
              ))}
            </div>
          </section>
        )}

        {/* Green Missions */}
        {greenMissions.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-xl font-black text-risk-emerald uppercase tracking-wider">
                ⚡ SCHEDULED CHECK-INS
              </h2>
              <span className="px-2 py-1 bg-risk-emerald/20 text-risk-emerald text-[9px] font-black rounded">
                {greenMissions.length} STABLE
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {greenMissions.map((mission, idx) => (
                <MissionCard 
                  key={`green-${mission.student.id}-${idx}`} 
                  mission={mission} 
                  onClick={() => setSelectedMission(mission)}
                  onLogIntervention={() => {
                    setSelectedMission(mission);
                    setShowInterventionModal(true);
                  }}
                />
              ))}
            </div>
          </section>
        )}

        {/* Empty State */}
        {missions.length === 0 && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">✓</div>
            <h3 className="text-2xl font-black text-white uppercase mb-2">All Clear</h3>
            <p className="text-slate-500">No active missions at this time.</p>
          </div>
        )}

      </main>

      {/* Mission Modal */}
      {selectedMission && (
        <MissionModal 
          mission={selectedMission} 
          onClose={() => {
            setSelectedMission(null);
            setShowInterventionModal(false);
          }}
          onLogIntervention={() => {
            setShowInterventionModal(true);
          }}
        />
      )}

      {/* Coach Intervention Modal */}
      {showInterventionModal && selectedMission && (
        <CoachInterventionModal
          student={selectedMission.student}
          onClose={() => {
            setShowInterventionModal(false);
          }}
        />
      )}

    </div>
  );
}

// Mission Card Component
interface MissionCardProps {
  mission: Mission;
  onClick: () => void;
  onLogIntervention: () => void;
}

function MissionCard({ mission, onClick, onLogIntervention }: MissionCardProps) {
  const { student, priority, reason, metric, triggeredAt } = mission;
  
  const colorClasses = {
    RED: 'border-risk-red bg-risk-red/5 hover:bg-risk-red/10',
    AMBER: 'border-risk-amber bg-risk-amber/5 hover:bg-risk-amber/10',
    GREEN: 'border-risk-emerald bg-risk-emerald/5 hover:bg-risk-emerald/10',
  };

  const iconClasses = {
    RED: 'bg-risk-red/20 text-risk-red',
    AMBER: 'bg-risk-amber/20 text-risk-amber',
    GREEN: 'bg-risk-emerald/20 text-risk-emerald',
  };

  const handleLogClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onLogIntervention();
  };

  return (
    <div 
      onClick={onClick}
      className={`glass-card border-l-4 ${colorClasses[priority]} rounded-2xl p-5 cursor-pointer hover:translate-x-1 transition-all group`}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <div className={`w-8 h-8 rounded-full ${iconClasses[priority]} flex items-center justify-center text-xs font-black`}>
              {priority === 'RED' ? '!' : priority === 'AMBER' ? '⚠' : '✓'}
            </div>
            <div>
              <h3 className="text-white text-base font-black uppercase group-hover:text-alpha-gold transition-colors">
                {student.firstName} {student.lastName}
              </h3>
              <p className="text-[9px] text-slate-500 uppercase font-bold">
                {student.currentCourse?.name || 'No Course'}
              </p>
            </div>
          </div>
        </div>
        <div className={`px-2 py-1 rounded text-[9px] font-black ${iconClasses[priority]}`}>
          {metric}
        </div>
      </div>

      <div className="mb-4">
        <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
          {reason}
        </p>
        <p className="text-[9px] text-slate-600">
          Triggered {formatDistanceToNow(triggeredAt, { addSuffix: true })}
        </p>
      </div>

      <button 
        onClick={handleLogClick}
        className="w-full bg-alpha-gold hover:bg-alpha-gold/90 text-black py-2 rounded-lg font-black text-[10px] uppercase hover:shadow-[0_0_15px_rgba(212,175,53,0.4)] transition-all"
      >
        Log Intervention
      </button>
    </div>
  );
}

// Mission Modal Component
interface MissionModalProps {
  mission: Mission;
  onClose: () => void;
  onLogIntervention: () => void;
}

function MissionModal({ mission, onClose, onLogIntervention }: MissionModalProps) {
  const { student, priority, reason, metric } = mission;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="glass-card rounded-3xl p-8 max-w-2xl w-full">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-black text-white uppercase">
              {student.firstName} {student.lastName}
            </h2>
            <p className="text-alpha-gold text-sm uppercase tracking-widest mt-1">
              {student.currentCourse?.name || 'No Course'}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-500 hover:text-white text-2xl transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Mission Details */}
        <div className="mb-6 p-4 glass-card rounded-xl border-l-4 border-alpha-gold">
          <div className="text-[9px] text-slate-500 uppercase font-bold mb-1">Mission Type</div>
          <div className="text-alpha-gold font-black text-sm uppercase">{reason}</div>
          <div className="text-[9px] text-slate-600 mt-1">{metric}</div>
        </div>

        {/* Student Metrics */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="glass-card p-4 rounded-xl">
            <div className="text-[9px] text-slate-500 uppercase font-bold mb-2">RSR</div>
            <div className="text-3xl font-black text-white">{(student.metrics.lmp * 100).toFixed(0)}%</div>
          </div>
          <div className="glass-card p-4 rounded-xl">
            <div className="text-[9px] text-slate-500 uppercase font-bold mb-2">Risk Score</div>
            <div className={`text-3xl font-black ${
              (student.dri.riskScore || 0) >= 60 ? 'text-risk-red' : 
              (student.dri.riskScore || 0) >= 35 ? 'text-risk-amber' : 
              'text-risk-emerald'
            }`}>{student.dri.riskScore || 'N/A'}</div>
          </div>
          <div className="glass-card p-4 rounded-xl">
            <div className="text-[9px] text-slate-500 uppercase font-bold mb-2">Velocity</div>
            <div className="text-3xl font-black text-white">{student.metrics.velocityScore}%</div>
          </div>
          <div className="glass-card p-4 rounded-xl">
            <div className="text-[9px] text-slate-500 uppercase font-bold mb-2">KSI</div>
            <div className="text-3xl font-black text-white">
              {student.metrics.ksi !== null ? `${student.metrics.ksi}%` : 'N/A'}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button 
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white font-black text-[10px] uppercase rounded-lg transition-all"
          >
            Close
          </button>
          <button 
            onClick={onLogIntervention}
            className="flex-1 px-4 py-3 bg-alpha-gold hover:bg-alpha-gold/90 text-black font-black text-[10px] uppercase rounded-lg hover:shadow-[0_0_15px_rgba(212,175,53,0.4)] transition-all"
          >
            Log Intervention
          </button>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-800">
          <p className="text-[9px] text-slate-600 text-center">
            Intervention will be logged to Firebase and tracked
          </p>
        </div>
      </div>
    </div>
  );
}
