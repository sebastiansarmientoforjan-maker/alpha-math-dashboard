'use client';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// --- TYPES ---
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

// --- PALETA DE AUTORIDAD (PRINT SAFETY CERTIFIED) ---
const COLORS = {
  navy: [12, 45, 72] as RGBColor,           // #0C2D48 (Deep Navy - Richer for print)
  accentOrange: [200, 60, 20] as RGBColor,  // #C83C14 (Safety Orange - No gamut warning)
  positiveGreen: [20, 80, 25] as RGBColor,  // #145019 (Forest Green - High contrast)
  lightGreen: [242, 248, 242] as RGBColor,  // #F2F8F2 (Very subtle tint)
  textMain: [15, 15, 15] as RGBColor,       // #0F0F0F (Off-Black for reading comfort)
  textGrey: [60, 60, 60] as RGBColor,       // #3C3C3C (Darker grey for laser print safety)
  hairline: [200, 200, 200] as RGBColor,    // #C8C8C8 (Solid line, no dithering)
  softBg: [252, 252, 252] as RGBColor,      // #FCFCFC (Almost white)
  white: [255, 255, 255] as RGBColor,
};

// --- TYPOGRAPHY ENGINE (Micro-corrections) ---
const formatTypography = (text: string): string => {
  return text
    .replace(/-/g, '–') // En-dash for aesthetic
    .replace(/'/g, '’') // Smart quotes
    .replace(/"/g, '“'); // Smart double quotes
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
      { title: 'The 2–Minute Rule', description: 'Commit to doing just 2 minutes. Usually, once you start, you will keep going.' }
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
      { title: 'The Slow–Down Protocol', description: 'Reduce your daily problem volume by 20%. Spend that extra time analyzing WHY you missed a question.' },
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
      { title: "The +15' Power–Up", description: 'Add exactly 15 minutes of focused practice to your current routine. Set a timer.' },
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
// 2. RENDER ENGINE (Gold Standard)
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
  const margin = 16; 
  const contentWidth = pageWidth - (margin * 2);
  
  const diag = generateDiagnosis(student);
  const dateObj = new Date();
  const reportDate = dateObj.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  const reportId = `REP-${Math.floor(1000 + Math.random() * 9000)}-${dateObj.getFullYear()}`;

  // --- FOOTER: Bank-Grade Metadata ---
  const addFooter = (pageNum: number) => {
    doc.setPage(pageNum);
    
    if (pageNum === 1) {
      const sigY = pageHeight - 34; 
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(...(COLORS.textMain));
      doc.text(formatTypography(driName), pageWidth - margin, sigY, { align: 'right', charSpace: 0.5 });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(...(COLORS.textGrey));
      doc.text('HS Math DRI', pageWidth - margin, sigY + 4, { align: 'right' });
      doc.text('Alpha High Performance Team', pageWidth - margin, sigY + 8, { align: 'right' });
    }

    const footY = pageHeight - 14;
    doc.setDrawColor(...(COLORS.hairline)); 
    doc.setLineWidth(0.1);
    doc.line(margin, footY - 4, pageWidth - margin, footY - 4);
    
    // Metadata block (Left)
    doc.setFont('courier', 'normal'); // Monospace for technical data
    doc.setFontSize(6); 
    doc.setTextColor(...(COLORS.textGrey));
    doc.text(`ID: ${reportId} | REF: ${student.lastName.substring(0,3).toUpperCase()}`, margin, footY);
    
    // Branding (Center)
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...(COLORS.textGrey));
    doc.text('STRATEGIC PERFORMANCE REPORT', pageWidth / 2, footY, { align: 'center', charSpace: 1.5 });
    
    // Page/Date (Right)
    doc.text(`${reportDate} | PG ${pageNum}`, pageWidth - margin, footY, { align: 'right' });
  };

  // --- PAGE 1 CONTENT ---
  
  // 1. HERO HEADER
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold'); 
  doc.setTextColor(...(COLORS.textGrey));
  doc.text('DRI MESSAGE | HS MATH DRI', margin, margin + 4, { charSpace: 1.5 }); // Increased tracking

  doc.setFontSize(26); 
  doc.setFont('helvetica', 'bold');
  
  const line1Y = margin + 18;
  doc.setTextColor(...(COLORS.textMain));
  doc.text(formatTypography(diag.headline.part1), margin, line1Y);
  
  const w1 = doc.getTextWidth(diag.headline.part1);
  doc.setTextColor(...(COLORS.positiveGreen)); 
  doc.text(formatTypography(diag.headline.highlight + '.'), margin + w1, line1Y);

  const line2Y = margin + 30;
  doc.setTextColor(...(COLORS.textMain));
  doc.text(formatTypography(diag.headline.part2), margin, line2Y);
  
  const w2 = doc.getTextWidth(diag.headline.part2);
  doc.setTextColor(...(COLORS.accentOrange)); 
  doc.text(formatTypography(diag.headline.highlight2 + '.'), margin + w2, line2Y);

  const sep1Y = margin + 38;
  doc.setDrawColor(...(COLORS.hairline));
  doc.setLineWidth(0.1);
  doc.line(margin, sep1Y, pageWidth - margin, sep1Y);

  // 2. STRATEGIC DIAGNOSIS
  const diagY = sep1Y + 12; // More air
  
  doc.setTextColor(...(COLORS.textGrey)); 
  doc.setFontSize(8); 
  doc.setFont('helvetica', 'bold'); 
  doc.text('STRATEGIC DIAGNOSIS:', margin, diagY, { charSpace: 0.8 });
  
  const labelWidth = doc.getTextWidth('STRATEGIC DIAGNOSIS:') + 4; 
  const diagTextX = margin + labelWidth; 
  const diagTextMaxWidth = pageWidth - margin - diagTextX;

  doc.setTextColor(...(COLORS.textMain)); 
  doc.setFont('helvetica', 'normal');
  
  // High Leading + Typography Fixes
  doc.text(formatTypography(diag.strategicDiagnosis), diagTextX, diagY, {
    maxWidth: diagTextMaxWidth,
    align: 'justify',
    lineHeightFactor: 1.45 // Magazine standard
  });
  
  const diagLines = doc.splitTextToSize(diag.strategicDiagnosis, diagTextMaxWidth);
  const diagHeight = diagLines.length * 5.2;

  // 3. KPI BOXES (Optical Grid)
  let yPos = diagY + diagHeight + 14; 
  const kpiGap = 8; 
  const kpiW = (contentWidth - (kpiGap * 2)) / 3;
  const kpiH = 36; 

  const kpis = [
    { label: 'MASTERY', sub: 'ACCURACY', val: `${student.metrics.accuracyRate || 0}%`, col: COLORS.positiveGreen, desc: 'Quality of your knowledge.' },
    { label: 'VELOCITY', sub: 'PROGRESS', val: `${student.metrics.velocityScore || 0}%`, col: COLORS.accentOrange, desc: 'Speed towards the goal.' },
    { label: 'CONSISTENCY', sub: 'STREAK', val: `${student.metrics.ksi || 0}%`, col: COLORS.textMain, desc: 'Reliability of effort.' },
  ];

  kpis.forEach((kpi, i) => {
    const x = margin + i * (kpiW + kpiGap);
    
    doc.setFillColor(...(COLORS.softBg));
    doc.setDrawColor(235, 235, 235);
    doc.setLineWidth(0.1);
    doc.roundedRect(x, yPos, kpiW, kpiH, 1, 1, 'FD');
    
    // Optical Adjustment: The color bar
    doc.setDrawColor(...(kpi.col));
    doc.setLineWidth(0.5); // Thinner, more elegant
    doc.line(x + 4, yPos, x + kpiW - 4, yPos); 
    
    doc.setTextColor(100, 100, 100); 
    doc.setFontSize(6); doc.setFont('helvetica', 'bold');
    doc.text(kpi.label, x + kpiW/2, yPos + 8, { align: 'center', charSpace: 1.2 });

    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...(kpi.col));
    doc.text(kpi.val, x + kpiW / 2, yPos + 18, { align: 'center' });

    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(50, 50, 50);
    doc.text(kpi.sub, x + kpiW / 2, yPos + 25, { align: 'center' });

    doc.setFontSize(6);
    doc.setTextColor(...(COLORS.textGrey));
    doc.text(kpi.desc, x + kpiW / 2, yPos + 30, { align: 'center' });
  });

  const sep2Y = yPos + kpiH + 14;
  doc.setDrawColor(...(COLORS.hairline));
  doc.setLineWidth(0.1);
  doc.line(margin, sep2Y, pageWidth - margin, sep2Y);

  // 4. MOMENTUM GAP & INSIGHT
  yPos = sep2Y + 12;
  const colGap = 14;
  const col1W = (contentWidth - colGap) * 0.55; 
  const col2X = margin + col1W + colGap;
  const col2W = pageWidth - margin - col2X;

  doc.setTextColor(...(COLORS.navy));
  doc.setFontSize(9); doc.setFont('helvetica', 'bold');
  doc.text(diag.momentumGap.title.toUpperCase(), margin, yPos, { charSpace: 0.8 });
  
  let textY = yPos + 8;
  doc.setFontSize(9); doc.setFont('helvetica', 'normal');
  doc.setTextColor(...(COLORS.textMain));
  
  if (diag.momentumGap.intro) {
    doc.text(formatTypography(diag.momentumGap.intro), margin, textY, {
        maxWidth: col1W,
        align: 'justify',
        lineHeightFactor: 1.45
    });
    const lines = doc.splitTextToSize(diag.momentumGap.intro, col1W);
    textY += (lines.length * 5.2) + 4;
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
        doc.text(formatTypography(parts.slice(1).join(':').trim()), margin + 4 + prefixW, textY, {
            maxWidth: descMaxWidth,
            align: 'justify',
            lineHeightFactor: 1.45
        });
        
        const lines = doc.splitTextToSize(parts.slice(1).join(':').trim(), descMaxWidth);
        textY += (lines.length * 5.2);
    } else {
        const bulletMaxWidth = col1W - 6;
        doc.text(formatTypography(point), margin + 4, textY, {
            maxWidth: bulletMaxWidth,
            align: 'justify',
            lineHeightFactor: 1.45
        });
        const lines = doc.splitTextToSize(point, bulletMaxWidth);
        textY += lines.length * 5.2;
    }
    textY += 3; 
  });

  doc.setDrawColor(...(COLORS.hairline));
  doc.setLineWidth(0.1);
  doc.line(col2X - (colGap/2), yPos, col2X - (colGap/2), textY + 5);

  doc.setTextColor(...(COLORS.navy));
  doc.setFontSize(9); doc.setFont('helvetica', 'bold');
  doc.text('COACH INSIGHT', col2X, yPos, { charSpace: 0.8 });
  
  doc.setTextColor(...(COLORS.textMain)); doc.setFontSize(9); doc.setFont('helvetica', 'italic');
  const quoteLines = doc.splitTextToSize(formatTypography(diag.coachInsight), col2W);
  doc.text(quoteLines, col2X, yPos + 8, { lineHeightFactor: 1.5 }); // More leading for quotes
  
  // 5. PROTOCOL
  if (includeRecommendations) {
    yPos = Math.max(textY, yPos + (quoteLines.length * 6) + 20) + 5;
    
    doc.setDrawColor(...(COLORS.hairline));
    doc.line(margin, yPos - 8, pageWidth - margin, yPos - 8);

    doc.setTextColor(...(COLORS.navy));
    doc.setFontSize(9); doc.setFont('helvetica', 'bold');
    doc.text('STRATEGIC PROTOCOL: IMMEDIATE ACTIONS', margin, yPos, { charSpace: 0.8 });
    
    yPos += 12;
    diag.protocol.forEach((step, i) => {
      // Step Badge: Optical alignment
      const numSize = 6;
      doc.setDrawColor(...(COLORS.navy));
      doc.setLineWidth(0.2);
      doc.circle(margin + (numSize/2), yPos - 1.5, numSize/2); 
      
      doc.setTextColor(...(COLORS.navy)); doc.setFontSize(7); doc.setFont('helvetica', 'bold');
      doc.text(`${i+1}`, margin + (numSize/2), yPos + 1, { align: 'center' });
      
      const contentX = margin + numSize + 6;
      doc.setTextColor(...(COLORS.textMain));
      doc.setFontSize(9); doc.setFont('helvetica', 'bold');
      doc.text(formatTypography(step.title), contentX, yPos);
      
      const descY = yPos + 5;
      const descMaxWidth = pageWidth - contentX - margin;
      
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...(COLORS.textGrey)); 
      doc.text(formatTypography(step.description), contentX, descY, {
          maxWidth: descMaxWidth,
          align: 'justify',
          lineHeightFactor: 1.4
      });
      
      const lines = doc.splitTextToSize(step.description, descMaxWidth);
      yPos += 5 + (lines.length * 5) + 6; 
    });

    // 6. ROI BOX
    yPos += 6;
    doc.setFillColor(...(COLORS.lightGreen));
    doc.setDrawColor(...(COLORS.positiveGreen));
    doc.setLineWidth(0.05);
    doc.roundedRect(margin, yPos, contentWidth, 26, 1, 1, 'FD');
    
    const boxPad = 8;
    doc.setTextColor(...(COLORS.positiveGreen)); 
    doc.setFontSize(7); doc.setFont('helvetica', 'bold');
    doc.text('PROJECTED OUTCOME (ROI)', margin + boxPad, yPos + 8, { charSpace: 1 });
    
    doc.setTextColor(20, 40, 20); 
    doc.setFontSize(9); doc.setFont('helvetica', 'normal');
    
    const roiMaxWidth = contentWidth - (boxPad * 2);
    doc.text(formatTypography(diag.expectedOutcome), margin + boxPad, yPos + 14, {
        maxWidth: roiMaxWidth,
        align: 'justify',
        lineHeightFactor: 1.4
    });
    
    const roiLines = doc.splitTextToSize(diag.expectedOutcome, roiMaxWidth);
    const ctaY = yPos + 14 + (roiLines.length * 5) + 4;
    
    doc.setTextColor(...(COLORS.navy));
    doc.setFontSize(8); doc.setFont('helvetica', 'bold');
    doc.textWithLink('>>> Click to sync with your Coach', margin + boxPad, ctaY, { url: 'https://calendly.com/alpha-hs/coaching-session' });
  }

  addFooter(1);

  // --- PAGE 2: EVIDENCE ---
  if (interventions.length > 0) {
    doc.addPage();
    doc.setFontSize(7); doc.setFont('helvetica', 'bold'); doc.setTextColor(...(COLORS.textGrey));
    doc.text('PERFORMANCE LOG | HS MATH DRI', margin, margin + 4, { charSpace: 1.2 });
    
    doc.setFontSize(14); doc.setFont('helvetica', 'bold'); doc.setTextColor(...(COLORS.textMain));
    doc.text('Evidence & Tracking', margin, margin + 14);
    
    doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(...(COLORS.textGrey));
    doc.text(`History for ${student.firstName} ${student.lastName}`, margin, margin + 20);

    autoTable(doc, {
      startY: margin + 28,
      head: [['Date', 'Objective', 'Action Taken', 'Next Steps']],
      body: interventions.map(inv => [
        inv.interventionDate?.toDate?.().toLocaleDateString() || new Date(inv.interventionDate).toLocaleDateString(),
        formatTypography(inv.objective),
        formatTypography(inv.whatWasDone),
        formatTypography(inv.nextSteps || '-')
      ]),
      theme: 'grid',
      headStyles: { 
        fillColor: [255, 255, 255] as RGBColor, 
        textColor: COLORS.textMain as RGBColor, 
        fontSize: 7, 
        fontStyle: 'bold', 
        halign: 'left',
        lineWidth: 0,
      },
      bodyStyles: { 
        fontSize: 8, 
        textColor: COLORS.textGrey as RGBColor, 
        cellPadding: 4,
        lineColor: [230, 230, 230] as RGBColor,
        lineWidth: 0.1
      },
      alternateRowStyles: { fillColor: [252, 252, 252] as RGBColor },
      columnStyles: {
        0: { cellWidth: 25, fontStyle: 'bold' },
        1: { cellWidth: 40 },
        2: { cellWidth: 'auto' },
        3: { cellWidth: 45 }
      },
      margin: { left: margin, right: margin },
      didDrawPage: (data) => {
         if (data.pageNumber === 2) { 
             doc.setDrawColor(...(COLORS.textMain));
             doc.setLineWidth(0.3);
             doc.line(margin, margin + 28 + 6, pageWidth - margin, margin + 28 + 6);
         }
      }
    });

    addFooter(2);
  }

  doc.save(`Performance_Report_${student.firstName}_${reportDate}.pdf`);
}

export default generateStudentPDF;
