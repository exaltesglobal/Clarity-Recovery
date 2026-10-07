import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const CHANNEL_ID = 'daily-checkin';

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

/**
 * Replaces any existing reminder with a daily local notification.
 * Returns false when notifications are unavailable or permission was denied.
 */
export async function scheduleDailyReminder(hour: number, minute: number): Promise<boolean> {
  if (Platform.OS === 'web') return false;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Daily check-in',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  const current = await Notifications.getPermissionsAsync();
  let granted = current.granted;
  if (!granted && current.canAskAgain) {
    granted = (await Notifications.requestPermissionsAsync()).granted;
  }
  if (!granted) return false;

  await Notifications.cancelAllScheduledNotificationsAsync();
  // Deliberately discreet wording: notifications can appear on a lock screen.
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Time for your daily check-in',
      body: 'Take two minutes to reflect on your day.',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
      channelId: CHANNEL_ID,
    },
  });
  return true;
}

export async function cancelReminders() {
  if (Platform.OS === 'web') return;
  await Notifications.cancelAllScheduledNotificationsAsync();
}
