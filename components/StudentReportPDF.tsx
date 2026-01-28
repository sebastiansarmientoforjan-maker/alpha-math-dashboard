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

// Type Casting para jsPDF-AutoTable
type RGBColor = [number, number, number];

const COLORS = {
  navy: [18, 67, 109] as RGBColor,          // #12436D
  accentOrange: [216, 67, 21] as RGBColor,  // #D84315
  positiveGreen: [27, 94, 32] as RGBColor,  // #1B5E20
  lightGreen: [232, 245, 233] as RGBColor,  // #E8F5E9
  textMain: [26, 26, 26] as RGBColor,       // #1A1A1A
  textGrey: [97, 97, 97] as RGBColor,       // #616161
  softBg: [248, 249, 250] as RGBColor,      // #F8F9FA
  white: [255, 255, 255] as RGBColor,
};

function generateDiagnosis(student: Student) {
  const accuracy = student.metrics.accuracyRate || 0;
  const velocity = student.metrics.velocityScore || 0;
  const ksi = student.metrics.ksi || 50;

  // Estructura de datos vacía para llenar según el caso
  let data = {
    headline: { hasStrength: '', needsWork: '' },
    executiveDiagnosis: '',
    momentumGap: { title: '', points: [] as string[] },
    driInsight: '',
    protocol: [] as { title: string; description: string }[],
    expectedOutcome: ''
  };

  // CASO 1: BAJA PRECISIÓN (Accuracy < 60)
  // El alumno corre mucho o no entiende, comete muchos errores.
  if (accuracy < 60) {
    data.headline = { hasStrength: 'the Effort', needsWork: 'Precision' };
    
    // Ajuste si el progreso es 0
    const progressText = velocity === 0 ? "current stall" : `${velocity}% Progress`;
    
    data.executiveDiagnosis = `Your ${progressText} shows commitment. However, your ${accuracy}% Accuracy indicates we need to slow down and solidify foundations before advancing.`;
    
    data.momentumGap = { 
      title: 'The Precision Gap', 
      points: [
        'Speed vs Accuracy: Moving fast without understanding creates knowledge debt that compounds over time.',
        'Foundation First: Mastering fundamentals now prevents struggle with advanced topics later.'
      ] 
    };
    
    data.driInsight = `"${student.firstName}: Speed without accuracy is wasted effort. Let's build your foundation strong so your progress becomes permanent."`;
    
    data.protocol = [
      { title: 'The Slow-Down Protocol', description: 'Reduce daily volume by 20% but increase focus on understanding each problem completely.' },
      { title: 'The Review Loop', description: 'Before starting new material, spend 10 minutes reviewing concepts from the previous session.' }
    ];
    
    data.expectedOutcome = `Executing this instruction will raise your accuracy to ${Math.min(accuracy + 15, 85)}% within two weeks, creating a stable foundation.`;
  } 
  
  // CASO 2: BAJO RITMO (Accuracy >= 70 pero Velocity < 50)
  // El alumno sabe, pero no practica lo suficiente.
  else if (velocity < 50) {
    data.headline = { hasStrength: 'the Accuracy', needsWork: 'your Rhythm' };
    
    data.executiveDiagnosis = `Your ${accuracy}% Accuracy confirms mastery. However, your ${velocity}% Progress is the bottleneck. My instruction is clear: adjust +15 minutes daily to activate momentum.`;
    
    data.momentumGap = { 
      title: 'The Momentum Gap', 
      points: [
        'Cognitive Friction: Without daily practice, your brain slows down under exam pressure.',
        'Endurance Deficit: Tests require sustained focus. Your rhythm currently only prepares you for short bursts.'
      ] 
    };
    
    data.driInsight = `"${student.firstName}: If we do not close the volume gap now, your ${accuracy}% accuracy will remain potential rather than performance. Consistency is the multiplier."`;
    
    data.protocol = [
      { title: "The 15' Volume Power-Up", description: 'Add exactly 15 minutes of focused practice to your current session daily.' },
      { title: 'Active Error Armoring', description: "Spend the first 3 minutes of your session reviewing yesterday's errors." }
    ];
    
    data.expectedOutcome = `Executing this instruction will elevate your weekly progress to ${Math.min(velocity + 25, 80)}%, securing stronger performance.`;
  }
  
  // CASO 3: EXCELENCIA (Todo Verde)
  else {
    data.headline = { hasStrength: 'Excellence', needsWork: 'to Maintain It' };
    
    data.executiveDiagnosis = `Strong performance across the board: ${accuracy}% Accuracy and ${velocity}% Velocity. The focus now is optimization and challenge.`;
    
    data.momentumGap = { 
      title: 'The Excellence Standard', 
      points: [
        'Plateau Prevention: Even top performers need progressive challenge to continue growing.',
        'Leadership Opportunity: Your success can help reinforcing your own understanding.'
      ] 
    };
    
    data.driInsight = `"${student.firstName}: You've earned this position. Now let's push further. The goal isn't just success—it's mastery."`;
    
    data.protocol = [
      { title: 'The Challenge Protocol', description: 'Attempt 2-3 problems above your current level each session. Struggle is growth.' },
      { title: 'The Teaching Test', description: 'Find opportunities to explain concepts to peers to test your mastery.' }
    ];
    
    data.expectedOutcome = `Maintaining this trajectory will position you for top-tier performance and open doors to advanced opportunities.`;
  }

  return data;
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
  const addFooter = (pageNum: number) => {
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

  // ==========================================
  // PAGE 1: STRATEGIC DIRECTIVE
  // ==========================================
  
  // 1. HERO SECTION
  doc.setFillColor(...(COLORS.navy));
  doc.roundedRect(margin, margin, pageWidth - margin * 2, 50, 4, 4, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
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

  // 2. KPI LAYER
  let yPos = margin + 60;
  const kpiW = (pageWidth - margin * 2 - 10) / 3;
  const kpis = [
    { label: 'MASTERY', sub: 'ACCURACY', val: `${student.metrics.accuracyRate || 0}%`, col: COLORS.positiveGreen, desc: 'What you know correctly.' },
    { label: 'VELOCITY', sub: 'PROGRESS', val: `${student.metrics.velocityScore || 0}%`, col: COLORS.accentOrange, desc: 'How much ground you covered.' },
    { label: 'PRESENCE', sub: 'CONSISTENCY', val: `${student.metrics.ksi || 0}%`, col: COLORS.textMain, desc: 'How often you show up.' },
  ];

  kpis.forEach((kpi, i) => {
    const x = margin + i * (kpiW + 5);
    
    // Background Box
    doc.setFillColor(...(COLORS.softBg));
    doc.setDrawColor(...(COLORS.navy));
    doc.setLineWidth(0.1);
    doc.roundedRect(x, yPos, kpiW, 35, 3, 3, 'FD');
    
    // Label
    doc.setTextColor(...(COLORS.navy));
    doc.setFontSize(6); doc.setFont('helvetica', 'bold');
    doc.text(kpi.label, x + kpiW / 2, yPos + 6, { align: 'center' });
    
    // Value
    doc.setTextColor(...(kpi.col));
    doc.setFontSize(22);
    doc.text(kpi.val, x + kpiW / 2, yPos + 18, { align: 'center' });
    
    // Sublabel
    doc.setTextColor(...(COLORS.textMain));
    doc.setFontSize(7);
    doc.text(kpi.sub, x + kpiW / 2, yPos + 26, { align: 'center' });

    // Description (Tiny)
    doc.setTextColor(...(COLORS.textGrey));
    doc.setFontSize(6); doc.setFont('helvetica', 'normal');
    doc.text(kpi.desc, x + kpiW / 2, yPos + 31, { align: 'center' });
  });

  // 3. DIAGNOSIS & INSIGHT (Two Columns)
  yPos += 48;
  
  // Vertical Divider
  doc.setDrawColor(18, 67, 109); // Navy
  doc.setLineWidth(0.5); // Thicker line like LaTeX segmentation
  doc.line(pageWidth / 2, yPos, pageWidth / 2, yPos + 40);

  // Left: Momentum Gap
  doc.setTextColor(...(COLORS.navy));
  doc.setFontSize(11); doc.setFont('helvetica', 'bold');
  doc.text(diagnosis.momentumGap.title, margin, yPos);
  // doc.line(margin, yPos + 2, pageWidth / 2 - 5, yPos + 2); // Removed underline to match "cleaner" look if desired, or keep it.

  doc.setTextColor(...(COLORS.textMain));
  doc.setFontSize(8); doc.setFont('helvetica', 'normal');
  let bulletY = yPos + 8;
  diagnosis.momentumGap.points.forEach(p => {
    // Custom bullet matching LaTeX \itemize
    doc.setTextColor(...(COLORS.navy));
    doc.text('•', margin, bulletY);
    
    doc.setTextColor(...(COLORS.textMain));
    const pLines = doc.splitTextToSize(p, pageWidth / 2 - 18);
    doc.text(pLines, margin + 4, bulletY);
    bulletY += pLines.length * 4 + 3;
  });

  // Right: DRI Insight
  const rightX = pageWidth / 2 + 8;
  doc.setTextColor(...(COLORS.navy)); doc.setFontSize(11); doc.setFont('helvetica', 'bold');
  doc.text('DRI Insight', rightX, yPos);
  
  doc.setTextColor(...(COLORS.textMain)); doc.setFontSize(9); doc.setFont('helvetica', 'italic');
  // Ajuste de interlineado (1.2 spacing aprox)
  const insightLines = doc.splitTextToSize(diagnosis.driInsight, pageWidth / 2 - 20);
  doc.text(insightLines, rightX, yPos + 8);
  
  // Insight Signature
  doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
  doc.text(`-- ${driName}`, rightX, yPos + 8 + (insightLines.length * 5) + 4);

  // 4. PROTOCOL
  if (includeRecommendations) {
    yPos = Math.max(bulletY, yPos + 40) + 12;
    doc.setTextColor(...(COLORS.navy));
    doc.setFontSize(11); doc.setFont('helvetica', 'bold');
    doc.text('Protocol: Immediate Execution', margin, yPos);
    // Line under title
    doc.setDrawColor(...(COLORS.navy)); doc.setLineWidth(0.2);
    // doc.line(margin, yPos + 2, pageWidth - margin, yPos + 2);
    
    yPos += 8;
    diagnosis.protocol.forEach((step, i) => {
      // Step Number Badge
      doc.setFillColor(...(COLORS.navy));
      doc.roundedRect(margin, yPos - 3.5, 9, 6, 1.5, 1.5, 'F');
      doc.setTextColor(255, 255, 255); doc.setFontSize(8); doc.setFont('helvetica', 'bold');
      doc.text(`0${i+1}`, margin + 4.5, yPos + 0.5, { align: 'center' });
      
      // Step Text
      doc.setTextColor(...(COLORS.textMain)); 
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text(step.title, margin + 13, yPos);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      // Inline description logic? No, better separate line for clarity in PDF
      const sDesc = doc.splitTextToSize(step.description, pageWidth - margin - 50);
      doc.text(sDesc, margin + 13, yPos + 5);
      
      yPos += 6 + (sDesc.length * 4.5) + 4;
    });

    // 5. ROI BOX (Expected Outcome)
    yPos += 5;
    doc.setFillColor(...(COLORS.lightGreen));
    doc.setDrawColor(...(COLORS.positiveGreen));
    doc.setLineWidth(0.4);
    doc.roundedRect(margin, yPos, pageWidth - margin * 2, 20, 2, 2, 'FD');
    
    doc.setTextColor(...(COLORS.positiveGreen));
    doc.setFontSize(7); doc.setFont('helvetica', 'bold');
    doc.text('EXPECTED OUTCOME (ROI)', margin + 5, yPos + 5);
    
    doc.setTextColor(27, 94, 32); // Darker green for text
    doc.setFontSize(9); doc.setFont('helvetica', 'bold');
    const roiL = doc.splitTextToSize(diagnosis.expectedOutcome, pageWidth - margin * 2 - 10);
    doc.text(roiL, margin + 5, yPos + 11);
    
    yPos += 20; // Espacio después de la caja
  }

  // 6. CLOSING SIGNATURE (Restored)
  yPos += 15;
  // Si estamos muy abajo, saltar de página? Asumimos que cabe en A4 normal.
  if (yPos > pageHeight - 30) {
    doc.addPage();
    yPos = 30;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...(COLORS.textMain));
  doc.text(driName, pageWidth - margin, yPos, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...(COLORS.textGrey));
  doc.text('HS Math DRI', pageWidth - margin, yPos + 4, { align: 'right' });
  doc.text('Alpha HS Academic Team', pageWidth - margin, yPos + 8, { align: 'right' });

  addFooter(1);

  // ==========================================
  // PAGE 2: COACHING EVIDENCE (IF EXISTS)
  // ==========================================
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
      bodyStyles: { fontSize: 7.5, textColor: COLORS.textMain as RGBColor, cellPadding: 4 },
      alternateRowStyles: { fillColor: [248, 250, 252] as RGBColor },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 40 },
        3: { cellWidth: 40 }
      },
      margin: { left: margin, right: margin }
    });

    addFooter(2);
  }

  doc.save(`Strategic_Report_${student.firstName}_${new Date().toISOString().split('T')[0]}.pdf`);
}

export default generateStudentPDF;
