/**
 * Group Report PDF Generator
 * Genera PDFs profesionales con análisis comparativo de grupos
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Student } from '@/types';
import { GroupStats, GroupDimension } from './student-dimensions';

interface GroupReportOptions {
  dimension: GroupDimension;
  dimensionLabel: string;
  stats: GroupStats[];
  students: Student[];
  includeStudentPages?: boolean;
}

export async function generateGroupReportPDF(
  options: GroupReportOptions
): Promise<void> {
  const { dimension, dimensionLabel, stats, students, includeStudentPages = false } = options;
  
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  
  // Cover Page
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 60, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.text('GROUP ANALYTICS REPORT', pageWidth / 2, 25, { align: 'center' });
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text(dimensionLabel, pageWidth / 2, 40, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setTextColor(148, 163, 184);
  const today = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  doc.text(`Generated: ${today}`, pageWidth / 2, 52, { align: 'center' });
  
  // Executive Summary
  doc.setFillColor(30, 41, 59);
  doc.roundedRect(20, 80, pageWidth - 40, 80, 3, 3, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('EXECUTIVE SUMMARY', 30, 95);
  
  const totalStudents = students.length;
  const totalGroups = stats.length;
  const avgRSR = (stats.reduce((acc, s) => acc + s.avgRSR * s.count, 0) / totalStudents).toFixed(1);
  const avgVelocity = (stats.reduce((acc, s) => acc + s.avgVelocity * s.count, 0) / totalStudents).toFixed(1);
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(226, 232, 240);
  
  let yPos = 110;
  doc.text(`Total Students: ${totalStudents}`, 30, yPos);
  yPos += 10;
  doc.text(`Groups: ${totalGroups}`, 30, yPos);
  yPos += 10;
  doc.text(`Avg RSR: ${avgRSR}%`, 30, yPos);
  yPos += 10;
  doc.text(`Avg Velocity: ${avgVelocity}%`, 30, yPos);
  
  // Key Findings
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  yPos = 175;
  doc.text('KEY FINDINGS:', 20, yPos);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(226, 232, 240);
  
  const sortedByRSR = [...stats].sort((a, b) => b.avgRSR - a.avgRSR);
  const topPerformer = sortedByRSR[0];
  const bottomPerformer = sortedByRSR[sortedByRSR.length - 1];
  
  const totalRed = stats.reduce((acc, s) => acc + s.redCount, 0);
  const redPercentage = ((totalRed / totalStudents) * 100).toFixed(1);
  
  yPos += 10;
  doc.text(`• Top: ${topPerformer.group} (${topPerformer.avgRSR.toFixed(0)}% RSR)`, 25, yPos);
  yPos += 8;
  doc.text(`• Needs attention: ${bottomPerformer.group} (${bottomPerformer.avgRSR.toFixed(0)}% RSR)`, 25, yPos);
  yPos += 8;
  doc.text(`• At-risk (RED): ${totalRed} (${redPercentage}%)`, 25, yPos);
  
  // Page 2: Comparative Table
  doc.addPage();
  
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 25, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('COMPARATIVE STATISTICS', pageWidth / 2, 15, { align: 'center' });
  
  const tableData = stats.map((stat) => [
    stat.group,
    stat.count.toString(),
    `${stat.avgRSR.toFixed(0)}%`,
    `${stat.avgVelocity.toFixed(0)}%`,
    stat.avgKSI ? `${stat.avgKSI.toFixed(0)}%` : 'N/A',
    stat.avgRiskScore.toFixed(0),
    `${stat.redCount}/${stat.yellowCount}/${stat.greenCount}`,
  ]);
  
  autoTable(doc, {
    startY: 35,
    head: [['Group', 'N', 'RSR', 'Vel', 'KSI', 'Risk', 'R/Y/G']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 10,
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [15, 23, 42],
    },
    alternateRowStyles: {
      fillColor: [241, 245, 249],
    },
    columnStyles: {
      0: { cellWidth: 50 },
      1: { cellWidth: 15, halign: 'center' },
      2: { cellWidth: 20, halign: 'center' },
      3: { cellWidth: 25, halign: 'center' },
      4: { cellWidth: 20, halign: 'center' },
      5: { cellWidth: 20, halign: 'center' },
      6: { cellWidth: 30, halign: 'center' },
    },
  });
  
  // Page 3: Detailed Breakdown
  doc.addPage();
  
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 25, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('DETAILED BREAKDOWN', pageWidth / 2, 15, { align: 'center' });
  
  yPos = 40;
  
  stats.forEach((stat, index) => {
    if (yPos > pageHeight - 50) {
      doc.addPage();
      yPos = 20;
    }
    
    doc.setFillColor(30, 41, 59);
    doc.roundedRect(20, yPos - 5, pageWidth - 40, 10, 2, 2, 'F');
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text(`${index + 1}. ${stat.group}`, 25, yPos + 2);
    
    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184);
    doc.text(`${stat.count} students`, pageWidth - 25, yPos + 2, { align: 'right' });
    
    yPos += 15;
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    
    doc.text(
      `RSR: ${stat.avgRSR.toFixed(1)}%  |  Vel: ${stat.avgVelocity.toFixed(1)}%  |  Risk: ${stat.avgRiskScore.toFixed(0)}`,
      25,
      yPos
    );
    yPos += 8;
    
    doc.text(
      `Tiers: 🔴${stat.redCount} 🟡${stat.yellowCount} 🟢${stat.greenCount}`,
      25,
      yPos
    );
    yPos += 15;
  });
  
  // Footer
  const totalPages = doc.internal.pages.length - 1;
  
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Page ${i} of ${totalPages}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
  }
  
  const filename = `Group_Report_${dimension}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
}
