'use client';

export default function TowerPage() {
  return (
    <div className="min-h-screen bg-alpha-navy-bg p-6 lg:p-12">
      
      {/* Header */}
      <header className="mb-8 border-b border-white/10 pb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-white uppercase tracking-ultra">
              THE TOWER
            </h1>
            <p className="text-alpha-gold text-[10px] font-bold tracking-widest uppercase mt-1">
              Master Analytics Dashboard
            </p>
          </div>
          <a 
            href="/field"
            className="px-4 py-2 bg-alpha-navy-light hover:bg-alpha-navy-surface border border-alpha-navy-light text-slate-400 hover:text-alpha-gold text-[10px] font-black uppercase rounded-lg transition-all"
          >
            → The Field
          </a>
        </div>
      </header>

      {/* Matrix Section */}
      <section className="mb-12">
        <h2 className="text-2xl font-black text-white uppercase mb-4">
          MASTERY VS. CONSISTENCY
        </h2>
        <div className="glass-card rounded-3xl p-8 h-[600px] flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4">📊</div>
            <p className="text-slate-500">Matrix Component Loading...</p>
          </div>
        </div>
      </section>

      {/* Triage Stack */}
      <section>
        <h2 className="text-2xl font-black text-white uppercase mb-4">
          TRIAGE STACK
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Red Zone */}
          <div className="glass-card rounded-2xl overflow-hidden border-l-4 border-risk-red">
            <div className="p-4 bg-risk-red/10">
              <h3 className="text-risk-red font-black text-sm uppercase">
                🚨 CRITICAL
              </h3>
            </div>
            <div className="p-4">
              <p className="text-slate-500 text-sm">High risk students...</p>
            </div>
          </div>

          {/* Amber Zone */}
          <div className="glass-card rounded-2xl overflow-hidden border-l-4 border-risk-amber">
            <div className="p-4 bg-risk-amber/10">
              <h3 className="text-risk-amber font-black text-sm uppercase">
                ⚠️ WATCH
              </h3>
            </div>
            <div className="p-4">
              <p className="text-slate-500 text-sm">Watch list...</p>
            </div>
          </div>

          {/* Green Zone */}
          <div className="glass-card rounded-2xl overflow-hidden border-l-4 border-risk-emerald">
            <div className="p-4 bg-risk-emerald/10">
              <h3 className="text-risk-emerald font-black text-sm uppercase">
                ⚡ OPTIMAL
              </h3>
            </div>
            <div className="p-4">
              <p className="text-slate-500 text-sm">Optimal performance...</p>
            </div>
          </div>

        </div>
      </section>

    </div>
  );
}
