'use client';

import { useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Student, TrackingPeriod, MetricsSnapshot } from '@/types';

interface TrackImpactModalProps {
  student: Student;
  onClose: () => void;
  onSuccess: () => void;
}

const INTERVENTION_TYPES = [
  'Coaching 1:1',
  'Parent Contact',
  'Schedule Adjustment',
  'Content Remediation',
  'Motivation/Engagement',
  'Technical Support',
  'Other'
];

const PERIOD_OPTIONS: { value: TrackingPeriod; label: string; weeks: number }[] = [
  { value: '2_weeks', label: '2 Weeks', weeks: 2 },
  { value: '4_weeks', label: '4 Weeks', weeks: 4 },
  { value: '8_weeks', label: '8 Weeks', weeks: 8 },
];

export default function TrackImpactModal({ student, onClose, onSuccess }: TrackImpactModalProps) {
  const [interventionType, setInterventionType] = useState('');
  const [period, setPeriod] = useState<TrackingPeriod>('4_weeks');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createBaseline = (): MetricsSnapshot => ({
    rsr: student.metrics.lmp,
    ksi: student.metrics.ksi,
    velocity: student.metrics.velocityScore,
    riskScore: student.dri.riskScore || 0,
    der: student.dri.debtExposure,
    pdi: student.dri.precisionDecay,
    tier: student.dri.driTier,
    capturedAt: new Date(),
  });

  const calculateNextSnapshotDate = (): Date => {
    const next = new Date();
    next.setDate(next.getDate() + 7); // Primera captura en 1 semana
    return next;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!interventionType) {
      setError('Please select an intervention type');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const tracking = {
        studentId: student.id,
        studentName: `${student.firstName} ${student.lastName}`,
        studentCourse: student.currentCourse?.name || 'Unknown',
        interventionType,
        interventionNotes: notes || null,
        period,
        status: 'active',
        baselineSnapshot: createBaseline(),
        weeklySnapshots: [],
        outcome: 'pending',
        createdAt: serverTimestamp(),
        createdBy: 'DRI', // TODO: Dynamic coach name
        nextSnapshotDate: calculateNextSnapshotDate(),
      };

      await addDoc(collection(db, 'intervention_tracking'), tracking);
      
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error creating tracking:', err);
      setError(err.message || 'Failed to create tracking');
    } finally {
      setSaving(false);
    }
  };

  const selectedPeriod = PERIOD_OPTIONS.find(p => p.value === period);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#0a0a0a] border border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-800 bg-gradient-to-r from-indigo-900/30 to-purple-900/30">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-lg font-black text-white uppercase tracking-wide">
                📈 Track Impact
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Monitor intervention effectiveness over time
              </p>
            </div>
            <button 
              onClick={onClose}
              className="text-slate-500 hover:text-white transition-colors text-xl"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Student Info */}
        <div className="p-4 bg-slate-900/50 border-b border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold text-white">{student.firstName} {student.lastName}</p>
              <p className="text-xs text-slate-500">{student.currentCourse?.name}</p>
            </div>
            <div className={`px-3 py-1 rounded-lg text-xs font-black ${
              student.dri.driTier === 'RED' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
              student.dri.driTier === 'YELLOW' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
              'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
            }`}>
              {student.dri.driTier}
            </div>
          </div>
          
          {/* Current Metrics Preview */}
          <div className="grid grid-cols-4 gap-2 mt-3 text-[9px] font-mono">
            <div className="bg-slate-800/50 rounded-lg p-2 text-center">
              <div className="text-slate-500">RSR</div>
              <div className="text-white font-bold">{(student.metrics.lmp * 100).toFixed(0)}%</div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-2 text-center">
              <div className="text-slate-500">KSI</div>
              <div className="text-white font-bold">{student.metrics.ksi ?? 'N/A'}%</div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-2 text-center">
              <div className="text-slate-500">Velocity</div>
              <div className="text-white font-bold">{student.metrics.velocityScore}%</div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-2 text-center">
              <div className="text-slate-500">Risk</div>
              <div className={`font-bold ${
                (student.dri.riskScore || 0) >= 60 ? 'text-red-400' :
                (student.dri.riskScore || 0) >= 35 ? 'text-amber-400' :
                'text-emerald-400'
              }`}>{student.dri.riskScore || 0}</div>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          
          {/* Intervention Type */}
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">
              Intervention Type *
            </label>
            <select
              value={interventionType}
              onChange={(e) => setInterventionType(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:border-indigo-500 outline-none transition-colors"
              required
            >
              <option value="">Select type...</option>
              {INTERVENTION_TYPES.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          {/* Tracking Period */}
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">
              Tracking Period
            </label>
            <div className="grid grid-cols-3 gap-2">
              {PERIOD_OPTIONS.map(option => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setPeriod(option.value)}
                  className={`py-3 rounded-xl text-xs font-bold transition-all ${
                    period === option.value
                      ? 'bg-indigo-600 text-white border border-indigo-500'
                      : 'bg-slate-900 text-slate-400 border border-slate-700 hover:border-slate-600'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <p className="text-[9px] text-slate-600 mt-2">
              📅 Weekly snapshots for {selectedPeriod?.weeks} weeks
            </p>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="What intervention was performed? Goals?"
              rows={3}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:border-indigo-500 outline-none resize-none transition-colors"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-900/30 border border-red-500/50 rounded-xl text-xs text-red-400">
              ⚠️ {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-slate-800 text-slate-400 rounded-xl text-xs font-black uppercase hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-3 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase hover:bg-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                '📈 Start Tracking'
              )}
            </button>
          </div>
        </form>

        {/* Info Footer */}
        <div className="px-6 pb-6">
          <div className="p-3 bg-slate-900/50 border border-slate-800 rounded-xl text-[9px] text-slate-500">
            <strong className="text-slate-400">How it works:</strong> Baseline metrics are captured now. 
            Weekly snapshots will be taken automatically every Monday. After the tracking period ends, 
            you'll see the impact summary with deltas.
          </div>
        </div>
      </div>
    </div>
  );
}
