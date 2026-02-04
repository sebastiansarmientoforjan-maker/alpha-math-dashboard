'use client';

import { useEffect } from 'react';

interface HelpModalProps {
  onClose: () => void;
  mode?: 'legacy' | 'tower' | 'field';
}

export default function HelpModal({ onClose, mode = 'legacy' }: HelpModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl p-4 animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="bg-alpha-navy border border-slate-800 w-full max-w-2xl rounded-3xl relative z-10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-gradient-to-b from-slate-900/50 to-transparent">
          <div>
            <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">Help & Shortcuts</h2>
            <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest mt-1">
              {mode === 'tower' ? 'The Tower • Strategic Analytics' : mode === 'field' ? 'The Field • Tactical Center' : 'DRI Command Center V5.4'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-600 hover:text-white text-2xl transition-colors p-2 hover:bg-slate-800 rounded-lg"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
          
          {/* Keyboard Shortcuts */}
          <section>
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
              ⌨️ Keyboard Shortcuts
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {mode === 'tower' && [
                { key: '1', action: 'Switch to MATRIX view' },
                { key: '2', action: 'Switch to TRIAGE view' },
                { key: '3', action: 'Switch to HEATMAP view' },
                { key: 's', action: 'Toggle selection mode' },
                { key: 'c', action: 'Clear all filters' },
                { key: '?', action: 'Open this help modal' },
                { key: 'Esc', action: 'Close modal / Exit selection' },
                { key: '← →', action: 'Navigate students in modal' },
                { key: 'Ctrl+A', action: 'Select all visible students' },
              ].map(({ key, action }) => (
                <div key={key} className="flex items-center gap-3 p-3 bg-slate-900/40 rounded-xl border border-slate-800">
                  <kbd className="bg-slate-800 text-indigo-400 px-2 py-1 rounded text-xs font-mono font-bold min-w-[50px] text-center">
                    {key}
                  </kbd>
                  <span className="text-[11px] text-slate-400">{action}</span>
                </div>
              ))}
              {mode === 'field' && [
                { key: 'c', action: 'Clear all filters' },
                { key: '?', action: 'Open this help modal' },
                { key: 'Esc', action: 'Close modal' },
              ].map(({ key, action }) => (
                <div key={key} className="flex items-center gap-3 p-3 bg-slate-900/40 rounded-xl border border-slate-800">
                  <kbd className="bg-slate-800 text-indigo-400 px-2 py-1 rounded text-xs font-mono font-bold min-w-[50px] text-center">
                    {key}
                  </kbd>
                  <span className="text-[11px] text-slate-400">{action}</span>
                </div>
              ))}
              {mode === 'legacy' && [
                { key: '1', action: 'Switch to TRIAGE view' },
                { key: '2', action: 'Switch to MATRIX view' },
                { key: '3', action: 'Switch to HEATMAP view' },
                { key: '4', action: 'Switch to LOG view' },
                { key: '/', action: 'Focus search input' },
                { key: '?', action: 'Open this help modal' },
                { key: 'Esc', action: 'Close modal / Exit selection' },
                { key: '← →', action: 'Navigate students in modal' },
                { key: 'h', action: 'Toggle compact header' },
                { key: 'c', action: 'Clear all filters' },
                { key: 'Ctrl+A', action: 'Select all visible students' },
                { key: 'Ctrl+I', action: 'Log intervention (in modal)' },
              ].map(({ key, action }) => (
                <div key={key} className="flex items-center gap-3 p-3 bg-slate-900/40 rounded-xl border border-slate-800">
                  <kbd className="bg-slate-800 text-indigo-400 px-2 py-1 rounded text-xs font-mono font-bold min-w-[50px] text-center">
                    {key}
                  </kbd>
                  <span className="text-[11px] text-slate-400">{action}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Tower View Modes */}
          {mode === 'tower' && (
            <section>
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                👁️ View Modes
              </h3>
              <div className="space-y-3">
                <div className="p-4 bg-alpha-gold-dim border border-alpha-gold/30 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">📊</span>
                    <span className="text-[11px] font-bold text-alpha-gold uppercase">Matrix View</span>
                  </div>
                  <p className="text-[10px] text-slate-400">Interactive scatter plot showing Mastery (RSR) vs Consistency (KSI) for all students. Click any point to view student details.</p>
                </div>
                <div className="p-4 bg-red-950/20 border border-red-500/30 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">🏥</span>
                    <span className="text-[11px] font-bold text-risk-red uppercase">Triage View</span>
                  </div>
                  <p className="text-[10px] text-slate-400">Three-column layout sorting students by risk tier: Critical (Red), Watch (Amber), and Optimal (Green). Sorted by risk score within each tier.</p>
                </div>
                <div className="p-4 bg-orange-950/20 border border-orange-500/30 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">🔥</span>
                    <span className="text-[11px] font-bold text-orange-400 uppercase">Heatmap View</span>
                  </div>
                  <p className="text-[10px] text-slate-400">Shows top 15 critical knowledge components across all courses. Color-coded cells indicate average RSR: Red (&lt;40%), Amber (40-70%), Green (&gt;70%).</p>
                </div>
              </div>
            </section>
          )}

          {/* Tower Bulk Selection */}
          {mode === 'tower' && (
            <section>
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                ☐ Bulk Selection
              </h3>
              <div className="p-4 bg-indigo-950/20 border border-indigo-500/30 rounded-xl space-y-3">
                <p className="text-[11px] text-indigo-200">
                  Select multiple students in Triage view for batch operations and CSV export.
                </p>
                <div className="space-y-2 text-[10px] text-slate-400">
                  <div className="flex items-start gap-2">
                    <span className="text-indigo-400">1.</span>
                    <span>Click "☐ Select" button or press <kbd className="bg-slate-800 px-1 rounded">s</kbd> to enable selection mode</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-indigo-400">2.</span>
                    <span>Click checkboxes on student cards to select them</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-indigo-400">3.</span>
                    <span>Press <kbd className="bg-slate-800 px-1 rounded">Ctrl+A</kbd> to select all visible students</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-indigo-400">4.</span>
                    <span>Use the Bulk Actions Bar to export to CSV or view aggregate stats</span>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Field Mission System */}
          {mode === 'field' && (
            <section>
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                ⚔️ Mission System
              </h3>
              <div className="space-y-3">
                <div className="p-4 bg-red-950/20 border border-red-500/30 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">🚨</span>
                    <span className="text-[11px] font-bold text-risk-red uppercase">Red Missions</span>
                  </div>
                  <p className="text-[10px] text-slate-400">Critical intervention required. Students with Risk Score ≥ 60 or RSR &lt; 50%. Immediate action needed.</p>
                </div>
                <div className="p-4 bg-amber-950/20 border border-amber-500/30 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">⚠️</span>
                    <span className="text-[11px] font-bold text-risk-amber uppercase">Amber Missions</span>
                  </div>
                  <p className="text-[10px] text-slate-400">Elevated risk monitoring. Students with Risk Score 35-59 or low KSI. Monitor closely.</p>
                </div>
                <div className="p-4 bg-emerald-950/20 border border-emerald-500/30 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">⚡</span>
                    <span className="text-[11px] font-bold text-risk-emerald uppercase">Green Check-ins</span>
                  </div>
                  <p className="text-[10px] text-slate-400">Scheduled touchpoints for high performers. Students with RSR ≥ 85% and Velocity ≥ 80%.</p>
                </div>
              </div>
            </section>
          )}

          {/* New Feature: Coach Interventions */}
          <section>
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
              📝 Coach Interventions
            </h3>
            <div className="p-4 bg-indigo-950/20 border border-indigo-500/30 rounded-xl space-y-3">
              <p className="text-[11px] text-indigo-200">
                Log detailed coaching sessions for any student to track interventions over time.
              </p>
              <div className="space-y-2 text-[10px] text-slate-400">
                <div className="flex items-start gap-2">
                  <span className="text-indigo-400">1.</span>
                  <span>Click on any student card to open their profile</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-indigo-400">2.</span>
                  <span>Click "📝 Log Intervention" button (or press Ctrl+I)</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-indigo-400">3.</span>
                  <span>Fill in: Coach name, date, objective, what was done, outcomes, and next steps</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-indigo-400">4.</span>
                  <span>View intervention history in the "Interventions" tab</span>
                </div>
              </div>
            </div>
          </section>

          {/* Persistent Filters */}
          <section>
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
              🔍 Persistent Filters
            </h3>
            <div className="p-4 bg-purple-950/20 border border-purple-500/30 rounded-xl space-y-2">
              <p className="text-[11px] text-purple-200">
                Search and course filters now persist across view changes.
              </p>
              <ul className="text-[10px] text-slate-400 space-y-1">
                <li>• Filters apply to TRIAGE, MATRIX, and LOG views</li>
                <li>• Active filters shown below the search bar</li>
                <li>• Press <kbd className="bg-slate-800 px-1 rounded">c</kbd> to clear all filters</li>
                <li>• Click ✕ on individual filter tags to remove them</li>
              </ul>
            </div>
          </section>

          {/* Metrics Glossary */}
          <section>
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
              📊 Metrics Glossary
            </h3>
            <div className="space-y-3">
              {[
                { 
                  acronym: 'RSR', 
                  name: 'Recent Success Rate', 
                  description: 'Proportion of recent tasks with >80% accuracy. Measures immediate performance.',
                  threshold: '< 60% = Critical'
                },
                { 
                  acronym: 'KSI', 
                  name: 'Knowledge Stability Index', 
                  description: 'Measures consistency of performance over time. Low KSI = volatile accuracy.',
                  threshold: '< 50% = Critical'
                },
                { 
                  acronym: 'DER', 
                  name: 'Debt Exposure Ratio', 
                  description: 'Percentage of K-8 topics mastered during High School. Indicates remedial learning.',
                  threshold: '> 20% = Critical'
                },
                { 
                  acronym: 'PDI', 
                  name: 'Precision Decay Index', 
                  description: 'Ratio of recent errors to early errors. Higher = performance declining over time.',
                  threshold: '> 1.5x = Warning'
                },
                { 
                  acronym: 'iROI', 
                  name: 'Investment Return on Investment', 
                  description: 'XP earned per second of engagement. Measures learning efficiency.',
                  threshold: '< 0.3 = Low productivity'
                },
                { 
                  acronym: 'Velocity', 
                  name: 'Weekly XP Progress', 
                  description: `Percentage of weekly XP goal achieved. 100% = 125 XP/week standard.`,
                  threshold: '< 30% = Critical'
                },
              ].map(({ acronym, name, description, threshold }) => (
                <div key={acronym} className="p-4 bg-slate-900/40 rounded-xl border border-slate-800">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-indigo-400 font-black text-sm">{acronym}</span>
                    <span className="text-slate-500 text-[10px]">—</span>
                    <span className="text-white font-bold text-[11px]">{name}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mb-2">{description}</p>
                  <div className="text-[9px] text-amber-500 font-mono">{threshold}</div>
                </div>
              ))}
            </div>
          </section>

          {/* Risk Tiers */}
          <section>
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
              🚦 Risk Classification
            </h3>
            <div className="space-y-2">
              <div className="flex items-center gap-3 p-3 bg-red-500/10 rounded-xl border border-red-500/30">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div>
                  <span className="text-red-400 font-bold text-xs">RED / Critical</span>
                  <p className="text-[10px] text-slate-500">Risk Score ≥ 60, or RSR &lt; 60% with high risk factors</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-amber-500/10 rounded-xl border border-amber-500/30">
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <div>
                  <span className="text-amber-400 font-bold text-xs">YELLOW / Watch</span>
                  <p className="text-[10px] text-slate-500">Risk Score 35-59, needs attention but not critical</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/30">
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <div>
                  <span className="text-emerald-400 font-bold text-xs">GREEN / Optimal</span>
                  <p className="text-[10px] text-slate-500">Risk Score &lt; 35, performing well with stable metrics</p>
                </div>
              </div>
            </div>
          </section>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/30">
          <p className="text-[9px] text-slate-600 text-center font-mono">
            Press <kbd className="bg-slate-800 px-1 rounded">Esc</kbd> or click outside to close
          </p>
        </div>
      </div>
    </div>
  );
}
