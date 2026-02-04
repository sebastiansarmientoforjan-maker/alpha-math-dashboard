// lib/slack-message-generator.ts
// Generate age-appropriate Slack messages for student outreach

import { Student } from '@/types';
import { getRandomMSTemplate, personalizeMSTemplate } from './slack-templates/ms-templates';
import { getRandomHSTemplate, personalizeHSTemplate } from './slack-templates/hs-templates';

export type AgeGroup = 'MS' | 'HS';
export type RiskTier = 'RED' | 'YELLOW' | 'GREEN';

/**
 * Determine if student is Middle School (6-8) or High School (9-12)
 */
export function getStudentAgeGroup(student: Student): AgeGroup {
  const grade = student.dimensions?.grade;

  // Default to MS if grade is unknown
  if (!grade) return 'MS';

  // Grades 6-8 are Middle School
  // Grades 9-12 are High School
  return grade <= 8 ? 'MS' : 'HS';
}

/**
 * Get risk tier from DRI metrics
 */
export function getRiskTier(student: Student): RiskTier {
  return student.dri.driTier as RiskTier;
}

/**
 * Generate age-appropriate Slack message for a student
 */
export function generateSlackMessage(student: Student): string {
  const ageGroup = getStudentAgeGroup(student);
  const tier = getRiskTier(student);

  // Select appropriate template based on age group and tier
  if (ageGroup === 'MS') {
    const template = getRandomMSTemplate(tier);
    return personalizeMSTemplate(template, student);
  } else {
    const template = getRandomHSTemplate(tier);
    return personalizeHSTemplate(template, student);
  }
}

/**
 * Generate batch messages for multiple students
 */
export function generateBatchMessages(students: Student[]): Map<string, string> {
  const messages = new Map<string, string>();

  students.forEach(student => {
    const message = generateSlackMessage(student);
    messages.set(student.id, message);
  });

  return messages;
}

/**
 * Get message preview (first 100 characters)
 */
export function getMessagePreview(student: Student): string {
  const message = generateSlackMessage(student);
  return message.substring(0, 100) + '...';
}

/**
 * Validate student has required data for message generation
 */
export function canGenerateMessage(student: Student): boolean {
  return !!(
    student.firstName &&
    student.metrics &&
    student.dri &&
    student.dri.driTier
  );
}

/**
 * Get message statistics
 */
export function getMessageStats(message: string): {
  characterCount: number;
  lineCount: number;
  hasEmoji: boolean;
  tone: 'casual' | 'professional';
} {
  const characterCount = message.length;
  const lineCount = message.split('\n').length;
  const hasEmoji = /[\u{1F300}-\u{1F9FF}]/u.test(message);

  // Simple tone detection based on vocabulary
  const casualWords = ['totally', 'super', 'awesome', 'hey', 'gonna'];
  const hasCasualWords = casualWords.some(word => message.toLowerCase().includes(word));

  return {
    characterCount,
    lineCount,
    hasEmoji,
    tone: hasCasualWords ? 'casual' : 'professional',
  };
}
