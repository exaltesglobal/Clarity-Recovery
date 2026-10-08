import type { IconName } from '../components/ui';

/**
 * Structure of the wellness content. All wording lives in the locale files:
 * habits.<id>, sessions.<id>.{title,summary,steps[i].{title,text}}, dietTips[], sleepTips[].
 */

export interface Habit {
  id: string;
  icon: IconName;
  faith?: boolean;
}

export const HABITS: Habit[] = [
  { id: 'meditate', icon: 'leaf-outline' },
  { id: 'move', icon: 'barbell-outline' },
  { id: 'stretch', icon: 'body-outline' },
  { id: 'eat', icon: 'nutrition-outline' },
  { id: 'water', icon: 'water-outline' },
  { id: 'pray', icon: 'book-outline', faith: true },
  { id: 'connect', icon: 'chatbubbles-outline' },
  { id: 'sleep', icon: 'moon-outline' },
];

export function habitsFor(faith: boolean): Habit[] {
  return HABITS.filter((h) => faith || !h.faith);
}

export type Category = 'meditation' | 'yoga' | 'exercise';

export interface Session {
  id: string;
  category: Category;
  /** Habit checked off when the session is completed */
  habit: string;
  /** Show the animated breathing guide during the session */
  breathing?: boolean;
  faith?: boolean;
  /** Duration of each step in seconds; step text is in the locale files */
  steps: number[];
}

export const SESSIONS: Session[] = [
  { id: 'box-breathing', category: 'meditation', habit: 'meditate', breathing: true, steps: [30, 180, 30] },
  { id: 'urge-surfing', category: 'meditation', habit: 'meditate', steps: [20, 60, 60, 120, 60, 30] },
  { id: 'grounding', category: 'meditation', habit: 'meditate', steps: [20, 40, 40, 40, 30, 30, 30] },
  { id: 'body-scan', category: 'meditation', habit: 'meditate', steps: [30, 60, 60, 60, 45, 45, 60] },
  { id: 'self-compassion', category: 'meditation', habit: 'meditate', steps: [45, 45, 60, 60] },
  { id: 'gratitude', category: 'meditation', habit: 'meditate', steps: [30, 60, 60, 60, 30] },
  { id: 'breath-prayer', category: 'meditation', habit: 'pray', faith: true, breathing: true, steps: [30, 150, 60, 20] },
  { id: 'morning-flow', category: 'yoga', habit: 'stretch', steps: [60, 60, 60, 45, 45, 45, 45, 60] },
  { id: 'evening-wind-down', category: 'yoga', habit: 'stretch', steps: [60, 60, 60, 45, 120, 90] },
  { id: 'urge-reset-yoga', category: 'yoga', habit: 'stretch', steps: [30, 45, 45, 45, 60, 60] },
  { id: 'desk-stretch', category: 'yoga', habit: 'stretch', steps: [40, 40, 45, 45, 40, 40] },
  {
    id: 'urge-burner',
    category: 'exercise',
    habit: 'move',
    steps: [30, 10, 30, 10, 30, 10, 30, 10, 30, 10, 30, 10, 30, 10, 30, 60],
  },
  {
    id: 'beginner-strength',
    category: 'exercise',
    habit: 'move',
    steps: [60, 60, 60, 45, 60, 60, 60, 60, 45, 60, 60, 60, 60, 45, 60, 60],
  },
  { id: 'cardio-10', category: 'exercise', habit: 'move', steps: [60, 60, 60, 60, 60, 60, 60, 60, 60, 60] },
  { id: 'walk-it-off', category: 'exercise', habit: 'move', steps: [60, 240, 600, 180, 120] },
];

export function sessionDuration(session: Session): number {
  return session.steps.reduce((total, s) => total + s, 0);
}

export const TRIGGER_IDS = [
  'boredom',
  'stress',
  'loneliness',
  'tired',
  'lateNightPhone',
  'socialMedia',
  'anxiety',
  'anger',
  'sadness',
  'rejection',
  'aloneAtHome',
  'alcohol',
  'reward',
  'other',
] as const;

export const MOODS = [
  { value: 1, icon: 'sad-outline' },
  { value: 2, icon: 'cloudy-outline' },
  { value: 3, icon: 'remove-circle-outline' },
  { value: 4, icon: 'partly-sunny-outline' },
  { value: 5, icon: 'sunny-outline' },
] as const;
