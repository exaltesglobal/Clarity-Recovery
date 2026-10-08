import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { ListenButton } from '../components/ListenButton';
import { Body, Button, Card, Chip, ChipRow, Field, H1, H2, Muted, Screen } from '../components/ui';
import { GRACE_VERSES, verseSpeech } from '../content/verses';
import { TRIGGER_IDS } from '../content/wellness';
import { daysIn } from '../lib/date';
import { currentStreakMs, useStore } from '../lib/store';

export default function RelapseScreen() {
  const { t } = useTranslation();
  const { data, actions } = useStore();
  const [triggers, setTriggers] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const [plan, setPlan] = useState('');
  const [saved, setSaved] = useState(false);
  const [endedStreak] = useState(() => currentStreakMs(data));

  const toggle = (trigger: string) =>
    setTriggers((ts) => (ts.includes(trigger) ? ts.filter((x) => x !== trigger) : [...ts, trigger]));

  const save = () => {
    actions.logRelapse({ triggers, note: note.trim(), plan: plan.trim() });
    setSaved(true);
  };

  if (saved) {
    const verse = GRACE_VERSES[data.relapses.length % GRACE_VERSES.length];
    return (
      <Screen>
        <H1>{t('relapse.thanks')}</H1>
        <Body>{t('relapse.message')}</Body>
        <Card variant="soft">
          <Body>{t('relapse.stayedStrong', { count: daysIn(endedStreak) })}</Body>
        </Card>
        {data.profile.faith && (
          <Card>
            <Body style={{ fontStyle: 'italic' }}>“{verse.text}”</Body>
            <Muted>— {verse.ref} (KJV)</Muted>
            <ListenButton text={verseSpeech(verse)} language="en" />
          </Card>
        )}
        {plan.trim() !== '' && (
          <Card>
            <Muted>{t('relapse.yourPlan')}</Muted>
            <Body>{plan.trim()}</Body>
          </Card>
        )}
        <Button title={t('relapse.beginAgain')} icon="refresh" onPress={() => router.back()} />
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={{ gap: 6 }}>
        <H1>{t('relapse.heading')}</H1>
        <Muted>{t('relapse.body')}</Muted>
      </View>

      <Card>
        <H2>{t('relapse.triggerQuestion')}</H2>
        <ChipRow>
          {TRIGGER_IDS.map((id) => (
            <Chip key={id} label={t(`triggers.${id}`)} selected={triggers.includes(id)} onPress={() => toggle(id)} />
          ))}
        </ChipRow>
      </Card>

      <Card>
        <Field label={t('relapse.whatHappened')} value={note} onChangeText={setNote} multiline placeholder={t('relapse.whatHappenedPlaceholder')} />
        <Field label={t('relapse.nextTime')} value={plan} onChangeText={setPlan} multiline placeholder={t('relapse.nextTimePlaceholder')} />
      </Card>

      <Button title={t('relapse.save')} onPress={save} />
      <Button title={t('common.cancel')} variant="ghost" onPress={() => router.back()} />
    </Screen>
  );
}
