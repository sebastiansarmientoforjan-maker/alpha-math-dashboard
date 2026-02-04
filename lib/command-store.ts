// ============================================
// ALPHA MATH COMMAND v7.0 - GLOBAL STORE
// ============================================
// STRICT MODE: Zustand store for 1,600+ students with memoized selectors
// Part 2 (Scale) + Part 7.4 (Data Layer)

import { create } from 'zustand';
import { MathAcademyStudent, MasteryLatency, Velocity, SpinDetection } from '@/types/command';
import { fetchStudents } from './api-mock';
import {
  calculateMasteryLatency,
  calculateVelocity,
  detectSpin,
  computeUrgencyScore,
} from './command-metrics';

// ============================================
// ENRICHED STUDENT TYPE
// ============================================

/**
 * Student with computed Command v7 metrics
 * Includes real-time calculations from Phase 1
 */
export interface EnrichedStudent extends MathAcademyStudent {
  // Computed metrics (calculated on load)
  masteryLatencies: Record<string, MasteryLatency>; // Per topic
  velocity: Velocity; // Doppler effect analysis
  spinDetections: Record<string, SpinDetection>; // Per topic
  urgencyScore: number; // 0-100 for triage queue
  lastCalculated: Date; // When metrics were computed
}

// ============================================
// STORE STATE
// ============================================

interface CommandStoreState {
  // Data
  students: EnrichedStudent[];
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;

  // Filters (The Oracle + Campus Switcher)
  oracleQuery: string; // Search query from The Oracle input
  campusFilter: string | null; // Campus filter (null = all campuses)
  selectedStudentId: string | null; // For DeepDivePanel

  // Actions
  loadData: () => Promise<void>;
  refreshMetrics: () => void;
  clearData: () => void;

  // Filter actions
  setOracleQuery: (query: string) => void;
  setCampusFilter: (campus: string | null) => void;
  setSelectedStudent: (studentId: string | null) => void;

  // Computed/Derived state helpers
  getStudentById: (id: string) => EnrichedStudent | undefined;
  getStudentsByCampus: (campus: string) => EnrichedStudent[];
  getCriticalStudents: () => EnrichedStudent[];
  getStudentsByUrgency: (minScore: number) => EnrichedStudent[];
  getFilteredStudents: () => EnrichedStudent[]; // Apply all filters
}

// ============================================
// STORE IMPLEMENTATION
// ============================================

/**
 * Global Command v7 store using Zustand
 * Handles 1,600+ students with memoized selectors
 */
export const useCommandStore = create<CommandStoreState>((set, get) => ({
  // Initial state
  students: [],
  loading: false,
  error: null,
  lastUpdated: null,

  // Filters
  oracleQuery: '',
  campusFilter: null,
  selectedStudentId: null,

  /**
   * Load students from API and compute all Phase 1 metrics
   * CRITICAL: This executes calculateMasteryLatency, calculateVelocity, detectSpin
   */
  loadData: async () => {
    console.log('🔄 Loading Command v7 data...');
    set({ loading: true, error: null });

    try {
      // Fetch raw students from API mock
      const rawStudents = await fetchStudents();

      // Target completion date (e.g., end of semester)
      const targetDate = new Date();
      targetDate.setMonth(targetDate.getMonth() + 3); // 3 months from now

      // Enrich each student with Phase 1 metrics
      const enrichedStudents: EnrichedStudent[] = rawStudents.map(student => {
        // Extract unique topics from activity logs
        const topics = Array.from(new Set(student.activity.map(a => a.topic)));

        // Calculate mastery latency for each topic
        const masteryLatencies: Record<string, MasteryLatency> = {};
        topics.forEach(topic => {
          masteryLatencies[topic] = calculateMasteryLatency(student, topic);
        });

        // Calculate velocity (Doppler effect)
        const velocity = calculateVelocity(student, targetDate);

        // Detect spin for each topic
        const spinDetections: Record<string, SpinDetection> = {};
        topics.forEach(topic => {
          spinDetections[topic] = detectSpin(student, topic);
        });

        // Find most critical mastery latency
        const mostCriticalLatency = Object.values(masteryLatencies).reduce(
          (worst, current) => {
            if (current.status === 'BLOCKED') return current;
            if (worst.status === 'BLOCKED') return worst;
            if (current.status === 'HIGH_FRICTION' && worst.status === 'LOW_LATENCY')
              return current;
            return worst;
          },
          { status: 'LOW_LATENCY' } as MasteryLatency
        );

        // Find most critical spin
        const mostCriticalSpin = Object.values(spinDetections).find(
          s => s.interventionRequired
        ) || { interventionRequired: false, spinType: 'PRODUCTIVE' } as SpinDetection;

        // Compute urgency score for triage queue
        const urgencyScore = computeUrgencyScore(
          mostCriticalLatency,
          velocity,
          mostCriticalSpin
        );

        return {
          ...student,
          masteryLatencies,
          velocity,
          spinDetections,
          urgencyScore,
          lastCalculated: new Date(),
        };
      });

      // Sort by urgency (highest first for triage queue)
      enrichedStudents.sort((a, b) => b.urgencyScore - a.urgencyScore);

      console.log('✅ Loaded and enriched', enrichedStudents.length, 'students');
      console.log('   - Critical students:', enrichedStudents.filter(s => s.urgencyScore >= 60).length);
      console.log('   - RED_SHIFT velocity:', enrichedStudents.filter(s => s.velocity.status === 'RED_SHIFT').length);
      console.log('   - BLOCKED latency:', enrichedStudents.filter(s =>
        Object.values(s.masteryLatencies).some(m => m.status === 'BLOCKED')
      ).length);

      set({
        students: enrichedStudents,
        loading: false,
        lastUpdated: new Date(),
      });
    } catch (error) {
      console.error('❌ Failed to load data:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to load data',
        loading: false,
      });
    }
  },

  /**
   * Refresh metrics for existing students
   * Useful for real-time updates without full reload
   */
  refreshMetrics: () => {
    const { students } = get();
    console.log('🔄 Refreshing metrics for', students.length, 'students');

    // Re-calculate metrics (same logic as loadData but without API call)
    const targetDate = new Date();
    targetDate.setMonth(targetDate.getMonth() + 3);

    const refreshed = students.map(student => {
      const topics = Array.from(new Set(student.activity.map(a => a.topic)));

      const masteryLatencies: Record<string, MasteryLatency> = {};
      topics.forEach(topic => {
        masteryLatencies[topic] = calculateMasteryLatency(student, topic);
      });

      const velocity = calculateVelocity(student, targetDate);

      const spinDetections: Record<string, SpinDetection> = {};
      topics.forEach(topic => {
        spinDetections[topic] = detectSpin(student, topic);
      });

      const mostCriticalLatency = Object.values(masteryLatencies)[0] || {
        status: 'LOW_LATENCY',
      } as MasteryLatency;
      const mostCriticalSpin = Object.values(spinDetections).find(
        s => s.interventionRequired
      ) || { interventionRequired: false } as SpinDetection;

      const urgencyScore = computeUrgencyScore(
        mostCriticalLatency,
        velocity,
        mostCriticalSpin
      );

      return {
        ...student,
        masteryLatencies,
        velocity,
        spinDetections,
        urgencyScore,
        lastCalculated: new Date(),
      };
    });

    refreshed.sort((a, b) => b.urgencyScore - a.urgencyScore);

    set({ students: refreshed, lastUpdated: new Date() });
  },

  /**
   * Clear all data
   */
  clearData: () => {
    set({ students: [], loading: false, error: null, lastUpdated: null });
  },

  /**
   * Get student by ID
   */
  getStudentById: (id: string) => {
    return get().students.find(s => s.id === id);
  },

  /**
   * Get students by campus (memoization handled by Zustand)
   */
  getStudentsByCampus: (campus: string) => {
    return get().students.filter(s => s.campus === campus);
  },

  /**
   * Get critical students (urgency >= 60)
   * MEMOIZED SELECTOR for instant filtering
   */
  getCriticalStudents: () => {
    return get().students.filter(s => s.urgencyScore >= 60);
  },

  /**
   * Get students by minimum urgency score
   */
  getStudentsByUrgency: (minScore: number) => {
    return get().students.filter(s => s.urgencyScore >= minScore);
  },

  /**
   * Set Oracle search query
   * Supports: "Critical" → urgencyScore >= 60, or name search
   */
  setOracleQuery: (query: string) => {
    set({ oracleQuery: query });
  },

  /**
   * Set campus filter
   * null = show all campuses
   */
  setCampusFilter: (campus: string | null) => {
    set({ campusFilter: campus });
  },

  /**
   * Set selected student for DeepDivePanel
   */
  setSelectedStudent: (studentId: string | null) => {
    set({ selectedStudentId: studentId });
  },

  /**
   * Get filtered students based on Oracle query and campus filter
   * STRICT MODE: "Critical" → urgencyScore >= 60
   */
  getFilteredStudents: () => {
    const { students, oracleQuery, campusFilter } = get();
    let filtered = students;

    // Apply campus filter
    if (campusFilter) {
      filtered = filtered.filter(s => s.campus === campusFilter);
    }

    // Apply Oracle query
    if (oracleQuery.trim()) {
      const query = oracleQuery.toLowerCase().trim();

      // Special keyword: "Critical" → urgencyScore >= 60
      if (query === 'critical') {
        filtered = filtered.filter(s => s.urgencyScore >= 60);
      }
      // Special keyword: "blocked" → BLOCKED mastery
      else if (query === 'blocked') {
        filtered = filtered.filter(s =>
          Object.values(s.masteryLatencies).some(m => m.status === 'BLOCKED')
        );
      }
      // Special keyword: "red shift" → RED_SHIFT velocity
      else if (query === 'red shift' || query === 'redshift') {
        filtered = filtered.filter(s => s.velocity.status === 'RED_SHIFT');
      }
      // Name search (firstName or lastName)
      else {
        filtered = filtered.filter(s =>
          s.firstName.toLowerCase().includes(query) ||
          s.lastName.toLowerCase().includes(query) ||
          `${s.firstName} ${s.lastName}`.toLowerCase().includes(query)
        );
      }
    }

    return filtered;
  },
}));

// ============================================
// MEMOIZED SELECTORS (Optimized for performance)
// ============================================

/**
 * Hook: Get critical students (urgency >= 60)
 * Memoized for instant access without re-filtering
 */
export function useCriticalStudents(): EnrichedStudent[] {
  return useCommandStore(state => state.students.filter(s => s.urgencyScore >= 60));
}

/**
 * Hook: Get students by campus
 */
export function useStudentsByCampus(campus: string): EnrichedStudent[] {
  return useCommandStore(state => state.students.filter(s => s.campus === campus));
}

/**
 * Hook: Get RED_SHIFT students (behind schedule)
 */
export function useRedShiftStudents(): EnrichedStudent[] {
  return useCommandStore(state =>
    state.students.filter(s => s.velocity.status === 'RED_SHIFT')
  );
}

/**
 * Hook: Get BLOCKED students (>120min on concept)
 */
export function useBlockedStudents(): EnrichedStudent[] {
  return useCommandStore(state =>
    state.students.filter(s =>
      Object.values(s.masteryLatencies).some(m => m.status === 'BLOCKED')
    )
  );
}

/**
 * Hook: Get students with intervention history
 */
export function useStudentsWithInterventions(): EnrichedStudent[] {
  return useCommandStore(state =>
    state.students.filter(s => s.interventionHistory.length > 0)
  );
}

/**
 * Hook: Get top N urgent students for triage queue
 */
export function useTriageQueue(limit: number = 10): EnrichedStudent[] {
  return useCommandStore(state => state.students.slice(0, limit));
}

/**
 * Hook: Get store statistics
 */
export function useCommandStatistics() {
  return useCommandStore(state => {
    const students = state.students;
    const critical = students.filter(s => s.urgencyScore >= 60).length;
    const redShift = students.filter(s => s.velocity.status === 'RED_SHIFT').length;
    const blocked = students.filter(s =>
      Object.values(s.masteryLatencies).some(m => m.status === 'BLOCKED')
    ).length;
    const withInterventions = students.filter(s => s.interventionHistory.length > 0).length;

    return {
      total: students.length,
      critical,
      redShift,
      blocked,
      withInterventions,
      loading: state.loading,
      lastUpdated: state.lastUpdated,
    };
  });
}

/**
 * Hook: Get filtered students (applies Oracle query + campus filter)
 * MEMOIZED for performance
 */
export function useFilteredStudents(): EnrichedStudent[] {
  return useCommandStore(state => state.getFilteredStudents());
}
