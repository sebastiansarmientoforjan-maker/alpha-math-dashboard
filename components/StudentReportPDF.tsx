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

// Type Casting para evitar errores de compilación con jsPDF-AutoTable
type RGBColor = [number, number, number];

const COLORS = {
  navy: [18, 67, 109] as RGBColor,          // #12436D (Brand Blue)
  accentOrange: [216, 67, 21] as RGBColor,  // #D84315 (Rhythm/Attention)
  positiveGreen: [27, 94, 32] as RGBColor,  // #1B5E20 (Mastery/Success)
  lightGreen: [232, 245, 233] as RGBColor,  // #E8F5E9 (ROI Box Background)
  textMain: [26, 26, 26] as RGBColor,       // #1A1A1A (Primary Text)
  textGrey: [97, 97, 97] as RGBColor,       // #616161 (Secondary Text)
  softBg: [248, 249, 250] as RGBColor,      // #F8F9FA (KPI Box Background)
  white: [255, 255, 255] as RGBColor,
};

// ==========================================
// 1. LOGIC ENGINE (Nueva Lógica Integrada)
// ==========================================
function generateDiagnosis(student: Student) {
  const accuracy = student.metrics.accuracyRate || 0;
  const velocity = student.metrics.velocityScore || 0;

  let data = {
    headline: { part1: '', highlight: '', part2: '', highlight2: '' },
    executiveDiagnosis: '',
    momentumGap: { title: '', intro: '', points: [] as string[] },
    driInsight: '',
    protocol: [] as { title: string; description: string }[],
    expectedOutcome: ''
  };

  // BLOQUE 1: COLD START (Velocity 0, Acc 0)
  // Diagnosis: Static Friction. ROI = 0.
  if (velocity === 0 && accuracy === 0) {
      data.headline = { 
        part1: 'STATUS:', highlight: 'ZERO MOMENTUM', 
        part2: 'DETECTED.', highlight2: 'IMMEDIATE ACTION REQUIRED' 
      };
      
      data.executiveDiagnosis = `${student.firstName} is currently in a state of Zero-Output. No cognitive data is being generated, rendering learning ROI null. The system cannot optimize what does not move.`;
      
      data.momentumGap = {
        title: 'THE STATIC FRICTION TRAP',
        intro: 'Current velocity is strictly zero. We are fighting inertia, not content difficulty.',
        points: [
            'Zero data points generated this cycle.',
            'Opportunity cost of inaction is compounding daily.',
            'Feedback loops are currently severed.'
        ]
      };
      
      data.driInsight = '"Direct Responsible Individual (DRI) must override hesitation. The goal is not correctness today, it is simply completion. Bias for action is mandatory."';
      
      data.protocol = [
          { title: 'IGNITION PROTOCOL', description: 'Complete 3 micro-tasks regardless of confidence level. Force the system to register activity.' },
          { title: 'REMOVE BARRIERS', description: 'Identify the single technical or emotional blocker preventing login/start and eliminate it.' }
      ];
      
      data.expectedOutcome = 'Shift from metrics 0/0 to >1/>1. Re-establishment of data flow and initial velocity calibration.';
  }

  // BLOQUE 2: CRITICAL ACCURACY (Accuracy < 60)
  // Diagnosis: High Cognitive Debt. Scaling Errors.
  else if (accuracy < 60) {
      data.headline = { 
        part1: 'ALERT:', highlight: 'KNOWLEDGE DEBT', 
        part2: 'EXCEEDS LIMITS.', highlight2: 'QUALITY CONTROL STOP' 
      };
      
      data.executiveDiagnosis = `System detects critical instability. ${student.firstName} is operating below the 60% mastery floor. Continuing at this pace is simply scaling error production. We are accumulating "Educational Debt" that will require expensive remediation later.`;
      
      data.momentumGap = {
        title: 'THE "GAMING" VS "GRINDING" DILEMMA',
        intro: 'Velocity is irrelevant when Accuracy is critical. Inputs are not translating into retained mastery.',
        points: [
            'Concept gaps are being bypassed, not solved.',
            'High probability of "guessing" behavior to inflate velocity.',
            'Foundational logic requires immediate debugging.'
        ]
      };
      
      data.driInsight = '"Stop the line. Do not praise speed. The metric to watch is Accuracy. If we do not fix the foundation now, the structure will collapse under high-velocity demands."';
      
      data.protocol = [
          { title: 'DEEP DIVE MODE', description: 'Cut velocity target by 50%. Mandate "Explain it to me" sessions for every error.' },
          { title: 'ERROR AUTOPSY', description: 'Analyze the last 5 errors. Is it a logic bug or a focus bug? Fix the root cause.' }
      ];
      
      data.expectedOutcome = 'Stabilize Accuracy to >75% before permitting Velocity increases. Elimination of "false positive" progress.';
  } 
    
  // BLOQUE 3: LOW VELOCITY (Velocity < 50, pero Acc >= 60)
  // Diagnosis: Low Throughput. ROI Failure. (Perfectionist Trap)
  else if (velocity < 50) {
      data.headline = { 
        part1: 'METRIC:', highlight: 'VELOCITY BOTTLENECK', 
        part2: 'IDENTIFIED.', highlight2: 'UNLOCK THROUGHPUT' 
      };
      
      data.executiveDiagnosis = `${student.firstName} is delivering quality, but at an unscalable rate. The "Perfectionism Tax" is high—spending excessive time verifying answers that are likely already correct. We are leaving compounded learning gains on the table.`;
      
      data.momentumGap = {
        title: 'THE ANALYSIS PARALYSIS',
        intro: 'Accuracy is safe, but Volume is critical for mastery retention and neural adaptation.',
        points: [
            'Time-on-task ROI is suboptimal.',
            'Hesitation between problems is creating "Cognitive Drag".',
            'Fear of failure is capping total XP output.'
        ]
      };
      
      data.driInsight = '"Push for Good Enough. The student needs permission to fail in exchange for speed. We need to increase the data sample size to truly test their mastery limits."';
      
      data.protocol = [
          { title: 'SPRINT INTERVALS', description: 'Set a timer: 10 problems in 10 minutes. Accuracy is secondary; volume is primary.' },
          { title: 'TRUST THE GUT', description: 'If you are 80% sure, submit. Bypass the triple-check habit.' }
      ];
      
      data.expectedOutcome = 'Double the Velocity score (>80) while maintaining Accuracy >80%. Transition from "Safe" to "High Performance".';
  }
    
  // BLOQUE 4: ELSE (High Performance / Cruiser)
  // Diagnosis: Flow State / Alpha Maintenance.
  else {
      data.headline = { 
        part1: 'STATUS:', highlight: 'ALPHA FLOW STATE', 
        part2: 'ACTIVE.', highlight2: 'MAXIMIZE AGENCY' 
      };
      
      data.executiveDiagnosis = `${student.firstName} is operating at Peak Performance. Metrics indicate high retention and optimal velocity. The risk now is not failure, but stagnation (Cruising). The system must pivot from "Support" to "Challenge".`;
      
      data.momentumGap = {
        title: 'SUSTAINING THE PEAK',
        intro: 'Standard curriculum may no longer provide sufficient friction for growth.',
        points: [
            'Current trajectory leads to early mastery.',
            'Potential for boredom if challenge density is not increased.',
            'Opportunity to shift focus to meta-skills (teaching, leadership).'
        ]
      };
      
      data.driInsight = '"Laissez-faire leadership with high standards. Do not micromanage. Validate the win, then raise the bar immediately to prevent complacency."';
      
      data.protocol = [
          { title: 'THE TEACHER TEST', description: 'Challenge the student to explain a complex concept to a peer. Mastery is proven by teaching.' },
          { title: 'AGENCY UNLOCK', description: 'Allow self-selection of the next advanced module. Test autonomy.' }
      ];
      
      data.expectedOutcome = 'Maintain current metrics while reducing "Time to Mastery". Preparation for next-level curriculum deployment.';
  }

  return data;
}

// ==========================================
// 2. RENDER ENGINE (Visual Layout)
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
  const margin = 12; // Standard margin
  const diag = generateDiagnosis(student);
  
  const dateObj = new Date();
  const reportDate = dateObj.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

  // --- HELPER: FOOTER ---
  const addFooter = (pageNum: number) => {
    doc.setPage(pageNum);
    
    // Bottom Signature Block (Solo página 1)
    if (pageNum === 1) {
      const sigY = pageHeight - 25;
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
    
    // Left: Name
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...(COLORS.textMain));
    doc.text(student.firstName.toUpperCase(), margin, footY);
    
    // Center: Report Type
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...(COLORS.textGrey));
    doc.text('High Performance Report - Math Academy Data', pageWidth / 2, footY, { align: 'center' });
    
    // Right: Date
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
  
  // Line 1
  const line1Y = margin + 22;
  doc.text(diag.headline.part1, margin + 8, line1Y);
  const w1 = doc.getTextWidth(diag.headline.part1);
  doc.setTextColor(180, 240, 180); // Highlight 1 (Greenish)
  doc.text(diag.headline.highlight, margin + 8 + w1, line1Y);

  // Line 2
  const line2Y = margin + 32;
  doc.setTextColor(255, 255, 255);
  doc.text(diag.headline.part2, margin + 8, line2Y);
  const w2 = doc.getTextWidth(diag.headline.part2);
  doc.setTextColor(...(COLORS.accentOrange)); // Highlight 2 (Orange)
  doc.text(diag.headline.highlight2, margin + 8 + w2, line2Y);

  // Diagnosis Text
  const diagY = margin + 42;
  doc.setTextColor(240, 240, 240); 
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  const diagText = `Executive Diagnosis: ${diag.executiveDiagnosis}`;
  const splitDiag = doc.splitTextToSize(diagText, pageWidth - margin * 2 - 16);
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
    
    // Super Heading
    doc.setTextColor(100, 100, 100); 
    doc.setFontSize(6);
    doc.setFont('helvetica', 'bold');
    doc.text(kpi.label, x + kpiW/2, yPos + 5, { align: 'center' });

    // Number
    doc.setFontSize(22);
    doc.setTextColor(...(kpi.col));
    doc.text(kpi.val, x + kpiW / 2, yPos + 15, { align: 'center' });

    // Subtitle
    doc.setFontSize(8);
    doc.setTextColor(30, 30, 30);
    doc.text(kpi.sub, x + kpiW / 2, yPos + 22, { align: 'center' });

    // Description
    doc.setFontSize(6);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...(COLORS.textGrey));
    doc.text(kpi.desc, x + kpiW / 2, yPos + 27, { align: 'center' });
  });

  // 3. SCIENTIFIC DIAGNOSIS & DRI INSIGHT
  yPos += 40;
  const colGap = 10;
  const col1W = (pageWidth - margin * 2 - colGap) * 0.55; 
  const col2X = margin + col1W + colGap;
  const col2W = pageWidth - margin - col2X;

  // -- LEFT COLUMN --
  doc.setTextColor(...(COLORS.navy));
  doc.setFontSize(11); 
  doc.setFont('helvetica', 'bold');
  doc.text(diag.momentumGap.title, margin, yPos);
  
  let textY = yPos + 7;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
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
    // Check for "Title:" pattern to bold it
    const parts = point.split(':');
    let addedHeight = 0;
    
    if (parts.length > 1) {
        doc.setFont('helvetica', 'bold');
        doc.text(parts[0] + ':', margin + 4, textY);
        doc.setFont('helvetica', 'normal');
        // Hack for simple inline mimic: print full line regular over it? No.
        // Just print the rest.
        const titleW = doc.getTextWidth(parts[0] + ': ');
        const restText = doc.splitTextToSize(parts.slice(1).join(':').trim(), col1W - 6 - titleW);
        
        doc.text(restText[0], margin + 4 + titleW, textY);
        if (restText.length > 1) {
           doc.text(restText.slice(1), margin + 4, textY + 4);
           addedHeight = (restText.length) * 4;
        } else {
           addedHeight = 4;
        }
    } else {
        const bulletText = doc.splitTextToSize(point, col1W - 6);
        doc.text(bulletText, margin + 4, textY);
        addedHeight = bulletText.length * 4;
    }
    textY += addedHeight + 2;
  });

  // -- RIGHT COLUMN --
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.2);
  doc.line(col2X - (colGap/2), yPos, col2X - (colGap/2), textY + 5);

  doc.setTextColor(...(COLORS.navy));
  doc.setFontSize(11); 
  doc.setFont('helvetica', 'bold');
  doc.text('DRI Insight', col2X, yPos);
  
  doc.setTextColor(...(COLORS.textMain));
  doc.setFontSize(9);
  doc.setFont('helvetica', 'italic');
  const quoteLines = doc.splitTextToSize(diag.driInsight, col2W);
  doc.text(quoteLines, col2X, yPos + 8);
  
  const quoteH = quoteLines.length * 4.5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(`- ${driName}`, col2X, yPos + 8 + quoteH + 2);

  // 4. PROTOCOL
  if (includeRecommendations) {
    yPos = Math.max(textY, yPos + 8 + quoteH + 15) + 5;
    
    doc.setTextColor(...(COLORS.navy));
    doc.setFontSize(11); doc.setFont('helvetica', 'bold');
    doc.text('Protocol: Immediate Execution', margin, yPos);
    
    yPos += 8;
    diag.protocol.forEach((step, i) => {
      // Number
      const numSize = 8;
      doc.setFillColor(...(COLORS.navy));
      doc.roundedRect(margin, yPos - 3, numSize, 6, 1, 1, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8); doc.setFont('helvetica', 'bold');
      doc.text(`0${i+1}`, margin + (numSize/2), yPos + 1, { align: 'center' });
      
      // Title
      const contentX = margin + numSize + 4;
      doc.setTextColor(...(COLORS.textMain));
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text(step.title + ':', contentX, yPos);
      
      // Description
      doc.setFont('helvetica', 'normal');
      const titleW = doc.getTextWidth(step.title + ': ');
      const descLines = doc.splitTextToSize(step.description, pageWidth - contentX - titleW - margin);
      
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
    
    // Link
    const ctaY = yPos + 10 + (roiLines.length * 4) + 2;
    doc.setTextColor(...(COLORS.navy));
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.textWithLink('Schedule your coaching session here to unblock!', margin + boxPad, ctaY, { url: 'https://calendly.com/alpha-hs/coaching-session' });
  }

  addFooter(1);

  // ==========================================
  // PAGE 2: EVIDENCE
  // ==========================================
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
      headStyles: { 
        fillColor: COLORS.navy as RGBColor, 
        fontSize: 8, 
        fontStyle: 'bold',
        halign: 'left'
      },
      bodyStyles: { 
        fontSize: 8, 
        textColor: COLORS.textMain as RGBColor,
        cellPadding: 3
      },
      alternateRowStyles: { 
        fillColor: [248, 250, 252] as RGBColor 
      },
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
