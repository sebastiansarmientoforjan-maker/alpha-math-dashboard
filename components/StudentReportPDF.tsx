'use client';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Student } from '@/types';

interface StudentReportOptions {
  student: Student;
  interventions?: any[];
  driName?: string;
  includeRecommendations?: boolean;
}

const COLORS = {
  navy: [18, 67, 109],
  accentOrange: [216, 67, 21],
  positiveGreen: [27, 94, 32],
  lightGreen: [232, 245, 233],
  textMain: [26, 26, 26],
  textGrey: [97, 97, 97],
  softBg: [248, 249, 250],
  white: [255, 255, 255],
};

function generateDiagnosis(student: Student) {
  const accuracy = student.metrics.accuracyRate || 0;
  const velocity = student.metrics.velocityScore || 0;
  const ksi = student.metrics.ksi || 50;
  
  let headline = { hasStrength: 'the Accuracy', needsWork: 'your Rhythm' };
  let executiveDiagnosis = `Your ${accuracy}% Accuracy confirms mastery. However, your ${velocity}% Progress is the current bottleneck. My instruction is clear: adjust +15 minutes daily to activate your momentum.`;
  let momentumGap = { 
    title: 'The Momentum Gap', 
    points: [
      'Cognitive Friction: Without daily practice, your brain slows down under exam pressure.',
      'Endurance Deficit: Tests require sustained focus. Your rhythm currently only prepares you for short bursts.'
    ] 
  };
  let driInsight = `“${student.firstName}: If we do not close the volume gap now, your ${accuracy}% accuracy will remain potential rather than performance. Consistency is the only multiplier that matters.”`;
  let protocol = [
    { title: "The 15' Volume Power-Up", description: 'Add exactly 15 minutes of focused practice to your current session.' },
    { title: 'Active Error Armoring', description: "Spend the first 3 minutes of your session reviewing yesterday's errors." },
  ];
  let expectedOutcome = `Executing this instruction will stabilize your technical base and elevate your weekly progress to ${Math.min(velocity + 25, 80)}%, securing stronger performance in the next evaluation cycle.`;

  // Pattern adjustment logic (simplificada para el reporte)
  if (accuracy < 60) {
    headline = { hasStrength: 'the Effort', needsWork: 'Precision' };
    executiveDiagnosis = `Your ${velocity}% Progress shows commitment. However, your ${accuracy}% Accuracy indicates we need to slow down and solidify foundations.`;
  }

  return { headline, executiveDiagnosis, momentumGap, driInsight, protocol, expectedOutcome };
}

export async function generateStudentPDF({ 
  student, 
  interventions = [], 
  driName = 'Sebastian Sarmiento',
  includeRecommendations = true,
}: StudentReportOptions): Promise<void> {
  
  const doc = new jsPDF({
    orientation: 'p',
    unit: 'mm',
    format: 'a4',
    putOnlyUsedFonts: true
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 12;
  const diagnosis = generateDiagnosis(student);
  const reportDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

  // --- HELPER: FOOTER ---
  const addFooter = (pageNum: number, total: number) => {
    doc.setPage(pageNum);
    doc.setDrawColor(COLORS.navy[0], COLORS.navy[1], COLORS.navy[2]);
    doc.setLineWidth(0.2);
    doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(COLORS.textMain[0], COLORS.textMain[1], COLORS.textMain[2]);
    doc.text(student.firstName.toUpperCase(), margin, pageHeight - 10);
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(COLORS.textGrey[0], COLORS.textGrey[1], COLORS.textGrey[2]);
    doc.text('High Performance Report -- Math Academy Data', pageWidth / 2, pageHeight - 10, { align: 'center' });
    doc.text(reportDate, pageWidth - margin, pageHeight - 10, { align: 'right' });
  };

  // ==========================================
  // PAGE 1: STRATEGIC DIRECTIVE
  // ==========================================
  
  // HERO SECTION
  doc.setFillColor(COLORS.navy[0], COLORS.navy[1], COLORS.navy[2]);
  doc.roundedRect(margin, margin, pageWidth - margin * 2, 50, 4, 4, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text(`INTERVENTION DIRECTIVE | DRI ${driName.toUpperCase()}`, margin + 8, margin + 10);

  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(`${student.firstName}, you have ${diagnosis.headline.hasStrength}.`, margin + 8, margin + 25);
  doc.text('Now we need ', margin + 8, margin + 35);
  const textWidth = doc.getTextWidth('Now we need ');
  doc.setTextColor(COLORS.accentOrange[0], COLORS.accentOrange[1], COLORS.accentOrange[2]);
  doc.text(diagnosis.headline.needsWork + '.', margin + 8 + textWidth, margin + 35);

  doc.setTextColor(230, 230, 230);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  const diagLines = doc.splitTextToSize(`Executive Diagnosis: ${diagnosis.executiveDiagnosis}`, pageWidth - margin * 2 - 16);
  doc.text(diagLines, margin + 8, margin + 44);

  // KPI LAYER
  let yPos = margin + 60;
  const kpiWidth = (pageWidth - margin * 2 - 10) / 3;
  const kpis = [
    { label: 'MASTERY', sub: 'ACCURACY', val: `${student.metrics.accuracyRate || 0}%`, col: COLORS.positiveGreen },
    { label: 'VELOCITY', sub: 'PROGRESS', val: `${student.metrics.velocityScore || 0}%`, col: COLORS.accentOrange },
    { label: 'PRESENCE', sub: 'CONSISTENCY', val: `${student.metrics.ksi || 0}%`, col: COLORS.textMain },
  ];

  kpis.forEach((kpi, i) => {
    const x = margin + i * (kpiWidth + 5);
    doc.setFillColor(COLORS.softBg[0], COLORS.softBg[1], COLORS.softBg[2]);
    doc.setDrawColor(COLORS.navy[0], COLORS.navy[1], COLORS.navy[2]);
    doc.setLineWidth(0.1);
    doc.roundedRect(x, yPos, kpiWidth, 35, 3, 3, 'FD');
    
    doc.setTextColor(COLORS.navy[0], COLORS.navy[1], COLORS.navy[2]);
    doc.setFontSize(6); doc.setFont('helvetica', 'bold');
    doc.text(kpi.label, x + kpiWidth / 2, yPos + 6, { align: 'center' });
    
    doc.setTextColor(kpi.col[0], kpi.col[1], kpi.col[2]);
    doc.setFontSize(22);
    doc.text(kpi.val, x + kpiWidth / 2, yPos + 18, { align: 'center' });
    
    doc.setTextColor(COLORS.textMain[0], COLORS.textMain[1], COLORS.textMain[2]);
    doc.setFontSize(7);
    doc.text(kpi.sub, x + kpiWidth / 2, yPos + 26, { align: 'center' });
  });

  // DIAGNOSIS & INSIGHT
  yPos += 48;
  doc.setDrawColor(COLORS.navy[0], COLORS.navy[1], COLORS.navy[2], 0.2);
  doc.setLineWidth(0.5);
  doc.line(pageWidth / 2, yPos, pageWidth / 2, yPos + 40);

  // Left: Momentum Gap
  doc.setTextColor(COLORS.navy[0], COLORS.navy[1], COLORS.navy[2]);
  doc.setFontSize(11); doc.setFont('helvetica', 'bold');
  doc.text(diagnosis.momentumGap.title, margin, yPos);
  doc.line(margin, yPos + 2, pageWidth / 2 - 5, yPos + 2);

  doc.setTextColor(COLORS.textMain[0], COLORS.textMain[1], COLORS.textMain[2]);
  doc.setFontSize(8); doc.setFont('helvetica', 'normal');
  let bulletY = yPos + 10;
  diagnosis.momentumGap.points.forEach(p => {
    doc.text('•', margin, bulletY);
    const pLines = doc.splitTextToSize(p, pageWidth / 2 - 15);
    doc.text(pLines, margin + 4, bulletY);
    bulletY += pLines.length * 4 + 2;
  });

  // Right: DRI Insight
  const rightX = pageWidth / 2 + 5;
  doc.setTextColor(COLORS.navy[0], COLORS.navy[1], COLORS.navy[2]);
  doc.text('DRI Insight', rightX, yPos);
  doc.line(rightX, yPos + 2, pageWidth - margin, yPos + 2);
  
  doc.setTextColor(COLORS.textMain[0], COLORS.textMain[1], COLORS.textMain[2]);
  doc.setFont('helvetica', 'italic');
  const insightLines = doc.splitTextToSize(diagnosis.driInsight, pageWidth / 2 - 15);
  doc.text(insightLines, rightX, yPos + 10);
  doc.setFont('helvetica', 'bold');
  doc.text(`-- ${driName}`, rightX, yPos + 10 + (insightLines.length * 4) + 4);

  // PROTOCOL
  if (includeRecommendations) {
    yPos = bulletY + 10;
    doc.setTextColor(COLORS.navy[0], COLORS.navy[1], COLORS.navy[2]);
    doc.setFontSize(11);
    doc.text('Protocol: Immediate Execution', margin, yPos);
    doc.line(margin, yPos + 2, pageWidth - margin, yPos + 2);
    
    yPos += 10;
    diagnosis.protocol.forEach((step, i) => {
      doc.setFillColor(COLORS.navy[0], COLORS.navy[1], COLORS.navy[2]);
      doc.roundedRect(margin, yPos - 4, 10, 6, 1, 1, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.text(`0${i+1}`, margin + 5, yPos, { align: 'center' });
      
      doc.setTextColor(COLORS.textMain[0], COLORS.textMain[1], COLORS.textMain[2]);
      doc.setFont('helvetica', 'bold');
      doc.text(step.title + ':', margin + 14, yPos);
      doc.setFont('helvetica', 'normal');
      const stepDesc = doc.splitTextToSize(step.description, pageWidth - margin * 2 - 40);
      doc.text(stepDesc, margin + 14, yPos + 5);
      yPos += 12;
    });

    // ROI BOX
    doc.setFillColor(COLORS.lightGreen[0], COLORS.lightGreen[1], COLORS.lightGreen[2]);
    doc.setDrawColor(COLORS.positiveGreen[0], COLORS.positiveGreen[1], COLORS.positiveGreen[2]);
    doc.setLineWidth(0.4);
    doc.roundedRect(margin, yPos, pageWidth - margin * 2, 18, 2, 2, 'FD');
    doc.setTextColor(COLORS.positiveGreen[0], COLORS.positiveGreen[1], COLORS.positiveGreen[2]);
    doc.setFontSize(7); doc.setFont('helvetica', 'bold');
    doc.text('EXPECTED OUTCOME (ROI)', margin + 4, yPos + 5);
    doc.setFontSize(8); doc.setFont('helvetica', 'normal');
    const roiLines = doc.splitTextToSize(diagnosis.expectedOutcome, pageWidth - margin * 2 - 8);
    doc.text(roiLines, margin + 4, yPos + 11);
  }

  addFooter(1, interventions.length > 0 ? 2 : 1);

  // ==========================================
  // PAGE 2: COACHING EVIDENCE (IF EXISTS)
  // ==========================================
  if (interventions.length > 0) {
    doc.addPage();
    doc.setFillColor(COLORS.softBg[0], COLORS.softBg[1], COLORS.softBg[2]);
    doc.rect(0, 0, pageWidth, 35, 'F');
    
    doc.setTextColor(COLORS.navy[0], COLORS.navy[1], COLORS.navy[2]);
    doc.setFontSize(18); doc.setFont('helvetica', 'bold');
    doc.text('Coaching Log & Evidence', margin, 20);
    doc.setFontSize(9); doc.setFont('helvetica', 'normal');
    doc.text(`Audit trail of pedagogical interventions for ${student.firstName}.`, margin, 28);

    autoTable(doc, {
      startY: 40,
      head: [['Date', 'Intervention Objective', 'Action Taken', 'Next Steps']],
      body: interventions.map(inv => [
        inv.interventionDate?.toDate?.().toLocaleDateString() || new Date(inv.interventionDate).toLocaleDateString(),
        inv.objective,
        inv.whatWasDone,
        inv.nextSteps || 'Review progress'
      ]),
      headStyles: { fillColor: COLORS.navy, fontSize: 8, fontStyle: 'bold', halign: 'left' },
      bodyStyles: { fontSize: 7.5, textColor: COLORS.textMain, cellPadding: 4 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 40 },
        3: { cellWidth: 40 }
      },
      margin: { left: margin, right: margin }
    });

    addFooter(2, 2);
  }

  doc.save(`Strategic_Report_${student.firstName}_${new Date().toISOString().split('T')[0]}.pdf`);
}

export default generateStudentPDF;
