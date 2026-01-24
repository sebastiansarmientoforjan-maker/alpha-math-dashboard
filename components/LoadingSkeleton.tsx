// components/LoadingSkeleton.tsx

export function TriageColumnSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="h-24 bg-slate-900/50 rounded-2xl border border-slate-800/50" />
      ))}
    </div>
  );
}

export function MatrixSkeleton() {
  return (
    <div className="h-full w-full bg-slate-900/10 border border-slate-800 rounded-[2.5rem] p-8 flex items-center justify-center animate-pulse">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-500 text-sm font-mono">Loading KeenKT Matrix...</p>
      </div>
    </div>
  );
}

export function HeatmapSkeleton() {
  return (
    <div className="h-full w-full bg-slate-950 border border-slate-800 rounded-[2.5rem] p-8 overflow-hidden flex flex-col animate-pulse">
      <div className="space-y-2">
        {[...Array(12)].map((_, i) => (
          <div key={i} className="h-10 bg-slate-900/50 rounded" />
        ))}
      </div>
    </div>
  );
}
