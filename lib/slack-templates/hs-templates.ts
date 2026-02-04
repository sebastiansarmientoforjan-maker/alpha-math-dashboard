// lib/slack-templates/hs-templates.ts
// High School (Grades 9-12) Slack Message Templates

import { Student } from '@/types';

export interface MessageTemplate {
  greeting: string;
  opening: string;
  statsIntro: string;
  actionItems: string[];
  closing: string;
  emoji: string;
}

/**
 * RED TIER - High School Templates (Strategic Intervention Needed)
 */
export const HS_RED_TEMPLATES: MessageTemplate[] = [
  // Variant 1: Strategic + Professional
  {
    greeting: 'Hi {name},',
    opening: 'I\'ve been reviewing your analytics and noticed your risk score is at {riskScore}/100. I want to help you get back on track before this impacts your overall progress.',
    statsIntro: '📊 Current Performance:\n• Mastery (RSR): {rsr}%\n• Knowledge Stability (KSI): {ksi}%\n• Velocity: {velocity}%\n• Risk Score: {riskScore}/100',
    actionItems: [
      'Let\'s schedule a 20-minute strategy session this week to diagnose the issue',
      'Based on your error patterns, I recommend focusing on {topic} fundamentals',
      'Implement the Pomodoro technique (25-min blocks) for better focus',
      'Review your problem-solving approach - I can share advanced techniques'
    ],
    closing: 'The data shows this is addressable with targeted effort. Many students in your position have turned it around in 2-3 weeks with the right strategy.',
    emoji: ''
  },

  // Variant 2: Future-Oriented
  {
    greeting: 'Hi {name},',
    opening: 'Your current risk score ({riskScore}/100) suggests we need to address some foundational gaps before they compound. This is especially important if you\'re planning to take AP courses or preparing for standardized tests.',
    statsIntro: '📊 Performance Metrics:\n• Mastery (RSR): {rsr}%\n• Knowledge Stability (KSI): {ksi}%\n• Velocity: {velocity}%\n• Risk Score: {riskScore}/100',
    actionItems: [
      'Diagnostic session this week - let\'s identify the root cause',
      'Targeted practice on {topic} - I\'ll create a custom problem set',
      'Study technique audit - your approach may need optimization',
      'Weekly check-ins for the next month to monitor progress'
    ],
    closing: 'This level of performance is recoverable, but it requires immediate action and consistent effort. Your future self will thank you for addressing this now.',
    emoji: ''
  },

  // Variant 3: Data-Driven Approach
  {
    greeting: 'Hi {name},',
    opening: 'The analytics are showing some concerning patterns in your recent performance. Let\'s take a systematic approach to get you back on track.',
    statsIntro: '📊 Key Metrics:\n• Mastery (RSR): {rsr}%\n• Knowledge Stability (KSI): {ksi}%\n• Velocity: {velocity}%\n• Risk Score: {riskScore}/100',
    actionItems: [
      'Analyze your error patterns to identify specific knowledge gaps',
      'Implement spaced repetition for better long-term retention',
      'Focus on conceptual understanding before procedural fluency',
      'Set measurable goals: aim for 80%+ accuracy before advancing'
    ],
    closing: 'Research shows that targeted intervention at this stage prevents long-term struggles. Let\'s address this proactively.',
    emoji: ''
  }
];

/**
 * YELLOW TIER - High School Templates (Solid Performance, Optimization Opportunities)
 */
export const HS_YELLOW_TEMPLATES: MessageTemplate[] = [
  // Variant 1: Analytical + Growth
  {
    greeting: 'Hi {name},',
    opening: 'Solid performance overall - you\'re maintaining good consistency. I see some optimization opportunities that could elevate your results.',
    statsIntro: '📊 Performance Analytics:\n• Mastery (RSR): {rsr}%\n• Knowledge Stability (KSI): {ksi}%\n• Velocity: {velocity}%\n• Risk Score: {riskScore}/100',
    actionItems: [
      'Your {metric} could improve with focused practice on {topic}',
      'Consider active recall techniques - they\'re proven more effective than passive review',
      'Aim for 85%+ accuracy before advancing to new concepts',
      'Challenge yourself with 2-3 harder problems per session'
    ],
    closing: 'Small improvements here will compound significantly over time. You\'re building a strong foundation for advanced math courses.',
    emoji: ''
  },

  // Variant 2: Strategic Development
  {
    greeting: 'Hi {name},',
    opening: 'Your metrics show consistent effort and steady progress. Let\'s discuss strategies to push you from good to exceptional.',
    statsIntro: '📊 Current Status:\n• Mastery (RSR): {rsr}%\n• Knowledge Stability (KSI): {ksi}%\n• Velocity: {velocity}%\n• Risk Score: {riskScore}/100',
    actionItems: [
      'Identify your weakest subtopics and target those specifically',
      'Practice explaining concepts aloud - improves understanding',
      'Time yourself on problem sets to build efficiency for tests',
      'Review incorrect answers immediately while the problem is fresh'
    ],
    closing: 'You\'re positioned well for AP courses. Let\'s ensure you have a rock-solid foundation.',
    emoji: ''
  },

  // Variant 3: Performance Optimization
  {
    greeting: 'Hi {name},',
    opening: 'Good work maintaining your performance. I want to share some optimization strategies that could take you to the next level.',
    statsIntro: '📊 Metrics Summary:\n• Mastery (RSR): {rsr}%\n• Knowledge Stability (KSI): {ksi}%\n• Velocity: {velocity}%\n• Risk Score: {riskScore}/100',
    actionItems: [
      'Implement the Feynman technique - explain concepts as if teaching',
      'Do practice problems BEFORE reviewing solutions',
      'Focus on understanding "why" not just "how"',
      'Use error analysis to identify systematic misconceptions'
    ],
    closing: 'These techniques are what separate good students from great ones. Let\'s implement them strategically.',
    emoji: ''
  }
];

/**
 * GREEN TIER - High School Templates (Excellence + Advanced Opportunities)
 */
export const HS_GREEN_TEMPLATES: MessageTemplate[] = [
  // Variant 1: Excellence + Future Planning
  {
    greeting: 'Hi {name},',
    opening: 'Exceptional performance - your metrics are in the top 3% across all students. Let\'s discuss optimization and advanced opportunities.',
    statsIntro: '📊 Performance Analytics:\n• Mastery (RSR): {rsr}%\n• Knowledge Stability (KSI): {ksi}%\n• Velocity: {velocity}%\n• Risk Score: {riskScore}/100',
    actionItems: [
      'Competition math: AMC 10/12 prep if you\'re interested in college applications',
      'Peer mentoring: Teaching others strengthens understanding and builds leadership',
      'Advanced topics: Linear algebra or calculus preview (college-level content)',
      'Efficiency optimization: Maintain this level with strategic time management'
    ],
    closing: 'Your skill level positions you well for AP courses, honors programs, and STEM scholarships. Let\'s strategize how to leverage this for your college goals.',
    emoji: ''
  },

  // Variant 2: Advanced Development
  {
    greeting: 'Hi {name},',
    opening: 'Outstanding work. Your mastery level indicates you\'re ready for significantly more challenging content. Let\'s discuss next steps.',
    statsIntro: '📊 Elite Performance:\n• Mastery (RSR): {rsr}%\n• Knowledge Stability (KSI): {ksi}%\n• Velocity: {velocity}%\n• Risk Score: {riskScore}/100',
    actionItems: [
      'Consider dual enrollment or college courses if available',
      'Prepare for math competitions (great for college apps)',
      'Explore advanced problem-solving techniques',
      'Maintain your edge: continue challenging yourself daily'
    ],
    closing: 'Students at your level often pursue STEM majors. Let\'s ensure you\'re positioned for top programs.',
    emoji: ''
  },

  // Variant 3: Leadership + Mastery
  {
    greeting: 'Hi {name},',
    opening: 'You\'ve achieved mastery-level performance. Let\'s talk about how to leverage this for both personal growth and helping others.',
    statsIntro: '📊 Mastery Metrics:\n• Mastery (RSR): {rsr}%\n• Knowledge Stability (KSI): {ksi}%\n• Velocity: {velocity}%\n• Risk Score: {riskScore}/100',
    actionItems: [
      'Become a peer tutor - teaching reinforces your own understanding',
      'Pursue enrichment: math olympiad, research projects, or advanced courses',
      'Document your learning journey (great for college essays)',
      'Explore real-world applications: physics, engineering, computer science'
    ],
    closing: 'Your mathematical maturity puts you ahead of most college freshmen. Let\'s make sure this advantage translates to your long-term goals.',
    emoji: ''
  }
];

/**
 * Get random template variant for variety
 */
export function getRandomHSTemplate(tier: 'RED' | 'YELLOW' | 'GREEN'): MessageTemplate {
  let templates: MessageTemplate[];

  switch (tier) {
    case 'RED':
      templates = HS_RED_TEMPLATES;
      break;
    case 'YELLOW':
      templates = HS_YELLOW_TEMPLATES;
      break;
    case 'GREEN':
      templates = HS_GREEN_TEMPLATES;
      break;
    default:
      templates = HS_YELLOW_TEMPLATES;
  }

  return templates[Math.floor(Math.random() * templates.length)];
}

/**
 * Personalize template with student data
 */
export function personalizeHSTemplate(template: MessageTemplate, student: Student): string {
  const name = student.firstName;
  const rsr = (student.metrics.lmp * 100).toFixed(0);
  const ksi = student.metrics.ksi?.toFixed(0) || '70';
  const velocity = student.metrics.velocityScore.toFixed(0);
  const riskScore = student.dri.riskScore?.toFixed(0) || '50';
  const topic = 'quadratic equations'; // Placeholder - would analyze weak topics
  const metric = 'KSI'; // Placeholder - would identify weakest metric

  let message = template.greeting.replace('{name}', name) + '\n\n';
  message += template.opening
    .replace('{name}', name)
    .replace(/{riskScore}/g, riskScore) + '\n\n';
  message += template.statsIntro
    .replace(/{rsr}/g, rsr)
    .replace(/{ksi}/g, ksi)
    .replace(/{velocity}/g, velocity)
    .replace(/{riskScore}/g, riskScore) + '\n\n';

  message += 'Strategic Action Plan:\n';
  template.actionItems.forEach((item, idx) => {
    const personalizedItem = item
      .replace('{topic}', topic)
      .replace('{metric}', metric);
    message += `${idx + 1}. ${personalizedItem}\n`;
  });

  message += '\n' + template.closing;

  if (template.emoji) {
    message += '\n\n' + template.emoji;
  } else {
    message += '\n\nQuestions or want to discuss? I\'m here to help.';
  }

  return message;
}
