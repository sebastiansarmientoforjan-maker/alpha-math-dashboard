'use client';

// Si no tienes iconos, puedes quitar los imports y usar texto (ej: "X" en vez de <X />)
import { X, Brain, Activity, Clock, AlertTriangle } from 'lucide-react'; 

export default function StudentModal({ student, onClose }: { student: any; onClose: () => void }) {
  if (!student) return null;

  const m = student.metrics || {};
  // Aquí accedemos a la lista COMPLETA de tareas de este estudiante
  const tasks = student.activity?.tasks || []; 

  // Las ordenamos para ver lo último que hizo primero
  const sortedTasks = [...tasks].sort((a: any, b: any) => 
    new Date(b.completedLocal || 0).getTime() - new Date(a.completedLocal || 0).getTime()
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      {/* Fondo clickeable para cerrar */}
      <div className="absolute inset-0" onClick={onClose}></div>

      <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl max-h-[85vh] overflow-hidden rounded-2xl shadow-2xl relative flex flex-col">
        
        {/* HEADER */}
        <div className="p-6 border-b border-slate-800 bg-slate-900 flex justify-between items-center shrink-0">
          <div className="flex gap-4 items-center">
            {/* Velocity Circle */}
            <div className={`w-14 h-14 rounded-full flex items-center justify-center text-xl font-black border-4 
              ${m.velocityScore < 30 ? 'border-red-500 text-red-500' : 
                m.velocityScore < 60 ? 'border-amber-500 text-amber-500' : 'border-emerald-500 text-emerald-500'}`}>
              {m.velocityScore}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white tracking-tight">{student.firstName} {student.lastName}</h2>
              <div className="flex gap-3 text-xs font-mono text-slate-400 mt-1">
                 <span>ID: {student.id}</span>
                 <span>•</span>
                 <span className="text-emerald-400">{student.currentCourse?.name}</span>
              </div>
            </div>
          </div>
          
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white">
             <span className="text-xl font-bold">✕</span>
          </button>
        </div>

        {/* SCROLLABLE CONTENT */}
        <div className="overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* COLUMNA IZQUIERDA: DIAGNÓSTICO TIER 4 */}
          <div className="space-y-6">
            
            {/* ZOMBIE METER */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/60">
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                 🧠 Focus Integrity
              </h3>
              <div className="flex items-end gap-2 mb-2">
                <span className={`text-3xl font-black ${m.focusIntegrity < 40 ? 'text-red-500' : 'text-white'}`}>
                    {m.focusIntegrity}%
                </span>
                <span className="text-[10px] text-slate-500 mb-1">Productivity</span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${m.focusIntegrity < 40 ? 'bg-red-500' : 'bg-indigo-500'}`} 
                  style={{ width: `${m.focusIntegrity}%` }}
                />
              </div>
              {m.focusIntegrity < 40 && (
                  <div className="mt-3 text-[10px] bg-red-500/10 text-red-400 p-2 rounded border border-red-500/20">
                    ⚠️ <b>Zombie Mode:</b> High screen time but low output. Check for distractions.
                  </div>
              )}
            </div>

            {/* NEMESIS BLOCKER */}
            {m.nemesisTopic ? (
              <div className="bg-red-900/10 p-4 rounded-xl border border-red-500/20 relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-red-500 text-white text-[9px] font-bold px-2 py-1 rounded-bl-lg">BLOCKED</div>
                <h3 className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-2">Primary Nemesis</h3>
                <p className="text-white font-bold text-sm leading-snug mb-3">"{m.nemesisTopic}"</p>
                <div className="text-[10px] text-red-300 font-mono bg-red-900/20 p-2 rounded">
                  System detected repeated failures (< 60% acc) on this specific topic.
                </div>
              </div>
            ) : (
              <div className="bg-emerald-900/10 p-4 rounded-xl border border-emerald-500/20">
                <h3 className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-2">Clear Path</h3>
                <p className="text-emerald-100 text-xs">No active blockers detected recently.</p>
              </div>
            )}

            {/* METRICS GRID */}
            <div className="grid grid-cols-2 gap-3">
               <div className="bg-slate-800 p-3 rounded-lg text-center border border-slate-700">
                 <div className="text-[9px] text-slate-500 uppercase font-bold">Time/Q</div>
                 <div className="text-lg font-mono font-bold text-white">{m.timePerQuestion}m</div>
               </div>
               <div className="bg-slate-800 p-3 rounded-lg text-center border border-slate-700">
                 <div className="text-[9px] text-slate-500 uppercase font-bold">Gap Score</div>
                 <div className={`text-lg font-mono font-bold ${m.contentGap > 5 ? 'text-red-400' : 'text-white'}`}>
                    {m.contentGap}
                 </div>
               </div>
            </div>

          </div>

          {/* COLUMNA DERECHA: TIME TRAVEL (HISTORIAL) */}
          <div className="md:col-span-2">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 flex justify-between items-center">
              <span>Activity Timeline (Last 7 Days)</span>
              <span className="bg-slate-800 text-slate-400 px-2 py-0.5 rounded text-[9px]">{tasks.length} tasks</span>
            </h3>
            
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
              {sortedTasks.length === 0 ? (
                <div className="text-slate-600 text-sm italic text-center py-12 bg-slate-950/30 rounded-xl border border-slate-800 border-dashed">
                    No recent activity data available.
                </div>
              ) : (
                sortedTasks.map((task: any) => {
                   const acc = Math.round((task.questionsCorrect / task.questions) * 100);
                   const isFail = acc < 60;
                   const minutes = Math.round((task.analysis?.timeEngaged || 0) / 60);
                   
                   return (
                     <div key={task.id} className="group flex items-center gap-4 bg-slate-950/80 p-3 rounded-lg border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-900 transition-all">
                        
                        {/* ICON TYPE */}
                        <div className={`w-8 h-8 rounded flex items-center justify-center font-bold text-[10px] shrink-0
                          ${task.type === 'Review' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
                          {task.type === 'Review' ? 'REV' : 'LRN'}
                        </div>

                        {/* INFO */}
                        <div className="flex-1 min-w-0">
                          <div className="text-slate-200 font-bold text-xs truncate group-hover:text-indigo-300 transition-colors">
                            {task.topic?.name || 'Unknown Topic'}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono flex gap-3 mt-0.5">
                             <span className="flex items-center gap-1">
                                📅 {task.completedLocal?.split(' ')[0]}
                             </span>
                             <span className="flex items-center gap-1">
                                ⏱️ {minutes} min
                             </span>
                          </div>
                        </div>

                        {/* GRADE */}
                        <div className="text-right shrink-0 min-w-[3rem]">
                          <div className={`font-black text-sm ${isFail ? 'text-red-500' : 'text-emerald-500'}`}>
                            {acc}%
                          </div>
                          <div className="text-[9px] text-slate-600">{task.questionsCorrect}/{task.questions}</div>
                        </div>
                     </div>
                   );
                })
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
