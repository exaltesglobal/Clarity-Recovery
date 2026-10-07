import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Platform, Switch, View } from 'react-native';

import { ReasonsEditor } from '../components/ReasonsEditor';
import { Button, Card, Chip, ChipRow, Field, H2, Muted, Screen } from '../components/ui';
import { formatTimeOfDay } from '../lib/date';
import { cancelReminders, scheduleDailyReminder } from '../lib/notifications';
import { useStore } from '../lib/store';
import { useTheme } from '../theme';

const GOALS = [30, 90, 180, 365];
const REMINDER_TIMES = [
  { hour: 8, minute: 0 },
  { hour: 12, minute: 30 },
  { hour: 18, minute: 0 },
  { hour: 20, minute: 0 },
  { hour: 21, minute: 30 },
];

function notify(message: string) {
  if (Platform.OS === 'web') globalThis.alert?.(message);
  else Alert.alert(message);
}

export default function Settings() {
  const t = useTheme();
  const { data, actions } = useStore();
  const { profile, reminder } = data;
  const [name, setName] = useState(profile.name);

  const updateReminder = async (enabled: boolean, hour = reminder.hour, minute = reminder.minute) => {
    if (!enabled) {
      await cancelReminders();
      actions.setReminder({ enabled: false, hour, minute });
      return;
    }
    const ok = await scheduleDailyReminder(hour, minute);
    if (!ok) {
      notify(
        Platform.OS === 'web'
          ? 'Reminders are available in the iOS and Android app.'
          : 'Please allow notifications in your device settings to get reminders.',
      );
      return;
    }
    actions.setReminder({ enabled: true, hour, minute });
  };

  const reset = () => {
    const doReset = async () => {
      await cancelReminders();
      actions.resetAll();
      router.replace('/onboarding');
    };
    const title = 'Erase all data? This deletes your streak, journal and settings from this device.';
    if (Platform.OS === 'web') {
      if (globalThis.confirm?.(title)) doReset();
      return;
    }
    Alert.alert('Erase all data?', 'This deletes your streak, journal and settings from this device.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Erase', style: 'destructive', onPress: doReset },
    ]);
  };

  return (
    <Screen>
      <Card>
        <H2>Your name</H2>
        <Field
          value={name}
          onChangeText={setName}
          onEndEditing={() => actions.updateProfile({ name: name.trim() })}
          onBlur={() => actions.updateProfile({ name: name.trim() })}
          placeholder="Optional"
        />
      </Card>

      <Card>
        <H2>Your reasons</H2>
        <ReasonsEditor reasons={profile.reasons} onChange={(reasons) => actions.updateProfile({ reasons })} />
      </Card>

      <Card>
        <H2>Goal</H2>
        <ChipRow>
          {GOALS.map((g) => (
            <Chip
              key={g}
              label={`${g} days`}
              selected={profile.goalDays === g}
              onPress={() => actions.updateProfile({ goalDays: g })}
            />
          ))}
        </ChipRow>
      </Card>

      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ flex: 1, gap: 4 }}>
            <H2>Bible verses & prayer</H2>
            <Muted>Show optional Christian content and the prayer habit.</Muted>
          </View>
          <Switch
            value={profile.faith}
            onValueChange={(faith) => actions.updateProfile({ faith })}
            trackColor={{ true: t.primary }}
          />
        </View>
      </Card>

      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ flex: 1, gap: 4 }}>
            <H2>Daily check-in reminder</H2>
            <Muted>A discreet notification once a day.</Muted>
          </View>
          <Switch value={reminder.enabled} onValueChange={(v) => updateReminder(v)} trackColor={{ true: t.primary }} />
        </View>
        {reminder.enabled && (
          <ChipRow>
            {REMINDER_TIMES.map(({ hour, minute }) => (
              <Chip
                key={`${hour}:${minute}`}
                label={formatTimeOfDay(hour, minute)}
                selected={reminder.hour === hour && reminder.minute === minute}
                onPress={() => updateReminder(true, hour, minute)}
              />
            ))}
          </ChipRow>
        )}
      </Card>

      <Card>
        <H2>Privacy</H2>
        <Muted>
          Renew has no account and no servers. Everything is stored only on this device. Uninstalling the app
          deletes your data.
        </Muted>
        <Button title="Erase all data" variant="danger" icon="trash-outline" onPress={reset} />
      </Card>
    </Screen>
  );
}
