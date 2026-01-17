export interface StudentMetrics {
  // Raw data
  id: number;
  name: string;
  course: string;
  progress: number;
  xpWeek: number;
  weeklyGoal: number;
  timeWeekMin: number;
  accuracy: number;
  
  // TIER 1 Indicators
  velocityScore: number;
  consistencyIndex: number;
  stuckScore: number;
  dropoutProbability: number;
  
  // Status
  status: 'AT_RISK' | 'SPINNING' | 'PROGRESSING' | 'INACTIVE' | 'COLD_START';
  alerts: string[];
}

export function calculateMetrics(studentData: any): StudentMetrics {
  const { schedule, currentCourse, activity } = studentData;
  
  // Calculate weekly goal
  const weeklyGoal = (schedule?.monGoal || 0) + 
                     (schedule?.tueGoal || 0) + 
                     (schedule?.wedGoal || 0) + 
                     (schedule?.thuGoal || 0) + 
                     (schedule?.friGoal || 0) + 
                     (schedule?.satGoal || 0) + 
                     (schedule?.sunGoal || 0);
  
  const xpWeek = activity?.xpAwarded || 0;
  const timeWeekMin = Math.round((activity?.time || 0) / 60);
  const progress = Math.round((currentCourse?.progress || 0) * 100);
  const questions = activity?.questions || 1;
  const questionsCorrect = activity?.questionsCorrect || 0;
  const accuracy = Math.round((questionsCorrect / questions) * 100);
  
  // TIER 1 INDICATORS
  
  // 1. Velocity Score (XP / Meta)
  const velocityScore = weeklyGoal > 0 ? Math.round((xpWeek / weeklyGoal) * 100) : 0;
  
  // 2. Consistency Index (simplified - based on XP this week)
  const consistencyIndex = xpWeek > 0 ? Math.min(100, Math.round((xpWeek / weeklyGoal) * 100)) : 0;
  
  // 3. Stuck Score (High time + Low progress + Low accuracy)
  let stuckScore = 0;
  if (timeWeekMin > 200 && progress < 30) stuckScore += 0.4;
  if (timeWeekMin > 100 && xpWeek < 100) stuckScore += 0.3;
  if (accuracy < 60 && xpWeek > 0) stuckScore += 0.3;
  stuckScore = Math.round(stuckScore * 100);
  
  // 4. Dropout Probability
  const daysInactive = xpWeek === 0 ? 7 : 0;
  const velocityPenalty = velocityScore < 50 ? 3 : 0;
  const accuracyPenalty = accuracy < 60 && xpWeek > 0 ? 1 : 0;
  const dropoutProbability = Math.min(100, (daysInactive * 2) + velocityPenalty + accuracyPenalty);
  
  // Determine Status
  let status: StudentMetrics['status'];
  if (timeWeekMin > 200 && progress < 30) {
    status = 'AT_RISK';
  } else if (timeWeekMin > 100 && xpWeek < 100) {
    status = 'SPINNING';
  } else if (xpWeek === 0) {
    status = 'INACTIVE';
  } else if (progress < 5 && xpWeek < 50) {
    status = 'COLD_START';
  } else {
    status = 'PROGRESSING';
  }
  
  // Generate Alerts
  const alerts: string[] = [];
  if (stuckScore > 70) alerts.push('STUCK: High effort + Low progress');
  if (dropoutProbability > 50) alerts.push('HIGH DROPOUT RISK');
  if (xpWeek === 0 && progress > 0) alerts.push('INACTIVE: No activity this week');
  if (velocityScore < 50 && xpWeek > 0) alerts.push('BELOW TARGET: <50% of weekly goal');
  if (accuracy < 60 && xpWeek > 50) alerts.push('LOW ACCURACY: Check understanding');
  
  return {
    id: studentData.id,
    name: `${studentData.firstName} ${studentData.lastName}`,
    course: currentCourse?.name?.replace('Fundamentals', '').trim() || 'N/A',
    progress,
    xpWeek,
    weeklyGoal,
    timeWeekMin,
    accuracy,
    velocityScore,
    consistencyIndex,
    stuckScore,
    dropoutProbability,
    status,
    alerts,
  };
}

export function calculateCohortMetrics(allMetrics: StudentMetrics[]) {
  const total = allMetrics.length;
  const atRisk = allMetrics.filter(m => m.status === 'AT_RISK').length;
  const spinning = allMetrics.filter(m => m.status === 'SPINNING').length;
  const inactive = allMetrics.filter(m => m.status === 'INACTIVE').length;
  const progressing = allMetrics.filter(m => m.status === 'PROGRESSING').length;
  const coldStart = allMetrics.filter(m => m.status === 'COLD_START').length;
  
  const avgVelocity = Math.round(
    allMetrics.reduce((sum, m) => sum + m.velocityScore, 0) / total
  );
  
  const avgProgress = Math.round(
    allMetrics.reduce((sum, m) => sum + m.progress, 0) / total
  );
  
  return {
    total,
    atRisk,
    spinning,
    inactive,
    progressing,
    coldStart,
    avgVelocity,
    avgProgress,
  };
}
