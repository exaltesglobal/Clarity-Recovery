import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Alert, Platform, Pressable, View } from 'react-native';

import { Body, Button, Card, ChipRow, H2, Muted, Screen, useFont } from '../../components/ui';
import { MOODS } from '../../content/wellness';
import { DAY, daysIn, formatDateTime, useNow } from '../../lib/date';
import { useStore } from '../../lib/store';
import type { CheckIn, Relapse } from '../../lib/types';
import { useTheme } from '../../theme';

type Entry = { kind: 'checkin'; item: CheckIn } | { kind: 'relapse'; item: Relapse };

function confirmDelete(title: string, labels: { cancel: string; delete: string }, onConfirm: () => void) {
  if (Platform.OS === 'web') {
    if (globalThis.confirm?.(title)) onConfirm();
    return;
  }
  Alert.alert(title, undefined, [
    { text: labels.cancel, style: 'cancel' },
    { text: labels.delete, style: 'destructive', onPress: onConfirm },
  ]);
}

export default function Journal() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const { data, actions } = useStore();
  const triggerLabel = (id: string) => tr(`triggers.${id}`, { defaultValue: id });

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
    <Screen tabs>
      <Button title={tr('journal.newCheckIn')} icon="create-outline" onPress={() => router.push('/checkin')} />

      <Card>
        <H2>{tr('journal.last7')}</H2>
        <View style={{ flexDirection: 'row' }}>
          <Insight label={tr('journal.avgMood')} value={avgMood ? tr(`moods.${Math.round(avgMood)}`) : '—'} />
          <Insight label={tr('journal.avgUrge')} value={avgUrge !== null ? `${avgUrge.toFixed(1)}/10` : '—'} />
          <Insight label={tr('journal.checkIns')} value={String(recent.length)} />
        </View>
        {topTriggers.length > 0 && (
          <>
            <Muted>{tr('journal.topTriggers')}</Muted>
            <ChipRow>
              {topTriggers.map(([id, n]) => (
                <View key={id} style={{ backgroundColor: t.dangerSoft, borderRadius: 999, paddingVertical: 6, paddingHorizontal: 12 }}>
                  <Body style={{ color: t.danger, fontSize: 14 }}>
                    {triggerLabel(id)} · {n}
                  </Body>
                </View>
              ))}
            </ChipRow>
            <Muted>{tr('journal.planAhead')}</Muted>
          </>
        )}
      </Card>

      {entries.length === 0 && (
        <Card variant="soft" style={{ alignItems: 'center' }}>
          <Ionicons name="book-outline" size={28} color={t.primary} />
          <Muted center>{tr('journal.empty')}</Muted>
        </Card>
      )}

      {entries.map((e) => (
        <Pressable
          key={`${e.kind}-${e.item.id}`}
          accessibilityHint={tr('journal.longPressHint')}
          onLongPress={() =>
            confirmDelete(tr('journal.deleteConfirm'), { cancel: tr('common.cancel'), delete: tr('common.delete') }, () =>
              e.kind === 'checkin' ? actions.deleteCheckIn(e.item.id) : actions.deleteRelapse(e.item.id),
            )
          }
        >
          {e.kind === 'checkin' ? (
            <CheckInCard c={e.item} triggerLabel={triggerLabel} />
          ) : (
            <RelapseCard r={e.item} triggerLabel={triggerLabel} />
          )}
        </Pressable>
      ))}
      {entries.length > 0 && <Muted center>{tr('journal.longPressHint')}</Muted>}
    </Screen>
  );
}

function Insight({ label, value }: { label: string; value: string }) {
  const font = useFont();
  return (
    <View style={{ flex: 1, alignItems: 'center', paddingHorizontal: 2 }}>
      <Body style={font('bold')} numberOfLines={1}>
        {value}
      </Body>
      <Muted center>{label}</Muted>
    </View>
  );
}

function CheckInCard({ c, triggerLabel }: { c: CheckIn; triggerLabel: (id: string) => string }) {
  const t = useTheme();
  const font = useFont();
  const { t: tr, i18n } = useTranslation();
  const mood = MOODS[c.mood - 1];
  return (
    <Card>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <Ionicons name={mood.icon} size={20} color={t.primary} />
        <Body style={[font('semibold'), { flex: 1 }]}>
          {tr(`moods.${c.mood}`)} · {tr('journal.urge', { level: c.urge })}
        </Body>
        <Muted>{formatDateTime(c.date, i18n.language)}</Muted>
      </View>
      {c.triggers.length > 0 && <Muted>{tr('journal.triggers', { list: c.triggers.map(triggerLabel).join(', ') })}</Muted>}
      {c.note !== '' && <Body>{c.note}</Body>}
      {c.gratitude !== '' && <Muted>{tr('journal.gratefulFor', { text: c.gratitude })}</Muted>}
    </Card>
  );
}

function RelapseCard({ r, triggerLabel }: { r: Relapse; triggerLabel: (id: string) => string }) {
  const t = useTheme();
  const font = useFont();
  const { t: tr, i18n } = useTranslation();
  return (
    <Card style={{ borderColor: t.danger }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <Ionicons name="refresh-circle-outline" size={20} color={t.danger} />
        <Body style={[font('semibold'), { flex: 1 }]}>{tr('journal.slipAfter', { count: daysIn(r.streakMs) })}</Body>
        <Muted>{formatDateTime(r.date, i18n.language)}</Muted>
      </View>
      {r.triggers.length > 0 && <Muted>{tr('journal.triggers', { list: r.triggers.map(triggerLabel).join(', ') })}</Muted>}
      {r.note !== '' && <Body>{r.note}</Body>}
      {r.plan !== '' && <Muted>{tr('journal.nextTime', { text: r.plan })}</Muted>}
    </Card>
  );
}
