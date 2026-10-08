import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { HealthSummary } from '../../components/HealthSummary';
import { Body, Card, Chip, ChipRow, H2, Muted, Screen } from '../../components/ui';
import { useFeed } from '../../content/feed';
import { type Category, SESSIONS, sessionDuration } from '../../content/wellness';
import { useBilling } from '../../lib/billing';
import { dayKey } from '../../lib/date';
import { useStore } from '../../lib/store';
import { useTheme } from '../../theme';

type Tab = Category | 'diet' | 'sleep' | 'facts';
const TABS: Tab[] = ['meditation', 'yoga', 'exercise', 'diet', 'sleep', 'facts'];

export default function Wellness() {
  const t = useTheme();
  const { t: tr, i18n } = useTranslation();
  const { data } = useStore();
  const { premium } = useBilling();
  const { facts } = useFeed();
  const [tab, setTab] = useState<Tab>('meditation');
  const [open, setOpen] = useState<number | null>(0);
  const doneToday = data.habits[dayKey()] ?? [];

  const sessions = SESSIONS.filter((s) => s.category === tab && (data.profile.faith || !s.faith));
  const tips =
    tab === 'diet' || tab === 'sleep'
      ? (tr(tab === 'diet' ? 'dietTips' : 'sleepTips', { returnObjects: true }) as { title: string; body: string }[])
      : [];

  return (
    <Screen tabs>
      <HealthSummary />

      <ChipRow>
        {TABS.map((c) => (
          <Chip
            key={c}
            label={tr(`wellness.tabs.${c}`)}
            selected={tab === c}
            onPress={() => {
              setTab(c);
              setOpen(0);
            }}
          />
        ))}
      </ChipRow>
      <Muted>{tr(`wellness.intro.${tab}`)}</Muted>

      {sessions.map((s, i) => {
        const locked = !premium && i > 0;
        return (
          <Pressable
            key={s.id}
            accessibilityRole="button"
            onPress={() => router.push(locked ? '/paywall' : `/session/${s.id}`)}
          >
            {({ pressed }) => (
              <Card style={{ opacity: pressed ? 0.85 : 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <H2 style={{ flex: 1 }}>{tr(`sessions.${s.id}.title`)}</H2>
                  {locked ? (
                    <Ionicons name="lock-closed" size={18} color={t.gold} />
                  ) : (
                    doneToday.includes(s.habit) && <Ionicons name="checkmark-circle" size={20} color={t.primary} />
                  )}
                </View>
                <Body>{tr(`sessions.${s.id}.summary`)}</Body>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="time-outline" size={16} color={t.muted} />
                  <Muted>{tr('common.minutes', { count: Math.max(1, Math.round(sessionDuration(s) / 60)) })}</Muted>
                  {s.faith && <Muted>· {tr('wellness.faith')}</Muted>}
                </View>
              </Card>
            )}
          </Pressable>
        );
      })}

      {tips.map((tip, i) => {
        const expanded = open === i;
        return (
          <Pressable key={tip.title} onPress={() => setOpen(expanded ? null : i)} accessibilityRole="button" accessibilityState={{ expanded }}>
            <Card>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <H2 style={{ flex: 1 }}>{tip.title}</H2>
                <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color={t.muted} />
              </View>
              {expanded && <Body>{tip.body}</Body>}
            </Card>
          </Pressable>
        );
      })}

      {tab === 'facts' &&
        facts.slice(0, 6).map((f) => {
          const local = f.i18n?.[i18n.language];
          return (
            <Card key={f.id}>
              <H2>{local?.title ?? f.title ?? tr(`facts.items.${f.id}.title`)}</H2>
              <Body>{local?.body ?? f.body ?? tr(`facts.items.${f.id}.body`)}</Body>
              <Muted>{f.source}</Muted>
            </Card>
          );
        })}
      {tab === 'facts' && (
        <Pressable onPress={() => router.push('/facts')} accessibilityRole="button">
          <Muted center style={{ color: t.primary }}>
            {tr('wellness.allFacts')}
          </Muted>
        </Pressable>
      )}

      {(tab === 'exercise' || tab === 'yoga' || tab === 'diet' || tab === 'sleep') && (
        <Muted center>{tr('wellness.disclaimer')}</Muted>
      )}
    </Screen>
  );
}
