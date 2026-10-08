import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { DEFAULT_APPEARANCE, type Appearance } from '../theme';
import { DAY, dayKey } from './date';
import type {
  AppData,
  Assessment,
  CheckIn,
  Partner,
  Profile,
  Protection,
  Setup,
  Sound,
  Reminders,
} from './types';

const STORAGE_KEY = 'clarity:data:v1';

export const DEFAULT_PAUSE_APPS = [
  'com.instagram.android',
  'com.zhiliaoapp.musically',
  'com.twitter.android',
  'com.reddit.frontpage',
  'com.snapchat.android',
  'com.facebook.katana',
  'org.telegram.messenger',
];

export function deviceLocale() {
  const locale = getLocales()[0];
  return {
    language: locale?.languageCode ?? 'en',
    country: locale?.regionCode ?? 'US',
  };
}

export function createDefaultData(): AppData {
  const { language, country } = deviceLocale();
  return {
    version: 2,
    onboarded: false,
    profile: {
      name: '',
      gender: 'unspecified',
      ageRange: null,
      country,
      language,
      reasons: [],
      faith: false,
      goalDays: 90,
    },
    assessment: null,
    appearance: DEFAULT_APPEARANCE,
    streakStart: new Date().toISOString(),
    bestStreakMs: 0,
    checkins: [],
    relapses: [],
    urges: [],
    habits: {},
    partner: null,
    reminders: {
      checkIn: { enabled: false, hour: 21, minute: 0 },
      nudges: { enabled: false, everyHours: 3, startHour: 9, endHour: 21 },
    },
    protection: { dnsFilter: false, mindfulPause: false, pauseApps: DEFAULT_PAUSE_APPS },
    health: { connected: false },
    setup: { done: [], hidden: false },
    sound: { effects: true, voice: true, voiceGender: 'female', voiceId: null, rate: 0.9 },
    installedAt: new Date().toISOString(),
  };
}

/** Upgrades data saved by older app versions. */
function migrate(saved: Record<string, unknown>): AppData {
  const defaults = createDefaultData();
  const merged = { ...defaults, ...saved } as AppData & { reminder?: { enabled: boolean; hour: number; minute: number } };
  merged.profile = { ...defaults.profile, ...(saved.profile as Partial<Profile>) };
  merged.appearance = { ...defaults.appearance, ...(saved.appearance as Partial<Appearance>) };
  merged.reminders = { ...defaults.reminders, ...(saved.reminders as Partial<Reminders>) };
  merged.protection = { ...defaults.protection, ...(saved.protection as Partial<Protection>) };
  merged.setup = { ...defaults.setup, ...(saved.setup as Partial<Setup>) };
  merged.sound = { ...defaults.sound, ...(saved.sound as Partial<Sound>) };
  if (merged.reminder) {
    merged.reminders.checkIn = merged.reminder;
    delete merged.reminder;
  }
  if (merged.partner && merged.partner.alertOnPanic === undefined) {
    merged.partner = { ...merged.partner, alertOnPanic: true };
  }
  merged.version = 2;
  return merged;
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function currentStreakMs(data: AppData, now = Date.now()) {
  return Math.max(0, now - new Date(data.streakStart).getTime());
}

export function bestStreakMs(data: AppData, now = Date.now()) {
  return Math.max(data.bestStreakMs, currentStreakMs(data, now));
}

type Updater = (fn: (data: AppData) => AppData) => void;

function createActions(update: Updater) {
  return {
    completeOnboarding(patch: {
      profile: Profile;
      assessment: Assessment | null;
      reminders: Reminders;
      protection: Partial<Protection>;
      daysClean: number;
    }) {
      update((d) => ({
        ...d,
        onboarded: true,
        profile: patch.profile,
        assessment: patch.assessment,
        reminders: patch.reminders,
        protection: { ...d.protection, ...patch.protection },
        streakStart: new Date(Date.now() - Math.max(0, patch.daysClean) * DAY).toISOString(),
      }));
    },
    updateProfile(patch: Partial<Profile>) {
      update((d) => ({ ...d, profile: { ...d.profile, ...patch } }));
    },
    setAssessment(assessment: Assessment) {
      update((d) => ({ ...d, assessment }));
    },
    setAppearance(patch: Partial<Appearance>) {
      update((d) => ({ ...d, appearance: { ...d.appearance, ...patch } }));
    },
    addCheckIn(entry: Omit<CheckIn, 'id' | 'date'>) {
      update((d) => ({
        ...d,
        checkins: [{ ...entry, id: uid(), date: new Date().toISOString() }, ...d.checkins],
      }));
    },
    logRelapse(entry: { triggers: string[]; note: string; plan: string }) {
      update((d) => {
        const now = Date.now();
        const streakMs = currentStreakMs(d, now);
        return {
          ...d,
          bestStreakMs: Math.max(d.bestStreakMs, streakMs),
          streakStart: new Date(now).toISOString(),
          relapses: [
            { ...entry, id: uid(), date: new Date(now).toISOString(), streakMs },
            ...d.relapses,
          ],
        };
      });
    },
    logUrgeResisted() {
      update((d) => ({
        ...d,
        urges: [{ id: uid(), date: new Date().toISOString() }, ...d.urges],
      }));
    },
    toggleHabit(habitId: string, day = dayKey()) {
      update((d) => {
        const done = d.habits[day] ?? [];
        const next = done.includes(habitId)
          ? done.filter((h) => h !== habitId)
          : [...done, habitId];
        return { ...d, habits: { ...d.habits, [day]: next } };
      });
    },
    completeHabit(habitId: string, day = dayKey()) {
      update((d) => {
        const done = d.habits[day] ?? [];
        if (done.includes(habitId)) return d;
        return { ...d, habits: { ...d.habits, [day]: [...done, habitId] } };
      });
    },
    setPartner(partner: Partner | null) {
      update((d) => ({ ...d, partner }));
    },
    setReminders(reminders: Reminders) {
      update((d) => ({ ...d, reminders }));
    },
    setProtection(patch: Partial<Protection>) {
      update((d) => ({ ...d, protection: { ...d.protection, ...patch } }));
    },
    setSound(patch: Partial<Sound>) {
      update((d) => ({ ...d, sound: { ...d.sound, ...patch } }));
    },
    toggleSetupStep(id: string) {
      update((d) => ({
        ...d,
        setup: { ...d.setup, done: d.setup.done.includes(id) ? d.setup.done.filter((s) => s !== id) : [...d.setup.done, id] },
      }));
    },
    hideSetupCard() {
      update((d) => ({ ...d, setup: { ...d.setup, hidden: true } }));
    },
    setHealthConnected(connected: boolean) {
      update((d) => ({ ...d, health: { connected } }));
    },
    deleteCheckIn(id: string) {
      update((d) => ({ ...d, checkins: d.checkins.filter((c) => c.id !== id) }));
    },
    deleteRelapse(id: string) {
      update((d) => ({ ...d, relapses: d.relapses.filter((r) => r.id !== id) }));
    },
    resetAll() {
      update(() => createDefaultData());
    },
  };
}

export type Actions = ReturnType<typeof createActions>;

interface StoreValue {
  data: AppData;
  actions: Actions;
}

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  const [data, setData] = useState<AppData | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => setData(raw ? migrate(JSON.parse(raw)) : createDefaultData()))
      .catch(() => setData(createDefaultData()));
  }, []);

  useEffect(() => {
    if (!data) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data)).catch(() => {});
  }, [data]);

  const update = useCallback<Updater>((fn) => {
    setData((d) => (d ? fn(d) : d));
  }, []);
  const actions = useMemo(() => createActions(update), [update]);

  if (!data) return <>{fallback ?? null}</>;
  return <StoreContext.Provider value={{ data, actions }}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside <StoreProvider>');
  return ctx;
}
