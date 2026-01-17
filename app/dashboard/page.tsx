'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { collection, getDocs, doc, setDoc } from 'firebase/firestore';
import { calculateMetrics, calculateCohortMetrics, type StudentMetrics } from '@/lib/metrics';
import { BarChart3, Users, AlertTriangle, TrendingUp, TrendingDown, LogOut, RefreshCw } from 'lucide-react';

// Student IDs from Math Academy
const STUDENT_IDS = [
  '22710', '29509', '29437', '29441', '29442', '29494', '20848', '10866', '21931', '22729',
  '21936', '21949', '21958', '30668', '30679', '21799', '21833', '21971', '21972', '21961',
  '21962', '21947', '22237', '17191', '17330', '18215', '22260', '22177', '21921', '21856',
  '21844', '24293', '22195', '22162', '22267', '22196', '22122', '22154', '22126', '22200',
  '21929', '22038', '22043', '22044', '26605', '22318', '25677', '29038', '5436', '22893',
  '22733', '22732', '29035', '17331', '22740', '22731', '22730'
];

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<StudentMetrics[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<StudentMetrics[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [cohortMetrics, setCohortMetrics] = useState<any>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  // Auth check
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
        loadStudentData();
      } else {
        router.push('/');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  // Load student data from Firestore
  const loadStudentData = async () => {
    try {
      const studentsCol = collection(db, 'students');
      const snapshot = await getDocs(studentsCol);
      
      if (snapshot.empty) {
        // First time - fetch from API
        await refreshData();
      } else {
        const data = snapshot.docs.map(doc => doc.data() as StudentMetrics);
        setStudents(data);
        setFilteredStudents(data);
        
        const cohort = calculateCohortMetrics(data);
        setCohortMetrics(cohort);
        
        // Get last update time
        const lastDoc = snapshot.docs.find(d => d.id === 'lastUpdate');
        if (lastDoc) {
          setLastUpdate(new Date(lastDoc.data().timestamp));
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  // Refresh data from Math Academy API
  const refreshData = async () => {
    setRefreshing(true);
    try {
      const response = await fetch('/api/update-students', {
        method: 'POST',
      });
      
      if (response.ok) {
        const data = await response.json();
        setStudents(data.students);
        setFilteredStudents(data.students);
        setCohortMetrics(data.cohortMetrics);
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Filter students
  useEffect(() => {
    let filtered = students;

    // Status filter
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(s => s.status === statusFilter);
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(s => 
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.id.toString().includes(searchTerm)
      );
    }

    setFilteredStudents(filtered);
  }, [students, statusFilter, searchTerm]);

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-alpha-gold text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex">
      {/* Sidebar */}
      <div className="w-16 bg-[#111111] border-r border-[#1a1a1a] flex flex-col items-center py-5">
        <div className="w-10 h-10 flex items-center justify-center text-alpha-gold text-2xl mb-6">
          🦅
        </div>
        <div className="flex-1 flex flex-col gap-4">
          <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-alpha-blue text-alpha-gold cursor-pointer">
            <BarChart3 size={20} />
          </div>
          <div className="w-10 h-10 flex items-center justify-center rounded-lg text-gray-500 hover:bg-[#1a1a1a] cursor-pointer">
            <Users size={20} />
          </div>
        </div>
        <div 
          className="w-10 h-10 flex items-center justify-center rounded-lg text-gray-500 hover:bg-[#1a1a1a] cursor-pointer"
          onClick={handleLogout}
          title="Logout"
        >
          <LogOut size={20} />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-[#0f0f0f] border-b border-[#1a1a1a] px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-lg font-medium text-white">Dashboard</h1>
            <p className="text-xs text-gray-500">Senior Section - Math Academy</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-xs text-gray-500">
              {lastUpdate && `Last update: ${lastUpdate.toLocaleTimeString()}`}
            </div>
            <button
              onClick={refreshData}
              disabled={refreshing}
              className="px-4 py-2 bg-alpha-blue text-alpha-gold rounded-lg hover:bg-alpha-blue-light transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
              {refreshing ? 'Updating...' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-5 gap-4 p-8 pb-4">
          <MetricCard
            title="Total Students"
            value={cohortMetrics?.total || 0}
            icon={<Users size={20} />}
          />
          <MetricCard
            title="🔴 At Risk"
            value={cohortMetrics?.atRisk || 0}
            trend="negative"
          />
          <MetricCard
            title="🟠 Spinning"
            value={cohortMetrics?.spinning || 0}
            trend="neutral"
          />
          <MetricCard
            title="⚫ Inactive"
            value={cohortMetrics?.inactive || 0}
            trend="negative"
          />
          <MetricCard
            title="Avg Progress"
            value={`${cohortMetrics?.avgProgress || 0}%`}
            icon={<TrendingUp size={20} />}
          />
        </div>

        {/* Main Content Grid */}
        <div className="flex-1 grid grid-cols-[1fr_350px] gap-0">
          {/* Left Panel - Table */}
          <div className="p-8 pt-0 overflow-auto">
            {/* Controls */}
            <div className="flex gap-4 mb-4">
              <input
                type="text"
                placeholder="🔍 Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 px-4 py-2 bg-[#111111] border border-[#1a1a1a] rounded-lg text-white text-sm focus:outline-none focus:border-alpha-blue"
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 bg-[#111111] border border-[#1a1a1a] rounded-lg text-white text-sm focus:outline-none focus:border-alpha-blue"
              >
                <option value="ALL">All Status</option>
                <option value="AT_RISK">At Risk</option>
                <option value="SPINNING">Spinning</option>
                <option value="PROGRESSING">Progressing</option>
                <option value="INACTIVE">Inactive</option>
                <option value="COLD_START">Cold Start</option>
              </select>
            </div>

            {/* Table */}
            <div className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-[#111111] border-b border-[#1a1a1a]">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">ID</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Velocity</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Progress</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">XP Week</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Stuck</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((student) => (
                    <tr
                      key={student.id}
                      className="border-b border-[#1a1a1a] hover:bg-[#111111] cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-4 text-sm text-alpha-gold font-medium">{student.id}</td>
                      <td className="px-4 py-4 text-sm text-gray-300">{student.name}</td>
                      <td className="px-4 py-4">
                        <StatusBadge status={student.status} />
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-300">{student.velocityScore}%</td>
                      <td className="px-4 py-4 text-sm text-gray-300">{student.progress}%</td>
                      <td className="px-4 py-4 text-sm text-gray-300">{student.xpWeek}</td>
                      <td className="px-4 py-4 text-sm">
                        <span className={student.stuckScore > 70 ? 'text-red-500 font-semibold' : 'text-gray-300'}>
                          {student.stuckScore}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="text-xs text-gray-500 mt-4">
              Showing {filteredStudents.length} of {students.length} students
            </p>
          </div>

          {/* Right Panel */}
          <div className="bg-[#0f0f0f] border-l border-[#1a1a1a] p-6 overflow-auto">
            <div className="mb-8">
              <h3 className="text-xs font-semibold text-alpha-gold uppercase tracking-wide mb-4">
                Status Distribution
              </h3>
              <div className="space-y-3">
                <StatusBar label="Progressing" count={cohortMetrics?.progressing || 0} color="#3366ff" />
                <StatusBar label="Inactive" count={cohortMetrics?.inactive || 0} color="#999999" />
                <StatusBar label="At Risk" count={cohortMetrics?.atRisk || 0} color="#ff4444" />
                <StatusBar label="Spinning" count={cohortMetrics?.spinning || 0} color="#ff8800" />
                <StatusBar label="Cold Start" count={cohortMetrics?.coldStart || 0} color="#00aaff" />
              </div>
            </div>

            <div className="mb-8">
              <h3 className="text-xs font-semibold text-alpha-gold uppercase tracking-wide mb-4">
                🚨 Alerts
              </h3>
              <div className="space-y-2">
                {students
                  .filter(s => s.alerts.length > 0)
                  .slice(0, 5)
                  .map(s => (
                    <div key={s.id} className="bg-[#111111] border border-[#1a1a1a] rounded-lg p-3">
                      <div className="text-sm font-medium text-white mb-1">{s.name}</div>
                      <div className="text-xs text-gray-400">{s.alerts[0]}</div>
                    </div>
                  ))}
              </div>
            </div>

            <div>
              <h3 className="text-xs font-semibold text-alpha-gold uppercase tracking-wide mb-4">
                Pattern Recognition
              </h3>
              <div className="bg-[#111111] border border-[#1a1a1a] rounded-lg p-4 text-xs text-gray-400 leading-relaxed">
                <div className="mb-3">
                  <div className="text-alpha-gold font-semibold mb-1">BRUTE FORCE (FAST FAILS)</div>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Muchas preguntas</li>
                    <li>Baja accuracy</li>
                    <li>Progreso lento</li>
                  </ul>
                </div>
                <div>
                  <div className="text-alpha-gold font-semibold mb-1">CONTENT GAP</div>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Tiempo alto</li>
                    <li>Progreso bajo</li>
                    <li>Necesita revisión</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper Components
function MetricCard({ title, value, icon, trend }: any) {
  return (
    <div className="bg-gradient-to-br from-alpha-blue to-[#1a3a4a] border border-alpha-blue-light rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs text-gray-400 uppercase font-semibold">{title}</h3>
        {icon && <div className="text-alpha-gold">{icon}</div>}
      </div>
      <div className="text-2xl font-bold text-alpha-gold">{value}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const configs: Record<string, { label: string; bg: string; text: string; border: string }> = {
    AT_RISK: { label: 'AT RISK', bg: 'rgba(255, 68, 68, 0.15)', text: '#ff4444', border: 'rgba(255, 68, 68, 0.3)' },
    SPINNING: { label: 'SPINNING', bg: 'rgba(255, 136, 0, 0.15)', text: '#ff8800', border: 'rgba(255, 136, 0, 0.3)' },
    PROGRESSING: { label: 'PROGRESSING', bg: 'rgba(51, 102, 255, 0.15)', text: '#3366ff', border: 'rgba(51, 102, 255, 0.3)' },
    INACTIVE: { label: 'INACTIVE', bg: 'rgba(102, 102, 102, 0.15)', text: '#999', border: 'rgba(102, 102, 102, 0.3)' },
    COLD_START: { label: 'COLD START', bg: 'rgba(0, 170, 255, 0.15)', text: '#00aaff', border: 'rgba(0, 170, 255, 0.3)' },
  };

  const config = configs[status] || configs.INACTIVE;

  return (
    <span
      className="px-2 py-1 rounded text-xs font-semibold uppercase tracking-wide"
      style={{
        backgroundColor: config.bg,
        color: config.text,
        border: `1px solid ${config.border}`,
      }}
    >
      {config.label}
    </span>
  );
}

function StatusBar({ label, count, color }: any) {
  const total = 57; // Adjust based on actual total
  const percentage = (count / total) * 100;

  return (
    <div className="flex items-center gap-3">
      <div className="w-1 h-8 rounded-full" style={{ backgroundColor: color }} />
      <div className="flex-1">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-gray-400">{label}</span>
          <span className="text-white font-semibold">{count}</span>
        </div>
        <div className="h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden">
          <div
            className="h-full transition-all duration-300"
            style={{ width: `${percentage}%`, backgroundColor: color }}
          />
        </div>
      </div>
    </div>
  );
}
