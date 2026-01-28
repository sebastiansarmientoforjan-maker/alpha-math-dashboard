'use client';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// --- TYPES (Mocked for context) ---
export interface Student {
  firstName: string;
  lastName: string;
  currentCourse?: { name: string };
  metrics: {
    accuracyRate: number; // 0-100
    velocityScore: number; // 0-100
    ksi: number; // Knowledge Stability Index / Consistency
  };
}

interface StudentReportOptions {
  student: Student;
  interventions?: any[];
  driName?: string;
  includeRecommendations?: boolean;
}

type RGBColor = [number, number, number];

// --- PALETA DE AUTORIDAD EDUCATIVA ---
const COLORS = {
  navy: [18, 67, 109] as RGBColor,          // #12436D (Confianza/Autoridad)
  accentOrange: [216, 67, 21] as RGBColor,  // #D84315 (Acción/Urgencia - "Rhythm")
  positiveGreen: [27, 94, 32] as RGBColor,  // #1B5E20 (Logro/Maestría - "Accuracy")
  lightGreen: [232, 245, 233] as RGBColor,  // #E8F5E9 (Fondo ROI)
  textMain: [26, 26, 26] as RGBColor,       // #1A1A1A (Texto Principal - Negro Suave)
  textGrey: [97, 97, 97] as RGBColor,       // #616161 (Contexto / Etiquetas)
  softBg: [248, 249, 250] as RGBColor,      // #F8F9FA
  white: [255, 255, 255] as RGBColor,
};

// ==========================================
// 1. LOGIC ENGINE
// ==========================================
function generateDiagnosis(student: Student) {
  const accuracy = student.metrics.accuracyRate || 0;
  const velocity = student.metrics.velocityScore || 0;
  
  const courseName = student.currentCourse?.name || 'Math';
  let contextLabel = `Mastering ${courseName}`;
  let contextGoal = 'complete mastery';

  if (courseName.includes('SAT')) {
    contextLabel = 'The SAT';
    contextGoal = 'a 700+ score';
  } else if (courseName.includes('AP') || courseName.includes('Calculus')) {
    contextLabel = 'The AP Exam';
    contextGoal = 'a 5 score';
  }

  let data = {
    headline: { part1: '', highlight: '', part2: '', highlight2: '' },
    strategicDiagnosis: '', 
    momentumGap: { title: '', intro: '', points: [] as string[] },
    coachInsight: '', 
    protocol: [] as { title: string; description: string }[],
    expectedOutcome: ''
  };

  // CASO 0: COLD START
  if (velocity === 0 && accuracy === 0) {
    data.headline = { 
      part1: `${student.firstName}, you have `, highlight: 'Potential', 
      part2: 'Now we need ', highlight2: 'Activation' 
    };
    data.strategicDiagnosis = `Your current activity level is at 0%. This isn't a lack of ability; it's a lack of data. To build a winning strategy for ${courseName}, we first need to establish a baseline.`;
    
    data.momentumGap = { 
      title: 'The Static Friction Trap', 
      intro: 'In physics, it takes more energy to start moving an object than to keep it moving. You are currently fighting static friction.',
      points: [
        'The "Zero Data" Problem: Without performance metrics, we are flying blind. We cannot optimize what we cannot measure.',
        'Opportunity Cost: Every day delayed increases the slope of the learning curve later.'
      ] 
    };
    data.coachInsight = `"${student.firstName}: Don't worry about getting it right today. Just get it done. We need to break the inertia. One problem solved is infinitely better than zero."`;
    data.protocol = [
      { title: 'Ignition Protocol', description: 'Log in today and complete exactly 20 minutes of work. Correctness is secondary; completion is primary.' },
      { title: 'The 2-Minute Rule', description: 'Commit to doing just 2 minutes. Usually, once you start, you will keep going.' }
    ];
    data.expectedOutcome = `Executing this will generate your initial baseline, moving your status from "Unknown" to "Active Strategy" by next week.`;
  }

  // CASO 1: BAJA PRECISIÓN
  else if (accuracy < 60) {
    data.headline = { 
      part1: `${student.firstName}, you have the `, highlight: 'Effort', 
      part2: 'Now we need ', highlight2: 'Precision' 
    };
    data.strategicDiagnosis = `You are moving fast (${velocity}% Velocity), but your foundation is shaky (${accuracy}% Accuracy). In high-performance academics, speed without accuracy is just efficient error-making.`;
    
    data.momentumGap = { 
      title: 'The Precision Gap', 
      intro: 'Neuroscience shows that practicing errors myelinate the wrong neural pathways. You are currently reinforcing mistakes.',
      points: [
        'The Illusion of Competence: Moving fast can feel like learning, but without >80% accuracy, it creates "Knowledge Debt".',
        'Foundation First: We must pause to fill the cracks in the foundation before adding more weight (new topics).'
      ] 
    };
    data.coachInsight = `"${student.firstName}: Slow is smooth, and smooth is fast. I need you to trade speed for understanding this week. It will pay off double later."`;
    data.protocol = [
      { title: 'The Slow-Down Protocol', description: 'Reduce your daily problem volume by 20%. Spend that extra time analyzing WHY you missed a question.' },
      { title: 'Error Autopsy', description: 'For every mistake, write down one sentence explaining the correct logic before moving on.' }
    ];
    data.expectedOutcome = `This pivot will raise your accuracy to ${Math.min(accuracy + 15, 85)}% within 10 days, creating a stable platform for future acceleration.`;
  } 
  
  // CASO 2: BAJO RITMO
  else if (velocity < 50) {
    data.headline = { 
      part1: `${student.firstName}, you have the `, highlight: 'Accuracy', 
      part2: 'Now we need your ', highlight2: 'Rhythm' 
    };
    data.strategicDiagnosis = `Your quality is elite (${accuracy}% Accuracy). You understand the material. The bottleneck is volume. You aren't seeing enough repetitions to make the skills permanent.`;
    
    data.momentumGap = { 
      title: 'The Frequency Gap', 
      intro: `Retention requires repetition. At ${velocity}% velocity, you are learning concepts but risking "decay" before they stick.`,
      points: [
        'Cognitive Endurance: ${contextLabel} is a marathon. We need to train your brain to maintain focus for longer durations.',
        'The Forgetting Curve: Without frequent reinforcement, you will lose the high-quality gains you made last week.'
      ] 
    };
    data.coachInsight = `"${student.firstName}: You have the talent. Now you need the grit. Consistency is the only multiplier that matters for you right now."`;
    data.protocol = [
      { title: "The +15' Power-Up", description: 'Add exactly 15 minutes of focused practice to your current routine. Set a timer.' },
      { title: 'Streak Defense', description: 'Do not let two days pass without logging in. Protect your momentum.' }
    ];
    data.expectedOutcome = `Increasing volume aims to reach 125 XP/week. This converts your potential into permanent performance and secures a ${contextGoal} projection.`;
  }
  
  // CASO 3: EXCELENCIA
  else {
    data.headline = { 
      part1: `${student.firstName}, you have `, highlight: 'Excellence', 
      part2: 'Now we need to ', highlight2: 'Maintain It' 
    };
    data.strategicDiagnosis = `Outstanding performance metrics: ${accuracy}% Accuracy and ${velocity}% Velocity. You are operating at a high-performance standard. The new risk is complacency.`;
    
    data.momentumGap = { 
      title: 'The Mastery Standard', 
      intro: 'Top performers do not settle. They look for the next level of resistance to keep growing.',
      points: [
        'Plateau Prevention: The brain stops adapting when the challenge is too easy. We need to introduce "Desirable Difficulty".',
        'Leadership: Your mastery gives you a responsibility to lead by example.'
      ] 
    };
    data.coachInsight = `"${student.firstName}: You've earned this spot. Now, let's see how far we can push. Don't just solve the problems—master the underlying logic."`;
    data.protocol = [
      { title: 'The Challenge Protocol', description: 'Seek out the hardest problems in the set. If you aren\'t struggling slightly, you aren\'t learning.' },
      { title: 'The Feynman Technique', description: 'Try to explain a complex concept to a friend in simple terms to test your depth of understanding.' }
    ];
    data.expectedOutcome = `Sustaining this trajectory positions you not just for a good grade, but for true academic distinction and mastery.`;
  }

  return data;
}

// ==========================================
// 2. RENDER ENGINE (Editorial / Clean White Layout)
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
      doc.text('Alpha High Performance Team', pageWidth - margin, sigY + 8, { align: 'right' });
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
    doc.text('Strategic Performance Report', pageWidth / 2, footY, { align: 'center' });
    doc.text(reportDate, pageWidth - margin, footY, { align: 'right' });
  };

  // --- PAGE 1 CONTENT ---
  
  // 1. HERO HEADER (Editorial Style - No Box)
  // Eyebrow Label
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal'); // Normal weight for the label
  doc.setTextColor(...(COLORS.textGrey));
  doc.text('DRI MESSAGE | HS MATH DRI', margin, margin + 4);

  // Headline Lines
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  
  // Line 1
  const line1Y = margin + 16;
  doc.setTextColor(...(COLORS.textMain)); // Black text
  doc.text(diag.headline.part1, margin, line1Y);
  
  const w1 = doc.getTextWidth(diag.headline.part1);
  doc.setTextColor(...(COLORS.positiveGreen)); // GREEN highlight (Accuracy/Potential)
  doc.text(diag.headline.highlight + '.', margin + w1, line1Y);

  // Line 2
  const line2Y = margin + 27;
  doc.setTextColor(...(COLORS.textMain)); // Black text
  doc.text(diag.headline.part2, margin, line2Y);
  
  const w2 = doc.getTextWidth(diag.headline.part2);
  doc.setTextColor(...(COLORS.accentOrange)); // ORANGE highlight (Rhythm/Activation)
  doc.text(diag.headline.highlight2 + '.', margin + w2, line2Y);

  // 2. STRATEGIC DIAGNOSIS (Justified Block)
  const diagY = margin + 42;
  
  doc.setTextColor(...(COLORS.textGrey)); 
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal'); // Label in grey
  doc.text('Executive Diagnosis:', margin, diagY);
  
  const labelWidth = doc.getTextWidth('Executive Diagnosis: ');
  const diagTextX = margin + labelWidth + 2; 
  const diagTextMaxWidth = pageWidth - margin * 2 - labelWidth - 2;

  doc.setTextColor(...(COLORS.textMain)); // Body text in Black
  doc.setFont('helvetica', 'normal');
  
  // JUSTIFIED ALIGNMENT
  doc.text(diag.strategicDiagnosis, diagTextX, diagY, {
    maxWidth: diagTextMaxWidth,
    align: 'justify',
    lineHeightFactor: 1.3 // Increased leading for "8K" readability
  });
  
  // Calculate height used by diagnosis to push KPIs down
  const diagLines = doc.splitTextToSize(diag.strategicDiagnosis, diagTextMaxWidth);
  const diagHeight = diagLines.length * 4.5; 

  // 3. KPI BOXES
  let yPos = diagY + diagHeight + 10; // Dynamic spacing
  const kpiGap = 4;
  const kpiW = (pageWidth - (margin * 2) - (kpiGap * 2)) / 3;
  const kpiH = 32;

  const kpis = [
    { 
      label: 'MASTERY', sub: 'ACCURACY', 
      val: `${student.metrics.accuracyRate || 0}%`, 
      col: COLORS.positiveGreen, 
      desc: 'Quality of your knowledge.' 
    },
    { 
      label: 'VELOCITY', sub: 'PROGRESS', 
      val: `${student.metrics.velocityScore || 0}%`, 
      col: COLORS.accentOrange, 
      desc: 'Speed towards the goal.' 
    },
    { 
      label: 'CONSISTENCY', sub: 'STREAK', 
      val: `${student.metrics.ksi || 0}%`, 
      col: COLORS.textMain, 
      desc: 'Reliability of effort.' 
    },
  ];

  kpis.forEach((kpi, i) => {
    const x = margin + i * (kpiW + kpiGap);
    
    doc.setFillColor(...(COLORS.softBg));
    doc.setDrawColor(230, 230, 230);
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

  // 4. MOMENTUM GAP & INSIGHT
  yPos += 45; // Increased spacing
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
    doc.text(diag.momentumGap.intro, margin, textY, {
        maxWidth: col1W,
        align: 'justify',
        lineHeightFactor: 1.2
    });
    const lines = doc.splitTextToSize(diag.momentumGap.intro, col1W);
    textY += (lines.length * 4.5) + 3;
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
        const descMaxWidth = col1W - 6 - prefixW;
        doc.text(parts.slice(1).join(':').trim(), margin + 4 + prefixW, textY, {
            maxWidth: descMaxWidth,
            align: 'justify',
            lineHeightFactor: 1.2
        });
        
        const lines = doc.splitTextToSize(parts.slice(1).join(':').trim(), descMaxWidth);
        textY += (lines.length * 4.5);
    } else {
        const bulletMaxWidth = col1W - 6;
        doc.text(point, margin + 4, textY, {
            maxWidth: bulletMaxWidth,
            align: 'justify',
            lineHeightFactor: 1.2
        });
        const lines = doc.splitTextToSize(point, bulletMaxWidth);
        textY += lines.length * 4.5;
    }
    textY += 2;
  });

  // Vertical Divider
  doc.setDrawColor(220, 220, 220); doc.setLineWidth(0.2);
  doc.line(col2X - (colGap/2), yPos, col2X - (colGap/2), textY + 5);

  doc.setTextColor(...(COLORS.navy));
  doc.setFontSize(11); doc.setFont('helvetica', 'bold');
  doc.text('Coach Insight', col2X, yPos);
  
  doc.setTextColor(...(COLORS.textMain)); doc.setFontSize(9); doc.setFont('helvetica', 'italic');
  
  const quoteLines = doc.splitTextToSize(diag.coachInsight, col2W);
  doc.text(quoteLines, col2X, yPos + 8);
  
  const quoteH = quoteLines.length * 4.5;
  doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
  doc.text(`- ${driName}`, col2X, yPos + 8 + quoteH + 2);

  // 5. PROTOCOL
  if (includeRecommendations) {
    yPos = Math.max(textY, yPos + 8 + quoteH + 15) + 5;
    
    doc.setTextColor(...(COLORS.navy));
    doc.setFontSize(11); doc.setFont('helvetica', 'bold');
    doc.text('Strategic Protocol: Immediate Actions', margin, yPos);
    
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
      doc.text(step.title, contentX, yPos);
      
      // Description
      const descY = yPos + 4.5;
      const descMaxWidth = pageWidth - contentX - margin;
      
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(50, 50, 50); 
      doc.text(step.description, contentX, descY, {
          maxWidth: descMaxWidth,
          align: 'justify',
          lineHeightFactor: 1.2
      });
      
      const lines = doc.splitTextToSize(step.description, descMaxWidth);
      yPos += 4.5 + (lines.length * 4.5) + 4; 
    });

    // 6. ROI BOX
    yPos += 2;
    doc.setFillColor(...(COLORS.lightGreen));
    doc.setDrawColor(...(COLORS.positiveGreen));
    doc.setLineWidth(0.3);
    doc.roundedRect(margin, yPos, pageWidth - margin * 2, 22, 2, 2, 'FD');
    
    const boxPad = 4;
    doc.setTextColor(...(COLORS.positiveGreen)); 
    doc.setFontSize(8); doc.setFont('helvetica', 'bold');
    doc.text('PROJECTED OUTCOME (LEARNING ROI)', margin + boxPad, yPos + 5);
    
    doc.setTextColor(20, 60, 20); 
    doc.setFontSize(9); doc.setFont('helvetica', 'normal');
    
    const roiMaxWidth = pageWidth - margin * 2 - (boxPad * 2);
    doc.text(diag.expectedOutcome, margin + boxPad, yPos + 10, {
        maxWidth: roiMaxWidth,
        align: 'justify',
        lineHeightFactor: 1.2
    });
    
    const roiLines = doc.splitTextToSize(diag.expectedOutcome, roiMaxWidth);
    const ctaY = yPos + 10 + (roiLines.length * 4.5) + 2;
    
    doc.setTextColor(...(COLORS.navy));
    doc.setFontSize(8); doc.setFont('helvetica', 'bold');
    doc.textWithLink('>>> Click to sync with your Coach', margin + boxPad, ctaY, { url: 'https://calendly.com/alpha-hs/coaching-session' });
  }

  addFooter(1);

  // --- PAGE 2: EVIDENCE ---
  if (interventions.length > 0) {
    doc.addPage();
    doc.setFillColor(...(COLORS.softBg));
    doc.rect(0, 0, pageWidth, 30, 'F');
    doc.setTextColor(...(COLORS.navy));
    doc.setFontSize(14); doc.setFont('helvetica', 'bold');
    doc.text('Performance Log & Evidence', margin, 18);
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

  doc.save(`Performance_Report_${student.firstName}_${reportDate}.pdf`);
}

export default generateStudentPDF;
