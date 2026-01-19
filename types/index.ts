// Core Data Models
export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  currentCourse: {
    name: string;
    grade: number;
    progress: number;
    xpRemaining: number;
  };
  schedule: {
    monGoal: number;
  };
  activity: StudentActivity;
  metrics: Metrics;
  lastUpdated: string;
}

export interface StudentActivity {
  xpAwarded: number;
  time: number;
  questions: number;
  questionsCorrect: number;
  numTasks: number;
  tasks: Task[];
  totals?: {
    timeEngaged: number;
    timeProductive: number;
    timeElapsed: number;
  };
}

export interface Task {
  id: string;
  type: 'Review' | 'Learning';
  topic: {
    name: string;
  };
  questions: number;
  questionsCorrect: number;
  completedLocal: string;
  analysis?: {
    timeEngaged: number;
  };
}

export interface Metrics {
  velocityScore: number;
  consistencyIndex: number;
  stuckScore: number;
  dropoutProbability: number;
  accuracyRate: number | null;
  efficiencyRatio: number;
  coldStartDays: number;
  momentumScore: number;
  timePerQuestion: number;
  contentGap: number;
  balanceScore: number;
  burnoutRisk: boolean;
  sessionQuality: number;
  focusIntegrity: number;
  nemesisTopic: string;
  reviewAccuracy: number;
  microStalls: number;
  archetype: 'Zombie' | 'Grinder' | 'Guesser' | 'Flow Master' | 'Neutral';
  riskStatus: 'Critical' | 'Attention' | 'On Track' | 'Dormant';
}

export interface Intervention {
  id: string;
  studentId: string;
  studentName: string;
  coachId?: string;
  coachName?: string;
  type: 'coaching' | 'remedial_task' | 'focus_check' | 'nemesis_intervention';
  targetTopic?: string;
  description?: string;
  createdBy: string;
  createdAt: string;
  updatedAt?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  notes?: string;
}

export interface Coach {
  id: string;
  name: string;
  email: string;
  specialties: string[];
  maxStudents: number;
  currentStudents: number;
  available: boolean;
}

export interface FilterState {
  search: string;
  course: string;
  archetype: string;
  riskStatus: string;
  hasNemesis: boolean;
}
