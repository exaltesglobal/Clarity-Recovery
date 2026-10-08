import Ionicons from '@expo/vector-icons/Ionicons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { BreathingCircle } from '../../components/BreathingCircle';
import { Body, Button, Card, H1, H2, Muted, ProgressBar, Screen, useFont } from '../../components/ui';
import { Session, SESSIONS, sessionDuration } from '../../content/wellness';
import { formatClock } from '../../lib/date';
import { success, tap } from '../../lib/haptics';
import { useStore } from '../../lib/store';
import { useTheme } from '../../theme';

/** Finds the step that contains `elapsed` seconds and when that step ends. */
function locate(session: Session, elapsed: number) {
  let end = 0;
  for (let i = 0; i < session.steps.length; i++) {
    end += session.steps[i];
    if (elapsed < end) return { stepIndex: i, stepEnd: end };
  }
  return { stepIndex: session.steps.length - 1, stepEnd: end };
}

export default function SessionScreen() {
  const t = useTheme();
  const font = useFont();
  const { t: tr } = useTranslation();
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
        <Body>{tr('session.notFound')}</Body>
      </Screen>
    );
  }

  const steps = tr(`sessions.${session.id}.steps`, { returnObjects: true }) as { title: string; text: string }[];
  const step = steps[stepIndex] ?? { title: '', text: '' };

  return (
    <Screen>
      <Stack.Screen options={{ title: tr(`sessions.${session.id}.title`) }} />

      {finished ? (
        <Card style={{ alignItems: 'center', gap: 12, paddingVertical: 28 }}>
          <Ionicons name="checkmark-circle" size={60} color={t.primary} />
          <H1 center>{tr('session.doneTitle')}</H1>
          <Body center>{tr('session.doneBody')}</Body>
          <Button title={tr('common.done')} onPress={() => router.back()} style={{ alignSelf: 'stretch' }} />
        </Card>
      ) : (
        <>
          <Muted>{tr('session.step', { current: stepIndex + 1, total: session.steps.length })}</Muted>
          <ProgressBar value={elapsed / total} />

          <Card style={{ alignItems: 'center', gap: 14, paddingVertical: 24 }}>
            {session.breathing && <BreathingCircle size={170} paused={!running} />}
            <H2 center>{step.title}</H2>
            <Body center>{step.text}</Body>
            <Text style={[styles.clock, font('heavy'), { color: t.primary }]}>{formatClock(stepEnd - elapsed)}</Text>
          </Card>

          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Button
              style={{ flex: 1 }}
              title={running ? tr('session.pause') : elapsed === 0 ? tr('session.start') : tr('session.resume')}
              icon={running ? 'pause' : 'play'}
              onPress={() => setRunning(!running)}
            />
            <Button title={tr('session.skip')} variant="secondary" icon="play-skip-forward" onPress={() => setElapsed(stepEnd)} />
          </View>

          {stepIndex + 1 < steps.length && <Muted>{tr('session.upNext', { title: steps[stepIndex + 1].title })}</Muted>}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  clock: { fontSize: 46, fontVariant: ['tabular-nums'] },
});
