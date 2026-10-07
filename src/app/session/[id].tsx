import Ionicons from '@expo/vector-icons/Ionicons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { BreathingCircle } from '../../components/BreathingCircle';
import { Body, Button, Card, H1, H2, Muted, ProgressBar, Screen } from '../../components/ui';
import { Session, SESSIONS, sessionDuration } from '../../content/wellness';
import { formatClock } from '../../lib/date';
import { success, tap } from '../../lib/haptics';
import { useStore } from '../../lib/store';
import { useTheme } from '../../theme';

/** Finds the step that contains `elapsed` seconds and when that step ends. */
function locate(session: Session, elapsed: number) {
  let end = 0;
  for (let i = 0; i < session.steps.length; i++) {
    end += session.steps[i].seconds;
    if (elapsed < end) return { stepIndex: i, stepEnd: end };
  }
  return { stepIndex: session.steps.length - 1, stepEnd: end };
}

export default function SessionScreen() {
  const t = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { actions } = useStore();
  const session = SESSIONS.find((s) => s.id === id);

  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);

  const total = session ? sessionDuration(session) : 0;
  const finished = session !== undefined && elapsed >= total;
  const { stepIndex, stepEnd } = session ? locate(session, elapsed) : { stepIndex: 0, stepEnd: 0 };

  useEffect(() => {
    if (!running || finished) return;
    const timer = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(timer);
  }, [running, finished]);

  useEffect(() => {
    if (stepIndex > 0) tap();
  }, [stepIndex]);

  useEffect(() => {
    if (!finished || !session) return;
    actions.completeHabit(session.habit);
    success();
  }, [finished, session, actions]);

  if (!session) {
    return (
      <Screen>
        <Body>Session not found.</Body>
      </Screen>
    );
  }

  const step = session.steps[stepIndex];

  return (
    <Screen>
      <Stack.Screen options={{ title: session.title }} />

      {finished ? (
        <Card style={{ alignItems: 'center', gap: 12, paddingVertical: 28 }}>
          <Ionicons name="checkmark-circle" size={56} color={t.primary} />
          <H1>Well done</H1>
          <Body style={{ textAlign: 'center' }}>
            You invested time in yourself today. That’s how new habits are built.
          </Body>
          <Button title="Done" onPress={() => router.back()} style={{ alignSelf: 'stretch' }} />
        </Card>
      ) : (
        <>
          <Muted>
            Step {stepIndex + 1} of {session.steps.length}
          </Muted>
          <ProgressBar value={elapsed / total} />

          <Card style={{ alignItems: 'center', gap: 14, paddingVertical: 24 }}>
            {session.breathing && <BreathingCircle size={170} paused={!running} />}
            <H2 style={{ textAlign: 'center' }}>{step.title}</H2>
            <Body style={{ textAlign: 'center' }}>{step.instruction}</Body>
            <Text style={[styles.clock, { color: t.primary }]}>{formatClock(stepEnd - elapsed)}</Text>
          </Card>

          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Button
              style={{ flex: 1 }}
              title={running ? 'Pause' : elapsed === 0 ? 'Start' : 'Resume'}
              icon={running ? 'pause' : 'play'}
              onPress={() => setRunning(!running)}
            />
            <Button
              title="Skip"
              variant="secondary"
              icon="play-skip-forward"
              onPress={() => setElapsed(stepEnd)}
            />
          </View>

          {stepIndex + 1 < session.steps.length && (
            <Muted>Up next: {session.steps[stepIndex + 1].title}</Muted>
          )}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  clock: { fontSize: 44, fontWeight: '700', fontVariant: ['tabular-nums'] },
});
