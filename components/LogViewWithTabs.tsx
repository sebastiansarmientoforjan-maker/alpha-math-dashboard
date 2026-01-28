'use client';

import { useState, useEffect, useMemo } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { InterventionTracking, TrackingOutcome, TrackingStatus } from '@/types';

interface LogViewWithTabsProps {
  logs: any[];
}

// Métricas disponibles para el reporte
const AVAILABLE_METRICS = [
  { key: 'rsr', label: 'RSR (Recent Success Rate)', suffix: '%' },
  { key: 'ksi', label: 'KSI (Knowledge Stability)', suffix: '%' },
  { key: 'velocity', label: 'Velocity', suffix: '%' },
  { key: 'riskScore', label: 'Risk Score', suffix: '' },
  { key: 'tier', label: 'Tier Change', suffix: '' },
];

export default function LogViewWithTabs({ logs }: LogViewWithTabsProps) {
  const [activeTab, setActiveTab] = useState<'interventions' | 'impact'>('interventions');
  const [trackings, setTrackings] = useState<InterventionTracking[]>([]);
  const [statusFilter, setStatusFilter] = useState<'all' | TrackingStatus>('all');
  const [outcomeFilter, setOutcomeFilter] = useState<'all' | TrackingOutcome>('all');
  
  // Métricas seleccionadas para el reporte
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(['rsr', 'ksi', 'velocity', 'riskScore', 'tier']);
  const [showMetricSelector, setShowMetricSelector] = useState(false);
  const [exporting, setExporting] = useState(false);

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

  const toggleMetric = (key: string) => {
    setSelectedMetrics(prev => 
      prev.includes(key) 
        ? prev.filter(m => m !== key)
        : [...prev, key]
    );
  };

  // Export PDF function
  const handleExportPDF = async () => {
    setExporting(true);
    
    try {
      const completedTrackings = filteredTrackings.filter(t => t.status === 'completed');
      
      // Generar HTML para el PDF
      const reportDate = new Date().toLocaleDateString('en-US', { 
        year: 'numeric', month: 'long', day: 'numeric' 
      });
      
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Impact Report - ${reportDate}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; color: #1e293b; }
            .header { text-align: center; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 2px solid #e2e8f0; }
            .header h1 { font-size: 28px; font-weight: 800; color: #0f172a; margin-bottom: 8px; }
            .header p { color: #64748b; font-size: 14px; }
            .summary { display: grid; grid-template-columns: repeat(6, 1fr); gap: 12px; margin-bottom: 40px; }
            .summary-card { padding: 16px; border-radius: 12px; text-align: center; }
            .summary-card.total { background: #f1f5f9; }
            .summary-card.active { background: #fef3c7; }
            .summary-card.completed { background: #e0e7ff; }
            .summary-card.improved { background: #d1fae5; }
            .summary-card.stable { background: #dbeafe; }
            .summary-card.worsened { background: #fee2e2; }
            .summary-card .value { font-size: 32px; font-weight: 800; }
            .summary-card .label { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #64748b; margin-top: 4px; }
            .section-title { font-size: 16px; font-weight: 700; color: #334155; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 1px solid #e2e8f0; }
            .tracking-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 16px; page-break-inside: avoid; }
            .tracking-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; }
            .student-name { font-size: 16px; font-weight: 700; color: #0f172a; }
            .student-course { font-size: 12px; color: #64748b; }
            .outcome-badge { padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: uppercase; }
            .outcome-improved { background: #d1fae5; color: #065f46; }
            .outcome-stable { background: #dbeafe; color: #1e40af; }
            .outcome-worsened { background: #fee2e2; color: #991b1b; }
            .tracking-meta { display: flex; gap: 20px; font-size: 11px; color: #64748b; margin-bottom: 16px; }
            .metrics-grid { display: grid; grid-template-columns: repeat(${selectedMetrics.length}, 1fr); gap: 8px; background: #fff; padding: 16px; border-radius: 8px; border: 1px solid #e2e8f0; }
            .metric-item { text-align: center; }
            .metric-label { font-size: 9px; text-transform: uppercase; color: #94a3b8; margin-bottom: 4px; }
            .metric-value { font-size: 16px; font-weight: 700; }
            .metric-positive { color: #059669; }
            .metric-negative { color: #dc2626; }
            .metric-neutral { color: #64748b; }
            .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; color: #94a3b8; font-size: 11px; }
            .no-data { text-align: center; padding: 60px; color: #94a3b8; font-style: italic; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>📊 DRI Impact Report</h1>
            <p>Generated on ${reportDate} • ${completedTrackings.length} completed trackings</p>
          </div>
          
          <div class="summary">
            <div class="summary-card total">
              <div class="value">${stats.total}</div>
              <div class="label">Total</div>
            </div>
            <div class="summary-card active">
              <div class="value">${stats.active}</div>
              <div class="label">Active</div>
            </div>
            <div class="summary-card completed">
              <div class="value">${stats.completed}</div>
              <div class="label">Completed</div>
            </div>
            <div class="summary-card improved">
              <div class="value">${stats.improved}</div>
              <div class="label">Improved</div>
            </div>
            <div class="summary-card stable">
              <div class="value">${stats.stable}</div>
              <div class="label">Stable</div>
            </div>
            <div class="summary-card worsened">
              <div class="value">${stats.worsened}</div>
              <div class="label">Worsened</div>
            </div>
          </div>
          
          <div class="section-title">Completed Intervention Trackings</div>
          
          ${completedTrackings.length === 0 ? `
            <div class="no-data">No completed trackings to display</div>
          ` : completedTrackings.map(t => `
            <div class="tracking-card">
              <div class="tracking-header">
                <div>
                  <div class="student-name">${t.studentName}</div>
                  <div class="student-course">${t.studentCourse}</div>
                </div>
                <span class="outcome-badge outcome-${t.outcome}">${t.outcome}</span>
              </div>
              <div class="tracking-meta">
                <span>📋 ${t.interventionType}</span>
                <span>📅 ${t.period.replace('_', ' ')}</span>
                <span>🕐 ${t.createdAt.toLocaleDateString()} → ${t.completedAt?.toLocaleDateString() || 'N/A'}</span>
              </div>
              ${t.outcomeDetails ? `
                <div class="metrics-grid">
                  ${selectedMetrics.includes('rsr') ? `
                    <div class="metric-item">
                      <div class="metric-label">RSR Δ</div>
                      <div class="metric-value ${(t.outcomeDetails.rsrDelta || 0) > 0 ? 'metric-positive' : (t.outcomeDetails.rsrDelta || 0) < 0 ? 'metric-negative' : 'metric-neutral'}">
                        ${formatDelta(t.outcomeDetails.rsrDelta, '%')}
                      </div>
                    </div>
                  ` : ''}
                  ${selectedMetrics.includes('ksi') ? `
                    <div class="metric-item">
                      <div class="metric-label">KSI Δ</div>
                      <div class="metric-value ${(t.outcomeDetails.ksiDelta || 0) > 0 ? 'metric-positive' : (t.outcomeDetails.ksiDelta || 0) < 0 ? 'metric-negative' : 'metric-neutral'}">
                        ${formatDelta(t.outcomeDetails.ksiDelta, '%')}
                      </div>
                    </div>
                  ` : ''}
                  ${selectedMetrics.includes('velocity') ? `
                    <div class="metric-item">
                      <div class="metric-label">Velocity Δ</div>
                      <div class="metric-value ${(t.outcomeDetails.velocityDelta || 0) > 0 ? 'metric-positive' : (t.outcomeDetails.velocityDelta || 0) < 0 ? 'metric-negative' : 'metric-neutral'}">
                        ${formatDelta(t.outcomeDetails.velocityDelta, '%')}
                      </div>
                    </div>
                  ` : ''}
                  ${selectedMetrics.includes('riskScore') ? `
                    <div class="metric-item">
                      <div class="metric-label">Risk Δ</div>
                      <div class="metric-value ${(t.outcomeDetails.riskScoreDelta || 0) < 0 ? 'metric-positive' : (t.outcomeDetails.riskScoreDelta || 0) > 0 ? 'metric-negative' : 'metric-neutral'}">
                        ${formatDelta(t.outcomeDetails.riskScoreDelta)}
                      </div>
                    </div>
                  ` : ''}
                  ${selectedMetrics.includes('tier') ? `
                    <div class="metric-item">
                      <div class="metric-label">Tier</div>
                      <div class="metric-value metric-neutral">
                        ${t.outcomeDetails.tierChange || '—'}
                      </div>
                    </div>
                  ` : ''}
                </div>
              ` : ''}
              ${t.interventionNotes ? `<p style="margin-top: 12px; font-size: 12px; color: #64748b; font-style: italic;">"${t.interventionNotes}"</p>` : ''}
            </div>
          `).join('')}
          
          <div class="footer">
            DRI Command Center • Alpha Math Dashboard • Impact Tracking System
          </div>
        </body>
        </html>
      `;
      
      // Crear blob y descargar
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `impact-report-${new Date().toISOString().split('T')[0]}.html`;
      a.click();
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Error exporting report:', error);
      alert('Error generating report. Please try again.');
    } finally {
      setExporting(false);
    }
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

          {/* Filters & Export */}
          <div className="flex-shrink-0 flex flex-wrap gap-3 mb-4">
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
            
            {/* Metric Selector */}
            <div className="relative">
              <button
                onClick={() => setShowMetricSelector(!showMetricSelector)}
                className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-[10px] font-bold text-slate-400 hover:border-slate-700 transition-colors flex items-center gap-2"
              >
                📊 Metrics ({selectedMetrics.length})
                <span className="text-[8px]">▼</span>
              </button>
              
              {showMetricSelector && (
                <div className="absolute top-full left-0 mt-2 bg-slate-900 border border-slate-700 rounded-xl p-3 z-50 shadow-2xl min-w-[200px]">
                  <p className="text-[9px] text-slate-500 uppercase font-bold mb-2">Include in Report:</p>
                  {AVAILABLE_METRICS.map(metric => (
                    <label key={metric.key} className="flex items-center gap-2 py-1.5 cursor-pointer hover:bg-slate-800/50 px-2 rounded">
                      <input
                        type="checkbox"
                        checked={selectedMetrics.includes(metric.key)}
                        onChange={() => toggleMetric(metric.key)}
                        className="rounded border-slate-600 bg-slate-800 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-0"
                      />
                      <span className="text-[10px] text-slate-300">{metric.label}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
            
            <div className="flex-1" />
            
            <span className="text-[9px] text-slate-600 self-center">
              Showing {filteredTrackings.length} of {trackings.length}
            </span>
            
            {/* Export Button */}
            <button
              onClick={handleExportPDF}
              disabled={exporting || stats.completed === 0}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 text-white px-4 py-2 rounded-lg text-[10px] font-bold uppercase transition-colors flex items-center gap-2"
            >
              {exporting ? (
                <>
                  <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  📄 Export Report
                </>
              )}
            </button>
          </div>

          {/* Click outside to close metric selector */}
          {showMetricSelector && (
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setShowMetricSelector(false)} 
            />
          )}

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

                    {/* Metrics Comparison (for completed) - Only show selected metrics */}
                    {tracking.status === 'completed' && tracking.outcomeDetails && (
                      <div className={`grid gap-2 p-3 bg-slate-900/50 rounded-xl`} style={{ gridTemplateColumns: `repeat(${selectedMetrics.length}, 1fr)` }}>
                        {selectedMetrics.includes('rsr') && (
                          <div className="text-center">
                            <div className="text-[8px] text-slate-600 uppercase">RSR Δ</div>
                            <div className={`text-sm font-bold ${
                              (tracking.outcomeDetails.rsrDelta || 0) > 0 ? 'text-emerald-400' :
                              (tracking.outcomeDetails.rsrDelta || 0) < 0 ? 'text-red-400' : 'text-slate-400'
                            }`}>
                              {formatDelta(tracking.outcomeDetails.rsrDelta, '%')}
                            </div>
                          </div>
                        )}
                        {selectedMetrics.includes('ksi') && (
                          <div className="text-center">
                            <div className="text-[8px] text-slate-600 uppercase">KSI Δ</div>
                            <div className={`text-sm font-bold ${
                              (tracking.outcomeDetails.ksiDelta || 0) > 0 ? 'text-emerald-400' :
                              (tracking.outcomeDetails.ksiDelta || 0) < 0 ? 'text-red-400' : 'text-slate-400'
                            }`}>
                              {formatDelta(tracking.outcomeDetails.ksiDelta, '%')}
                            </div>
                          </div>
                        )}
                        {selectedMetrics.includes('velocity') && (
                          <div className="text-center">
                            <div className="text-[8px] text-slate-600 uppercase">Velocity Δ</div>
                            <div className={`text-sm font-bold ${
                              (tracking.outcomeDetails.velocityDelta || 0) > 0 ? 'text-emerald-400' :
                              (tracking.outcomeDetails.velocityDelta || 0) < 0 ? 'text-red-400' : 'text-slate-400'
                            }`}>
                              {formatDelta(tracking.outcomeDetails.velocityDelta, '%')}
                            </div>
                          </div>
                        )}
                        {selectedMetrics.includes('riskScore') && (
                          <div className="text-center">
                            <div className="text-[8px] text-slate-600 uppercase">Risk Δ</div>
                            <div className={`text-sm font-bold ${
                              (tracking.outcomeDetails.riskScoreDelta || 0) < 0 ? 'text-emerald-400' :
                              (tracking.outcomeDetails.riskScoreDelta || 0) > 0 ? 'text-red-400' : 'text-slate-400'
                            }`}>
                              {formatDelta(tracking.outcomeDetails.riskScoreDelta)}
                            </div>
                          </div>
                        )}
                        {selectedMetrics.includes('tier') && (
                          <div className="text-center">
                            <div className="text-[8px] text-slate-600 uppercase">Tier</div>
                            <div className="text-sm font-bold text-purple-400">
                              {tracking.outcomeDetails.tierChange || '—'}
                            </div>
                          </div>
                        )}
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
