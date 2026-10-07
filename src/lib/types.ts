export type Mood = 1 | 2 | 3 | 4 | 5;

export interface CheckIn {
  id: string;
  date: string;
  mood: Mood;
  /** 0 (none) to 10 (overwhelming) */
  urge: number;
  triggers: string[];
  note: string;
  gratitude: string;
}

export interface Relapse {
  id: string;
  date: string;
  /** Length of the streak that ended, in milliseconds */
  streakMs: number;
  triggers: string[];
  note: string;
  plan: string;
}

export interface UrgeEvent {
  id: string;
  date: string;
}

export interface Partner {
  name: string;
  phone: string;
}

export interface Reminder {
  enabled: boolean;
  hour: number;
  minute: number;
}

export interface Profile {
  name: string;
  reasons: string[];
  /** Show optional Bible verses and prayer content */
  faith: boolean;
  goalDays: number;
}

export interface AppData {
  version: 1;
  onboarded: boolean;
  profile: Profile;
  streakStart: string;
  bestStreakMs: number;
  checkins: CheckIn[];
  relapses: Relapse[];
  urges: UrgeEvent[];
  /** Completed habit ids keyed by local day (YYYY-MM-DD) */
  habits: Record<string, string[]>;
  partner: Partner | null;
  reminder: Reminder;
}
