'use client';

import { useEffect } from 'react';

interface HelpModalProps {
  onClose: () => void;
}

export default function HelpModal({ onClose }: HelpModalProps) {
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
      <div className="bg-[#0a0a0a] border border-slate-800 w-full max-w-2xl rounded-3xl relative z-10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-gradient-to-b from-slate-900/50 to-transparent">
          <div>
            <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">Help & Shortcuts</h2>
            <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest mt-1">DRI Command Center V5.1</p>
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
              {[
                { key: '1', action: 'Switch to TRIAGE view' },
                { key: '2', action: 'Switch to MATRIX view' },
                { key: '3', action: 'Switch to HEATMAP view' },
                { key: '4', action: 'Switch to LOG view' },
                { key: '/', action: 'Focus search input' },
                { key: '?', action: 'Open this help modal' },
                { key: 'Esc', action: 'Close modal / dialog' },
                { key: '← →', action: 'Navigate students in modal' },
              ].map(({ key, action }) => (
                <div key={key} className="flex items-center gap-3 p-3 bg-slate-900/40 rounded-xl border border-slate-800">
                  <kbd className="bg-slate-800 text-indigo-400 px-2 py-1 rounded text-xs font-mono font-bold min-w-[40px] text-center">
                    {key}
                  </kbd>
                  <span className="text-[11px] text-slate-400">{action}</span>
                </div>
              ))}
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
