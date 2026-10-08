import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Button, Card, Chip, ChipRow, Field, H2, Muted, Screen, useFont } from '../components/ui';
import { MOODS, TRIGGER_IDS } from '../content/wellness';
import { success, tap } from '../lib/haptics';
import { useStore } from '../lib/store';
import type { Mood } from '../lib/types';
import { useTheme } from '../theme';

export default function CheckInScreen() {
  const t = useTheme();
  const font = useFont();
  const { t: tr } = useTranslation();
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
        <H2>{tr('checkin.moodQuestion')}</H2>
        <View style={styles.moods}>
          {MOODS.map((m) => {
            const selected = mood === m.value;
            return (
              <Pressable
                key={m.value}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                accessibilityLabel={tr(`moods.${m.value}`)}
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
                <Text
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  style={[{ color: selected ? t.primary : t.muted, fontSize: 12 }, font('semibold')]}
                >
                  {tr(`moods.${m.value}`)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Card>

      <Card>
        <H2>{tr('checkin.urgeQuestion')}</H2>
        <Muted>{tr('checkin.urgeScale')}</Muted>
        <ChipRow>
          {Array.from({ length: 11 }, (_, i) => (
            <Chip key={i} label={String(i)} selected={urge === i} onPress={() => setUrge(i)} />
          ))}
        </ChipRow>
      </Card>

      <Card>
        <H2>{tr('checkin.triggersQuestion')}</H2>
        <ChipRow>
          {TRIGGER_IDS.map((id) => (
            <Chip key={id} label={tr(`triggers.${id}`)} selected={triggers.includes(id)} onPress={() => toggle(id)} />
          ))}
        </ChipRow>
      </Card>

      <Card>
        <Field label={tr('checkin.journal')} value={note} onChangeText={setNote} multiline placeholder={tr('checkin.journalPlaceholder')} />
        <Field
          label={tr('checkin.gratitude')}
          value={gratitude}
          onChangeText={setGratitude}
          placeholder={tr('common.optional')}
        />
      </Card>

      <Button title={tr('checkin.save')} onPress={save} disabled={mood === null || urge === null} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  moods: { flexDirection: 'row', gap: 6 },
  mood: { flex: 1, alignItems: 'center', gap: 4, paddingVertical: 10, paddingHorizontal: 2, borderRadius: 14, borderWidth: 1 },
});
