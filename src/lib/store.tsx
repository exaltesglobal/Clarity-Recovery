import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { DAY, dayKey } from './date';
import type { AppData, CheckIn, Partner, Profile, Reminder } from './types';

const STORAGE_KEY = 'clarity:data:v1';

export function createDefaultData(): AppData {
  return {
    version: 1,
    onboarded: false,
    profile: { name: '', reasons: [], faith: false, goalDays: 90 },
    streakStart: new Date().toISOString(),
    bestStreakMs: 0,
    checkins: [],
    relapses: [],
    urges: [],
    habits: {},
    partner: null,
    reminder: { enabled: false, hour: 20, minute: 0 },
  };
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
    completeOnboarding(profile: Profile, daysClean: number) {
      update((d) => ({
        ...d,
        onboarded: true,
        profile,
        streakStart: new Date(Date.now() - Math.max(0, daysClean) * DAY).toISOString(),
      }));
    },
    updateProfile(patch: Partial<Profile>) {
      update((d) => ({ ...d, profile: { ...d.profile, ...patch } }));
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
    setReminder(reminder: Reminder) {
      update((d) => ({ ...d, reminder }));
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
      .then((raw) => {
        const saved = raw ? (JSON.parse(raw) as Partial<AppData>) : {};
        setData({ ...createDefaultData(), ...saved });
      })
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
