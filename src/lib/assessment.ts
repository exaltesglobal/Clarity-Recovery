import type { Assessment, Protection, Reminders, Severity } from './types';

/**
 * Self-reflection questions (not a diagnostic instrument). Each is answered on a
 * 0-3 scale: never, sometimes, often, almost always. Wording lives in i18n under
 * `assessment.questions.<key>`.
 */
export const QUESTION_KEYS = [
  'moreThanIntended',
  'failedToStop',
  'preoccupied',
  'escalation',
  'harmedLife',
  'coping',
  'shame',
  'despiteProblems',
] as const;

export const ANSWER_KEYS = ['never', 'sometimes', 'often', 'almostAlways'] as const;

/** How often the user currently watches; index is stored in Assessment.frequency. */
export const FREQUENCY_KEYS = ['lessThanMonthly', 'monthly', 'weekly', 'severalWeekly', 'daily', 'severalDaily'] as const;
const FREQUENCY_WEIGHT = [0, 0, 1, 2, 3, 4];

export const MAX_SCORE = QUESTION_KEYS.length * 3 + 4;

export function scoreAssessment(
  answers: number[],
  frequency: number,
  safetyFlag: boolean,
): Assessment {
  const score = answers.reduce((s, a) => s + a, 0) + (FREQUENCY_WEIGHT[frequency] ?? 0);
  const severity: Severity = score >= 16 ? 'high' : score >= 8 ? 'moderate' : 'low';
  return { date: new Date().toISOString(), answers, frequency, score, severity, safetyFlag };
}

export interface Plan {
  goalDays: number;
  reminders: Reminders;
  protection: Pick<Protection, 'dnsFilter' | 'mindfulPause'>;
  recommendPartner: boolean;
  recommendProfessional: boolean;
}

/** Recommended app configuration for a severity level. The user can change all of it later. */
export function planFor(severity: Severity): Plan {
  const checkIn = { enabled: true, hour: 21, minute: 0 };
  switch (severity) {
    case 'high':
      return {
        goalDays: 90,
        reminders: { checkIn, nudges: { enabled: true, everyHours: 2, startHour: 8, endHour: 23 } },
        protection: { dnsFilter: true, mindfulPause: true },
        recommendPartner: true,
        recommendProfessional: true,
      };
    case 'moderate':
      return {
        goalDays: 90,
        reminders: { checkIn, nudges: { enabled: true, everyHours: 3, startHour: 8, endHour: 22 } },
        protection: { dnsFilter: true, mindfulPause: true },
        recommendPartner: true,
        recommendProfessional: false,
      };
    default:
      return {
        goalDays: 30,
        reminders: { checkIn, nudges: { enabled: true, everyHours: 4, startHour: 9, endHour: 21 } },
        protection: { dnsFilter: true, mindfulPause: false },
        recommendPartner: false,
        recommendProfessional: false,
      };
  }
}
