import * as Notifications from 'expo-notifications';
import type { TFunction } from 'i18next';
import { Platform } from 'react-native';

import { formatDate } from './date';
import type { Reminders } from './types';

/**
 * Local reminder notifications. On Android, expo-notifications schedules these
 * with AlarmManager and shows them through NotificationManager on the
 * "reminders" channel; on iOS they go through UNUserNotificationCenter.
 */

const CHANNEL_ID = 'reminders';
const TRIAL_REMINDER_ID = 'trial-ending';
const TRIAL_REMINDER_DAYS = 2;

/** Cancels the recurring reminders but keeps the one-off trial reminder. */
async function cancelRecurring() {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      .filter((n) => n.identifier !== TRIAL_REMINDER_ID)
      .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)),
  );
}

export function configureNotifications() {
  if (Platform.OS === 'web') return;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: false,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

export async function ensurePermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Recovery reminders',
      importance: Notifications.AndroidImportance.DEFAULT,
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PRIVATE,
    });
  }
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  return (await Notifications.requestPermissionsAsync()).granted;
}

/** Hours of the day (0-23) at which nudges fire. */
export function nudgeHours(nudges: Reminders['nudges']): number[] {
  const hours: number[] = [];
  const end = nudges.endHour >= nudges.startHour ? nudges.endHour : nudges.endHour + 24;
  for (let h = nudges.startHour; h <= end; h += Math.max(1, nudges.everyHours)) hours.push(h % 24);
  return hours;
}

/**
 * Replaces every scheduled reminder with the user's current settings.
 * Returns false when notifications are unavailable or permission was denied.
 */
export async function syncReminders(reminders: Reminders, t: TFunction): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  await cancelRecurring();
  const wanted = reminders.checkIn.enabled || reminders.nudges.enabled;
  if (!wanted) return true;
  if (!(await ensurePermission())) return false;

  const daily = (hour: number, minute: number) => ({
    type: Notifications.SchedulableTriggerInputTypes.DAILY as const,
    hour,
    minute,
    channelId: CHANNEL_ID,
  });

  // Wording is deliberately discreet: notifications can appear on a lock screen.
  if (reminders.checkIn.enabled) {
    await Notifications.scheduleNotificationAsync({
      content: { title: t('notifications.checkInTitle'), body: t('notifications.checkInBody'), data: { href: '/checkin' } },
      trigger: daily(reminders.checkIn.hour, reminders.checkIn.minute),
    });
  }
  if (reminders.nudges.enabled) {
    const messages = t('notifications.nudges', { returnObjects: true }) as string[];
    const hours = nudgeHours(reminders.nudges).filter(
      (h) => !(reminders.checkIn.enabled && h === reminders.checkIn.hour),
    );
    for (const [i, hour] of hours.entries()) {
      await Notifications.scheduleNotificationAsync({
        content: { title: t('appName'), body: messages[i % messages.length], data: { href: '/' } },
        trigger: daily(hour, 0),
      });
    }
  }
  return true;
}

/**
 * Reminds trial users two days before their free trial converts to a paid plan,
 * so nobody is charged by surprise. Pass endsAt = null to cancel it
 * (not in a trial, or the user already turned off auto-renew).
 */
export async function syncTrialReminder(endsAt: string | null, t: TFunction, locale: string) {
  if (Platform.OS === 'web') return;
  await Notifications.cancelScheduledNotificationAsync(TRIAL_REMINDER_ID);
  if (!endsAt) return;
  const fireAt = new Date(new Date(endsAt).getTime() - TRIAL_REMINDER_DAYS * 86_400_000);
  if (fireAt.getTime() < Date.now() + 60_000) return;
  if (!(await ensurePermission())) return;
  await Notifications.scheduleNotificationAsync({
    identifier: TRIAL_REMINDER_ID,
    content: {
      title: t('notifications.trialEndingTitle'),
      body: t('notifications.trialEndingBody', { date: formatDate(endsAt, locale) }),
      data: { href: '/settings' },
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: fireAt, channelId: CHANNEL_ID },
  });
}

/** Cancels every scheduled notification, including the trial reminder. */
export async function cancelReminders() {
  if (Platform.OS === 'web') return;
  await Notifications.cancelAllScheduledNotificationsAsync();
}
