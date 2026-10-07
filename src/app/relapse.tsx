import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Body, Button, Card, Chip, ChipRow, Field, H2, Muted, Screen } from '../components/ui';
import { RELAPSE_MESSAGE } from '../content/affirmations';
import { TRIGGERS } from '../content/triggers';
import { GRACE_VERSES } from '../content/verses';
import { formatDays } from '../lib/date';
import { currentStreakMs, useStore } from '../lib/store';
import { useTheme } from '../theme';

export default function RelapseScreen() {
  const t = useTheme();
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
        <H2>Thank you for being honest.</H2>
        <Body>{RELAPSE_MESSAGE}</Body>
        <Card style={{ backgroundColor: t.accent, borderColor: t.accent }}>
          <Body>
            You stayed strong for {formatDays(endedStreak)}. That counts. Your new streak starts now.
          </Body>
        </Card>
        {data.profile.faith && (
          <Card>
            <Body style={{ fontStyle: 'italic' }}>“{verse.text}”</Body>
            <Muted>— {verse.ref} (KJV)</Muted>
          </Card>
        )}
        {plan.trim() !== '' && (
          <Card>
            <Muted>Your plan for next time</Muted>
            <Body>{plan.trim()}</Body>
          </Card>
        )}
        <Button title="Begin again" icon="refresh" onPress={() => router.back()} />
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={{ gap: 6 }}>
        <H2>It’s okay. Let’s learn from it.</H2>
        <Muted>
          Logging a slip resets your streak, but your history and best streak are kept. No judgement here —
          honesty is how patterns get broken.
        </Muted>
      </View>

      <Card>
        <H2>What triggered it?</H2>
        <ChipRow>
          {TRIGGERS.map((tr) => (
            <Chip key={tr} label={tr} selected={triggers.includes(tr)} onPress={() => toggle(tr)} />
          ))}
        </ChipRow>
      </Card>

      <Card>
        <Field
          label="What happened? (time, place, how you felt)"
          value={note}
          onChangeText={setNote}
          multiline
          placeholder="e.g. Couldn't sleep, was scrolling in bed after midnight…"
        />
        <Field
          label="What will you do differently next time?"
          value={plan}
          onChangeText={setPlan}
          multiline
          placeholder="e.g. Charge my phone outside the bedroom"
        />
      </Card>

      <Button title="Log and start again" onPress={save} />
      <Button title="Cancel" variant="ghost" onPress={() => router.back()} />
    </Screen>
  );
}
