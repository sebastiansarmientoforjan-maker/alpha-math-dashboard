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
