'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';

export default function InterventionLogView() {
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'interventions'), orderBy('createdAt', 'desc'), limit(50));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setLogs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="bg-slate-900/20 border border-slate-800 rounded-2xl overflow-hidden h-[calc(100vh-250px)] flex flex-col">
       <div className="p-4 bg-slate-900/50 border-b border-slate-800 flex justify-between items-center">
          <h2 className="text-xs font-black text-indigo-400 uppercase tracking-widest">
             📡 Intervention History & Response Tracking
          </h2>
       </div>
       <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {logs.map(log => (
             <div key={log.id} className="flex items-center justify-between p-3 bg-[#0f0f0f] border border-slate-800 rounded-xl hover:border-slate-700 transition-colors">
                <div className="flex items-center gap-4">
                   <div className={`w-2 h-2 rounded-full ${log.type === 'coaching' ? 'bg-blue-500' : 'bg-red-500'}`}></div>
                   <div>
                      <div className="text-sm font-bold text-white">{log.studentName}</div>
                      <div className="text-[10px] text-slate-500 uppercase font-mono">
                         {log.type} {log.targetTopic ? `• Topic: ${log.targetTopic}` : ''}
                      </div>
                   </div>
                </div>
                <div className="text-right text-[10px] text-slate-600 font-mono">
                   {log.createdAt?.toDate().toLocaleString() || 'Syncing...'}
                </div>
             </div>
          ))}
          {logs.length === 0 && <div className="text-center py-20 text-slate-600 italic text-xs font-mono">No active interventions logged today.</div>}
       </div>
    </div>
  );
}
