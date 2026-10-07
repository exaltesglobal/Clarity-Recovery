import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { Body, Card, Chip, ChipRow, H2, Muted, Screen } from '../../components/ui';
import {
  Category,
  CATEGORY_LABELS,
  DIET_TIPS,
  SESSIONS,
  sessionDuration,
} from '../../content/wellness';
import { dayKey } from '../../lib/date';
import { useStore } from '../../lib/store';
import { useTheme } from '../../theme';

type Tab = Category | 'diet';
const TABS: Tab[] = ['meditation', 'yoga', 'exercise', 'diet'];

const INTROS: Record<Tab, string> = {
  meditation: 'Train your attention so urges lose their grip.',
  yoga: 'Release tension and reconnect with your body.',
  exercise: 'Burn off restless energy and boost natural dopamine.',
  diet: 'Steady energy and good sleep make urges easier to handle.',
};

export default function Wellness() {
  const t = useTheme();
  const { data } = useStore();
  const [tab, setTab] = useState<Tab>('meditation');
  const [openTip, setOpenTip] = useState<string | null>(DIET_TIPS[0].title);
  const doneToday = data.habits[dayKey()] ?? [];

  const sessions = SESSIONS.filter((s) => s.category === tab && (data.profile.faith || !s.faith));

  return (
    <Screen>
      <ChipRow>
        {TABS.map((c) => (
          <Chip key={c} label={CATEGORY_LABELS[c]} selected={tab === c} onPress={() => setTab(c)} />
        ))}
      </ChipRow>
      <Muted>{INTROS[tab]}</Muted>

      {sessions.map((s) => (
        <Pressable key={s.id} onPress={() => router.push(`/session/${s.id}`)}>
          {({ pressed }) => (
            <Card style={{ opacity: pressed ? 0.8 : 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <H2 style={{ flex: 1 }}>{s.title}</H2>
                {doneToday.includes(s.habit) && <Ionicons name="checkmark-circle" size={20} color={t.primary} />}
              </View>
              <Body>{s.summary}</Body>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="time-outline" size={16} color={t.muted} />
                <Muted>{Math.round(sessionDuration(s) / 60)} min</Muted>
                {s.faith && <Muted>· Faith</Muted>}
              </View>
            </Card>
          )}
        </Pressable>
      ))}

      {tab === 'diet' &&
        DIET_TIPS.map((tip) => {
          const open = openTip === tip.title;
          return (
            <Pressable key={tip.title} onPress={() => setOpenTip(open ? null : tip.title)}>
              <Card>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <H2 style={{ flex: 1 }}>{tip.title}</H2>
                  <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color={t.muted} />
                </View>
                {open && <Body>{tip.body}</Body>}
              </Card>
            </Pressable>
          );
        })}

      {(tab === 'exercise' || tab === 'yoga' || tab === 'diet') && (
        <Muted style={{ textAlign: 'center' }}>
          General wellness guidance, not medical advice. Check with a doctor before starting a new exercise or
          diet plan, and skip anything that causes pain.
        </Muted>
      )}
    </Screen>
  );
}
