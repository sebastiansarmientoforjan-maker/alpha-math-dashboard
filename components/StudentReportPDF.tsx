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
  lightGreen: [232, 245, 233] as RGBColor,  // #E8F5E9 (ROI Box Background)
  textMain: [26, 26, 26] as RGBColor,       // #1A1A1A (Primary Text)
  textGrey: [97, 97, 97] as RGBColor,       // #616161 (Secondary Text)
  softBg: [248, 249, 250] as RGBColor,      // #F8F9FA (KPI Box Background)
  white: [255, 255, 255] as RGBColor,
};

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

  // CASO 0: COLD START
  if (velocity === 0 && accuracy === 0) {
    data.headline = { 
      part1: `${student.firstName}, you have the `, highlight: 'Potential', 
      part2: 'Now we need ', highlight2: 'Activation' 
    };
    data.executiveDiagnosis = `Metrics are currently flat (0% Accuracy, 0% Progress). We cannot optimize what we haven't started. The priority is establishing a baseline immediately.`;
    data.momentumGap = { 
      title: 'The Activation Gap', 
      intro: 'Starting is the only hurdle right now.',
      points: [
        'Zero Data: Without initial performance data, we cannot build a custom roadmap for you.',
        'Opportunity Cost: Every day without logging in creates a larger gap to close later.'
      ] 
    };
    data.driInsight = `"${student.firstName}: The hardest part is starting. Once you complete your first session, the data will guide us. Let's get you on the board."`;
    data.protocol = [
      { title: 'The First Login', description: 'Log in today and complete exactly 20 minutes of work, regardless of the outcome.' },
      { title: 'Baseline Establishment', description: 'Do not worry about mistakes. We need them to calibrate your learning path.' }
    ];
    data.expectedOutcome = `Executing this will generate your initial metrics, allowing us to move from "Unknown" to a strategic plan in the next cycle.`;
  }

  // CASO 1: BAJA PRECISIÓN (Accuracy < 60)
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
      { title: 'The Review Loop', description: 'Before starting new material, spend 10 minutes reviewing concepts from the previous session.' }
    ];
    data.expectedOutcome = `Executing this instruction will raise your accuracy to ${Math.min(accuracy + 15, 85)}% within two weeks, creating a stable foundation.`;
  } 
  
  // CASO 2: BAJO RITMO (Accuracy >= 60 pero Velocity < 50)
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
        'Endurance Deficit: The SAT is a marathon. Your rhythm currently only prepares you for a sprint.'
      ] 
    };
    data.driInsight = `"${student.firstName}: If we do not close the volume gap now, your ${accuracy}% accuracy will remain potential rather than performance. Consistency is the only multiplier that matters."`;
    data.protocol = [
      { title: "The 15' Volume Power-Up", description: 'Add exactly 15 minutes of focused practice to your current session. More problems solved = Higher Score.' },
      { title: 'Active Error Armoring', description: "Spend the first 3 minutes of your session reviewing yesterday's errors. Never repeat the same mistake." }
    ];
    data.expectedOutcome = `Executing this directive aims to reach a standard of 125 XP per week (Velocity). Achieving this standard will stabilize your technical base and maximize the probability of securing a 700+ score projection for SAT Math exams.`;
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
      intro: 'Top performers sustain growth through progressive overload.',
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
  const margin = 12; // Standard margin
  const diag = generateDiagnosis(student);
  
  // Format Date for Footer
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

    // Standard Footer Line
    doc.setDrawColor(200, 200, 200); // Light Grey Line
    doc.setLineWidth(0.1);
    // doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15); // Removed to match reference cleaner look? Or keep if desired. Let's keep distinct elements.
    
    // Footer Text Elements
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

  // ==========================================
  // PAGE 1: CONTENT
  // ==========================================
  
  // 1. HERO HEADER (Blue Box)
  doc.setFillColor(...(COLORS.navy));
  // roundedRect(x, y, w, h, rx, ry, style)
  doc.roundedRect(margin, margin, pageWidth - margin * 2, 48, 3, 3, 'F');
  
  // Top Label
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  // Opacity simulation via color blending not needed if full white text
  doc.setTextColor(200, 210, 220); // Slightly dimmed white
  doc.text(`INTERVENTION DIRECTIVE | DRI ${driName.toUpperCase()}`, margin + 8, margin + 10);

  // Big Headline (Two colors)
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255); // White base
  
  // Line 1
  const line1Y = margin + 22;
  doc.text(diag.headline.part1, margin + 8, line1Y);
  const w1 = doc.getTextWidth(diag.headline.part1);
  
  // Highlight 1 (Greenish/White) - Usando un verde muy claro o blanco según referencia, 
  // en la referencia "Accuracy" parece un verde menta muy suave sobre el azul.
  doc.setTextColor(180, 240, 180); // Soft Light Green
  doc.text(diag.headline.highlight + '.', margin + 8 + w1, line1Y);

  // Line 2
  const line2Y = margin + 32;
  doc.setTextColor(255, 255, 255);
  doc.text(diag.headline.part2, margin + 8, line2Y);
  const w2 = doc.getTextWidth(diag.headline.part2);
  
  // Highlight 2 (Orange)
  doc.setTextColor(...(COLORS.accentOrange)); // Usando naranja fuerte para contraste
  doc.text(diag.headline.highlight2 + '.', margin + 8 + w2, line2Y);

  // Executive Diagnosis Paragraph
  const diagY = margin + 42;
  doc.setTextColor(240, 240, 240); // Off-white
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  // Usamos negrita simulada para los números dentro del texto plano dibujando partes
  // Pero para simplificar y robustez, usamos texto plano limpio.
  // En la referencia hay bold en los %: "Your 78% Accuracy..."
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
      desc: 'How fast you move to the goal.' // Updated text per reference
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
    
    // Background
    doc.setFillColor(...(COLORS.softBg));
    doc.setDrawColor(220, 220, 230); // Very light grey border
    doc.setLineWidth(0.1);
    doc.roundedRect(x, yPos, kpiW, kpiH, 2, 2, 'FD');
    
    // Value (Big Center)
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...(kpi.col));
    doc.text(kpi.val, x + kpiW / 2, yPos + 14, { align: 'center' });
    
    // Label (Top Small)
    // En la referencia "MASTERY" está arriba del número? No, en la referencia:
    // Numero Grande -> Label (ACCURACY) -> Desc.
    // El "MASTERY" parece un super-título. Vamos a ajustar al PDF referencia Zayen (2).
    
    // Update layout based on "Strategic Performance Report - Zayen (2).pdf"
    // Order: [Title tiny] [NUMBER HUGE] [Subtitle Bold] [Desc tiny]
    
    // 1. Tiny Super Title (e.g. MASTERY) - Actually, reference shows "MASTERY" then "78%" then "ACCURACY"
    /* MASTERY 78% ACCURACY */
    
    // Super Title
    doc.setFontSize(7); doc.setFont('helvetica', 'bold');
    doc.setTextColor(...(COLORS.navy)); // Navy header per box
    // doc.text(kpi.label, x + kpiW / 2, yPos + 5, { align: 'center' }); // Removed to match exact look if needed, but keeping for structure
    // Actually in Zayen(2) reference looks like:
    // Box 1: [78% (Green)] [ACCURACY (Bold)] [What you know...]
    
    // Let's stick to the visual hierarchy provided in the text dump order:
    // MASTERY (Heading) -> 78% -> ACCURACY -> Desc
    
    // Super Heading (MASTERY)
    doc.setTextColor(100, 100, 100); // Greyish
    doc.setFontSize(6);
    doc.text(kpi.label, x + kpiW/2, yPos + 5, { align: 'center' });

    // Number
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...(kpi.col));
    doc.text(kpi.val, x + kpiW / 2, yPos + 15, { align: 'center' });

    // Subtitle (ACCURACY)
    doc.setFontSize(8);
    doc.setTextColor(30, 30, 30);
    doc.text(kpi.sub, x + kpiW / 2, yPos + 22, { align: 'center' });

    // Description
    doc.setFontSize(6);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...(COLORS.textGrey));
    doc.text(kpi.desc, x + kpiW / 2, yPos + 27, { align: 'center' });
  });


  // 3. SCIENTIFIC DIAGNOSIS & DRI INSIGHT (Split Layout)
  yPos += 40;
  const colGap = 10;
  const col1W = (pageWidth - margin * 2 - colGap) * 0.55; // Left slightly wider
  const col2X = margin + col1W + colGap;
  const col2W = pageWidth - margin - col2X;

  // -- LEFT COLUMN: MOMENTUM GAP --
  doc.setTextColor(...(COLORS.navy));
  doc.setFontSize(11); 
  doc.setFont('helvetica', 'bold');
  doc.text(diag.momentumGap.title, margin, yPos);
  
  // Underline title
  doc.setDrawColor(...(COLORS.navy));
  doc.setLineWidth(0.3);
  // doc.line(margin, yPos + 1.5, margin + col1W, yPos + 1.5); // Optional underline

  let textY = yPos + 7;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...(COLORS.textMain));
  
  // Intro Text
  if (diag.momentumGap.intro) {
    const introLines = doc.splitTextToSize(diag.momentumGap.intro, col1W);
    doc.text(introLines, margin, textY);
    textY += (introLines.length * 4) + 3;
  }

  // Bullets
  diag.momentumGap.points.forEach(point => {
    doc.setTextColor(...(COLORS.navy));
    doc.text('•', margin, textY); // Bullet char
    
    doc.setTextColor(...(COLORS.textMain));
    // Split bold prefix if exists (e.g. "Cognitive Friction:")
    const parts = point.split(':');
    if (parts.length > 1) {
        doc.setFont('helvetica', 'bold');
        doc.text(parts[0] + ':', margin + 4, textY);
        const prefixW = doc.getTextWidth(parts[0] + ': ');
        
        doc.setFont('helvetica', 'normal');
        // Simple wrap for remainder? Complex mixing lines in jsPDF is hard.
        // Simplification: Print full text regular, or just formatting the whole bullet block.
        const bulletText = doc.splitTextToSize(point, col1W - 6);
        doc.text(bulletText, margin + 4, textY);
        textY += (bulletText.length * 4) + 2;
    } else {
        const bulletText = doc.splitTextToSize(point, col1W - 6);
        doc.text(bulletText, margin + 4, textY);
        textY += (bulletText.length * 4) + 2;
    }
  });

  // -- RIGHT COLUMN: DRI INSIGHT --
  // Vertical Divider
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
  // Italic text with quotes
  const quoteLines = doc.splitTextToSize(diag.driInsight, col2W);
  doc.text(quoteLines, col2X, yPos + 8);
  
  // Signature
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
      // Number Box
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
      
      // Description (Inline or Next Line? Ref uses Next Line mostly or wrap)
      doc.setFont('helvetica', 'normal');
      // Check if description fits on same line?
      // Let's put it on next line slightly indented for clean look, or inline.
      // Reference: "The 15' Volume Power-Up: Add exactly..." (Inline)
      const titleW = doc.getTextWidth(step.title + ': ');
      const descLines = doc.splitTextToSize(step.description, pageWidth - contentX - titleW);
      
      // Printing description immediately after title
      doc.text(descLines[0], contentX + titleW, yPos);
      if (descLines.length > 1) {
          doc.text(descLines.slice(1), contentX, yPos + 4.5);
      }
      
      yPos += 4.5 * (descLines.length || 1) + 5;
    });

    // 5. EXPECTED OUTCOME (ROI) - Green Box
    yPos += 2;
    doc.setFillColor(...(COLORS.lightGreen)); // Background
    doc.setDrawColor(...(COLORS.positiveGreen)); // Border
    doc.setLineWidth(0.3);
    doc.roundedRect(margin, yPos, pageWidth - margin * 2, 22, 2, 2, 'FD');
    
    // Header inside box
    const boxPad = 4;
    doc.setTextColor(...(COLORS.positiveGreen)); // Dark Green Text
    doc.setFontSize(8); doc.setFont('helvetica', 'bold');
    doc.text('EXPECTED OUTCOME (ROI)', margin + boxPad, yPos + 5);
    
    // Body Text inside box
    doc.setTextColor(20, 60, 20); // Very dark green/black
    doc.setFontSize(9); doc.setFont('helvetica', 'normal');
    const roiLines = doc.splitTextToSize(diag.expectedOutcome, pageWidth - margin * 2 - (boxPad * 2));
    doc.text(roiLines, margin + boxPad, yPos + 10);
    
    // Call to Action Link (Optional based on reference)
    const ctaY = yPos + 10 + (roiLines.length * 4) + 2;
    doc.setTextColor(...(COLORS.navy));
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.textWithLink('Schedule your coaching session here to unblock!', margin + boxPad, ctaY, { url: 'https://calendly.com/alpha-hs/coaching-session' });
  }

  addFooter(1);

  // ==========================================
  // PAGE 2: EVIDENCE (If exists)
  // ==========================================
  if (interventions.length > 0) {
    doc.addPage();
    
    // Header Page 2
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
        0: { cellWidth: 25 }, // Date
        1: { cellWidth: 40 }, // Objective
        2: { cellWidth: 'auto' }, // Action
        3: { cellWidth: 45 }  // Next Steps
      },
      margin: { left: margin, right: margin }
    });

    addFooter(2);
  }

  // Save
  doc.save(`Strategic_Report_${student.firstName}_${reportDate}.pdf`);
}

export default generateStudentPDF;
