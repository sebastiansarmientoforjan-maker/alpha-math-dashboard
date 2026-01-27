'use client';

import { useState, useEffect, useRef } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, limit, onSnapshot, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { Alert } from '@/types';

interface AlertsDropdownProps {
  onStudentClick: (studentId: string) => void;
}

export default function AlertsDropdown({ onStudentClick }: AlertsDropdownProps) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Escuchar alertas pendientes en tiempo real
  useEffect(() => {
    const q = query(
      collection(db, 'alerts'),
      where('acknowledged', '==', false),
      orderBy('createdAt', 'desc'),
      limit(20)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const alertsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as Alert[];
      setAlerts(alertsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Cerrar dropdown al hacer click afuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Marcar alerta como acknowledged
  const handleAlertClick = async (alert: Alert) => {
    if (!alert.id) return;

    try {
      await updateDoc(doc(db, 'alerts', alert.id), {
        acknowledged: true,
        acknowledgedAt: serverTimestamp(),
        status: 'acknowledged'
      });
      
      onStudentClick(alert.studentId);
      setIsOpen(false);
    } catch (error) {
      console.error('Error acknowledging alert:', error);
    }
  };

  const pendingCount = alerts.length;
  const criticalCount = alerts.filter(a => a.newTier === 'RED').length;

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'RED': return 'text-red-400 bg-red-500/20';
      case 'YELLOW': return 'text-amber-400 bg-amber-500/20';
      case 'GREEN': return 'text-emerald-400 bg-emerald-500/20';
      default: return 'text-slate-400 bg-slate-500/20';
    }
  };

  const getDirectionIcon = (direction: string) => {
    return direction === 'worsened' ? '↓' : '↑';
  };

  const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button with Badge */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 rounded-xl transition-all ${
          isOpen 
            ? 'bg-indigo-600 text-white' 
            : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-indigo-500'
        }`}
      >
        <span className="text-lg">🔔</span>
        
        {/* Badge */}
        {pendingCount > 0 && (
          <span className={`absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center text-[9px] font-black rounded-full ${
            criticalCount > 0 
              ? 'bg-red-500 text-white animate-pulse' 
              : 'bg-amber-500 text-black'
          }`}>
            {pendingCount > 99 ? '99+' : pendingCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-[#0a0a0a] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="p-3 border-b border-slate-800 bg-slate-900/50">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-black text-white uppercase tracking-widest">
                Tier Alerts
              </h3>
              <span className="text-[9px] text-slate-500 font-mono">
                {pendingCount} pending
              </span>
            </div>
            {criticalCount > 0 && (
              <p className="text-[9px] text-red-400 mt-1">
                ⚠️ {criticalCount} student{criticalCount > 1 ? 's' : ''} dropped to RED
              </p>
            )}
          </div>

          {/* Alerts List */}
          <div className="max-h-80 overflow-y-auto custom-scrollbar">
            {loading ? (
              <div className="p-4 text-center text-slate-500 text-xs">
                Loading...
              </div>
            ) : alerts.length === 0 ? (
              <div className="p-6 text-center">
                <span className="text-2xl mb-2 block">✅</span>
                <p className="text-slate-500 text-xs">No pending alerts</p>
              </div>
            ) : (
              alerts.map((alert) => (
                <div
                  key={alert.id}
                  onClick={() => handleAlertClick(alert)}
                  className="p-3 border-b border-slate-800/50 hover:bg-slate-900/50 cursor-pointer transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white truncate">
                        {alert.studentName}
                      </p>
                      <p className="text-[9px] text-slate-500 truncate">
                        {alert.studentCourse}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-black ${getTierColor(alert.previousTier)}`}>
                        {alert.previousTier}
                      </span>
                      <span className={`text-xs ${alert.direction === 'worsened' ? 'text-red-400' : 'text-emerald-400'}`}>
                        {getDirectionIcon(alert.direction)}
                      </span>
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-black ${getTierColor(alert.newTier)}`}>
                        {alert.newTier}
                      </span>
                    </div>
                  </div>
                  
                  {/* Metrics Preview */}
                  <div className="flex gap-2 mt-2 text-[8px] font-mono text-slate-600">
                    <span>RSR: {(alert.metricsSnapshot.rsr * 100).toFixed(0)}%</span>
                    <span>•</span>
                    <span>Risk: {alert.metricsSnapshot.riskScore}</span>
                    <span>•</span>
                    <span>{formatTimeAgo(alert.createdAt)}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {alerts.length > 0 && (
            <div className="p-2 border-t border-slate-800 bg-slate-900/30">
              <p className="text-[8px] text-slate-600 text-center">
                Click alert to view student & mark as read
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
