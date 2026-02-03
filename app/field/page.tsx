'use client';

export default function FieldPage() {
  return (
    <div className="min-h-screen bg-alpha-navy-bg">
      
      {/* Header */}
      <header className="border-b border-white/10 p-6">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <h1 className="text-xl font-black text-white uppercase tracking-ultra">
            TACTICAL OPS
          </h1>
          <a 
            href="/tower"
            className="px-4 py-2 bg-alpha-navy-light hover:bg-alpha-navy-surface text-slate-400 hover:text-alpha-gold text-[10px] font-black uppercase rounded-lg transition-all"
          >
            ← The Tower
          </a>
        </div>
      </header>

      {/* Mission Cards */}
      <main className="max-w-2xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h3 className="text-white/60 tracking-ultra text-sm font-bold uppercase">
            FEBRUARY 03, 2026 | 09:00 HOURS
          </h3>
          <div className="h-px w-12 bg-alpha-gold mx-auto mt-4"></div>
        </div>

        <div className="space-y-6">
          
          {/* Red Priority Mission */}
          <div className="glass-card border-l-4 border-risk-red rounded-2xl p-5 hover:translate-x-1 transition-all">
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="text-risk-red text-[10px] font-black uppercase mb-1">
                  🚨 URGENT MISSION
                </p>
                <h4 className="text-white text-xl font-black">Student Name</h4>
              </div>
              <div className="bg-risk-red/20 text-risk-red px-2 py-1 rounded text-[10px] font-black">
                -15% RSR
              </div>
            </div>
            <p className="text-slate-400 text-sm italic mb-4">
              Critical drop in Recent Success Rate detected.
            </p>
            <button className="w-full bg-alpha-gold text-black py-2 rounded-lg font-black text-[10px] uppercase hover:shadow-[0_0_15px_rgba(212,175,53,0.4)] transition-all">
              Log Intervention
            </button>
          </div>

        </div>
      </main>

    </div>
  );
}
