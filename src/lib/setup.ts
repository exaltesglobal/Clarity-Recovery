import * as Notifications from 'expo-notifications';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppState, Linking, Platform } from 'react-native';

import { backgroundKillerMaker, guard, guardAvailable } from './guard';
import { ensurePermission } from './notifications';
import { useStore } from './store';

/**
 * The "get the most out of Clarity" checklist. Each step either checks its own status
 * (permissions, services) or, when Android can't tell us, lets the user tick it off.
 */

export type SetupGroup = 'essentials' | 'protection' | 'running' | 'extras';

export interface SetupStep {
  id: string;
  group: SetupGroup;
  done: boolean;
  /** The app can't detect this one; the user marks it done. */
  manual: boolean;
  /** Nice to have; not counted in progress. */
  optional: boolean;
  /** Opens the screen where the user does this step. */
  action?: () => void;
  /** Values for {{placeholders}} in the step's texts. */
  vars?: Record<string, string>;
}

interface LiveStatus {
  notifications: boolean;
  dns: boolean;
  pauseService: boolean;
  battery: boolean;
}

const NOT_CHECKED: LiveStatus = { notifications: false, dns: false, pauseService: false, battery: false };

async function readStatus(): Promise<LiveStatus> {
  const notifications = Platform.OS === 'web' ? false : (await Notifications.getPermissionsAsync()).granted;
  if (!guardAvailable || !guard) return { ...NOT_CHECKED, notifications };
  return {
    notifications,
    dns: guard.isDnsFilterActive(),
    pauseService: guard.isPauseServiceEnabled(),
    battery: guard.isIgnoringBatteryOptimizations(),
  };
}

export function useSetupSteps() {
  const { data, actions } = useStore();
  const { t } = useTranslation();
  const [live, setLive] = useState<LiveStatus>(NOT_CHECKED);
  const [maker] = useState(backgroundKillerMaker);

  const refresh = useCallback(() => {
    readStatus()
      .then(setLive)
      .catch(() => {});
  }, []);

  // Re-check whenever the screen is shown or the user comes back from system settings.
  useFocusEffect(
    useCallback(() => {
      refresh();
      const sub = AppState.addEventListener('change', (s) => s === 'active' && refresh());
      return () => sub.remove();
    }, [refresh]),
  );

  const marked = (id: string) => data.setup.done.includes(id);
  const android = guardAvailable && !!guard;
  const steps: SetupStep[] = [];
  const add = (step: Omit<SetupStep, 'manual' | 'optional'> & Partial<Pick<SetupStep, 'manual' | 'optional'>>) =>
    steps.push({ manual: false, optional: false, ...step });

  // Essentials
  if (Platform.OS !== 'web') {
    add({
      id: 'notifications',
      group: 'essentials',
      done: live.notifications,
      action: async () => {
        const granted = await ensurePermission();
        if (!granted) Linking.openSettings().catch(() => {});
        refresh();
      },
    });
  }
  add({ id: 'partner', group: 'essentials', done: !!data.partner, action: () => router.push('/support') });
  add({
    id: 'sosShortcut',
    group: 'essentials',
    manual: true,
    done: marked('sosShortcut'),
    action: android
      ? () => {
          if (guard?.requestSosShortcut(t('panic.shortcutTitle')) && !marked('sosShortcut')) actions.toggleSetupStep('sosShortcut');
        }
      : undefined,
  });

  // Protection
  if (android) {
    add({ id: 'dns', group: 'protection', done: live.dns, action: () => router.push('/protection') });
    add({
      id: 'alwaysOnVpn',
      group: 'protection',
      manual: true,
      optional: true,
      done: marked('alwaysOnVpn'),
      action: () => guard?.openVpnSettings(),
    });
    add({
      id: 'pause',
      group: 'protection',
      done: data.protection.mindfulPause && live.pauseService,
      action: () => router.push('/protection'),
    });
  } else if (Platform.OS === 'ios') {
    add({ id: 'iosDns', group: 'protection', manual: true, done: marked('iosDns'), action: () => router.push('/protection') });
    add({
      id: 'iosScreenTime',
      group: 'protection',
      manual: true,
      optional: true,
      done: marked('iosScreenTime'),
      action: () => router.push('/protection'),
    });
  }

  // Keep Clarity running (Android)
  if (android) {
    add({ id: 'battery', group: 'running', done: live.battery, action: () => guard?.openBatteryOptimizationSettings() });
    if (maker) {
      const vars = { maker };
      add({ id: 'autostart', group: 'running', manual: true, done: marked('autostart'), vars, action: () => guard?.openOemSetting('autostart') });
      add({ id: 'popups', group: 'running', manual: true, done: marked('popups'), vars, action: () => guard?.openOemSetting('popups') });
      add({ id: 'lockRecents', group: 'running', manual: true, done: marked('lockRecents'), vars });
    }
  }

  // Extras
  if (Platform.OS !== 'web') {
    add({ id: 'health', group: 'extras', optional: true, done: data.health.connected, action: () => router.push('/health') });
  }
  add({
    id: 'reminders',
    group: 'extras',
    optional: true,
    done: data.reminders.checkIn.enabled || data.reminders.nudges.enabled,
    action: () => router.push('/reminders'),
  });

  const required = steps.filter((s) => !s.optional);
  return {
    steps,
    total: required.length,
    completed: required.filter((s) => s.done).length,
    refresh,
  };
}
