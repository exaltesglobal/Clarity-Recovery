import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, View } from 'react-native';

import { Body, Card, Chip, ChipRow, H2, Muted, Screen, SwitchRow } from '../components/ui';
import { formatTimeOfDay } from '../lib/date';
import { ensurePermission, nudgeHours } from '../lib/notifications';
import { useStore } from '../lib/store';
import type { Reminders } from '../lib/types';

const INTERVALS = [1, 2, 3, 4, 6];
const CHECKIN_TIMES = [7, 9, 12, 18, 20, 21, 22];
const STARTS = [6, 7, 8, 9, 10];
const ENDS = [20, 21, 22, 23];

export default function RemindersScreen() {
  const { t, i18n } = useTranslation();
  const { data, actions } = useStore();
  const { reminders } = data;
  const [denied, setDenied] = useState(false);
  const time = (h: number) => formatTimeOfDay(h, 0, i18n.language);

  const update = async (next: Reminders) => {
    const wantsAny = next.checkIn.enabled || next.nudges.enabled;
    if (wantsAny && Platform.OS !== 'web') {
      const ok = await ensurePermission();
      setDenied(!ok);
      if (!ok) return;
    }
    // Saving triggers a reschedule in the root layout.
    actions.setReminders(next);
  };

  return (
    <Screen>
      {Platform.OS === 'web' && (
        <Card variant="gold">
          <Body>{t('reminders.webNote')}</Body>
        </Card>
      )}
      {denied && (
        <Card variant="danger">
          <Body>{t('reminders.denied')}</Body>
        </Card>
      )}

      <Card>
        <SwitchRow
          icon="notifications-outline"
          title={t('reminders.nudges')}
          subtitle={t('reminders.nudgesBody')}
          value={reminders.nudges.enabled}
          onValueChange={(enabled) => update({ ...reminders, nudges: { ...reminders.nudges, enabled } })}
        />
        {reminders.nudges.enabled && (
          <View style={{ gap: 12 }}>
            <H2>{t('reminders.every')}</H2>
            <ChipRow>
              {INTERVALS.map((h) => (
                <Chip
                  key={h}
                  label={t('reminders.everyHours', { count: h })}
                  selected={reminders.nudges.everyHours === h}
                  onPress={() => update({ ...reminders, nudges: { ...reminders.nudges, everyHours: h } })}
                />
              ))}
            </ChipRow>
            <H2>{t('reminders.from')}</H2>
            <ChipRow>
              {STARTS.map((h) => (
                <Chip key={h} label={time(h)} selected={reminders.nudges.startHour === h} onPress={() => update({ ...reminders, nudges: { ...reminders.nudges, startHour: h } })} />
              ))}
            </ChipRow>
            <H2>{t('reminders.until')}</H2>
            <ChipRow>
              {ENDS.map((h) => (
                <Chip key={h} label={time(h)} selected={reminders.nudges.endHour === h} onPress={() => update({ ...reminders, nudges: { ...reminders.nudges, endHour: h } })} />
              ))}
            </ChipRow>
            <Muted>{t('reminders.schedule', { times: nudgeHours(reminders.nudges).map(time).join(', ') })}</Muted>
          </View>
        )}
      </Card>

      <Card>
        <SwitchRow
          icon="create-outline"
          title={t('reminders.checkIn')}
          subtitle={t('reminders.checkInBody')}
          value={reminders.checkIn.enabled}
          onValueChange={(enabled) => update({ ...reminders, checkIn: { ...reminders.checkIn, enabled } })}
        />
        {reminders.checkIn.enabled && (
          <ChipRow>
            {CHECKIN_TIMES.map((h) => (
              <Chip
                key={h}
                label={time(h)}
                selected={reminders.checkIn.hour === h && reminders.checkIn.minute === 0}
                onPress={() => update({ ...reminders, checkIn: { enabled: true, hour: h, minute: 0 } })}
              />
            ))}
          </ChipRow>
        )}
      </Card>

      <Muted center>{t('reminders.discreet')}</Muted>
    </Screen>
  );
}
