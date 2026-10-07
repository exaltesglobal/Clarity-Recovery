import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Alert, Platform, Pressable, View } from 'react-native';

import { Body, Button, Card, ChipRow, H2, Muted, Screen } from '../../components/ui';
import { MOODS } from '../../content/triggers';
import { DAY, formatDateTime, formatDays, useNow } from '../../lib/date';
import { useStore } from '../../lib/store';
import type { CheckIn, Relapse } from '../../lib/types';
import { useTheme } from '../../theme';

type Entry = { kind: 'checkin'; item: CheckIn } | { kind: 'relapse'; item: Relapse };

function confirm(title: string, onConfirm: () => void) {
  if (Platform.OS === 'web') {
    if (globalThis.confirm?.(title)) onConfirm();
    return;
  }
  Alert.alert(title, undefined, [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Delete', style: 'destructive', onPress: onConfirm },
  ]);
}

export default function Journal() {
  const t = useTheme();
  const { data, actions } = useStore();

  const weekAgo = useNow() - 7 * DAY;
  const recent = data.checkins.filter((c) => new Date(c.date).getTime() >= weekAgo);
  const avgMood = recent.length ? recent.reduce((s, c) => s + c.mood, 0) / recent.length : null;
  const avgUrge = recent.length ? recent.reduce((s, c) => s + c.urge, 0) / recent.length : null;

  const triggerCounts = new Map<string, number>();
  for (const { triggers } of [...data.checkins, ...data.relapses]) {
    for (const tr of triggers) triggerCounts.set(tr, (triggerCounts.get(tr) ?? 0) + 1);
  }
  const topTriggers = [...triggerCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);

  const entries: Entry[] = [
    ...data.checkins.map((item) => ({ kind: 'checkin' as const, item })),
    ...data.relapses.map((item) => ({ kind: 'relapse' as const, item })),
  ].sort((a, b) => b.item.date.localeCompare(a.item.date));

  return (
    <Screen>
      <Button title="New check-in" icon="create-outline" onPress={() => router.push('/checkin')} />

      <Card>
        <H2>Last 7 days</H2>
        <View style={{ flexDirection: 'row' }}>
          <Insight label="Avg mood" value={avgMood ? MOODS[Math.round(avgMood) - 1].label : '—'} />
          <Insight label="Avg urge" value={avgUrge !== null ? `${avgUrge.toFixed(1)}/10` : '—'} />
          <Insight label="Check-ins" value={String(recent.length)} />
        </View>
        {topTriggers.length > 0 && (
          <>
            <Muted>Your most common triggers</Muted>
            <ChipRow>
              {topTriggers.map(([tr, n]) => (
                <View key={tr} style={{ backgroundColor: t.dangerSoft, borderRadius: 999, paddingVertical: 6, paddingHorizontal: 12 }}>
                  <Body style={{ color: t.danger, fontSize: 14 }}>
                    {tr} · {n}
                  </Body>
                </View>
              ))}
            </ChipRow>
            <Muted>Plan ahead for these moments — they’re when you’re most vulnerable.</Muted>
          </>
        )}
      </Card>

      {entries.length === 0 && (
        <Muted style={{ textAlign: 'center' }}>Your check-ins and reflections will appear here.</Muted>
      )}

      {entries.map((e) => (
        <Pressable
          key={`${e.kind}-${e.item.id}`}
          onLongPress={() =>
            confirm('Delete this entry?', () =>
              e.kind === 'checkin' ? actions.deleteCheckIn(e.item.id) : actions.deleteRelapse(e.item.id),
            )
          }
        >
          {e.kind === 'checkin' ? <CheckInCard c={e.item} /> : <RelapseCard r={e.item} />}
        </Pressable>
      ))}
      {entries.length > 0 && <Muted style={{ textAlign: 'center' }}>Long-press an entry to delete it.</Muted>}
    </Screen>
  );
}

function Insight({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <Body style={{ fontWeight: '700' }}>{value}</Body>
      <Muted>{label}</Muted>
    </View>
  );
}

function CheckInCard({ c }: { c: CheckIn }) {
  const t = useTheme();
  const mood = MOODS[c.mood - 1];
  return (
    <Card>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Ionicons name={mood.icon} size={20} color={t.primary} />
        <Body style={{ fontWeight: '600', flex: 1 }}>
          {mood.label} · urge {c.urge}/10
        </Body>
        <Muted>{formatDateTime(c.date)}</Muted>
      </View>
      {c.triggers.length > 0 && <Muted>Triggers: {c.triggers.join(', ')}</Muted>}
      {c.note !== '' && <Body>{c.note}</Body>}
      {c.gratitude !== '' && <Muted>Grateful for: {c.gratitude}</Muted>}
    </Card>
  );
}

function RelapseCard({ r }: { r: Relapse }) {
  const t = useTheme();
  return (
    <Card style={{ borderColor: t.danger }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Ionicons name="refresh-circle-outline" size={20} color={t.danger} />
        <Body style={{ fontWeight: '600', flex: 1 }}>Slip after {formatDays(r.streakMs)}</Body>
        <Muted>{formatDateTime(r.date)}</Muted>
      </View>
      {r.triggers.length > 0 && <Muted>Triggers: {r.triggers.join(', ')}</Muted>}
      {r.note !== '' && <Body>{r.note}</Body>}
      {r.plan !== '' && <Muted>Next time: {r.plan}</Muted>}
    </Card>
  );
}
