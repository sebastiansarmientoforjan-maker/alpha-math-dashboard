'use client';

import { useState, useEffect, useMemo } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { InterventionTracking, TrackingOutcome, TrackingStatus } from '@/types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface LogViewWithTabsProps {
  logs: any[];
}

const AVAILABLE_METRICS = [
  { key: 'rsr', label: 'RSR', fullLabel: 'RSR (Recent Success Rate)', suffix: '%' },
  { key: 'ksi', label: 'KSI', fullLabel: 'KSI (Knowledge Stability)', suffix: '%' },
  { key: 'velocity', label: 'Velocity', fullLabel: 'Velocity', suffix: '%' },
  { key: 'riskScore', label: 'Risk', fullLabel: 'Risk Score', suffix: '' },
  { key: 'tier', label: 'Tier', fullLabel: 'Tier Change', suffix: '' },
];

export default function LogViewWithTabs({ logs }: LogViewWithTabsProps) {
  const [activeTab, setActiveTab] = useState<'interventions' | 'impact'>('interventions');
  const [trackings, setTrackings] = useState<InterventionTracking[]>([]);
  const [statusFilter, setStatusFilter] = useState<'all' | TrackingStatus>('all');
  const [outcomeFilter, setOutcomeFilter] = useState<'all' | TrackingOutcome>('all');
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(['rsr', 'ksi', 'velocity', 'riskScore', 'tier']);
  const [showMetricSelector, setShowMetricSelector] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'intervention_tracking'), orderBy('createdAt', 'desc'));
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

  const filteredTrackings = useMemo(() => {
    return trackings.filter(t => {
      if (statusFilter !== 'all' && t.status !== statusFilter) return false;
      if (outcomeFilter !== 'all' && t.outcome !== outcomeFilter) return false;
      return true;
    });
  }, [trackings, statusFilter, outcomeFilter]);

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
      prev.includes(key) ? prev.filter(m => m !== key) : [...prev, key]
    );
  };

  // Export PDF real con jsPDF
  const handleExportPDF = async () => {
    setExporting(true);
    
    try {
      const completedTrackings = filteredTrackings.filter(t => t.status === 'completed');
      const reportDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
      
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      
      // Header
      doc.setFillColor(79, 70, 229);
      doc.rect(0, 0, pageWidth, 40, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text('DRI Impact Report', pageWidth / 2, 20, { align: 'center' });
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Generated: ${reportDate} | ${completedTrackings.length} completed trackings`, pageWidth / 2, 32, { align: 'center' });
      
      // Summary Stats
      doc.setTextColor(30, 41, 59);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Summary', 14, 55);
      
      const boxY = 60;
      const boxWidth = 28;
      const boxHeight = 20;
      const boxGap = 4;
      const startX = 14;
      
      const summaryData = [
        { label: 'Total', value: stats.total, color: [241, 245, 249] },
        { label: 'Active', value: stats.active, color: [254, 243, 199] },
        { label: 'Completed', value: stats.completed, color: [224, 231, 255] },
        { label: 'Improved', value: stats.improved, color: [209, 250, 229] },
        { label: 'Stable', value: stats.stable, color: [219, 234, 254] },
        { label: 'Worsened', value: stats.worsened, color: [254, 226, 226] },
      ];
      
      summaryData.forEach((item, i) => {
        const x = startX + (boxWidth + boxGap) * i;
        doc.setFillColor(item.color[0], item.color[1], item.color[2]);
        doc.roundedRect(x, boxY, boxWidth, boxHeight, 2, 2, 'F');
        
        doc.setTextColor(30, 41, 59);
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text(String(item.value), x + boxWidth / 2, boxY + 10, { align: 'center' });
        
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 116, 139);
        doc.text(item.label.toUpperCase(), x + boxWidth / 2, boxY + 16, { align: 'center' });
      });
      
      // Table
      doc.setTextColor(30, 41, 59);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Completed Trackings', 14, 95);
      
      if (completedTrackings.length === 0) {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(148, 163, 184);
        doc.text('No completed trackings to display', pageWidth / 2, 110, { align: 'center' });
      } else {
        const headers = ['Student', 'Course', 'Type', 'Period', 'Outcome'];
        selectedMetrics.forEach(metricKey => {
          const metric = AVAILABLE_METRICS.find(m => m.key === metricKey);
          if (metric) headers.push(metric.label + ' Δ');
        });
        
        const rows = completedTrackings.map(t => {
          const row: string[] = [
            t.studentName,
            t.studentCourse,
            t.interventionType,
            t.period.replace('_', ' '),
            t.outcome.toUpperCase(),
          ];
          
          selectedMetrics.forEach(metricKey => {
            if (t.outcomeDetails) {
              switch (metricKey) {
                case 'rsr': row.push(formatDelta(t.outcomeDetails.rsrDelta, '%')); break;
                case 'ksi': row.push(formatDelta(t.outcomeDetails.ksiDelta, '%')); break;
                case 'velocity': row.push(formatDelta(t.outcomeDetails.velocityDelta, '%')); break;
                case 'riskScore': row.push(formatDelta(t.outcomeDetails.riskScoreDelta)); break;
                case 'tier': row.push(t.outcomeDetails.tierChange || '—'); break;
                default: row.push('—');
              }
            } else {
              row.push('—');
            }
          });
          return row;
        });
        
        autoTable(doc, {
          startY: 100,
          head: [headers],
          body: rows,
          theme: 'striped',
          headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
          bodyStyles: { fontSize: 8, textColor: [30, 41, 59] },
          alternateRowStyles: { fillColor: [248, 250, 252] },
          columnStyles: { 0: { fontStyle: 'bold' }, 4: { halign: 'center' } },
          didParseCell: function(data) {
            if (data.column.index === 4 && data.section === 'body') {
              const outcome = data.cell.raw?.toString().toLowerCase();
              if (outcome === 'improved') data.cell.styles.textColor = [5, 150, 105];
              else if (outcome === 'worsened') data.cell.styles.textColor = [220, 38, 38];
              else if (outcome === 'stable') data.cell.styles.textColor = [37, 99, 235];
            }
            if (data.column.index > 4 && data.section === 'body') {
              const value = data.cell.raw?.toString() || '';
              if (value.startsWith('+')) data.cell.styles.textColor = [5, 150, 105];
              else if (value.startsWith('-')) data.cell.styles.textColor = [220, 38, 38];
            }
          },
          margin: { left: 14, right: 14 },
        });
      }
      
      // Footer
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text('DRI Command Center • Alpha Math Dashboard • Impact Tracking System', pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
        doc.text(`Page ${i} of ${pageCount}`, pageWidth - 14, doc.internal.pageSize.getHeight() - 10, { align: 'right' });
      }
      
      doc.save(`impact-report-${new Date().toISOString().split('T')[0]}.pdf`);
      
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('Error generating PDF. Please try again.');
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
            activeTab === 'interventions' ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-500 hover:text-slate-300 border border-slate-800'
          }`}
        >
          📝 Interventions
          <span className={`px-1.5 py-0.5 rounded text-[8px] ${activeTab === 'interventions' ? 'bg-indigo-500' : 'bg-slate-800'}`}>{logs.length}</span>
        </button>
        <button
          onClick={() => setActiveTab('impact')}
          className={`px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 ${
            activeTab === 'impact' ? 'bg-purple-600 text-white' : 'bg-slate-900 text-slate-500 hover:text-slate-300 border border-slate-800'
          }`}
        >
          📈 Impact Tracking
          <span className={`px-1.5 py-0.5 rounded text-[8px] ${activeTab === 'impact' ? 'bg-purple-500' : 'bg-slate-800'}`}>{trackings.length}</span>
        </button>
      </div>

      {/* INTERVENTIONS TAB */}
      {activeTab === 'interventions' && (
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="mb-4">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">📝 Recent Coaching Interventions</h3>
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
                {log.objective && <p className="text-[10px] text-indigo-400 font-bold mb-2">{log.objective}</p>}
                {log.whatWasDone && <p className="text-[10px] text-slate-400 line-clamp-2">{log.whatWasDone}</p>}
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
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)} className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-[10px] font-bold text-slate-400 outline-none">
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <select value={outcomeFilter} onChange={(e) => setOutcomeFilter(e.target.value as any)} className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-[10px] font-bold text-slate-400 outline-none">
              <option value="all">All Outcomes</option>
              <option value="improved">Improved</option>
              <option value="stable">Stable</option>
              <option value="worsened">Worsened</option>
              <option value="pending">Pending</option>
            </select>
            
            <div className="relative">
              <button onClick={() => setShowMetricSelector(!showMetricSelector)} className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-[10px] font-bold text-slate-400 hover:border-slate-700 transition-colors flex items-center gap-2">
                📊 Metrics ({selectedMetrics.length}) <span className="text-[8px]">▼</span>
              </button>
              {showMetricSelector && (
                <div className="absolute top-full left-0 mt-2 bg-slate-900 border border-slate-700 rounded-xl p-3 z-50 shadow-2xl min-w-[200px]">
                  <p className="text-[9px] text-slate-500 uppercase font-bold mb-2">Include in Report:</p>
                  {AVAILABLE_METRICS.map(metric => (
                    <label key={metric.key} className="flex items-center gap-2 py-1.5 cursor-pointer hover:bg-slate-800/50 px-2 rounded">
                      <input type="checkbox" checked={selectedMetrics.includes(metric.key)} onChange={() => toggleMetric(metric.key)} className="rounded border-slate-600 bg-slate-800 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-0" />
                      <span className="text-[10px] text-slate-300">{metric.fullLabel}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
            
            <div className="flex-1" />
            <span className="text-[9px] text-slate-600 self-center">Showing {filteredTrackings.length} of {trackings.length}</span>
            
            <button onClick={handleExportPDF} disabled={exporting || stats.completed === 0} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 text-white px-4 py-2 rounded-lg text-[10px] font-bold uppercase transition-colors flex items-center gap-2">
              {exporting ? (<><div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />Generating...</>) : (<>📄 Export PDF</>)}
            </button>
          </div>

          {showMetricSelector && <div className="fixed inset-0 z-40" onClick={() => setShowMetricSelector(false)} />}

          {/* Trackings List */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {filteredTrackings.length === 0 ? (
              <div className="text-center py-20 text-slate-600 italic text-xs">No impact trackings yet. Use the "📈 Track Impact" button in a student modal to start tracking.</div>
            ) : (
              <div className="space-y-3">
                {filteredTrackings.map(tracking => (
                  <div key={tracking.id} className="p-4 bg-slate-900/30 rounded-2xl border border-slate-800/50 hover:border-slate-700 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="text-sm font-black text-white uppercase italic">{tracking.studentName}</p>
                        <p className="text-[9px] text-slate-500">{tracking.studentCourse}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded border text-[8px] font-bold uppercase ${getStatusColor(tracking.status)}`}>{tracking.status}</span>
                        {tracking.status === 'completed' && <span className={`px-2 py-1 rounded border text-[8px] font-bold uppercase ${getOutcomeColor(tracking.outcome)}`}>{tracking.outcome}</span>}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-4 text-[9px] text-slate-500 mb-3">
                      <span>📋 {tracking.interventionType}</span>
                      <span>📅 {tracking.period.replace('_', ' ')}</span>
                      <span>🕐 Started: {tracking.createdAt.toLocaleDateString()}</span>
                      {tracking.status === 'active' && <span className="text-amber-400">⏳ Next snapshot: {tracking.nextSnapshotDate.toLocaleDateString()}</span>}
                      {tracking.weeklySnapshots && <span>📸 {tracking.weeklySnapshots.length} snapshots</span>}
                    </div>

                    {tracking.status === 'completed' && tracking.outcomeDetails && (
                      <div className="grid gap-2 p-3 bg-slate-900/50 rounded-xl" style={{ gridTemplateColumns: `repeat(${selectedMetrics.length}, 1fr)` }}>
                        {selectedMetrics.includes('rsr') && (
                          <div className="text-center">
                            <div className="text-[8px] text-slate-600 uppercase">RSR Δ</div>
                            <div className={`text-sm font-bold ${(tracking.outcomeDetails.rsrDelta || 0) > 0 ? 'text-emerald-400' : (tracking.outcomeDetails.rsrDelta || 0) < 0 ? 'text-red-400' : 'text-slate-400'}`}>{formatDelta(tracking.outcomeDetails.rsrDelta, '%')}</div>
                          </div>
                        )}
                        {selectedMetrics.includes('ksi') && (
                          <div className="text-center">
                            <div className="text-[8px] text-slate-600 uppercase">KSI Δ</div>
                            <div className={`text-sm font-bold ${(tracking.outcomeDetails.ksiDelta || 0) > 0 ? 'text-emerald-400' : (tracking.outcomeDetails.ksiDelta || 0) < 0 ? 'text-red-400' : 'text-slate-400'}`}>{formatDelta(tracking.outcomeDetails.ksiDelta, '%')}</div>
                          </div>
                        )}
                        {selectedMetrics.includes('velocity') && (
                          <div className="text-center">
                            <div className="text-[8px] text-slate-600 uppercase">Velocity Δ</div>
                            <div className={`text-sm font-bold ${(tracking.outcomeDetails.velocityDelta || 0) > 0 ? 'text-emerald-400' : (tracking.outcomeDetails.velocityDelta || 0) < 0 ? 'text-red-400' : 'text-slate-400'}`}>{formatDelta(tracking.outcomeDetails.velocityDelta, '%')}</div>
                          </div>
                        )}
                        {selectedMetrics.includes('riskScore') && (
                          <div className="text-center">
                            <div className="text-[8px] text-slate-600 uppercase">Risk Δ</div>
                            <div className={`text-sm font-bold ${(tracking.outcomeDetails.riskScoreDelta || 0) < 0 ? 'text-emerald-400' : (tracking.outcomeDetails.riskScoreDelta || 0) > 0 ? 'text-red-400' : 'text-slate-400'}`}>{formatDelta(tracking.outcomeDetails.riskScoreDelta)}</div>
                          </div>
                        )}
                        {selectedMetrics.includes('tier') && (
                          <div className="text-center">
                            <div className="text-[8px] text-slate-600 uppercase">Tier</div>
                            <div className="text-sm font-bold text-purple-400">{tracking.outcomeDetails.tierChange || '—'}</div>
                          </div>
                        )}
                      </div>
                    )}

                    {tracking.status === 'active' && (
                      <div className="mt-3">
                        <div className="flex justify-between text-[8px] text-slate-600 mb-1">
                          <span>Progress</span>
                          <span>{tracking.weeklySnapshots?.length || 0} / {parseInt(tracking.period.split('_')[0])} weeks</span>
                        </div>
                        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-purple-500 rounded-full transition-all" style={{ width: `${((tracking.weeklySnapshots?.length || 0) / parseInt(tracking.period.split('_')[0])) * 100}%` }} />
                        </div>
                      </div>
                    )}

                    {tracking.interventionNotes && <p className="mt-3 text-[9px] text-slate-500 italic">"{tracking.interventionNotes}"</p>}
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
