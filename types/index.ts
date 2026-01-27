================================================
FILE: README.md
================================================
# 🦅 Alpha Math Dashboard - DRI Command Center

Real-time analytics dashboard para monitoreo de 1,613 estudiantes de Math Academy basado en **Alpha School Protocol**.

## 🎯 Estándares Alpha Implementados

### **Velocity Score**
- **Estándar**: 125 XP/semana (25 XP/día × 5 días)
- **Fuente**: Technical Calculation Protocol - Mastery Density formula
- **100% velocity** = 125 XP completados en la semana

### **DER (Debt Exposure Ratio)**
- **Umbral Crítico**: > 20% (Alpha Protocol)
- **Umbral Severo**: > 40%
- **Definición**: Proporción de topics K-8 maestreados durante High School

### **PDI (Precision Decay Index)**
- **Umbral Crítico**: > 1.5 (Alpha Protocol)
- **Umbral Severo**: > 2.0
- **Definición**: (Errores finales + 1) / (Errores iniciales + 1)
- **Interpretación**: PDI > 1.5 sugiere "Short-Burst Specialist"

### **KSI (Knowledge Stability Index)**
- **Umbral Crítico**: < 50%
- **Umbral Bajo**: < 60%
- **Fórmula**: 100 - sqrt(variance_of_accuracy)

### **RSR (Recent Success Rate)**
- **Threshold**: > 80% accuracy
- **Window**: Últimas 10 tasks
- **Nota**: Anteriormente llamado "LMP" pero es realmente una tasa de éxito reciente

## 📊 Features Implementadas

### **TIER 1 Indicators**
- ✅ Velocity Score (basado en 125 XP/semana)
- ✅ Recent Success Rate (RSR)
- ✅ Knowledge Stability Index (KSI)
- ✅ Accuracy Rate
- ✅ Focus Integrity

### **DRI Metrics**
- ✅ Debt Exposure Ratio (DER) con threshold 20%
- ✅ Precision Decay Index (PDI) normalizado por dificultad
- ✅ Investment ROI (iROI) como proxy
- ✅ Risk Scoring System ponderado
- ✅ Detección de inactividad (>7 días)

### **Dashboard Components**
- ✅ Vista TRIAGE (Red/Yellow/Green zones)
- ✅ Vista MATRIX (KeenKT con clustering + filtros)
- ✅ Vista HEATMAP (Top 15 critical topics con priority bars)
- ✅ Vista LOG (Intervention history)
- ✅ Student Modal con tabs (Overview + History)
- ✅ Auto-sync recursivo con ETA predictivo
- ✅ Pause/Resume sync capability

### **UX/UI Optimizations (v5.1)**
- ✅ Stats cards reducidas de 6 → 4
- ✅ Tooltips explicativos en stats cards
- ✅ Trends indicators (+/- %)
- ✅ Tooltip compacto en Matrix (grid 2x2)
- ✅ Priority bars visuales en Heatmap
- ✅ TOP 3 badges en Heatmap
- ✅ Filtros avanzados en Matrix (Course, Tier, DER)
- ✅ ETA predictivo en sync
- ✅ Weekly activity pattern chart
- ✅ Memoized components para performance
- ✅ Custom scrollbars

## 🚀 Quick Start
```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus credenciales de Firebase

# 3. Correr localmente
npm run dev

# 4. Deploy a Vercel
vercel --prod
```

## 📁 Arquitectura de Archivos
```
├── lib/
│   ├── dri-config.ts         # ⭐ Configuración centralizada
│   ├── dri-calculus.ts       # ⭐ Motor DRI
│   ├── metrics.ts            # ⭐ Métricas TIER 1
│   ├── grade-maps.ts         # ⭐ Mapeo topics
│   ├── color-utils.ts        # Utilities + clustering
│   ├── firebase.ts           # Firebase client
│   └── mathAcademyAPI.ts     # Math Academy wrapper
│
├── app/
│   ├── page.tsx              # ⭐ Dashboard principal
│   ├── dashboard/page.tsx    # Dashboard simple
│   ├── globals.css           # ⭐ Estilos globales
│   └── api/
│       └── update-students/
│           └── route.ts      # ⭐ API sync
│
├── components/
│   ├── StudentModal.tsx      # ⭐ Modal con tabs
│   └── LoadingSkeleton.tsx   # Skeletons
│
└── types/
    └── index.ts              # ⭐ TypeScript types
```

## 🔧 Configuración Avanzada

### **DRI_CONFIG** (`lib/dri-config.ts`)
```typescript
export const DRI_CONFIG = {
  ALPHA_WEEKLY_STANDARD: 125,
  DER_CRITICAL_THRESHOLD: 20,
  PDI_CRITICAL_THRESHOLD: 1.5,
  KSI_LOW_THRESHOLD: 60,
  RISK_SCORING_ENABLED: true,
  // ... más configuraciones
}
```

### **Risk Scoring System**

Ponderación:
1. Debt Exposure (30%)
2. Velocity (25%)
3. Precision Decay (20%)
4. Stability (15%)
5. Stall Status (10%)

Clasificación:
- Risk Score ≥ 60 → RED
- Risk Score ≥ 35 → YELLOW
- Risk Score < 35 → GREEN

## 📚 Referencias

- Technical Calculation Protocol: Math DRI Metrics
- Automation Threshold Roadmap (25 XP/día standard)
- Academic Audit Report 2024-2025
- Middle School Persistence vs SAT 1550 Stamina

## 📊 Changelog

### v5.1 (Enero 2026) - UX/UI Optimizations
- ✨ Reduced stats cards from 6 to 4
- ✨ Added tooltips to stats cards
- ✨ Implemented trend indicators
- ✨ Optimized Matrix tooltip (grid 2x2)
- ✨ Added priority bars to Heatmap
- ✨ Implemented TOP 3 badges
- ✨ Added advanced Matrix filters
- ✨ Implemented ETA prediction in sync
- ✨ Added pause/resume sync capability
- ✨ Created student modal tabs (Overview/History)
- ✨ Added weekly activity pattern chart
- 🚀 Performance: Memoized components
- 🎨 UI: Custom scrollbars

### v5.0 (Enero 2026) - Alpha Protocol Compliance
- ✨ Velocity basado en 125 XP/semana
- ✨ DER threshold 20%
- ✨ PDI threshold 1.5
- ✨ Risk scoring ponderado
- ✨ Clustering K-means en Matrix
- 🔧 Grade maps extendido a 80+ topics

## 💰 Costs

**100% FREE** con límites gratuitos:
- Firebase: 50k reads/day
- Vercel: 100GB bandwidth/month
- Math Academy API: Unlimited

## 🆘 Troubleshooting

### **Build errors**
```bash
# Limpiar cache y reinstalar
rm -rf .next node_modules
npm install
npm run build
```

### **Firebase errors**
- Verificar que `.env.local` tenga todas las variables
- Verificar que Firebase project ID sea correcto
- Revisar Firestore security rules

### **Vercel deployment issues**
- Forzar rebuild sin cache en Vercel dashboard
- Verificar que environment variables estén configuradas

---

**Created by**: Sebastian Sarmiento Forjan  
**Version**: 5.1 (UX/UI Optimized)  
**Last Updated**: Enero 2026



================================================
FILE: next.config.js
================================================
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },

  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          {
            key: 'Expires',
            value: '0',
          },
          {
            key: 'Surrogate-Control',
            value: 'no-store',
          },
        ],
      },
    ];
  },

  logging: {
    fetches: {
      fullUrl: true,
    },
  },
};

module.exports = nextConfig;



================================================
FILE: package.json
================================================
{
  "name": "alpha-math-dashboard",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "14.2.18",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "firebase": "^10.13.0",
    "firebase-admin": "^12.1.0",
    "axios": "^1.7.2",
    "recharts": "^2.12.7",
    "date-fns": "^3.6.0",
    "lucide-react": "^0.428.0",
    "@opentelemetry/api": "^1.9.0"
  },
  "devDependencies": {
    "@types/node": "^20",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "autoprefixer": "^10.4.19",
    "postcss": "^8.4.38",
    "tailwindcss": "^3.4.4",
    "typescript": "^5"
  }
}



================================================
FILE: postcss.config.js
================================================
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}



================================================
FILE: tailwind.config.js
================================================
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        alpha: {
          gold: '#d4af37',
          blue: '#2d4a5a',
          'blue-light': '#3d5a6a',
        }
      }
    },
  },
  plugins: [],
}



================================================
FILE: tsconfig.json
================================================
{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}



================================================
FILE: .env.example
================================================
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef

# Firebase Admin SDK (for server-side operations)
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your_project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour_Private_Key_Here\n-----END PRIVATE KEY-----\n"

# Math Academy API
MATH_ACADEMY_API_KEY=your_math_academy_api_key_here



================================================
FILE: .env.local
================================================
# Math Academy API
NEXT_PUBLIC_MATH_ACADEMY_API_KEY=pk_live_VktTFGM5m8zU7HP5ZPEY5YKTvoGZH4YvT5

# Firebase Config
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyA6jmbWQPpRTvTSGB4C90-9qypZGod6Tbw
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=alpha-math-dashboard.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=alpha-math-dashboard
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=alpha-math-dashboard.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=968989106961
NEXT_PUBLIC_FIREBASE_APP_ID=1:968989106961:web:85f2da2b4e46630329e2b0

# Firebase Admin SDK
FIREBASE_PROJECT_ID=alpha-math-dashboard
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@alpha-math-dashboard.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCmT7IKqtTGvY7J\nMQDgPUEOUBPXJaJ0oEmZXQKyoME2jarafwFNJSDFX1lypnnQZgl3yLkaqy6AUPWu\niRK/17Cs81HIo3Skd0PeA1PS8J2EKp0TyV59S7x5jLbT4nkQjz8JQCA79FN2SBVR\ntaqHQ9KEZwuWaUenzQcbPgUVxJJg3lbJVeCptlc0+skcc1AUlpje2syFLzvRMcdX\nNIWwPzQ95kz7lt1aaXVORbaVTmfm+Dy251PXviD8EYJWBSAc+djLURX/ImcuXSeV\nbkh7N3uzMQ/cCPnFjN3dsnPDJ7UYdgGKISmvL0S9+0CIa43yvRIYk0K9lE+uAucJ\nqJEAL1nrAgMBAAECggEATcBufTw2c5+FVJv7S9p3Qqi/TdNDawDQx8lLDJXJHqcG\nnFXKFvXnpz6Xg9k+k+ZQQNbvav9iowy2f12IDXZaG9E5h/KbApTbfrzRgImLKpH9\nk5WN/kfdGnplsxNrBAnkL3/yUfU828yBYwzqZ4iWr9249h3MKS/aRasuF2oqAOzQ\nDqakvsoLuGfyvTVpgFtccyZ3O2wxOC0UvQ6RceezKvkpuwzFgziYhhTr6jagZ917\n4AaL8iYdVRsAhplAp6P1V6MVcDw9IuDrvo7JUDcSqhO2seteYBIADTQAHjrqeu3e\npYlLYBs+Ix1aQcRbQtrF3yUk5CZuAKZLc1ot0JE9kQKBgQDcWyQtOCq0j6s4LaMc\n/3TcFCZ5weOqnEfRe7Wr1EhhTXZeFfesb2zbRGkNboKQH205LDUxKPOlWcvrpbkc\nG6peyuIxtVkn2kYUceLjmbhIF6GH+tenF5S4QQ2QHfJVXVD8AUuvg3ucg/5qyX8n\ni9ofYEYE/nmS9fvCyOi74TArwwKBgQDBNpVV2fsbvHul2FPmMsti6tCT882Js1P7\neJcrVjf4W3VVTo+ezscyRIEpQ2JAQDZNDErYwc6oF0cNzDbMnCWdyGG/hZ8f+EXG\nqqNRCW6q1mM7iApXvT+GmWj+zGDOu7wj6UWhy/6JLvAQmZhLb/fwZ/tCEFMCYHpY\nM4A2nze+uQKBgQDIxUHw8Xv3h+85AFvdz+NpofJsfXwxtrK46z5bkM9h2HJAx0Mi\nmWNVZL9SvZ24MuoRbXYJlIZp4acqzZQbSBmyxKfTIqhY50dy2VEgjq6ZAO7sNmDG\nnXWja6Iv7RkfLibbdVLAV8wIjzr/kReJsKLMc6tYYYPjorwAfY2PoV2CgQKBgCFI\n3+0MQkAC9mIZpEpx0avWu9vhEjV4mS0nFxO2JKo6RzpM8FzxTkuQlZegLhrXdQNM\n7M/ug0VdzTXJSl9xPuGxlXVC9aiyQoL4/m2FbHUtvaaRxwZaacksQHQ0jTDQEpc1\nJnO7CrxjQ6P4cc39Gf9mSliVK1ereygapynBv/6xAoGAObArDIG5SRHZycb95UBl\nIOCSTSA+epGmVeuEWXRIHHtZZDY9RGdl//tgtxblphIXSJpU+rTrlQYmqbNPYny2\nRncztbWLxVEaSCSU5aMJzfeTrtvZnGLDZBC9EzvRM5KiR8yhYbxQsb3zNtE8SeXa\n9nQ/Bs3v6dDXoqH0Tcvp4s0=\n-----END PRIVATE KEY-----\n"



================================================
FILE: app/globals.css
================================================
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --background: #0a0a0a;
  --foreground: #ffffff;
}

body {
  color: var(--foreground);
  background: var(--background);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica', sans-serif;
}

/* ========================================== */
/* CUSTOM SCROLLBAR */
/* ========================================== */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: #0a0a0a;
}

::-webkit-scrollbar-thumb {
  background: #1e293b;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #334155;
}

/* Custom scrollbar class for dark containers */
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #334155;
  border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #475569;
}

/* ========================================== */
/* ANIMATIONS */
/* ========================================== */
@keyframes fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes zoom-in-95 {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes slide-in-bottom {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes pulse-slow {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.animate-in {
  animation-duration: 0.5s;
  animation-fill-mode: both;
}

.fade-in {
  animation-name: fade-in;
}

.zoom-in-95 {
  animation-name: zoom-in-95;
}

.slide-in-bottom {
  animation-name: slide-in-bottom;
}

/* ========================================== */
/* GRADIENT BACKGROUNDS */
/* ========================================== */
.bg-gradient-radial {
  background: radial-gradient(circle at center, rgba(99, 102, 241, 0.1) 0%, transparent 70%);
}

/* ========================================== */
/* UTILITY CLASSES */
/* ========================================== */
.text-balance {
  text-wrap: balance;
}

.transition-smooth {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* ========================================== */
/* HOVER EFFECTS */
/* ========================================== */
.hover-lift {
  transition: transform 0.2s ease;
}

.hover-lift:hover {
  transform: translateY(-2px);
}

.hover-glow {
  transition: box-shadow 0.3s ease;
}

.hover-glow:hover {
  box-shadow: 0 0 20px rgba(99, 102, 241, 0.3);
}

/* ========================================== */
/* FOCUS STATES */
/* ========================================== */
*:focus-visible {
  outline: 2px solid #6366f1;
  outline-offset: 2px;
}

/* ========================================== */
/* SELECTION */
/* ========================================== */
::selection {
  background-color: rgba(99, 102, 241, 0.3);
  color: #ffffff;
}

/* ========================================== */
/* LOADING STATES */
/* ========================================== */
@keyframes shimmer {
  0% {
    background-position: -1000px 0;
  }
  100% {
    background-position: 1000px 0;
  }
}

.skeleton {
  animation: shimmer 2s infinite;
  background: linear-gradient(
    to right,
    #1e293b 0%,
    #334155 20%,
    #1e293b 40%,
    #1e293b 100%
  );
  background-size: 1000px 100%;
}

/* ========================================== */
/* BACKDROP BLUR SUPPORT */
/* ========================================== */
@supports ((-webkit-backdrop-filter: blur(10px)) or (backdrop-filter: blur(10px))) {
  .backdrop-blur-md {
    -webkit-backdrop-filter: blur(12px);
    backdrop-filter: blur(12px);
  }
  
  .backdrop-blur-xl {
    -webkit-backdrop-filter: blur(24px);
    backdrop-filter: blur(24px);
  }
}



================================================
FILE: app/layout.tsx
================================================
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Alpha Math Dashboard',
  description: 'Real-time Math Academy student analytics',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}



================================================
FILE: app/page.tsx
================================================
'use client';

import { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import KeenKTMatrix from '@/components/KeenKTMatrix';
import StudentModal from '@/components/StudentModal';
import HelpModal from '@/components/HelpModal';
import BulkActionsBar from '@/components/BulkActionsBar';
import Tooltip from '@/components/Tooltip';
import { calculateTier1Metrics } from '@/lib/metrics';
import { calculateDRIMetrics } from '@/lib/dri-calculus';
import { DRI_CONFIG } from '@/lib/dri-config';
import { Student } from '@/types';
import { TOPIC_GRADE_MAP } from '@/lib/grade-maps';
import { formatDistanceToNow } from 'date-fns';

// ==========================================
// METRIC DEFINITIONS FOR TOOLTIPS
// ==========================================
const METRIC_TOOLTIPS = {
  rsr: 'Recent Success Rate: Proportion of recent tasks with >80% accuracy',
  ksi: 'Knowledge Stability Index: Consistency of performance over time',
  der: 'Debt Exposure Ratio: % of K-8 topics mastered during High School',
  pdi: 'Precision Decay Index: Ratio of recent errors to early errors',
  iroi: 'Investment ROI: XP earned per second of engagement',
  velocity: 'Weekly XP Progress: % of weekly XP goal achieved',
  risk: 'Risk Score: Composite score from multiple risk factors (0-100)',
  accuracy: 'Overall accuracy rate across all completed tasks',
  focus: 'Focus Integrity: Measure of sustained attention during sessions',
};

// ==========================================
// METRIC CARD COMPONENT WITH TOOLTIP
// ==========================================
interface MetricCardProps {
  title: string;
  value: string | number;
  color: 'red' | 'amber' | 'emerald' | 'blue' | 'purple';
  subtitle?: string;
  tooltip?: string;
  trend?: number;
}

function MetricCard({ title, value, color, subtitle, tooltip, trend }: MetricCardProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  
  const colorClasses = {
    red: 'bg-red-500/10 border-red-500/30 text-red-400',
    amber: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
    emerald: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
    blue: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
    purple: 'bg-purple-500/10 border-purple-500/30 text-purple-400'
  };

  return (
    <div 
      className={`relative border p-4 rounded-xl ${colorClasses[color]} transition-all hover:scale-[1.02] ${tooltip ? 'cursor-help' : ''}`}
      onMouseEnter={() => tooltip && setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div className="text-[10px] font-bold uppercase tracking-wider opacity-70 mb-1 flex items-center justify-between">
        <span>{title}</span>
        {trend !== undefined && (
          <span className={`text-xs font-black ${trend > 0 ? 'text-emerald-400' : trend < 0 ? 'text-red-400' : 'text-slate-600'}`}>
            {trend > 0 ? '↗' : trend < 0 ? '↘' : '→'} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div className="text-2xl font-black">{value}</div>
      {subtitle && <div className="text-[9px] opacity-60 mt-1">{subtitle}</div>}
      {showTooltip && tooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-[10px] text-slate-300 whitespace-nowrap z-50 shadow-2xl animate-in fade-in duration-200">
          {tooltip}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-slate-900" />
        </div>
      )}
    </div>
  );
}

// ==========================================
// STUDENT CARD MEMOIZED WITH SELECTION
// ==========================================
interface StudentCardProps {
  student: Student;
  onClick: () => void;
  borderColor: string;
  isSelected: boolean;
  onSelect: (id: string, selected: boolean) => void;
  selectionMode: boolean;
}

const StudentCard = memo(({ student, onClick, borderColor, isSelected, onSelect, selectionMode }: StudentCardProps) => {
  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(student.id, !isSelected);
  };

  return (
    <div 
      onClick={onClick}
      className={`p-4 bg-slate-900/80 rounded-2xl border-l-4 ${borderColor} cursor-pointer hover:scale-[1.02] transition-all group shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${isSelected ? 'ring-2 ring-indigo-500 bg-indigo-900/20' : ''}`}
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
    >
      <div className="flex justify-between items-start mb-1">
        <div className="flex items-center gap-2">
          {selectionMode && (
            <div 
              onClick={handleCheckboxClick}
              className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all cursor-pointer ${
                isSelected 
                  ? 'bg-indigo-500 border-indigo-500 text-white' 
                  : 'border-slate-600 hover:border-indigo-400'
              }`}
            >
              {isSelected && <span className="text-xs">✓</span>}
            </div>
          )}
          <h3 className="font-black text-white text-sm uppercase italic truncate w-36 group-hover:text-indigo-400">
            {student.firstName} {student.lastName}
          </h3>
        </div>
        <Tooltip content={METRIC_TOOLTIPS.rsr}>
          <span className="text-[10px] font-mono font-bold text-slate-500 italic cursor-help">
            {(student.metrics.lmp * 100).toFixed(0)}% RSR
          </span>
        </Tooltip>
      </div>
      <p className="text-[9px] text-indigo-400/70 font-bold uppercase mb-3 truncate italic">
        {student.currentCourse.name}
      </p>
      <div className="flex justify-between items-center text-[8px] font-black uppercase font-mono">
        <span className={student.dri.driColor}>{student.dri.driSignal}</span>
        <div className="flex items-center gap-2 text-slate-600">
          <Tooltip content={METRIC_TOOLTIPS.velocity}>
            <span className="cursor-help">{student.metrics.velocityScore}% v</span>
          </Tooltip>
          <span>•</span>
          <Tooltip content={METRIC_TOOLTIPS.ksi}>
            <span className="cursor-help">KSI: {student.metrics.ksi !== null ? student.metrics.ksi + '%' : 'N/A'}</span>
          </Tooltip>
        </div>
      </div>
      {student.dri.riskScore !== undefined && (
        <div className="mt-2 pt-2 border-t border-slate-800">
          <div className="flex justify-between items-center text-[9px]">
            <span className="text-slate-600">Risk:</span>
            <Tooltip content={METRIC_TOOLTIPS.risk}>
              <span className={`font-mono font-bold cursor-help ${
                student.dri.riskScore >= 60 ? 'text-red-400' : 
                student.dri.riskScore >= 35 ? 'text-amber-400' : 
                'text-emerald-400'
              }`}>
                {student.dri.riskScore}/100
              </span>
            </Tooltip>
          </div>
        </div>
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  const prev = prevProps.student;
  const next = nextProps.student;
  return (
    prev.id === next.id &&
    prev.metrics.velocityScore === next.metrics.velocityScore &&
    prev.metrics.lmp === next.metrics.lmp &&
    prev.metrics.ksi === next.metrics.ksi &&
    prev.dri.driTier === next.dri.driTier &&
    prev.dri.driSignal === next.dri.driSignal &&
    prev.dri.riskScore === next.dri.riskScore &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.selectionMode === nextProps.selectionMode
  );
});

StudentCard.displayName = 'StudentCard';

// ==========================================
// COLUMN LOADING SKELETON
// ==========================================
function ColumnSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-28 bg-slate-800/50 rounded-2xl border border-slate-800/30" />
      ))}
    </div>
  );
}

// ==========================================
// ERROR BANNER COMPONENT
// ==========================================
interface ErrorBannerProps {
  message: string;
  onRetry: () => void;
  onDismiss: () => void;
}

function ErrorBanner({ message, onRetry, onDismiss }: ErrorBannerProps) {
  return (
    <div className="bg-red-900/30 border border-red-500/50 px-4 py-3 rounded-xl flex items-center justify-between gap-4 animate-in slide-in-from-top duration-300">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center text-red-400">
          ⚠️
        </div>
        <div>
          <p className="text-sm font-bold text-red-400">{message}</p>
          <p className="text-[10px] text-red-400/70">Check your connection and try again</p>
        </div>
      </div>
      <div className="flex gap-2">
        <button 
          onClick={onRetry}
          className="px-4 py-2 bg-red-500 hover:bg-red-400 text-white text-[10px] font-black uppercase rounded-lg transition-colors"
        >
          ↻ Retry
        </button>
        <button 
          onClick={onDismiss}
          className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-400 text-[10px] font-black uppercase rounded-lg transition-colors"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

// ==========================================
// COMPACT HEADER TOGGLE
// ==========================================
function CompactHeader({ isCompact, onToggle }: { isCompact: boolean; onToggle: () => void; }) {
  return (
    <button
      onClick={onToggle}
      className="text-[9px] text-slate-600 hover:text-slate-400 transition-colors flex items-center gap-1"
      title={isCompact ? "Expand header" : "Compact header"}
    >
      {isCompact ? '⊞ Expand' : '⊟ Compact'}
    </button>
  );
}

// ==========================================
// ACTIVE FILTERS INDICATOR
// ==========================================
function ActiveFiltersIndicator({ 
  search, 
  course, 
  onClearSearch, 
  onClearCourse,
  onClearAll
}: { 
  search: string; 
  course: string; 
  onClearSearch: () => void; 
  onClearCourse: () => void;
  onClearAll: () => void;
}) {
  if (!search && course === 'ALL') return null;

  return (
    <div className="flex items-center gap-2 text-[9px] bg-slate-900/40 px-3 py-2 rounded-xl border border-slate-800">
      <span className="text-slate-500">Active filters:</span>
      {search && (
        <span className="px-2 py-0.5 bg-indigo-500/20 border border-indigo-500/30 rounded-full text-indigo-300 flex items-center gap-1">
          "{search.length > 15 ? search.substring(0, 15) + '...' : search}"
          <button onClick={onClearSearch} className="hover:text-white ml-1 text-[8px]">✕</button>
        </span>
      )}
      {course !== 'ALL' && (
        <span className="px-2 py-0.5 bg-purple-500/20 border border-purple-500/30 rounded-full text-purple-300 flex items-center gap-1">
          {course}
          <button onClick={onClearCourse} className="hover:text-white ml-1 text-[8px]">✕</button>
        </span>
      )}
      <button 
        onClick={onClearAll}
        className="text-slate-500 hover:text-slate-300 ml-2"
        title="Clear all filters (c)"
      >
        Clear all
      </button>
    </div>
  );
}

// ==========================================
// MAIN COMPONENT
// ==========================================
export default function HomePage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [autoSync, setAutoSync] = useState(false);
  const [progress, setProgress] = useState(0);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [batchStatus, setBatchStatus] = useState({ current: 0, total: 33, lastStudent: '' });
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedStudentIndex, setSelectedStudentIndex] = useState<number>(-1);
  
  // Column refresh states
  const [refreshingColumns, setRefreshingColumns] = useState<Set<string>>(new Set());
  
  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectionMode, setSelectionMode] = useState(false);
  
  // Help Modal
  const [showHelp, setShowHelp] = useState(false);
  
  // Compact header mode
  const [compactHeader, setCompactHeader] = useState(false);
  
  // ETA Tracking
  const [syncStartTime, setSyncStartTime] = useState<number | null>(null);
  const [eta, setEta] = useState<number | null>(null);
  const [avgBatchTime, setAvgBatchTime] = useState<number | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  
  const [viewMode, setViewMode] = useState<'TRIAGE' | 'MATRIX' | 'HEATMAP' | 'LOG'>('TRIAGE');
  
  // ==========================================
  // PERSISTENT FILTERS - These persist across view changes
  // ==========================================
  const [search, setSearch] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('ALL');

  // ==========================================
  // KEYBOARD SHORTCUTS
  // ==========================================
  useEffect(() => {
    const handleKeyboard = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.key === '1' && !selectedStudent) setViewMode('TRIAGE');
      if (e.key === '2' && !selectedStudent) setViewMode('MATRIX');
      if (e.key === '3' && !selectedStudent) setViewMode('HEATMAP');
      if (e.key === '4' && !selectedStudent) setViewMode('LOG');
      
      if (e.key === 'Escape') {
        if (selectedStudent) {
          setSelectedStudent(null);
          setSelectedStudentIndex(-1);
        } else if (selectionMode) {
          setSelectionMode(false);
          setSelectedIds(new Set());
        }
      }
      
      if (e.key === '/' && !selectedStudent) {
        e.preventDefault();
        const searchInput = document.querySelector('input[placeholder*="SEARCH"]') as HTMLInputElement;
        searchInput?.focus();
      }
      
      if (e.key === '?' && !selectedStudent) {
        e.preventDefault();
        setShowHelp(true);
      }
      
      // Toggle compact header with 'h'
      if (e.key === 'h' && !selectedStudent) {
        setCompactHeader(prev => !prev);
      }
      
      // Clear all filters with 'c'
      if (e.key === 'c' && !selectedStudent && !e.ctrlKey && !e.metaKey) {
        if (search || selectedCourse !== 'ALL') {
          setSearch('');
          setSelectedCourse('ALL');
        }
      }
      
      // Bulk select shortcut: Ctrl/Cmd + A
      if ((e.ctrlKey || e.metaKey) && e.key === 'a' && viewMode === 'TRIAGE' && !selectedStudent) {
        e.preventDefault();
        if (!selectionMode) {
          setSelectionMode(true);
        }
        const allIds = new Set(filteredForNavigation.map(s => s.id));
        setSelectedIds(allIds);
      }
      
      if (selectedStudent && filteredForNavigation.length > 0) {
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
          e.preventDefault();
          navigateStudent('next');
        }
        if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
          e.preventDefault();
          navigateStudent('prev');
        }
      }
    };

    window.addEventListener('keydown', handleKeyboard);
    return () => window.removeEventListener('keydown', handleKeyboard);
  }, [selectedStudent, selectedStudentIndex, selectionMode, viewMode, search, selectedCourse]);

  // ==========================================
  // FIREBASE LISTENERS
  // ==========================================
  useEffect(() => {
    const unsubStudents = onSnapshot(query(collection(db, 'students')), (snapshot) => {
      const data = snapshot.docs.map(doc => {
        const s = { id: doc.id, ...doc.data() } as any;
        const metrics = calculateTier1Metrics(s, s.activity);
        const dri = calculateDRIMetrics({ ...s, metrics });
        return { ...s, metrics, dri };
      }) as Student[];
      setStudents(data);
      setLoading(false);
      setRefreshingColumns(new Set());
    });

    const unsubLogs = onSnapshot(
      query(collection(db, 'interventions'), orderBy('createdAt', 'desc'), limit(20)), 
      (snapshot) => {
        setLogs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }
    );

    return () => { unsubStudents(); unsubLogs(); };
  }, []);

  // ==========================================
  // BATCH SYNC WITH PREDICTIVE ETA
  // ==========================================
  const runUpdateBatch = async () => {
    if (updating || isPaused) return;
    setUpdating(true);
    setSyncError(null);
    setRefreshingColumns(new Set(['RED', 'YELLOW', 'GREEN']));
    
    if (!syncStartTime) {
      setSyncStartTime(Date.now());
    }
    
    try {
      const res = await fetch('/api/update-students');
      if (!res.ok) {
        throw new Error(`Server returned ${res.status}: ${res.statusText}`);
      }
      
      const data = await res.json();
      
      if (data.success) {
        setProgress(data.progress);
        setBatchStatus({
          current: data.currentBatch || Math.ceil(data.nextIndex / 50),
          total: data.totalBatches || 33,
          lastStudent: data.lastStudentName || ''
        });
        
        if (batchStatus.current > 0 && syncStartTime) {
          const elapsedTime = Date.now() - syncStartTime;
          const completedBatches = batchStatus.current;
          const currentAvgTime = elapsedTime / completedBatches;
          
          setAvgBatchTime(prev => {
            if (prev === null) return currentAvgTime;
            return (prev * 0.7) + (currentAvgTime * 0.3);
          });
          
          const remainingBatches = batchStatus.total - completedBatches;
          const estimatedRemaining = (avgBatchTime || currentAvgTime) * remainingBatches;
          setEta(Math.ceil(estimatedRemaining / 1000));
        }
        
        if (autoSync && data.progress < 100) {
          setTimeout(runUpdateBatch, 1500);
        } else if (data.progress >= 100) {
          setAutoSync(false);
          setLastSync(new Date());
          setSyncStartTime(null);
          setEta(null);
          setAvgBatchTime(null);
          setRefreshingColumns(new Set());
        }
      } else {
        throw new Error(data.error || 'Unknown error occurred');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Connection failed';
      setSyncError(`Sync failed: ${errorMessage}`);
      setAutoSync(false);
      setSyncStartTime(null);
      setEta(null);
      setRefreshingColumns(new Set());
    }
    
    setUpdating(false);
  };

  useEffect(() => { 
    if (autoSync && !updating && !isPaused) runUpdateBatch(); 
  }, [autoSync, isPaused]);

  useEffect(() => {
    if (!autoSync) {
      setSyncStartTime(null);
      setEta(null);
      setAvgBatchTime(null);
    }
  }, [autoSync]);

  // ==========================================
  // STOP SYNC WITH CONFIRMATION
  // ==========================================
  const handleStopSync = () => {
    if (progress > 0 && progress < 100) {
      const remainingStudents = Math.round((100 - progress) / 100 * 1613);
      const confirmed = window.confirm(
        `Sync is ${progress}% complete.\n\nStopping now will leave approximately ${remainingStudents} students with outdated data.\n\nAre you sure you want to stop?`
      );
      if (!confirmed) return;
    }
    setAutoSync(false);
    setIsPaused(false);
    setRefreshingColumns(new Set());
  };

  const handleRetrySync = () => {
    setSyncError(null);
    setAutoSync(true);
  };

  // ==========================================
  // BULK SELECTION HANDLERS
  // ==========================================
  const handleSelectStudent = useCallback((id: string, selected: boolean) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(id);
      } else {
        newSet.delete(id);
      }
      return newSet;
    });
  }, []);

  const handleSelectAll = useCallback((tier: 'RED' | 'YELLOW' | 'GREEN') => {
    const tierStudents = tier === 'RED' ? redZone : tier === 'YELLOW' ? yellowZone : greenZone;
    const tierIds = tierStudents.map(s => s.id);
    
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      const allSelected = tierIds.every(id => newSet.has(id));
      
      if (allSelected) {
        tierIds.forEach(id => newSet.delete(id));
      } else {
        tierIds.forEach(id => newSet.add(id));
      }
      return newSet;
    });
  }, []);

  const handleClearSelection = useCallback(() => {
    setSelectedIds(new Set());
    setSelectionMode(false);
  }, []);

  const handleExportSelected = useCallback(() => {
    const selectedStudents = students.filter(s => selectedIds.has(s.id));
    const csvContent = [
      ['ID', 'Name', 'Course', 'RSR', 'KSI', 'Velocity', 'Risk Score', 'Tier'].join(','),
      ...selectedStudents.map(s => [
        s.id,
        `${s.firstName} ${s.lastName}`,
        s.currentCourse?.name || 'N/A',
        `${(s.metrics.lmp * 100).toFixed(0)}%`,
        s.metrics.ksi !== null ? `${s.metrics.ksi}%` : 'N/A',
        `${s.metrics.velocityScore}%`,
        s.dri.riskScore || 'N/A',
        s.dri.driTier
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `students-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [selectedIds, students]);

  // ==========================================
  // FILTER HANDLERS
  // ==========================================
  const clearFilters = useCallback(() => {
    setSearch('');
    setSelectedCourse('ALL');
  }, []);

  // ==========================================
  // COMPUTED DATA
  // ==========================================
  const uniqueCourses = useMemo(() => 
    Array.from(new Set(students.map(s => s.currentCourse?.name).filter(Boolean))).sort(), 
  [students]);
  
  const criticalTopics = Object.keys(TOPIC_GRADE_MAP);

  const heatmapData = useMemo(() => {
    const data = criticalTopics.map(topic => {
      const courseStats = uniqueCourses.map(course => {
        const relevant = students.filter(s => s.currentCourse?.name === course);
        const avgLMP = relevant.reduce((acc, s) => acc + (s.metrics?.lmp || 0), 0) / Math.max(1, relevant.length);
        return { course, avgLMP };
      });
      const criticalCourses = courseStats.filter(c => c.avgLMP < 0.4).length;
      return { topic, courseStats, criticalCourses };
    });
    return data.sort((a, b) => b.criticalCourses - a.criticalCourses).slice(0, 15);
  }, [students, uniqueCourses, criticalTopics]);

  // ==========================================
  // FILTERED DATA - Uses persistent filters
  // ==========================================
  const filtered = useMemo(() => students.filter(s => {
    const nameMatch = `${s.firstName} ${s.lastName} ${s.id}`.toLowerCase().includes(search.toLowerCase());
    const courseMatch = selectedCourse === 'ALL' || s.currentCourse?.name === selectedCourse;
    return nameMatch && courseMatch;
  }), [students, search, selectedCourse]);

  const redZone = useMemo(() => filtered.filter(s => s.dri.driTier === 'RED'), [filtered]);
  const yellowZone = useMemo(() => filtered.filter(s => s.dri.driTier === 'YELLOW' && !redZone.some(r => r.id === s.id)), [filtered, redZone]);
  const greenZone = useMemo(() => filtered.filter(s => !redZone.some(r => r.id === s.id) && !yellowZone.some(y => y.id === s.id)), [filtered, redZone, yellowZone]);

  const filteredForNavigation = useMemo(() => [...redZone, ...yellowZone, ...greenZone], [redZone, yellowZone, greenZone]);

  const stats = useMemo(() => ({
    total: students.length,
    atRisk: students.filter(s => s.dri.driTier === 'RED').length,
    attention: students.filter(s => s.dri.driTier === 'YELLOW').length,
    onTrack: students.filter(s => s.dri.driTier === 'GREEN').length,
    avgVelocity: Math.round(students.reduce((sum, s) => sum + (s.metrics?.velocityScore || 0), 0) / (students.length || 1)),
    avgRSR: Math.round(students.reduce((sum, s) => sum + ((s.metrics?.lmp || 0) * 100), 0) / (students.length || 1))
  }), [students]);

  const trends = { atRisk: -5, attention: 2, onTrack: 3, avgVelocity: -2 };

  // ==========================================
  // STUDENT NAVIGATION
  // ==========================================
  const navigateStudent = useCallback((direction: 'prev' | 'next') => {
    if (filteredForNavigation.length === 0) return;
    
    let newIndex = selectedStudentIndex;
    
    if (direction === 'next') {
      newIndex = selectedStudentIndex < filteredForNavigation.length - 1 
        ? selectedStudentIndex + 1 
        : 0;
    } else {
      newIndex = selectedStudentIndex > 0 
        ? selectedStudentIndex - 1 
        : filteredForNavigation.length - 1;
    }
    
    setSelectedStudentIndex(newIndex);
    setSelectedStudent(filteredForNavigation[newIndex]);
  }, [filteredForNavigation, selectedStudentIndex]);

  const handleStudentClick = useCallback((student: Student) => {
    if (selectionMode) {
      handleSelectStudent(student.id, !selectedIds.has(student.id));
    } else {
      const index = filteredForNavigation.findIndex(s => s.id === student.id);
      setSelectedStudentIndex(index);
      setSelectedStudent(student);
    }
  }, [filteredForNavigation, selectionMode, selectedIds, handleSelectStudent]);

  const selectedStudentsData = useMemo(() => 
    students.filter(s => selectedIds.has(s.id)),
  [students, selectedIds]);

  if (loading) return (
    <div className="p-10 bg-black min-h-screen text-emerald-500 font-mono italic animate-pulse text-center uppercase tracking-widest">
      DRI COMMAND CENTER INITIALIZING...
    </div>
  );

  return (
    <div className="flex flex-col h-screen bg-[#050505] text-slate-300 font-sans overflow-hidden">
      
      {/* ========================================== */}
      {/* HEADER SECTION */}
      {/* ========================================== */}
      <div className={`flex-shrink-0 p-6 pb-0 space-y-4 transition-all duration-300 ${compactHeader ? 'space-y-2' : ''}`}>
        
        {/* ERROR BANNER */}
        {syncError && (
          <ErrorBanner 
            message={syncError}
            onRetry={handleRetrySync}
            onDismiss={() => setSyncError(null)}
          />
        )}
        
        {/* TOP BAR - SIMPLIFIED */}
        <div className={`flex flex-col md:flex-row justify-between items-end border-b border-slate-800 pb-4 gap-4 ${compactHeader ? 'pb-2' : ''}`}>
          <div className="flex items-center gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className={`font-black uppercase italic text-white tracking-tighter transition-all ${compactHeader ? 'text-xl' : 'text-3xl'}`}>
                  DRI COMMAND CENTER
                </h1>
                <button 
                  onClick={() => setShowHelp(true)}
                  className="w-7 h-7 rounded-full border border-slate-700 text-slate-500 hover:text-white hover:border-indigo-500 transition-all flex items-center justify-center text-xs font-bold"
                  title="Help & Keyboard Shortcuts (?)"
                >
                  ?
                </button>
                <CompactHeader isCompact={compactHeader} onToggle={() => setCompactHeader(!compactHeader)} />
              </div>
              
              {!compactHeader && (
                <>
                  <p className="text-xs text-indigo-400 font-bold tracking-[0.3em] uppercase">
                    V5.4 Alpha • {students.length} Students
                  </p>
                  
                  <div className="flex gap-3 mt-1 text-[9px] text-slate-600 font-mono flex-wrap">
                    <Tooltip content={METRIC_TOOLTIPS.rsr}>
                      <span className="cursor-help">RSR: <span className="text-emerald-500 font-bold">{stats.avgRSR}%</span></span>
                    </Tooltip>
                    <span className="text-slate-700">•</span>
                    <span>Std: <span className="text-indigo-500 font-bold">{DRI_CONFIG.ALPHA_WEEKLY_STANDARD} XP/wk</span></span>
                  </div>
                </>
              )}
              
              {lastSync && (
                <p className={`text-emerald-600 font-mono ${compactHeader ? 'text-[8px]' : 'text-[10px] mt-1'}`}>
                  ✓ Synced {formatDistanceToNow(lastSync, { addSuffix: true })}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-2">
            {/* VIEW TOGGLE */}
            <div className={`flex bg-slate-900/50 p-1 rounded-xl border border-slate-800 font-black uppercase ${compactHeader ? 'text-[8px]' : 'text-[10px]'}`}>
              {(['TRIAGE', 'MATRIX', 'HEATMAP', 'LOG'] as const).map((m, i) => (
                <button 
                  key={m} 
                  onClick={() => setViewMode(m)} 
                  className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
                    viewMode === m 
                      ? 'bg-indigo-600 text-white shadow-lg' 
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {m}
                  <kbd className={`text-[7px] px-1 rounded ${viewMode === m ? 'bg-indigo-500' : 'bg-slate-800'}`}>{i + 1}</kbd>
                </button>
              ))}
            </div>
            
            {/* SYNC STATUS - COMPACT */}
            <div className={`flex gap-3 items-center bg-slate-900/40 px-3 rounded-xl border border-slate-800 relative overflow-hidden ${compactHeader ? 'py-1.5' : 'py-2'}`}>
              {autoSync && <div className="absolute bottom-0 left-0 h-0.5 bg-emerald-500 transition-all duration-700" style={{ width: `${progress}%` }} />}
              <div className="text-[9px] font-mono">
                <span className="text-white font-bold">{students.length}</span>
                <span className="text-slate-600">/1613</span>
                {autoSync && (
                  <span className="ml-2 text-slate-500">
                    B{batchStatus.current}/{batchStatus.total}
                    {eta && <span className="text-indigo-400 ml-1">~{Math.floor(eta / 60)}m</span>}
                  </span>
                )}
              </div>
              <div className="flex gap-1">
                {autoSync && (
                  <button 
                    onClick={() => setIsPaused(!isPaused)} 
                    className="px-2 py-1 rounded text-[8px] bg-slate-800 text-slate-400 hover:bg-slate-700"
                  >
                    {isPaused ? '▶' : '⏸'}
                  </button>
                )}
                <button 
                  onClick={() => autoSync ? handleStopSync() : setAutoSync(true)} 
                  disabled={updating && !autoSync} 
                  className={`px-3 py-1 rounded text-[8px] font-black uppercase transition-all ${
                    autoSync 
                      ? 'bg-red-900/50 text-red-500 border border-red-500' 
                      : 'bg-emerald-600 text-white hover:bg-emerald-500'
                  }`}
                >
                  {autoSync ? 'STOP' : 'SYNC'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* METRICS ROW - COLLAPSIBLE */}
        {!compactHeader && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <MetricCard 
              title={`🔴 Critical`} 
              value={stats.atRisk} 
              color="red" 
              subtitle={`${((stats.atRisk/stats.total)*100).toFixed(1)}%`} 
              tooltip="Risk Score ≥ 60, DER > 20%, or RSR < 60%" 
              trend={trends.atRisk} 
            />
            <MetricCard 
              title={`🟡 Watch`} 
              value={stats.attention} 
              color="amber" 
              subtitle={`${((stats.attention/stats.total)*100).toFixed(1)}%`} 
              tooltip="Risk Score 35-59, or PDI > 1.5" 
              trend={trends.attention} 
            />
            <MetricCard 
              title={`🟢 Optimal`} 
              value={stats.onTrack} 
              color="emerald" 
              subtitle={`${((stats.onTrack/stats.total)*100).toFixed(1)}%`} 
              tooltip="Risk Score < 35 with stable metrics" 
              trend={trends.onTrack} 
            />
            <MetricCard 
              title="Avg Velocity" 
              value={`${stats.avgVelocity}%`} 
              color="purple" 
              subtitle={`${Math.round((stats.avgVelocity / 100) * DRI_CONFIG.ALPHA_WEEKLY_STANDARD)} XP/wk`} 
              tooltip={METRIC_TOOLTIPS.velocity}
              trend={trends.avgVelocity} 
            />
          </div>
        )}

        {/* SEARCH & FILTER ROW */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[280px]">
            <input 
              value={search}
              onChange={(e) => setSearch(e.target.value)} 
              placeholder="🔎 SEARCH STUDENT..." 
              className={`w-full bg-slate-900/40 border border-slate-800 rounded-xl px-4 text-sm focus:border-indigo-500 outline-none font-mono transition-all ${compactHeader ? 'py-2' : 'py-3'}`}
            />
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] text-slate-600 bg-slate-800 px-1.5 py-0.5 rounded">/</kbd>
          </div>
          
          {viewMode === 'TRIAGE' && (
            <button
              onClick={() => {
                setSelectionMode(!selectionMode);
                if (selectionMode) setSelectedIds(new Set());
              }}
              className={`px-3 py-2 rounded-xl font-black text-[9px] uppercase tracking-wider transition-all ${
                selectionMode 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-slate-900 border border-slate-800 text-slate-500 hover:text-white hover:border-indigo-500'
              }`}
            >
              {selectionMode ? '✓ Selecting' : '☐ Select'}
            </button>
          )}
          
          <select 
            value={selectedCourse} 
            onChange={(e) => setSelectedCourse(e.target.value)} 
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-[10px] font-black uppercase text-slate-400 outline-none"
          >
            <option value="ALL">ALL COURSES</option>
            {uniqueCourses.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          
          {/* Active Filters Indicator */}
          <ActiveFiltersIndicator
            search={search}
            course={selectedCourse}
            onClearSearch={() => setSearch('')}
            onClearCourse={() => setSelectedCourse('ALL')}
            onClearAll={clearFilters}
          />
        </div>
      </div>

      {/* ========================================== */}
      {/* BULK ACTIONS BAR */}
      {/* ========================================== */}
      {selectionMode && selectedIds.size > 0 && (
        <BulkActionsBar
          selectedCount={selectedIds.size}
          selectedStudents={selectedStudentsData}
          onClear={handleClearSelection}
          onExport={handleExportSelected}
        />
      )}

      {/* ========================================== */}
      {/* DYNAMIC CONTENT AREA */}
      {/* ========================================== */}
      <div className="flex-1 min-h-0 p-6 pt-4">
        
        {/* TRIAGE VIEW */}
        {viewMode === 'TRIAGE' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full animate-in fade-in duration-500">
            {[
              { label: '🚨 Critical', data: redZone, tier: 'RED' as const, border: 'border-red-500' },
              { label: '⚠️ Watch', data: yellowZone, tier: 'YELLOW' as const, border: 'border-amber-500' },
              { label: '⚡ Optimal', data: greenZone, tier: 'GREEN' as const, border: 'border-emerald-500' }
            ].map(col => {
              const isRefreshing = refreshingColumns.has(col.tier);
              const allSelected = col.data.length > 0 && col.data.every(s => selectedIds.has(s.id));
              const someSelected = col.data.some(s => selectedIds.has(s.id));
              
              return (
                <div key={col.tier} className="flex flex-col bg-slate-900/20 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl h-full">
                  <div className="flex-shrink-0 p-3 bg-slate-900/40 border-b border-slate-800 font-black text-xs uppercase tracking-widest flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      {selectionMode && (
                        <button
                          onClick={() => handleSelectAll(col.tier)}
                          className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${
                            allSelected 
                              ? 'bg-indigo-500 border-indigo-500 text-white' 
                              : someSelected
                                ? 'bg-indigo-500/50 border-indigo-500 text-white'
                                : 'border-slate-600 hover:border-indigo-400'
                          }`}
                        >
                          {(allSelected || someSelected) && <span className="text-[8px]">✓</span>}
                        </button>
                      )}
                      <span className="text-slate-300">{col.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {isRefreshing && (
                        <div className="w-3 h-3 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                      )}
                      <span className="bg-slate-800 text-slate-500 px-2 py-0.5 rounded text-[9px] font-mono">{col.data.length}</span>
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                    {isRefreshing && col.data.length === 0 ? (
                      <ColumnSkeleton />
                    ) : col.data.length === 0 ? (
                      <div className="text-center py-20 text-slate-600 italic text-xs">
                        {(search || selectedCourse !== 'ALL') ? 'No students match filters' : 'No students'}
                      </div>
                    ) : (
                      col.data.map(s => (
                        <StudentCard 
                          key={s.id} 
                          student={s} 
                          onClick={() => handleStudentClick(s)} 
                          borderColor={col.border}
                          isSelected={selectedIds.has(s.id)}
                          onSelect={handleSelectStudent}
                          selectionMode={selectionMode}
                        />
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* MATRIX VIEW */}
        {viewMode === 'MATRIX' && (
          <div className="h-full w-full animate-in zoom-in-95 duration-300">
            <KeenKTMatrix 
              students={filtered} 
              onStudentClick={handleStudentClick} 
            />
          </div>
        )}

        {/* HEATMAP VIEW */}
        {viewMode === 'HEATMAP' && (
          <div className="h-full w-full bg-slate-950 border border-slate-800 rounded-[2.5rem] p-8 overflow-hidden flex flex-col shadow-2xl animate-in fade-in duration-500">
            <div className="flex-shrink-0 mb-6 flex justify-between items-end">
              <div>
                <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  📊 Top 15 Critical Knowledge Components
                  <span className="px-2 py-0.5 bg-red-900/30 border border-red-500/50 rounded text-[9px] text-red-400 font-black">PRIORITIZED</span>
                </h3>
                <p className="text-[10px] text-slate-600 font-mono mt-1">Sorted by courses with avg RSR &lt; 40%</p>
              </div>
              <div className="flex items-center gap-4 text-[9px] text-slate-600">
                <div className="flex items-center gap-1.5"><div className="w-3 h-1.5 rounded-full bg-gradient-to-r from-red-500 to-amber-500" /><span>High</span></div>
                <div className="flex items-center gap-1.5"><div className="w-3 h-1.5 rounded-full bg-slate-700" /><span>Low</span></div>
              </div>
            </div>
            <div className="flex-1 overflow-auto custom-scrollbar">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="sticky top-0 left-0 z-20 bg-slate-950 p-3 text-[8px] font-black text-slate-600 uppercase text-left border-b border-slate-800 min-w-[200px]">Component</th>
                    {uniqueCourses.map(course => (
                      <th key={course} className="sticky top-0 z-10 bg-slate-950 p-3 text-[8px] font-black text-slate-500 uppercase border-b border-slate-800 min-w-[90px] font-mono">{course}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {heatmapData.map((row, rowIndex) => (
                    <tr key={row.topic} className="hover:bg-slate-900/50 transition-colors group">
                      <td className="sticky left-0 z-10 bg-slate-950 p-3 border-r border-slate-800">
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0 w-16 h-1.5 rounded-full bg-slate-800/50 overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-red-500 via-amber-500 to-emerald-500" style={{ width: `${Math.min((row.criticalCourses / uniqueCourses.length) * 100, 100)}%` }} />
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-slate-300 uppercase italic truncate">{row.topic}</span>
                            {rowIndex < 3 && (
                              <span className="px-1.5 py-0.5 bg-red-900/40 border border-red-500/60 rounded text-[8px] font-black text-red-300">
                                #{rowIndex + 1}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      {row.courseStats.map((cell, idx) => (
                        <td key={idx} className="p-2 border border-slate-900">
                          <Tooltip content={`${cell.course}: ${(cell.avgLMP * 100).toFixed(1)}% avg RSR`}>
                            <div 
                              className="h-10 rounded-md flex items-center justify-center text-[10px] font-mono font-black transition-all hover:scale-105 cursor-help" 
                              style={{ 
                                backgroundColor: cell.avgLMP < 0.4 ? 'rgba(239, 68, 68, 0.2)' : cell.avgLMP < 0.7 ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.1)', 
                                border: `1px solid ${cell.avgLMP < 0.4 ? '#ef444433' : cell.avgLMP < 0.7 ? '#f59e0b33' : '#10b98133'}` 
                              }}
                            >
                              <span style={{ color: cell.avgLMP < 0.4 ? '#fca5a5' : cell.avgLMP < 0.7 ? '#fbbf24' : '#6ee7b7' }}>
                                {(cell.avgLMP * 100).toFixed(0)}%
                              </span>
                            </div>
                          </Tooltip>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* LOG VIEW */}
        {viewMode === 'LOG' && (
          <div className="h-full bg-slate-950 border border-slate-800 rounded-[2.5rem] p-8 overflow-y-auto custom-scrollbar animate-in fade-in duration-500 shadow-2xl">
            <div className="mb-6">
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                📝 Recent Coaching Interventions
                <span className="px-2 py-0.5 bg-indigo-900/30 border border-indigo-500/50 rounded text-[9px] text-indigo-400 font-black">{logs.length}</span>
              </h3>
              <p className="text-[10px] text-slate-600 font-mono mt-1">Click a student card to log new interventions</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {logs.map(log => (
                <div key={log.id} className="p-5 bg-slate-900/30 rounded-2xl border border-slate-800/50 shadow-inner hover:border-slate-700 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${log.type === 'coaching' ? 'bg-indigo-500 shadow-[0_0_10px_#6366f1]' : 'bg-red-500 shadow-[0_0_10px_#ef4444]'}`} />
                      <div>
                        <p className="text-sm font-black text-white uppercase italic">{log.studentName}</p>
                        <p className="text-[10px] text-slate-500 font-mono">{log.coachName || 'Unknown Coach'}</p>
                      </div>
                    </div>
                    <div className="text-right text-[9px] font-mono text-slate-700">
                      {log.createdAt?.seconds ? new Date(log.createdAt.seconds * 1000).toLocaleDateString() : 'Syncing...'}
                    </div>
                  </div>
                  {log.objective && (
                    <p className="text-[10px] text-indigo-400 font-bold mb-2">{log.objective}</p>
                  )}
                  {log.whatWasDone && (
                    <p className="text-[10px] text-slate-400 line-clamp-2">{log.whatWasDone}</p>
                  )}
                  {log.nextSteps && (
                    <div className="mt-2 pt-2 border-t border-slate-800">
                      <p className="text-[9px] text-amber-400">→ {log.nextSteps.substring(0, 60)}...</p>
                    </div>
                  )}
                </div>
              ))}
              {logs.length === 0 && (
                <div className="col-span-2 text-center py-20 text-slate-600 italic text-xs">
                  No interventions logged yet. Click on a student to start logging coaching sessions.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* STUDENT MODAL */}
      {selectedStudent && (
        <StudentModal 
          student={selectedStudent} 
          onClose={() => {
            setSelectedStudent(null);
            setSelectedStudentIndex(-1);
          }}
          onNavigate={navigateStudent}
          currentIndex={selectedStudentIndex}
          totalStudents={filteredForNavigation.length}
        />
      )}
      
      {/* HELP MODAL */}
      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
    </div>
  );
}



================================================
FILE: app/api/debug-dates/route.ts
================================================
/**
 * DEBUG ENDPOINT: Verificar cálculo de fechas en runtime
 * Uso: GET /api/debug-dates?studentId=29509
 */

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

const BASE_URL = 'https://mathacademy.com/api/beta6';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const studentId = searchParams.get('studentId') || '29509';
  const API_KEY = process.env.NEXT_PUBLIC_MATH_ACADEMY_API_KEY;

  if (!API_KEY) {
    return NextResponse.json({ error: 'Missing API Key' }, { status: 500 });
  }

  // CALCULAR FECHAS EN ESTE MOMENTO
  const now = new Date(Date.now());
  const serverTimestamp = now.toISOString();
  
  const endDateObj = new Date(now.getTime());
  endDateObj.setDate(endDateObj.getDate() + 1);
  const endDate = endDateObj.toISOString().split('T')[0];

  const startDateObj = new Date(now.getTime());
  startDateObj.setDate(startDateObj.getDate() - 30);
  const startDate = startDateObj.toISOString().split('T')[0];

  const daysDiff = Math.round((endDateObj.getTime() - startDateObj.getTime()) / (1000 * 60 * 60 * 24));

  // TEST REQUEST A LA API
  let apiResponse: any = null;
  let apiError: string | null = null;

  try {
    const res = await fetch(`${BASE_URL}/students/${studentId}/activity`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Public-API-Key': API_KEY,
        'Start-Date': startDate,
        'End-Date': endDate
      },
      cache: 'no-store'
    });

    if (res.ok) {
      const data = await res.json();
      const activity = data?.activity || data;
      
      apiResponse = {
        status: res.status,
        tasksCount: activity?.tasks?.length || 0,
        totals: activity?.totals || {},
        firstTaskDate: activity?.tasks?.[0]?.completedLocal || null,
        lastTaskDate: activity?.tasks?.slice(-1)?.[0]?.completedLocal || null
      };
    } else {
      apiError = `HTTP ${res.status}: ${res.statusText}`;
    }
  } catch (e: any) {
    apiError = e.message;
  }

  return NextResponse.json({
    diagnostic: 'Date Calculation Runtime Test',
    
    serverInfo: {
      timestamp: serverTimestamp,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      nodeVersion: process.version
    },
    
    calculatedDates: {
      startDate,
      endDate,
      daysDiff,
      expectedDays: 31,
      isCorrect: daysDiff === 31
    },
    
    headersUsed: {
      'Start-Date': startDate,
      'End-Date': endDate
    },
    
    apiTest: {
      studentId,
      url: `${BASE_URL}/students/${studentId}/activity`,
      response: apiResponse,
      error: apiError
    },
    
    cacheCheck: {
      note: 'If dates change on each request, cache is properly disabled',
      requestId: Math.random().toString(36).substring(7)
    }
  });
}



================================================
FILE: app/api/debug-find-active/route.ts
================================================
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

const BASE_URL = 'https://mathacademy.com/api/beta6';

const TEST_IDS = [
  '29509', '29437', '29441', '29442', '29494', '20848', '10866', 
  '21931', '22729', '21936', '21949', '21958', '30668', '30679',
  '21799', '21833', '21971', '21972', '21961', '21962', '21947'
];

export async function GET(request: Request) {
  const API_KEY = process.env.NEXT_PUBLIC_MATH_ACADEMY_API_KEY;

  if (!API_KEY) {
    return NextResponse.json({ error: 'Missing API Key' }, { status: 500 });
  }

  const now = new Date(Date.now());
  const endDateObj = new Date(now.getTime());
  endDateObj.setDate(endDateObj.getDate() + 1);
  const endDate = endDateObj.toISOString().split('T')[0];

  const startDateObj = new Date(now.getTime());
  startDateObj.setDate(startDateObj.getDate() - 30);
  const startDate = startDateObj.toISOString().split('T')[0];

  const results: any[] = [];

  for (const studentId of TEST_IDS) {
    try {
      const res = await fetch(`${BASE_URL}/students/${studentId}/activity`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Public-API-Key': API_KEY,
          'Start-Date': startDate,
          'End-Date': endDate
        },
        cache: 'no-store'
      });

      if (res.ok) {
        const data = await res.json();
        const activity = data?.activity || data;
        const tasks = activity?.tasks || [];
        const totals = activity?.totals || {};

        if (tasks.length > 0) {
          results.push({
            studentId,
            tasksCount: tasks.length,
            timeEngaged: totals.timeEngaged || 0,
            xpAwarded: totals.xpAwarded || 0,
            firstTask: tasks[0]
          });
        }
      }
    } catch (e) {
      continue;
    }

    if (results.length >= 3) break;
  }

  return NextResponse.json({
    diagnostic: 'Find Active Students',
    dateRange: { startDate, endDate },
    studentsChecked: TEST_IDS.length,
    activeStudentsFound: results.length,
    activeStudents: results
  });
}



================================================
FILE: app/api/debug-sync/route.ts
================================================
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const BASE_URL = 'https://mathacademy.com/api/beta6';

export async function GET(request: Request) {
  const API_KEY = process.env.NEXT_PUBLIC_MATH_ACADEMY_API_KEY;

  if (!API_KEY) {
    return NextResponse.json({ error: 'Falta API Key' }, { status: 500 });
  }

  try {
    // 1. INTENTO DE DESCUBRIMIENTO: Pedir la lista completa
    // Probamos el endpoint estándar de colección
    console.log('📡 Intentando descubrir estudiantes activos...');
    
    const res = await fetch(`${BASE_URL}/students`, {
      headers: { 'Public-API-Key': API_KEY },
      cache: 'no-store'
    });

    if (!res.ok) {
        return NextResponse.json({
            status: '❌ ERROR EN DESCUBRIMIENTO',
            code: res.status,
            statusText: res.statusText,
            message: 'No se pudo obtener la lista de estudiantes. Revisa permisos de la API Key.'
        }, { status: res.status });
    }

    const data = await res.json();

    // 2. Analizar qué devolvió la API
    // A veces devuelve { students: [...] } o directamente [...]
    const studentList = Array.isArray(data) ? data : (data.students || []);

    if (studentList.length === 0) {
        return NextResponse.json({
            status: '⚠️ API VACÍA',
            message: 'La API respondió OK, pero la lista de estudiantes está vacía.',
            suggestion: 'Tu API Key podría ser válida pero no tener estudiantes asignados.'
        });
    }

    // 3. ÉXITO: Tomamos el primer estudiante REAL para probar sus datos
    const realStudent = studentList[0];
    
    return NextResponse.json({
      status: '✅ DESCUBRIMIENTO EXITOSO',
      count: studentList.length,
      
      // Muestra IDs reales para que actualices tu JSON
      first_5_ids: studentList.slice(0, 5).map((s: any) => s.id),
      
      // Muestra la estructura del primer estudiante para ver dónde está el tiempo
      sample_student: {
          id: realStudent.id,
          name: `${realStudent.first_name || realStudent.firstName} ${realStudent.last_name || realStudent.lastName}`,
          // Aquí veremos si los datos vienen en la lista o si hay que pedir detalle
          has_activity_data: !!realStudent.activity, 
          raw_data_keys: Object.keys(realStudent)
      }
    });

  } catch (e: any) {
    return NextResponse.json({ 
        status: '❌ ERROR DE CONEXIÓN',
        error: e.message 
    }, { status: 500 });
  }
}



================================================
FILE: app/api/debug-task-fields/route.ts
================================================
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

const BASE_URL = 'https://mathacademy.com/api/beta6';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const studentId = searchParams.get('studentId') || '29509';
  const API_KEY = process.env.NEXT_PUBLIC_MATH_ACADEMY_API_KEY;

  if (!API_KEY) {
    return NextResponse.json({ error: 'Missing API Key' }, { status: 500 });
  }

  const now = new Date(Date.now());
  const endDateObj = new Date(now.getTime());
  endDateObj.setDate(endDateObj.getDate() + 1);
  const endDate = endDateObj.toISOString().split('T')[0];

  const startDateObj = new Date(now.getTime());
  startDateObj.setDate(startDateObj.getDate() - 30);
  const startDate = startDateObj.toISOString().split('T')[0];

  try {
    const res = await fetch(`${BASE_URL}/students/${studentId}/activity`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Public-API-Key': API_KEY,
        'Start-Date': startDate,
        'End-Date': endDate
      },
      cache: 'no-store'
    });

    if (!res.ok) {
      return NextResponse.json({ 
        error: `API Error: ${res.status}`,
        statusText: res.statusText 
      }, { status: res.status });
    }

    const data = await res.json();
    const activity = data?.activity || data;
    const tasks = activity?.tasks || [];

    const sampleTasks = tasks.slice(0, 3).map((task: any, index: number) => ({
      taskIndex: index,
      allFields: Object.keys(task),
      rawData: task,
      possibleTimeFields: {
        timeSpent: task.timeSpent,
        timeTotal: task.timeTotal,
        time: task.time,
        duration: task.duration,
        timeEngaged: task.timeEngaged,
        timeElapsed: task.timeElapsed,
        seconds: task.seconds,
        minutes: task.minutes
      }
    }));

    return NextResponse.json({
      diagnostic: 'Task Fields Analysis',
      studentId,
      dateRange: { startDate, endDate },
      totalTasks: tasks.length,
      totalsStructure: {
        allFields: Object.keys(activity?.totals || {}),
        rawTotals: activity?.totals
      },
      sampleTasks,
      firstTaskAllData: tasks[0] || 'No tasks found'
    });

  } catch (e: any) {
    return NextResponse.json({ 
      error: e.message,
      stack: e.stack 
    }, { status: 500 });
  }
}



================================================
FILE: app/api/debug-time/route.ts
================================================
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const BASE_URL = 'https://mathacademy.com/api/beta6';

export async function GET(request: Request) {
  const API_KEY = process.env.NEXT_PUBLIC_MATH_ACADEMY_API_KEY;
  const { searchParams } = new URL(request.url);
  const studentId = searchParams.get('studentId') || '29509';

  if (!API_KEY) {
    return NextResponse.json({ error: 'Falta API Key' }, { status: 500 });
  }

  try {
    // Calcular rango con padding
    const now = new Date();
    const endDateObj = new Date(now);
    endDateObj.setDate(endDateObj.getDate() + 1);
    const endDate = endDateObj.toISOString().split('T')[0];
    
    const startDateObj = new Date(now);
    const day = startDateObj.getDay();
    startDateObj.setDate(startDateObj.getDate() - day - 1);
    const startDate = startDateObj.toISOString().split('T')[0];

    console.log('📅 Rango (con padding):', { startDate, endDate });

    // ==========================================
    // REQUEST CON HEADERS (COMO PYTHON)
    // ==========================================
    const activityRes = await fetch(
      `${BASE_URL}/students/${studentId}/activity`,
      {
        headers: { 
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Public-API-Key': API_KEY,
          'Start-Date': startDate,
          'End-Date': endDate
        },
        cache: 'no-store'
      }
    );

    if (!activityRes.ok) {
      return NextResponse.json({
        status: '❌ ERROR',
        code: activityRes.status,
        statusText: activityRes.statusText
      }, { status: activityRes.status });
    }

    const rawData = await activityRes.json();

    // ==========================================
    // ANÁLISIS DE ESTRUCTURA
    // ==========================================
    const activity = rawData?.activity || rawData;
    const totals = activity?.totals || {};
    const tasks = activity?.tasks || [];

    const timeFromTotals = totals.timeEngaged ?? 0;
    const timeFromTasks = tasks.reduce((acc: number, t: any) => 
      acc + (t.timeSpent ?? 0), 0
    );

    return NextResponse.json({
      status: '✅ ANÁLISIS COMPLETO',
      studentId,
      dateRange: { startDate, endDate },
      
      // Estructura raw
      rawStructure: {
        hasActivityWrapper: !!rawData?.activity,
        topLevelKeys: Object.keys(rawData),
        activityKeys: Object.keys(activity || {})
      },
      
      // Tiempo desde totals
      timeFromTotals: {
        seconds: timeFromTotals,
        minutes: Math.round(timeFromTotals / 60),
        hours: (timeFromTotals / 3600).toFixed(2)
      },
      
      // Tiempo sumando tasks
      timeFromTasks: {
        seconds: timeFromTasks,
        minutes: Math.round(timeFromTasks / 60),
        hours: (timeFromTasks / 3600).toFixed(2),
        numTasks: tasks.length
      },
      
      // Totals disponibles
      totalsAvailable: {
        xpAwarded: totals.xpAwarded ?? 0,
        numTasks: totals.numTasks ?? 0,
        questions: totals.questions ?? 0,
        questionsCorrect: totals.questionsCorrect ?? 0,
        timeEngaged: totals.timeEngaged ?? 0,
        timeProductive: totals.timeProductive ?? 0,
        timeElapsed: totals.timeElapsed ?? 0
      },
      
      // Muestra de 3 tasks
      sampleTasks: tasks.slice(0, 3).map((t: any) => ({
        topic: t.topic?.name,
        timeSpent: t.timeSpent,
        xpAwarded: t.xpAwarded,
        completedLocal: t.completedLocal,
        accuracy: `${t.questionsCorrect}/${t.questions}`
      }))
    });

  } catch (e: any) {
    return NextResponse.json({ 
      status: '❌ EXCEPTION',
      error: e.message,
      stack: e.stack
    }, { status: 500 });
  }
}



================================================
FILE: app/api/interventions/route.ts
================================================
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const docRef = await addDoc(collection(db, 'interventions'), {
      ...body,
      status: 'active',
      createdAt: serverTimestamp()
    });
    return NextResponse.json({ id: docRef.id });
  } catch (e) { return NextResponse.json({ error: 'Log failed' }, { status: 500 }); }
}

export async function GET() {
  try {
    const q = query(collection(db, 'interventions'), orderBy('createdAt', 'desc'), limit(50));
    const snap = await getDocs(q);
    const interventions = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return NextResponse.json({ interventions });
  } catch (e) { return NextResponse.json({ error: 'Fetch failed' }, { status: 500 }); }
}



================================================
FILE: app/api/update-students/route.ts
================================================
import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, writeBatch, getDoc, setDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { getStudentData } from '@/lib/mathAcademyAPI';
import { calculateTier1Metrics } from '@/lib/metrics';
import { calculateDRIMetrics } from '@/lib/dri-calculus';
import studentIds from '@/lib/student_ids.json'; 

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;
export const runtime = 'nodejs';
export const maxDuration = 60;

type DRITier = 'RED' | 'YELLOW' | 'GREEN';

interface TierChangeAlert {
  studentId: string;
  studentName: string;
  studentCourse: string;
  previousTier: DRITier;
  newTier: DRITier;
  direction: 'improved' | 'worsened';
  metricsSnapshot: {
    rsr: number;
    ksi: number | null;
    velocity: number;
    riskScore: number;
    der: number | null;
    pdi: number | null;
  };
  previousMetrics: {
    rsr: number;
    ksi: number | null;
    velocity: number;
    riskScore: number;
  };
  acknowledged: boolean;
  acknowledgedAt: null;
  acknowledgedBy: null;
  emailSent: boolean;
  emailSentAt: null;
  createdAt: ReturnType<typeof serverTimestamp>;
  syncBatchId: string;
}

function getChangeDirection(previousTier: DRITier, newTier: DRITier): 'improved' | 'worsened' {
  const tierOrder: Record<DRITier, number> = { 'RED': 0, 'YELLOW': 1, 'GREEN': 2 };
  return tierOrder[newTier] > tierOrder[previousTier] ? 'improved' : 'worsened';
}

async function createTierChangeAlert(
  studentId: string,
  studentName: string,
  studentCourse: string,
  previousTier: DRITier,
  newTier: DRITier,
  currentMetrics: any,
  currentDRI: any,
  previousMetrics: any,
  syncBatchId: string
): Promise<void> {
  const alert: TierChangeAlert = {
    studentId,
    studentName,
    studentCourse,
    previousTier,
    newTier,
    direction: getChangeDirection(previousTier, newTier),
    metricsSnapshot: {
      rsr: currentMetrics.lmp || 0,
      ksi: currentMetrics.ksi,
      velocity: currentMetrics.velocityScore || 0,
      riskScore: currentDRI.riskScore || 0,
      der: currentDRI.debtExposure,
      pdi: currentDRI.precisionDecay,
    },
    previousMetrics: {
      rsr: previousMetrics?.lmp || 0,
      ksi: previousMetrics?.ksi || null,
      velocity: previousMetrics?.velocityScore || 0,
      riskScore: previousMetrics?.riskScore || 0,
    },
    acknowledged: false,
    acknowledgedAt: null,
    acknowledgedBy: null,
    emailSent: false,
    emailSentAt: null,
    createdAt: serverTimestamp(),
    syncBatchId,
  };

  try {
    await addDoc(collection(db, 'alerts'), alert);
    console.log(`[ALERT] Tier change: ${studentName} ${previousTier} → ${newTier}`);
  } catch (error) {
    console.error(`[ALERT] Failed to create alert for ${studentName}:`, error);
  }
}

export async function GET(request: Request) {
  const requestTimestamp = new Date().toISOString();
  const syncBatchId = `sync_${Date.now()}`;
  console.log(`[update-students] Request started at ${requestTimestamp}, batchId: ${syncBatchId}`);

  try {
    const stateRef = doc(db, 'system', 'scheduler_state');
    const stateSnap = await getDoc(stateRef);
    let startIndex = stateSnap.exists() ? stateSnap.data().lastIndex || 0 : 0;

    if (startIndex >= studentIds.length) startIndex = 0;

    const endIndex = Math.min(startIndex + 50, studentIds.length);
    const currentBatchIds = studentIds.slice(startIndex, endIndex);

    console.log(`[update-students] Processing batch: ${startIndex} to ${endIndex} (${currentBatchIds.length} students)`);

    const alertsCreated: string[] = [];

    const updates = await Promise.all(
      currentBatchIds.map(async (id) => {
        try {
          const studentRef = doc(db, 'students', id.toString());
          const existingDoc = await getDoc(studentRef);
          const existingData = existingDoc.exists() ? existingDoc.data() : null;
          const previousTier: DRITier | null = existingData?.dri?.driTier || null;
          const previousMetrics = existingData?.metrics || null;
          const previousRiskScore = existingData?.dri?.riskScore || 0;

          const rawData = await getStudentData(id.toString());
          if (!rawData) {
            console.warn(`[update-students] No data for student ${id}`);
            return null;
          }

          const metrics = calculateTier1Metrics(rawData, rawData.activity || { tasks: [] });
          const dri = calculateDRIMetrics({ ...rawData, metrics });

          const newTier: DRITier = dri.driTier;

          if (previousTier && previousTier !== newTier) {
            await createTierChangeAlert(
              id.toString(),
              `${rawData.firstName} ${rawData.lastName}`,
              rawData.currentCourse?.name || 'Unknown',
              previousTier,
              newTier,
              metrics,
              dri,
              { ...previousMetrics, riskScore: previousRiskScore },
              syncBatchId
            );
            alertsCreated.push(`${rawData.firstName} ${rawData.lastName}: ${previousTier} → ${newTier}`);
          }

          return { 
            id: id.toString(), 
            data: { 
              ...rawData, 
              metrics,
              dri,
              lastUpdated: new Date().toISOString() 
            },
            studentName: `${rawData.firstName} ${rawData.lastName}`
          };
        } catch (e) {
          console.error(`[update-students] Error processing student ${id}:`, e);
          return null;
        }
      })
    );

    const batch = writeBatch(db);
    const todayStr = new Date().toISOString().split('T')[0];
    let lastStudentName = '';
    let successCount = 0;

    updates.forEach((item) => {
      if (item) {
        const ref = doc(db, 'students', item.id);
        batch.set(ref, item.data, { merge: true });
        
        const historyRef = doc(db, 'students', item.id, 'history', todayStr);
        batch.set(historyRef, {
            date: todayStr,
            metrics: item.data.metrics,
            dri: item.data.dri,
            courseName: item.data.currentCourse?.name
        }, { merge: true });
        
        lastStudentName = item.studentName;
        successCount++;
      }
    });

    await batch.commit();
    
    await setDoc(stateRef, { 
      lastIndex: endIndex, 
      total: studentIds.length,
      lastUpdated: new Date().toISOString(),
      lastBatchSuccess: successCount,
      lastSyncBatchId: syncBatchId,
      alertsCreatedThisBatch: alertsCreated.length
    }, { merge: true });

    const progress = Math.round((endIndex / studentIds.length) * 100);

    console.log(`[update-students] Batch completed: ${successCount}/${currentBatchIds.length} successful, progress: ${progress}%, alerts: ${alertsCreated.length}`);

    return NextResponse.json({ 
      success: true, 
      progress,
      nextIndex: endIndex,
      lastStudentName,
      batchSize: currentBatchIds.length,
      successCount,
      currentBatch: Math.ceil(endIndex / 50),
      totalBatches: Math.ceil(studentIds.length / 50),
      timestamp: requestTimestamp,
      syncBatchId,
      alertsCreated: alertsCreated.length,
      alerts: alertsCreated
    });

  } catch (error: any) {
    console.error('[update-students] Fatal error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message,
      progress: 0,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}



================================================
FILE: app/dashboard/page.tsx
================================================
'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query } from 'firebase/firestore';

// FUNCIÓN CLAVE: Extraer nombre real del email
function getNameFromEmail(email: string): string {
  if (!email) return '';
  const localPart = email.split('@')[0]; // "kavin.lopez"
  const parts = localPart.split(/[._-]/); // ["kavin", "lopez"]
  const capitalizedParts = parts.map(part => 
    part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
  );
  return capitalizedParts.join(' '); // "Kavin Lopez"
}

export default function DashboardPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [autoSync, setAutoSync] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'students'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setStudents(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const runUpdateBatch = async () => {
    setUpdating(true);
    try {
      const res = await fetch('/api/update-students');
      const data = await res.json();
      if (data.success && autoSync && data.progress < 100) {
        setTimeout(runUpdateBatch, 1500); 
      } else if (data.progress >= 100) {
        setAutoSync(false);
      }
    } catch (err) { setAutoSync(false); }
    setUpdating(false);
  };

  useEffect(() => {
    if (autoSync && !updating) runUpdateBatch();
  }, [autoSync]);

  // Cálculos Globales
  const stats = {
    atRisk: students.filter(s => (s.metrics?.dropoutProbability || 0) > 60).length,
    attention: students.filter(s => (s.metrics?.dropoutProbability || 0) >= 40 && (s.metrics?.dropoutProbability || 0) <= 60).length,
    onTrack: students.filter(s => (s.metrics?.dropoutProbability || 0) < 40).length,
    total: students.length
  };

  const filtered = students.filter(s => {
    const realName = getNameFromEmail(s.email || '');
    const rawName = `${s.firstName} ${s.lastName}`;
    const searchTerm = search.toLowerCase();
    return realName.toLowerCase().includes(searchTerm) || rawName.toLowerCase().includes(searchTerm);
  });

  if (loading) return <div className="p-8 bg-slate-950 min-h-screen text-emerald-500 font-mono italic animate-pulse">CONNECTING TO ALPHA COMMAND CENTER...</div>;

  return (
    <div className="p-6 bg-slate-950 min-h-screen text-slate-300 font-sans">
      
      {/* HEADER & SYNC */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-2xl font-black uppercase tracking-tighter text-white italic">Alpha Command Center</h1>
        <div className="flex gap-4 items-center">
            <div className="text-right">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Database Sync</div>
                <div className="text-emerald-500 font-mono font-bold">{stats.total} / 1613</div>
            </div>
            <button 
            onClick={() => setAutoSync(!autoSync)}
            className={`px-6 py-2 rounded-lg font-black text-[10px] tracking-widest transition-all ${
                autoSync ? 'bg-red-900/50 text-red-500 animate-pulse border border-red-500' : 'bg-emerald-600 text-white hover:bg-emerald-500'
            }`}
            >
            {autoSync ? '🛑 STOP SYNC' : '⚡ AUTO SYNC'}
            </button>
        </div>
      </div>

      {/* METRIC CARDS (Panel Superior) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-red-500/5 border border-red-500/20 p-4 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-1">Critical: At Risk</p>
            <h2 className="text-4xl font-black text-white">{stats.atRisk}</h2>
          </div>
          <div className="text-right text-xs text-red-400/50">High Dropout<br/>Probability</div>
        </div>
        <div className="bg-amber-500/5 border border-amber-500/20 p-4 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-1">Attention Needed</p>
            <h2 className="text-4xl font-black text-white">{stats.attention}</h2>
          </div>
          <div className="text-right text-xs text-amber-400/50">Stuck or<br/>Inconsistent</div>
        </div>
        <div className="bg-emerald-500/5 border border-emerald-500/20 p-4 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">On Track</p>
            <h2 className="text-4xl font-black text-white">{stats.onTrack}</h2>
          </div>
          <div className="text-right text-xs text-emerald-400/50">Optimal<br/>Performance</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* TABLA PRINCIPAL - 9 COLUMNAS */}
        <div className="lg:col-span-3 bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-md">
          <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/80">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">Student Registry</h3>
            <input 
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search Name..." 
              className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs w-64 focus:border-emerald-500 outline-none transition-colors"
            />
          </div>
          
          <div className="overflow-x-auto max-h-[700px]">
            <table className="w-full text-left text-[11px]">
              <thead className="sticky top-0 bg-slate-900 z-10 text-slate-500 font-bold border-b border-slate-800 uppercase tracking-tighter">
                <tr>
                  <th className="p-3">Student</th>
                  <th className="p-3">Course</th>
                  <th className="p-3 text-center">Progress</th>
                  <th className="p-3 text-center">XP Week</th>
                  <th className="p-3 text-center">Velocity</th>
                  <th className="p-3 text-center">Consistency</th>
                  <th className="p-3 text-center">Accuracy</th>
                  <th className="p-3 text-center">Stuck</th>
                  <th className="p-3 text-center">Risk</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {filtered.map((s) => {
                  const realName = getNameFromEmail(s.email || '');
                  const displayName = realName || `${s.firstName} ${s.lastName}`;
                  const m = s.metrics || {};
                  
                  return (
                    <tr key={s.id} className="hover:bg-slate-800/30 transition-colors group">
                      {/* 1. STUDENT */}
                      <td className="p-3">
                        <div className="font-bold text-slate-200 group-hover:text-emerald-400 transition-colors">{displayName}</div>
                        <div className="text-[9px] text-slate-600 font-mono">{s.email || s.id}</div>
                      </td>
                      
                      {/* 2. COURSE */}
                      <td className="p-3 text-slate-400">
                        <div className="font-bold">{s.currentCourse?.name || 'N/A'}</div>
                        <div className="text-[9px]">Grade {s.currentCourse?.grade || '?'}</div>
                      </td>

                      {/* 3. PROGRESS */}
                      <td className="p-3 text-center">
                        <div className="font-bold text-slate-200">{Math.round((s.currentCourse?.progress || 0) * 100)}%</div>
                        <div className="text-[9px] text-slate-600">{s.currentCourse?.xpRemaining || 0} XP left</div>
                      </td>

                      {/* 4. XP WEEK */}
                      <td className="p-3 text-center font-mono text-slate-300">
                        {s.activity?.xpAwarded || 0}
                      </td>

                      {/* 5. VELOCITY */}
                      <td className="p-3 text-center">
                        <span className={`px-2 py-1 rounded text-[10px] font-bold ${
                          m.velocityScore >= 80 ? 'bg-emerald-500/10 text-emerald-400' :
                          m.velocityScore >= 50 ? 'bg-amber-500/10 text-amber-400' :
                          'bg-red-500/10 text-red-400'
                        }`}>
                          {m.velocityScore}%
                        </span>
                      </td>

                      {/* 6. CONSISTENCY */}
                      <td className="p-3 text-center text-[10px] font-bold">
                         <span className={
                          m.consistencyIndex > 0.8 ? 'text-emerald-400' :
                          m.consistencyIndex > 0.5 ? 'text-amber-400' : 'text-red-400'
                         }>
                           {m.consistencyIndex > 0.8 ? 'HIGH' : m.consistencyIndex > 0.5 ? 'MED' : 'LOW'}
                         </span>
                      </td>

                      {/* 7. ACCURACY */}
                      <td className="p-3 text-center">
                         <span className={`font-bold ${
                          m.accuracyRate >= 70 ? 'text-emerald-400' :
                          m.accuracyRate >= 55 ? 'text-amber-400' : 'text-red-400'
                         }`}>
                           {m.accuracyRate}%
                         </span>
                      </td>

                      {/* 8. STUCK */}
                      <td className="p-3 text-center">
                         {m.stuckScore > 30 ? (
                           <span className="bg-red-500/20 text-red-400 px-2 py-0.5 rounded text-[10px] font-bold">{m.stuckScore}</span>
                         ) : (
                           <span className="text-slate-600 text-[10px]">-</span>
                         )}
                      </td>

                      {/* 9. RISK */}
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black border ${
                          m.dropoutProbability > 60 ? 'bg-red-900/40 text-red-400 border-red-500/30' :
                          m.dropoutProbability > 40 ? 'bg-amber-900/40 text-amber-400 border-amber-500/30' :
                          'text-slate-600 border-transparent'
                        }`}>
                          {m.dropoutProbability}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* PANEL DERECHO (Side Analysis) */}
        <div className="space-y-6">
          <div className="bg-slate-900/50 border border-slate-800 p-5 rounded-2xl backdrop-blur-md">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">🚨 Top Stuck Students</h3>
            <div className="space-y-3">
              {students
                .sort((a, b) => (b.metrics?.stuckScore || 0) - (a.metrics?.stuckScore || 0))
                .slice(0, 5)
                .map((s) => (
                  <div key={s.id} className="flex justify-between items-center text-[10px] border-l-2 border-red-500 pl-3">
                    <span className="text-slate-300 font-bold truncate w-24">{getNameFromEmail(s.email || '')}</span>
                    <span className="text-red-400 font-black">{s.metrics?.stuckScore}</span>
                  </div>
                ))}
            </div>
          </div>

          <div className="bg-slate-900/50 border border-slate-800 p-5 rounded-2xl backdrop-blur-md">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">⚠️ High Dropout Risk</h3>
             <div className="space-y-2">
              {students
                .filter(s => (s.metrics?.dropoutProbability || 0) > 80)
                .slice(0, 5)
                .map((s) => (
                   <div key={s.id} className="flex justify-between items-center p-2 bg-red-500/10 rounded border border-red-500/20">
                     <span className="text-[10px] text-red-200 font-bold truncate">{getNameFromEmail(s.email || '')}</span>
                     <span className="text-xs text-red-500 font-black">{s.metrics?.dropoutProbability}%</span>
                   </div>
                ))}
             </div>
          </div>
        </div>

      </div>
    </div>
  );
}



================================================
FILE: app/panel/page.tsx
================================================
'use client';

import { useState, useEffect, useMemo } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query } from 'firebase/firestore';
import StudentModal from '@/components/StudentModal';
import KeenKTMatrix from '@/components/KeenKTMatrix'; // Importación de la nueva Matrix
import { calculateTier1Metrics } from '@/lib/metrics';
import { calculateDRIMetrics } from '@/lib/dri-calculus';
import { Student } from '@/types';

export default function PanelPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const unsub = onSnapshot(query(collection(db, 'students')), (snapshot) => {
      const data = snapshot.docs.map(doc => {
        const s = { id: doc.id, ...doc.data() } as any;
        const metrics = calculateTier1Metrics(s, s.activity);
        const dri = calculateDRIMetrics({ ...s, metrics });
        return { ...s, metrics, dri };
      }) as Student[];
      setStudents(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const filtered = useMemo(() => students.filter(s => 
    `${s.firstName} ${s.lastName}`.toLowerCase().includes(search.toLowerCase())
  ), [students, search]);

  const redZone = filtered.filter(s => s.dri.driTier === 'RED');
  const yellowZone = filtered.filter(s => s.dri.driTier === 'YELLOW');
  const greenZone = filtered.filter(s => s.dri.driTier === 'GREEN' && (s.metrics?.accuracyRate || 0) > 0);

  if (loading) return <div className="p-10 bg-black min-h-screen text-emerald-500 font-mono italic animate-pulse tracking-widest uppercase">DRI Cockpit Initializing...</div>;

  return (
    <div className="p-6 bg-[#050505] min-h-screen text-slate-300 font-sans">
      {/* HEADER SECTION */}
      <div className="mb-8 border-b border-slate-800 pb-6 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-black uppercase italic text-white tracking-tighter">DRI COMMAND V3.8</h1>
            <p className="text-[10px] text-indigo-400 font-bold tracking-[0.3em] uppercase mt-1">Direct Instruction Triage Protocol</p>
          </div>
          <div className="flex gap-4">
            <div className="text-right">
              <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Global Matrix Density</p>
              <p className="text-xl font-mono font-black text-white">{students.length} UNITS</p>
            </div>
          </div>
      </div>

      <input 
        onChange={e => setSearch(e.target.value)} 
        placeholder="🔎 SEARCH UNIT BY NAME..." 
        className="w-full bg-slate-900/40 border border-slate-800 rounded-2xl px-6 py-4 mb-8 text-sm focus:border-indigo-500 outline-none font-mono" 
      />

      {/* MATRIX E INTERACTIVIDAD RLM */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
        <div className="lg:col-span-3 h-[600px]">
          {/* Implementación de la Matrix KeenKT */}
          <KeenKTMatrix 
            students={filtered} 
            onStudentClick={(s) => setSelectedStudent(s)} 
          />
        </div>

        {/* STATS RÁPIDAS AL LADO DE LA MATRIX */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-3xl">
            <p className="text-[9px] font-black text-red-500 uppercase mb-1">Critical Tier</p>
            <p className="text-3xl font-black text-white italic">{redZone.length}</p>
          </div>
          <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-3xl">
            <p className="text-[9px] font-black text-amber-500 uppercase mb-1">Watch List</p>
            <p className="text-3xl font-black text-white italic">{yellowZone.length}</p>
          </div>
          <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-3xl">
            <p className="text-[9px] font-black text-emerald-500 uppercase mb-1">Optimal Flow</p>
            <p className="text-3xl font-black text-white italic">{greenZone.length}</p>
          </div>
        </div>
      </div>

      {/* TRIAGE COLUMNS (Original) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-280px)] mt-12">
        {[
          { id: 'RED', label: '🚨 Critical Ops', data: redZone, color: 'text-red-500', border: 'border-red-500' },
          { id: 'YELLOW', label: '⚠️ Watch List', data: yellowZone, color: 'text-amber-500', border: 'border-amber-500' },
          { id: 'GREEN', label: '⚡ Honors Track', data: greenZone, color: 'text-emerald-500', border: 'border-emerald-500' }
        ].map(column => (
          <div key={column.id} className="flex flex-col bg-slate-900/20 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
            <div className="p-4 flex justify-between items-center bg-slate-900/40 border-b border-slate-800">
                <h2 className={`font-black text-[10px] uppercase tracking-widest ${column.color}`}>{column.label}</h2>
                <span className="bg-slate-800 text-slate-400 text-[9px] px-2 py-1 rounded font-mono font-black">{column.data.length} ALUMNOS</span>
            </div>
            <div className="p-4 space-y-3 overflow-y-auto custom-scrollbar">
              {column.data.map(s => (
                <div 
                  key={s.id} 
                  onClick={() => setSelectedStudent(s)} 
                  className={`p-4 bg-slate-900/80 rounded-2xl border-l-4 ${column.border} cursor-pointer hover:scale-[1.02] transition-all`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-black text-white text-sm uppercase italic truncate w-40">{s.firstName} {s.lastName}</h3>
                    <span className="text-[10px] font-mono font-bold text-slate-500 italic">{(s.metrics.lmp * 100).toFixed(0)}% LMP</span>
                  </div>
                  <p className="text-[9px] text-indigo-400/70 font-bold uppercase mb-2">{s.currentCourse.name}</p>
                  <div className="flex justify-between text-[10px] font-mono">
                    <span className="text-slate-600 uppercase text-[8px] font-black">Status: <span className={column.color}>{s.dri.driSignal}</span></span>
                    <span className="text-slate-600 italic">KSI: {s.metrics.ksi}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* MODAL DE ESTUDIANTE */}
      {selectedStudent && <StudentModal student={selectedStudent} onClose={() => setSelectedStudent(null)} />}
    </div>
  );
}



================================================
FILE: components/BulkActionsBar.tsx
================================================
'use client';

import { Student } from '@/types';

interface BulkActionsBarProps {
  selectedCount: number;
  selectedStudents: Student[];
  onClear: () => void;
  onExport: () => void;
}

export default function BulkActionsBar({ 
  selectedCount, 
  selectedStudents,
  onClear, 
  onExport 
}: BulkActionsBarProps) {
  // Calculate aggregate stats
  const avgRSR = selectedStudents.length > 0
    ? Math.round(selectedStudents.reduce((sum, s) => sum + (s.metrics.lmp * 100), 0) / selectedStudents.length)
    : 0;
  
  const avgVelocity = selectedStudents.length > 0
    ? Math.round(selectedStudents.reduce((sum, s) => sum + s.metrics.velocityScore, 0) / selectedStudents.length)
    : 0;

  const tierBreakdown = {
    red: selectedStudents.filter(s => s.dri.driTier === 'RED').length,
    yellow: selectedStudents.filter(s => s.dri.driTier === 'YELLOW').length,
    green: selectedStudents.filter(s => s.dri.driTier === 'GREEN').length,
  };

  return (
    <div className="flex-shrink-0 mx-6 mb-2 p-4 bg-indigo-900/30 border border-indigo-500/50 rounded-2xl flex items-center justify-between gap-4 animate-in slide-in-from-top duration-300">
      <div className="flex items-center gap-6">
        {/* Selection Count */}
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-indigo-500 flex items-center justify-center text-white font-black text-lg">
            {selectedCount}
          </div>
          <div>
            <p className="text-sm font-bold text-white">Students Selected</p>
            <p className="text-[10px] text-indigo-300">
              <span className="text-red-400">{tierBreakdown.red} Red</span>
              {' • '}
              <span className="text-amber-400">{tierBreakdown.yellow} Yellow</span>
              {' • '}
              <span className="text-emerald-400">{tierBreakdown.green} Green</span>
            </p>
          </div>
        </div>

        {/* Aggregate Stats */}
        <div className="hidden md:flex items-center gap-4 pl-6 border-l border-indigo-500/30">
          <div className="text-center">
            <p className="text-[9px] text-indigo-300 uppercase">Avg RSR</p>
            <p className="text-lg font-black text-white">{avgRSR}%</p>
          </div>
          <div className="text-center">
            <p className="text-[9px] text-indigo-300 uppercase">Avg Velocity</p>
            <p className="text-lg font-black text-white">{avgVelocity}%</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={onExport}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black uppercase rounded-lg transition-colors flex items-center gap-2"
        >
          <span>📊</span>
          Export CSV
        </button>
        
        <button
          onClick={onClear}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-400 text-[10px] font-black uppercase rounded-lg transition-colors"
        >
          ✕ Clear
        </button>
      </div>
    </div>
  );
}



================================================
FILE: components/CoachInterventionModal.tsx
================================================
'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Student } from '@/types';

interface CoachInterventionModalProps {
  student: Student;
  onClose: () => void;
  onSuccess: () => void;
}

// Predefined coaches - can be extended or fetched from DB
const COACHES = [
  'Sebastián Sarmiento',
  'Coach Alpha',
  'Coach Beta',
  'Other'
];

// Predefined objectives
const OBJECTIVES = [
  'Improve RSR (Recent Success Rate)',
  'Address Knowledge Gaps (High DER)',
  'Increase Engagement/Velocity',
  'Study Habits & Time Management',
  'Motivation & Mindset',
  'Technical Support',
  'Parent Communication',
  'Course Placement Review',
  'Other'
];

export default function CoachInterventionModal({ 
  student, 
  onClose,
  onSuccess 
}: CoachInterventionModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  
  // Form state
  const [coachName, setCoachName] = useState('');
  const [customCoach, setCustomCoach] = useState('');
  const [interventionDate, setInterventionDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [objective, setObjective] = useState('');
  const [customObjective, setCustomObjective] = useState('');
  const [whatWasDone, setWhatWasDone] = useState('');
  const [whatWasAchieved, setWhatWasAchieved] = useState('');
  const [nextSteps, setNextSteps] = useState('');
  const [notes, setNotes] = useState('');

  // Keyboard handler
  useEffect(() => {
    const handleKeyboard = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyboard);
    return () => window.removeEventListener('keydown', handleKeyboard);
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    const finalCoach = coachName === 'Other' ? customCoach.trim() : coachName;
    const finalObjective = objective === 'Other' ? customObjective.trim() : objective;

    if (!finalCoach) {
      setError('Please select or enter a coach name');
      return;
    }
    if (!finalObjective) {
      setError('Please select or enter an objective');
      return;
    }
    if (!whatWasDone.trim()) {
      setError('Please describe what was done during the intervention');
      return;
    }

    setIsSubmitting(true);

    try {
      await addDoc(collection(db, 'interventions'), {
        // Student info
        studentId: student.id,
        studentName: `${student.firstName} ${student.lastName}`,
        studentCourse: student.currentCourse?.name || 'Unknown',
        studentTier: student.dri.driTier,
        studentRiskScore: student.dri.riskScore,
        
        // Intervention details
        coachName: finalCoach,
        interventionDate: new Date(interventionDate),
        objective: finalObjective,
        
        // Breakdown
        whatWasDone: whatWasDone.trim(),
        whatWasAchieved: whatWasAchieved.trim(),
        nextSteps: nextSteps.trim(),
        notes: notes.trim(),
        
        // Metadata
        type: 'coaching',
        status: 'completed',
        createdAt: serverTimestamp(),
        
        // Student metrics at time of intervention (for tracking progress)
        metricsSnapshot: {
          rsr: student.metrics.lmp,
          ksi: student.metrics.ksi,
          velocity: student.metrics.velocityScore,
          accuracy: student.metrics.accuracyRate,
          riskScore: student.dri.riskScore,
          der: student.dri.debtExposure,
          pdi: student.dri.precisionDecay,
        }
      });

      setShowSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error('Error saving intervention:', err);
      setError(`Failed to save: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showSuccess) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 animate-in fade-in duration-200">
        <div className="bg-emerald-900/30 border border-emerald-500/50 p-8 rounded-3xl text-center animate-in zoom-in-95 duration-300">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <span className="text-4xl">✓</span>
          </div>
          <h3 className="text-xl font-black text-emerald-400 uppercase">Intervention Saved!</h3>
          <p className="text-sm text-emerald-300/70 mt-2">
            Coaching session for {student.firstName} has been logged.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={onClose} />
      
      <div className="bg-[#0a0a0a] border border-slate-800 w-full max-w-2xl max-h-[90vh] rounded-3xl relative z-10 flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex-shrink-0 p-5 border-b border-slate-800 bg-gradient-to-b from-indigo-900/20 to-transparent">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-black text-white uppercase italic tracking-tight">
                📝 Log Coach Intervention
              </h2>
              <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest mt-1">
                {student.firstName} {student.lastName} • {student.currentCourse?.name}
              </p>
            </div>
            <button 
              onClick={onClose}
              className="text-slate-600 hover:text-white text-xl transition-colors p-2 hover:bg-slate-800 rounded-lg"
            >
              ✕
            </button>
          </div>
          
          {/* Student Quick Stats */}
          <div className="flex gap-2 mt-3 text-[9px] font-mono flex-wrap">
            <span className={`px-2 py-1 rounded ${
              student.dri.driTier === 'RED' ? 'bg-red-500/20 text-red-400' :
              student.dri.driTier === 'YELLOW' ? 'bg-amber-500/20 text-amber-400' :
              'bg-emerald-500/20 text-emerald-400'
            }`}>
              {student.dri.driTier}
            </span>
            <span className="px-2 py-1 rounded bg-slate-800 text-slate-400">
              RSR: {(student.metrics.lmp * 100).toFixed(0)}%
            </span>
            <span className="px-2 py-1 rounded bg-slate-800 text-slate-400">
              Risk: {student.dri.riskScore}/100
            </span>
            <span className="px-2 py-1 rounded bg-slate-800 text-slate-400">
              Vel: {student.metrics.velocityScore}%
            </span>
            {student.dri.debtExposure !== null && (
              <span className="px-2 py-1 rounded bg-slate-800 text-slate-400">
                DER: {student.dri.debtExposure}%
              </span>
            )}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar">
          
          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-900/30 border border-red-500/50 rounded-xl text-sm text-red-400 flex items-center gap-2">
              <span>⚠️</span> {error}
            </div>
          )}

          {/* Row 1: Coach & Date */}
          <div className="grid grid-cols-2 gap-4">
            {/* Coach Name */}
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
                Coach Name <span className="text-red-500">*</span>
              </label>
              <select
                value={coachName}
                onChange={(e) => setCoachName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-indigo-500 transition-colors"
              >
                <option value="">Select coach...</option>
                {COACHES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              {coachName === 'Other' && (
                <input
                  type="text"
                  value={customCoach}
                  onChange={(e) => setCustomCoach(e.target.value)}
                  placeholder="Enter coach name..."
                  className="w-full mt-2 bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-indigo-500"
                />
              )}
            </div>

            {/* Date */}
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
                Intervention Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={interventionDate}
                onChange={(e) => setInterventionDate(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Objective */}
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
              Intervention Objective <span className="text-red-500">*</span>
            </label>
            <select
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-indigo-500"
            >
              <option value="">Select objective...</option>
              {OBJECTIVES.map(o => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
            {objective === 'Other' && (
              <input
                type="text"
                value={customObjective}
                onChange={(e) => setCustomObjective(e.target.value)}
                placeholder="Enter custom objective..."
                className="w-full mt-2 bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-indigo-500"
              />
            )}
          </div>

          {/* What Was Done */}
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
              What Was Done? <span className="text-red-500">*</span>
            </label>
            <textarea
              value={whatWasDone}
              onChange={(e) => setWhatWasDone(e.target.value)}
              placeholder="Describe the activities, conversations, or exercises conducted during the intervention..."
              rows={3}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-indigo-500 resize-none"
            />
            <p className="text-[9px] text-slate-600 mt-1">
              Examples: 1-on-1 conversation, reviewed problem areas, practiced specific topics, discussed goals...
            </p>
          </div>

          {/* What Was Achieved */}
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
              What Was Achieved?
            </label>
            <textarea
              value={whatWasAchieved}
              onChange={(e) => setWhatWasAchieved(e.target.value)}
              placeholder="Outcomes, breakthroughs, or progress observed during or after the session..."
              rows={3}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-indigo-500 resize-none"
            />
            <p className="text-[9px] text-slate-600 mt-1">
              Examples: Student understood concept, showed motivation, identified root cause...
            </p>
          </div>

          {/* Next Steps */}
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
              Next Steps / Continue Working On
            </label>
            <textarea
              value={nextSteps}
              onChange={(e) => setNextSteps(e.target.value)}
              placeholder="Action items, follow-up tasks, or areas that need continued attention..."
              rows={3}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-indigo-500 resize-none"
            />
            <p className="text-[9px] text-slate-600 mt-1">
              Examples: Schedule follow-up in 1 week, focus on Algebra topics, contact parents...
            </p>
          </div>

          {/* Additional Notes */}
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
              Additional Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any other observations, concerns, or context..."
              rows={2}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-indigo-500 resize-none"
            />
          </div>
        </form>

        {/* Footer */}
        <div className="flex-shrink-0 p-5 border-t border-slate-800 bg-slate-900/30 flex justify-between items-center">
          <p className="text-[9px] text-slate-600">
            <span className="text-red-500">*</span> Required fields
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-400 text-[10px] font-black uppercase rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 disabled:cursor-not-allowed text-white text-[10px] font-black uppercase rounded-xl transition-colors flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  💾 Save Intervention
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}



================================================
FILE: components/HelpModal.tsx
================================================
'use client';

import { useEffect } from 'react';

interface HelpModalProps {
  onClose: () => void;
}

export default function HelpModal({ onClose }: HelpModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl p-4 animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="bg-[#0a0a0a] border border-slate-800 w-full max-w-2xl rounded-3xl relative z-10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-gradient-to-b from-slate-900/50 to-transparent">
          <div>
            <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">Help & Shortcuts</h2>
            <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest mt-1">DRI Command Center V5.4</p>
          </div>
          <button 
            onClick={onClose} 
            className="text-slate-600 hover:text-white text-2xl transition-colors p-2 hover:bg-slate-800 rounded-lg"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
          
          {/* Keyboard Shortcuts */}
          <section>
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
              ⌨️ Keyboard Shortcuts
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { key: '1', action: 'Switch to TRIAGE view' },
                { key: '2', action: 'Switch to MATRIX view' },
                { key: '3', action: 'Switch to HEATMAP view' },
                { key: '4', action: 'Switch to LOG view' },
                { key: '/', action: 'Focus search input' },
                { key: '?', action: 'Open this help modal' },
                { key: 'Esc', action: 'Close modal / Exit selection' },
                { key: '← →', action: 'Navigate students in modal' },
                { key: 'h', action: 'Toggle compact header' },
                { key: 'c', action: 'Clear all filters' },
                { key: 'Ctrl+A', action: 'Select all visible students' },
                { key: 'Ctrl+I', action: 'Log intervention (in modal)' },
              ].map(({ key, action }) => (
                <div key={key} className="flex items-center gap-3 p-3 bg-slate-900/40 rounded-xl border border-slate-800">
                  <kbd className="bg-slate-800 text-indigo-400 px-2 py-1 rounded text-xs font-mono font-bold min-w-[50px] text-center">
                    {key}
                  </kbd>
                  <span className="text-[11px] text-slate-400">{action}</span>
                </div>
              ))}
            </div>
          </section>

          {/* New Feature: Coach Interventions */}
          <section>
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
              📝 Coach Interventions
            </h3>
            <div className="p-4 bg-indigo-950/20 border border-indigo-500/30 rounded-xl space-y-3">
              <p className="text-[11px] text-indigo-200">
                Log detailed coaching sessions for any student to track interventions over time.
              </p>
              <div className="space-y-2 text-[10px] text-slate-400">
                <div className="flex items-start gap-2">
                  <span className="text-indigo-400">1.</span>
                  <span>Click on any student card to open their profile</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-indigo-400">2.</span>
                  <span>Click "📝 Log Intervention" button (or press Ctrl+I)</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-indigo-400">3.</span>
                  <span>Fill in: Coach name, date, objective, what was done, outcomes, and next steps</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-indigo-400">4.</span>
                  <span>View intervention history in the "Interventions" tab</span>
                </div>
              </div>
            </div>
          </section>

          {/* Persistent Filters */}
          <section>
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
              🔍 Persistent Filters
            </h3>
            <div className="p-4 bg-purple-950/20 border border-purple-500/30 rounded-xl space-y-2">
              <p className="text-[11px] text-purple-200">
                Search and course filters now persist across view changes.
              </p>
              <ul className="text-[10px] text-slate-400 space-y-1">
                <li>• Filters apply to TRIAGE, MATRIX, and LOG views</li>
                <li>• Active filters shown below the search bar</li>
                <li>• Press <kbd className="bg-slate-800 px-1 rounded">c</kbd> to clear all filters</li>
                <li>• Click ✕ on individual filter tags to remove them</li>
              </ul>
            </div>
          </section>

          {/* Metrics Glossary */}
          <section>
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
              📊 Metrics Glossary
            </h3>
            <div className="space-y-3">
              {[
                { 
                  acronym: 'RSR', 
                  name: 'Recent Success Rate', 
                  description: 'Proportion of recent tasks with >80% accuracy. Measures immediate performance.',
                  threshold: '< 60% = Critical'
                },
                { 
                  acronym: 'KSI', 
                  name: 'Knowledge Stability Index', 
                  description: 'Measures consistency of performance over time. Low KSI = volatile accuracy.',
                  threshold: '< 50% = Critical'
                },
                { 
                  acronym: 'DER', 
                  name: 'Debt Exposure Ratio', 
                  description: 'Percentage of K-8 topics mastered during High School. Indicates remedial learning.',
                  threshold: '> 20% = Critical'
                },
                { 
                  acronym: 'PDI', 
                  name: 'Precision Decay Index', 
                  description: 'Ratio of recent errors to early errors. Higher = performance declining over time.',
                  threshold: '> 1.5x = Warning'
                },
                { 
                  acronym: 'iROI', 
                  name: 'Investment Return on Investment', 
                  description: 'XP earned per second of engagement. Measures learning efficiency.',
                  threshold: '< 0.3 = Low productivity'
                },
                { 
                  acronym: 'Velocity', 
                  name: 'Weekly XP Progress', 
                  description: `Percentage of weekly XP goal achieved. 100% = 125 XP/week standard.`,
                  threshold: '< 30% = Critical'
                },
              ].map(({ acronym, name, description, threshold }) => (
                <div key={acronym} className="p-4 bg-slate-900/40 rounded-xl border border-slate-800">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-indigo-400 font-black text-sm">{acronym}</span>
                    <span className="text-slate-500 text-[10px]">—</span>
                    <span className="text-white font-bold text-[11px]">{name}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mb-2">{description}</p>
                  <div className="text-[9px] text-amber-500 font-mono">{threshold}</div>
                </div>
              ))}
            </div>
          </section>

          {/* Risk Tiers */}
          <section>
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
              🚦 Risk Classification
            </h3>
            <div className="space-y-2">
              <div className="flex items-center gap-3 p-3 bg-red-500/10 rounded-xl border border-red-500/30">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div>
                  <span className="text-red-400 font-bold text-xs">RED / Critical</span>
                  <p className="text-[10px] text-slate-500">Risk Score ≥ 60, or RSR &lt; 60% with high risk factors</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-amber-500/10 rounded-xl border border-amber-500/30">
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <div>
                  <span className="text-amber-400 font-bold text-xs">YELLOW / Watch</span>
                  <p className="text-[10px] text-slate-500">Risk Score 35-59, needs attention but not critical</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/30">
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <div>
                  <span className="text-emerald-400 font-bold text-xs">GREEN / Optimal</span>
                  <p className="text-[10px] text-slate-500">Risk Score &lt; 35, performing well with stable metrics</p>
                </div>
              </div>
            </div>
          </section>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/30">
          <p className="text-[9px] text-slate-600 text-center font-mono">
            Press <kbd className="bg-slate-800 px-1 rounded">Esc</kbd> or click outside to close
          </p>
        </div>
      </div>
    </div>
  );
}



================================================
FILE: components/InterventionLogView.tsx
================================================
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



================================================
FILE: components/KeenKTMatrix.tsx
================================================
'use client';

import React, { useMemo, useState } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { driColorToHex } from '@/lib/color-utils';
import { Student } from '@/types';

interface MatrixProps {
  students: Student[];
  onStudentClick: (student: Student) => void;
}

export default function KeenKTMatrix({ students, onStudentClick }: MatrixProps) {
  const [filterTier, setFilterTier] = useState<'RED' | 'YELLOW' | 'GREEN' | null>(null);

  // Count by tier for filter buttons
  const tierCounts = useMemo(() => ({
    RED: students.filter(s => s.dri.driTier === 'RED').length,
    YELLOW: students.filter(s => s.dri.driTier === 'YELLOW').length,
    GREEN: students.filter(s => s.dri.driTier === 'GREEN').length,
  }), [students]);

  // Data processing with memoization for performance (1,613 points)
  const data = useMemo(() => {
    return students
      .filter(s => !filterTier || s.dri.driTier === filterTier)
      .map(s => ({
        x: s.metrics.lmp * 100,
        y: s.metrics.ksi,
        z: s.dri.riskScore || 50,
        name: `${s.firstName} ${s.lastName}`,
        tier: s.dri.driTier,
        color: driColorToHex(s.dri.driColor),
        course: s.currentCourse?.name,
        raw: s
      }));
  }, [students, filterTier]);

  // Optimized dot component
  const CustomDot = (props: any) => {
    const { cx, cy, payload } = props;
    const isCritical = payload.tier === 'RED';
    
    return (
      <g>
        {isCritical && (
          <circle cx={cx} cy={cy} r={8} fill={payload.color} fillOpacity={0.2}>
            <animate attributeName="r" values="6;12;6" dur="2s" repeatCount="indefinite" />
          </circle>
        )}
        <circle 
          cx={cx} cy={cy} r={isCritical ? 5 : 3.5} 
          fill={payload.color} 
          fillOpacity={isCritical ? 1 : 0.6}
          className="cursor-pointer hover:stroke-white stroke-1 transition-all"
          onClick={() => onStudentClick(payload.raw)}
        />
      </g>
    );
  };

  return (
    <div className="h-full w-full flex flex-col bg-slate-900/10 border border-slate-800 rounded-[2.5rem] p-6 backdrop-blur-sm">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-black italic text-white uppercase tracking-tighter">KeenKT Strategy Matrix</h2>
          <p className="text-[10px] text-slate-500 font-bold tracking-widest uppercase">
            Visualizing {data.length} Students • RLM Architecture
          </p>
        </div>
        
        {/* Filter buttons with counters */}
        <div className="flex gap-2 bg-black/40 p-1 rounded-full border border-slate-800">
          {(['RED', 'YELLOW', 'GREEN'] as const).map(t => (
            <button 
              key={t}
              onClick={() => setFilterTier(filterTier === t ? null : t)}
              className={`px-3 py-1 rounded-full text-[9px] font-black transition-all flex items-center gap-1 ${
                filterTier === t 
                  ? 'bg-white text-black' 
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${
                t === 'RED' ? 'bg-red-500' : t === 'YELLOW' ? 'bg-amber-500' : 'bg-emerald-500'
              }`} />
              {t}
              <span className={`text-[8px] px-1 rounded ${
                filterTier === t ? 'bg-black/20' : 'bg-slate-800'
              }`}>
                {tierCounts[t]}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 min-h-[450px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} opacity={0.5} />
            <XAxis 
              type="number" dataKey="x" name="Mastery" unit="%" 
              domain={[0, 100]} stroke="#475569" fontSize={10} tick={{fill: '#475569'}}
              label={{ value: 'MASTERY (RSR %)', position: 'insideBottomRight', offset: -10, fill: '#64748b', fontSize: 9, fontWeight: 'bold' }}
            />
            <YAxis 
              type="number" dataKey="y" name="Stability" unit="%" 
              domain={[0, 100]} stroke="#475569" fontSize={10} tick={{fill: '#475569'}}
              label={{ value: 'STABILITY (KSI %)', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 9, fontWeight: 'bold' }}
            />
            <ZAxis type="number" dataKey="z" range={[50, 400]} />
            
            <Tooltip 
              cursor={{ strokeDasharray: '3 3', stroke: '#334155' }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const s = payload[0].payload.raw;
                return (
                  <div className="bg-slate-950 border border-slate-700 p-3 rounded-xl shadow-2xl min-w-[180px]">
                    <p className="text-white font-black uppercase text-[11px] mb-1">{payload[0].payload.name}</p>
                    <p className="text-indigo-400 text-[9px] mb-2 font-bold uppercase">{payload[0].payload.course}</p>
                    <div className="grid grid-cols-2 gap-2 border-t border-slate-800 pt-2">
                      <div className="text-[9px]">
                        <span className="text-slate-500">RSR</span>
                        <span className="text-white font-bold ml-1">{(s.metrics.lmp * 100).toFixed(0)}%</span>
                      </div>
                      <div className="text-[9px]">
                        <span className="text-slate-500">KSI</span>
                        <span className="text-white font-bold ml-1">{s.metrics.ksi}%</span>
                      </div>
                      <div className="text-[9px]">
                        <span className="text-slate-500">Risk</span>
                        <span className="text-red-400 font-bold ml-1">{s.dri.riskScore}</span>
                      </div>
                      <div className="text-[9px]">
                        <span className="text-slate-500">PDI</span>
                        <span className="text-white font-bold ml-1">{s.dri.precisionDecay}x</span>
                      </div>
                    </div>
                    <div className="mt-2 pt-2 border-t border-slate-800 text-[8px] text-slate-600 text-center">
                      Click to view details
                    </div>
                  </div>
                );
              }}
            />
            <Scatter data={data} shape={<CustomDot />} isAnimationActive={false} />
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      {/* Quadrant Legend */}
      <div className="mt-4 grid grid-cols-2 gap-4 border-t border-slate-800 pt-4">
        <div className="text-[8px] text-slate-600 uppercase font-bold tracking-tighter">
          Top-Right: <span className="text-emerald-500">Mastery Flow (Optimal)</span>
        </div>
        <div className="text-[8px] text-slate-600 uppercase font-bold tracking-tighter">
          Bottom-Left: <span className="text-red-500">Critical Debt (Intervene)</span>
        </div>
      </div>
    </div>
  );
}



================================================
FILE: components/LoadingSkeleton.tsx
================================================
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



================================================
FILE: components/StudentModal.tsx
================================================
'use client';

import { useMemo, useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Bar, BarChart } from 'recharts';
import { DRI_CONFIG } from '@/lib/dri-config';
import Tooltip from '@/components/Tooltip';
import CoachInterventionModal from '@/components/CoachInterventionModal';
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';

// ==========================================
// METRIC DEFINITIONS
// ==========================================
const METRIC_INFO = {
  rsr: { name: 'Recent Success Rate', desc: 'Proportion of recent tasks with >80% accuracy' },
  ksi: { name: 'Knowledge Stability Index', desc: 'Consistency of performance over time' },
  der: { name: 'Debt Exposure Ratio', desc: '% of K-8 topics mastered during High School' },
  pdi: { name: 'Precision Decay Index', desc: 'Ratio of recent errors to early errors' },
  iroi: { name: 'Investment ROI', desc: 'XP earned per second of engagement' },
  velocity: { name: 'Velocity', desc: 'Weekly XP progress toward goal' },
  accuracy: { name: 'Accuracy', desc: 'Overall accuracy across all tasks' },
  focus: { name: 'Focus Integrity', desc: 'Measure of sustained attention' },
  risk: { name: 'Risk Score', desc: 'Composite score from multiple factors' },
};

// ==========================================
// COLLAPSIBLE SECTION COMPONENT
// ==========================================
function CollapsibleSection({ 
  title, 
  icon, 
  children, 
  defaultOpen = true,
  badge,
}: { 
  title: string; 
  icon: string; 
  children: React.ReactNode; 
  defaultOpen?: boolean;
  badge?: string | number;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border border-slate-800 rounded-2xl overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-4 bg-slate-900/40 flex items-center justify-between hover:bg-slate-900/60 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span>{icon}</span>
          <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{title}</span>
          {badge !== undefined && (
            <span className="px-2 py-0.5 bg-indigo-500/20 border border-indigo-500/30 rounded text-[9px] text-indigo-300 font-bold">
              {badge}
            </span>
          )}
        </div>
        <span className={`text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>
      {isOpen && (
        <div className="p-4 animate-in slide-in-from-top-2 duration-200">
          {children}
        </div>
      )}
    </div>
  );
}

interface StudentModalProps {
  student: any;
  onClose: () => void;
  onNavigate?: (direction: 'prev' | 'next') => void;
  currentIndex?: number;
  totalStudents?: number;
}

export default function StudentModal({ 
  student, 
  onClose, 
  onNavigate,
  currentIndex = -1,
  totalStudents = 0
}: StudentModalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'interventions'>('overview');
  const [showInterventionModal, setShowInterventionModal] = useState(false);
  const [interventionSaved, setInterventionSaved] = useState(false);
  const [studentInterventions, setStudentInterventions] = useState<any[]>([]);

  const tasks = student?.activity?.tasks || [];

  // Fetch interventions for this student
  useEffect(() => {
    const q = query(
      collection(db, 'interventions'),
      where('studentId', '==', student.id),
      orderBy('createdAt', 'desc'),
      limit(10)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setStudentInterventions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    
    return () => unsubscribe();
  }, [student.id]);

  useEffect(() => {
    const handleKeyboard = (e: KeyboardEvent) => {
      // Don't handle if intervention modal is open
      if (showInterventionModal) return;
      
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        onNavigate?.('next');
      }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        onNavigate?.('prev');
      }
      if (e.key === 'Escape') {
        onClose();
      }
      // Quick shortcut for logging intervention
      if (e.key === 'i' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        setShowInterventionModal(true);
      }
    };
    window.addEventListener('keydown', handleKeyboard);
    return () => window.removeEventListener('keydown', handleKeyboard);
  }, [onNavigate, onClose, showInterventionModal]);

  // Reset saved indicator when student changes
  useEffect(() => {
    setInterventionSaved(false);
  }, [student.id]);

  // ==========================================
  // READY TO ACCELERATE
  // ==========================================
  const readyToAccelerate = useMemo((): string[] => {
    const topics = tasks
      .filter((t: any) => (t.questionsCorrect / (t.questions || 1)) > 0.7)
      .map((t: any) => t.topic?.name || 'Unknown Topic');
    return Array.from(new Set(topics)).slice(0, 3) as string[];
  }, [tasks]);

  // ==========================================
  // STRUGGLE TOPICS
  // ==========================================
  const struggleTopics = useMemo((): string[] => {
    const topics = tasks
      .filter((t: any) => (t.questionsCorrect / (t.questions || 1)) < 0.5)
      .map((t: any) => t.topic?.name || 'Unknown Topic');
    return Array.from(new Set(topics)).slice(0, 3) as string[];
  }, [tasks]);

  // ==========================================
  // DATA FOR TABLE
  // ==========================================
  const sortedData = useMemo(() => {
    return tasks.map((t: any) => {
      const dateObj = new Date(t.completedLocal);
      return {
        id: t.id,
        timestamp: dateObj.getTime(),
        acc: Math.round((t.questionsCorrect / (t.questions || 1)) * 100),
        topic: t.topic?.name || 'Session Task',
        questions: t.questions || 0,
        correct: t.questionsCorrect || 0,
        date: dateObj.toLocaleDateString('en-US', { day: '2-digit', month: '2-digit' }),
        time: Math.round((t.timeTotal || 0) / 60),
        xp: t.xpAwarded || 0
      };
    }).sort((a: any, b: any) => b.timestamp - a.timestamp);
  }, [tasks]);

  const chartData = useMemo(() => 
    [...sortedData].reverse().map((d, i) => ({ ...d, i: i + 1 })), 
  [sortedData]);

  // ==========================================
  // WEEKLY ACTIVITY PATTERN
  // ==========================================
  const weeklyPattern = useMemo(() => {
    const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const pattern = daysOfWeek.map(day => ({ day, tasks: 0, xp: 0 }));
    
    tasks.forEach((t: any) => {
      const date = new Date(t.completedLocal);
      const dayIndex = (date.getDay() + 6) % 7;
      pattern[dayIndex].tasks++;
      pattern[dayIndex].xp += t.xpAwarded || 0;
    });
    
    return pattern;
  }, [tasks]);

  const rsrDisplay = isNaN(student.metrics.lmp) ? '0%' : `${(student.metrics.lmp * 100).toFixed(0)}%`;
  const velocityInXP = Math.round((student.metrics.velocityScore / 100) * DRI_CONFIG.ALPHA_WEEKLY_STANDARD);

  const handleInterventionSuccess = () => {
    setInterventionSaved(true);
    setTimeout(() => setInterventionSaved(false), 3000);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 animate-in fade-in duration-200">
        <div className="absolute inset-0" onClick={onClose} />
        <div className="bg-[#080808] border border-slate-800 w-full max-w-6xl h-[85vh] rounded-[2.5rem] relative z-10 flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
          
          {/* ========================================== */}
          {/* HEADER - SIMPLIFIED */}
          {/* ========================================== */}
          <div className="p-5 border-b border-slate-800 flex justify-between items-start bg-gradient-to-b from-slate-900/50 to-transparent">
            <div className="flex gap-4 items-center flex-1">
              {/* Velocity Badge */}
              <Tooltip content={METRIC_INFO.velocity.desc}>
                <div className={`w-16 h-16 rounded-xl border-4 flex flex-col items-center justify-center font-black italic cursor-help ${
                  student.dri.driTier === 'RED' ? 'border-red-500 text-red-500 bg-red-500/10' : 
                  student.dri.driTier === 'YELLOW' ? 'border-amber-500 text-amber-500 bg-amber-500/10' :
                  'border-emerald-500 text-emerald-500 bg-emerald-500/10'
                }`}>
                  <span className="text-xl">{student.metrics.velocityScore || 0}</span>
                  <span className="text-[7px] opacity-60 uppercase">Vel</span>
                </div>
              </Tooltip>
              
              <div className="flex-1">
                <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase">
                  {student.firstName} {student.lastName}
                </h2>
                
                <div className="flex flex-wrap gap-2 mt-2 text-[9px] font-black uppercase">
                  <span className={`px-2 py-1 rounded-full border border-current ${student.dri.driColor}`}>
                    {student.dri.driSignal}
                  </span>
                  <span className="px-2 py-1 rounded-full border border-indigo-500/30 text-indigo-400 bg-indigo-500/10">
                    {student.currentCourse?.name}
                  </span>
                  {student.dri.riskScore !== undefined && (
                    <Tooltip content={METRIC_INFO.risk.desc}>
                      <span className={`px-2 py-1 rounded-full border cursor-help ${
                        student.dri.riskScore >= 60 ? 'border-red-500 text-red-400 bg-red-500/10' :
                        student.dri.riskScore >= 35 ? 'border-amber-500 text-amber-400 bg-amber-500/10' :
                        'border-emerald-500 text-emerald-400 bg-emerald-500/10'
                      }`}>
                        Risk: {student.dri.riskScore}
                      </span>
                    </Tooltip>
                  )}
                  {interventionSaved && (
                    <span className="px-2 py-1 rounded-full border border-emerald-500 text-emerald-400 bg-emerald-500/10 animate-pulse">
                      ✓ Intervention Saved
                    </span>
                  )}
                </div>
                
                <div className="mt-1 flex gap-3 text-[9px] text-slate-500 font-mono">
                  <span>{velocityInXP} / {DRI_CONFIG.ALPHA_WEEKLY_STANDARD} XP/wk</span>
                  <span>•</span>
                  <span>{tasks.length} sessions</span>
                  {studentInterventions.length > 0 && (
                    <>
                      <span>•</span>
                      <span className="text-indigo-400">{studentInterventions.length} interventions</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            
            {/* Action Buttons & Navigation */}
            <div className="flex items-center gap-2">
              {/* Log Intervention Button */}
              <button
                onClick={() => setShowInterventionModal(true)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black uppercase rounded-xl transition-colors flex items-center gap-2"
                title="Log Intervention (Ctrl+I)"
              >
                📝 Log Intervention
              </button>
              
              {onNavigate && totalStudents > 1 && (
                <div className="flex items-center gap-1 ml-2">
                  <button 
                    onClick={() => onNavigate('prev')}
                    className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors flex items-center justify-center text-sm"
                  >
                    ←
                  </button>
                  <span className="text-[9px] text-slate-600 font-mono px-2">
                    {currentIndex + 1}/{totalStudents}
                  </span>
                  <button 
                    onClick={() => onNavigate('next')}
                    className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors flex items-center justify-center text-sm"
                  >
                    →
                  </button>
                </div>
              )}
              <button 
                onClick={onClose} 
                className="text-slate-600 hover:text-white text-xl transition-colors p-2 hover:bg-slate-800 rounded-lg ml-2"
              >
                ✕
              </button>
            </div>
          </div>

          {/* ========================================== */}
          {/* TAB NAVIGATION */}
          {/* ========================================== */}
          <div className="px-5 pt-3 border-b border-slate-800/50 flex gap-2">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 rounded-t-lg font-black text-[10px] uppercase tracking-widest transition-all ${
                activeTab === 'overview'
                  ? 'bg-slate-800 text-white border-t border-x border-slate-700'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              📊 Overview
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-4 py-2 rounded-t-lg font-black text-[10px] uppercase tracking-widest transition-all ${
                activeTab === 'history'
                  ? 'bg-slate-800 text-white border-t border-x border-slate-700'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              📜 History ({sortedData.length})
            </button>
            <button
              onClick={() => setActiveTab('interventions')}
              className={`px-4 py-2 rounded-t-lg font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 ${
                activeTab === 'interventions'
                  ? 'bg-slate-800 text-white border-t border-x border-slate-700'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              📝 Interventions
              {studentInterventions.length > 0 && (
                <span className={`px-1.5 py-0.5 rounded text-[8px] ${
                  activeTab === 'interventions' ? 'bg-indigo-500' : 'bg-slate-700'
                }`}>
                  {studentInterventions.length}
                </span>
              )}
            </button>
          </div>

          {/* ========================================== */}
          {/* CONTENT AREA */}
          {/* ========================================== */}
          <div className="flex-1 p-5 overflow-y-auto custom-scrollbar">
            
            {/* OVERVIEW TAB - WITH COLLAPSIBLE SECTIONS */}
            {activeTab === 'overview' && (
              <div className="grid grid-cols-12 gap-5">
                
                {/* LEFT COLUMN */}
                <div className="col-span-4 space-y-4">
                  
                  {/* Primary Metrics */}
                  <CollapsibleSection title="Primary Metrics" icon="📈" defaultOpen={true}>
                    <div className="space-y-3">
                      {/* RSR Card */}
                      <div className="p-4 bg-slate-900/40 rounded-xl text-center">
                        <Tooltip content={METRIC_INFO.rsr.desc}>
                          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1 cursor-help">
                            RSR (Recent Success Rate)
                          </p>
                        </Tooltip>
                        <p className="text-4xl font-black text-white italic">{rsrDisplay}</p>
                        <p className="text-[8px] text-indigo-400 mt-1 font-bold uppercase italic">
                          {student.metrics.stallStatus || 'Optimal'}
                        </p>
                      </div>

                      {/* Mini Metrics Grid */}
                      <div className="grid grid-cols-2 gap-2">
                        <Tooltip content={METRIC_INFO.ksi.desc}>
                          <div className="p-3 bg-slate-900/40 rounded-xl cursor-help">
                            <div className="text-[8px] text-slate-500 uppercase">KSI</div>
                            <div className={`text-lg font-black ${
                              student.metrics.ksi === null ? 'text-slate-600' :
                              student.metrics.ksi < DRI_CONFIG.KSI_CRITICAL_THRESHOLD ? 'text-red-400' :
                              'text-blue-400'
                            }`}>
                              {student.metrics.ksi !== null ? `${student.metrics.ksi}%` : 'N/A'}
                            </div>
                          </div>
                        </Tooltip>
                        
                        <Tooltip content={METRIC_INFO.accuracy.desc}>
                          <div className="p-3 bg-slate-900/40 rounded-xl cursor-help">
                            <div className="text-[8px] text-slate-500 uppercase">Accuracy</div>
                            <div className={`text-lg font-black ${
                              (student.metrics.accuracyRate || 0) >= 70 ? 'text-emerald-400' : 'text-amber-400'
                            }`}>
                              {student.metrics.accuracyRate || 0}%
                            </div>
                          </div>
                        </Tooltip>
                      </div>
                    </div>
                  </CollapsibleSection>

                  {/* Risk Factors */}
                  <CollapsibleSection title="Risk Factors" icon="⚠️" defaultOpen={student.dri.driTier !== 'GREEN'}>
                    <div className="grid grid-cols-2 gap-2">
                      <Tooltip content={METRIC_INFO.der.desc}>
                        <div className="p-3 bg-slate-900/40 rounded-xl cursor-help">
                          <div className="text-[8px] text-slate-500 uppercase">DER</div>
                          {student.dri.debtExposure !== null ? (
                            <div className={`text-lg font-black ${
                              student.dri.debtExposure > DRI_CONFIG.DER_SEVERE_THRESHOLD ? 'text-red-400' :
                              student.dri.debtExposure > DRI_CONFIG.DER_CRITICAL_THRESHOLD ? 'text-amber-400' : 
                              'text-emerald-400'
                            }`}>
                              {student.dri.debtExposure}%
                            </div>
                          ) : (
                            <div className="text-sm text-slate-600">N/A</div>
                          )}
                        </div>
                      </Tooltip>
                      
                      <Tooltip content={METRIC_INFO.pdi.desc}>
                        <div className="p-3 bg-slate-900/40 rounded-xl cursor-help">
                          <div className="text-[8px] text-slate-500 uppercase">PDI</div>
                          {student.dri.precisionDecay !== null ? (
                            <div className={`text-lg font-black ${
                              student.dri.precisionDecay > DRI_CONFIG.PDI_SEVERE_THRESHOLD ? 'text-red-400' :
                              student.dri.precisionDecay > DRI_CONFIG.PDI_CRITICAL_THRESHOLD ? 'text-amber-400' : 
                              'text-emerald-400'
                            }`}>
                              {student.dri.precisionDecay}x
                            </div>
                          ) : (
                            <div className="text-sm text-slate-600">N/A</div>
                          )}
                        </div>
                      </Tooltip>

                      <Tooltip content={METRIC_INFO.focus.desc}>
                        <div className="p-3 bg-slate-900/40 rounded-xl cursor-help">
                          <div className="text-[8px] text-slate-500 uppercase">Focus</div>
                          <div className="text-lg font-black text-purple-300">
                            {student.metrics.focusIntegrity}%
                          </div>
                        </div>
                      </Tooltip>
                      
                      <Tooltip content={METRIC_INFO.iroi.desc}>
                        <div className="p-3 bg-slate-900/40 rounded-xl cursor-help">
                          <div className="text-[8px] text-slate-500 uppercase">iROI</div>
                          {student.dri.iROI !== null ? (
                            <div className="text-lg font-black text-cyan-300">
                              {student.dri.iROI}
                            </div>
                          ) : (
                            <div className="text-sm text-slate-600">N/A</div>
                          )}
                        </div>
                      </Tooltip>
                    </div>
                  </CollapsibleSection>

                  {/* Topics */}
                  <CollapsibleSection 
                    title="Topics Analysis" 
                    icon="📚" 
                    defaultOpen={true}
                    badge={readyToAccelerate.length + struggleTopics.length}
                  >
                    <div className="space-y-3">
                      {/* Ready to Accelerate */}
                      <div className="bg-indigo-950/20 border border-indigo-500/30 p-3 rounded-xl">
                        <h4 className="text-[8px] font-black text-indigo-400 uppercase mb-2">⚡ Ready to Accelerate</h4>
                        {readyToAccelerate.length > 0 ? readyToAccelerate.map((topic: string, idx: number) => (
                          <div key={idx} className="flex items-center gap-2 p-1.5 bg-indigo-900/20 rounded mb-1">
                            <div className="w-1 h-1 bg-indigo-500 rounded-full" />
                            <span className="text-[9px] font-bold text-indigo-200 uppercase truncate">{topic}</span>
                          </div>
                        )) : (
                          <p className="text-[9px] text-slate-600 italic text-center py-2">Consolidating...</p>
                        )}
                      </div>

                      {/* Struggle Topics */}
                      {struggleTopics.length > 0 && (
                        <div className="bg-red-950/20 border border-red-500/30 p-3 rounded-xl">
                          <h4 className="text-[8px] font-black text-red-400 uppercase mb-2">🚨 Needs Help</h4>
                          {struggleTopics.map((topic: string, idx: number) => (
                            <div key={idx} className="flex items-center gap-2 p-1.5 bg-red-900/20 rounded mb-1">
                              <div className="w-1 h-1 bg-red-500 rounded-full" />
                              <span className="text-[9px] font-bold text-red-200 uppercase truncate">{topic}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </CollapsibleSection>
                </div>

                {/* RIGHT COLUMN: CHARTS */}
                <div className="col-span-8 space-y-4">
                  
                  {/* Precision Curve */}
                  <CollapsibleSection title="Precision Curve" icon="📉" defaultOpen={true}>
                    <ResponsiveContainer width="100%" height={180}>
                      <LineChart data={chartData} margin={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                        <CartesianGrid stroke="#1e293b" vertical={false} strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="i" 
                          stroke="#475569" 
                          fontSize={9} 
                        />
                        <YAxis 
                          domain={[0, 110]} 
                          ticks={[0, 50, 100]} 
                          stroke="#475569" 
                          fontSize={9} 
                        />
                        <RechartsTooltip 
                          contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '10px', fontSize: '10px' }}
                          formatter={(value: any) => [`${value}%`, 'Accuracy']}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="acc" 
                          stroke="#6366f1" 
                          strokeWidth={2} 
                          dot={{ r: 3, fill: '#6366f1' }} 
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CollapsibleSection>

                  {/* Weekly Activity */}
                  <CollapsibleSection title="Weekly Pattern" icon="📅" defaultOpen={false}>
                    <ResponsiveContainer width="100%" height={120}>
                      <BarChart data={weeklyPattern} margin={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                        <CartesianGrid stroke="#1e293b" vertical={false} strokeDasharray="3 3" />
                        <XAxis dataKey="day" stroke="#475569" fontSize={9} />
                        <YAxis stroke="#475569" fontSize={9} />
                        <RechartsTooltip 
                          contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '10px', fontSize: '10px' }}
                          formatter={(value: any) => [`${value} XP`, 'Earned']}
                        />
                        <Bar dataKey="xp" fill="#6366f1" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                    <div className="mt-2 flex justify-between text-[8px] text-slate-600">
                      <span>Total: <span className="text-indigo-400 font-bold">{weeklyPattern.reduce((sum, d) => sum + d.xp, 0)} XP</span></span>
                      <span>Active days: <span className="text-emerald-400 font-bold">{weeklyPattern.filter(d => d.tasks > 0).length}/7</span></span>
                    </div>
                  </CollapsibleSection>

                  {/* Recent Interventions Quick View */}
                  {studentInterventions.length > 0 && (
                    <CollapsibleSection 
                      title="Recent Interventions" 
                      icon="📝" 
                      defaultOpen={false}
                      badge={studentInterventions.length}
                    >
                      <div className="space-y-2">
                        {studentInterventions.slice(0, 3).map((intervention: any) => (
                          <div key={intervention.id} className="p-3 bg-slate-900/40 rounded-xl border border-slate-800">
                            <div className="flex justify-between items-start mb-1">
                              <span className="text-[10px] font-bold text-indigo-400">{intervention.objective}</span>
                              <span className="text-[8px] text-slate-600 font-mono">
                                {intervention.interventionDate?.toDate?.().toLocaleDateString() || 
                                 new Date(intervention.interventionDate).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-[9px] text-slate-500">By: {intervention.coachName}</p>
                            {intervention.nextSteps && (
                              <p className="text-[9px] text-amber-400 mt-1">→ {intervention.nextSteps.substring(0, 80)}...</p>
                            )}
                          </div>
                        ))}
                        {studentInterventions.length > 3 && (
                          <button 
                            onClick={() => setActiveTab('interventions')}
                            className="w-full text-center text-[9px] text-indigo-400 hover:text-indigo-300 py-2"
                          >
                            View all {studentInterventions.length} interventions →
                          </button>
                        )}
                      </div>
                    </CollapsibleSection>
                  )}
                </div>
              </div>
            )}

            {/* HISTORY TAB */}
            {activeTab === 'history' && (
              <div className="bg-slate-900/10 rounded-2xl border border-slate-800 overflow-hidden">
                <div className="max-h-[500px] overflow-y-auto custom-scrollbar">
                  <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 bg-[#080808] z-10">
                      <tr className="text-[9px] font-black text-slate-600 uppercase border-b border-slate-800">
                        <th className="p-3">Date</th>
                        <th className="p-3">Topic</th>
                        <th className="p-3 text-center">Acc</th>
                        <th className="p-3 text-center">Items</th>
                        <th className="p-3 text-center">Time</th>
                        <th className="p-3 text-center">XP</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                      {sortedData.map((task: any, idx: number) => (
                        <tr key={idx} className="hover:bg-slate-900/30 transition-colors">
                          <td className="p-3 text-[10px] font-mono text-slate-500">{task.date}</td>
                          <td className="p-3 text-[10px] font-bold text-slate-300 uppercase italic truncate max-w-[200px]">
                            {task.topic}
                          </td>
                          <td className="p-3 text-center">
                            <span className={`text-[9px] font-mono font-black px-2 py-0.5 rounded ${
                              task.acc >= 80 ? 'bg-emerald-500/20 text-emerald-400' : 
                              task.acc >= 50 ? 'bg-amber-500/20 text-amber-400' : 
                              'bg-red-500/20 text-red-400'
                            }`}>
                              {task.acc}%
                            </span>
                          </td>
                          <td className="p-3 text-center text-[9px] font-mono text-slate-500">
                            {task.correct}/{task.questions}
                          </td>
                          <td className="p-3 text-center text-[9px] font-mono text-indigo-400">
                            {task.time}m
                          </td>
                          <td className="p-3 text-center text-[9px] font-mono text-purple-400 font-bold">
                            {task.xp}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* INTERVENTIONS TAB */}
            {activeTab === 'interventions' && (
              <div className="space-y-4">
                {/* Header with Add Button */}
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-sm font-black text-white uppercase">Coaching History</h3>
                    <p className="text-[10px] text-slate-500">All interventions logged for this student</p>
                  </div>
                  <button
                    onClick={() => setShowInterventionModal(true)}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black uppercase rounded-xl transition-colors flex items-center gap-2"
                  >
                    + Log New Intervention
                  </button>
                </div>

                {/* Interventions List */}
                {studentInterventions.length === 0 ? (
                  <div className="text-center py-16 bg-slate-900/20 rounded-2xl border border-slate-800">
                    <div className="text-4xl mb-4">📝</div>
                    <h4 className="text-sm font-bold text-slate-400">No Interventions Yet</h4>
                    <p className="text-[10px] text-slate-600 mt-1">Start by logging your first coaching session</p>
                    <button
                      onClick={() => setShowInterventionModal(true)}
                      className="mt-4 px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black uppercase rounded-xl transition-colors"
                    >
                      Log Intervention
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {studentInterventions.map((intervention: any) => (
                      <div key={intervention.id} className="bg-slate-900/30 border border-slate-800 rounded-2xl p-5">
                        {/* Header */}
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h4 className="text-sm font-black text-indigo-400 uppercase">{intervention.objective}</h4>
                            <p className="text-[10px] text-slate-500 mt-1">
                              Coach: <span className="text-white font-bold">{intervention.coachName}</span>
                              <span className="mx-2">•</span>
                              {intervention.interventionDate?.toDate?.().toLocaleDateString() || 
                               new Date(intervention.interventionDate).toLocaleDateString()}
                            </p>
                          </div>
                          {intervention.metricsSnapshot && (
                            <div className="flex gap-2 text-[8px] font-mono">
                              <span className="px-2 py-1 rounded bg-slate-800 text-slate-400">
                                RSR: {(intervention.metricsSnapshot.rsr * 100).toFixed(0)}%
                              </span>
                              <span className="px-2 py-1 rounded bg-slate-800 text-slate-400">
                                Risk: {intervention.metricsSnapshot.riskScore}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Content Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {/* What Was Done */}
                          <div className="bg-slate-900/40 p-3 rounded-xl">
                            <h5 className="text-[9px] font-black text-slate-500 uppercase mb-2">What Was Done</h5>
                            <p className="text-[10px] text-slate-300">{intervention.whatWasDone}</p>
                          </div>

                          {/* What Was Achieved */}
                          {intervention.whatWasAchieved && (
                            <div className="bg-emerald-900/20 border border-emerald-500/20 p-3 rounded-xl">
                              <h5 className="text-[9px] font-black text-emerald-500 uppercase mb-2">What Was Achieved</h5>
                              <p className="text-[10px] text-emerald-200">{intervention.whatWasAchieved}</p>
                            </div>
                          )}

                          {/* Next Steps */}
                          {intervention.nextSteps && (
                            <div className="bg-amber-900/20 border border-amber-500/20 p-3 rounded-xl">
                              <h5 className="text-[9px] font-black text-amber-500 uppercase mb-2">Next Steps</h5>
                              <p className="text-[10px] text-amber-200">{intervention.nextSteps}</p>
                            </div>
                          )}
                        </div>

                        {/* Notes */}
                        {intervention.notes && (
                          <div className="mt-4 p-3 bg-slate-900/20 rounded-xl border border-slate-800">
                            <h5 className="text-[9px] font-black text-slate-500 uppercase mb-1">Additional Notes</h5>
                            <p className="text-[10px] text-slate-400 italic">{intervention.notes}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Intervention Modal */}
      {showInterventionModal && (
        <CoachInterventionModal
          student={student}
          onClose={() => setShowInterventionModal(false)}
          onSuccess={handleInterventionSuccess}
        />
      )}
    </>
  );
}



================================================
FILE: components/Tooltip.tsx
================================================
'use client';

import { useState, ReactNode } from 'react';

interface TooltipProps {
  content: string;
  children: ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export default function Tooltip({ content, children, position = 'top' }: TooltipProps) {
  const [show, setShow] = useState(false);

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  const arrowClasses = {
    top: 'top-full left-1/2 -translate-x-1/2 border-t-slate-800',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-slate-800',
    left: 'left-full top-1/2 -translate-y-1/2 border-l-slate-800',
    right: 'right-full top-1/2 -translate-y-1/2 border-r-slate-800',
  };

  return (
    <div 
      className="relative inline-flex"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <div 
          className={`absolute z-50 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-[10px] text-slate-300 whitespace-nowrap shadow-xl animate-in fade-in zoom-in-95 duration-150 ${positionClasses[position]}`}
        >
          {content}
          <div 
            className={`absolute border-4 border-transparent ${arrowClasses[position]}`}
          />
        </div>
      )}
    </div>
  );
}



================================================
FILE: lib/color-utils.ts
================================================
// lib/color-utils.ts
// Utility para convertir Tailwind classes a hex colors y viceversa

export const DRI_COLOR_MAP = {
  'text-slate-500': { hex: '#64748b', label: 'Inactive', tier: 'INACTIVE' },
  'text-slate-400': { hex: '#94a3b8', label: 'Inactive', tier: 'INACTIVE' }, // Mejor contraste
  'text-red-500': { hex: '#ef4444', label: 'Critical', tier: 'RED' },
  'text-amber-500': { hex: '#f59e0b', label: 'Watch', tier: 'YELLOW' },
  'text-emerald-500': { hex: '#10b981', label: 'Optimal', tier: 'GREEN' }
} as const;

export function driColorToHex(tailwindClass: string): string {
  return DRI_COLOR_MAP[tailwindClass as keyof typeof DRI_COLOR_MAP]?.hex || '#64748b';
}

export function driColorToLabel(tailwindClass: string): string {
  return DRI_COLOR_MAP[tailwindClass as keyof typeof DRI_COLOR_MAP]?.label || 'Unknown';
}

// K-means clustering simplificado para reducir puntos en scatter plot
export interface ClusterPoint {
  x: number;
  y: number;
  data: any;
}

export interface Cluster {
  centroid: { x: number; y: number };
  members: any[];
  worstStudent: any;
}

export function kMeansCluster(
  data: any[],
  k: number,
  extractors: { x: (d: any) => number; y: (d: any) => number }
): Cluster[] {
  if (data.length <= k) {
    return data.map(d => ({
      centroid: { x: extractors.x(d), y: extractors.y(d) },
      members: [d],
      worstStudent: d
    }));
  }

  // Inicializar centroides aleatoriamente
  const centroids: { x: number; y: number }[] = [];
  const step = Math.floor(data.length / k);
  for (let i = 0; i < k; i++) {
    const point = data[i * step];
    centroids.push({ x: extractors.x(point), y: extractors.y(point) });
  }

  // Iterar hasta convergencia (máximo 10 iteraciones)
  for (let iter = 0; iter < 10; iter++) {
    const clusters: any[][] = Array(k).fill(null).map(() => []);

    // Asignar puntos a clusters
    data.forEach(point => {
      const x = extractors.x(point);
      const y = extractors.y(point);
      let minDist = Infinity;
      let closestCluster = 0;

      centroids.forEach((centroid, i) => {
        const dist = Math.sqrt(
          Math.pow(x - centroid.x, 2) + Math.pow(y - centroid.y, 2)
        );
        if (dist < minDist) {
          minDist = dist;
          closestCluster = i;
        }
      });

      clusters[closestCluster].push(point);
    });

    // Recalcular centroides
    clusters.forEach((cluster, i) => {
      if (cluster.length > 0) {
        const sumX = cluster.reduce((sum, p) => sum + extractors.x(p), 0);
        const sumY = cluster.reduce((sum, p) => sum + extractors.y(p), 0);
        centroids[i] = {
          x: sumX / cluster.length,
          y: sumY / cluster.length
        };
      }
    });
  }

  // Construir resultado final
  const result: Cluster[] = [];
  centroids.forEach((centroid, i) => {
    const members = data.filter(point => {
      const x = extractors.x(point);
      const y = extractors.y(point);
      let minDist = Infinity;
      let closestIdx = 0;

      centroids.forEach((c, j) => {
        const dist = Math.sqrt(
          Math.pow(x - c.x, 2) + Math.pow(y - c.y, 2)
        );
        if (dist < minDist) {
          minDist = dist;
          closestIdx = j;
        }
      });

      return closestIdx === i;
    });

    if (members.length > 0) {
      const worstStudent = members.sort((a, b) => 
        (b.dri?.dropoutProbability || 0) - (a.dri?.dropoutProbability || 0)
      )[0];

      result.push({
        centroid,
        members,
        worstStudent
      });
    }
  });

  return result;
}



================================================
FILE: lib/dri-calculus.ts
================================================
import { Student } from '@/types';
import { getTopicGrade } from './grade-maps';
import { DRI_CONFIG } from './dri-config';

/**
 * Calcula métricas DRI (Direct Instruction) según Alpha Protocol
 */
export function calculateDRIMetrics(student: Student) {
  const tasks = student.activity?.tasks || [];
  
  // ==========================================
  // FASE 1: DETECCIÓN DE INACTIVIDAD
  // ==========================================
  const lastActivityDate = tasks.length > 0 
    ? new Date(tasks[0].completedLocal) 
    : null;
  
  const daysSinceActivity = lastActivityDate 
    ? Math.floor((Date.now() - lastActivityDate.getTime()) / (1000 * 60 * 60 * 24))
    : Infinity;

  if (daysSinceActivity > DRI_CONFIG.INACTIVITY_DAYS_THRESHOLD) {
    return {
      iROI: null,
      debtExposure: null,
      precisionDecay: null,
      driTier: 'RED' as const,
      driSignal: 'INACTIVE',
      driColor: 'text-slate-400',
      riskScore: 100
    };
  }

  // ==========================================
  // FASE 2: DER (DEBT EXPOSURE RATIO)
  // ==========================================
  const sorted = [...tasks].sort((a, b) => 
    new Date(a.completedLocal).getTime() - new Date(b.completedLocal).getTime()
  );

  let kBelow = 0, kTotal = 0;
  
  tasks.forEach(t => {
    const accuracy = t.questionsCorrect / (t.questions || 1);
    if (t.topic?.name && accuracy > DRI_CONFIG.DER_MASTERY_THRESHOLD) {
      kTotal++;
      const topicGrade = getTopicGrade(student.currentCourse?.name, t.topic.name);
      if (topicGrade === 'K-8') {
        kBelow++;
      }
    }
  });

  const debtExposure = kTotal >= DRI_CONFIG.DER_MIN_TASKS 
    ? Math.round((kBelow / kTotal) * 100) 
    : null;

  // ==========================================
  // FASE 3: PDI (PRECISION DECAY INDEX)
  // ==========================================
  const windowSize = Math.min(
    Math.max(5, Math.ceil(sorted.length * 0.3)), 
    DRI_CONFIG.PDI_WINDOW_SIZE
  );

  const calculateErrors = (taskSlice: any[]) => {
    return taskSlice.reduce((acc, t) => {
      const actualErr = t.questions - (t.questionsCorrect || 0);
      if (DRI_CONFIG.PDI_NORMALIZE_DIFFICULTY) {
        const grade = getTopicGrade(student.currentCourse?.name, t.topic?.name || '');
        const difficulty = DRI_CONFIG.TOPIC_DIFFICULTY[grade] || 1.0;
        const expectedErr = t.questions * (1 - (1 / difficulty));
        return acc + (actualErr / Math.max(expectedErr, 1));
      }
      return acc + actualErr;
    }, 0);
  };

  const startErr = calculateErrors(sorted.slice(0, windowSize));
  const endErr = calculateErrors(sorted.slice(-windowSize));
  const precisionDecay = parseFloat(((endErr + 1) / (startErr + 1)).toFixed(2));

  // ==========================================
  // FASE 4: iROI (INVESTMENT ROI)
  // ==========================================
  const xpAwarded = student.activity?.xpAwarded || 0;
  const time = student.activity?.time || 0;
  
  const iROI = time > 0 
    ? parseFloat((xpAwarded / time).toFixed(2))
    : null;

  // ==========================================
  // FASE 5: RISK SCORING SYSTEM (PONDERADO + RSR GATEKEEPER)
  // ==========================================
  let riskScore = 0;
  let driTier: 'RED' | 'YELLOW' | 'GREEN';
  let driSignal: string;
  let driColor: string;

  // 1. Calcular Risk Score Base (Indicadores generales)
  if (DRI_CONFIG.RISK_SCORING_ENABLED) {
    if (debtExposure !== null) {
      if (debtExposure > DRI_CONFIG.DER_SEVERE_THRESHOLD) riskScore += DRI_CONFIG.RISK_WEIGHTS.DEBT_EXPOSURE;
      else if (debtExposure > DRI_CONFIG.DER_CRITICAL_THRESHOLD) riskScore += Math.round(DRI_CONFIG.RISK_WEIGHTS.DEBT_EXPOSURE * 0.67);
      else if (debtExposure > 10) riskScore += Math.round(DRI_CONFIG.RISK_WEIGHTS.DEBT_EXPOSURE * 0.33);
    }
    
    const velocity = student.metrics?.velocityScore || 0;
    if (velocity < 20) riskScore += DRI_CONFIG.RISK_WEIGHTS.VELOCITY;
    else if (velocity < 50) riskScore += Math.round(DRI_CONFIG.RISK_WEIGHTS.VELOCITY * 0.6);
    else if (velocity < 80) riskScore += Math.round(DRI_CONFIG.RISK_WEIGHTS.VELOCITY * 0.2);
    
    if (precisionDecay > DRI_CONFIG.PDI_SEVERE_THRESHOLD) riskScore += DRI_CONFIG.RISK_WEIGHTS.PRECISION_DECAY;
    else if (precisionDecay > DRI_CONFIG.PDI_CRITICAL_THRESHOLD) riskScore += Math.round(DRI_CONFIG.RISK_WEIGHTS.PRECISION_DECAY * 0.5);
    
    const ksi = student.metrics?.ksi || 100;
    if (ksi < DRI_CONFIG.KSI_CRITICAL_THRESHOLD) riskScore += DRI_CONFIG.RISK_WEIGHTS.STABILITY;
    else if (ksi < DRI_CONFIG.KSI_LOW_THRESHOLD) riskScore += Math.round(DRI_CONFIG.RISK_WEIGHTS.STABILITY * 0.53);
    
    if (student.metrics?.stallStatus === 'Frustrated Stall') riskScore += DRI_CONFIG.RISK_WEIGHTS.STALL_STATUS;
    
    riskScore = Math.min(riskScore, 100);
  }

  // 2. LÓGICA DE CLASIFICACIÓN CON RSR GATEKEEPER
  const rsr = (student.metrics.lmp || 0) * 100; // RSR en porcentaje

  if (rsr < 60) {
    // CASO: RSR Crítico (< 60%)
    if (riskScore >= DRI_CONFIG.RISK_YELLOW_THRESHOLD) {
       // SUB-CASO: Otros indicadores malos (Risk Score alto) -> ROJO
       driTier = 'RED';
       driSignal = 'Critical Failure';
       driColor = 'text-red-500';
       riskScore = Math.max(riskScore, 75); // Forzar score de riesgo alto
    } else {
       // SUB-CASO: Otros indicadores buenos (Risk Score bajo) -> AMARILLO
       driTier = 'YELLOW';
       driSignal = 'Low Accuracy';
       driColor = 'text-amber-500';
       riskScore = Math.max(riskScore, 45); // Forzar score de advertencia
    }
  } else {
    // CASO: RSR Saludable (>= 60%) -> Usar lógica estándar por Score
    if (riskScore >= DRI_CONFIG.RISK_RED_THRESHOLD) {
      driTier = 'RED';
      driSignal = 'High Risk';
      driColor = 'text-red-500';
    } else if (riskScore >= DRI_CONFIG.RISK_YELLOW_THRESHOLD) {
      driTier = 'YELLOW';
      driSignal = 'Watch List';
      driColor = 'text-amber-500';
    } else {
      driTier = 'GREEN';
      driSignal = 'Flowing';
      driColor = 'text-emerald-500';
    }
  }

  // Refinamiento de señal para casos específicos estándar
  if (driTier === 'RED' && !driSignal.includes('Critical')) {
     if (debtExposure && debtExposure > DRI_CONFIG.DER_CRITICAL_THRESHOLD) driSignal = 'Critical Debt';
     else if ((student.metrics?.velocityScore || 0) < 30) driSignal = 'Low Velocity';
  }

  return { 
    iROI, 
    debtExposure, 
    precisionDecay, 
    driTier, 
    driSignal, 
    driColor, 
    riskScore 
  };
}



================================================
FILE: lib/dri-config.ts
================================================
// lib/dri-config.ts
// Configuración centralizada de estándares Alpha y umbrales DRI

/**
 * Alpha School Standards & DRI Configuration
 * 
 * Basado en:
 * - Technical Calculation Protocol: Math DRI Metrics
 * - Automation Threshold Roadmap
 * - Academic Audit Report 2024-2025
 */

export const DRI_CONFIG = {
  // ==========================================
  // VELOCITY STANDARDS (Alpha Protocol)
  // ==========================================
  
  /**
   * Estándar semanal Alpha: 25 XP/día × 5 días útiles
   * Fuente: Technical Protocol - Mastery Density formula
   */
  ALPHA_WEEKLY_STANDARD: 125,
  
  /**
   * Estándar diario Alpha
   */
  ALPHA_DAILY_STANDARD: 25,
  
  /**
   * Cap máximo de velocity para evitar outliers
   */
  VELOCITY_CAP: 200,
  
  // ==========================================
  // DER (DEBT EXPOSURE RATIO)
  // ==========================================
  
  /**
   * Umbral de accuracy para considerar un topic "maestreado"
   * Alpha requiere 100%, pero 65% es proxy razonable para análisis
   */
  DER_MASTERY_THRESHOLD: 0.65,
  
  /**
   * Mínimo de tasks necesarios para calcular DER confiable
   */
  DER_MIN_TASKS: 5,
  
  /**
   * Umbral crítico de deuda académica
   * Fuente: Technical Protocol - "If DER > 20%, student is in remedial mode"
   */
  DER_CRITICAL_THRESHOLD: 20,
  
  /**
   * Umbral severo de deuda (alerta máxima)
   */
  DER_SEVERE_THRESHOLD: 40,
  
  // ==========================================
  // PDI (PRECISION DECAY INDEX)
  // ==========================================
  
  /**
   * Tamaño de ventana para calcular errores (sesiones)
   */
  PDI_WINDOW_SIZE: 10,
  
  /**
   * Umbral crítico de precision decay
   * Fuente: Technical Protocol - "PDI > 1.5 suggests Short-Burst Specialist"
   */
  PDI_CRITICAL_THRESHOLD: 1.5,
  
  /**
   * Umbral severo de decay (fatiga extrema)
   */
  PDI_SEVERE_THRESHOLD: 2.0,
  
  /**
   * Activar normalización por dificultad de topic
   */
  PDI_NORMALIZE_DIFFICULTY: true,
  
  /**
   * Factores de dificultad por nivel
   */
  TOPIC_DIFFICULTY: {
    'K-8': 0.7,  // 30% error esperado
    'HS': 1.0,   // 50% error esperado (baseline)
    'AP': 1.3    // 65% error esperado
  } as Record<string, number>,
  
  // ==========================================
  // INACTIVIDAD
  // ==========================================
  
  /**
   * Días sin actividad para marcar como INACTIVE
   */
  INACTIVITY_DAYS_THRESHOLD: 7,
  
  // ==========================================
  // iROI (INVESTMENT ROI)
  // ==========================================
  
  /**
   * Umbral mínimo de productividad (XP por segundo)
   * Estudiante con >1 hora y <0.3 XP/s está estancado
   */
  iROI_LOW_PRODUCTIVITY_THRESHOLD: 0.3,
  
  /**
   * Tiempo mínimo (segundos) para validar baja productividad
   */
  iROI_MIN_TIME_FOR_EVAL: 3600, // 1 hora
  
  // ==========================================
  // RISK SCORING (Sistema Ponderado)
  // ==========================================
  
  /**
   * Activar sistema de scoring ponderado vs umbrales binarios
   */
  RISK_SCORING_ENABLED: true,
  
  /**
   * Pesos de factores de riesgo (deben sumar 100)
   */
  RISK_WEIGHTS: {
    DEBT_EXPOSURE: 30,
    VELOCITY: 25,
    PRECISION_DECAY: 20,
    STABILITY: 15,
    STALL_STATUS: 10
  },
  
  /**
   * Umbral para clasificación RED
   */
  RISK_RED_THRESHOLD: 60,
  
  /**
   * Umbral para clasificación YELLOW
   */
  RISK_YELLOW_THRESHOLD: 35,
  
  // ==========================================
  // KSI (KNOWLEDGE STABILITY INDEX)
  // ==========================================
  
  /**
   * Umbral de estabilidad crítica
   */
  KSI_CRITICAL_THRESHOLD: 50,
  
  /**
   * Umbral de estabilidad baja
   */
  KSI_LOW_THRESHOLD: 60,
  
  // ==========================================
  // MASTERY (Recent Success Rate)
  // ==========================================
  
  /**
   * Umbral de accuracy para considerar una task "exitosa"
   */
  RSR_SUCCESS_THRESHOLD: 0.8,
  
  /**
   * Número de tasks recientes a evaluar
   */
  RSR_RECENT_TASKS_COUNT: 10
  
} as const;

/**
 * Type helper para acceso type-safe
 */
export type DRIConfigKey = keyof typeof DRI_CONFIG;



================================================
FILE: lib/firebase-admin.ts
================================================
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

export const adminDb = getFirestore();



================================================
FILE: lib/firebase.ts
================================================
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);
const auth = getAuth(app);

export { app, db, auth };



================================================
FILE: lib/grade-maps.ts
================================================
// lib/grade-maps.ts
// Mapeo de topics de Math Academy a niveles académicos (K-8, HS, AP)

export const TOPIC_GRADE_MAP: Record<string, 'K-8' | 'HS' | 'AP'> = {
  // ==========================================
  // K-8 FUNDAMENTALS
  // ==========================================
  "Counting": "K-8",
  "Addition": "K-8",
  "Subtraction": "K-8",
  "Multiplication": "K-8",
  "Division": "K-8",
  "Fractions": "K-8",
  "Decimals": "K-8",
  "Percentages": "K-8",
  "Ratios": "K-8",
  "Proportions": "K-8",
  "Integers": "K-8",
  "Order of Operations": "K-8",
  "Basic Geometry": "K-8",
  "Perimeter": "K-8",
  "Area": "K-8",
  "Volume": "K-8",
  "Mean": "K-8",
  "Median": "K-8",
  "Mode": "K-8",
  "Prime": "K-8",
  "Factor": "K-8",
  "GCD": "K-8",
  "LCM": "K-8",
  
  // ==========================================
  // HIGH SCHOOL CORE
  // ==========================================
  "Algebra": "HS",
  "Linear Equations": "HS",
  "Linear": "HS",
  "Quadratic": "HS",
  "Quadratic Equations": "HS",
  "Polynomials": "HS",
  "Polynomial": "HS",
  "Factoring": "HS",
  "Functions": "HS",
  "Function": "HS",
  "Geometry": "HS",
  "Trigonometry": "HS",
  "Trigonometric": "HS",
  "Sine": "HS",
  "Cosine": "HS",
  "Tangent": "HS",
  "Exponential": "HS",
  "Logarithm": "HS",
  "Logarithmic": "HS",
  "Systems of Equations": "HS",
  "Systems": "HS",
  "Inequalities": "HS",
  "Inequality": "HS",
  "Complex Numbers": "HS",
  "Complex": "HS",
  "Absolute Value": "HS",
  "Rational Expressions": "HS",
  "Radical": "HS",
  "Radicals": "HS",
  "Sequences": "HS",
  "Series": "HS",
  "Arithmetic Sequence": "HS",
  "Geometric Sequence": "HS",
  "Conic Sections": "HS",
  "Circle": "HS",
  "Ellipse": "HS",
  "Parabola": "HS",
  "Hyperbola": "HS",
  "Matrices": "HS",
  "Matrix": "HS",
  "Determinant": "HS",
  "Probability": "HS",
  "Statistics": "HS",
  "Combinatorics": "HS",
  "Permutation": "HS",
  "Combination": "HS",
  
  // ==========================================
  // AP / CALCULUS
  // ==========================================
  "Precalculus": "HS", // Nota: Precalc es HS, no AP
  "Calculus": "AP",
  "Derivatives": "AP",
  "Derivative": "AP",
  "Differentiation": "AP",
  "Integrals": "AP",
  "Integral": "AP",
  "Integration": "AP",
  "Limits": "AP",
  "Limit": "AP",
  "Continuity": "AP",
  "L'Hôpital": "AP",
  "Chain Rule": "AP",
  "Product Rule": "AP",
  "Quotient Rule": "AP",
  "Implicit Differentiation": "AP",
  "Related Rates": "AP",
  "Optimization": "AP",
  "Riemann": "AP",
  "Fundamental Theorem": "AP",
  "U-Substitution": "AP",
  "Integration by Parts": "AP",
  "Partial Fractions": "AP",
  "Differential Equations": "AP",
  "Separable": "AP",
  "Slope Fields": "AP",
  "Euler's Method": "AP",
  "Taylor Series": "AP",
  "Maclaurin": "AP",
  "Power Series": "AP",
  "Convergence": "AP",
  "Divergence": "AP",
  "Vectors": "AP",
  "Vector": "AP",
  "Parametric": "AP",
  "Polar": "AP"
};

/**
 * Mapeo de cursos a niveles académicos
 */
const COURSE_GRADE_MAP: Record<string, 'K-8' | 'HS' | 'AP'> = {
  // K-8
  'Pre Algebra': 'K-8',
  'Pre-Algebra': 'K-8',
  'Math 6': 'K-8',
  'Math 7': 'K-8',
  'Math 8': 'K-8',
  
  // High School
  'Algebra I': 'HS',
  'Algebra 1': 'HS',
  'Geometry': 'HS',
  'Algebra II': 'HS',
  'Algebra 2': 'HS',
  'Precalculus': 'HS',
  'Pre-Calculus': 'HS',
  'SAT Fundamentals': 'HS',
  'SAT Math': 'HS',
  'IM1': 'HS',
  'IM1 Honors': 'HS',
  'IM2': 'HS',
  'IM2 Honors': 'HS',
  'IM3': 'HS',
  'IM3 Honors': 'HS',
  
  // AP / Calculus
  'AP Calculus AB': 'AP',
  'AP Calculus BC': 'AP',
  'Calculus I': 'AP',
  'Calculus II': 'AP',
  'Calculus III': 'AP',
  'AP Statistics': 'AP',
  'Multivariable Calculus': 'AP',
  'Differential Equations': 'AP'
};

/**
 * Determina el nivel académico de un topic basándose en:
 * 1. Mapeo explícito del topic
 * 2. Mapeo del curso
 * 3. Keywords en nombre combinado
 * 4. Fallback conservador a HS
 * 
 * @param courseName - Nombre del curso (ej: "Algebra II", "AP Calculus BC")
 * @param topicName - Nombre del topic (ej: "Quadratic Equations", "Integration")
 * @returns Nivel académico: 'K-8', 'HS', o 'AP'
 */
export function getTopicGrade(courseName: string, topicName: string): 'K-8' | 'HS' | 'AP' {
  if (!courseName || !topicName) return 'HS'; // Fallback seguro
  
  const combined = (courseName + " " + topicName).toLowerCase();
  
  // 1. Buscar match exacto en mapa de topics
  for (const [key, grade] of Object.entries(TOPIC_GRADE_MAP)) {
    if (topicName.toLowerCase().includes(key.toLowerCase())) {
      return grade;
    }
  }
  
  // 2. Buscar en mapa de cursos
  if (COURSE_GRADE_MAP[courseName]) {
    return COURSE_GRADE_MAP[courseName];
  }
  
  // 3. Reglas por keywords (fallback heurístico)
  if (combined.includes('calculus') || 
      combined.includes(' ap ') || 
      combined.includes('derivative') ||
      combined.includes('integral') ||
      combined.includes('limit')) {
    return 'AP';
  }
  
  if (combined.includes('pre-algebra') || 
      combined.includes('grade') ||
      combined.includes('elementary') ||
      combined.includes('middle school')) {
    return 'K-8';
  }
  
  // 4. Fallback conservador
  return 'HS';
}

/**
 * Helper para obtener descripción legible del nivel
 */
export function getGradeDescription(grade: 'K-8' | 'HS' | 'AP'): string {
  switch (grade) {
    case 'K-8': return 'Elementary/Middle School';
    case 'HS': return 'High School';
    case 'AP': return 'AP/College Level';
  }
}



================================================
FILE: lib/mathAcademyAPI.ts
================================================
const API_KEY = process.env.NEXT_PUBLIC_MATH_ACADEMY_API_KEY;
const BASE_URL = 'https://mathacademy.com/api/beta6';

function getWeekRange(): { startDate: string; endDate: string } {
  const now = new Date(Date.now());
  
  const endDateObj = new Date(now.getTime());
  endDateObj.setDate(endDateObj.getDate() + 1);
  const endDate = endDateObj.toISOString().split('T')[0];

  const startDateObj = new Date(now.getTime());
  startDateObj.setDate(startDateObj.getDate() - 30);
  const startDate = startDateObj.toISOString().split('T')[0];

  console.log(`[mathAcademyAPI] getWeekRange():`, { startDate, endDate });

  return { startDate, endDate };
}

export async function getStudentData(studentId: string) {
  if (!API_KEY) {
    console.error('[mathAcademyAPI] Missing API_KEY');
    return null;
  }

  try {
    const profileRes = await fetch(`${BASE_URL}/students/${studentId}`, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Public-API-Key': API_KEY
      },
      cache: 'no-store',
      next: { revalidate: 0 }
    });
    
    if (!profileRes.ok) {
      console.error(`[mathAcademyAPI] Profile fetch failed for ${studentId}:`, profileRes.status);
      return null;
    }
    
    const profileData = await profileRes.json();
    if (!profileData?.result || !profileData?.student) {
      console.error(`[mathAcademyAPI] Invalid profile data for ${studentId}`);
      return null;
    }
    
    const student = profileData.student;
    const { startDate, endDate } = getWeekRange();

    const activityRes = await fetch(`${BASE_URL}/students/${studentId}/activity`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Public-API-Key': API_KEY,
        'Start-Date': startDate,
        'End-Date': endDate
      },
      cache: 'no-store',
      next: { revalidate: 0 }
    });

    let activityMetrics = { 
      xpAwarded: 0, 
      time: 0, 
      questions: 0, 
      questionsCorrect: 0, 
      numTasks: 0, 
      tasks: [] as any[],
      totals: {}
    };

    if (activityRes.ok) {
      const activityData = await activityRes.json();
      const activity = activityData?.activity || activityData;
      
      if (activity) {
        const totals = activity.totals || {};
        const tasks = activity.tasks || [];
        
        let timeEngaged = totals.timeEngaged ?? 0;
        
        if (timeEngaged === 0 && tasks.length > 0) {
          timeEngaged = tasks.reduce((acc: number, task: any) => {
            return acc + (task.analysis?.timeEngaged ?? 0);
          }, 0);
        }

        activityMetrics = {
          xpAwarded: totals.xpAwarded ?? 0,
          time: timeEngaged,
          questions: totals.questions ?? 0,
          questionsCorrect: totals.questionsCorrect ?? 0,
          numTasks: totals.numTasks ?? tasks.length,
          
          tasks: tasks.map((task: any) => ({
            id: task.id,
            type: task.type,
            topic: task.topic,
            questions: task.questions ?? 0,
            questionsCorrect: task.questionsCorrect ?? 0,
            completedLocal: task.completedLocal,
            timeTotal: task.analysis?.timeEngaged ?? 0,
            smartScore: task.smartScore ?? 0,
            xpAwarded: task.xpAwarded ?? 0
          })),
          
          totals: {
            timeEngaged: timeEngaged,
            timeProductive: totals.timeProductive ?? 0,
            timeElapsed: totals.timeElapsed ?? 0,
            xpAwarded: totals.xpAwarded ?? 0,
            questions: totals.questions ?? 0,
            questionsCorrect: totals.questionsCorrect ?? 0,
            numTasks: totals.numTasks ?? tasks.length
          }
        };
      }
    }

    return { ...student, activity: activityMetrics };
    
  } catch (error) {
    console.error(`[mathAcademyAPI] Error fetching student ${studentId}:`, error);
    return null;
  }
}

export function debugGetWeekRange() {
  return getWeekRange();
}



================================================
FILE: lib/metrics.ts
================================================
import { Metrics } from '@/types';
import { DRI_CONFIG } from './dri-config';

export function calculateTier1Metrics(student: any, activity: any): Metrics {
  const tasks = activity?.tasks || [];
  const totals = activity?.totals || {};

  // ==========================================
  // NORMALIZACIÓN TEMPORAL CORRECTA
  // ==========================================
  // ✅ CORRECCIÓN: Leer directamente de totals.timeEngaged
  const rawTimeSeconds = totals.timeEngaged ?? 0;
  
  const timeEngaged = Math.round(rawTimeSeconds / 60); // Convertir a minutos
  const timeProductive = Math.round((totals.timeProductive || 0) / 60);
  const timeElapsed = Math.round((totals.timeElapsed || 0) / 60);
  
  const questions = totals.questions || 0;
  const accuracyRate = questions > 0 
    ? Math.round(((totals.questionsCorrect || 0) / questions) * 100) 
    : null;

  // ==========================================
  // VELOCITY SCORE (ESTÁNDAR ALPHA: 125 XP/SEMANA)
  // ==========================================
  const xpAwarded = totals.xpAwarded || 0;
  
  const velocityScore = Math.min(
    Math.round((xpAwarded / DRI_CONFIG.ALPHA_WEEKLY_STANDARD) * 100),
    DRI_CONFIG.VELOCITY_CAP
  );

  // ==========================================
  // RSR (RECENT SUCCESS RATE)
  // ==========================================
  const recentTasks = tasks.slice(0, DRI_CONFIG.RSR_RECENT_TASKS_COUNT);
  const recentSuccessRate = recentTasks.length > 0
    ? recentTasks.filter((t: any) => 
        (t.questionsCorrect / (t.questions || 1)) > DRI_CONFIG.RSR_SUCCESS_THRESHOLD
      ).length / recentTasks.length
    : 0;
  
  const lmp = parseFloat(recentSuccessRate.toFixed(2));

  // ==========================================
  // KSI (KNOWLEDGE STABILITY INDEX)
  // ==========================================
  let ksi: number | null = null;

  if (tasks.length > 0) {
    const accuracies: number[] = tasks.map((t: any) => 
      (t.questionsCorrect / (t.questions || 1)) * 100
    );
    
    const meanAcc = accuracies.reduce((a: number, b: number) => a + b, 0) / accuracies.length;
    
    if (meanAcc > 0) {
      const variance = accuracies.reduce((a: number, b: number) => 
        a + Math.pow(b - meanAcc, 2), 0
      ) / accuracies.length;
      
      let calculatedKsi = Math.max(0, parseFloat((100 - Math.sqrt(variance)).toFixed(2)));

      if (meanAcc < 30) {
        calculatedKsi = Math.round(calculatedKsi * (meanAcc / 100));
      }

      ksi = calculatedKsi;
    }
  }

  // ==========================================
  // STALL DETECTION
  // ==========================================
  const idleRatio = timeElapsed > 0 
    ? (timeElapsed - timeEngaged) / timeElapsed 
    : 0;
  
  const challengeZoneFailure = tasks.some((t: any) => 
    (t.smartScore || 0) > 80 && (t.questionsCorrect / (t.questions || 1)) < 0.2
  );
  
  let stallStatus: Metrics['stallStatus'] = 'Optimal';
  if (challengeZoneFailure && idleRatio > 0.4) {
    stallStatus = 'Frustrated Stall';
  } else if (accuracyRate !== null && accuracyRate < 60 && idleRatio < 0.2) {
    stallStatus = 'Productive Struggle';
  }

  // ==========================================
  // FOCUS INTEGRITY
  // ==========================================
  const focusIntegrity = timeEngaged > 0 
    ? Math.round((timeProductive / timeEngaged) * 100) 
    : 0;

  // ==========================================
  // NEMESIS TOPIC
  // ==========================================
  const nemesisTopic = tasks.find((t: any) => 
    t.questions > 2 && (t.questionsCorrect / (t.questions || 1)) < 0.6
  )?.topic?.name || "";

  // ==========================================
  // LEGACY COMPATIBILITY
  // ==========================================
  const consistencyIndex = velocityScore > 50 ? 0.9 : 0.3;
  const stuckScore = lmp < 0.3 ? 90 : 0;
  const dropoutProbability = velocityScore < 30 ? 60 : 10;
  
  const riskStatus = (velocityScore < 30 || stallStatus === 'Frustrated Stall') 
    ? 'Critical' 
    : 'On Track';
  
  const archetype = (timeEngaged > 0 && (timeProductive / timeEngaged) < 0.4) 
    ? 'Zombie' 
    : 'Neutral';

  return {
    velocityScore,
    accuracyRate,
    focusIntegrity,
    nemesisTopic,
    lmp,
    ksi,
    stallStatus,
    idleRatio: parseFloat(idleRatio.toFixed(2)),
    consistencyIndex,
    stuckScore,
    dropoutProbability,
    riskStatus,
    archetype
  };
}

export function calculateScientificMetrics(student: any, activity: any): Metrics {
  return calculateTier1Metrics(student, activity);
}



================================================
FILE: lib/student_ids.json
================================================
[
29509,
29437,
29441,
29442,
29494,
20848,
10866,
21931,
22729,
21936,
21949,
21958,
30668,
30679,
21799,
21833,
21971,
21972,
21961,
21962,
21947,
22237,
17191,
17330,
18215,
22260,
22177,
21921,
21856,
21844,
24293,
22195,
22162,
22267,
22196,
22122,
22154,
22126,
22200,
21929,
22038,
22043,
22044,
26605,
22318,
25677,
29038,
5436,
22893,
22733,
22732,
29035,
17331,
22740,
22731,
22730,
22728,
22727,
22726,
30912,
23011,
23012,
21444,
21467,
22683,
22777,
21428,
22760,
22680,
23440,
24948,
23049,
21410,
22603,
21435,
22804,
25808,
22866,
22872,
22796,
21531,
21407,
23002,
22802,
12616,
21997,
6756,
20885,
20841,
21944,
20821,
16513,
5504,
5505,
20906,
30270,
30601,
30684,
30692,
30699,
21899,
21876,
21927,
22183,
22232,
21969,
21970,
21877,
21883,
22171,
22258,
22188,
29084,
22279,
22263,
22123,
22095,
22026,
22031,
21886,
22082,
22083,
22110,
22149,
22137,
22138,
22119,
22618,
22599,
24813,
25097,
25119,
29532,
26593,
29811,
27798,
30484,
28983,
30672,
30674,
21524,
22668,
21392,
21384,
23981,
24904,
21555,
22880,
22763,
22824,
22814,
23016,
21436,
21489,
21533,
21418,
22844,
22960,
21535,
23974,
21419,
22821,
22800,
22795,
22858,
22697,
22988,
21486,
25810,
21395,
22932,
22679,
22695,
22973,
21538,
23005,
23024,
23058,
23019,
22916,
21540,
21390,
21463,
22939,
20860,
6909,
20825,
6912,
7178,
21932,
20887,
20888,
21994,
20840,
20867,
20902,
20855,
20856,
20868,
22271,
22229,
21825,
21831,
13077,
30694,
30651,
30650,
21826,
22309,
22302,
21960,
21810,
22252,
22253,
21882,
21840,
21983,
22255,
22256,
21835,
21821,
22005,
21847,
21863,
21848,
21909,
22197,
22250,
21912,
22131,
22080,
22086,
22060,
22062,
22087,
22088,
22066,
22139,
22118,
24927,
24607,
28564,
27868,
30566,
30673,
30693,
30670,
22812,
5427,
21461,
21408,
22615,
22759,
22833,
21497,
22903,
22902,
21442,
23656,
22769,
22886,
22887,
22797,
24398,
22794,
16589,
22859,
17328,
21487,
23062,
24902,
22952,
24394,
17694,
22755,
22798,
23027,
22961,
22770,
23009,
5425,
24952,
22694,
22819,
27562,
21453,
21477,
22957,
21391,
22784,
22670,
6621,
21432,
22204,
22251,
22205,
8245,
30695,
20896,
21914,
21818,
21906,
22272,
22172,
22173,
22169,
22213,
21834,
21896,
21954,
21875,
22598,
22283,
21836,
22150,
21925,
22275,
21853,
21857,
22248,
22072,
23218,
22354,
22591,
25120,
24079,
22316,
26148,
26768,
26995,
27488,
27398,
28043,
30700,
21516,
21520,
22981,
23054,
23055,
22899,
23033,
21541,
21473,
22702,
22703,
22704,
21498,
26442,
21515,
29650,
21406,
22918,
22889,
22693,
22837,
21488,
21434,
21429,
22847,
22757,
22699,
22919,
23979,
22231,
22285,
21907,
20131,
22743,
22093,
22104,
22135,
22089,
23488,
23203,
22600,
25103,
25079,
25077,
21514,
23061,
23026,
21536,
20865,
20838,
22001,
30683,
30273,
30704,
17067,
21828,
16615,
22582,
22581,
21903,
21892,
22165,
22120,
22020,
21885,
21806,
25082,
25105,
25098,
25084,
29647,
30646,
26547,
25804,
21445,
22687,
22686,
22828,
22590,
23003,
23050,
23052,
23013,
23014,
21470,
21506,
22325,
22971,
20836,
20899,
21993,
20897,
20895,
22289,
21881,
21920,
21922,
21807,
22890,
21982,
22848,
22321,
21822,
22216,
22179,
22219,
22220,
22091,
22018,
22030,
22225,
21910,
22035,
22106,
22049,
22152,
25075,
22311,
25100,
28972,
25814,
30682,
21517,
22671,
23439,
22895,
23053,
22820,
22865,
21409,
22864,
21525,
22669,
22951,
21472,
23018,
23056,
21481,
21455,
22900,
21528,
21405,
21545,
21402,
23021,
21808,
23029,
23007,
21483,
22739,
22926,
21441,
21532,
9018,
22999,
24949,
21471,
21456,
12615,
23977,
23025,
8534,
21965,
20866,
20889,
20890,
21955,
21948,
20844,
30436,
30548,
30685,
30653,
30640,
20814,
21889,
22894,
17693,
21991,
22238,
22012,
21873,
30645,
22933,
22222,
22142,
22284,
22277,
22096,
22027,
22249,
22224,
22097,
22028,
22051,
22157,
22111,
22148,
22158,
22133,
22054,
22614,
25093,
23109,
25101,
25081,
25083,
29349,
26770,
30920,
27418,
30644,
30491,
21411,
22762,
21490,
22745,
22945,
22927,
22928,
22863,
22977,
22778,
22835,
22879,
27134,
22871,
21420,
21466,
22920,
22829,
10249,
24950,
22892,
22931,
21458,
30890,
21495,
21414,
21518,
22751,
21399,
22970,
22969,
21404,
22983,
22809,
22785,
22921,
21462,
22293,
22663,
22664,
22673,
22768,
20908,
20904,
20876,
21879,
21827,
22013,
22288,
22268,
22029,
22593,
22594,
22595,
25074,
22319,
26630,
29536,
26418,
30702,
22619,
17671,
22601,
22810,
22761,
23044,
23035,
21474,
20846,
6908,
20824,
13625,
7626,
20910,
22007,
22230,
30263,
30856,
30599,
22352,
21918,
21916,
21839,
22297,
21891,
17901,
21829,
29416,
22292,
22192,
22278,
22246,
22153,
22099,
21913,
22113,
22057,
22163,
22136,
22116,
29597,
22602,
25073,
25072,
25088,
25091,
25094,
25108,
27015,
30499,
30876,
29185,
29189,
29526,
30633,
17785,
21494,
14431,
21507,
22908,
22907,
21508,
22771,
21437,
21393,
7177,
22709,
23057,
22677,
22678,
22734,
6625,
22832,
24900,
21451,
17642,
17670,
21503,
6619,
20851,
17000,
20878,
21992,
20893,
22270,
10258,
21945,
21956,
21966,
21987,
21937,
20907,
21871,
30671,
20819,
21959,
22300,
21905,
21917,
17356,
17725,
27232,
21086,
22741,
21866,
21860,
21862,
21846,
21854,
21849,
22021,
22092,
22280,
22742,
21864,
22130,
22077,
22115,
22592,
25076,
25107,
22320,
25116,
30437,
27799,
28279,
28335,
10780,
22978,
22831,
22860,
22906,
22905,
22915,
22772,
22954,
22959,
22955,
22718,
22719,
22720,
22721,
22722,
22723,
22724,
22725,
23887,
23489,
23490,
21485,
22989,
23006,
29314,
22675,
21412,
8244,
22789,
22962,
22964,
22748,
21396,
21482,
5437,
27331,
21504,
21500,
22808,
21480,
21544,
22845,
22975,
21479,
23980,
23978,
22817,
21527,
22990,
22681,
6914,
13262,
20862,
20875,
20837,
22167,
20898,
20894,
20892,
20842,
20843,
21816,
20761,
6757,
22290,
20820,
22308,
22141,
22301,
20871,
20845,
22181,
30688,
30689,
30676,
30697,
31100,
20859,
20872,
17027,
21838,
21900,
21919,
21915,
21989,
21893,
22287,
22235,
21880,
21884,
22851,
22323,
16786,
21803,
21812,
22307,
22215,
22004,
21898,
21837,
22217,
22003,
21801,
22017,
22193,
22094,
22264,
22265,
22121,
22144,
22201,
22102,
26875,
22065,
22749,
28274,
22585,
25095,
25106,
30352,
25121,
24943,
29043,
30680,
30703,
25803,
24903,
23004,
22816,
22834,
22773,
22682,
22676,
21491,
23036,
22861,
5440,
23046,
23034,
24951,
22665,
22658,
22691,
24396,
21465,
23022,
11889,
11741,
21499,
23655,
22596,
24887,
20418,
22922,
25019,
22943,
22807,
22841,
22930,
22838,
22688,
22842,
22936,
22801,
22322,
22852,
22898,
21449,
22203,
20864,
20839,
21928,
20903,
8136,
21820,
22888,
22282,
17026,
21984,
21963,
22185,
21845,
25086,
29270,
22826,
21446,
24480,
24868,
22985,
21469,
22840,
22825,
22856,
22979,
20883,
21957,
21950,
22849,
21815,
21819,
21865,
21813,
21852,
21802,
22124,
22281,
22079,
22041,
22059,
25089,
25112,
28052,
29196,
30602,
22873,
22327,
22891,
21523,
22813,
21452,
21468,
22997,
21519,
22783,
22672,
22674,
20891,
20873,
6911,
20884,
20874,
20853,
21995,
20854,
21832,
21817,
30287,
30675,
30677,
22296,
21926,
21924,
22182,
22234,
22176,
21908,
21868,
22010,
22000,
21973,
21859,
21800,
22067,
22025,
22202,
21930,
22074,
22032,
22100,
22075,
22042,
22105,
22045,
22114,
22063,
22617,
22588,
25099,
22317,
26619,
26395,
27148,
28095,
29108,
22923,
28602,
16616,
21439,
22782,
21529,
21484,
22767,
18487,
21522,
22909,
22940,
22934,
24395,
21510,
23020,
22774,
26377,
21443,
21454,
26394,
27888,
21403,
23059,
22790,
27412,
5426,
5434,
28463,
5439,
24048,
27413,
22830,
20877,
21850,
6620,
20880,
20823,
20861,
20847,
20827,
20852,
20869,
22207,
22291,
22166,
22015,
20879,
22295,
22315,
30687,
21878,
14801,
22273,
22274,
21842,
21894,
21890,
28441,
22170,
22259,
21804,
22221,
22191,
22024,
22125,
22155,
22070,
29679,
22073,
22046,
22047,
22160,
25104,
25078,
22314,
25321,
25096,
28224,
27453,
30600,
25109,
28464,
25675,
22929,
22924,
23010,
22779,
22868,
26378,
22896,
22765,
21431,
21426,
22754,
22787,
22706,
22707,
21475,
21457,
23032,
21438,
22984,
22846,
22901,
22914,
22775,
22806,
22786,
22696,
22684,
25809,
21505,
22815,
22995,
22621,
21427,
21417,
22780,
21416,
22659,
21526,
17946,
5441,
22904,
20826,
20881,
21942,
20849,
20882,
20850,
20863,
20835,
21943,
21933,
21934,
6622,
5433,
29302,
21939,
11975,
20857,
11890,
21986,
22164,
17558,
30686,
30652,
30649,
30690,
30993,
21923,
21988,
22210,
22184,
22233,
22286,
22168,
22583,
22236,
22014,
21952,
21985,
22214,
21964,
22326,
22304,
22305,
21823,
19828,
22175,
22006,
21869,
21870,
21974,
21975,
21976,
21977,
21978,
21979,
21980,
21855,
21851,
22241,
22016,
21904,
22276,
22243,
22223,
22247,
21340,
21341,
21342,
21343,
21344,
21345,
21346,
21347,
21348,
21349,
21350,
21351,
21352,
21353,
21354,
21355,
21356,
21357,
21358,
21359,
22033,
22034,
22129,
22101,
22037,
22103,
22039,
22040,
21911,
22081,
22050,
22147,
22108,
22084,
22052,
22109,
22053,
22132,
22159,
22055,
22056,
22058,
22061,
22064,
22337,
22616,
24010,
25102,
25087,
23924,
22313,
25392,
25393,
28465,
27759,
30607,
27426,
27917,
27424,
28169,
28767,
30701,
30681,
5424,
22805,
21794,
22854,
21450,
22925,
22752,
22862,
22822,
23008,
23045,
30265,
5432,
5438,
22750,
22692,
26376,
26374,
26375,
21397,
22937,
23000,
22823,
22525,
22535,
22545,
22636,
22646,
22485,
22495,
22505,
22515,
22534,
22544,
22554,
22645,
22656,
22494,
22504,
22514,
22524,
26003,
26006,
26004,
26007,
26005,
26008,
22527,
22536,
22546,
22637,
22647,
22486,
22496,
22506,
22516,
22528,
22537,
22547,
22638,
22648,
22487,
22497,
22507,
22517,
22529,
22538,
22548,
22639,
22649,
22488,
22498,
22508,
22518,
22526,
22539,
22549,
22640,
22650,
22489,
22499,
22509,
22519,
22530,
22540,
22550,
22641,
22651,
22490,
22500,
22510,
22520,
22531,
22541,
22551,
22642,
22653,
22491,
22501,
22511,
22521,
22532,
22542,
22552,
22643,
22654,
22492,
22502,
22512,
22522,
22533,
22543,
22553,
22644,
22655,
22493,
22503,
22513,
22523,
22781,
22836,
21537,
21501,
25806,
21496,
22941,
22708,
24397,
21521,
22917,
21398,
17790,
22791,
22803,
23041,
25802,
21460,
21478,
21492,
21400,
22776,
22972,
22942,
22738,
22737,
22839,
5442,
21502,
21534,
21401,
21941,
20828,
21935,
30678,
30691,
22299,
21968,
21895,
21897,
22303,
21902,
22306,
21843,
21858,
22244,
22098,
22145,
22078,
22048,
22112,
22117,
24015,
23441,
25080,
29075,
27573,
26604,
30490,
29538,
29539,
29540,
29541,
29542,
29543,
29544,
29545,
29546,
29547,
29548,
29549,
29550,
29551,
29552,
29553,
29554,
29555,
25602,
22935,
22938,
21556,
23060,
22884,
22735,
26672,
28709,
22897,
24177,
22705,
22661,
22662,
22660,
5428,
22947,
22913,
22912,
22910,
22911,
14557,
22689,
22946,
23023,
23047,
21440,
22756,
30698,
19464,
24901,
22711,
22712,
22713,
22714,
22715,
22716,
22717,
22766,
21940,
20886,
10385,
21830,
30266,
21841,
22009,
22008,
21867,
30981,
21811,
22174,
21805,
22019,
22194,
22023,
22266,
22069,
22199,
22128,
22076,
22090,
30669,
22799,
22811,
22793,
27047,
22818,
22657,
22827,
21415,
23975,
21464,
17291,
17295,
21809,
20905,
20909,
21998,
22228,
22180,
23201,
30696,
21874,
22211,
22212,
21814,
21901,
22022,
22071,
22226,
22036,
22107,
22085,
22161,
22140,
24600,
25092,
25114,
24929,
30443,
29323,
22700,
22701,
5431,
17357,
22746,
22758,
21539,
5430,
5435,
21511,
27567,
22788,
21425,
25233,
6910,
21476,
22698,
21394,
23976,
22586,
22958,
25805,
24003,
22987,
22857,
22597,
22736,
23042,
22685,
21938,
21951,
21946,
22240,
22269,
23413,
22878,
21512,
22690,
22792,
21824,
22294,
22328,
22324,
22011,
21861,
22151,
25085,
29618,
22850,
16617,
25807,
21542,
22853,
21981
]



================================================
FILE: types/index.ts
================================================
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
  activity: StudentActivity;
  metrics: Metrics;
  dri: DRIMetrics;
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
  topic: { name: string };
  questions: number;
  questionsCorrect: number;
  completedLocal: string;
  timeTotal?: number;
  smartScore?: number;
}

export interface Metrics {
  /**
   * Velocity Score basado en estándar Alpha de 125 XP/semana
   * 100% = 125 XP, 200% = 250 XP
   */
  velocityScore: number;
  
  /**
   * Accuracy Rate (% de respuestas correctas)
   */
  accuracyRate: number | null;
  
  /**
   * Focus Integrity (tiempo productivo / tiempo engaged)
   */
  focusIntegrity: number;
  
  /**
   * Topic con peor desempeño
   */
  nemesisTopic: string;
  
  /**
   * Learning Mastery Probability (LEGACY)
   * * NOTA: Realmente es "Recent Success Rate" (RSR)
   * Proporción de tasks recientes con >80% accuracy
   * NO es una probabilidad bayesiana real
   */
  lmp: number;
  
  /**
   * Knowledge Stability Index
   * 100 - sqrt(variance_of_accuracy)
   * Mide consistencia del desempeño.
   * Ahora permite null para representar "No Data" (ej: Aiden)
   */
  ksi: number | null;
  
  /**
   * Estado de estancamiento detectado
   */
  stallStatus: 'Optimal' | 'Productive Struggle' | 'Frustrated Stall';
  
  /**
   * Proporción de tiempo ocioso (idle time / total time)
   */
  idleRatio: number;
  
  // === LEGACY COMPATIBILITY ===
  consistencyIndex: number;
  stuckScore: number;
  dropoutProbability: number;
  riskStatus: 'Critical' | 'Attention' | 'On Track' | 'Dormant';
  archetype: 'Zombie' | 'Neutral' | 'Flow Master' | 'Grinder' | 'Guesser';
}

export interface DRIMetrics {
  /**
   * Investment ROI (PROXY)
   * * Alpha Protocol define: ΔS (SAT points) / T_min
   * Dashboard usa: XP_awarded / time_seconds
   * * NOTA: Este es un proxy. El iROI real requiere datos de SAT mocks
   * que no están disponibles en Math Academy API
   */
  iROI: number | null;
  
  /**
   * Debt Exposure Ratio
   * Proporción de topics K-8 maestreados durante High School
   * * Alpha Standard: DER > 20% = "remedial mode"
   */
  debtExposure: number | null;
  
  /**
   * Precision Decay Index
   * (Errores finales + 1) / (Errores iniciales + 1)
   * * Alpha Standard: PDI > 1.5 = "Short-Burst Specialist"
   */
  precisionDecay: number | null;
  
  /**
   * Tier de clasificación DRI
   */
  driTier: 'RED' | 'YELLOW' | 'GREEN';
  
  /**
   * Señal específica del estado
   */
  driSignal: string;
  
  /**
   * Clase Tailwind para color del tier
   */
  driColor: string;
  
  /**
   * Risk Score ponderado (0-100)
   * Solo presente si RISK_SCORING_ENABLED = true
   */
  riskScore?: number;
}


