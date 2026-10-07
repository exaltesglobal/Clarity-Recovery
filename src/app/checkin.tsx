import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Button, Card, Chip, ChipRow, Field, H2, Muted, Screen } from '../components/ui';
import { MOODS, TRIGGERS } from '../content/triggers';
import { success, tap } from '../lib/haptics';
import { useStore } from '../lib/store';
import type { Mood } from '../lib/types';
import { useTheme } from '../theme';

export default function CheckInScreen() {
  const t = useTheme();
  const { actions } = useStore();
  const [mood, setMood] = useState<Mood | null>(null);
  const [urge, setUrge] = useState<number | null>(null);
  const [triggers, setTriggers] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const [gratitude, setGratitude] = useState('');

  const toggle = (trigger: string) =>
    setTriggers((ts) => (ts.includes(trigger) ? ts.filter((x) => x !== trigger) : [...ts, trigger]));

  const save = () => {
    if (mood === null || urge === null) return;
    actions.addCheckIn({ mood, urge, triggers, note: note.trim(), gratitude: gratitude.trim() });
    success();
    router.back();
  };

  return (
    <Screen>
      <Card>
        <H2>How are you feeling?</H2>
        <View style={styles.moods}>
          {MOODS.map((m) => {
            const selected = mood === m.value;
            return (
              <Pressable
                key={m.value}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => {
                  tap();
                  setMood(m.value);
                }}
                style={[
                  styles.mood,
                  { borderColor: selected ? t.primary : t.border, backgroundColor: selected ? t.accent : t.card },
                ]}
              >
                <Ionicons name={m.icon} size={26} color={selected ? t.primary : t.muted} />
                <Text style={{ color: selected ? t.primary : t.muted, fontSize: 12 }}>{m.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </Card>

      <Card>
        <H2>How strong were urges today?</H2>
        <Muted>0 = none, 10 = overwhelming</Muted>
        <ChipRow>
          {Array.from({ length: 11 }, (_, i) => (
            <Chip key={i} label={String(i)} selected={urge === i} onPress={() => setUrge(i)} />
          ))}
        </ChipRow>
      </Card>

      <Card>
        <H2>Any triggers?</H2>
        <ChipRow>
          {TRIGGERS.map((tr) => (
            <Chip key={tr} label={tr} selected={triggers.includes(tr)} onPress={() => toggle(tr)} />
          ))}
        </ChipRow>
      </Card>

      <Card>
        <Field
          label="Journal"
          value={note}
          onChangeText={setNote}
          multiline
          placeholder="What happened today? What helped? What was hard?"
        />
        <Field
          label="One thing I'm grateful for"
          value={gratitude}
          onChangeText={setGratitude}
          placeholder="Optional"
        />
      </Card>

      <Button title="Save check-in" onPress={save} disabled={mood === null || urge === null} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  moods: { flexDirection: 'row', gap: 8 },
  mood: { flex: 1, alignItems: 'center', gap: 4, paddingVertical: 10, borderRadius: 12, borderWidth: 1 },
});
