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

// Tier colors for PDF
const TIER_COLORS = {
  RED: { bg: [254, 226, 226], text: [185, 28, 28], label: 'Critical' },
  YELLOW: { bg: [254, 243, 199], text: [161, 98, 7], label: 'Watch' },
  GREEN: { bg: [209, 250, 229], text: [6, 95, 70], label: 'Optimal' },
};

// Metric explanations for parents/students
const METRIC_EXPLANATIONS: Record<string, string> = {
  rsr: 'Recent Success Rate measures how well the student performed on recent tasks. Higher is better.',
  ksi: 'Knowledge Stability shows how consistent the student\'s understanding is over time.',
  velocity: 'Velocity indicates progress toward weekly learning goals. 100% means on track.',
  riskScore: 'Risk Score combines multiple factors to identify students who may need extra support. Lower is better.',
  der: 'Debt Exposure Ratio shows prerequisite topics that need strengthening.',
  pdi: 'Precision Decay Index tracks if accuracy is declining over time.',
};

// Generate personalized recommendations based on metrics
function generateRecommendations(student: Student): string[] {
  const recommendations: string[] = [];
  const { metrics, dri } = student;

  // RSR-based recommendations
  if (metrics.lmp < 0.6) {
    recommendations.push('Focus on reviewing recently challenging topics before moving forward.');
    recommendations.push('Consider shorter, more frequent study sessions to build confidence.');
  } else if (metrics.lmp < 0.8) {
    recommendations.push('Good progress! Target specific weak areas identified in recent tasks.');
  }

  // Velocity-based recommendations
  if (metrics.velocityScore < 50) {
    recommendations.push('Increase daily practice time to meet weekly XP goals.');
    recommendations.push('Set small, achievable daily targets to build momentum.');
  } else if (metrics.velocityScore < 80) {
    recommendations.push('Slightly increase engagement to reach optimal velocity.');
  }

  // Risk-based recommendations
  if (dri.riskScore && dri.riskScore >= 60) {
    recommendations.push('Schedule a 1:1 coaching session to address current challenges.');
    recommendations.push('Review foundational concepts before advancing to new material.');
  } else if (dri.riskScore && dri.riskScore >= 35) {
    recommendations.push('Monitor progress closely over the next week.');
  }

  // KSI-based recommendations
  if (metrics.ksi !== null && metrics.ksi < 60) {
    recommendations.push('Practice consistency - try to study at the same time each day.');
    recommendations.push('Use spaced repetition to reinforce learned concepts.');
  }

  // DER-based recommendations
  if (metrics.der && metrics.der > 20) {
    recommendations.push('Spend extra time on prerequisite topics to build a stronger foundation.');
  }

  // If doing well
  if (recommendations.length === 0) {
    recommendations.push('Excellent progress! Continue with current study habits.');
    recommendations.push('Consider exploring advanced topics or helping peers.');
  }

  return recommendations.slice(0, 4); // Max 4 recommendations
}

export async function generateStudentPDF({ student, interventions = [], includeRecommendations = true }: StudentReportOptions): Promise<void> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  let yPos = 0;

  const tierConfig = TIER_COLORS[student.dri.driTier] || TIER_COLORS.GREEN;
  const reportDate = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', month: 'long', day: 'numeric' 
  });

  // ==========================================
  // HEADER
  // ==========================================
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 50, 'F');

  // Logo text (placeholder - replace with actual logo if available)
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('ALPHA MATH', margin, 25);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Student Progress Report', margin, 35);

  // Date on right
  doc.setFontSize(9);
  doc.text(reportDate, pageWidth - margin, 25, { align: 'right' });
  doc.text('DRI Command Center', pageWidth - margin, 35, { align: 'right' });

  yPos = 60;

  // ==========================================
  // STUDENT INFO + TIER BADGE
  // ==========================================
  doc.setFillColor(248, 250, 252); // slate-50
  doc.roundedRect(margin, yPos, pageWidth - margin * 2, 40, 3, 3, 'F');

  // Student name
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(`${student.firstName} ${student.lastName}`, margin + 8, yPos + 15);

  // Course
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(student.currentCourse?.name || 'N/A', margin + 8, yPos + 25);

  // Student ID
  doc.setFontSize(8);
  doc.text(`ID: ${student.id}`, margin + 8, yPos + 33);

  // Tier Badge
  const badgeWidth = 50;
  const badgeX = pageWidth - margin - badgeWidth - 8;
  doc.setFillColor(tierConfig.bg[0], tierConfig.bg[1], tierConfig.bg[2]);
  doc.roundedRect(badgeX, yPos + 8, badgeWidth, 24, 3, 3, 'F');

  doc.setTextColor(tierConfig.text[0], tierConfig.text[1], tierConfig.text[2]);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('STATUS', badgeX + badgeWidth / 2, yPos + 16, { align: 'center' });
  doc.setFontSize(12);
  doc.text(tierConfig.label.toUpperCase(), badgeX + badgeWidth / 2, yPos + 27, { align: 'center' });

  yPos += 50;

  // ==========================================
  // METRICS SECTION
  // ==========================================
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Current Metrics', margin, yPos);
  yPos += 8;

  // Metrics grid
  const metricsData = [
    { 
      label: 'Recent Success Rate (RSR)', 
      value: `${(student.metrics.lmp * 100).toFixed(0)}%`,
      status: student.metrics.lmp >= 0.8 ? 'good' : student.metrics.lmp >= 0.6 ? 'warning' : 'critical'
    },
    { 
      label: 'Knowledge Stability (KSI)', 
      value: student.metrics.ksi !== null ? `${student.metrics.ksi}%` : 'N/A',
      status: (student.metrics.ksi || 0) >= 70 ? 'good' : (student.metrics.ksi || 0) >= 50 ? 'warning' : 'critical'
    },
    { 
      label: 'Weekly Velocity', 
      value: `${student.metrics.velocityScore}%`,
      status: student.metrics.velocityScore >= 80 ? 'good' : student.metrics.velocityScore >= 50 ? 'warning' : 'critical'
    },
    { 
      label: 'Risk Score', 
      value: `${student.dri.riskScore || 0}/100`,
      status: (student.dri.riskScore || 0) < 35 ? 'good' : (student.dri.riskScore || 0) < 60 ? 'warning' : 'critical'
    },
    { 
      label: 'Debt Exposure (DER)', 
      value: student.metrics.der ? `${student.metrics.der}%` : 'N/A',
      status: (student.metrics.der || 0) < 10 ? 'good' : (student.metrics.der || 0) < 20 ? 'warning' : 'critical'
    },
    { 
      label: 'Precision Decay (PDI)', 
      value: student.metrics.pdi ? student.metrics.pdi.toFixed(2) : 'N/A',
      status: (student.metrics.pdi || 0) < 1.2 ? 'good' : (student.metrics.pdi || 0) < 1.5 ? 'warning' : 'critical'
    },
  ];

  const statusColors = {
    good: { bg: [209, 250, 229], text: [6, 95, 70] },
    warning: { bg: [254, 243, 199], text: [161, 98, 7] },
    critical: { bg: [254, 226, 226], text: [185, 28, 28] },
  };

  const colWidth = (pageWidth - margin * 2 - 10) / 3;
  const rowHeight = 28;

  metricsData.forEach((metric, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const x = margin + col * (colWidth + 5);
    const y = yPos + row * (rowHeight + 5);

    const colors = statusColors[metric.status];
    doc.setFillColor(colors.bg[0], colors.bg[1], colors.bg[2]);
    doc.roundedRect(x, y, colWidth, rowHeight, 2, 2, 'F');

    doc.setTextColor(100, 116, 139);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text(metric.label.toUpperCase(), x + 5, y + 10);

    doc.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(metric.value, x + 5, y + 22);
  });

  yPos += (rowHeight + 5) * 2 + 15;

  // ==========================================
  // METRIC EXPLANATIONS
  // ==========================================
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Understanding the Metrics', margin, yPos);
  yPos += 8;

  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, yPos, pageWidth - margin * 2, 45, 3, 3, 'F');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);

  const explanationLines = [
    '• RSR (Recent Success Rate): Performance on recent tasks. Target: 80%+',
    '• KSI (Knowledge Stability): Consistency over time. Target: 70%+',
    '• Velocity: Progress toward weekly goals. Target: 80%+',
    '• Risk Score: Overall risk indicator. Target: Below 35',
    '• DER: Prerequisite gaps. Target: Below 10%',
    '• PDI: Accuracy trend. Target: Below 1.2',
  ];

  explanationLines.forEach((line, i) => {
    doc.text(line, margin + 5, yPos + 8 + i * 7);
  });

  yPos += 55;

  // ==========================================
  // RECOMMENDATIONS
  // ==========================================
  if (includeRecommendations) {
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Personalized Recommendations', margin, yPos);
    yPos += 8;

    const recommendations = generateRecommendations(student);

    doc.setFillColor(239, 246, 255); // blue-50
    doc.roundedRect(margin, yPos, pageWidth - margin * 2, 8 + recommendations.length * 10, 3, 3, 'F');

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 64, 175);

    recommendations.forEach((rec, i) => {
      doc.text(`${i + 1}. ${rec}`, margin + 5, yPos + 8 + i * 10);
    });

    yPos += 15 + recommendations.length * 10;
  }

  // ==========================================
  // RECENT INTERVENTIONS
  // ==========================================
  if (interventions.length > 0) {
    // Check if we need a new page
    if (yPos > pageHeight - 80) {
      doc.addPage();
      yPos = 20;
    }

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Recent Coaching Sessions', margin, yPos);
    yPos += 5;

    const recentInterventions = interventions.slice(0, 5);
    
    autoTable(doc, {
      startY: yPos,
      head: [['Date', 'Coach', 'Objective', 'Next Steps']],
      body: recentInterventions.map(int => [
        int.createdAt?.seconds 
          ? new Date(int.createdAt.seconds * 1000).toLocaleDateString() 
          : 'N/A',
        int.coachName || 'N/A',
        int.objective || 'N/A',
        int.nextSteps?.substring(0, 40) + (int.nextSteps && int.nextSteps.length > 40 ? '...' : '') || 'N/A',
      ]),
      theme: 'striped',
      headStyles: { 
        fillColor: [79, 70, 229], 
        textColor: [255, 255, 255], 
        fontStyle: 'bold', 
        fontSize: 8 
      },
      bodyStyles: { fontSize: 8, textColor: [30, 41, 59] },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { left: margin, right: margin },
    });
  }

  // ==========================================
  // FOOTER
  // ==========================================
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(
      'Alpha Math Academy • DRI Command Center • Confidential Student Report',
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
    doc.text(
      `Page ${i} of ${pageCount}`,
      pageWidth - margin,
      pageHeight - 10,
      { align: 'right' }
    );
  }

  // ==========================================
  // SAVE
  // ==========================================
  const filename = `${student.firstName}_${student.lastName}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
}

export default generateStudentPDF;
