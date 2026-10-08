import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { affirmationOfTheDay, Inspiration } from '../../components/Inspiration';
import {
  Body,
  Button,
  Card,
  GradientCard,
  H1,
  H2,
  IconBadge,
  Muted,
  ProgressBar,
  Screen,
  useFont,
} from '../../components/ui';
import { useFeed } from '../../content/feed';
import { habitsFor, MOODS } from '../../content/wellness';
import { useBilling } from '../../lib/billing';
import { dayKey, dayOfYear, daysIn, nextMilestone, splitDuration, useNow } from '../../lib/date';
import { bestStreakMs, currentStreakMs, useStore } from '../../lib/store';
import { useTheme } from '../../theme';

export default function Today() {
  const t = useTheme();
  const font = useFont();
  const { t: tr, i18n } = useTranslation();
  const now = useNow();
  const { data, actions } = useStore();
  const billing = useBilling();
  const { facts } = useFeed();

  const streak = currentStreakMs(data, now);
  const { days, hours, minutes } = splitDuration(streak);
  const { prev, next } = nextMilestone(days);
  const goalReached = days >= data.profile.goalDays;

  const today = dayKey(new Date(now));
  const todaysCheckIn = data.checkins.find((c) => dayKey(new Date(c.date)) === today);
  const habits = habitsFor(data.profile.faith);
  const doneHabits = data.habits[today] ?? [];
  const doneCount = habits.filter((h) => doneHabits.includes(h.id)).length;
  const protectionOn = data.protection.dnsFilter || data.protection.mindfulPause;

  const hour = new Date(now).getHours();
  const part = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
  const greeting = data.profile.name
    ? tr(`today.greeting.${part}Name`, { name: data.profile.name })
    : tr(`today.greeting.${part}`);

  const fact = facts[dayOfYear(new Date(now)) % facts.length];
  const factTitle = fact?.i18n?.[i18n.language]?.title ?? fact?.title ?? tr(`facts.items.${fact?.id}.title`);

  return (
    <Screen tabs>
      <View style={{ gap: 2 }}>
        <H1>{greeting}</H1>
        <Muted>{new Date(now).toLocaleDateString(i18n.language, { weekday: 'long', month: 'long', day: 'numeric' })}</Muted>
      </View>

      <GradientCard style={{ alignItems: 'center', gap: 2, paddingVertical: 26 }}>
        <Text style={[styles.bigNumber, font('heavy')]} adjustsFontSizeToFit numberOfLines={1}>
          {days}
        </Text>
        <Text style={[styles.onGradient, font('bold'), { fontSize: 18 }]}>{tr('today.daysFree', { count: days })}</Text>
        <Text style={[styles.onGradient, { opacity: 0.85 }]}>
          {tr('today.intoDay', { hours, minutes, day: days + 1 })}
        </Text>
        <View style={{ alignSelf: 'stretch', gap: 6, marginTop: 14 }}>
          <ProgressBar value={(days - prev) / (next - prev)} color="#FFFFFF" />
          <Text style={[styles.onGradient, { textAlign: 'center', opacity: 0.9 }]}>
            {tr('today.toMilestone', { count: next - days, milestone: next })}
          </Text>
        </View>
        <View style={styles.stats}>
          <Stat label={tr('today.best')} value={tr('common.days', { count: daysIn(bestStreakMs(data, now)) })} />
          <Stat label={tr('today.urgesBeaten')} value={String(data.urges.length)} />
          <Stat
            label={tr('today.goal')}
            value={goalReached ? tr('today.goalReached') : tr('common.days', { count: data.profile.goalDays })}
          />
        </View>
      </GradientCard>

      <Pressable
        accessibilityRole="button"
        onPress={() => router.push('/sos')}
        style={({ pressed }) => [styles.sos, { backgroundColor: t.danger, opacity: pressed ? 0.88 : 1 }]}
      >
        <Ionicons name="shield-half" size={30} color={t.onDanger} />
        <View style={{ flex: 1 }}>
          <Text style={[styles.sosTitle, font('heavy'), { color: t.onDanger }]}>{tr('panic.button')}</Text>
          <Text style={[{ color: t.onDanger, opacity: 0.92 }, font('regular')]}>{tr('panic.subtitle')}</Text>
        </View>
        <Ionicons name="chevron-forward" size={22} color={t.onDanger} />
      </Pressable>

      {billing.available && !billing.premium && (
        <Pressable onPress={() => router.push('/paywall')} accessibilityRole="button">
          <Card variant="gold" style={{ flexDirection: 'row', alignItems: 'center' }}>
            <IconBadge icon="gift-outline" color={t.gold} bg={t.card} />
            <View style={{ flex: 1, gap: 2 }}>
              <H2>{tr('paywall.bannerTitle')}</H2>
              <Muted>{tr('paywall.bannerBody')}</Muted>
            </View>
          </Card>
        </Pressable>
      )}

      <Pressable onPress={() => router.push('/protection')} accessibilityRole="button">
        <Card style={{ flexDirection: 'row', alignItems: 'center' }} variant={protectionOn ? 'plain' : 'danger'}>
          <IconBadge
            icon={protectionOn ? 'shield-checkmark' : 'shield-outline'}
            color={protectionOn ? t.primary : t.danger}
            bg={protectionOn ? t.accent : t.card}
          />
          <View style={{ flex: 1, gap: 2 }}>
            <H2>{protectionOn ? tr('today.protectionOn') : tr('today.protectionOff')}</H2>
            <Muted>{protectionOn ? tr('today.protectionOnBody') : tr('today.protectionOffBody')}</Muted>
          </View>
          <Ionicons name="chevron-forward" size={18} color={t.muted} />
        </Card>
      </Pressable>

      <Card>
        <H2>{tr('today.checkInTitle')}</H2>
        {todaysCheckIn ? (
          <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
            <Ionicons name={MOODS[todaysCheckIn.mood - 1].icon} size={24} color={t.primary} />
            <Body style={{ flex: 1 }}>
              {tr('today.checkInDone', {
                mood: tr(`moods.${todaysCheckIn.mood}`).toLowerCase(),
                urge: todaysCheckIn.urge,
              })}
            </Body>
          </View>
        ) : (
          <>
            <Muted>{tr('today.checkInPrompt')}</Muted>
            <Button title={tr('today.checkInButton')} icon="create-outline" onPress={() => router.push('/checkin')} />
          </>
        )}
      </Card>

      <Inspiration faith={data.profile.faith} />

      {fact && (
        <Pressable onPress={() => router.push('/facts')} accessibilityRole="button">
          <Card>
            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
              <Ionicons name="flask-outline" size={18} color={t.gold} />
              <Muted style={{ color: t.gold }}>{tr('today.factOfDay')}</Muted>
            </View>
            <Body style={font('semibold')}>{factTitle}</Body>
            <Muted>{tr('today.moreFacts')}</Muted>
          </Card>
        </Pressable>
      )}

      <Card>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
          <H2 style={{ flex: 1 }}>{tr('today.habitsTitle')}</H2>
          <Muted>
            {doneCount}/{habits.length}
          </Muted>
        </View>
        <ProgressBar value={doneCount / habits.length} />
        {habits.map((h) => {
          const done = doneHabits.includes(h.id);
          return (
            <Pressable
              key={h.id}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: done }}
              onPress={() => actions.toggleHabit(h.id, today)}
              style={styles.habit}
            >
              <Ionicons name={done ? 'checkmark-circle' : 'ellipse-outline'} size={26} color={done ? t.primary : t.border} />
              <Ionicons name={h.icon} size={18} color={t.muted} />
              <Body style={[{ flex: 1 }, done && { color: t.muted, textDecorationLine: 'line-through' }]}>
                {tr(`habits.${h.id}`)}
              </Body>
            </Pressable>
          );
        })}
      </Card>

      <Muted center style={{ fontStyle: 'italic' }}>
        {affirmationOfTheDay(tr('affirmations', { returnObjects: true }) as string[], new Date(now + 86400000))}
      </Muted>

      <Button title={tr('today.slipped')} variant="ghost" onPress={() => router.push('/relapse')} />
    </Screen>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  const font = useFont();
  return (
    <View style={{ alignItems: 'center', flex: 1, paddingHorizontal: 2 }}>
      <Text style={[styles.onGradient, font('heavy'), { fontSize: 16 }]} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text style={[styles.onGradient, { opacity: 0.85, fontSize: 12, textAlign: 'center' }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bigNumber: { fontSize: 76, lineHeight: 86, color: '#FFFFFF' },
  onGradient: { color: '#FFFFFF', fontSize: 14 },
  stats: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    marginTop: 18,
    paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.4)',
  },
  sos: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 18, borderRadius: 20 },
  sosTitle: { fontSize: 18 },
  habit: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 7 },
});
