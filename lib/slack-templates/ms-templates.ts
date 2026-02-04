// lib/slack-templates/ms-templates.ts
// Middle School (Grades 6-8) Slack Message Templates

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
 * RED TIER - Middle School Templates (Critical Support Needed)
 */
export const MS_RED_TEMPLATES: MessageTemplate[] = [
  // Variant 1: Supportive + Concrete
  {
    greeting: 'Hi {name}! 👋',
    opening: 'Hey! I noticed math has been tricky lately. That\'s totally normal - everyone struggles sometimes! Let\'s work together to make it easier. 💪',
    statsIntro: '📊 Your Stats Right Now:\n• Getting It Right: {rsr}%\n• Staying Steady: {ksi}%\n• Speed: {velocity}%\n• Challenge Level: {tier}',
    actionItems: [
      'Let\'s meet for 10 mins this week - I\'ll show you some shortcuts',
      'Try just 15 minutes a day (that\'s like 3 TikToks worth of time!)',
      'When you get stuck, hit the hint button - it\'s there to help!',
      'Text me on Slack if you\'re frustrated - I got you!'
    ],
    closing: 'Math is like leveling up in a video game - you gotta practice the basics before the boss fight! 🎮',
    emoji: '🚀'
  },

  // Variant 2: Encouraging + Relatable
  {
    greeting: 'Hi {name}! 👋',
    opening: 'I see you\'re having a tough time with {topic}. I totally get it - {topic} can feel impossible at first! But here\'s the thing: you CAN do this. 💯',
    statsIntro: '📊 Your Stats:\n• Getting It Right: {rsr}%\n• Staying Steady: {ksi}%\n• Speed: {velocity}%',
    actionItems: [
      'Break it into tiny pieces (like eating pizza one slice at a time 🍕)',
      'Practice 10 mins a day - that\'s it! Small wins add up',
      'Use the hints! Seriously, they\'re like cheat codes (but allowed!)',
      'Message me when you\'re confused - that\'s what I\'m here for'
    ],
    closing: 'Remember: Every math expert started exactly where you are. They just kept trying! 🌟',
    emoji: '🚀'
  },

  // Variant 3: Problem-Solving Approach
  {
    greeting: 'Hi {name}! 👋',
    opening: 'I\'ve been watching your progress and I think we can turn this around together! You\'re working hard, so let\'s work SMART. 🧠',
    statsIntro: '📊 Where You\'re At:\n• Getting It Right: {rsr}%\n• Staying Steady: {ksi}%\n• Speed: {velocity}%',
    actionItems: [
      'Let\'s find your "stuck spots" - I\'ll help you get unstuck',
      'Try the practice problems first, then check your answers',
      'Take breaks! Your brain needs time to process (seriously!)',
      'Ask questions - there are NO dumb questions in math!'
    ],
    closing: 'You got this! We\'re gonna figure this out together. 💪',
    emoji: '🚀'
  }
];

/**
 * YELLOW TIER - Middle School Templates (On Track, Room to Improve)
 */
export const MS_YELLOW_TEMPLATES: MessageTemplate[] = [
  // Variant 1: Positive + Growth
  {
    greeting: 'Hi {name}! 👋',
    opening: 'Nice work! You\'re doing pretty good, and I think we can make it even better! 📈',
    statsIntro: '📊 Your Stats:\n• Getting It Right: {rsr}%\n• Staying Steady: {ksi}%\n• Speed: {velocity}%',
    actionItems: [
      'Try explaining a math problem to a friend - teaching helps YOU learn!',
      'Aim for {target}% on your next 10 problems (you can totally do it!)',
      'Challenge yourself with 2 harder problems this week',
      'Keep up your daily practice - consistency is 🔑'
    ],
    closing: 'You\'re building a really strong foundation. Let\'s keep that momentum going! 💪',
    emoji: '🚀'
  },

  // Variant 2: Encouraging Progress
  {
    greeting: 'Hi {name}! 👋',
    opening: 'You\'re on the right track! I can see you\'re putting in effort and it\'s paying off. Let\'s take it to the next level! ⬆️',
    statsIntro: '📊 Your Progress:\n• Getting It Right: {rsr}%\n• Staying Steady: {ksi}%\n• Speed: {velocity}%',
    actionItems: [
      'Focus on accuracy first, then speed will come naturally',
      'Review your mistakes - they\'re actually your best teachers!',
      'Try to beat your own high score (compete with yourself!)',
      'Celebrate your wins - you\'re doing better than you think!'
    ],
    closing: 'Keep going! You\'re closer to mastering this than you realize. 🌟',
    emoji: '🚀'
  },

  // Variant 3: Building Confidence
  {
    greeting: 'Hi {name}! 👋',
    opening: 'Hey! Your math skills are getting stronger every day. I\'m proud of the effort you\'re putting in! 👏',
    statsIntro: '📊 Your Numbers:\n• Getting It Right: {rsr}%\n• Staying Steady: {ksi}%\n• Speed: {velocity}%',
    actionItems: [
      'Try one really hard problem today - stretch yourself!',
      'Help a classmate if they\'re stuck (teaching = learning 2x)',
      'Show your parents your progress - they\'ll be so proud!',
      'Keep that daily streak going - you\'re building a habit!'
    ],
    closing: 'You\'re doing great! Let\'s keep building on this progress. 💯',
    emoji: '🚀'
  }
];

/**
 * GREEN TIER - Middle School Templates (Excellent Performance)
 */
export const MS_GREEN_TEMPLATES: MessageTemplate[] = [
  // Variant 1: Celebration + Challenge
  {
    greeting: 'Hi {name}! 🎉',
    opening: 'WOW! You\'re absolutely crushing it! Your stats are amazing! 🔥',
    statsIntro: '📊 Your Stats:\n• Getting It Right: {rsr}%\n• Staying Steady: {ksi}%\n• Speed: {velocity}%',
    actionItems: [
      'Want to try some competition problems? They\'re like puzzle games!',
      'Can you help a classmate who\'s struggling? (Teaching = learning 2x!)',
      'Let\'s unlock the bonus challenges - you\'re definitely ready',
      'Show your parents these stats - they\'ll be so proud!'
    ],
    closing: 'You\'re literally in the top 5% of ALL students. That\'s INCREDIBLE! Keep being awesome! 🌟',
    emoji: '🚀'
  },

  // Variant 2: Recognition + Advanced Path
  {
    greeting: 'Hi {name}! 🎉',
    opening: 'You\'re a MATH STAR! ⭐ Seriously, your performance is off the charts! Let\'s talk about what\'s next!',
    statsIntro: '📊 Your Amazing Stats:\n• Getting It Right: {rsr}%\n• Staying Steady: {ksi}%\n• Speed: {velocity}%',
    actionItems: [
      'Ready for the advanced challenges? They\'re super fun!',
      'Want to enter a math competition? You\'d do great!',
      'Try teaching these concepts to a friend - be a math mentor!',
      'Keep pushing yourself - you\'re capable of even more!'
    ],
    closing: 'You\'re doing amazing things! Keep up the incredible work! 🚀',
    emoji: '⭐'
  },

  // Variant 3: Empowerment + Leadership
  {
    greeting: 'Hi {name}! 🎉',
    opening: 'You\'re DOMINATING math right now! Your skills are next-level! 💪',
    statsIntro: '📊 Your Superstar Stats:\n• Getting It Right: {rsr}%\n• Staying Steady: {ksi}%\n• Speed: {velocity}%',
    actionItems: [
      'Become a math helper - your classmates could learn from you!',
      'Try the bonus round challenges (they\'re like boss battles!)',
      'Set a new personal record - challenge yourself!',
      'Share your success story - inspire others!'
    ],
    closing: 'You\'re proving that hard work pays off! Keep shining! ✨',
    emoji: '🚀'
  }
];

/**
 * Get random template variant for variety
 */
export function getRandomMSTemplate(tier: 'RED' | 'YELLOW' | 'GREEN'): MessageTemplate {
  let templates: MessageTemplate[];

  switch (tier) {
    case 'RED':
      templates = MS_RED_TEMPLATES;
      break;
    case 'YELLOW':
      templates = MS_YELLOW_TEMPLATES;
      break;
    case 'GREEN':
      templates = MS_GREEN_TEMPLATES;
      break;
    default:
      templates = MS_YELLOW_TEMPLATES;
  }

  return templates[Math.floor(Math.random() * templates.length)];
}

/**
 * Personalize template with student data
 */
export function personalizeMSTemplate(template: MessageTemplate, student: Student): string {
  const name = student.firstName;
  const rsr = (student.metrics.lmp * 100).toFixed(0);
  const ksi = student.metrics.ksi?.toFixed(0) || '70';
  const velocity = student.metrics.velocityScore.toFixed(0);
  const tier = student.dri.driTier;
  const topic = 'fractions'; // Placeholder - would analyze weak topics
  const target = (parseFloat(rsr) + 10).toFixed(0);

  let message = template.greeting.replace('{name}', name) + '\n\n';
  message += template.opening
    .replace('{name}', name)
    .replace(/{topic}/g, topic) + '\n\n';
  message += template.statsIntro
    .replace('{rsr}', rsr)
    .replace('{ksi}', ksi)
    .replace('{velocity}', velocity)
    .replace('{tier}', tier) + '\n\n';

  message += 'Here\'s our game plan:\n';
  template.actionItems.forEach((item, idx) => {
    message += `${idx + 1}. ${item.replace('{target}', target)}\n`;
  });

  message += '\n' + template.closing + '\n\n';
  message += `Questions? Just ask! ${template.emoji}`;

  return message;
}
