'use client';

import { useState, useEffect, useRef } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, onSnapshot, updateDoc, doc } from 'firebase/firestore';

interface FollowUpRemindersProps {
  onStudentClick: (studentId: string) => void;
}

export default function FollowUpReminders({ onStudentClick }: FollowUpRemindersProps) {
  const [reminders, setReminders] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Escuchar recordatorios pendientes
  useEffect(() => {
    // Nota: Firestore requiere un índice compuesto para consultas complejas.
    // Usaremos una consulta simple y filtraremos en el cliente para evitar bloqueos por índices.
    const q = query(
      collection(db, 'interventions'),
      where('followUpStatus', '==', 'pending')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        followUpDate: doc.data().followUpDate?.toDate ? doc.data().followUpDate.toDate() : new Date(doc.data().followUpDate)
      }));
      
      // Ordenar por fecha (más urgente primero)
      const sorted = data.sort((a: any, b: any) => a.followUpDate - b.followUpDate);
      setReminders(sorted);
    });

    return () => unsubscribe();
  }, []);

  // Click outside para cerrar
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkComplete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await updateDoc(doc(db, 'interventions', id), {
        followUpStatus: 'completed',
        followUpCompletedAt: new Date()
      });
    } catch (err) {
      console.error("Error updating reminder:", err);
    }
  };

  const getDayDiff = (date: Date) => {
    const today = new Date();
    today.setHours(0,0,0,0);
    const target = new Date(date);
    target.setHours(0,0,0,0);
    const diffTime = target.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Filtrar los que son "Para hoy o antes" (Vencidos)
  const dueCount = reminders.filter((r: any) => getDayDiff(r.followUpDate) <= 0).length;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 rounded-xl transition-all ${
          isOpen 
            ? 'bg-amber-600 text-white' 
            : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-amber-500'
        }`}
        title="Follow-up Reminders"
      >
        <span className="text-lg">⏰</span>
        {reminders.length > 0 && (
          <span className={`absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center text-[9px] font-black rounded-full ${
            dueCount > 0 
              ? 'bg-red-500 text-white animate-pulse' 
              : 'bg-slate-700 text-slate-300'
          }`}>
            {reminders.length}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-[#0a0a0a] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
          <div className="p-3 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
            <h3 className="text-xs font-black text-white uppercase tracking-widest">Follow-ups</h3>
            <span className="text-[9px] text-slate-500 font-mono">{reminders.length} pending</span>
          </div>

          <div className="max-h-80 overflow-y-auto custom-scrollbar">
            {reminders.length === 0 ? (
              <div className="p-6 text-center text-slate-500 text-xs">No pending follow-ups 🎉</div>
            ) : (
              reminders.map((rem: any) => {
                const days = getDayDiff(rem.followUpDate);
                const isOverdue = days < 0;
                const isToday = days === 0;
                
                return (
                  <div 
                    key={rem.id}
                    onClick={() => { onStudentClick(rem.studentId); setIsOpen(false); }}
                    className="p-3 border-b border-slate-800/50 hover:bg-slate-900/50 cursor-pointer transition-colors group"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                            isOverdue ? 'bg-red-500/20 text-red-400' :
                            isToday ? 'bg-amber-500/20 text-amber-400' :
                            'bg-emerald-500/20 text-emerald-400'
                          }`}>
                            {isOverdue ? `${Math.abs(days)}d Overdue` : isToday ? 'Today' : `in ${days}d`}
                          </span>
                          <span className="text-[8px] text-slate-500">{new Date(rem.followUpDate).toLocaleDateString()}</span>
                        </div>
                        <p className="text-sm font-bold text-white truncate">{rem.studentName}</p>
                        <p className="text-[10px] text-slate-400 truncate">Obj: {rem.objective}</p>
                      </div>
                      
                      <button
                        onClick={(e) => handleMarkComplete(e, rem.id)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-emerald-600 text-slate-400 hover:text-white transition-colors"
                        title="Mark as Done"
                      >
                        ✓
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
