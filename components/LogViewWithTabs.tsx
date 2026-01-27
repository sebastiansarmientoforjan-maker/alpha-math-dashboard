'use client';

import { useState, useEffect, useMemo } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, where } from 'firebase/firestore';
import { InterventionTracking, TrackingOutcome, TrackingStatus } from '@/types';

interface LogViewWithTabsProps {
  logs: any[];
}

export default function LogViewWithTabs({ logs }: LogViewWithTabsProps) {
  const [activeTab, setActiveTab] = useState<'interventions' | 'impact'>('interventions');
  const [trackings, setTrackings] = useState<InterventionTracking[]>([]);
  const [statusFilter, setStatusFilter] = useState<'all' | TrackingStatus>('all');
  const [outcomeFilter, setOutcomeFilter] = useState<'all' | TrackingOutcome>('all');

  // Fetch intervention trackings
  useEffect(() => {
    const q = query(
      collection(db, 'intervention_tracking'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(),
        completedAt: doc.data().completedAt?.toDate?.() || null,
        nextSnapshotDate: doc.data().nextSnapshotDate?.toDate?.() || new Date(),
        baselineSnapshot: {
          ...doc.data().baselineSnapshot,
          capturedAt: doc.data().baselineSnapshot?.capturedAt?.toDate?.() || new Date(),
        },
      })) as InterventionTracking[];
      setTrackings(data);
    });

    return () => unsubscribe();
  }, []);

  // Filter trackings
  const filteredTrackings = useMemo(() => {
    return trackings.filter(t => {
      if (statusFilter !== 'all' && t.status !== statusFilter) return false;
      if (outcomeFilter !== 'all' && t.outcome !== outcomeFilter) return false;
      return true;
    });
  }, [trackings, statusFilter, outcomeFilter]);

  // Summary stats
  const stats = useMemo(() => {
    const completed = trackings.filter(t => t.status === 'completed');
    return {
      total: trackings.length,
      active: trackings.filter(t => t.status === 'active').length,
      completed: completed.length,
      improved: completed.filter(t => t.outcome === 'improved').length,
      stable: completed.filter(t => t.outcome === 'stable').length,
      worsened: completed.filter(t => t.outcome === 'worsened').length,
    };
  }, [trackings]);

  const getOutcomeColor = (outcome: TrackingOutcome) => {
    switch (outcome) {
      case 'improved': return 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30';
      case 'worsened': return 'text-red-400 bg-red-500/20 border-red-500/30';
      case 'stable': return 'text-blue-400 bg-blue-500/20 border-blue-500/30';
      default: return 'text-slate-400 bg-slate-500/20 border-slate-500/30';
    }
  };

  const getStatusColor = (status: TrackingStatus) => {
    switch (status) {
      case 'active': return 'text-amber-400 bg-amber-500/20 border-amber-500/30';
      case 'completed': return 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30';
      case 'cancelled': return 'text-slate-400 bg-slate-500/20 border-slate-500/30';
      default: return 'text-slate-400 bg-slate-500/20 border-slate-500/30';
    }
  };

  const formatDelta = (value: number | null, suffix = '') => {
    if (value === null) return 'N/A';
    const sign = value > 0 ? '+' : '';
    return `${sign}${value}${suffix}`;
  };

  return (
    <div className="h-full bg-slate-950 border border-slate-800 rounded-[2.5rem] p-8 overflow-hidden flex flex-col shadow-2xl animate-in fade-in duration-500">
      
      {/* Sub-tabs */}
      <div className="flex-shrink-0 flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('interventions')}
          className={`px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 ${
            activeTab === 'interventions'
              ? 'bg-indigo-600 text-white'
              : 'bg-slate-900 text-slate-500 hover:text-slate-300 border border-slate-800'
          }`}
        >
          📝 Interventions
          <span className={`px-1.5 py-0.5 rounded text-[8px] ${
            activeTab === 'interventions' ? 'bg-indigo-500' : 'bg-slate-800'
          }`}>
            {logs.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('impact')}
          className={`px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 ${
            activeTab === 'impact'
              ? 'bg-purple-600 text-white'
              : 'bg-slate-900 text-slate-500 hover:text-slate-300 border border-slate-800'
          }`}
        >
          📈 Impact Tracking
          <span className={`px-1.5 py-0.5 rounded text-[8px] ${
            activeTab === 'impact' ? 'bg-purple-500' : 'bg-slate-800'
          }`}>
            {trackings.length}
          </span>
        </button>
      </div>

      {/* INTERVENTIONS TAB */}
      {activeTab === 'interventions' && (
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="mb-4">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
              📝 Recent Coaching Interventions
            </h3>
            <p className="text-[10px] text-slate-600 font-mono mt-1">Click a student card to log new interventions</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {logs.map(log => (
              <div key={log.id} className="p-5 bg-slate-900/30 rounded-2xl border border-slate-800/50 shadow-inner hover:border-slate-700 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${log.type === 'coaching' ? 'bg-indigo-500 shadow-[0_0_10px_#6366f1]' : 'bg-red-500 shadow-[0_0_10px_#ef4444]'}`} />
                    <div>
                      <p className="text-sm font-black text-white uppercase italic">{log.studentName}</p>
                      <p className="text-[10px] text-slate-500 font-mono">{log.coachName || 'Unknown Coach'}</p>
                    </div>
                  </div>
                  <div className="text-right text-[9px] font-mono text-slate-700">
                    {log.createdAt?.seconds ? new Date(log.createdAt.seconds * 1000).toLocaleDateString() : 'Syncing...'}
                  </div>
                </div>
                {log.objective && (
                  <p className="text-[10px] text-indigo-400 font-bold mb-2">{log.objective}</p>
                )}
                {log.whatWasDone && (
                  <p className="text-[10px] text-slate-400 line-clamp-2">{log.whatWasDone}</p>
                )}
                {log.nextSteps && (
                  <div className="mt-2 pt-2 border-t border-slate-800">
                    <p className="text-[9px] text-amber-400">→ {log.nextSteps.substring(0, 60)}...</p>
                  </div>
                )}
              </div>
            ))}
            {logs.length === 0 && (
              <div className="col-span-2 text-center py-20 text-slate-600 italic text-xs">
                No interventions logged yet. Click on a student to start logging coaching sessions.
              </div>
            )}
          </div>
        </div>
      )}

      {/* IMPACT TRACKING TAB */}
      {activeTab === 'impact' && (
        <div className="flex-1 overflow-hidden flex flex-col">
          
          {/* Summary Cards */}
          <div className="flex-shrink-0 grid grid-cols-2 md:grid-cols-6 gap-3 mb-6">
            <div className="p-3 bg-slate-900/50 rounded-xl border border-slate-800 text-center">
              <div className="text-2xl font-black text-white">{stats.total}</div>
              <div className="text-[8px] text-slate-500 uppercase">Total</div>
            </div>
            <div className="p-3 bg-amber-900/20 rounded-xl border border-amber-500/30 text-center">
              <div className="text-2xl font-black text-amber-400">{stats.active}</div>
              <div className="text-[8px] text-amber-500 uppercase">Active</div>
            </div>
            <div className="p-3 bg-slate-900/50 rounded-xl border border-slate-800 text-center">
              <div className="text-2xl font-black text-slate-300">{stats.completed}</div>
              <div className="text-[8px] text-slate-500 uppercase">Completed</div>
            </div>
            <div className="p-3 bg-emerald-900/20 rounded-xl border border-emerald-500/30 text-center">
              <div className="text-2xl font-black text-emerald-400">{stats.improved}</div>
              <div className="text-[8px] text-emerald-500 uppercase">Improved</div>
            </div>
            <div className="p-3 bg-blue-900/20 rounded-xl border border-blue-500/30 text-center">
              <div className="text-2xl font-black text-blue-400">{stats.stable}</div>
              <div className="text-[8px] text-blue-500 uppercase">Stable</div>
            </div>
            <div className="p-3 bg-red-900/20 rounded-xl border border-red-500/30 text-center">
              <div className="text-2xl font-black text-red-400">{stats.worsened}</div>
              <div className="text-[8px] text-red-500 uppercase">Worsened</div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex-shrink-0 flex gap-3 mb-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-[10px] font-bold text-slate-400 outline-none"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <select
              value={outcomeFilter}
              onChange={(e) => setOutcomeFilter(e.target.value as any)}
              className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-[10px] font-bold text-slate-400 outline-none"
            >
              <option value="all">All Outcomes</option>
              <option value="improved">Improved</option>
              <option value="stable">Stable</option>
              <option value="worsened">Worsened</option>
              <option value="pending">Pending</option>
            </select>
            <div className="flex-1" />
            <span className="text-[9px] text-slate-600 self-center">
              Showing {filteredTrackings.length} of {trackings.length}
            </span>
          </div>

          {/* Trackings Table */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {filteredTrackings.length === 0 ? (
              <div className="text-center py-20 text-slate-600 italic text-xs">
                No impact trackings yet. Use the "📈 Track Impact" button in a student modal to start tracking.
              </div>
            ) : (
              <div className="space-y-3">
                {filteredTrackings.map(tracking => (
                  <div key={tracking.id} className="p-4 bg-slate-900/30 rounded-2xl border border-slate-800/50 hover:border-slate-700 transition-colors">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="text-sm font-black text-white uppercase italic">{tracking.studentName}</p>
                        <p className="text-[9px] text-slate-500">{tracking.studentCourse}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded border text-[8px] font-bold uppercase ${getStatusColor(tracking.status)}`}>
                          {tracking.status}
                        </span>
                        {tracking.status === 'completed' && (
                          <span className={`px-2 py-1 rounded border text-[8px] font-bold uppercase ${getOutcomeColor(tracking.outcome)}`}>
                            {tracking.outcome}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Info Row */}
                    <div className="flex flex-wrap gap-4 text-[9px] text-slate-500 mb-3">
                      <span>📋 {tracking.interventionType}</span>
                      <span>📅 {tracking.period.replace('_', ' ')}</span>
                      <span>🕐 Started: {tracking.createdAt.toLocaleDateString()}</span>
                      {tracking.status === 'active' && (
                        <span className="text-amber-400">
                          ⏳ Next snapshot: {tracking.nextSnapshotDate.toLocaleDateString()}
                        </span>
                      )}
                      {tracking.weeklySnapshots && (
                        <span>📸 {tracking.weeklySnapshots.length} snapshots</span>
                      )}
                    </div>

                    {/* Metrics Comparison (for completed) */}
                    {tracking.status === 'completed' && tracking.outcomeDetails && (
                      <div className="grid grid-cols-5 gap-2 p-3 bg-slate-900/50 rounded-xl">
                        <div className="text-center">
                          <div className="text-[8px] text-slate-600 uppercase">RSR Δ</div>
                          <div className={`text-sm font-bold ${
                            (tracking.outcomeDetails.rsrDelta || 0) > 0 ? 'text-emerald-400' :
                            (tracking.outcomeDetails.rsrDelta || 0) < 0 ? 'text-red-400' : 'text-slate-400'
                          }`}>
                            {formatDelta(tracking.outcomeDetails.rsrDelta, '%')}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-[8px] text-slate-600 uppercase">KSI Δ</div>
                          <div className={`text-sm font-bold ${
                            (tracking.outcomeDetails.ksiDelta || 0) > 0 ? 'text-emerald-400' :
                            (tracking.outcomeDetails.ksiDelta || 0) < 0 ? 'text-red-400' : 'text-slate-400'
                          }`}>
                            {formatDelta(tracking.outcomeDetails.ksiDelta, '%')}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-[8px] text-slate-600 uppercase">Velocity Δ</div>
                          <div className={`text-sm font-bold ${
                            (tracking.outcomeDetails.velocityDelta || 0) > 0 ? 'text-emerald-400' :
                            (tracking.outcomeDetails.velocityDelta || 0) < 0 ? 'text-red-400' : 'text-slate-400'
                          }`}>
                            {formatDelta(tracking.outcomeDetails.velocityDelta, '%')}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-[8px] text-slate-600 uppercase">Risk Δ</div>
                          <div className={`text-sm font-bold ${
                            (tracking.outcomeDetails.riskScoreDelta || 0) < 0 ? 'text-emerald-400' :
                            (tracking.outcomeDetails.riskScoreDelta || 0) > 0 ? 'text-red-400' : 'text-slate-400'
                          }`}>
                            {formatDelta(tracking.outcomeDetails.riskScoreDelta)}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-[8px] text-slate-600 uppercase">Tier</div>
                          <div className="text-sm font-bold text-purple-400">
                            {tracking.outcomeDetails.tierChange || '—'}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Progress bar for active */}
                    {tracking.status === 'active' && (
                      <div className="mt-3">
                        <div className="flex justify-between text-[8px] text-slate-600 mb-1">
                          <span>Progress</span>
                          <span>{tracking.weeklySnapshots?.length || 0} / {parseInt(tracking.period.split('_')[0])} weeks</span>
                        </div>
                        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-purple-500 rounded-full transition-all"
                            style={{ 
                              width: `${((tracking.weeklySnapshots?.length || 0) / parseInt(tracking.period.split('_')[0])) * 100}%` 
                            }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Notes */}
                    {tracking.interventionNotes && (
                      <p className="mt-3 text-[9px] text-slate-500 italic">
                        "{tracking.interventionNotes}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
