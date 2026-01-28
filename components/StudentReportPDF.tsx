'use client';

import jsPDF from 'jspdf';
import { Student } from '@/types';

interface StudentReportOptions {
  student: Student;
  interventions?: any[];
  driName?: string;
}

// ==========================================
// BIBLIA DE DISEÑO: EXECUTIVE WHITE PALETTE
// ==========================================
const COLORS = {
  navy: [18, 67, 109],           // #12436D - Authority Blue
  accentOrange: [216, 67, 21],   // #D84315 - Rhythm Orange
  positiveGreen: [27, 94, 32],   // #1B5E20 - Accuracy Green
  lightGreen: [232, 245, 233],   // #E8F5E9 - Soft Green bg
  textMain: [26, 26, 26],        // #1A1A1A - Near Black
  textGrey: [97, 97, 97],        // #616161 - Diagnostic Grey
  softBg: [248, 249, 250],       // #F8F9FA - Subtle background
  white: [255, 255, 255],
};

// ==========================================
// DIAGNOSTIC ENGINE
// Genera diagnóstico personalizado basado en métricas
// ==========================================
function generateDiagnosis(student: Student): {
  headline: { hasStrength: string; needsWork: string };
  executiveDiagnosis: string;
  strengthMetric: { label: string; value: number };
  bottleneckMetric: { label: string; value: number };
  momentumGap: { title: string; points: string[] };
  driInsight: string;
  protocol: { title: string; description: string }[];
  expectedOutcome: string;
} {
  const accuracy = student.metrics.accuracyRate || 0;
  const velocity = student.metrics.velocityScore || 0;
  const ksi = student.metrics.ksi || 50;
  const rsr = Math.round((student.metrics.lmp || 0) * 100);

  // Determine strength and bottleneck
  const metrics = [
    { key: 'accuracy', label: 'Accuracy', value: accuracy },
    { key: 'velocity', label: 'Progress', value: velocity },
    { key: 'consistency', label: 'Consistency', value: ksi },
    { key: 'rsr', label: 'Recent Success', value: rsr },
  ];

  const sorted = [...metrics].sort((a, b) => b.value - a.value);
  const strength = sorted[0];
  const bottleneck = sorted[sorted.length - 1];

  // Generate personalized content based on patterns
  let headline = { hasStrength: 'the Foundation', needsWork: 'Momentum' };
  let executiveDiagnosis = '';
  let momentumGap = { title: 'The Growth Opportunity', points: [] as string[] };
  let driInsight = '';
  let protocol: { title: string; description: string }[] = [];
  let expectedOutcome = '';

  // Pattern: High accuracy, low velocity (like Zayen)
  if (accuracy >= 70 && velocity < 50) {
    headline = { hasStrength: 'the Accuracy', needsWork: 'your Rhythm' };
    executiveDiagnosis = `Your ${accuracy}% Accuracy confirms mastery. However, your ${velocity}% Progress is the current bottleneck. My instruction is clear: adjust +15 minutes daily to activate your momentum.`;
    momentumGap = {
      title: 'The Momentum Gap',
      points: [
        'Cognitive Friction: Without daily practice, your brain slows down under exam pressure.',
        'Endurance Deficit: Tests require sustained focus. Your rhythm currently only prepares you for short bursts.',
      ],
    };
    driInsight = `${student.firstName}: If we do not close the volume gap now, your ${accuracy}% accuracy will remain potential rather than performance. Consistency is the only multiplier that matters.`;
    protocol = [
      { title: "The 15' Volume Power-Up", description: 'Add exactly 15 minutes of focused practice to your current session. More problems solved = Higher Score.' },
      { title: 'Active Error Armoring', description: "Spend the first 3 minutes of your session reviewing yesterday's errors. Never repeat the same mistake." },
    ];
    expectedOutcome = `Executing this instruction will stabilize your technical base and elevate your weekly progress to ${Math.min(velocity + 25, 80)}%, securing stronger performance in the next evaluation cycle.`;
  }
  // Pattern: Low accuracy, any velocity
  else if (accuracy < 60) {
    headline = { hasStrength: 'the Effort', needsWork: 'Precision' };
    executiveDiagnosis = `Your ${velocity}% Progress shows commitment. However, your ${accuracy}% Accuracy indicates we need to slow down and solidify foundations before advancing.`;
    momentumGap = {
      title: 'The Precision Gap',
      points: [
        'Speed vs Accuracy: Moving fast without understanding creates knowledge debt that compounds over time.',
        'Foundation First: Mastering fundamentals now prevents struggle with advanced topics later.',
      ],
    };
    driInsight = `${student.firstName}: Speed without accuracy is wasted effort. Let's build your foundation strong so your progress becomes permanent.`;
    protocol = [
      { title: 'The Slow-Down Protocol', description: 'Reduce daily volume by 20% but increase focus on understanding each problem completely before moving on.' },
      { title: 'The Review Loop', description: 'Before starting new material, spend 10 minutes reviewing concepts from the previous session until they feel automatic.' },
    ];
    expectedOutcome = `Executing this instruction will raise your accuracy to ${Math.min(accuracy + 15, 85)}% within two weeks, creating a stable foundation for accelerated progress.`;
  }
  // Pattern: Low consistency
  else if (ksi < 50) {
    headline = { hasStrength: 'the Capability', needsWork: 'Consistency' };
    executiveDiagnosis = `Your ${accuracy}% Accuracy proves capability. However, your ${ksi}% Consistency is creating gaps. Daily practice, even 15 minutes, beats occasional long sessions.`;
    momentumGap = {
      title: 'The Consistency Gap',
      points: [
        'Memory Decay: Irregular practice allows learned concepts to fade, requiring re-learning.',
        'Habit Formation: Daily practice builds automatic recall; sporadic practice builds struggle.',
      ],
    };
    driInsight = `${student.firstName}: Your talent is clear. The only thing between you and excellence is showing up daily. Make practice non-negotiable.`;
    protocol = [
      { title: 'The Daily Minimum', description: 'Commit to exactly 15 minutes every single day. No exceptions. Consistency beats intensity.' },
      { title: 'The Anchor Habit', description: 'Attach practice to an existing daily habit (after breakfast, before dinner). Same time, same place.' },
    ];
    expectedOutcome = `Executing this instruction will raise your consistency to ${Math.min(ksi + 30, 90)}% and unlock the full potential of your ${accuracy}% accuracy.`;
  }
  // Pattern: Good overall (GREEN tier)
  else {
    headline = { hasStrength: 'Excellence', needsWork: 'to Maintain It' };
    executiveDiagnosis = `Your metrics show strong performance across the board: ${accuracy}% Accuracy, ${velocity}% Progress, ${ksi}% Consistency. The focus now is optimization and challenge.`;
    momentumGap = {
      title: 'The Excellence Standard',
      points: [
        'Plateau Prevention: Even top performers need progressive challenge to continue growing.',
        'Leadership Opportunity: Your success can help peers while reinforcing your own understanding.',
      ],
    };
    driInsight = `${student.firstName}: You've earned this position. Now let's push further. The goal isn't just success—it's mastery.`;
    protocol = [
      { title: 'The Challenge Protocol', description: 'Attempt 2-3 problems above your current level each session. Struggle is growth.' },
      { title: 'The Teaching Test', description: 'If you can explain a concept to someone else clearly, you truly understand it. Find opportunities to help.' },
    ];
    expectedOutcome = `Maintaining this trajectory will position you for top-tier performance and open doors to advanced opportunities.`;
  }

  return {
    headline,
    executiveDiagnosis,
    strengthMetric: strength,
    bottleneckMetric: bottleneck,
    momentumGap,
    driInsight,
    protocol,
    expectedOutcome,
  };
}

// ==========================================
// MAIN PDF GENERATOR
// Replicating LaTeX Strategic Report Design
// ==========================================
export async function generateStudentPDF({ 
  student, 
  interventions = [], 
  driName = 'Sebastian Sarmiento',
}: StudentReportOptions): Promise<void> {
  
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 12;
  let yPos = 0;

  const diagnosis = generateDiagnosis(student);
  const reportDate = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', month: 'short', day: 'numeric' 
  });

  // ==========================================
  // PHASE 1: HERO SECTION (INTERVENTION DIRECTIVE)
  // Navy background with personalized message
  // ==========================================
  
  doc.setFillColor(COLORS.navy[0], COLORS.navy[1], COLORS.navy[2]);
  doc.roundedRect(margin, margin, pageWidth - margin * 2, 58, 4, 4, 'F');

  // Subtitle
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text(`INTERVENTION DIRECTIVE | DRI ${driName.toUpperCase()}`, margin + 8, margin + 10);

  // Main Headline - Two lines with color emphasis
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text(`${student.firstName}, you have ${diagnosis.headline.hasStrength}.`, margin + 8, margin + 28);
  
  // Second line with orange emphasis
  doc.setTextColor(255, 255, 255);
  doc.text('Now we need ', margin + 8, margin + 40);
  const textWidth = doc.getTextWidth('Now we need ');
  doc.setTextColor(COLORS.accentOrange[0], COLORS.accentOrange[1], COLORS.accentOrange[2]);
  doc.text(diagnosis.headline.needsWork + '.', margin + 8 + textWidth, margin + 40);

  // Executive Diagnosis
  doc.setTextColor(230, 230, 230);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  const diagnosisLines = doc.splitTextToSize(`Executive Diagnosis: ${diagnosis.executiveDiagnosis}`, pageWidth - margin * 2 - 16);
  doc.text(diagnosisLines, margin + 8, margin + 52);

  yPos = margin + 68;

  // ==========================================
  // PHASE 2: KPI LAYER (3 BOXES)
  // ==========================================
  
  const kpiWidth = (pageWidth - margin * 2 - 16) / 3;
  const kpiHeight = 38;
  const kpiY = yPos;

  const kpis = [
    { 
      label: 'MASTERY', 
      sublabel: 'ACCURACY',
      desc: 'What you know correctly.',
      value: student.metrics.accuracyRate || 0,
      color: COLORS.positiveGreen,
    },
    { 
      label: 'VELOCITY', 
      sublabel: 'PROGRESS',
      desc: 'How much ground you covered.',
      value: student.metrics.velocityScore || 0,
      color: (student.metrics.velocityScore || 0) >= 50 ? COLORS.positiveGreen : COLORS.accentOrange,
    },
    { 
      label: 'PRESENCE', 
      sublabel: 'CONSISTENCY',
      desc: 'How often you show up.',
      value: student.metrics.ksi || 50,
      color: COLORS.textMain,
    },
  ];

  kpis.forEach((kpi, i) => {
    const x = margin + i * (kpiWidth + 8);
    
    // Box background
    doc.setFillColor(COLORS.softBg[0], COLORS.softBg[1], COLORS.softBg[2]);
    doc.setDrawColor(COLORS.navy[0], COLORS.navy[1], COLORS.navy[2]);
    doc.setLineWidth(0.3);
    doc.roundedRect(x, kpiY, kpiWidth, kpiHeight, 3, 3, 'FD');

    // Label (top)
    doc.setTextColor(COLORS.navy[0], COLORS.navy[1], COLORS.navy[2]);
    doc.setFontSize(6);
    doc.setFont('helvetica', 'bold');
    doc.text(kpi.label, x + kpiWidth / 2, kpiY + 7, { align: 'center' });

    // Value (large)
    doc.setTextColor(kpi.color[0], kpi.color[1], kpi.color[2]);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text(`${Math.round(kpi.value)}%`, x + kpiWidth / 2, kpiY + 22, { align: 'center' });

    // Sublabel
    doc.setTextColor(COLORS.textMain[0], COLORS.textMain[1], COLORS.textMain[2]);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text(kpi.sublabel, x + kpiWidth / 2, kpiY + 29, { align: 'center' });

    // Description
    doc.setTextColor(COLORS.textGrey[0], COLORS.textGrey[1], COLORS.textGrey[2]);
    doc.setFontSize(6);
    doc.setFont('helvetica', 'normal');
    doc.text(kpi.desc, x + kpiWidth / 2, kpiY + 35, { align: 'center' });
  });

  yPos = kpiY + kpiHeight + 12;

  // ==========================================
  // PHASE 3: TWO-COLUMN DIAGNOSIS
  // Left: Momentum Gap | Right: DRI Insight
  // ==========================================
  
  const colWidth = (pageWidth - margin * 2 - 10) / 2;
  const diagY = yPos;

  // Left Column: Momentum Gap
  doc.setTextColor(COLORS.navy[0], COLORS.navy[1], COLORS.navy[2]);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(diagnosis.momentumGap.title, margin, diagY);

  // Underline
  doc.setDrawColor(COLORS.navy[0], COLORS.navy[1], COLORS.navy[2]);
  doc.setLineWidth(0.5);
  doc.line(margin, diagY + 2, margin + colWidth - 5, diagY + 2);

  doc.setTextColor(COLORS.textMain[0], COLORS.textMain[1], COLORS.textMain[2]);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');

  let bulletY = diagY + 10;
  diagnosis.momentumGap.points.forEach((point) => {
    // Bullet
    doc.setFillColor(COLORS.navy[0], COLORS.navy[1], COLORS.navy[2]);
    doc.circle(margin + 2, bulletY - 1, 1, 'F');
    
    // Text - split into label and description
    const colonIndex = point.indexOf(':');
    if (colonIndex > 0) {
      const label = point.substring(0, colonIndex + 1);
      const desc = point.substring(colonIndex + 1);
      
      doc.setFont('helvetica', 'bold');
      doc.text(label, margin + 6, bulletY);
      
      doc.setFont('helvetica', 'normal');
      const descLines = doc.splitTextToSize(desc.trim(), colWidth - 12);
      doc.text(descLines, margin + 6, bulletY + 5);
      bulletY += 5 + descLines.length * 4 + 4;
    } else {
      const lines = doc.splitTextToSize(point, colWidth - 10);
      doc.text(lines, margin + 6, bulletY);
      bulletY += lines.length * 4 + 4;
    }
  });

  // Right Column: DRI Insight
  const rightX = margin + colWidth + 10;
  
  // Vertical divider
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.8);
  doc.line(margin + colWidth + 3, diagY - 2, margin + colWidth + 3, diagY + 45);

  doc.setTextColor(COLORS.navy[0], COLORS.navy[1], COLORS.navy[2]);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('DRI Insight', rightX, diagY);

  // Underline
  doc.line(rightX, diagY + 2, rightX + colWidth - 5, diagY + 2);

  // Quote
  doc.setTextColor(COLORS.textMain[0], COLORS.textMain[1], COLORS.textMain[2]);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  const insightLines = doc.splitTextToSize(`"${diagnosis.driInsight}"`, colWidth - 5);
  doc.text(insightLines, rightX, diagY + 12);

  // Signature
  const sigY = diagY + 12 + insightLines.length * 4 + 8;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(`– ${driName}`, rightX, sigY);

  yPos = Math.max(bulletY, sigY) + 12;

  // ==========================================
  // PHASE 4: PROTOCOL (NUMBERED STEPS)
  // ==========================================
  
  doc.setTextColor(COLORS.navy[0], COLORS.navy[1], COLORS.navy[2]);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Protocol: Immediate Execution', margin, yPos);

  // Underline
  doc.setDrawColor(COLORS.navy[0], COLORS.navy[1], COLORS.navy[2]);
  doc.setLineWidth(0.5);
  doc.line(margin, yPos + 2, pageWidth - margin, yPos + 2);

  yPos += 10;

  diagnosis.protocol.forEach((step, i) => {
    // Number badge
    doc.setFillColor(COLORS.navy[0], COLORS.navy[1], COLORS.navy[2]);
    doc.roundedRect(margin, yPos - 4, 12, 7, 1.5, 1.5, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text(`0${i + 1}`, margin + 6, yPos, { align: 'center' });

    // Step content
    doc.setTextColor(COLORS.textMain[0], COLORS.textMain[1], COLORS.textMain[2]);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text(step.title + ':', margin + 16, yPos);
    
    doc.setFont('helvetica', 'normal');
    const stepDesc = doc.splitTextToSize(step.description, pageWidth - margin * 2 - 20);
    doc.text(stepDesc, margin + 16, yPos + 5);
    
    yPos += 5 + stepDesc.length * 4 + 6;
  });

  yPos += 4;

  // ==========================================
  // PHASE 5: EXPECTED OUTCOME (ROI BOX)
  // ==========================================
  
  doc.setFillColor(COLORS.lightGreen[0], COLORS.lightGreen[1], COLORS.lightGreen[2]);
  doc.setDrawColor(COLORS.positiveGreen[0], COLORS.positiveGreen[1], COLORS.positiveGreen[2]);
  doc.setLineWidth(0.8);
  doc.roundedRect(margin, yPos, pageWidth - margin * 2, 22, 3, 3, 'FD');

  // Title
  doc.setTextColor(COLORS.positiveGreen[0], COLORS.positiveGreen[1], COLORS.positiveGreen[2]);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text('EXPECTED OUTCOME (ROI)', margin + 5, yPos + 6);

  // Content
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  const outcomeLines = doc.splitTextToSize(diagnosis.expectedOutcome, pageWidth - margin * 2 - 10);
  doc.text(outcomeLines, margin + 5, yPos + 13);

  yPos += 30;

  // ==========================================
  // PHASE 6: CLOSING SIGNATURE
  // ==========================================
  
  doc.setTextColor(COLORS.textMain[0], COLORS.textMain[1], COLORS.textMain[2]);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(driName, pageWidth - margin, yPos, { align: 'right' });
  
  doc.setTextColor(COLORS.textGrey[0], COLORS.textGrey[1], COLORS.textGrey[2]);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text('HS Math DRI', pageWidth - margin, yPos + 5, { align: 'right' });
  doc.text('Alpha HS Academic Team', pageWidth - margin, yPos + 10, { align: 'right' });

  // ==========================================
  // FOOTER
  // ==========================================
  
  doc.setDrawColor(COLORS.navy[0], COLORS.navy[1], COLORS.navy[2]);
  doc.setLineWidth(0.3);
  doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.textMain[0], COLORS.textMain[1], COLORS.textMain[2]);
  doc.text(student.firstName.toUpperCase(), margin, pageHeight - 7);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(COLORS.textGrey[0], COLORS.textGrey[1], COLORS.textGrey[2]);
  doc.text('High Performance Report – Math Academy Data', pageWidth / 2, pageHeight - 7, { align: 'center' });
  doc.text(reportDate, pageWidth - margin, pageHeight - 7, { align: 'right' });

  // ==========================================
  // SAVE
  // ==========================================
  
  const filename = `Strategic_Performance_Report_${student.firstName}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
}

export default generateStudentPDF;
