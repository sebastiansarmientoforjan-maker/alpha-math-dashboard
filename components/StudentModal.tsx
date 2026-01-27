'use client';

import { useMemo, useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Bar, BarChart } from 'recharts';
import { DRI_CONFIG } from '@/lib/dri-config';
import Tooltip from '@/components/Tooltip';
import CoachInterventionModal from '@/components/CoachInterventionModal';
import TrackImpactModal from '@/components/TrackImpactModal';
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';

// ==========================================
// METRIC DEFINITIONS
// ==========================================
const METRIC_INFO = {
  rsr: { name: 'Recent Success Rate', desc: 'Proportion of recent tasks with >80% accuracy' },
  ksi: { name: 'Knowledge Stability Index', desc: 'Consistency of performance over time' },
  der: { name: 'Debt Exposure Ratio', desc: '% of K-8 topics mastered during High School' },
  pdi: { name: 'Precision Decay Index', desc: 'Ratio of recent errors to early errors' },
  iroi: { name: 'Investment ROI', desc: 'XP earned per second of engagement' },
  velocity: { name: 'Velocity', desc: 'Weekly XP progress toward goal' },
  accuracy: { name: 'Accuracy', desc: 'Overall accuracy across all tasks' },
  focus: { name: 'Focus Integrity', desc: 'Measure of sustained attention' },
  risk: { name: 'Risk Score', desc: 'Composite score from multiple factors' },
};

// ==========================================
// COLLAPSIBLE SECTION COMPONENT
// ==========================================
function CollapsibleSection({ 
  title, 
  icon, 
  children, 
  defaultOpen = true,
  badge,
}: { 
  title: string; 
  icon: string; 
  children: React.ReactNode; 
  defaultOpen?: boolean;
  badge?: string | number;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border border-slate-800 rounded-2xl overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-4 bg-slate-900/40 flex items-center justify-between hover:bg-slate-900/60 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span>{icon}</span>
          <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{title}</span>
          {badge !== undefined && (
            <span className="px-2 py-0.5 bg-indigo-500/20 border border-indigo-500/30 rounded text-[9px] text-indigo-300 font-bold">
              {badge}
            </span>
          )}
        </div>
        <span className={`text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>
      {isOpen && (
        <div className="p-4 animate-in slide-in-from-top-2 duration-200">
          {children}
        </div>
      )}
    </div>
  );
}

interface StudentModalProps {
  student: any;
  onClose: () => void;
  onNavigate?: (direction: 'prev' | 'next') => void;
  currentIndex?: number;
  totalStudents?: number;
}

export default function StudentModal({ 
  student, 
  onClose, 
  onNavigate,
  currentIndex = -1,
  totalStudents = 0
}: StudentModalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'interventions'>('overview');
  const [showInterventionModal, setShowInterventionModal] = useState(false);
  const [showTrackImpact, setShowTrackImpact] = useState(false);
  const [interventionSaved, setInterventionSaved] = useState(false);
  const [studentInterventions, setStudentInterventions] = useState<any[]>([]);

  const tasks = student?.activity?.tasks || [];

  // Fetch interventions for this student
  useEffect(() => {
    const q = query(
      collection(db, 'interventions'),
      where('studentId', '==', student.id),
      orderBy('createdAt', 'desc'),
      limit(10)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setStudentInterventions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    
    return () => unsubscribe();
  }, [student.id]);

  useEffect(() => {
    const handleKeyboard = (e: KeyboardEvent) => {
      // Don't handle if intervention modal is open
      if (showInterventionModal || showTrackImpact) return;
      
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        onNavigate?.('next');
      }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        onNavigate?.('prev');
      }
      if (e.key === 'Escape') {
        onClose();
      }
      // Quick shortcut for logging intervention
      if (e.key === 'i' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        setShowInterventionModal(true);
      }
    };
    window.addEventListener('keydown', handleKeyboard);
    return () => window.removeEventListener('keydown', handleKeyboard);
  }, [onNavigate, onClose, showInterventionModal, showTrackImpact]);

  // Reset saved indicator when student changes
  useEffect(() => {
    setInterventionSaved(false);
  }, [student.id]);

  // ==========================================
  // READY TO ACCELERATE
  // ==========================================
  const readyToAccelerate = useMemo((): string[] => {
    const topics = tasks
      .filter((t: any) => (t.questionsCorrect / (t.questions || 1)) > 0.7)
      .map((t: any) => t.topic?.name || 'Unknown Topic');
    return Array.from(new Set(topics)).slice(0, 3) as string[];
  }, [tasks]);

  // ==========================================
  // STRUGGLE TOPICS
  // ==========================================
  const struggleTopics = useMemo((): string[] => {
    const topics = tasks
      .filter((t: any) => (t.questionsCorrect / (t.questions || 1)) < 0.5)
      .map((t: any) => t.topic?.name || 'Unknown Topic');
    return Array.from(new Set(topics)).slice(0, 3) as string[];
  }, [tasks]);

  // ==========================================
  // DATA FOR TABLE
  // ==========================================
  const sortedData = useMemo(() => {
    return tasks.map((t: any) => {
      const dateObj = new Date(t.completedLocal);
      return {
        id: t.id,
        timestamp: dateObj.getTime(),
        acc: Math.round((t.questionsCorrect / (t.questions || 1)) * 100),
        topic: t.topic?.name || 'Session Task',
        questions: t.questions || 0,
        correct: t.questionsCorrect || 0,
        date: dateObj.toLocaleDateString('en-US', { day: '2-digit', month: '2-digit' }),
        time: Math.round((t.timeTotal || 0) / 60),
        xp: t.xpAwarded || 0
      };
    }).sort((a: any, b: any) => b.timestamp - a.timestamp);
  }, [tasks]);

  const chartData = useMemo(() => 
    [...sortedData].reverse().map((d, i) => ({ ...d, i: i + 1 })), 
  [sortedData]);

  // ==========================================
  // WEEKLY ACTIVITY PATTERN
  // ==========================================
  const weeklyPattern = useMemo(() => {
    const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const pattern = daysOfWeek.map(day => ({ day, tasks: 0, xp: 0 }));
    
    tasks.forEach((t: any) => {
      const date = new Date(t.completedLocal);
      const dayIndex = (date.getDay() + 6) % 7;
      pattern[dayIndex].tasks++;
      pattern[dayIndex].xp += t.xpAwarded || 0;
    });
    
    return pattern;
  }, [tasks]);

  const rsrDisplay = isNaN(student.metrics.lmp) ? '0%' : `${(student.metrics.lmp * 100).toFixed(0)}%`;
  const velocityInXP = Math.round((student.metrics.velocityScore / 100) * DRI_CONFIG.ALPHA_WEEKLY_STANDARD);

  const handleInterventionSuccess = () => {
    setInterventionSaved(true);
    setTimeout(() => setInterventionSaved(false), 3000);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 animate-in fade-in duration-200">
        <div className="absolute inset-0" onClick={onClose} />
        <div className="bg-[#080808] border border-slate-800 w-full max-w-6xl h-[85vh] rounded-[2.5rem] relative z-10 flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
          
          {/* ========================================== */}
          {/* HEADER - SIMPLIFIED */}
          {/* ========================================== */}
          <div className="p-5 border-b border-slate-800 flex justify-between items-start bg-gradient-to-b from-slate-900/50 to-transparent">
            <div className="flex gap-4 items-center flex-1">
              {/* Velocity Badge */}
              <Tooltip content={METRIC_INFO.velocity.desc}>
                <div className={`w-16 h-16 rounded-xl border-4 flex flex-col items-center justify-center font-black italic cursor-help ${
                  student.dri.driTier === 'RED' ? 'border-red-500 text-red-500 bg-red-500/10' : 
                  student.dri.driTier === 'YELLOW' ? 'border-amber-500 text-amber-500 bg-amber-500/10' :
                  'border-emerald-500 text-emerald-500 bg-emerald-500/10'
                }`}>
                  <span className="text-xl">{student.metrics.velocityScore || 0}</span>
                  <span className="text-[7px] opacity-60 uppercase">Vel</span>
                </div>
              </Tooltip>
              
              <div className="flex-1">
                <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase">
                  {student.firstName} {student.lastName}
                </h2>
                
                <div className="flex flex-wrap gap-2 mt-2 text-[9px] font-black uppercase">
                  <span className={`px-2 py-1 rounded-full border border-current ${student.dri.driColor}`}>
                    {student.dri.driSignal}
                  </span>
                  <span className="px-2 py-1 rounded-full border border-indigo-500/30 text-indigo-400 bg-indigo-500/10">
                    {student.currentCourse?.name}
                  </span>
                  {student.dri.riskScore !== undefined && (
                    <Tooltip content={METRIC_INFO.risk.desc}>
                      <span className={`px-2 py-1 rounded-full border cursor-help ${
                        student.dri.riskScore >= 60 ? 'border-red-500 text-red-400 bg-red-500/10' :
                        student.dri.riskScore >= 35 ? 'border-amber-500 text-amber-400 bg-amber-500/10' :
                        'border-emerald-500 text-emerald-400 bg-emerald-500/10'
                      }`}>
                        Risk: {student.dri.riskScore}
                      </span>
                    </Tooltip>
                  )}
                  {interventionSaved && (
                    <span className="px-2 py-1 rounded-full border border-emerald-500 text-emerald-400 bg-emerald-500/10 animate-pulse">
                      ✓ Intervention Saved
                    </span>
                  )}
                </div>
                
                <div className="mt-1 flex gap-3 text-[9px] text-slate-500 font-mono">
                  <span>{velocityInXP} / {DRI_CONFIG.ALPHA_WEEKLY_STANDARD} XP/wk</span>
                  <span>•</span>
                  <span>{tasks.length} sessions</span>
                  {studentInterventions.length > 0 && (
                    <>
                      <span>•</span>
                      <span className="text-indigo-400">{studentInterventions.length} interventions</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            
            {/* Action Buttons & Navigation */}
            <div className="flex items-center gap-2">
              {/* Action Buttons */}
              <button
                onClick={() => setShowInterventionModal(true)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black uppercase rounded-xl transition-colors flex items-center gap-2"
                title="Log Intervention (Ctrl+I)"
              >
                📝 Log Intervention
              </button>
              <button
                onClick={() => setShowTrackImpact(true)}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-black uppercase rounded-xl transition-colors flex items-center gap-2"
                title="Track Impact"
              >
                📈 Track Impact
              </button>
              
              {onNavigate && totalStudents > 1 && (
                <div className="flex items-center gap-1 ml-2">
                  <button 
                    onClick={() => onNavigate('prev')}
                    className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors flex items-center justify-center text-sm"
                  >
                    ←
                  </button>
                  <span className="text-[9px] text-slate-600 font-mono px-2">
                    {currentIndex + 1}/{totalStudents}
                  </span>
                  <button 
                    onClick={() => onNavigate('next')}
                    className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors flex items-center justify-center text-sm"
                  >
                    →
                  </button>
                </div>
              )}
              <button 
                onClick={onClose} 
                className="text-slate-600 hover:text-white text-xl transition-colors p-2 hover:bg-slate-800 rounded-lg ml-2"
              >
                ✕
              </button>
            </div>
          </div>

          {/* ========================================== */}
          {/* TAB NAVIGATION */}
          {/* ========================================== */}
          <div className="px-5 pt-3 border-b border-slate-800/50 flex gap-2">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 rounded-t-lg font-black text-[10px] uppercase tracking-widest transition-all ${
                activeTab === 'overview'
                  ? 'bg-slate-800 text-white border-t border-x border-slate-700'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              📊 Overview
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-4 py-2 rounded-t-lg font-black text-[10px] uppercase tracking-widest transition-all ${
                activeTab === 'history'
                  ? 'bg-slate-800 text-white border-t border-x border-slate-700'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              📜 History ({sortedData.length})
            </button>
            <button
              onClick={() => setActiveTab('interventions')}
              className={`px-4 py-2 rounded-t-lg font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 ${
                activeTab === 'interventions'
                  ? 'bg-slate-800 text-white border-t border-x border-slate-700'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              📝 Interventions
              {studentInterventions.length > 0 && (
                <span className={`px-1.5 py-0.5 rounded text-[8px] ${
                  activeTab === 'interventions' ? 'bg-indigo-500' : 'bg-slate-700'
                }`}>
                  {studentInterventions.length}
                </span>
              )}
            </button>
          </div>

          {/* ========================================== */}
          {/* CONTENT AREA */}
          {/* ========================================== */}
          <div className="flex-1 p-5 overflow-y-auto custom-scrollbar">
            
            {/* OVERVIEW TAB - WITH COLLAPSIBLE SECTIONS */}
            {activeTab === 'overview' && (
              <div className="grid grid-cols-12 gap-5">
                
                {/* LEFT COLUMN */}
                <div className="col-span-4 space-y-4">
                  
                  {/* Primary Metrics */}
                  <CollapsibleSection title="Primary Metrics" icon="📈" defaultOpen={true}>
                    <div className="space-y-3">
                      {/* RSR Card */}
                      <div className="p-4 bg-slate-900/40 rounded-xl text-center">
                        <Tooltip content={METRIC_INFO.rsr.desc}>
                          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1 cursor-help">
                            RSR (Recent Success Rate)
                          </p>
                        </Tooltip>
                        <p className="text-4xl font-black text-white italic">{rsrDisplay}</p>
                        <p className="text-[8px] text-indigo-400 mt-1 font-bold uppercase italic">
                          {student.metrics.stallStatus || 'Optimal'}
                        </p>
                      </div>

                      {/* Mini Metrics Grid */}
                      <div className="grid grid-cols-2 gap-2">
                        <Tooltip content={METRIC_INFO.ksi.desc}>
                          <div className="p-3 bg-slate-900/40 rounded-xl cursor-help">
                            <div className="text-[8px] text-slate-500 uppercase">KSI</div>
                            <div className={`text-lg font-black ${
                              student.metrics.ksi === null ? 'text-slate-600' :
                              student.metrics.ksi < DRI_CONFIG.KSI_CRITICAL_THRESHOLD ? 'text-red-400' :
                              'text-blue-400'
                            }`}>
                              {student.metrics.ksi !== null ? `${student.metrics.ksi}%` : 'N/A'}
                            </div>
                          </div>
                        </Tooltip>
                        
                        <Tooltip content={METRIC_INFO.accuracy.desc}>
                          <div className="p-3 bg-slate-900/40 rounded-xl cursor-help">
                            <div className="text-[8px] text-slate-500 uppercase">Accuracy</div>
                            <div className={`text-lg font-black ${
                              (student.metrics.accuracyRate || 0) >= 70 ? 'text-emerald-400' : 'text-amber-400'
                            }`}>
                              {student.metrics.accuracyRate || 0}%
                            </div>
                          </div>
                        </Tooltip>
                      </div>
                    </div>
                  </CollapsibleSection>

                  {/* Risk Factors */}
                  <CollapsibleSection title="Risk Factors" icon="⚠️" defaultOpen={student.dri.driTier !== 'GREEN'}>
                    <div className="grid grid-cols-2 gap-2">
                      <Tooltip content={METRIC_INFO.der.desc}>
                        <div className="p-3 bg-slate-900/40 rounded-xl cursor-help">
                          <div className="text-[8px] text-slate-500 uppercase">DER</div>
                          {student.dri.debtExposure !== null ? (
                            <div className={`text-lg font-black ${
                              student.dri.debtExposure > DRI_CONFIG.DER_SEVERE_THRESHOLD ? 'text-red-400' :
                              student.dri.debtExposure > DRI_CONFIG.DER_CRITICAL_THRESHOLD ? 'text-amber-400' : 
                              'text-emerald-400'
                            }`}>
                              {student.dri.debtExposure}%
                            </div>
                          ) : (
                            <div className="text-sm text-slate-600">N/A</div>
                          )}
                        </div>
                      </Tooltip>
                      
                      <Tooltip content={METRIC_INFO.pdi.desc}>
                        <div className="p-3 bg-slate-900/40 rounded-xl cursor-help">
                          <div className="text-[8px] text-slate-500 uppercase">PDI</div>
                          {student.dri.precisionDecay !== null ? (
                            <div className={`text-lg font-black ${
                              student.dri.precisionDecay > DRI_CONFIG.PDI_SEVERE_THRESHOLD ? 'text-red-400' :
                              student.dri.precisionDecay > DRI_CONFIG.PDI_CRITICAL_THRESHOLD ? 'text-amber-400' : 
                              'text-emerald-400'
                            }`}>
                              {student.dri.precisionDecay}x
                            </div>
                          ) : (
                            <div className="text-sm text-slate-600">N/A</div>
                          )}
                        </div>
                      </Tooltip>

                      <Tooltip content={METRIC_INFO.focus.desc}>
                        <div className="p-3 bg-slate-900/40 rounded-xl cursor-help">
                          <div className="text-[8px] text-slate-500 uppercase">Focus</div>
                          <div className="text-lg font-black text-purple-300">
                            {student.metrics.focusIntegrity}%
                          </div>
                        </div>
                      </Tooltip>
                      
                      <Tooltip content={METRIC_INFO.iroi.desc}>
                        <div className="p-3 bg-slate-900/40 rounded-xl cursor-help">
                          <div className="text-[8px] text-slate-500 uppercase">iROI</div>
                          {student.dri.iROI !== null ? (
                            <div className="text-lg font-black text-cyan-300">
                              {student.dri.iROI}
                            </div>
                          ) : (
                            <div className="text-sm text-slate-600">N/A</div>
                          )}
                        </div>
                      </Tooltip>
                    </div>
                  </CollapsibleSection>

                  {/* Topics */}
                  <CollapsibleSection 
                    title="Topics Analysis" 
                    icon="📚" 
                    defaultOpen={true}
                    badge={readyToAccelerate.length + struggleTopics.length}
                  >
                    <div className="space-y-3">
                      {/* Ready to Accelerate */}
                      <div className="bg-indigo-950/20 border border-indigo-500/30 p-3 rounded-xl">
                        <h4 className="text-[8px] font-black text-indigo-400 uppercase mb-2">⚡ Ready to Accelerate</h4>
                        {readyToAccelerate.length > 0 ? readyToAccelerate.map((topic: string, idx: number) => (
                          <div key={idx} className="flex items-center gap-2 p-1.5 bg-indigo-900/20 rounded mb-1">
                            <div className="w-1 h-1 bg-indigo-500 rounded-full" />
                            <span className="text-[9px] font-bold text-indigo-200 uppercase truncate">{topic}</span>
                          </div>
                        )) : (
                          <p className="text-[9px] text-slate-600 italic text-center py-2">Consolidating...</p>
                        )}
                      </div>

                      {/* Struggle Topics */}
                      {struggleTopics.length > 0 && (
                        <div className="bg-red-950/20 border border-red-500/30 p-3 rounded-xl">
                          <h4 className="text-[8px] font-black text-red-400 uppercase mb-2">🚨 Needs Help</h4>
                          {struggleTopics.map((topic: string, idx: number) => (
                            <div key={idx} className="flex items-center gap-2 p-1.5 bg-red-900/20 rounded mb-1">
                              <div className="w-1 h-1 bg-red-500 rounded-full" />
                              <span className="text-[9px] font-bold text-red-200 uppercase truncate">{topic}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </CollapsibleSection>
                </div>

                {/* RIGHT COLUMN: CHARTS */}
                <div className="col-span-8 space-y-4">
                  
                  {/* Precision Curve */}
                  <CollapsibleSection title="Precision Curve" icon="📉" defaultOpen={true}>
                    <ResponsiveContainer width="100%" height={180}>
                      <LineChart data={chartData} margin={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                        <CartesianGrid stroke="#1e293b" vertical={false} strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="i" 
                          stroke="#475569" 
                          fontSize={9} 
                        />
                        <YAxis 
                          domain={[0, 110]} 
                          ticks={[0, 50, 100]} 
                          stroke="#475569" 
                          fontSize={9} 
                        />
                        <RechartsTooltip 
                          contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '10px', fontSize: '10px' }}
                          formatter={(value: any) => [`${value}%`, 'Accuracy']}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="acc" 
                          stroke="#6366f1" 
                          strokeWidth={2} 
                          dot={{ r: 3, fill: '#6366f1' }} 
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CollapsibleSection>

                  {/* Weekly Activity */}
                  <CollapsibleSection title="Weekly Pattern" icon="📅" defaultOpen={false}>
                    <ResponsiveContainer width="100%" height={120}>
                      <BarChart data={weeklyPattern} margin={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                        <CartesianGrid stroke="#1e293b" vertical={false} strokeDasharray="3 3" />
                        <XAxis dataKey="day" stroke="#475569" fontSize={9} />
                        <YAxis stroke="#475569" fontSize={9} />
                        <RechartsTooltip 
                          contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '10px', fontSize: '10px' }}
                          formatter={(value: any) => [`${value} XP`, 'Earned']}
                        />
                        <Bar dataKey="xp" fill="#6366f1" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                    <div className="mt-2 flex justify-between text-[8px] text-slate-600">
                      <span>Total: <span className="text-indigo-400 font-bold">{weeklyPattern.reduce((sum, d) => sum + d.xp, 0)} XP</span></span>
                      <span>Active days: <span className="text-emerald-400 font-bold">{weeklyPattern.filter(d => d.tasks > 0).length}/7</span></span>
                    </div>
                  </CollapsibleSection>

                  {/* Recent Interventions Quick View */}
                  {studentInterventions.length > 0 && (
                    <CollapsibleSection 
                      title="Recent Interventions" 
                      icon="📝" 
                      defaultOpen={false}
                      badge={studentInterventions.length}
                    >
                      <div className="space-y-2">
                        {studentInterventions.slice(0, 3).map((intervention: any) => (
                          <div key={intervention.id} className="p-3 bg-slate-900/40 rounded-xl border border-slate-800">
                            <div className="flex justify-between items-start mb-1">
                              <span className="text-[10px] font-bold text-indigo-400">{intervention.objective}</span>
                              <span className="text-[8px] text-slate-600 font-mono">
                                {intervention.interventionDate?.toDate?.().toLocaleDateString() || 
                                 new Date(intervention.interventionDate).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-[9px] text-slate-500">By: {intervention.coachName}</p>
                            {intervention.nextSteps && (
                              <p className="text-[9px] text-amber-400 mt-1">→ {intervention.nextSteps.substring(0, 80)}...</p>
                            )}
                          </div>
                        ))}
                        {studentInterventions.length > 3 && (
                          <button 
                            onClick={() => setActiveTab('interventions')}
                            className="w-full text-center text-[9px] text-indigo-400 hover:text-indigo-300 py-2"
                          >
                            View all {studentInterventions.length} interventions →
                          </button>
                        )}
                      </div>
                    </CollapsibleSection>
                  )}
                </div>
              </div>
            )}

            {/* HISTORY TAB */}
            {activeTab === 'history' && (
              <div className="bg-slate-900/10 rounded-2xl border border-slate-800 overflow-hidden">
                <div className="max-h-[500px] overflow-y-auto custom-scrollbar">
                  <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 bg-[#080808] z-10">
                      <tr className="text-[9px] font-black text-slate-600 uppercase border-b border-slate-800">
                        <th className="p-3">Date</th>
                        <th className="p-3">Topic</th>
                        <th className="p-3 text-center">Acc</th>
                        <th className="p-3 text-center">Items</th>
                        <th className="p-3 text-center">Time</th>
                        <th className="p-3 text-center">XP</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                      {sortedData.map((task: any, idx: number) => (
                        <tr key={idx} className="hover:bg-slate-900/30 transition-colors">
                          <td className="p-3 text-[10px] font-mono text-slate-500">{task.date}</td>
                          <td className="p-3 text-[10px] font-bold text-slate-300 uppercase italic truncate max-w-[200px]">
                            {task.topic}
                          </td>
                          <td className="p-3 text-center">
                            <span className={`text-[9px] font-mono font-black px-2 py-0.5 rounded ${
                              task.acc >= 80 ? 'bg-emerald-500/20 text-emerald-400' : 
                              task.acc >= 50 ? 'bg-amber-500/20 text-amber-400' : 
                              'bg-red-500/20 text-red-400'
                            }`}>
                              {task.acc}%
                            </span>
                          </td>
                          <td className="p-3 text-center text-[9px] font-mono text-slate-500">
                            {task.correct}/{task.questions}
                          </td>
                          <td className="p-3 text-center text-[9px] font-mono text-indigo-400">
                            {task.time}m
                          </td>
                          <td className="p-3 text-center text-[9px] font-mono text-purple-400 font-bold">
                            {task.xp}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* INTERVENTIONS TAB */}
            {activeTab === 'interventions' && (
              <div className="space-y-4">
                {/* Header with Add Button */}
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-sm font-black text-white uppercase">Coaching History</h3>
                    <p className="text-[10px] text-slate-500">All interventions logged for this student</p>
                  </div>
                  <button
                    onClick={() => setShowInterventionModal(true)}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black uppercase rounded-xl transition-colors flex items-center gap-2"
                  >
                    + Log New Intervention
                  </button>
                </div>

                {/* Interventions List */}
                {studentInterventions.length === 0 ? (
                  <div className="text-center py-16 bg-slate-900/20 rounded-2xl border border-slate-800">
                    <div className="text-4xl mb-4">📝</div>
                    <h4 className="text-sm font-bold text-slate-400">No Interventions Yet</h4>
                    <p className="text-[10px] text-slate-600 mt-1">Start by logging your first coaching session</p>
                    <button
                      onClick={() => setShowInterventionModal(true)}
                      className="mt-4 px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black uppercase rounded-xl transition-colors"
                    >
                      Log Intervention
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {studentInterventions.map((intervention: any) => (
                      <div key={intervention.id} className="bg-slate-900/30 border border-slate-800 rounded-2xl p-5">
                        {/* Header */}
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h4 className="text-sm font-black text-indigo-400 uppercase">{intervention.objective}</h4>
                            <p className="text-[10px] text-slate-500 mt-1">
                              Coach: <span className="text-white font-bold">{intervention.coachName}</span>
                              <span className="mx-2">•</span>
                              {intervention.interventionDate?.toDate?.().toLocaleDateString() || 
                               new Date(intervention.interventionDate).toLocaleDateString()}
                            </p>
                          </div>
                          {intervention.metricsSnapshot && (
                            <div className="flex gap-2 text-[8px] font-mono">
                              <span className="px-2 py-1 rounded bg-slate-800 text-slate-400">
                                RSR: {(intervention.metricsSnapshot.rsr * 100).toFixed(0)}%
                              </span>
                              <span className="px-2 py-1 rounded bg-slate-800 text-slate-400">
                                Risk: {intervention.metricsSnapshot.riskScore}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Content Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {/* What Was Done */}
                          <div className="bg-slate-900/40 p-3 rounded-xl">
                            <h5 className="text-[9px] font-black text-slate-500 uppercase mb-2">What Was Done</h5>
                            <p className="text-[10px] text-slate-300">{intervention.whatWasDone}</p>
                          </div>

                          {/* What Was Achieved */}
                          {intervention.whatWasAchieved && (
                            <div className="bg-emerald-900/20 border border-emerald-500/20 p-3 rounded-xl">
                              <h5 className="text-[9px] font-black text-emerald-500 uppercase mb-2">What Was Achieved</h5>
                              <p className="text-[10px] text-emerald-200">{intervention.whatWasAchieved}</p>
                            </div>
                          )}

                          {/* Next Steps */}
                          {intervention.nextSteps && (
                            <div className="bg-amber-900/20 border border-amber-500/20 p-3 rounded-xl">
                              <h5 className="text-[9px] font-black text-amber-500 uppercase mb-2">Next Steps</h5>
                              <p className="text-[10px] text-amber-200">{intervention.nextSteps}</p>
                            </div>
                          )}
                        </div>

                        {/* Notes */}
                        {intervention.notes && (
                          <div className="mt-4 p-3 bg-slate-900/20 rounded-xl border border-slate-800">
                            <h5 className="text-[9px] font-black text-slate-500 uppercase mb-1">Additional Notes</h5>
                            <p className="text-[10px] text-slate-400 italic">{intervention.notes}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Intervention Modal */}
      {showInterventionModal && (
        <CoachInterventionModal
          student={student}
          onClose={() => setShowInterventionModal(false)}
          onSuccess={handleInterventionSuccess}
        />
      )}

      {/* Track Impact Modal */}
      {showTrackImpact && (
        <TrackImpactModal
          student={student}
          onClose={() => setShowTrackImpact(false)}
          onSuccess={() => setShowTrackImpact(false)}
        />
      )}
    </>
  );
}
