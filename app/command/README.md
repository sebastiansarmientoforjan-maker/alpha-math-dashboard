# ALPHA MATH COMMAND v7.0

**Single Pane of Glass for 1,600+ Students**

Command v7 is a next-generation Air Traffic Control (ATC) interface for real-time student monitoring and intervention management.

---

## Architecture

### 🎯 The Command Tower (`page.tsx`)

Main orchestration layer that assembles all zones:

- **Layout**: `h-screen w-screen overflow-hidden` with `#050505` (Vantablack) background
- **Header (60px)**: The Oracle, Campus Switcher, Statistics
- **Body**: Radar (left, flex-1) + Triage Queue (right, w-[350px])
- **Overlay**: Deep Dive Panel (slides from bottom)

### 📡 Zone A: The Radar (`components/command/RadarView.tsx`)

**Purpose**: Visual scatter plot of all 1,600 students by progress and velocity.

**Key Features**:
- X-axis: Course Progress (0-100%)
- Y-axis: Current Velocity (0-3.5% per week)
- **The Glide Path**: Ideal trajectory zone (0.8-1.5% per week)
- **Color Coding**:
  - Cyan (#66FCF1): Normal students
  - Red (#FF003C): Critical students (riskScore > 50 OR BLOCKED)
- **Animations**: Pulse effect for BLOCKED students (>120 min on concept)
- **Interaction**: Click student → Opens Deep Dive Panel

### 🚨 Zone B: Triage Queue (`components/command/TriageQueue.tsx`)

**Purpose**: Urgency-sorted list of students requiring attention.

**Key Features**:
- **STRICT ORDERING**: Sorted by `riskScore` DESCENDING (critical first)
- Shows top 15 students (configurable)
- Displays: Name, Time Stuck, Alert Reason, Metrics
- **Actions**:
  - **Summon** button: Logs to console `🚨 Dispatching Guide to [student.id]`
  - **Dispatch** button: Logs to console `📱 Dispatching Guide to [student.id]`
- **Interaction**: Click card → Opens Deep Dive Panel

### 📊 Zone C: Deep Dive Panel (`components/command/DeepDivePanel.tsx`)

**Purpose**: Modal panel with intervention effectiveness tracking.

**Key Features**:
- **Velocity Recovery Analysis**:
  - Shows `velocityBefore`, `velocityAfter` (24h later), and delta
  - Color-coded: GREEN if positive recovery, RED if negative/zero
- **Performance Sparkline**: Last 10 activity attempts
  - **VERTICAL DASHED LINE** marks intervention point
  - Recharts LineChart with ReferenceLine
- **Mastery Latencies**: Per-topic status (BLOCKED, HIGH_FRICTION, LOW_LATENCY)
- **Intervention History**: Last 3 interventions with success indicators
- **Typography**: JetBrains Mono (`font-mono`) for ALL numeric data
- **Animation**: Slide-up from bottom on open

---

## 🔮 The Oracle (Search System)

Terminal-style input in the header that filters both Radar and Triage Queue.

### Keyword Support:
- **"Critical"** → Filters `urgencyScore >= 60`
- **"Blocked"** → Filters students with BLOCKED mastery latency
- **"Red Shift"** → Filters RED_SHIFT velocity status
- **Name search** → Matches firstName, lastName, or full name

### Technical Implementation:
- Connected to `useCommandStore` → `oracleQuery` state
- `getFilteredStudents()` selector applies keyword logic
- Real-time filtering across all zones

---

## 🌍 Campus Switcher

Dropdown in header to filter by campus:
- **Options**: All Campuses, Austin, SF, Miami
- Connected to `setCampusFilter(campus)` in store
- Combines with Oracle filters

---

## State Management (`lib/command-store.ts`)

**Global Zustand Store** with:

### Core Data:
- `students: EnrichedStudent[]` - 1,600 students with computed metrics
- `loading: boolean` - Initial load state
- `error: string | null` - Error messages

### Filters:
- `oracleQuery: string` - The Oracle search query
- `campusFilter: string | null` - Campus filter (null = all)
- `selectedStudentId: string | null` - For Deep Dive Panel

### Actions:
- `loadData()` - Fetches students and computes Phase 1 metrics
- `setOracleQuery(query)` - Updates search filter
- `setCampusFilter(campus)` - Updates campus filter
- `setSelectedStudent(id)` - Opens/closes Deep Dive Panel
- `getFilteredStudents()` - Returns filtered student list

### Memoized Selectors:
- `useCriticalStudents()` - urgencyScore >= 60
- `useRedShiftStudents()` - RED_SHIFT velocity
- `useBlockedStudents()` - BLOCKED mastery latency
- `useFilteredStudents()` - Applies all filters

---

## Core Metrics Library (`lib/command-metrics.ts`)

### STRICT MODE Thresholds:

#### Mastery Latency:
- `< 30 minutes` → LOW_LATENCY
- `30-120 minutes` → HIGH_FRICTION
- `> 120 minutes` → **BLOCKED** (MUST TRIGGER)

#### Velocity (Doppler Effect):
- `currentRate < requiredRate * 0.8` → **RED_SHIFT** (MUST TRIGGER)
- `currentRate > requiredRate * 1.2` → BLUE_SHIFT
- Otherwise → ON_TRACK

#### Spin Detection:
- `accuracyGradient > 0 OR resourceAccess > 0` → PRODUCTIVE
- `accuracyGradient ≤ 0 AND resourceAccess = 0` → **UNPRODUCTIVE**
- Intervention required if attempts > 3

### Functions:
- `calculateMasteryLatency(student, topic)` - Returns MasteryLatency object
- `calculateVelocity(student, targetDate)` - Returns Velocity object
- `detectSpin(student, topic)` - Returns SpinDetection object
- `computeUrgencyScore(latency, velocity, spin)` - Returns 0-100 score

---

## Data Layer (`lib/api-mock.ts`)

**Mock Data Generation** for development:

### Scale:
- **1,600 students** simulated
- **10% critical injection** (160 students) with velocity < 0.8 OR latency > 120 min
- **20% intervention history** (320 students) with velocity recovery data

### Intervention Records:
- `velocityBefore: number` - Pre-intervention velocity
- `velocityAfter: number` - Post-intervention velocity (24h later)
- `successful: boolean` - Recovery > 20% threshold
- `dri: string` - DRI who executed intervention
- `level: string` - LEVEL_1_HINT | LEVEL_2_MESSAGE | LEVEL_3_PEER | LEVEL_4_RESCUE

---

## Design System

### Colors:
- **Vantablack**: `#050505` (Background)
- **Cyan Neon**: `#66FCF1` (Primary accent, normal students)
- **Red Neon**: `#FF003C` (Critical students, alerts)
- **Matrix Green**: `#05C46B` (Success, positive recovery)
- **Amber**: `#F79F1F` (Warnings, interventions)

### Typography:
- **UI Text**: Inter (`font-sans`)
- **Numeric Data**: JetBrains Mono (`font-mono`)
- **Headers**: `font-black uppercase tracking-ultra`

### Borders:
- **Panel separators**: `border-white/10`
- **Cards**: `border-slate-800`

---

## Event Flow

### 1. User clicks student on Radar:
```
RadarView → onStudentClick(student)
         → useCommandStore.setSelectedStudent(student.id)
         → DeepDivePanel renders with student data
```

### 2. User clicks student on Triage Queue:
```
TriageQueue → onStudentSelect(student)
            → useCommandStore.setSelectedStudent(student.id)
            → DeepDivePanel renders with student data
```

### 3. User types in The Oracle:
```
Input onChange → useCommandStore.setOracleQuery(query)
              → getFilteredStudents() re-executes
              → RadarView and TriageQueue re-render with filtered data
```

### 4. User changes Campus filter:
```
Dropdown onChange → useCommandStore.setCampusFilter(campus)
                 → getFilteredStudents() re-executes
                 → RadarView and TriageQueue re-render with filtered data
```

---

## Performance Optimizations

- **Memoization**: `useMemo` for filtered students, statistics, sparkline data
- **Zustand**: Global state without prop drilling
- **CSS Animations**: Hardware-accelerated pulse effects for BLOCKED students
- **Lazy rendering**: Only render visible students in Triage Queue (top 15)
- **ResponsiveContainer**: Recharts auto-sizing for Radar and Sparkline

---

## Keyboard Shortcuts (Future Enhancement)

- `m` → Open Mode Selector
- `/` → Focus The Oracle input
- `Escape` → Close Deep Dive Panel
- `1-6` → Switch view modes
- `c` → Clear filters

---

## Access

**URL**: `/command`

**From Dashboard**: Press `m` → Click "Command v7" card in Mode Selector

---

## Technical Stack

- **Framework**: Next.js 14 (App Router)
- **State Management**: Zustand
- **Charts**: Recharts
- **Styling**: Tailwind CSS
- **TypeScript**: Strict mode enabled
- **Date Utilities**: date-fns

---

## Future Enhancements (Post-v7)

- [ ] Real-time Firebase sync (replace mock data)
- [ ] Intervention dispatch integration (JITAI system)
- [ ] Velocity trend graphs (7-day history)
- [ ] Campus comparison analytics
- [ ] Export filtered student lists
- [ ] Customizable Triage Queue filters
- [ ] Keyboard navigation for Radar
- [ ] Multi-select students on Radar
- [ ] Push notifications for BLOCKED students
- [ ] Historical intervention ROI dashboard

---

**Status**: ✅ CHUNK 5 Complete - Ready for Production Testing

**Branch**: `v7-command-core`

**Last Updated**: 2026-02-04
