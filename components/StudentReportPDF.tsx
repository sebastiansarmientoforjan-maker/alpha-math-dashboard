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
  navy: [18, 67, 109] as RGBColor,          // #12436D (Brand Blue)
  accentOrange: [216, 67, 21] as RGBColor,  // #D84315 (Rhythm/Attention)
  positiveGreen: [27, 94, 32] as RGBColor,  // #1B5E20 (Mastery/Success)
  limeHighlight: [163, 230, 53] as RGBColor, // #a3e635 (Verde Lima)
  lightGreen: [232, 245, 233] as RGBColor,  // #E8F5E9 (ROI Box)
  textMain: [26, 26, 26] as RGBColor,       // #1A1A1A
  textGrey: [97, 97, 97] as RGBColor,       // #616161
  softBg: [248, 249, 250] as RGBColor,      // #F8F9FA
  white: [255, 255, 255] as RGBColor,
};

// ==========================================
// 1. LOGIC ENGINE (Context-Aware)
// ==========================================
function generateDiagnosis(student: Student) {
  const accuracy = student.metrics.accuracyRate || 0;
  const velocity = student.metrics.velocityScore || 0;
  
  // 1. Detección de Contexto del Curso
  const courseName = student.currentCourse?.name || 'Math';
  let contextLabel = `Mastering ${courseName}`; // Default: "Mastering Algebra 1"
  let contextGoal = 'complete mastery';         // Default goal

  // Personalización por Tipo de Curso
  if (courseName.includes('SAT')) {
    contextLabel = 'The SAT';
    contextGoal = 'a 700+ score';
  } else if (courseName.includes('AP ') || courseName.includes('Calculus')) {
    contextLabel = 'The AP Exam';
    contextGoal = 'a 5 score';
  }

  let data = {
    headline: { part1: '', highlight: '', part2: '', highlight2: '' },
    executiveDiagnosis: '',
    momentumGap: { title: '', intro: '', points: [] as string[] },
    driInsight: '',
    protocol: [] as { title: string; description: string }[],
    expectedOutcome: ''
  };

  // CASO 0: COLD START (0/0)
  if (velocity === 0 && accuracy === 0) {
    data.headline = { 
      part1: `${student.firstName}, you have `, highlight: 'Potential', 
      part2: 'Now we need ', highlight2: 'Activation' 
    };
    data.executiveDiagnosis = `Your 0% Activity shows latent potential. However, metrics are currently flat. My instruction is clear: we must establish a baseline immediately to optimize your path in ${courseName}.`;
    data.momentumGap = { 
      title: 'The Static Friction Trap', 
      intro: 'In physics, static friction is stronger than kinetic friction. The hardest part is simply starting.',
      points: [
        'Zero Data: Without initial performance data, we cannot build a custom roadmap for you.',
        'Opportunity Cost: Every day without logging in creates a larger gap to close later.'
      ] 
    };
    data.driInsight = `"${student.firstName}: The goal is not correctness today, it is simply completion. Bias for action is mandatory. Let's get you on the board."`;
    data.protocol = [
      { title: 'Ignition Protocol', description: 'Log in today and complete exactly 20 minutes of work, regardless of the outcome.' },
      { title: 'Remove Barriers', description: 'Identify the single technical or emotional blocker preventing login and eliminate it.' }
    ];
    data.expectedOutcome = `Executing this instruction will generate your initial metrics, allowing us to move from "Unknown" to a strategic plan in the next evaluation cycle.`;
  }

  // CASO 1: BAJA PRECISIÓN (<60%)
  else if (accuracy < 60) {
    data.headline = { 
      part1: `${student.firstName}, you have the `, highlight: 'Effort', 
      part2: 'Now we need ', highlight2: 'Precision' 
    };
    data.executiveDiagnosis = `Your ${velocity}% Progress shows commitment. However, your ${accuracy}% Accuracy indicates we need to slow down and solidify foundations before advancing.`;
    data.momentumGap = { 
      title: 'The Precision Gap', 
      intro: 'Neuroscience proves that accuracy is the prerequisite for speed. Moving fast with errors creates negative learning loops.',
      points: [
        'Speed vs Accuracy: Moving fast without understanding creates knowledge debt that compounds over time.',
        'Foundation First: Mastering fundamentals now prevents struggle with advanced topics later.'
      ] 
    };
    data.driInsight = `"${student.firstName}: Speed without accuracy is wasted effort. Let's build your foundation strong so your progress becomes permanent."`;
    data.protocol = [
      { title: 'The Slow-Down Protocol', description: 'Reduce daily volume by 20% but increase focus on understanding each problem completely.' },
      { title: 'The Review Loop', description: 'Before starting new material, spend 10 minutes reviewing concepts from the previous session until they feel automatic.' }
    ];
    data.expectedOutcome = `Executing this instruction will raise your accuracy to ${Math.min(accuracy + 15, 85)}% within two weeks, creating a stable foundation for accelerated progress.`;
  } 
  
  // CASO 2: BAJO RITMO (Velocity < 50)
  else if (velocity < 50) {
    data.headline = { 
      part1: `${student.firstName}, you have the `, highlight: 'Accuracy', 
      part2: 'Now we need your ', highlight2: 'Rhythm' 
    };
    data.executiveDiagnosis = `Your ${accuracy}% Accuracy confirms mastery. However, your ${velocity}% Progress is the current bottleneck. My instruction is clear: adjust +15 minutes daily to activate your momentum.`;
    
    data.momentumGap = { 
      title: 'The Momentum Gap', 
      intro: `Neuroscience proves that frequency is the engine of technical retention. At ${velocity}% progress, you are intellectually capable but rhythmically vulnerable.`,
      points: [
        'Cognitive Friction: Without daily practice, your brain slows down under exam pressure.',
        // AQUI SE APLICA EL CONTEXTO DINÁMICO
        `Endurance Deficit: ${contextLabel} is a marathon. Your rhythm currently only prepares you for a sprint.`
      ] 
    };
    data.driInsight = `"${student.firstName}: If we do not close the volume gap now, your ${accuracy}% accuracy will remain potential rather than performance. Consistency is the only multiplier that matters."`;
    data.protocol = [
      { title: "The 15' Volume Power-Up", description: 'Add exactly 15 minutes of focused practice to your current session. More problems solved = Higher Score.' },
      { title: 'Active Error Armoring', description: "Spend the first 3 minutes of your session reviewing yesterday's errors. Never repeat the same mistake." }
    ];
    // ROI TAMBIÉN DINÁMICO
    data.expectedOutcome = `Executing this directive aims to reach a standard of 125 XP per week. Achieving this will stabilize your technical base and maximize the probability of securing ${contextGoal} projection for the next evaluation cycle.`;
  }
  
  // CASO 3: EXCELENCIA
  else {
    data.headline = { 
      part1: `${student.firstName}, you have `, highlight: 'Excellence', 
      part2: 'Now we need to ', highlight2: 'Maintain It' 
    };
    data.executiveDiagnosis = `Strong performance across the board: ${accuracy}% Accuracy and ${velocity}% Velocity. The focus now is optimization and challenge.`;
    data.momentumGap = { 
      title: 'The Excellence Standard', 
      intro: 'Top performers sustain growth through progressive overload to avoid stagnation.',
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

// ==========================================
// 2. RENDER ENGINE (Professional Layout)
// ==========================================
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
  const diag = generateDiagnosis(student);
  
  const dateObj = new Date();
  const reportDate = dateObj.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

  // --- HELPER: FOOTER ---
  const addFooter = (pageNum: number) => {
    doc.setPage(pageNum);
    
    // SIGNATURE BLOCK (Solo página 1)
    if (pageNum === 1) {
      const sigY = pageHeight - 32; 
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(...(COLORS.textMain));
      doc.text(driName, pageWidth - margin, sigY, { align: 'right' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(...(COLORS.textGrey));
      doc.text('HS Math DRI', pageWidth - margin, sigY + 4, { align: 'right' });
      doc.text('Alpha HS Academic Team', pageWidth - margin, sigY + 8, { align: 'right' });
    }

    doc.setDrawColor(200, 200, 200); 
    doc.setLineWidth(0.1);
    
    const footY = pageHeight - 12;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...(COLORS.textMain));
    doc.text(student.firstName.toUpperCase(), margin, footY);
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...(COLORS.textGrey));
    doc.text('High Performance Report - Math Academy Data', pageWidth / 2, footY, { align: 'center' });
    doc.text(reportDate, pageWidth - margin, footY, { align: 'right' });
  };

  // --- PAGE 1 CONTENT ---
  
  // 1. HERO HEADER
  doc.setFillColor(...(COLORS.navy));
  doc.roundedRect(margin, margin, pageWidth - margin * 2, 48, 3, 3, 'F');
  
  doc.setTextColor(200, 210, 220); 
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`INTERVENTION DIRECTIVE | DRI ${driName.toUpperCase()}`, margin + 8, margin + 10);

  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255); 
  
  const line1Y = margin + 22;
  doc.text(diag.headline.part1, margin + 8, line1Y);
  const w1 = doc.getTextWidth(diag.headline.part1);
  doc.setTextColor(...(COLORS.limeHighlight)); // Verde Lima Brillante
  doc.text(diag.headline.highlight, margin + 8 + w1, line1Y);

  const line2Y = margin + 32;
  doc.setTextColor(255, 255, 255);
  doc.text(diag.headline.part2, margin + 8, line2Y);
  const w2 = doc.getTextWidth(diag.headline.part2);
  doc.setTextColor(...(COLORS.accentOrange)); 
  doc.text(diag.headline.highlight2 + '.', margin + 8 + w2, line2Y);

  const diagY = margin + 42;
  doc.setTextColor(240, 240, 240); 
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  const splitDiag = doc.splitTextToSize(`Executive Diagnosis: ${diag.executiveDiagnosis}`, pageWidth - margin * 2 - 16);
  doc.text(splitDiag, margin + 8, diagY);

  // 2. KPI BOXES
  let yPos = margin + 55;
  const kpiGap = 4;
  const kpiW = (pageWidth - (margin * 2) - (kpiGap * 2)) / 3;
  const kpiH = 32;

  const kpis = [
    { 
      label: 'MASTERY', sub: 'ACCURACY', 
      val: `${student.metrics.accuracyRate || 0}%`, 
      col: COLORS.positiveGreen, 
      desc: 'What you know correctly.' 
    },
    { 
      label: 'VELOCITY', sub: 'PROGRESS', 
      val: `${student.metrics.velocityScore || 0}%`, 
      col: COLORS.accentOrange, 
      desc: 'How fast you move to the goal.' 
    },
    { 
      label: 'PRESENCE', sub: 'CONSISTENCY', 
      val: `${student.metrics.ksi || 0}%`, 
      col: COLORS.textMain, 
      desc: 'How often you show up.' 
    },
  ];

  kpis.forEach((kpi, i) => {
    const x = margin + i * (kpiW + kpiGap);
    
    doc.setFillColor(...(COLORS.softBg));
    doc.setDrawColor(220, 220, 230);
    doc.setLineWidth(0.1);
    doc.roundedRect(x, yPos, kpiW, kpiH, 2, 2, 'FD');
    
    doc.setTextColor(100, 100, 100); 
    doc.setFontSize(6); doc.setFont('helvetica', 'bold');
    doc.text(kpi.label, x + kpiW/2, yPos + 5, { align: 'center' });

    doc.setFontSize(22);
    doc.setTextColor(...(kpi.col));
    doc.text(kpi.val, x + kpiW / 2, yPos + 15, { align: 'center' });

    doc.setFontSize(8);
    doc.setTextColor(30, 30, 30);
    doc.text(kpi.sub, x + kpiW / 2, yPos + 22, { align: 'center' });

    doc.setFontSize(6);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...(COLORS.textGrey));
    doc.text(kpi.desc, x + kpiW / 2, yPos + 27, { align: 'center' });
  });

  // 3. MOMENTUM GAP & INSIGHT
  yPos += 40;
  const colGap = 10;
  const col1W = (pageWidth - margin * 2 - colGap) * 0.55; 
  const col2X = margin + col1W + colGap;
  const col2W = pageWidth - margin - col2X;

  doc.setTextColor(...(COLORS.navy));
  doc.setFontSize(11); doc.setFont('helvetica', 'bold');
  doc.text(diag.momentumGap.title, margin, yPos);
  
  let textY = yPos + 7;
  doc.setFontSize(9); doc.setFont('helvetica', 'normal');
  doc.setTextColor(...(COLORS.textMain));
  
  if (diag.momentumGap.intro) {
    const introLines = doc.splitTextToSize(diag.momentumGap.intro, col1W);
    doc.text(introLines, margin, textY);
    textY += (introLines.length * 4) + 3;
  }

  diag.momentumGap.points.forEach(point => {
    doc.setTextColor(...(COLORS.navy));
    doc.text('•', margin, textY);
    
    doc.setTextColor(...(COLORS.textMain));
    const parts = point.split(':');
    if (parts.length > 1) {
        doc.setFont('helvetica', 'bold');
        doc.text(parts[0] + ':', margin + 4, textY);
        const prefixW = doc.getTextWidth(parts[0] + ': ');
        
        doc.setFont('helvetica', 'normal');
        const restText = doc.splitTextToSize(parts.slice(1).join(':').trim(), col1W - 6 - prefixW);
        doc.text(restText[0], margin + 4 + prefixW, textY);
        if (restText.length > 1) {
           doc.text(restText.slice(1), margin + 4, textY + 4);
           textY += (restText.length * 4);
        } else {
           textY += 4;
        }
    } else {
        const bulletText = doc.splitTextToSize(point, col1W - 6);
        doc.text(bulletText, margin + 4, textY);
        textY += bulletText.length * 4;
    }
    textY += 2;
  });

  // Vertical Divider
  doc.setDrawColor(220, 220, 220); doc.setLineWidth(0.2);
  doc.line(col2X - (colGap/2), yPos, col2X - (colGap/2), textY + 5);

  doc.setTextColor(...(COLORS.navy));
  doc.setFontSize(11); doc.setFont('helvetica', 'bold');
  doc.text('DRI Insight', col2X, yPos);
  
  doc.setTextColor(...(COLORS.textMain)); doc.setFontSize(9); doc.setFont('helvetica', 'italic');
  const quoteLines = doc.splitTextToSize(diag.driInsight, col2W);
  doc.text(quoteLines, col2X, yPos + 8);
  
  const quoteH = quoteLines.length * 4.5;
  doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
  doc.text(`- ${driName}`, col2X, yPos + 8 + quoteH + 2);

  // 4. PROTOCOL
  if (includeRecommendations) {
    yPos = Math.max(textY, yPos + 8 + quoteH + 15) + 5;
    
    doc.setTextColor(...(COLORS.navy));
    doc.setFontSize(11); doc.setFont('helvetica', 'bold');
    doc.text('Protocol: Immediate Execution', margin, yPos);
    
    yPos += 8;
    diag.protocol.forEach((step, i) => {
      // Badge
      const numSize = 8;
      doc.setFillColor(...(COLORS.navy));
      doc.roundedRect(margin, yPos - 3, numSize, 6, 1, 1, 'F');
      doc.setTextColor(255, 255, 255); doc.setFontSize(8); doc.setFont('helvetica', 'bold');
      doc.text(`0${i+1}`, margin + (numSize/2), yPos + 1, { align: 'center' });
      
      // Title
      const contentX = margin + numSize + 4;
      doc.setTextColor(...(COLORS.textMain));
      doc.setFontSize(9); doc.setFont('helvetica', 'bold');
      doc.text(step.title + ':', contentX, yPos);
      
      // Description
      doc.setFont('helvetica', 'normal');
      const titleW = doc.getTextWidth(step.title + ': ');
      const descLines = doc.splitTextToSize(step.description, pageWidth - contentX - margin - titleWidth);
      
      doc.text(descLines[0], contentX + titleW, yPos);
      if (descLines.length > 1) {
          doc.text(descLines.slice(1), contentX, yPos + 4.5);
      }
      
      yPos += 4.5 * (descLines.length || 1) + 5;
    });

    // 5. ROI BOX
    yPos += 2;
    doc.setFillColor(...(COLORS.lightGreen));
    doc.setDrawColor(...(COLORS.positiveGreen));
    doc.setLineWidth(0.3);
    doc.roundedRect(margin, yPos, pageWidth - margin * 2, 22, 2, 2, 'FD');
    
    const boxPad = 4;
    doc.setTextColor(...(COLORS.positiveGreen)); 
    doc.setFontSize(8); doc.setFont('helvetica', 'bold');
    doc.text('EXPECTED OUTCOME (ROI)', margin + boxPad, yPos + 5);
    
    doc.setTextColor(20, 60, 20); 
    doc.setFontSize(9); doc.setFont('helvetica', 'normal');
    const roiLines = doc.splitTextToSize(diag.expectedOutcome, pageWidth - margin * 2 - (boxPad * 2));
    doc.text(roiLines, margin + boxPad, yPos + 10);
    
    const ctaY = yPos + 10 + (roiLines.length * 4) + 2;
    doc.setTextColor(...(COLORS.navy));
    doc.setFontSize(8); doc.setFont('helvetica', 'bold');
    doc.textWithLink('Schedule your coaching session here to unblock!', margin + boxPad, ctaY, { url: 'https://calendly.com/alpha-hs/coaching-session' });
  }

  addFooter(1);

  // --- PAGE 2: EVIDENCE ---
  if (interventions.length > 0) {
    doc.addPage();
    doc.setFillColor(...(COLORS.softBg));
    doc.rect(0, 0, pageWidth, 30, 'F');
    doc.setTextColor(...(COLORS.navy));
    doc.setFontSize(14); doc.setFont('helvetica', 'bold');
    doc.text('Coaching Log & Evidence', margin, 18);
    doc.setFontSize(9); doc.setFont('helvetica', 'normal');
    doc.text(`Tracking history for ${student.firstName} ${student.lastName}`, margin, 24);

    autoTable(doc, {
      startY: 35,
      head: [['Date', 'Objective', 'Action Taken', 'Next Steps']],
      body: interventions.map(inv => [
        inv.interventionDate?.toDate?.().toLocaleDateString() || new Date(inv.interventionDate).toLocaleDateString(),
        inv.objective,
        inv.whatWasDone,
        inv.nextSteps || '-'
      ]),
      headStyles: { fillColor: COLORS.navy as RGBColor, fontSize: 8, fontStyle: 'bold', halign: 'left' },
      bodyStyles: { fontSize: 8, textColor: COLORS.textMain as RGBColor, cellPadding: 3 },
      alternateRowStyles: { fillColor: [248, 250, 252] as RGBColor },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 40 },
        2: { cellWidth: 'auto' },
        3: { cellWidth: 45 }
      },
      margin: { left: margin, right: margin }
    });

    addFooter(2);
  }

  doc.save(`Strategic_Report_${student.firstName}_${reportDate}.pdf`);
}

export default generateStudentPDF;
