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

// Definición de tipos para asegurar compatibilidad con jsPDF-AutoTable
type RGBColor = [number, number, number];

const COLORS = {
  navy: [18, 67, 109] as RGBColor,
  accentOrange: [216, 67, 21] as RGBColor,
  positiveGreen: [27, 94, 32] as RGBColor,
  lightGreen: [232, 245, 233] as RGBColor,
  textMain: [26, 26, 26] as RGBColor,
  textGrey: [97, 97, 97] as RGBColor,
  softBg: [248, 249, 250] as RGBColor,
  white: [255, 255, 255] as RGBColor,
};

function generateDiagnosis(student: Student) {
  const accuracy = student.metrics.accuracyRate || 0;
  const velocity = student.metrics.velocityScore || 0;
  
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

  const addFooter = (pageNum: number, total: number) => {
    doc.setPage(pageNum);
    doc.setDrawColor(...(COLORS.navy));
    doc.setLineWidth(0.2);
    doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...(COLORS.textMain));
    doc.text(student.firstName.toUpperCase(), margin, pageHeight - 10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...(COLORS.textGrey));
    doc.text('High Performance Report -- Math Academy Data', pageWidth / 2, pageHeight - 10, { align: 'center' });
    doc.text(reportDate, pageWidth - margin, pageHeight - 10, { align: 'right' });
  };

  // --- PAGE 1 ---
  doc.setFillColor(...(COLORS.navy));
  doc.roundedRect(margin, margin, pageWidth - margin * 2, 50, 4, 4, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(7);
  doc.text(`INTERVENTION DIRECTIVE | DRI ${driName.toUpperCase()}`, margin + 8, margin + 10);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(`${student.firstName}, you have ${diagnosis.headline.hasStrength}.`, margin + 8, margin + 25);
  doc.text('Now we need ', margin + 8, margin + 35);
  const tw = doc.getTextWidth('Now we need ');
  doc.setTextColor(...(COLORS.accentOrange));
  doc.text(diagnosis.headline.needsWork + '.', margin + 8 + tw, margin + 35);
  doc.setTextColor(230, 230, 230);
  doc.setFontSize(9); doc.setFont('helvetica', 'normal');
  const diagLines = doc.splitTextToSize(`Executive Diagnosis: ${diagnosis.executiveDiagnosis}`, pageWidth - margin * 2 - 16);
  doc.text(diagLines, margin + 8, margin + 44);

  let yPos = margin + 60;
  const kpiW = (pageWidth - margin * 2 - 10) / 3;
  const kpis = [
    { label: 'MASTERY', sub: 'ACCURACY', val: `${student.metrics.accuracyRate || 0}%`, col: COLORS.positiveGreen },
    { label: 'VELOCITY', sub: 'PROGRESS', val: `${student.metrics.velocityScore || 0}%`, col: COLORS.accentOrange },
    { label: 'PRESENCE', sub: 'CONSISTENCY', val: `${student.metrics.ksi || 0}%`, col: COLORS.textMain },
  ];

  kpis.forEach((kpi, i) => {
    const x = margin + i * (kpiW + 5);
    doc.setFillColor(...(COLORS.softBg));
    doc.setDrawColor(...(COLORS.navy));
    doc.setLineWidth(0.1);
    doc.roundedRect(x, yPos, kpiW, 35, 3, 3, 'FD');
    doc.setTextColor(...(COLORS.navy));
    doc.setFontSize(6); doc.setFont('helvetica', 'bold');
    doc.text(kpi.label, x + kpiW / 2, yPos + 6, { align: 'center' });
    doc.setTextColor(...(kpi.col));
    doc.setFontSize(22);
    doc.text(kpi.val, x + kpiW / 2, yPos + 18, { align: 'center' });
    doc.setTextColor(...(COLORS.textMain));
    doc.setFontSize(7);
    doc.text(kpi.sub, x + kpiW / 2, yPos + 26, { align: 'center' });
  });

  yPos += 48;
  doc.setDrawColor(18, 67, 109, 20); // Navy con opacidad simulada
  doc.setLineWidth(0.5);
  doc.line(pageWidth / 2, yPos, pageWidth / 2, yPos + 40);

  doc.setTextColor(...(COLORS.navy));
  doc.setFontSize(11); doc.setFont('helvetica', 'bold');
  doc.text(diagnosis.momentumGap.title, margin, yPos);
  doc.line(margin, yPos + 2, pageWidth / 2 - 5, yPos + 2);
  doc.setTextColor(...(COLORS.textMain));
  doc.setFontSize(8); doc.setFont('helvetica', 'normal');
  let bulletY = yPos + 10;
  diagnosis.momentumGap.points.forEach(p => {
    doc.text('•', margin, bulletY);
    const pLines = doc.splitTextToSize(p, pageWidth / 2 - 15);
    doc.text(pLines, margin + 4, bulletY);
    bulletY += pLines.length * 4 + 2;
  });

  const rightX = pageWidth / 2 + 5;
  doc.setTextColor(...(COLORS.navy)); doc.setFont('helvetica', 'bold');
  doc.text('DRI Insight', rightX, yPos);
  doc.line(rightX, yPos + 2, pageWidth - margin, yPos + 2);
  doc.setTextColor(...(COLORS.textMain)); doc.setFont('helvetica', 'italic');
  const inLines = doc.splitTextToSize(diagnosis.driInsight, pageWidth / 2 - 15);
  doc.text(inLines, rightX, yPos + 10);
  doc.setFont('helvetica', 'bold');
  doc.text(`-- ${driName}`, rightX, yPos + 10 + (inLines.length * 4) + 4);

  if (includeRecommendations) {
    yPos = Math.max(bulletY, yPos + 35) + 10;
    doc.setTextColor(...(COLORS.navy));
    doc.setFontSize(11);
    doc.text('Protocol: Immediate Execution', margin, yPos);
    doc.line(margin, yPos + 2, pageWidth - margin, yPos + 2);
    yPos += 10;
    diagnosis.protocol.forEach((step, i) => {
      doc.setFillColor(...(COLORS.navy));
      doc.roundedRect(margin, yPos - 4, 10, 6, 1, 1, 'F');
      doc.setTextColor(255, 255, 255); doc.setFontSize(8);
      doc.text(`0${i+1}`, margin + 5, yPos, { align: 'center' });
      doc.setTextColor(...(COLORS.textMain)); doc.setFont('helvetica', 'bold');
      doc.text(step.title + ':', margin + 14, yPos);
      doc.setFont('helvetica', 'normal');
      const sDesc = doc.splitTextToSize(step.description, pageWidth - margin * 2 - 20);
      doc.text(sDesc, margin + 14, yPos + 5);
      yPos += 12;
    });

    doc.setFillColor(...(COLORS.lightGreen));
    doc.setDrawColor(...(COLORS.positiveGreen));
    doc.setLineWidth(0.4);
    doc.roundedRect(margin, yPos, pageWidth - margin * 2, 18, 2, 2, 'FD');
    doc.setTextColor(...(COLORS.positiveGreen));
    doc.setFontSize(7); doc.setFont('helvetica', 'bold');
    doc.text('EXPECTED OUTCOME (ROI)', margin + 4, yPos + 5);
    doc.setFontSize(8); doc.setFont('helvetica', 'normal');
    const roiL = doc.splitTextToSize(diagnosis.expectedOutcome, pageWidth - margin * 2 - 8);
    doc.text(roiL, margin + 4, yPos + 11);
  }

  addFooter(1, interventions.length > 0 ? 2 : 1);

  // --- PAGE 2 ---
  if (interventions.length > 0) {
    doc.addPage();
    doc.setFillColor(...(COLORS.softBg));
    doc.rect(0, 0, pageWidth, 35, 'F');
    doc.setTextColor(...(COLORS.navy));
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
      headStyles: { fillColor: COLORS.navy as RGBColor, fontSize: 8, fontStyle: 'bold' },
      bodyStyles: { fontSize: 7.5, textColor: COLORS.textMain as RGBColor },
      alternateRowStyles: { fillColor: [248, 250, 252] as RGBColor },
      margin: { left: margin, right: margin }
    });

    addFooter(2, 2);
  }

  doc.save(`Strategic_Report_${student.firstName}_${new Date().toISOString().split('T')[0]}.pdf`);
}

export default generateStudentPDF;
