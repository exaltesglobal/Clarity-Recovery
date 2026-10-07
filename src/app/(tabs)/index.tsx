import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Inspiration } from '../../components/Inspiration';
import { Body, Button, Card, H1, H2, Muted, ProgressBar, Screen } from '../../components/ui';
import { MOODS } from '../../content/triggers';
import { habitsFor } from '../../content/wellness';
import { dayKey, formatDays, nextMilestone, splitDuration, useNow } from '../../lib/date';
import { bestStreakMs, currentStreakMs, useStore } from '../../lib/store';
import { useTheme } from '../../theme';

function greeting(name: string) {
  const hour = new Date().getHours();
  const part = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  return name ? `${part}, ${name}` : part;
}

export default function Today() {
  const t = useTheme();
  const now = useNow();
  const { data, actions } = useStore();

  const streak = currentStreakMs(data, now);
  const { days, hours, minutes } = splitDuration(streak);
  const { prev, next } = nextMilestone(days);
  const goalReached = days >= data.profile.goalDays;

  const today = dayKey(new Date(now));
  const todaysCheckIn = data.checkins.find((c) => dayKey(new Date(c.date)) === today);
  const habits = habitsFor(data.profile.faith);
  const doneHabits = data.habits[today] ?? [];
  const doneCount = habits.filter((h) => doneHabits.includes(h.id)).length;

  return (
    <Screen>
      <H1>{greeting(data.profile.name)}</H1>

      <Card style={{ alignItems: 'center', gap: 4, paddingVertical: 24 }}>
        <Text style={[styles.bigNumber, { color: t.primary }]}>{days}</Text>
        <Body style={{ fontWeight: '600' }}>{days === 1 ? 'day free' : 'days free'}</Body>
        <Muted>
          {hours}h {minutes}m into day {days + 1}
        </Muted>
        <View style={{ alignSelf: 'stretch', gap: 6, marginTop: 12 }}>
          <ProgressBar value={(days - prev) / (next - prev)} />
          <Muted style={{ textAlign: 'center' }}>
            {next - days} {next - days === 1 ? 'day' : 'days'} to your {next}-day milestone
          </Muted>
        </View>
        <View style={styles.stats}>
          <Stat label="Best streak" value={formatDays(bestStreakMs(data, now))} />
          <Stat label="Urges beaten" value={String(data.urges.length)} />
          <Stat label="Goal" value={goalReached ? 'Reached!' : `${data.profile.goalDays} days`} />
        </View>
      </Card>

      <Pressable
        accessibilityRole="button"
        onPress={() => router.push('/sos')}
        style={({ pressed }) => [styles.sos, { backgroundColor: t.danger, opacity: pressed ? 0.85 : 1 }]}
      >
        <Ionicons name="shield-half-outline" size={28} color={t.onDanger} />
        <View style={{ flex: 1 }}>
          <Text style={[styles.sosTitle, { color: t.onDanger }]}>I’m having an urge</Text>
          <Text style={{ color: t.onDanger, opacity: 0.9 }}>Get help riding it out right now</Text>
        </View>
        <Ionicons name="chevron-forward" size={22} color={t.onDanger} />
      </Pressable>

      <Card>
        <H2>Daily check-in</H2>
        {todaysCheckIn ? (
          <Body>
            Done for today — feeling {MOODS[todaysCheckIn.mood - 1].label.toLowerCase()}, urge level{' '}
            {todaysCheckIn.urge}/10. Nice work showing up.
          </Body>
        ) : (
          <>
            <Muted>Two minutes to notice your mood, urges and triggers.</Muted>
            <Button title="Check in" icon="create-outline" onPress={() => router.push('/checkin')} />
          </>
        )}
      </Card>

      <Inspiration faith={data.profile.faith} />

      <Card>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <H2>Healthy habits</H2>
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
              <Ionicons
                name={done ? 'checkmark-circle' : 'ellipse-outline'}
                size={24}
                color={done ? t.primary : t.muted}
              />
              <Ionicons name={h.icon} size={18} color={t.muted} />
              <Body style={[{ flex: 1 }, done && { color: t.muted, textDecorationLine: 'line-through' }]}>
                {h.label}
              </Body>
            </Pressable>
          );
        })}
      </Card>

      <Button title="I slipped — log a relapse" variant="ghost" onPress={() => router.push('/relapse')} />
    </Screen>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ alignItems: 'center', flex: 1 }}>
      <Body style={{ fontWeight: '700' }}>{value}</Body>
      <Muted>{label}</Muted>
    </View>
  );
}

const styles = StyleSheet.create({
  bigNumber: { fontSize: 72, fontWeight: '800', lineHeight: 80 },
  stats: { flexDirection: 'row', alignSelf: 'stretch', marginTop: 16 },
  sos: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 18, borderRadius: 16 },
  sosTitle: { fontSize: 18, fontWeight: '700' },
  habit: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
});
