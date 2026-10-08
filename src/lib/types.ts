import type { Appearance } from '../theme';

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
  /** Open a pre-filled SMS to the partner whenever the panic button is pressed */
  alertOnPanic: boolean;
}

export type Gender = 'male' | 'female' | 'nonbinary' | 'unspecified';
export type AgeRange = '13-17' | '18-24' | '25-34' | '35-44' | '45-54' | '55+';
export type Severity = 'low' | 'moderate' | 'high';

export interface Profile {
  name: string;
  gender: Gender;
  ageRange: AgeRange | null;
  /** ISO 3166-1 alpha-2 country code */
  country: string;
  /** App language code, see src/i18n */
  language: string;
  reasons: string[];
  /** Show optional Bible verses and prayer content */
  faith: boolean;
  goalDays: number;
}

export interface Assessment {
  date: string;
  /** Answers to the self-assessment, 0-3 each */
  answers: number[];
  /** Index into FREQUENCY_OPTIONS */
  frequency: number;
  score: number;
  severity: Severity;
  /** User reported recent thoughts of self-harm */
  safetyFlag: boolean;
}

export interface Reminders {
  checkIn: { enabled: boolean; hour: number; minute: number };
  /** Motivational nudges every N hours between startHour and endHour */
  nudges: { enabled: boolean; everyHours: number; startHour: number; endHour: number };
}

export interface Protection {
  /** User turned on the DNS content filter (Android VPN-based) */
  dnsFilter: boolean;
  /** Show a mindful pause screen when selected apps are opened (Android) */
  mindfulPause: boolean;
  pauseApps: string[];
}

export interface Health {
  connected: boolean;
}

export interface Setup {
  /** Checklist steps the user marked as done by hand (ones the app can't detect itself) */
  done: string[];
  /** User dismissed the "Finish setup" card on Today */
  hidden: boolean;
}

export type VoiceGender = 'female' | 'male';

export interface Sound {
  /** Bells, chimes and breath cues during guided sessions */
  effects: boolean;
  /** Read session steps aloud with the device's text-to-speech */
  voice: boolean;
  voiceGender: VoiceGender;
  /** Device voice the user picked; null chooses one automatically from voiceGender */
  voiceId: string | null;
  /** Speaking rate, 1 is the device's normal speed */
  rate: number;
}

export interface AppData {
  version: 2;
  onboarded: boolean;
  profile: Profile;
  assessment: Assessment | null;
  appearance: Appearance;
  streakStart: string;
  bestStreakMs: number;
  checkins: CheckIn[];
  relapses: Relapse[];
  urges: UrgeEvent[];
  /** Completed habit ids keyed by local day (YYYY-MM-DD) */
  habits: Record<string, string[]>;
  partner: Partner | null;
  reminders: Reminders;
  protection: Protection;
  health: Health;
  setup: Setup;
  sound: Sound;
  /** First launch, used for trial messaging */
  installedAt: string;
}
