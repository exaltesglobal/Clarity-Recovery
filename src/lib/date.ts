import { useEffect, useState } from 'react';

export const MINUTE = 60_000;
export const HOUR = 60 * MINUTE;
export const DAY = 24 * HOUR;

/** Local calendar day as YYYY-MM-DD. */
export function dayKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function dayOfYear(date: Date = new Date()): number {
  const start = new Date(date.getFullYear(), 0, 0);
  return Math.floor((date.getTime() - start.getTime()) / DAY);
}

export function splitDuration(ms: number) {
  const safe = Math.max(0, ms);
  return {
    days: Math.floor(safe / DAY),
    hours: Math.floor((safe % DAY) / HOUR),
    minutes: Math.floor((safe % HOUR) / MINUTE),
  };
}

export function daysIn(ms: number): number {
  return Math.floor(Math.max(0, ms) / DAY);
}

export function formatDateTime(iso: string, locale?: string): string {
  const d = new Date(iso);
  return d.toLocaleString(locale, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export function formatTimeOfDay(hour: number, minute: number, locale?: string): string {
  return new Date(2000, 0, 1, hour, minute).toLocaleTimeString(locale, {
    hour: 'numeric',
    minute: '2-digit',
  });
}

/** Re-renders the caller every `intervalMs` and returns the current time. */
export function useNow(intervalMs = 30_000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

export const MILESTONES = [1, 3, 7, 14, 30, 60, 90, 180, 365, 730];

export function nextMilestone(days: number): { prev: number; next: number } {
  const next = MILESTONES.find((m) => m > days) ?? Math.ceil((days + 1) / 365) * 365;
  const idx = MILESTONES.indexOf(next);
  const prev = idx > 0 ? MILESTONES[idx - 1] : idx === 0 ? 0 : next - 365;
  return { prev, next };
}
