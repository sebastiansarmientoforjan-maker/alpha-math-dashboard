'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Student } from '@/types';

interface CoachInterventionModalProps {
  student: Student;
  onClose: () => void;
  onSuccess: () => void;
}

// Predefined coaches - can be extended or fetched from DB
const COACHES = [
  'Sebastián Sarmiento',
  'Coach Alpha',
  'Coach Beta',
  'Other'
];

// Predefined objectives
const OBJECTIVES = [
  'Improve RSR (Recent Success Rate)',
  'Address Knowledge Gaps (High DER)',
  'Increase Engagement/Velocity',
  'Study Habits & Time Management',
  'Motivation & Mindset',
  'Technical Support',
  'Parent Communication',
  'Course Placement Review',
  'Other'
];

export default function CoachInterventionModal({ 
  student, 
  onClose,
  onSuccess 
}: CoachInterventionModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  
  // Form state
  const [coachName, setCoachName] = useState('');
  const [customCoach, setCustomCoach] = useState('');
  const [interventionDate, setInterventionDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  // FASE 5: Nuevo estado para Follow-up
  const [followUpDate, setFollowUpDate] = useState('');
  
  const [objective, setObjective] = useState('');
  const [customObjective, setCustomObjective] = useState('');
  const [whatWasDone, setWhatWasDone] = useState('');
  const [whatWasAchieved, setWhatWasAchieved] = useState('');
  const [nextSteps, setNextSteps] = useState('');
  const [notes, setNotes] = useState('');

  // Keyboard handler
  useEffect(() => {
    const handleKeyboard = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyboard);
    return () => window.removeEventListener('keydown', handleKeyboard);
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    const finalCoach = coachName === 'Other' ? customCoach.trim() : coachName;
    const finalObjective = objective === 'Other' ? customObjective.trim() : objective;

    if (!finalCoach) {
      setError('Please select or enter a coach name');
      return;
    }
    if (!finalObjective) {
      setError('Please select or enter an objective');
      return;
    }
    if (!whatWasDone.trim()) {
      setError('Please describe what was done during the intervention');
      return;
    }

    setIsSubmitting(true);

    try {
      // FASE 5: Preparar datos de follow-up
      const followUpData = followUpDate ? {
        followUpDate: new Date(followUpDate),
        followUpStatus: 'pending' // pending | completed | skipped
      } : {
        followUpStatus: 'none'
      };

      await addDoc(collection(db, 'interventions'), {
        // Student info
        studentId: student.id,
        studentName: `${student.firstName} ${student.lastName}`,
        studentCourse: student.currentCourse?.name || 'Unknown',
        studentTier: student.dri.driTier,
        studentRiskScore: student.dri.riskScore,
        
        // Intervention details
        coachName: finalCoach,
        interventionDate: new Date(interventionDate),
        objective: finalObjective,
        
        // Breakdown
        whatWasDone: whatWasDone.trim(),
        whatWasAchieved: whatWasAchieved.trim(),
        nextSteps: nextSteps.trim(),
        notes: notes.trim(),
        
        // FASE 5: Follow-up Data
        ...followUpData,
        
        // Metadata
        type: 'coaching',
        status: 'completed',
        createdAt: serverTimestamp(),
        
        // Student metrics at time of intervention (for tracking progress)
        metricsSnapshot: {
          rsr: student.metrics.lmp,
          ksi: student.metrics.ksi,
          velocity: student.metrics.velocityScore,
          accuracy: student.metrics.accuracyRate,
          riskScore: student.dri.riskScore,
          der: student.dri.debtExposure,
          pdi: student.dri.precisionDecay,
        }
      });

      setShowSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error('Error saving intervention:', err);
      setError(`Failed to save: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showSuccess) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 animate-in fade-in duration-200">
        <div className="bg-emerald-900/30 border border-emerald-500/50 p-8 rounded-3xl text-center animate-in zoom-in-95 duration-300">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <span className="text-4xl">✓</span>
          </div>
          <h3 className="text-xl font-black text-emerald-400 uppercase">Intervention Saved!</h3>
          <p className="text-sm text-emerald-300/70 mt-2">
            Coaching session for {student.firstName} has been logged.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={onClose} />
      
      <div className="bg-[#0a0a0a] border border-slate-800 w-full max-w-2xl max-h-[90vh] rounded-3xl relative z-10 flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex-shrink-0 p-5 border-b border-slate-800 bg-gradient-to-b from-indigo-900/20 to-transparent">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-black text-white uppercase italic tracking-tight">
                📝 Log Coach Intervention
              </h2>
              <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest mt-1">
                {student.firstName} {student.lastName} • {student.currentCourse?.name}
              </p>
            </div>
            <button 
              onClick={onClose}
              className="text-slate-600 hover:text-white text-xl transition-colors p-2 hover:bg-slate-800 rounded-lg"
            >
              ✕
            </button>
          </div>
          
          {/* Student Quick Stats */}
          <div className="flex gap-2 mt-3 text-[9px] font-mono flex-wrap">
            <span className={`px-2 py-1 rounded ${
              student.dri.driTier === 'RED' ? 'bg-red-500/20 text-red-400' :
              student.dri.driTier === 'YELLOW' ? 'bg-amber-500/20 text-amber-400' :
              'bg-emerald-500/20 text-emerald-400'
            }`}>
              {student.dri.driTier}
            </span>
            <span className="px-2 py-1 rounded bg-slate-800 text-slate-400">
              RSR: {(student.metrics.lmp * 100).toFixed(0)}%
            </span>
            <span className="px-2 py-1 rounded bg-slate-800 text-slate-400">
              Risk: {student.dri.riskScore}/100
            </span>
            <span className="px-2 py-1 rounded bg-slate-800 text-slate-400">
              Vel: {student.metrics.velocityScore}%
            </span>
            {student.dri.debtExposure !== null && (
              <span className="px-2 py-1 rounded bg-slate-800 text-slate-400">
                DER: {student.dri.debtExposure}%
              </span>
            )}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar">
          
          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-900/30 border border-red-500/50 rounded-xl text-sm text-red-400 flex items-center gap-2">
              <span>⚠️</span> {error}
            </div>
          )}

          {/* Row 1: Coach & Date */}
          <div className="grid grid-cols-2 gap-4">
            {/* Coach Name */}
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
                Coach Name <span className="text-red-500">*</span>
              </label>
              <select
                value={coachName}
                onChange={(e) => setCoachName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-indigo-500 transition-colors"
              >
                <option value="">Select coach...</option>
                {COACHES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              {coachName === 'Other' && (
                <input
                  type="text"
                  value={customCoach}
                  onChange={(e) => setCustomCoach(e.target.value)}
                  placeholder="Enter coach name..."
                  className="w-full mt-2 bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-indigo-500"
                />
              )}
            </div>

            {/* Date */}
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
                Intervention Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={interventionDate}
                onChange={(e) => setInterventionDate(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Objective */}
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
              Intervention Objective <span className="text-red-500">*</span>
            </label>
            <select
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-indigo-500"
            >
              <option value="">Select objective...</option>
              {OBJECTIVES.map(o => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
            {objective === 'Other' && (
              <input
                type="text"
                value={customObjective}
                onChange={(e) => setCustomObjective(e.target.value)}
                placeholder="Enter custom objective..."
                className="w-full mt-2 bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-indigo-500"
              />
            )}
          </div>

          {/* What Was Done */}
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
              What Was Done? <span className="text-red-500">*</span>
            </label>
            <textarea
              value={whatWasDone}
              onChange={(e) => setWhatWasDone(e.target.value)}
              placeholder="Describe the activities, conversations, or exercises conducted during the intervention..."
              rows={3}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-indigo-500 resize-none"
            />
            <p className="text-[9px] text-slate-600 mt-1">
              Examples: 1-on-1 conversation, reviewed problem areas, practiced specific topics, discussed goals...
            </p>
          </div>

          {/* What Was Achieved */}
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
              What Was Achieved?
            </label>
            <textarea
              value={whatWasAchieved}
              onChange={(e) => setWhatWasAchieved(e.target.value)}
              placeholder="Outcomes, breakthroughs, or progress observed during or after the session..."
              rows={3}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-indigo-500 resize-none"
            />
            <p className="text-[9px] text-slate-600 mt-1">
              Examples: Student understood concept, showed motivation, identified root cause...
            </p>
          </div>

          {/* FASE 5: Next Steps + Follow Up Date (Grid) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
                Next Steps / Continue Working On
              </label>
              <textarea
                value={nextSteps}
                onChange={(e) => setNextSteps(e.target.value)}
                placeholder="Action items, follow-up tasks, or areas that need continued attention..."
                rows={3}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-indigo-500 resize-none"
              />
              <p className="text-[9px] text-slate-600 mt-1">
                Examples: Schedule follow-up in 1 week, focus on Algebra topics, contact parents...
              </p>
            </div>
            
            {/* Campo Follow-up Date */}
            <div className="md:col-span-1">
              <label className="block text-[10px] font-black text-amber-500 uppercase tracking-widest mb-2">
                ⏰ Follow-up Date
              </label>
              <div className="p-1 bg-amber-900/10 border border-amber-500/30 rounded-xl">
                <input
                  type="date"
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-amber-500"
                />
                <p className="text-[8px] text-amber-400/70 mt-2 px-1 leading-tight">
                  Set a date to verify progress. Will appear in your daily dashboard reminders.
                </p>
              </div>
            </div>
          </div>

          {/* Additional Notes */}
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
              Additional Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any other observations, concerns, or context..."
              rows={2}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-indigo-500 resize-none"
            />
          </div>
        </form>

        {/* Footer */}
        <div className="flex-shrink-0 p-5 border-t border-slate-800 bg-slate-900/30 flex justify-between items-center">
          <p className="text-[9px] text-slate-600">
            <span className="text-red-500">*</span> Required fields
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-400 text-[10px] font-black uppercase rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 disabled:cursor-not-allowed text-white text-[10px] font-black uppercase rounded-xl transition-colors flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  💾 Save Intervention
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
