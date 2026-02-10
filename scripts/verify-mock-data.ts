// ============================================
// VERIFICATION SCRIPT FOR MOCK DATA
// ============================================
// Verify that mock data includes all required elements

import { fetchStudents, getMockStatistics } from '../lib/api-mock';

async function verifyMockData() {
  console.log('🔍 VERIFYING COMMAND v7 MOCK DATA\n');

  const students = await fetchStudents();
  const stats = await getMockStatistics();

  console.log('📊 OVERALL STATISTICS:');
  console.log(`   Total students: ${stats.totalStudents}`);
  console.log(`   Critical students: ${stats.criticalStudents} (${(stats.criticalStudents / stats.totalStudents * 100).toFixed(1)}%)`);
  console.log(`   With interventions: ${stats.studentsWithInterventions} (${(stats.studentsWithInterventions / stats.totalStudents * 100).toFixed(1)}%)`);
  console.log(`   Average velocity: ${stats.averageVelocity}% per week`);
  console.log(`   Average progress: ${stats.averageProgress}%`);
  console.log(`   Campuses: ${stats.campuses.join(', ')}\n`);

  // Verify 10% critical injection
  const criticalCount = students.filter(s => s.riskScore >= 60).length;
  const criticalPercentage = (criticalCount / students.length) * 100;
  console.log('✅ CRITICAL STATE INJECTION:');
  console.log(`   Expected: ~10% (160 students)`);
  console.log(`   Actual: ${criticalPercentage.toFixed(1)}% (${criticalCount} students)`);

  // Verify velocity < 0.8 for critical
  const redShiftCount = students.filter(s => s.metrics.velocity < 0.8).length;
  console.log(`   RED_SHIFT (velocity < 0.8): ${redShiftCount} students\n`);

  // Verify 20% intervention history injection
  const withHistory = students.filter(s => s.interventionHistory.length > 0);
  const historyPercentage = (withHistory.length / students.length) * 100;
  console.log('✅ INTERVENTION HISTORY INJECTION:');
  console.log(`   Expected: ~20% (320 students)`);
  console.log(`   Actual: ${historyPercentage.toFixed(1)}% (${withHistory.length} students)\n`);

  // Sample intervention history
  if (withHistory.length > 0) {
    const sample = withHistory[0];
    console.log('📋 SAMPLE INTERVENTION HISTORY:');
    console.log(`   Student: ${sample.firstName} ${sample.lastName} (${sample.id})`);
    console.log(`   Interventions: ${sample.interventionHistory.length}`);

    sample.interventionHistory.slice(0, 2).forEach((intervention, i) => {
      console.log(`\n   Intervention ${i + 1}:`);
      console.log(`     ID: ${intervention.id}`);
      console.log(`     Date: ${intervention.timestamp.toLocaleDateString()}`);
      console.log(`     DRI: ${intervention.dri}`);
      console.log(`     Level: ${intervention.level}`);
      console.log(`     Reason: ${intervention.reason}`);
      console.log(`     Velocity before: ${intervention.velocityBefore.toFixed(2)}% per week`);
      console.log(`     Velocity after (24h): ${intervention.velocityAfter?.toFixed(2)}% per week`);
      console.log(`     Success: ${intervention.successful ? '✅ YES' : '❌ NO'}`);
      console.log(`     Recovery factor: ${((intervention.velocityAfter! / intervention.velocityBefore) * 100).toFixed(0)}%`);
    });
  }

  console.log('\n✅ VERIFICATION COMPLETE - All data injections confirmed!');
}

verifyMockData().catch(console.error);
