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
- ✅ Vista MATRIX (KeenKT con clustering)
- ✅ Vista HEATMAP (Top 15 critical topics)
- ✅ Vista LOG (Intervention history)
- ✅ Student Modal con métricas detalladas
- ✅ Auto-sync recursivo con feedback granular

## 🚀 Quick Start
```bash
