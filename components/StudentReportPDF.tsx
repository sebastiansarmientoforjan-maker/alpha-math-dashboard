'use client';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Student } from '@/types';

interface InterventionLog {
  id: string;
  type: string;
  objective?: string;
  whatWasDone?: string;
  nextSteps?: string;
  coachName?: string;
  createdAt: any;
}

interface StudentReportOptions {
  student: Student;
  interventions?: InterventionLog[];
  includeRecommendations?: boolean;
}

// ==========================================
// PALETA DE AUTORIDAD EDUCATIVA (WCAG AAA)
// Basado en Biblia de Diseño v2026
// ==========================================
const COLORS = {
  navyBlue: [18, 67, 109],      // #12436D - Primario, confianza
  burntOrange: [216, 67, 21],   // #D84315 - Urgencia, acción requerida
  forestGreen: [46, 125, 50],   // #2E7D32 - Positivo, logros
  charcoalGray: [61, 61, 61],   // #3D3D3D - Contexto neutral
  lightGray: [248, 250, 252],   // Fondos suaves
  white: [255, 255, 255],
};

// Tier configuration con Action Headlines (Bain)
const TIER_CONFIG = {
  RED: { 
    colors: { bg: [254, 226, 226], text: [185, 28, 28] },
    headline: 'Needs Extra Support',
    actionText: 'Schedule coaching session this week',
    icon: '🎯'
  },
  YELLOW: { 
    colors: { bg: [254, 243, 199], text: [161, 98, 7] },
    headline: 'Building Momentum',
    actionText: 'Continue current approach with minor adjustments',
    icon: '📈'
  },
  GREEN: { 
    colors: { bg: [209, 250, 229], text: [6, 95, 70] },
    headline: 'Excellent Progress',
    actionText: 'Ready for advanced challenges',
    icon: '⭐'
  },
};

// ==========================================
// GENERADOR DE RECOMENDACIONES
// Lenguaje positivo y orientado a acción
// ==========================================
function generateRecommendations(student: Student): { text: string; priority: 'high' | 'medium' | 'low' }[] {
  const recommendations: { text: string; priority: 'high' | 'medium' | 'low' }[] = [];
  const { metrics, dri } = student;

  // RSR-based (Recent Success)
  if (metrics.lmp < 0.6) {
    recommendations.push({ 
      text: 'Review recent topics before moving forward - building a strong foundation leads to faster progress later.',
      priority: 'high'
    });
  } else if (metrics.lmp < 0.8) {
    recommendations.push({ 
      text: 'Great improvement! Focus on the specific areas identified in recent practice sessions.',
      priority: 'medium'
    });
  }

  // Velocity-based (Engagement)
  if (metrics.velocityScore < 50) {
    recommendations.push({ 
      text: 'Increase daily practice time by 10-15 minutes to build stronger learning momentum.',
      priority: 'high'
    });
  } else if (metrics.velocityScore < 80) {
    recommendations.push({ 
      text: 'Almost at target! A small increase in practice time will help reach weekly goals.',
      priority: 'medium'
    });
  }

  // Risk-based (Support needed)
  if (dri.riskScore && dri.riskScore >= 60) {
    recommendations.push({ 
      text: 'A one-on-one coaching session would be beneficial to address current challenges.',
      priority: 'high'
    });
  }

  // KSI-based (Consistency)
  if (metrics.ksi !== null && metrics.ksi < 60) {
    recommendations.push({ 
      text: 'Practicing at the same time each day helps build stronger learning habits.',
      priority: 'medium'
    });
  }

  // DER-based (Foundation gaps)
  if (metrics.der && metrics.der > 20) {
    recommendations.push({ 
      text: 'Strengthening foundational skills will make advanced topics easier to master.',
      priority: 'medium'
    });
  }

  // Positive reinforcement if doing well
  if (dri.driTier === 'GREEN') {
    recommendations.push({ 
      text: 'Excellent work! Consider exploring challenge problems or helping classmates.',
      priority: 'low'
    });
  }

  return recommendations.slice(0, 4);
}

// ==========================================
// MAIN PDF GENERATOR
// Aplicando: Pirámide de Minto, Patrón F, 
// Capas de Cebolla, Action Headlines
// ==========================================
export async function generateStudentPDF({ 
  student, 
  interventions = [], 
  includeRecommendations = true 
}: StudentReportOptions): Promise<void> {
  
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  let yPos = 0;

  const tierConfig = TIER_CONFIG[student.dri.driTier] || TIER_CONFIG.GREEN;
  const reportDate = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', month: 'long', day: 'numeric' 
  });

  // ==========================================
  // CAPA 1: HEADER CON ASERCIÓN PRINCIPAL
  // (Pirámide de Minto - Respuesta primero)
  // Zona F-Superior para máximo impacto
  // ==========================================
  
  // Header bar - Navy Blue (Autoridad)
  doc.setFillColor(COLORS.navyBlue[0], COLORS.navyBlue[1], COLORS.navyBlue[2]);
  doc.rect(0, 0, pageWidth, 45, 'F');

  // Logo/Brand
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('ALPHA MATH ACADEMY', margin, 18);

  // Subtitle
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Student Progress Report', margin, 28);
  
  // Date (right aligned)
  doc.setFontSize(8);
  doc.text(reportDate, pageWidth - margin, 18, { align: 'right' });
  
  // ACTION HEADLINE - La conclusión principal (Bain/Minto)
  // Este es el dato más importante, visible en los primeros 5 segundos
  doc.setFillColor(tierConfig.colors.bg[0], tierConfig.colors.bg[1], tierConfig.colors.bg[2]);
  doc.rect(0, 45, pageWidth, 25, 'F');
  
  doc.setTextColor(tierConfig.colors.text[0], tierConfig.colors.text[1], tierConfig.colors.text[2]);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(`${tierConfig.icon} ${student.firstName} is ${tierConfig.headline}`, margin, 60);
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Recommended action: ${tierConfig.actionText}`, margin, 67);

  yPos = 80;

  // ==========================================
  // CAPA 2: KPI DE CONTROL + INFO ESTUDIANTE
  // (Patrón F - Info crítica en zona superior)
  // ==========================================
  
  // Student Info Box
  doc.setFillColor(COLORS.lightGray[0], COLORS.lightGray[1], COLORS.lightGray[2]);
  doc.roundedRect(margin, yPos, pageWidth - margin * 2, 35, 3, 3, 'F');

  // Name
  doc.setTextColor(COLORS.navyBlue[0], COLORS.navyBlue[1], COLORS.navyBlue[2]);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(`${student.firstName} ${student.lastName}`, margin + 8, yPos + 14);

  // Course
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(COLORS.charcoalGray[0], COLORS.charcoalGray[1], COLORS.charcoalGray[2]);
  doc.text(student.currentCourse?.name || 'Mathematics', margin + 8, yPos + 24);

  // KPI Badge (Risk Score) - Anotación directa sobre el dato
  const kpiX = pageWidth - margin - 45;
  doc.setFillColor(COLORS.navyBlue[0], COLORS.navyBlue[1], COLORS.navyBlue[2]);
  doc.roundedRect(kpiX, yPos + 5, 40, 25, 3, 3, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text('PROGRESS', kpiX + 20, yPos + 12, { align: 'center' });
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(`${student.metrics.velocityScore}%`, kpiX + 20, yPos + 24, { align: 'center' });

  yPos += 45;

  // ==========================================
  // CAPA 3: MÉTRICAS PRINCIPALES
  // (Visuales 5-30 segundos - Capa Media)
  // Títulos de acción, no descriptivos
  // ==========================================
  
  // Section Title - Action Headline
  doc.setTextColor(COLORS.navyBlue[0], COLORS.navyBlue[1], COLORS.navyBlue[2]);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Current Performance Snapshot', margin, yPos);
  yPos += 8;

  // Metrics with direct annotations (Mayer - Anotación directa)
  const metricsData = [
    { 
      label: 'Recent Success',
      value: `${(student.metrics.lmp * 100).toFixed(0)}%`,
      annotation: student.metrics.lmp >= 0.8 ? 'On target' : student.metrics.lmp >= 0.6 ? 'Improving' : 'Needs focus',
      isGood: student.metrics.lmp >= 0.7
    },
    { 
      label: 'Weekly Progress',
      value: `${student.metrics.velocityScore}%`,
      annotation: student.metrics.velocityScore >= 80 ? 'On track' : student.metrics.velocityScore >= 50 ? 'Building up' : 'Boost needed',
      isGood: student.metrics.velocityScore >= 70
    },
    { 
      label: 'Consistency',
      value: student.metrics.ksi !== null ? `${student.metrics.ksi}%` : 'N/A',
      annotation: (student.metrics.ksi || 0) >= 70 ? 'Stable' : (student.metrics.ksi || 0) >= 50 ? 'Variable' : 'Building habits',
      isGood: (student.metrics.ksi || 0) >= 60
    },
    { 
      label: 'Accuracy',
      value: `${student.metrics.accuracyRate || 0}%`,
      annotation: (student.metrics.accuracyRate || 0) >= 80 ? 'Excellent' : (student.metrics.accuracyRate || 0) >= 60 ? 'Good' : 'Practicing',
      isGood: (student.metrics.accuracyRate || 0) >= 70
    },
  ];

  const colWidth = (pageWidth - margin * 2 - 15) / 4;
  const rowHeight = 40;

  metricsData.forEach((metric, i) => {
    const x = margin + i * (colWidth + 5);
    
    // Card background
    const bgColor = metric.isGood ? COLORS.forestGreen : COLORS.burntOrange;
    doc.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
    doc.roundedRect(x, yPos, colWidth, rowHeight, 3, 3, 'F');
    
    // Label
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text(metric.label.toUpperCase(), x + colWidth / 2, yPos + 10, { align: 'center' });
    
    // Value (prominente)
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(metric.value, x + colWidth / 2, yPos + 24, { align: 'center' });
    
    // Direct annotation (Mayer principle)
    doc.setFontSize(7);
    doc.setFont('helvetica', 'italic');
    doc.text(metric.annotation, x + colWidth / 2, yPos + 34, { align: 'center' });
  });

  yPos += rowHeight + 15;

  // ==========================================
  // CAPA 4: RECOMENDACIONES PERSONALIZADAS
  // (Orientadas a acción, lenguaje positivo)
  // ==========================================
  
  if (includeRecommendations) {
    // Section Title - Action oriented
    doc.setTextColor(COLORS.navyBlue[0], COLORS.navyBlue[1], COLORS.navyBlue[2]);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Next Steps for Success', margin, yPos);
    yPos += 8;

    const recommendations = generateRecommendations(student);

    // Recommendations box
    const recHeight = 10 + recommendations.length * 14;
    doc.setFillColor(COLORS.lightGray[0], COLORS.lightGray[1], COLORS.lightGray[2]);
    doc.roundedRect(margin, yPos, pageWidth - margin * 2, recHeight, 3, 3, 'F');

    // Priority indicator line on left
    doc.setFillColor(COLORS.navyBlue[0], COLORS.navyBlue[1], COLORS.navyBlue[2]);
    doc.rect(margin, yPos, 3, recHeight, 'F');

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    
    recommendations.forEach((rec, i) => {
      // Priority color dot
      const dotColor = rec.priority === 'high' ? COLORS.burntOrange : 
                       rec.priority === 'medium' ? [161, 98, 7] : COLORS.forestGreen;
      doc.setFillColor(dotColor[0], dotColor[1], dotColor[2]);
      doc.circle(margin + 12, yPos + 8 + i * 14, 2, 'F');
      
      // Recommendation text
      doc.setTextColor(COLORS.charcoalGray[0], COLORS.charcoalGray[1], COLORS.charcoalGray[2]);
      doc.text(rec.text, margin + 20, yPos + 10 + i * 14);
    });

    yPos += recHeight + 15;
  }

  // ==========================================
  // CAPA 5: EXPLICACIÓN SIMPLE DE MÉTRICAS
  // (Para padres - sin tecnicismos)
  // ==========================================
  
  doc.setTextColor(COLORS.navyBlue[0], COLORS.navyBlue[1], COLORS.navyBlue[2]);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Understanding This Report', margin, yPos);
  yPos += 6;

  doc.setFillColor(COLORS.lightGray[0], COLORS.lightGray[1], COLORS.lightGray[2]);
  doc.roundedRect(margin, yPos, pageWidth - margin * 2, 38, 3, 3, 'F');

  const explanations = [
    '• Recent Success: How well your student performed on recent practice sessions',
    '• Weekly Progress: Percentage of weekly learning goals completed',
    '• Consistency: How regularly your student practices (daily habits matter!)',
    '• Accuracy: Percentage of questions answered correctly overall'
  ];

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(COLORS.charcoalGray[0], COLORS.charcoalGray[1], COLORS.charcoalGray[2]);
  
  explanations.forEach((exp, i) => {
    doc.text(exp, margin + 5, yPos + 8 + i * 8);
  });

  yPos += 48;

  // ==========================================
  // CAPA 6: HISTORIAL DE COACHING
  // (Solo si hay intervenciones)
  // ==========================================
  
  if (interventions.length > 0) {
    // Check for page break
    if (yPos > pageHeight - 70) {
      doc.addPage();
      yPos = 20;
    }

    doc.setTextColor(COLORS.navyBlue[0], COLORS.navyBlue[1], COLORS.navyBlue[2]);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Recent Support Sessions', margin, yPos);
    yPos += 5;

    const recentInterventions = interventions.slice(0, 4);
    
    autoTable(doc, {
      startY: yPos,
      head: [['Date', 'Focus Area', 'Next Steps']],
      body: recentInterventions.map(int => [
        int.createdAt?.seconds 
          ? new Date(int.createdAt.seconds * 1000).toLocaleDateString() 
          : 'N/A',
        int.objective || 'General support',
        int.nextSteps?.substring(0, 50) + (int.nextSteps && int.nextSteps.length > 50 ? '...' : '') || 'Continue practice',
      ]),
      theme: 'plain',
      headStyles: { 
        fillColor: COLORS.navyBlue as [number, number, number],
        textColor: [255, 255, 255], 
        fontStyle: 'bold', 
        fontSize: 8 
      },
      bodyStyles: { 
        fontSize: 8, 
        textColor: COLORS.charcoalGray as [number, number, number],
        cellPadding: 4
      },
      alternateRowStyles: { 
        fillColor: COLORS.lightGray as [number, number, number]
      },
      margin: { left: margin, right: margin },
    });
  }

  // ==========================================
  // FOOTER - Branding y contacto
  // ==========================================
  
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    
    // Footer line
    doc.setDrawColor(COLORS.navyBlue[0], COLORS.navyBlue[1], COLORS.navyBlue[2]);
    doc.setLineWidth(0.5);
    doc.line(margin, pageHeight - 18, pageWidth - margin, pageHeight - 18);
    
    // Footer text
    doc.setFontSize(7);
    doc.setTextColor(COLORS.charcoalGray[0], COLORS.charcoalGray[1], COLORS.charcoalGray[2]);
    doc.text(
      'Alpha Math Academy • Personalized Learning • This report is confidential',
      pageWidth / 2,
      pageHeight - 12,
      { align: 'center' }
    );
    doc.text(
      `Page ${i} of ${pageCount}`,
      pageWidth - margin,
      pageHeight - 12,
      { align: 'right' }
    );
  }

  // ==========================================
  // GUARDAR PDF
  // Nombre: {Nombre}_{Apellido}_{fecha}.pdf
  // ==========================================
  
  const filename = `${student.firstName}_${student.lastName}_Progress_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
}

export default generateStudentPDF;
